"""
Clinic URLs - Django REST Framework Router
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create DRF router
router = DefaultRouter()
router.register(r'clinics', views.ClinicViewSet)
router.register(r'invitations', views.ClinicInvitationViewSet)
router.register(r'profiles', views.ClinicProfileViewSet)

# URL patterns
urlpatterns = [
    # DRF router URLs
    path('', include(router.urls)),
    
    # Specific clinic endpoints
    path('invitations/accept/', views.ClinicInvitationViewSet.as_view({'post': 'accept'}), name='accept-invitation'),
]