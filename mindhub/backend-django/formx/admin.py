"""
FormX Django Admin Interface
Aprovecha Django Admin nativo para gestión completa de formularios
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import FormTemplate, FormField, FormSubmission, DocumentTemplate


@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
    """
    Admin interface para plantillas de formularios
    Con funcionalidades avanzadas de Django Admin
    """
    list_display = ['name', 'form_type', 'integration_type', 'total_fields_display', 'total_submissions_display', 'is_active', 'created_at']
    list_filter = ['form_type', 'integration_type', 'is_active', 'auto_sync_expedix', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'total_fields_display', 'total_submissions_display']
    filter_horizontal = []
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'name', 'form_type', 'description', 'integration_type')
        }),
        ('Configuración', {
            'fields': ('is_default', 'is_active', 'requires_auth', 'mobile_optimized')
        }),
        ('Integración con Expedix', {
            'fields': ('auto_sync_expedix', 'expedix_mapping')
        }),
        ('Configuración de Envío', {
            'fields': ('email_template', 'success_message', 'redirect_url')
        }),
        ('Metadatos', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Estadísticas', {
            'fields': ('total_fields_display', 'total_submissions_display'),
            'classes': ('collapse',)
        }),
    )
    
    def total_fields_display(self, obj):
        count = obj.total_fields
        return format_html(
            '<span style="color: {};">{} campos</span>',
            'green' if count > 0 else 'red',
            count
        )
    total_fields_display.short_description = 'Total de Campos'
    
    def total_submissions_display(self, obj):
        count = obj.total_submissions
        return format_html(
            '<span style="color: {};">{} respuestas</span>',
            'green' if count > 0 else 'gray',
            count
        )
    total_submissions_display.short_description = 'Total de Respuestas'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es nuevo
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class FormFieldInline(admin.TabularInline):
    """
    Inline para campos de formulario
    Permite editar campos directamente desde el template
    """
    model = FormField
    extra = 1
    fields = ['field_name', 'field_type', 'label', 'required', 'order', 'expedix_field']
    ordering = ['order']


@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    """
    Admin interface para campos de formulario
    """
    list_display = ['label', 'template', 'field_type', 'required', 'order', 'expedix_field']
    list_filter = ['field_type', 'required', 'template__form_type']
    search_fields = ['label', 'field_name', 'template__name']
    list_editable = ['order', 'required']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('template', 'field_name', 'field_type', 'label', 'help_text', 'placeholder')
        }),
        ('Validación', {
            'fields': ('required', 'min_length', 'max_length', 'min_value', 'max_value')
        }),
        ('Configuración', {
            'fields': ('order', 'css_classes', 'choices')
        }),
        ('Lógica Condicional', {
            'fields': ('show_conditions', 'validation_rules'),
            'classes': ('collapse',)
        }),
        ('Integración Expedix', {
            'fields': ('expedix_field',)
        }),
    )


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    """
    Admin interface para respuestas de formularios
    Con vista detallada de datos y estado de sincronización
    """
    list_display = ['template', 'patient_email', 'status', 'submitted_at', 'synced_to_expedix', 'sync_status_display']
    list_filter = ['status', 'synced_to_expedix', 'template__form_type', 'submitted_at']
    search_fields = ['patient_email', 'patient_id', 'template__name']
    readonly_fields = ['id', 'submitted_at', 'access_token', 'form_data_display', 'sync_status_display']
    date_hierarchy = 'submitted_at'
    
    fieldsets = (
        ('Información de Envío', {
            'fields': ('id', 'template', 'patient_id', 'patient_email', 'access_token')
        }),
        ('Estado', {
            'fields': ('status', 'is_processed', 'synced_to_expedix', 'expedix_sync_date', 'sync_status_display')
        }),
        ('Datos del Formulario', {
            'fields': ('form_data_display',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('submitted_at', 'ip_address', 'user_agent', 'device_type'),
            'classes': ('collapse',)
        }),
        ('Notas y Errores', {
            'fields': ('processing_notes', 'error_message'),
            'classes': ('collapse',)
        }),
    )
    
    def form_data_display(self, obj):
        """Muestra datos del formulario de manera legible"""
        if not obj.form_data:
            return "Sin datos"
        
        html = "<table style='width:100%'>"
        for field, value in obj.form_data.items():
            html += f"<tr><td><strong>{field}:</strong></td><td>{value}</td></tr>"
        html += "</table>"
        return format_html(html)
    form_data_display.short_description = 'Datos del Formulario'
    
    def sync_status_display(self, obj):
        """Indicador visual del estado de sincronización"""
        if obj.synced_to_expedix:
            return format_html(
                '<span style="color: green;">✓ Sincronizado ({})</span>',
                obj.expedix_sync_date.strftime('%d/%m/%Y %H:%M') if obj.expedix_sync_date else 'N/A'
            )
        elif obj.status == 'error':
            return format_html('<span style="color: red;">✗ Error</span>')
        elif obj.is_processed:
            return format_html('<span style="color: orange;">⏳ Pendiente</span>')
        else:
            return format_html('<span style="color: gray;">○ No procesado</span>')
    sync_status_display.short_description = 'Estado de Sync'
    
    actions = ['mark_as_processed', 'sync_to_expedix']
    
    def mark_as_processed(self, request, queryset):
        """Acción para marcar respuestas como procesadas"""
        count = 0
        for submission in queryset:
            if not submission.is_processed:
                submission.mark_as_processed()
                count += 1
        
        self.message_user(request, f"{count} respuestas marcadas como procesadas.")
    mark_as_processed.short_description = "Marcar como procesadas"
    
    def sync_to_expedix(self, request, queryset):
        """Acción para sincronizar con Expedix"""
        from .services import ExpedixSyncService
        
        sync_service = ExpedixSyncService()
        count = 0
        
        for submission in queryset:
            if submission.is_processed and not submission.synced_to_expedix:
                if sync_service.sync_form_submission(submission):
                    count += 1
        
        self.message_user(request, f"{count} respuestas sincronizadas con Expedix.")
    sync_to_expedix.short_description = "Sincronizar con Expedix"


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    """
    Admin interface para plantillas de documentos
    """
    list_display = ['name', 'document_type', 'requires_signature', 'is_active', 'created_at']
    list_filter = ['document_type', 'requires_signature', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'name', 'document_type', 'description')
        }),
        ('Contenido del Documento', {
            'fields': ('template_content', 'auto_fill_fields')
        }),
        ('Configuración', {
            'fields': ('requires_signature', 'is_active', 'is_default')
        }),
        ('Configuración de Email', {
            'fields': ('email_subject', 'email_body'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es nuevo
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# Personalización del admin site
admin.site.site_header = "MindHub FormX Admin"
admin.site.site_title = "FormX Admin"
admin.site.index_title = "Gestión de Formularios y Documentos"