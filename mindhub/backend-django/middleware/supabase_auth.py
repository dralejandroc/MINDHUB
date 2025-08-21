"""
Supabase Authentication Middleware for Django
Handles JWT token validation from React frontend
Django acts as stateless API - no local user creation needed
"""
import requests
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


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
            
            # Set authenticated user data (Supabase user, not Django user)
            request.user = auth_result['user']
            request.supabase_user = auth_result['supabase_data']
        
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
            user_data = self.validate_with_supabase(token, request)
            if not user_data:
                return {
                    'valid': False,
                    'error': 'Invalid or expired token'
                }
            
            # Don't create Django users - just pass Supabase user data
            # Django acts as a stateless API that trusts Supabase authentication
            logger.info(f'User authenticated via Supabase: {user_data.get("email")}')
            
            return {
                'valid': True,
                'user': user_data,  # Pass Supabase user data directly
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
    
    def validate_with_supabase(self, token, request):
        """
        Validate token with Supabase API
        """
        try:
            # Check if it's a service role key from trusted proxy
            # Allow specific service role key from Next.js proxy that has already validated the user
            expected_service_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ')
            
            logger.info(f'Token validation - Token length: {len(token)}, Expected key length: {len(expected_service_key)}')
            logger.info(f'Token matches service key: {token == expected_service_key}')
            
            if token == expected_service_key:
                # Check if this is from a pre-authenticated proxy
                proxy_auth = request.META.get('HTTP_X_PROXY_AUTH')
                user_id = request.META.get('HTTP_X_USER_ID')
                user_email = request.META.get('HTTP_X_USER_EMAIL')
                
                if proxy_auth == 'verified' and user_id and user_email:
                    logger.info(f'Using service role key from pre-authenticated proxy for user: {user_email}')
                    return {
                        'id': user_id,
                        'email': user_email,
                        'user_metadata': {
                            'first_name': user_email.split('@')[0],  # Extract name from email
                            'last_name': ''
                        }
                    }
                else:
                    logger.warning(f'Service role key provided but missing proxy headers: proxy_auth={proxy_auth}, user_id={user_id}, user_email={user_email}')
            elif settings.DEBUG:
                logger.info('Using service role key for development authentication')
                # Return mock user for service role key in development
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