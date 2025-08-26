"""
ClinimetrixPro Models - EXACT Supabase Schema Match
Based on real database structure from SUPABASE_TABLES_REFERENCE.md
"""

import uuid
from django.db import models
from django.utils import timezone


class ClinimetrixAssessment(models.Model):
    """
    ClinimetrixPro assessments - EXACT match to clinimetrix_assessments table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema
    template_id = models.TextField()  # Scale code like "PHQ-9", NOT FK!
    patient_id = models.UUIDField()   # Direct UUID to patients table
    administrator_id = models.UUIDField()  # Direct UUID to profiles
    consultation_id = models.UUIDField(blank=True, null=True)  # Direct UUID to consultations
    
    # Assessment mode and status
    mode = models.TextField(blank=True, null=True)  # "self" | "assisted"
    status = models.TextField(blank=True, null=True)  # "pending" | "completed" | "cancelled"
    
    # JSONB fields for data storage
    responses = models.JSONField(blank=True, null=True)      # Raw responses
    scores = models.JSONField(blank=True, null=True)         # Calculated scores  
    interpretations = models.JSONField(blank=True, null=True) # Clinical interpretations
    
    # Timestamps
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 🎯 DUAL SYSTEM: EXACT as Supabase
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    class Meta:
        db_table = 'clinimetrix_assessments'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['patient_id'], name='clm_real_patient_idx'),
            models.Index(fields=['template_id'], name='clm_real_template_idx'),
            models.Index(fields=['status'], name='clm_real_status_idx'),
            models.Index(fields=['administrator_id'], name='clm_real_admin_idx'),
            models.Index(fields=['clinic_id'], name='clm_real_clinic_idx'),
            models.Index(fields=['workspace_id'], name='clm_real_workspace_idx'),
        ]

    def __str__(self):
        return f"Assessment {self.template_id} - Patient {self.patient_id} - {self.status}"

    @property
    def is_completed(self):
        return self.status == 'completed'

    @property
    def duration_seconds(self):
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class ClinimetrixRemoteAssessment(models.Model):
    """
    Remote assessments for patients - EXACT match to clinimetrix_remote_assessments table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema
    assessment_id = models.UUIDField()  # Direct UUID to clinimetrix_assessments
    patient_id = models.UUIDField()     # Direct UUID to patients table
    access_token = models.TextField()   # Unique access token for patient
    expires_at = models.DateTimeField() # When the link expires
    status = models.TextField()         # Status of remote assessment
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinimetrix_remote_assessments'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['assessment_id'], name='clm_remote_assessment_idx'),
            models.Index(fields=['patient_id'], name='clm_remote_patient_idx'),
            models.Index(fields=['access_token'], name='clm_remote_token_idx'),
            models.Index(fields=['expires_at'], name='clm_remote_expires_idx'),
        ]

    def __str__(self):
        return f"Remote {self.assessment_id} - Patient {self.patient_id}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_active(self):
        return not self.is_expired and self.status == 'active'


class ClinimetrixResponse(models.Model):
    """
    Individual responses within assessments - EXACT match to clinimetrix_responses table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema
    assessment_id = models.UUIDField()  # Direct UUID to clinimetrix_assessments
    question_id = models.TextField()    # Question identifier within scale
    response_value = models.FloatField(blank=True, null=True)  # Numeric response
    response_text = models.TextField(blank=True, null=True)    # Text response
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clinimetrix_responses'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['assessment_id']),
            models.Index(fields=['question_id']),
        ]

    def __str__(self):
        return f"Response {self.question_id} - Assessment {self.assessment_id}"


class PsychometricScale(models.Model):
    """
    Psychometric scales catalog - EXACT match to psychometric_scales table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema (CORRECTED)
    clinic_id = models.UUIDField(blank=True, null=True)  # Missing from my doc!
    scale_name = models.CharField(max_length=255)        # REAL field name!
    abbreviation = models.CharField(max_length=255)      # REAL field name!
    version = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    total_items = models.IntegerField(blank=True, null=True)
    estimated_duration_minutes = models.IntegerField(blank=True, null=True)
    interpretation_notes = models.TextField(blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(blank=True, null=True)

    class Meta:
        db_table = 'psychometric_scales'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['abbreviation'], name='psy_scales_abbr_idx'),
            models.Index(fields=['category'], name='psy_scales_cat_idx'),
            models.Index(fields=['is_active'], name='psy_scales_active_idx'),
            models.Index(fields=['clinic_id'], name='psy_scales_clinic_idx'),
        ]

    def __str__(self):
        return f"{self.abbreviation} - {self.scale_name}"

    @property
    def is_available(self):
        return self.is_active == True


# ==============================================================================
# RELATIONSHIPS HELPERS (since we can't use ForeignKeys with managed=False)
# ==============================================================================

def get_patient_assessments(patient_id: str):
    """Get all assessments for a patient"""
    return ClinimetrixAssessment.objects.filter(patient_id=patient_id)


def get_assessment_responses(assessment_id: str):
    """Get all responses for an assessment"""
    return ClinimetrixResponse.objects.filter(assessment_id=assessment_id)


def get_scale_by_code(scale_code: str):
    """Get scale by its abbreviation (CORRECTED field name)"""
    try:
        return PsychometricScale.objects.get(abbreviation=scale_code, is_active=True)
    except PsychometricScale.DoesNotExist:
        return None


def create_assessment_bridge(
    template_id: str,
    patient_id: str,
    administrator_id: str,
    consultation_id: str = None,
    mode: str = "self"
) -> ClinimetrixAssessment:
    """
    Create a new assessment with proper dual system handling
    """
    # Determine if this is clinic or workspace based on patient
    from expedix.models import Patient
    
    try:
        patient = Patient.objects.get(id=patient_id)
        clinic_id = patient.clinic_id
        workspace_id = patient.workspace_id
    except Patient.DoesNotExist:
        # Fallback values
        clinic_id = None
        workspace_id = None
    
    return ClinimetrixAssessment.objects.create(
        template_id=template_id,
        patient_id=patient_id,
        administrator_id=administrator_id,
        consultation_id=consultation_id,
        mode=mode,
        status="pending",
        clinic_id=clinic_id,
        workspace_id=workspace_id
    )