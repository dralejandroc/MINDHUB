/**
 * Create Form Submission Use Case
 * Application business rules for form submission creation
 */

import { FormSubmission, SubmissionMetadata } from '../entities/FormSubmission';
import { FormRepository } from '../repositories/FormRepository';
import { FormSubmissionRepository } from '../repositories/FormSubmissionRepository';

export interface CreateFormSubmissionRequest {
  formId: string;
  submittedBy: string; // User ID or patient ID
  submitterType: 'patient' | 'professional' | 'admin';
  patientId?: string;
  assignedBy?: string;
  data?: Record<string, any>;
  isAnonymous?: boolean;
  clinicId?: string;
  workspaceId?: string;
  metadata?: SubmissionMetadata;
  expiresAt?: Date;
}

export class CreateFormSubmissionUseCase {
  constructor(
    private formRepository: FormRepository,
    private submissionRepository: FormSubmissionRepository
  ) {}

  async execute(request: CreateFormSubmissionRequest): Promise<FormSubmission> {
    // Business rule: Validate request data
    await this.validateRequest(request);

    // Business rule: Check form exists and can receive submissions
    const form = await this.formRepository.findById(request.formId);
    if (!form) {
      throw new Error('Form not found');
    }

    // Business rule: Form must be published to receive submissions
    if (form.status !== 'published') {
      throw new Error('Cannot create submissions for unpublished forms');
    }

    // Business rule: Check submission limits
    await this.checkSubmissionLimits(form, request.submittedBy);

    // Business rule: Set expiration based on form settings
    const expiresAt = this.calculateExpiration(form, request.expiresAt);

    // Generate unique submission ID
    const submissionId = this.generateSubmissionId();

    // Create submission entity
    const submission = new FormSubmission(
      submissionId,
      request.formId,
      request.submittedBy,
      request.submitterType,
      request.data || {},
      'draft', // All new submissions start as draft
      [], // attachments
      [], // signatures
      {
        sessionId: this.generateSessionId(),
        deviceType: this.detectDeviceType(request.metadata?.userAgent),
        ...request.metadata
      },
      request.patientId,
      request.assignedBy,
      request.assignedBy ? new Date() : undefined,
      undefined, // submittedAt - will be set when submitted
      undefined, // reviewedBy
      undefined, // reviewedAt
      undefined, // reviewNotes
      request.clinicId || form.clinicId,
      request.workspaceId || form.workspaceId,
      request.isAnonymous || false,
      expiresAt,
      new Date(),
      new Date()
    );

    // Persist through repository
    return await this.submissionRepository.create(submission);
  }

  /**
   * Business rule: Validate request completeness and consistency
   */
  private async validateRequest(request: CreateFormSubmissionRequest): Promise<void> {
    if (!request.formId?.trim()) {
      throw new Error('Form ID is required');
    }

    if (!request.submittedBy?.trim()) {
      throw new Error('Submitter ID is required');
    }

    // Business rule: Patient submissions must have patient ID
    if (request.submitterType === 'patient' && !request.patientId) {
      throw new Error('Patient submissions must include patient ID');
    }

    // Business rule: Cannot have both clinic and workspace
    if (request.clinicId && request.workspaceId) {
      throw new Error('Submission cannot belong to both clinic and workspace');
    }

    // Business rule: Non-anonymous submissions must have tenant context
    if (!request.isAnonymous && !request.clinicId && !request.workspaceId) {
      throw new Error('Non-anonymous submissions must belong to either clinic or workspace');
    }

    // Business rule: Professional assignments must specify assigner
    if (request.submitterType === 'patient' && request.patientId && !request.assignedBy) {
      throw new Error('Patient submissions must specify who assigned the form');
    }
  }

  /**
   * Business rule: Check if user can create more submissions for this form
   */
  private async checkSubmissionLimits(form: any, submittedBy: string): Promise<void> {
    // Business rule: Check if multiple submissions are allowed
    if (!form.settings.allowMultipleSubmissions) {
      const existingSubmissions = await this.submissionRepository.findByFormAndSubmitter(
        form.id, 
        submittedBy
      );

      if (existingSubmissions.length > 0) {
        throw new Error('Multiple submissions not allowed for this form');
      }
    }

    // Business rule: Check for active draft submissions
    const activeDrafts = await this.submissionRepository.findByFormAndSubmitter(
      form.id, 
      submittedBy, 
      { status: 'draft', isActive: true }
    );

    if (activeDrafts.length > 0) {
      throw new Error('You already have an active draft for this form. Please complete or delete it first.');
    }
  }

  /**
   * Business rule: Calculate submission expiration
   */
  private calculateExpiration(form: any, requestedExpiration?: Date): Date | undefined {
    if (requestedExpiration) {
      return requestedExpiration;
    }

    if (form.settings.expireAfterDays) {
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + form.settings.expireAfterDays);
      return expiration;
    }

    // Default expiration: 30 days for drafts
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);
    return defaultExpiration;
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' {
    if (!userAgent) return 'desktop';

    const ua = userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Generate unique submission ID
   */
  private generateSubmissionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}