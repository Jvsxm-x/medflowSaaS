import datetime
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .mongo_models import collections  # For sync

class MedicalRecords(models.Model):
    allergies = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    surgeries = models.TextField(blank=True)
    family_history = models.TextField(blank=True)

    def __str__(self):
        return f"MedicalRecords({self.id})"

class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=20, default='patient')
    address = models.CharField(max_length=255, null=True, blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    medical_history = models.OneToOneField(MedicalRecords, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Alert(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=20)
    message = models.TextField()
    acknowledged = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert({self.level} - {self.patient})"

def upload_to_instance_dir(instance, filename):
    return f'uploads/{instance.patient.user.username}/{filename}'

class MedicalRecordFile(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    file = models.FileField(upload_to=upload_to_instance_dir)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"MedicalRecordFile({self.file.name} - {self.patient})"

# Add other models (e.g., ChatMessage, VitalsRecord, etc.) without truncation
class ChatMessage(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.CharField(max_length=20)  # 'patient' or 'system'

    def __str__(self):
        return f"ChatMessage({self.sender} - {self.patient} at {self.timestamp})"

class VitalsRecord(models.Model):
    id=models.AutoField(primary_key=True)
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    systolic = models.FloatField()
    diastolic = models.FloatField()
    glucose = models.FloatField()
    heart_rate = models.FloatField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VitalsRecord({self.patient} at {self.recorded_at})"
class VitalRecord(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='vitals')
    systolic = models.FloatField()
    diastolic = models.FloatField()
    glucose = models.FloatField()
    heart_rate = models.FloatField()
    spo2 = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.timestamp}"
# ... (Add all other models like NutritionLog, MentalHealthEntry, etc., as in original)
class NutritionLog(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    date = models.DateField()
    calories = models.IntegerField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fats = models.FloatField()

    def __str__(self):
        return f"NutritionLog({self.patient} on {self.date})"
class MentalHealthEntry(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    entry_date = models.DateField()
    mood = models.CharField(max_length=50)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"MentalHealthEntry({self.patient} on {self.entry_date})"
class plans(models.Model):
    name    = models.CharField(max_length=50)
    price_monthly   = models.CharField(max_length=50)
    price_yearly   = models.CharField(max_length=50)
    storage_limit  = models.CharField(max_length=50)
    features  = models.CharField(max_length=50)
    max_users = models.CharField(max_length=50)
    is_active    = models.CharField(max_length=50)
    created_at= models.CharField(max_length=50)

# Signals for SQL-Mongo sync
@receiver(post_save, sender=User)
def sync_user_to_mongo(sender, instance, created, **kwargs):
    if created:
        collections['users'].update_one(
            {"username": instance.username},
            {"$set": {
                "email": instance.email,
                "first_name": instance.first_name,
                "last_name": instance.last_name,
                "created_at": datetime.utcnow()
            }},
            upsert=True
        )

@receiver(post_delete, sender=PatientProfile)
def delete_related_mongo(sender, instance, **kwargs):
    username = instance.user.username
    collections['vitals_records'].delete_many({"patient_username": username})
    collections['alerts'].delete_many({"patient_username": username})
    # Add for other collections
    collections['chat_histories'].delete_many({"patient_username": username})
    collections['appointments'].delete_many({"patient_username": username})
    # Add more as needed
@receiver(post_save, sender=Alert)
def sync_alert_to_mongo(sender, instance, created, **kwargs):
    if created:
        collections['alerts'].update_one(
            {"_id": str(instance.id)},
            {"$set": {
                "patient_username": instance.patient.user.username,
                "level": instance.level,
                "message": instance.message,
                "created_at": instance.created_at,
                "acknowledged": instance.acknowledged
            }},
            upsert=True
        )
@receiver(post_delete, sender=Alert)
def delete_alert_from_mongo(sender, instance, **kwargs):
    collections['alerts'].delete_one({"_id": str(instance.id)})

# Add similar signals for other models as needed
# MongoDB Collections Schema Documentation:
# clinics collection:
# {
#   _id: ObjectId,
#   name: "Clinique El Manar",
#   logo_url: "https://...",
#   primary_color: "#1e40af",
#   secondary_color: "#06b6d4",
#   address: "Tunis, Tunisia",
#   latitude: 36.8189,
#   longitude: 10.1658,
#   phone: "+216 71 234 567",
#   rating: 4.8,
#   review_count: 128,
#   is_active: true,
#   created_at: ISODate
# }
# 
# clinic_staff:
# {
#   clinic_id: ObjectId("..."),
#   user_username: "staff1",
#   role: "receptionist" | "admin" | "billing"
# }
# 
# clinic_doctors:
# {
#   clinic_id: ObjectId,
#   doctor_username: "dr.ahmed",
#   is_active: true
# }
# 
# clinic_themes (optional, can be inside clinics):
# {
#   clinic_id: ObjectId,
#   logo_light: "...",
#   logo_dark: "...",
#   favicon: "...",
#   primary: "#1e40af",
#   accent: "#06b6d4"
# }