/**
 * DjangoAppointmentRepository
 * Infrastructure adapter that implements the repository interface
 * Connects to Django backend via API
 */

import { 
  AppointmentRepository, 
  AppointmentFilters, 
  CreateAppointmentData, 
  UpdateAppointmentData 
} from '../repositories/AppointmentRepository';
import { 
  Appointment, 
  AppointmentStatus, 
  ConsultationType, 
  PaymentStatus 
} from '../entities/Appointment';
import { authGet, authPost, authPut, authDelete } from '@/lib/api/auth-fetch';

export class DjangoAppointmentRepository implements AppointmentRepository {
  private baseUrl = '/api/expedix/agenda/appointments';

  /**
   * Transform Django API response to domain entity
   */
  private toDomainEntity(data: any): Appointment {
    // Safely parse dates with timezone handling
    const createDateTime = (dateStr: string, timeStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    };

    const startTime = createDateTime(
      data.appointment_date || data.date,
      data.start_time || '00:00'
    );

    const endTime = createDateTime(
      data.appointment_date || data.date,
      data.end_time || '01:00'
    );

    return new Appointment(
      data.id,
      data.patient_id,
      data.professional_id,
      startTime,
      endTime,
      data.appointment_type || 'Consulta',
      (data.status || 'scheduled') as AppointmentStatus,
      (data.consultation_type || 'presencial') as ConsultationType,
      (data.payment_status || 'pending') as PaymentStatus,
      data.has_deposit || false,
      data.notes,
      data.internal_notes,
      data.reason,
      data.location ? {
        id: data.location_id || '',
        name: data.location || '',
        address: data.location_address,
        room: data.location_room
      } : undefined,
      data.clinic_id,
      data.workspace_id,
      data.linked_consultation_id,
      data.created_at ? new Date(data.created_at) : undefined,
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  /**
   * Transform domain entity to API request format
   */
  private toApiFormat(appointment: Appointment | CreateAppointmentData | UpdateAppointmentData): any {
    const data: any = {};

    if ('patientId' in appointment) {
      // CreateAppointmentData
      data.patient_id = appointment.patientId;
      data.professional_id = appointment.professionalId;
      data.appointment_date = appointment.startTime.toISOString().split('T')[0];
      data.start_time = appointment.startTime.toTimeString().slice(0, 5);
      data.end_time = appointment.endTime.toTimeString().slice(0, 5);
      data.appointment_type = appointment.type;
      data.consultation_type = appointment.consultationType;
      data.reason = appointment.reason;
      data.notes = appointment.notes;
      data.clinic_id = appointment.clinicId;
      data.workspace_id = appointment.workspaceId;
    } else if ('startTime' in appointment && appointment.startTime) {
      // UpdateAppointmentData with time change
      data.appointment_date = appointment.startTime.toISOString().split('T')[0];
      data.start_time = appointment.startTime.toTimeString().slice(0, 5);
      if (appointment.endTime) {
        data.end_time = appointment.endTime.toTimeString().slice(0, 5);
      }
      if (appointment.status) data.status = appointment.status;
      if (appointment.notes) data.notes = appointment.notes;
      if (appointment.internalNotes) data.internal_notes = appointment.internalNotes;
      if (appointment.paymentStatus) data.payment_status = appointment.paymentStatus;
    } else {
      // UpdateAppointmentData without time change
      if ('status' in appointment && appointment.status) data.status = appointment.status;
      if ('notes' in appointment && appointment.notes) data.notes = appointment.notes;
      if ('internalNotes' in appointment && appointment.internalNotes) {
        data.internal_notes = appointment.internalNotes;
      }
      if ('paymentStatus' in appointment && appointment.paymentStatus) {
        data.payment_status = appointment.paymentStatus;
      }
    }

    return data;
  }

  async findById(id: string): Promise<Appointment | undefined> {
    try {
      const response = await authGet(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) return undefined;
        throw new Error(`Failed to fetch appointment: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error fetching appointment by ID:', error);
      throw error;
    }
  }

  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.patientId) params.append('patient_id', filters.patientId);
      if (filters?.professionalId) params.append('professional_id', filters.professionalId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
      if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);
      if (filters?.startDate) {
        params.append('start_date', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters?.endDate) {
        params.append('end_date', filters.endDate.toISOString().split('T')[0]);
      }

      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      const response = await authGet(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
      }

      const data = await response.json();
      const appointments = data.data || data.appointments || [];
      
      return appointments.map((apt: any) => this.toDomainEntity(apt));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async findByDateRange(
    startDate: Date, 
    endDate: Date, 
    professionalId?: string
  ): Promise<Appointment[]> {
    return this.findAll({
      startDate,
      endDate,
      professionalId
    });
  }

  async findConflicts(
    startTime: Date, 
    endTime: Date, 
    professionalId: string
  ): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams({
        professional_id: professionalId,
        check_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });

      const response = await authGet(`${this.baseUrl}/conflicts?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to check conflicts: ${response.statusText}`);
      }

      const data = await response.json();
      const conflicts = data.data || data.conflicts || [];
      
      return conflicts.map((apt: any) => this.toDomainEntity(apt));
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }

  async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const response = await authPost(this.baseUrl, this.toApiFormat(data));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create appointment: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}`, this.toApiFormat(data));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update appointment: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await authDelete(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to delete appointment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async confirm(id: string, hasDeposit: boolean): Promise<Appointment> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}/status`, {
        status: 'confirmed',
        has_deposit: hasDeposit
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm appointment: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  }

  async cancel(id: string, reason?: string): Promise<Appointment> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}/status`, {
        status: 'cancelled',
        cancellation_reason: reason
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel appointment: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async markAsNoShow(id: string): Promise<Appointment> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}/status`, {
        status: 'no_show'
      });

      if (!response.ok) {
        throw new Error(`Failed to mark appointment as no-show: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error marking appointment as no-show:', error);
      throw error;
    }
  }

  async startConsultation(id: string, consultationId: string): Promise<Appointment> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}/start-consultation`, {
        consultation_id: consultationId
      });

      if (!response.ok) {
        throw new Error(`Failed to start consultation: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }
  }
}