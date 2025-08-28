/**
 * Django Appointment Adapter
 * Implementation of AppointmentRepository using Django REST API
 */

import { 
  Appointment, 
  AppointmentStatus, 
  AppointmentType, 
  AppointmentUrgency,
  Professional,
  AppointmentPatient,
  TimeSlot,
  AppointmentHistory
} from '../entities/Appointment';
import { AppointmentRepository, AppointmentSearchFilters } from '../repositories/AppointmentRepository';

interface DjangoAppointmentResponse {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    date_of_birth: string;
  };
  professional: {
    id: string;
    name: string;
    specialization: string;
    title: string;
  };
  time_slot: {
    start_time: string;
    end_time: string;
    duration: number;
  };
  appointment_type: string;
  status: string;
  urgency: string;
  reason: string;
  notes: string;
  history: {
    status: string;
    timestamp: string;
    changed_by: string;
    reason?: string;
    notes?: string;
  }[];
  is_recurring: boolean;
  recurring_pattern?: string;
  reminder_sent: boolean;
  confirmation_required: boolean;
  estimated_duration: number;
  actual_start_time?: string;
  actual_end_time?: string;
  waiting_room_location?: string;
  special_instructions?: string;
  clinic_id?: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export class DjangoAppointmentAdapter implements AppointmentRepository {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = '/api/agenda/django') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Django API request failed:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  private mapDjangoResponseToAppointment(response: DjangoAppointmentResponse): Appointment {
    return new Appointment(
      response.id,
      {
        id: response.patient.id,
        firstName: response.patient.first_name,
        lastName: response.patient.last_name,
        phoneNumber: response.patient.phone_number,
        email: response.patient.email,
        dateOfBirth: new Date(response.patient.date_of_birth),
      },
      {
        id: response.professional.id,
        name: response.professional.name,
        specialization: response.professional.specialization,
        title: response.professional.title,
      },
      {
        startTime: new Date(response.time_slot.start_time),
        endTime: new Date(response.time_slot.end_time),
        duration: response.time_slot.duration,
      },
      response.appointment_type as AppointmentType,
      response.status as AppointmentStatus,
      response.urgency as AppointmentUrgency,
      response.reason,
      response.notes,
      response.history.map(h => ({
        status: h.status as AppointmentStatus,
        timestamp: new Date(h.timestamp),
        changedBy: h.changed_by,
        reason: h.reason,
        notes: h.notes,
      })),
      response.is_recurring,
      response.recurring_pattern,
      response.reminder_sent,
      response.confirmation_required,
      response.estimated_duration,
      response.actual_start_time ? new Date(response.actual_start_time) : undefined,
      response.actual_end_time ? new Date(response.actual_end_time) : undefined,
      response.waiting_room_location,
      response.special_instructions,
      response.clinic_id,
      response.workspace_id,
      new Date(response.created_at),
      new Date(response.updated_at)
    );
  }

  private mapAppointmentToDjangoRequest(appointment: Appointment): any {
    return {
      id: appointment.id,
      patient_id: appointment.patient.id,
      professional_id: appointment.professional.id,
      time_slot: {
        start_time: appointment.timeSlot.startTime.toISOString(),
        end_time: appointment.timeSlot.endTime.toISOString(),
        duration: appointment.timeSlot.duration,
      },
      appointment_type: appointment.appointmentType,
      status: appointment.status,
      urgency: appointment.urgency,
      reason: appointment.reason,
      notes: appointment.notes,
      is_recurring: appointment.isRecurring,
      recurring_pattern: appointment.recurringPattern,
      reminder_sent: appointment.reminderSent,
      confirmation_required: appointment.confirmationRequired,
      estimated_duration: appointment.estimatedDuration,
      actual_start_time: appointment.actualStartTime?.toISOString(),
      actual_end_time: appointment.actualEndTime?.toISOString(),
      waiting_room_location: appointment.waitingRoomLocation,
      special_instructions: appointment.specialInstructions,
      clinic_id: appointment.clinicId,
      workspace_id: appointment.workspaceId,
    };
  }

  private buildQueryParams(filters?: AppointmentSearchFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
    if (filters.status) params.append('status', filters.status);
    if (filters.appointmentType) params.append('appointment_type', filters.appointmentType);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.professionalId) params.append('professional_id', filters.professionalId);
    if (filters.patientId) params.append('patient_id', filters.patientId);
    if (filters.isRecurring !== undefined) {
      params.append('is_recurring', filters.isRecurring.toString());
    }
    if (filters.includeCompleted !== undefined) {
      params.append('include_completed', filters.includeCompleted.toString());
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  async findById(id: string): Promise<Appointment | undefined> {
    try {
      const response = await this.makeRequest(`/appointments/${id}/`);
      return this.mapDjangoResponseToAppointment(response);
    } catch (error) {
      if (error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('start_date', startDate.toISOString());
    params.append('end_date', endDate.toISOString());

    const response = await this.makeRequest(`/appointments/?${params.toString()}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findByPatient(patientId: string, filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams({ ...filters, patientId });
    const response = await this.makeRequest(`/appointments/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findByPatientAndDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    return this.findByDateRange(startDate, endDate, { ...filters, patientId });
  }

  async findByProfessional(
    professionalId: string,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams({ ...filters, professionalId });
    const response = await this.makeRequest(`/appointments/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findByStatus(
    status: AppointmentStatus,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams({ ...filters, status });
    const response = await this.makeRequest(`/appointments/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findUrgentAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams({ ...filters, urgency: 'urgent' });
    const response = await this.makeRequest(`/appointments/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findOverdueAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/overdue/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findReadyToStart(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/ready-to-start/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findTodayAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay, filters);
  }

  async findUpcomingAppointments(
    hours: number,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.findByDateRange(now, futureTime, filters);
  }

  async findByWaitingRoomLocation(
    location: string,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('waiting_room_location', location);

    const response = await this.makeRequest(`/appointments/?${params.toString()}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findRequiringConfirmation(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('confirmation_required', 'true');

    const response = await this.makeRequest(`/appointments/?${params.toString()}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findNeedingReminders(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/needing-reminders/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findRecurringAppointments(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams({ ...filters, isRecurring: true });
    const response = await this.makeRequest(`/appointments/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const appointmentData = this.mapAppointmentToDjangoRequest(appointment);
    const response = await this.makeRequest('/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return this.mapDjangoResponseToAppointment(response);
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const appointmentData = this.mapAppointmentToDjangoRequest(appointment);
    const response = await this.makeRequest(`/appointments/${appointment.id}/`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
    return this.mapDjangoResponseToAppointment(response);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/appointments/${id}/`, {
      method: 'DELETE',
    });
  }

  async checkConflicts(
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<Appointment[]> {
    const params = new URLSearchParams();
    params.append('professional_id', professionalId);
    params.append('start_time', startTime.toISOString());
    params.append('end_time', endTime.toISOString());
    if (excludeAppointmentId) {
      params.append('exclude_id', excludeAppointmentId);
    }

    const response = await this.makeRequest(`/appointments/check-conflicts/?${params.toString()}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async getStatistics(
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
  }> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('start_date', startDate.toISOString());
    params.append('end_date', endDate.toISOString());

    const response = await this.makeRequest(`/appointments/statistics/?${params.toString()}`);
    return response;
  }

  async getProfessionalLoad(
    professionalId: string,
    date: Date
  ): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    remainingAppointments: number;
    averageAppointmentDuration: number;
    utilizationRate: number;
  }> {
    const params = new URLSearchParams();
    params.append('date', date.toISOString().split('T')[0]);

    const response = await this.makeRequest(
      `/appointments/professional-load/${professionalId}/?${params.toString()}`
    );
    return response;
  }

  async getAnalytics(
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
  }> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('start_date', startDate.toISOString());
    params.append('end_date', endDate.toISOString());

    const response = await this.makeRequest(`/appointments/analytics/?${params.toString()}`);
    
    return {
      peakHours: response.peak_hours,
      waitTimeAnalysis: {
        average: response.wait_time_analysis.average,
        median: response.wait_time_analysis.median,
        percentile95: response.wait_time_analysis.percentile_95,
        byUrgency: response.wait_time_analysis.by_urgency,
      },
      professionalPerformance: response.professional_performance.map((perf: any) => ({
        professionalId: perf.professional_id,
        completionRate: perf.completion_rate,
        averageConsultationTime: perf.average_consultation_time,
        patientSatisfaction: perf.patient_satisfaction,
      })),
      trends: response.trends.map((trend: any) => ({
        date: new Date(trend.date),
        appointments: trend.appointments,
        completions: trend.completions,
        noShows: trend.no_shows,
        cancellations: trend.cancellations,
      })),
    };
  }

  async findAvailableTimeSlots(
    professionalId: string,
    date: Date,
    duration: number,
    filters?: AppointmentSearchFilters
  ): Promise<{
    startTime: Date;
    endTime: Date;
    available: boolean;
  }[]> {
    const params = new URLSearchParams();
    params.append('date', date.toISOString().split('T')[0]);
    params.append('duration', duration.toString());
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const response = await this.makeRequest(
      `/appointments/available-slots/${professionalId}/?${params.toString()}`
    );
    
    return response.slots.map((slot: any) => ({
      startTime: new Date(slot.start_time),
      endTime: new Date(slot.end_time),
      available: slot.available,
    }));
  }

  async getPatientHistory(
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
  }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await this.makeRequest(
      `/appointments/patient-history/${patientId}/?${params.toString()}`
    );

    return {
      appointments: response.appointments.map((item: DjangoAppointmentResponse) => 
        this.mapDjangoResponseToAppointment(item)
      ),
      totalVisits: response.total_visits,
      completedVisits: response.completed_visits,
      noShowCount: response.no_show_count,
      cancelledCount: response.cancelled_count,
      lastVisit: response.last_visit ? new Date(response.last_visit) : null,
      averageWaitTime: response.average_wait_time,
      preferredTimes: response.preferred_times,
      frequentProfessionals: response.frequent_professionals.map((prof: any) => ({
        professionalId: prof.professional_id,
        count: prof.count,
      })),
    };
  }

  async bulkUpdateStatus(
    appointmentIds: string[],
    status: AppointmentStatus,
    updatedBy: string,
    reason?: string
  ): Promise<Appointment[]> {
    const response = await this.makeRequest('/appointments/bulk-update-status/', {
      method: 'POST',
      body: JSON.stringify({
        appointment_ids: appointmentIds,
        status,
        updated_by: updatedBy,
        reason,
      }),
    });

    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async reschedule(
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    rescheduledBy: string,
    reason?: string
  ): Promise<Appointment> {
    const response = await this.makeRequest(`/appointments/${appointmentId}/reschedule/`, {
      method: 'POST',
      body: JSON.stringify({
        new_start_time: newStartTime.toISOString(),
        new_end_time: newEndTime.toISOString(),
        rescheduled_by: rescheduledBy,
        reason,
      }),
    });

    return this.mapDjangoResponseToAppointment(response);
  }

  async bulkCancel(
    appointmentIds: string[],
    cancelledBy: string,
    reason: string
  ): Promise<Appointment[]> {
    const response = await this.makeRequest('/appointments/bulk-cancel/', {
      method: 'POST',
      body: JSON.stringify({
        appointment_ids: appointmentIds,
        cancelled_by: cancelledBy,
        reason,
      }),
    });

    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async findByConfirmationStatus(
    confirmed: boolean,
    filters?: AppointmentSearchFilters
  ): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('confirmed', confirmed.toString());

    const response = await this.makeRequest(`/appointments/?${params.toString()}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async markRemindersAsSent(appointmentIds: string[]): Promise<void> {
    await this.makeRequest('/appointments/mark-reminders-sent/', {
      method: 'POST',
      body: JSON.stringify({
        appointment_ids: appointmentIds,
      }),
    });
  }

  async getAppointmentQueue(
    professionalId: string,
    date: Date
  ): Promise<{
    waiting: Appointment[];
    inProgress: Appointment[];
    completed: Appointment[];
    nextAppointment: Appointment | null;
    estimatedDelay: number;
  }> {
    const params = new URLSearchParams();
    params.append('date', date.toISOString().split('T')[0]);

    const response = await this.makeRequest(
      `/appointments/queue/${professionalId}/?${params.toString()}`
    );

    return {
      waiting: response.waiting.map((item: DjangoAppointmentResponse) => 
        this.mapDjangoResponseToAppointment(item)
      ),
      inProgress: response.in_progress.map((item: DjangoAppointmentResponse) => 
        this.mapDjangoResponseToAppointment(item)
      ),
      completed: response.completed.map((item: DjangoAppointmentResponse) => 
        this.mapDjangoResponseToAppointment(item)
      ),
      nextAppointment: response.next_appointment 
        ? this.mapDjangoResponseToAppointment(response.next_appointment)
        : null,
      estimatedDelay: response.estimated_delay,
    };
  }

  async getWaitingRoomStatus(filters?: AppointmentSearchFilters): Promise<{
    totalWaiting: number;
    byLocation: { [location: string]: number };
    byUrgency: { [urgency: string]: number };
    averageWaitTime: number;
    longestWaitTime: number;
    urgentWaiting: number;
  }> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/waiting-room-status/${queryParams}`);
    return {
      totalWaiting: response.total_waiting,
      byLocation: response.by_location,
      byUrgency: response.by_urgency,
      averageWaitTime: response.average_wait_time,
      longestWaitTime: response.longest_wait_time,
      urgentWaiting: response.urgent_waiting,
    };
  }

  async findRequiringFollowUp(filters?: AppointmentSearchFilters): Promise<Appointment[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/requiring-followup/${queryParams}`);
    return response.results.map((item: DjangoAppointmentResponse) => 
      this.mapDjangoResponseToAppointment(item)
    );
  }

  async getNoShowPatterns(filters?: AppointmentSearchFilters): Promise<{
    byDay: { [day: string]: number };
    byTime: { [hour: string]: number };
    byPatient: { patientId: string; count: number }[];
    seasonalTrends: { month: number; count: number }[];
  }> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/appointments/no-show-patterns/${queryParams}`);
    return {
      byDay: response.by_day,
      byTime: response.by_time,
      byPatient: response.by_patient.map((patient: any) => ({
        patientId: patient.patient_id,
        count: patient.count,
      })),
      seasonalTrends: response.seasonal_trends.map((trend: any) => ({
        month: trend.month,
        count: trend.count,
      })),
    };
  }
}