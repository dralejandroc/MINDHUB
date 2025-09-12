"""
ARQUITECTURA ULTRA-SIMPLIFICADA
Solo valida JWT de Supabase y extrae user_id
Elimina toda la complejidad de workspace_id, clinic_id, dual systems
"""
import jwt
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class MockDjangoUser:
    """Mock user para DRF compatibility"""
    def __init__(self, user_id, email):
        self.id = user_id
        self.email = email
        self.username = email
        self.is_active = True
        self.is_authenticated = True
        self.is_anonymous = False


class SimpleSupabaseAuthMiddleware(MiddlewareMixin):
    """
    ULTRA-SIMPLIFIED: Solo valida JWT y extrae user_id
    Elimina todo el sistema dual, workspaces, clinic_id, etc.
    """
    
    def __init__(self, get_response=None):
        self.get_response = get_response
        super().__init__(get_response)
    
    def __call__(self, request):
        # Solo procesar APIs de MindHub
        if request.path.startswith('/api/'):
            auth_result = self.validate_jwt(request)
            if not auth_result['valid']:
                return JsonResponse({
                    'success': False,
                    'error': auth_result['error']
                }, status=401)
            
            # Solo setear user_id - nada más
            request.user = MockDjangoUser(auth_result['user_id'], auth_result['email'])
            request.user_id = auth_result['user_id']
            request.user_email = auth_result['email']
            
            logger.info(f'✅ Simple auth: {auth_result["email"]} ({auth_result["user_id"]})')
        
        return self.get_response(request)
    
    def validate_jwt(self, request):
        """Validación JWT ultra-simple con debugging"""
        try:
            # Extraer token
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            logger.info(f'🔍 Auth header: {auth_header[:50]}...' if auth_header else '❌ No auth header')
            
            if not auth_header.startswith('Bearer '):
                logger.warning('❌ No Bearer token found')
                return {'valid': False, 'error': 'No Bearer token'}
            
            token = auth_header.split(' ')[1]
            logger.info(f'🔑 Token extracted: {token[:30]}...')
            
            # Validar con secret de Supabase
            jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', None)
            if not jwt_secret:
                logger.error('❌ JWT secret not configured')
                return {'valid': False, 'error': 'JWT secret not configured'}
            
            logger.info(f'🔐 Using JWT secret: {jwt_secret[:20]}...')
            
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            logger.info(f'✅ JWT decoded successfully: {decoded.get("email")} ({decoded.get("sub")})')
            
            return {
                'valid': True,
                'user_id': decoded.get('sub'),
                'email': decoded.get('email')
            }
            
        except jwt.ExpiredSignatureError as e:
            logger.warning(f'⏰ Token expired: {e}')
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError as e:
            logger.warning(f'🔴 Invalid token: {e}')
            return {'valid': False, 'error': 'Invalid token'}
        except Exception as e:
            logger.error(f'💥 JWT validation error: {e}')
            return {'valid': False, 'error': 'Auth error'}