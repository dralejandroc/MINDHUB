/**
 * CreateConsultationUseCase
 * Application business rules for creating medical consultations
 */

import { Consultation } from '../entities/Consultation';
import { Patient } from '../entities/Patient';
import { PatientRepository } from '../repositories/PatientRepository';
import { ConsultationRepository, CreateConsultationData } from '../repositories/ConsultationRepository';

export interface CreateConsultationRequest {
  patientId: string;
  professionalId: string;
  consultationDate?: Date;
  consultationType: string;
  chiefComplaint?: string;
  linkedAppointmentId?: string;
  clinicId?: string;
  workspaceId?: string;
  autoStartFromAppointment?: boolean;
}

export interface CreateConsultationResponse {
  consultation: Consultation;
  patient: Patient;
  nextSteps: {
    requiresVitalSigns: boolean;
    requiresMentalExam: boolean;
    suggestedDuration: number; // minutes
    followUpRecommended: boolean;
  };
}

export class CreateConsultationUseCase {
  constructor(
    private consultationRepository: ConsultationRepository,
    private patientRepository: PatientRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(request: CreateConsultationRequest): Promise<CreateConsultationResponse> {
    // Business rule: Validate required fields
    this.validateRequiredFields(request);

    // Business rule: Validate tenant context
    this.validateTenantContext(request.clinicId, request.workspaceId);

    // Get and validate patient
    const patient = await this.getAndValidatePatient(request.patientId);

    // Business rule: Validate professional can treat this patient
    await this.validateProfessionalPatientRelation(request.professionalId, patient);

    // Business rule: Check for duplicate consultations
    await this.checkDuplicateConsultations(request);

    // Business rule: Determine consultation date
    const consultationDate = this.determineConsultationDate(request.consultationDate);

    // Business rule: Validate consultation date constraints
    this.validateConsultationDate(consultationDate);

    // Business rule: Update patient category based on visit history
    const updatedPatientCategory = await this.updatePatientCategory(patient);

    // Prepare consultation data
    const consultationData: CreateConsultationData = {
      patientId: request.patientId,
      professionalId: request.professionalId,
      consultationDate,
      consultationType: request.consultationType,
      chiefComplaint: request.chiefComplaint,
      linkedAppointmentId: request.linkedAppointmentId,
      clinicId: request.clinicId,
      workspaceId: request.workspaceId
    };

    // Create consultation
    const consultation = await this.consultationRepository.create(consultationData);

    // Business rule: Update appointment status if linked
    if (request.linkedAppointmentId && request.autoStartFromAppointment) {
      await this.updateLinkedAppointmentStatus(request.linkedAppointmentId, consultation.id);
    }

    // Determine next steps based on consultation type and patient profile
    const nextSteps = this.determineNextSteps(consultation, patient);

    // Business rule: Log consultation creation for audit
    await this.logConsultationCreation(consultation, patient, request.professionalId);

    return {
      consultation,
      patient,
      nextSteps
    };
  }

  /**
   * Business rule: Validate required fields
   */
  private validateRequiredFields(request: CreateConsultationRequest): void {
    if (!request.patientId?.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!request.professionalId?.trim()) {
      throw new Error('Professional ID is required');
    }

    if (!request.consultationType?.trim()) {
      throw new Error('Consultation type is required');
    }
  }

  /**
   * Business rule: Validate tenant context
   */
  private validateTenantContext(clinicId?: string, workspaceId?: string): void {
    if (!clinicId && !workspaceId) {
      throw new Error('Consultation must belong to either a clinic or workspace');
    }

    if (clinicId && workspaceId) {
      throw new Error('Consultation cannot belong to both clinic and workspace');
    }
  }

  /**
   * Get and validate patient exists and is active
   */
  private async getAndValidatePatient(patientId: string): Promise<Patient> {
    const patient = await this.patientRepository.findById(patientId);
    
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Business rule: Allow consultations for inactive patients with warning
    if (!patient.isActive) {
      console.warn(`Creating consultation for inactive patient: ${patient.id}`);
    }

    return patient;
  }

  /**
   * Business rule: Validate professional can treat this patient
   */
  private async validateProfessionalPatientRelation(
    professionalId: string,
    patient: Patient
  ): Promise<void> {
    // Business rule: If patient is assigned, only assigned professional can treat
    if (patient.assignedProfessionalId && patient.assignedProfessionalId !== professionalId) {
      // Allow with warning for clinic settings, but log it
      console.warn(`Non-assigned professional ${professionalId} treating assigned patient ${patient.id}`);
    }

    // Business rule: Professional must belong to same tenant as patient
    // TODO: Implement professional-tenant validation
  }

  /**
   * Business rule: Check for duplicate consultations
   */
  private async checkDuplicateConsultations(request: CreateConsultationRequest): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaysConsultations = await this.consultationRepository.findByDateRange(
      startOfDay,
      endOfDay,
      request.professionalId
    );

    // Business rule: Check if patient already has consultation today with same professional
    const duplicateConsultation = todaysConsultations.find(c => 
      c.patientId === request.patientId && 
      c.professionalId === request.professionalId &&
      (c.status === 'draft' || c.status === 'in_progress')
    );

    if (duplicateConsultation) {
      throw new Error('Patient already has an active consultation today with this professional');
    }
  }

  /**
   * Business rule: Determine consultation date
   */
  private determineConsultationDate(requestedDate?: Date): Date {
    if (requestedDate) {
      return requestedDate;
    }
    
    // Default to current date/time
    return new Date();
  }

  /**
   * Business rule: Validate consultation date constraints
   */
  private validateConsultationDate(consultationDate: Date): void {
    const now = new Date();
    const daysDiff = Math.floor((consultationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Business rule: Cannot create consultations too far in the future
    if (daysDiff > 7) {
      throw new Error('Cannot create consultations more than 7 days in the future');
    }

    // Business rule: Cannot create consultations too far in the past
    if (daysDiff < -30) {
      throw new Error('Cannot create consultations more than 30 days in the past');
    }
  }

  /**
   * Business rule: Update patient category based on visit history
   */
  private async updatePatientCategory(patient: Patient): Promise<string> {
    const existingConsultations = await this.consultationRepository.findByPatient(patient.id);
    const completedConsultations = existingConsultations.filter(c => c.status === 'completed');
    
    const isFirstVisit = completedConsultations.length === 0;
    
    return patient.updateCategoryForVisit(isFirstVisit);
  }

  /**
   * Update linked appointment status
   */
  private async updateLinkedAppointmentStatus(
    appointmentId: string,
    consultationId: string
  ): Promise<void> {
    // TODO: Update appointment status to 'in_progress' and link consultation
    console.log(`Linking appointment ${appointmentId} to consultation ${consultationId}`);
  }

  /**
   * Business logic: Determine next steps based on consultation context
   */
  private determineNextSteps(consultation: Consultation, patient: Patient): CreateConsultationResponse['nextSteps'] {
    const requiresVitalSigns = consultation.requiresVitalSigns();
    const requiresMentalExam = consultation.requiresMentalExam();
    
    // Suggested duration based on consultation type and patient complexity
    let suggestedDuration = 30; // Default 30 minutes
    
    switch (consultation.consultationType) {
      case 'general':
        suggestedDuration = patient.isMinor() ? 45 : 30;
        break;
      case 'especialidad':
        suggestedDuration = 60;
        break;
      case 'seguimiento':
        suggestedDuration = 20;
        break;
      case 'urgencia':
        suggestedDuration = 15;
        break;
      case 'telemedicina':
        suggestedDuration = 25;
        break;
    }

    // Adjust duration based on patient complexity
    if (patient.hasChronicConditions() || patient.hasAllergies()) {
      suggestedDuration += 15;
    }

    // Follow-up recommendation
    const followUpRecommended = 
      patient.getRiskLevel() === 'high' ||
      consultation.consultationType === 'especialidad' ||
      patient.hasChronicConditions();

    return {
      requiresVitalSigns,
      requiresMentalExam,
      suggestedDuration,
      followUpRecommended
    };
  }

  /**
   * Log consultation creation for audit
   */
  private async logConsultationCreation(
    consultation: Consultation,
    patient: Patient,
    professionalId: string
  ): Promise<void> {
    // TODO: Implement proper audit logging
    console.log(
      `Consultation created: ${consultation.id} for patient ${patient.getDisplayName()} ` +
      `by professional ${professionalId}`
    );
  }
}