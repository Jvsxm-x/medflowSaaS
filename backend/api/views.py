# api/views.py
import os
import json
from datetime import datetime, timezone
from datetime import timedelta
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import jwt

from .middleware import LIMITS

from .utils import convert_objectid, normalize_mongo_doc
from .mongo_models import MongoClinic, clean_mongo_doc, collections
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import  AllowAny
from .permissions import IsAuthenticatedMongo,IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from joblib import load, dump
import numpy as np
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId, utc
from asgiref.sync import async_to_sync
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import bcrypt
import requests
from pymongo import ASCENDING, DESCENDING
# Import your MongoDB collections & helpers
from .mongo_models import (
    collections,
    MongoUser,
    MongoAlert,
    get_patient_vitals,
    ensure_mongo_setup
)

# Explicit collection shortcuts for readability
users = collections['users']
patients = collections['patients']
vitals_records = collections['vitals_records']
alerts = collections['alerts']
records = collections['vitals_records']
chat_col = collections['chat_histories']
appointments=collections['appointments']
plans=collections['plans']
# Groq setup
from groq import Groq
client_groq = Groq(api_key=settings.GROQ_API_KEY)

# Ensure indexes on startup
ensure_mongo_setup()

# ====================== VITALS RECORDS ======================
class RecordsView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        vitals = list(vitals_records.find({"patient_username": request.user.username}).sort("recorded_at", DESCENDING))
        for v in vitals:
            v['_id'] = str(v['_id'])
            if isinstance(v.get('recorded_at'), datetime):
                v['recorded_at'] = v['recorded_at'].isoformat()
        return Response(vitals)

    def post(self, request):
        data = request.data.copy()
        data['patient_username'] = request.user.username
        data['recorded_at'] = datetime.utcnow()

        result = vitals_records.insert_one(data)
        created = vitals_records.find_one({"_id": result.inserted_id})
        created['_id'] = str(created['_id'])
        created['recorded_at'] = created['recorded_at'].isoformat()
        return Response(created, status=status.HTTP_201_CREATED)

    def put(self, request, record_id):
        try:
            obj_id = ObjectId(record_id)
            doc = vitals_records.find_one({"_id": obj_id, "patient_username": request.user.username})
            if not doc:
                return Response({"error": "Record not found or unauthorized"}, status=404)

            update_data = {}
            for field in ['systolic', 'diastolic', 'glucose', 'heart_rate', 'notes']:
                if field in request.data:
                    update_data[field] = request.data[field]

            if update_data:
                vitals_records.update_one({"_id": obj_id}, {"$set": update_data})

            updated = vitals_records.find_one({"_id": obj_id})
            updated['_id'] = str(updated['_id'])
            updated['recorded_at'] = updated['recorded_at'].isoformat()
            return Response(updated)
        except:
            return Response({"error": "Invalid ID"}, status=400)


# ====================== ALERTS ======================
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def alerts_view(request):
    alerts = collections['alerts'].find({'patient_username': request.user.username})
    for a in alerts:
        a['_id'] = str(a['_id'])
        a['created_at'] = a['created_at'].isoformat()
    return Response(alerts)


# ====================== SINGLE RECORD DETAIL ======================
@api_view(['GET', 'DELETE', 'PUT'])
@permission_classes([IsAuthenticatedMongo])
def record_detail(request, record_id):
    try:
        obj_id = ObjectId(record_id)
        doc = vitals_records.find_one({'_id': obj_id})
        if not doc:
            return Response({'error': 'Not found'}, status=404)

        is_owner = doc['patient_username'] == request.user.username
        if not (is_owner or request.user.is_staff):
            return Response({'error': 'Forbidden'}, status=403)

        if request.method == 'DELETE':
            vitals_records.delete_one({'_id': obj_id})
            return Response({'status': 'deleted'})

        if request.method == 'PUT':
            update_fields = {}
            for field in ['systolic', 'diastolic', 'glucose', 'heart_rate', 'notes']:
                if field in request.data:
                    update_fields[field] = request.data[field]
            if update_fields:
                vitals_records.update_one({'_id': obj_id}, {'$set': update_fields})
            updated_doc = vitals_records.find_one({'_id': obj_id})
            updated_doc['_id'] = str(updated_doc['_id'])
            updated_doc['recorded_at'] = updated_doc['recorded_at'].isoformat()
            return Response(updated_doc)

        # GET
        doc['_id'] = str(doc['_id'])
        doc['recorded_at'] = doc['recorded_at'].isoformat()
        return Response(doc)

    except Exception as e:
        return Response({'error': 'Invalid ID'}, status=400)


# ====================== ACKNOWLEDGE ALERT ======================
@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def acknowledge_alert(request, alert_id):
    try:
        obj_id = ObjectId(alert_id)
        alert_doc = alerts.find_one({'_id': obj_id})
        if not alert_doc:
            return Response({'error': 'Alert not found'}, status=404)

        if alert_doc['patient_username'] != request.user.username and not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)

        alerts.update_one({'_id': obj_id}, {'$set': {'acknowledged': True}})
        return Response({'status': 'acknowledged'})
    except:
        return Response({'error': 'Invalid ID'}, status=400)


# ====================== CHATBOT (GROQ) ======================



@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])  # ← Maintenant ça marche !
def groq_chat(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return StreamingHttpResponse("data: Invalid JSON\n\ndata: [DONE]\n\n", content_type="text/event-stream")

    user_input = data.get("message", "").strip()
    if not user_input:
        return StreamingHttpResponse("data: Message vide\n\ndata: [DONE]\n\n", content_type="text/event-stream")

    # ON UTILISE request.user.username → 100% sécurisé et fiable
    session_id = request.user.username

    # Charger l'historique
    chat_doc = chat_col.find_one({"session_id": session_id})
    messages = chat_doc.get("messages", []) if chat_doc else []

    # Message système une seule fois
    if not any(m.get("role") == "system" for m in messages):
        messages.insert(0, {
            "role": "system",
            "content": "Tu es Dawini, un assistant médical bienveillant, empathique et professionnel. Tu réponds toujours en français, de façon claire et rassurante."
        })

    messages.append({"role": "user", "content": user_input})

    def event_stream():
        full_response = ""
        try:
            stream = client_groq.chat.completions.create(
                model="groq/compound-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                stream=True
            )

            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"

            # SAUVEGARDE FORCÉE
            messages.append({"role": "assistant", "content": full_response})

            result = chat_col.update_one(
                {"session_id": session_id},
                {"$set": {
                    "messages": messages,
                    "updated_at": datetime.utcnow(),
                    "user_username": session_id
                }},
                upsert=True
            )

            print(f"Sauvegarde réussie → upserted_id: {result.upserted_id}, modified: {result.modified_count}")

            yield "data: [DONE]\n\n"

        except Exception as e:
            print("Erreur Groq:", e)
            yield "data: " + json.dumps({"content": "Désolé, je suis temporairement indisponible."}) + "\n\n"
            yield "data: [DONE]\n\n"

    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def get_chat_history(request):
    """
    Retourne l'historique complet du chat pour l'utilisateur connecté
    """
    username = request.user.username

    chat_doc = chat_col.find_one({"session_id": username})

    if not chat_doc or "messages" not in chat_doc:
        return Response({"history": []})

    # On filtre le message "system" pour l'affichage
    display_messages = [
        msg for msg in chat_doc["messages"]
        if msg.get("role") != "system"
    ]

    # Optionnel : ajouter timestamp lisible
    for msg in display_messages:
        if "timestamp" not in msg:
            msg["timestamp"] = datetime.utcnow().isoformat()

    return Response({"history": display_messages})

# ====================== AUTH ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        data = request.data

        # Vérification champs obligatoires
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"{field} est requis"}, status=400)

        # Nettoyage role
        role = data['role'].lower()
        if role not in ['patient', 'doctor']:
            return Response({"error": "Role doit être 'patient' ou 'doctor'"}, status=400)

        # Création via MongoUser
        user = MongoUser.create_user(data)

        return Response({
            "message": "Compte créé avec succès !",
            "user": {
                "username": user['username'],
                "email": user['email'],
                "role": user['role'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
            }
        }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print("Erreur inscription:", e)
        return Response({"error": "Erreur serveur, réessayez"}, status=500)


# Clé secrète (assure-toi qu’elle est bien définie dans settings.py)
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = timedelta(days=7)  # ou 1 heure, etc.

# api/views.py → login_view (doit ressembler à ça)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = MongoUser.authenticate(username, password)
    if not user:
        return Response({"error": "Identifiants incorrects"}, status=401)

    token = jwt.encode({
        'username': user['username'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(days=7)
    }, settings.SECRET_KEY, algorithm='HS256')

    return Response({
        "token": token,
        "user": {
            "username": user['username'],
            "role": user['role'],
            "email": user.get('email', '')
        }
    })
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticatedMongo])
def profile_view(request):
    user_doc = collections['users'].find_one({"username": request.user.username})
    if not user_doc:
        return Response({"error": "Profile not found"}, status=404)

    # Remove sensitive fields
    def sanitize(doc):
        doc = convert_objectid(doc)
        return {k: v for k, v in doc.items() if k != "password_hash"}

    # --------------------------
    # GET profile
    # --------------------------
    if request.method == 'GET':
        return Response(sanitize(user_doc))

    # --------------------------
    # PATCH update profile
    # --------------------------
    allowed_fields = ['first_name', 'last_name', 'phone', 'birth_date', 'address', 'email']
    update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

    if update_data:
        collections['users'].update_one(
            {"username": request.user.username},
            {"$set": {**update_data, "updated_at": datetime.datetime.utcnow()}}
        )

    updated_doc = collections['users'].find_one({"username": request.user.username})
    return Response(sanitize(updated_doc))


@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def my_profile_view(request):
    user = users.find_one({"username": request.user.username})

    if not user:
        return Response({"error": "Profil introuvable"}, status=404)

    return Response({
        "_id": str(user["_id"]),
        "username": user.get("username"),
        "email": user.get("email", ""),
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "role": user.get("role", ""),
        "phone": user.get("phone", ""),
        "birth_date": user.get("birth_date"),
        "address": user.get("address", "")
    })


# ====================== PREDICTION & RETRAIN ======================
@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def predict_view(request):
    model_path = os.path.join(settings.BASE_DIR, 'model.joblib')
    scaler_path = os.path.join(settings.BASE_DIR, 'scaler.joblib')

    if not os.path.exists(model_path):
        return Response({'error': 'Model not trained yet'}, status=400)

    try:
        model = load(model_path)
        scaler = load(scaler_path)
    except:
        return Response({'error': 'Failed to load model/scaler'}, status=500)

    s = request.data
    required = ['systolic', 'diastolic', 'glucose', 'heart_rate']
    for f in required:
        if f not in s:
            return Response({'error': f'Missing {f}'}, status=400)
        try:
            float(s[f])
        except:
            return Response({'error': f'{f} must be number'}, status=400)

    systolic = float(s['systolic'])
    diastolic = float(s['diastolic'])
    pulse_pressure = systolic - diastolic
    glucose_heart_ratio = float(s['glucose']) / (float(s['heart_rate']) + 1)

    sample = [[systolic, diastolic, s['glucose'], s['heart_rate'], pulse_pressure, glucose_heart_ratio]]
    sample_scaled = scaler.transform(sample)
    pred = int(model.predict(sample_scaled)[0])

    return Response({'prediction': pred, 'risk': 'High' if pred == 1 else 'Normal'})


@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def retrain_view(request):
    docs = list(vitals_records.find())
    if len(docs) < 20:
        rng = np.random.RandomState(0)
        n = 2000
        systolic = rng.normal(120, 20, size=n)
        diastolic = rng.normal(80, 15, size=n)
        glucose = rng.normal(100, 30, size=n)
        heart_rate = rng.normal(70, 15, size=n)
        anomaly_prob = 0.25
        label = rng.binomial(1, anomaly_prob, size=n)
        label = ((glucose > 140) | (systolic > 140) | (heart_rate > 90) | (diastolic > 90) | (label == 1)).astype(int)
        noise = rng.normal(0, 0.1, size=n)
        label = np.clip(label + noise, 0, 1).astype(int)

        df = pd.DataFrame({
            'systolic': systolic, 'diastolic': diastolic,
            'glucose': glucose, 'heart_rate': heart_rate, 'label': label
        })
    else:
        records_list = []
        for d in docs:
            records_list.append({
                'systolic': d.get('systolic', 0),
                'diastolic': d.get('diastolic', 0),
                'glucose': d.get('glucose', 0),
                'heart_rate': d.get('heart_rate', 0),
                'label': int(d.get('meta', {}).get('label', 0))
            })
        df = pd.DataFrame(records_list)

    df = df.dropna()
    X = df[['systolic', 'diastolic', 'glucose', 'heart_rate']]
    y = df['label']
    X['pulse_pressure'] = X['systolic'] - X['diastolic']
    X['glucose_heart_ratio'] = X['glucose'] / (X['heart_rate'] + 1)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    clf = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=3, random_state=42)
    clf.fit(X_train, y_train)
    accuracy = accuracy_score(y_test, clf.predict(X_test))

    dump(clf, os.path.join(settings.BASE_DIR, 'model.joblib'))
    dump(scaler, os.path.join(settings.BASE_DIR, 'scaler.joblib'))

    return Response({
        'status': 'retrained',
        'records_used': len(df),
        'accuracy': round(accuracy, 4),
        'model': 'GradientBoostingClassifier'
    })
class PatientProfileView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        user_doc = collections['users'].find_one({"username": request.user.username})
        if not user_doc or user_doc.get("role") != "patient":
            return Response({"error": "Profile not found or unauthorized"}, status=404)

        safe_doc = {k: v for k, v in user_doc.items() if k != "password_hash"}
        return Response(safe_doc)
class PatientProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedMongo]

    def retrieve(self, request, pk=None):
        user_doc = collections['users'].find_one({"username": pk})
        if not user_doc or user_doc.get("role") != "patient":
            return Response({"error": "Profile not found"}, status=404)

        safe_doc = {k: v for k, v in user_doc.items() if k != "password_hash"}
        return Response(safe_doc)
class AlertViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedMongo]

    def list(self, request):
        alerts = MongoAlert.get_by_patient(request.user.username)
        for a in alerts:
            a['_id'] = str(a['_id'])
            a['created_at'] = a['created_at'].isoformat()
        return Response(alerts) 

# ====================== STATS ======================
class RecordsStatsView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        try:
            days = int(request.query_params.get('days', 30))
        except:
            return Response({"error": "Invalid days parameter"}, status=400)

        since = datetime.utcnow() - timedelta(days=days)
        query = {'recorded_at': {'$gte': since}}
        if not request.user.is_staff:
            query['patient_username'] = request.user.username
        else:
            patient = request.query_params.get('patient_username')
            if patient:
                query['patient_username'] = patient

        docs = list(vitals_records.find(query).sort('recorded_at', 1))
        series = {'timestamps': [], 'systolic': [], 'diastolic': [], 'glucose': [], 'heart_rate': []}
        for d in docs:
            ts = d.get('recorded_at')
            if isinstance(ts, datetime.datetime):
                ts = ts.isoformat()
            series['timestamps'].append(ts)
            for key in ['systolic', 'diastolic', 'glucose', 'heart_rate']:
                val = d.get(key)
                if val is not None:
                    try:
                        series[key].append(float(val))
                    except:
                        pass

        def summarize(arr):
            if not arr:
                return {'min': None, 'max': None, 'avg': None}
            return {'min': min(arr), 'max': max(arr), 'avg': round(sum(arr)/len(arr), 2)}

        summary = {k: summarize(v) for k, v in series.items() if k != 'timestamps'}
        return Response({'series': series, 'summary': summary})


# ====================== LATEST RECORD ======================
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def latest_record(request):
    query = {"patient_username": request.user.username}
    if request.user.is_staff and request.query_params.get('patient_username'):
        query["patient_username"] = request.query_params.get('patient_username')

    doc = vitals_records.find(query).sort("recorded_at", -1).limit(1)
    try:
        doc = next(doc)
        doc['_id'] = str(doc['_id'])
        doc['recorded_at'] = doc['recorded_at'].isoformat()
        return Response(doc)
    except:
        return Response({"error": "Aucun relevé"}, status=404)


# ====================== DOCTOR PATIENTS LIST ======================
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def patients_list(request):
    user = users.find_one({"username": request.user.username})
    if not user or user.get("role") not in ["doctor", "admin"]:
        return Response({"error": "Accès refusé"}, status=403)

    patients = list(users.find({"role": "patient"}, {
       # "password_hash": 0, "email": 1, "first_name": 1, "last_name": 1, "username": 1

         "_id": 1,
    "username": 1,
    "email": 1,
    "first_name": 1,
    "last_name": 1,
    "phone": 1,
    "address": 1,
    "avatar_url": 1,
    "birth_date": 1,
    "created_at": 1,
    }))

    for p in patients:
        count = vitals_records.count_documents({"patient_username": p["username"]})
        last = vitals_records.find_one(
            {"patient_username": p["username"]},
            sort=[("recorded_at", -1)]
        )
        p["records_count"] = count
        p["last_record_date"] = last["recorded_at"].isoformat() if last else None

    return Response(patients)
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def get_doctors_list(request):
    user = users.find_one({"username": request.user.username})
    if not user:
        return Response({"error": "Utilisateur introuvable"}, status=404)

    doctors = list(users.find({"role": "doctor"}, {
        "password_hash": 0,
        "email": 1,
        "first_name": 1,
        "last_name": 1,
        "username": 1,
        "specialty": 1,
        "rating": 1,
        "bio": 1,
        "location": 1,
        "avatar_url": 1
    }))

    for doc in doctors:
        doc["_id"] = str(doc["_id"])

    return Response(doctors)

  

# ====================== APPOINTMENTS ======================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedMongo])
def appointments_view(request):
    if request.method == 'GET':
        appts = list(collections['appointments'].find({"patient_username": request.user.username}))
        for a in appts:
            a['_id'] = str(a['_id'])
        return Response(appts)
    elif request.method == 'POST':
        data = request.data.copy()
        data['patient_username'] = request.user.username
        data['created_at'] = datetime.utcnow()
        id = collections['appointments'].insert_one(data).inserted_id
        return Response({"id": str(id)}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def appointments_list_view(request):

    appointments_list = list(appointments.find())
    if not appointments_list:
        return Response({"error": "appointments_list introuvable"}, status=404)
    for a in appointments_list:
            a['_id'] = str(a['_id'])
    return Response(appointments_list)



# ====================== UPGRADE TO PRO ======================
@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def upgrade_to_pro(request):
    user = users.find_one({"username": request.user.username})
    if not user:
        return Response({"error": "Utilisateur introuvable"}, status=404)
    if user.get("role") == "pro":
        return Response({"message": "Déjà utilisateur Pro"}, status=200)

    users.update_one({"username": request.user.username}, {"$set": {"role": "pro"}})
    return Response({"message": "Mise à niveau vers Pro réussie"}, status=200)
# ====================== PROFIL PUBLIC (PATIENT & DOCTOR) ======================

@api_view(['GET'])
@permission_classes([])
def patient_profile_view(request, username):
    """
    Profil public d'un patient ou d'un utilisateur générique
    Retourne les données MongoDB (ou fallback Django si besoin, mais ici 100% Mongo)
    """
    user_doc = collections['users'].find_one({"username": username})

    if not user_doc:
        return Response({"error": "Utilisateur introuvable"}, status=404)

    # Ne jamais renvoyer le mot de passe
    user_doc.pop("password_hash", None)

    # Conversion des ObjectId et dates
    if "_id" in user_doc:
        user_doc["_id"] = str(user_doc["_id"])

    return Response({
        "source": "mongo",
        "data": user_doc
    })


@api_view(['GET'])
@permission_classes([])
def patient_profile_view1(request, username):
    """
    Profil enrichi pour les docteurs (auto-fill des champs manquants + valeurs par défaut)
    Utilisé par le frontend pour afficher les cartes docteurs
    """
    user_doc = collections['users'].find_one({"username": username})

    # Schéma complet attendu par le frontend
    DEFAULT_DOCTOR_PROFILE = {
        "username": username,
        "email": "",
        "first_name": "",
        "last_name": "",
        "role": "doctor",
        "phone": "0000000000",
        "birth_date": None,
        "address": "Cabinet non renseigné",
        "specialty": "Médecine générale",
        "rating": 4.5,
        "bio": "Aucune biographie fournie.",
        "location": "Non précisé",
        "avatar_url": "",
        "appointments": []
    }

    if not user_doc:
        # Si l'utilisateur n'existe pas du tout → on crée un profil par défaut (optionnel)
        # collections['users'].insert_one(DEFAULT_DOCTOR_PROFILE)
        final_data = DEFAULT_DOCTOR_PROFILE
    else:
        final_data = {**DEFAULT_DOCTOR_PROFILE, **user_doc}
        final_data.pop("password_hash", None)

    # Conversion des types
    if "_id" in final_data:
        final_data["_id"] = str(final_data["_id"])

    return Response({
        "source": "mongo-enriched",
        "data": final_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def patients_list_view(request):
    # Optionnel : vérifier que c'est un docteur

    patients_cursor = collections["users"].find({"role": "patient"})

    patients_list = []
    for doc in patients_cursor:
        doc = normalize_mongo_doc(doc)
        patients_list.append(doc)
    
    return Response(patients_list)

   
# api/views.py

@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def order_lab_test(request):
    doctor = request.user
    if doctor.role != "doctor":
        return Response({"error": "Seul un docteur peut prescrire"}, status=403)

    patient_username = request.data.get("patient_username")
    test_name = request.data.get("test_name")

    if not patient_username or not test_name:
        return Response({"error": "patient_username et test_name requis"}, status=400)

    # Vérifie que le patient existe
    patient = collections['users'].find_one({"username": patient_username, "role": "patient"})
    if not patient:
        return Response({"error": "Patient non trouvé"}, status=404)

    order = {
        "doctor_username": doctor.username,
        "patient_username": patient_username,
        "test_name": test_name,
        "status": "pending",
        "comment": "",
        "result": "",
        "ordered_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }

    result = collections['lab_orders'].insert_one(order)
    order["_id"] = str(result.inserted_id)

    return Response({
        "success": True,
        "message": "Analyse prescrite avec succès",
        "order": order
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def my_lab_orders(request):
    user = request.user

    query = {
        "$or": [
            {"doctor_username": user.username},
            {"patient_username": user.username}
        ]
    }

    orders = list(collections['lab_orders'].find(query).sort("ordered_at", -1))

    for order in orders:
        order["_id"] = str(order["_id"])

    return Response({
        "count": len(orders),
        "orders": orders
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticatedMongo])
def update_lab_order(request, order_id):
    user = request.user
    comment = request.data.get("comment")
    result = request.data.get("result")
    status = request.data.get("status")

    order = collections['lab_orders'].find_one({"_id": ObjectId(order_id)})

    if not order:
        return Response({"error": "Demande non trouvée"}, status=404)

    # Sécurité : seul le docteur qui a prescrit peut modifier
    if order["doctor_username"] != user.username:
        return Response({"error": "Accès refusé"}, status=403)

    update_data = {}
    if comment is not None:
        update_data["comment"] = comment
    if result is not None:
        update_data["result"] = result
    if status in ["pending", "in_progress", "completed", "cancelled"]:
        update_data["status"] = status
        if status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()

    if update_data:
        collections['lab_orders'].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )

    updated = collections['lab_orders'].find_one({"_id": ObjectId(order_id)})
    updated["_id"] = str(updated["_id"])

    return Response({
        "success": True,
        "order": updated
    })
# === Collection pour les documents médicaux ===
# Crée un index pour sécurité


@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def doctor_document_reviews(request):
    doctor = request.user
    if doctor.role != "doctor":
        return Response({"error": "Accès refusé"}, status=403)

    docs = list(collections['medical_documents'].find({
        "doctor_username": doctor.username
    }).sort("uploaded_at", -1))

    for doc in docs:
        doc["_id"] = str(doc["_id"])
        doc["uploaded_at"] = doc.get("uploaded_at", datetime.utcnow().isoformat())

    return Response({"documents": docs})


@api_view(['PATCH'])
@permission_classes([IsAuthenticatedMongo])
def review_medical_document(request, doc_id):
    doctor = request.user
    if doctor.role != "doctor":
        return Response({"error": "Accès refusé"}, status=403)

    doc = collections['medical_documents'].find_one({"_id": ObjectId(doc_id)})
    if not doc or doc.get("doctor_username") != doctor.username:
        return Response({"error": "Document non trouvé ou accès refusé"}, status=404)

    update_data = {}
    if "ai_summary" in request.data:
        update_data["ai_summary"] = request.data["ai_summary"]
    if "ai_tips" in request.data:
        update_data["ai_tips"] = request.data["ai_tips"]
    if "status" in request.data:
        update_data["status"] = request.data["status"]  # approved / rejected / pending
        update_data["reviewed_at"] = datetime.utcnow().isoformat()

    if update_data:
        collections['medical_documents'].update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": update_data}
        )

    updated = collections['medical_documents'].find_one({"_id": ObjectId(doc_id)})
    updated["_id"] = str(updated["_id"])

    return Response({"success": True, "document": updated})
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def doctor_dashboard(request):
    if request.user.role != "doctor":
        return Response({"error": "Accès refusé"}, status=403)

    doctor_username = request.user.username

    patient_count = collections['users'].count_documents({"role": "patient", "doctor_username": doctor_username})
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    today_appointments = collections['appointments'].count_documents({
        "doctor_username": doctor_username,
        "appointment_date": {"$gte": today.isoformat(), "$lt": tomorrow.isoformat()},
        "status": "scheduled"
    })

    pending_lab_orders = collections['lab_orders'].count_documents({
        "doctor_username": doctor_username,
        "status": {"$in": ["pending", "in_progress"]}
    })

    pending_documents = collections['medical_documents'].count_documents({
        "doctor_username": doctor_username,
        "status": "pending"
    })

    return Response({
        "patient_count": patient_count,
        "today_appointments": today_appointments,
        "pending_lab_orders": pending_lab_orders,
        "pending_documents": pending_documents
    })


# api/views.py → Remplace toute ta fonction upload_patient_document par celle-ci :

@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def upload_patient_document(request):
    if request.user.role != "patient":
        return Response({"error": "Accès refusé"}, status=403)

    file = request.FILES.get('file')
    doctor_username = request.data.get('doctor_username')

    if not file or not doctor_username:
        return Response({"error": "Fichier et docteur requis"}, status=400)

    # Vérifie que le docteur existe
    doctor = collections['users'].find_one({"username": doctor_username, "role": "doctor"})
    if not doctor:
        return Response({"error": "Docteur invalide"}, status=400)

    # Récupère les infos du patient (sans utiliser first_name/last_name si absents)
    patient_data = collections['users'].find_one({"username": request.user.username})
    patient_name = (
        f"{patient_data.get('first_name', '')} {patient_data.get('last_name', '')}".strip()
        or request.user.username
    )

    # Sauvegarde du fichier (simulé ici)
    file_url = f"/media/uploads/{file.name}"

    doc = {
        "patient_username": request.user.username,
        "patient_name": patient_name,
        "doctor_username": doctor_username,
        "doctor_name": f"Dr. {doctor.get('first_name', '')} {doctor.get('last_name', '')}".strip() or doctor_username,
        "title": file.name,
        "file_url": file_url,
        "document_type": file.content_type,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "ai_summary": "Analyse automatique en cours...",
        "ai_tips": "",
        "ai_prediction": None
    }

    result = collections['medical_documents'].insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    return Response({"document": doc}, status=201)
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def patient_documents(request):
    if request.user.role != "patient":
        return Response({"error": "Accès refusé"}, status=403)

    docs = list(collections['medical_documents'].find({
        "patient_username": request.user.username
    }).sort("uploaded_at", -1))

    for d in docs:
        d["_id"] = str(d["_id"])
        doctor = collections['users'].find_one({"username": d.get("doctor_username")})
        if doctor:
            d["doctor_name"] = f"Dr. {doctor.get('first_name','')} {doctor.get('last_name','')}".strip() or d["doctor_username"]
        else:
            d["doctor_name"] = d["doctor_username"]

    return Response({"documents": docs})


@api_view(['DELETE'])
@permission_classes([IsAuthenticatedMongo])
def delete_patient_document(request, doc_id):
    doc = collections['medical_documents'].find_one({"_id": ObjectId(doc_id)})
    if not doc or doc["patient_username"] != request.user.username:
        return Response({"error": "Non autorisé"}, status=403)

    collections['medical_documents'].delete_one({"_id": ObjectId(doc_id)})
    return Response({"success": True})
@api_view(['GET'])
@permission_classes([AllowAny])
def list_doctors(request):
    doctors = list(collections['users'].find(
        {"role": "doctor"},
        {"password": 0}
    ))

    for doc in doctors:
        doc["_id"] = str(doc["_id"])
        doc["first_name"] = doc.get("first_name", "")
        doc["last_name"] = doc.get("last_name", "Docteur")
        doc["username"] = doc.get("username", "")

    return Response({"doctors": doctors})
# api/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def patient_lab_orders(request):
    if request.user.role != "patient":
        return Response({"error": "Accès refusé"}, status=403)

    orders = list(collections['lab_orders'].find({
        "patient_username": request.user.username,
        "status": "pending"
    }).sort("requested_date", 1))

    for order in orders:
        order["_id"] = str(order["_id"])
        # Optionnel : ajouter le nom du docteur
        doctor = collections['users'].find_one({"username": order.get("doctor_username")})
        if doctor:
            order["doctor_name"] = f"Dr. {doctor.get('first_name', '')} {doctor.get('last_name', '')}".strip()

    return Response({"orders": orders})
# api/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def storage_usage(request):
    # Exemple : somme de la taille des documents uploadés
    total = 0
    nb = 0
    for doc in collections['medical_documents'].find({"patient_username": request.user.username}):
        total += doc.get("file_size", 0)
        nb+=1
    
    return Response({
        "used_bytes": (total+200*1024*1024)+nb*20*1024*1024,  # Ajout d'un buffer de 200MB
        "limit_bytes": 5 * 1024 * 1024 * 1024,  # 5 Go
        "used_mb": round(total / (1024*1024), 2)+200,
    })
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def records_stats(request):
    """
    GET /api/records/stats/?days=30
    Retourne les moyennes des 30 derniers jours (ou le nombre demandé)
    """
    try:
        days = int(request.GET.get('days', '30'))
        if days <= 0 or days > 365:
            days = 30
    except (ValueError, TypeError):
        days = 30

    # Date de coupure
    cutoff_date = datetime.utcnow().replace(tzinfo=utc) - timedelta(days=days)

    # Pipeline MongoDB ultra-robuste
    pipeline = [
        {
            "$match": {
                "patient_username": request.user.username,
                "recorded_at": {"$gte": cutoff_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "systolic_avg": {"$avg": "$systolic"},
                "diastolic_avg": {"$avg": "$diastolic"},
                "glucose_avg": {"$avg": "$glucose"},
                "heart_rate_avg": {"$avg": "$heart_rate"},
                "count": {"$sum": 1}
            }
        }
    ]

    try:
        result = list(vitals_records.aggregate(pipeline))
    except Exception as e:
        print("Erreur aggregation MongoDB:", e)
        result = []

    # Si aucune mesure ou erreur → on renvoie des valeurs nulles
    if not result or result[0].get("count", 0) == 0:
        summary = {
            "systolic": {"avg": None},
            "diastolic": {"avg": None},
            "glucose": {"avg": None},
            "heart_rate": {"avg": None}
        }
    else:
        r = result[0]
        summary = {
            "systolic": {"avg": round(r["systolic_avg"], 1) if r.get("systolic_avg") is not None else None},
            "diastolic": {"avg": round(r["diastolic_avg"], 1) if r.get("diastolic_avg") is not None else None},
            "glucose": {"avg": round(r["glucose_avg"], 1) if r.get("glucose_avg") is not None else None},
            "heart_rate": {"avg": round(r["heart_rate_avg"]) if r.get("heart_rate_avg") is not None else None},
        }

    return Response({"summary": summary})
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def my_limits(request):
    user = users.find_one({"username": request.user.username})
    plan = user.get("plan", "free")
    limits = LIMITS[plan]
    
    return Response({
        "plan": plan,
        "usage": {
            "storage": f"{user.get('storage_used',0)//(1024*1024)} / {limits['storage_bytes']//(1024*1024)} Mo",
            "records": f"{user.get('records_count',0)} / {limits['records_count']}",
            "lab_orders": f"{user.get('lab_orders_count',0)} / {limits['lab_orders_count']}",
        },
        "can_upgrade": plan == "free"
    })
# api/views.py
@api_view(['GET'])
def admin_users_list_view(request):
    users_cursor = collections['users'].find()
    users_list = []
    for doc in users_cursor:
        doc = normalize_mongo_doc(doc)
        users_list.append(doc)
    return Response(users_list)
@api_view(['GET','POST', 'DELETE', 'PUT', 'PATCH'])
def admin_users_list(request, id):

    # --- Helper sécurisé ---
    def sanitize(doc):
        if not doc:
            return {}
        doc = convert_objectid(doc)
        doc.pop("password_hash", None)
        return doc

    # --- GET : récupérer 1 utilisateur ---
    if request.method == 'GET':
        user = collections['users'].find_one({"_id": ObjectId(id)})
        if not user:
            return Response({"error": "Utilisateur non trouvé"}, status=404)
        return Response(sanitize(user))

    # --- POST : créer utilisateur ---
    if request.method == 'POST':
        data = request.data

        if not all(k in data for k in ['username', 'password', 'role']):
            return Response({"error": "username, password et role requis"}, status=400)

        existing = collections['users'].find_one({"username": data['username']})
        if existing:
            return Response({"error": "Utilisateur déjà existant"}, status=400)

        new_user = MongoUser.create_user(data)
        return Response(sanitize(new_user), status=201)

    # --- DELETE : supprimer un user via son id ---
    if request.method == 'DELETE':
        result = collections['users'].delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return Response({"error": "Utilisateur non trouvé"}, status=404)
        return Response({"success": True})

    # --- PUT/PATCH : update user by ID ---
    if request.method in ['PUT', 'PATCH']:
        allowed_fields = ['first_name', 'last_name', 'phone', 'birth_date', 'address', 'email']

        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not update_data:
            return Response({"error": "Aucune donnée valide envoyée"}, status=400)

        collections['users'].update_one(
            {"_id": ObjectId(id)},
            {"$set": {**update_data, "updated_at": datetime.utcnow()}}
        )

        updated_doc = collections['users'].find_one({"_id": ObjectId(id)})
        return Response(sanitize(updated_doc))

    return Response({"error": "Méthode non autorisée"}, status=405)


#clinics views api 
@api_view(['GET'])
def clinic_recommended_view(request):
    lat = float(request.query_params.get('lat', 36.8189))
    lng = float(request.query_params.get('lng', 10.1658))
    clinics = MongoClinic.get_nearby(lat, lng)
    return Response([normalize_mongo_doc(c) for c in clinics])

@api_view(['GET'])
def clinic_detail_view(request, clinic_id):
    clinic = MongoClinic.get_by_id(clinic_id)
    if not clinic:
        return Response({"error": "Clinic not found"}, status=404)
    return Response(clinic)

@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def clinic_enter_view(request, clinic_id):
    clinic = MongoClinic.get_by_id(clinic_id)
    if not clinic:
        return Response({"error": "Clinic not found"}, status=404)
    # Return minimal data for theme
    theme_data = {
        "id": str(clinic["_id"]),
        "name": clinic["name"],
        "logo": clinic.get("logo_url", "/default-clinic.png"),
        "primaryColor": clinic.get("primary_color", "#14b8a6"),
        "secondaryColor": clinic.get("secondary_color", "#06b6d4")
    }
    return Response(theme_data)

# Invoice creation (clinic staff only)
@api_view(['POST'])
@permission_classes([IsAuthenticatedMongo])
def clinic_invoice_create_view(request, clinic_id):
    if request.user.role not in ['clinic_staff', 'clinic_admin']:
        return Response({"error": "Unauthorized"}, status=403)
    
    data = request.data
    invoice = collections['clinic_invoices'].insert_one({
        **data,
        "clinic_id": ObjectId(clinic_id),
        "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d')}-{collections['clinic_invoices'].count_documents({}) + 1:04d}",
        "issued_at": datetime.utcnow(),
        "status": "pending"
    })
    return Response({"invoice_id": str(invoice.inserted_id)})

@api_view(['GET'])
def clinic_invoices_view(request, clinic_id):
    invoices = list(collections['clinic_invoices'].find({"clinic_id": ObjectId(clinic_id)}).sort("issued_at", -1))
    return Response([normalize_mongo_doc(i) for i in invoices])
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def clinic_doctors_view(request, clinic_id):
    doctors = list(collections['clinic_doctors'].find({"clinic_id": ObjectId(clinic_id)}))
    return Response([normalize_mongo_doc(d) for d in doctors])
# views.py
import pdfkit
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone

#@api_view(['GET'])
#def clinic_invoice_pdf_view(request, clinic_id, invoice_id):
#    invoice = collections['clinic_invoices'].find_one({"_id": ObjectId(invoice_id)})
#    if not invoice:
#        return Response({"error": "Invoice not found"}, status=404)
#
#    # Prepare context
#    context = {
#        'invoice': invoice,
#        'clinic': collections['clinics'].find_one({"_id": ObjectId(clinic_id)}),
#        'issued_date': timezone.now().strftime('%d/%m/%Y'),
#    }
#
#    # Render HTML template
#    html_string = render_to_string('pdf/invoice_template.html', context)
#
#    # Generate PDF
#    pdf = pdfkit.from_string(
#        html_string,
#        False,  # Don't save to file
#        options={
#            'page-size': 'A4',
#            'margin-top': '0.5in',
#            'margin-right': '0.5in',
#            'margin-bottom': '0.5in',
#            'margin-left': '0.5in',
#            'encoding': "UTF-8",
#            'no-outline': None,
#            'enable-local-file-access': None,
#        }
#    )
#
#    response = HttpResponse(pdf, content_type='application/pdf')
#    response['Content-Disposition'] = f'attachment; filename="Facture_{invoice["invoice_number"]}.pdf"'
#    return response
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongo])
def clinic_list_view(request):
    clinics = list(collections['clinics'].find())
    for clinic in clinics:
        clinic["_id"] = str(clinic["_id"])
    return Response(clinics)
# ====================== CLINIC VIEWS - 100% FONCTIONNELLES ======================
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import pdfkit  # tu l'as déjà installé

# Connexion MongoDB (déjà dans mongo_models.py)
from .mongo_models import collections
from .utils import normalize_mongo_doc

client = MongoClient('mongodb://localhost:27017/')
db = client['dawini_db']

# ------------------------------------------------------------------
# 1. Liste + recommandées
# ------------------------------------------------------------------
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def clinic_list_view(request):
    if request.method == 'GET':
        clinics = list(collections['clinics'].find({"is_active": True}))
        return Response([normalize_mongo_doc(c) for c in clinics])
    if request.method == 'POST':
        data = request.data
        result = collections['clinics'].insert_one(data)
        return Response({"id": str(result.inserted_id)}, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_recommended_view(request):
    lat = float(request.query_params.get('lat', 36.8189))
    lng = float(request.query_params.get('lng', 10.1658))
    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [lng, lat]},
                "distanceField": "dist.calculated",
                "maxDistance": 30000,
                "spherical": True
            }
        },
        {"$match": {"is_active": True}},
        {"$sort": {"rating": -1}},
        {"$limit": 20}
    ]
    clinics = list(collections['clinics'].aggregate(pipeline))
    return Response([normalize_mongo_doc(c) for c in clinics])

# ------------------------------------------------------------------
# 2. Détail + Entrer dans la clinique
# ------------------------------------------------------------------
@api_view(['GET'])
def clinic_detail_view(request, clinic_id):
    clinic = collections['clinics'].find_one({"_id": ObjectId(clinic_id)})
    if not clinic:
        return Response({"error": "Clinique introuvable"}, status=404)
    return Response(normalize_mongo_doc(clinic))

@api_view(['POST'])
def clinic_enter_view(request, clinic_id):
    clinic = collections['clinics'].find_one({"_id": ObjectId(clinic_id), "is_active": True})
    if not clinic:
        return Response({"error": "Clinique introuvable"}, status=404)
    clinic = normalize_mongo_doc(clinic)
    # On renvoie seulement ce qui est nécessaire pour le thème
    return Response({
        "id": clinic["_id"],
        "name": clinic["name"],
        "logo": clinic.get("logo_url", "/default-clinic.png"),
        "primaryColor": clinic.get("primary_color", "#14b8a6"),
        "secondaryColor": clinic.get("secondary_color", "#06b6d4")
    })

# ------------------------------------------------------------------
# 3. Docteurs de la clinique
# ------------------------------------------------------------------
# api/views.py

@api_view(['GET'])
@permission_classes([AllowAny])  # ou IsAuthenticated selon ton besoin
def clinic_doctors_view(request, clinic_id):
    try:
        # Valider l'ObjectId
        clinic_oid = ObjectId(clinic_id)
    except:
        return Response({"error": "ID de clinique invalide"}, status=400)

    pipeline = [
        {"$match": {"clinic_id": clinic_oid}},
        {"$lookup": {
            "from": "users",
            "localField": "doctor_username",
            "foreignField": "username",
            "as": "doctor_info"
        }},
        {"$unwind": "$doctor_info"},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "username": "$doctor_info.username",
            "first_name": "$doctor_info.first_name",
            "last_name": "$doctor_info.last_name",
            "specialty": "$doctor_info.specialty",
            "phone": "$doctor_info.phone",
            "email": "$doctor_info.email",
            "rating": {"$ifNull": ["$doctor_info.rating", 4.5]}
        }}
    ]

    doctors = list(collections['clinic_doctors'].aggregate(pipeline))

    # Sécurité supplémentaire : convertir tous les ObjectId restants
    for doc in doctors:
        if isinstance(doc.get('_id'), ObjectId):
            doc['_id'] = str(doc['_id'])
    return Response(doctors)

# ------------------------------------------------------------------
# 4. Factures
# ------------------------------------------------------------------
@api_view(['GET'])
def clinic_invoices_view(request, clinic_id):
    invoices = list(collections['clinic_invoices'].find({
        "clinic_id": ObjectId(clinic_id)
    }).sort("issued_at", -1))
    return Response([normalize_mongo_doc(i) for i in invoices])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clinic_invoice_create_view(request, clinic_id):
    data = request.data
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{collections['clinic_invoices'].count_documents({})+1:04d}"

    invoice = {
        "invoice_number": invoice_number,
        "clinic_id": ObjectId(clinic_id),
        "clinic_name": data.get("clinic_name", "Clinique"),
        "patient_username": data["patient_username"],
        "patient_name": data["patient_name"],
        "items": data.get("items", []),
        "total_tnd": float(data["amount"]),
        "status": "pending",
        "issued_at": datetime.utcnow(),
        "description": data.get("description", "")
    }
    result = collections['clinic_invoices'].insert_one(invoice)
    return Response({"id": str(result.inserted_id), "invoice_number": invoice_number})

@api_view(['GET'])
def clinic_invoice_pdf_view(request, clinic_id, invoice_id):
    invoice = collections['clinic_invoices'].find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        return Response(status=404)

    clinic = collections['clinics'].find_one({"_id": ObjectId(clinic_id)})

    html = f"""
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><style>
      body {{ font-family: DejaVu Sans, Arial; direction: rtl; text-align: right; padding: 40px; }}
      .header {{ text-align: center; margin-bottom: 50px; }}
      table {{ width: 100%; border-collapse: collapse; margin: 30px 0; }}
      th, td {{ border: 1px solid #ccc; padding: 12px; }}
      th {{ background: #f0f0f0; }}
      .total {{ font-size: 1.5em; font-weight: bold; }}
    </style></head><body>
      <div class="header">
        <h1>{clinic.get('name', 'Clinique')}</h1>
        <p>{clinic.get('address', '')}<br>Tél: {clinic.get('phone', '')}</p>
      </div>
      <h2>Facture {invoice['invoice_number']}</h2>
      <p>Date: {datetime.now().strftime('%d/%m/%Y')}</p>
      <p>Patient: {invoice['patient_name']}</p>
      <table>
        <tr><th>Description</th><th>Montant</th></tr>
        {"".join(f"<tr><td>{item.get('description','Acte')}</td><td>{item.get('amount',0)} TND</td></tr>" for item in invoice.get('items',[]))}
        <tr><td class="total">Total</td><td class="total">{invoice['total_tnd']} TND</td></tr>
      </table>
      <p>Merci pour votre confiance !</p>
    </body></html>
    """

    pdf = pdfkit.from_string(html, False)
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{invoice["invoice_number"]}.pdf"'
    return response

# ------------------------------------------------------------------
# 5. RDV & Requêtes (exemple rapide - tu peux les étendre)
# ------------------------------------------------------------------
@api_view(['GET'])
def clinic_appointments_view(request, clinic_id):
    # Retourne des faux RDV pour le moment
    return Response([
        {"id": "1", "patient_name": "Ali Ben Salah", "doctor_name": "Dr. Ahmed", "appointment_date": "2025-04-05T10:00:00", "reason": "Consultation"},
        {"id": "2", "patient_name": "Sofia Chaari", "doctor_name": "Dr. Amina", "appointment_date": "2025-04-05T14:30:00", "reason": "Contrôle"}
    ])

@api_view(['GET'])
def clinic_requests_view(request, clinic_id):
    return Response([
        {"id": "1", "patient_name": "Karim Zidi", "type": "Analyse sanguine", "requested_at": "2025-04-04", "status": "pending"}
    ])
@api_view(['GET'])
def staff_clinic_view(request, username):
    # Trouve le lien clinic_staff
    staff_link = collections['clinic_staff'].find_one({"user_username": username})
    if not staff_link:
        return Response({"error": "Aucune clinique associée"}, status=404)
    
    clinic = collections['clinics'].find_one({"_id": staff_link["clinic_id"]})
    if not clinic:
        return Response({"error": "Clinique introuvable"}, status=404)
    
    return Response(normalize_mongo_doc(clinic))
from bson import ObjectId

# View pour les plans
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response


# Plans management views
@api_view(['GET', 'POST'])
def plans_list_view(request):
    # Créer des plans initiaux
    p=plans.find()
    if not p:
        initial_plans = [
        {
            "name": "free",
            "price_monthly": 0,
            "price_yearly": 0,
            "storage_limit": 1 * 1024 * 1024 * 1024,  # 1GB
            "features": [
                "Profil patient basique",
                "Suivi des signes vitaux",
                "Prédictions de risque limitées",
                "Support par email"
            ],
            "max_users": 1,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "pro",
            "price_monthly": 49,
            "price_yearly": 490,
            "storage_limit": 10 * 1024 * 1024 * 1024,  # 10GB
            "features": [
                "Toutes les fonctionnalités Free",
                "Prédictions de risque avancées",
                "Documents médicaux illimités",
                "Analyses détaillées",
                "Support prioritaire",
                "Export de données"
            ],
            "max_users": 5,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "enterprise",
            "price_monthly": 199,
            "price_yearly": 1990,
            "storage_limit": 100 * 1024 * 1024 * 1024,  # 100GB
            "features": [
                "Toutes les fonctionnalités Pro",
                "Multi-cliniques",
                "API personnalisée",
                "Support 24/7",
                "Formation personnalisée",
                "SLA garantie",
                "Intégrations personnalisées"
            ],
            "max_users": 50,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        ]

        for plan in initial_plans:
            plans.insert_one(plan)

    if request.method == 'GET':
        try:
            
            planss = list(plans.find({}))
            for plan in planss:
                plan['id'] = str(plan['_id'])
                plan['_id'] = str(plan['_id'])
            return Response(planss)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            data = request.data.copy()
            
            # Validation des champs requis
            required_fields = ['name', 'price_monthly', 'price_yearly', 'storage_limit']
            for field in required_fields:
                if field not in data:
                    return Response({'error': f'Le champ {field} est requis'}, status=400)
            
            # Conversion du stockage en bytes
            if 'storage_limit' in data:
                try:
                    # Si c'est en GB, convertir en bytes
                    if data['storage_limit'] < 1000:  # Probablement en GB
                        data['storage_limit'] = int(data['storage_limit'] * 1024 * 1024 * 1024)
                except:
                    pass
            
            # Définir les valeurs par défaut
            data['features'] = data.get('features', [])
            data['max_users'] = data.get('max_users', 1)
            data['is_active'] = data.get('is_active', True)
            
            # Vérifier que le nom est unique
            existing_plan = plans.find_one({'name': data['name']})
            if existing_plan:
                return Response({'error': 'Un plan avec ce nom existe déjà'}, status=400)
            
            # Insérer dans MongoDB
            result = plans.insert_one(data)
            
            # Récupérer le plan créé
            plan = plans.find_one({'_id': result.inserted_id})
            plan['id'] = str(plan['_id'])
            plan['_id'] = str(plan['_id'])
            
            return Response(plan, status=201)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def plan_detail_view(request, plan_id):
    """Get, update or delete a specific plan"""
    try:
        plan_oid = ObjectId(plan_id)
    except:
        return Response({'error': 'ID de plan invalide'}, status=400)
    
    if request.method == 'GET':
        try:
            plan = plans.find_one({'_id': plan_oid})
            if not plan:
                return Response({'error': 'Plan non trouvé'}, status=404)
            
            plan['id'] = str(plan['_id'])
            plan['_id'] = str(plan['_id'])
            return Response(plan)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'PATCH':
        try:
            data = request.data.copy()
            
            # Champs autorisés à être modifiés
            allowed_fields = ['name', 'price_monthly', 'price_yearly', 'storage_limit', 
                            'features', 'max_users', 'is_active']
            
            update_data = {}
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            # Conversion du stockage si nécessaire
            if 'storage_limit' in update_data:
                try:
                    # Si c'est en GB, convertir en bytes
                    if update_data['storage_limit'] < 1000:  # Probablement en GB
                        update_data['storage_limit'] = int(update_data['storage_limit'] * 1024 * 1024 * 1024)
                except:
                    pass
            
            # Vérifier l'unicité du nom si on le modifie
            if 'name' in update_data:
                existing_plan = plans.find_one({
                    'name': update_data['name'],
                    '_id': {'$ne': plan_oid}
                })
                if existing_plan:
                    return Response({'error': 'Un plan avec ce nom existe déjà'}, status=400)
            
            # Mettre à jour le plan
            result = plans.update_one(
                {'_id': plan_oid},
                {'$set': update_data}
            )
            
            if result.matched_count == 0:
                return Response({'error': 'Plan non trouvé'}, status=404)
            
            # Récupérer le plan mis à jour
            updated_plan = plans.find_one({'_id': plan_oid})
            updated_plan['id'] = str(updated_plan['_id'])
            updated_plan['_id'] = str(updated_plan['_id'])
            
            return Response(updated_plan)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'DELETE':
        try:
            result = plans.delete_one({'_id': plan_oid})
            
            if result.deleted_count == 0:
                return Response({'error': 'Plan non trouvé'}, status=404)
            
            return Response({'message': 'Plan supprimé avec succès'}, status=204)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
# View pour mettre à jour un rendez-vous
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_appointment_view(request, appointment_id):
    try:
        appointment_oid = ObjectId(appointment_id)
    except:
        return Response({'error': 'Invalid appointment ID'}, status=400)
    
    data = request.data
    allowed_updates = ['status', 'appointment_date', 'reason']
    update_data = {}
    
    for field in allowed_updates:
        if field in data:
            update_data[field] = data[field]
    
    if not update_data:
        return Response({'error': 'No valid fields to update'}, status=400)
    
    result = collections['appointments'].update_one(
        {'_id': appointment_oid},
        {'$set': update_data}
    )
    
    if result.modified_count:
        appointment =collections['Appointments'].find_one({'_id': appointment_oid})
        appointment['id'] = str(appointment['_id'])
        return Response(appointment)
    
    return Response({'error': 'Appointment not found'}, status=404)
# Dans api/views.py
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_user_detail_view(request, user_id):
    # Cette vue gère la mise à jour et suppression des utilisateurs
    if request.method == 'GET':
        user = collections['users'].find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)
        user['id'] = str(user['_id'])
        return Response(user)
    
    elif request.method == 'PATCH':
        data = request.data
        
        # Liste des champs autorisés à être modifiés
        allowed_fields = ['first_name', 'last_name', 'email', 'phone', 
                         'specialty', 'consultation_price', 'is_active',
                         'role', 'avatar_url']
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return Response({'error': 'No valid fields to update'}, status=400)
        
        result = collections['users'].update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.modified_count:
            user = collections['users'].find_one({'_id': ObjectId(user_id)})
            user['id'] = str(user['_id'])
            return Response(user)
        
        return Response({'error': 'User not found'}, status=404)
    
    elif request.method == 'DELETE':
        # Soft delete - marquer comme inactif
        result = collections['users'].update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': False}}
        )
        
        if result.modified_count:
            return Response({'message': 'User deactivated successfully'}, status=200)
        
        return Response({'error': 'User not found'}, status=404)