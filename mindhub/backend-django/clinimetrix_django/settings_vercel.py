"""
Django settings for Vercel deployment
Production-optimized settings for FormX + ClinimetrixPro
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-vercel-deployment-key-2025')

# Override base settings for Vercel - TEMPORAL DEBUG para diagnóstico
DEBUG = True

# Application definition - COMPLETE MINDHUB APPS FOR PRODUCTION
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'rest_framework',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'guardian',
    'django_filters',
    'drf_spectacular',
    # MindHub Complete Apps
    'psychometric_scales',  # Scale Data Management  
    'assessments',  # ClinimetrixPro Assessment Engine
    'accounts',  # User accounts
    'formx',  # FormX - Dynamic Form Builder
    'expedix',  # Expedix - Patient Management System
    'agenda',  # Agenda - Appointment Scheduling
    'resources',  # Resources - Medical Resources Management
    'clinics',  # Multi-user Clinic Management System
    'finance',  # Finance - Financial Management & Income Tracking
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'middleware.supabase_auth.SupabaseAuthMiddleware',  # Re-enabled for production
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'clinimetrix_django.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'clinimetrix_django.wsgi.application'

# Database
# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Site ID for django.contrib.sites  
SITE_ID = 1

# Authentication
AUTH_USER_MODEL = 'accounts.User'

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend', 
    'guardian.backends.ObjectPermissionBackend',
]

# Django Allauth settings
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_LOGIN_METHODS = ['email']
ACCOUNT_SIGNUP_FIELDS = ['email', 'first_name', 'last_name', 'password1', 'password2']
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'MindHub Django API',
    'DESCRIPTION': 'Backend API for MindHub healthcare platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Vercel deployment settings
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.vercel.app',
    'mindhub.cloud',
    'www.mindhub.cloud',
    '.mindhub.cloud'
]

# Database - Use Supabase PostgreSQL (Transaction Pooler for Serverless)
# Using IPv4 shared pooler for Vercel compatibility (Transaction mode)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'postgres'),
        'USER': os.environ.get('DB_USER', 'postgres.jvbcpldzoyicefdtnwkd'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '53AlfaCoca.'),
        'HOST': os.environ.get('DB_HOST', 'aws-1-us-west-1.pooler.supabase.com'),
        'PORT': os.environ.get('DB_PORT', '6543'),  # Transaction pooler port
        'OPTIONS': {
            'sslmode': 'require',
            'connect_timeout': 10,
            'options': '-c statement_timeout=60000'  # 60 seconds timeout for serverless
        },
    }
}

# Static files configuration for Vercel
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 31536000
X_FRAME_OPTIONS = 'DENY'

# Don't enforce HTTPS redirect on Vercel (handled by platform)
SECURE_SSL_REDIRECT = False

# Cookie security
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# CORS settings for React frontend
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mindhub.cloud",
    "https://www.mindhub.cloud",
    "http://localhost:3000",  # For development
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    # Headers para el sistema dual de autenticación Supabase
    'x-proxy-auth',
    'x-user-id',
    'x-user-email',
    'x-mindhub-dual-system',
    'x-user-context',
    'x-client-info',
    'x-supabase-auth',
    'cache-control',
    'pragma',
]

# Supabase integration for production - CORREGIDO con keys válidos y nueva JWT secret
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://jvbcpldzoyicefdtnwkd.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ')

# Nueva JWT Secret Key - LEGACY JWT SECRET (la que funciona realmente) 30/08/25
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET', 'CxqGEm1Cpk1tKY5GPTxn+n0ywlE5B2y4B6a00S3ZbFMnP/pgYLa9FPNDoPanAn0w7XIdGP5o7yFV9XhR2oVEmw==')

# React frontend URL
REACT_FRONTEND_URL = os.environ.get('REACT_FRONTEND_URL', 'https://mindhub.cloud')

# Email configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = f'MindHub FormX <{EMAIL_HOST_USER}>'

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'formx': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'clinimetrix': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Custom settings for ClinimetrixPro
CLINIMETRIX_SETTINGS = {
    'ENABLE_ANALYTICS': True,
    'CACHE_SCALE_DATA': True,
    'MAX_CONCURRENT_ASSESSMENTS': 100,
}

# Cache configuration for production
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Optimize for Vercel serverless
USE_TZ = True
TIME_ZONE = 'UTC'

# Custom settings for FormX production
FORMX_SETTINGS = {
    'MAX_FILE_UPLOAD_SIZE': 10 * 1024 * 1024,  # 10MB
    'ALLOWED_FILE_TYPES': ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    'ENABLE_EMAIL_NOTIFICATIONS': True,
    'DEFAULT_FORM_EXPIRY_DAYS': 30,
}


print("🚀 Django configured for Vercel deployment")