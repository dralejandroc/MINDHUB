"""
Agenda Django Admin Configuration
Provides admin interface for appointment management
"""

from django.contrib import admin
from .models import (
    Appointment, AppointmentHistory, AppointmentConfirmation,
    ProviderSchedule, ScheduleBlock, WaitingList
)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'appointment_number', 'patient', 'provider', 'appointment_date', 
        'duration', 'appointment_type', 'status', 'created_at'
    ]
    list_filter = ['status', 'appointment_type', 'provider', 'created_at']
    search_fields = [
        'appointment_number', 'patient__first_name', 'patient__paternal_last_name',
        'provider__first_name', 'provider__last_name', 'reason'
    ]
    readonly_fields = ['id', 'appointment_number', 'created_at', 'updated_at']
    ordering = ['-appointment_date']
    
    fieldsets = (
        ('Información de la Cita', {
            'fields': ('appointment_number', 'patient', 'provider', 'appointment_date', 
                      'duration', 'appointment_type', 'reason', 'notes')
        }),
        ('Estado y Seguimiento', {
            'fields': ('status', 'confirmed_at', 'confirmed_by', 'cancelled_at', 
                      'cancelled_by', 'cancellation_reason', 'reschedule_requested')
        }),
        ('Preparación', {
            'fields': ('requires_preparation', 'preparation_instructions')
        }),
        ('Sistema', {
            'fields': ('scheduled_by', 'created_at', 'updated_at')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient', 'provider', 'scheduled_by')


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'action', 'modified_by', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['appointment__appointment_number', 'reason']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('appointment', 'modified_by')


@admin.register(AppointmentConfirmation)
class AppointmentConfirmationAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'confirmation_type', 'confirmation_method', 'confirmed_by', 'confirmed_at']
    list_filter = ['confirmation_type', 'confirmation_method', 'confirmed_at']
    search_fields = ['appointment__appointment_number']
    readonly_fields = ['id', 'confirmed_at']
    ordering = ['-confirmed_at']


@admin.register(ProviderSchedule)
class ProviderScheduleAdmin(admin.ModelAdmin):
    list_display = ['provider', 'weekday', 'start_time', 'end_time', 'slot_duration', 'is_active']
    list_filter = ['weekday', 'is_active', 'provider']
    search_fields = ['provider__first_name', 'provider__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['provider', 'weekday', 'start_time']
    
    fieldsets = (
        ('Información del Horario', {
            'fields': ('provider', 'weekday', 'start_time', 'end_time', 'slot_duration')
        }),
        ('Descansos', {
            'fields': ('break_start', 'break_end')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(ScheduleBlock)
class ScheduleBlockAdmin(admin.ModelAdmin):
    list_display = ['provider', 'block_type', 'start_date', 'end_date', 'all_day', 'reason']
    list_filter = ['block_type', 'all_day', 'provider', 'start_date']
    search_fields = ['provider__first_name', 'provider__last_name', 'reason']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-start_date']
    
    fieldsets = (
        ('Información del Bloqueo', {
            'fields': ('provider', 'block_type', 'reason')
        }),
        ('Fechas y Horarios', {
            'fields': ('start_date', 'end_date', 'all_day', 'start_time', 'end_time')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(WaitingList)
class WaitingListAdmin(admin.ModelAdmin):
    list_display = ['patient', 'provider', 'appointment_type', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'appointment_type', 'provider', 'created_at']
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['priority', 'created_at']
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient', 'provider', 'appointment_type', 'reason')
        }),
        ('Preferencias', {
            'fields': ('preferred_date_start', 'preferred_date_end', 
                      'preferred_time_start', 'preferred_time_end')
        }),
        ('Estado y Prioridad', {
            'fields': ('priority', 'status', 'contacted_at', 'expires_at')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Sistema', {
            'fields': ('added_by', 'created_at', 'updated_at')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient', 'provider', 'added_by')
