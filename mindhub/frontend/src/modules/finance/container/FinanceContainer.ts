/**
 * Finance Container
 * Dependency injection container for finance module
 */

import { IncomeRepository } from '../repositories/IncomeRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { CashRegisterRepository } from '../repositories/CashRegisterRepository';
import { DjangoIncomeAdapter, DjangoServiceAdapter, DjangoCashRegisterAdapter } from '../adapters/DjangoFinanceAdapter';
import { CreateIncomeUseCase } from '../usecases/CreateIncomeUseCase';
import { GetFinancialReportsUseCase } from '../usecases/GetFinancialReportsUseCase';
import { ManageCashRegisterUseCase } from '../usecases/ManageCashRegisterUseCase';
import { FinancePresenter } from '../presenters/FinancePresenter';

export class FinanceContainer {
  private static instance: FinanceContainer;
  
  // Repositories
  private incomeRepository: IncomeRepository;
  private serviceRepository: ServiceRepository;
  private cashRegisterRepository: CashRegisterRepository;
  
  // Use Cases
  private createIncomeUseCase: CreateIncomeUseCase;
  private getFinancialReportsUseCase: GetFinancialReportsUseCase;
  private manageCashRegisterUseCase: ManageCashRegisterUseCase;
  
  // Presenters
  private financePresenter: FinancePresenter;

  private constructor() {
    // Initialize repositories with Django adapters
    this.incomeRepository = new DjangoIncomeAdapter();
    this.serviceRepository = new DjangoServiceAdapter();
    this.cashRegisterRepository = new DjangoCashRegisterAdapter();
    
    // Initialize use cases
    this.createIncomeUseCase = new CreateIncomeUseCase(
      this.incomeRepository,
      this.serviceRepository,
      this.cashRegisterRepository
    );
    
    this.getFinancialReportsUseCase = new GetFinancialReportsUseCase(
      this.incomeRepository,
      this.serviceRepository,
      this.cashRegisterRepository
    );
    
    this.manageCashRegisterUseCase = new ManageCashRegisterUseCase(
      this.cashRegisterRepository,
      this.incomeRepository
    );
    
    // Initialize presenters
    this.financePresenter = new FinancePresenter();
  }

  public static getInstance(): FinanceContainer {
    if (!FinanceContainer.instance) {
      FinanceContainer.instance = new FinanceContainer();
    }
    return FinanceContainer.instance;
  }

  // Repository getters
  public getIncomeRepository(): IncomeRepository {
    return this.incomeRepository;
  }

  public getServiceRepository(): ServiceRepository {
    return this.serviceRepository;
  }

  public getCashRegisterRepository(): CashRegisterRepository {
    return this.cashRegisterRepository;
  }

  // Use Case getters
  public getCreateIncomeUseCase(): CreateIncomeUseCase {
    return this.createIncomeUseCase;
  }

  public getGetFinancialReportsUseCase(): GetFinancialReportsUseCase {
    return this.getFinancialReportsUseCase;
  }

  public getManageCashRegisterUseCase(): ManageCashRegisterUseCase {
    return this.manageCashRegisterUseCase;
  }

  // Presenter getters
  public getFinancePresenter(): FinancePresenter {
    return this.financePresenter;
  }

  // Factory methods for configured instances
  public createIncomeRepositoryForTenant(clinicId?: string, workspaceId?: string): IncomeRepository {
    // Could return a configured repository instance specific to the tenant
    return this.incomeRepository;
  }

  public createServiceRepositoryForTenant(clinicId?: string, workspaceId?: string): ServiceRepository {
    // Could return a configured repository instance specific to the tenant
    return this.serviceRepository;
  }

  public createCashRegisterRepositoryForTenant(clinicId?: string, workspaceId?: string): CashRegisterRepository {
    // Could return a configured repository instance specific to the tenant
    return this.cashRegisterRepository;
  }

  // Reset for testing
  public reset(): void {
    FinanceContainer.instance = new FinanceContainer();
  }
}