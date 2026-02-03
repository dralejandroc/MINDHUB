"""
Expedix Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from .models import Profile, Patient, MedicalHistory, Consultation, Prescription, ExpedixConfiguration, ConsultationTemplate, MedicationDatabase, PrescriptionMedication, ScheduleConfig, UserDocument, PatientDocument
from .services.patient_service import PatientService
# from agenda.models import Appointment  # REMOVED for Vercel deployment


class ProfileSerializer(serializers.ModelSerializer):
    """User serializer for API responses"""
    
    class Meta:
        model = Profile
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
            'created_by', 'clinic_id', 'assigned_professional_id', 'user_id',
            # Status and metadata
            'patient_category', 'is_active', 'created_at', 'updated_at', 'user_id'
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at', 'age']


class PatientCreateSerializer(serializers.ModelSerializer):
    """
    Patient creation serializer con VALIDACIÓN FLEXIBLE
    y `phone` realmente opcional.
    """
    # Aceptar ambos formatos
    birth_date = serializers.DateField(source='date_of_birth', required=False, allow_null=True)
    
    # OJO: ahora estos son OPCIONALES
    phone = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    cell_phone = serializers.CharField(   # alias de phone
        source='phone',
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            # Core fields
            'id',
            'first_name', 'paternal_last_name', 'maternal_last_name', 'last_name',
            'email', 'phone', 'cell_phone', 'date_of_birth', 'birth_date', 'gender',
            # Location
            'address', 'city', 'state', 'postal_code', 'country',
            # Mexican specific fields
            'curp', 'rfc', 'medical_record_number', 'blood_type',
            # Medical arrays
            'allergies', 'chronic_conditions', 'current_medications', 'tags',
            # Emergency contact
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            # Professional assignment (optional)
            'assigned_professional_id', 'user_id',
            # Category
            'patient_category',
            # Note: created_by y clinic_id los setea la view
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
            
            for field_name, field in self.fields.items():
                mapped_field_name = self._map_field_name(field_name)

                # ⚠️ Si por alguna razón en config viene phone, lo puedes ignorar aquí:
                if mapped_field_name in required_fields and mapped_field_name not in ['phone']:
                    field.required = True
                    # solo si el campo soporta allow_blank
                    if hasattr(field, 'allow_blank'):
                        field.allow_blank = False
                else:
                    field.required = False
                    if hasattr(field, 'allow_blank'):
                        field.allow_blank = True
        else:
            # Fallback a defaults si no hay config
            self._set_default_requirements()
    
    def _map_field_name(self, field_name):
        """Map serializer field names to config field names"""
        mapping = {
            'birth_date': 'date_of_birth',
            'cell_phone': 'phone',
        }
        return mapping.get(field_name, field_name)
    
    def _set_default_requirements(self):
        """Set default field requirements (cuando NO hay config)"""
        # 👉 Aquí QUITAMOS phone y cell_phone
        default_required = [
            'first_name', 'paternal_last_name', 'maternal_last_name',
            'email', 'date_of_birth', 'birth_date', 'gender'
        ]
        
        for field_name, field in self.fields.items():
            if field_name in default_required:
                field.required = True
                if hasattr(field, 'allow_blank'):
                    field.allow_blank = False
            else:
                field.required = False
                if hasattr(field, 'allow_blank'):
                    field.allow_blank = True

    def validate_email(self, value):
        # Igual que tenías
        if self.instance is None:
            if value and Patient.objects.filter(email=value).exists():
                raise serializers.ValidationError("Ya existe un paciente con este email.")
        else:
            if value and Patient.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Ya existe un paciente con este email.")
        return value
    
    def validate(self, attrs):
        """
        Validar que identidad del paciente sea única (nombre + fecha de nacimiento)
        """
        first_name = attrs.get('first_name')
        paternal_last_name = attrs.get('paternal_last_name')
        maternal_last_name = attrs.get('maternal_last_name')
        date_of_birth = attrs.get('date_of_birth')
        
        if first_name and date_of_birth:
            query_filters = {
                'first_name': first_name,
                'paternal_last_name': paternal_last_name,
                'maternal_last_name': maternal_last_name,
                'date_of_birth': date_of_birth,
                'is_active': True
            }
            
            existing_query = Patient.objects.filter(**query_filters)
            if self.instance is not None:
                existing_query = existing_query.exclude(pk=self.instance.pk)
                
            if existing_query.exists():
                existing_patient = existing_query.first()
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f'Ya existe un paciente con este nombre completo y fecha de nacimiento. '
                        f'Expediente existente: {existing_patient.medical_record_number}'
                    ]
                })
        
        return attrs
    
    def create(self, validated_data):
        """
        Crear paciente con MRN auto-generado usando PatientService
        """
        # Normalizar phone: '' → None
        phone = validated_data.get('phone')
        if phone in ['', None]:
            validated_data['phone'] = None

        patient_service = PatientService()
        medical_record_number = patient_service.generate_medical_record_number(
            first_name=validated_data.get('first_name'),
            paternal_last_name=validated_data.get('paternal_last_name'),
            maternal_last_name=validated_data.get('maternal_last_name'),
            date_of_birth=validated_data.get('date_of_birth')
        )
        validated_data['medical_record_number'] = medical_record_number
        
        return super().create(validated_data)



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
            # TEMPORARILY DISABLED for Vercel deployment - agenda app not included
            appointments = []
            # appointments = Appointment.objects.filter(
            #     patient_id=obj.id,
            #     status__in=['scheduled', 'confirmed', 'completed']
            # ).order_by('-appointment_date')[:5]
        
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
            'id', 'configuration_type', 'clinic_id', 'user_id',
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
    class Meta:
        model = ExpedixConfiguration
        fields = [
            'id',
            'created_by',
            'configuration_type',
            'clinic_id',
            'workspace_id',

            'settings',
            'required_patient_fields',
            'optional_patient_fields',
            'custom_patient_fields',
            'consultation_templates_enabled',
            'default_consultation_template',

            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_id',
            'created_by',
            'clinic_id',
            'workspace_id',
            'configuration_type',
            'is_clinic_config',
            'created_at',
            'updated_at',
            'is_active',
        ]

    def validate_required_patient_fields(self, value):
        if value:
            available_fields = (
                ExpedixConfiguration.get_default_patient_fields()
                + ExpedixConfiguration.get_available_optional_fields()
            )
            invalid_fields = [f for f in value if f not in available_fields]
            if invalid_fields:
                raise serializers.ValidationError(f"Invalid fields: {invalid_fields}")
        return value

    def validate_custom_patient_fields(self, value):
        if value:
            valid_types = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'email', 'phone']
            for field_def in value:
                if not isinstance(field_def, dict):
                    raise serializers.ValidationError("Custom fields must be objects")
                for key in ['field_name', 'field_type', 'label']:
                    if key not in field_def:
                        raise serializers.ValidationError(f"Custom field missing required key: {key}")
                if field_def.get('field_type') not in valid_types:
                    raise serializers.ValidationError(
                        f"Invalid field type: {field_def.get('field_type')}. Must be one of: {valid_types}"
                    )
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
            'id', 'name', 'description', 'template_type', 'clinic_id', 'user_id',
            'formx_template_id', 'fields_config', 'is_default', 'is_active',
            'created_at', 'updated_at', 'identifier',
            # Computed fields
            'formx_template_name', 'fields_preview'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_formx_template_name(self, obj):
        """Get FormX template name if linked"""
        formx_template = obj.get_formx_template()
        return formx_template.name if formx_template else None
    
    fields_preview = serializers.SerializerMethodField()

    def get_fields_preview(self, obj):
        raw = getattr(obj, "fields", None)  # <-- cambia "fields" si tu columna se llama distinto
        if raw is None:
            return []

        # Si viene como string JSON, parsearlo
        if isinstance(raw, str):
            s = raw.strip()
            if not s:
                return []
            # Intentar JSON
            if (s.startswith("[") and s.endswith("]")) or (s.startswith("{") and s.endswith("}")):
                try:
                    raw = json.loads(s)
                except Exception:
                    # era string normal, no JSON válido
                    raw = [s]
            else:
                raw = [s]

        # Si viene como dict único, convertir a lista
        if isinstance(raw, dict):
            raw = [raw]

        # Si no es lista, fallback seguro
        if not isinstance(raw, list):
            return []

        preview = []
        for item in raw[:6]:  # preview limitado
            # Caso 1: dict
            if isinstance(item, dict):
                preview.append({
                    "field_name": item.get("field_name") or item.get("name") or "Unknown",
                    "label": item.get("label") or item.get("title") or item.get("field_name") or "Sin nombre",
                    "type": item.get("type") or "custom",
                })
                continue

            # Caso 2: string
            if isinstance(item, str):
                name = item.strip() or "Unknown"
                preview.append({
                    "field_name": name,
                    "label": name.replace("_", " ").title(),
                    "type": "built_in",
                })
                continue

            # Caso 3: cualquier otra cosa
            preview.append({
                "field_name": "Unknown",
                "label": "Unknown",
                "type": "custom",
            })

        return preview


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
            'id', 'clinic_id', 'user_id', 'patient_id', 'consultation_id',
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
        # Validate simplified system constraint
        clinic_id = data.get('clinic_id')
        user_id = data.get('user_id')
        
        # For individual records, user_id is required
        if not clinic_id and not user_id:
            raise serializers.ValidationError(
                "user_id must be provided for individual medical histories"
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
            'clinic_id', 'user_id', 'patient_id', 'consultation_id',
            'created_by', 'date_prescribed', 'valid_until', 'status',
            'prescription_type', 'diagnosis', 'clinical_notes', 'medications',
            'general_instructions', 'follow_up_date', 'follow_up_notes',
            'professional_name', 'professional_license', 'professional_specialty'
        ]

    def validate(self, data):
        """Validation for prescription creation"""
        # Simplified system validation
        clinic_id = data.get('clinic_id')
        user_id = data.get('user_id')
        
        # For individual records, user_id is required
        if not clinic_id and not user_id:
            raise serializers.ValidationError(
                "user_id must be provided for individual prescriptions"
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
            'fields_config', 'is_default', 'is_active', 'identifier'
        ]

    def validate_fields_config(self, value):
        """
        fields_config debe ser list[str] (keys de secciones/campos)
        Ej: ["vitalSigns","currentCondition","diagnosis","medications"]
        """
        if value is None:
            return []

        if not isinstance(value, list):
            raise serializers.ValidationError("Fields config must be a list")

        for i, key in enumerate(value):
            if not isinstance(key, str):
                raise serializers.ValidationError(f"fields_config[{i}] must be a string")
            if not key.strip():
                raise serializers.ValidationError(f"fields_config[{i}] cannot be empty")

        # opcional: quitar duplicados preservando orden
        seen = set()
        out = []
        for k in value:
            if k not in seen:
                out.append(k)
                seen.add(k)

        return out


class MedicationDatabaseSerializer(serializers.ModelSerializer):
    """Serializer for medication database catalog"""
    display_name = serializers.ReadOnlyField()
    concentration_display = serializers.ReadOnlyField()
    control_group_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicationDatabase
        fields = [
            'id', 'commercial_name', 'generic_name', 'active_ingredients',
            'concentration', 'pharmaceutical_form', 'laboratory', 
            'control_group', 'therapeutic_indications', 'contraindications',
            'side_effects', 'dosage_recommendations', 'storage_conditions',
            'is_active', 'created_at', 'updated_at',
            'display_name', 'concentration_display', 'control_group_display'
        ]

    def get_control_group_display(self, obj):
        return obj.get_control_group_display()


class PrescriptionMedicationSerializer(serializers.ModelSerializer):
    """Serializer for individual prescription medications"""
    full_prescription_text = serializers.ReadOnlyField()
    medication_from_database = serializers.SerializerMethodField()
    
    class Meta:
        model = PrescriptionMedication
        fields = [
            'id', 'prescription_id', 'patient_id', 'consultation_id', 
            'professional_id', 'medication_database_id', 'medication_name',
            'generic_name', 'concentration', 'pharmaceutical_form',
            'dosage', 'frequency', 'duration', 'special_instructions',
            'medical_indication', 'clinic_id', 'user_id', 
            'created_at', 'updated_at', 'full_prescription_text',
            'medication_from_database'
        ]

    def get_medication_from_database(self, obj):
        """Include medication database info if available"""
        med_db = obj.get_medication_from_database()
        if med_db:
            return {
                'commercial_name': med_db.commercial_name,
                'generic_name': med_db.generic_name,
                'control_group': med_db.control_group,
                'therapeutic_indications': med_db.therapeutic_indications,
                'contraindications': med_db.contraindications
            }
        return None


class MedicationSearchSerializer(serializers.Serializer):
    """Serializer for medication search results with compatibility for existing frontend"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    generic_name = serializers.CharField()
    presentations = serializers.ListField()
    category = serializers.CharField()
    common_prescriptions = serializers.ListField()
    
    # Additional fields from real database
    control_group = serializers.CharField(allow_null=True)
    therapeutic_indications = serializers.CharField(allow_null=True)
    laboratory = serializers.CharField(allow_null=True)

class ScheduleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleConfig
        fields = [
            "id",
            "user_id",
            "clinic_id",
            "workingDays",
            "workingHours",
            "defaultAppointmentDuration",
            "bufferTime",
            "lunchBreak",
            "consultationTypes",
            "work_days",
            "start_time",
            "end_time",
            "appointment_duration",
            "break_time",
            "lunch_start",
            "lunch_end",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "clinic_id",
            "created_at",
            "updated_at",
        ]

class UserDocumentSerializer(serializers.ModelSerializer):
    # Solo lectura para mostrar bonito
    owner_id = serializers.UUIDField(source="owner.id", read_only=True)

    class Meta:
        model = UserDocument
        fields = [
            "id",
            "owner_id",
            "file_url",
            "s3_key",
            "original_name",
            "size",
            "content_type",
            "tags",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "owner_id",
            "file_url",
            "s3_key",
            "original_name",
            "size",
            "content_type",
            "created_at",
        ]

class PatientDocumentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = PatientDocument
        fields = [
            'id',
            'patient',
            'patient_name',
            'file_name',
            'file_type',
            'file_size',
            'file_url',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'file_url', 'uploaded_at', 'patient_name']

