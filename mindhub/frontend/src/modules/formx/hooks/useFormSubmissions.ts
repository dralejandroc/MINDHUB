/**
 * useFormSubmissions Hook
 * React hook that provides form submission management functionality using Clean Architecture
 */

import { useState, useCallback, useEffect } from 'react';
import { FormXContainer } from '../container/FormXContainer';
import { FormSubmissionPresenter, FormSubmissionViewModel } from '../presenters/FormSubmissionPresenter';
import { CreateFormSubmissionRequest } from '../usecases/CreateFormSubmissionUseCase';
import { SubmitFormRequest } from '../usecases/SubmitFormUseCase';
import { FormSubmissionFilters } from '../repositories/FormSubmissionRepository';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/hooks/useTenantContext';
import toast from 'react-hot-toast';

export interface UseFormSubmissionsOptions {
  autoLoad?: boolean;
  formId?: string;
  patientId?: string;
  filters?: FormSubmissionFilters;
  includeArchived?: boolean;
  sortBy?: 'date' | 'status' | 'progress' | 'time';
}

export interface UseFormSubmissionsReturn {
  submissions: FormSubmissionViewModel[];
  loading: boolean;
  error: string | null;
  stats: ReturnType<typeof FormSubmissionPresenter.calculateStats>;
  
  // Actions
  loadSubmissions: () => Promise<void>;
  searchSubmissions: (query: string) => Promise<void>;
  createSubmission: (request: CreateFormSubmissionRequest) => Promise<FormSubmissionViewModel>;
  updateSubmissionData: (id: string, data: Record<string, any>) => Promise<FormSubmissionViewModel>;
  submitForm: (request: SubmitFormRequest) => Promise<FormSubmissionViewModel>;
  reviewSubmission: (id: string, reviewedBy: string, notes?: string) => Promise<FormSubmissionViewModel>;
  archiveSubmission: (id: string) => Promise<void>;
  restoreSubmission: (id: string) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  addAttachment: (submissionId: string, attachment: any) => Promise<FormSubmissionViewModel>;
  removeAttachment: (submissionId: string, attachmentId: string) => Promise<FormSubmissionViewModel>;
  addSignature: (submissionId: string, signature: any) => Promise<FormSubmissionViewModel>;
  
  // Bulk operations
  bulkArchive: (submissionIds: string[]) => Promise<void>;
  bulkUpdate: (submissionIds: string[], updates: any) => Promise<FormSubmissionViewModel[]>;
  exportSubmissions: (format?: 'json' | 'csv' | 'xlsx') => Promise<void>;
  
  // Analytics and reporting
  getCompletionAnalytics: () => Promise<any>;
  getSubmissionsNeedingAttention: () => Array<{
    submission: FormSubmissionViewModel;
    issues: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Filtering and sorting
  setFilters: (filters: FormSubmissionFilters) => void;
  setSortBy: (sortBy: 'date' | 'status' | 'progress' | 'time') => void;
  filterBySearch: (query: string) => FormSubmissionViewModel[];
  groupByStatus: () => Map<string, FormSubmissionViewModel[]>;
}

export function useFormSubmissions(options: UseFormSubmissionsOptions = {}): UseFormSubmissionsReturn {
  const { user } = useAuth();
  const { getCurrentTenantId, getCurrentTenantType } = useTenantContext();
  
  // Get container instance
  const container = FormXContainer.getInstance();
  const createSubmissionUseCase = container.getCreateFormSubmissionUseCase();
  const submitFormUseCase = container.getSubmitFormUseCase();
  const submissionRepository = container.getFormSubmissionRepository();

  // State
  const [submissions, setSubmissions] = useState<FormSubmissionViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FormSubmissionFilters>(options.filters || {});
  const [sortBy, setSortByState] = useState<'date' | 'status' | 'progress' | 'time'>(
    options.sortBy || 'date'
  );
  const [formNames, setFormNames] = useState<Map<string, string>>(new Map());

  /**
   * Load submissions using Clean Architecture
   */
  const loadSubmissions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Prepare filters with tenant context and options
      const finalFilters: FormSubmissionFilters = {
        ...filters,
        formId: options.formId,
        patientId: options.patientId,
        clinicId: getCurrentTenantType() === 'clinic' ? getCurrentTenantId() : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? getCurrentTenantId() : undefined,
        isActive: options.includeArchived ? undefined : true
      };

      // Execute through repository
      const submissionEntities = await submissionRepository.findAll(finalFilters);

      // TODO: Load form names for display
      const formNamesMap = new Map<string, string>();
      setFormNames(formNamesMap);

      // Transform to view models using presenter
      const viewModels = FormSubmissionPresenter.toListViewModel(submissionEntities, formNamesMap);

      // Apply sorting
      const sortedEntities = FormSubmissionPresenter.sortSubmissions(submissionEntities, sortBy);
      const sortedViewModels = sortedEntities.map(entity => 
        FormSubmissionPresenter.toViewModel(entity, formNamesMap.get(entity.formId))
      );

      setSubmissions(sortedViewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading submissions';
      setError(errorMessage);
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    filters,
    options.formId,
    options.patientId,
    options.includeArchived,
    sortBy,
    getCurrentTenantId,
    getCurrentTenantType,
    submissionRepository
  ]);

  /**
   * Search submissions
   */
  const searchSubmissions = useCallback(async (query: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const finalFilters: FormSubmissionFilters = {
        ...filters,
        formId: options.formId,
        patientId: options.patientId,
        clinicId: getCurrentTenantType() === 'clinic' ? getCurrentTenantId() : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? getCurrentTenantId() : undefined,
        isActive: options.includeArchived ? undefined : true,
        searchQuery: query
      };

      const submissionEntities = await submissionRepository.search(query, finalFilters);
      const sortedEntities = FormSubmissionPresenter.sortSubmissions(submissionEntities, sortBy);
      const viewModels = sortedEntities.map(entity => 
        FormSubmissionPresenter.toViewModel(entity, formNames.get(entity.formId))
      );

      setSubmissions(viewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error searching submissions';
      setError(errorMessage);
      console.error('Error searching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    filters,
    options.formId,
    options.patientId,
    options.includeArchived,
    sortBy,
    formNames,
    getCurrentTenantId,
    getCurrentTenantType,
    submissionRepository
  ]);

  /**
   * Create new submission
   */
  const createSubmission = useCallback(async (request: CreateFormSubmissionRequest): Promise<FormSubmissionViewModel> => {
    try {
      // Add tenant context
      const fullRequest = {
        ...request,
        clinicId: getCurrentTenantType() === 'clinic' ? getCurrentTenantId() : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? getCurrentTenantId() : undefined
      };

      // Execute use case
      const submissionEntity = await createSubmissionUseCase.execute(fullRequest);
      
      toast.success('Formulario iniciado exitosamente');
      
      // Transform to view model
      const viewModel = FormSubmissionPresenter.toViewModel(
        submissionEntity, 
        formNames.get(submissionEntity.formId)
      );
      
      // Refresh submissions list
      await loadSubmissions();
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [createSubmissionUseCase, getCurrentTenantId, getCurrentTenantType, formNames, loadSubmissions]);

  /**
   * Update submission data (for drafts)
   */
  const updateSubmissionData = useCallback(async (id: string, data: Record<string, any>): Promise<FormSubmissionViewModel> => {
    try {
      const updatedEntity = await submissionRepository.updateData(id, data);
      
      toast.success('Datos guardados');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        updatedEntity,
        formNames.get(updatedEntity.formId)
      );
      
      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Submit form
   */
  const submitForm = useCallback(async (request: SubmitFormRequest): Promise<FormSubmissionViewModel> => {
    try {
      // Execute use case
      const submittedEntity = await submitFormUseCase.execute(request);
      
      toast.success('Formulario enviado exitosamente');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        submittedEntity,
        formNames.get(submittedEntity.formId)
      );
      
      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === request.submissionId ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error submitting form';
      toast.error(errorMessage);
      throw err;
    }
  }, [submitFormUseCase, formNames]);

  /**
   * Review submission
   */
  const reviewSubmission = useCallback(async (id: string, reviewedBy: string, notes?: string): Promise<FormSubmissionViewModel> => {
    try {
      const reviewedEntity = await submissionRepository.review(id, reviewedBy, notes);
      
      toast.success('Formulario revisado exitosamente');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        reviewedEntity,
        formNames.get(reviewedEntity.formId)
      );
      
      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error reviewing submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Archive submission
   */
  const archiveSubmission = useCallback(async (id: string) => {
    try {
      await submissionRepository.archive(id);
      
      toast.success('Formulario archivado');
      
      // Remove from list if not including archived
      if (!options.includeArchived) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      } else {
        // Update status - would need to reload or update locally
        await loadSubmissions();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error archiving submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, options.includeArchived, loadSubmissions]);

  /**
   * Restore submission
   */
  const restoreSubmission = useCallback(async (id: string) => {
    try {
      const restoredEntity = await submissionRepository.restore(id);
      
      toast.success('Formulario restaurado');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        restoredEntity,
        formNames.get(restoredEntity.formId)
      );
      
      setSubmissions(prev => 
        prev.map(s => s.id === id ? viewModel : s)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error restoring submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Delete submission
   */
  const deleteSubmission = useCallback(async (id: string) => {
    try {
      await submissionRepository.delete(id);
      
      toast.success('Formulario eliminado');
      
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting submission';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository]);

  /**
   * Add attachment to submission
   */
  const addAttachment = useCallback(async (submissionId: string, attachment: any): Promise<FormSubmissionViewModel> => {
    try {
      const updatedEntity = await submissionRepository.addAttachment(submissionId, attachment);
      
      toast.success('Archivo adjunto agregado');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        updatedEntity,
        formNames.get(updatedEntity.formId)
      );
      
      setSubmissions(prev => 
        prev.map(s => s.id === submissionId ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding attachment';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Remove attachment from submission
   */
  const removeAttachment = useCallback(async (submissionId: string, attachmentId: string): Promise<FormSubmissionViewModel> => {
    try {
      const updatedEntity = await submissionRepository.removeAttachment(submissionId, attachmentId);
      
      toast.success('Archivo adjunto eliminado');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        updatedEntity,
        formNames.get(updatedEntity.formId)
      );
      
      setSubmissions(prev => 
        prev.map(s => s.id === submissionId ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error removing attachment';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Add signature to submission
   */
  const addSignature = useCallback(async (submissionId: string, signature: any): Promise<FormSubmissionViewModel> => {
    try {
      const updatedEntity = await submissionRepository.addSignature(submissionId, signature);
      
      toast.success('Firma agregada');
      
      const viewModel = FormSubmissionPresenter.toViewModel(
        updatedEntity,
        formNames.get(updatedEntity.formId)
      );
      
      setSubmissions(prev => 
        prev.map(s => s.id === submissionId ? viewModel : s)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding signature';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Bulk archive submissions
   */
  const bulkArchive = useCallback(async (submissionIds: string[]) => {
    try {
      await submissionRepository.bulkArchive(submissionIds);
      
      toast.success(`${submissionIds.length} formularios archivados`);
      
      // Remove from list if not including archived
      if (!options.includeArchived) {
        setSubmissions(prev => prev.filter(s => !submissionIds.includes(s.id)));
      } else {
        await loadSubmissions();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error archiving submissions';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, options.includeArchived, loadSubmissions]);

  /**
   * Bulk update submissions
   */
  const bulkUpdate = useCallback(async (submissionIds: string[], updates: any): Promise<FormSubmissionViewModel[]> => {
    try {
      const updatedEntities = await submissionRepository.bulkUpdate(submissionIds, updates);
      
      toast.success(`${submissionIds.length} formularios actualizados`);
      
      const viewModels = updatedEntities.map(entity => 
        FormSubmissionPresenter.toViewModel(entity, formNames.get(entity.formId))
      );
      
      // Update local state
      setSubmissions(prev => 
        prev.map(s => {
          const updated = viewModels.find(vm => vm.id === s.id);
          return updated || s;
        })
      );
      
      return viewModels;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating submissions';
      toast.error(errorMessage);
      throw err;
    }
  }, [submissionRepository, formNames]);

  /**
   * Export submissions
   */
  const exportSubmissions = useCallback(async (format: 'json' | 'csv' | 'xlsx' = 'json') => {
    try {
      const finalFilters: FormSubmissionFilters = {
        ...filters,
        formId: options.formId,
        patientId: options.patientId,
        clinicId: getCurrentTenantType() === 'clinic' ? getCurrentTenantId() : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? getCurrentTenantId() : undefined
      };

      const exportData = await submissionRepository.exportSubmissions(finalFilters, format);
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], { 
        type: exportData.contentType 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Exportación completada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error exporting submissions';
      toast.error(errorMessage);
      throw err;
    }
  }, [filters, options.formId, options.patientId, getCurrentTenantId, getCurrentTenantType, submissionRepository]);

  /**
   * Get completion analytics
   */
  const getCompletionAnalytics = useCallback(async () => {
    try {
      const finalFilters: FormSubmissionFilters = {
        ...filters,
        formId: options.formId,
        clinicId: getCurrentTenantType() === 'clinic' ? getCurrentTenantId() : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? getCurrentTenantId() : undefined
      };

      return await submissionRepository.getCompletionAnalytics(finalFilters);
    } catch (err) {
      console.error('Error getting completion analytics:', err);
      throw err;
    }
  }, [filters, options.formId, getCurrentTenantId, getCurrentTenantType, submissionRepository]);

  /**
   * Get submissions that need attention
   */
  const getSubmissionsNeedingAttention = useCallback(() => {
    // We need the actual entities for this, not just view models
    // For now, return empty array
    return FormSubmissionPresenter.getSubmissionsNeedingAttention([]);
  }, []);

  /**
   * Set filters
   */
  const setFilters = useCallback((newFilters: FormSubmissionFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Set sort by
   */
  const setSortBy = useCallback((newSortBy: 'date' | 'status' | 'progress' | 'time') => {
    setSortByState(newSortBy);
    
    // Apply sorting to current submissions
    setSubmissions(prev => {
      return [...prev].sort((a, b) => {
        switch (newSortBy) {
          case 'date':
            return new Date(b.dates.updated).getTime() - new Date(a.dates.updated).getTime();
          case 'status':
            const statusOrder = { 'submitted': 0, 'draft': 1, 'reviewed': 2, 'processed': 3, 'archived': 4 };
            return statusOrder[a.status.value] - statusOrder[b.status.value];
          case 'progress':
            return b.progress.percentage - a.progress.percentage;
          case 'time':
            const timeA = a.timeSpent?.seconds || 0;
            const timeB = b.timeSpent?.seconds || 0;
            return timeB - timeA;
          default:
            return 0;
        }
      });
    });
  }, []);

  /**
   * Filter submissions by search query (local filtering)
   */
  const filterBySearch = useCallback((query: string): FormSubmissionViewModel[] => {
    return FormSubmissionPresenter.filterBySearch(
      [], // We need actual entities here
      query
    ).map(entity => FormSubmissionPresenter.toViewModel(entity, formNames.get(entity.formId)));
  }, [formNames]);

  /**
   * Group submissions by status (local grouping)
   */
  const groupByStatus = useCallback((): Map<string, FormSubmissionViewModel[]> => {
    const groups = new Map<string, FormSubmissionViewModel[]>();
    
    submissions.forEach(submission => {
      const status = submission.status.label;
      if (!groups.has(status)) {
        groups.set(status, []);
      }
      groups.get(status)!.push(submission);
    });

    return groups;
  }, [submissions]);

  /**
   * Auto-load on mount and dependency changes
   */
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadSubmissions();
    }
  }, [loadSubmissions, options.autoLoad]);

  // Calculate statistics using presenter
  const stats = FormSubmissionPresenter.calculateStats([], formNames);

  return {
    submissions,
    loading,
    error,
    stats,
    loadSubmissions,
    searchSubmissions,
    createSubmission,
    updateSubmissionData,
    submitForm,
    reviewSubmission,
    archiveSubmission,
    restoreSubmission,
    deleteSubmission,
    addAttachment,
    removeAttachment,
    addSignature,
    bulkArchive,
    bulkUpdate,
    exportSubmissions,
    getCompletionAnalytics,
    getSubmissionsNeedingAttention,
    setFilters,
    setSortBy,
    filterBySearch,
    groupByStatus
  };
}