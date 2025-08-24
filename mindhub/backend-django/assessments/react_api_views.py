"""
API endpoints for React frontend compatibility
Compatible con clinimetrix-pro-client.ts de React
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from psychometric_scales.models import PsychometricScale, ScaleCategory, ScaleTag


@csrf_exempt
@require_http_methods(["GET"])
def get_template_catalog(request):
    """
    Endpoint compatible con clinimetrixProClient.getTemplateCatalog()
    Devuelve lista de escalas en formato esperado por React
    """
    try:
        scales = PsychometricScale.objects.filter(is_active=True).prefetch_related('tags')
        
        catalog = []
        for scale in scales:
            # Format compatible with React ClinimetrixRegistry interface
            scale_data = {
                'templateId': scale.abbreviation.lower(),  # ID único para React
                'id': str(scale.id),
                'name': scale.name,
                'abbreviation': scale.abbreviation,
                'category': getattr(scale.category, 'name', 'General') if hasattr(scale, 'category') and scale.category else 'General',
                'description': scale.description,
                'authors': scale.authors,
                'year': scale.year,
                'language': 'es',  # Assume Spanish for now
                'totalItems': scale.total_items,
                'administrationTime': scale.estimated_duration_minutes,
                'targetPopulation': scale.get_population_display(),
                'applicationType': scale.get_application_type_display(),
                'isActive': scale.is_active,
                'isValidated': scale.is_validated,
                'requiresTraining': scale.requires_training,
                'tags': [tag.name for tag in scale.tags.all()],
                'usageCount': scale.usage_count,
                'createdAt': scale.created_at.isoformat(),
                'updatedAt': scale.updated_at.isoformat(),
                'psychometricProperties': {
                    'reliabilityAlpha': scale.reliability_alpha,
                    'sensitivity': scale.sensitivity,
                    'specificity': scale.specificity,
                    'testRetestReliability': scale.test_retest_reliability
                } if any([scale.reliability_alpha, scale.sensitivity, scale.specificity]) else None
            }
            
            catalog.append(scale_data)
        
        # Sort by name, with favorites potentially first (handled by React)
        catalog.sort(key=lambda x: x['name'])
        
        return JsonResponse(catalog, safe=False)
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error loading template catalog: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_template(request, template_id):
    """
    Endpoint compatible con clinimetrixProClient.getTemplate(templateId)
    Devuelve plantilla JSON completa para rendering
    """
    try:
        # template_id puede ser abbreviation o ID real
        try:
            scale = PsychometricScale.objects.get(abbreviation=template_id.upper(), is_active=True)
        except PsychometricScale.DoesNotExist:
            scale = get_object_or_404(PsychometricScale, id=template_id, is_active=True)
        
        # Cargar JSON de la escala
        import os
        from django.conf import settings
        
        json_path = os.path.join(settings.BASE_DIR, scale.json_file_path)
        
        if not os.path.exists(json_path):
            return JsonResponse({
                'error': f'Template file not found: {scale.json_file_path}'
            }, status=404)
        
        with open(json_path, 'r', encoding='utf-8') as f:
            template_data = json.load(f)
        
        # Increment usage counter
        scale.increment_usage()
        
        return JsonResponse(template_data)
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error loading template: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_assessment(request):
    """
    Endpoint compatible con clinimetrixProClient.createAssessment()
    Crea una nueva evaluación
    """
    try:
        data = json.loads(request.body)
        
        template_id = data.get('templateId')
        patient_data = data.get('patientData', {})
        
        if not template_id:
            return JsonResponse({
                'success': False,
                'error': 'templateId is required'
            }, status=400)
        
        # Find scale
        try:
            scale = PsychometricScale.objects.get(abbreviation=template_id.upper(), is_active=True)
        except PsychometricScale.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Scale {template_id} not found'
            }, status=404)
        
        # Create patient if needed (simplified for compatibility)
        from assessments.models import Patient, Assessment
        
        patient = None
        if patient_data.get('id'):
            try:
                patient = Patient.objects.get(id=patient_data['id'])
            except Patient.DoesNotExist:
                pass
        
        if not patient:
            # Create temporary patient
            patient = Patient.objects.create(
                first_name=patient_data.get('name', 'Paciente'),
                last_name=patient_data.get('lastName', 'Temporal'),
                age=patient_data.get('age'),
                created_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            )
        
        # Create assessment
        assessment = Assessment.objects.create(
            patient=patient,
            scale=scale,
            created_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
            total_items=scale.total_items,
            status='not_started'
        )
        
        return JsonResponse({
            'success': True,
            'assessmentId': str(assessment.id),
            'templateId': template_id,
            'patientId': str(patient.id),
            'totalItems': scale.total_items,
            'createdAt': assessment.created_at.isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def save_responses(request, assessment_id):
    """
    Endpoint compatible con clinimetrixProClient.saveResponses()
    Guarda respuestas de una evaluación
    """
    try:
        from assessments.models import Assessment, AssessmentResponse
        
        assessment = get_object_or_404(Assessment, id=assessment_id)
        
        data = json.loads(request.body)
        responses = data.get('responses', {})
        
        # Save each response
        for item_number, response_data in responses.items():
            AssessmentResponse.objects.update_or_create(
                assessment=assessment,
                item_number=int(item_number),
                defaults={
                    'response_value': response_data.get('value', 0),
                    'response_label': response_data.get('label', ''),
                    'timestamp': timezone.now()
                }
            )
        
        # Update assessment progress
        assessment.current_item = max(int(k) for k in responses.keys()) if responses else 0
        if assessment.status == 'not_started':
            assessment.status = 'in_progress'
            assessment.started_at = timezone.now()
        assessment.save()
        
        return JsonResponse({
            'success': True,
            'assessmentId': str(assessment.id),
            'responsesSaved': len(responses),
            'currentItem': assessment.current_item
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def complete_assessment(request, assessment_id):
    """
    Endpoint compatible con clinimetrixProClient.completeAssessment()
    Completa evaluación y calcula resultados
    """
    try:
        from assessments.models import Assessment
        from assessments.api_views import AssessmentCompleteView
        
        assessment = get_object_or_404(Assessment, id=assessment_id)
        
        # Use existing completion logic
        complete_view = AssessmentCompleteView()
        
        # Mark as completed
        assessment.status = 'completed'
        assessment.completed_at = timezone.now()
        assessment.calculate_duration()
        assessment.save()
        
        # Calculate scoring
        scoring_result = complete_view.calculate_scoring(assessment)
        
        return JsonResponse({
            'success': True,
            'assessmentId': str(assessment.id),
            'completedAt': assessment.completed_at.isoformat(),
            'durationMinutes': assessment.duration_minutes,
            'results': {
                'totalScore': scoring_result.total_score,
                'interpretationLabel': scoring_result.interpretation_label,
                'severityLevel': scoring_result.severity_level,
                'severityColor': scoring_result.severity_color,
                'isValid': scoring_result.is_valid
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for Django backend
    """
    try:
        # Quick database test
        scales_count = PsychometricScale.objects.filter(is_active=True).count()
        
        return JsonResponse({
            'status': 'healthy',
            'service': 'Django ClinimetrixPro Backend',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'activeScales': scales_count,
            'version': '1.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)