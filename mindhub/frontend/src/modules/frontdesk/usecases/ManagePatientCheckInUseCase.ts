/**
 * Manage Patient Check-In Use Case
 * Application business rules for patient check-in operations
 */

import { Patient, PatientStatus, CheckInInfo } from '../entities/Patient';
import { Appointment, AppointmentStatus } from '../entities/Appointment';
import { PatientRepository } from '../repositories/PatientRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';

export interface CheckInPatientRequest {
  patientId: string;
  appointmentId?: string;
  checkedInBy: string;
  arrivalTime?: Date;
  waitingRoomLocation?: string;
  specialNeeds?: string[];
  notes?: string;
  insuranceVerified?: boolean;
  emergencyContactVerified?: boolean;
}

export interface CheckInResult {
  patient: Patient;
  appointment?: Appointment;
  warnings: string[];
  estimatedWaitTime: number;
  queuePosition: number;
  requiresInsuranceVerification: boolean;
  requiresFormUpdate: boolean;
}

export interface PatientSearchRequest {
  searchTerm: string; // name, phone, email, or medical record number
  clinicId?: string;
  workspaceId?: string;
  includeInactive?: boolean;
}

export class ManagePatientCheckInUseCase {
  constructor(
    private patientRepository: PatientRepository,
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Search for patients to check in
   */
  async searchPatients(request: PatientSearchRequest): Promise<Patient[]> {
    this.validateSearchRequest(request);

    try {
      const patients = await this.patientRepository.search(request.searchTerm, {
        clinicId: request.clinicId,
        workspaceId: request.workspaceId,
        includeInactive: request.includeInactive || false
      });

      // Business rule: Sort by relevance and recent activity
      return this.sortPatientsByRelevance(patients, request.searchTerm);

    } catch (error) {
      throw new Error(`Failed to search patients: ${error.message}`);
    }
  }

  /**
   * Get patient appointments for today
   */
  async getTodayAppointments(
    patientId: string,
    clinicId?: string,
    workspaceId?: string
  ): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const appointments = await this.appointmentRepository.findByPatientAndDateRange(
        patientId,
        today,
        tomorrow,
        { clinicId, workspaceId }
      );

      return appointments.sort((a, b) => 
        a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime()
      );

    } catch (error) {
      throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
  }

  /**
   * Check in patient
   */
  async checkInPatient(request: CheckInPatientRequest): Promise<CheckInResult> {
    // Business rule: Validate request
    this.validateCheckInRequest(request);

    try {
      // Get patient
      const patient = await this.patientRepository.findById(request.patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Check if patient can be checked in
      if (!patient.canBeCheckedIn()) {
        throw new Error('Patient cannot be checked in at this time');
      }

      // Get appointment if specified
      let appointment: Appointment | undefined;
      if (request.appointmentId) {
        appointment = await this.appointmentRepository.findById(request.appointmentId);
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Business rule: Validate appointment belongs to patient
        if (appointment.patient.id !== request.patientId) {
          throw new Error('Appointment does not belong to the specified patient');
        }

        // Business rule: Check if appointment can be checked in
        if (!appointment.canBeCheckedIn()) {
          throw new Error('Appointment cannot be checked in at this time');
        }
      }

      // Business rule: Verify insurance and emergency contact if required
      const verificationIssues = await this.checkVerificationRequirements(patient, request);

      // Business rule: Check in patient
      const checkedInPatient = patient.checkIn(
        request.checkedInBy,
        request.waitingRoomLocation,
        request.specialNeeds
      );

      // Business rule: Update appointment if exists
      let updatedAppointment: Appointment | undefined;
      if (appointment) {
        updatedAppointment = appointment.markAsArrived(
          request.arrivalTime || new Date(),
          request.checkedInBy,
          request.waitingRoomLocation
        );
      }

      // Save changes
      const savedPatient = await this.patientRepository.update(checkedInPatient);
      if (updatedAppointment) {
        await this.appointmentRepository.update(updatedAppointment);
      }

      // Business rule: Calculate queue metrics
      const queueMetrics = await this.calculateQueueMetrics(savedPatient);

      // Business rule: Generate warnings
      const warnings = await this.generateCheckInWarnings(savedPatient, updatedAppointment);

      // Business rule: Log check-in for audit
      await this.logCheckIn(savedPatient, updatedAppointment, request);

      return {
        patient: savedPatient,
        appointment: updatedAppointment,
        warnings,
        estimatedWaitTime: queueMetrics.estimatedWaitTime,
        queuePosition: queueMetrics.queuePosition,
        requiresInsuranceVerification: verificationIssues.includesInsurance,
        requiresFormUpdate: verificationIssues.includesFormUpdate
      };

    } catch (error) {
      throw new Error(`Check-in failed: ${error.message}`);
    }
  }

  /**
   * Verify patient information before check-in
   */
  async verifyPatientInfo(
    patientId: string,
    verificationData: {
      phoneNumber?: string;
      email?: string;
      address?: string;
      emergencyContact?: string;
      insurancePolicyNumber?: string;
    }
  ): Promise<{
    isVerified: boolean;
    missingFields: string[];
    outdatedFields: string[];
    suggestions: string[];
  }> {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      const verification = {
        isVerified: true,
        missingFields: [] as string[],
        outdatedFields: [] as string[],
        suggestions: [] as string[]
      };

      // Business rule: Check required fields
      if (!patient.phoneNumber.trim()) {
        verification.missingFields.push('Phone number');
        verification.isVerified = false;
      }

      if (!patient.email.trim()) {
        verification.missingFields.push('Email address');
        verification.isVerified = false;
      }

      if (!patient.emergencyContact.name.trim()) {
        verification.missingFields.push('Emergency contact');
        verification.isVerified = false;
      }

      // Business rule: Check if information is outdated (older than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (patient.updatedAt < oneYearAgo) {
        verification.outdatedFields.push('General patient information');
        verification.suggestions.push('Consider updating patient information');
      }

      // Business rule: Check insurance status
      if (patient.insuranceInfo) {
        if (patient.insuranceInfo.status === 'expired') {
          verification.outdatedFields.push('Insurance information');
          verification.suggestions.push('Insurance policy appears to be expired');
        }

        if (patient.insuranceInfo.expirationDate && 
            patient.insuranceInfo.expirationDate < new Date()) {
          verification.outdatedFields.push('Insurance expiration');
          verification.suggestions.push('Insurance policy has expired');
        }
      } else {
        verification.missingFields.push('Insurance information');
        verification.suggestions.push('No insurance information on file');
      }

      // Business rule: Verify provided data against stored data
      if (verificationData.phoneNumber && 
          patient.phoneNumber !== verificationData.phoneNumber) {
        verification.suggestions.push('Phone number does not match records');
      }

      if (verificationData.email && 
          patient.email.toLowerCase() !== verificationData.email.toLowerCase()) {
        verification.suggestions.push('Email address does not match records');
      }

      return verification;

    } catch (error) {
      throw new Error(`Patient verification failed: ${error.message}`);
    }
  }

  /**
   * Get waiting room status
   */
  async getWaitingRoomStatus(
    clinicId?: string,
    workspaceId?: string
  ): Promise<{
    totalWaiting: number;
    byLocation: { [location: string]: number };
    averageWaitTime: number;
    urgentPatients: number;
    specialNeedsPatients: number;
  }> {
    try {
      const waitingPatients = await this.patientRepository.findByStatus('waiting', {
        clinicId,
        workspaceId
      });

      const now = new Date();
      const waitTimes = waitingPatients
        .filter(patient => patient.checkInInfo)
        .map(patient => {
          const checkInTime = patient.checkInInfo!.checkedInAt;
          return Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
        });

      const byLocation: { [location: string]: number } = {};
      waitingPatients.forEach(patient => {
        const location = patient.checkInInfo?.waitingRoomLocation || 'Unknown';
        byLocation[location] = (byLocation[location] || 0) + 1;
      });

      return {
        totalWaiting: waitingPatients.length,
        byLocation,
        averageWaitTime: waitTimes.length > 0 
          ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
          : 0,
        urgentPatients: waitingPatients.filter(p => p.requiresSpecialAttention()).length,
        specialNeedsPatients: waitingPatients.filter(p => p.hasSpecialNeeds).length
      };

    } catch (error) {
      throw new Error(`Failed to get waiting room status: ${error.message}`);
    }
  }

  // Private validation methods

  /**
   * Business rule: Validate search request
   */
  private validateSearchRequest(request: PatientSearchRequest): void {
    if (!request.searchTerm?.trim()) {
      throw new Error('Search term is required');
    }

    if (request.searchTerm.length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Either clinic ID or workspace ID is required');
    }
  }

  /**
   * Business rule: Validate check-in request
   */
  private validateCheckInRequest(request: CheckInPatientRequest): void {
    if (!request.patientId?.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!request.checkedInBy?.trim()) {
      throw new Error('Check-in user is required');
    }

    if (request.arrivalTime && request.arrivalTime > new Date()) {
      throw new Error('Arrival time cannot be in the future');
    }

    if (request.specialNeeds && request.specialNeeds.length > 10) {
      throw new Error('Too many special needs specified');
    }
  }

  /**
   * Business rule: Sort patients by search relevance
   */
  private sortPatientsByRelevance(patients: Patient[], searchTerm: string): Patient[] {
    const term = searchTerm.toLowerCase();

    return patients.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Exact name matches get highest priority
      if (a.getFullName().toLowerCase().includes(term)) scoreA += 10;
      if (b.getFullName().toLowerCase().includes(term)) scoreB += 10;

      // Medical record number matches get high priority
      if (a.medicalRecordNumber.toLowerCase().includes(term)) scoreA += 8;
      if (b.medicalRecordNumber.toLowerCase().includes(term)) scoreB += 8;

      // Phone number matches
      if (a.phoneNumber.includes(term)) scoreA += 6;
      if (b.phoneNumber.includes(term)) scoreB += 6;

      // Email matches
      if (a.email.toLowerCase().includes(term)) scoreA += 4;
      if (b.email.toLowerCase().includes(term)) scoreB += 4;

      // Recent activity bonus
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (a.updatedAt > weekAgo) scoreA += 2;
      if (b.updatedAt > weekAgo) scoreB += 2;

      return scoreB - scoreA;
    });
  }

  /**
   * Business rule: Check verification requirements
   */
  private async checkVerificationRequirements(
    patient: Patient,
    request: CheckInPatientRequest
  ): Promise<{ includesInsurance: boolean; includesFormUpdate: boolean }> {
    let includesInsurance = false;
    let includesFormUpdate = false;

    // Check insurance verification
    if (!request.insuranceVerified && patient.insuranceInfo) {
      if (patient.insuranceInfo.status === 'expired' || 
          (patient.insuranceInfo.expirationDate && 
           patient.insuranceInfo.expirationDate < new Date())) {
        includesInsurance = true;
      }
    }

    // Check form update requirements
    if (!request.emergencyContactVerified || 
        !patient.emergencyContact.phoneNumber.trim()) {
      includesFormUpdate = true;
    }

    // Check if information is outdated
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (patient.updatedAt < sixMonthsAgo) {
      includesFormUpdate = true;
    }

    return { includesInsurance, includesFormUpdate };
  }

  /**
   * Business rule: Calculate queue metrics
   */
  private async calculateQueueMetrics(patient: Patient): Promise<{
    estimatedWaitTime: number;
    queuePosition: number;
  }> {
    try {
      // Get current waiting patients
      const waitingPatients = await this.patientRepository.findByStatus('waiting', {
        clinicId: patient.clinicId,
        workspaceId: patient.workspaceId
      });

      // Calculate position based on check-in time
      const patientCheckInTime = patient.checkInInfo?.checkedInAt || new Date();
      const position = waitingPatients.filter(p => 
        p.checkInInfo && p.checkInInfo.checkedInAt < patientCheckInTime
      ).length + 1;

      // Estimate wait time (15 minutes per patient average)
      const baseWaitTime = 15;
      const priorityMultiplier = patient.requiresSpecialAttention() ? 0.8 : 1.0;
      const estimatedWaitTime = Math.round((position - 1) * baseWaitTime * priorityMultiplier);

      return {
        estimatedWaitTime,
        queuePosition: position
      };

    } catch (error) {
      console.warn('Failed to calculate queue metrics:', error);
      return {
        estimatedWaitTime: 15,
        queuePosition: 1
      };
    }
  }

  /**
   * Business rule: Generate check-in warnings
   */
  private async generateCheckInWarnings(
    patient: Patient,
    appointment?: Appointment
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Patient-related warnings
    if (patient.requiresSpecialAttention()) {
      warnings.push('Patient requires special attention');
    }

    if (patient.hasSpecialNeeds) {
      warnings.push('Patient has documented special needs');
    }

    if (patient.isMinor) {
      warnings.push('Patient is a minor - ensure guardian is present');
    }

    if (patient.getAge() >= 65) {
      warnings.push('Senior patient - may need additional assistance');
    }

    // Insurance warnings
    if (patient.insuranceInfo?.status === 'expired') {
      warnings.push('Insurance policy appears to be expired');
    }

    // Appointment-related warnings
    if (appointment) {
      if (appointment.isOverdue()) {
        warnings.push('Patient is late for appointment');
      }

      if (appointment.isUrgent()) {
        warnings.push('This is an urgent appointment');
      }
    }

    // Information freshness warnings
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (patient.updatedAt < sixMonthsAgo) {
      warnings.push('Patient information may need updating');
    }

    return warnings;
  }

  /**
   * Business rule: Log check-in for audit
   */
  private async logCheckIn(
    patient: Patient,
    appointment: Appointment | undefined,
    request: CheckInPatientRequest
  ): Promise<void> {
    try {
      const auditLog = {
        action: 'patient_check_in',
        patientId: patient.id,
        patientName: patient.getFullName(),
        appointmentId: appointment?.id,
        checkedInBy: request.checkedInBy,
        checkInTime: new Date(),
        waitingRoomLocation: request.waitingRoomLocation,
        specialNeeds: request.specialNeeds,
        clinicId: patient.clinicId,
        workspaceId: patient.workspaceId
      };

      console.log('Patient check-in logged:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);

    } catch (error) {
      console.warn('Failed to log check-in:', error);
      // Don't fail check-in if logging fails
    }
  }
}