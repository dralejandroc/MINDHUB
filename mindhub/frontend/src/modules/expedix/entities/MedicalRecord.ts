/**
 * MedicalRecord Entity
 * Aggregate root that combines patient data with their medical history
 */

import { Patient } from './Patient';
import { Consultation } from './Consultation';

export interface MedicalHistory {
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  surgicalHistory: string[];
  familyHistory: string[];
  socialHistory: {
    smoking?: 'never' | 'former' | 'current';
    smokingDetails?: string;
    alcohol?: 'never' | 'occasional' | 'regular' | 'heavy';
    alcoholDetails?: string;
    drugs?: 'never' | 'former' | 'current';
    drugDetails?: string;
    exercise?: string;
    diet?: string;
  };
  immunizationHistory: {
    vaccine: string;
    date: Date;
    notes?: string;
  }[];
}

export interface RiskFactors {
  cardiovascular: 'low' | 'medium' | 'high';
  diabetes: 'low' | 'medium' | 'high';
  hypertension: 'low' | 'medium' | 'high';
  mental: 'low' | 'medium' | 'high';
  overall: 'low' | 'medium' | 'high';
  lastAssessment?: Date;
}

export class MedicalRecord {
  constructor(
    public readonly patient: Patient,
    public readonly medicalHistory: MedicalHistory,
    public readonly consultations: Consultation[] = [],
    public readonly riskFactors?: RiskFactors,
    public readonly lastVisitDate?: Date,
    public readonly totalVisits: number = 0,
    public readonly preferredLanguage: string = 'es',
    public readonly specialNotes?: string,
    public readonly alertFlags: string[] = []
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate medical record integrity
   */
  private validate(): void {
    // Business rule: Must have valid patient
    if (!this.patient) {
      throw new Error('Medical record must have a patient');
    }

    // Business rule: Consultations must belong to this patient
    this.consultations.forEach((consultation, index) => {
      if (consultation.patientId !== this.patient.id) {
        throw new Error(`Consultation ${index + 1} does not belong to this patient`);
      }
    });

    // Business rule: Total visits should match consultation count
    const completedConsultations = this.getCompletedConsultations().length;
    if (this.totalVisits < completedConsultations) {
      throw new Error('Total visits cannot be less than completed consultations');
    }
  }

  /**
   * Business logic: Get completed consultations only
   */
  getCompletedConsultations(): Consultation[] {
    return this.consultations.filter(c => c.status === 'completed');
  }

  /**
   * Business logic: Get recent consultations (last N)
   */
  getRecentConsultations(count: number = 5): Consultation[] {
    return this.getCompletedConsultations()
      .sort((a, b) => b.consultationDate.getTime() - a.consultationDate.getTime())
      .slice(0, count);
  }

  /**
   * Business logic: Get consultations by date range
   */
  getConsultationsByDateRange(startDate: Date, endDate: Date): Consultation[] {
    return this.consultations.filter(c => 
      c.consultationDate >= startDate && 
      c.consultationDate <= endDate
    );
  }

  /**
   * Business logic: Check if patient is new (first visit)
   */
  isNewPatient(): boolean {
    return this.totalVisits === 0 || this.getCompletedConsultations().length === 0;
  }

  /**
   * Business logic: Check if patient is regular (has multiple visits)
   */
  isRegularPatient(): boolean {
    return this.totalVisits >= 3;
  }

  /**
   * Business logic: Calculate days since last visit
   */
  getDaysSinceLastVisit(): number | null {
    if (!this.lastVisitDate) return null;
    
    const now = new Date();
    const diffTime = now.getTime() - this.lastVisitDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Business logic: Check if patient needs follow-up
   */
  needsFollowUp(): boolean {
    const daysSinceLastVisit = this.getDaysSinceLastVisit();
    
    // Business rule: High-risk patients need follow-up every 30 days
    if (this.riskFactors?.overall === 'high' && daysSinceLastVisit !== null) {
      return daysSinceLastVisit > 30;
    }
    
    // Business rule: Medium-risk patients need follow-up every 90 days
    if (this.riskFactors?.overall === 'medium' && daysSinceLastVisit !== null) {
      return daysSinceLastVisit > 90;
    }
    
    // Business rule: Check if last consultation has follow-up date
    const lastConsultation = this.getRecentConsultations(1)[0];
    if (lastConsultation?.followUpDate) {
      return new Date() > lastConsultation.followUpDate;
    }
    
    return false;
  }

  /**
   * Business logic: Get all prescribed medications across consultations
   */
  getAllPrescribedMedications(): { name: string; lastPrescribed: Date; frequency: number }[] {
    const medicationMap = new Map<string, { lastPrescribed: Date; frequency: number }>();
    
    this.getCompletedConsultations().forEach(consultation => {
      consultation.getActivePrescriptions().forEach(med => {
        const existing = medicationMap.get(med.name);
        if (existing) {
          existing.frequency++;
          if (consultation.consultationDate > existing.lastPrescribed) {
            existing.lastPrescribed = consultation.consultationDate;
          }
        } else {
          medicationMap.set(med.name, {
            lastPrescribed: consultation.consultationDate,
            frequency: 1
          });
        }
      });
    });
    
    return Array.from(medicationMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Business logic: Get most common diagnoses
   */
  getMostCommonDiagnoses(): { diagnosis: string; frequency: number }[] {
    const diagnosisMap = new Map<string, number>();
    
    this.getCompletedConsultations().forEach(consultation => {
      if (consultation.diagnosis) {
        const count = diagnosisMap.get(consultation.diagnosis) || 0;
        diagnosisMap.set(consultation.diagnosis, count + 1);
      }
      
      consultation.diagnosisCodes.forEach(code => {
        const count = diagnosisMap.get(code) || 0;
        diagnosisMap.set(code, count + 1);
      });
    });
    
    return Array.from(diagnosisMap.entries())
      .map(([diagnosis, frequency]) => ({ diagnosis, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Business logic: Check for drug interactions
   */
  hasPotentialDrugInteractions(): boolean {
    // Get all current medications from patient data and recent prescriptions
    const allMedications = new Set([
      ...this.patient.currentMedications,
      ...this.getRecentConsultations(1)[0]?.getActivePrescriptions().map(m => m.name) || []
    ]);
    
    // Business rule: Flag common dangerous combinations
    const dangerousCombinations = [
      ['warfarin', 'aspirin'],
      ['metformin', 'alcohol'],
      ['lithium', 'nsaid']
    ];
    
    return dangerousCombinations.some(combination => 
      combination.every(med => 
        Array.from(allMedications).some(patientMed => 
          patientMed.toLowerCase().includes(med.toLowerCase())
        )
      )
    );
  }

  /**
   * Business logic: Calculate comprehensive risk score
   */
  calculateRiskScore(): number {
    let score = 0;
    
    // Age factor
    const age = this.patient.getAge();
    if (age !== null) {
      if (age > 65) score += 3;
      else if (age > 50) score += 2;
      else if (age > 35) score += 1;
    }
    
    // Chronic conditions
    score += this.patient.chronicConditions.length * 2;
    
    // Allergies
    score += this.patient.allergies.length;
    
    // Current medications
    score += Math.min(this.patient.currentMedications.length, 5);
    
    // Recent high-risk vital signs
    const recentConsultation = this.getRecentConsultations(1)[0];
    if (recentConsultation?.hasHighRiskVitalSigns()) {
      score += 3;
    }
    
    // Drug interactions
    if (this.hasPotentialDrugInteractions()) {
      score += 4;
    }
    
    return Math.min(score, 20); // Cap at 20
  }

  /**
   * Business logic: Add new consultation
   */
  addConsultation(consultation: Consultation): MedicalRecord {
    // Business rule: Consultation must belong to this patient
    if (consultation.patientId !== this.patient.id) {
      throw new Error('Consultation does not belong to this patient');
    }
    
    const updatedConsultations = [...this.consultations, consultation];
    const newTotalVisits = consultation.status === 'completed' ? this.totalVisits + 1 : this.totalVisits;
    const newLastVisitDate = consultation.status === 'completed' ? consultation.consultationDate : this.lastVisitDate;
    
    return new MedicalRecord(
      this.patient,
      this.medicalHistory,
      updatedConsultations,
      this.riskFactors,
      newLastVisitDate,
      newTotalVisits,
      this.preferredLanguage,
      this.specialNotes,
      this.alertFlags
    );
  }

  /**
   * Business logic: Update risk factors
   */
  updateRiskFactors(riskFactors: RiskFactors): MedicalRecord {
    return new MedicalRecord(
      this.patient,
      this.medicalHistory,
      this.consultations,
      riskFactors,
      this.lastVisitDate,
      this.totalVisits,
      this.preferredLanguage,
      this.specialNotes,
      this.alertFlags
    );
  }

  /**
   * Business logic: Add alert flag
   */
  addAlertFlag(flag: string): MedicalRecord {
    if (this.alertFlags.includes(flag)) {
      return this; // No change if flag already exists
    }
    
    return new MedicalRecord(
      this.patient,
      this.medicalHistory,
      this.consultations,
      this.riskFactors,
      this.lastVisitDate,
      this.totalVisits,
      this.preferredLanguage,
      this.specialNotes,
      [...this.alertFlags, flag]
    );
  }
}