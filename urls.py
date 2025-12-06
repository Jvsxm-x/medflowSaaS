from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import register_view, RecordsView, predict_view, retrain_view, PatientProfileViewSet, AlertViewSet, RecordsStatsView

router = DefaultRouter()
router.register('patients', PatientProfileViewSet, basename='patient')
router.register('alerts', AlertViewSet, basename='alert')

urlpatterns = [
    path('auth/register/', register_view),
    path('records/', RecordsView.as_view()),
    path('predict/', predict_view),
    path('retrain/', retrain_view),
    path('records/stats/', RecordsStatsView.as_view()),
    path('', include(router.urls)),
]
