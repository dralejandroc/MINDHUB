"""
Minimal URL Configuration for debugging Vercel deployment
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django is running on Vercel!',
        'debug': True
    })

def test_api(request):
    return JsonResponse({
        'success': True,
        'message': 'Django API is working',
        'method': request.method
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    path('api/test/', test_api, name='test_api'),
    # Only include expedix for basic testing
    path('api/expedix/', include('expedix.urls')),
]