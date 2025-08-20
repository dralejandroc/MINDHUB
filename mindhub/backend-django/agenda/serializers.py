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
    """Appointment serializer for API responses"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    is_upcoming = serializers.BooleanField(read_only=True)
    can_be_confirmed = serializers.BooleanField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    scheduled_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_number', 'patient', 'provider', 'appointment_date',
            'duration', 'appointment_type', 'reason', 'notes', 'status',
            'confirmed_at', 'confirmed_by', 'cancelled_at', 'cancelled_by',
            'cancellation_reason', 'reschedule_requested', 'requires_preparation',
            'preparation_instructions', 'scheduled_by', 'created_at', 'updated_at',
            'patient_name', 'provider_name', 'is_upcoming', 'can_be_confirmed',
            'can_be_cancelled', 'scheduled_by_name'
        ]
        read_only_fields = ['id', 'appointment_number', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def get_scheduled_by_name(self, obj):
        return f"{obj.scheduled_by.first_name} {obj.scheduled_by.last_name}".strip()


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Appointment creation serializer with validation"""
    
    class Meta:
        model = Appointment
        fields = [
            'patient', 'provider', 'appointment_date', 'duration',
            'appointment_type', 'reason', 'notes', 'requires_preparation',
            'preparation_instructions'
        ]

    def validate_appointment_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("La fecha de la cita no puede ser en el pasado.")
        return value

    def validate_duration(self, value):
        if value < 15 or value > 480:
            raise serializers.ValidationError("La duración debe estar entre 15 y 480 minutos.")
        return value

    def validate(self, data):
        # Check for scheduling conflicts
        appointment_date = data['appointment_date']
        duration = data['duration']
        provider = data['provider']
        
        # Calculate end time
        end_time = appointment_date + timedelta(minutes=duration)
        
        # Check for overlapping appointments
        conflicting_appointments = Appointment.objects.filter(
            provider=provider,
            status__in=['scheduled', 'confirmed'],
            appointment_date__lt=end_time,
            appointment_date__gte=appointment_date - timedelta(minutes=duration)
        ).exclude(
            id=self.instance.id if self.instance else None
        )
        
        if conflicting_appointments.exists():
            conflict = conflicting_appointments.first()
            raise serializers.ValidationError({
                'appointment_date': f'Conflicto de horario con la cita {conflict.appointment_number}'
            })
        
        return data


class AppointmentSummarySerializer(serializers.ModelSerializer):
    """Appointment summary for dashboard/lists"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    is_upcoming = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_number', 'patient_name', 'provider_name',
            'appointment_date', 'duration', 'appointment_type', 'status',
            'is_upcoming'
        ]

    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()


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