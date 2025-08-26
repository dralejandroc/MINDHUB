"""
Agenda Models - Appointment Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
from django.db import models
from django.core.validators import EmailValidator, MinValueValidator, MaxValueValidator


class Appointment(models.Model):
    """Appointment model matching EXACT Supabase schema - NO CUSTOM FIELDS"""
    
    # Choices for other models that reference them
    TYPE_CHOICES = [
        ('consultation', 'Consulta'),
        ('follow_up', 'Seguimiento'),
        ('emergency', 'Emergencia'),
        ('therapy', 'Terapia'),
        ('evaluation', 'Evaluación'),
        ('medication_review', 'Revisión de medicación'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Programada'),
        ('confirmed', 'Confirmada'),
        ('cancelled', 'Cancelada'),
        ('no_show', 'No se presentó'),
        ('completed', 'Completada'),
        ('rescheduled', 'Reprogramada'),
    ]
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Timestamps - EXACT order as Supabase
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Core relationships - EXACT field names from Supabase
    patient_id = models.UUIDField()  # NOT NULL in real table
    professional_id = models.UUIDField()  # NOT provider_id!
    
    # Date/time fields - SEPARATED as in real Supabase schema
    appointment_date = models.DateField()  # DATE not DATETIME!
    start_time = models.TimeField()  # SEPARATE TIME field
    end_time = models.TimeField()    # SEPARATE TIME field
    
    # Basic appointment info
    appointment_type = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    # Confirmation system - EXACT as Supabase
    confirmation_sent = models.BooleanField(blank=True, null=True)
    confirmation_date = models.DateTimeField(blank=True, null=True)
    
    # Recurring appointments - EXACT as Supabase
    is_recurring = models.BooleanField(blank=True, null=True)
    recurring_pattern = models.JSONField(blank=True, null=True)
    
    # Reminder system - EXACT as Supabase
    reminder_sent = models.BooleanField(blank=True, null=True)
    reminder_date = models.DateTimeField(blank=True, null=True)
    
    # 🎯 DUAL SYSTEM: EXACT as Supabase
    clinic_id = models.UUIDField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)

    class Meta:
        db_table = 'appointments'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['patient_id']),
            models.Index(fields=['professional_id']),  # Fixed field name
            models.Index(fields=['appointment_date']),
            models.Index(fields=['status']),
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
        ]

    def __str__(self):
        return f"Cita {self.id} - Patient {self.patient_id} - {self.appointment_date} {self.start_time}"

    @property
    def is_upcoming(self):
        from django.utils import timezone
        from datetime import datetime, date
        
        # Combine date and start_time for comparison
        if self.appointment_date and self.start_time:
            appointment_datetime = datetime.combine(self.appointment_date, self.start_time)
            # Make it timezone aware
            appointment_datetime = timezone.make_aware(appointment_datetime)
            return appointment_datetime > timezone.now() and self.status in ['scheduled', 'confirmed']
        return False

    @property
    def can_be_confirmed(self):
        return self.status not in ['cancelled', 'completed']

    @property
    def can_be_cancelled(self):
        return self.status not in ['cancelled', 'completed']
        
    @property
    def duration_minutes(self):
        """Calculate duration between start_time and end_time"""
        if self.start_time and self.end_time:
            from datetime import datetime, timedelta
            start = datetime.combine(date.today(), self.start_time)
            end = datetime.combine(date.today(), self.end_time)
            duration = end - start
            return int(duration.total_seconds() / 60)
        return None


class AppointmentHistory(models.Model):
    """Track all changes to appointments for audit purposes"""
    ACTION_CHOICES = [
        ('SCHEDULED', 'Programada'),
        ('CONFIRMED', 'Confirmada'),
        ('CANCELLED', 'Cancelada'),
        ('RESCHEDULED', 'Reprogramada'),
        ('COMPLETED', 'Completada'),
        ('NO_SHOW', 'No se presentó'),
        ('MODIFIED', 'Modificada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='history')
    
    # 🎯 DUAL SYSTEM: Hereda el owner del appointment
    clinic_id = models.UUIDField(blank=True, null=True, help_text="Inherited from appointment")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="Inherited from appointment")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changes = models.JSONField(help_text="Details of changes made")
    reason = models.TextField(blank=True, null=True)
    modified_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointment_history'
        indexes = [
            models.Index(fields=['appointment']),
            models.Index(fields=['created_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.appointment.id} - {self.action} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class AppointmentConfirmation(models.Model):
    """Track appointment confirmations from patients and staff"""
    CONFIRMATION_TYPE_CHOICES = [
        ('patient', 'Paciente'),
        ('staff', 'Personal'),
        ('automatic', 'Automática'),
    ]

    CONFIRMATION_METHOD_CHOICES = [
        ('phone', 'Teléfono'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_person', 'En persona'),
        ('online', 'En línea'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='confirmations')
    
    # 🎯 DUAL SYSTEM: Hereda el owner del appointment
    clinic_id = models.UUIDField(blank=True, null=True, help_text="Inherited from appointment")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="Inherited from appointment")
    confirmation_type = models.CharField(max_length=20, choices=CONFIRMATION_TYPE_CHOICES)
    confirmation_method = models.CharField(max_length=20, choices=CONFIRMATION_METHOD_CHOICES)
    confirmed_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT)
    notes = models.TextField(blank=True, null=True)
    confirmed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointment_confirmations'
        indexes = [
            models.Index(fields=['appointment']),
            models.Index(fields=['confirmed_at']),
            models.Index(fields=['confirmation_type']),
        ]

    def __str__(self):
        return f"{self.appointment.id} - Confirmada por {self.confirmation_type} - {self.confirmed_at.strftime('%Y-%m-%d %H:%M')}"


class ProviderSchedule(models.Model):
    """Provider availability and schedule configuration"""
    WEEKDAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey('expedix.User', on_delete=models.CASCADE, related_name='provider_schedules')
    
    # 🎯 DUAL SYSTEM: Schedule pertenece a clínica O workspace individual
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_start = models.TimeField(blank=True, null=True)
    break_end = models.TimeField(blank=True, null=True)
    slot_duration = models.IntegerField(default=60, help_text="Default slot duration in minutes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'provider_schedules'
        unique_together = ['provider', 'weekday', 'start_time']
        indexes = [
            models.Index(fields=['provider']),
            models.Index(fields=['weekday']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.provider} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class ScheduleBlock(models.Model):
    """Temporary schedule blocks (vacations, holidays, special availability)"""
    BLOCK_TYPE_CHOICES = [
        ('vacation', 'Vacaciones'),
        ('holiday', 'Día festivo'),
        ('sick_leave', 'Licencia médica'),
        ('special_hours', 'Horario especial'),
        ('unavailable', 'No disponible'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey('expedix.User', on_delete=models.CASCADE, related_name='schedule_blocks')
    
    # 🎯 DUAL SYSTEM: Block pertenece a clínica O workspace individual
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    all_day = models.BooleanField(default=True)
    reason = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'schedule_blocks'
        indexes = [
            models.Index(fields=['provider']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['block_type']),
        ]

    def __str__(self):
        return f"{self.provider} - {self.get_block_type_display()} - {self.start_date} to {self.end_date}"


class WaitingList(models.Model):
    """Waiting list for appointment scheduling"""
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]

    STATUS_CHOICES = [
        ('waiting', 'En espera'),
        ('contacted', 'Contactado'),
        ('scheduled', 'Programado'),
        ('cancelled', 'Cancelado'),
        ('expired', 'Expirado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey('expedix.Patient', on_delete=models.CASCADE, related_name='waiting_list_entries')
    provider = models.ForeignKey('expedix.User', on_delete=models.CASCADE, related_name='waiting_list')
    
    # 🎯 DUAL SYSTEM: Waiting list pertenece a clínica O workspace individual
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")
    appointment_type = models.CharField(max_length=50, choices=Appointment.TYPE_CHOICES)
    preferred_date_start = models.DateField(blank=True, null=True)
    preferred_date_end = models.DateField(blank=True, null=True)
    preferred_time_start = models.TimeField(blank=True, null=True)
    preferred_time_end = models.TimeField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    reason = models.CharField(max_length=200)
    notes = models.TextField(blank=True, null=True)
    added_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT, related_name='waiting_list_entries_added')
    contacted_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'waiting_list'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['provider']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Lista de espera: {self.patient} - {self.provider} - {self.get_priority_display()}"

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expires_at and self.expires_at < timezone.now()
