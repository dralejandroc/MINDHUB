/**
 * ClinimetrixPro Container
 * Dependency Injection Container for Clean Architecture
 * Follows Dependency Inversion Principle - manages all dependencies centrally
 */

import { ScaleRepository } from '../repositories/ScaleRepository';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { ScaleRegistryRepository } from '../repositories/ScaleRegistryRepository';

import { DjangoScaleAdapter } from '../adapters/DjangoScaleAdapter';
import { DjangoAssessmentAdapter } from '../adapters/DjangoAssessmentAdapter';
import { ScoringService } from '../adapters/ScoringService';

import { CreateAssessmentUseCase } from '../usecases/CreateAssessmentUseCase';
import { CompleteAssessmentUseCase } from '../usecases/CompleteAssessmentUseCase';
import { GetScaleCatalogUseCase } from '../usecases/GetScaleCatalogUseCase';
import { CalculateScoresUseCase } from '../usecases/CalculateScoresUseCase';

import { ClinimetrixPresenter } from '../presenters/ClinimetrixPresenter';

export class ClinimetrixContainer {
  private static instance: ClinimetrixContainer | null = null;

  // Repository instances
  private scaleRepository: ScaleRepository | null = null;
  private assessmentRepository: AssessmentRepository | null = null;
  private scaleRegistryRepository: ScaleRegistryRepository | null = null;

  // Adapter instances
  private scaleAdapter: DjangoScaleAdapter | null = null;
  private assessmentAdapter: DjangoAssessmentAdapter | null = null;
  private scoringService: ScoringService | null = null;

  // Use case instances
  private createAssessmentUseCase: CreateAssessmentUseCase | null = null;
  private completeAssessmentUseCase: CompleteAssessmentUseCase | null = null;
  private getScaleCatalogUseCase: GetScaleCatalogUseCase | null = null;
  private calculateScoresUseCase: CalculateScoresUseCase | null = null;

  // Presenter instances
  private clinimetrixPresenter: ClinimetrixPresenter | null = null;

  private constructor() {}

  public static getInstance(): ClinimetrixContainer {
    if (!ClinimetrixContainer.instance) {
      ClinimetrixContainer.instance = new ClinimetrixContainer();
    }
    return ClinimetrixContainer.instance;
  }

  // Repository Getters (Singleton pattern)
  public getScaleRepository(): ScaleRepository {
    if (!this.scaleRepository) {
      this.scaleRepository = this.getScaleAdapter();
    }
    return this.scaleRepository;
  }

  public getAssessmentRepository(): AssessmentRepository {
    if (!this.assessmentRepository) {
      this.assessmentRepository = this.getAssessmentAdapter();
    }
    return this.assessmentRepository;
  }

  public getScaleRegistryRepository(): ScaleRegistryRepository {
    if (!this.scaleRegistryRepository) {
      // For now, using scale adapter - would need separate registry adapter
      this.scaleRegistryRepository = this.getScaleAdapter() as any;
    }
    return this.scaleRegistryRepository!;
  }

  // Adapter Getters
  public getScaleAdapter(): DjangoScaleAdapter {
    if (!this.scaleAdapter) {
      const baseUrl = this.getApiBaseUrl();
      this.scaleAdapter = new DjangoScaleAdapter(baseUrl);
      
      // Set auth token if available
      const token = this.getAuthToken();
      if (token) {
        this.scaleAdapter.setAuthToken(token);
      }
    }
    return this.scaleAdapter;
  }

  public getAssessmentAdapter(): DjangoAssessmentAdapter {
    if (!this.assessmentAdapter) {
      const baseUrl = this.getApiBaseUrl();
      this.assessmentAdapter = new DjangoAssessmentAdapter(baseUrl);
      
      // Set auth token if available
      const token = this.getAuthToken();
      if (token) {
        this.assessmentAdapter.setAuthToken(token);
      }
    }
    return this.assessmentAdapter;
  }

  public getScoringService(): ScoringService {
    if (!this.scoringService) {
      const baseUrl = this.getApiBaseUrl();
      this.scoringService = new ScoringService(baseUrl);
      
      // Set auth token if available
      const token = this.getAuthToken();
      if (token) {
        this.scoringService.setAuthToken(token);
      }
    }
    return this.scoringService;
  }

  // Use Case Getters
  public getCreateAssessmentUseCase(): CreateAssessmentUseCase {
    if (!this.createAssessmentUseCase) {
      this.createAssessmentUseCase = new CreateAssessmentUseCase(
        this.getAssessmentRepository(),
        this.getScaleRepository()
      );
    }
    return this.createAssessmentUseCase;
  }

  public getCompleteAssessmentUseCase(): CompleteAssessmentUseCase {
    if (!this.completeAssessmentUseCase) {
      this.completeAssessmentUseCase = new CompleteAssessmentUseCase(
        this.getAssessmentRepository(),
        this.getScaleRepository(),
        this.getScoringService()
      );
    }
    return this.completeAssessmentUseCase;
  }

  public getGetScaleCatalogUseCase(): GetScaleCatalogUseCase {
    if (!this.getScaleCatalogUseCase) {
      this.getScaleCatalogUseCase = new GetScaleCatalogUseCase(
        this.getScaleRegistryRepository()
      );
    }
    return this.getScaleCatalogUseCase;
  }

  public getCalculateScoresUseCase(): CalculateScoresUseCase {
    if (!this.calculateScoresUseCase) {
      this.calculateScoresUseCase = new CalculateScoresUseCase(
        this.getScaleRepository(),
        this.getScoringService()
      );
    }
    return this.calculateScoresUseCase;
  }

  // Presenter Getters
  public getClinimetrixPresenter(): ClinimetrixPresenter {
    if (!this.clinimetrixPresenter) {
      this.clinimetrixPresenter = new ClinimetrixPresenter();
    }
    return this.clinimetrixPresenter;
  }

  // Configuration and Environment
  private getApiBaseUrl(): string {
    // Determine API base URL based on environment
    if (typeof window !== 'undefined') {
      // Client-side
      const isDevelopment = window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        // Development: use proxy routes to avoid CORS issues
        return '/api/clinimetrix-pro/django';
      } else {
        // Production: use direct Django backend URL
        return 'https://mindhub-django-backend.vercel.app/api/clinimetrix';
      }
    } else {
      // Server-side rendering
      return process.env.NODE_ENV === 'production' 
        ? 'https://mindhub-django-backend.vercel.app/api/clinimetrix'
        : '/api/clinimetrix-pro/django';
    }
  }

  private getAuthToken(): string | null {
    // Try to get auth token from various sources
    try {
      // From localStorage (client-side)
      if (typeof window !== 'undefined') {
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          const session = JSON.parse(supabaseSession);
          return session?.access_token || null;
        }
      }

      // From environment variable (server-side)
      return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    } catch (error) {
      console.warn('Could not retrieve auth token:', error);
      return null;
    }
  }

  // Auth token management
  public updateAuthToken(token: string): void {
    this.scaleAdapter?.setAuthToken(token);
    this.assessmentAdapter?.setAuthToken(token);
    this.scoringService?.setAuthToken(token);
  }

  public clearAuthToken(): void {
    this.scaleAdapter?.setAuthToken('');
    this.assessmentAdapter?.setAuthToken('');
    this.scoringService?.setAuthToken('');
  }

  // Configuration management
  public configure(config: {
    apiBaseUrl?: string;
    authToken?: string;
    environment?: 'development' | 'production' | 'test';
  }): void {
    if (config.authToken) {
      this.updateAuthToken(config.authToken);
    }

    if (config.apiBaseUrl) {
      // If base URL changes, recreate the adapters
      if (this.scaleAdapter) {
        this.scaleAdapter = new DjangoScaleAdapter(config.apiBaseUrl);
        if (config.authToken) {
          this.scaleAdapter.setAuthToken(config.authToken);
        }
      }

      if (this.assessmentAdapter) {
        this.assessmentAdapter = new DjangoAssessmentAdapter(config.apiBaseUrl);
        if (config.authToken) {
          this.assessmentAdapter.setAuthToken(config.authToken);
        }
      }

      // Reset repositories to use new adapters
      this.scaleRepository = null;
      this.assessmentRepository = null;
      this.scaleRegistryRepository = null;
    }
  }

  // Health check and connectivity
  public async healthCheck(): Promise<{
    healthy: boolean;
    services: {
      djangoApi: boolean;
      scoringService: boolean;
      authentication: boolean;
    };
  }> {
    const results = {
      healthy: true,
      services: {
        djangoApi: false,
        scoringService: false,
        authentication: false
      }
    };

    try {
      // Test Django API connectivity
      const scaleRepo = this.getScaleRepository();
      await scaleRepo.findAll({ isActive: true });
      results.services.djangoApi = true;
    } catch (error) {
      console.warn('Django API health check failed:', error);
      results.healthy = false;
    }

    try {
      // Test scoring service
      const scoringService = this.getScoringService();
      // Note: This would need a specific health endpoint
      results.services.scoringService = true;
    } catch (error) {
      console.warn('Scoring service health check failed:', error);
    }

    try {
      // Test authentication
      const token = this.getAuthToken();
      results.services.authentication = !!token;
    } catch (error) {
      console.warn('Authentication health check failed:', error);
    }

    return results;
  }

  // Reset container (useful for testing)
  public reset(): void {
    this.scaleRepository = null;
    this.assessmentRepository = null;
    this.scaleRegistryRepository = null;
    this.scaleAdapter = null;
    this.assessmentAdapter = null;
    this.scoringService = null;
    this.createAssessmentUseCase = null;
    this.completeAssessmentUseCase = null;
    this.getScaleCatalogUseCase = null;
    this.calculateScoresUseCase = null;
    this.clinimetrixPresenter = null;
  }

  // Development and debugging helpers
  public getContainerState(): {
    repositories: string[];
    useCases: string[];
    adapters: string[];
    presenters: string[];
  } {
    return {
      repositories: [
        this.scaleRepository ? 'ScaleRepository' : null,
        this.assessmentRepository ? 'AssessmentRepository' : null,
        this.scaleRegistryRepository ? 'ScaleRegistryRepository' : null,
      ].filter(Boolean) as string[],
      
      useCases: [
        this.createAssessmentUseCase ? 'CreateAssessmentUseCase' : null,
        this.completeAssessmentUseCase ? 'CompleteAssessmentUseCase' : null,
        this.getScaleCatalogUseCase ? 'GetScaleCatalogUseCase' : null,
        this.calculateScoresUseCase ? 'CalculateScoresUseCase' : null,
      ].filter(Boolean) as string[],
      
      adapters: [
        this.scaleAdapter ? 'DjangoScaleAdapter' : null,
        this.assessmentAdapter ? 'DjangoAssessmentAdapter' : null,
        this.scoringService ? 'ScoringService' : null,
      ].filter(Boolean) as string[],
      
      presenters: [
        this.clinimetrixPresenter ? 'ClinimetrixPresenter' : null,
      ].filter(Boolean) as string[]
    };
  }
}