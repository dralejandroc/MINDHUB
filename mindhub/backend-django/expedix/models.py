"""
Expedix Models - Patient Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator


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
    """Patient model matching Supabase schema exactly"""
    GENDER_CHOICES = [
        ('masculine', 'Masculino'),
        ('feminine', 'Femenino'),
        ('other', 'Otro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Personal information - MATCHES DATABASE_TRUTH.md exactly
    first_name = models.CharField(max_length=100)  # VARCHAR(100) NOT NULL
    last_name = models.CharField(max_length=100)   # VARCHAR(100) NOT NULL  
    email = models.CharField(max_length=100, blank=True, null=True)  # VARCHAR(100) - not unique, not required
    phone = models.CharField(max_length=20, blank=True, null=True)        # VARCHAR(20)
    date_of_birth = models.DateField(blank=True, null=True)             # DATE
    gender = models.CharField(max_length=20, blank=True, null=True)     # VARCHAR(20)
    
    # Location information - MATCHES DATABASE_TRUTH.md
    address = models.TextField(blank=True, null=True)                   # TEXT
    city = models.CharField(max_length=100, blank=True, null=True)      # VARCHAR(100)
    state = models.CharField(max_length=100, blank=True, null=True)     # VARCHAR(100)
    postal_code = models.CharField(max_length=10, blank=True, null=True) # VARCHAR(10)
    
    # Mexican specific fields
    curp = models.CharField(max_length=18, blank=True, null=True)  # CURP único
    rfc = models.CharField(max_length=13, blank=True, null=True)   # RFC
    medical_record_number = models.CharField(max_length=50, blank=True, null=True)  # Número expediente
    blood_type = models.CharField(max_length=5, blank=True, null=True)  # Tipo sangre
    
    # Critical association fields - MATCHES DATABASE_TRUTH.md
    created_by = models.UUIDField(blank=True, null=True)  # Supabase user ID del creador
    clinic_id = models.UUIDField(blank=True, null=True)   # NULL = paciente individual
    assigned_professional_id = models.UUIDField(blank=True, null=True)  # Profesional asignado
    
    # Estado
    patient_category = models.CharField(max_length=50, default='general', blank=True, null=True)
    is_active = models.BooleanField(default=True)
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
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

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
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    professional = models.ForeignKey(User, on_delete=models.PROTECT, related_name='consultations')
    consultation_date = models.DateTimeField()
    reason = models.CharField(max_length=200, blank=True, null=True)
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
            models.Index(fields=['patient']),
            models.Index(fields=['professional']),
            models.Index(fields=['consultation_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Consulta {self.patient.full_name} - {self.consultation_date.strftime('%Y-%m-%d')}"