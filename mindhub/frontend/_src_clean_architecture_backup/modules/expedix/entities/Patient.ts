/**
 * Patient Entity
 * Core business logic for patient management - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type Gender = 'masculino' | 'femenino' | 'otro' | 'no_especificado';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MaritalStatus = 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
export type PatientCategory = 'primera_vez' | 'subsecuente' | 'seguimiento' | 'urgencia';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface PatientConsent {
  toTreatment: boolean;
  toDataProcessing: boolean;
  consentDate?: Date;
}

export class Patient {
  constructor(
    public readonly id: string,
    public readonly medicalRecordNumber: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly paternalLastName?: string,
    public readonly maternalLastName?: string,
    public readonly dateOfBirth?: Date,
    public readonly gender?: Gender,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly postalCode?: string,
    public readonly country?: string,
    public readonly curp?: string,
    public readonly rfc?: string,
    public readonly bloodType?: BloodType,
    public readonly allergies: string[] = [],
    public readonly chronicConditions: string[] = [],
    public readonly currentMedications: string[] = [],
    public readonly emergencyContact?: EmergencyContact,
    public readonly consent: PatientConsent = { toTreatment: false, toDataProcessing: false },
    public readonly patientCategory: PatientCategory = 'primera_vez',
    public readonly isActive: boolean = true,
    public readonly createdBy: string = '',
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly assignedProfessionalId?: string,
    public readonly notes?: string,
    public readonly tags: string[] = [],
    public readonly maritalStatus?: MaritalStatus,
    public readonly occupation?: string,
    public readonly educationLevel?: string,
    public readonly insuranceProvider?: string,
    public readonly insuranceNumber?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate patient data integrity
   */
  private validate(): void {
    // Business rule: First name is mandatory
    if (!this.firstName.trim()) {
      throw new Error('First name is required');
    }

    // Business rule: Medical record number is mandatory and unique
    if (!this.medicalRecordNumber.trim()) {
      throw new Error('Medical record number is required');
    }

    // Business rule: Cannot have both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Patient cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Patient must belong to either clinic or workspace');
    }

    // Business rule: Valid email format if provided
    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    // Business rule: Age validation if date of birth provided
    if (this.dateOfBirth) {
      const age = this.getAge();
      if (age !== null && age > 150) {
        throw new Error('Invalid date of birth: age cannot exceed 150 years');
      }
    }

    // Business rule: CURP validation for Mexican patients
    if (this.curp && !this.isValidCURP(this.curp)) {
      throw new Error('Invalid CURP format');
    }

    // Business rule: Both treatment and data processing consent required
    if (!this.consent.toTreatment || !this.consent.toDataProcessing) {
      throw new Error('Both treatment and data processing consent are required');
    }
  }

  /**
   * Business logic: Get full name
   */
  getFullName(): string {
    const parts = [
      this.firstName,
      this.paternalLastName,
      this.maternalLastName
    ].filter(Boolean);
    
    return parts.join(' ');
  }

  /**
   * Business logic: Get display name for UI
   */
  getDisplayName(): string {
    if (this.paternalLastName) {
      return `${this.firstName} ${this.paternalLastName}`;
    }
    return this.firstName;
  }

  /**
   * Business logic: Calculate age from date of birth
   */
  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Business logic: Check if patient is a minor
   */
  isMinor(): boolean {
    const age = this.getAge();
    return age !== null && age < 18;
  }

  /**
   * Business logic: Check if patient has allergies
   */
  hasAllergies(): boolean {
    return this.allergies.length > 0;
  }

  /**
   * Business logic: Check if patient has chronic conditions
   */
  hasChronicConditions(): boolean {
    return this.chronicConditions.length > 0;
  }

  /**
   * Business logic: Check if patient is taking medications
   */
  isOnMedications(): boolean {
    return this.currentMedications.length > 0;
  }

  /**
   * Business logic: Get risk level based on conditions and age
   */
  getRiskLevel(): 'low' | 'medium' | 'high' {
    const age = this.getAge();
    const hasChronicConditions = this.hasChronicConditions();
    const hasAllergies = this.hasAllergies();
    
    // High risk: elderly with chronic conditions
    if (age !== null && age >= 65 && hasChronicConditions) {
      return 'high';
    }
    
    // Medium risk: has chronic conditions or allergies, or is elderly
    if (hasChronicConditions || hasAllergies || (age !== null && age >= 60)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Business logic: Check if patient can be archived
   */
  canBeArchived(): boolean {
    // Business rule: Only inactive patients can be archived
    return !this.isActive;
  }

  /**
   * Business logic: Update patient category based on visit history
   */
  updateCategoryForVisit(isFirstVisit: boolean): PatientCategory {
    if (isFirstVisit) {
      return 'primera_vez';
    }
    
    return this.patientCategory === 'primera_vez' ? 'subsecuente' : 'seguimiento';
  }

  /**
   * Business logic: Add allergy with validation
   */
  addAllergy(allergy: string): Patient {
    if (!allergy.trim()) {
      throw new Error('Allergy description cannot be empty');
    }
    
    if (this.allergies.includes(allergy)) {
      throw new Error('Allergy already exists');
    }
    
    const updatedAllergies = [...this.allergies, allergy];
    
    return new Patient(
      this.id,
      this.medicalRecordNumber,
      this.firstName,
      this.lastName,
      this.paternalLastName,
      this.maternalLastName,
      this.dateOfBirth,
      this.gender,
      this.email,
      this.phone,
      this.address,
      this.city,
      this.state,
      this.postalCode,
      this.country,
      this.curp,
      this.rfc,
      this.bloodType,
      updatedAllergies,
      this.chronicConditions,
      this.currentMedications,
      this.emergencyContact,
      this.consent,
      this.patientCategory,
      this.isActive,
      this.createdBy,
      this.clinicId,
      this.workspaceId,
      this.assignedProfessionalId,
      this.notes,
      this.tags,
      this.maritalStatus,
      this.occupation,
      this.educationLevel,
      this.insuranceProvider,
      this.insuranceNumber,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business validation: Check email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Business validation: Check CURP format for Mexican patients
   */
  private isValidCURP(curp: string): boolean {
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    return curpRegex.test(curp.toUpperCase());
  }

  /**
   * Business logic: Archive patient
   */
  archive(): Patient {
    if (!this.canBeArchived()) {
      throw new Error('Cannot archive active patient');
    }
    
    return new Patient(
      this.id,
      this.medicalRecordNumber,
      this.firstName,
      this.lastName,
      this.paternalLastName,
      this.maternalLastName,
      this.dateOfBirth,
      this.gender,
      this.email,
      this.phone,
      this.address,
      this.city,
      this.state,
      this.postalCode,
      this.country,
      this.curp,
      this.rfc,
      this.bloodType,
      this.allergies,
      this.chronicConditions,
      this.currentMedications,
      this.emergencyContact,
      this.consent,
      this.patientCategory,
      false, // Set as inactive/archived
      this.createdBy,
      this.clinicId,
      this.workspaceId,
      this.assignedProfessionalId,
      this.notes,
      this.tags,
      this.maritalStatus,
      this.occupation,
      this.educationLevel,
      this.insuranceProvider,
      this.insuranceNumber,
      this.createdAt,
      new Date()
    );
  }
}