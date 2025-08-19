"""
WSGI config for clinimetrix_django project.
Optimized for Vercel deployment.
"""

import os
from django.core.wsgi import get_wsgi_application

# Use Vercel-specific settings if deployed on Vercel
if os.environ.get('VERCEL_ENV'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings_vercel')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings')

application = get_wsgi_application()

# Vercel handler
app = application
