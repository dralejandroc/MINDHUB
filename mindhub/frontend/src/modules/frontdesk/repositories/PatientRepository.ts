/**
 * Patient Repository Interface
 * Data access abstraction for Patient entities in FrontDesk module
 */

import { Patient, PatientStatus } from '../entities/Patient';

export interface PatientSearchFilters {
  clinicId?: string;
  workspaceId?: string;
  status?: PatientStatus;
  includeInactive?: boolean;
  hasSpecialNeeds?: boolean;
  isMinor?: boolean;
  insuranceStatus?: string;
}

export interface PatientRepository {
  /**
   * Find patient by ID
   */
  findById(id: string): Promise<Patient | undefined>;

  /**
   * Search patients by term (name, phone, email, medical record number)
   */
  search(searchTerm: string, filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients by status
   */
  findByStatus(status: PatientStatus, filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients by date range (based on createdAt or updatedAt)
   */
  findByDateRange(
    startDate: Date, 
    endDate: Date, 
    filters?: PatientSearchFilters
  ): Promise<Patient[]>;

  /**
   * Find patients with special needs
   */
  findWithSpecialNeeds(filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find minor patients
   */
  findMinorPatients(filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients with insurance issues
   */
  findWithInsuranceIssues(filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients by phone number
   */
  findByPhoneNumber(phoneNumber: string, filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients by email
   */
  findByEmail(email: string, filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Find patients by medical record number
   */
  findByMedicalRecordNumber(
    medicalRecordNumber: string, 
    filters?: PatientSearchFilters
  ): Promise<Patient | null>;

  /**
   * Get patients currently waiting (checked in)
   */
  findWaitingPatients(filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Get patients with excessive wait times
   */
  findPatientsWithExcessiveWaitTime(
    maxWaitTimeMinutes: number,
    filters?: PatientSearchFilters
  ): Promise<Patient[]>;

  /**
   * Create new patient
   */
  create(patient: Patient): Promise<Patient>;

  /**
   * Update existing patient
   */
  update(patient: Patient): Promise<Patient>;

  /**
   * Delete patient (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if patient exists by medical record number
   */
  existsByMedicalRecordNumber(
    medicalRecordNumber: string,
    excludeId?: string
  ): Promise<boolean>;

  /**
   * Check if patient exists by email
   */
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if patient exists by phone number
   */
  existsByPhoneNumber(phoneNumber: string, excludeId?: string): Promise<boolean>;

  /**
   * Get patient statistics
   */
  getStatistics(filters?: PatientSearchFilters): Promise<{
    totalPatients: number;
    activePatients: number;
    waitingPatients: number;
    minorPatients: number;
    specialNeedsPatients: number;
    averageAge: number;
    insuranceDistribution: { [status: string]: number };
    statusDistribution: { [status: string]: number };
  }>;

  /**
   * Get recent patients (last activity)
   */
  findRecentlyActive(
    limit: number,
    filters?: PatientSearchFilters
  ): Promise<Patient[]>;

  /**
   * Get patients requiring attention (special needs, elderly, etc.)
   */
  findRequiringAttention(filters?: PatientSearchFilters): Promise<Patient[]>;

  /**
   * Bulk update patient status
   */
  bulkUpdateStatus(
    patientIds: string[], 
    status: PatientStatus,
    updatedBy: string,
    reason?: string
  ): Promise<Patient[]>;

  /**
   * Get patient visit history
   */
  getVisitHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    visitCount: number;
    lastVisit: Date | null;
    averageWaitTime: number;
    noShowCount: number;
    completedVisits: number;
  }>;
}