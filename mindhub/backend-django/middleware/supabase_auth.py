"""
Supabase Authentication Middleware for Django
Handles JWT token validation from React frontend
"""
import jwt
import requests
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class SupabaseAuthMiddleware(MiddlewareMixin):
    """
    Middleware to validate Supabase JWT tokens from React frontend
    """
    
    def __init__(self, get_response=None):
        self.get_response = get_response
        super().__init__(get_response)
    
    def __call__(self, request):
        # Only process API endpoints that need React integration
        if self.should_process_auth(request):
            auth_result = self.validate_supabase_auth(request)
            if not auth_result['valid']:
                return JsonResponse({
                    'success': False,
                    'error': auth_result['error']
                }, status=401)
            
            # Set authenticated user
            request.user = auth_result['user']
        
        response = self.get_response(request)
        return response
    
    def should_process_auth(self, request):
        """
        Determine if this request needs Supabase auth validation
        """
        # Only validate auth for specific bridge endpoints  
        bridge_paths = [
            '/assessments/api/create-from-react/',  # ✅ ACTIVAR validación
            '/api/expedix/',                        # ✅ AGREGAR validación
            '/api/agenda/',                         # ✅ AGREGAR validación  
            '/api/resources/',                      # ✅ AGREGAR validación
        ]
        
        return any(request.path.startswith(path) for path in bridge_paths)
    
    def validate_supabase_auth(self, request):
        """
        Validate Supabase JWT token and return user info
        """
        try:
            # Extract token from Authorization header
            token = self.extract_token(request)
            if not token:
                return {
                    'valid': False,
                    'error': 'No authorization token provided'
                }
            
            # Validate token with Supabase
            user_data = self.validate_with_supabase(token)
            if not user_data:
                return {
                    'valid': False,
                    'error': 'Invalid or expired token'
                }
            
            # Get or create Django user
            django_user = self.get_or_create_django_user(user_data)
            if not django_user:
                return {
                    'valid': False,
                    'error': 'Could not create user session'
                }
            
            return {
                'valid': True,
                'user': django_user,
                'supabase_data': user_data
            }
            
        except Exception as e:
            logger.error(f'Supabase auth error: {str(e)}')
            return {
                'valid': False,
                'error': f'Authentication error: {str(e)}'
            }
    
    def extract_token(self, request):
        """
        Extract JWT token from Authorization header
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        return None
    
    def validate_with_supabase(self, token):
        """
        Validate token with Supabase API
        """
        try:
            # Check if it's a service role key (development/testing)
            if hasattr(settings, 'SUPABASE_SERVICE_ROLE_KEY') and token == settings.SUPABASE_SERVICE_ROLE_KEY:
                logger.info('Using service role key for development authentication')
                # Return mock user for service role key
                return {
                    'id': 'a2733be9-6292-4381-a594-6fa386052052',  # Admin user ID
                    'email': 'dr_aleks_c@hotmail.com',
                    'user_metadata': {
                        'first_name': 'Dr. Alejandro',
                        'last_name': 'Constante'
                    }
                }
            
            # Make request to Supabase to validate token
            headers = {
                'Authorization': f'Bearer {token}',
                'apikey': settings.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{settings.SUPABASE_URL}/auth/v1/user',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f'Supabase auth failed: {response.status_code} - {response.text}')
                return None
                
        except requests.RequestException as e:
            logger.error(f'Supabase API request failed: {str(e)}')
            return None
        except Exception as e:
            logger.error(f'Unexpected error validating with Supabase: {str(e)}')
            return None
    
    def get_or_create_django_user(self, supabase_user_data):
        """
        Get or create Django user from Supabase user data
        """
        try:
            email = supabase_user_data.get('email')
            if not email:
                logger.warning('No email in Supabase user data')
                return None
            
            # Get user metadata
            user_metadata = supabase_user_data.get('user_metadata', {})
            
            # Get or create Django user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': user_metadata.get('first_name', ''),
                    'last_name': user_metadata.get('last_name', ''),
                    'is_active': True,
                }
            )
            
            if created:
                logger.info(f'Created new Django user from Supabase: {email}')
            
            # Update user info if needed
            if not created:
                updated = False
                if user_metadata.get('first_name') and not user.first_name:
                    user.first_name = user_metadata.get('first_name', '')
                    updated = True
                if user_metadata.get('last_name') and not user.last_name:
                    user.last_name = user_metadata.get('last_name', '')
                    updated = True
                
                if updated:
                    user.save()
                    logger.info(f'Updated Django user info: {email}')
            
            return user
            
        except Exception as e:
            logger.error(f'Error creating Django user: {str(e)}')
            return None


class SupabaseOptionalAuthMiddleware(MiddlewareMixin):
    """
    Optional Supabase auth for endpoints that can work with or without auth
    """
    
    def __init__(self, get_response=None):
        self.get_response = get_response
        super().__init__(get_response)
    
    def __call__(self, request):
        # Try to authenticate, but don't fail if no auth
        if hasattr(request, 'META') and 'HTTP_AUTHORIZATION' in request.META:
            auth_middleware = SupabaseAuthMiddleware()
            if auth_middleware.should_process_auth(request):
                auth_result = auth_middleware.validate_supabase_auth(request)
                if auth_result['valid']:
                    request.user = auth_result['user']
                    request.supabase_user = auth_result['supabase_data']
        
        response = self.get_response(request)
        return response