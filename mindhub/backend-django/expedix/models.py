"""
Expedix Models - Patient Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
import json
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator


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
    
    # Array fields (PostgreSQL specific) - Using SafeJSONField to handle corrupted data
    allergies = SafeJSONField(blank=True, null=True, default=list)  # ARRAY field
    chronic_conditions = SafeJSONField(blank=True, null=True, default=list)  # ARRAY field
    current_medications = SafeJSONField(blank=True, null=True, default=list)  # ARRAY field
    tags = SafeJSONField(blank=True, null=True, default=list)  # ARRAY field
    
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
    
    # Critical association fields
    created_by = models.UUIDField(blank=True, null=True)  # Supabase user ID del creador
    clinic_id = models.UUIDField()  # NOT NULL in real table
    assigned_professional_id = models.UUIDField(blank=True, null=True)  # Profesional asignado
    workspace_id = models.UUIDField(blank=True, null=True)  # Missing from old model
    
    # Additional notes
    notes = models.TextField(blank=True, null=True)
    
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