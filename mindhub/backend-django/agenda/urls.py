"""
Agenda URLs - Django REST Framework Router
Replaces Node.js Express routing for appointment system
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create DRF router
router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'appointment-history', views.AppointmentHistoryViewSet)
router.register(r'provider-schedules', views.ProviderScheduleViewSet)
router.register(r'schedule-blocks', views.ScheduleBlockViewSet)
router.register(r'waiting-list', views.WaitingListViewSet)

# URL patterns that match Node.js API routes
urlpatterns = [
    # DRF router URLs
    path('', include(router.urls)),
    
    # Specific endpoints to match Node.js API exactly
    path('appointments/by-patient/', views.AppointmentViewSet.as_view({'get': 'by_patient'}), name='appointments-by-patient'),
    path('appointments/upcoming/', views.AppointmentViewSet.as_view({'get': 'upcoming'}), name='appointments-upcoming'),
    path('appointments/stats/', views.AppointmentViewSet.as_view({'get': 'stats'}), name='appointments-stats'),
    path('appointments/provider-schedule/', views.AppointmentViewSet.as_view({'get': 'provider_schedule'}), name='provider-schedule'),
    path('appointments/<uuid:pk>/confirm/', views.AppointmentViewSet.as_view({'post': 'confirm'}), name='appointment-confirm'),
    path('appointments/<uuid:pk>/cancel/', views.AppointmentViewSet.as_view({'post': 'cancel'}), name='appointment-cancel'),
    
    # Waiting list specific endpoints
    path('waiting-list/<uuid:pk>/contact/', views.WaitingListViewSet.as_view({'post': 'contact'}), name='waiting-list-contact'),
    path('waiting-list/<uuid:pk>/schedule/', views.WaitingListViewSet.as_view({'post': 'schedule'}), name='waiting-list-schedule'),
]