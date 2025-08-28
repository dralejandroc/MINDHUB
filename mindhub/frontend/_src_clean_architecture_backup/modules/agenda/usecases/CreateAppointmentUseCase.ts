/**
 * CreateAppointmentUseCase
 * Application business rules for creating appointments
 */

import { Appointment } from '../entities/Appointment';
import { ScheduleConfig } from '../entities/ScheduleConfig';
import { AppointmentRepository, CreateAppointmentData } from '../repositories/AppointmentRepository';

export interface CreateAppointmentRequest {
  patientId: string;
  professionalId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  consultationType: string;
  reason?: string;
  notes?: string;
  clinicId?: string;
  workspaceId?: string;
}

export class CreateAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(request: CreateAppointmentRequest): Promise<Appointment> {
    // Business rule: Validate time constraints
    this.validateTimeConstraints(request.startTime, request.endTime);

    // Business rule: Check for conflicts
    await this.checkForConflicts(
      request.startTime, 
      request.endTime, 
      request.professionalId
    );

    // Business rule: Validate tenant context (clinic XOR workspace)
    this.validateTenantContext(request.clinicId, request.workspaceId);

    // Create appointment through repository
    const appointmentData: CreateAppointmentData = {
      patientId: request.patientId,
      professionalId: request.professionalId,
      startTime: request.startTime,
      endTime: request.endTime,
      type: request.type,
      consultationType: request.consultationType,
      reason: request.reason,
      notes: request.notes,
      clinicId: request.clinicId,
      workspaceId: request.workspaceId
    };

    const appointment = await this.appointmentRepository.create(appointmentData);

    // Business rule: Auto-confirm if within 24 hours
    if (this.shouldAutoConfirm(appointment.startTime)) {
      return await this.appointmentRepository.confirm(appointment.id, false);
    }

    return appointment;
  }

  /**
   * Business rule: Validate time constraints
   */
  private validateTimeConstraints(startTime: Date, endTime: Date): void {
    const now = new Date();
    
    // Cannot create appointments in the past
    if (startTime < now) {
      throw new Error('Cannot create appointments in the past');
    }

    // Start must be before end
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    // Minimum duration 15 minutes
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / 60000;
    
    if (durationMinutes < 15) {
      throw new Error('Appointment must be at least 15 minutes long');
    }

    // Maximum duration 4 hours
    if (durationMinutes > 240) {
      throw new Error('Appointment cannot exceed 4 hours');
    }
  }

  /**
   * Business rule: Check for scheduling conflicts
   */
  private async checkForConflicts(
    startTime: Date, 
    endTime: Date, 
    professionalId: string
  ): Promise<void> {
    const conflicts = await this.appointmentRepository.findConflicts(
      startTime,
      endTime,
      professionalId
    );

    if (conflicts.length > 0) {
      throw new Error(
        `Schedule conflict: Professional already has ${conflicts.length} appointment(s) at this time`
      );
    }
  }

  /**
   * Business rule: Validate tenant context
   */
  private validateTenantContext(clinicId?: string, workspaceId?: string): void {
    // Must have exactly one tenant
    if (!clinicId && !workspaceId) {
      throw new Error('Appointment must belong to either a clinic or workspace');
    }

    if (clinicId && workspaceId) {
      throw new Error('Appointment cannot belong to both clinic and workspace');
    }
  }

  /**
   * Business rule: Auto-confirm appointments within 24 hours
   */
  private shouldAutoConfirm(startTime: Date): boolean {
    const now = new Date();
    const hoursUntilAppointment = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment <= 24;
  }
}