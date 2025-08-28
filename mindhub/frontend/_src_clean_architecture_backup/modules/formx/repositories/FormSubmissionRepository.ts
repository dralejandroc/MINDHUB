/**
 * Form Submission Repository Interface
 * Defines the contract for form submission data operations - Pure abstraction
 */

import { FormSubmission, SubmissionStatus } from '../entities/FormSubmission';

export interface FormSubmissionFilters {
  formId?: string;
  submittedBy?: string;
  submitterType?: 'patient' | 'professional' | 'admin';
  status?: SubmissionStatus;
  patientId?: string;
  assignedBy?: string;
  clinicId?: string;
  workspaceId?: string;
  isAnonymous?: boolean;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  hasSignatures?: boolean;
  isExpired?: boolean;
  searchQuery?: string;
}

export interface FormSubmissionRepository {
  /**
   * Find submission by ID
   */
  findById(id: string): Promise<FormSubmission | null>;

  /**
   * Find all submissions matching filters
   */
  findAll(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Find submissions by form and submitter
   */
  findByFormAndSubmitter(formId: string, submittedBy: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Find submissions by patient
   */
  findByPatient(patientId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Find submissions by professional
   */
  findByProfessional(professionalId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Find submissions by form
   */
  findByForm(formId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Search submissions by content
   */
  search(query: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Create new submission
   */
  create(submission: FormSubmission): Promise<FormSubmission>;

  /**
   * Update existing submission
   */
  update(submission: FormSubmission): Promise<FormSubmission>;

  /**
   * Delete submission (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Archive submission (soft delete)
   */
  archive(id: string): Promise<FormSubmission>;

  /**
   * Restore archived submission
   */
  restore(id: string): Promise<FormSubmission>;

  /**
   * Submit draft (change status to submitted)
   */
  submit(id: string, finalData?: Record<string, any>): Promise<FormSubmission>;

  /**
   * Review submission (change status to reviewed)
   */
  review(id: string, reviewedBy: string, reviewNotes?: string): Promise<FormSubmission>;

  /**
   * Add attachment to submission
   */
  addAttachment(submissionId: string, attachment: any): Promise<FormSubmission>;

  /**
   * Remove attachment from submission
   */
  removeAttachment(submissionId: string, attachmentId: string): Promise<FormSubmission>;

  /**
   * Add signature to submission
   */
  addSignature(submissionId: string, signature: any): Promise<FormSubmission>;

  /**
   * Update submission data (for drafts only)
   */
  updateData(id: string, data: Record<string, any>): Promise<FormSubmission>;

  /**
   * Update submission metadata
   */
  updateMetadata(id: string, metadata: Record<string, any>): Promise<FormSubmission>;

  /**
   * Get submission statistics
   */
  getStats(filters?: FormSubmissionFilters): Promise<{
    totalSubmissions: number;
    completedSubmissions: number;
    draftSubmissions: number;
    reviewedSubmissions: number;
    archivedSubmissions: number;
    averageCompletionTime: number;
    submissionsByStatus: Record<SubmissionStatus, number>;
    submissionsByMonth: Array<{
      month: string;
      count: number;
    }>;
  }>;

  /**
   * Get recent submissions
   */
  getRecentSubmissions(limit?: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions pending review
   */
  getPendingReview(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get expired submissions
   */
  getExpiredSubmissions(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get incomplete submissions (drafts with low completion)
   */
  getIncompleteSubmissions(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions by completion percentage range
   */
  findByCompletionRange(minPercentage: number, maxPercentage: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions with attachments
   */
  findWithAttachments(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions with signatures
   */
  findWithSignatures(filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions by time spent range
   */
  findByTimeSpentRange(minSeconds: number, maxSeconds: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]>;

  /**
   * Get submissions requiring attention (expired drafts, pending review, etc.)
   */
  getRequiringAttention(filters?: FormSubmissionFilters): Promise<{
    expiredDrafts: FormSubmission[];
    pendingReview: FormSubmission[];
    longPendingDrafts: FormSubmission[];
  }>;

  /**
   * Bulk update submissions
   */
  bulkUpdate(submissionIds: string[], updates: Partial<FormSubmission>): Promise<FormSubmission[]>;

  /**
   * Bulk archive submissions
   */
  bulkArchive(submissionIds: string[]): Promise<void>;

  /**
   * Export submissions data
   */
  exportSubmissions(filters?: FormSubmissionFilters, format?: 'json' | 'csv' | 'xlsx'): Promise<{
    data: any[];
    filename: string;
    contentType: string;
  }>;

  /**
   * Get submission completion analytics
   */
  getCompletionAnalytics(filters?: FormSubmissionFilters): Promise<{
    averageCompletionTime: number;
    completionRateByField: Record<string, number>;
    dropOffPoints: Array<{
      fieldName: string;
      dropOffRate: number;
    }>;
    deviceTypeBreakdown: Record<string, number>;
  }>;

  /**
   * Clean up expired drafts
   */
  cleanupExpiredDrafts(): Promise<number>;
}