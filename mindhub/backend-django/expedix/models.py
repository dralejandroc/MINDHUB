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


class User(models.Model):
    """User model migrated from Prisma schema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_user_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=50, default='professional')
    organization = models.CharField(max_length=200, blank=True, null=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['supabase_user_id']),
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]

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
    age = models.IntegerField(blank=True, null=True)  # Calculated age field
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
    
    # Critical association fields - EXACTLY as in Supabase
    created_by = models.UUIDField(blank=True, null=True)  # Supabase user ID del creador
    clinic_id = models.UUIDField(blank=True, null=True)  # Can be NULL in real table
    assigned_professional_id = models.UUIDField(blank=True, null=True)  # Profesional asignado
    workspace_id = models.UUIDField(blank=True, null=True)  # For dual system
    
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
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True)  # For clinic licenses
    workspace_id = models.UUIDField(blank=True, null=True)  # For individual licenses
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
            # Ensure either clinic_id or workspace_id is set, but not both
            models.CheckConstraint(
                check=(
                    (models.Q(clinic_id__isnull=False) & models.Q(workspace_id__isnull=True)) |
                    (models.Q(clinic_id__isnull=True) & models.Q(workspace_id__isnull=False))
                ),
                name='expedix_config_dual_system_constraint'
            ),
            # Unique configuration per clinic/workspace
            models.UniqueConstraint(
                fields=['clinic_id'],
                condition=models.Q(clinic_id__isnull=False),
                name='unique_clinic_config'
            ),
            models.UniqueConstraint(
                fields=['workspace_id'],
                condition=models.Q(workspace_id__isnull=False),
                name='unique_workspace_config'
            ),
        ]
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
            models.Index(fields=['user_id']),
            models.Index(fields=['configuration_type']),
        ]

    def __str__(self):
        if self.clinic_id:
            return f"Configuración Clínica {self.clinic_id}"
        return f"Configuración Individual {self.workspace_id}"

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
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)
    created_by = models.UUIDField()
    
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
        constraints = [
            # Dual system constraint
            models.CheckConstraint(
                check=(
                    (models.Q(clinic_id__isnull=False) & models.Q(workspace_id__isnull=True)) |
                    (models.Q(clinic_id__isnull=True) & models.Q(workspace_id__isnull=False))
                ),
                name='consultation_template_dual_system_constraint'
            ),
        ]
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
            models.Index(fields=['created_by']),
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
    Prescription Model - DUAL SYSTEM
    Manages medical prescriptions with PDF generation
    """
    PRESCRIPTION_STATUS_CHOICES = [
        ('active', 'Activa'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
        ('suspended', 'Suspendida'),
    ]

    PRESCRIPTION_TYPE_CHOICES = [
        ('acute', 'Aguda'),
        ('chronic', 'Crónica'),
        ('preventive', 'Preventiva'),
        ('emergency', 'Emergencia'),
        ('hospital', 'Hospitalaria'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)
    
    # Relationships
    patient_id = models.UUIDField()  # References patient in Supabase
    consultation_id = models.UUIDField(blank=True, null=True)  # Optional consultation reference
    created_by = models.UUIDField(null=True, blank=True)  # Professional who created the prescription
    
    # Prescription basic info
    prescription_number = models.CharField(max_length=50, unique=True)
    date_prescribed = models.DateTimeField(default=timezone.now)
    valid_until = models.DateField(blank=True, null=True)
    
    # Status and type
    status = models.CharField(max_length=20, choices=PRESCRIPTION_STATUS_CHOICES, default='active')
    prescription_type = models.CharField(max_length=20, choices=PRESCRIPTION_TYPE_CHOICES, default='acute')
    
    # Clinical information
    diagnosis = models.TextField(help_text="Diagnóstico que justifica la prescripción")
    clinical_notes = models.TextField(blank=True, null=True, help_text="Notas clínicas adicionales")
    
    # Medications (JSON field for flexibility)
    medications = models.JSONField(
        default=list,
        help_text="Lista de medicamentos con dosis, frecuencia, duración"
    )
    
    # Instructions
    general_instructions = models.TextField(
        blank=True, null=True,
        help_text="Instrucciones generales para el paciente"
    )
    
    # Follow-up
    follow_up_date = models.DateField(blank=True, null=True)
    follow_up_notes = models.TextField(blank=True, null=True)
    
    # Digital signature and verification
    digital_signature = models.TextField(blank=True, null=True)
    verification_code = models.CharField(max_length=20, blank=True, null=True)
    
    # PDF generation
    pdf_generated = models.BooleanField(default=False)
    pdf_generated_at = models.DateTimeField(blank=True, null=True)
    pdf_url = models.URLField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Professional information (cached for PDF generation)
    professional_name = models.CharField(max_length=200, blank=True, null=True)
    professional_license = models.CharField(max_length=50, blank=True, null=True)
    professional_specialty = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'prescriptions'
        constraints = [
            # Dual system constraint
            models.CheckConstraint(
                check=(
                    (models.Q(clinic_id__isnull=False) & models.Q(workspace_id__isnull=True)) |
                    (models.Q(clinic_id__isnull=True) & models.Q(workspace_id__isnull=False))
                ),
                name='prescription_dual_system_constraint'
            ),
        ]
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['created_by']),
            models.Index(fields=['prescription_number']),
            models.Index(fields=['status']),
            models.Index(fields=['date_prescribed']),
        ]
        ordering = ['-date_prescribed']

    def __str__(self):
        return f"Prescription {self.prescription_number} - Patient {self.patient_id}"

    def save(self, *args, **kwargs):
        # Generate prescription number if not set
        if not self.prescription_number:
            self.prescription_number = self.generate_prescription_number()
        
        super().save(*args, **kwargs)

    def generate_prescription_number(self):
        """Generate unique prescription number"""
        from datetime import datetime
        today = datetime.now()
        prefix = f"RX{today.year}{today.month:02d}"
        
        # Get last prescription number for today
        last_prescription = Prescription.objects.filter(
            prescription_number__startswith=prefix
        ).order_by('-prescription_number').first()
        
        if last_prescription:
            try:
                last_number = int(last_prescription.prescription_number[-4:])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
            
        return f"{prefix}{new_number:04d}"

    def is_valid(self):
        """Check if prescription is still valid"""
        if self.status != 'active':
            return False
        if self.valid_until and self.valid_until < timezone.now().date():
            return False
        return True

    def generate_verification_code(self):
        """Generate verification code for prescription authenticity"""
        import random
        import string
        
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        self.verification_code = code
        return code

    def get_medication_summary(self):
        """Get formatted summary of medications"""
        if not self.medications:
            return "Sin medicamentos especificados"
        
        summary = []
        for med in self.medications:
            med_line = med.get('name', 'Medicamento')
            if med.get('dosage'):
                med_line += f" - {med['dosage']}"
            if med.get('frequency'):
                med_line += f" - {med['frequency']}"
            if med.get('duration'):
                med_line += f" por {med['duration']}"
            summary.append(med_line)
        
        return "; ".join(summary)

    def generate_pdf(self):
        """Generate PDF prescription"""
        try:
            from .services import PrescriptionPDFService
            
            pdf_service = PrescriptionPDFService()
            pdf_data = pdf_service.generate_prescription_pdf(self)
            
            # Update prescription with PDF info
            self.pdf_generated = True
            self.pdf_generated_at = timezone.now()
            self.pdf_url = pdf_data.get('pdf_url')
            self.save(update_fields=['pdf_generated', 'pdf_generated_at', 'pdf_url'])
            
            return pdf_data
            
        except Exception as e:
            print(f"Error generating PDF for prescription {self.id}: {e}")
            return None

    def get_patient_info(self):
        """Get patient information from Supabase (cached version)"""
        # This would be implemented to fetch patient data from Supabase
        # For now, return a placeholder
        return {
            'patient_id': str(self.patient_id),
            'full_name': 'Patient Name',  # To be fetched from Supabase
            'email': 'patient@email.com',
            'phone': '000-000-0000'
        }

    @classmethod
    def get_active_by_patient(cls, patient_id, clinic_id=None, workspace_id=None):
        """Get active prescriptions for a patient"""
        queryset = cls.objects.filter(
            patient_id=patient_id,
            status='active'
        ).order_by('-date_prescribed')
        
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
        elif workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        return queryset

    @classmethod
    def get_by_professional(cls, professional_id, clinic_id=None, workspace_id=None):
        """Get prescriptions created by a professional"""
        queryset = cls.objects.filter(
            created_by=professional_id
        ).order_by('-date_prescribed')
        
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
        elif workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        return queryset