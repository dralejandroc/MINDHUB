"""
Consultation Views with Autosave and Audit
Regulatory compliant consultation management with data protection
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
import json
from datetime import datetime, timedelta

from expedix.authentication import SupabaseProxyAuthentication
from .models_real import (
    RealConsultation, RealPrescription, ConsultationAuditLog, ConsultationAutosave,
    create_consultation_with_audit, update_consultation_with_audit,
    finalize_consultation_with_audit, autosave_consultation, get_autosaved_content,
    clear_autosave
)


class ConsultationSerializer:
    """Basic serializer for consultations"""
    
    @staticmethod
    def serialize(consultation):
        return {
            'id': str(consultation.id),
            'patient_id': str(consultation.patient_id) if consultation.patient_id else None,
            'professional_id': str(consultation.professional_id) if consultation.professional_id else None,
            'consultation_date': consultation.consultation_date.isoformat() if consultation.consultation_date else None,
            'consultation_type': consultation.consultation_type,
            'chief_complaint': consultation.chief_complaint,
            'history_present_illness': consultation.history_present_illness,
            'physical_examination': consultation.physical_examination,
            'assessment': consultation.assessment,
            'plan': consultation.plan,
            'diagnosis': consultation.diagnosis,
            'status': consultation.status,
            'is_draft': consultation.is_draft,
            'is_finalized': consultation.is_finalized,
            'notes': consultation.notes,
            'clinical_notes': consultation.clinical_notes,
            'private_notes': consultation.private_notes,
            'prescriptions': consultation.prescriptions,
            'vital_signs': consultation.vital_signs,
            'follow_up_date': consultation.follow_up_date.isoformat() if consultation.follow_up_date else None,
            'follow_up_instructions': consultation.follow_up_instructions,
            'duration_minutes': consultation.duration_minutes,
            'created_at': consultation.created_at.isoformat() if consultation.created_at else None,
            'updated_at': consultation.updated_at.isoformat() if consultation.updated_at else None,
            'clinic_id': str(consultation.clinic_id) if consultation.clinic_id else None,
            'workspace_id': str(consultation.workspace_id) if consultation.workspace_id else None,
        }


class PrescriptionSerializer:
    """Basic serializer for prescriptions"""
    
    @staticmethod
    def serialize(prescription):
        return {
            'id': str(prescription.id),
            'patient_id': str(prescription.patient_id) if prescription.patient_id else None,
            'consultation_id': str(prescription.consultation_id) if prescription.consultation_id else None,
            'prescribed_by': str(prescription.prescribed_by) if prescription.prescribed_by else None,
            'medication_name': prescription.medication_name,
            'dosage': prescription.dosage,
            'frequency': prescription.frequency,
            'duration': prescription.duration,
            'instructions': prescription.instructions,
            'start_date': prescription.start_date.isoformat() if prescription.start_date else None,
            'end_date': prescription.end_date.isoformat() if prescription.end_date else None,
            'status': prescription.status,
            'is_active': prescription.is_active,
            'days_remaining': prescription.days_remaining,
            'created_at': prescription.created_at.isoformat() if prescription.created_at else None,
            'updated_at': prescription.updated_at.isoformat() if prescription.updated_at else None,
        }


class ConsultationViewSet(viewsets.ModelViewSet):
    """
    Consultation management with autosave and audit support
    """
    queryset = RealConsultation.objects.all()
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_user_info(self, request):
        """Extract user information from request"""
        # Get from Supabase auth context
        user_id = getattr(request, 'supabase_user_id', 'unknown')
        user_email = getattr(request, 'supabase_user_email', 'unknown')
        user_role = getattr(request, 'user_role', 'professional')
        
        # Get user name from profile if available
        user_name = f"{user_email}"  # Fallback to email
        
        return {
            'user_id': user_id,
            'user_name': user_name,
            'user_role': user_role,
            'ip_address': self.get_client_ip(request)
        }
    
    def get_client_ip(self, request):
        """Get client IP address for audit"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def list(self, request):
        """List consultations with filtering"""
        consultations = self.queryset
        
        # Filter by patient if provided
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            consultations = consultations.filter(patient_id=patient_id)
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            consultations = consultations.filter(status=status_filter)
        
        # Filter by date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            consultations = consultations.filter(consultation_date__gte=date_from)
        if date_to:
            consultations = consultations.filter(consultation_date__lte=date_to)
        
        # Order by date
        consultations = consultations.order_by('-consultation_date')[:100]
        
        # Serialize
        data = [ConsultationSerializer.serialize(c) for c in consultations]
        
        return Response({
            'success': True,
            'consultations': data,
            'total': len(data)
        })
    
    def create(self, request):
        """Create new consultation with audit"""
        user_info = self.get_user_info(request)
        
        # Extract data
        patient_id = request.data.get('patient_id')
        professional_id = request.data.get('professional_id') or user_info['user_id']
        
        if not patient_id:
            return Response({
                'success': False,
                'error': 'patient_id is required'
            }, status=400)
        
        # Create consultation data
        consultation_data = {
            'consultation_date': request.data.get('consultation_date') or timezone.now(),
            'consultation_type': request.data.get('consultation_type', 'general'),
            'chief_complaint': request.data.get('chief_complaint'),
            'status': 'draft',
            'clinic_id': request.data.get('clinic_id'),
            'workspace_id': request.data.get('workspace_id'),
        }
        
        try:
            # Create with audit trail
            consultation = create_consultation_with_audit(
                patient_id=patient_id,
                professional_id=professional_id,
                user_id=user_info['user_id'],
                user_name=user_info['user_name'],
                user_role=user_info['user_role'],
                consultation_data=consultation_data,
                ip_address=user_info['ip_address']
            )
            
            return Response({
                'success': True,
                'consultation': ConsultationSerializer.serialize(consultation),
                'message': 'Consultation created successfully'
            }, status=201)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def update(self, request, pk=None):
        """Update consultation with audit trail"""
        user_info = self.get_user_info(request)
        
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        # Check if consultation is finalized
        if consultation.is_finalized and not request.data.get('justification'):
            return Response({
                'success': False,
                'error': 'Consultation is finalized. Justification required for modifications.',
                'requires_justification': True
            }, status=400)
        
        # Prepare updates
        updates = {}
        allowed_fields = [
            'chief_complaint', 'history_present_illness', 'physical_examination',
            'assessment', 'plan', 'treatment_plan', 'diagnosis', 'notes',
            'clinical_notes', 'private_notes', 'vital_signs', 'follow_up_date',
            'follow_up_instructions', 'prescriptions'
        ]
        
        for field in allowed_fields:
            if field in request.data:
                updates[field] = request.data[field]
        
        if not updates:
            return Response({
                'success': False,
                'error': 'No valid fields to update'
            }, status=400)
        
        try:
            # Update with audit trail
            consultation = update_consultation_with_audit(
                consultation=consultation,
                user_id=user_info['user_id'],
                user_name=user_info['user_name'],
                user_role=user_info['user_role'],
                updates=updates,
                justification=request.data.get('justification'),
                ip_address=user_info['ip_address']
            )
            
            # Clear autosave after successful save
            clear_autosave(consultation.id)
            
            return Response({
                'success': True,
                'consultation': ConsultationSerializer.serialize(consultation),
                'message': 'Consultation updated successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['post'])
    def autosave(self, request, pk=None):
        """Autosave consultation draft"""
        user_info = self.get_user_info(request)
        
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        # Check if consultation can be edited
        if consultation.is_finalized:
            return Response({
                'success': False,
                'error': 'Cannot autosave finalized consultation'
            }, status=400)
        
        # Get draft content
        draft_content = request.data.get('content', {})
        session_id = request.data.get('session_id')
        
        try:
            autosave = autosave_consultation(
                consultation_id=str(consultation.id),
                user_id=user_info['user_id'],
                content=draft_content,
                session_id=session_id
            )
            
            return Response({
                'success': True,
                'message': 'Draft autosaved',
                'last_saved': autosave.last_saved.isoformat()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def get_autosave(self, request, pk=None):
        """Retrieve autosaved content"""
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        content = get_autosaved_content(str(consultation.id))
        
        if content:
            return Response({
                'success': True,
                'has_autosave': True,
                'content': content
            })
        else:
            return Response({
                'success': True,
                'has_autosave': False,
                'content': None
            })
    
    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Finalize consultation (no more edits without justification)"""
        user_info = self.get_user_info(request)
        
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        if consultation.is_finalized:
            return Response({
                'success': False,
                'error': 'Consultation is already finalized'
            }, status=400)
        
        try:
            # Finalize with audit trail
            consultation = finalize_consultation_with_audit(
                consultation=consultation,
                user_id=user_info['user_id'],
                user_name=user_info['user_name'],
                user_role=user_info['user_role'],
                ip_address=user_info['ip_address']
            )
            
            # Clear any autosaved content
            clear_autosave(consultation.id)
            
            return Response({
                'success': True,
                'consultation': ConsultationSerializer.serialize(consultation),
                'message': 'Consultation finalized successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def audit_trail(self, request, pk=None):
        """Get audit trail for consultation"""
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        # Get audit logs
        logs = ConsultationAuditLog.objects.filter(
            consultation_id=consultation.id
        ).order_by('-timestamp')
        
        # Serialize audit logs
        audit_data = []
        for log in logs:
            audit_data.append({
                'id': str(log.id),
                'action': log.action,
                'user_name': log.user_name,
                'user_role': log.user_role,
                'timestamp': log.timestamp.isoformat(),
                'field_changes': log.field_changes,
                'justification': log.justification
            })
        
        return Response({
            'success': True,
            'consultation_id': str(consultation.id),
            'audit_trail': audit_data,
            'total': len(audit_data)
        })
    
    @action(detail=True, methods=['post'])
    def add_prescription(self, request, pk=None):
        """Add prescription to consultation"""
        user_info = self.get_user_info(request)
        
        try:
            consultation = RealConsultation.objects.get(id=pk)
        except RealConsultation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Consultation not found'
            }, status=404)
        
        # Extract prescription data
        medication_name = request.data.get('medication_name')
        if not medication_name:
            return Response({
                'success': False,
                'error': 'medication_name is required'
            }, status=400)
        
        try:
            # Create prescription
            prescription = RealPrescription.objects.create(
                patient_id=consultation.patient_id,
                consultation_id=consultation.id,
                prescribed_by=user_info['user_id'],
                medication_name=medication_name,
                dosage=request.data.get('dosage'),
                frequency=request.data.get('frequency'),
                duration=request.data.get('duration'),
                instructions=request.data.get('instructions'),
                start_date=request.data.get('start_date') or timezone.now().date(),
                end_date=request.data.get('end_date'),
                status='active',
                clinic_id=consultation.clinic_id,
                workspace_id=consultation.workspace_id,
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            
            # Add audit log for prescription
            ConsultationAuditLog.objects.create(
                consultation_id=consultation.id,
                action='modified',
                user_id=user_info['user_id'],
                user_name=user_info['user_name'],
                user_role=user_info['user_role'],
                field_changes=['prescriptions'],
                new_values={'prescription_added': str(prescription.id)},
                ip_address=user_info['ip_address']
            )
            
            return Response({
                'success': True,
                'prescription': PrescriptionSerializer.serialize(prescription),
                'message': 'Prescription added successfully'
            }, status=201)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Prescription management
    """
    queryset = RealPrescription.objects.all()
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List prescriptions with filtering"""
        prescriptions = self.queryset
        
        # Filter by patient
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            prescriptions = prescriptions.filter(patient_id=patient_id)
        
        # Filter by consultation
        consultation_id = request.query_params.get('consultation_id')
        if consultation_id:
            prescriptions = prescriptions.filter(consultation_id=consultation_id)
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            prescriptions = prescriptions.filter(status=status_filter)
        
        # Filter active prescriptions
        active_only = request.query_params.get('active_only')
        if active_only == 'true':
            today = timezone.now().date()
            prescriptions = prescriptions.filter(
                start_date__lte=today,
                end_date__gte=today,
                status='active'
            )
        
        # Order by date
        prescriptions = prescriptions.order_by('-created_at')[:100]
        
        # Serialize
        data = [PrescriptionSerializer.serialize(p) for p in prescriptions]
        
        return Response({
            'success': True,
            'prescriptions': data,
            'total': len(data)
        })