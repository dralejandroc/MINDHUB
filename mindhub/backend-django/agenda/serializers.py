"""
Agenda Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Appointment, AppointmentHistory, AppointmentConfirmation,
    ProviderSchedule, ScheduleBlock, WaitingList
)


class AppointmentSerializer(serializers.ModelSerializer):
    """Appointment serializer for API responses - EXACT Supabase schema"""
    patient_name = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    can_be_confirmed = serializers.BooleanField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            # EXACT Supabase fields only
            'id', 'created_at', 'updated_at', 'patient_id', 'professional_id',
            'appointment_date', 'start_time', 'end_time', 'appointment_type',
            'status', 'reason', 'notes', 'internal_notes',
            'confirmation_sent', 'confirmation_date',
            'is_recurring', 'recurring_pattern',
            'reminder_sent', 'reminder_date',
            'clinic_id', 'workspace_id',
            # Computed fields for frontend compatibility
            'patient_name', 'professional_name', 'duration_minutes',
            'is_upcoming', 'can_be_confirmed', 'can_be_cancelled'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'duration_minutes']
        
    def get_patient_name(self, obj):
        # For now return placeholder - can be improved with actual patient lookup
        return f"Patient {obj.patient_id}"
        
    def get_professional_name(self, obj):
        # For now return placeholder - can be improved with actual professional lookup
        return f"Professional {obj.professional_id}"


class AppointmentAdministrativeSerializer(serializers.ModelSerializer):
    """Appointment serializer specifically for administrative view in Expedix - EXACT Supabase schema"""
    patient_name = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    duration_minutes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_date', 'start_time', 'end_time',
            'appointment_type', 'status', 'reason', 'notes', 
            'patient_name', 'professional_name', 'duration_minutes',
            'created_at', 'updated_at'
        ]

    def get_patient_name(self, obj):
        # For now return placeholder - can be improved with actual patient lookup
        return f"Patient {obj.patient_id}"

    def get_professional_name(self, obj):
        # For now return placeholder - can be improved with actual professional lookup  
        return f"Professional {obj.professional_id}"


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Appointment creation serializer with validation - EXACT Supabase fields"""
    
    class Meta:
        model = Appointment
        fields = [
            'patient_id', 'professional_id', 'appointment_date', 
            'start_time', 'end_time', 'appointment_type', 
            'reason', 'notes', 'internal_notes',
            'clinic_id', 'workspace_id'
        ]

    def validate_appointment_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("La fecha de la cita no puede ser en el pasado.")
        return value

    def validate(self, data):
        # Validate time logic
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin.")
        
        return data


class AppointmentSummarySerializer(serializers.ModelSerializer):
    """Appointment summary for dashboard/lists"""
    patient_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    is_upcoming = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_name', 'provider_name',
            'appointment_date', 'start_time', 'end_time', 'appointment_type', 'status',
            'is_upcoming'
        ]

    def get_patient_name(self, obj):
        # For now return placeholder - can be improved with actual patient lookup
        return f"Patient {obj.patient_id}"

    def get_provider_name(self, obj):
        # Return placeholder - can be improved with actual professional lookup
        return f"Professional {obj.professional_id}"


class AppointmentHistorySerializer(serializers.ModelSerializer):
    """Appointment history serializer"""
    modified_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentHistory
        fields = [
            'id', 'appointment', 'action', 'changes', 'reason',
            'modified_by', 'created_at', 'modified_by_name'
        ]
        read_only_fields = ['id', 'created_at']

    def get_modified_by_name(self, obj):
        return f"{obj.modified_by.first_name} {obj.modified_by.last_name}".strip()


class AppointmentConfirmationSerializer(serializers.ModelSerializer):
    """Appointment confirmation serializer"""
    confirmed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentConfirmation
        fields = [
            'id', 'appointment', 'confirmation_type', 'confirmation_method',
            'confirmed_by', 'notes', 'confirmed_at', 'confirmed_by_name'
        ]
        read_only_fields = ['id', 'confirmed_at']

    def get_confirmed_by_name(self, obj):
        return f"{obj.confirmed_by.first_name} {obj.confirmed_by.last_name}".strip()


class ProviderScheduleSerializer(serializers.ModelSerializer):
    """Provider schedule serializer"""
    provider_name = serializers.SerializerMethodField()
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = ProviderSchedule
        fields = [
            'id', 'provider', 'weekday', 'weekday_display', 'start_time',
            'end_time', 'break_start', 'break_end', 'slot_duration',
            'is_active', 'created_at', 'updated_at', 'provider_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin.")
        
        if data.get('break_start') and data.get('break_end'):
            if data['break_start'] >= data['break_end']:
                raise serializers.ValidationError("La hora de inicio del descanso debe ser anterior a la hora de fin.")
            
            if data['break_start'] < data['start_time'] or data['break_end'] > data['end_time']:
                raise serializers.ValidationError("El descanso debe estar dentro del horario de trabajo.")
        
        return data


class ScheduleBlockSerializer(serializers.ModelSerializer):
    """Schedule block serializer"""
    provider_name = serializers.SerializerMethodField()
    block_type_display = serializers.CharField(source='get_block_type_display', read_only=True)
    
    class Meta:
        model = ScheduleBlock
        fields = [
            'id', 'provider', 'block_type', 'block_type_display', 'start_date',
            'end_date', 'start_time', 'end_time', 'all_day', 'reason',
            'notes', 'created_at', 'updated_at', 'provider_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior o igual a la fecha de fin.")
        
        if not data.get('all_day'):
            if not data.get('start_time') or not data.get('end_time'):
                raise serializers.ValidationError("Debe especificar horas de inicio y fin para bloques que no son de día completo.")
            
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin.")
        
        return data


class WaitingListSerializer(serializers.ModelSerializer):
    """Waiting list serializer"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WaitingList
        fields = [
            'id', 'patient', 'provider', 'appointment_type', 'preferred_date_start',
            'preferred_date_end', 'preferred_time_start', 'preferred_time_end',
            'priority', 'priority_display', 'status', 'status_display', 'reason',
            'notes', 'added_by', 'contacted_at', 'expires_at', 'created_at',
            'updated_at', 'patient_name', 'provider_name', 'added_by_name', 'is_expired'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def get_added_by_name(self, obj):
        return f"{obj.added_by.first_name} {obj.added_by.last_name}".strip()

    def validate(self, data):
        if data.get('preferred_date_start') and data.get('preferred_date_end'):
            if data['preferred_date_start'] > data['preferred_date_end']:
                raise serializers.ValidationError("La fecha de inicio preferida debe ser anterior a la fecha de fin.")
        
        if data.get('preferred_time_start') and data.get('preferred_time_end'):
            if data['preferred_time_start'] >= data['preferred_time_end']:
                raise serializers.ValidationError("La hora de inicio preferida debe ser anterior a la hora de fin.")
        
        return data


# Dashboard and statistics serializers
class AppointmentStatsSerializer(serializers.Serializer):
    """Appointment statistics serializer for dashboard"""
    total_appointments = serializers.IntegerField()
    scheduled_appointments = serializers.IntegerField()
    confirmed_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()
    appointments_today = serializers.IntegerField()
    appointments_this_week = serializers.IntegerField()
    appointments_this_month = serializers.IntegerField()


class ProviderAvailabilitySerializer(serializers.Serializer):
    """Provider availability slots serializer"""
    time = serializers.DateTimeField()
    available = serializers.BooleanField()
    duration = serializers.IntegerField()
    appointment_type = serializers.CharField(required=False)


class AppointmentCalendarSerializer(serializers.Serializer):
    """Calendar view serializer for appointments"""
    date = serializers.DateField()
    appointments = AppointmentSummarySerializer(many=True)
    available_slots = ProviderAvailabilitySerializer(many=True, required=False)
    total_appointments = serializers.IntegerField()
    available_slot_count = serializers.IntegerField(required=False)