/**
 * Patient Entity for FrontDesk Module
 * Core business logic for patient management at front desk - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type PatientStatus = 'waiting' | 'in_consultation' | 'completed' | 'no_show' | 'cancelled';
export type InsuranceStatus = 'active' | 'expired' | 'pending' | 'none';
export type EmergencyContactRelation = 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'other';

export interface EmergencyContact {
  name: string;
  relation: EmergencyContactRelation;
  phoneNumber: string;
  email?: string;
}

export interface InsuranceInfo {
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  status: InsuranceStatus;
  expirationDate?: Date;
  copayAmount?: number;
}

export interface CheckInInfo {
  checkedInAt: Date;
  checkedInBy: string;
  waitingRoomLocation?: string;
  estimatedWaitTime?: number;
  specialNeeds?: string[];
}

export class Patient {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly dateOfBirth: Date,
    public readonly phoneNumber: string,
    public readonly email: string,
    public readonly medicalRecordNumber: string,
    public readonly status: PatientStatus,
    public readonly address: string,
    public readonly city: string,
    public readonly state: string,
    public readonly zipCode: string,
    public readonly emergencyContact: EmergencyContact,
    public readonly insuranceInfo?: InsuranceInfo,
    public readonly checkInInfo?: CheckInInfo,
    public readonly preferredLanguage: string = 'es',
    public readonly hasSpecialNeeds: boolean = false,
    public readonly isMinor: boolean = false,
    public readonly notes: string = '',
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate patient data
   */
  private validate(): void {
    if (!this.firstName.trim()) {
      throw new Error('Patient first name is required');
    }

    if (!this.lastName.trim()) {
      throw new Error('Patient last name is required');
    }

    if (!this.phoneNumber.trim()) {
      throw new Error('Patient phone number is required');
    }

    if (!this.email.trim() || !this.isValidEmail(this.email)) {
      throw new Error('Valid patient email is required');
    }

    if (!this.medicalRecordNumber.trim()) {
      throw new Error('Medical record number is required');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Patient must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Patient cannot belong to both clinic and workspace');
    }

    // Business rule: Age validation
    if (this.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    const age = this.getAge();
    if (age < 0 || age > 150) {
      throw new Error('Invalid age calculated from date of birth');
    }

    // Business rule: Minor validation
    if (this.isMinor && age >= 18) {
      throw new Error('Patient marked as minor but age is 18 or older');
    }

    if (!this.isMinor && age < 18) {
      throw new Error('Patient not marked as minor but age is under 18');
    }

    // Business rule: Emergency contact validation
    this.validateEmergencyContact();

    // Business rule: Insurance validation if provided
    if (this.insuranceInfo) {
      this.validateInsuranceInfo();
    }
  }

  /**
   * Business rule: Validate emergency contact information
   */
  private validateEmergencyContact(): void {
    if (!this.emergencyContact.name.trim()) {
      throw new Error('Emergency contact name is required');
    }

    if (!this.emergencyContact.phoneNumber.trim()) {
      throw new Error('Emergency contact phone number is required');
    }

    if (this.emergencyContact.email && !this.isValidEmail(this.emergencyContact.email)) {
      throw new Error('Emergency contact email must be valid if provided');
    }
  }

  /**
   * Business rule: Validate insurance information
   */
  private validateInsuranceInfo(): void {
    if (!this.insuranceInfo) return;

    if (!this.insuranceInfo.providerName.trim()) {
      throw new Error('Insurance provider name is required');
    }

    if (!this.insuranceInfo.policyNumber.trim()) {
      throw new Error('Insurance policy number is required');
    }

    if (this.insuranceInfo.expirationDate && this.insuranceInfo.expirationDate < new Date()) {
      console.warn('Insurance policy appears to be expired');
    }

    if (this.insuranceInfo.copayAmount && this.insuranceInfo.copayAmount < 0) {
      throw new Error('Insurance copay amount cannot be negative');
    }
  }

  /**
   * Business logic: Check if patient can be checked in
   */
  canBeCheckedIn(): boolean {
    return this.status === 'waiting' && !this.checkInInfo;
  }

  /**
   * Business logic: Check if patient is currently checked in
   */
  isCheckedIn(): boolean {
    return this.checkInInfo !== undefined && this.status !== 'completed' && this.status !== 'cancelled';
  }

  /**
   * Business logic: Check if patient requires special attention
   */
  requiresSpecialAttention(): boolean {
    return this.hasSpecialNeeds || 
           this.isMinor || 
           this.getAge() >= 65 ||
           (this.insuranceInfo?.status === 'expired') ||
           (this.checkInInfo?.specialNeeds?.length || 0) > 0;
  }

  /**
   * Business logic: Check in patient
   */
  checkIn(
    checkedInBy: string,
    waitingRoomLocation?: string,
    specialNeeds?: string[]
  ): Patient {
    if (!this.canBeCheckedIn()) {
      throw new Error('Patient cannot be checked in at this time');
    }

    const checkInInfo: CheckInInfo = {
      checkedInAt: new Date(),
      checkedInBy,
      waitingRoomLocation,
      specialNeeds: specialNeeds || [],
      estimatedWaitTime: this.calculateEstimatedWaitTime()
    };

    return new Patient(
      this.id,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.phoneNumber,
      this.email,
      this.medicalRecordNumber,
      'waiting',
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.emergencyContact,
      this.insuranceInfo,
      checkInInfo,
      this.preferredLanguage,
      this.hasSpecialNeeds,
      this.isMinor,
      this.notes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Mark patient as in consultation
   */
  startConsultation(professionalId: string): Patient {
    if (!this.isCheckedIn()) {
      throw new Error('Patient must be checked in before starting consultation');
    }

    if (this.status !== 'waiting') {
      throw new Error('Only waiting patients can start consultation');
    }

    return new Patient(
      this.id,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.phoneNumber,
      this.email,
      this.medicalRecordNumber,
      'in_consultation',
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.emergencyContact,
      this.insuranceInfo,
      this.checkInInfo,
      this.preferredLanguage,
      this.hasSpecialNeeds,
      this.isMinor,
      `${this.notes}\nConsultation started with ${professionalId} at ${new Date().toISOString()}`,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Complete patient visit
   */
  completeVisit(completedBy: string, completionNotes?: string): Patient {
    if (this.status !== 'in_consultation') {
      throw new Error('Only patients in consultation can be completed');
    }

    const finalNotes = completionNotes 
      ? `${this.notes}\nVisit completed by ${completedBy} at ${new Date().toISOString()}: ${completionNotes}`
      : `${this.notes}\nVisit completed by ${completedBy} at ${new Date().toISOString()}`;

    return new Patient(
      this.id,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.phoneNumber,
      this.email,
      this.medicalRecordNumber,
      'completed',
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.emergencyContact,
      this.insuranceInfo,
      this.checkInInfo,
      this.preferredLanguage,
      this.hasSpecialNeeds,
      this.isMinor,
      finalNotes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Mark patient as no show
   */
  markAsNoShow(markedBy: string, reason?: string): Patient {
    if (this.status !== 'waiting') {
      throw new Error('Only waiting patients can be marked as no show');
    }

    const noShowNotes = reason 
      ? `${this.notes}\nMarked as no show by ${markedBy} at ${new Date().toISOString()}: ${reason}`
      : `${this.notes}\nMarked as no show by ${markedBy} at ${new Date().toISOString()}`;

    return new Patient(
      this.id,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.phoneNumber,
      this.email,
      this.medicalRecordNumber,
      'no_show',
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.emergencyContact,
      this.insuranceInfo,
      this.checkInInfo,
      this.preferredLanguage,
      this.hasSpecialNeeds,
      this.isMinor,
      noShowNotes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Calculate patient age
   */
  getAge(): number {
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
   * Business logic: Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Business logic: Get waiting time if checked in
   */
  getWaitingTimeMinutes(): number {
    if (!this.checkInInfo) {
      return 0;
    }

    const now = new Date();
    const checkInTime = new Date(this.checkInInfo.checkedInAt);
    return Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
  }

  /**
   * Business logic: Check if patient has been waiting too long
   */
  hasExcessiveWaitTime(): boolean {
    const waitTime = this.getWaitingTimeMinutes();
    const maxWaitTime = this.requiresSpecialAttention() ? 30 : 45; // minutes
    return waitTime > maxWaitTime;
  }

  /**
   * Business logic: Get patient priority score for queue management
   */
  getPriorityScore(): number {
    let score = 0;

    // Age factors
    if (this.getAge() >= 65) score += 3;
    if (this.isMinor) score += 2;

    // Special needs
    if (this.hasSpecialNeeds) score += 3;
    if (this.checkInInfo?.specialNeeds?.length) score += 2;

    // Wait time factor
    const waitTime = this.getWaitingTimeMinutes();
    if (waitTime > 60) score += 4;
    else if (waitTime > 30) score += 2;
    else if (waitTime > 15) score += 1;

    // Insurance status
    if (this.insuranceInfo?.status === 'expired') score += 1;

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Business logic: Calculate estimated wait time
   */
  private calculateEstimatedWaitTime(): number {
    // Basic estimation - in real implementation would use queue analysis
    const baseWaitTime = 15; // 15 minutes base
    const priorityMultiplier = this.requiresSpecialAttention() ? 0.8 : 1.0;
    return Math.round(baseWaitTime * priorityMultiplier);
  }

  /**
   * Utility: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Business logic: Get formatted display info
   */
  getDisplayInfo(): {
    name: string;
    age: number;
    status: string;
    waitTime: number;
    priority: number;
    insuranceStatus: string;
  } {
    return {
      name: this.getFullName(),
      age: this.getAge(),
      status: this.status,
      waitTime: this.getWaitingTimeMinutes(),
      priority: this.getPriorityScore(),
      insuranceStatus: this.insuranceInfo?.status || 'none'
    };
  }
}