/**
 * PatientRepository Interface
 * Abstraction for patient data persistence - Domain doesn't know implementation details
 */

import { Patient } from '../entities/Patient';

export interface PatientFilters {
  name?: string;
  email?: string;
  phone?: string;
  medicalRecordNumber?: string;
  assignedProfessionalId?: string;
  patientCategory?: string;
  isActive?: boolean;
  clinicId?: string;
  workspaceId?: string;
  tags?: string[];
  ageRange?: { min: number; max: number };
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CreatePatientData {
  firstName: string;
  lastName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  curp?: string;
  rfc?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  consentToTreatment: boolean;
  consentToDataProcessing: boolean;
  patientCategory?: string;
  assignedProfessionalId?: string;
  notes?: string;
  tags?: string[];
  maritalStatus?: string;
  occupation?: string;
  educationLevel?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  curp?: string;
  rfc?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  patientCategory?: string;
  assignedProfessionalId?: string;
  notes?: string;
  tags?: string[];
  maritalStatus?: string;
  occupation?: string;
  educationLevel?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  isActive?: boolean;
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newThisMonth: number;
  averageAge: number;
  genderDistribution: { [key: string]: number };
  riskDistribution: { low: number; medium: number; high: number };
}

/**
 * Repository interface - Domain layer contract
 * Implementations will be in the infrastructure layer
 */
export interface PatientRepository {
  // Query methods
  findById(id: string): Promise<Patient | null>;
  findByMedicalRecordNumber(recordNumber: string): Promise<Patient | null>;
  findAll(filters?: PatientFilters): Promise<Patient[]>;
  search(query: string, filters?: PatientFilters): Promise<Patient[]>;
  findByProfessional(professionalId: string): Promise<Patient[]>;
  
  // Command methods
  create(data: CreatePatientData): Promise<Patient>;
  update(id: string, data: UpdatePatientData): Promise<Patient>;
  delete(id: string): Promise<void>;
  archive(id: string): Promise<Patient>;
  restore(id: string): Promise<Patient>;
  
  // Bulk operations
  createMultiple(patients: CreatePatientData[]): Promise<Patient[]>;
  updateMultiple(updates: { id: string; data: UpdatePatientData }[]): Promise<Patient[]>;
  
  // Tag operations
  addTag(id: string, tag: string): Promise<Patient>;
  removeTag(id: string, tag: string): Promise<Patient>;
  findByTags(tags: string[]): Promise<Patient[]>;
  
  // Statistics
  getStats(clinicId?: string, workspaceId?: string): Promise<PatientStats>;
  getRecentPatients(limit: number, clinicId?: string, workspaceId?: string): Promise<Patient[]>;
  
  // Validation
  validateMedicalRecordNumber(recordNumber: string, excludeId?: string): Promise<boolean>;
  validateEmail(email: string, excludeId?: string): Promise<boolean>;
}