"""
Financial Models for Patient Transaction Management
Integrates with Agenda and Expedix modules
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class PatientTransaction(models.Model):
    """Track all financial transactions for patients"""
    TRANSACTION_TYPES = [
        ('payment', 'Pago'),
        ('refund', 'Devolución'),
        ('adjustment', 'Ajuste'),
        ('invoice', 'Factura'),
        ('credit', 'Crédito'),
        ('debit', 'Débito'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Devuelto'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Efectivo'),
        ('card', 'Tarjeta'),
        ('transfer', 'Transferencia'),
        ('check', 'Cheque'),
        ('insurance', 'Seguro'),
        ('other', 'Otro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relations
    patient = models.ForeignKey('expedix.Patient', on_delete=models.CASCADE, related_name='transactions')
    appointment = models.ForeignKey('agenda.Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    # Transaction details
    transaction_number = models.CharField(max_length=50, unique=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True, help_text="Número de referencia bancario, cheque, etc.")
    
    # Description and notes
    concept = models.CharField(max_length=200, help_text="Concepto de la transacción")
    description = models.TextField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    # User tracking
    created_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT, related_name='created_transactions')
    processed_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT, null=True, blank=True, related_name='processed_transactions')
    
    # Timestamps
    transaction_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")

    class Meta:
        db_table = 'patient_transactions'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['appointment']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(clinic_id__isnull=False, workspace_id__isnull=True) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=False)
                ),
                name='check_transaction_owner'
            )
        ]

    def __str__(self):
        return f"#{self.transaction_number} - {self.patient} - ${self.amount} - {self.get_transaction_type_display()}"


class PatientBalance(models.Model):
    """Track current balance for each patient"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField('expedix.Patient', on_delete=models.CASCADE, related_name='balance')
    
    # Balance details
    total_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Counts
    total_invoices = models.IntegerField(default=0)
    total_payments = models.IntegerField(default=0)
    total_refunds = models.IntegerField(default=0)
    
    # Timestamps
    last_transaction_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")

    class Meta:
        db_table = 'patient_balances'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['current_balance']),
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(clinic_id__isnull=False, workspace_id__isnull=True) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=False)
                ),
                name='check_balance_owner'
            )
        ]

    def __str__(self):
        return f"{self.patient} - Balance: ${self.current_balance}"
    
    def update_balance(self):
        """Recalculate balance based on transactions"""
        from django.db.models import Sum, Q
        
        # Calculate totals from transactions
        transactions = PatientTransaction.objects.filter(patient=self.patient, status='completed')
        
        credits = transactions.filter(
            transaction_type__in=['payment', 'refund', 'credit']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        debits = transactions.filter(
            transaction_type__in=['invoice', 'debit', 'adjustment']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        self.total_paid = credits
        self.total_charged = debits
        self.current_balance = debits - credits
        
        # Update counts
        self.total_invoices = transactions.filter(transaction_type='invoice').count()
        self.total_payments = transactions.filter(transaction_type='payment').count()
        self.total_refunds = transactions.filter(transaction_type='refund').count()
        
        # Update last transaction date
        last_transaction = transactions.order_by('-transaction_date').first()
        if last_transaction:
            self.last_transaction_date = last_transaction.transaction_date
        
        self.save()


class Invoice(models.Model):
    """Invoice model for billing patients"""
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('sent', 'Enviada'),
        ('paid', 'Pagada'),
        ('overdue', 'Vencida'),
        ('cancelled', 'Cancelada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    
    # Relations
    patient = models.ForeignKey('expedix.Patient', on_delete=models.CASCADE, related_name='invoices')
    appointment = models.ForeignKey('agenda.Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    # Invoice details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0.16)  # 16% IVA
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Description
    description = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # User tracking
    created_by = models.ForeignKey('expedix.User', on_delete=models.PROTECT, related_name='created_invoices')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Dual system support
    clinic_id = models.UUIDField(blank=True, null=True, help_text="For clinic licenses")
    workspace_id = models.UUIDField(blank=True, null=True, help_text="For individual licenses")

    class Meta:
        db_table = 'invoices'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['status']),
            models.Index(fields=['issue_date']),
            models.Index(fields=['due_date']),
            models.Index(fields=['clinic_id']),
            models.Index(fields=['workspace_id']),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(clinic_id__isnull=False, workspace_id__isnull=True) |
                    models.Q(clinic_id__isnull=True, workspace_id__isnull=False)
                ),
                name='check_invoice_owner'
            )
        ]

    def __str__(self):
        return f"Factura #{self.invoice_number} - {self.patient} - ${self.total_amount}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate tax and total
        self.tax_amount = self.subtotal * self.tax_rate
        self.total_amount = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)