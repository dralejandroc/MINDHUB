"""
ClinimetrixPro URL Configuration
Professional medical assessment platform
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import RedirectView
from test_endpoint import test_patients

def api_root(request):
    """API root endpoint - Django backend serves only APIs"""
    return JsonResponse({
        'service': 'MindHub Django Backend',
        'version': '1.0',
        'status': 'active',
        'message': 'This is an API-only backend. Frontend is served at https://mindhub.cloud',
        'available_apis': [
            '/api/expedix/ - Patient Management',
            '/api/agenda/ - Appointment System', 
            '/api/resources/ - Medical Resources',
            '/api/clinics/ - Multi-user Management',
            '/api/finance/ - Financial Management',
            '/assessments/ - ClinimetrixPro Assessment Engine',
            '/scales/ - Psychometric Scale Data',
            '/admin/ - Django Admin'
        ]
    })

urlpatterns = [
    # API Root - Shows available endpoints
    path('', api_root, name='api_root'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('auth/', include('allauth.urls')),
    path('accounts/', include('accounts.urls')),
    
    # ClinimetrixPro API endpoints (no frontend pages)
    path('assessments/', include('assessments.urls')),
    
    # API endpoints  
    path('scales/', include('psychometric_scales.urls')),
    
    # FormX - Dynamic Form Builder
    path('formx/', include('formx.urls')),
    
    # MindHub Core Modules
    path('api/expedix/', include('expedix.urls')),  # Expedix - Patient Management
    path('api/agenda/', include('agenda.urls')),    # Agenda - Appointment System
    path('api/resources/', include('resources.urls')),  # Resources - Medical Resources
    path('api/clinics/', include('clinics.urls')),  # Clinics - Multi-user Management
    path('api/finance/', include('finance.urls')),  # Finance - Financial Management
    path('api/frontdesk/', include('assessments.frontdesk_urls')),  # FrontDesk endpoints
    
    # Debug/Test endpoints
    path('test-patients/', test_patients, name='test_patients'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Serve scales JSON files
    urlpatterns += static('/scales/', document_root=settings.BASE_DIR / 'scales')
