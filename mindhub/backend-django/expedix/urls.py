"""
Expedix URLs - Django REST Framework Router
Replaces Node.js Express routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create DRF router
router = DefaultRouter()
router.register(r'patients', views.PatientViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'medical-history', views.MedicalHistoryViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'schedule-config', views.ScheduleConfigViewSet, basename='schedule-config')
router.register(r'debug-auth', views.DebugAuthViewSet, basename='debug-auth')
router.register(r'dual-system-test', views.DualSystemTestViewSet, basename='dual-system-test')

# URL patterns that match Node.js API routes
urlpatterns = [
    # DRF router URLs
    path('', include(router.urls)),
    
    # Specific endpoints to match Node.js API exactly
    path('patients/search/', views.PatientViewSet.as_view({'get': 'search'}), name='patient-search'),
    path('patients/stats/', views.PatientViewSet.as_view({'get': 'stats'}), name='patient-stats'),
    path('consultations/upcoming/', views.ConsultationViewSet.as_view({'get': 'upcoming'}), name='consultations-upcoming'),
    path('consultations/by-patient/', views.ConsultationViewSet.as_view({'get': 'by_patient'}), name='consultations-by-patient'),
    path('medical-history/by-patient/', views.MedicalHistoryViewSet.as_view({'get': 'by_patient'}), name='medical-history-by-patient'),
    path('users/me/', views.UserViewSet.as_view({'get': 'me'}), name='user-profile'),
]