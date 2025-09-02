"""
ScalesV3 API Views - New JSON-based template system
Replaces old API with JSON template-based endpoints
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.core.paginator import Paginator
from .template_loader import template_loader
from .models import Assessment, Patient
from .scoring_engine import ScalesV3ScoringEngine
import uuid

logger = logging.getLogger(__name__)

# Template Catalog Views

@require_http_methods(["GET"])
def template_catalog_view(request):
    """
    Get all available templates from ScalesV3 system
    GET /api/clinimetrix/templates/catalog/
    """
    try:
        scales = template_loader.get_available_scales()
        
        # Apply filters if provided
        category = request.GET.get('category')
        search = request.GET.get('search')
        featured_only = request.GET.get('featured_only') == 'true'
        
        if category:
            scales = [s for s in scales if s['category'].lower() == category.lower()]
        
        if search:
            search_lower = search.lower()
            scales = [s for s in scales if (
                search_lower in s['name'].lower() or
                search_lower in s['abbreviation'].lower() or
                search_lower in s['description'].lower()
            )]
        
        if featured_only:
            scales = [s for s in scales if s.get('isFeatured', False)]
        
        # Pagination
        page = request.GET.get('page', 1)
        per_page = min(int(request.GET.get('per_page', 20)), 100)
        
        paginator = Paginator(scales, per_page)
        page_obj = paginator.get_page(page)
        
        return JsonResponse({
            'success': True,
            'data': list(page_obj),
            'pagination': {
                'page': page_obj.number,
                'per_page': per_page,
                'total': paginator.count,
                'pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching template catalog: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch template catalog',
            'details': str(e)
        }, status=500)


@require_http_methods(["GET"])
def template_detail_view(request, template_id):
    """
    Get complete template details
    GET /api/clinimetrix/templates/{template_id}/
    """
    try:
        # Extract scale_id from template_id (remove version suffix)
        scale_id = template_id.replace('-1.0', '')
        
        template = template_loader.get_scale_template(scale_id)
        if not template:
            return JsonResponse({
                'success': False,
                'error': 'Template not found'
            }, status=404)
        
        return JsonResponse({
            'success': True,
            'data': template,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching template {template_id}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch template',
            'details': str(e)
        }, status=500)


@require_http_methods(["GET"])
def template_metadata_view(request, template_id):
    """
    Get template metadata only (lighter endpoint)
    GET /api/clinimetrix/templates/{template_id}/metadata/
    """
    try:
        scale_id = template_id.replace('-1.0', '')
        catalog = template_loader.get_scale_catalog(scale_id)
        
        if not catalog:
            return JsonResponse({
                'success': False,
                'error': 'Template not found'
            }, status=404)
        
        # Return lightweight metadata
        metadata = {
            'id': template_id,
            'name': catalog['metadata']['name'],
            'abbreviation': catalog['metadata']['abbreviation'],
            'version': catalog['metadata']['version'],
            'category': catalog['metadata']['category'],
            'subcategory': catalog['metadata'].get('subcategory', ''),
            'description': catalog['metadata']['description'],
            'authors': catalog['metadata']['authors'],
            'year': catalog['metadata']['year'],
            'language': catalog['metadata']['language'],
            'administrationMode': catalog['metadata']['administrationMode'],
            'estimatedDurationMinutes': catalog['metadata']['estimatedDurationMinutes'],
            'targetPopulation': catalog['metadata']['targetPopulation'],
            'lastUpdated': catalog['documentation']['lastUpdated']
        }
        
        return JsonResponse({
            'success': True,
            'data': metadata,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching template metadata {template_id}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch template metadata',
            'details': str(e)
        }, status=500)


@require_http_methods(["GET"])
def template_categories_view(request):
    """
    Get available template categories
    GET /api/clinimetrix/templates/categories/
    """
    try:
        categories = template_loader.get_categories()
        
        return JsonResponse({
            'success': True,
            'data': categories,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch categories',
            'details': str(e)
        }, status=500)


@require_http_methods(["GET"])
def template_search_view(request, query):
    """
    Search templates
    GET /api/clinimetrix/templates/search/{query}/
    """
    try:
        results = template_loader.search_scales(query)
        
        return JsonResponse({
            'success': True,
            'data': results,
            'query': query,
            'count': len(results),
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching templates with query '{query}': {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to search templates',
            'details': str(e)
        }, status=500)


# Assessment Management Views

@method_decorator([csrf_exempt], name='dispatch')
class AssessmentCreateView(View):
    """
    Create new assessment using ScalesV3 templates
    POST /api/clinimetrix/assessments/new/
    """
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            template_id = data.get('templateId')
            patient_id = data.get('patientId')
            administrator_id = data.get('administratorId')
            mode = data.get('mode', 'professional')
            
            if not all([template_id, patient_id, administrator_id]):
                return JsonResponse({
                    'success': False,
                    'error': 'Missing required fields: templateId, patientId, administratorId'
                }, status=400)
            
            # Validate template exists
            scale_id = template_id.replace('-1.0', '')
            template = template_loader.get_scale_template(scale_id)
            if not template:
                return JsonResponse({
                    'success': False,
                    'error': f'Template {template_id} not found'
                }, status=404)
            
            # Validate patient exists
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': f'Patient {patient_id} not found'
                }, status=404)
            
            # Create assessment
            assessment = Assessment.objects.create(
                template_id=template_id,
                patient_id=patient_id,
                administrator_id=uuid.UUID(administrator_id),
                mode=mode,
                status=Assessment.Status.NOT_STARTED,
                responses={},
                metadata={
                    'template_version': template['metadata']['version'],
                    'scale_name': template['metadata']['name'],
                    'scale_abbreviation': template['metadata']['abbreviation'],
                    'total_items': template['structure']['totalItems'],
                    'created_via': 'scalesv3_api'
                },
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            
            # Return created assessment
            return JsonResponse({
                'success': True,
                'data': {
                    'id': str(assessment.id),
                    'templateId': assessment.template_id,
                    'patientId': str(assessment.patient_id),
                    'administratorId': str(assessment.administrator_id),
                    'mode': assessment.mode,
                    'status': assessment.status,
                    'responses': assessment.responses,
                    'metadata': assessment.metadata,
                    'currentStep': assessment.current_step or 0,
                    'createdAt': assessment.created_at.isoformat(),
                    'updatedAt': assessment.updated_at.isoformat()
                },
                'timestamp': timezone.now().isoformat()
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            logger.error(f"Error creating assessment: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to create assessment',
                'details': str(e)
            }, status=500)


@method_decorator([csrf_exempt], name='dispatch')
class AssessmentDetailView(View):
    """
    Get, update, delete assessment
    GET/PUT/DELETE /api/clinimetrix/assessments/{assessment_id}/
    """
    
    def get(self, request, assessment_id):
        try:
            assessment = Assessment.objects.get(id=assessment_id)
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': str(assessment.id),
                    'templateId': assessment.template_id,
                    'patientId': str(assessment.patient_id),
                    'administratorId': str(assessment.administrator_id),
                    'mode': assessment.mode,
                    'status': assessment.status,
                    'responses': assessment.responses,
                    'scores': assessment.scores,
                    'interpretation': assessment.interpretation,
                    'subscaleScores': assessment.subscale_scores,
                    'validityIndicators': assessment.validity_indicators,
                    'metadata': assessment.metadata,
                    'totalScore': float(assessment.total_score) if assessment.total_score else None,
                    'severityLevel': assessment.severity_level,
                    'currentStep': assessment.current_step,
                    'completionTimeSeconds': assessment.completion_time_seconds,
                    'completionPercentage': assessment.completion_percentage,
                    'startedAt': assessment.started_at.isoformat() if assessment.started_at else None,
                    'completedAt': assessment.completed_at.isoformat() if assessment.completed_at else None,
                    'createdAt': assessment.created_at.isoformat() if assessment.created_at else None,
                    'updatedAt': assessment.updated_at.isoformat() if assessment.updated_at else None
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Assessment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Assessment not found'
            }, status=404)
        except Exception as e:
            logger.error(f"Error fetching assessment {assessment_id}: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to fetch assessment',
                'details': str(e)
            }, status=500)
    
    def put(self, request, assessment_id):
        try:
            data = json.loads(request.body)
            assessment = Assessment.objects.get(id=assessment_id)
            
            # Update responses
            if 'responses' in data:
                assessment.responses = data['responses']
            
            # Update current step
            if 'currentStep' in data:
                assessment.current_step = data['currentStep']
            
            # Update status
            if 'status' in data:
                new_status = data['status']
                if new_status in [choice[0] for choice in Assessment.Status.choices]:
                    assessment.status = new_status
                    
                    # Set timestamps
                    if new_status == Assessment.Status.IN_PROGRESS and not assessment.started_at:
                        assessment.started_at = timezone.now()
                    elif new_status == Assessment.Status.COMPLETED and not assessment.completed_at:
                        assessment.completed_at = timezone.now()
                        assessment.calculate_duration()
            
            assessment.updated_at = timezone.now()
            assessment.save()
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': str(assessment.id),
                    'status': assessment.status,
                    'responses': assessment.responses,
                    'currentStep': assessment.current_step,
                    'updatedAt': assessment.updated_at.isoformat()
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Assessment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Assessment not found'
            }, status=404)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            logger.error(f"Error updating assessment {assessment_id}: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to update assessment',
                'details': str(e)
            }, status=500)


@method_decorator([csrf_exempt], name='dispatch')
class AssessmentResponsesView(View):
    """
    Update assessment responses
    PUT /api/clinimetrix/assessments/{assessment_id}/responses/
    """
    
    def put(self, request, assessment_id):
        try:
            data = json.loads(request.body)
            assessment = Assessment.objects.get(id=assessment_id)
            
            responses = data.get('responses', {})
            current_step = data.get('currentStep')
            
            # Update responses
            if responses:
                assessment.responses.update(responses)
            
            # Update current step
            if current_step is not None:
                assessment.current_step = current_step
            
            # Calculate completion percentage
            if assessment.metadata and 'total_items' in assessment.metadata:
                total_items = assessment.metadata['total_items']
                completed_items = len([r for r in assessment.responses.values() if r is not None])
                assessment.completion_percentage = int((completed_items / total_items) * 100)
            
            assessment.updated_at = timezone.now()
            assessment.save()
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': str(assessment.id),
                    'responses': assessment.responses,
                    'currentStep': assessment.current_step,
                    'completionPercentage': assessment.completion_percentage,
                    'updatedAt': assessment.updated_at.isoformat()
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Assessment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Assessment not found'
            }, status=404)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            logger.error(f"Error updating assessment responses {assessment_id}: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to update responses',
                'details': str(e)
            }, status=500)


@method_decorator([csrf_exempt], name='dispatch')
class AssessmentCompleteView(View):
    """
    Complete assessment with automatic scoring
    POST /api/clinimetrix/assessments/{assessment_id}/complete/
    """
    
    def post(self, request, assessment_id):
        try:
            data = json.loads(request.body)
            assessment = Assessment.objects.get(id=assessment_id)
            
            # Update final responses if provided
            final_responses = data.get('responses', {})
            if final_responses:
                assessment.responses.update(final_responses)
            
            # Get template for scoring
            scale_id = assessment.template_id.replace('-1.0', '')
            template = template_loader.get_scale_template(scale_id)
            
            if not template:
                return JsonResponse({
                    'success': False,
                    'error': 'Template not found for scoring'
                }, status=404)
            
            # Initialize scoring engine
            scoring_engine = ScalesV3ScoringEngine(template)
            
            # Calculate scores
            scoring_results = scoring_engine.calculate_scores(
                responses=assessment.responses,
                demographics=data.get('demographics', {})
            )
            
            # Update assessment with results
            assessment.status = Assessment.Status.COMPLETED
            assessment.completed_at = timezone.now()
            assessment.scores = scoring_results['scores']
            assessment.interpretation = scoring_results['interpretation']
            assessment.subscale_scores = scoring_results.get('subscaleScores', {})
            assessment.validity_indicators = scoring_results.get('validityIndicators', {})
            assessment.total_score = scoring_results['scores'].get('totalScore', 0)
            assessment.severity_level = scoring_results['interpretation'].get('severity', '')
            assessment.completion_percentage = 100
            
            if assessment.started_at:
                duration = assessment.completed_at - assessment.started_at
                assessment.completion_time_seconds = int(duration.total_seconds())
            
            assessment.updated_at = timezone.now()
            assessment.save()
            
            return JsonResponse({
                'success': True,
                'assessment': {
                    'id': str(assessment.id),
                    'status': assessment.status,
                    'totalScore': float(assessment.total_score) if assessment.total_score else None,
                    'severityLevel': assessment.severity_level,
                    'completedAt': assessment.completed_at.isoformat(),
                    'completionTimeSeconds': assessment.completion_time_seconds
                },
                'results': scoring_results,
                'timestamp': timezone.now().isoformat()
            })
            
        except Assessment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Assessment not found'
            }, status=404)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            logger.error(f"Error completing assessment {assessment_id}: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to complete assessment',
                'details': str(e)
            }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def calculate_scores_view(request):
    """
    Calculate scores for given responses without saving
    POST /api/clinimetrix/assessments/calculate-scores/
    """
    try:
        data = json.loads(request.body)
        
        template_id = data.get('templateId')
        responses = data.get('responses', {})
        demographics = data.get('demographics', {})
        
        if not template_id:
            return JsonResponse({
                'success': False,
                'error': 'templateId is required'
            }, status=400)
        
        # Get template
        scale_id = template_id.replace('-1.0', '')
        template = template_loader.get_scale_template(scale_id)
        
        if not template:
            return JsonResponse({
                'success': False,
                'error': f'Template {template_id} not found'
            }, status=404)
        
        # Initialize scoring engine and calculate
        scoring_engine = ScalesV3ScoringEngine(template)
        scoring_results = scoring_engine.calculate_scores(responses, demographics)
        
        return JsonResponse({
            'success': True,
            'results': scoring_results,
            'timestamp': timezone.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON'
        }, status=400)
    except Exception as e:
        logger.error(f"Error calculating scores: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to calculate scores',
            'details': str(e)
        }, status=500)