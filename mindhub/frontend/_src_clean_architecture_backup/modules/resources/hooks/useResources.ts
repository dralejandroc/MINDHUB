/**
 * Resources Module React Hook
 * Integration between Resources domain logic and React components
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Resource, ResourceType, ResourceStatus, ResourceAccess } from '../entities/Resource';
import { ResourceCategory } from '../entities/ResourceCategory';
import { ResourceShare } from '../entities/ResourceShare';
import { ManageResourcesUseCase } from '../usecases/ManageResourcesUseCase';
import { ShareResourceUseCase } from '../usecases/ShareResourceUseCase';
import { ResourcePresenter } from '../presenters/ResourcePresenter';
import { DjangoResourceAdapter } from '../adapters/DjangoResourceAdapter';

// View Models
import type {
  ResourceListItemViewModel,
  ResourceDetailsViewModel,
  ResourceCardViewModel,
  ResourceStatsViewModel,
  ResourceShareViewModel
} from '../presenters/ResourcePresenter';

// Use Case Interfaces
import type {
  CreateResourceRequest,
  UpdateResourceRequest,
  SearchResourcesRequest,
  ResourceOperationResult,
  ResourceListResult
} from '../usecases/ManageResourcesUseCase';

import type {
  ShareResourceRequest,
  BulkShareResourceRequest,
  ShareOperationResult,
  BulkShareOperationResult,
  ShareAccessResult
} from '../usecases/ShareResourceUseCase';

export interface UseResourcesConfig {
  clinicId?: string;
  workspaceId?: string;
  autoLoad?: boolean;
  pageSize?: number;
}

export interface ResourceFilters {
  query?: string;
  categoryId?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  tags?: string[];
  targetAudience?: string[];
  createdBy?: string;
  includeExpired?: boolean;
}

export interface UseResourcesState {
  // Data State
  resources: ResourceListItemViewModel[];
  categories: ResourceCategory[];
  shares: ResourceShareViewModel[];
  selectedResource: ResourceDetailsViewModel | null;
  resourceStats: ResourceStatsViewModel | null;

  // UI State
  loading: boolean;
  saving: boolean;
  sharing: boolean;
  error: string | null;
  success: string | null;

  // Pagination State
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };

  // Filter State
  filters: ResourceFilters;
}

export interface UseResourcesActions {
  // Resource Management
  loadResources: (filters?: ResourceFilters, page?: number) => Promise<void>;
  searchResources: (query: string) => Promise<void>;
  createResource: (request: CreateResourceRequest) => Promise<boolean>;
  updateResource: (request: UpdateResourceRequest) => Promise<boolean>;
  deleteResource: (resourceId: string) => Promise<boolean>;
  publishResource: (resourceId: string) => Promise<boolean>;
  archiveResource: (resourceId: string) => Promise<boolean>;

  // Resource Details
  selectResource: (resourceId: string) => Promise<void>;
  clearSelectedResource: () => void;
  recordView: (resourceId: string, viewDuration?: number) => Promise<void>;
  recordDownload: (resourceId: string) => Promise<void>;

  // Category Management
  loadCategories: () => Promise<void>;
  createCategory: (category: Partial<ResourceCategory>) => Promise<boolean>;
  updateCategory: (categoryId: string, updates: Partial<ResourceCategory>) => Promise<boolean>;

  // Sharing
  shareResource: (request: ShareResourceRequest) => Promise<ShareOperationResult>;
  bulkShareResources: (request: BulkShareResourceRequest) => Promise<BulkShareOperationResult>;
  accessSharedResource: (shareId: string, password?: string) => Promise<ShareAccessResult>;
  loadResourceShares: (resourceId: string) => Promise<void>;
  expireShare: (shareId: string, reason?: string) => Promise<boolean>;

  // Statistics and Analytics
  loadResourceStats: () => Promise<void>;
  exportResources: (format: 'csv' | 'json' | 'xlsx') => Promise<string>;

  // UI Actions
  setFilters: (filters: Partial<ResourceFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
  clearSuccess: () => void;
}

export type UseResourcesReturn = UseResourcesState & UseResourcesActions;

export function useResources(config: UseResourcesConfig = {}): UseResourcesReturn {
  // Dependencies
  const adapter = useMemo(() => new DjangoResourceAdapter(), []);
  const categoryAdapter = useMemo(() => new DjangoResourceAdapter(), []); // Would be DjangoCategoryAdapter
  const shareAdapter = useMemo(() => new DjangoResourceAdapter(), []); // Would be DjangoShareAdapter
  
  const manageUseCase = useMemo(() => 
    new ManageResourcesUseCase(adapter, categoryAdapter as any), [adapter, categoryAdapter]
  );
  
  const shareUseCase = useMemo(() => 
    new ShareResourceUseCase(adapter, shareAdapter as any), [adapter, shareAdapter]
  );
  
  const presenter = useMemo(() => new ResourcePresenter(), []);

  // State
  const [state, setState] = useState<UseResourcesState>({
    // Data State
    resources: [],
    categories: [],
    shares: [],
    selectedResource: null,
    resourceStats: null,

    // UI State
    loading: false,
    saving: false,
    sharing: false,
    error: null,
    success: null,

    // Pagination State
    pagination: {
      page: 1,
      pageSize: config.pageSize || 20,
      total: 0,
      hasMore: false
    },

    // Filter State
    filters: {
      query: '',
      categoryId: undefined,
      type: undefined,
      status: undefined,
      tags: [],
      targetAudience: [],
      createdBy: undefined,
      includeExpired: false
    }
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseResourcesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Error handling
  const handleError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    updateState({ error: errorMessage, loading: false, saving: false, sharing: false });
  }, [updateState]);

  // Success handling
  const handleSuccess = useCallback((message: string) => {
    updateState({ success: message, error: null });
    setTimeout(() => updateState({ success: null }), 5000);
  }, [updateState]);

  // Resource Management Actions
  const loadResources = useCallback(async (filters?: ResourceFilters, page = 1) => {
    try {
      updateState({ loading: true, error: null });

      const searchRequest: SearchResourcesRequest = {
        ...filters,
        clinicId: config.clinicId,
        workspaceId: config.workspaceId,
        limit: state.pagination.pageSize,
        offset: (page - 1) * state.pagination.pageSize,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      const result = await manageUseCase.searchResources(searchRequest);
      
      // Get categories for presentation
      const categories = state.categories; // Use cached categories
      
      // Transform to view models
      const resourceViewModels = result.resources.map(resource => {
        const category = categories.find(c => c.id === resource.categoryId);
        return presenter.presentForList(resource, category);
      });

      updateState({
        resources: page === 1 ? resourceViewModels : [...state.resources, ...resourceViewModels],
        pagination: {
          ...state.pagination,
          page,
          total: result.total,
          hasMore: result.hasMore
        },
        filters: { ...state.filters, ...filters },
        loading: false
      });

    } catch (error) {
      handleError(error);
    }
  }, [config.clinicId, config.workspaceId, state.pagination.pageSize, state.categories, state.resources, manageUseCase, presenter, updateState, handleError]);

  const searchResources = useCallback(async (query: string) => {
    await loadResources({ ...state.filters, query }, 1);
  }, [loadResources, state.filters]);

  const createResource = useCallback(async (request: CreateResourceRequest): Promise<boolean> => {
    try {
      updateState({ saving: true, error: null });

      const result = await manageUseCase.createResource({
        ...request,
        clinicId: config.clinicId,
        workspaceId: config.workspaceId
      });

      if (result.success) {
        handleSuccess('Resource created successfully');
        await loadResources(state.filters, 1); // Reload resources
        return true;
      } else {
        updateState({ error: result.error || 'Failed to create resource', saving: false });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [config.clinicId, config.workspaceId, manageUseCase, updateState, handleError, handleSuccess, loadResources, state.filters]);

  const updateResource = useCallback(async (request: UpdateResourceRequest): Promise<boolean> => {
    try {
      updateState({ saving: true, error: null });

      const result = await manageUseCase.updateResource(request);

      if (result.success) {
        handleSuccess('Resource updated successfully');
        await loadResources(state.filters, state.pagination.page); // Reload current page
        
        // Update selected resource if it's the one being updated
        if (state.selectedResource?.id === request.id && result.resource) {
          const category = state.categories.find(c => c.id === result.resource!.categoryId);
          const updatedViewModel = presenter.presentForDetails(result.resource, category);
          updateState({ selectedResource: updatedViewModel });
        }
        
        return true;
      } else {
        updateState({ error: result.error || 'Failed to update resource', saving: false });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [manageUseCase, updateState, handleError, handleSuccess, loadResources, state.filters, state.pagination.page, state.selectedResource, state.categories, presenter]);

  const deleteResource = useCallback(async (resourceId: string): Promise<boolean> => {
    try {
      updateState({ saving: true, error: null });

      const result = await manageUseCase.deleteResource(resourceId, 'current-user'); // Would get from auth context

      if (result.success) {
        handleSuccess('Resource deleted successfully');
        
        // Remove from local state
        updateState({
          resources: state.resources.filter(r => r.id !== resourceId),
          selectedResource: state.selectedResource?.id === resourceId ? null : state.selectedResource,
          saving: false
        });
        
        return true;
      } else {
        updateState({ error: result.error || 'Failed to delete resource', saving: false });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [manageUseCase, updateState, handleError, handleSuccess, state.resources, state.selectedResource]);

  const publishResource = useCallback(async (resourceId: string): Promise<boolean> => {
    try {
      updateState({ saving: true, error: null });

      const result = await manageUseCase.publishResource(resourceId, 'current-user');

      if (result.success) {
        handleSuccess('Resource published successfully');
        await loadResources(state.filters, state.pagination.page);
        return true;
      } else {
        updateState({ error: result.error || 'Failed to publish resource', saving: false });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [manageUseCase, updateState, handleError, handleSuccess, loadResources, state.filters, state.pagination.page]);

  const archiveResource = useCallback(async (resourceId: string): Promise<boolean> => {
    try {
      updateState({ saving: true, error: null });

      const result = await manageUseCase.archiveResource(resourceId, 'current-user');

      if (result.success) {
        handleSuccess('Resource archived successfully');
        await loadResources(state.filters, state.pagination.page);
        return true;
      } else {
        updateState({ error: result.error || 'Failed to archive resource', saving: false });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [manageUseCase, updateState, handleError, handleSuccess, loadResources, state.filters, state.pagination.page]);

  // Resource Details Actions
  const selectResource = useCallback(async (resourceId: string) => {
    try {
      updateState({ loading: true, error: null });

      const result = await manageUseCase.getResource(resourceId);

      if (result.success && result.resource) {
        // Record view
        await manageUseCase.recordView(resourceId);
        
        // Present for details
        const category = state.categories.find(c => c.id === result.resource!.categoryId);
        const viewModel = presenter.presentForDetails(result.resource, category);
        
        updateState({ 
          selectedResource: viewModel,
          loading: false 
        });
      } else {
        updateState({ error: result.error || 'Resource not found', loading: false });
      }
    } catch (error) {
      handleError(error);
    }
  }, [manageUseCase, state.categories, presenter, updateState, handleError]);

  const clearSelectedResource = useCallback(() => {
    updateState({ selectedResource: null });
  }, [updateState]);

  const recordView = useCallback(async (resourceId: string, viewDuration?: number) => {
    try {
      await manageUseCase.recordView(resourceId, viewDuration);
    } catch (error) {
      // Silent fail for analytics
      console.warn('Failed to record view:', error);
    }
  }, [manageUseCase]);

  const recordDownload = useCallback(async (resourceId: string) => {
    try {
      await manageUseCase.recordDownload(resourceId);
    } catch (error) {
      // Silent fail for analytics
      console.warn('Failed to record download:', error);
    }
  }, [manageUseCase]);

  // Category Management Actions
  const loadCategories = useCallback(async () => {
    try {
      // This would use a category repository/use case
      // For now, using empty array
      updateState({ categories: [] });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);

  const createCategory = useCallback(async (category: Partial<ResourceCategory>): Promise<boolean> => {
    try {
      // This would use a category use case
      handleSuccess('Category created successfully');
      await loadCategories();
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [handleSuccess, loadCategories, handleError]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<ResourceCategory>): Promise<boolean> => {
    try {
      // This would use a category use case
      handleSuccess('Category updated successfully');
      await loadCategories();
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [handleSuccess, loadCategories, handleError]);

  // Sharing Actions
  const shareResource = useCallback(async (request: ShareResourceRequest): Promise<ShareOperationResult> => {
    try {
      updateState({ sharing: true, error: null });

      const result = await shareUseCase.shareResource({
        ...request,
        clinicId: config.clinicId,
        workspaceId: config.workspaceId
      });

      if (result.success) {
        handleSuccess('Resource shared successfully');
      }

      updateState({ sharing: false });
      return result;
    } catch (error) {
      handleError(error);
      return { success: false, error: 'Failed to share resource' };
    }
  }, [shareUseCase, config.clinicId, config.workspaceId, updateState, handleError, handleSuccess]);

  const bulkShareResources = useCallback(async (request: BulkShareResourceRequest): Promise<BulkShareOperationResult> => {
    try {
      updateState({ sharing: true, error: null });

      const result = await shareUseCase.bulkShareResources({
        ...request,
        clinicId: config.clinicId,
        workspaceId: config.workspaceId
      });

      if (result.success) {
        handleSuccess(`Successfully shared with ${result.successCount} recipients`);
      }

      updateState({ sharing: false });
      return result;
    } catch (error) {
      handleError(error);
      return {
        success: false,
        successfulShares: [],
        failedShares: [{ recipientEmail: 'all', error: 'Failed to share resources' }],
        totalShares: 0,
        successCount: 0,
        failureCount: request.resourceIds.length * request.recipients.length
      };
    }
  }, [shareUseCase, config.clinicId, config.workspaceId, updateState, handleError, handleSuccess]);

  const accessSharedResource = useCallback(async (shareId: string, password?: string): Promise<ShareAccessResult> => {
    try {
      return await shareUseCase.accessSharedResource(shareId, password);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access shared resource'
      };
    }
  }, [shareUseCase]);

  const loadResourceShares = useCallback(async (resourceId: string) => {
    try {
      const shares = await shareUseCase.getResourceShares(resourceId);
      const shareViewModels = shares.map(share => presenter.presentShare(share));
      updateState({ shares: shareViewModels });
    } catch (error) {
      handleError(error);
    }
  }, [shareUseCase, presenter, updateState, handleError]);

  const expireShare = useCallback(async (shareId: string, reason?: string): Promise<boolean> => {
    try {
      const result = await shareUseCase.expireShare(shareId, 'current-user', reason);
      
      if (result.success) {
        handleSuccess('Share expired successfully');
        // Update local shares
        updateState({
          shares: state.shares.map(share => 
            share.id === shareId 
              ? { ...share, status: 'expired' as const, statusLabel: 'Expired' }
              : share
          )
        });
        return true;
      }
      
      return false;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [shareUseCase, handleSuccess, updateState, state.shares, handleError]);

  // Statistics Actions
  const loadResourceStats = useCallback(async () => {
    try {
      // This would load comprehensive statistics
      const mockStats: ResourceStatsViewModel = {
        totalResources: state.resources.length,
        publishedResources: state.resources.filter(r => r.status === 'published').length,
        draftResources: state.resources.filter(r => r.status === 'draft').length,
        archivedResources: state.resources.filter(r => r.status === 'archived').length,
        totalViews: state.resources.reduce((sum, r) => sum + r.views, 0),
        totalDownloads: state.resources.reduce((sum, r) => sum + r.downloads, 0),
        totalShares: state.shares.length,
        averageRating: state.resources.length > 0 
          ? state.resources.reduce((sum, r) => sum + r.rating, 0) / state.resources.length 
          : 0,
        growthRate: 0,
        categoryDistribution: [],
        typeDistribution: [],
        topPerformers: []
      };
      
      updateState({ resourceStats: mockStats });
    } catch (error) {
      handleError(error);
    }
  }, [state.resources, state.shares, updateState, handleError]);

  const exportResources = useCallback(async (format: 'csv' | 'json' | 'xlsx'): Promise<string> => {
    try {
      // This would call export functionality
      return `resources-export-${Date.now()}.${format}`;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  // UI Actions
  const setFilters = useCallback((filters: Partial<ResourceFilters>) => {
    updateState({ filters: { ...state.filters, ...filters } });
  }, [updateState, state.filters]);

  const clearFilters = useCallback(() => {
    const clearedFilters: ResourceFilters = {
      query: '',
      categoryId: undefined,
      type: undefined,
      status: undefined,
      tags: [],
      targetAudience: [],
      createdBy: undefined,
      includeExpired: false
    };
    updateState({ filters: clearedFilters });
  }, [updateState]);

  const setPage = useCallback((page: number) => {
    updateState({ pagination: { ...state.pagination, page } });
  }, [updateState, state.pagination]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearSuccess = useCallback(() => {
    updateState({ success: null });
  }, [updateState]);

  // Auto-load resources on mount or config change
  useEffect(() => {
    if (config.autoLoad !== false) {
      loadResources();
      loadCategories();
    }
  }, [config.autoLoad]); // Only depend on autoLoad to avoid infinite loops

  // Return state and actions
  return {
    // Data State
    resources: state.resources,
    categories: state.categories,
    shares: state.shares,
    selectedResource: state.selectedResource,
    resourceStats: state.resourceStats,

    // UI State
    loading: state.loading,
    saving: state.saving,
    sharing: state.sharing,
    error: state.error,
    success: state.success,

    // Pagination State
    pagination: state.pagination,

    // Filter State
    filters: state.filters,

    // Resource Management Actions
    loadResources,
    searchResources,
    createResource,
    updateResource,
    deleteResource,
    publishResource,
    archiveResource,

    // Resource Details Actions
    selectResource,
    clearSelectedResource,
    recordView,
    recordDownload,

    // Category Management Actions
    loadCategories,
    createCategory,
    updateCategory,

    // Sharing Actions
    shareResource,
    bulkShareResources,
    accessSharedResource,
    loadResourceShares,
    expireShare,

    // Statistics Actions
    loadResourceStats,
    exportResources,

    // UI Actions
    setFilters,
    clearFilters,
    setPage,
    clearError,
    clearSuccess
  };
}

// Re-export types for convenience
export type {
  ResourceListItemViewModel,
  ResourceDetailsViewModel,
  ResourceCardViewModel,
  ResourceStatsViewModel,
  ResourceShareViewModel,
  CreateResourceRequest,
  UpdateResourceRequest,
  ShareResourceRequest,
  BulkShareResourceRequest,
  ShareOperationResult,
  BulkShareOperationResult
};