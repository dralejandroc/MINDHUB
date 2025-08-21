"""
Clinic Management Models - Supabase Compatible
Manages clinic registration, team members, and multi-user access
"""

import uuid
from django.db import models
from django.core.validators import EmailValidator


class Clinic(models.Model):
    """Clinic model for multi-user healthcare practices"""
    
    SUBSCRIPTION_CHOICES = [
        ('basic', 'Básico - 5 usuarios, 100 pacientes'),
        ('professional', 'Profesional - 15 usuarios, 500 pacientes'),
        ('enterprise', 'Empresarial - 50 usuarios, 2000 pacientes'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    legal_name = models.CharField(max_length=200, blank=True, null=True)
    rfc = models.CharField(max_length=13, blank=True, null=True)  # RFC mexicano
    license_number = models.CharField(max_length=100, blank=True, null=True)  # Licencia sanitaria
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(validators=[EmailValidator()], blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Subscription and limits
    subscription_plan = models.CharField(max_length=50, choices=SUBSCRIPTION_CHOICES, default='basic')
    max_users = models.IntegerField(default=5)
    max_patients = models.IntegerField(default=100)
    
    # Status and ownership
    is_active = models.BooleanField(default=True)
    created_by = models.UUIDField()  # Supabase user ID of clinic owner
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinics'
        managed = False  # Use existing Supabase table

    def __str__(self):
        return self.name

    @property
    def current_users_count(self):
        """Count current users in this clinic"""
        from expedix.models import User
        # This would need to be implemented with Supabase query
        return 0  # Placeholder

    @property
    def current_patients_count(self):
        """Count current patients in this clinic"""
        from expedix.models import Patient
        return Patient.objects.filter(clinic_id=self.id).count()


class ClinicInvitation(models.Model):
    """Clinic invitation system - matches existing Supabase clinic_invitations table"""
    
    ROLE_CHOICES = [
        ('clinic_admin', 'Administrador de Clínica'),
        ('clinic_doctor', 'Médico'),
        ('clinic_psychologist', 'Psicólogo'),
        ('clinic_nurse', 'Enfermero/a'),
        ('clinic_receptionist', 'Recepcionista'),
        ('clinic_professional', 'Profesional de Salud'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic_id = models.UUIDField()  # FK to clinics table
    email = models.CharField(max_length=100)  # Match existing varchar(100)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='clinic_professional')
    token = models.CharField(max_length=100, unique=True)
    invited_by = models.UUIDField()  # Supabase user ID who sent invitation
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    is_used = models.BooleanField(default=False)  # Match existing is_used column
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinic_invitations'
        managed = False  # Don't let Django manage this table
    
    @property
    def clinic(self):
        """Get clinic object from clinic_id"""
        if self.clinic_id:
            try:
                return Clinic.objects.get(id=self.clinic_id)
            except Clinic.DoesNotExist:
                return None
        return None

    def __str__(self):
        return f"{self.clinic.name} → {self.email} ({self.role})"

    def is_valid(self):
        """Check if invitation is still valid"""
        from django.utils import timezone
        return (
            not self.is_used and 
            self.expires_at > timezone.now() and 
            not self.used_at
        )


class ClinicProfile(models.Model):
    """
    User profiles within clinics - Uses existing Supabase profiles table
    Maps to existing profiles table with clinic_id and clinic_role columns
    """
    
    class ClinicRole(models.TextChoices):
        CLINIC_OWNER = 'clinic_owner', 'Propietario'
        ADMINISTRATOR = 'administrator', 'Administrador'  
        PROFESSIONAL = 'professional', 'Profesional'
        ASSISTANT = 'assistant', 'Asistente'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    full_name = models.CharField(max_length=200, blank=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=50, blank=True)  # Supabase user role
    avatar_url = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    specialty = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    
    # Clinic relationship - using existing clinic_id column
    clinic_id = models.UUIDField(null=True, blank=True, db_index=True)
    clinic_role = models.CharField(max_length=20, choices=ClinicRole.choices, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profiles'  # Use existing Supabase profiles table
        managed = False  # Don't let Django manage this table
    
    def __str__(self):
        return f'{self.full_name or self.email} - {self.clinic_role}'
    
    @property
    def clinic(self):
        """Get clinic object from clinic_id"""
        if self.clinic_id:
            try:
                return Clinic.objects.get(id=self.clinic_id)
            except Clinic.DoesNotExist:
                return None
        return None
    
    @property
    def is_active(self):
        """Compatibility property"""
        return True  # All profiles in table are considered active