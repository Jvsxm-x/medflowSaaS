# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AlertViewSet, PatientProfileView, PatientProfileViewSet, admin_users_list, admin_users_list_view, appointments_list_view, clinic_appointments_view, clinic_detail_view, clinic_doctors_view, clinic_enter_view, clinic_invoice_create_view, clinic_invoice_pdf_view, clinic_invoices_view, clinic_list_view, clinic_recommended_view, clinic_requests_view, delete_patient_document, doctor_dashboard, doctor_document_reviews, list_doctors, my_lab_orders, order_lab_test, patient_documents, patient_lab_orders, patients_list_view, plan_detail_view, plans_list_view, records_stats, review_medical_document, staff_clinic_view, storage_usage, update_appointment_view, update_lab_order, upload_patient_document

# Toutes tes vues MongoDB (issues du views.py réécrit)
from .views import (
    # Auth
    PatientProfileView,
    get_doctors_list,
    register_view,
    login_view,
    profile_view,           # GET + PATCH profil utilisateur
    my_profile_view,        # Ancien endpoint conservé si utilisé côté front

    # Records (vitals)
    RecordsView,
    record_detail,
    latest_record,
    RecordsStatsView,

    # Alerts
    alerts_view,
    acknowledge_alert,

    # Chatbot Groq
    groq_chat,
    get_chat_history,

    # ML
    predict_view,
    retrain_view,

    # Doctor dashboard
    patients_list,

    # Profil patient / docteur (Mongo only)
    patient_profile_view,      # /patients/profile/
    patient_profile_view1,     # /doctors/profile/<username>/

    # Pro upgrade
    upgrade_to_pro,

    # Appointments
    appointments_view,
)

# Plus aucun ViewSet basé sur Django ORM → on retire le router
# (PatientProfileViewSet et AlertViewSet n'existent plus)
# router = DefaultRouter()
# → Commenté / supprimé
router = DefaultRouter()
# router.register(r'patients', PatientProfileViewSet, basename='patient')
# router.register(r'alerts', AlertViewSet, basename='alert')
# router.register(r'auth/doctors', PatientProfileViewSet, basename='patient')
urlpatterns = [
    # ====================== AUTH ======================
path('patients/', patients_list_view, name='patients-list'),
    path('auth/register/', register_view, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/profile/', profile_view, name='profile'),        # GET + PATCH
    path('auth/my-profile/', my_profile_view, name='my-profile'),  # conservé pour compatibilité

    # ====================== VITALS RECORDS ======================
    path('records/', RecordsView.as_view(), name='records-list-create'),
    path('records/', records_stats, name='record-detail'),
    path('records/latest/', latest_record, name='latest-record'),
    path('records/stats/', records_stats, name='records-stats'),

    # ====================== ALERTS ======================
    path('alerts/', alerts_view, name='alerts-list'),
    path('alerts/<str:alert_id>/acknowledge/', acknowledge_alert, name='acknowledge-alert'),

    # ====================== CHATBOT GROQ ======================
    path('chat/', groq_chat, name='groq-chat'),
    path('chat/history/', get_chat_history, name='chat-history'),

    # ====================== MACHINE LEARNING ======================
    path('predict/', predict_view, name='predict'),
    path('retrain/', retrain_view, name='retrain'),

    # ====================== DOCTOR DASHBOARD ======================
    path('doctor/patients/', patients_list, name='doctor-patients-list'),
path('doctor/documents/', doctor_document_reviews, name='doctor-documents'),
path('doctor/document/<str:doc_id>/review/', review_medical_document, name='review-document'),
path('doctor/dashboard/', doctor_dashboard, name='doctor-dashboard'),
path('auth/doctors/list/', list_doctors, name='list-doctors'),
    # ====================== PROFIL PUBLIC ======================
    path('patients/profile/<str:username>/', patient_profile_view, name='patient-profile'),     # patient ou docteur générique
    path('doctors/profile/<str:username>/', patient_profile_view1, name='doctor-profile'),      # version enrichie pour docteurs

    # ====================== UPGRADE ======================
    path('upgrade-to-pro/', upgrade_to_pro, name='upgrade-to-pro'),

    # ====================== APPOINTMENTS ======================
    path('medical/appointments/', appointments_view, name='appointments'),
        path('auth/doctors/list/', get_doctors_list, name='doctors-list'),
    # ====================== ROUTER (vide maintenant) ======================
path('lab/order/', order_lab_test, name='order-lab-test'),
path('lab/my-orders/', my_lab_orders, name='my-lab-orders'),
path('lab/order/<str:order_id>/', update_lab_order, name='update-lab-order'),
path('patient/upload-document/', upload_patient_document, name='upload-patient-document'),
    path('patient/documents/', patient_documents, name='patient-documents'),
    path('patient/document/<str:doc_id>/', delete_patient_document, name='delete-patient-document'),
    path('lab-orders/patient/', patient_lab_orders, name='patient_lab_orders'),
      path('lab-orders/Alerts/', patient_lab_orders, name='patient_lab_orders'),
      # api/urls.py
path('storage/usage/', storage_usage, name='storage_usage'),
    # path('', include(router.urls)),


path('admin/users/', admin_users_list_view, name='admin-users-list'),
path('admin/users/<str:id>/', admin_users_list, name='admin-users-list'),

#clinics 
# Clinic System 
# ====================== CLINICS ======================
#api/
path('clinics/', clinic_list_view, name='clinic-list'),
path('clinics/recommended/', clinic_recommended_view, name='clinic-recommended'),
path('clinics/<str:clinic_id>/', clinic_detail_view, name='clinic-detail'),
path('clinics/<str:clinic_id>/enter/', clinic_enter_view, name='clinic-enter'),
path('clinics/<str:clinic_id>/doctors/', clinic_doctors_view, name='clinic-doctors'),
path('clinics/<str:clinic_id>/invoices/', clinic_invoices_view, name='clinic-invoices'),
path('clinics/<str:clinic_id>/invoices/create/', clinic_invoice_create_view, name='clinic-invoice-create'),
path('clinics/<str:clinic_id>/invoices/<str:invoice_id>/pdf/', clinic_invoice_pdf_view, name='clinic-invoice-pdf'),
path('clinics/<str:clinic_id>/appointments/', clinic_appointments_view),
path('clinics/<str:clinic_id>/requests/', clinic_requests_view),
path('clinics/staff/<str:username>/clinic/', staff_clinic_view),

path('dashboard/appointments/', appointments_view, name='appointments'),
# Plans management
path('plans/', plans_list_view, name='plans-list'),
path('plans/<str:plan_id>/', plan_detail_view, name='plan-detail'),

# Appointments update
path('appointments/<str:appointment_id>/', update_appointment_view, name='update-appointment'),
    path('all/appointments/', appointments_list_view, name='appointments'),

]