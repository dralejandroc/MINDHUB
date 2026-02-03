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
from rest_framework.authentication import SessionAuthentication

from expedix.authentication import SupabaseProxyAuthentication
from django.db import connection
import logging

logger = logging.getLogger(__name__)

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF.
    Útil para APIs que no usan cookies (como Postman / front con JWT).
    """
    def enforce_csrf(self, request):
        return  # simplemente no hace nada => no lanza CSRF error


# Simplified consultation and prescription views using direct SQL queries
# No complex ORM models - direct database access for better compatibility


class ConsultationViewSet(viewsets.ViewSet):
    """
    Consultation management with direct Supabase queries (no ORM models)
    """
    permission_classes = [IsAuthenticated]

    # 👇 Usamos nuestra SessionAuthentication sin CSRF
    authentication_classes = [CsrfExemptSessionAuthentication]
    
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
        import json
        from django.db import connection
        from rest_framework.response import Response

        def coerce_json(value, default):
            """
            Convierte strings tipo '[]' / '{}' a list/dict reales.
            Si ya viene como list/dict, lo deja igual.
            Si viene None o inválido, regresa default.
            """
            if value is None:
                return default

            if isinstance(value, (dict, list)):
                return value

            if isinstance(value, str):
                v = value.strip()
                if v == "":
                    return default
                try:
                    return json.loads(v)
                except Exception:
                    return default

            return default

        try:
            sql = """
                SELECT 
                    c.*,
                    p.full_name AS professional_name
                FROM public.consultations c
                LEFT JOIN public.profiles p ON c.professional_id = p.id
                WHERE 1=1
            """

            params = []

            patient_id = request.query_params.get("patient_id")
            if patient_id:
                sql += " AND c.patient_id = %s::uuid"
                params.append(patient_id)

            consultation_id = request.query_params.get("consultation_id")
            if consultation_id:
                sql += " AND c.id = %s::uuid"
                params.append(consultation_id)

            date_from = request.query_params.get("date_from")
            if date_from:
                sql += " AND c.consultation_date >= %s"
                params.append(date_from)

            date_to = request.query_params.get("date_to")
            if date_to:
                sql += " AND c.consultation_date <= %s"
                params.append(date_to)

            sql += " ORDER BY c.consultation_date DESC LIMIT 100"

            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                columns = [col[0] for col in cursor.description]

                results = []
                for row in cursor.fetchall():
                    consultation_dict = dict(zip(columns, row))

                    # ✅ Normaliza campos que deben ser arrays
                    for f in ("diagnoses", "indications", "linked_assessments", "evaluations", "prescriptions"):
                        consultation_dict[f] = coerce_json(consultation_dict.get(f), [])

                    # ✅ Normaliza campos que deben ser objetos
                    for f in (
                        "mental_exam",
                        "template_config",
                        "form_customizations",
                        "consultation_metadata",
                        "sections_completed",
                        "vital_signs",
                        "next_appointment"
                    ):
                        consultation_dict[f] = coerce_json(consultation_dict.get(f), {})

                    results.append(consultation_dict)

            return Response({
                "success": True,
                "results": results,
                "count": len(results),
                "total": len(results)
            })

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)
    
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
            if not user_context or not user_context.get('license_type'):
                # No fallback context - authentication middleware should have set this
                logger.error('No valid user_context found - authentication required')
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Authentication required - no valid user context found')
            
            license_type = user_context.get('license_type')
            clinic_id = user_context.get('clinic_id') if license_type == 'clinic' else None
            workspace_id = user_context.get('workspace_id') if license_type == 'individual' else None
            
            # Ensure we have either clinic_id or workspace_id but not both (constraint requirement)
            if not clinic_id and not workspace_id:
                return Response({
                    'success': False,
                    'error': 'Database connection failed',
                    'message': f'Supabase error: must have either clinic_id or workspace_id but not both',
                    'timestamp': timezone.now().isoformat()
                }, status=500)
            
            # Additional check for constraint - ensure only one is set
            if clinic_id and workspace_id:
                return Response({
                    'success': False,
                    'error': 'Database connection failed', 
                    'message': f'Supabase error: new row for relation "consultations" violates check constraint "check_consultations_dual_owner"',
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
                    request.data.get('prescriptions', []),  # JSONB field
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
        from django.db import connection
        from django.utils import timezone
        from rest_framework.response import Response
        from psycopg2.extras import Json
        import json

        # Campos JSONB (según tu DB real)
        JSON_FIELDS = {
            "mental_exam",
            "vital_signs",
            "prescriptions",          # ✅ JSONB en tu DB
            "template_config",
            "form_customizations",
            "consultation_metadata",
            "sections_completed",
            "linked_assessments",
            "evaluations",
            "next_appointment",
            "diagnoses",
            "indications",
        }

        # Campos que NO quieres permitir que el front cambie aunque existan
        BLOCKED_FIELDS = {
            "id",
        }

        try:
            print("ENTRANDO AQUI UPDATE", pk)

            with connection.cursor() as cursor:
                update_fields = []
                params = []

                allowed_fields = [
                    # UUIDs
                    "patient_id",
                    "professional_id",
                    "edited_by",
                    "finalized_by",
                    "linked_appointment_id",
                    "quality_reviewer_id",
                    "user_id",

                    # Dates / timestamps
                    "consultation_date",
                    # "created_at",   # (opcional) normalmente NO lo actualizas
                    # "updated_at",   # se setea automático abajo
                    "finalized_at",
                    "quality_review_date",
                    "follow_up_date",

                    # Text fields
                    "consultation_type",
                    "chief_complaint",
                    "history_present_illness",
                    "present_illness",
                    "review_of_systems",
                    "physical_examination",
                    "assessment",
                    "plan",
                    "notes",
                    "treatment_plan",
                    "clinical_notes",
                    "private_notes",
                    "follow_up_instructions",
                    "edit_reason",
                    "quality_notes",
                    "status",

                    # Numeric
                    "duration_minutes",
                    "revision_number",

                    # Booleans
                    "is_billable",
                    "is_draft",
                    "is_finalized",
                    "quality_reviewed",
                    "clinic_id",

                    # Arrays (si en DB realmente son arrays)
                    "diagnosis_codes",

                    # Diagnosis (texto)
                    "diagnosis",

                    # JSONB
                    "vital_signs",
                    "mental_exam",
                    "prescriptions",
                    "template_config",
                    "form_customizations",
                    "consultation_metadata",
                    "sections_completed",
                    "linked_assessments",
                    "evaluations",
                    "next_appointment",
                    "diagnoses",
                    "indications",

                    # Otros campos
                    "additional_instructions",
                    "current_condition",
                ]

                for field in allowed_fields:
                    if field in BLOCKED_FIELDS:
                        continue

                    if field not in request.data:
                        continue

                    value = request.data[field]

                    # ✅ Si viene como string JSON (FormData/multipart), intentar parsearlo
                    if field in JSON_FIELDS and isinstance(value, str):
                        s = value.strip()
                        if (s.startswith("[") and s.endswith("]")) or (s.startswith("{") and s.endswith("}")):
                            try:
                                value = json.loads(s)
                            except Exception:
                                # si no se puede parsear, lo dejamos tal cual
                                pass

                    # ✅ JSONB: dict/list -> Json() para psycopg2
                    if field in JSON_FIELDS and isinstance(value, (dict, list)):
                        value = Json(value)

                    # 🧪 Debug opcional para cazar el campo que rompa por tipo
                    # if isinstance(value, dict):
                    #     print("DICT SIN ADAPTAR:", field, value)

                    update_fields.append(f"{field} = %s")
                    params.append(value)

                if not update_fields:
                    return Response({"success": False, "error": "No valid fields to update"}, status=400)

                # Always update timestamp
                update_fields.append("updated_at = %s")
                params.append(timezone.now())

                # Where
                params.append(pk)

                sql = f"""
                    UPDATE public.consultations
                    SET {', '.join(update_fields)}
                    WHERE id = %s::uuid
                """
                cursor.execute(sql, params)

                if cursor.rowcount == 0:
                    return Response({"success": False, "error": "Consultation not found"}, status=404)

            return Response({
                "success": True,
                "data": {"id": pk, "updated": True},
                "message": "Consultation updated successfully",
            })

        except Exception as e:
            logger.error(f"Error updating consultation: {str(e)}")
            return Response({"success": False, "error": str(e)}, status=500)
    def delete(self, request, pk=None):
        """Delete consultation using direct SQL"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM consultations WHERE id = %s", [pk])
                
                if cursor.rowcount == 0:
                    return Response({
                        'success': False,
                        'error': 'Consultation not found'
                    }, status=404)
            
            return Response({
                'success': True,
                'data': {'id': pk, 'deleted': True},
                'message': 'Consultation deleted successfully'
            })
            
        except Exception as e:
            logger.error(f'Error deleting consultation: {str(e)}')
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
        print("ENTRANDO AQUI")
        try:
            sql = """
                SELECT 
                    id, patient_id, consultation_id, medication_name,
                    dosage, frequency, duration, instructions, status,
                    created_at, updated_at
                FROM public.prescriptions
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

            print("SQL:", sql)
            print("PARAMS:", params)
            
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                columns = [col[0] for col in cursor.description]
                results = []
                for row in cursor.fetchall():
                    prescription_dict = dict(zip(columns, row))
                    results.append(prescription_dict)
            
            return Response({
                'success': True,
                'data': results,
                'count': len(results)
            })
            
        except Exception as e:
            logger.error(f'Error listing prescriptions: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)