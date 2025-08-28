/**
 * usePatients Hook
 * React hook that provides patient management functionality using Clean Architecture
 */

import { useState, useCallback, useEffect } from 'react';
import { ExpedixContainer } from '../container/ExpedixContainer';
import { PatientPresenter, PatientViewModel } from '../presenters/PatientPresenter';
import { CreatePatientRequest } from '../usecases/CreatePatientUseCase';
import { PatientFilters } from '../repositories/PatientRepository';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/hooks/useTenantContext';
import toast from 'react-hot-toast';

export interface UsePatientsOptions {
  autoLoad?: boolean;
  filters?: PatientFilters;
  includeInactive?: boolean;
  sortBy?: 'name' | 'date' | 'risk' | 'category';
}

export interface UsePatientsReturn {
  patients: PatientViewModel[];
  loading: boolean;
  error: string | null;
  stats: ReturnType<typeof PatientPresenter.calculateDashboardStats>;
  
  // Actions
  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  createPatient: (request: CreatePatientRequest) => Promise<PatientViewModel>;
  updatePatient: (id: string, data: any) => Promise<PatientViewModel>;
  archivePatient: (id: string) => Promise<void>;
  restorePatient: (id: string) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  
  // Filtering and sorting
  setFilters: (filters: PatientFilters) => void;
  setSortBy: (sortBy: 'name' | 'date' | 'risk' | 'category') => void;
  filterBySearch: (query: string) => PatientViewModel[];
  groupByCategory: () => Map<string, PatientViewModel[]>;
}

export function usePatients(options: UsePatientsOptions = {}): UsePatientsReturn {
  const { user } = useAuth();
  const { getCurrentTenantId, getCurrentTenantType } = useTenantContext();
  
  // Get container instance
  const container = ExpedixContainer.getInstance();
  const createPatientUseCase = container.getCreatePatientUseCase();
  const patientRepository = container.getPatientRepository();

  // State
  const [patients, setPatients] = useState<PatientViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PatientFilters>(options.filters || {});
  const [sortBy, setSortByState] = useState<'name' | 'date' | 'risk' | 'category'>(
    options.sortBy || 'name'
  );
  const [lastVisitDates, setLastVisitDates] = useState<Map<string, Date>>(new Map());

  /**
   * Load patients using Clean Architecture
   */
  const loadPatients = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Prepare filters with tenant context
      const finalFilters: PatientFilters = {
        ...filters,
        clinicId: getCurrentTenantType() === 'clinic' ? (getCurrentTenantId() || undefined) : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? (getCurrentTenantId() || undefined) : undefined,
        isActive: options.includeInactive ? undefined : true
      };

      // Execute through repository
      const patientEntities = await patientRepository.findAll(finalFilters);

      // TODO: Load last visit dates for each patient
      // This would come from consultation repository
      const visitDates = new Map<string, Date>();
      setLastVisitDates(visitDates);

      // Transform to view models using presenter
      const viewModels = PatientPresenter.toListViewModel(patientEntities, visitDates);

      // Apply sorting
      const sortedViewModels = PatientPresenter.sortPatients(viewModels, sortBy);

      setPatients(sortedViewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading patients';
      setError(errorMessage);
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    filters,
    options.includeInactive,
    sortBy,
    getCurrentTenantId,
    getCurrentTenantType,
    patientRepository
  ]);

  /**
   * Search patients
   */
  const searchPatients = useCallback(async (query: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const finalFilters: PatientFilters = {
        ...filters,
        clinicId: getCurrentTenantType() === 'clinic' ? (getCurrentTenantId() || undefined) : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? (getCurrentTenantId() || undefined) : undefined,
        isActive: options.includeInactive ? undefined : true
      };

      const patientEntities = await patientRepository.search(query, finalFilters);
      const viewModels = PatientPresenter.toListViewModel(patientEntities, lastVisitDates);
      const sortedViewModels = PatientPresenter.sortPatients(viewModels, sortBy);

      setPatients(sortedViewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error searching patients';
      setError(errorMessage);
      console.error('Error searching patients:', err);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    filters,
    options.includeInactive,
    sortBy,
    lastVisitDates,
    getCurrentTenantId,
    getCurrentTenantType,
    patientRepository
  ]);

  /**
   * Create new patient
   */
  const createPatient = useCallback(async (request: CreatePatientRequest): Promise<PatientViewModel> => {
    try {
      // Add tenant context
      const fullRequest = {
        ...request,
        clinicId: getCurrentTenantType() === 'clinic' ? (getCurrentTenantId() || undefined) : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? (getCurrentTenantId() || undefined) : undefined
      };

      // Execute use case
      const patientEntity = await createPatientUseCase.execute(fullRequest);
      
      toast.success('Paciente creado exitosamente');
      
      // Transform to view model
      const viewModel = PatientPresenter.toViewModel(patientEntity);
      
      // Refresh patients list
      await loadPatients();
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating patient';
      toast.error(errorMessage);
      throw err;
    }
  }, [createPatientUseCase, getCurrentTenantId, getCurrentTenantType, loadPatients]);

  /**
   * Update patient
   */
  const updatePatient = useCallback(async (id: string, data: any): Promise<PatientViewModel> => {
    try {
      const updatedEntity = await patientRepository.update(id, data);
      
      toast.success('Paciente actualizado exitosamente');
      
      const viewModel = PatientPresenter.toViewModel(updatedEntity);
      
      // Update local state
      setPatients(prev => 
        prev.map(p => p.id === id ? viewModel : p)
      );
      
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating patient';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientRepository]);

  /**
   * Archive patient
   */
  const archivePatient = useCallback(async (id: string) => {
    try {
      await patientRepository.archive(id);
      
      toast.success('Paciente archivado');
      
      // Remove from list if not including inactive
      if (!options.includeInactive) {
        setPatients(prev => prev.filter(p => p.id !== id));
      } else {
        // Update status in list
        setPatients(prev => 
          prev.map(p => 
            p.id === id 
              ? { ...p, status: { isActive: false, label: 'Inactivo', color: 'gray' } }
              : p
          )
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error archiving patient';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientRepository, options.includeInactive]);

  /**
   * Restore patient
   */
  const restorePatient = useCallback(async (id: string) => {
    try {
      await patientRepository.restore(id);
      
      toast.success('Paciente restaurado');
      
      // Update status in list
      setPatients(prev => 
        prev.map(p => 
          p.id === id 
            ? { ...p, status: { isActive: true, label: 'Activo', color: 'green' } }
            : p
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error restoring patient';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientRepository]);

  /**
   * Add tag to patient
   */
  const addTag = useCallback(async (id: string, tag: string) => {
    try {
      const updatedEntity = await patientRepository.addTag(id, tag);
      
      toast.success('Etiqueta agregada');
      
      const viewModel = PatientPresenter.toViewModel(updatedEntity);
      
      setPatients(prev => 
        prev.map(p => p.id === id ? viewModel : p)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding tag';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientRepository]);

  /**
   * Remove tag from patient
   */
  const removeTag = useCallback(async (id: string, tag: string) => {
    try {
      const updatedEntity = await patientRepository.removeTag(id, tag);
      
      toast.success('Etiqueta eliminada');
      
      const viewModel = PatientPresenter.toViewModel(updatedEntity);
      
      setPatients(prev => 
        prev.map(p => p.id === id ? viewModel : p)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error removing tag';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientRepository]);

  /**
   * Set filters
   */
  const setFilters = useCallback((newFilters: PatientFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Set sort by
   */
  const setSortBy = useCallback((newSortBy: 'name' | 'date' | 'risk' | 'category') => {
    setSortByState(newSortBy);
    
    // Apply sorting to current patients
    setPatients(prev => PatientPresenter.sortPatients(prev, newSortBy));
  }, []);

  /**
   * Filter patients by search query
   */
  const filterBySearch = useCallback((query: string): PatientViewModel[] => {
    return PatientPresenter.filterBySearch(patients, query);
  }, [patients]);

  /**
   * Group patients by category
   */
  const groupByCategory = useCallback((): Map<string, PatientViewModel[]> => {
    return PatientPresenter.groupByCategory(patients);
  }, [patients]);

  /**
   * Auto-load on mount and dependency changes
   */
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadPatients();
    }
  }, [loadPatients, options.autoLoad]);

  // Calculate statistics using presenter
  const stats = PatientPresenter.calculateDashboardStats(patients);

  return {
    patients,
    loading,
    error,
    stats,
    loadPatients,
    searchPatients,
    createPatient,
    updatePatient,
    archivePatient,
    restorePatient,
    addTag,
    removeTag,
    setFilters,
    setSortBy,
    filterBySearch,
    groupByCategory
  };
}