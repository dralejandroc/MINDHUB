"""
FormX Views & APIs
Integrado con Django ClinimetrixPro existente
Aprovecha DRF y middleware Supabase existente
"""

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.generic import TemplateView
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import serializers

import json
from typing import Dict, Any

from .models import FormTemplate, FormField, FormSubmission, DocumentTemplate
from .services import (
    FormGeneratorService, 
    ExpedixSyncService, 
    DocumentGeneratorService,
    EmailService,
    FormTokenService
)


# ============================================================================
# SERIALIZERS
# ============================================================================

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = '__all__'


class FormTemplateSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, read_only=True)
    total_fields = serializers.ReadOnlyField()
    total_submissions = serializers.ReadOnlyField()
    
    class Meta:
        model = FormTemplate
        fields = '__all__'


class FormSubmissionSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = FormSubmission
        fields = '__all__'


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'


# ============================================================================
# VIEWSETS (DRF)
# ============================================================================

class FormTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para plantillas de formularios
    CRUD completo aprovechando DRF
    """
    queryset = FormTemplate.objects.all()
    serializer_class = FormTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Auto-asignar usuario creador"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_to_patient(self, request, pk=None):
        """Envía formulario a paciente específico"""
        template = self.get_object()
        patient_id = request.data.get('patient_id')
        patient_email = request.data.get('patient_email')
        
        if not patient_id or not patient_email:
            return Response(
                {'error': 'patient_id y patient_email son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear token y enlace
        submission_id, token = FormTokenService.create_form_submission_token(
            str(template.id), patient_id, patient_email
        )
        
        # Enviar email
        email_service = EmailService()
        success = email_service.send_form_link(patient_email, submission_id, template.name)
        
        if success:
            return Response({
                'message': 'Formulario enviado exitosamente',
                'form_link': f"{settings.REACT_FRONTEND_URL}/formx/fill/{token}",
                'submission_id': submission_id
            })
        else:
            return Response(
                {'error': 'Error enviando email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview del formulario dinámico"""
        template = self.get_object()
        form_generator = FormGeneratorService()
        
        try:
            dynamic_form = form_generator.create_dynamic_form(str(template.id))
            
            # Serializar campos para preview
            fields_data = []
            for field in template.fields.all().order_by('order'):
                fields_data.append({
                    'name': field.field_name,
                    'type': field.field_type,
                    'label': field.label,
                    'required': field.required,
                    'help_text': field.help_text,
                    'placeholder': field.placeholder,
                    'choices': field.choices,
                })
            
            return Response({
                'template_name': template.name,
                'fields': fields_data,
                'total_fields': len(fields_data)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error generando preview: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FormSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para respuestas de formularios
    """
    queryset = FormSubmission.objects.all()
    serializer_class = FormSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por template si se especifica"""
        queryset = FormSubmission.objects.all()
        template_id = self.request.query_params.get('template', None)
        
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        return queryset.order_by('-submitted_at')
    
    @action(detail=True, methods=['post'])
    def sync_to_expedix(self, request, pk=None):
        """Sincronizar respuesta específica con Expedix"""
        submission = self.get_object()
        
        if not submission.is_processed:
            return Response(
                {'error': 'La respuesta debe estar procesada primero'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sync_service = ExpedixSyncService()
        success = sync_service.sync_form_submission(submission)
        
        if success:
            return Response({'message': 'Sincronizado exitosamente con Expedix'})
        else:
            return Response(
                {'error': 'Error sincronizando con Expedix'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para plantillas de documentos
    """
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate_for_patient(self, request, pk=None):
        """Genera documento para paciente específico"""
        template = self.get_object()
        patient_id = request.data.get('patient_id')
        
        if not patient_id:
            return Response(
                {'error': 'patient_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        doc_service = DocumentGeneratorService()
        document_content = doc_service.generate_document(str(template.id), patient_id)
        
        return Response({
            'template_name': template.name,
            'document_content': document_content,
            'generated_at': timezone.now().isoformat()
        })


# ============================================================================
# API VIEWS ESPECÍFICAS PARA REACT
# ============================================================================

class FormBuilderAPIView(APIView):
    """
    API para construir formularios dinámicamente desde React
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Crear formulario desde React Form Builder"""
        try:
            data = request.data
            
            # Crear template
            template = FormTemplate.objects.create(
                name=data['name'],
                form_type=data['form_type'],
                description=data.get('description', ''),
                integration_type=data.get('integration_type', 'expedix'),
                created_by=request.user,
                auto_sync_expedix=data.get('auto_sync_expedix', True),
                expedix_mapping=data.get('expedix_mapping', {})
            )
            
            # Crear campos
            for i, field_data in enumerate(data['fields']):
                FormField.objects.create(
                    template=template,
                    field_name=field_data['field_name'],
                    field_type=field_data['field_type'],
                    label=field_data['label'],
                    help_text=field_data.get('help_text', ''),
                    placeholder=field_data.get('placeholder', ''),
                    required=field_data.get('required', False),
                    order=i,
                    choices=field_data.get('choices', []),
                    expedix_field=field_data.get('expedix_field', '')
                )
            
            return Response({
                'template_id': template.id,
                'message': 'Formulario creado exitosamente'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error creando formulario: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendFormToPatientAPIView(APIView):
    """
    API para enviar formularios a pacientes desde React
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Envía formulario a paciente por email"""
        template_id = request.data.get('template_id')
        patient_id = request.data.get('patient_id')
        patient_email = request.data.get('patient_email')
        
        if not all([template_id, patient_id, patient_email]):
            return Response(
                {'error': 'template_id, patient_id y patient_email son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            template = FormTemplate.objects.get(id=template_id)
            
            # Crear token y submission
            submission_id, token = FormTokenService.create_form_submission_token(
                template_id, patient_id, patient_email
            )
            
            # Enviar email
            email_service = EmailService()
            success = email_service.send_form_link(patient_email, submission_id, template.name)
            
            if success:
                form_link = f"{settings.REACT_FRONTEND_URL}/formx/fill/{token}"
                return Response({
                    'message': 'Formulario enviado exitosamente',
                    'form_link': form_link,
                    'submission_id': submission_id
                })
            else:
                return Response(
                    {'error': 'Error enviando email'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except FormTemplate.DoesNotExist:
            return Response(
                {'error': 'Template no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error enviando formulario: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExpedixMappingAPIView(APIView):
    """
    API para mapeo automático de campos con Expedix
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Genera mapeo automático basado en nombres de campos"""
        form_fields = request.data.get('fields', [])
        
        # Mapeo automático común
        auto_mapping = {
            'first_name': 'firstName',
            'nombre': 'firstName',
            'last_name': 'lastName',
            'apellido': 'lastName',
            'apellido_paterno': 'paternalLastName',
            'apellido_materno': 'maternalLastName',
            'email': 'email',
            'correo': 'email',
            'phone': 'phone',
            'telefono': 'phone',
            'date_of_birth': 'dateOfBirth',
            'fecha_nacimiento': 'dateOfBirth',
            'address': 'address',
            'direccion': 'address',
            'city': 'city',
            'ciudad': 'city',
            'emergency_contact': 'emergencyContact',
            'contacto_emergencia': 'emergencyContact',
            'insurance': 'insuranceProvider',
            'seguro': 'insuranceProvider',
            'allergies': 'allergies',
            'alergias': 'allergies',
            'medications': 'currentMedications',
            'medicamentos': 'currentMedications',
        }
        
        mapping = {}
        suggestions = []
        
        for field in form_fields:
            field_name = field.get('field_name', '').lower()
            
            # Buscar coincidencia directa
            if field_name in auto_mapping:
                mapping[field.get('field_name')] = auto_mapping[field_name]
            else:
                # Buscar coincidencias parciales
                for key, value in auto_mapping.items():
                    if key in field_name or field_name in key:
                        suggestions.append({
                            'field_name': field.get('field_name'),
                            'suggested_mapping': value,
                            'confidence': 0.8 if key in field_name else 0.6
                        })
                        break
        
        return Response({
            'auto_mapping': mapping,
            'suggestions': suggestions,
            'total_mapped': len(mapping),
            'total_suggestions': len(suggestions)
        })


# ============================================================================
# VISTAS PARA PACIENTES (MOBILE-FRIENDLY)
# ============================================================================

class FormRenderView(TemplateView):
    """
    Renderiza formulario para pacientes (móvil-friendly)
    Sin autenticación requerida (usa token)
    """
    template_name = 'formx/form_render.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        token = kwargs['token']
        
        try:
            submission = FormSubmission.objects.get(access_token=token)
            template = submission.template
            
            # Generar formulario dinámico
            form_generator = FormGeneratorService()
            form_class = form_generator.create_dynamic_form(str(template.id))
            
            context.update({
                'form': form_class(),
                'submission': submission,
                'template': template,
                'token': token,
                'patient_email': submission.patient_email,
                'form_fields': template.fields.all().order_by('order'),
            })
            
        except FormSubmission.DoesNotExist:
            context['error'] = 'Token inválido o expirado'
        
        return context


@method_decorator(csrf_exempt, name='dispatch')
class FormSubmitView(APIView):
    """
    Procesa envío de formularios de pacientes
    Sin autenticación requerida (usa token)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, token):
        try:
            submission = FormSubmission.objects.get(access_token=token)
            template = submission.template
            
            # Validar datos con formulario dinámico
            form_generator = FormGeneratorService()
            form_class = form_generator.create_dynamic_form(str(template.id))
            form = form_class(request.data)
            
            if form.is_valid():
                # Guardar datos del formulario
                submission.form_data = form.cleaned_data
                submission.status = 'submitted'
                submission.is_processed = True
                submission.ip_address = self._get_client_ip(request)
                submission.user_agent = request.META.get('HTTP_USER_AGENT', '')
                submission.device_type = self._detect_device_type(request)
                submission.save()
                
                # Auto-sincronizar con Expedix si está configurado
                if template.auto_sync_expedix:
                    sync_service = ExpedixSyncService()
                    sync_service.sync_form_submission(submission)
                
                return Response({
                    'status': 'success',
                    'message': template.success_message or 'Formulario enviado exitosamente',
                    'redirect_url': template.redirect_url or settings.REACT_FRONTEND_URL
                })
            else:
                return Response({
                    'status': 'error',
                    'errors': form.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except FormSubmission.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Token inválido o expirado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Error procesando formulario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _detect_device_type(self, request):
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            return 'tablet'
        else:
            return 'desktop'


# ============================================================================
# APIs DE DOCUMENTOS
# ============================================================================

class GenerateDocumentAPIView(APIView):
    """
    API para generar documentos con datos del paciente
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        template_id = request.data.get('template_id')
        patient_id = request.data.get('patient_id')
        
        if not template_id or not patient_id:
            return Response(
                {'error': 'template_id y patient_id son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            doc_service = DocumentGeneratorService()
            document_content = doc_service.generate_document(template_id, patient_id)
            
            return Response({
                'document_content': document_content,
                'generated_at': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error generando documento: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendDocumentAPIView(APIView):
    """
    API para enviar documentos a pacientes
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        template_id = request.data.get('template_id')
        patient_id = request.data.get('patient_id')
        patient_email = request.data.get('patient_email')
        
        if not all([template_id, patient_id, patient_email]):
            return Response(
                {'error': 'template_id, patient_id y patient_email son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generar documento
            doc_service = DocumentGeneratorService()
            document_content = doc_service.generate_document(template_id, patient_id)
            
            # Enviar por email
            template = DocumentTemplate.objects.get(id=template_id)
            email_service = EmailService()
            success = email_service.send_document(patient_email, document_content, template.name)
            
            if success:
                return Response({'message': 'Documento enviado exitosamente'})
            else:
                return Response(
                    {'error': 'Error enviando documento'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# APIs DE INTEGRACIÓN Y UTILIDADES
# ============================================================================

class SyncToExpedixAPIView(APIView):
    """
    API para sincronizar respuesta específica con Expedix
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, submission_id):
        try:
            submission = FormSubmission.objects.get(id=submission_id)
            
            sync_service = ExpedixSyncService()
            success = sync_service.sync_form_submission(submission)
            
            if success:
                return Response({'message': 'Sincronizado exitosamente'})
            else:
                return Response(
                    {'error': 'Error sincronizando'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except FormSubmission.DoesNotExist:
            return Response(
                {'error': 'Respuesta no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class FormXDashboardStatsAPIView(APIView):
    """
    API para estadísticas del dashboard FormX
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        stats = {
            'total_templates': FormTemplate.objects.count(),
            'active_templates': FormTemplate.objects.filter(is_active=True).count(),
            'total_submissions': FormSubmission.objects.count(),
            'processed_submissions': FormSubmission.objects.filter(is_processed=True).count(),
            'synced_submissions': FormSubmission.objects.filter(synced_to_expedix=True).count(),
            'total_documents': DocumentTemplate.objects.count(),
            'recent_submissions': FormSubmission.objects.order_by('-submitted_at')[:5].count(),
        }
        
        # Calcular tasas
        if stats['total_submissions'] > 0:
            stats['processing_rate'] = (stats['processed_submissions'] / stats['total_submissions']) * 100
            stats['sync_rate'] = (stats['synced_submissions'] / stats['total_submissions']) * 100
        else:
            stats['processing_rate'] = 0
            stats['sync_rate'] = 0
        
        return Response(stats)


class FormTemplateCatalogAPIView(APIView):
    """
    API para catálogo de templates (similar a ClinimetrixPro)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        templates = FormTemplate.objects.filter(is_active=True).prefetch_related('fields')
        
        catalog = []
        for template in templates:
            catalog.append({
                'id': template.id,
                'name': template.name,
                'form_type': template.form_type,
                'description': template.description,
                'total_fields': template.total_fields,
                'integration_type': template.integration_type,
                'auto_sync_expedix': template.auto_sync_expedix,
                'mobile_optimized': template.mobile_optimized,
                'created_at': template.created_at.isoformat(),
            })
        
        return Response({
            'templates': catalog,
            'total': len(catalog),
            'categories': [
                {'key': 'clinical', 'name': 'Formularios Clínicos'},
                {'key': 'document', 'name': 'Documentos Legales'},
                {'key': 'survey', 'name': 'Encuestas/Seguimiento'},
                {'key': 'intake', 'name': 'Formularios de Admisión'},
                {'key': 'consent', 'name': 'Consentimientos'},
                {'key': 'follow_up', 'name': 'Seguimiento Post-Consulta'},
            ]
        })


class FormXHealthCheckAPIView(APIView):
    """
    Health check para FormX
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Verificar base de datos
            template_count = FormTemplate.objects.count()
            
            # Verificar servicios
            form_generator = FormGeneratorService()
            
            return Response({
                'status': 'healthy',
                'service': 'formx',
                'version': '1.0.0',
                'templates_count': template_count,
                'database': 'connected',
                'integration': 'supabase',
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)