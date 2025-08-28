/**
 * Appointment Entity
 * Core business logic for appointments - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type ConsultationType = 
  | 'presencial' 
  | 'telemedicina' 
  | 'domicilio';

export type PaymentStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'cancelled';

export interface AppointmentLocation {
  id: string;
  name: string;
  address?: string;
  room?: string;
}

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly professionalId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly type: string,
    public readonly status: AppointmentStatus,
    public readonly consultationType: ConsultationType,
    public readonly paymentStatus: PaymentStatus,
    public readonly hasDeposit: boolean,
    public readonly notes?: string,
    public readonly internalNotes?: string,
    public readonly reason?: string,
    public readonly location?: AppointmentLocation,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly linkedConsultationId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate appointment integrity
   */
  private validate(): void {
    // Business rule: Start time must be before end time
    if (this.startTime >= this.endTime) {
      throw new Error('Appointment start time must be before end time');
    }

    // Business rule: Duration must be at least 15 minutes
    const durationMinutes = this.getDurationMinutes();
    if (durationMinutes < 15) {
      throw new Error('Appointment duration must be at least 15 minutes');
    }

    // Business rule: Cannot have both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Appointment cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Appointment must belong to either clinic or workspace');
    }
  }

  /**
   * Business logic: Calculate appointment duration in minutes
   */
  getDurationMinutes(): number {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }

  /**
   * Business logic: Check if appointment can be cancelled
   */
  canBeCancelled(): boolean {
    return this.status !== 'completed' && 
           this.status !== 'cancelled' && 
           this.status !== 'in_progress';
  }

  /**
   * Business logic: Check if appointment can be rescheduled
   */
  canBeRescheduled(): boolean {
    return this.status !== 'completed' && 
           this.status !== 'cancelled' && 
           this.status !== 'in_progress';
  }

  /**
   * Business logic: Check if appointment can start consultation
   */
  canStartConsultation(): boolean {
    return (this.status === 'scheduled' || this.status === 'confirmed') && 
           !this.linkedConsultationId;
  }

  /**
   * Business logic: Check if appointment is overdue
   */
  isOverdue(): boolean {
    return this.status === 'scheduled' && 
           new Date() > this.startTime;
  }

  /**
   * Business logic: Check if appointment conflicts with time range
   */
  conflictsWith(startTime: Date, endTime: Date): boolean {
    return (
      (this.startTime >= startTime && this.startTime < endTime) ||
      (this.endTime > startTime && this.endTime <= endTime) ||
      (this.startTime <= startTime && this.endTime >= endTime)
    );
  }

  /**
   * Business logic: Update appointment status
   */
  updateStatus(newStatus: AppointmentStatus): Appointment {
    // Business rule: Cannot change from completed or cancelled
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error(`Cannot change status from ${this.status}`);
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.professionalId,
      this.startTime,
      this.endTime,
      this.type,
      newStatus,
      this.consultationType,
      this.paymentStatus,
      this.hasDeposit,
      this.notes,
      this.internalNotes,
      this.reason,
      this.location,
      this.clinicId,
      this.workspaceId,
      this.linkedConsultationId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Reschedule appointment
   */
  reschedule(newStartTime: Date, newEndTime: Date): Appointment {
    if (!this.canBeRescheduled()) {
      throw new Error('Appointment cannot be rescheduled in current status');
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.professionalId,
      newStartTime,
      newEndTime,
      this.type,
      'scheduled', // Reset to scheduled when rescheduled
      this.consultationType,
      this.paymentStatus,
      this.hasDeposit,
      this.notes,
      this.internalNotes,
      this.reason,
      this.location,
      this.clinicId,
      this.workspaceId,
      this.linkedConsultationId,
      this.createdAt,
      new Date()
    );
  }
}