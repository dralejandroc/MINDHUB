"""
FormX Models - Dynamic Form Builder & Document Management
Integrado con Django ClinimetrixPro existente
Conectado a Supabase PostgreSQL
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class FormTemplate(models.Model):
    """
    Plantilla base de formulario dinámico
    Aprovecha Django Forms nativo para generación dinámica
    """
    FORM_TYPES = [
        ('clinical', 'Formulario Clínico'),
        ('document', 'Documento Legal'),
        ('survey', 'Encuesta/Seguimiento'),
        ('intake', 'Formulario de Admisión'),
        ('consent', 'Consentimiento Informado'),
        ('follow_up', 'Seguimiento Post-Consulta'),
    ]
    
    INTEGRATION_TYPES = [
        ('expedix', 'Expedix - Expedientes Médicos'),
        ('clinimetrix', 'ClinimetrixPro - Evaluaciones'),
        ('standalone', 'Independiente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('Nombre del Formulario', max_length=200)
    form_type = models.CharField('Tipo', max_length=20, choices=FORM_TYPES)
    description = models.TextField('Descripción', blank=True)
    integration_type = models.CharField('Integración', max_length=20, choices=INTEGRATION_TYPES, default='expedix')
    
    # Configuración
    is_default = models.BooleanField('Formulario por Defecto', default=False)
    is_active = models.BooleanField('Activo', default=True)
    requires_auth = models.BooleanField('Requiere Autenticación', default=False)
    mobile_optimized = models.BooleanField('Optimizado para Móvil', default=True)
    
    # Metadatos
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_forms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Integración con Expedix/Supabase
    auto_sync_expedix = models.BooleanField('Auto-Sync con Expedix', default=True)
    expedix_mapping = models.JSONField(
        'Mapeo de Campos Expedix', 
        default=dict,
        help_text='Mapeo automático de campos del formulario a campos de Expedix'
    )
    
    # Configuración de envío
    email_template = models.TextField('Template de Email', blank=True)
    success_message = models.TextField('Mensaje de Éxito', blank=True)
    redirect_url = models.URLField('URL de Redirección', blank=True)
    
    class Meta:
        verbose_name = 'Plantilla de Formulario'
        verbose_name_plural = 'Plantillas de Formularios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_form_type_display()})"
    
    @property
    def total_fields(self):
        return self.fields.count()
    
    @property
    def total_submissions(self):
        return self.submissions.count()


class FormField(models.Model):
    """
    Campos dinámicos del formulario
    Compatible con Django Form Fields nativos
    """
    FIELD_TYPES = [
        # Campos básicos
        ('text', 'Texto Corto'),
        ('textarea', 'Texto Largo'),
        ('email', 'Correo Electrónico'),
        ('phone', 'Teléfono'),
        ('number', 'Número'),
        ('decimal', 'Número Decimal'),
        
        # Fechas y tiempo
        ('date', 'Fecha'),
        ('datetime', 'Fecha y Hora'),
        ('time', 'Hora'),
        
        # Selección
        ('select', 'Lista Desplegable'),
        ('radio', 'Selección Única (Radio)'),
        ('checkbox', 'Selección Múltiple'),
        ('boolean', 'Sí/No (Checkbox)'),
        
        # Archivos
        ('file', 'Archivo'),
        ('image', 'Imagen'),
        
        # Campos especializados médicos
        ('name', 'Nombre Completo'),
        ('address', 'Dirección'),
        ('city', 'Ciudad'),
        ('insurance', 'Seguro Médico'),
        ('emergency_contact', 'Contacto de Emergencia'),
        
        # Campos especiales
        ('signature', 'Firma Digital'),
        ('rating', 'Calificación (1-5)'),
        ('scale', 'Escala (1-10)'),
    ]
    
    template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='fields')
    field_name = models.CharField('Nombre del Campo', max_length=100)
    field_type = models.CharField('Tipo de Campo', max_length=20, choices=FIELD_TYPES)
    label = models.CharField('Etiqueta', max_length=200)
    help_text = models.TextField('Texto de Ayuda', blank=True)
    placeholder = models.CharField('Placeholder', max_length=200, blank=True)
    
    # Validación
    required = models.BooleanField('Obligatorio', default=False)
    min_length = models.PositiveIntegerField('Longitud Mínima', blank=True, null=True)
    max_length = models.PositiveIntegerField('Longitud Máxima', blank=True, null=True)
    min_value = models.DecimalField('Valor Mínimo', max_digits=10, decimal_places=2, blank=True, null=True)
    max_value = models.DecimalField('Valor Máximo', max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Configuración de campo
    order = models.PositiveIntegerField('Orden', default=0)
    css_classes = models.CharField('Clases CSS', max_length=200, blank=True)
    
    # Opciones para campos select/radio/checkbox
    choices = models.JSONField(
        'Opciones', 
        default=list, 
        blank=True,
        help_text='Lista de opciones para campos de selección'
    )
    
    # Lógica condicional
    show_conditions = models.JSONField(
        'Condiciones de Visibilidad', 
        default=dict, 
        blank=True,
        help_text='Cuándo mostrar este campo basado en otros campos'
    )
    
    validation_rules = models.JSONField(
        'Reglas de Validación', 
        default=dict, 
        blank=True,
        help_text='Validaciones personalizadas'
    )
    
    # Integración con Expedix
    expedix_field = models.CharField(
        'Campo de Expedix', 
        max_length=100, 
        blank=True,
        help_text='Campo correspondiente en Expedix para auto-sync'
    )
    
    class Meta:
        verbose_name = 'Campo de Formulario'
        verbose_name_plural = 'Campos de Formulario'
        ordering = ['order']
        unique_together = ['template', 'field_name']
    
    def __str__(self):
        return f"{self.label} ({self.template.name})"


class FormSubmission(models.Model):
    """
    Respuestas enviadas por pacientes
    Conectado a Supabase para sincronización con Expedix
    """
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('submitted', 'Enviado'),
        ('processed', 'Procesado'),
        ('synced', 'Sincronizado'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='submissions')
    
    # Identificación del paciente (desde Supabase)
    patient_id = models.CharField('ID Paciente Supabase', max_length=100)
    patient_email = models.EmailField('Email del Paciente', blank=True)
    
    # Token para acceso sin autenticación
    access_token = models.CharField('Token de Acceso', max_length=100, unique=True)
    
    # Datos del formulario
    form_data = models.JSONField('Datos del Formulario', default=dict)
    submitted_at = models.DateTimeField('Fecha de Envío', auto_now_add=True)
    
    # Metadatos de envío
    ip_address = models.GenericIPAddressField('Dirección IP', blank=True, null=True)
    user_agent = models.TextField('User Agent', blank=True)
    device_type = models.CharField('Tipo de Dispositivo', max_length=50, blank=True)
    
    # Estado de procesamiento
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='draft')
    is_processed = models.BooleanField('Procesado', default=False)
    synced_to_expedix = models.BooleanField('Sincronizado con Expedix', default=False)
    expedix_sync_date = models.DateTimeField('Fecha Sync Expedix', blank=True, null=True)
    
    # Notas y errores
    processing_notes = models.TextField('Notas de Procesamiento', blank=True)
    error_message = models.TextField('Mensaje de Error', blank=True)
    
    class Meta:
        verbose_name = 'Respuesta de Formulario'
        verbose_name_plural = 'Respuestas de Formularios'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.template.name} - {self.patient_email} ({self.submitted_at.strftime('%Y-%m-%d')})"
    
    def mark_as_processed(self):
        """Marca la respuesta como procesada"""
        self.status = 'processed'
        self.is_processed = True
        self.save()
    
    def mark_as_synced(self):
        """Marca como sincronizado con Expedix"""
        self.status = 'synced'
        self.synced_to_expedix = True
        self.expedix_sync_date = timezone.now()
        self.save()


class DocumentTemplate(models.Model):
    """
    Plantillas de documentos legales con auto-llenado
    Para consentimientos, políticas, acuerdos terapéuticos
    """
    DOCUMENT_TYPES = [
        ('consent', 'Consentimiento Informado'),
        ('privacy', 'Aviso de Privacidad'),
        ('therapeutic', 'Acuerdo Terapéutico'),
        ('policy', 'Política de Atención'),
        ('appointment', 'Confirmación de Cita'),
        ('follow_up', 'Seguimiento Post-Consulta'),
        ('birthday', 'Felicitación de Cumpleaños'),
        ('survey', 'Encuesta de Calidad'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('Nombre del Documento', max_length=200)
    document_type = models.CharField('Tipo de Documento', max_length=20, choices=DOCUMENT_TYPES)
    description = models.TextField('Descripción', blank=True)
    
    # Contenido del template (HTML con placeholders)
    template_content = models.TextField(
        'Contenido del Template',
        help_text='Contenido HTML con placeholders como {{patient_name}}, {{date}}, etc.'
    )
    
    # Configuración de campos auto-llenables
    auto_fill_fields = models.JSONField(
        'Campos Auto-llenables',
        default=list,
        help_text='Lista de campos que se llenan automáticamente desde Expedix'
    )
    
    # Configuración
    requires_signature = models.BooleanField('Requiere Firma', default=False)
    is_active = models.BooleanField('Activo', default=True)
    is_default = models.BooleanField('Por Defecto', default=False)
    
    # Email settings
    email_subject = models.CharField('Asunto del Email', max_length=200, blank=True)
    email_body = models.TextField('Cuerpo del Email', blank=True)
    
    # Metadatos
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Plantilla de Documento'
        verbose_name_plural = 'Plantillas de Documentos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"


# Signals para auto-sincronización con Expedix
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=FormSubmission)
def auto_sync_to_expedix(sender, instance, created, **kwargs):
    """
    Auto-sincroniza respuestas con Expedix cuando se marcan como procesadas
    Aprovecha middleware Supabase existente
    """
    if instance.is_processed and not instance.synced_to_expedix and instance.template.auto_sync_expedix:
        from .services import ExpedixSyncService
        
        try:
            sync_service = ExpedixSyncService()
            sync_service.sync_form_submission(instance)
        except Exception as e:
            instance.error_message = str(e)
            instance.status = 'error'
            instance.save()