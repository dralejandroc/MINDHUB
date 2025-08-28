/**
 * Dashboard Container
 * Dependency injection container for dashboard module
 */

import { DashboardRepository } from '../repositories/DashboardRepository';
import { DashboardWidgetRepository } from '../repositories/DashboardWidgetRepository';
import { DashboardDataRepository } from '../repositories/DashboardDataRepository';
import { 
  DjangoDashboardAdapter, 
  DjangoWidgetAdapter, 
  DjangoDataAdapter 
} from '../adapters/DjangoDashboardAdapter';
import { ManageDashboardUseCase } from '../usecases/ManageDashboardUseCase';
import { DashboardPresenter } from '../presenters/DashboardPresenter';

export class DashboardContainer {
  private static instance: DashboardContainer;
  
  // Repositories
  private dashboardRepository: DashboardRepository;
  private widgetRepository: DashboardWidgetRepository;
  private dataRepository: DashboardDataRepository;
  
  // Use Cases
  private manageDashboardUseCase: ManageDashboardUseCase;
  
  // Presenters
  private dashboardPresenter: DashboardPresenter;

  private constructor() {
    // Initialize repositories with Django adapters
    this.dashboardRepository = new DjangoDashboardAdapter();
    this.widgetRepository = new DjangoWidgetAdapter();
    this.dataRepository = new DjangoDataAdapter();
    
    // Initialize use cases
    this.manageDashboardUseCase = new ManageDashboardUseCase(
      this.dashboardRepository,
      this.widgetRepository,
      this.dataRepository
    );
    
    // Initialize presenters
    this.dashboardPresenter = new DashboardPresenter();
  }

  public static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  // Repository getters
  public getDashboardRepository(): DashboardRepository {
    return this.dashboardRepository;
  }

  public getWidgetRepository(): DashboardWidgetRepository {
    return this.widgetRepository;
  }

  public getDataRepository(): DashboardDataRepository {
    return this.dataRepository;
  }

  // Use Case getters
  public getManageDashboardUseCase(): ManageDashboardUseCase {
    return this.manageDashboardUseCase;
  }

  // Presenter getters
  public getDashboardPresenter(): DashboardPresenter {
    return this.dashboardPresenter;
  }

  // Factory methods for configured instances
  public createDashboardRepositoryForTenant(clinicId?: string, workspaceId?: string): DashboardRepository {
    // Could return a configured repository instance specific to the tenant
    return this.dashboardRepository;
  }

  public createWidgetRepositoryForTenant(clinicId?: string, workspaceId?: string): DashboardWidgetRepository {
    // Could return a configured repository instance specific to the tenant
    return this.widgetRepository;
  }

  public createDataRepositoryForTenant(clinicId?: string, workspaceId?: string): DashboardDataRepository {
    // Could return a configured repository instance specific to the tenant
    return this.dataRepository;
  }

  // Reset for testing
  public reset(): void {
    DashboardContainer.instance = new DashboardContainer();
  }
}