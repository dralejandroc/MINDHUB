"""
🎯 DUAL SYSTEM MIDDLEWARE - UNIVERSAL PATTERN
Provides universal filtering for ViewSets based on license type
Supports:
- LICENCIA CLÍNICA: WHERE clinic_id = user.clinic_id  
- LICENCIA INDIVIDUAL: WHERE workspace_id = user.individual_workspace_id
"""
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class DualSystemFilterMixin:
    """
    Mixin for ViewSets to automatically filter by license type
    Usage: class MyViewSet(DualSystemFilterMixin, viewsets.ModelViewSet)
    """
    
    def get_queryset(self):
        """
        Universal dual system filtering pattern
        """
        queryset = super().get_queryset()
        
        # 🧪 TEMPORARY: Inject test user context for dual system testing
        if not hasattr(self.request, 'user_context'):
            # Simulate dr_aleks_c (individual license) if no test_mode param
            test_mode = self.request.query_params.get('test_mode', 'individual')
            
            if test_mode == 'clinic':
                # Simulate test@mindhub.com (clinic license)
                self.request.user_context = {
                    'license_type': 'clinic',
                    'clinic_id': '38633a49-10e8-4138-b44b-7b7995d887e7',
                    'workspace_id': None
                }
                logger.info('🧪 TESTING: Injected CLINIC license context')
            else:
                # Simulate dr_aleks_c (individual license)
                self.request.user_context = {
                    'license_type': 'individual', 
                    'clinic_id': None,
                    'workspace_id': '8a956bcb-abca-409e-8ae8-2604372084cf'
                }
                logger.info('🧪 TESTING: Injected INDIVIDUAL license context')
        
        # Check if user context is available
        if not hasattr(self.request, 'user_context'):
            logger.warning('No user_context found in request - using unfiltered queryset')
            return queryset
        
        user_context = self.request.user_context
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                return queryset.filter(clinic_id=clinic_id)
            else:
                logger.error(f'Clinic license but no clinic_id found for user')
                return queryset.none()
                
        elif license_type == 'individual':
            # For individual licenses, filter by workspace_id (dual system)
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                return queryset.filter(workspace_id=workspace_id)
            else:
                logger.error(f'Individual license but no workspace_id found for filtering')
                return queryset.none()
        
        logger.warning(f'Unknown license type: {license_type} - returning empty queryset')
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
            # For individual licenses, set workspace_id
            workspace_id = user_context.get('workspace_id')
            if workspace_id and user_id:
                serializer.save(
                    clinic_id=None,
                    workspace_id=workspace_id,
                    created_by=user_id
                )
            else:
                logger.error('Cannot create object - individual license but no workspace_id or user_id')


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
            # For individual licenses, filter by workspace_id (dual system)
            workspace_id = user_context.get('workspace_id')
            return queryset.filter(workspace_id=workspace_id) if workspace_id else queryset.none()
        
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
            # For individual licenses, set workspace_id
            workspace_id = user_context.get('workspace_id')
            return {
                'clinic_id': None,
                'workspace_id': workspace_id,
                'created_by': user_id
            }
        
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