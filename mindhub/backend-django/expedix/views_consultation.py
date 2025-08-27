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
        """List consultations with filtering using direct SQL"""
        try:
            # Build SQL query
            sql = """
                SELECT 
                    c.id,
                    c.patient_id,
                    c.professional_id,
                    c.consultation_date,
                    c.consultation_type,
                    c.chief_complaint,
                    c.history_present_illness,
                    c.physical_examination,
                    c.assessment,
                    c.plan,
                    c.diagnosis,
                    c.status,
                    c.is_draft,
                    c.is_finalized,
                    c.notes,
                    c.clinical_notes,
                    c.private_notes,
                    c.prescriptions,
                    c.vital_signs,
                    c.follow_up_date,
                    c.follow_up_instructions,
                    c.duration_minutes,
                    c.created_at,
                    c.updated_at,
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
            
            # Insert consultation using raw SQL
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO consultations (
                        id, patient_id, professional_id, consultation_date, 
                        consultation_type, chief_complaint, status, 
                        clinic_id, workspace_id, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, [
                    consultation_id,
                    patient_id,
                    professional_id,
                    request.data.get('consultation_date') or timezone.now(),
                    request.data.get('consultation_type', 'general'),
                    request.data.get('chief_complaint', ''),
                    'draft',
                    request.data.get('clinic_id'),
                    request.data.get('workspace_id'),
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
                
                allowed_fields = [
                    'chief_complaint', 'history_present_illness', 'physical_examination',
                    'assessment', 'plan', 'diagnosis', 'notes'
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