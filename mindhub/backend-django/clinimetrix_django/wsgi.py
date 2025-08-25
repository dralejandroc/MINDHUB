"""
WSGI config for clinimetrix_django project.
Optimized for Vercel deployment.
"""

import os
from django.core.wsgi import get_wsgi_application

# Force production settings for Vercel
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings_vercel')

# Set required environment variables if not present
if not os.environ.get('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'django-insecure-vercel-deployment-key-2025'

if not os.environ.get('ALLOWED_HOSTS'):
    os.environ['ALLOWED_HOSTS'] = '.vercel.app,mindhub.cloud,.mindhub.cloud'

# Database credentials (fallback)
if not os.environ.get('DB_PASSWORD'):
    os.environ['DB_PASSWORD'] = '53AlfaCoca.'

try:
    application = get_wsgi_application()
    app = application
except Exception as e:
    print(f"WSGI Error: {e}")
    # Create a simple fallback application
    from django.http import JsonResponse
    
    def simple_app(environ, start_response):
        response = JsonResponse({
            'error': 'Django startup failed',
            'message': str(e),
            'vercel_env': os.environ.get('VERCEL_ENV'),
            'django_settings': os.environ.get('DJANGO_SETTINGS_MODULE')
        })
        
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'application/json')]
        start_response(status, response_headers)
        
        return [response.content]
    
    app = simple_app
