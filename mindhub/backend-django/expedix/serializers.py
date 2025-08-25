"""
Expedix Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from .models import User, Patient, MedicalHistory, Consultation, Prescription


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
    """Patient serializer for API responses - Compatible with Supabase schema"""
    # Add computed fields for frontend compatibility
    birth_date = serializers.DateField(source='date_of_birth', read_only=True)
    cell_phone = serializers.CharField(source='phone', read_only=True)
    age = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            # Basic information - MATCHES Supabase schema exactly
            'id', 'first_name', 'paternal_last_name', 'maternal_last_name', 'last_name',
            'email', 'phone', 'cell_phone', 'date_of_birth', 'birth_date', 'gender', 'age',
            # Location
            'address', 'city', 'state', 'postal_code', 'country',
            # Mexican specific fields
            'curp', 'rfc', 'medical_record_number', 'blood_type',
            # Medical arrays
            'allergies', 'chronic_conditions', 'current_medications', 'tags',
            # Emergency contact
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            # Critical association fields
            'created_by', 'clinic_id', 'assigned_professional_id', 'workspace_id',
            # Status and metadata
            'patient_category', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'age']


class PatientCreateSerializer(serializers.ModelSerializer):
    """Patient creation serializer with validation - Compatible with Supabase schema"""
    # Accept both formats for compatibility
    birth_date = serializers.DateField(source='date_of_birth', required=False)
    cell_phone = serializers.CharField(source='phone', required=False)
    
    class Meta:
        model = Patient
        fields = [
            # Required fields for creation - MATCHES Supabase schema
            'first_name', 'paternal_last_name', 'maternal_last_name', 'last_name',
            'email', 'phone', 'cell_phone', 'date_of_birth', 'birth_date', 'gender',
            # Location information
            'address', 'city', 'state', 'postal_code', 'country',
            # Mexican specific fields
            'curp', 'rfc', 'medical_record_number', 'blood_type',
            # Medical arrays
            'allergies', 'chronic_conditions', 'current_medications', 'tags',
            # Emergency contact
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            # Professional assignment (optional)
            'assigned_professional_id', 'workspace_id',
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
    """Patient summary for dashboard/lists - Compatible with Supabase schema"""
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    consultations_count = serializers.SerializerMethodField()
    evaluations_count = serializers.SerializerMethodField()
    appointments = serializers.SerializerMethodField()
    prescriptions = serializers.SerializerMethodField()
    # Individual name fields matching Supabase schema exactly
    first_name = serializers.CharField(read_only=True)
    paternal_last_name = serializers.CharField(read_only=True)  # Direct field, not source
    maternal_last_name = serializers.CharField(read_only=True)  # Direct field
    birth_date = serializers.DateField(source='date_of_birth', read_only=True)
    gender = serializers.CharField(read_only=True)
    cell_phone = serializers.CharField(source='phone', read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'full_name', 'first_name', 'paternal_last_name', 'maternal_last_name',
            'email', 'phone', 'cell_phone', 'age', 'birth_date', 'gender', 
            'created_at', 'updated_at', 'consultations_count', 'evaluations_count',
            'appointments', 'prescriptions'
        ]

    def get_consultations_count(self, obj):
        # Use prefetch_related to avoid N+1
        return getattr(obj, 'consultations_count', 0) if hasattr(obj, 'consultations_count') else obj.consultations.count()
    
    def get_evaluations_count(self, obj):
        # Placeholder for evaluations count - implement when assessment model is ready
        return getattr(obj, 'evaluations_count', 0)
    
    def get_appointments(self, obj):
        # Get recent appointments (limit to 5 most recent to avoid large payloads)
        appointments = getattr(obj, 'recent_appointments', None)
        if appointments is None:
            # Fallback to direct query with limit
            appointments = obj.appointments.filter(status__in=['scheduled', 'confirmed', 'completed']).order_by('-appointment_date')[:5]
        
        return [{
            'id': apt.id,
            'appointment_date': apt.appointment_date,
            'appointment_time': apt.appointment_time,
            'type': apt.appointment_type,
            'status': apt.status,
            'branch': apt.branch,
            'resource': apt.resource,
            'professional': apt.professional,
            'balance': float(apt.balance) if apt.balance else 0.0,
        } for apt in appointments]
    
    def get_prescriptions(self, obj):
        # Get recent active prescriptions (limit to 5 to avoid large payloads)
        prescriptions = getattr(obj, 'recent_prescriptions', None)
        if prescriptions is None:
            # This would need to be implemented when prescription model is available
            return []
        
        return [{
            'id': presc.id,
            'medications': presc.medications,
            'status': presc.status,
            'created_at': presc.created_at,
        } for presc in prescriptions[:5]]


class PrescriptionSerializer(serializers.ModelSerializer):
    """Prescription serializer for API responses"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    professional_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'patient_id', 'professional_id', 'consultation_id',
            'prescription_date', 'medications', 'instructions', 'status',
            'valid_until', 'created_at', 'updated_at',
            'patient_name', 'professional_name'
        ]
        read_only_fields = ['id', 'prescription_date', 'created_at', 'updated_at']
    
    def get_professional_name(self, obj):
        # This would need to be updated when we have proper user relations
        return f"Professional {obj.professional_id}"


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """Prescription creation serializer"""
    
    class Meta:
        model = Prescription
        fields = [
            'patient_id', 'consultation_id', 'medications', 
            'instructions', 'status', 'valid_until'
        ]
    
    def validate_medications(self, value):
        """Validate medications format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Medications must be a list")
        
        for medication in value:
            if not isinstance(medication, dict):
                raise serializers.ValidationError("Each medication must be an object")
            
            required_fields = ['name', 'dosage', 'frequency']
            for field in required_fields:
                if field not in medication:
                    raise serializers.ValidationError(f"Medication missing required field: {field}")
        
        return value
    
    def validate_status(self, value):
        """Validate prescription status"""
        valid_statuses = dict(Prescription.STATUS_CHOICES).keys()
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {list(valid_statuses)}")
        return value


class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard statistics serializer"""
    total_patients = serializers.IntegerField()
    active_patients = serializers.IntegerField()
    total_consultations = serializers.IntegerField()
    consultations_this_month = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()