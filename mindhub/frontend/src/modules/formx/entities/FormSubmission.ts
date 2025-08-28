/**
 * FormSubmission Entity
 * Core business logic for form submissions and responses
 */

export type SubmissionStatus = 'draft' | 'submitted' | 'reviewed' | 'processed' | 'archived';

export interface SubmissionAttachment {
  id: string;
  fieldId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  url?: string;
}

export interface SubmissionSignature {
  fieldId: string;
  signatureData: string; // Base64 encoded signature
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SubmissionMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timeSpent?: number; // seconds
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browserInfo?: string;
  completionPercentage?: number;
  lastSavedAt?: Date;
}

export class FormSubmission {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly submittedBy: string, // User ID or patient ID
    public readonly submitterType: 'patient' | 'professional' | 'admin',
    public readonly data: Record<string, any>,
    public readonly status: SubmissionStatus = 'draft',
    public readonly attachments: SubmissionAttachment[] = [],
    public readonly signatures: SubmissionSignature[] = [],
    public readonly metadata: SubmissionMetadata = {},
    public readonly patientId?: string,
    public readonly assignedBy?: string,
    public readonly assignedAt?: Date,
    public readonly submittedAt?: Date,
    public readonly reviewedBy?: string,
    public readonly reviewedAt?: Date,
    public readonly reviewNotes?: string,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly isAnonymous: boolean = false,
    public readonly expiresAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate submission integrity
   */
  private validate(): void {
    // Business rule: Must have form ID
    if (!this.formId.trim()) {
      throw new Error('Form ID is required');
    }

    // Business rule: Must have submitter
    if (!this.submittedBy.trim()) {
      throw new Error('Submitter ID is required');
    }

    // Business rule: Cannot have both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Submission cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace (unless anonymous)
    if (!this.isAnonymous && !this.clinicId && !this.workspaceId) {
      throw new Error('Non-anonymous submissions must belong to either clinic or workspace');
    }

    // Business rule: Patient submissions must have patient ID
    if (this.submitterType === 'patient' && !this.patientId) {
      throw new Error('Patient submissions must have patient ID');
    }

    // Business rule: Submitted forms must have submission date
    if (this.status !== 'draft' && !this.submittedAt) {
      throw new Error('Non-draft submissions must have submission date');
    }

    // Business rule: Reviewed submissions must have reviewer
    if (this.status === 'reviewed' && !this.reviewedBy) {
      throw new Error('Reviewed submissions must have reviewer ID');
    }

    // Business rule: Check expiration
    if (this.expiresAt && new Date() > this.expiresAt && this.status === 'draft') {
      throw new Error('Draft submission has expired');
    }

    // Business rule: Validate attachment references
    this.attachments.forEach(attachment => {
      if (!attachment.fieldId || !attachment.fileName) {
        throw new Error('Attachments must have field ID and file name');
      }
    });

    // Business rule: Validate signature references
    this.signatures.forEach(signature => {
      if (!signature.fieldId || !signature.signatureData) {
        throw new Error('Signatures must have field ID and signature data');
      }
    });
  }

  /**
   * Business logic: Check if submission can be edited
   */
  canBeEdited(): boolean {
    return this.status === 'draft' && !this.isExpired();
  }

  /**
   * Business logic: Check if submission can be submitted
   */
  canBeSubmitted(): boolean {
    return this.status === 'draft' && !this.isExpired();
  }

  /**
   * Business logic: Check if submission can be reviewed
   */
  canBeReviewed(): boolean {
    return this.status === 'submitted' && this.submitterType === 'patient';
  }

  /**
   * Business logic: Check if submission is expired
   */
  isExpired(): boolean {
    return this.expiresAt !== undefined && new Date() > this.expiresAt;
  }

  /**
   * Business logic: Check if submission is complete based on form requirements
   */
  isComplete(requiredFields: string[]): boolean {
    return requiredFields.every(fieldName => {
      const value = this.data[fieldName];
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  }

  /**
   * Business logic: Get submission duration
   */
  getSubmissionDuration(): number | null {
    if (this.metadata.timeSpent !== undefined) {
      return this.metadata.timeSpent;
    }

    if (this.createdAt && this.submittedAt) {
      return Math.floor((this.submittedAt.getTime() - this.createdAt.getTime()) / 1000);
    }

    return null;
  }

  /**
   * Business logic: Get completion percentage
   */
  getCompletionPercentage(): number {
    return this.metadata.completionPercentage || 0;
  }

  /**
   * Business logic: Check if submission has attachments
   */
  hasAttachments(): boolean {
    return this.attachments.length > 0;
  }

  /**
   * Business logic: Check if submission has signatures
   */
  hasSignatures(): boolean {
    return this.signatures.length > 0;
  }

  /**
   * Business logic: Get attachments for specific field
   */
  getAttachmentsForField(fieldId: string): SubmissionAttachment[] {
    return this.attachments.filter(att => att.fieldId === fieldId);
  }

  /**
   * Business logic: Get signature for specific field
   */
  getSignatureForField(fieldId: string): SubmissionSignature | undefined {
    return this.signatures.find(sig => sig.fieldId === fieldId);
  }

  /**
   * Business logic: Submit the form
   */
  submit(): FormSubmission {
    if (!this.canBeSubmitted()) {
      throw new Error('Submission cannot be submitted in current state');
    }

    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      this.data,
      'submitted',
      this.attachments,
      this.signatures,
      {
        ...this.metadata,
        completionPercentage: 100
      },
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      new Date(),
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Update submission data
   */
  updateData(newData: Record<string, any>): FormSubmission {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit submission in current state');
    }

    const mergedData = { ...this.data, ...newData };

    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      mergedData,
      this.status,
      this.attachments,
      this.signatures,
      {
        ...this.metadata,
        lastSavedAt: new Date()
      },
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      this.submittedAt,
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Add attachment
   */
  addAttachment(attachment: SubmissionAttachment): FormSubmission {
    if (!this.canBeEdited()) {
      throw new Error('Cannot add attachment to submitted form');
    }

    // Business rule: Check for duplicate attachment IDs
    if (this.attachments.some(att => att.id === attachment.id)) {
      throw new Error('Attachment ID already exists');
    }

    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      this.data,
      this.status,
      [...this.attachments, attachment],
      this.signatures,
      this.metadata,
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      this.submittedAt,
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Add signature
   */
  addSignature(signature: SubmissionSignature): FormSubmission {
    if (!this.canBeEdited()) {
      throw new Error('Cannot add signature to submitted form');
    }

    // Business rule: Replace existing signature for same field
    const updatedSignatures = this.signatures.filter(sig => sig.fieldId !== signature.fieldId);
    updatedSignatures.push(signature);

    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      this.data,
      this.status,
      this.attachments,
      updatedSignatures,
      this.metadata,
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      this.submittedAt,
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Review submission
   */
  review(reviewedBy: string, reviewNotes?: string): FormSubmission {
    if (!this.canBeReviewed()) {
      throw new Error('Submission cannot be reviewed in current state');
    }

    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      this.data,
      'reviewed',
      this.attachments,
      this.signatures,
      this.metadata,
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      this.submittedAt,
      reviewedBy,
      new Date(),
      reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Archive submission
   */
  archive(): FormSubmission {
    return new FormSubmission(
      this.id,
      this.formId,
      this.submittedBy,
      this.submitterType,
      this.data,
      'archived',
      this.attachments,
      this.signatures,
      this.metadata,
      this.patientId,
      this.assignedBy,
      this.assignedAt,
      this.submittedAt,
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      this.clinicId,
      this.workspaceId,
      this.isAnonymous,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Get field value with type conversion
   */
  getFieldValue<T = any>(fieldName: string, defaultValue?: T): T {
    const value = this.data[fieldName];
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Business logic: Check if has value for field
   */
  hasValueForField(fieldName: string): boolean {
    const value = this.data[fieldName];
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  /**
   * Business logic: Get submission summary for display
   */
  getSummary(): {
    totalFields: number;
    completedFields: number;
    hasAttachments: boolean;
    hasSignatures: boolean;
    submissionTime: number | null;
    isExpired: boolean;
  } {
    const totalFields = Object.keys(this.data).length;
    const completedFields = Object.values(this.data).filter(value => 
      value !== null && value !== undefined && String(value).trim() !== ''
    ).length;

    return {
      totalFields,
      completedFields,
      hasAttachments: this.hasAttachments(),
      hasSignatures: this.hasSignatures(),
      submissionTime: this.getSubmissionDuration(),
      isExpired: this.isExpired()
    };
  }
}