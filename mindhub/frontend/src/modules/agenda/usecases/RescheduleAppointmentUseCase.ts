/**
 * RescheduleAppointmentUseCase
 * Application business rules for rescheduling appointments
 */

import { Appointment } from '../entities/Appointment';
import { AppointmentRepository } from '../repositories/AppointmentRepository';

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newStartTime: Date;
  newEndTime: Date;
  reason?: string;
}

export class RescheduleAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(request: RescheduleAppointmentRequest): Promise<Appointment> {
    // Get existing appointment
    const appointment = await this.appointmentRepository.findById(request.appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Business rule: Check if appointment can be rescheduled
    if (!appointment.canBeRescheduled()) {
      throw new Error(
        `Cannot reschedule appointment with status: ${appointment.status}`
      );
    }

    // Business rule: Validate new time constraints
    this.validateNewTimeConstraints(
      request.newStartTime, 
      request.newEndTime,
      appointment.startTime
    );

    // Business rule: Check for conflicts at new time
    await this.checkForConflicts(
      request.newStartTime,
      request.newEndTime,
      appointment.professionalId,
      appointment.id
    );

    // Business rule: Track reschedule history in notes
    const updatedNotes = this.addRescheduleNote(
      appointment.notes,
      appointment.startTime,
      request.newStartTime,
      request.reason
    );

    // Update appointment through repository
    const rescheduledAppointment = await this.appointmentRepository.update(
      appointment.id,
      {
        startTime: request.newStartTime,
        endTime: request.newEndTime,
        status: 'scheduled', // Reset to scheduled
        notes: updatedNotes
      }
    );

    // TODO: Trigger notification to patient about reschedule

    return rescheduledAppointment;
  }

  /**
   * Business rule: Validate new time constraints
   */
  private validateNewTimeConstraints(
    newStartTime: Date,
    newEndTime: Date,
    currentStartTime: Date
  ): void {
    const now = new Date();

    // Cannot reschedule to past
    if (newStartTime < now) {
      throw new Error('Cannot reschedule appointment to the past');
    }

    // Start must be before end
    if (newStartTime >= newEndTime) {
      throw new Error('Start time must be before end time');
    }

    // Business rule: Minimum 2 hours notice for reschedule
    const hoursUntilCurrent = (currentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilCurrent <= 2) {
      throw new Error('Appointments must be rescheduled at least 2 hours in advance');
    }

    // Duration constraints
    const durationMs = newEndTime.getTime() - newStartTime.getTime();
    const durationMinutes = durationMs / 60000;
    
    if (durationMinutes < 15) {
      throw new Error('Appointment must be at least 15 minutes long');
    }

    if (durationMinutes > 240) {
      throw new Error('Appointment cannot exceed 4 hours');
    }
  }

  /**
   * Business rule: Check for scheduling conflicts at new time
   */
  private async checkForConflicts(
    startTime: Date,
    endTime: Date,
    professionalId: string,
    excludeAppointmentId: string
  ): Promise<void> {
    const conflicts = await this.appointmentRepository.findConflicts(
      startTime,
      endTime,
      professionalId
    );

    // Filter out the current appointment from conflicts
    const realConflicts = conflicts.filter(apt => apt.id !== excludeAppointmentId);

    if (realConflicts.length > 0) {
      throw new Error(
        `Schedule conflict: Professional already has ${realConflicts.length} appointment(s) at the new time`
      );
    }
  }

  /**
   * Business rule: Add reschedule history to notes
   */
  private addRescheduleNote(
    currentNotes: string | undefined,
    oldTime: Date,
    newTime: Date,
    reason?: string
  ): string {
    const rescheduleNote = `[REPROGRAMADO] De: ${oldTime.toLocaleString()} a: ${newTime.toLocaleString()}`;
    const reasonNote = reason ? ` - Razón: ${reason}` : '';
    const fullNote = `${rescheduleNote}${reasonNote}`;
    
    return currentNotes 
      ? `${currentNotes}\n${fullNote}`
      : fullNote;
  }
}