"""
Expedix Models - REAL Supabase Schema Match
Consultations, Prescriptions and Audit System
Based on verified database structure with compliance support
"""

import uuid
from django.db import models
from django.utils import timezone
from datetime import datetime


class RealConsultation(models.Model):
    """
    Consultation model - EXACT match to consultations table
    Includes audit fields for regulatory compliance
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core relationships - Direct UUIDs (no ForeignKeys with managed=False)
    patient_id = models.UUIDField(blank=True, null=True)
    professional_id = models.UUIDField(blank=True, null=True)
    
    # Consultation timing
    consultation_date = models.DateTimeField(blank=True, null=True)
    consultation_type = models.TextField(blank=True, null=True)
    
    # Clinical content - SOAP format and more
    chief_complaint = models.TextField(blank=True, null=True)
    history_present_illness = models.TextField(blank=True, null=True)
    present_illness = models.TextField(blank=True, null=True)  # Duplicate field exists
    physical_examination = models.TextField(blank=True, null=True)
    review_of_systems = models.TextField(blank=True, null=True)
    assessment = models.TextField(blank=True, null=True)
    plan = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    
    # Diagnosis fields
    diagnosis = models.JSONField(blank=True, null=True)  # ARRAY in DB
    diagnosis_codes = models.JSONField(blank=True, null=True)  # ARRAY in DB
    
    # Notes and documentation
    notes = models.TextField(blank=True, null=True)
    clinical_notes = models.TextField(blank=True, null=True)
    private_notes = models.TextField(blank=True, null=True)
    
    # Prescription data (embedded)
    prescriptions = models.JSONField(blank=True, null=True)
    
    # Vital signs
    vital_signs = models.JSONField(blank=True, null=True)
    
    # Follow up
    follow_up_date = models.DateField(blank=True, null=True)
    follow_up_instructions = models.TextField(blank=True, null=True)
    
    # Status and billing
    status = models.TextField(blank=True, null=True)
    is_billable = models.BooleanField(blank=True, null=True)
    duration_minutes = models.IntegerField(blank=True, null=True)
    
    # Timestamps - CRITICAL for audit trail
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    # 🎯 DUAL SYSTEM
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    class Meta:
        db_table = 'consultations'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['patient_id'], name='cons_real_patient_idx'),
            models.Index(fields=['professional_id'], name='cons_real_prof_idx'),
            models.Index(fields=['consultation_date'], name='cons_real_date_idx'),
            models.Index(fields=['status'], name='cons_real_status_idx'),
            models.Index(fields=['clinic_id'], name='cons_real_clinic_idx'),
            models.Index(fields=['workspace_id'], name='cons_real_workspace_idx'),
        ]

    def __str__(self):
        return f"Consultation {self.id} - {self.consultation_date}"
    
    @property
    def is_draft(self):
        """Check if consultation is in draft state (can be edited)"""
        return self.status in ['draft', 'in_progress', None]
    
    @property
    def is_finalized(self):
        """Check if consultation is finalized (cannot be edited without audit)"""
        return self.status == 'completed'
    
    @property
    def time_since_creation(self):
        """Time elapsed since consultation was created"""
        if self.created_at:
            return timezone.now() - self.created_at
        return None


class RealPrescription(models.Model):
    """
    Prescription model - EXACT match to prescriptions table
    Separate table for regulatory compliance and tracking
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core relationships
    patient_id = models.UUIDField(blank=True, null=True)
    consultation_id = models.UUIDField(blank=True, null=True)
    prescribed_by = models.UUIDField(blank=True, null=True)  # Professional ID
    
    # Medication details
    medication_name = models.TextField()  # NOT NULL in real table
    dosage = models.TextField(blank=True, null=True)
    frequency = models.TextField(blank=True, null=True)
    duration = models.TextField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    
    # Prescription validity
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    # Status tracking
    status = models.TextField(blank=True, null=True)
    
    # Timestamps - CRITICAL for audit
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    # 🎯 DUAL SYSTEM
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    class Meta:
        db_table = 'prescriptions'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['patient_id'], name='presc_real_patient_idx'),
            models.Index(fields=['consultation_id'], name='presc_real_cons_idx'),
            models.Index(fields=['prescribed_by'], name='presc_real_doctor_idx'),
            models.Index(fields=['status'], name='presc_real_status_idx'),
            models.Index(fields=['start_date', 'end_date'], name='presc_real_dates_idx'),
        ]

    def __str__(self):
        return f"Prescription: {self.medication_name} for patient {self.patient_id}"
    
    @property
    def is_active(self):
        """Check if prescription is currently active"""
        if not self.start_date or not self.end_date:
            return self.status == 'active'
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date
    
    @property
    def days_remaining(self):
        """Days until prescription expires"""
        if self.end_date:
            remaining = (self.end_date - timezone.now().date()).days
            return max(0, remaining)
        return None


class ConsultationAuditLog(models.Model):
    """
    Audit log for consultation modifications - REGULATORY COMPLIANCE
    Tracks all changes to consultations for legal requirements
    """
    
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('modified', 'Modified'),
        ('finalized', 'Finalized'),
        ('reopened', 'Reopened'),
        ('deleted', 'Deleted'),
        ('viewed', 'Viewed'),
        ('printed', 'Printed'),
        ('exported', 'Exported'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # What was changed
    consultation_id = models.UUIDField()
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    # Who made the change
    user_id = models.UUIDField()
    user_name = models.CharField(max_length=255)
    user_role = models.CharField(max_length=50)
    
    # When it was changed
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # What changed (for modifications)
    field_changes = models.JSONField(blank=True, null=True)
    previous_values = models.JSONField(blank=True, null=True)
    new_values = models.JSONField(blank=True, null=True)
    
    # Additional context
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    justification = models.TextField(blank=True, null=True)  # For late modifications
    
    # 🎯 DUAL SYSTEM
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    class Meta:
        db_table = 'consultation_audit_logs'
        managed = True  # We'll create this table if it doesn't exist
        indexes = [
            models.Index(fields=['consultation_id'], name='audit_consultation_idx'),
            models.Index(fields=['user_id'], name='audit_user_idx'),
            models.Index(fields=['timestamp'], name='audit_timestamp_idx'),
            models.Index(fields=['action'], name='audit_action_idx'),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"Audit: {self.action} on {self.consultation_id} by {self.user_name} at {self.timestamp}"


class ConsultationAutosave(models.Model):
    """
    Autosave drafts for consultations
    Prevents data loss during long consultation sessions
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to consultation
    consultation_id = models.UUIDField(unique=True)
    
    # Who is editing
    user_id = models.UUIDField()
    
    # Autosaved content
    draft_content = models.JSONField()
    
    # Tracking
    last_saved = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Session info
    session_id = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'consultation_autosaves'
        managed = True  # We'll create this table
        indexes = [
            models.Index(fields=['consultation_id'], name='autosave_consultation_idx'),
            models.Index(fields=['user_id'], name='autosave_user_idx'),
            models.Index(fields=['last_saved'], name='autosave_time_idx'),
        ]

    def __str__(self):
        return f"Autosave for consultation {self.consultation_id}"


# ==============================================================================
# HELPER FUNCTIONS for Consultations and Prescriptions
# ==============================================================================

def create_consultation_with_audit(
    patient_id: str,
    professional_id: str,
    user_id: str,
    user_name: str,
    user_role: str,
    consultation_data: dict,
    ip_address: str = None
) -> RealConsultation:
    """
    Create a new consultation with audit trail
    """
    consultation = RealConsultation.objects.create(
        patient_id=patient_id,
        professional_id=professional_id,
        status='draft',
        created_at=timezone.now(),
        updated_at=timezone.now(),
        **consultation_data
    )
    
    # Create audit log
    ConsultationAuditLog.objects.create(
        consultation_id=consultation.id,
        action='created',
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        ip_address=ip_address,
        new_values=consultation_data
    )
    
    return consultation


def update_consultation_with_audit(
    consultation: RealConsultation,
    user_id: str,
    user_name: str,
    user_role: str,
    updates: dict,
    justification: str = None,
    ip_address: str = None
) -> RealConsultation:
    """
    Update consultation with audit trail
    """
    # Capture previous values
    previous_values = {}
    field_changes = []
    
    for field, new_value in updates.items():
        old_value = getattr(consultation, field, None)
        if old_value != new_value:
            previous_values[field] = old_value
            field_changes.append(field)
            setattr(consultation, field, new_value)
    
    # Update timestamp
    consultation.updated_at = timezone.now()
    consultation.save()
    
    # Create audit log
    if field_changes:
        ConsultationAuditLog.objects.create(
            consultation_id=consultation.id,
            action='modified',
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            field_changes=field_changes,
            previous_values=previous_values,
            new_values=updates,
            justification=justification,
            ip_address=ip_address
        )
    
    return consultation


def finalize_consultation_with_audit(
    consultation: RealConsultation,
    user_id: str,
    user_name: str,
    user_role: str,
    ip_address: str = None
) -> RealConsultation:
    """
    Finalize a consultation (no more edits without justification)
    """
    if consultation.status == 'completed':
        raise ValueError("Consultation is already finalized")
    
    consultation.status = 'completed'
    consultation.updated_at = timezone.now()
    consultation.save()
    
    # Create audit log
    ConsultationAuditLog.objects.create(
        consultation_id=consultation.id,
        action='finalized',
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        ip_address=ip_address
    )
    
    return consultation


def get_consultation_history(consultation_id: str):
    """
    Get complete audit history for a consultation
    """
    return ConsultationAuditLog.objects.filter(
        consultation_id=consultation_id
    ).order_by('-timestamp')


def autosave_consultation(
    consultation_id: str,
    user_id: str,
    content: dict,
    session_id: str = None
) -> ConsultationAutosave:
    """
    Save consultation draft automatically
    """
    autosave, created = ConsultationAutosave.objects.update_or_create(
        consultation_id=consultation_id,
        defaults={
            'user_id': user_id,
            'draft_content': content,
            'session_id': session_id,
            'is_active': True
        }
    )
    return autosave


def get_autosaved_content(consultation_id: str) -> dict:
    """
    Retrieve autosaved content for a consultation
    """
    try:
        autosave = ConsultationAutosave.objects.get(
            consultation_id=consultation_id,
            is_active=True
        )
        return autosave.draft_content
    except ConsultationAutosave.DoesNotExist:
        return None


def clear_autosave(consultation_id: str):
    """
    Clear autosaved content after consultation is saved
    """
    ConsultationAutosave.objects.filter(
        consultation_id=consultation_id
    ).update(is_active=False)