/**
 * ConsultationRepository Interface
 * Abstraction for consultation data persistence
 */

import { Consultation, VitalSigns, MentalExam, Medication } from '../entities/Consultation';

export interface ConsultationFilters {
  patientId?: string;
  professionalId?: string;
  consultationType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  clinicId?: string;
  workspaceId?: string;
  hasVitalSigns?: boolean;
  hasPrescriptions?: boolean;
  linkedAppointmentId?: string;
}

export interface CreateConsultationData {
  patientId: string;
  professionalId: string;
  consultationDate: Date;
  consultationType: string;
  chiefComplaint?: string;
  linkedAppointmentId?: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface UpdateConsultationData {
  consultationType?: string;
  chiefComplaint?: string;
  historyPresentIllness?: string;
  physicalExamination?: any;
  mentalExam?: MentalExam;
  vitalSigns?: VitalSigns;
  assessment?: string;
  diagnosis?: string;
  diagnosisCodes?: string[];
  plan?: string;
  treatmentPlan?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
  notes?: string;
  clinicalNotes?: string;
  privateNotes?: string;
  durationMinutes?: number;
  status?: string;
}

export interface ConsultationStats {
  totalConsultations: number;
  completedConsultations: number;
  draftConsultations: number;
  averageDuration: number;
  consultationsByType: { [key: string]: number };
  consultationsByMonth: { month: string; count: number }[];
  mostCommonDiagnoses: { diagnosis: string; count: number }[];
}

/**
 * Repository interface for consultation data operations
 */
export interface ConsultationRepository {
  // Query methods
  findById(id: string): Promise<Consultation | null>;
  findAll(filters?: ConsultationFilters): Promise<Consultation[]>;
  findByPatient(patientId: string, limit?: number): Promise<Consultation[]>;
  findByProfessional(professionalId: string, filters?: ConsultationFilters): Promise<Consultation[]>;
  findByDateRange(startDate: Date, endDate: Date, professionalId?: string): Promise<Consultation[]>;
  
  // Command methods
  create(data: CreateConsultationData): Promise<Consultation>;
  update(id: string, data: UpdateConsultationData): Promise<Consultation>;
  delete(id: string): Promise<void>;
  complete(id: string, completedBy: string): Promise<Consultation>;
  
  // Specialized updates
  updateVitalSigns(id: string, vitalSigns: VitalSigns): Promise<Consultation>;
  updateMentalExam(id: string, mentalExam: MentalExam): Promise<Consultation>;
  addMedication(id: string, medication: Medication): Promise<Consultation>;
  removeMedication(id: string, medicationIndex: number): Promise<Consultation>;
  updateMedication(id: string, medicationIndex: number, medication: Medication): Promise<Consultation>;
  
  // Template operations
  saveAsTemplate(id: string, templateName: string): Promise<void>;
  applyTemplate(templateId: string, consultationId: string): Promise<Consultation>;
  
  // Statistics
  getStats(professionalId?: string, clinicId?: string, workspaceId?: string): Promise<ConsultationStats>;
  getRecentConsultations(limit: number, professionalId?: string): Promise<Consultation[]>;
  
  // Search
  search(query: string, filters?: ConsultationFilters): Promise<Consultation[]>;
  searchByDiagnosis(diagnosis: string): Promise<Consultation[]>;
  searchByMedication(medication: string): Promise<Consultation[]>;
}