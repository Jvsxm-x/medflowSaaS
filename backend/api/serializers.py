# backend/api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PatientProfile, Alert, VitalsRecord


# Serializer pour les champs du User qui existent vraiment
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['username', 'email']


# Serializer principal du profil patient (le plus important)
class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            'id',
            'user',
            'birth_date',
            'phone',
            'address',           # ← celui-ci est dans PatientProfile, pas dans User
            'emergency_contact',
            'medical_history',
            'role',
            'full_name'
        ]
        read_only_fields = ['role', 'user']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


# Pour l'inscription (tu avais déjà un bon serializer)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default='patient')

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'first_name', 'last_name')

    def create(self, validated_data):
        role = validated_data.pop('role', 'patient')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        PatientProfile.objects.create(user=user, role=role)
        return user


# Alertes
class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'


# Pour la prédiction ML
class VitalsSerializer(serializers.Serializer):
    class Meta:
        model = VitalsRecord
        fields = [
            'id',
            'systolic',
            'diastolic',
            'glucose',
            'heart_rate',
            'spo2',
            'temperature',
            'timestamp',
            'patient'  # on l'accepte en lecture, mais on l'ignore en écriture
        ]
        read_only_fields = ['timestamp', 'patient']  # très important !

    # Optionnel : pour afficher le nom du patient
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['patient_name'] = f"{instance.patient.user.first_name} {instance.patient.user.last_name}".strip()
        return ret
    def create(self, validated_data):
        request = self.context.get('request')
        patient_profile = PatientProfile.objects.get(user=request.user)
        validated_data['patient'] = patient_profile
        return super().create(validated_data)
    def update(self, instance, validated_data):
        # On n'autorise pas la mise à jour des enregistrements vitaux pour l'instant
        raise NotImplementedError("Updating vitals records is not supported.")
class VitalsRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalsRecord
        fields = '__all__'

    def create(self, validated_data):
        return VitalsRecord.objects.create(**validated_data)
