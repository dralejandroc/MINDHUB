"""
Analytics Admin - Healthcare Indicators System
Admin interface for managing indicators and KPIs
"""

from django.contrib import admin
from .models import (
    IndicatorDefinition, 
    IndicatorValue,
    PatientClassification,
    SatisfactionSurvey,
    PrescriptionRefill,
    ClinicalProtocolEvaluation,
    IndicatorSettings
)


@admin.register(IndicatorDefinition)
class IndicatorDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'indicator_type', 'frequency', 'target_value', 'is_active']
    list_filter = ['category', 'indicator_type', 'frequency', 'is_active', 'applies_to']
    search_fields = ['name', 'objective']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'objective', 'category')
        }),
        ('Configuración', {
            'fields': ('formula', 'data_source', 'frequency', 'target_value', 'indicator_type', 'applies_to')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(IndicatorValue)
class IndicatorValueAdmin(admin.ModelAdmin):
    list_display = ['indicator', 'calculated_value', 'period_start', 'period_end', 'status', 'calculated_at']
    list_filter = ['status', 'indicator__category', 'period_start']
    search_fields = ['indicator__name']
    readonly_fields = ['id', 'calculated_at', 'created_at', 'updated_at']
    date_hierarchy = 'period_start'
    
    fieldsets = (
        ('Indicador', {
            'fields': ('indicator', 'clinic_id', 'workspace_id')
        }),
        ('Período', {
            'fields': ('period_start', 'period_end')
        }),
        ('Resultado', {
            'fields': ('calculated_value', 'status', 'raw_data')
        }),
        ('Metadatos', {
            'fields': ('id', 'calculated_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PatientClassification)
class PatientClassificationAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'classification', 'attendance_rate', 'professionals_seen', 'last_evaluation']
    list_filter = ['classification', 'last_evaluation']
    search_fields = ['patient_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Paciente', {
            'fields': ('patient_id',)
        }),
        ('Clasificación', {
            'fields': ('classification', 'attendance_rate', 'professionals_seen', 'treatment_adherence')
        }),
        ('Tiempo y Programas', {
            'fields': ('time_in_treatment', 'additional_programs')
        }),
        ('Evaluación', {
            'fields': ('last_evaluation',)
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(SatisfactionSurvey)
class SatisfactionSurveyAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'survey_type', 'score', 'created_at']
    list_filter = ['survey_type', 'score', 'created_at']
    search_fields = ['patient_id', 'feedback']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Encuesta', {
            'fields': ('patient_id', 'appointment_id', 'survey_type')
        }),
        ('Resultado', {
            'fields': ('score', 'feedback')
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PrescriptionRefill)
class PrescriptionRefillAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'prescription_id', 'refill_date', 'refill_type', 'is_controlled_medication']
    list_filter = ['refill_type', 'is_controlled_medication', 'refill_date']
    search_fields = ['patient_id', 'prescription_id', 'notes']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'refill_date'
    
    fieldsets = (
        ('Resurtido', {
            'fields': ('patient_id', 'prescription_id', 'refill_date', 'refill_type')
        }),
        ('Medicación', {
            'fields': ('is_controlled_medication',)
        }),
        ('Detalles', {
            'fields': ('notes', 'created_by')
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ClinicalProtocolEvaluation)
class ClinicalProtocolEvaluationAdmin(admin.ModelAdmin):
    list_display = ['consultation_id', 'diagnosis_code', 'patient_improvement', 'protocol_compliance', 'evaluated_at']
    list_filter = ['protocol_compliance', 'patient_improvement', 'evaluated_at']
    search_fields = ['consultation_id', 'patient_id', 'diagnosis_code']
    readonly_fields = ['id', 'evaluated_at', 'created_at']
    date_hierarchy = 'evaluated_at'
    
    fieldsets = (
        ('Consulta', {
            'fields': ('consultation_id', 'patient_id', 'diagnosis_code')
        }),
        ('Tratamiento', {
            'fields': ('treatment_plan', 'medication_changes', 'patient_improvement')
        }),
        ('Evaluación', {
            'fields': ('protocol_compliance', 'deviation_reason')
        }),
        ('Metadatos', {
            'fields': ('id', 'evaluated_at', 'created_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(IndicatorSettings)
class IndicatorSettingsAdmin(admin.ModelAdmin):
    list_display = ['clinic_id', 'workspace_id', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Entidad', {
            'fields': ('clinic_id', 'workspace_id')
        }),
        ('Configuración', {
            'fields': ('enabled_indicators', 'custom_targets', 'dashboard_layout')
        }),
        ('Preferencias', {
            'fields': ('notification_preferences', 'clinical_guidelines')
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
