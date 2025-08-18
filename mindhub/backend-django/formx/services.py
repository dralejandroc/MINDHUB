"""
FormX Services - Business Logic Layer
Aprovecha Django Forms nativo y middleware Supabase existente
"""

from django import forms
from django.utils import timezone
from django.conf import settings
import uuid
import secrets
import requests
from typing import Dict, Any, List, Optional
from .models import FormTemplate, FormField, FormSubmission, DocumentTemplate


class FormGeneratorService:
    """
    Genera formularios dinámicos usando Django Forms nativo
    Aprovecha toda la funcionalidad de Django Forms framework
    """
    
    def create_dynamic_form(self, template_id: str):
        """
        Crea una clase Form dinámica basada en template
        Usa Django Forms nativo para máxima compatibilidad
        """
        template = FormTemplate.objects.get(id=template_id)
        form_fields = {}
        
        for field in template.fields.all().order_by('order'):
            django_field = self._create_django_field(field)
            form_fields[field.field_name] = django_field
        
        # Crear clase Form dinámica aprovechando Django
        DynamicForm = type(
            f'DynamicForm_{template.name.replace(" ", "")}', 
            (forms.Form,), 
            form_fields
        )
        
        # Agregar validación personalizada si existe
        DynamicForm.clean = self._create_clean_method(template)
        
        return DynamicForm
    
    def _create_django_field(self, field_config: FormField):
        """
        Convierte configuración FormField a Django Field
        Aprovecha widgets nativos de Django
        """
        field_map = {
            'text': forms.CharField,
            'textarea': forms.CharField,
            'email': forms.EmailField,
            'phone': forms.CharField,
            'number': forms.IntegerField,
            'decimal': forms.DecimalField,
            'date': forms.DateField,
            'datetime': forms.DateTimeField,
            'time': forms.TimeField,
            'select': forms.ChoiceField,
            'radio': forms.ChoiceField,
            'checkbox': forms.MultipleChoiceField,
            'boolean': forms.BooleanField,
            'file': forms.FileField,
            'image': forms.ImageField,
        }
        
        field_class = field_map.get(field_config.field_type, forms.CharField)
        
        kwargs = {
            'label': field_config.label,
            'required': field_config.required,
            'help_text': field_config.help_text,
        }
        
        # Configurar widgets específicos para mobile-first
        if field_config.field_type == 'textarea':
            kwargs['widget'] = forms.Textarea(attrs={
                'rows': 4,
                'class': 'form-textarea mobile-friendly',
                'placeholder': field_config.placeholder
            })
        elif field_config.field_type == 'phone':
            kwargs['widget'] = forms.TextInput(attrs={
                'type': 'tel',
                'class': 'form-phone mobile-friendly',
                'placeholder': field_config.placeholder or '+52 XXX XXX XXXX'
            })
        elif field_config.field_type == 'email':
            kwargs['widget'] = forms.EmailInput(attrs={
                'class': 'form-email mobile-friendly',
                'placeholder': field_config.placeholder or 'correo@ejemplo.com'
            })
        elif field_config.field_type == 'date':
            kwargs['widget'] = forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-date mobile-friendly'
            })
        elif field_config.field_type == 'radio':
            kwargs['widget'] = forms.RadioSelect(attrs={
                'class': 'form-radio mobile-friendly'
            })
            kwargs['choices'] = [(opt['value'], opt['label']) for opt in field_config.choices]
        elif field_config.field_type == 'select':
            kwargs['widget'] = forms.Select(attrs={
                'class': 'form-select mobile-friendly'
            })
            kwargs['choices'] = [('', '-- Seleccionar --')] + [(opt['value'], opt['label']) for opt in field_config.choices]
        elif field_config.field_type == 'checkbox':
            kwargs['widget'] = forms.CheckboxSelectMultiple(attrs={
                'class': 'form-checkbox mobile-friendly'
            })
            kwargs['choices'] = [(opt['value'], opt['label']) for opt in field_config.choices]
        
        # Validaciones adicionales
        if field_config.min_length:
            kwargs['min_length'] = field_config.min_length
        if field_config.max_length:
            kwargs['max_length'] = field_config.max_length
        if field_config.min_value:
            kwargs['min_value'] = field_config.min_value
        if field_config.max_value:
            kwargs['max_value'] = field_config.max_value
        
        return field_class(**kwargs)
    
    def _create_clean_method(self, template: FormTemplate):
        """
        Crea método clean personalizado para validaciones complejas
        """
        def clean(self):
            cleaned_data = super().clean()
            
            # Validaciones condicionales basadas en lógica del template
            for field in template.fields.all():
                if field.show_conditions:
                    self._validate_conditional_field(field, cleaned_data)
            
            return cleaned_data
        
        return clean
    
    def _validate_conditional_field(self, field: FormField, cleaned_data: Dict):
        """Valida campos condicionales según reglas definidas"""
        conditions = field.show_conditions
        field_value = cleaned_data.get(field.field_name)
        
        # Implementar lógica condicional
        # Por ejemplo: mostrar campo solo si otro campo tiene cierto valor
        if 'depends_on' in conditions:
            depends_field = conditions['depends_on']
            depends_value = conditions.get('depends_value')
            
            if cleaned_data.get(depends_field) == depends_value:
                if not field_value and field.required:
                    raise forms.ValidationError(f'{field.label} es obligatorio')


class ExpedixSyncService:
    """
    Sincroniza datos de formularios con Expedix vía Supabase
    Aprovecha middleware Supabase existente
    """
    
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
    
    def sync_form_submission(self, submission: FormSubmission):
        """
        Sincroniza respuesta del formulario con Expedix
        Auto-mapea campos según configuración del template
        """
        template = submission.template
        
        if not template.auto_sync_expedix:
            return False
        
        # Preparar datos para Supabase
        expedix_data = self._map_form_data_to_expedix(
            submission.form_data, 
            template.expedix_mapping
        )
        
        # Enviar a Supabase
        success = self._update_patient_record(submission.patient_id, expedix_data)
        
        if success:
            submission.mark_as_synced()
            return True
        else:
            submission.error_message = "Error sincronizando con Expedix"
            submission.status = 'error'
            submission.save()
            return False
    
    def _map_form_data_to_expedix(self, form_data: Dict, mapping: Dict) -> Dict:
        """
        Mapea datos del formulario a campos de Expedix
        Usando configuración de mapeo del template
        """
        expedix_data = {}
        
        # Auto-mapeo basado en configuración
        for form_field, expedix_field in mapping.items():
            if form_field in form_data:
                expedix_data[expedix_field] = form_data[form_field]
        
        # Mapeo automático para campos comunes
        auto_mapping = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'email': 'email',
            'phone': 'phone',
            'date_of_birth': 'dateOfBirth',
            'address': 'address',
            'city': 'city',
            'emergency_contact': 'emergencyContact',
            'insurance_provider': 'insuranceProvider',
            'allergies': 'allergies',
            'current_medications': 'currentMedications',
        }
        
        for form_field, expedix_field in auto_mapping.items():
            if form_field in form_data and expedix_field not in expedix_data:
                expedix_data[expedix_field] = form_data[form_field]
        
        return expedix_data
    
    def _update_patient_record(self, patient_id: str, data: Dict) -> bool:
        """
        Actualiza registro del paciente en Supabase
        Usa API REST de Supabase
        """
        try:
            headers = {
                'apikey': self.supabase_key,
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': 'application/json',
            }
            
            url = f'{self.supabase_url}/rest/v1/patients'
            params = {'id': f'eq.{patient_id}'}
            
            response = requests.patch(url, json=data, headers=headers, params=params)
            
            return response.status_code == 204
            
        except Exception as e:
            print(f"Error updating patient record: {e}")
            return False


class DocumentGeneratorService:
    """
    Genera documentos con datos del paciente auto-llenados
    Para consentimientos, políticas, acuerdos terapéuticos
    """
    
    def generate_document(self, template_id: str, patient_id: str) -> str:
        """
        Genera documento con datos auto-llenados del paciente
        """
        template = DocumentTemplate.objects.get(id=template_id)
        patient_data = self._get_patient_data(patient_id)
        
        # Reemplazar placeholders en template
        content = template.template_content
        
        for field in template.auto_fill_fields:
            placeholder = f"{{{{{field}}}}}"
            value = patient_data.get(field, '')
            content = content.replace(placeholder, str(value))
        
        # Agregar fecha actual
        content = content.replace('{{current_date}}', timezone.now().strftime('%d/%m/%Y'))
        
        return content
    
    def _get_patient_data(self, patient_id: str) -> Dict:
        """
        Obtiene datos del paciente desde Supabase
        """
        try:
            headers = {
                'apikey': settings.SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}',
            }
            
            url = f'{settings.SUPABASE_URL}/rest/v1/patients'
            params = {'id': f'eq.{patient_id}', 'select': '*'}
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data[0] if data else {}
            
            return {}
            
        except Exception as e:
            print(f"Error fetching patient data: {e}")
            return {}


class EmailService:
    """
    Servicio de envío de emails para formularios y documentos
    Integrado con configuración Django existente
    """
    
    def send_form_link(self, patient_email: str, form_submission_id: str, template_name: str):
        """
        Envía enlace de formulario al paciente por email
        """
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        
        submission = FormSubmission.objects.get(id=form_submission_id)
        form_link = f"{settings.REACT_FRONTEND_URL}/formx/fill/{submission.access_token}"
        
        subject = f"Formulario Clínico - {template_name}"
        
        # Usar template de email personalizable
        message = render_to_string('formx/emails/form_invitation.html', {
            'patient_email': patient_email,
            'form_link': form_link,
            'template_name': template_name,
            'clinic_name': 'MindHub',
        })
        
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[patient_email],
            html_message=message,
        )
    
    def send_document(self, patient_email: str, document_content: str, document_name: str):
        """
        Envía documento generado al paciente
        """
        from django.core.mail import EmailMessage
        
        subject = f"Documento - {document_name}"
        
        email = EmailMessage(
            subject=subject,
            body=f"Adjunto encontrará el documento: {document_name}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[patient_email],
        )
        
        # Agregar documento como attachment (PDF)
        email.attach(f"{document_name}.html", document_content, 'text/html')
        
        return email.send()


class FormTokenService:
    """
    Maneja tokens de acceso para formularios sin autenticación
    """
    
    @staticmethod
    def generate_secure_token() -> str:
        """Genera token seguro para acceso a formularios"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_form_submission_token(template_id: str, patient_id: str, patient_email: str) -> str:
        """
        Crea una nueva submisión con token para paciente
        """
        token = FormTokenService.generate_secure_token()
        
        submission = FormSubmission.objects.create(
            template_id=template_id,
            patient_id=patient_id,
            patient_email=patient_email,
            access_token=token,
            status='draft'
        )
        
        return submission.id, token


class FormXIntegrationService:
    """
    Maneja integraciones con otros servicios de MindHub
    ClinimetrixPro, Expedix, etc.
    """
    
    def link_to_clinimetrix_assessment(self, form_submission_id: str, assessment_id: str):
        """
        Vincula respuesta de formulario con evaluación ClinimetrixPro
        """
        submission = FormSubmission.objects.get(id=form_submission_id)
        
        # Agregar referencia a assessment en notas
        submission.processing_notes += f"\nVinculado con ClinimetrixPro Assessment: {assessment_id}"
        submission.save()
    
    def create_expedix_consultation_from_form(self, form_submission_id: str):
        """
        Crea consulta en Expedix basada en datos del formulario
        Para formularios de intake/admisión
        """
        submission = FormSubmission.objects.get(id=form_submission_id)
        
        if submission.template.form_type == 'intake':
            # Crear consulta en Expedix vía API
            consultation_data = {
                'patient_id': submission.patient_id,
                'type': 'initial_consultation',
                'notes': f"Consulta creada desde FormX: {submission.template.name}",
                'form_data': submission.form_data,
            }
            
            # Llamar API de Expedix
            return self._create_expedix_consultation(consultation_data)
    
    def _create_expedix_consultation(self, data: Dict) -> bool:
        """Crea consulta en Expedix vía Supabase API"""
        try:
            headers = {
                'apikey': settings.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
            }
            
            url = f'{settings.SUPABASE_URL}/rest/v1/consultations'
            
            response = requests.post(url, json=data, headers=headers)
            
            return response.status_code == 201
            
        except Exception as e:
            print(f"Error creating Expedix consultation: {e}")
            return False