"""
Supabase Client for Django Integration
Provides seamless integration between Django and Supabase
"""

from supabase import create_client, Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    """
    Singleton Supabase client for Django
    """
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_client()
        return cls._instance
    
    def _initialize_client(self):
        """
        Initialize Supabase client with settings
        """
        try:
            #self._client = create_client(
             #   settings.SUPABASE_URL,
              #  settings.SUPABASE_SERVICE_ROLE_KEY  # Use service role for backend operations
            #)
            self._client = create_client(
                "https://jvbcpldzoyicefdtnwkd.supabase.co",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"  # Use service role for backend operations
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    @property
    def client(self) -> Client:
        """
        Get the Supabase client instance
        """
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def get_patient(self, patient_id: str):
        """
        Get patient data from Supabase
        """
        try:
            response = self.client.table('patients').select('*').eq('id', patient_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching patient {patient_id}: {str(e)}")
            return None
    
    def create_patient(self, patient_data: dict):
        """
        Create patient in Supabase
        """
        try:
            response = self.client.table('patients').insert(patient_data).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error creating patient: {str(e)}")
            return None
    
    def update_patient(self, patient_id: str, patient_data: dict):
        """
        Update patient in Supabase
        """
        try:
            response = self.client.table('patients').update(patient_data).eq('id', patient_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error updating patient {patient_id}: {str(e)}")
            return None
    
    def get_appointments(self, **filters):
        """
        Get appointments from Supabase with optional filters
        """
        try:
            query = self.client.table('appointments').select('*')
            
            if 'patient_id' in filters:
                query = query.eq('patient_id', filters['patient_id'])
            if 'provider_id' in filters:
                query = query.eq('provider_id', filters['provider_id'])
            if 'status' in filters:
                query = query.eq('status', filters['status'])
            
            response = query.execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching appointments: {str(e)}")
            return []
    
    def create_appointment(self, appointment_data: dict):
        """
        Create appointment in Supabase
        """
        try:
            response = self.client.table('appointments').insert(appointment_data).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error creating appointment: {str(e)}")
            return None
    
    def update_appointment(self, appointment_id: str, appointment_data: dict):
        """
        Update appointment in Supabase
        """
        try:
            response = self.client.table('appointments').update(appointment_data).eq('id', appointment_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error updating appointment {appointment_id}: {str(e)}")
            return None
    
    def get_resources(self, **filters):
        """
        Get resources from Supabase with optional filters
        """
        try:
            query = self.client.table('resources').select('*')
            
            if 'library_type' in filters:
                query = query.eq('library_type', filters['library_type'])
            if 'category_id' in filters:
                query = query.eq('category_id', filters['category_id'])
            if 'is_active' in filters:
                query = query.eq('is_active', filters['is_active'])
            
            response = query.execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching resources: {str(e)}")
            return []
    
    def create_resource(self, resource_data: dict):
        """
        Create resource in Supabase
        """
        try:
            response = self.client.table('resources').insert(resource_data).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error creating resource: {str(e)}")
            return None
    
    def get_user_by_email(self, email: str):
        """
        Get user data from Supabase auth
        """
        try:
            # This would typically use admin auth to get user data
            # For now, returning None as it requires admin privileges
            logger.info(f"Fetching user with email: {email}")
            return None
        except Exception as e:
            logger.error(f"Error fetching user by email {email}: {str(e)}")
            return None
    
    def sync_with_django(self, model_name: str, data: dict):
        """
        Generic method to sync data between Django and Supabase
        """
        try:
            table_mapping = {
                'patient': 'patients',
                'appointment': 'appointments',
                'resource': 'resources',
                'consultation': 'consultations',
            }
            
            table = table_mapping.get(model_name.lower())
            if not table:
                logger.warning(f"No Supabase table mapping for model {model_name}")
                return None
            
            # Check if record exists
            if 'id' in data:
                existing = self.client.table(table).select('id').eq('id', data['id']).execute()
                if existing.data:
                    # Update existing record
                    response = self.client.table(table).update(data).eq('id', data['id']).execute()
                else:
                    # Create new record
                    response = self.client.table(table).insert(data).execute()
            else:
                # Create new record
                response = self.client.table(table).insert(data).execute()
            
            return response.data
        except Exception as e:
            logger.error(f"Error syncing {model_name} with Supabase: {str(e)}")
            return None

# Singleton instance
supabase_client = SupabaseClient()
