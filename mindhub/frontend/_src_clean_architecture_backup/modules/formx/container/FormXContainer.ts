/**
 * FormXContainer
 * Dependency Injection Container for FormX Module
 * Single source of truth for all dependencies
 */

import { FormRepository } from '../repositories/FormRepository';
import { FormSubmissionRepository } from '../repositories/FormSubmissionRepository';
import { DjangoFormRepository } from '../adapters/DjangoFormRepository';
import { DjangoFormSubmissionRepository } from '../adapters/DjangoFormSubmissionRepository';
import { CreateFormUseCase } from '../usecases/CreateFormUseCase';
import { CreateFormSubmissionUseCase } from '../usecases/CreateFormSubmissionUseCase';
import { SubmitFormUseCase } from '../usecases/SubmitFormUseCase';
import { GetFormAnalyticsUseCase } from '../usecases/GetFormAnalyticsUseCase';

export class FormXContainer {
  private static instance: FormXContainer;
  
  // Repository instances
  private formRepository: FormRepository;
  private formSubmissionRepository: FormSubmissionRepository;
  
  // Use case instances
  private createFormUseCase: CreateFormUseCase;
  private createFormSubmissionUseCase: CreateFormSubmissionUseCase;
  private submitFormUseCase: SubmitFormUseCase;
  private getFormAnalyticsUseCase: GetFormAnalyticsUseCase;

  private constructor() {
    // Initialize repositories (Infrastructure layer)
    this.formRepository = new DjangoFormRepository();
    this.formSubmissionRepository = new DjangoFormSubmissionRepository();

    // Initialize use cases (Application layer)
    this.createFormUseCase = new CreateFormUseCase(
      this.formRepository
    );

    this.createFormSubmissionUseCase = new CreateFormSubmissionUseCase(
      this.formRepository,
      this.formSubmissionRepository
    );

    this.submitFormUseCase = new SubmitFormUseCase(
      this.formRepository,
      this.formSubmissionRepository
    );

    this.getFormAnalyticsUseCase = new GetFormAnalyticsUseCase(
      this.formRepository,
      this.formSubmissionRepository
    );
  }

  /**
   * Singleton pattern to ensure single instance
   */
  static getInstance(): FormXContainer {
    if (!FormXContainer.instance) {
      FormXContainer.instance = new FormXContainer();
    }
    return FormXContainer.instance;
  }

  /**
   * Get repository instances
   */
  getFormRepository(): FormRepository {
    return this.formRepository;
  }

  getFormSubmissionRepository(): FormSubmissionRepository {
    return this.formSubmissionRepository;
  }

  /**
   * Get use case instances
   */
  getCreateFormUseCase(): CreateFormUseCase {
    return this.createFormUseCase;
  }

  getCreateFormSubmissionUseCase(): CreateFormSubmissionUseCase {
    return this.createFormSubmissionUseCase;
  }

  getSubmitFormUseCase(): SubmitFormUseCase {
    return this.submitFormUseCase;
  }

  getGetFormAnalyticsUseCase(): GetFormAnalyticsUseCase {
    return this.getFormAnalyticsUseCase;
  }

  /**
   * Factory method for testing - allows dependency injection
   */
  static createWithDependencies(
    formRepository: FormRepository,
    formSubmissionRepository: FormSubmissionRepository
  ): FormXContainer {
    const container = new FormXContainer();
    container.formRepository = formRepository;
    container.formSubmissionRepository = formSubmissionRepository;
    
    // Recreate use cases with injected dependencies
    container.createFormUseCase = new CreateFormUseCase(
      formRepository
    );
    
    container.createFormSubmissionUseCase = new CreateFormSubmissionUseCase(
      formRepository,
      formSubmissionRepository
    );
    
    container.submitFormUseCase = new SubmitFormUseCase(
      formRepository,
      formSubmissionRepository
    );
    
    container.getFormAnalyticsUseCase = new GetFormAnalyticsUseCase(
      formRepository,
      formSubmissionRepository
    );
    
    return container;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    FormXContainer.instance = null as any;
  }
}