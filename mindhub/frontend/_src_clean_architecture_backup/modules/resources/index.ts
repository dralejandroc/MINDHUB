/**
 * Resources Module - Clean Architecture Implementation
 * 
 * This module implements the Resources domain using Clean Architecture principles:
 * 
 * 1. Entities: Pure business objects with domain logic
 * 2. Use Cases: Application-specific business rules  
 * 3. Interface Adapters: Convert data between use cases and external concerns
 * 4. Frameworks & Drivers: External concerns like web, DB, devices, etc.
 * 
 * Domain: Medical resource management, categorization, and sharing
 */

// ================================
// ENTITIES (Domain Layer)
// ================================
export { Resource } from './entities/Resource';
export type { ResourceType, ResourceStatus, ResourceAccess } from './entities/Resource';
export type { 
  ResourceContent, 
  ResourceMetadata, 
  ResourceDistribution, 
  ResourceAnalytics
} from './entities/Resource';

export { ResourceCategory } from './entities/ResourceCategory';
export type { CategoryStatus } from './entities/ResourceCategory';
export type {
  CategorySettings,
  CategoryStatistics
} from './entities/ResourceCategory';

export { ResourceShare } from './entities/ResourceShare';
export type { ShareStatus, ShareMethod, RecipientType } from './entities/ResourceShare';
export type {
  ShareRecipient,
  ShareSettings,
  ShareDelivery,
  ShareActivity
} from './entities/ResourceShare';

// ================================
// USE CASES (Application Layer)
// ================================
export { ManageResourcesUseCase } from './usecases/ManageResourcesUseCase';
export type {
  CreateResourceRequest,
  UpdateResourceRequest,
  SearchResourcesRequest,
  ResourceOperationResult,
  ResourceListResult
} from './usecases/ManageResourcesUseCase';

export { ShareResourceUseCase } from './usecases/ShareResourceUseCase';
export type {
  ShareResourceRequest,
  BulkShareResourceRequest,
  ShareOperationResult,
  BulkShareOperationResult,
  ShareAccessResult
} from './usecases/ShareResourceUseCase';

// ================================
// INTERFACE ADAPTERS (Adapters Layer)
// ================================

// Repositories (Abstract Interfaces)
export type { ResourceRepository } from './repositories/ResourceRepository';
export type { 
  ResourceSearchFilters,
  ResourceAnalyticsData
} from './repositories/ResourceRepository';

export type { ResourceCategoryRepository } from './repositories/ResourceCategoryRepository';
export type {
  CategorySearchFilters
} from './repositories/ResourceCategoryRepository';

export type { ResourceShareRepository } from './repositories/ResourceShareRepository';
export type {
  ShareSearchFilters,
  ShareAnalyticsData,
  ShareCampaign
} from './repositories/ResourceShareRepository';

// Concrete Adapters
export { DjangoResourceAdapter } from './adapters/DjangoResourceAdapter';

// Presenters
export { ResourcePresenter } from './presenters/ResourcePresenter';
export type {
  ResourceListItemViewModel,
  ResourceDetailsViewModel,
  ResourceCardViewModel,
  ResourceStatsViewModel,
  ResourceShareViewModel
} from './presenters/ResourcePresenter';

// ================================
// FRAMEWORKS & DRIVERS (External Layer)
// ================================

// React Integration
export { useResources } from './hooks/useResources';
export type {
  UseResourcesConfig,
  ResourceFilters,
  UseResourcesState,
  UseResourcesActions,
  UseResourcesReturn
} from './hooks/useResources';

// Dependency Injection
export { 
  ResourcesContainer, 
  getResourcesContainer,
  getResourceManagement,
  getResourceSharing
} from './di/ResourcesContainer';

// ================================
// MODULE METADATA
// ================================
export const RESOURCES_MODULE = {
  name: 'Resources',
  version: '1.0.0',
  domain: 'Medical Resource Management',
  architecture: 'Clean Architecture',
  layers: {
    entities: 3,
    useCases: 2,
    adapters: 2,
    frameworks: 1
  },
  capabilities: [
    'Resource CRUD operations',
    'Category management',
    'Resource sharing',
    'Access control',
    'Analytics tracking',
    'Bulk operations',
    'Search and filtering',
    'Export functionality',
    'Security features'
  ]
} as const;