/**
 * Submit Form Use Case
 * Application business rules for form submission completion
 */

import { FormSubmission } from '../entities/FormSubmission';
import { Form } from '../entities/Form';
import { FormRepository } from '../repositories/FormRepository';
import { FormSubmissionRepository } from '../repositories/FormSubmissionRepository';

export interface SubmitFormRequest {
  submissionId: string;
  finalData?: Record<string, any>;
  timeSpent?: number;
  completionPercentage?: number;
}

export class SubmitFormUseCase {
  constructor(
    private formRepository: FormRepository,
    private submissionRepository: FormSubmissionRepository
  ) {}

  async execute(request: SubmitFormRequest): Promise<FormSubmission> {
    // Business rule: Get existing submission
    const submission = await this.submissionRepository.findById(request.submissionId);
    if (!submission) {
      throw new Error('Form submission not found');
    }

    // Business rule: Get form to validate against
    const form = await this.formRepository.findById(submission.formId);
    if (!form) {
      throw new Error('Form not found');
    }

    // Business rule: Check if submission can be submitted
    if (!submission.canBeSubmitted()) {
      throw new Error('Submission cannot be submitted in current state');
    }

    // Business rule: Update data if provided
    let updatedSubmission = submission;
    if (request.finalData) {
      updatedSubmission = submission.updateData(request.finalData);
    }

    // Business rule: Validate form completeness
    this.validateFormCompleteness(form, updatedSubmission);

    // Business rule: Update metadata with submission info
    const finalMetadata = {
      ...updatedSubmission.metadata,
      timeSpent: request.timeSpent || updatedSubmission.metadata.timeSpent,
      completionPercentage: request.completionPercentage || 100
    };

    // Business rule: Submit the form
    const submittedForm = new FormSubmission(
      updatedSubmission.id,
      updatedSubmission.formId,
      updatedSubmission.submittedBy,
      updatedSubmission.submitterType,
      updatedSubmission.data,
      'submitted',
      updatedSubmission.attachments,
      updatedSubmission.signatures,
      finalMetadata,
      updatedSubmission.patientId,
      updatedSubmission.assignedBy,
      updatedSubmission.assignedAt,
      new Date(), // submittedAt
      updatedSubmission.reviewedBy,
      updatedSubmission.reviewedAt,
      updatedSubmission.reviewNotes,
      updatedSubmission.clinicId,
      updatedSubmission.workspaceId,
      updatedSubmission.isAnonymous,
      updatedSubmission.expiresAt,
      updatedSubmission.createdAt,
      new Date() // updatedAt
    );

    // Business rule: Send notifications if configured
    await this.sendNotifications(form, submittedForm);

    // Persist changes
    const savedSubmission = await this.submissionRepository.update(submittedForm);

    return savedSubmission;
  }

  /**
   * Business rule: Validate that all required fields are completed
   */
  private validateFormCompleteness(form: Form, submission: FormSubmission): void {
    // Get visible fields based on current form data
    const visibleFields = form.getVisibleFields(submission.data);
    
    // Get required fields
    const requiredFields = visibleFields.filter(field => field.isRequired(submission.data));
    
    // Check if all required fields are completed
    const errors = form.validateFormData(submission.data);
    
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
        .join('; ');
      
      throw new Error(`Form validation failed: ${errorMessages}`);
    }

    // Business rule: Check for required signatures
    if (form.settings.requireSignature) {
      const signatureFields = visibleFields.filter(field => field.type === 'signature');
      const missingSignatures = signatureFields.filter(field => 
        !submission.getSignatureForField(field.id)
      );

      if (missingSignatures.length > 0) {
        const fieldNames = missingSignatures.map(f => f.label).join(', ');
        throw new Error(`Missing required signatures for: ${fieldNames}`);
      }
    }

    // Business rule: Validate medical scale completeness
    const medicalScaleFields = visibleFields.filter(field => field.type === 'medical_scale');
    medicalScaleFields.forEach(field => {
      const scaleData = submission.data[field.name];
      if (!scaleData || typeof scaleData !== 'object') {
        throw new Error(`Medical scale "${field.label}" is incomplete`);
      }

      // Check if all scale items are answered
      if (field.metadata.requiredItems) {
        const missingItems = field.metadata.requiredItems.filter((item: string) => 
          scaleData[item] === undefined || scaleData[item] === null
        );

        if (missingItems.length > 0) {
          throw new Error(`Medical scale "${field.label}" is missing responses for: ${missingItems.join(', ')}`);
        }
      }
    });
  }

  /**
   * Business rule: Send notifications based on form settings
   */
  private async sendNotifications(form: Form, submission: FormSubmission): Promise<void> {
    const notifications = form.settings.notificationSettings;
    
    if (!notifications) {
      return;
    }

    try {
      // Business rule: Notify form creator if configured
      if (notifications.sendToCreator && form.createdBy) {
        await this.sendCreatorNotification(form, submission);
      }

      // Business rule: Notify patient if configured (and not submitted by patient)
      if (notifications.sendToPatient && 
          submission.patientId && 
          submission.submitterType !== 'patient') {
        await this.sendPatientNotification(form, submission);
      }
    } catch (error) {
      // Business rule: Don't fail submission if notifications fail
      console.error('Failed to send notifications:', error);
    }
  }

  /**
   * Send notification to form creator
   */
  private async sendCreatorNotification(form: Form, submission: FormSubmission): Promise<void> {
    // This would integrate with email service
    console.log(`Notification: Form "${form.name}" submitted by ${submission.submittedBy}`);
    
    // TODO: Implement actual email notification
    // const emailService = container.getEmailService();
    // await emailService.sendFormSubmissionNotification({
    //   to: form.createdBy,
    //   formName: form.name,
    //   submissionId: submission.id,
    //   submittedBy: submission.submittedBy,
    //   submittedAt: new Date()
    // });
  }

  /**
   * Send notification to patient
   */
  private async sendPatientNotification(form: Form, submission: FormSubmission): Promise<void> {
    // This would integrate with email service
    console.log(`Patient notification: Form "${form.name}" submission received`);
    
    // TODO: Implement actual patient notification
    // const emailService = container.getEmailService();
    // await emailService.sendPatientFormCompletionNotification({
    //   patientId: submission.patientId,
    //   formName: form.name,
    //   submissionId: submission.id,
    //   template: form.settings.notificationSettings?.emailTemplate
    // });
  }
}