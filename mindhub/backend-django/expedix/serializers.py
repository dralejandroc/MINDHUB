"""
Expedix Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from .models import User, Patient, MedicalHistory, Consultation, Prescription, ExpedixConfiguration, ConsultationTemplate
from agenda.models import Appointment


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
    """
    Patient creation serializer with FLEXIBLE validation
    Uses configuration to determine required fields
    Compatible with Supabase schema
    """
    # Accept both formats for compatibility
    birth_date = serializers.DateField(source='date_of_birth', required=False)
    cell_phone = serializers.CharField(source='phone', required=False)
    
    class Meta:
        model = Patient
        fields = [
            # Core fields (always available)
            'first_name', 'paternal_last_name', 'maternal_last_name', 'last_name',
            'email', 'phone', 'cell_phone', 'date_of_birth', 'birth_date', 'gender',
            # Location information - NOW OPTIONAL BY DEFAULT
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
    
    def __init__(self, *args, **kwargs):
        """
        Dynamic field requirement based on configuration
        """
        super().__init__(*args, **kwargs)
        
        # Get configuration from context (passed by view)
        config = self.context.get('expedix_config')
        if config:
            required_fields = config.get_required_fields()
            
            # Set field requirements dynamically
            for field_name, field in self.fields.items():
                # Map field names for compatibility
                mapped_field_name = self._map_field_name(field_name)
                
                if mapped_field_name in required_fields:
                    field.required = True
                    field.allow_blank = False
                else:
                    field.required = False
                    field.allow_blank = True
        else:
            # Fallback to default required fields if no config
            self._set_default_requirements()
    
    def _map_field_name(self, field_name):
        """Map serializer field names to config field names"""
        mapping = {
            'birth_date': 'date_of_birth',
            'cell_phone': 'phone',
        }
        return mapping.get(field_name, field_name)
    
    def _set_default_requirements(self):
        """Set default field requirements"""
        # Default required fields as specified
        default_required = [
            'first_name', 'paternal_last_name', 'maternal_last_name',
            'email', 'phone', 'cell_phone', 'date_of_birth', 'birth_date', 'gender'
        ]
        
        for field_name, field in self.fields.items():
            if field_name in default_required:
                field.required = True
                field.allow_blank = False
            else:
                field.required = False
                field.allow_blank = True

    def validate_email(self, value):
        # Only validate uniqueness for creation (when instance doesn't exist)
        if self.instance is None:
            if Patient.objects.filter(email=value).exists():
                raise serializers.ValidationError("Ya existe un paciente con este email.")
        else:
            # For updates, exclude the current instance from the uniqueness check
            if Patient.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
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
            'patient_id', 'professional_id', 'consultation_date', 'chief_complaint', 'consultation_notes',
            'diagnosis', 'treatment_plan', 'status', 'duration_minutes'
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
            # Direct query using patient_id since ForeignKey relationship doesn't exist
            appointments = Appointment.objects.filter(
                patient_id=obj.id,
                status__in=['scheduled', 'confirmed', 'completed']
            ).order_by('-appointment_date')[:5]
        
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


class ExpedixConfigurationSerializer(serializers.ModelSerializer):
    """
    Expedix Configuration Serializer
    For managing flexible field configurations
    """
    available_optional_fields = serializers.SerializerMethodField()
    effective_required_fields = serializers.SerializerMethodField()
    effective_optional_fields = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpedixConfiguration
        fields = [
            'id', 'configuration_type', 'clinic_id', 'workspace_id',
            'required_patient_fields', 'optional_patient_fields', 'custom_patient_fields',
            'consultation_templates_enabled', 'default_consultation_template',
            'settings', 'is_active', 'created_at', 'updated_at',
            # Computed fields
            'available_optional_fields', 'effective_required_fields', 'effective_optional_fields'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_available_optional_fields(self, obj):
        """Get all available optional fields"""
        return obj.get_available_optional_fields()
    
    def get_effective_required_fields(self, obj):
        """Get effective required fields (default + custom)"""
        return obj.get_required_fields()
    
    def get_effective_optional_fields(self, obj):
        """Get effective optional fields"""
        return obj.get_optional_fields()


class ExpedixConfigurationCreateSerializer(serializers.ModelSerializer):
    """
    Expedix Configuration Creation Serializer
    """
    class Meta:
        model = ExpedixConfiguration
        fields = [
            'configuration_type', 'required_patient_fields', 'optional_patient_fields',
            'custom_patient_fields', 'consultation_templates_enabled',
            'default_consultation_template', 'settings'
        ]
    
    def validate_required_patient_fields(self, value):
        """Validate that required fields are valid"""
        if value:
            available_fields = ExpedixConfiguration.get_default_patient_fields() + ExpedixConfiguration.get_available_optional_fields()
            invalid_fields = [field for field in value if field not in available_fields]
            if invalid_fields:
                raise serializers.ValidationError(f"Invalid fields: {invalid_fields}")
        return value
    
    def validate_custom_patient_fields(self, value):
        """Validate custom field definitions"""
        if value:
            for field_def in value:
                if not isinstance(field_def, dict):
                    raise serializers.ValidationError("Custom fields must be objects")
                
                required_keys = ['field_name', 'field_type', 'label']
                for key in required_keys:
                    if key not in field_def:
                        raise serializers.ValidationError(f"Custom field missing required key: {key}")
                        
                # Validate field types
                valid_types = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'email', 'phone']
                if field_def.get('field_type') not in valid_types:
                    raise serializers.ValidationError(f"Invalid field type: {field_def.get('field_type')}. Must be one of: {valid_types}")
        return value


class ConsultationTemplateSerializer(serializers.ModelSerializer):
    """
    Consultation Template Serializer
    For managing consultation templates with FormX integration
    """
    formx_template_name = serializers.SerializerMethodField()
    fields_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = ConsultationTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'clinic_id', 'workspace_id',
            'formx_template_id', 'fields_config', 'is_default', 'is_active',
            'created_at', 'updated_at',
            # Computed fields
            'formx_template_name', 'fields_preview'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_formx_template_name(self, obj):
        """Get FormX template name if linked"""
        formx_template = obj.get_formx_template()
        return formx_template.name if formx_template else None
    
    def get_fields_preview(self, obj):
        """Get preview of template fields"""
        if obj.has_formx_integration():
            formx_template = obj.get_formx_template()
            if formx_template:
                try:
                    fields = formx_template.fields.all().order_by('order')
                    return [
                        {
                            'field_name': field.field_name,
                            'label': field.label,
                            'field_type': field.field_type,
                            'required': field.required
                        }
                        for field in fields[:10]  # Limit preview to 10 fields
                    ]
                except:
                    pass
            return []
        elif obj.fields_config:
            return [
                {
                    'field_name': field.get('field_name', 'Unknown'),
                    'label': field.get('label', field.get('field_name', 'Unknown')),
                    'field_type': field.get('field_type', 'text'),
                    'required': field.get('required', False)
                }
                for field in obj.fields_config[:10]  # Limit preview
            ]
        return []


class PrescriptionSerializer(serializers.ModelSerializer):
    """
    Prescription Serializer with PDF generation support
    """
    medication_summary = serializers.SerializerMethodField()
    is_valid_prescription = serializers.SerializerMethodField()
    patient_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'clinic_id', 'workspace_id', 'patient_id', 'consultation_id',
            'created_by', 'prescription_number', 'date_prescribed', 'valid_until',
            'status', 'prescription_type', 'diagnosis', 'clinical_notes',
            'medications', 'general_instructions', 'follow_up_date', 'follow_up_notes',
            'digital_signature', 'verification_code', 'pdf_generated', 'pdf_generated_at',
            'pdf_url', 'professional_name', 'professional_license', 'professional_specialty',
            'created_at', 'updated_at',
            # Computed fields
            'medication_summary', 'is_valid_prescription', 'patient_info'
        ]
        read_only_fields = [
            'id', 'prescription_number', 'pdf_generated', 'pdf_generated_at', 
            'pdf_url', 'created_at', 'updated_at', 'verification_code'
        ]

    def get_medication_summary(self, obj):
        """Get formatted medication summary"""
        return obj.get_medication_summary()

    def get_is_valid_prescription(self, obj):
        """Check if prescription is still valid"""
        return obj.is_valid()

    def get_patient_info(self, obj):
        """Get patient information"""
        return obj.get_patient_info()

    def validate_medications(self, value):
        """Validate medications format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Medications must be a list")
        
        for medication in value:
            if not isinstance(medication, dict):
                raise serializers.ValidationError("Each medication must be an object")
            
            if not medication.get('name'):
                raise serializers.ValidationError("Each medication must have a name")
                
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Validate dual system constraint
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if not clinic_id and not workspace_id:
            raise serializers.ValidationError(
                "Either clinic_id or workspace_id must be provided"
            )
        
        if clinic_id and workspace_id:
            raise serializers.ValidationError(
                "Only one of clinic_id or workspace_id should be provided"
            )
        
        # Validate valid_until date
        valid_until = data.get('valid_until')
        if valid_until and valid_until < timezone.now().date():
            raise serializers.ValidationError(
                "Valid until date cannot be in the past"
            )
            
        return data


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """
    Prescription Creation Serializer
    """
    class Meta:
        model = Prescription
        fields = [
            'clinic_id', 'workspace_id', 'patient_id', 'consultation_id',
            'created_by', 'date_prescribed', 'valid_until', 'status',
            'prescription_type', 'diagnosis', 'clinical_notes', 'medications',
            'general_instructions', 'follow_up_date', 'follow_up_notes',
            'professional_name', 'professional_license', 'professional_specialty'
        ]

    def validate(self, data):
        """Validation for prescription creation"""
        # Dual system validation
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if not clinic_id and not workspace_id:
            raise serializers.ValidationError(
                "Either clinic_id or workspace_id must be provided"
            )
        
        if clinic_id and workspace_id:
            raise serializers.ValidationError(
                "Only one of clinic_id or workspace_id should be provided"
            )
        
        # Validate medications
        medications = data.get('medications', [])
        if not medications:
            raise serializers.ValidationError(
                "At least one medication must be specified"
            )
        
        return data

    def create(self, validated_data):
        """Create prescription with auto-generated fields"""
        prescription = super().create(validated_data)
        
        # Generate verification code
        prescription.generate_verification_code()
        prescription.save(update_fields=['verification_code'])
        
        return prescription


class ConsultationTemplateCreateSerializer(serializers.ModelSerializer):
    """
    Consultation Template Creation Serializer
    """
    class Meta:
        model = ConsultationTemplate
        fields = [
            'name', 'description', 'template_type', 'formx_template_id',
            'fields_config', 'is_default', 'is_active'
        ]
    
    def validate_fields_config(self, value):
        """Validate fields configuration"""
        if value and not isinstance(value, list):
            raise serializers.ValidationError("Fields config must be a list")
        
        if value:
            for field_config in value:
                if not isinstance(field_config, dict):
                    raise serializers.ValidationError("Each field config must be an object")
                
                required_keys = ['field_name', 'field_type', 'label']
                for key in required_keys:
                    if key not in field_config:
                        raise serializers.ValidationError(f"Field config missing required key: {key}")
        return value