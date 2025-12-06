from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import PatientProfile, Alert
from .serializers import RegisterSerializer, PatientProfileSerializer, AlertSerializer
import os, json
from django.conf import settings
from joblib import load, dump
import numpy as np
from pymongo import MongoClient
from django.shortcuts import get_object_or_404

def get_mongo():
    uri = settings.MONGO_URI or 'mongodb://localhost:27017'
    client = MongoClient(uri)
    db = client['dawini']
    return db

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message':'user created'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # PatientProfile requires a user, so we create it for the authenticated user
        patient_profile, created = PatientProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'birth_date': request.data.get('birth_date'),
                'phone': request.data.get('phone', ''),
                'role': request.data.get('role', 'patient')
            }
        )
        
        if not created:
            # Update existing profile
            if 'birth_date' in request.data:
                patient_profile.birth_date = request.data['birth_date']
            if 'phone' in request.data:
                patient_profile.phone = request.data['phone']
            if 'role' in request.data:
                patient_profile.role = request.data['role']
            patient_profile.save()
        
        serializer = self.get_serializer(patient_profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        try:
            profile = PatientProfile.objects.get(user=self.request.user)
        except PatientProfile.DoesNotExist:
            return qs.none()
        if profile.role in ['doctor','admin']:
            return qs
        return qs.filter(patient=profile)

    def perform_create(self, serializer):
        profile = PatientProfile.objects.filter(user=self.request.user).first()
        serializer.save(patient=profile)

from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser

class RecordsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser]

    def get(self, request):
        db = get_mongo()
        col = db['medical_records']
        user_profile = PatientProfile.objects.get(user=request.user)
        if user_profile.role == 'doctor' or user_profile.role=='admin':
            docs = list(col.find().sort('recorded_at', -1).limit(100))
        else:
            docs = list(col.find({'patient_username': request.user.username}).sort('recorded_at', -1).limit(100))
        for d in docs:
            d['_id'] = str(d.get('_id'))
        return Response(docs)

    def post(self, request):
        data = request.data
        db = get_mongo()
        col = db['medical_records']
        doc = {
            'patient_username': request.user.username,
            'systolic': float(data.get('systolic',0) or 0),
            'diastolic': float(data.get('diastolic',0) or 0),
            'glucose': float(data.get('glucose',0) or 0),
            'heart_rate': float(data.get('heart_rate',0) or 0),
            'meta': data.get('meta', {}),
            'recorded_at': data.get('recorded_at', None)
        }
        import datetime
        if not doc['recorded_at']:
            doc['recorded_at'] = datetime.datetime.utcnow()
        res = col.insert_one(doc)
        model_path = os.path.join(os.path.dirname(__file__), '..', 'model.joblib')
        try:
            if os.path.exists(model_path):
                model = load(model_path)
                sample = [[doc['systolic'], doc['diastolic'], doc['glucose'], doc['heart_rate']]]
                pred = model.predict(sample)[0]
                if pred == 1:
                    profile = PatientProfile.objects.filter(user__username=doc['patient_username']).first()
                    alert = Alert.objects.create(patient=profile, level='high', message='Anomalie détectée par ML')
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)('alerts', {'type':'alert.message','text': 'Nouvelle alerte: '+alert.message})
        except Exception as e:
            print('ML/push error', e)
        return Response({'inserted_id': str(res.inserted_id)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_view(request):
    model_path = os.path.join(os.path.dirname(__file__), '..', 'model.joblib')
    if not os.path.exists(model_path):
        return Response({'error': 'model not trained'}, status=status.HTTP_400_BAD_REQUEST)

    s = request.data
    required_fields = ['systolic', 'diastolic', 'glucose', 'heart_rate']
    for field in required_fields:
        if field not in s or s[field] is None:
            return Response({'error': f'Missing required field: {field}'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            float(s[field])
        except (ValueError, TypeError):
            return Response({'error': f'Invalid value for {field}: must be a number'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        model = load(model_path)
        scaler_path = os.path.join(os.path.dirname(__file__), '..', 'scaler.joblib')
        scaler = load(scaler_path)
        # Prepare features
        systolic = float(s['systolic'])
        diastolic = float(s['diastolic'])
        glucose = float(s['glucose'])
        heart_rate = float(s['heart_rate'])
        pulse_pressure = systolic - diastolic
        glucose_heart_ratio = glucose / (heart_rate + 1)  # Avoid division by zero
        sample = [[systolic, diastolic, glucose, heart_rate, pulse_pressure, glucose_heart_ratio]]
        sample_scaled = scaler.transform(sample)
        pred = model.predict(sample_scaled).tolist()
        return Response({'prediction': pred})
    except Exception as e:
        return Response({'error': f'Prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retrain_view(request):
    db = get_mongo()
    col = db['medical_records']
    docs = list(col.find())
    import pandas as pd, numpy as np
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score

    if len(docs) < 20:
        rng = np.random.RandomState(0)
        n = 2000  # Increased synthetic data for better training
        systolic = rng.normal(120, 20, size=n)  # More variance
        diastolic = rng.normal(80, 15, size=n)
        glucose = rng.normal(100, 30, size=n)
        heart_rate = rng.normal(70, 15, size=n)
        # More complex anomaly logic to achieve ~75% accuracy
        anomaly_prob = 0.25  # 25% anomalies
        label = rng.binomial(1, anomaly_prob, size=n)  # Random anomalies
        # Add some correlation
        label = ((glucose > 140) | (systolic > 140) | (heart_rate > 90) | (diastolic > 90) | (label == 1)).astype(int)
        # Add noise to make it realistic
        noise = rng.normal(0, 0.1, size=n)
        label = np.clip(label + noise, 0, 1).astype(int)
        df = pd.DataFrame({
            'systolic': systolic,
            'diastolic': diastolic,
            'glucose': glucose,
            'heart_rate': heart_rate,
            'label': label
        })
    else:
        records = []
        for d in docs:
            records.append({
                'systolic': d.get('systolic', 0),
                'diastolic': d.get('diastolic', 0),
                'glucose': d.get('glucose', 0),
                'heart_rate': d.get('heart_rate', 0),
                'label': int(d.get('meta', {}).get('label', 0))
            })
        df = pd.DataFrame(records)

    # Data preprocessing
    df = df.dropna()  # Remove missing values
    X = df[['systolic', 'diastolic', 'glucose', 'heart_rate']]
    y = df['label']

    # Feature engineering: add ratios
    X['pulse_pressure'] = X['systolic'] - X['diastolic']
    X['glucose_heart_ratio'] = X['glucose'] / (X['heart_rate'] + 1)  # Avoid division by zero

    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split data for validation
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # Use GradientBoosting for better performance
    clf = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=3, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate on test set
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    # Save model and scaler
    model_path = os.path.join(os.path.dirname(__file__), '..', 'model.joblib')
    scaler_path = os.path.join(os.path.dirname(__file__), '..', 'scaler.joblib')
    dump(clf, model_path)
    dump(scaler, scaler_path)

    return Response({
        'status': 'retrained',
        'records_used': len(df),
        'accuracy': round(accuracy, 4),
        'model': 'GradientBoostingClassifier'
    })

class RecordsStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import datetime
        db = get_mongo()
        col = db['medical_records']
        # Params: patient_username (optional for doctors), days (default 30)
        days = int(request.query_params.get('days', 30))
        since = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        try:
            profile = PatientProfile.objects.get(user=request.user)
        except PatientProfile.DoesNotExist:
            return Response({'series': [], 'summary': {}}, status=200)
        query = {'recorded_at': {'$gte': since}}
        if profile.role not in ['doctor','admin']:
            query['patient_username'] = request.user.username
        else:
            patient_q = request.query_params.get('patient_username')
            if patient_q:
                query['patient_username'] = patient_q
        docs = list(col.find(query).sort('recorded_at', 1))
        # Build simple time series arrays
        def safe_float(v):
            try:
                return float(v)
            except Exception:
                return 0.0
        series = {
            'timestamps': [],
            'systolic': [],
            'diastolic': [],
            'glucose': [],
            'heart_rate': []
        }
        for d in docs:
            ts = d.get('recorded_at')
            if isinstance(ts, str):
                try:
                    ts = datetime.datetime.fromisoformat(ts)
                except Exception:
                    ts = since
            series['timestamps'].append(ts.isoformat())
            series['systolic'].append(safe_float(d.get('systolic', 0)))
            series['diastolic'].append(safe_float(d.get('diastolic', 0)))
            series['glucose'].append(safe_float(d.get('glucose', 0)))
            series['heart_rate'].append(safe_float(d.get('heart_rate', 0)))
        # Summary
        def summarize(values):
            arr = [v for v in values if v is not None]
            if not arr:
                return {'min': None, 'max': None, 'avg': None}
            avg = sum(arr)/len(arr)
            return {'min': min(arr), 'max': max(arr), 'avg': round(avg, 2)}
        summary = {
            'systolic': summarize(series['systolic']),
            'diastolic': summarize(series['diastolic']),
            'glucose': summarize(series['glucose']),
            'heart_rate': summarize(series['heart_rate'])
        }
        return Response({'series': series, 'summary': summary})

