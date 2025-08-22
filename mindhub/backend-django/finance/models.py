"""
Finance models for MindHub
Manages income tracking, payment methods, and financial statistics
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class IncomeSource(models.TextChoices):
    CONSULTATION = 'consultation', 'Consulta'
    ADVANCE = 'advance', 'Anticipo'
    THERAPY = 'therapy', 'Terapia'
    EVALUATION = 'evaluation', 'Evaluación'
    PROCEDURE = 'procedure', 'Procedimiento'
    MEDICATION = 'medication', 'Medicamento'
    OTHER = 'other', 'Otro'


class PaymentMethod(models.TextChoices):
    CASH = 'cash', 'Efectivo'
    CREDIT_CARD = 'credit_card', 'Tarjeta de Crédito'
    DEBIT_CARD = 'debit_card', 'Tarjeta de Débito'
    TRANSFER = 'transfer', 'Transferencia'
    PAYMENT_GATEWAY = 'payment_gateway', 'Pasarela de Pago'
    CHECK = 'check', 'Cheque'
    INSURANCE = 'insurance', 'Seguro'


class IncomeStatus(models.TextChoices):
    PENDING = 'pending', 'Pendiente'
    CONFIRMED = 'confirmed', 'Confirmado'
    CANCELLED = 'cancelled', 'Cancelado'
    REFUNDED = 'refunded', 'Reembolsado'


class Income(models.Model):
    """
    Income records for clinic financial management
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships - using UUID strings to match Supabase foreign keys
    patient_id = models.UUIDField(null=True, blank=True, help_text="Patient UUID from Supabase")
    professional_id = models.UUIDField(null=True, blank=True, help_text="Professional UUID from Supabase")
    consultation_id = models.UUIDField(null=True, blank=True, help_text="Consultation UUID from Supabase")
    clinic_id = models.UUIDField(null=True, blank=True, help_text="Clinic UUID from Supabase")
    
    # Financial details
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Amount in local currency"
    )
    currency = models.CharField(max_length=3, default='MXN', help_text="Currency code (ISO 4217)")
    
    source = models.CharField(
        max_length=20,
        choices=IncomeSource.choices,
        default=IncomeSource.CONSULTATION
    )
    
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    
    status = models.CharField(
        max_length=20,
        choices=IncomeStatus.choices,
        default=IncomeStatus.PENDING
    )
    
    # Descriptive fields
    description = models.CharField(max_length=255, blank=True, help_text="Brief description of the service")
    concept = models.TextField(blank=True, help_text="Detailed concept/notes")
    notes = models.TextField(blank=True, help_text="Internal notes")
    reference = models.CharField(max_length=100, blank=True, help_text="External reference/invoice number")
    
    # Dates
    received_date = models.DateField(default=timezone.now, help_text="Date when payment was received")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata for external system integration
    patient_name = models.CharField(max_length=200, blank=True, help_text="Cached patient name for faster queries")
    professional_name = models.CharField(max_length=200, blank=True, help_text="Cached professional name")
    
    class Meta:
        db_table = 'finance_income'
        ordering = ['-received_date', '-created_at']
        indexes = [
            models.Index(fields=['received_date']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['professional_id']),
            models.Index(fields=['status']),
            models.Index(fields=['source']),
            models.Index(fields=['clinic_id']),
        ]

    def __str__(self):
        return f"{self.amount} {self.currency} - {self.get_source_display()} ({self.received_date})"

    @property
    def patient_display(self):
        return self.patient_name if self.patient_name else f"Patient {self.patient_id}"
    
    @property
    def professional_display(self):
        return self.professional_name if self.professional_name else f"Professional {self.professional_id}"


class CashRegisterCut(models.Model):
    """
    Daily cash register cuts for accounting control
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    clinic_id = models.UUIDField(help_text="Clinic UUID from Supabase")
    responsible_professional_id = models.UUIDField(help_text="Professional who made the cut")
    
    # Cut details
    cut_date = models.DateField(default=timezone.now)
    cut_number = models.CharField(max_length=50, help_text="Sequential cut number")
    
    # Cash amounts
    expected_cash = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Expected cash based on transactions"
    )
    actual_cash = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Actual cash counted"
    )
    difference = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        help_text="Difference between expected and actual"
    )
    
    # Summary by payment method
    total_cash_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_card_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_transfer_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_other_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Notes and observations
    notes = models.TextField(blank=True, help_text="Cut observations and notes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Cached fields
    responsible_professional_name = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = 'finance_cash_register_cuts'
        ordering = ['-cut_date', '-created_at']
        unique_together = ['clinic_id', 'cut_date', 'cut_number']
        indexes = [
            models.Index(fields=['cut_date']),
            models.Index(fields=['clinic_id']),
            models.Index(fields=['responsible_professional_id']),
        ]

    def __str__(self):
        return f"Corte {self.cut_number} - {self.cut_date}"

    def save(self, *args, **kwargs):
        # Calculate difference
        self.difference = self.actual_cash - self.expected_cash
        super().save(*args, **kwargs)


class FinancialService(models.Model):
    """
    Catalog of services and their standard prices
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    clinic_id = models.UUIDField(help_text="Clinic UUID from Supabase")
    
    # Service details
    name = models.CharField(max_length=200, help_text="Service name")
    code = models.CharField(max_length=50, blank=True, help_text="Internal service code")
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True, help_text="Service category")
    
    # Pricing
    standard_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Standard price for this service"
    )
    currency = models.CharField(max_length=3, default='MXN')
    
    # Configuration
    is_active = models.BooleanField(default=True)
    allows_discount = models.BooleanField(default=True)
    max_discount_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Duration and scheduling
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'finance_services'
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['is_active']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.name} - {self.standard_price} {self.currency}"


class PaymentMethodConfiguration(models.Model):
    """
    Configuration for payment methods per clinic
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    clinic_id = models.UUIDField(help_text="Clinic UUID from Supabase")
    
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )
    
    is_enabled = models.BooleanField(default=True)
    display_name = models.CharField(max_length=100, help_text="Custom display name")
    
    # Configuration for card payments
    processing_fee_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=3, 
        default=0,
        help_text="Processing fee percentage (e.g., 2.9 for 2.9%)"
    )
    
    # Configuration details (JSON field for flexibility)
    configuration = models.JSONField(default=dict, blank=True)
    
    # Order for display
    display_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'finance_payment_method_config'
        ordering = ['display_order', 'display_name']
        unique_together = ['clinic_id', 'payment_method']
        indexes = [
            models.Index(fields=['clinic_id']),
            models.Index(fields=['is_enabled']),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.get_payment_method_display()})"