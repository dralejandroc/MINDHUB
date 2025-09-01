"""
🎯 DUAL SYSTEM VIEWSETS for Clinimetrix Assessments
DRF ViewSets that automatically handle dual system filtering
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
import logging

from middleware.base_viewsets import DualSystemModelViewSet
from .models import Assessment, Patient
from .serializers import AssessmentSerializer, PatientSerializer

logger = logging.getLogger(__name__)


class AssessmentViewSet(DualSystemModelViewSet):
    """
    Assessment ViewSet with automatic dual system support
    Filters assessments by clinic_id or workspace_id based on user license type
    """
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    
    def get_queryset(self):
        """Override to apply dual system filtering"""
        queryset = super().get_queryset()
        
        # Apply dual system filtering based on user context
        if hasattr(self.request, 'user_context'):
            user_context = self.request.user_context
            filter_field = user_context.get('filter_field')
            filter_value = user_context.get('filter_value')
            
            if filter_field == 'clinic_id' and filter_value:
                # Clinic license: filter by clinic_id
                queryset = queryset.filter(clinic_id=filter_value)
            elif filter_field == 'workspace_id' and filter_value:
                # Individual license: filter by workspace_id  
                queryset = queryset.filter(workspace_id=filter_value)
            else:
                # Fallback: filter by administrator_id
                user_id = getattr(self.request, 'supabase_user_id', None)
                if user_id:
                    queryset = queryset.filter(administrator_id=user_id)
                else:
                    # No valid context, return empty queryset for security
                    logger.warning('No valid user context for assessment filtering')
                    queryset = queryset.none()
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set dual system fields and administrator_id on create"""
        user_context = getattr(self.request, 'user_context', {})
        clinic_id = user_context.get('clinic_id') if user_context.get('license_type') == 'clinic' else None
        workspace_id = user_context.get('workspace_id') if user_context.get('license_type') == 'individual' else None
        user_id = getattr(self.request, 'supabase_user_id', None)
        
        # Save with dual system context
        serializer.save(
            administrator_id=user_id,
            clinic_id=clinic_id,
            workspace_id=workspace_id
        )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard endpoint for React frontend
        Returns limited assessments for dashboard display
        """
        try:
            # Get filtered queryset (already applies dual system filtering)
            queryset = self.get_queryset()[:50]  # Limit to 50 for dashboard
            
            # Serialize data
            assessments_data = []
            for assessment in queryset:
                # Get scoring result if exists
                scoring_result = None
                try:
                    scoring_result = assessment.scoring_result
                except:
                    pass
                
                assessments_data.append({
                    'id': str(assessment.id),
                    'template_id': assessment.template_id,
                    'scale_name': assessment.scale.name if assessment.scale else 'Unknown Scale',
                    'scale_abbreviation': assessment.scale.abbreviation if assessment.scale else 'N/A',
                    'status': assessment.status or 'not_started',
                    'score': float(assessment.total_score) if assessment.total_score else None,
                    'interpretation': assessment.interpretation.get('label', '') if assessment.interpretation else None,
                    'severity_level': assessment.severity_level,
                    'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
                    'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
                    'current_step': assessment.current_step or 0,
                    'completion_percentage': assessment.completion_percentage or 0,
                    'total_items': assessment.total_items,
                    'patient_id': str(assessment.patient_id) if assessment.patient_id else None,
                    'patient_name': assessment.patient.get_full_name() if assessment.patient else None,
                    'clinic_id': str(assessment.clinic_id) if assessment.clinic_id else None,
                    'workspace_id': str(assessment.workspace_id) if assessment.workspace_id else None,
                })
            
            # Add license context to response
            user_context = getattr(request, 'user_context', {})
            response_data = {
                'results': assessments_data,
                'count': len(assessments_data),
                'license_context': {
                    'license_type': user_context.get('license_type'),
                    'shared_access': user_context.get('shared_access'),
                    'business_logic': {
                        'assessment_sharing': user_context.get('license_type') == 'clinic',
                        'multi_professional': user_context.get('license_type') == 'clinic',
                        'patient_sharing': user_context.get('license_type') == 'clinic'
                    }
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f'Dashboard endpoint error: {str(e)}')
            return Response({
                'error': f'Error retrieving assessments: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientViewSet(DualSystemModelViewSet):
    """
    Patient ViewSet with automatic dual system support 
    (Clinimetrix has its own Patient model)
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    
    def get_queryset(self):
        """Override to apply dual system filtering by created_by"""
        queryset = super().get_queryset()
        
        # For Clinimetrix patients, filter by created_by since they don't have clinic/workspace fields yet
        user_id = getattr(self.request, 'supabase_user_id', None)
        if user_id:
            queryset = queryset.filter(created_by_id=user_id)
        else:
            # No valid user, return empty queryset
            queryset = queryset.none()
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set created_by on create"""
        user_id = getattr(self.request, 'supabase_user_id', None)
        serializer.save(created_by_id=user_id)