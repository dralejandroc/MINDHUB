/**
 * Assessment Repository Interface
 * Data access contract for assessments - Repository Pattern
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Assessment, AssessmentStatus } from '../entities/Assessment';

export interface AssessmentFilters {
  patientId?: string;
  scaleId?: string;
  administratorId?: string;
  status?: AssessmentStatus | AssessmentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  clinicId?: string;
  workspaceId?: string;
}

export interface AssessmentRepository {
  /**
   * Create new assessment
   */
  create(assessment: Assessment): Promise<Assessment>;

  /**
   * Find assessment by ID
   */
  findById(id: string): Promise<Assessment | undefined>;

  /**
   * Update existing assessment
   */
  update(assessment: Assessment): Promise<Assessment>;

  /**
   * Delete assessment (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Find assessments by patient and scale
   */
  findByPatientAndScale(
    patientId: string,
    scaleId: string,
    filters?: Pick<AssessmentFilters, 'status'>
  ): Promise<Assessment[]>;

  /**
   * Find all assessments with filters
   */
  findAll(filters?: AssessmentFilters): Promise<Assessment[]>;

  /**
   * Find assessments by patient
   */
  findByPatient(patientId: string, filters?: Omit<AssessmentFilters, 'patientId'>): Promise<Assessment[]>;

  /**
   * Find assessments by scale
   */
  findByScale(scaleId: string, filters?: Omit<AssessmentFilters, 'scaleId'>): Promise<Assessment[]>;

  /**
   * Find assessments by administrator
   */
  findByAdministrator(
    administratorId: string,
    filters?: Omit<AssessmentFilters, 'administratorId'>
  ): Promise<Assessment[]>;

  /**
   * Get assessment statistics for patient
   */
  getPatientStats(patientId: string): Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageCompletionRate: number;
    scalesUsed: string[];
  }>;

  /**
   * Get assessment statistics for scale
   */
  getScaleStats(scaleId: string): Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    averageCompletionTime: number;
  }>;

  /**
   * Find expired assessments for cleanup
   */
  findExpired(olderThanDays?: number): Promise<Assessment[]>;

  /**
   * Get recent assessments for dashboard
   */
  getRecent(limit?: number, filters?: AssessmentFilters): Promise<Assessment[]>;

  /**
   * Check for assessment conflicts (same patient, same scale, overlapping time)
   */
  checkForConflicts(
    patientId: string,
    scaleId: string,
    startTime?: Date,
    excludeId?: string
  ): Promise<Assessment[]>;
}