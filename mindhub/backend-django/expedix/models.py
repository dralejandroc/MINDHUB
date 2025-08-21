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
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    paternal_last_name = models.CharField(max_length=100, blank=True, null=True)
    maternal_last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)  # Changed from zip_code to postal_code
    country = models.CharField(max_length=100, default='México')
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)
    insurance_provider = models.CharField(max_length=100, blank=True, null=True)
    insurance_number = models.CharField(max_length=100, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    current_medications = models.TextField(blank=True, null=True)
    chronic_conditions = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Additional fields from Supabase schema
    medical_record_number = models.CharField(max_length=50, blank=True, null=True)
    curp = models.CharField(max_length=18, blank=True, null=True)  # CURP mexicano
    rfc = models.CharField(max_length=13, blank=True, null=True)   # RFC mexicano
    blood_type = models.CharField(max_length=10, blank=True, null=True)
    patient_category = models.CharField(max_length=50, blank=True, null=True)
    clinic_id = models.UUIDField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Removed created_by foreign key as users table doesn't exist in Supabase

    class Meta:
        db_table = 'patients'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['medical_record_number']),
            models.Index(fields=['clinic_id']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.paternal_last_name} {self.maternal_last_name}".strip()

    @property
    def full_name(self):
        return f"{self.first_name} {self.paternal_last_name} {self.maternal_last_name}".strip()

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