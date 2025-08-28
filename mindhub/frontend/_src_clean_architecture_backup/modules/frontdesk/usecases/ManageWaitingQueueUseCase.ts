/**
 * Manage Waiting Queue Use Case
 * Application business rules for waiting queue operations
 */

import { WaitingQueue, QueueItem, QueueMetrics, QueueConfiguration, SortMethod } from '../entities/WaitingQueue';
import { Patient } from '../entities/Patient';
import { Appointment } from '../entities/Appointment';
import { WaitingQueueRepository } from '../repositories/WaitingQueueRepository';
import { PatientRepository } from '../repositories/PatientRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';

export interface AddToQueueRequest {
  queueId: string;
  patientId: string;
  professionalId: string;
  appointmentId?: string;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  specialNeeds?: string[];
  isWalkIn?: boolean;
  requiresTranslation?: boolean;
  hasInsuranceIssues?: boolean;
  notes?: string;
  estimatedServiceTime?: number;
}

export interface QueueOperationResult {
  queue: WaitingQueue;
  patient?: Patient;
  appointment?: Appointment;
  warnings: string[];
  metrics: QueueMetrics;
}

export interface QueueAnalytics {
  averageWaitTime: number;
  averageServiceTime: number;
  patientThroughput: number;
  peakHours: { hour: number; count: number }[];
  waitTimeByUrgency: { [urgency: string]: number };
  noShowRate: number;
  patientSatisfactionScore: number;
}

export class ManageWaitingQueueUseCase {
  constructor(
    private queueRepository: WaitingQueueRepository,
    private patientRepository: PatientRepository,
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Get all active queues for clinic/workspace
   */
  async getActiveQueues(
    clinicId?: string,
    workspaceId?: string
  ): Promise<WaitingQueue[]> {
    try {
      const queues = await this.queueRepository.findActive({
        clinicId,
        workspaceId
      });

      // Business rule: Sort by priority (urgent patients first)
      return queues.sort((a, b) => {
        const urgentCountA = a.getUrgentPatients().length;
        const urgentCountB = b.getUrgentPatients().length;
        
        if (urgentCountA !== urgentCountB) {
          return urgentCountB - urgentCountA;
        }

        // Then by total patients waiting
        return b.items.length - a.items.length;
      });

    } catch (error) {
      throw new Error(`Failed to get active queues: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add patient to waiting queue
   */
  async addPatientToQueue(request: AddToQueueRequest): Promise<QueueOperationResult> {
    // Business rule: Validate request
    this.validateAddToQueueRequest(request);

    try {
      // Get queue
      const queue = await this.queueRepository.findById(request.queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Get patient
      const patient = await this.patientRepository.findById(request.patientId);
      if (!patient) {
        throw new Error('Patient not found');
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
      }

      // Business rule: Check if patient is already in this or another queue
      await this.checkPatientQueueStatus(request.patientId, request.queueId);

      // Business rule: Validate professional assignment
      if (!queue.professionalIds.includes(request.professionalId)) {
        throw new Error('Professional is not assigned to this queue');
      }

      // Get professional name (would normally come from professional repository)
      const professionalName = `Professional ${request.professionalId}`; // TODO: Get from repository

      // Business rule: Add patient to queue
      const updatedQueue = queue.addPatient(
        request.patientId,
        patient.getFullName(),
        request.professionalId,
        professionalName,
        request.appointmentId,
        request.urgency || 'medium',
        request.specialNeeds || [],
        request.isWalkIn || false,
        request.requiresTranslation || false,
        request.hasInsuranceIssues || false,
        request.notes
      );

      // Save updated queue
      const savedQueue = await this.queueRepository.update(updatedQueue);

      // Business rule: Update patient status if not already waiting
      let updatedPatient = patient;
      if (patient.status !== 'waiting') {
        updatedPatient = patient.checkIn(
          'system',
          queue.location,
          request.specialNeeds
        );
        await this.patientRepository.update(updatedPatient);
      }

      // Business rule: Update appointment status if applicable
      let updatedAppointment = appointment;
      if (appointment && appointment.status === 'scheduled') {
        updatedAppointment = appointment.markAsArrived(new Date(), request.professionalId, request.queueId);
        await this.appointmentRepository.update(updatedAppointment);
      }

      // Business rule: Generate warnings
      const warnings = await this.generateQueueWarnings(savedQueue, updatedPatient);

      // Business rule: Get updated metrics
      const metrics = savedQueue.getMetrics();

      // Business rule: Log queue addition
      await this.logQueueOperation('patient_added', savedQueue, updatedPatient);

      // Business rule: Check for queue capacity warnings
      if (savedQueue.items.length >= savedQueue.maxCapacity * 0.9) {
        warnings.push('Queue is approaching maximum capacity');
      }

      return {
        queue: savedQueue,
        patient: updatedPatient,
        appointment: updatedAppointment,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to add patient to queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove patient from queue
   */
  async removePatientFromQueue(
    queueId: string,
    patientId: string,
    reason: string,
    removedBy: string
  ): Promise<QueueOperationResult> {
    try {
      // Get queue
      const queue = await this.queueRepository.findById(queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Business rule: Check if patient is in queue
      const queueItem = queue.items.find(item => item.patientId === patientId);
      if (!queueItem) {
        throw new Error('Patient not found in queue');
      }

      // Get patient
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Business rule: Remove from queue
      const updatedQueue = queue.removePatient(patientId, reason);

      // Save updated queue
      const savedQueue = await this.queueRepository.update(updatedQueue);

      // Business rule: Update patient status based on reason
      let updatedPatient = patient;
      if (reason.toLowerCase().includes('no show')) {
        updatedPatient = patient.markAsNoShow(removedBy, reason);
      } else if (reason.toLowerCase().includes('cancel')) {
        // Patient status would be updated elsewhere for cancellation
      } else {
        // Normal completion - patient would be marked as completed elsewhere
      }

      if (updatedPatient !== patient) {
        await this.patientRepository.update(updatedPatient);
      }

      // Business rule: Generate warnings
      const warnings = await this.generateQueueWarnings(savedQueue);

      // Business rule: Get updated metrics
      const metrics = savedQueue.getMetrics();

      // Business rule: Log queue removal
      await this.logQueueOperation('patient_removed', savedQueue, updatedPatient, { reason, removedBy });

      return {
        queue: savedQueue,
        patient: updatedPatient,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to remove patient from queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Move patient to different position in queue
   */
  async movePatientInQueue(
    queueId: string,
    patientId: string,
    newPosition: number,
    movedBy: string,
    reason?: string
  ): Promise<QueueOperationResult> {
    try {
      // Get queue
      const queue = await this.queueRepository.findById(queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Business rule: Move patient
      const updatedQueue = queue.movePatient(patientId, newPosition);

      // Save updated queue
      const savedQueue = await this.queueRepository.update(updatedQueue);

      // Get patient
      const patient = await this.patientRepository.findById(patientId);

      // Business rule: Generate warnings
      const warnings = await this.generateQueueWarnings(savedQueue, patient || undefined);

      // Business rule: Get updated metrics
      const metrics = savedQueue.getMetrics();

      // Business rule: Log queue movement
      await this.logQueueOperation('patient_moved', savedQueue, patient || undefined, { 
        movedBy, 
        newPosition, 
        reason 
      });

      return {
        queue: savedQueue,
        patient: patient || undefined,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to move patient in queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get next patient from queue
   */
  async getNextPatient(queueId: string): Promise<{
    queueItem: QueueItem | null;
    patient?: Patient;
    appointment?: Appointment;
    warnings: string[];
  }> {
    try {
      // Get queue
      const queue = await this.queueRepository.findById(queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Business rule: Get next patient
      const nextQueueItem = queue.getNextPatient();
      if (!nextQueueItem) {
        return {
          queueItem: null,
          warnings: ['No patients waiting in queue']
        };
      }

      // Get full patient data
      const patient = await this.patientRepository.findById(nextQueueItem.patientId);
      let appointment: Appointment | undefined;

      if (nextQueueItem.appointmentId) {
        appointment = await this.appointmentRepository.findById(nextQueueItem.appointmentId);
      }

      // Business rule: Generate warnings for next patient
      const warnings: string[] = [];

      if (nextQueueItem.urgency === 'urgent') {
        warnings.push('This is an URGENT patient');
      }

      if (nextQueueItem.specialNeeds.length > 0) {
        warnings.push(`Special needs: ${nextQueueItem.specialNeeds.join(', ')}`);
      }

      if (nextQueueItem.requiresTranslation) {
        warnings.push('Patient requires translation services');
      }

      if (nextQueueItem.hasInsuranceIssues) {
        warnings.push('Patient has insurance verification issues');
      }

      if (nextQueueItem.actualWaitTime > queue.configuration.maxWaitTime) {
        warnings.push(`Patient has been waiting for ${nextQueueItem.actualWaitTime} minutes (exceeds maximum)`);
      }

      return {
        queueItem: nextQueueItem,
        patient: patient || undefined,
        appointment: appointment || undefined,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to get next patient: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update queue configuration
   */
  async updateQueueConfiguration(
    queueId: string,
    configuration: Partial<QueueConfiguration>,
    updatedBy: string
  ): Promise<QueueOperationResult> {
    try {
      // Get queue
      const queue = await this.queueRepository.findById(queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Business rule: Update configuration
      const updatedQueue = queue.updateConfiguration(configuration);

      // Save updated queue
      const savedQueue = await this.queueRepository.update(updatedQueue);

      // Business rule: Generate warnings
      const warnings = await this.generateQueueWarnings(savedQueue);

      // Business rule: Get updated metrics
      const metrics = savedQueue.getMetrics();

      // Business rule: Log configuration change
      await this.logQueueOperation('configuration_updated', savedQueue, undefined, { 
        updatedBy, 
        changes: configuration 
      });

      return {
        queue: savedQueue,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to update queue configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resort queue based on new criteria
   */
  async resortQueue(
    queueId: string,
    sortMethod: SortMethod,
    resortedBy: string
  ): Promise<QueueOperationResult> {
    try {
      // Get queue
      const queue = await this.queueRepository.findById(queueId);
      if (!queue) {
        throw new Error('Queue not found');
      }

      // Business rule: Resort queue
      const resortedQueue = queue.resortQueue(sortMethod);

      // Save updated queue
      const savedQueue = await this.queueRepository.update(resortedQueue);

      // Business rule: Generate warnings
      const warnings = await this.generateQueueWarnings(savedQueue);

      // Business rule: Get updated metrics
      const metrics = savedQueue.getMetrics();

      // Business rule: Log queue resort
      await this.logQueueOperation('queue_resorted', savedQueue, undefined, { 
        resortedBy, 
        sortMethod 
      });

      return {
        queue: savedQueue,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to resort queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get queue analytics
   */
  async getQueueAnalytics(
    queueId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<QueueAnalytics> {
    try {
      // Business rule: Get historical queue data
      const historicalData = await this.queueRepository.getHistoricalData(
        queueId,
        dateRange.startDate,
        dateRange.endDate
      );

      // Business rule: Calculate analytics
      const analytics = this.calculateQueueAnalytics(historicalData);

      return analytics;

    } catch (error) {
      throw new Error(`Failed to get queue analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get patients with excessive wait times across all queues
   */
  async getPatientsWithExcessiveWaitTimes(
    clinicId?: string,
    workspaceId?: string
  ): Promise<{
    patients: {
      queueItem: QueueItem;
      patient: Patient;
      queue: WaitingQueue;
      waitTimeMinutes: number;
    }[];
    totalCount: number;
  }> {
    try {
      // Get all active queues
      const queues = await this.queueRepository.findActive({ clinicId, workspaceId });

      const excessiveWaitPatients = [];

      for (const queue of queues) {
        const patientsWithExcessiveWait = queue.getPatientsWithExcessiveWaitTime();
        
        for (const queueItem of patientsWithExcessiveWait) {
          const patient = await this.patientRepository.findById(queueItem.patientId);
          if (patient) {
            const now = new Date();
            const waitTimeMinutes = Math.floor(
              (now.getTime() - queueItem.arrivalTime.getTime()) / (1000 * 60)
            );

            excessiveWaitPatients.push({
              queueItem,
              patient,
              queue,
              waitTimeMinutes
            });
          }
        }
      }

      // Sort by wait time (longest first)
      excessiveWaitPatients.sort((a, b) => b.waitTimeMinutes - a.waitTimeMinutes);

      return {
        patients: excessiveWaitPatients,
        totalCount: excessiveWaitPatients.length
      };

    } catch (error) {
      throw new Error(`Failed to get patients with excessive wait times: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private helper methods

  /**
   * Business rule: Validate add to queue request
   */
  private validateAddToQueueRequest(request: AddToQueueRequest): void {
    if (!request.queueId?.trim()) {
      throw new Error('Queue ID is required');
    }

    if (!request.patientId?.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!request.professionalId?.trim()) {
      throw new Error('Professional ID is required');
    }

    if (request.specialNeeds && request.specialNeeds.length > 10) {
      throw new Error('Too many special needs specified');
    }

    if (request.estimatedServiceTime && request.estimatedServiceTime <= 0) {
      throw new Error('Estimated service time must be positive');
    }
  }

  /**
   * Business rule: Check if patient is already in a queue
   */
  private async checkPatientQueueStatus(patientId: string, targetQueueId: string): Promise<void> {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        return;
      }

      // Check if patient is already in waiting status
      if (patient.status === 'waiting') {
        // Check all active queues to see if patient is in any of them
        const allQueues = await this.queueRepository.findActive({
          clinicId: patient.clinicId,
          workspaceId: patient.workspaceId
        });

        for (const queue of allQueues) {
          if (queue.id !== targetQueueId && 
              queue.items.some(item => item.patientId === patientId)) {
            throw new Error('Patient is already in another queue');
          }
        }
      }

    } catch (error) {
      if (error.message === 'Patient is already in another queue') {
        throw error;
      }
      console.warn('Could not check patient queue status:', error);
      // Don't block operation if check fails
    }
  }

  /**
   * Business rule: Generate queue-related warnings
   */
  private async generateQueueWarnings(
    queue: WaitingQueue,
    patient?: Patient
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Queue capacity warnings
    const capacityUsage = (queue.items.length / queue.maxCapacity) * 100;
    if (capacityUsage >= 90) {
      warnings.push('Queue is at 90% capacity');
    } else if (capacityUsage >= 75) {
      warnings.push('Queue is at 75% capacity');
    }

    // Queue status warnings
    if (queue.status === 'paused') {
      warnings.push('Queue is currently paused');
    }

    // Excessive wait time warnings
    const patientsWithExcessiveWait = queue.getPatientsWithExcessiveWaitTime();
    if (patientsWithExcessiveWait.length > 0) {
      warnings.push(`${patientsWithExcessiveWait.length} patient(s) have excessive wait times`);
    }

    // Urgent patient warnings
    const urgentPatients = queue.getUrgentPatients();
    if (urgentPatients.length > 0) {
      warnings.push(`${urgentPatients.length} urgent patient(s) in queue`);
    }

    // Patient-specific warnings
    if (patient) {
      if (patient.requiresSpecialAttention()) {
        warnings.push('Patient requires special attention');
      }

      if (patient.hasSpecialNeeds) {
        warnings.push('Patient has documented special needs');
      }
    }

    return warnings;
  }

  /**
   * Business rule: Calculate queue analytics
   */
  private calculateQueueAnalytics(historicalData: unknown[]): QueueAnalytics {
    // This would be implemented with actual historical data analysis
    // For now, return mock analytics
    return {
      averageWaitTime: 25,
      averageServiceTime: 30,
      patientThroughput: 20,
      peakHours: [
        { hour: 9, count: 15 },
        { hour: 10, count: 12 },
        { hour: 11, count: 18 }
      ],
      waitTimeByUrgency: {
        urgent: 5,
        high: 15,
        medium: 25,
        low: 35
      },
      noShowRate: 8.5,
      patientSatisfactionScore: 4.2
    };
  }

  /**
   * Business rule: Log queue operations for audit
   */
  private async logQueueOperation(
    operation: string,
    queue: WaitingQueue,
    patient?: Patient,
    additionalData?: any
  ): Promise<void> {
    try {
      const auditLog = {
        operation,
        queueId: queue.id,
        queueName: queue.name,
        queueLocation: queue.location,
        patientId: patient?.id,
        patientName: patient?.getFullName(),
        timestamp: new Date(),
        clinicId: queue.clinicId,
        workspaceId: queue.workspaceId,
        ...additionalData
      };

      console.log('Queue operation logged:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);

    } catch (error) {
      console.warn('Failed to log queue operation:', error);
      // Don't fail operation if logging fails
    }
  }
}