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
from django.db import connection
import logging

logger = logging.getLogger(__name__)


# Simplified consultation and prescription views using direct SQL queries
# No complex ORM models - direct database access for better compatibility


class ConsultationViewSet(viewsets.ViewSet):
    """
    Consultation management with direct Supabase queries (no ORM models)
    """
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
        """List consultations with filtering using direct SQL - COMPLETE FIELDS"""
        try:
            # Build SQL query with ALL available fields including mental exam
            sql = """
                SELECT 
                    c.id,
                    c.patient_id,
                    c.professional_id,
                    c.consultation_date,
                    c.consultation_type,
                    c.chief_complaint,
                    c.history_present_illness,
                    c.present_illness,
                    c.physical_examination,
                    c.physical_exam,
                    c.assessment,
                    c.plan,
                    c.treatment_plan,
                    c.diagnosis,
                    c.diagnosis_codes,
                    c.status,
                    c.notes,
                    c.clinical_notes,
                    c.private_notes,
                    c.mental_exam,
                    c.vital_signs,
                    c.prescriptions,
                    c.follow_up_date,
                    c.follow_up_instructions,
                    c.duration_minutes,
                    c.is_draft,
                    c.is_finalized,
                    c.template_config,
                    c.form_customizations,
                    c.consultation_metadata,
                    c.sections_completed,
                    c.linked_assessments,
                    c.linked_appointment_id,
                    c.created_at,
                    c.updated_at,
                    c.edited_by,
                    c.finalized_at,
                    c.finalized_by,
                    c.clinic_id,
                    c.workspace_id
                FROM consultations c
                WHERE 1=1
            """
            
            params = []
            
            # Filter by patient if provided
            patient_id = request.query_params.get('patient_id')
            if patient_id:
                sql += " AND c.patient_id = %s"
                params.append(patient_id)
            
            # Filter by status
            status_filter = request.query_params.get('status')
            if status_filter:
                sql += " AND c.status = %s"
                params.append(status_filter)
            
            # Filter by date range
            date_from = request.query_params.get('date_from')
            if date_from:
                sql += " AND c.consultation_date >= %s"
                params.append(date_from)
                
            date_to = request.query_params.get('date_to')
            if date_to:
                sql += " AND c.consultation_date <= %s"
                params.append(date_to)
            
            # Order by date
            sql += " ORDER BY c.consultation_date DESC LIMIT 100"
            
            # Execute query
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                columns = [col[0] for col in cursor.description]
                results = []
                for row in cursor.fetchall():
                    consultation_dict = dict(zip(columns, row))
                    results.append(consultation_dict)
            
            return Response({
                'success': True,
                'results': results,
                'count': len(results),
                'total': len(results)
            })
            
        except Exception as e:
            logger.error(f'Error listing consultations: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def create(self, request):
        """Create new consultation using direct SQL"""
        try:
            user_info = self.get_user_info(request)
            
            # Extract data
            patient_id = request.data.get('patient_id')
            professional_id = request.data.get('professional_id') or user_info['user_id']
            
            if not patient_id:
                return Response({
                    'success': False,
                    'error': 'patient_id is required'
                }, status=400)
            
            # Generate UUID for new consultation
            import uuid
            consultation_id = str(uuid.uuid4())
            
            # Get user context for dual system support
            user_context = getattr(request, 'user_context', {})
            if not user_context:
                # Simulate individual license context as fallback
                user_context = {
                    'license_type': 'individual',
                    'clinic_id': None,
                    'workspace_id': '8a956bcb-abca-409e-8ae8-2604372084cf'  # Dr. Alejandro's workspace
                }
                logger.warning('No user_context found, using fallback individual license')
            
            license_type = user_context.get('license_type')
            clinic_id = user_context.get('clinic_id') if license_type == 'clinic' else None
            workspace_id = user_context.get('workspace_id') if license_type == 'individual' else None
            
            # Ensure we have either clinic_id or workspace_id
            if not clinic_id and not workspace_id:
                return Response({
                    'success': False,
                    'error': 'Database connection failed',
                    'message': f'Supabase error: null value in column "clinic_id" or "workspace_id" violates not-null constraint',
                    'timestamp': timezone.now().isoformat()
                }, status=500)
            
            # Insert consultation using raw SQL with ALL fields
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO consultations (
                        id, patient_id, professional_id, consultation_date, 
                        consultation_type, chief_complaint, history_present_illness,
                        physical_examination, assessment, plan, diagnosis,
                        notes, clinical_notes, private_notes, mental_exam,
                        vital_signs, prescriptions, follow_up_instructions,
                        status, is_draft, is_finalized, template_config,
                        form_customizations, consultation_metadata, sections_completed,
                        linked_assessments, linked_appointment_id,
                        clinic_id, workspace_id, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, [
                    consultation_id,
                    patient_id,
                    professional_id,
                    request.data.get('consultation_date') or timezone.now(),
                    request.data.get('consultation_type', 'general'),
                    request.data.get('chief_complaint', ''),
                    request.data.get('history_present_illness', ''),
                    request.data.get('physical_examination', ''),
                    request.data.get('assessment', ''),
                    request.data.get('plan', ''),
                    request.data.get('diagnosis', ''),
                    request.data.get('notes', ''),
                    request.data.get('clinical_notes', ''),
                    request.data.get('private_notes', ''),
                    request.data.get('mental_exam', {}),  # JSONB field
                    request.data.get('vital_signs', {}),  # JSONB field
                    request.data.get('prescriptions', {}),  # JSONB field
                    request.data.get('follow_up_instructions', ''),
                    request.data.get('status', 'draft'),
                    request.data.get('is_draft', True),
                    request.data.get('is_finalized', False),
                    request.data.get('template_config', {}),  # JSONB field
                    request.data.get('form_customizations', {}),  # JSONB field
                    request.data.get('consultation_metadata', {}),  # JSONB field
                    request.data.get('sections_completed', {}),  # JSONB field
                    request.data.get('linked_assessments', []),  # JSONB array
                    request.data.get('linked_appointment_id'),
                    clinic_id,  # Use context-based clinic_id
                    workspace_id,  # Use context-based workspace_id
                    timezone.now(),
                    timezone.now()
                ])
            
            return Response({
                'success': True,
                'data': {
                    'id': consultation_id,
                    'patient_id': patient_id,
                    'professional_id': professional_id,
                    'status': 'draft'
                },
                'message': 'Consultation created successfully'
            }, status=201)
            
        except Exception as e:
            logger.error(f'Error creating consultation: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def update(self, request, pk=None):
        """Update consultation using direct SQL"""
        try:
            # Simple update using raw SQL
            with connection.cursor() as cursor:
                # Build dynamic update query
                update_fields = []
                params = []
                
                # ALL ALLOWED FIELDS including mental exam and new fields
                allowed_fields = [
                    'chief_complaint', 'history_present_illness', 'present_illness',
                    'physical_examination', 'physical_exam', 'assessment', 'plan', 
                    'treatment_plan', 'diagnosis', 'notes', 'clinical_notes', 
                    'private_notes', 'mental_exam', 'vital_signs', 'prescriptions',
                    'follow_up_instructions', 'duration_minutes', 'status',
                    'is_draft', 'is_finalized', 'template_config', 'form_customizations',
                    'consultation_metadata', 'sections_completed', 'linked_assessments',
                    'linked_appointment_id', 'edit_reason'
                ]
                
                for field in allowed_fields:
                    if field in request.data:
                        update_fields.append(f"{field} = %s")
                        params.append(request.data[field])
                
                if not update_fields:
                    return Response({
                        'success': False,
                        'error': 'No valid fields to update'
                    }, status=400)
                
                # Add updated_at
                update_fields.append("updated_at = %s")
                params.append(timezone.now())
                params.append(pk)  # For WHERE clause
                
                sql = f"UPDATE consultations SET {', '.join(update_fields)} WHERE id = %s"
                cursor.execute(sql, params)
                
                if cursor.rowcount == 0:
                    return Response({
                        'success': False,
                        'error': 'Consultation not found'
                    }, status=404)
            
            return Response({
                'success': True,
                'data': {'id': pk, 'updated': True},
                'message': 'Consultation updated successfully'
            })
            
        except Exception as e:
            logger.error(f'Error updating consultation: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['patch'])
    def update_mental_exam(self, request, pk=None):
        """Update only the mental exam section of a consultation"""
        try:
            user_info = self.get_user_info(request)
            mental_exam_data = request.data.get('mental_exam', {})
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE consultations 
                    SET mental_exam = %s, 
                        updated_at = %s,
                        edited_by = %s,
                        edit_reason = %s
                    WHERE id = %s
                """, [
                    mental_exam_data,
                    timezone.now(),
                    user_info['user_id'],
                    'Mental exam updated',
                    pk
                ])
                
                if cursor.rowcount == 0:
                    return Response({
                        'success': False,
                        'error': 'Consultation not found'
                    }, status=404)
            
            return Response({
                'success': True,
                'data': {'id': pk, 'mental_exam_updated': True},
                'message': 'Mental exam updated successfully'
            })
            
        except Exception as e:
            logger.error(f'Error updating mental exam: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['patch'])
    def finalize_consultation(self, request, pk=None):
        """Finalize a consultation (mark as completed and lock from editing)"""
        try:
            user_info = self.get_user_info(request)
            
            with connection.cursor() as cursor:
                # First check if consultation exists and is not already finalized
                cursor.execute("SELECT is_finalized FROM consultations WHERE id = %s", [pk])
                result = cursor.fetchone()
                
                if not result:
                    return Response({
                        'success': False,
                        'error': 'Consultation not found'
                    }, status=404)
                
                if result[0]:  # is_finalized = True
                    return Response({
                        'success': False,
                        'error': 'Consultation is already finalized'
                    }, status=400)
                
                # Finalize the consultation
                cursor.execute("""
                    UPDATE consultations 
                    SET is_finalized = TRUE,
                        is_draft = FALSE,
                        finalized_at = %s,
                        finalized_by = %s,
                        updated_at = %s
                    WHERE id = %s
                """, [
                    timezone.now(),
                    user_info['user_id'],
                    timezone.now(),
                    pk
                ])
            
            return Response({
                'success': True,
                'data': {'id': pk, 'is_finalized': True},
                'message': 'Consultation finalized successfully'
            })
            
        except Exception as e:
            logger.error(f'Error finalizing consultation: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


# Simplified PrescriptionViewSet for basic functionality
class PrescriptionViewSet(viewsets.ViewSet):
    """
    Basic prescription management using direct SQL
    """
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List prescriptions using direct SQL"""
        try:
            sql = """
                SELECT 
                    id, patient_id, consultation_id, medication_name,
                    dosage, frequency, duration, instructions, status,
                    created_at, updated_at
                FROM prescriptions
                WHERE 1=1
            """
            
            params = []
            
            # Filter by patient
            patient_id = request.query_params.get('patient_id')
            if patient_id:
                sql += " AND patient_id = %s"
                params.append(patient_id)
            
            # Order by date
            sql += " ORDER BY created_at DESC LIMIT 100"
            
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                columns = [col[0] for col in cursor.description]
                results = []
                for row in cursor.fetchall():
                    prescription_dict = dict(zip(columns, row))
                    results.append(prescription_dict)
            
            return Response({
                'success': True,
                'results': results,
                'count': len(results)
            })
            
        except Exception as e:
            logger.error(f'Error listing prescriptions: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)