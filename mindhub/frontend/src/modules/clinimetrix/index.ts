/**
 * ClinimetrixPro Module - Clean Architecture Implementation
 * Psychometric Scale Management and Assessment System
 * 
 * Public API exports following Clean Architecture principles:
 * - Hooks for React integration (main interface)
 * - View Models for UI consumption
 * - Container for dependency injection (if needed)
 * 
 * Internal layers (entities, use cases, repositories, adapters) 
 * are not exported to maintain architectural boundaries
 */

// Main React Hooks (Primary Interface)
export { useScales } from './hooks/useScales';
export { useAssessments } from './hooks/useAssessments';

export type {
  UseScalesOptions,
  UseScalesReturn
} from './hooks/useScales';

export type {
  UseAssessmentsOptions,
  UseAssessmentsReturn
} from './hooks/useAssessments';

// View Models for UI Components
export type {
  ScaleViewModel,
  ScaleCatalogViewModel,
  AssessmentViewModel,
  AssessmentResultsViewModel
} from './presenters/ClinimetrixPresenter';

// Container for advanced configuration (if needed)
export { ClinimetrixContainer } from './container/ClinimetrixContainer';

// Use Case Requests (for type safety in components)
export type {
  CreateAssessmentRequest
} from './usecases/CreateAssessmentUseCase';

export type {
  CompleteAssessmentRequest,
  CompleteAssessmentResult
} from './usecases/CompleteAssessmentUseCase';

export type {
  GetScaleCatalogRequest,
  GetScaleCatalogResponse
} from './usecases/GetScaleCatalogUseCase';

// Entity types for advanced usage
export type {
  ScaleCategory,
  DifficultyLevel,
  AdministrationMode
} from './entities/Scale';

export type {
  AssessmentStatus,
  AssessmentMode
} from './entities/Assessment';