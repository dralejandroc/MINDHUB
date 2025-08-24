"""
Agenda Models - Appointment Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
from django.db import models
from django.core.validators import EmailValidator, MinValueValidator, MaxValueValidator


class Appointment(models.Model):
    """Appointment model for comprehensive appointment management"""
    STATUS_CHOICES = [
        ('scheduled', 'Programada'),
        ('confirmed', 'Confirmada'),
        ('cancelled', 'Cancelada'),
        ('no_show', 'No se presentó'),
        ('completed', 'Completada'),
        ('rescheduled', 'Reprogramada'),
    ]

    TYPE_CHOICES = [
        ('consultation', 'Consulta'),
        ('follow_up', 'Seguimiento'),
        ('emergency', 'Emergencia'),
        ('therapy', 'Terapia'),
        ('evaluation', 'Evaluación'),
        ('medication_review', 'Revisión de medicación'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment_number = models.CharField(max_length=50, unique=True)
    
    # 🎯 DUAL SYSTEM: Puede pertenecer a clínica O workspace individual
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")
    
    # Foreign keys (using string references to avoid circular imports)
    patient = models.ForeignKey('expedix.Patient', on_delete=models.CASCADE, related_name='appointments')
    provider = models.ForeignKey('expedix.User', on_delete=models.PROTECT, related_name='provider_appointments')
    
    # Appointment details
    appointment_date = models.DateTimeField()
    appointment_time = models.TimeField(help_text="Time extracted from appointment_date for easier filtering")
    duration = models.IntegerField(
        validators=[MinValueValidator(15), MaxValueValidator(480)],
        help_text="Duration in minutes (15-480)"
    )
    appointment_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    reason = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Administrative fields for comprehensive tracking
    branch = models.CharField(max_length=100, blank=True, null=True, help_text="Sucursal donde se realiza la cita")
    resource = models.CharField(max_length=100, blank=True, null=True, help_text="Recurso utilizado (consultorio, sala, etc.)")
    professional = models.CharField(max_length=200, blank=True, null=True, help_text="Nombre del profesional asignado")
    
    # Financial tracking
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Balance pendiente de la cita")
    is_paid = models.BooleanField(default=False, help_text="Indica si la cita ha sido pagada completamente")
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Confirmation tracking
    confirmed_at = models.DateTimeField(blank=True, null=True)
    confirmed_by = models.ForeignKey('expedix.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_appointments')
    
    # Cancellation tracking  
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancelled_by = models.ForeignKey('expedix.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_appointments')
    cancellation_reason = models.TextField(blank=True, null=True)
    reschedule_requested = models.BooleanField(default=False)
    
    # Preparation requirements
    requires_preparation = models.BooleanField(default=False)
    preparation_instructions = models.TextField(blank=True, null=True)
    
    # Administrative tracking
    scheduled_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT, related_name='scheduled_appointments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['provider']),
            models.Index(fields=['appointment_date']),
            models.Index(fields=['status']),
            models.Index(fields=['appointment_number']),
            # 🎯 DUAL SYSTEM: Índices para filtrado eficiente
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
        ]
        constraints = [
            # 🎯 DUAL SYSTEM: XOR constraint - solo uno de clinic_id O workspace_id
            models.CheckConstraint(
                check=(
                    models.Q(clinic_id__isnull=False, workspace_id__isnull=True) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=False)
                ),
                name='check_appointment_owner'
            )
        ]

    def save(self, *args, **kwargs):
        # Auto-sync appointment_time with appointment_date
        if self.appointment_date:
            self.appointment_time = self.appointment_date.time()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Cita {self.appointment_number} - {self.patient} - {self.appointment_date.strftime('%Y-%m-%d %H:%M')}"

    @property
    def is_upcoming(self):
        from django.utils import timezone
        return self.appointment_date > timezone.now() and self.status in ['scheduled', 'confirmed']

    @property
    def can_be_confirmed(self):
        return self.status not in ['cancelled', 'completed']

    @property
    def can_be_cancelled(self):
        return self.status not in ['cancelled', 'completed']


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
        return f"{self.appointment.appointment_number} - {self.action} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


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
        return f"{self.appointment.appointment_number} - Confirmada por {self.confirmation_type} - {self.confirmed_at.strftime('%Y-%m-%d %H:%M')}"


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
