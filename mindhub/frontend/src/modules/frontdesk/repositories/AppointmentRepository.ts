/**
 * Appointment Repository Interface
 * Data access abstraction for Appointment entities in FrontDesk module
 */

import { Appointment, AppointmentStatus, AppointmentType, AppointmentUrgency } from '../entities/Appointment';

export interface AppointmentSearchFilters {
  clinicId?: string;
  workspaceId?: string;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  urgency?: AppointmentUrgency;
  professionalId?: string;
  patientId?: string;
  isRecurring?: boolean;
  includeCompleted?: boolean;
}

export interface AppointmentRepository {
  /**
   * Find appointment by ID
   */
  findById(id: string): Promise<Appointment | undefined>;

  /**
   * Find appointments by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Find appointments by patient ID
   */
  findByPatient(patientId: string, filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find appointments by patient and date range
   */
  findByPatientAndDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Find appointments by professional
   */
  findByProfessional(
    professionalId: string,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Find appointments by status
   */
  findByStatus(status: AppointmentStatus, filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find urgent appointments
   */
  findUrgentAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find overdue appointments
   */
  findOverdueAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find appointments ready to start
   */
  findReadyToStart(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find today's appointments
   */
  findTodayAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find upcoming appointments (next few hours)
   */
  findUpcomingAppointments(
    hours: number,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Find appointments by waiting room location
   */
  findByWaitingRoomLocation(
    location: string,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Find appointments requiring confirmation
   */
  findRequiringConfirmation(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find appointments needing reminders
   */
  findNeedingReminders(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Find recurring appointments
   */
  findRecurringAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Create new appointment
   */
  create(appointment: Appointment): Promise<Appointment>;

  /**
   * Update existing appointment
   */
  update(appointment: Appointment): Promise<Appointment>;

  /**
   * Delete appointment (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check for appointment conflicts
   */
  checkConflicts(
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<Appointment[]>;

  /**
   * Get appointment statistics for date range
   */
  getStatistics(
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    averageWaitTime: number;
    averageConsultationTime: number;
    statusDistribution: { [status: string]: number };
    typeDistribution: { [type: string]: number };
    urgencyDistribution: { [urgency: string]: number };
    completionRate: number;
    noShowRate: number;
    cancellationRate: number;
  }>;

  /**
   * Get professional appointment load
   */
  getProfessionalLoad(
    professionalId: string,
    date: Date
  ): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    remainingAppointments: number;
    averageAppointmentDuration: number;
    utilizationRate: number;
  }>;

  /**
   * Get appointment analytics
   */
  getAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<{
    peakHours: { hour: number; count: number }[];
    waitTimeAnalysis: {
      average: number;
      median: number;
      percentile95: number;
      byUrgency: { [urgency: string]: number };
    };
    professionalPerformance: {
      professionalId: string;
      completionRate: number;
      averageConsultationTime: number;
      patientSatisfaction: number;
    }[];
    trends: {
      date: Date;
      appointments: number;
      completions: number;
      noShows: number;
      cancellations: number;
    }[];
  }>;

  /**
   * Find available time slots
   */
  findAvailableTimeSlots(
    professionalId: string,
    date: Date,
    duration: number,
    filters?: AppointmentSearchFilters
  ): Promise<{
    startTime: Date;
    endTime: Date;
    available: boolean;
  }[]>;

  /**
   * Get patient appointment history
   */
  getPatientHistory(
    patientId: string,
    limit?: number
  ): Promise<{
    appointments: Appointment[];
    totalVisits: number;
    completedVisits: number;
    noShowCount: number;
    cancelledCount: number;
    lastVisit: Date | null;
    averageWaitTime: number;
    preferredTimes: string[];
    frequentProfessionals: { professionalId: string; count: number }[];
  }>;

  /**
   * Bulk update appointment status
   */
  bulkUpdateStatus(
    appointmentIds: string[],
    status: AppointmentStatus,
    updatedBy: string,
    reason?: string
  ): Promise<Appointment[]>;

  /**
   * Reschedule appointment
   */
  reschedule(
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    rescheduledBy: string,
    reason?: string
  ): Promise<Appointment>;

  /**
   * Cancel multiple appointments
   */
  bulkCancel(
    appointmentIds: string[],
    cancelledBy: string,
    reason: string
  ): Promise<Appointment[]>;

  /**
   * Find appointments by confirmation status
   */
  findByConfirmationStatus(
    confirmed: boolean,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]>;

  /**
   * Mark reminders as sent
   */
  markRemindersAsSent(appointmentIds: string[]): Promise<void>;

  /**
   * Get appointment queue for professional
   */
  getAppointmentQueue(
    professionalId: string,
    date: Date
  ): Promise<{
    waiting: Appointment[];
    inProgress: Appointment[];
    completed: Appointment[];
    nextAppointment: Appointment | null;
    estimatedDelay: number;
  }>;

  /**
   * Get waiting room status
   */
  getWaitingRoomStatus(filters?: AppointmentSearchFilters): Promise<{
    totalWaiting: number;
    byLocation: { [location: string]: number };
    byUrgency: { [urgency: string]: number };
    averageWaitTime: number;
    longestWaitTime: number;
    urgentWaiting: number;
  }>;

  /**
   * Find appointments requiring follow-up
   */
  findRequiringFollowUp(filters?: AppointmentSearchFilters): Promise<Appointment[]>;

  /**
   * Get no-show patterns
   */
  getNoShowPatterns(filters?: AppointmentSearchFilters): Promise<{
    byDay: { [day: string]: number };
    byTime: { [hour: string]: number };
    byPatient: { patientId: string; count: number }[];
    seasonalTrends: { month: number; count: number }[];
  }>;
}