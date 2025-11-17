"""
Expedix URLs - Django REST Framework Router
Replaces Node.js Express routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_consultation import ConsultationViewSet, PrescriptionViewSet
from .views_medications import MedicationViewSet, DiagnosisViewSet
from .simple_views import SimplePatientViewSet, SimpleConsultationViewSet, SimplePrescriptionViewSet
from .views import ScheduleConfigView


# Create DRF router
router = DefaultRouter()
# ✅ ARQUITECTURA SIMPLIFICADA - usar views simples
router.register(r'patients', SimplePatientViewSet, basename='patients')
router.register(r'consultations', ConsultationViewSet, basename='consultations')  # Use the real consultation views
router.register(r'medical-history', views.MedicalHistoryViewSet)
router.register(r'prescriptions', PrescriptionViewSet, basename='prescriptions')  # Use the real prescription views
router.register(r'users', views.UserViewSet)
# router.register(r'schedule-config', views.ScheduleConfigViewSet, basename='schedule-config')
router.register(r'debug-auth', views.DebugAuthViewSet, basename='debug-auth')
router.register(r'dual-system-test', views.DualSystemTestViewSet, basename='dual-system-test')
# Configuration endpoints
router.register(r'configuration', views.ExpedixConfigurationViewSet, basename='expedix-config')
router.register(r'consultation-templates', views.ConsultationTemplateViewSet, basename='consultation-templates')
# Medication and diagnosis endpoints
router.register(r'medications', MedicationViewSet, basename='medications')
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnoses')
# Centralized consultation management
router.register(r'consultation-central', views.ConsultationCentralViewSet, basename='consultation-central')

# URL patterns that match Node.js API routes
urlpatterns = [
    # DRF router URLs
    path('', include(router.urls)),
    
    # Specific endpoints to match Node.js API exactly
    path('patients/search/', views.PatientViewSet.as_view({'get': 'search'}), name='patient-search'),
    path('patients/stats/', views.PatientViewSet.as_view({'get': 'stats'}), name='patient-stats'),
    path('patients/<uuid:pk>/next-appointment/', views.PatientViewSet.as_view({'get': 'next_appointment'}), name='patient-next-appointment'),
    path('consultations/upcoming/', views.ConsultationViewSet.as_view({'get': 'upcoming'}), name='consultations-upcoming'),
    path('consultations/by-patient/', views.ConsultationViewSet.as_view({'get': 'by_patient'}), name='consultations-by-patient'),
    path('medical-history/by-patient/', views.MedicalHistoryViewSet.as_view({'get': 'by_patient'}), name='medical-history-by-patient'),
    path('prescriptions/by-patient/', views.PrescriptionViewSet.as_view({'get': 'by_patient'}), name='prescriptions-by-patient'),
    path('prescriptions/by-professional/', views.PrescriptionViewSet.as_view({'get': 'by_professional'}), name='prescriptions-by-professional'),
    path('users/me/', views.UserViewSet.as_view({'get': 'me'}), name='user-profile'),
    path("schedule-config/", ScheduleConfigView.as_view(), name="schedule-config"),
]