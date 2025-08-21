"""
Assessment models for ClinimetrixPro
Manages patients, assessments, and results
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class Patient(models.Model):
    """
    Patient model for storing patient information
    """
    
    class Gender(models.TextChoices):
        MALE = 'M', _('Masculino')
        FEMALE = 'F', _('Femenino')
        OTHER = 'O', _('Otro')
        PREFER_NOT_TO_SAY = 'N', _('Prefiero no decir')
    
    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)
    
    # Contact Information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # Medical Information
    diagnosis = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    medical_history = models.TextField(blank=True)
    
    # Clinical Notes
    notes = models.TextField(blank=True)
    
    # Data Management
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_patients'
    )
    
    assigned_clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_patients'
    )
    
    # Privacy and Consent
    consent_given = models.BooleanField(default=False)
    consent_date = models.DateTimeField(null=True, blank=True)
    data_retention_until = models.DateField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Paciente')
        verbose_name_plural = _('Pacientes')
        db_table = 'clinimetrix_patients'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['medical_record']),
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_clinician']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.medical_record or self.id})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_age(self):
        """Calculate age from date of birth"""
        if not self.date_of_birth:
            return self.age if self.age else "N/A"
        
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    
    @property
    def initials(self):
        return f"{self.first_name[0]}{self.last_name[0]}"


class Assessment(models.Model):
    """
    Main assessment model
    """
    
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', _('No iniciada')
        IN_PROGRESS = 'in_progress', _('En progreso')
        COMPLETED = 'completed', _('Completada')
        CANCELLED = 'cancelled', _('Cancelada')
        EXPIRED = 'expired', _('Expirada')
    
    class Mode(models.TextChoices):
        SELF_ADMINISTERED = 'self', _('Autoaplicada')
        INTERVIEWER_ADMINISTERED = 'interviewer', _('Heteroaplicada')
        MIXED = 'mixed', _('Mixta')
    
    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    
    scale = models.ForeignKey(
        'psychometric_scales.PsychometricScale',
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_assessments'
    )
    
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conducted_assessments'
    )
    
    # Assessment Configuration
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.SELF_ADMINISTERED
    )
    
    instructions = models.TextField(blank=True)
    
    # Status and Timing
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED
    )
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    duration_minutes = models.FloatField(null=True, blank=True)
    
    # Progress Tracking
    current_item = models.PositiveIntegerField(default=0)
    total_items = models.PositiveIntegerField()
    
    # Session Information
    session_data = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Quality Control
    response_time_data = models.JSONField(default=list)
    is_valid = models.BooleanField(default=True)
    validity_notes = models.TextField(blank=True)
    
    # Clinical Context
    assessment_reason = models.TextField(blank=True)
    clinical_context = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Evaluación')
        verbose_name_plural = _('Evaluaciones')
        db_table = 'clinimetrix_assessments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['scale']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.scale.abbreviation} ({self.get_status_display()})"
    
    @property
    def progress_percentage(self):
        if self.total_items == 0:
            return 0
        return (self.current_item / self.total_items) * 100
    
    @property
    def is_started(self):
        return self.status != self.Status.NOT_STARTED
    
    @property
    def is_completed(self):
        return self.status == self.Status.COMPLETED
    
    def calculate_duration(self):
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            self.duration_minutes = delta.total_seconds() / 60


class AssessmentResponse(models.Model):
    """
    Individual responses within an assessment
    """
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    
    item_number = models.PositiveIntegerField()
    section_id = models.CharField(max_length=50, blank=True)
    
    # Response Data
    response_value = models.IntegerField()
    response_label = models.CharField(max_length=200)
    raw_score = models.FloatField(null=True, blank=True)
    
    # Timing
    response_time_seconds = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Quality Indicators
    is_skipped = models.BooleanField(default=False)
    is_changed = models.BooleanField(default=False)
    change_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = _('Respuesta de evaluación')
        verbose_name_plural = _('Respuestas de evaluación')
        db_table = 'clinimetrix_responses'
        unique_together = ['assessment', 'item_number']
        ordering = ['assessment', 'item_number']
    
    def __str__(self):
        return f"{self.assessment} - Item {self.item_number}: {self.response_label}"


class ScoringResult(models.Model):
    """
    Scoring results for assessments
    """
    assessment = models.OneToOneField(
        Assessment,
        on_delete=models.CASCADE,
        related_name='scoring_result'
    )
    
    # Main Scores
    total_score = models.FloatField()
    total_score_raw = models.FloatField(null=True, blank=True)
    
    # Subscale Scores
    subscale_scores = models.JSONField(default=dict)
    
    # Interpretation
    interpretation_label = models.CharField(max_length=200, blank=True)
    severity_level = models.CharField(max_length=50, blank=True)
    severity_color = models.CharField(max_length=7, blank=True)
    
    clinical_interpretation = models.TextField(blank=True)
    professional_recommendations = models.JSONField(null=True, blank=True)
    
    # Percentiles and Norms
    percentile = models.FloatField(null=True, blank=True)
    z_score = models.FloatField(null=True, blank=True)
    t_score = models.FloatField(null=True, blank=True)
    
    # Reliability and Quality
    reliability_alpha = models.FloatField(null=True, blank=True)
    sem_value = models.FloatField(null=True, blank=True)  # Standard Error of Measurement
    
    # Response Patterns
    response_bias_detected = models.JSONField(null=True, blank=True)
    response_consistency = models.FloatField(null=True, blank=True)
    
    # Computation Details
    scoring_algorithm_version = models.CharField(max_length=20, default='1.0')
    computed_at = models.DateTimeField(auto_now_add=True)
    computed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Validation
    is_valid = models.BooleanField(default=True)
    validation_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = _('Resultado de puntuación')
        verbose_name_plural = _('Resultados de puntuación')
        db_table = 'clinimetrix_scoring_results'
    
    def __str__(self):
        return f"{self.assessment} - Score: {self.total_score}"


class ClinicalReport(models.Model):
    """
    Generated clinical reports
    """
    
    class ReportType(models.TextChoices):
        CLINICAL_COMPLETE = 'clinical_complete', _('Informe Clínico Completo')
        CLINICAL_SUMMARY = 'clinical_summary', _('Resumen Clínico')
        EVOLUTION = 'evolution', _('Informe de Evolución')
        CONSULTATION = 'consultation', _('Informe de Interconsulta')
        RESEARCH = 'research', _('Informe de Investigación')
    
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    
    report_type = models.CharField(
        max_length=30,
        choices=ReportType.choices,
        default=ReportType.CLINICAL_COMPLETE
    )
    
    # Report Metadata
    title = models.CharField(max_length=200)
    generated_for = models.CharField(max_length=200, blank=True)  # Recipient
    institution = models.CharField(max_length=200, blank=True)
    
    # Content
    content_html = models.TextField()
    content_pdf = models.FileField(upload_to='reports/', null=True, blank=True)
    
    # Configuration
    include_raw_data = models.BooleanField(default=False)
    include_graphs = models.BooleanField(default=True)
    include_recommendations = models.BooleanField(default=True)
    include_interpretation = models.BooleanField(default=True)
    
    # Generation Details
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    generated_at = models.DateTimeField(auto_now_add=True)
    template_version = models.CharField(max_length=20, default='1.0')
    
    # Access Control
    is_confidential = models.BooleanField(default=True)
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='shared_reports'
    )
    
    class Meta:
        verbose_name = _('Reporte clínico')
        verbose_name_plural = _('Reportes clínicos')
        db_table = 'clinimetrix_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.title} - {self.assessment.patient.get_full_name()}"


class RemoteAssessmentLink(models.Model):
    """
    Enlaces para evaluaciones remotas (a distancia)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationship
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='remote_links')
    scale = models.ForeignKey('psychometric_scales.PsychometricScale', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Link Details
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    max_uses = models.PositiveIntegerField(default=1)
    uses_count = models.PositiveIntegerField(default=0)
    
    # Assessment Context
    clinical_context = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    assessment = models.ForeignKey(Assessment, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Enlace de evaluación remota')
        verbose_name_plural = _('Enlaces de evaluación remota')
        db_table = 'clinimetrix_remote_links'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['patient', 'is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Link remoto: {self.patient.get_full_name()} - {self.scale.abbreviation}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def is_used_up(self):
        return self.uses_count >= self.max_uses
    
    @property
    def can_be_used(self):
        return self.is_active and not self.is_expired and not self.is_used_up
    
    def generate_token(self):
        """Generate secure token for the link"""
        import secrets
        self.token = secrets.token_urlsafe(32)
        return self.token


class ScheduledAssessment(models.Model):
    """
    Evaluaciones programadas para seguimiento longitudinal
    """
    class Frequency(models.TextChoices):
        WEEKLY = 'weekly', _('Semanal')
        BIWEEKLY = 'biweekly', _('Quincenal')
        MONTHLY = 'monthly', _('Mensual')
        QUARTERLY = 'quarterly', _('Trimestral')
        CUSTOM = 'custom', _('Personalizado')
    
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Activo')
        PAUSED = 'paused', _('Pausado')
        COMPLETED = 'completed', _('Completado')
        CANCELLED = 'cancelled', _('Cancelado')
    
    # Relationship
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scheduled_assessments')
    scale = models.ForeignKey('psychometric_scales.PsychometricScale', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Schedule Configuration
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=Frequency.choices)
    frequency_days = models.PositiveIntegerField(null=True, blank=True)  # For custom frequency
    
    # Timing
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField()
    next_consultation_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    total_completed = models.PositiveIntegerField(default=0)
    
    # Delivery Method
    send_remote_link = models.BooleanField(default=True)
    reminder_days_before = models.PositiveIntegerField(default=2)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Evaluación programada')
        verbose_name_plural = _('Evaluaciones programadas')
        db_table = 'clinimetrix_scheduled_assessments'
        ordering = ['next_due_date', 'patient__last_name']
        indexes = [
            models.Index(fields=['status', 'next_due_date']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['created_by', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title}: {self.patient.get_full_name()} - {self.scale.abbreviation}"
    
    def calculate_next_due_date(self):
        """Calculate the next due date based on frequency"""
        from datetime import timedelta
        
        if self.frequency == self.Frequency.WEEKLY:
            delta = timedelta(weeks=1)
        elif self.frequency == self.Frequency.BIWEEKLY:
            delta = timedelta(weeks=2)
        elif self.frequency == self.Frequency.MONTHLY:
            delta = timedelta(days=30)
        elif self.frequency == self.Frequency.QUARTERLY:
            delta = timedelta(days=90)
        elif self.frequency == self.Frequency.CUSTOM and self.frequency_days:
            delta = timedelta(days=self.frequency_days)
        else:
            return None
        
        return self.next_due_date + delta
    
    def is_due(self):
        """Check if assessment is due"""
        return self.status == self.Status.ACTIVE and timezone.now().date() >= self.next_due_date
    
    def should_stop_until_consultation(self):
        """Check if should pause until next consultation"""
        if self.next_consultation_date:
            return timezone.now().date() > self.next_consultation_date
        return False


class AssessmentReminder(models.Model):
    """
    Recordatorios de evaluaciones pendientes
    """
    class Type(models.TextChoices):
        SCHEDULED = 'scheduled', _('Evaluación programada')
        FOLLOWUP = 'followup', _('Seguimiento')
        OVERDUE = 'overdue', _('Vencida')
        CONSULTATION = 'consultation', _('Próxima consulta')
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pendiente')
        SENT = 'sent', _('Enviado')
        COMPLETED = 'completed', _('Completado')
        DISMISSED = 'dismissed', _('Descartado')
    
    # Relationships
    scheduled_assessment = models.ForeignKey(
        ScheduledAssessment, 
        on_delete=models.CASCADE, 
        related_name='reminders',
        null=True, blank=True
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reminders')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_reminders')
    
    # Reminder Details
    reminder_type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Timing
    due_date = models.DateField()
    reminder_date = models.DateField()
    sent_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Recordatorio')
        verbose_name_plural = _('Recordatorios')
        db_table = 'clinimetrix_reminders'
        ordering = ['reminder_date', 'due_date']
        indexes = [
            models.Index(fields=['status', 'reminder_date']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['patient', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.patient.get_full_name()}"
    
    def mark_completed(self):
        """Mark reminder as completed"""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()


class SecondaryDevice(models.Model):
    """
    Dispositivos secundarios registrados para evaluaciones locales
    """
    # Relationship
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='secondary_devices')
    
    # Device Info
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, default='tablet')
    
    # Session Management
    is_active = models.BooleanField(default=True)
    session_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    session_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Current Assessment
    current_assessment = models.ForeignKey(
        Assessment, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='secondary_device'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('Dispositivo secundario')
        verbose_name_plural = _('Dispositivos secundarios')
        db_table = 'clinimetrix_secondary_devices'
        ordering = ['-last_used_at', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"
    
    def generate_session_token(self, duration_hours=8):
        """Generate session token for device"""
        import secrets
        self.session_token = secrets.token_urlsafe(32)
        self.session_expires_at = timezone.now() + timezone.timedelta(hours=duration_hours)
        self.save()
        return self.session_token
    
    @property
    def is_session_valid(self):
        """Check if current session is valid"""
        if not self.session_token or not self.session_expires_at:
            return False
        return timezone.now() < self.session_expires_at
    
    def end_session(self):
        """End current session"""
        self.session_token = None
        self.session_expires_at = None
        self.current_assessment = None
        self.save()


class ClinimetrixRegistry(models.Model):
    """Registry for all available ClinimetrixPro scales"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scale_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    abbreviation = models.CharField(max_length=50)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=20, default='1.0')
    language = models.CharField(max_length=10, default='es')
    json_data = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clinimetrix_registry'
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['scale_id']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.abbreviation} - {self.name}"


class Consultation(models.Model):
    """Medical consultation model for Expedix"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    consultation_date = models.DateTimeField(default=timezone.now)
    consultation_type = models.CharField(max_length=50)
    chief_complaint = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments_consultations'
        ordering = ['-consultation_date']
    
    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.consultation_date}"


class Payment(models.Model):
    """Payment model for finance module"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='payments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments_payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment {self.amount} - {self.patient.get_full_name()}"