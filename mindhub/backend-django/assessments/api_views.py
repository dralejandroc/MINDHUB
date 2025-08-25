"""
API views for assessments
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from .models import Assessment, AssessmentResponse, ScoringResult, Patient, ScheduledAssessment, RemoteAssessmentLink
from psychometric_scales.models import PsychometricScale
from datetime import datetime, timedelta
import secrets
from django.conf import settings


@method_decorator([login_required, csrf_exempt], name='dispatch')
class AssessmentProgressView(View):
    """Get and update assessment progress"""
    
    def get(self, request, assessment_id):
        """Get current progress"""
        assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
        
        # Get existing responses
        responses = {}
        for response in assessment.responses.all():
            responses[response.item_number] = response.response_value
        
        return JsonResponse({
            'current_item': assessment.current_item,
            'total_items': assessment.total_items,
            'status': assessment.status,
            'responses': responses
        })
    
    def post(self, request, assessment_id):
        """Update progress"""
        assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
        
        try:
            data = json.loads(request.body)
            assessment.current_item = data.get('current_item', assessment.current_item)
            
            # Update status if provided
            new_status = data.get('status')
            if new_status and new_status in [choice[0] for choice in Assessment.Status.choices]:
                assessment.status = new_status
                
                # Set timestamps based on status
                if new_status == Assessment.Status.IN_PROGRESS and not assessment.started_at:
                    assessment.started_at = timezone.now()
                elif new_status == Assessment.Status.COMPLETED and not assessment.completed_at:
                    assessment.completed_at = timezone.now()
                    assessment.calculate_duration()
            
            assessment.save()
            
            return JsonResponse({'success': True})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator([login_required, csrf_exempt], name='dispatch')
class AssessmentResponseView(View):
    """Save individual responses"""
    
    def post(self, request, assessment_id):
        """Save a response"""
        assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
        
        try:
            data = json.loads(request.body)
            item_number = data.get('item_number')
            response_value = data.get('response_value')
            response_label = data.get('response_label')
            
            if item_number is None or response_value is None:
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            # Create or update response
            response, created = AssessmentResponse.objects.update_or_create(
                assessment=assessment,
                item_number=item_number,
                defaults={
                    'response_value': response_value,
                    'response_label': response_label or '',
                    'timestamp': timezone.now()
                }
            )
            
            if not created:
                response.is_changed = True
                response.change_count += 1
                response.save()
            
            return JsonResponse({'success': True, 'created': created})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator([login_required, csrf_exempt], name='dispatch')
class AssessmentCompleteView(View):
    """Complete an assessment and calculate results"""
    
    def post(self, request, assessment_id):
        """Complete assessment"""
        assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
        
        try:
            # Mark as completed
            assessment.status = Assessment.Status.COMPLETED
            assessment.completed_at = timezone.now()
            assessment.calculate_duration()
            assessment.save()
            
            # Calculate scoring
            self.calculate_scoring(assessment)
            
            return JsonResponse({
                'success': True,
                'completed_at': assessment.completed_at.isoformat(),
                'duration_minutes': assessment.duration_minutes
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    def calculate_scoring(self, assessment):
        """Calculate scoring results"""
        responses = assessment.responses.all()
        
        # Calculate total score (sum of all responses)
        total_score = sum(response.response_value for response in responses)
        
        # Get scale data for interpretation
        try:
            import os
            import json as json_module
            from django.conf import settings
            
            # Use the json_file_path from the scale model
            json_path = os.path.join(settings.BASE_DIR, assessment.scale.json_file_path)
            
            interpretation_label = "Sin interpretación"
            severity_level = "unknown"
            severity_color = "#6b7280"
            
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    scale_data = json_module.load(f)
                
                # Find interpretation based on the actual JSON structure
                interpretation_info = scale_data.get('interpretation', {})
                rules = interpretation_info.get('rules', [])
                
                for rule in rules:
                    min_score = rule.get('minScore', 0)
                    max_score = rule.get('maxScore', 999)
                    if min_score <= total_score <= max_score:
                        interpretation_label = rule.get('label', 'Sin interpretación')
                        severity_level = rule.get('severity', 'unknown')
                        # Get color directly from rule
                        severity_color = rule.get('color', '#6b7280')
                        break
            else:
                print(f"JSON file not found: {json_path}")
                interpretation_label = "Archivo de escala no encontrado"
                
        except Exception as e:
            print(f"Error loading scale data: {e}")
            interpretation_label = f"Error al cargar interpretación: {str(e)}"
        
        # Create or update scoring result
        scoring_result, created = ScoringResult.objects.update_or_create(
            assessment=assessment,
            defaults={
                'total_score': total_score,
                'total_score_raw': total_score,
                'interpretation_label': interpretation_label,
                'severity_level': severity_level,
                'severity_color': severity_color,
                'computed_by': assessment.created_by,
                'is_valid': True
            }
        )
        
        return scoring_result


@login_required
@require_http_methods(["GET"])
def assessment_results_data(request, assessment_id):
    """Get assessment results data"""
    assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
    
    try:
        scoring_result = assessment.scoring_result
        responses = list(assessment.responses.values(
            'item_number', 'response_value', 'response_label'
        ))
        
        return JsonResponse({
            'assessment_id': str(assessment.id),
            'scale_name': assessment.scale.name,
            'scale_abbreviation': assessment.scale.abbreviation,
            'patient_name': assessment.patient.get_full_name(),
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'duration_minutes': assessment.duration_minutes,
            'total_score': scoring_result.total_score,
            'interpretation': scoring_result.interpretation_label,
            'severity_level': scoring_result.severity_level,
            'severity_color': scoring_result.severity_color,
            'responses': responses,
            'is_valid': scoring_result.is_valid
        })
        
    except ScoringResult.DoesNotExist:
        return JsonResponse({
            'error': 'Results not calculated yet'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@require_http_methods(["GET"])
def assessment_scale_data_path(request, assessment_id):
    """Get the JSON file path for the assessment's scale"""
    assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
    
    return JsonResponse({
        'assessment_id': str(assessment.id),
        'scale_abbreviation': assessment.scale.abbreviation,
        'json_file_path': assessment.scale.json_file_path,
        'scale_name': assessment.scale.name
    })


@login_required
@require_http_methods(["GET"])
def assessment_status(request, assessment_id):
    """Get current assessment status"""
    assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
    
    return JsonResponse({
        'assessment_id': str(assessment.id),
        'status': assessment.status,
        'current_item': assessment.current_item,
        'total_items': assessment.total_items,
        'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None
    })


@login_required
@require_http_methods(["POST"])
def notify_completion(request, assessment_id):
    """Notify that a remote assessment has been completed"""
    assessment = get_object_or_404(Assessment, id=assessment_id, created_by=request.user)
    
    try:
        data = json.loads(request.body)
        
        # Mark as completed if it was done remotely
        if data.get('completed_by_remote'):
            assessment.status = Assessment.Status.COMPLETED
            if not assessment.completed_at:
                assessment.completed_at = timezone.now()
                assessment.calculate_duration()
            assessment.save()
            
            # Calculate scoring if not already done
            if not hasattr(assessment, 'scoring_result') or not assessment.scoring_result:
                complete_view = AssessmentCompleteView()
                complete_view.calculate_scoring(assessment)
        
        return JsonResponse({'success': True, 'status': assessment.status})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@method_decorator([login_required, csrf_exempt], name='dispatch')
class CreateScheduledAssessmentView(View):
    """Create scheduled assessments for longitudinal tracking"""
    
    def post(self, request):
        try:
            data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
            
            # Get required data
            patient_id = data.get('patient_id')
            scale_id = data.get('scale_id')
            title = data.get('title')
            frequency = data.get('frequency')
            start_date = data.get('start_date')
            
            # Validate required fields
            if not all([patient_id, scale_id, title, frequency, start_date]):
                return JsonResponse({
                    'success': False,
                    'error': 'Faltan campos obligatorios'
                }, status=400)
            
            # Get patient and scale
            patient = get_object_or_404(Patient, id=patient_id, created_by=request.user)
            scale = get_object_or_404(PsychometricScale, id=scale_id, is_active=True)
            
            # Parse dates
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = None
            if data.get('end_date'):
                end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
            
            # Calculate next due date based on frequency
            if frequency == 'weekly':
                next_due_date = start_date + timedelta(weeks=1)
            elif frequency == 'biweekly':
                next_due_date = start_date + timedelta(weeks=2)
            elif frequency == 'monthly':
                next_due_date = start_date + timedelta(days=30)
            elif frequency == 'quarterly':
                next_due_date = start_date + timedelta(days=90)
            elif frequency == 'custom':
                frequency_days = int(data.get('frequency_days', 7))
                next_due_date = start_date + timedelta(days=frequency_days)
            else:
                next_due_date = start_date + timedelta(weeks=1)
            
            # Create scheduled assessment
            scheduled = ScheduledAssessment.objects.create(
                patient=patient,
                scale=scale,
                created_by=request.user,
                title=title,
                description=data.get('description', ''),
                frequency=frequency,
                frequency_days=data.get('frequency_days') if frequency == 'custom' else None,
                start_date=start_date,
                end_date=end_date,
                next_due_date=next_due_date,
                next_consultation_date=data.get('next_consultation_date'),
                send_remote_link=data.get('send_remote_link', False),
                status='active'
            )
            
            return JsonResponse({
                'success': True,
                'scheduled_id': str(scheduled.id),
                'message': f'Evaluación programada "{title}" creada exitosamente',
                'next_due_date': next_due_date.isoformat()
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_and_start_assessment_from_react(request):
    """
    Endpoint bridge para crear assessment desde React y redirigir a focused_take
    """
    try:
        data = json.loads(request.body)
        
        # Obtener datos del request
        patient_data = data.get('patient_data', {})
        scale_abbreviation = data.get('scale_abbreviation')
        from django.conf import settings
        react_base_url = getattr(settings, 'REACT_FRONTEND_URL', 'http://localhost:3000')
        return_url = data.get('return_url', f'{react_base_url}/dashboard')
        
        if not scale_abbreviation:
            return JsonResponse({
                'success': False,
                'error': 'scale_abbreviation es requerido'
            }, status=400)
        
        # Buscar escala
        try:
            scale = PsychometricScale.objects.get(
                abbreviation=scale_abbreviation,
                is_active=True
            )
        except PsychometricScale.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Escala {scale_abbreviation} no encontrada'
            }, status=404)
        
        # Crear/actualizar paciente desde datos de React
        patient = None
        if patient_data:
            # Buscar por email o crear nuevo
            email = patient_data.get('email', '')
            if email:
                patient, created = Patient.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': patient_data.get('firstName', patient_data.get('first_name', '')),
                        'last_name': patient_data.get('lastName', patient_data.get('last_name', '')),
                        'date_of_birth': patient_data.get('dateOfBirth', patient_data.get('date_of_birth')),
                        'phone': patient_data.get('phone', ''),
                        'gender': patient_data.get('gender', ''),
                        'created_by': request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                    }
                )
            else:
                # Crear paciente temporal si no hay email
                patient = Patient.objects.create(
                    first_name=patient_data.get('firstName', patient_data.get('first_name', 'Paciente')),
                    last_name=patient_data.get('lastName', patient_data.get('last_name', 'Temporal')),
                    date_of_birth=patient_data.get('dateOfBirth', patient_data.get('date_of_birth')),
                    phone=patient_data.get('phone', ''),
                    gender=patient_data.get('gender', ''),
                    created_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                )
        
        if not patient:
            return JsonResponse({
                'success': False,
                'error': 'No se pudieron procesar los datos del paciente'
            }, status=400)
        
        # Crear assessment
        assessment = Assessment.objects.create(
            patient=patient,
            scale=scale,
            created_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
            total_items=scale.total_items,
            status='not_started',
            mode='self_administered'
        )
        
        # URL del focused_take - usando configuración de settings
        from django.conf import settings
        django_base_url = getattr(settings, 'DJANGO_BASE_URL', 'http://localhost:8000')
        assessment_url = f"{django_base_url}/assessments/{assessment.id}/focused-take/?return_url={return_url}"
        
        return JsonResponse({
            'success': True,
            'assessment_id': str(assessment.id),
            'assessment_url': assessment_url,
            'patient_id': str(patient.id),
            'scale_name': scale.name,
            'return_url': return_url,
            'message': f'Assessment {scale.abbreviation} creado exitosamente para {patient.get_full_name()}'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'JSON inválido en el request'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }, status=500)


@method_decorator([login_required, csrf_exempt], name='dispatch')
class CreateRemoteLinkView(View):
    """Create remote assessment links"""
    
    def post(self, request):
        try:
            data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
            
            # Get required data
            patient_id = data.get('patient_id')
            scale_id = data.get('scale_id')
            expires_at = data.get('expires_at')
            
            # Validate required fields
            if not all([patient_id, scale_id, expires_at]):
                return JsonResponse({
                    'success': False,
                    'error': 'Faltan campos obligatorios'
                }, status=400)
            
            # Get patient and scale
            patient = get_object_or_404(Patient, id=patient_id, created_by=request.user)
            scale = get_object_or_404(PsychometricScale, id=scale_id, is_active=True)
            
            # Parse expiration datetime
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            # Generate secure token
            token = secrets.token_urlsafe(32)
            
            # Create remote link
            remote_link = RemoteAssessmentLink.objects.create(
                patient=patient,
                scale=scale,
                created_by=request.user,
                token=token,
                clinical_context=data.get('clinical_context', ''),
                instructions=data.get('instructions', ''),
                expires_at=expires_at,
                max_uses=int(data.get('max_uses', 1))
            )
            
            # Build absolute URL
            from django.urls import reverse
            relative_url = reverse('assessments:remote_take', kwargs={'token': token})
            absolute_url = request.build_absolute_uri(relative_url)
            
            return JsonResponse({
                'success': True,
                'link_id': str(remote_link.id),
                'token': token,
                'url': absolute_url,
                'message': 'Enlace remoto generado exitosamente',
                'expires_at': expires_at.isoformat()
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PatientAssessmentsView(View):
    """
    Get assessments for a specific patient
    Compatible with Expedix frontend
    """
    
    def get(self, request, patient_id):
        """Get all assessments for a patient"""
        try:
            # Get patient (verify it exists and user has access)
            try:
                from expedix.models import Patient
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Patient not found'
                }, status=404)
            
            # Get assessments for this patient
            assessments = Assessment.objects.filter(
                patient_id=patient_id
            ).select_related('scale').order_by('-created_at')
            
            # Serialize assessments data
            assessments_data = []
            for assessment in assessments:
                # Get scoring result if exists
                scoring_result = None
                try:
                    scoring_result = assessment.scoring_results.latest('created_at')
                except ScoringResult.DoesNotExist:
                    pass
                
                assessments_data.append({
                    'id': str(assessment.id),
                    'scale_name': assessment.scale.name if assessment.scale else 'Unknown Scale',
                    'scale_abbreviation': assessment.scale.abbreviation if assessment.scale else 'N/A',
                    'status': assessment.status,
                    'score': scoring_result.score if scoring_result else None,
                    'interpretation': scoring_result.interpretation if scoring_result else None,
                    'created_at': assessment.created_at.isoformat(),
                    'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
                    'current_item': assessment.current_item,
                    'total_items': assessment.total_items,
                    'patient_id': str(assessment.patient_id)
                })
            
            return JsonResponse({
                'success': True,
                'results': assessments_data,
                'assessments': assessments_data,  # Alternative key for compatibility
                'count': len(assessments_data),
                'patient_id': str(patient_id)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Error retrieving patient assessments: {str(e)}'
            }, status=500)


# AÑADIENDO ENDPOINTS PARA COMPATIBILIDAD CON REACT
