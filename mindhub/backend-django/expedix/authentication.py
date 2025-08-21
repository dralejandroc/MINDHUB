"""
Custom authentication for Expedix that works with Supabase proxy
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import logging

logger = logging.getLogger(__name__)


class SupabaseUser:
    """
    Mock user object that represents a Supabase authenticated user
    Provides the minimal interface that Django REST Framework expects
    """
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.email = user_data.get('email')
        self.user_data = user_data
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
        
    def __str__(self):
        return self.email or 'Anonymous'
    
    @property
    def username(self):
        return self.email


class SupabaseProxyAuthentication(BaseAuthentication):
    """
    Authentication class that works with pre-authenticated Supabase users from proxy
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using Supabase user data from middleware
        """
        # Check if the middleware already validated the user
        if hasattr(request, 'supabase_user') and request.supabase_user:
            logger.info(f"Using pre-authenticated Supabase user: {request.supabase_user.get('email')}")
            # Create a mock user object that Django REST Framework can work with
            user = SupabaseUser(request.supabase_user)
            return (user, None)
        
        # If no Supabase user, authentication fails
        return None
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return 'Bearer'