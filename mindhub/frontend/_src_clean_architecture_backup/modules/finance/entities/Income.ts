/**
 * Income Entity
 * Core business logic for financial income management - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type IncomeSource = 'consultation' | 'advance' | 'therapy' | 'evaluation' | 'other';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'payment_gateway' | 'check';
export type IncomeStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type Currency = 'MXN' | 'USD' | 'EUR';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
}

export interface Professional {
  id: string;
  name: string;
  email: string;
}

export interface Consultation {
  id: string;
  consultationDate: Date;
  reason: string;
}

export interface PaymentDetails {
  reference?: string;
  authorizationCode?: string;
  cardLastFourDigits?: string;
  checkNumber?: string;
  gatewayTransactionId?: string;
}

export class Income {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly currency: Currency,
    public readonly source: IncomeSource,
    public readonly paymentMethod: PaymentMethod,
    public readonly status: IncomeStatus,
    public readonly receivedDate: Date,
    public readonly description: string,
    public readonly concept: string,
    public readonly notes: string,
    public readonly patient?: Patient,
    public readonly professional?: Professional,
    public readonly consultation?: Consultation,
    public readonly paymentDetails?: PaymentDetails,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate income data
   */
  private validate(): void {
    if (this.amount <= 0) {
      throw new Error('Income amount must be positive');
    }

    if (!this.description.trim()) {
      throw new Error('Description is required');
    }

    if (!this.concept.trim()) {
      throw new Error('Concept is required');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Income must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Income cannot belong to both clinic and workspace');
    }

    // Business rule: Consultation income must have patient
    if (this.source === 'consultation' && !this.patient) {
      throw new Error('Consultation income must have associated patient');
    }

    // Business rule: Future dates not allowed for income
    if (this.receivedDate > new Date()) {
      throw new Error('Income cannot be received in the future');
    }

    // Business rule: Payment method validation
    if (this.paymentMethod === 'check' && !this.paymentDetails?.checkNumber) {
      throw new Error('Check number is required for check payments');
    }

    if (this.paymentMethod === 'payment_gateway' && !this.paymentDetails?.gatewayTransactionId) {
      throw new Error('Gateway transaction ID is required for payment gateway transactions');
    }
  }

  /**
   * Business logic: Check if income can be cancelled
   */
  canBeCancelled(): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days cutoff
    
    return this.status === 'pending' || 
           (this.status === 'confirmed' && this.receivedDate >= cutoffDate);
  }

  /**
   * Business logic: Check if income can be refunded
   */
  canBeRefunded(): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days cutoff for refunds
    
    return this.status === 'confirmed' && 
           this.receivedDate >= cutoffDate &&
           this.paymentMethod !== 'cash'; // Cash payments cannot be refunded electronically
  }

  /**
   * Business logic: Cancel income
   */
  cancel(reason?: string): Income {
    if (!this.canBeCancelled()) {
      throw new Error('Income cannot be cancelled');
    }

    return new Income(
      this.id,
      this.amount,
      this.currency,
      this.source,
      this.paymentMethod,
      'cancelled',
      this.receivedDate,
      this.description,
      this.concept,
      reason ? `${this.notes}\nCancelled: ${reason}` : this.notes,
      this.patient,
      this.professional,
      this.consultation,
      this.paymentDetails,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Confirm income
   */
  confirm(paymentDetails?: PaymentDetails): Income {
    if (this.status !== 'pending') {
      throw new Error('Only pending income can be confirmed');
    }

    return new Income(
      this.id,
      this.amount,
      this.currency,
      this.source,
      this.paymentMethod,
      'confirmed',
      this.receivedDate,
      this.description,
      this.concept,
      this.notes,
      this.patient,
      this.professional,
      this.consultation,
      paymentDetails || this.paymentDetails,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Create refund
   */
  refund(reason: string): Income {
    if (!this.canBeRefunded()) {
      throw new Error('Income cannot be refunded');
    }

    return new Income(
      `${this.id}_refund_${Date.now()}`,
      -this.amount, // Negative amount for refund
      this.currency,
      this.source,
      this.paymentMethod,
      'confirmed',
      new Date(),
      `Refund: ${this.description}`,
      `Refund: ${this.concept}`,
      `Original income: ${this.id}\nRefund reason: ${reason}`,
      this.patient,
      this.professional,
      this.consultation,
      this.paymentDetails,
      this.clinicId,
      this.workspaceId,
      new Date(),
      new Date()
    );
  }

  /**
   * Business logic: Check if this is a refund
   */
  isRefund(): boolean {
    return this.amount < 0;
  }

  /**
   * Business logic: Get formatted amount with currency
   */
  getFormattedAmount(): string {
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.currency
    });
    return formatter.format(this.amount);
  }

  /**
   * Business logic: Get business day for income (excluding weekends)
   */
  getBusinessDay(): Date {
    const date = new Date(this.receivedDate);
    const dayOfWeek = date.getDay();
    
    // If weekend, adjust to previous Friday
    if (dayOfWeek === 0) { // Sunday
      date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
      date.setDate(date.getDate() - 1);
    }
    
    return date;
  }

  /**
   * Business logic: Calculate age of income in days
   */
  getAgeDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.receivedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Business logic: Check if income is recent (within 7 days)
   */
  isRecent(): boolean {
    return this.getAgeDays() <= 7;
  }

  /**
   * Business logic: Get tax applicable amount (if any)
   */
  getTaxableAmount(): number {
    // Business rule: Only confirmed incomes are taxable
    if (this.status !== 'confirmed') {
      return 0;
    }

    // Business rule: Refunds are not taxable
    if (this.isRefund()) {
      return 0;
    }

    return this.amount;
  }

  /**
   * Business logic: Get income category for reporting
   */
  getReportingCategory(): string {
    switch (this.source) {
      case 'consultation':
        return 'Servicios Médicos';
      case 'therapy':
        return 'Servicios Terapéuticos';
      case 'evaluation':
        return 'Evaluaciones';
      case 'advance':
        return 'Anticipos';
      case 'other':
        return 'Otros Ingresos';
      default:
        return 'No Categorizado';
    }
  }

  /**
   * Business logic: Check if payment method requires verification
   */
  requiresPaymentVerification(): boolean {
    return ['credit_card', 'debit_card', 'payment_gateway', 'transfer'].includes(this.paymentMethod);
  }

  /**
   * Business logic: Update notes
   */
  updateNotes(additionalNotes: string): Income {
    const updatedNotes = this.notes 
      ? `${this.notes}\n${new Date().toISOString()}: ${additionalNotes}`
      : additionalNotes;

    return new Income(
      this.id,
      this.amount,
      this.currency,
      this.source,
      this.paymentMethod,
      this.status,
      this.receivedDate,
      this.description,
      this.concept,
      updatedNotes,
      this.patient,
      this.professional,
      this.consultation,
      this.paymentDetails,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }
}