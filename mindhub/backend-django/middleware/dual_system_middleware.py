"""
🎯 SIMPLIFIED SYSTEM MIDDLEWARE - UNIVERSAL PATTERN
Provides universal filtering for ViewSets based on simplified architecture
Supports:
- CLINIC SHARED: WHERE clinic_id = true  
- INDIVIDUAL: WHERE user_id = auth.uid()
"""
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class DualSystemFilterMixin:
    """
    Mixin for ViewSets to automatically filter by simplified architecture
    Usage: class MyViewSet(DualSystemFilterMixin, viewsets.ModelViewSet)
    """
    
    def get_queryset(self):
        """
        Universal simplified system filtering pattern
        """
        queryset = super().get_queryset()
        
        # 🧪 TEMPORARY: Inject test user context for simplified system testing
        if not hasattr(self.request, 'user_context'):
            # Simulate user context based on test_mode param
            test_mode = self.request.query_params.get('test_mode', 'individual')
            user_id = getattr(self.request, 'supabase_user_id', None)
            
            if test_mode == 'clinic':
                # Simulate clinic shared access
                self.request.user_context = {
                    'license_type': 'clinic',
                    'clinic_shared': True,
                    'user_id': user_id
                }
                logger.info('🧪 TESTING: Injected CLINIC shared context')
            else:
                # Simulate individual user access
                self.request.user_context = {
                    'license_type': 'individual',
                    'clinic_shared': False,
                    'user_id': user_id or 'test-user-id'
                }
                logger.info('🧪 TESTING: Injected INDIVIDUAL user context')
        
        # Check if user context is available
        if not hasattr(self.request, 'user_context'):
            logger.warning('No user_context found in request - using unfiltered queryset')
            return queryset
        
        user_context = self.request.user_context
        user_id = getattr(self.request, 'supabase_user_id', None)
        
        # Apply simplified architecture filtering: clinic_id=true OR user_id=auth.uid()
        from django.db.models import Q
        
        if user_id:
            # Filter records that are either clinic-shared OR owned by the user
            return queryset.filter(
                Q(clinic_id=True) | Q(user_id=user_id)
            )
        else:
            logger.error('No user_id found for filtering - returning empty queryset')
            return queryset.none()
        
        logger.warning('No user context found - returning empty queryset')
        return queryset.none()
    
    def perform_create(self, serializer):
        """
        Automatically set clinic_id or created_by when creating objects
        """
        if not hasattr(self.request, 'user_context'):
            logger.error('Cannot create object - no user_context')
            return
        
        user_context = self.request.user_context
        license_type = user_context.get('license_type')
        user_id = getattr(self.request, 'supabase_user_id', None)
        
        if license_type == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                serializer.save(
                    clinic_id=clinic_id,
                    created_by=user_id
                )
            else:
                logger.error('Cannot create object - clinic license but no clinic_id')
                
        elif license_type == 'individual':
            # For individual licenses, set workspace_id if available, otherwise use created_by only
            workspace_id = user_context.get('workspace_id')
            if user_id:
                save_data = {
                    'clinic_id': None,
                    'created_by': user_id
                }
                # Add workspace_id only if it exists
                if workspace_id:
                    save_data['workspace_id'] = workspace_id
                    
                serializer.save(**save_data)
                logger.info(f'Individual license object created: workspace_id={workspace_id}, created_by={user_id}')
            else:
                logger.error('Cannot create object - individual license but no user_id')


class DualSystemQueryHelper:
    """
    Helper class for manual queries with dual system support
    """
    
    @staticmethod
    def filter_by_user_context(queryset, user_context, user_id=None):
        """
        Apply dual system filtering to any queryset
        """
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            clinic_id = user_context.get('clinic_id')
            return queryset.filter(clinic_id=clinic_id) if clinic_id else queryset.none()
            
        elif license_type == 'individual':
            # For individual licenses, filter by workspace_id OR created_by fallback
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                return queryset.filter(workspace_id=workspace_id)
            elif user_id:
                # Fallback for individual users without workspace_id
                return queryset.filter(created_by=user_id)
            else:
                return queryset.none()
        
        return queryset.none()
    
    @staticmethod
    def get_create_data(user_context, user_id=None):
        """
        Get clinic_id/created_by data for creating new objects
        """
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            clinic_id = user_context.get('clinic_id')
            return {
                'clinic_id': clinic_id,
                'created_by': user_id
            }
            
        elif license_type == 'individual':
            # For individual licenses, set workspace_id if available
            workspace_id = user_context.get('workspace_id')
            data = {
                'clinic_id': None,
                'created_by': user_id
            }
            # Only add workspace_id if it exists
            if workspace_id:
                data['workspace_id'] = workspace_id
            return data
        
        return {
            'clinic_id': None,
            'workspace_id': None,
            'created_by': None
        }


class DualSystemBusinessLogic:
    """
    Business logic helper for dual system features
    """
    
    @staticmethod
    def get_finance_logic(user_context):
        """
        Returns finance-specific business logic based on license type
        """
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            return {
                'income_sharing': True,
                'shared_resources': True,
                'multi_professional': True,
                'max_users': 15,
                'price_monthly': 199.99,
                'currency': 'USD'
            }
            
        elif license_type == 'individual':
            return {
                'income_sharing': False,
                'shared_resources': False,
                'multi_professional': False,
                'max_users': 1,
                'price_monthly': 49.99,
                'currency': 'USD',
                'max_sucursales': 5
            }
        
        return {}
    
    @staticmethod
    def can_access_patient(user_context, patient, user_id=None):
        """
        Check if user can access specific patient based on license type
        """
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            # Clinic users can access all patients in their clinic
            return patient.clinic_id == user_context.get('clinic_id')
            
        elif license_type == 'individual':
            # Individual users can only access patients in their workspace
            workspace_id = user_context.get('workspace_id')
            return patient.workspace_id == workspace_id if workspace_id else False
        
        return False
    
    @staticmethod
    def can_share_resource(user_context):
        """
        Check if user can share resources with other professionals
        """
        license_type = user_context.get('license_type')
        return license_type == 'clinic'
    
    @staticmethod
    def get_accessible_locations(user_context):
        """
        Get practice locations accessible to user
        """
        from django.db import connection
        
        license_type = user_context.get('license_type')
        
        try:
            with connection.cursor() as cursor:
                if license_type == 'clinic':
                    clinic_id = user_context.get('clinic_id')
                    cursor.execute("""
                        SELECT id, location_name, address, is_primary
                        FROM practice_locations 
                        WHERE clinic_id = %s AND is_active = true
                        ORDER BY is_primary DESC, location_name
                    """, [clinic_id])
                    
                elif license_type == 'individual':
                    # For individual licenses, use workspace_id
                    workspace_id = user_context.get('workspace_id')
                    cursor.execute("""
                        SELECT id, location_name, address, is_primary
                        FROM practice_locations 
                        WHERE workspace_id = %s AND is_active = true
                        ORDER BY is_primary DESC, location_name
                    """, [workspace_id])
                
                else:
                    return []
                
                return [
                    {
                        'id': row[0],
                        'location_name': row[1],
                        'address': row[2],
                        'is_primary': row[3]
                    }
                    for row in cursor.fetchall()
                ]
                
        except Exception as e:
            logger.error(f'Error getting accessible locations: {e}')
            return []