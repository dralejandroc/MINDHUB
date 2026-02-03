"""
Supabase Authentication Middleware for Django - DUAL SYSTEM
Handles JWT token validation from React frontend with automatic license type detection
Supports:
- LICENCIA CLÍNICA: Multi-user (up to 15 professionals) with shared data
- LICENCIA INDIVIDUAL: Single professional with workspace personal and multiple sucursales
Django acts as stateless API - no local user creation needed
"""
import requests
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class MockDjangoUser:
    """
    Mock Django User object compatible with DRF authentication
    Wraps Supabase user data in Django User interface
    """
    def __init__(self, supabase_data):
        self.id = supabase_data.get('id')
        self.email = supabase_data.get('email')
        self.username = supabase_data.get('email')
        self.user_metadata = supabase_data.get('user_metadata', {})
        self.first_name = self.user_metadata.get('first_name', '')
        self.last_name = self.user_metadata.get('last_name', '')
        self.is_active = True  # Required by DRF SessionAuthentication
        self.is_authenticated = True
        self.is_anonymous = False
        self.is_staff = False
        self.is_superuser = False
        self.date_joined = None
        self.last_login = None
    
    def __str__(self):
        return self.email or str(self.id)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name or self.email
    
    def has_perm(self, perm, obj=None):
        return False
    
    def has_perms(self, perm_list, obj=None):
        return False
    
    def has_module_perms(self, package_name):
        return False


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
            
            # Create mock Django User compatible with DRF
            mock_user = MockDjangoUser(auth_result['supabase_data'])
            request.user = mock_user
            request.supabase_user = auth_result['supabase_data']
            
            # Set user context for filtering (simulate RLS behavior)
            request.supabase_user_id = auth_result['supabase_data'].get('id')
            request.authenticated_user_email = auth_result['supabase_data'].get('email')
            
            # 🎯 SIMPLIFIED SYSTEM: Automatic license type detection
            request.user_context = self.get_user_access_context(request.supabase_user_id)
            
            # Set legacy attributes for backward compatibility
            request.user_clinic_id = request.user_context.get('clinic_id')
            request.user_id = request.supabase_user_id
            request.is_clinic_user = (request.user_context.get('license_type') == 'clinic')
            request.user_clinic_role = request.user_context.get('clinic_role', 'professional')
            
            logger.info(f'SIMPLIFIED SYSTEM auth context: email={request.authenticated_user_email}, '
                       f'license_type={request.user_context.get("license_type")}, '
                       f'clinic_shared={request.user_context.get("clinic_shared")}, '
                       f'user_id={request.user_context.get("user_id")}, '
                       f'role={request.user_context.get("clinic_role", "owner")}')
        
        response = self.get_response(request)
        return response
    
    def get_user_access_context(self, user_id):
        """
        🎯 SIMPLIFIED SYSTEM: Automatic license type detection
        Returns user access context for filtering queries
        """
        try:
            # Import here to avoid circular imports
            from django.db import connection
            
            with connection.cursor() as cursor:
                # Check if user exists in profiles table with license type
                cursor.execute("""
                    SELECT 
                        license_type, 
                        clinic_id, 
                        clinic_role
                    FROM profiles 
                    WHERE id = %s
                """, [user_id])
                
                result = cursor.fetchone()
                
                if result:
                    license_type, clinic_id, clinic_role = result
                    
                    if license_type == 'clinic' and clinic_id:
                        # Clinic license: access shared clinic data
                        return {
                            'license_type': 'clinic',
                            'access_type': 'clinic',
                            'filter_field': 'clinic_id',
                            'filter_value': True,
                            'clinic_id': str(clinic_id),
                            'clinic_shared': True,
                            'user_id': str(user_id),
                            'clinic_role': clinic_role,
                            'shared_access': True
                        }
                    elif license_type == 'individual':
                        # Individual license: access user-owned data
                        return {
                            'license_type': 'individual',
                            'access_type': 'individual',
                            'filter_field': 'user_id', 
                            'filter_value': str(user_id),
                            'clinic_id': None,
                            'clinic_shared': False,
                            'user_id': str(user_id),
                            'clinic_role': 'owner',
                            'shared_access': False
                        }
                
                # If no license type found, check legacy clinic profile
                cursor.execute("""
                    SELECT clinic_id, clinic_role 
                    FROM clinic_profiles 
                    WHERE id = %s AND clinic_id IS NOT NULL
                """, [user_id])
                
                legacy_result = cursor.fetchone()
                if legacy_result:
                    clinic_id, clinic_role = legacy_result
                    logger.warning(f'User {user_id} found in legacy clinic_profiles, migrating to dual system needed')
                    return {
                        'license_type': 'clinic',
                        'access_type': 'clinic',
                        'filter_field': 'clinic_id',
                        'filter_value': str(clinic_id),
                        'clinic_id': str(clinic_id),
                        'workspace_id': None,
                        'clinic_role': clinic_role,
                        'shared_access': True
                    }
                
                # Default to clinic license if the user wasn't found in profiles
                # Use the first clinic available as fallback
                logger.warning(f'User {user_id} not found in profiles, using fallback context')
                cursor.execute("SELECT id FROM clinics LIMIT 1")
                fallback_clinic = cursor.fetchone()
                fallback_clinic_id = str(fallback_clinic[0]) if fallback_clinic else None
                
                if fallback_clinic_id:
                    return {
                        'license_type': 'clinic',
                        'access_type': 'clinic',
                        'filter_field': 'clinic_id',
                        'filter_value': fallback_clinic_id,
                        'clinic_id': fallback_clinic_id,
                        'workspace_id': None,
                        'clinic_role': 'professional',
                        'shared_access': True
                    }
                else:
                    # If no clinics exist, return None context to prevent errors
                    logger.error(f'No clinics found for fallback, user {user_id} cannot be authenticated')
                    return {
                        'license_type': None,
                        'access_type': None,
                        'filter_field': None,
                        'filter_value': None,
                        'clinic_id': None,
                        'workspace_id': None,
                        'clinic_role': None,
                        'shared_access': False
                    }
                
        except Exception as e:
            logger.error(f'Error detecting user license type for {user_id}: {e}')
            # Fallback to safe empty context on database errors - do NOT use invalid UUIDs
            logger.error(f'Database error for user {user_id}, using empty context')
            return {
                'license_type': None,
                'access_type': None,
                'filter_field': None,
                'filter_value': None,
                'clinic_id': None,
                'workspace_id': None,
                'clinic_role': None,
                'shared_access': False
            }
    
    def should_process_auth(self, request):
        """
        Determine if this request needs Supabase auth validation
        """
        # Skip auth for debug endpoints
        debug_paths = [
            '/api/expedix/debug-auth/',
        ]
        
        if any(request.path.startswith(path) for path in debug_paths):
            return False
            
        # Only validate auth for specific bridge endpoints  
        bridge_paths = [
            '/assessments/api/create-from-react/',  # ✅ ACTIVAR validación
            '/assessments/api/patient/',            # ✅ AGREGAR validación patient assessments
            '/assessments/',                        # ✅ AGREGAR validación para dashboard assessments
            '/api/expedix/',                        # ✅ RESTORED according to architecture (covers all expedix endpoints)
            '/api/agenda/',                         # ✅ AGREGAR validación  
            '/api/resources/',                      # ✅ RESTORED according to architecture
            '/api/clinics/',                        # ✅ AGREGAR validación clinic management
            '/api/finance/',                        # ✅ AGREGAR validación finance management
            '/api/formx/',                          # ✅ AGREGAR validación FormX
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
        Validate token with Supabase API - Updated with new JWT secret for local validation
        """
        try:
            # First try local JWT validation with new secret key
            jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', None)
            print('jwt_secret', jwt_secret)
            if jwt_secret:
                try:
                    import jwt
                    decoded_token = jwt.decode(token, jwt_secret, algorithms=['HS256'])
                    logger.info(f'Valid JWT token decoded locally: {decoded_token.get("email")}')
                    return {
                        'id': decoded_token.get('sub'),
                        'email': decoded_token.get('email'),
                        'user_metadata': {
                            'first_name': decoded_token.get('user_metadata', {}).get('first_name', ''),
                            'last_name': decoded_token.get('user_metadata', {}).get('last_name', '')
                        },
                        'aud': decoded_token.get('aud'),
                        'role': decoded_token.get('role', 'authenticated')
                    }
                except jwt.ExpiredSignatureError:
                    logger.warning('JWT token has expired')
                    return None
                except jwt.InvalidTokenError as e:
                    logger.debug(f'JWT validation failed: {e}')
                    # Continue to Supabase API validation
                except ImportError:
                    logger.warning('PyJWT not installed, falling back to Supabase API validation')
            
            # Fallback to Supabase API validation
            supabase_headers = {
                'Authorization': f'Bearer {token}',
                'apikey': getattr(settings, 'SUPABASE_ANON_KEY', ''),
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.get(
                    f'{settings.SUPABASE_URL}/auth/v1/user',
                    headers=supabase_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    logger.info('Valid Supabase JWT token detected via API')
                    return response.json()
                    
            except requests.RequestException as api_error:
                logger.debug(f'Supabase API validation failed: {api_error}')
                
                # DEVELOPMENT MODE FALLBACK: If running in debug mode and token exists, 
                # use a test user to allow development without proper JWT secret
                if settings.DEBUG and token and len(token) > 10:
                    logger.warning('DEBUG MODE: Bypassing JWT validation with test user')
                    return {
                        'id': 'a1c193e9-643a-4ba9-9214-29536ea93913',  # dr_aleks_c ID
                        'email': 'dr_aleks_c@hotmail.com',
                        'user_metadata': {
                            'first_name': 'Dr. Alejandro',
                            'last_name': 'Constante'
                        }
                    }
            
            # Fallback to service role key for development/proxy
            expected_service_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ')
            print('expected_service_key', expected_service_key)
            print('token', token)
            if token == expected_service_key:
                # Check for proxy headers first
                proxy_auth = request.META.get('HTTP_X_PROXY_AUTH')
                user_id = request.META.get('HTTP_X_USER_ID') 
                user_email = request.META.get('HTTP_X_USER_EMAIL')
                
                if proxy_auth == 'verified' and user_id and user_email:
                    logger.info(f'Service role with proxy authentication: {user_email}')
                    return {
                        'id': user_id,
                        'email': user_email,
                        'user_metadata': {
                            'first_name': user_email.split('@')[0],
                            'last_name': ''
                        }
                    }
                
                # Development fallback - use test user for dual system testing
                if settings.DEBUG:
                    logger.info('Development mode: Using service role with test user context')
                    return {
                        'id': 'a1c193e9-643a-4ba9-9214-29536ea93913',  # dr_aleks_c ID
                        'email': 'dr_aleks_c@hotmail.com',
                        'user_metadata': {
                            'first_name': 'Dr. Alejandro',
                            'last_name': 'Constante'
                        }
                    }
            
            # If we get here, neither real JWT nor service role key worked
            logger.warning(f'Token validation failed for token: {token[:20]}...')
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