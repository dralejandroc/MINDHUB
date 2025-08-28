/**
 * ExpedixContainer
 * Dependency Injection Container for Expedix Module
 * Single source of truth for all dependencies
 */

import { PatientRepository } from '../repositories/PatientRepository';
import { ConsultationRepository, CreateConsultationData, UpdateConsultationData } from '../repositories/ConsultationRepository';
import { DjangoPatientRepository } from '../adapters/DjangoPatientRepository';
import { CreatePatientUseCase } from '../usecases/CreatePatientUseCase';
import { GetPatientMedicalRecordUseCase } from '../usecases/GetPatientMedicalRecordUseCase';
import { CreateConsultationUseCase } from '../usecases/CreateConsultationUseCase';
import { Consultation, VitalSigns, MentalExam, Medication } from '../entities/Consultation';

// TODO: Create DjangoConsultationRepository
class MockConsultationRepository implements ConsultationRepository {
  async findById(id: string): Promise<Consultation | null> { throw new Error('Not implemented'); }
  async findAll() { return []; }
  async findByPatient() { return []; }
  async findByProfessional() { return []; }
  async findByDateRange() { return []; }
  async create(data: CreateConsultationData): Promise<Consultation> { throw new Error('Not implemented'); }
  async update(id: string, data: UpdateConsultationData): Promise<Consultation> { throw new Error('Not implemented'); }
  async delete() { throw new Error('Not implemented'); }
  async complete(id: string, completedBy: string): Promise<Consultation> { throw new Error('Not implemented'); }
  async updateVitalSigns(id: string, vitalSigns: VitalSigns): Promise<Consultation> { throw new Error('Not implemented'); }
  async updateMentalExam(id: string, mentalExam: MentalExam): Promise<Consultation> { throw new Error('Not implemented'); }
  async addMedication(id: string, medication: Medication): Promise<Consultation> { throw new Error('Not implemented'); }
  async removeMedication(id: string, medicationIndex: number): Promise<Consultation> { throw new Error('Not implemented'); }
  async updateMedication(id: string, medicationIndex: number, medication: Medication): Promise<Consultation> { throw new Error('Not implemented'); }
  async saveAsTemplate(id: string, templateName: string): Promise<void> { throw new Error('Not implemented'); }
  async applyTemplate(templateId: string, consultationId: string): Promise<Consultation> { throw new Error('Not implemented'); }
  async getStats() { 
    return {
      totalConsultations: 0,
      completedConsultations: 0,
      draftConsultations: 0,
      averageDuration: 0,
      consultationsByType: {},
      consultationsByMonth: [],
      mostCommonDiagnoses: []
    };
  }
  async getRecentConsultations() { return []; }
  async search() { return []; }
  async searchByDiagnosis() { return []; }
  async searchByMedication() { return []; }
}

export class ExpedixContainer {
  private static instance: ExpedixContainer;
  
  // Repository instances
  private patientRepository: PatientRepository;
  private consultationRepository: ConsultationRepository;
  
  // Use case instances
  private createPatientUseCase: CreatePatientUseCase;
  private getPatientMedicalRecordUseCase: GetPatientMedicalRecordUseCase;
  private createConsultationUseCase: CreateConsultationUseCase;

  private constructor() {
    // Initialize repositories (Infrastructure layer)
    this.patientRepository = new DjangoPatientRepository();
    this.consultationRepository = new MockConsultationRepository(); // TODO: Replace with Django implementation

    // Initialize use cases (Application layer)
    this.createPatientUseCase = new CreatePatientUseCase(
      this.patientRepository
    );

    this.getPatientMedicalRecordUseCase = new GetPatientMedicalRecordUseCase(
      this.patientRepository,
      this.consultationRepository
    );

    this.createConsultationUseCase = new CreateConsultationUseCase(
      this.consultationRepository,
      this.patientRepository
    );
  }

  /**
   * Singleton pattern to ensure single instance
   */
  static getInstance(): ExpedixContainer {
    if (!ExpedixContainer.instance) {
      ExpedixContainer.instance = new ExpedixContainer();
    }
    return ExpedixContainer.instance;
  }

  /**
   * Get repository instances
   */
  getPatientRepository(): PatientRepository {
    return this.patientRepository;
  }

  getConsultationRepository(): ConsultationRepository {
    return this.consultationRepository;
  }

  /**
   * Get use case instances
   */
  getCreatePatientUseCase(): CreatePatientUseCase {
    return this.createPatientUseCase;
  }

  getGetPatientMedicalRecordUseCase(): GetPatientMedicalRecordUseCase {
    return this.getPatientMedicalRecordUseCase;
  }

  getCreateConsultationUseCase(): CreateConsultationUseCase {
    return this.createConsultationUseCase;
  }

  /**
   * Factory method for testing - allows dependency injection
   */
  static createWithDependencies(
    patientRepository: PatientRepository,
    consultationRepository: ConsultationRepository
  ): ExpedixContainer {
    const container = new ExpedixContainer();
    container.patientRepository = patientRepository;
    container.consultationRepository = consultationRepository;
    
    // Recreate use cases with injected dependencies
    container.createPatientUseCase = new CreatePatientUseCase(
      patientRepository
    );
    container.getPatientMedicalRecordUseCase = new GetPatientMedicalRecordUseCase(
      patientRepository,
      consultationRepository
    );
    container.createConsultationUseCase = new CreateConsultationUseCase(
      consultationRepository,
      patientRepository
    );
    
    return container;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    ExpedixContainer.instance = null as any;
  }
}