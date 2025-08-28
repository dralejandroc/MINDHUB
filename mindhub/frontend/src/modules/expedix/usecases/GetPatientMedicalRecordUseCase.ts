/**
 * GetPatientMedicalRecordUseCase
 * Application business rules for retrieving complete patient medical records
 */

import { MedicalRecord, MedicalHistory, RiskFactors } from '../entities/MedicalRecord';
import { Patient } from '../entities/Patient';
import { PatientRepository } from '../repositories/PatientRepository';
import { ConsultationRepository } from '../repositories/ConsultationRepository';
import { Consultation } from '../entities/Consultation';

export interface GetPatientMedicalRecordRequest {
  patientId: string;
  includeHistory?: boolean;
  includeRecentConsultations?: number; // Number of recent consultations to include
  calculateRiskFactors?: boolean;
}

export interface PatientMedicalRecordResponse {
  medicalRecord: MedicalRecord;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewSensitiveData: boolean;
    canAccessMentalHealth: boolean;
  };
  metadata: {
    lastAccessed: Date;
    accessedBy: string;
    totalConsultations: number;
    riskScore: number;
  };
}

export class GetPatientMedicalRecordUseCase {
  constructor(
    private patientRepository: PatientRepository,
    private consultationRepository: ConsultationRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    request: GetPatientMedicalRecordRequest,
    currentUserId: string
  ): Promise<PatientMedicalRecordResponse> {
    // Business rule: Validate access permissions
    await this.validateAccessPermissions(request.patientId, currentUserId);

    // Get patient data
    const patient = await this.patientRepository.findById(request.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Business rule: Check if patient is active
    if (!patient.isActive) {
      // Allow access but flag as archived
      console.warn(`Accessing archived patient: ${patient.id}`);
    }

    // Get medical history
    const medicalHistory = await this.buildMedicalHistory(patient);

    // Get consultations if requested
    let consultations: Consultation[] = [];
    if (request.includeRecentConsultations && request.includeRecentConsultations > 0) {
      consultations = await this.consultationRepository.findByPatient(
        request.patientId,
        request.includeRecentConsultations
      );
    }

    // Calculate risk factors if requested
    let riskFactors: RiskFactors | undefined;
    if (request.calculateRiskFactors) {
      riskFactors = await this.calculateRiskFactors(patient, consultations);
    }

    // Get visit statistics
    const allConsultations = await this.consultationRepository.findByPatient(request.patientId);
    const completedConsultations = allConsultations.filter(c => c.status === 'completed');
    
    const lastVisitDate = completedConsultations.length > 0 
      ? new Date(Math.max(...completedConsultations.map(c => c.consultationDate.getTime())))
      : undefined;

    // Create medical record aggregate
    const medicalRecord = new MedicalRecord(
      patient,
      medicalHistory,
      request.includeRecentConsultations ? consultations : [],
      riskFactors,
      lastVisitDate,
      completedConsultations.length,
      'es', // Default language
      await this.getSpecialNotes(patient),
      await this.getAlertFlags(patient, consultations)
    );

    // Determine permissions
    const permissions = await this.determinePermissions(patient, currentUserId);

    // Calculate risk score
    const riskScore = medicalRecord.calculateRiskScore();

    // Business rule: Log access for audit
    await this.logAccess(patient.id, currentUserId, 'view_medical_record');

    return {
      medicalRecord,
      permissions,
      metadata: {
        lastAccessed: new Date(),
        accessedBy: currentUserId,
        totalConsultations: allConsultations.length,
        riskScore
      }
    };
  }

  /**
   * Business rule: Validate user has access to patient records
   */
  private async validateAccessPermissions(
    patientId: string,
    currentUserId: string
  ): Promise<void> {
    // TODO: Implement proper RBAC validation
    // For now, basic validation
    if (!currentUserId) {
      throw new Error('User authentication required');
    }

    // Business rule: Check if user has patient access
    // This would typically check:
    // - User role permissions
    // - Clinic/workspace membership
    // - Patient assignment
    // - Professional license status
  }

  /**
   * Business logic: Build comprehensive medical history
   */
  private async buildMedicalHistory(patient: Patient): Promise<MedicalHistory> {
    // Get all patient consultations for history building
    const allConsultations = await this.consultationRepository.findByPatient(patient.id);
    const completedConsultations = allConsultations.filter(c => c.status === 'completed');

    // Extract surgical history from consultation notes
    const surgicalHistory = this.extractSurgicalHistory(completedConsultations);

    // Extract family history from consultation data
    const familyHistory = this.extractFamilyHistory(completedConsultations);

    // Build social history from consultation patterns
    const socialHistory = this.extractSocialHistory(completedConsultations);

    // Extract immunization history
    const immunizationHistory = this.extractImmunizationHistory(completedConsultations);

    return {
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      currentMedications: patient.currentMedications,
      surgicalHistory,
      familyHistory,
      socialHistory,
      immunizationHistory
    };
  }

  /**
   * Business logic: Calculate comprehensive risk factors
   */
  private async calculateRiskFactors(patient: Patient, consultations: any[]): Promise<RiskFactors> {
    const age = patient.getAge() || 0;
    const hasChronicConditions = patient.hasChronicConditions();
    const recentConsultations = consultations.slice(0, 5);

    // Cardiovascular risk
    let cardiovascular: 'low' | 'medium' | 'high' = 'low';
    if (age > 65 || patient.chronicConditions.some(c => 
      c.toLowerCase().includes('hipertension') || 
      c.toLowerCase().includes('diabetes') ||
      c.toLowerCase().includes('cardiovascular')
    )) {
      cardiovascular = 'high';
    } else if (age > 50 || hasChronicConditions) {
      cardiovascular = 'medium';
    }

    // Diabetes risk
    let diabetes: 'low' | 'medium' | 'high' = 'low';
    if (patient.chronicConditions.some(c => c.toLowerCase().includes('diabetes'))) {
      diabetes = 'high';
    } else if (age > 45 || patient.chronicConditions.some(c => c.toLowerCase().includes('obesidad'))) {
      diabetes = 'medium';
    }

    // Hypertension risk
    let hypertension: 'low' | 'medium' | 'high' = 'low';
    const recentVitals = recentConsultations
      .filter(c => c.vitalSigns)
      .map(c => c.vitalSigns)
      .slice(0, 3);
    
    if (recentVitals.some(v => v.bloodPressureSystolic > 140 || v.bloodPressureDiastolic > 90)) {
      hypertension = 'high';
    } else if (age > 50) {
      hypertension = 'medium';
    }

    // Mental health risk
    let mental: 'low' | 'medium' | 'high' = 'low';
    const hasMentalHealthHistory = recentConsultations.some(c => 
      c.mentalExam && (
        c.mentalExam.riskAssessment?.suicideRisk === 'high' ||
        c.mentalExam.riskAssessment?.suicideRisk === 'medium'
      )
    );
    
    if (hasMentalHealthHistory) {
      mental = 'high';
    }

    // Overall risk (highest of individual risks)
    const risks = [cardiovascular, diabetes, hypertension, mental];
    let overall: 'low' | 'medium' | 'high' = 'low';
    if (risks.includes('high')) overall = 'high';
    else if (risks.includes('medium')) overall = 'medium';

    return {
      cardiovascular,
      diabetes,
      hypertension,
      mental,
      overall,
      lastAssessment: new Date()
    };
  }

  /**
   * Extract surgical history from consultations
   */
  private extractSurgicalHistory(consultations: any[]): string[] {
    const surgeries = new Set<string>();
    
    consultations.forEach(consultation => {
      if (consultation.notes && consultation.notes.toLowerCase().includes('cirug')) {
        // Extract surgical mentions from notes
        const surgicalMentions = consultation.notes.match(/cirug[íi]a[^.]*\./gi) || [];
        surgicalMentions.forEach((mention: string) => surgeries.add(mention));
      }
    });
    
    return Array.from(surgeries);
  }

  /**
   * Extract family history from consultations
   */
  private extractFamilyHistory(consultations: any[]): string[] {
    const familyHistory = new Set<string>();
    
    consultations.forEach(consultation => {
      if (consultation.notes && consultation.notes.toLowerCase().includes('familia')) {
        // Extract family history mentions
        const familyMentions = consultation.notes.match(/historia familiar[^.]*\./gi) || [];
        familyMentions.forEach((mention: string) => familyHistory.add(mention));
      }
    });
    
    return Array.from(familyHistory);
  }

  /**
   * Extract social history from consultations
   */
  private extractSocialHistory(consultations: any[]): MedicalHistory['socialHistory'] {
    // Analyze consultation patterns to infer social history
    return {
      smoking: 'never', // Default, would be determined from consultation data
      alcohol: 'never',
      drugs: 'never',
      exercise: 'Not specified',
      diet: 'Not specified'
    };
  }

  /**
   * Extract immunization history from consultations
   */
  private extractImmunizationHistory(consultations: any[]): { vaccine: string; date: Date; notes?: string }[] {
    const immunizations: { vaccine: string; date: Date; notes?: string }[] = [];
    
    consultations.forEach(consultation => {
      if (consultation.notes && consultation.notes.toLowerCase().includes('vacu')) {
        // Extract vaccination mentions
        immunizations.push({
          vaccine: 'Vaccine mentioned in consultation',
          date: consultation.consultationDate,
          notes: 'Extracted from consultation notes'
        });
      }
    });
    
    return immunizations;
  }

  /**
   * Get special notes for patient
   */
  private async getSpecialNotes(patient: Patient): Promise<string | undefined> {
    if (patient.hasAllergies() || patient.hasChronicConditions()) {
      return `Patient has ${patient.allergies.length} known allergies and ${patient.chronicConditions.length} chronic conditions.`;
    }
    return undefined;
  }

  /**
   * Generate alert flags based on patient data
   */
  private async getAlertFlags(patient: Patient, consultations: any[]): Promise<string[]> {
    const flags: string[] = [];
    
    if (patient.hasAllergies()) {
      flags.push('ALLERGIES');
    }
    
    if (patient.hasChronicConditions()) {
      flags.push('CHRONIC_CONDITIONS');
    }
    
    if (patient.isMinor()) {
      flags.push('MINOR');
    }
    
    const age = patient.getAge();
    if (age !== null && age >= 65) {
      flags.push('ELDERLY');
    }
    
    // Check for high-risk conditions in recent consultations
    if (consultations.some(c => c.hasHighRiskVitalSigns && c.hasHighRiskVitalSigns())) {
      flags.push('HIGH_RISK_VITALS');
    }
    
    return flags;
  }

  /**
   * Determine user permissions for this patient
   */
  private async determinePermissions(
    patient: Patient,
    currentUserId: string
  ): Promise<PatientMedicalRecordResponse['permissions']> {
    // TODO: Implement proper RBAC
    return {
      canView: true,
      canEdit: true,
      canViewSensitiveData: true,
      canAccessMentalHealth: true
    };
  }

  /**
   * Log access for audit purposes
   */
  private async logAccess(patientId: string, userId: string, action: string): Promise<void> {
    // TODO: Implement audit logging
    console.log(`Audit: User ${userId} performed ${action} on patient ${patientId}`);
  }
}