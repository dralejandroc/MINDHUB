"""
Expedix Models - Patient Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
import json
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone



class SafeJSONField(models.JSONField):
    """
    Custom JSONField that handles corrupted JSON data gracefully
    """
    
    def from_db_value(self, value, expression, connection):
        """Handle value from database - may be already parsed or a string"""
        if value is None:
            return value
        
        # If it's already a list/dict, return as-is (this is our case)
        if isinstance(value, (list, dict)):
            return value
        
        # If it's a string, try to parse as JSON
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                # If JSON parsing fails, return empty list as fallback
                return []
        
        # For any other type, return empty list as safe fallback
        return []


class Profile(models.Model):
    """Profile model matching actual Supabase profiles table"""
    id = models.UUIDField(primary_key=True, editable=False)
    email = models.TextField(blank=True, null=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    license_type = models.TextField(blank=True, null=True)
    clinic_id = models.UUIDField(blank=True, null=True)
    clinic_role = models.TextField(blank=True, null=True)
    professional_title = models.TextField(blank=True, null=True)
    license_number = models.TextField(blank=True, null=True)
    specialization = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'profiles'
        managed = False  # Use existing Supabase table

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class Patient(models.Model):
    """Patient model matching ACTUAL Supabase schema exactly"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core personal fields - EXACT match to database
    medical_record_number = models.TextField(blank=True, null=True)
    first_name = models.TextField()  # NOT NULL
    last_name = models.TextField(blank=True, null=True)
    paternal_last_name = models.TextField(blank=True, null=True)  # Missing from old model
    maternal_last_name = models.TextField(blank=True, null=True)  # Missing from old model
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    
    # Location fields
    address = models.TextField(blank=True, null=True)
    city = models.TextField(blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    postal_code = models.TextField(blank=True, null=True)
    country = models.TextField(blank=True, null=True)  # Missing from old model
    
    # Mexican specific fields
    curp = models.TextField(blank=True, null=True)
    rfc = models.TextField(blank=True, null=True)
    blood_type = models.TextField(blank=True, null=True)
    
    # Array fields (PostgreSQL specific) - Use proper ArrayField for PostgreSQL arrays
    allergies = ArrayField(models.TextField(), blank=True, null=True, default=list)
    chronic_conditions = ArrayField(models.TextField(), blank=True, null=True, default=list) 
    current_medications = ArrayField(models.TextField(), blank=True, null=True, default=list)
    tags = ArrayField(models.TextField(), blank=True, null=True, default=list)
    
    # Emergency contact fields
    emergency_contact_name = models.TextField(blank=True, null=True)
    emergency_contact_phone = models.TextField(blank=True, null=True)
    emergency_contact_relationship = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=255, blank=True, null=True)  # Different type
    emergency_phone = models.CharField(max_length=255, blank=True, null=True)  # Different type
    
    # Medical info
    marital_status = models.CharField(max_length=255, blank=True, null=True)
    occupation = models.CharField(max_length=255, blank=True, null=True)
    insurance_provider = models.CharField(max_length=255, blank=True, null=True)
    insurance_number = models.CharField(max_length=255, blank=True, null=True)
    
    # Consent fields
    consent_to_treatment = models.BooleanField(blank=True, null=True)
    consent_to_data_processing = models.BooleanField(blank=True, null=True)
    
    # Classification
    patient_category = models.TextField(blank=True, null=True)
    
    # Critical association fields - SIMPLIFIED ARCHITECTURE
    created_by = models.UUIDField(blank=True, null=True)  # Supabase user ID del creador
    clinic_id = models.UUIDField(blank=True, null=True)  # true = clinic shared, false = individual user
    assigned_professional_id = models.UUIDField(blank=True, null=True)  # Profesional asignado
    user_id = models.UUIDField(blank=True, null=True)  # Owner of the record
    
    # Additional notes
    notes = models.TextField(blank=True, null=True)

    # NUEVO: dueño/supabase user id
    user_id = models.UUIDField(null=True, blank=True, db_index=True, verbose_name="ID de Usuario (Supabase)")

    
    # Status
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['created_by']),           # Critical for individual user filtering
            models.Index(fields=['clinic_id']),            # Critical for clinic filtering  
            models.Index(fields=['assigned_professional_id']), # Professional assignment
            models.Index(fields=['is_active']),
            models.Index(fields=['medical_record_number']),
        ]

    def __str__(self):
        # Use the proper name format: first_name + paternal_last_name + maternal_last_name
        name_parts = [self.first_name]
        if self.paternal_last_name:
            name_parts.append(self.paternal_last_name)
        if self.maternal_last_name:
            name_parts.append(self.maternal_last_name)
        elif self.last_name:  # Fallback to last_name if no paternal_last_name
            name_parts.append(self.last_name)
        return " ".join(name_parts).strip()

    @property
    def full_name(self):
        return self.__str__()

    @property
    def age(self):
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None


class MedicalHistory(models.Model):
    """Medical history model migrated from Prisma schema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_history')
    condition = models.CharField(max_length=200)
    diagnosis_date = models.DateField(blank=True, null=True)
    treatment = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='active')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medical_history'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.patient.full_name} - {self.condition}"


class Consultation(models.Model):
    """Consultation model migrated from Prisma schema"""
    STATUS_CHOICES = [
        ('scheduled', 'Programada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField()  # Use direct UUID field to avoid FK errors
    professional_id = models.UUIDField()  # Use direct UUID field to avoid FK errors
    consultation_date = models.DateTimeField()
    chief_complaint = models.TextField(blank=True, null=True)  # Match real table structure
    consultation_notes = models.TextField(blank=True, null=True)
    diagnosis = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    duration_minutes = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consultations'
        indexes = [
            models.Index(fields=['patient_id']),
            models.Index(fields=['professional_id']),
            models.Index(fields=['consultation_date']),
            models.Index(fields=['status']),
        ]
        managed = False  # Use existing Supabase table

    def __str__(self):
        return f"Consulta {self.patient_id} - {self.consultation_date.strftime('%Y-%m-%d')}"




class ExpedixConfiguration(models.Model):
    """
    Configuración flexible de Expedix por clínica/usuario
    Permite definir campos obligatorios y configuraciones personalizadas
    """
    CONFIGURATION_TYPE_CHOICES = [
        ('clinic', 'Configuración de Clínica'),
        ('individual', 'Configuración Individual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Simplified system support
    clinic_id = models.BooleanField(default=False)  # true = clinic config, false = individual config
    user_id = models.UUIDField()  # Creator/owner
    
    configuration_type = models.CharField(max_length=20, choices=CONFIGURATION_TYPE_CHOICES, default='clinic')
    
    # Patient form configuration
    required_patient_fields = models.JSONField(default=list, help_text="Campos obligatorios para pacientes")
    optional_patient_fields = models.JSONField(default=list, help_text="Campos opcionales disponibles")
    custom_patient_fields = models.JSONField(default=list, help_text="Campos personalizados definidos por la clínica")
    
    # Consultation templates integration with FormX
    consultation_templates_enabled = models.BooleanField(default=True)
    default_consultation_template = models.UUIDField(blank=True, null=True)  # Reference to FormX template
    
    # Other settings
    settings = models.JSONField(default=dict, help_text="Configuraciones adicionales")
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expedix_configurations'
        constraints = [
            # Unique configuration per user
            models.UniqueConstraint(
                fields=['user_id'],
                name='unique_user_config'
            ),
        ]
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['user_id']),
            models.Index(fields=['configuration_type']),
        ]

    def __str__(self):
        if self.clinic_id:
            return f"Configuración Clínica - Usuario {self.user_id}"
        return f"Configuración Individual - Usuario {self.user_id}"

    @classmethod
    def get_default_patient_fields(cls):
        """Campos por defecto obligatorios según especificación"""
        return [
            'first_name',
            'paternal_last_name', 
            'maternal_last_name',
            'email',
            'phone',  # cell_phone
            'date_of_birth',  # birth_date
            'gender'
        ]

    @classmethod
    def get_available_optional_fields(cls):
        """Campos opcionales disponibles"""
        return [
            'address',
            'city', 
            'state',
            'postal_code',
            'country',
            'curp',
            'rfc',
            'medical_record_number',
            'blood_type',
            'allergies',
            'chronic_conditions',
            'current_medications',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relationship',
            'patient_category',
            'tags'
        ]

    def get_required_fields(self):
        """Obtiene campos obligatorios (por defecto + configurados)"""
        default_fields = self.get_default_patient_fields()
        custom_required = self.required_patient_fields or []
        return list(set(default_fields + custom_required))

    def get_optional_fields(self):
        """Obtiene campos opcionales disponibles"""
        available_fields = self.get_available_optional_fields()
        required_fields = self.get_required_fields()
        # Remove required fields from optional fields
        return [field for field in available_fields if field not in required_fields]


class ConsultationTemplate(models.Model):
    """
    Templates de consulta integrados con FormX
    Define la estructura y campos disponibles para las consultas
    """
    TEMPLATE_TYPE_CHOICES = [
        ('general', 'Consulta General'),
        ('followup', 'Consulta de Seguimiento'),
        ('initial', 'Primera Consulta'),
        ('emergency', 'Consulta de Emergencia'),
        ('specialized', 'Consulta Especializada'),
        ('custom', 'Plantilla Personalizada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Simplified system support
    clinic_id = models.BooleanField(default=False)  # true = clinic template, false = individual template
    created_by = models.UUIDField()
    user_id = models.UUIDField(blank=True, null=True)  # Owner of the template
    
    # Template basic info
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES, default='general')
    
    # FormX integration - this links to FormX dynamic forms
    formx_template_id = models.UUIDField(blank=True, null=True, help_text="ID del template en FormX")
    
    # Template structure (if not using FormX)
    fields_config = models.JSONField(default=list, help_text="Configuración de campos si no usa FormX")
    
    # Usage settings
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consultation_templates'
        constraints = []
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['created_by']),
            models.Index(fields=['user_id']),
            models.Index(fields=['template_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Template: {self.name} ({self.get_template_type_display()})"

    def get_formx_template(self):
        """
        Obtiene el template de FormX asociado
        """
        if self.formx_template_id:
            try:
                from formx.models import FormTemplate
                return FormTemplate.objects.get(id=self.formx_template_id)
            except FormTemplate.DoesNotExist:
                return None
        return None

    def has_formx_integration(self):
        """
        Verifica si este template tiene integración con FormX
        """
        return self.formx_template_id is not None

    def get_template_fields(self):
        """
        Obtiene los campos del template (desde FormX o configuración local)
        """
        if self.has_formx_integration():
            formx_template = self.get_formx_template()
            if formx_template:
                return formx_template.fields.filter(is_active=True).order_by('order')
        
        # Fallback to local fields_config
        return self.fields_config or []

    def create_formx_integration(self, form_name=None, form_type='clinical'):
        """
        Crea automáticamente un template en FormX para este template de consulta
        """
        if self.formx_template_id:
            return self.get_formx_template()
            
        try:
            from formx.models import FormTemplate
            
            # Create FormX template
            formx_template = FormTemplate.objects.create(
                name=form_name or f"Consulta: {self.name}",
                form_type=form_type,
                description=f"Template de consulta generado automáticamente desde Expedix: {self.description}",
                integration_type='expedix',
                created_by_id=str(self.created_by),
                auto_sync_expedix=True,
                expedix_mapping={
                    'consultation_template_id': str(self.id),
                    'template_type': self.template_type,
                }
            )
            
            # Link back to this consultation template
            self.formx_template_id = formx_template.id
            self.save(update_fields=['formx_template_id'])
            
            return formx_template
            
        except Exception as e:
            # Log error but don't break the flow
            print(f"Error creating FormX integration for ConsultationTemplate {self.id}: {e}")
            return None

    def sync_fields_to_formx(self, fields_data):
        """
        Sincroniza campos locales hacia FormX
        """
        if not self.has_formx_integration():
            return False
            
        try:
            from formx.models import FormField
            formx_template = self.get_formx_template()
            
            if not formx_template:
                return False
                
            # Clear existing fields
            formx_template.fields.all().delete()
            
            # Create new fields
            for order, field_data in enumerate(fields_data):
                FormField.objects.create(
                    template=formx_template,
                    field_name=field_data.get('field_name'),
                    field_type=field_data.get('field_type', 'text'),
                    label=field_data.get('label'),
                    help_text=field_data.get('help_text', ''),
                    placeholder=field_data.get('placeholder', ''),
                    required=field_data.get('required', False),
                    order=order,
                    choices=field_data.get('choices', []),
                    expedix_field=field_data.get('expedix_mapping'),
                    validation_rules=field_data.get('validation', {}),
                )
            
            return True
            
        except Exception as e:
            print(f"Error syncing fields to FormX: {e}")
            return False

    @classmethod
    def create_with_formx(cls, template_data, fields_data=None, **kwargs):
        """
        Crea un template de consulta con integración FormX automática
        """
        # Create consultation template first
        consultation_template = cls.objects.create(**template_data, **kwargs)
        
        # Create FormX integration
        formx_template = consultation_template.create_formx_integration()
        
        # Add fields if provided
        if fields_data and formx_template:
            consultation_template.sync_fields_to_formx(fields_data)
            
        return consultation_template


class Prescription(models.Model):
    """
    Prescription Model matching actual Supabase schema
    Receta con información general y lista de medicamentos en JSON.
    """

    PRESCRIPTION_STATUS_CHOICES = [
        ('active', 'Activa'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
        ('draft', 'Borrador'),
    ]

    PRESCRIPTION_TYPE_CHOICES = [
        ('acute', 'Aguda'),
        ('chronic', 'Crónica'),
        ('preventive', 'Preventiva'),
        ('emergency', 'Emergencia'),
        ('hospital', 'Hospitalaria'),
    ]

    # Identificador principal
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Soporte dual sistema
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    # Relaciones (referencias a Supabase)
    patient_id = models.UUIDField()  # Paciente en Supabase
    consultation_id = models.UUIDField(blank=True, null=True)  # Consulta relacionada (opcional)
    created_by = models.UUIDField(null=True, blank=True)  # Profesional que creó la receta

    # Información básica de la receta
    prescription_number = models.CharField(max_length=50, unique=True)
    date_prescribed = models.DateTimeField(default=timezone.now)
    valid_until = models.DateField(blank=True, null=True)

    # Estado y tipo
    status = models.CharField(
        max_length=20,
        choices=PRESCRIPTION_STATUS_CHOICES,
        default='active'
    )
    prescription_type = models.CharField(
        max_length=20,
        choices=PRESCRIPTION_TYPE_CHOICES,
        default='acute'
    )

    # Información clínica
    diagnosis = models.TextField(
        help_text="Diagnóstico que justifica la prescripción"
    )
    clinical_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notas clínicas adicionales"
    )

    # Medicamentos (lista flexible)
    medications = models.JSONField(
        default=list,
        help_text="Lista de medicamentos con dosis, frecuencia, duración"
    )

    # Instrucciones generales
    general_instructions = models.TextField(
        blank=True,
        null=True,
        help_text="Instrucciones generales para el paciente"
    )

    # Seguimiento
    follow_up_date = models.DateField(blank=True, null=True)
    follow_up_notes = models.TextField(blank=True, null=True)

    # Firma digital y verificación
    digital_signature = models.TextField(blank=True, null=True)
    verification_code = models.CharField(max_length=20, blank=True, null=True)

    # Generación de PDF
    pdf_generated = models.BooleanField(default=False)
    pdf_generated_at = models.DateTimeField(blank=True, null=True)
    pdf_url = models.URLField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Datos del profesional (cacheados para el PDF)
    professional_name = models.CharField(max_length=200, blank=True, null=True)
    professional_license = models.CharField(max_length=50, blank=True, null=True)
    professional_specialty = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'prescriptions'
        managed = False  # Usar tabla existente en Supabase

    def __str__(self):
        return f"Prescription {self.prescription_number} - Patient {self.patient_id}"



class MedicationDatabase(models.Model):
    """
    Catálogo maestro de medicamentos - Base de datos farmacológica
    Tabla real en Supabase con 30 medicamentos
    """
    id = models.UUIDField(primary_key=True, editable=False)
    commercial_name = models.TextField(blank=True, null=True)
    generic_name = models.TextField(blank=True, null=True)
    active_ingredients = models.TextField(blank=True, null=True)
    concentration = models.TextField(blank=True, null=True)
    pharmaceutical_form = models.TextField(blank=True, null=True)
    laboratory = models.TextField(blank=True, null=True)
    control_group = models.TextField(blank=True, null=True)  # GII, GIII, GIV
    therapeutic_indications = models.TextField(blank=True, null=True)
    contraindications = models.TextField(blank=True, null=True)
    side_effects = models.TextField(blank=True, null=True)
    dosage_recommendations = models.TextField(blank=True, null=True)
    storage_conditions = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'medication_database'
        managed = False  # Use existing Supabase table

    def __str__(self):
        return f"{self.commercial_name} ({self.generic_name})"

    @property
    def display_name(self):
        """Nombre para mostrar en UI"""
        if self.commercial_name and self.generic_name:
            return f"{self.commercial_name} ({self.generic_name})"
        return self.commercial_name or self.generic_name or "Medicamento"

    @property
    def concentration_display(self):
        """Concentración formateada para UI"""
        return self.concentration or "Concentración no especificada"

    def get_control_group_display(self):
        """Mostrar grupo de control con descripción"""
        control_groups = {
            'GII': 'Grupo II - Sustancias con valor terapéutico',
            'GIII': 'Grupo III - Sustancias con valor terapéutico bajo',
            'GIV': 'Grupo IV - Sustancias con valor terapéutico mínimo'
        }
        return control_groups.get(self.control_group, self.control_group or 'No clasificado')


class PrescriptionMedication(models.Model):
    """
    Medicamentos específicos dentro de recetas
    Tabla para recetas detalladas con múltiples medicamentos
    """
    id = models.UUIDField(primary_key=True, editable=False)
    prescription_id = models.UUIDField(blank=True, null=True)  # Agrupa medicamentos por receta
    patient_id = models.UUIDField(blank=True, null=True)
    consultation_id = models.UUIDField(blank=True, null=True)
    professional_id = models.UUIDField(blank=True, null=True)
    
    # Información del medicamento (puede ser de medication_database o manual)
    medication_database_id = models.UUIDField(blank=True, null=True)  # FK a medication_database
    medication_name = models.TextField(blank=True, null=True)  # Nombre comercial/genérico
    generic_name = models.TextField(blank=True, null=True)
    concentration = models.TextField(blank=True, null=True)
    pharmaceutical_form = models.TextField(blank=True, null=True)
    
    # Prescripción específica
    dosage = models.TextField(blank=True, null=True)  # "1 tableta"
    frequency = models.TextField(blank=True, null=True)  # "cada 8 horas"
    duration = models.TextField(blank=True, null=True)  # "por 7 días"
    special_instructions = models.TextField(blank=True, null=True)  # "antes de comer"
    
    # Indicaciones médicas específicas
    medical_indication = models.TextField(blank=True, null=True)  # Para qué se prescribe
    
    # Control y metadata
    clinic_id = models.BooleanField(blank=True, null=True)
    user_id = models.UUIDField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'prescription_medications'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['prescription_id']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['consultation_id']),
            models.Index(fields=['medication_database_id']),
        ]

    def __str__(self):
        return f"{self.medication_name} - {self.dosage} {self.frequency}"

    @property
    def full_prescription_text(self):
        """Texto completo de la prescripción para imprimir"""
        parts = [self.medication_name]
        if self.concentration:
            parts.append(f"({self.concentration})")
        if self.dosage:
            parts.append(f"- {self.dosage}")
        if self.frequency:
            parts.append(f"{self.frequency}")
        if self.duration:
            parts.append(f"por {self.duration}")
        if self.special_instructions:
            parts.append(f"- {self.special_instructions}")
        return " ".join(parts)

    def get_medication_from_database(self):
        """Obtiene información completa del medicamento del catálogo"""
        if self.medication_database_id:
            try:
                return MedicationDatabase.objects.get(id=self.medication_database_id)
            except MedicationDatabase.DoesNotExist:
                return None
        return None

    @classmethod
    def get_by_prescription(cls, prescription_id):
        """Obtiene todos los medicamentos de una receta"""
        return cls.objects.filter(prescription_id=prescription_id).order_by('created_at')

    @classmethod
    def get_by_patient(cls, patient_id, user_id=None, clinic_shared=None):
        """Obtiene medicamentos prescritos para un paciente"""
        queryset = cls.objects.filter(patient_id=patient_id).order_by('-created_at')
        
        if clinic_shared is not None:
            queryset = queryset.filter(clinic_id=clinic_shared)
        elif user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset


def default_working_days():
    return [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]


def default_work_days():
    return [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ]


def default_working_hours():
    return {
        "start": "08:00",
        "end": "20:00",
    }


def default_lunch_break():
    return {
        "enabled": True,
        "start": "13:00",
        "end": "15:00",
    }


def default_consultation_types():
    return [
        {
            "id": "1",
            "name": "Primera consulta",
            "duration": 60,
            "price": 850,
            "color": "#8B5CF6",
        },
        {
            "id": "2",
            "name": "Consulta subsecuente",
            "duration": 60,
            "price": 750,
            "color": "#10B981",
        },
        {
            "id": "3",
            "name": "Consulta breve",
            "duration": 30,
            "price": 500,
            "color": "#F59E0B",
        },
        {
            "id": "4",
            "name": "Videoconsulta",
            "duration": 45,
            "price": 650,
            "color": "#3B82F6",
        },
        {
            "id": "5",
            "name": "Consulta de urgencia",
            "duration": 90,
            "price": 1200,
            "color": "#EF4444",
        },
    ]


class ScheduleConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # UUID del usuario (obtenido del token)
    user_id = models.UUIDField()

    # Lo dejamos opcional para poder usar None por ahora
    clinic_id = models.UUIDField(null=True, blank=True)

    workingDays = models.JSONField(default=default_working_days, blank=True)
    workingHours = models.JSONField(default=default_working_hours, blank=True)
    defaultAppointmentDuration = models.IntegerField(default=60)
    bufferTime = models.IntegerField(default=15)
    lunchBreak = models.JSONField(default=default_lunch_break, blank=True)
    consultationTypes = models.JSONField(default=default_consultation_types, blank=True)

    work_days = models.JSONField(default=default_work_days, blank=True)
    start_time = models.CharField(max_length=5, default="08:00")
    end_time = models.CharField(max_length=5, default="20:00")
    appointment_duration = models.IntegerField(default=60)
    break_time = models.IntegerField(default=15)
    lunch_start = models.CharField(max_length=5, default="13:00")
    lunch_end = models.CharField(max_length=5, default="14:00")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # ahora puede haber solo 1 config por user (clinic_id sin usar o siempre null)
        unique_together = ("user_id", "clinic_id")

    def __str__(self):
        return f"ScheduleConfig(user={self.user_id}, clinic={self.clinic_id})"

class UserDocument(models.Model):
    """
    Archivos subidos por usuario y almacenados en S3
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    
    s3_key = models.CharField(max_length=512)
    file_url = models.URLField(max_length=1024)
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    content_type = models.CharField(max_length=100, blank=True)
    
    # Guardamos tags como lista de strings en JSONField
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "expedix_user_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_name} ({self.owner_id})"

