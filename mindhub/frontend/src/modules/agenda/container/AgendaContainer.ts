/**
 * AgendaContainer
 * Dependency Injection Container for Agenda Module
 * Single source of truth for all dependencies
 */

import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { DjangoAppointmentRepository } from '../adapters/DjangoAppointmentRepository';
import { CreateAppointmentUseCase } from '../usecases/CreateAppointmentUseCase';
import { RescheduleAppointmentUseCase } from '../usecases/RescheduleAppointmentUseCase';
import { GetAppointmentsUseCase } from '../usecases/GetAppointmentsUseCase';

export class AgendaContainer {
  private static instance: AgendaContainer;
  
  // Repository instances
  private appointmentRepository: AppointmentRepository;
  
  // Use case instances
  private createAppointmentUseCase: CreateAppointmentUseCase;
  private rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  private getAppointmentsUseCase: GetAppointmentsUseCase;

  private constructor() {
    // Initialize repositories (Infrastructure layer)
    this.appointmentRepository = new DjangoAppointmentRepository();

    // Initialize use cases (Application layer)
    this.createAppointmentUseCase = new CreateAppointmentUseCase(
      this.appointmentRepository
    );

    this.rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(
      this.appointmentRepository
    );

    this.getAppointmentsUseCase = new GetAppointmentsUseCase(
      this.appointmentRepository
    );
  }

  /**
   * Singleton pattern to ensure single instance
   */
  static getInstance(): AgendaContainer {
    if (!AgendaContainer.instance) {
      AgendaContainer.instance = new AgendaContainer();
    }
    return AgendaContainer.instance;
  }

  /**
   * Get repository instances
   */
  getAppointmentRepository(): AppointmentRepository {
    return this.appointmentRepository;
  }

  /**
   * Get use case instances
   */
  getCreateAppointmentUseCase(): CreateAppointmentUseCase {
    return this.createAppointmentUseCase;
  }

  getRescheduleAppointmentUseCase(): RescheduleAppointmentUseCase {
    return this.rescheduleAppointmentUseCase;
  }

  getGetAppointmentsUseCase(): GetAppointmentsUseCase {
    return this.getAppointmentsUseCase;
  }

  /**
   * Factory method for testing - allows dependency injection
   */
  static createWithDependencies(
    appointmentRepository: AppointmentRepository
  ): AgendaContainer {
    const container = new AgendaContainer();
    container.appointmentRepository = appointmentRepository;
    
    // Recreate use cases with injected dependencies
    container.createAppointmentUseCase = new CreateAppointmentUseCase(
      appointmentRepository
    );
    container.rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(
      appointmentRepository
    );
    container.getAppointmentsUseCase = new GetAppointmentsUseCase(
      appointmentRepository
    );
    
    return container;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    AgendaContainer.instance = null as any;
  }
}