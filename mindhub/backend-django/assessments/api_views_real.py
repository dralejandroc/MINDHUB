"""
ClinimetrixPro API Views - REAL Supabase Schema
Fixed to use actual database structure from SUPABASE_TABLES_REFERENCE.md
"""

import json
import logging
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View

# Import REAL models that match Supabase structure
from .models_real import (
    ClinimetrixAssessment, 
    ClinimetrixResponse, 
    PsychometricScale,
    create_assessment_bridge
)
from expedix.models import Patient  # Use the REAL patients table

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def create_assessment_from_react_real(request):
    """
    CORRECTED: Create assessment using REAL Supabase schema
    - Uses actual patients table (NOT clinimetrix_patients)
    - Uses psychometric_scales.abbreviation (CORRECTED field name) 
    - Creates clinimetrix_assessments with proper UUIDs
    """
    try:
        data = json.loads(request.body)
        
        # Extract data from request
        patient_data = data.get('patient_data', {})
        scale_abbreviation = data.get('scale_abbreviation')
        return_url = data.get('return_url', 'http://localhost:3000/dashboard')
        
        if not scale_abbreviation:
            return JsonResponse({
                'success': False,
                'error': 'scale_abbreviation is required'
            }, status=400)

        # 🔍 STEP 1: Find scale using REAL field name (abbreviation)
        try:
            scale = PsychometricScale.objects.get(
                abbreviation=scale_abbreviation,  # CORRECTED field name!
                is_active=True
            )
        except PsychometricScale.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Scale {scale_abbreviation} not found in psychometric_scales'
            }, status=404)

        # 🔍 STEP 2: Get patient from REAL patients table
        patient_id = patient_data.get('id')
        if not patient_id:
            return JsonResponse({
                'success': False,
                'error': 'patient.id is required'
            }, status=400)

        try:
            # Use the REAL patients table from expedix
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Patient {patient_id} not found in patients table'
            }, status=404)

        # 🔍 STEP 3: Get administrator (current user)
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Authentication required'
            }, status=401)

        # Get user's profile ID for administrator_id
        administrator_id = str(request.user.id)

        # 🔍 STEP 4: Create assessment using REAL structure
        assessment = create_assessment_bridge(
            template_id=scale_abbreviation,  # Store scale code as template_id
            patient_id=str(patient.id),
            administrator_id=administrator_id,
            consultation_id=None,  # Could be passed from frontend if needed
            mode="self"  # Default mode
        )

        # Build assessment URL for Django focused_take
        base_url = request.build_absolute_uri('/')
        assessment_url = f"{base_url}assessments/{assessment.id}/focused-take/?return_url={return_url}"

        logger.info(f"✅ Assessment created: {assessment.id} for patient {patient.id}")

        return JsonResponse({
            'success': True,
            'assessment_id': str(assessment.id),
            'assessment_url': assessment_url,
            'patient_id': str(patient.id),
            'scale_name': scale.name,
            'return_url': return_url,
            'message': f'Assessment {scale_abbreviation} created successfully'
        })

    except Exception as e:
        logger.error(f"❌ Error creating assessment: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Error creating assessment: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def get_patient_assessments_real(request, patient_id):
    """
    Get all assessments for a patient using REAL schema
    """
    try:
        # Verify patient exists in REAL patients table
        patient = get_object_or_404(Patient, id=patient_id)
        
        # Get assessments from REAL clinimetrix_assessments table
        assessments = ClinimetrixAssessment.objects.filter(
            patient_id=patient_id
        ).order_by('-created_at')[:10]  # Limit to last 10
        
        # Format response
        assessments_data = []
        for assessment in assessments:
            assessments_data.append({
                'id': str(assessment.id),
                'template_id': assessment.template_id,
                'status': assessment.status,
                'mode': assessment.mode,
                'started_at': assessment.started_at.isoformat() if assessment.started_at else None,
                'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
                'created_at': assessment.created_at.isoformat(),
                'duration_seconds': assessment.duration_seconds
            })
        
        return JsonResponse({
            'success': True,
            'patient_id': str(patient.id),
            'patient_name': patient.full_name,
            'assessments': assessments_data,
            'total': len(assessments_data)
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting patient assessments: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])  
def save_assessment_responses_real(request, assessment_id):
    """
    Save responses using REAL clinimetrix_responses table
    """
    try:
        assessment = get_object_or_404(ClinimetrixAssessment, id=assessment_id)
        data = json.loads(request.body)
        
        responses_data = data.get('responses', {})
        
        # Save each response to clinimetrix_responses table
        for question_id, response_value in responses_data.items():
            ClinimetrixResponse.objects.update_or_create(
                assessment_id=assessment.id,
                question_id=str(question_id),
                defaults={
                    'response_value': float(response_value) if response_value is not None else None
                }
            )
        
        # Update assessment responses JSONB field as well
        assessment.responses = responses_data
        assessment.save()
        
        logger.info(f"✅ Responses saved for assessment {assessment_id}")
        
        return JsonResponse({
            'success': True,
            'assessment_id': str(assessment.id),
            'responses_count': len(responses_data)
        })
        
    except Exception as e:
        logger.error(f"❌ Error saving responses: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def complete_assessment_real(request, assessment_id):
    """
    Complete assessment and calculate scores using REAL schema
    """
    try:
        assessment = get_object_or_404(ClinimetrixAssessment, id=assessment_id)
        data = json.loads(request.body)
        
        # Update assessment status and completion time
        assessment.status = 'completed'
        assessment.completed_at = timezone.now()
        
        # Store final results in JSONB fields
        final_responses = data.get('responses', {})
        assessment.responses = final_responses
        
        # Calculate scores (basic implementation)
        total_score = sum([float(v) for v in final_responses.values() if v is not None])
        assessment.scores = {
            'total_score': total_score,
            'raw_scores': final_responses,
            'calculated_at': timezone.now().isoformat()
        }
        
        # Add basic interpretation
        assessment.interpretations = {
            'total_score': total_score,
            'interpretation': 'Score calculated automatically',
            'timestamp': timezone.now().isoformat()
        }
        
        assessment.save()
        
        logger.info(f"✅ Assessment completed: {assessment_id}")
        
        return JsonResponse({
            'success': True,
            'assessment_id': str(assessment.id),
            'status': assessment.status,
            'total_score': total_score,
            'completed_at': assessment.completed_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error completing assessment: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def get_assessment_status_real(request, assessment_id):
    """
    Get assessment status using REAL schema
    """
    try:
        assessment = get_object_or_404(ClinimetrixAssessment, id=assessment_id)
        
        return JsonResponse({
            'success': True,
            'assessment_id': str(assessment.id),
            'status': assessment.status,
            'mode': assessment.mode,
            'template_id': assessment.template_id,
            'patient_id': str(assessment.patient_id),
            'started_at': assessment.started_at.isoformat() if assessment.started_at else None,
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'has_responses': bool(assessment.responses),
            'responses_count': len(assessment.responses or {}),
            'is_completed': assessment.is_completed
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==============================================================================
# SCALES CATALOG API (Bridge to React)
# ==============================================================================

@require_http_methods(["GET"])
def get_scales_catalog_real(request):
    """
    Get scales catalog from REAL psychometric_scales table
    """
    try:
        scales = PsychometricScale.objects.filter(is_active=True).order_by('scale_name')
        
        catalog = []
        for scale in scales:
            catalog.append({
                'id': str(scale.id),
                'scale_code': scale.abbreviation,  # CORRECTED field name
                'name': scale.scale_name,          # CORRECTED field name
                'description': scale.description,
                'category': scale.category,
                'version': scale.version,
                'total_items': scale.total_items,  # CORRECTED field name
                'is_active': scale.is_active
            })
        
        return JsonResponse({
            'success': True,
            'scales': catalog,
            'total': len(catalog)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)