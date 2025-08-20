"""
Expedix Django Admin Configuration
Provides admin interface for patient management
"""

from django.contrib import admin
from .models import User, Patient, MedicalHistory, Consultation


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'organization', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'specialization', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'organization']
    readonly_fields = ['id', 'supabase_user_id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'age', 'gender', 'created_by', 'created_at']
    list_filter = ['gender', 'city', 'state', 'is_active', 'created_at']
    search_fields = ['first_name', 'paternal_last_name', 'maternal_last_name', 'email', 'phone']
    readonly_fields = ['id', 'age', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'paternal_last_name', 'maternal_last_name', 
                      'email', 'phone', 'date_of_birth', 'gender')
        }),
        ('Dirección', {
            'fields': ('address', 'city', 'state', 'zip_code', 'country')
        }),
        ('Contacto de Emergencia', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship')
        }),
        ('Información Médica', {
            'fields': ('insurance_provider', 'insurance_number', 'allergies', 
                      'current_medications', 'chronic_conditions', 'notes')
        }),
        ('Sistema', {
            'fields': ('created_by', 'is_active', 'created_at', 'updated_at')
        })
    )


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ['patient', 'condition', 'diagnosis_date', 'status', 'created_at']
    list_filter = ['status', 'diagnosis_date', 'created_at']
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'condition', 'treatment']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Médica', {
            'fields': ('patient', 'condition', 'diagnosis_date', 'treatment', 'status')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ['patient', 'professional', 'consultation_date', 'status', 'reason', 'duration_minutes']
    list_filter = ['status', 'consultation_date', 'professional', 'created_at']
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason', 'diagnosis']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-consultation_date']
    
    fieldsets = (
        ('Información de la Consulta', {
            'fields': ('patient', 'professional', 'consultation_date', 'reason', 'status', 'duration_minutes')
        }),
        ('Contenido de la Consulta', {
            'fields': ('consultation_notes', 'diagnosis', 'treatment_plan')
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )