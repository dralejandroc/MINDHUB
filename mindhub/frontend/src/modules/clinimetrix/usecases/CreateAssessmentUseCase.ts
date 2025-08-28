/**
 * Create Assessment Use Case
 * Application business rules for assessment creation
 */

import { Assessment, AssessmentMode, AssessmentStatus } from '../entities/Assessment';
import { Scale } from '../entities/Scale';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { ScaleRepository } from '../repositories/ScaleRepository';

export interface CreateAssessmentRequest {
  scaleId: string;
  patientId: string;
  administratorId: string;
  mode?: AssessmentMode;
  clinicId?: string;
  workspaceId?: string;
  sessionId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
  };
  metadata?: Record<string, any>;
}

export class CreateAssessmentUseCase {
  constructor(
    private assessmentRepository: AssessmentRepository,
    private scaleRepository: ScaleRepository
  ) {}

  async execute(request: CreateAssessmentRequest): Promise<Assessment> {
    // Business rule: Validate request data
    this.validateRequest(request);

    // Business rule: Verify scale exists and is available
    const scale = await this.scaleRepository.findById(request.scaleId);
    if (!scale) {
      throw new Error('Scale not found');
    }

    if (!scale.isActive) {
      throw new Error('Scale is not currently available for use');
    }

    // Business rule: Check if there are existing incomplete assessments
    await this.checkForExistingAssessments(request.patientId, request.scaleId);

    // Business rule: Validate professional requirements
    await this.validateProfessionalRequirements(scale, request.administratorId, request.mode);

    // Business rule: Check scale appropriateness for patient (if demographic data available)
    await this.validateScaleAppropriateness(scale, request.patientId);

    // Generate unique assessment ID
    const assessmentId = this.generateAssessmentId();

    // Set default mode if not specified
    const mode = request.mode || this.determineDefaultMode(scale);

    // Create assessment entity
    const assessment = new Assessment(
      assessmentId,
      request.scaleId,
      request.patientId,
      request.administratorId,
      mode,
      {}, // empty responses initially
      'draft', // initial status
      1, // start at step 1
      undefined, // no scoring results yet
      undefined, // no validity score yet
      new Date(), // startedAt
      undefined, // not completed yet
      new Date(), // lastActivityAt
      request.metadata || {},
      request.clinicId,
      request.workspaceId,
      request.sessionId,
      request.deviceInfo,
      new Date(), // createdAt
      new Date()  // updatedAt
    );

    // Persist assessment
    const createdAssessment = await this.assessmentRepository.create(assessment);

    // Business rule: Log assessment creation for audit
    await this.logAssessmentCreation(createdAssessment, scale);

    return createdAssessment;
  }

  /**
   * Business rule: Validate request completeness and consistency
   */
  private validateRequest(request: CreateAssessmentRequest): void {
    if (!request.scaleId?.trim()) {
      throw new Error('Scale ID is required');
    }

    if (!request.patientId?.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!request.administratorId?.trim()) {
      throw new Error('Administrator ID is required');
    }

    // Business rule: Must specify either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Assessment must belong to either a clinic or workspace');
    }

    // Business rule: Cannot belong to both clinic and workspace
    if (request.clinicId && request.workspaceId) {
      throw new Error('Assessment cannot belong to both clinic and workspace');
    }

    // Business rule: Validate mode if specified
    if (request.mode && !['professional', 'self_administered', 'remote', 'supervised'].includes(request.mode)) {
      throw new Error('Invalid administration mode');
    }
  }

  /**
   * Business rule: Check for existing incomplete assessments
   */
  private async checkForExistingAssessments(patientId: string, scaleId: string): Promise<void> {
    const existingAssessments = await this.assessmentRepository.findByPatientAndScale(
      patientId, 
      scaleId, 
      { status: ['draft', 'in_progress'] }
    );

    if (existingAssessments.length > 0) {
      const assessment = existingAssessments[0];
      
      // Business rule: Allow new assessment if existing is expired
      if (!assessment.isExpired()) {
        throw new Error(
          `Patient has an incomplete assessment for this scale (ID: ${assessment.id}). ` +
          `Please complete or cancel the existing assessment before creating a new one.`
        );
      }

      // Business rule: Auto-cancel expired assessments
      await this.assessmentRepository.update(assessment.cancel());
    }
  }

  /**
   * Business rule: Validate professional administration requirements
   */
  private async validateProfessionalRequirements(
    scale: Scale, 
    administratorId: string, 
    mode?: AssessmentMode
  ): Promise<void> {
    // If scale requires professional administration
    if (scale.requiresProfessionalAdministration()) {
      if (mode === 'self_administered') {
        throw new Error(
          `Scale "${scale.name}" requires professional administration and cannot be self-administered`
        );
      }

      // TODO: In a real implementation, we would verify the administrator's credentials
      // const administrator = await this.userRepository.findById(administratorId);
      // if (!this.hasRequiredCredentials(administrator, scale.professionalLevel)) {
      //   throw new Error('Administrator does not have required credentials for this scale');
      // }
    }

    // Check difficulty level vs experience
    if (scale.getComplexityScore() > 80) {
      // TODO: Check administrator experience level
      // This would require integration with user management system
      console.warn(`High-complexity scale (${scale.name}) - ensure administrator has appropriate experience`);
    }
  }

  /**
   * Business rule: Validate scale appropriateness for patient
   */
  private async validateScaleAppropriateness(scale: Scale, patientId: string): Promise<void> {
    try {
      // TODO: Get patient demographic data
      // const patient = await this.patientRepository.findById(patientId);
      // const appropriateness = scale.isAppropriateForDemographic({
      //   age: patient.age,
      //   population: patient.population
      // });

      // if (!appropriateness.appropriate) {
      //   throw new Error(`Scale may not be appropriate: ${appropriateness.reasons.join(', ')}`);
      // }

      // For now, just log a warning
      console.info(`Creating assessment with scale: ${scale.name} for patient: ${patientId}`);
      
    } catch (error) {
      // Don't fail assessment creation if patient data is unavailable
      console.warn('Could not validate scale appropriateness - proceeding with assessment creation');
    }
  }

  /**
   * Business rule: Determine default administration mode based on scale characteristics
   */
  private determineDefaultMode(scale: Scale): AssessmentMode {
    if (scale.requiresProfessionalAdministration()) {
      return 'professional';
    }

    if (scale.administrationMode === 'self_administered') {
      return 'self_administered';
    }

    if (scale.getComplexityScore() > 60) {
      return 'supervised';
    }

    return 'self_administered';
  }

  /**
   * Business rule: Log assessment creation for audit trail
   */
  private async logAssessmentCreation(assessment: Assessment, scale: Scale): Promise<void> {
    try {
      // TODO: Implement audit logging
      const auditLog = {
        action: 'assessment_created',
        assessmentId: assessment.id,
        scaleId: scale.id,
        scaleName: scale.name,
        patientId: assessment.patientId,
        administratorId: assessment.administratorId,
        mode: assessment.mode,
        timestamp: new Date(),
        clinicId: assessment.clinicId,
        workspaceId: assessment.workspaceId
      };

      console.log('Assessment created:', auditLog);
      
      // await this.auditRepository.log(auditLog);
    } catch (error) {
      // Don't fail assessment creation if audit logging fails
      console.warn('Failed to log assessment creation:', error);
    }
  }

  /**
   * Generate unique assessment ID
   */
  private generateAssessmentId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}