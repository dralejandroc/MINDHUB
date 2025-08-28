/**
 * Consultation Entity
 * Core business logic for medical consultations - Pure domain model
 */

export type ConsultationType = 'general' | 'especialidad' | 'seguimiento' | 'urgencia' | 'telemedicina';
export type ConsultationStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number; // Celsius
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  glucoseLevel?: number;
  measuredAt?: Date;
  notes?: string;
}

export interface PhysicalExamination {
  general?: string;
  head?: string;
  neck?: string;
  chest?: string;
  heart?: string;
  abdomen?: string;
  extremities?: string;
  neurological?: string;
  skin?: string;
  notes?: string;
}

export interface MentalExam {
  appearance?: string;
  behavior?: string;
  speech?: string;
  mood?: string;
  affect?: string;
  thoughtProcess?: string;
  thoughtContent?: string;
  perceptions?: string;
  cognition?: string;
  insight?: string;
  judgment?: string;
  riskAssessment?: {
    suicideRisk?: 'low' | 'medium' | 'high';
    homicideRisk?: 'low' | 'medium' | 'high';
    notes?: string;
  };
  notes?: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string; // oral, IV, IM, etc.
  instructions: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export class Consultation {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly professionalId: string,
    public readonly consultationDate: Date,
    public readonly consultationType: ConsultationType,
    public readonly status: ConsultationStatus,
    public readonly chiefComplaint?: string,
    public readonly historyPresentIllness?: string,
    public readonly physicalExamination?: PhysicalExamination,
    public readonly mentalExam?: MentalExam,
    public readonly vitalSigns?: VitalSigns,
    public readonly assessment?: string,
    public readonly diagnosis?: string,
    public readonly diagnosisCodes: string[] = [],
    public readonly plan?: string,
    public readonly treatmentPlan?: string,
    public readonly prescriptions: Medication[] = [],
    public readonly followUpDate?: Date,
    public readonly followUpInstructions?: string,
    public readonly notes?: string,
    public readonly clinicalNotes?: string,
    public readonly privateNotes?: string,
    public readonly linkedAppointmentId?: string,
    public readonly isDraft: boolean = true,
    public readonly durationMinutes?: number,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly completedAt?: Date,
    public readonly editedBy?: string
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate consultation integrity
   */
  private validate(): void {
    // Business rule: Must have patient and professional
    if (!this.patientId.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!this.professionalId.trim()) {
      throw new Error('Professional ID is required');
    }

    // Business rule: Consultation date cannot be in future for completed consultations
    if (this.status === 'completed' && this.consultationDate > new Date()) {
      throw new Error('Completed consultations cannot have future date');
    }

    // Business rule: Cannot have both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Consultation cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Consultation must belong to either clinic or workspace');
    }

    // Business rule: Completed consultations must have assessment
    if (this.status === 'completed' && !this.assessment?.trim()) {
      throw new Error('Completed consultations must have assessment');
    }

    // Business rule: Validate vital signs if present
    if (this.vitalSigns) {
      this.validateVitalSigns(this.vitalSigns);
    }

    // Business rule: Validate medications
    this.prescriptions.forEach((medication, index) => {
      if (!medication.name.trim()) {
        throw new Error(`Medication ${index + 1} must have a name`);
      }
      if (!medication.dosage.trim()) {
        throw new Error(`Medication ${index + 1} must have dosage`);
      }
    });
  }

  /**
   * Business rule: Validate vital signs ranges
   */
  private validateVitalSigns(vitals: VitalSigns): void {
    if (vitals.bloodPressureSystolic && (vitals.bloodPressureSystolic < 60 || vitals.bloodPressureSystolic > 250)) {
      throw new Error('Systolic blood pressure must be between 60-250 mmHg');
    }

    if (vitals.bloodPressureDiastolic && (vitals.bloodPressureDiastolic < 40 || vitals.bloodPressureDiastolic > 150)) {
      throw new Error('Diastolic blood pressure must be between 40-150 mmHg');
    }

    if (vitals.heartRate && (vitals.heartRate < 30 || vitals.heartRate > 200)) {
      throw new Error('Heart rate must be between 30-200 bpm');
    }

    if (vitals.temperature && (vitals.temperature < 30 || vitals.temperature > 45)) {
      throw new Error('Temperature must be between 30-45°C');
    }

    if (vitals.oxygenSaturation && (vitals.oxygenSaturation < 50 || vitals.oxygenSaturation > 100)) {
      throw new Error('Oxygen saturation must be between 50-100%');
    }
  }

  /**
   * Business logic: Check if consultation can be edited
   */
  canBeEdited(): boolean {
    return this.status !== 'completed' && this.status !== 'cancelled';
  }

  /**
   * Business logic: Check if consultation can be completed
   */
  canBeCompleted(): boolean {
    return (this.status === 'draft' || this.status === 'in_progress') && 
           this.assessment?.trim() !== undefined;
  }

  /**
   * Business logic: Check if consultation requires vital signs
   */
  requiresVitalSigns(): boolean {
    return this.consultationType !== 'telemedicina';
  }

  /**
   * Business logic: Check if mental exam is required
   */
  requiresMentalExam(): boolean {
    return this.consultationType === 'general' || this.consultationType === 'especialidad';
  }

  /**
   * Business logic: Calculate consultation duration
   */
  getDurationMinutes(): number | null {
    if (this.durationMinutes) {
      return this.durationMinutes;
    }

    if (this.createdAt && this.completedAt) {
      return Math.round((this.completedAt.getTime() - this.createdAt.getTime()) / 60000);
    }

    return null;
  }

  /**
   * Business logic: Get prescription count
   */
  getPrescriptionCount(): number {
    return this.prescriptions.length;
  }

  /**
   * Business logic: Get active prescriptions only
   */
  getActivePrescriptions(): Medication[] {
    return this.prescriptions.filter(med => med.isActive);
  }

  /**
   * Business logic: Check if patient has high-risk vital signs
   */
  hasHighRiskVitalSigns(): boolean {
    if (!this.vitalSigns) return false;

    const vitals = this.vitalSigns;
    
    // High blood pressure
    if ((vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 180) ||
        (vitals.bloodPressureDiastolic && vitals.bloodPressureDiastolic > 110)) {
      return true;
    }

    // Abnormal heart rate
    if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 120)) {
      return true;
    }

    // Fever
    if (vitals.temperature && vitals.temperature > 38.5) {
      return true;
    }

    // Low oxygen saturation
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
      return true;
    }

    return false;
  }

  /**
   * Business logic: Complete consultation
   */
  complete(completedBy: string): Consultation {
    if (!this.canBeCompleted()) {
      throw new Error('Consultation cannot be completed - missing required fields');
    }

    return new Consultation(
      this.id,
      this.patientId,
      this.professionalId,
      this.consultationDate,
      this.consultationType,
      'completed',
      this.chiefComplaint,
      this.historyPresentIllness,
      this.physicalExamination,
      this.mentalExam,
      this.vitalSigns,
      this.assessment,
      this.diagnosis,
      this.diagnosisCodes,
      this.plan,
      this.treatmentPlan,
      this.prescriptions,
      this.followUpDate,
      this.followUpInstructions,
      this.notes,
      this.clinicalNotes,
      this.privateNotes,
      this.linkedAppointmentId,
      false, // Not draft anymore
      this.durationMinutes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date(),
      new Date(),
      completedBy
    );
  }

  /**
   * Business logic: Add medication to prescription
   */
  addMedication(medication: Medication): Consultation {
    // Business rule: Cannot add medications to completed consultations
    if (!this.canBeEdited()) {
      throw new Error('Cannot modify completed consultation');
    }

    // Business rule: No duplicate medications
    const exists = this.prescriptions.some(med => 
      med.name.toLowerCase() === medication.name.toLowerCase()
    );

    if (exists) {
      throw new Error('Medication already prescribed');
    }

    const updatedPrescriptions = [...this.prescriptions, medication];

    return new Consultation(
      this.id,
      this.patientId,
      this.professionalId,
      this.consultationDate,
      this.consultationType,
      this.status,
      this.chiefComplaint,
      this.historyPresentIllness,
      this.physicalExamination,
      this.mentalExam,
      this.vitalSigns,
      this.assessment,
      this.diagnosis,
      this.diagnosisCodes,
      this.plan,
      this.treatmentPlan,
      updatedPrescriptions,
      this.followUpDate,
      this.followUpInstructions,
      this.notes,
      this.clinicalNotes,
      this.privateNotes,
      this.linkedAppointmentId,
      this.isDraft,
      this.durationMinutes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date(),
      this.completedAt,
      this.editedBy
    );
  }

  /**
   * Business logic: Update mental exam
   */
  updateMentalExam(mentalExam: MentalExam): Consultation {
    if (!this.canBeEdited()) {
      throw new Error('Cannot modify completed consultation');
    }

    return new Consultation(
      this.id,
      this.patientId,
      this.professionalId,
      this.consultationDate,
      this.consultationType,
      this.status,
      this.chiefComplaint,
      this.historyPresentIllness,
      this.physicalExamination,
      mentalExam,
      this.vitalSigns,
      this.assessment,
      this.diagnosis,
      this.diagnosisCodes,
      this.plan,
      this.treatmentPlan,
      this.prescriptions,
      this.followUpDate,
      this.followUpInstructions,
      this.notes,
      this.clinicalNotes,
      this.privateNotes,
      this.linkedAppointmentId,
      this.isDraft,
      this.durationMinutes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date(),
      this.completedAt,
      this.editedBy
    );
  }
}