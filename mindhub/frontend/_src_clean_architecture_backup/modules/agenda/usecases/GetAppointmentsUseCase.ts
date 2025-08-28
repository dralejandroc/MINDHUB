/**
 * GetAppointmentsUseCase
 * Application business rules for retrieving appointments
 */

import { Appointment } from '../entities/Appointment';
import { AppointmentRepository, AppointmentFilters } from '../repositories/AppointmentRepository';

export interface GetAppointmentsRequest {
  professionalId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  clinicId?: string;
  workspaceId?: string;
  viewType?: 'day' | 'week' | 'month';
}

export interface AppointmentWithMetadata {
  appointment: Appointment;
  isOverdue: boolean;
  canStart: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  conflictsWith: string[];
}

export class GetAppointmentsUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(request: GetAppointmentsRequest): Promise<AppointmentWithMetadata[]> {
    // Business rule: Apply date range based on view type
    const dateRange = this.getDateRangeForView(
      request.viewType,
      request.startDate,
      request.endDate
    );

    // Create filters
    const filters: AppointmentFilters = {
      professionalId: request.professionalId,
      patientId: request.patientId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      status: request.status,
      clinicId: request.clinicId,
      workspaceId: request.workspaceId
    };

    // Get appointments from repository
    const appointments = await this.appointmentRepository.findAll(filters);

    // Business rule: Sort by start time
    const sortedAppointments = this.sortAppointmentsByTime(appointments);

    // Business rule: Add metadata for each appointment
    const appointmentsWithMetadata = this.addMetadata(sortedAppointments);

    // Business rule: Check for conflicts
    const appointmentsWithConflicts = this.detectConflicts(appointmentsWithMetadata);

    return appointmentsWithConflicts;
  }

  /**
   * Business rule: Determine date range based on view type
   */
  private getDateRangeForView(
    viewType?: 'day' | 'week' | 'month',
    requestStartDate?: Date,
    requestEndDate?: Date
  ): { startDate: Date; endDate: Date } {
    // If explicit dates provided, use them
    if (requestStartDate && requestEndDate) {
      return { startDate: requestStartDate, endDate: requestEndDate };
    }

    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    switch (viewType) {
      case 'day':
        // Current day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'week':
        // Current week (Monday to Sunday)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(now.getDate() + daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Default to next 7 days
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * Business rule: Sort appointments by start time
   */
  private sortAppointmentsByTime(appointments: Appointment[]): Appointment[] {
    return appointments.sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
  }

  /**
   * Business rule: Add metadata to appointments
   */
  private addMetadata(appointments: Appointment[]): AppointmentWithMetadata[] {
    return appointments.map(appointment => ({
      appointment,
      isOverdue: appointment.isOverdue(),
      canStart: appointment.canStartConsultation(),
      canCancel: appointment.canBeCancelled(),
      canReschedule: appointment.canBeRescheduled(),
      conflictsWith: []
    }));
  }

  /**
   * Business rule: Detect scheduling conflicts
   */
  private detectConflicts(
    appointments: AppointmentWithMetadata[]
  ): AppointmentWithMetadata[] {
    // Check each appointment against all others for the same professional
    for (let i = 0; i < appointments.length; i++) {
      const current = appointments[i];
      const conflicts: string[] = [];

      for (let j = 0; j < appointments.length; j++) {
        if (i === j) continue;

        const other = appointments[j];
        
        // Check if same professional and time conflict
        if (
          current.appointment.professionalId === other.appointment.professionalId &&
          current.appointment.conflictsWith(
            other.appointment.startTime,
            other.appointment.endTime
          )
        ) {
          conflicts.push(other.appointment.id);
        }
      }

      current.conflictsWith = conflicts;
    }

    return appointments;
  }
}