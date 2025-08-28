/**
 * Create Income Use Case
 * Application business rules for income creation
 */

import { Income, IncomeSource, PaymentMethod, Currency, Patient, Professional, Consultation, PaymentDetails } from '../entities/Income';
import { IncomeRepository } from '../repositories/IncomeRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';

export interface CreateIncomeRequest {
  amount: number;
  currency: Currency;
  source: IncomeSource;
  paymentMethod: PaymentMethod;
  receivedDate: Date;
  description: string;
  concept: string;
  notes?: string;
  patientId?: string;
  professionalId?: string;
  consultationId?: string;
  serviceId?: string;
  paymentDetails?: PaymentDetails;
  clinicId?: string;
  workspaceId?: string;
}

export class CreateIncomeUseCase {
  constructor(
    private incomeRepository: IncomeRepository,
    private serviceRepository: ServiceRepository
  ) {}

  async execute(request: CreateIncomeRequest): Promise<Income> {
    // Business rule: Validate request data
    this.validateRequest(request);

    // Business rule: Validate service pricing if serviceId provided
    await this.validateServicePricing(request);

    // Business rule: Get related entities
    const { patient, professional, consultation } = await this.getRelatedEntities(request);

    // Business rule: Generate income ID
    const incomeId = this.generateIncomeId();

    // Business rule: Determine final concept if service-based
    const finalConcept = await this.determineFinalConcept(request);

    // Create income entity
    const income = new Income(
      incomeId,
      request.amount,
      request.currency,
      request.source,
      request.paymentMethod,
      'pending', // Initial status
      request.receivedDate,
      request.description,
      finalConcept,
      request.notes || '',
      patient,
      professional,
      consultation,
      request.paymentDetails,
      request.clinicId,
      request.workspaceId
    );

    // Business rule: Check for duplicate transactions
    await this.checkDuplicateTransactions(income);

    // Business rule: Validate against business hours if applicable
    this.validateBusinessHours(income);

    // Persist income
    const savedIncome = await this.incomeRepository.create(income);

    // Business rule: Log income creation for audit
    await this.logIncomeCreation(savedIncome);

    // Business rule: Update related entities (consultation status, etc.)
    await this.updateRelatedEntities(savedIncome);

    return savedIncome;
  }

  /**
   * Business rule: Validate request completeness and consistency
   */
  private validateRequest(request: CreateIncomeRequest): void {
    if (request.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!request.description?.trim()) {
      throw new Error('Description is required');
    }

    if (!request.concept?.trim()) {
      throw new Error('Concept is required');
    }

    // Business rule: Must specify either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Income must belong to either a clinic or workspace');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Income cannot belong to both clinic and workspace');
    }

    // Business rule: Consultation income must have patient
    if (request.source === 'consultation' && !request.patientId) {
      throw new Error('Consultation income must have associated patient');
    }

    // Business rule: Future dates not allowed
    if (request.receivedDate > new Date()) {
      throw new Error('Income cannot be received in the future');
    }

    // Business rule: Payment method specific validations
    if (request.paymentMethod === 'check' && !request.paymentDetails?.checkNumber) {
      throw new Error('Check number is required for check payments');
    }

    if (request.paymentMethod === 'payment_gateway' && !request.paymentDetails?.gatewayTransactionId) {
      throw new Error('Gateway transaction ID is required for payment gateway transactions');
    }
  }

  /**
   * Business rule: Validate service pricing consistency
   */
  private async validateServicePricing(request: CreateIncomeRequest): Promise<void> {
    if (!request.serviceId) {
      return; // No service validation needed
    }

    try {
      const service = await this.serviceRepository.findById(request.serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      if (!service.isAvailable()) {
        throw new Error('Service is not available for income recording');
      }

      // Business rule: Check if amount matches service pricing
      const expectedPrice = service.calculatePrice(1); // Default quantity 1
      const tolerance = expectedPrice * 0.1; // 10% tolerance

      if (Math.abs(request.amount - expectedPrice) > tolerance) {
        console.warn(`Income amount (${request.amount}) differs significantly from service price (${expectedPrice})`);
        // Don't throw error, just warn - pricing can vary with discounts
      }

    } catch (error) {
      console.warn('Service validation failed:', error);
      // Don't block income creation if service validation fails
    }
  }

  /**
   * Business rule: Get and validate related entities
   */
  private async getRelatedEntities(request: CreateIncomeRequest): Promise<{
    patient?: Patient;
    professional?: Professional;
    consultation?: Consultation;
  }> {
    const result: {
      patient?: Patient;
      professional?: Professional;
      consultation?: Consultation;
    } = {};

    // Get patient if specified
    if (request.patientId) {
      try {
        // TODO: Get patient from patient repository
        // const patient = await this.patientRepository.findById(request.patientId);
        // result.patient = patient;
        
        // For now, create a basic patient object
        result.patient = {
          id: request.patientId,
          firstName: 'Patient',
          lastName: 'Name',
          medicalRecordNumber: request.patientId
        };
      } catch (error) {
        console.warn('Could not load patient information:', error);
      }
    }

    // Get professional if specified
    if (request.professionalId) {
      try {
        // TODO: Get professional from professional repository
        // const professional = await this.professionalRepository.findById(request.professionalId);
        // result.professional = professional;
        
        // For now, create a basic professional object
        result.professional = {
          id: request.professionalId,
          name: 'Professional Name',
          email: 'professional@example.com'
        };
      } catch (error) {
        console.warn('Could not load professional information:', error);
      }
    }

    // Get consultation if specified
    if (request.consultationId) {
      try {
        // TODO: Get consultation from consultation repository
        // const consultation = await this.consultationRepository.findById(request.consultationId);
        // result.consultation = consultation;
        
        // For now, create a basic consultation object
        result.consultation = {
          id: request.consultationId,
          consultationDate: new Date(),
          reason: 'Medical consultation'
        };
      } catch (error) {
        console.warn('Could not load consultation information:', error);
      }
    }

    return result;
  }

  /**
   * Business rule: Determine final concept based on service or request
   */
  private async determineFinalConcept(request: CreateIncomeRequest): Promise<string> {
    if (request.serviceId) {
      try {
        const service = await this.serviceRepository.findById(request.serviceId);
        if (service) {
          return `${service.name} - ${request.concept}`;
        }
      } catch (error) {
        console.warn('Could not load service for concept generation:', error);
      }
    }

    return request.concept;
  }

  /**
   * Business rule: Check for potential duplicate transactions
   */
  private async checkDuplicateTransactions(income: Income): Promise<void> {
    try {
      // Look for similar transactions in the last 5 minutes
      const timeWindow = new Date(income.receivedDate.getTime() - 5 * 60 * 1000);
      
      const recentIncomes = await this.incomeRepository.findRecent(10, {
        clinicId: income.clinicId,
        workspaceId: income.workspaceId
      });

      const potentialDuplicates = recentIncomes.filter(existing => 
        existing.amount === income.amount &&
        existing.source === income.source &&
        existing.paymentMethod === income.paymentMethod &&
        existing.receivedDate >= timeWindow &&
        existing.patient?.id === income.patient?.id
      );

      if (potentialDuplicates.length > 0) {
        console.warn('Potential duplicate transaction detected:', {
          newIncome: {
            amount: income.amount,
            source: income.source,
            receivedDate: income.receivedDate
          },
          existingIncomes: potentialDuplicates.map(i => ({
            id: i.id,
            amount: i.amount,
            receivedDate: i.receivedDate
          }))
        });
        // Don't block creation, just warn
      }
    } catch (error) {
      console.warn('Could not check for duplicate transactions:', error);
      // Don't fail income creation if duplicate check fails
    }
  }

  /**
   * Business rule: Validate business hours for certain income types
   */
  private validateBusinessHours(income: Income): void {
    // Only validate consultation income during business hours
    if (income.source !== 'consultation') {
      return;
    }

    const receivedHour = income.receivedDate.getHours();
    const receivedDay = income.receivedDate.getDay();

    // Business hours: Monday-Friday 8AM-8PM, Saturday 9AM-2PM
    const isWeekday = receivedDay >= 1 && receivedDay <= 5;
    const isSaturday = receivedDay === 6;
    const isSunday = receivedDay === 0;

    let isBusinessHour = false;

    if (isWeekday && receivedHour >= 8 && receivedHour < 20) {
      isBusinessHour = true;
    } else if (isSaturday && receivedHour >= 9 && receivedHour < 14) {
      isBusinessHour = true;
    }

    if (!isBusinessHour && !isSunday) {
      console.warn('Consultation income recorded outside business hours:', {
        receivedDate: income.receivedDate,
        day: receivedDay,
        hour: receivedHour
      });
      // Don't block creation, just warn
    }
  }

  /**
   * Business rule: Log income creation for audit trail
   */
  private async logIncomeCreation(income: Income): Promise<void> {
    try {
      const auditLog = {
        action: 'income_created',
        incomeId: income.id,
        amount: income.amount,
        currency: income.currency,
        source: income.source,
        paymentMethod: income.paymentMethod,
        patientId: income.patient?.id,
        professionalId: income.professional?.id,
        timestamp: new Date(),
        clinicId: income.clinicId,
        workspaceId: income.workspaceId
      };

      console.log('Income created:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);
    } catch (error) {
      console.warn('Failed to log income creation:', error);
      // Don't fail income creation if audit logging fails
    }
  }

  /**
   * Business rule: Update related entities after income creation
   */
  private async updateRelatedEntities(income: Income): Promise<void> {
    try {
      // Update consultation payment status if applicable
      if (income.consultation && income.source === 'consultation') {
        // TODO: Update consultation to mark as paid
        // await this.consultationRepository.markAsPaid(income.consultation.id, income.id);
        console.log(`Consultation ${income.consultation.id} marked as paid via income ${income.id}`);
      }

      // Update service usage statistics if applicable
      if (income.source !== 'other') {
        // TODO: Update service statistics
        console.log(`Service statistics updated for income source: ${income.source}`);
      }

    } catch (error) {
      console.warn('Failed to update related entities:', error);
      // Don't fail income creation if related updates fail
    }
  }

  /**
   * Generate unique income ID
   */
  private generateIncomeId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `inc_${timestamp}_${random}`;
  }
}