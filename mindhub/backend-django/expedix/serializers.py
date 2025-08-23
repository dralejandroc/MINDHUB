"""
Expedix Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from .models import User, Patient, MedicalHistory, Consultation


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses"""
    
    class Meta:
        model = User
        fields = [
            'id', 'supabase_user_id', 'email', 'first_name', 'last_name',
            'role', 'organization', 'license_number', 'specialization',
            'is_active', 'email_verified', 'last_login_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    """Patient serializer for API responses - MINIMAL TEST VERSION"""
    
    class Meta:
        model = Patient
        fields = [
            # Basic information - MATCHES DATABASE_TRUTH.md
            'id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
            # Location
            'address', 'city', 'state', 'postal_code', 
            # Mexican specific fields
            'curp', 'rfc', 'medical_record_number', 'blood_type',
            # Critical association fields
            'created_by', 'clinic_id', 'assigned_professional_id',
            # Status and metadata
            'patient_category', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientCreateSerializer(serializers.ModelSerializer):
    """Patient creation serializer with validation"""
    
    class Meta:
        model = Patient
        fields = [
            # Required fields for creation - MATCHES DATABASE_TRUTH.md
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
            # Location information
            'address', 'city', 'state', 'postal_code',
            # Mexican specific fields
            'curp', 'rfc', 'medical_record_number', 'blood_type',
            # Professional assignment (optional)
            'assigned_professional_id',
            # Category
            'patient_category'
            # Note: created_by and clinic_id are set automatically in views
        ]

    def validate_email(self, value):
        if Patient.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un paciente con este email.")
        return value


class MedicalHistorySerializer(serializers.ModelSerializer):
    """Medical history serializer"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    
    class Meta:
        model = MedicalHistory
        fields = [
            'id', 'patient', 'condition', 'diagnosis_date', 'treatment',
            'status', 'notes', 'created_at', 'updated_at', 'patient_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConsultationSerializer(serializers.ModelSerializer):
    """Consultation serializer"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    professional_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Consultation
        fields = [
            'id', 'patient', 'professional', 'consultation_date', 'reason',
            'consultation_notes', 'diagnosis', 'treatment_plan', 'status',
            'duration_minutes', 'created_at', 'updated_at',
            'patient_name', 'professional_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_professional_name(self, obj):
        return f"{obj.professional.first_name} {obj.professional.last_name}".strip()


class ConsultationCreateSerializer(serializers.ModelSerializer):
    """Consultation creation serializer"""
    
    class Meta:
        model = Consultation
        fields = [
            'patient', 'consultation_date', 'reason', 'consultation_notes',
            'diagnosis', 'treatment_plan', 'duration_minutes'
        ]

    def validate_consultation_date(self, value):
        from datetime import datetime
        if value < datetime.now():
            raise serializers.ValidationError("La fecha de consulta no puede ser en el pasado.")
        return value


# Summary serializers for dashboard
class PatientSummarySerializer(serializers.ModelSerializer):
    """Patient summary for dashboard/lists"""
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    consultations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'created_at', 'consultations_count'
        ]

    def get_consultations_count(self, obj):
        return obj.consultations.count()


class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard statistics serializer"""
    total_patients = serializers.IntegerField()
    active_patients = serializers.IntegerField()
    total_consultations = serializers.IntegerField()
    consultations_this_month = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()