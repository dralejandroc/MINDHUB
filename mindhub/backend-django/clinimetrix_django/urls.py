"""
ClinimetrixPro URL Configuration
Professional medical assessment platform
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('auth/', include('allauth.urls')),
    path('accounts/', include('accounts.urls')),
    
    # Core functionality
    path('', include('clinimetrix_core.urls')),
    path('api/scales/', include('psychometric_scales.urls')),        # ✅ CAMBIAR con prefijo api
    path('api/assessments/', include('assessments.urls')),           # ✅ CAMBIAR con prefijo api
    path('api/clinimetrix-pro/', include('assessments.urls')),       # ✅ AGREGAR alias
    
    # Legacy paths (mantener por compatibilidad)
    path('scales/', include('psychometric_scales.urls')),
    path('assessments/', include('assessments.urls')),
    
    # FormX - Dynamic Form Builder
    path('formx/', include('formx.urls')),
    
    # MindHub Core Modules
    path('api/expedix/', include('expedix.urls')),  # Expedix - Patient Management
    path('api/agenda/', include('agenda.urls')),    # Agenda - Appointment System
    path('api/resources/', include('resources.urls')),  # Resources - Medical Resources
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Serve scales JSON files
    urlpatterns += static('/scales/', document_root=settings.BASE_DIR / 'scales')
