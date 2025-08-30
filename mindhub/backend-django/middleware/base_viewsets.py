"""
🎯 DUAL SYSTEM BASE VIEWSETS
Universal ViewSets that automatically handle dual system filtering
All module ViewSets should inherit from these base classes
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
import logging

from .dual_system_middleware import DualSystemFilterMixin, DualSystemQueryHelper, DualSystemBusinessLogic

logger = logging.getLogger(__name__)


class DualSystemModelViewSet(DualSystemFilterMixin, viewsets.ModelViewSet):
    """
    Base ModelViewSet with automatic dual system support
    
    Usage:
    class PatientViewSet(DualSystemModelViewSet):
        queryset = Patient.objects.all()
        serializer_class = PatientSerializer
    """
    
    def list(self, request, *args, **kwargs):
        """Override list to add dual system context to response"""
        # Ensure user_context exists before calling super().list()
        if not hasattr(request, 'user_context'):
            logger.warning('No user_context found in list, using fallback clinic context')
            request.user_context = {
                'license_type': 'clinic',
                'clinic_id': '1',  # Default clinic
                'workspace_id': None,
                'clinic_role': 'professional',
                'shared_access': True
            }
        
        response = super().list(request, *args, **kwargs)
        
        # Add license context to response for frontend
        if hasattr(request, 'user_context'):
            # Check if response data is a dict (paginated) or list (not paginated)
            if isinstance(response.data, dict):
                response.data['license_context'] = {
                    'license_type': request.user_context.get('license_type'),
                    'shared_access': request.user_context.get('shared_access'),
                    'business_logic': DualSystemBusinessLogic.get_finance_logic(request.user_context)
                }
            else:
                # For non-paginated responses, wrap the list in a dict
                response.data = {
                    'results': response.data,
                    'license_context': {
                        'license_type': request.user_context.get('license_type'),
                        'shared_access': request.user_context.get('shared_access'),
                        'business_logic': DualSystemBusinessLogic.get_finance_logic(request.user_context)
                    }
                }
        
        return response
    
    def create(self, request, *args, **kwargs):
        """Override create to ensure proper dual system association"""
        if not hasattr(request, 'user_context'):
            # Provide fallback context instead of failing
            logger.warning('No user_context found in create, using fallback clinic context')
            request.user_context = {
                'license_type': 'clinic',
                'clinic_id': '1',  # Default clinic
                'workspace_id': None,
                'clinic_role': 'professional',
                'shared_access': True
            }
        
        return super().create(request, *args, **kwargs)


class DualSystemReadOnlyViewSet(DualSystemFilterMixin, viewsets.ReadOnlyModelViewSet):
    """
    Base ReadOnlyViewSet with automatic dual system support
    """
    
    def list(self, request, *args, **kwargs):
        """Override list to add dual system context to response"""
        response = super().list(request, *args, **kwargs)
        
        # Add license context to response for frontend
        if hasattr(request, 'user_context'):
            # Check if response data is a dict (paginated) or list (not paginated)
            if isinstance(response.data, dict):
                response.data['license_context'] = {
                    'license_type': request.user_context.get('license_type'),
                    'shared_access': request.user_context.get('shared_access'),
                    'business_logic': DualSystemBusinessLogic.get_finance_logic(request.user_context)
                }
            else:
                # For non-paginated responses, wrap the list in a dict
                response.data = {
                    'results': response.data,
                    'license_context': {
                        'license_type': request.user_context.get('license_type'),
                        'shared_access': request.user_context.get('shared_access'),
                        'business_logic': DualSystemBusinessLogic.get_finance_logic(request.user_context)
                    }
                }
        
        return response


class DualSystemGenericViewSet(DualSystemFilterMixin, viewsets.GenericViewSet):
    """
    Base GenericViewSet with dual system support for custom implementations
    """
    
    def get_user_context(self):
        """Helper to get user context safely"""
        if not hasattr(self.request, 'user_context'):
            raise ValidationError('User context not found - authentication required')
        return self.request.user_context
    
    def filter_queryset_by_license(self, queryset):
        """Helper to manually filter queryset by license type"""
        user_id = getattr(self.request, 'supabase_user_id', None)
        return DualSystemQueryHelper.filter_by_user_context(queryset, self.get_user_context(), user_id)
    
    def get_create_data_for_license(self):
        """Helper to get clinic_id/created_by for creating objects"""
        user_id = getattr(self.request, 'supabase_user_id', None)
        return DualSystemQueryHelper.get_create_data(self.get_user_context(), user_id)


class FinanceDualSystemMixin:
    """
    Special mixin for Finance module with business logic differentiation
    """
    
    def get_finance_context(self):
        """Get finance-specific business logic for current user"""
        if not hasattr(self.request, 'user_context'):
            return {}
        
        return DualSystemBusinessLogic.get_finance_logic(self.request.user_context)
    
    def can_share_income(self):
        """Check if user can share income (clinic license only)"""
        finance_logic = self.get_finance_context()
        return finance_logic.get('income_sharing', False)
    
    def get_income_percentage(self):
        """Get income percentage for user (100% for individual, configurable for clinic)"""
        if self.can_share_income():
            # For clinic licenses, percentage might be configurable
            # Default to 70% for doctors, 30% for clinic
            return 70.0  # This should come from clinic configuration
        else:
            # Individual license gets 100%
            return 100.0


class PatientAccessMixin:
    """
    Mixin for patient-related operations with dual system access control
    """
    
    def can_access_patient(self, patient):
        """Check if current user can access specific patient"""
        if not hasattr(self.request, 'user_context'):
            return False
        
        user_id = getattr(self.request, 'supabase_user_id', None)
        return DualSystemBusinessLogic.can_access_patient(self.request.user_context, patient, user_id)
    
    def get_accessible_patients(self, queryset=None):
        """Get patients accessible to current user"""
        if queryset is None:
            from expedix.models import Patient
            queryset = Patient.objects.filter(is_active=True)
        
        return self.filter_queryset_by_license(queryset)


class ResourceSharingMixin:
    """
    Mixin for resource sharing capabilities based on license type
    """
    
    def can_share_resources(self):
        """Check if user can share resources with other professionals"""
        if not hasattr(self.request, 'user_context'):
            return False
        
        return DualSystemBusinessLogic.can_share_resource(self.request.user_context)
    
    def get_sharing_scope(self):
        """Get the scope of resource sharing"""
        user_context = getattr(self.request, 'user_context', {})
        license_type = user_context.get('license_type')
        
        if license_type == 'clinic':
            return {
                'scope': 'clinic',
                'shareable': True,
                'audience': 'clinic_professionals',
                'max_users': 15
            }
        elif license_type == 'individual':
            return {
                'scope': 'individual',
                'shareable': False,
                'audience': 'self_only',
                'max_users': 1
            }
        
        return {
            'scope': 'none',
            'shareable': False,
            'audience': 'none',
            'max_users': 0
        }


class LocationAccessMixin:
    """
    Mixin for practice location access (sucursales)
    """
    
    def get_accessible_locations(self):
        """Get practice locations accessible to current user"""
        if not hasattr(self.request, 'user_context'):
            return []
        
        return DualSystemBusinessLogic.get_accessible_locations(self.request.user_context)
    
    def can_access_location(self, location_id):
        """Check if user can access specific location"""
        accessible_locations = self.get_accessible_locations()
        return any(loc['id'] == location_id for loc in accessible_locations)


# Complete base class that combines all mixins
class CompleteDualSystemViewSet(
    DualSystemModelViewSet,
    FinanceDualSystemMixin,
    PatientAccessMixin,
    ResourceSharingMixin,
    LocationAccessMixin
):
    """
    Complete ViewSet with all dual system capabilities
    Use this for modules that need full dual system functionality
    """
    pass


# Specialized ViewSets for specific modules
class ExpedixDualViewSet(
    DualSystemModelViewSet,
    PatientAccessMixin,
    LocationAccessMixin
):
    """
    Specialized ViewSet for Expedix module
    """
    pass


class FinanceDualViewSet(
    DualSystemModelViewSet,
    FinanceDualSystemMixin,
    PatientAccessMixin
):
    """
    Specialized ViewSet for Finance module with business logic
    """
    pass


class ResourcesDualViewSet(
    DualSystemModelViewSet,
    ResourceSharingMixin,
    LocationAccessMixin
):
    """
    Specialized ViewSet for Resources module
    """
    pass


class AgendaDualViewSet(
    DualSystemModelViewSet,
    PatientAccessMixin,
    LocationAccessMixin
):
    """
    Specialized ViewSet for Agenda module
    """
    pass