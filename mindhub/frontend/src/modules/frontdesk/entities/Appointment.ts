/**
 * Appointment Entity for FrontDesk Module
 * Core business logic for appointment management at front desk - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type AppointmentStatus = 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type AppointmentType = 'consultation' | 'follow_up' | 'emergency' | 'routine' | 'evaluation' | 'therapy' | 'procedure';
export type AppointmentUrgency = 'low' | 'medium' | 'high' | 'urgent';

export interface Professional {
  id: string;
  name: string;
  specialization: string;
  title: string;
}

export interface AppointmentPatient {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

export interface AppointmentHistory {
  status: AppointmentStatus;
  timestamp: Date;
  changedBy: string;
  reason?: string;
  notes?: string;
}

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly patient: AppointmentPatient,
    public readonly professional: Professional,
    public readonly timeSlot: TimeSlot,
    public readonly appointmentType: AppointmentType,
    public readonly status: AppointmentStatus,
    public readonly urgency: AppointmentUrgency,
    public readonly reason: string,
    public readonly notes: string,
    public readonly history: AppointmentHistory[],
    public readonly isRecurring: boolean = false,
    public readonly recurringPattern?: string,
    public readonly reminderSent: boolean = false,
    public readonly confirmationRequired: boolean = true,
    public readonly estimatedDuration: number = 30, // minutes
    public readonly actualStartTime?: Date,
    public readonly actualEndTime?: Date,
    public readonly waitingRoomLocation?: string,
    public readonly specialInstructions?: string,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate appointment data
   */
  private validate(): void {
    if (!this.patient.firstName.trim()) {
      throw new Error('Patient name is required for appointment');
    }

    if (!this.professional.name.trim()) {
      throw new Error('Professional is required for appointment');
    }

    if (!this.reason.trim()) {
      throw new Error('Appointment reason is required');
    }

    if (this.timeSlot.startTime >= this.timeSlot.endTime) {
      throw new Error('Appointment start time must be before end time');
    }

    if (this.timeSlot.duration <= 0) {
      throw new Error('Appointment duration must be positive');
    }

    if (this.estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Appointment must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Appointment cannot belong to both clinic and workspace');
    }

    // Business rule: Validate appointment timing
    this.validateAppointmentTiming();

    // Business rule: Validate status transitions
    this.validateStatusConsistency();
  }

  /**
   * Business rule: Validate appointment timing
   */
  private validateAppointmentTiming(): void {
    const now = new Date();
    const appointmentDate = new Date(this.timeSlot.startTime);

    // Business rule: Past appointments should have appropriate status
    if (appointmentDate < now && this.status === 'scheduled') {
      console.warn('Appointment is in the past but still marked as scheduled');
    }

    // Business rule: Future appointments cannot be completed
    if (appointmentDate > now && ['completed', 'no_show'].includes(this.status)) {
      throw new Error('Future appointments cannot be marked as completed or no show');
    }

    // Business rule: Reasonable time slots
    const hour = appointmentDate.getHours();
    if (hour < 6 || hour > 22) {
      console.warn('Appointment scheduled outside typical business hours');
    }
  }

  /**
   * Business rule: Validate status consistency
   */
  private validateStatusConsistency(): void {
    // Business rule: Actual times should match status
    if (this.status === 'in_progress' && !this.actualStartTime) {
      console.warn('Appointment in progress should have actual start time');
    }

    if (this.status === 'completed' && (!this.actualStartTime || !this.actualEndTime)) {
      console.warn('Completed appointment should have actual start and end times');
    }

    // Business rule: Cancelled appointments should not have actual times
    if (this.status === 'cancelled' && (this.actualStartTime || this.actualEndTime)) {
      throw new Error('Cancelled appointment should not have actual times');
    }
  }

  /**
   * Business logic: Check if appointment can be checked in
   */
  canBeCheckedIn(): boolean {
    const now = new Date();
    const appointmentTime = new Date(this.timeSlot.startTime);
    const earlyArrivalWindow = 30 * 60 * 1000; // 30 minutes in milliseconds

    return this.status === 'scheduled' && 
           now >= (appointmentTime.getTime() - earlyArrivalWindow) &&
           now <= appointmentTime.getTime() + (60 * 60 * 1000); // 1 hour after
  }

  /**
   * Business logic: Check if patient has arrived
   */
  hasPatientArrived(): boolean {
    return ['arrived', 'in_progress', 'completed'].includes(this.status);
  }

  /**
   * Business logic: Check if appointment is overdue
   */
  isOverdue(): boolean {
    const now = new Date();
    const appointmentTime = new Date(this.timeSlot.startTime);
    const overdueThreshold = 15 * 60 * 1000; // 15 minutes

    return this.status === 'scheduled' && 
           now > (appointmentTime.getTime() + overdueThreshold);
  }

  /**
   * Business logic: Check if appointment is ready to start
   */
  isReadyToStart(): boolean {
    return this.status === 'arrived' || 
           (this.status === 'scheduled' && this.canBeCheckedIn());
  }

  /**
   * Business logic: Mark patient as arrived (check-in)
   */
  markAsArrived(
    arrivedAt: Date = new Date(),
    checkedInBy: string,
    waitingRoomLocation?: string
  ): Appointment {
    if (!this.canBeCheckedIn()) {
      throw new Error('Appointment cannot be checked in at this time');
    }

    const historyEntry: AppointmentHistory = {
      status: 'arrived',
      timestamp: arrivedAt,
      changedBy: checkedInBy,
      notes: waitingRoomLocation ? `Checked in to ${waitingRoomLocation}` : 'Patient arrived'
    };

    return new Appointment(
      this.id,
      this.patient,
      this.professional,
      this.timeSlot,
      this.appointmentType,
      'arrived',
      this.urgency,
      this.reason,
      this.notes,
      [...this.history, historyEntry],
      this.isRecurring,
      this.recurringPattern,
      this.reminderSent,
      this.confirmationRequired,
      this.estimatedDuration,
      this.actualStartTime,
      this.actualEndTime,
      waitingRoomLocation || this.waitingRoomLocation,
      this.specialInstructions,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Start appointment
   */
  startAppointment(
    startedBy: string,
    actualStartTime: Date = new Date()
  ): Appointment {
    if (!this.isReadyToStart()) {
      throw new Error('Appointment is not ready to start');
    }

    const historyEntry: AppointmentHistory = {
      status: 'in_progress',
      timestamp: actualStartTime,
      changedBy: startedBy,
      notes: 'Appointment started'
    };

    return new Appointment(
      this.id,
      this.patient,
      this.professional,
      this.timeSlot,
      this.appointmentType,
      'in_progress',
      this.urgency,
      this.reason,
      this.notes,
      [...this.history, historyEntry],
      this.isRecurring,
      this.recurringPattern,
      this.reminderSent,
      this.confirmationRequired,
      this.estimatedDuration,
      actualStartTime,
      this.actualEndTime,
      this.waitingRoomLocation,
      this.specialInstructions,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Complete appointment
   */
  completeAppointment(
    completedBy: string,
    actualEndTime: Date = new Date(),
    completionNotes?: string
  ): Appointment {
    if (this.status !== 'in_progress') {
      throw new Error('Only appointments in progress can be completed');
    }

    if (!this.actualStartTime) {
      throw new Error('Cannot complete appointment without start time');
    }

    if (actualEndTime <= this.actualStartTime) {
      throw new Error('End time must be after start time');
    }

    const historyEntry: AppointmentHistory = {
      status: 'completed',
      timestamp: actualEndTime,
      changedBy: completedBy,
      notes: completionNotes || 'Appointment completed'
    };

    const updatedNotes = completionNotes 
      ? `${this.notes}\nCompleted: ${completionNotes}`
      : this.notes;

    return new Appointment(
      this.id,
      this.patient,
      this.professional,
      this.timeSlot,
      this.appointmentType,
      'completed',
      this.urgency,
      this.reason,
      updatedNotes,
      [...this.history, historyEntry],
      this.isRecurring,
      this.recurringPattern,
      this.reminderSent,
      this.confirmationRequired,
      this.estimatedDuration,
      this.actualStartTime,
      actualEndTime,
      this.waitingRoomLocation,
      this.specialInstructions,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Mark as no show
   */
  markAsNoShow(
    markedBy: string,
    reason?: string,
    timestamp: Date = new Date()
  ): Appointment {
    if (!['scheduled', 'arrived'].includes(this.status)) {
      throw new Error('Only scheduled or arrived appointments can be marked as no show');
    }

    const historyEntry: AppointmentHistory = {
      status: 'no_show',
      timestamp,
      changedBy: markedBy,
      reason,
      notes: reason || 'Patient did not show up'
    };

    return new Appointment(
      this.id,
      this.patient,
      this.professional,
      this.timeSlot,
      this.appointmentType,
      'no_show',
      this.urgency,
      this.reason,
      this.notes,
      [...this.history, historyEntry],
      this.isRecurring,
      this.recurringPattern,
      this.reminderSent,
      this.confirmationRequired,
      this.estimatedDuration,
      this.actualStartTime,
      this.actualEndTime,
      this.waitingRoomLocation,
      this.specialInstructions,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Cancel appointment
   */
  cancel(
    cancelledBy: string,
    reason: string,
    timestamp: Date = new Date()
  ): Appointment {
    if (['completed', 'no_show', 'cancelled'].includes(this.status)) {
      throw new Error('Appointment cannot be cancelled in current status');
    }

    const historyEntry: AppointmentHistory = {
      status: 'cancelled',
      timestamp,
      changedBy: cancelledBy,
      reason,
      notes: `Cancelled: ${reason}`
    };

    return new Appointment(
      this.id,
      this.patient,
      this.professional,
      this.timeSlot,
      this.appointmentType,
      'cancelled',
      this.urgency,
      this.reason,
      this.notes,
      [...this.history, historyEntry],
      this.isRecurring,
      this.recurringPattern,
      this.reminderSent,
      this.confirmationRequired,
      this.estimatedDuration,
      this.actualStartTime,
      this.actualEndTime,
      this.waitingRoomLocation,
      this.specialInstructions,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Get appointment duration
   */
  getScheduledDuration(): number {
    return this.timeSlot.duration;
  }

  /**
   * Business logic: Get actual duration if completed
   */
  getActualDuration(): number {
    if (!this.actualStartTime || !this.actualEndTime) {
      return 0;
    }

    return Math.round(
      (this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60)
    );
  }

  /**
   * Business logic: Get wait time from arrival to start
   */
  getWaitTime(): number {
    if (!this.actualStartTime) {
      return 0;
    }

    const arrivalHistory = this.history.find(h => h.status === 'arrived');
    if (!arrivalHistory) {
      return 0;
    }

    return Math.round(
      (this.actualStartTime.getTime() - arrivalHistory.timestamp.getTime()) / (1000 * 60)
    );
  }

  /**
   * Business logic: Check if appointment is urgent
   */
  isUrgent(): boolean {
    return this.urgency === 'urgent' || this.urgency === 'high';
  }

  /**
   * Business logic: Get time until appointment
   */
  getTimeUntilAppointment(): number {
    const now = new Date();
    const appointmentTime = new Date(this.timeSlot.startTime);
    return Math.round((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Business logic: Check if reminder should be sent
   */
  shouldSendReminder(): boolean {
    if (this.reminderSent || this.status !== 'scheduled') {
      return false;
    }

    const timeUntilAppointment = this.getTimeUntilAppointment();
    const reminderWindow = this.isUrgent() ? 60 : 24 * 60; // 1 hour for urgent, 24 hours for others

    return timeUntilAppointment <= reminderWindow && timeUntilAppointment > 0;
  }

  /**
   * Business logic: Get patient display name
   */
  getPatientName(): string {
    return `${this.patient.firstName} ${this.patient.lastName}`;
  }

  /**
   * Business logic: Get formatted appointment time
   */
  getFormattedTime(): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(this.timeSlot.startTime);
  }

  /**
   * Business logic: Get appointment summary for front desk
   */
  getFrontDeskSummary(): {
    patientName: string;
    professionalName: string;
    appointmentTime: string;
    status: AppointmentStatus;
    urgency: AppointmentUrgency;
    waitTime: number;
    isOverdue: boolean;
    canCheckIn: boolean;
  } {
    return {
      patientName: this.getPatientName(),
      professionalName: this.professional.name,
      appointmentTime: this.getFormattedTime(),
      status: this.status,
      urgency: this.urgency,
      waitTime: this.getWaitTime(),
      isOverdue: this.isOverdue(),
      canCheckIn: this.canBeCheckedIn()
    };
  }

  /**
   * Business logic: Get priority score for queue management
   */
  getPriorityScore(): number {
    let score = 0;

    // Urgency factor
    switch (this.urgency) {
      case 'urgent': score += 5; break;
      case 'high': score += 3; break;
      case 'medium': score += 1; break;
      case 'low': score += 0; break;
    }

    // Overdue factor
    if (this.isOverdue()) {
      score += 3;
    }

    // Wait time factor (if arrived)
    const waitTime = this.getWaitTime();
    if (waitTime > 30) score += 2;
    else if (waitTime > 15) score += 1;

    // Appointment type factor
    if (this.appointmentType === 'emergency') score += 4;
    else if (this.appointmentType === 'evaluation') score += 1;

    return Math.min(score, 10); // Cap at 10
  }
}