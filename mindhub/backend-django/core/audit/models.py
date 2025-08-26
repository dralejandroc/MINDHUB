"""
Medical Audit Models - Healthcare Compliance Tracking
Inspired by OpenEMR audit system for regulatory compliance
"""

import uuid
import json
from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils import timezone


class MedicalAuditLog(models.Model):
    """
    Medical audit log for healthcare compliance
    Tracks all medical actions for regulatory requirements
    """
    
    # Action types for medical audit
    ACTION_CHOICES = [
        # Patient actions
        ('patient_created', 'Patient Created'),
        ('patient_updated', 'Patient Updated'),
        ('patient_viewed', 'Patient Viewed'),
        ('patient_deleted', 'Patient Deleted'),
        
        # Appointment actions  
        ('appointment_scheduled', 'Appointment Scheduled'),
        ('appointment_updated', 'Appointment Updated'),
        ('appointment_cancelled', 'Appointment Cancelled'),
        ('appointment_completed', 'Appointment Completed'),
        
        # Consultation actions
        ('consultation_created', 'Consultation Created'),
        ('consultation_updated', 'Consultation Updated'),
        ('consultation_completed', 'Consultation Completed'),
        
        # Assessment actions (ClinimetrixPro)
        ('assessment_started', 'Assessment Started'),
        ('assessment_completed', 'Assessment Completed'),
        ('assessment_results_viewed', 'Assessment Results Viewed'),
        
        # Prescription actions
        ('prescription_created', 'Prescription Created'),
        ('prescription_updated', 'Prescription Updated'),
        ('prescription_sent', 'Prescription Sent'),
        
        # System actions
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('password_changed', 'Password Changed'),
        ('permissions_changed', 'Permissions Changed'),
        
        # Data actions
        ('export_requested', 'Data Export Requested'),
        ('backup_created', 'Backup Created'),
        ('data_migration', 'Data Migration'),
    ]
    
    RESOURCE_TYPES = [
        ('patient', 'Patient'),
        ('appointment', 'Appointment'),
        ('consultation', 'Consultation'),
        ('assessment', 'Assessment'),
        ('prescription', 'Prescription'),
        ('user', 'User'),
        ('system', 'System'),
    ]
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User who performed the action
    user_id = models.UUIDField(null=True, blank=True)  # References profiles.id
    
    # Action details
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    resource_id = models.UUIDField(null=True, blank=True)  # ID of affected resource
    
    # Medical context
    patient_id = models.UUIDField(null=True, blank=True)  # Always track patient context
    
    # Changes made (before/after for updates)
    changes = models.JSONField(default=dict, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    # Dual system support
    clinic_id = models.UUIDField(null=True, blank=True)
    workspace_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'medical_audit_log'
        indexes = [
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['patient_id', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['clinic_id', 'timestamp']),
            models.Index(fields=['workspace_id', 'timestamp']),
        ]
        constraints = [
            # Dual system constraint
            models.CheckConstraint(
                check=(
                    models.Q(clinic_id__isnull=False, workspace_id__isnull=True) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=False) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=True)
                ),
                name='audit_dual_system_constraint'
            )
        ]
    
    def __str__(self):
        return f"{self.action} - {self.resource_type}:{self.resource_id} by {self.user_id} at {self.timestamp}"
    
    @property
    def formatted_timestamp(self):
        """Human-readable timestamp"""
        return self.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    
    def get_changes_summary(self):
        """Get human-readable summary of changes"""
        if not self.changes:
            return "No changes recorded"
        
        if 'before' in self.changes and 'after' in self.changes:
            before = self.changes['before']
            after = self.changes['after']
            
            changes_list = []
            for field, new_value in after.items():
                old_value = before.get(field, 'None')
                if old_value != new_value:
                    changes_list.append(f"{field}: {old_value} → {new_value}")
            
            return "; ".join(changes_list)
        
        return str(self.changes)


class MedicalComplianceReport(models.Model):
    """
    Medical compliance reports for regulatory audits
    Generated periodically for healthcare compliance
    """
    
    REPORT_TYPES = [
        ('hipaa_audit', 'HIPAA Compliance Audit'),
        ('gdpr_audit', 'GDPR Compliance Audit'),
        ('access_log', 'Access Log Report'),
        ('data_export', 'Data Export Report'),
        ('user_activity', 'User Activity Report'),
        ('patient_access', 'Patient Access Report'),
    ]
    
    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Report details
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Time range
    date_from = models.DateTimeField()
    date_to = models.DateTimeField()
    
    # Report data
    report_data = models.JSONField(default=dict)
    summary = models.JSONField(default=dict)
    
    # Generation info
    generated_by = models.UUIDField()  # User who requested the report
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Dual system support
    clinic_id = models.UUIDField(null=True, blank=True)
    workspace_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'medical_compliance_reports'
        indexes = [
            models.Index(fields=['report_type', 'created_at']),
            models.Index(fields=['generated_by', 'created_at']),
            models.Index(fields=['clinic_id', 'created_at']),
            models.Index(fields=['workspace_id', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.date_from.date()} to {self.date_to.date()})"
    
    @property
    def duration_days(self):
        """Number of days covered by the report"""
        return (self.date_to - self.date_from).days


class MedicalAccessLog(models.Model):
    """
    Detailed access log for medical data (HIPAA/GDPR compliance)
    Tracks who accessed what patient data when
    """
    
    ACCESS_TYPES = [
        ('view', 'Viewed'),
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('export', 'Exported'),
        ('print', 'Printed'),
    ]
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Access details
    user_id = models.UUIDField()  # Who accessed
    patient_id = models.UUIDField()  # Which patient's data
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPES)
    
    # What was accessed
    data_type = models.CharField(max_length=100)  # e.g., 'medical_history', 'assessment_results'
    resource_id = models.UUIDField(null=True, blank=True)  # Specific resource accessed
    
    # Access context
    purpose = models.CharField(max_length=200, blank=True)  # Why was it accessed
    session_id = models.CharField(max_length=100, blank=True)  # User session
    
    # Request details
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Timestamp
    accessed_at = models.DateTimeField(default=timezone.now, db_index=True)
    
    # Dual system support
    clinic_id = models.UUIDField(null=True, blank=True)
    workspace_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'medical_access_log'
        indexes = [
            models.Index(fields=['patient_id', 'accessed_at']),
            models.Index(fields=['user_id', 'accessed_at']),
            models.Index(fields=['access_type', 'accessed_at']),
            models.Index(fields=['data_type', 'accessed_at']),
        ]
    
    def __str__(self):
        return f"{self.user_id} {self.access_type} {self.data_type} for patient {self.patient_id}"