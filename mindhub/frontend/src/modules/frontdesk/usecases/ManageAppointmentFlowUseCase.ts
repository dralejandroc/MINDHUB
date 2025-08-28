/**
 * Manage Appointment Flow Use Case
 * Application business rules for appointment flow in front desk operations
 */

import { Appointment, AppointmentStatus } from '../entities/Appointment';
import { Patient, PatientStatus } from '../entities/Patient';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { PatientRepository } from '../repositories/PatientRepository';

export interface AppointmentFlowRequest {
  appointmentId: string;
  actionBy: string;
  notes?: string;
  actualTime?: Date;
  reason?: string;
}

export interface StartConsultationRequest extends AppointmentFlowRequest {
  consultationRoom?: string;
  estimatedDuration?: number;
}

export interface CompleteAppointmentRequest extends AppointmentFlowRequest {
  actualEndTime?: Date;
  followUpRequired?: boolean;
  followUpDate?: Date;
  prescriptionsGiven?: boolean;
  documentsProvided?: string[];
}

export interface AppointmentFlowResult {
  appointment: Appointment;
  patient: Patient;
  nextActions: string[];
  warnings: string[];
  notifications: {
    type: 'info' | 'warning' | 'success';
    message: string;
    recipient?: string;
  }[];
}

export interface AppointmentDashboard {
  todayAppointments: {
    total: number;
    scheduled: number;
    arrived: number;
    inProgress: number;
    completed: number;
    noShow: number;
    cancelled: number;
  };
  upcomingAppointments: Appointment[];
  overdueAppointments: Appointment[];
  waitingPatients: Appointment[];
  inProgressAppointments: Appointment[];
}

export class ManageAppointmentFlowUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private patientRepository: PatientRepository
  ) {}

  /**
   * Get appointment dashboard for front desk
   */
  async getAppointmentDashboard(
    date: Date = new Date(),
    clinicId?: string,
    workspaceId?: string
  ): Promise<AppointmentDashboard> {
    try {
      // Get today's appointments
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const todayAppointments = await this.appointmentRepository.findByDateRange(
        startOfDay,
        endOfDay,
        { clinicId, workspaceId }
      );

      // Get upcoming appointments (next 2 hours)
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const upcomingAppointments = todayAppointments
        .filter(apt => apt.timeSlot.startTime >= now && apt.timeSlot.startTime <= twoHoursLater)
        .sort((a, b) => a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime())
        .slice(0, 10);

      // Get overdue appointments
      const overdueAppointments = todayAppointments
        .filter(apt => apt.isOverdue())
        .sort((a, b) => a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime());

      // Get waiting patients
      const waitingPatients = todayAppointments
        .filter(apt => apt.status === 'arrived')
        .sort((a, b) => {
          const aArrival = apt => apt.history.find(h => h.status === 'arrived')?.timestamp || apt.timeSlot.startTime;
          const bArrival = apt => apt.history.find(h => h.status === 'arrived')?.timestamp || apt.timeSlot.startTime;
          return aArrival(a).getTime() - aArrival(b).getTime();
        });

      // Get in-progress appointments
      const inProgressAppointments = todayAppointments
        .filter(apt => apt.status === 'in_progress')
        .sort((a, b) => a.actualStartTime!.getTime() - b.actualStartTime!.getTime());

      // Calculate statistics
      const stats = {
        total: todayAppointments.length,
        scheduled: todayAppointments.filter(apt => apt.status === 'scheduled').length,
        arrived: todayAppointments.filter(apt => apt.status === 'arrived').length,
        inProgress: todayAppointments.filter(apt => apt.status === 'in_progress').length,
        completed: todayAppointments.filter(apt => apt.status === 'completed').length,
        noShow: todayAppointments.filter(apt => apt.status === 'no_show').length,
        cancelled: todayAppointments.filter(apt => apt.status === 'cancelled').length
      };

      return {
        todayAppointments: stats,
        upcomingAppointments,
        overdueAppointments,
        waitingPatients,
        inProgressAppointments
      };

    } catch (error) {
      throw new Error(`Failed to get appointment dashboard: ${error.message}`);
    }
  }

  /**
   * Start consultation for appointment
   */
  async startConsultation(request: StartConsultationRequest): Promise<AppointmentFlowResult> {
    // Business rule: Validate request
    this.validateAppointmentFlowRequest(request);

    try {
      // Get appointment
      const appointment = await this.appointmentRepository.findById(request.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get patient
      const patient = await this.patientRepository.findById(appointment.patient.id);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Check if appointment can be started
      if (!appointment.isReadyToStart()) {
        throw new Error('Appointment is not ready to start');
      }

      // Business rule: Start appointment
      const updatedAppointment = appointment.startAppointment(
        request.actionBy,
        request.actualTime
      );

      // Business rule: Update patient status
      const updatedPatient = patient.startConsultation(request.actionBy);

      // Save changes
      await this.appointmentRepository.update(updatedAppointment);
      await this.patientRepository.update(updatedPatient);

      // Business rule: Generate next actions
      const nextActions = this.generateStartConsultationActions(updatedAppointment);

      // Business rule: Generate warnings
      const warnings = await this.generateAppointmentWarnings(updatedAppointment, updatedPatient);

      // Business rule: Generate notifications
      const notifications = await this.generateStartConsultationNotifications(
        updatedAppointment,
        updatedPatient,
        request
      );

      // Business rule: Log consultation start
      await this.logAppointmentFlow('consultation_started', updatedAppointment, request);

      return {
        appointment: updatedAppointment,
        patient: updatedPatient,
        nextActions,
        warnings,
        notifications
      };

    } catch (error) {
      throw new Error(`Failed to start consultation: ${error.message}`);
    }
  }

  /**
   * Complete appointment
   */
  async completeAppointment(request: CompleteAppointmentRequest): Promise<AppointmentFlowResult> {
    // Business rule: Validate request
    this.validateCompleteAppointmentRequest(request);

    try {
      // Get appointment
      const appointment = await this.appointmentRepository.findById(request.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get patient
      const patient = await this.patientRepository.findById(appointment.patient.id);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Complete appointment
      const updatedAppointment = appointment.completeAppointment(
        request.actionBy,
        request.actualEndTime,
        request.notes
      );

      // Business rule: Complete patient visit
      const updatedPatient = patient.completeVisit(request.actionBy, request.notes);

      // Save changes
      await this.appointmentRepository.update(updatedAppointment);
      await this.patientRepository.update(updatedPatient);

      // Business rule: Generate next actions
      const nextActions = this.generateCompleteAppointmentActions(updatedAppointment, request);

      // Business rule: Generate warnings
      const warnings = await this.generateAppointmentWarnings(updatedAppointment, updatedPatient);

      // Business rule: Generate notifications
      const notifications = await this.generateCompleteAppointmentNotifications(
        updatedAppointment,
        updatedPatient,
        request
      );

      // Business rule: Handle follow-up scheduling if required
      if (request.followUpRequired && request.followUpDate) {
        await this.scheduleFollowUpAppointment(
          updatedPatient,
          updatedAppointment,
          request.followUpDate
        );
        nextActions.push('Follow-up appointment scheduled');
      }

      // Business rule: Log appointment completion
      await this.logAppointmentFlow('appointment_completed', updatedAppointment, request);

      return {
        appointment: updatedAppointment,
        patient: updatedPatient,
        nextActions,
        warnings,
        notifications
      };

    } catch (error) {
      throw new Error(`Failed to complete appointment: ${error.message}`);
    }
  }

  /**
   * Mark appointment as no show
   */
  async markAsNoShow(request: AppointmentFlowRequest): Promise<AppointmentFlowResult> {
    // Business rule: Validate request
    this.validateAppointmentFlowRequest(request);

    try {
      // Get appointment
      const appointment = await this.appointmentRepository.findById(request.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get patient
      const patient = await this.patientRepository.findById(appointment.patient.id);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Mark as no show
      const updatedAppointment = appointment.markAsNoShow(
        request.actionBy,
        request.reason,
        request.actualTime
      );

      // Business rule: Update patient status if they were waiting
      let updatedPatient = patient;
      if (patient.status === 'waiting') {
        updatedPatient = patient.markAsNoShow(request.actionBy, request.reason);
      }

      // Save changes
      await this.appointmentRepository.update(updatedAppointment);
      if (updatedPatient !== patient) {
        await this.patientRepository.update(updatedPatient);
      }

      // Business rule: Generate next actions
      const nextActions = this.generateNoShowActions(updatedAppointment, updatedPatient);

      // Business rule: Generate warnings
      const warnings = await this.generateAppointmentWarnings(updatedAppointment, updatedPatient);

      // Business rule: Generate notifications
      const notifications = await this.generateNoShowNotifications(
        updatedAppointment,
        updatedPatient,
        request
      );

      // Business rule: Check for repeat no-shows
      const recentNoShows = await this.getRecentNoShows(updatedPatient.id);
      if (recentNoShows >= 2) {
        warnings.push('Patient has multiple recent no-shows - consider follow-up');
        notifications.push({
          type: 'warning',
          message: `Patient ${updatedPatient.getFullName()} has ${recentNoShows + 1} no-shows in recent history`,
          recipient: 'management'
        });
      }

      // Business rule: Log no-show
      await this.logAppointmentFlow('marked_no_show', updatedAppointment, request);

      return {
        appointment: updatedAppointment,
        patient: updatedPatient,
        nextActions,
        warnings,
        notifications
      };

    } catch (error) {
      throw new Error(`Failed to mark appointment as no show: ${error.message}`);
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(request: AppointmentFlowRequest): Promise<AppointmentFlowResult> {
    // Business rule: Validate request
    this.validateAppointmentFlowRequest(request);

    if (!request.reason?.trim()) {
      throw new Error('Cancellation reason is required');
    }

    try {
      // Get appointment
      const appointment = await this.appointmentRepository.findById(request.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get patient
      const patient = await this.patientRepository.findById(appointment.patient.id);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Cancel appointment
      const updatedAppointment = appointment.cancel(
        request.actionBy,
        request.reason,
        request.actualTime
      );

      // Business rule: Remove patient from waiting if applicable
      let updatedPatient = patient;
      if (patient.status === 'waiting' && patient.isCheckedIn()) {
        // Patient would be removed from queue elsewhere
        updatedPatient = patient; // Status would be updated by queue removal
      }

      // Save changes
      await this.appointmentRepository.update(updatedAppointment);

      // Business rule: Generate next actions
      const nextActions = this.generateCancelAppointmentActions(updatedAppointment, request);

      // Business rule: Generate warnings
      const warnings = await this.generateAppointmentWarnings(updatedAppointment, updatedPatient);

      // Business rule: Generate notifications
      const notifications = await this.generateCancelAppointmentNotifications(
        updatedAppointment,
        updatedPatient,
        request
      );

      // Business rule: Check cancellation timing
      const hoursUntilAppointment = Math.floor(
        (updatedAppointment.timeSlot.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );

      if (hoursUntilAppointment < 24) {
        warnings.push('Late cancellation - less than 24 hours notice');
        notifications.push({
          type: 'info',
          message: 'Consider applying late cancellation policy',
          recipient: 'billing'
        });
      }

      // Business rule: Log cancellation
      await this.logAppointmentFlow('appointment_cancelled', updatedAppointment, request);

      return {
        appointment: updatedAppointment,
        patient: updatedPatient,
        nextActions,
        warnings,
        notifications
      };

    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  }

  /**
   * Get appointment flow history
   */
  async getAppointmentFlowHistory(
    appointmentId: string
  ): Promise<{
    appointment: Appointment;
    flowSteps: {
      step: string;
      timestamp: Date;
      performedBy: string;
      notes?: string;
      duration?: number;
    }[];
  }> {
    try {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Business rule: Build flow steps from appointment history
      const flowSteps = appointment.history.map((historyItem, index) => {
        const step = {
          step: this.getFlowStepDescription(historyItem.status),
          timestamp: historyItem.timestamp,
          performedBy: historyItem.changedBy,
          notes: historyItem.notes
        };

        // Calculate duration for completed steps
        if (index < appointment.history.length - 1) {
          const nextStep = appointment.history[index + 1];
          const duration = Math.round(
            (nextStep.timestamp.getTime() - historyItem.timestamp.getTime()) / (1000 * 60)
          );
          return { ...step, duration };
        }

        return step;
      });

      return {
        appointment,
        flowSteps
      };

    } catch (error) {
      throw new Error(`Failed to get appointment flow history: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Business rule: Validate appointment flow request
   */
  private validateAppointmentFlowRequest(request: AppointmentFlowRequest): void {
    if (!request.appointmentId?.trim()) {
      throw new Error('Appointment ID is required');
    }

    if (!request.actionBy?.trim()) {
      throw new Error('Action performer is required');
    }

    if (request.actualTime && request.actualTime > new Date()) {
      throw new Error('Actual time cannot be in the future');
    }
  }

  /**
   * Business rule: Validate complete appointment request
   */
  private validateCompleteAppointmentRequest(request: CompleteAppointmentRequest): void {
    this.validateAppointmentFlowRequest(request);

    if (request.followUpRequired && !request.followUpDate) {
      throw new Error('Follow-up date is required when follow-up is marked as required');
    }

    if (request.followUpDate && request.followUpDate <= new Date()) {
      throw new Error('Follow-up date must be in the future');
    }
  }

  /**
   * Business rule: Generate start consultation actions
   */
  private generateStartConsultationActions(appointment: Appointment): string[] {
    const actions = ['Consultation started successfully'];

    if (appointment.estimatedDuration > 60) {
      actions.push('Long consultation - monitor time carefully');
    }

    if (appointment.isUrgent()) {
      actions.push('Complete urgent consultation documentation');
    }

    actions.push('Update consultation notes as needed');
    actions.push('Complete appointment when consultation is finished');

    return actions;
  }

  /**
   * Business rule: Generate complete appointment actions
   */
  private generateCompleteAppointmentActions(
    appointment: Appointment,
    request: CompleteAppointmentRequest
  ): string[] {
    const actions = ['Appointment completed successfully'];

    if (request.prescriptionsGiven) {
      actions.push('Ensure prescriptions are properly documented');
      actions.push('Verify prescription delivery to patient');
    }

    if (request.documentsProvided?.length) {
      actions.push('Confirm patient received all documents');
    }

    if (request.followUpRequired) {
      actions.push('Schedule follow-up appointment');
    }

    actions.push('Process any pending payments');
    actions.push('Update patient records as needed');

    return actions;
  }

  /**
   * Business rule: Generate no-show actions
   */
  private generateNoShowActions(appointment: Appointment, patient: Patient): string[] {
    const actions = ['Patient marked as no-show'];

    actions.push('Contact patient to reschedule');
    actions.push('Apply no-show policy if applicable');
    actions.push('Update patient notes with no-show reason');

    if (appointment.isUrgent()) {
      actions.push('URGENT: Follow up immediately due to urgent appointment');
    }

    return actions;
  }

  /**
   * Business rule: Generate cancel appointment actions
   */
  private generateCancelAppointmentActions(
    appointment: Appointment,
    request: AppointmentFlowRequest
  ): string[] {
    const actions = ['Appointment cancelled'];

    // Check if time slot can be offered to waiting patients
    const now = new Date();
    if (appointment.timeSlot.startTime > now) {
      actions.push('Check if time slot can be offered to waiting patients');
    }

    actions.push('Apply cancellation policy if applicable');
    actions.push('Offer to reschedule appointment');

    return actions;
  }

  /**
   * Business rule: Generate appointment warnings
   */
  private async generateAppointmentWarnings(
    appointment: Appointment,
    patient: Patient
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Appointment-specific warnings
    if (appointment.isOverdue()) {
      warnings.push('Appointment was overdue');
    }

    if (appointment.getActualDuration() > appointment.estimatedDuration * 1.5) {
      warnings.push('Appointment took significantly longer than estimated');
    }

    // Patient-specific warnings
    if (patient.requiresSpecialAttention()) {
      warnings.push('Patient requires special attention');
    }

    if (patient.hasSpecialNeeds) {
      warnings.push('Patient has documented special needs');
    }

    if (patient.isMinor) {
      warnings.push('Patient is a minor');
    }

    // Insurance warnings
    if (patient.insuranceInfo?.status === 'expired') {
      warnings.push('Patient insurance may be expired');
    }

    return warnings;
  }

  /**
   * Business rule: Generate start consultation notifications
   */
  private async generateStartConsultationNotifications(
    appointment: Appointment,
    patient: Patient,
    request: StartConsultationRequest
  ): Promise<{ type: 'info' | 'warning' | 'success'; message: string; recipient?: string }[]> {
    const notifications = [];

    notifications.push({
      type: 'success' as const,
      message: `Consultation started for ${patient.getFullName()}`,
      recipient: appointment.professional.name
    });

    if (appointment.isUrgent()) {
      notifications.push({
        type: 'warning' as const,
        message: `URGENT consultation started for ${patient.getFullName()}`,
        recipient: 'management'
      });
    }

    if (request.consultationRoom) {
      notifications.push({
        type: 'info' as const,
        message: `Patient moved to ${request.consultationRoom}`,
        recipient: 'reception'
      });
    }

    return notifications;
  }

  /**
   * Business rule: Generate complete appointment notifications
   */
  private async generateCompleteAppointmentNotifications(
    appointment: Appointment,
    patient: Patient,
    request: CompleteAppointmentRequest
  ): Promise<{ type: 'info' | 'warning' | 'success'; message: string; recipient?: string }[]> {
    const notifications = [];

    notifications.push({
      type: 'success' as const,
      message: `Appointment completed for ${patient.getFullName()}`,
      recipient: 'reception'
    });

    if (request.followUpRequired) {
      notifications.push({
        type: 'info' as const,
        message: `Follow-up required for ${patient.getFullName()}`,
        recipient: 'scheduling'
      });
    }

    if (request.prescriptionsGiven) {
      notifications.push({
        type: 'info' as const,
        message: `Prescriptions provided to ${patient.getFullName()}`,
        recipient: 'pharmacy'
      });
    }

    return notifications;
  }

  /**
   * Business rule: Generate no-show notifications
   */
  private async generateNoShowNotifications(
    appointment: Appointment,
    patient: Patient,
    request: AppointmentFlowRequest
  ): Promise<{ type: 'info' | 'warning' | 'success'; message: string; recipient?: string }[]> {
    const notifications = [];

    notifications.push({
      type: 'warning' as const,
      message: `No-show: ${patient.getFullName()} for ${appointment.getFormattedTime()}`,
      recipient: 'management'
    });

    if (appointment.isUrgent()) {
      notifications.push({
        type: 'warning' as const,
        message: `URGENT appointment no-show: ${patient.getFullName()}`,
        recipient: 'clinical_coordinator'
      });
    }

    return notifications;
  }

  /**
   * Business rule: Generate cancel appointment notifications
   */
  private async generateCancelAppointmentNotifications(
    appointment: Appointment,
    patient: Patient,
    request: AppointmentFlowRequest
  ): Promise<{ type: 'info' | 'warning' | 'success'; message: string; recipient?: string }[]> {
    const notifications = [];

    notifications.push({
      type: 'info' as const,
      message: `Appointment cancelled for ${patient.getFullName()}`,
      recipient: 'scheduling'
    });

    // Check if time slot can be reallocated
    const hoursUntilAppointment = Math.floor(
      (appointment.timeSlot.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    if (hoursUntilAppointment > 2) {
      notifications.push({
        type: 'info' as const,
        message: `Time slot available: ${appointment.getFormattedTime()}`,
        recipient: 'scheduling'
      });
    }

    return notifications;
  }

  /**
   * Business rule: Schedule follow-up appointment
   */
  private async scheduleFollowUpAppointment(
    patient: Patient,
    completedAppointment: Appointment,
    followUpDate: Date
  ): Promise<void> {
    try {
      // This would integrate with appointment scheduling system
      console.log(`Scheduling follow-up for ${patient.getFullName()} on ${followUpDate}`);
      // TODO: Implement appointment scheduling integration
    } catch (error) {
      console.warn('Failed to schedule follow-up appointment:', error);
    }
  }

  /**
   * Business rule: Get recent no-shows for patient
   */
  private async getRecentNoShows(patientId: string): Promise<number> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentAppointments = await this.appointmentRepository.findByPatientAndDateRange(
        patientId,
        threeMonthsAgo,
        new Date()
      );

      return recentAppointments.filter(apt => apt.status === 'no_show').length;
    } catch (error) {
      console.warn('Could not get recent no-shows:', error);
      return 0;
    }
  }

  /**
   * Get flow step description
   */
  private getFlowStepDescription(status: AppointmentStatus): string {
    const descriptions = {
      scheduled: 'Appointment scheduled',
      arrived: 'Patient arrived / checked in',
      in_progress: 'Consultation started',
      completed: 'Appointment completed',
      cancelled: 'Appointment cancelled',
      no_show: 'Patient marked as no-show',
      rescheduled: 'Appointment rescheduled'
    };

    return descriptions[status] || `Status: ${status}`;
  }

  /**
   * Business rule: Log appointment flow for audit
   */
  private async logAppointmentFlow(
    operation: string,
    appointment: Appointment,
    request: AppointmentFlowRequest
  ): Promise<void> {
    try {
      const auditLog = {
        operation,
        appointmentId: appointment.id,
        patientId: appointment.patient.id,
        patientName: appointment.getPatientName(),
        professionalId: appointment.professional.id,
        professionalName: appointment.professional.name,
        appointmentTime: appointment.timeSlot.startTime,
        actionBy: request.actionBy,
        notes: request.notes,
        timestamp: new Date(),
        clinicId: appointment.clinicId,
        workspaceId: appointment.workspaceId
      };

      console.log('Appointment flow logged:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);

    } catch (error) {
      console.warn('Failed to log appointment flow:', error);
      // Don't fail operation if logging fails
    }
  }
}