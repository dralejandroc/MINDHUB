/**
 * AppointmentRepository Interface
 * Abstraction for data persistence - Domain doesn't know implementation details
 */

import { Appointment } from '../entities/Appointment';

export interface AppointmentFilters {
  patientId?: string;
  professionalId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  clinicId?: string;
  workspaceId?: string;
}

export interface CreateAppointmentData {
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

export interface UpdateAppointmentData {
  startTime?: Date;
  endTime?: Date;
  status?: string;
  notes?: string;
  internalNotes?: string;
  paymentStatus?: string;
}

/**
 * Repository interface - Domain layer contract
 * Implementations will be in the infrastructure layer
 */
export interface AppointmentRepository {
  // Query methods
  findById(id: string): Promise<Appointment | undefined>;
  findAll(filters?: AppointmentFilters): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date, professionalId?: string): Promise<Appointment[]>;
  findConflicts(startTime: Date, endTime: Date, professionalId: string): Promise<Appointment[]>;
  
  // Command methods
  create(data: CreateAppointmentData): Promise<Appointment>;
  update(id: string, data: UpdateAppointmentData): Promise<Appointment>;
  delete(id: string): Promise<void>;
  
  // Status operations
  confirm(id: string, hasDeposit: boolean): Promise<Appointment>;
  cancel(id: string, reason?: string): Promise<Appointment>;
  markAsNoShow(id: string): Promise<Appointment>;
  startConsultation(id: string, consultationId: string): Promise<Appointment>;
}