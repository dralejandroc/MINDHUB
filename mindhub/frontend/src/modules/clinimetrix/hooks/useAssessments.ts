/**
 * useAssessments Hook
 * React Hook integrating Clean Architecture for assessment management
 * Provides assessment functionality without exposing implementation details
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ClinimetrixContainer } from '../container/ClinimetrixContainer';
import { CreateAssessmentRequest } from '../usecases/CreateAssessmentUseCase';
import { CompleteAssessmentRequest } from '../usecases/CompleteAssessmentUseCase';
import { AssessmentViewModel, AssessmentResultsViewModel } from '../presenters/ClinimetrixPresenter';
import { AssessmentFilters } from '../repositories/AssessmentRepository';

export interface UseAssessmentsOptions {
  autoLoad?: boolean;
  patientId?: string;
  scaleId?: string;
  administratorId?: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface UseAssessmentsReturn {
  // State
  assessments: AssessmentViewModel[];
  currentAssessment: AssessmentViewModel | null;
  assessmentResults: AssessmentResultsViewModel | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadAssessments: (filters?: AssessmentFilters) => Promise<void>;
  createAssessment: (request: CreateAssessmentRequest) => Promise<AssessmentViewModel>;
  getAssessment: (id: string) => Promise<AssessmentViewModel | null>;
  updateAssessmentResponse: (assessmentId: string, itemNumber: number, value: any) => Promise<void>;
  completeAssessment: (request: CompleteAssessmentRequest) => Promise<AssessmentResultsViewModel>;
  cancelAssessment: (assessmentId: string) => Promise<void>;
  deleteAssessment: (assessmentId: string) => Promise<void>;
  
  // Assessment flow
  startAssessment: (scaleId: string, patientId: string) => Promise<string>; // Returns assessment URL
  continueAssessment: (assessmentId: string) => Promise<string>; // Returns assessment URL
  saveAndExit: (assessmentId: string) => Promise<void>;
  
  // Patient-specific
  getPatientAssessments: (patientId: string) => Promise<void>;
  getPatientStats: (patientId: string) => Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageCompletionRate: number;
    scalesUsed: string[];
  }>;
  
  // Scale-specific
  getScaleAssessments: (scaleId: string) => Promise<void>;
  getScaleStats: (scaleId: string) => Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    averageCompletionTime: number;
  }>;
  
  // Filters and search
  activeFilters: AssessmentFilters;
  setFilters: (filters: Partial<AssessmentFilters>) => void;
  clearFilters: () => void;
  
  // Helpers
  refreshAssessments: () => Promise<void>;
  getRecentAssessments: (limit?: number) => Promise<void>;
  cleanupExpiredAssessments: () => Promise<void>;
}

export function useAssessments(options: UseAssessmentsOptions = {}): UseAssessmentsReturn {
  const {
    autoLoad = false,
    patientId,
    scaleId,
    administratorId,
    clinicId,
    workspaceId
  } = options;

  // Get use cases from container
  const container = ClinimetrixContainer.getInstance();
  const createAssessmentUseCase = container.getCreateAssessmentUseCase();
  const completeAssessmentUseCase = container.getCompleteAssessmentUseCase();
  const presenter = container.getClinimetrixPresenter();
  const assessmentRepository = container.getAssessmentRepository();
  const scaleRepository = container.getScaleRepository();

  // State
  const [assessments, setAssessments] = useState<AssessmentViewModel[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentViewModel | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultsViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<AssessmentFilters>({
    patientId,
    scaleId,
    administratorId,
    clinicId,
    workspaceId
  });

  // Load assessments with filters
  const loadAssessments = useCallback(async (filters?: AssessmentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestFilters = {
        ...activeFilters,
        ...filters
      };

      const assessmentEntities = await assessmentRepository.findAll(requestFilters);
      
      // Present assessments using presenter
      const presentedAssessments = await Promise.all(
        assessmentEntities.map(async (assessment) => {
          const scale = await scaleRepository.findById(assessment.scaleId);
          return presenter.presentAssessment(assessment, scale || undefined);
        })
      );

      setAssessments(presentedAssessments);
      
      if (filters) {
        setActiveFilters(prev => ({ ...prev, ...filters }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading assessments';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  }, [assessmentRepository, scaleRepository, presenter, activeFilters]);

  // Create assessment
  const createAssessment = useCallback(async (request: CreateAssessmentRequest): Promise<AssessmentViewModel> => {
    try {
      setError(null);
      
      const assessment = await createAssessmentUseCase.execute(request);
      const scale = await scaleRepository.findById(assessment.scaleId);
      const viewModel = presenter.presentAssessment(assessment, scale || undefined);
      
      // Add to assessments list
      setAssessments(prev => [viewModel, ...prev]);
      
      toast.success('Evaluación creada exitosamente');
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [createAssessmentUseCase, scaleRepository, presenter]);

  // Get single assessment
  const getAssessment = useCallback(async (id: string): Promise<AssessmentViewModel | null> => {
    try {
      setError(null);
      const assessment = await assessmentRepository.findById(id);
      
      if (!assessment) {
        return null;
      }

      const scale = await scaleRepository.findById(assessment.scaleId);
      const viewModel = presenter.presentAssessment(assessment, scale || undefined);
      
      setCurrentAssessment(viewModel);
      return viewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading assessment';
      setError(errorMessage);
      console.error('Error loading assessment:', err);
      return null;
    }
  }, [assessmentRepository, scaleRepository, presenter]);

  // Update assessment response
  const updateAssessmentResponse = useCallback(async (
    assessmentId: string, 
    itemNumber: number, 
    value: any
  ) => {
    try {
      setError(null);
      
      const assessment = await assessmentRepository.findById(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const updatedAssessment = assessment.addResponse(itemNumber, value);
      await assessmentRepository.update(updatedAssessment);
      
      // Update current assessment if it's the one being modified
      if (currentAssessment?.id === assessmentId) {
        const scale = await scaleRepository.findById(updatedAssessment.scaleId);
        const viewModel = presenter.presentAssessment(updatedAssessment, scale || undefined);
        setCurrentAssessment(viewModel);
      }
      
      // Update in assessments list
      setAssessments(prev => prev.map(a => 
        a.id === assessmentId 
          ? { ...a, progress: { ...a.progress, completedItems: a.progress.completedItems + 1 } }
          : a
      ));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating response';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating assessment response:', err);
    }
  }, [assessmentRepository, scaleRepository, presenter, currentAssessment]);

  // Complete assessment
  const completeAssessment = useCallback(async (
    request: CompleteAssessmentRequest
  ): Promise<AssessmentResultsViewModel> => {
    try {
      setError(null);
      
      const result = await completeAssessmentUseCase.execute(request);
      const scale = await scaleRepository.findById(result.assessment.scaleId);
      
      if (!scale) {
        throw new Error('Scale not found for assessment results');
      }

      const resultsViewModel = presenter.presentAssessmentResults(result.assessment, scale);
      setAssessmentResults(resultsViewModel);
      
      // Update assessments list
      await loadAssessments();
      
      toast.success('Evaluación completada exitosamente');
      return resultsViewModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error completing assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [completeAssessmentUseCase, scaleRepository, presenter, loadAssessments]);

  // Cancel assessment
  const cancelAssessment = useCallback(async (assessmentId: string) => {
    try {
      setError(null);
      
      const assessment = await assessmentRepository.findById(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const cancelledAssessment = assessment.cancel();
      await assessmentRepository.update(cancelledAssessment);
      
      // Update assessments list
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      
      if (currentAssessment?.id === assessmentId) {
        setCurrentAssessment(null);
      }
      
      toast.success('Evaluación cancelada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cancelling assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error cancelling assessment:', err);
    }
  }, [assessmentRepository, currentAssessment]);

  // Delete assessment
  const deleteAssessment = useCallback(async (assessmentId: string) => {
    try {
      setError(null);
      
      await assessmentRepository.delete(assessmentId);
      
      // Update assessments list
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      
      if (currentAssessment?.id === assessmentId) {
        setCurrentAssessment(null);
      }
      
      toast.success('Evaluación eliminada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error deleting assessment:', err);
    }
  }, [assessmentRepository, currentAssessment]);

  // Start assessment (creates and returns Django URL)
  const startAssessment = useCallback(async (scaleId: string, patientId: string): Promise<string> => {
    try {
      setError(null);
      
      const assessment = await createAssessmentUseCase.execute({
        scaleId,
        patientId,
        administratorId: administratorId || 'current-user', // TODO: Get from auth context
        clinicId,
        workspaceId
      });

      // Return Django assessment URL for hybrid system
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mindhub-django-backend.vercel.app'
        : 'http://localhost:8000';
      
      return `${baseUrl}/assessments/${assessment.id}/focused-take/`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error starting assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [createAssessmentUseCase, administratorId, clinicId, workspaceId]);

  // Continue assessment (returns Django URL)
  const continueAssessment = useCallback(async (assessmentId: string): Promise<string> => {
    try {
      setError(null);
      
      const assessment = await assessmentRepository.findById(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      if (!assessment.canBeContinued()) {
        throw new Error('Assessment cannot be continued');
      }

      // Return Django assessment URL for hybrid system
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mindhub-django-backend.vercel.app'
        : 'http://localhost:8000';
      
      return `${baseUrl}/assessments/${assessmentId}/focused-take/`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error continuing assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [assessmentRepository]);

  // Save and exit assessment
  const saveAndExit = useCallback(async (assessmentId: string) => {
    try {
      setError(null);
      
      const assessment = await assessmentRepository.findById(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Update last activity time
      const updatedAssessment = assessment; // Assessment already tracks last activity
      await assessmentRepository.update(updatedAssessment);
      
      toast.success('Progreso guardado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving progress';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving and exiting assessment:', err);
    }
  }, [assessmentRepository]);

  // Get patient assessments
  const getPatientAssessments = useCallback(async (patientId: string) => {
    await loadAssessments({ patientId });
  }, [loadAssessments]);

  // Get patient stats
  const getPatientStats = useCallback(async (patientId: string) => {
    return await assessmentRepository.getPatientStats(patientId);
  }, [assessmentRepository]);

  // Get scale assessments
  const getScaleAssessments = useCallback(async (scaleId: string) => {
    await loadAssessments({ scaleId });
  }, [loadAssessments]);

  // Get scale stats
  const getScaleStats = useCallback(async (scaleId: string) => {
    return await assessmentRepository.getScaleStats(scaleId);
  }, [assessmentRepository]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<AssessmentFilters>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setActiveFilters({
      patientId,
      scaleId,
      administratorId,
      clinicId,
      workspaceId
    });
  }, [patientId, scaleId, administratorId, clinicId, workspaceId]);

  // Refresh assessments
  const refreshAssessments = useCallback(async () => {
    await loadAssessments(activeFilters);
  }, [loadAssessments, activeFilters]);

  // Get recent assessments
  const getRecentAssessments = useCallback(async (limit: number = 10) => {
    await loadAssessments({ ...activeFilters, dateFrom: undefined, dateTo: undefined });
    const recentAssessments = await assessmentRepository.getRecent(limit, activeFilters);
    const presentedAssessments = await Promise.all(
      recentAssessments.map(async (assessment) => {
        const scale = await scaleRepository.findById(assessment.scaleId);
        return presenter.presentAssessment(assessment, scale || undefined);
      })
    );
    setAssessments(presentedAssessments);
  }, [assessmentRepository, scaleRepository, presenter, activeFilters]);

  // Cleanup expired assessments
  const cleanupExpiredAssessments = useCallback(async () => {
    try {
      const expiredAssessments = await assessmentRepository.findExpired();
      
      for (const assessment of expiredAssessments) {
        const cancelledAssessment = assessment.cancel();
        await assessmentRepository.update(cancelledAssessment);
      }
      
      if (expiredAssessments.length > 0) {
        toast.success(`${expiredAssessments.length} evaluaciones expiradas canceladas automáticamente`);
        await refreshAssessments();
      }
    } catch (err) {
      console.error('Error cleaning up expired assessments:', err);
    }
  }, [assessmentRepository, refreshAssessments]);

  // Auto-load assessments on mount
  useEffect(() => {
    if (autoLoad) {
      loadAssessments();
    }
  }, [autoLoad, loadAssessments]);

  // Cleanup expired assessments periodically
  useEffect(() => {
    const interval = setInterval(cleanupExpiredAssessments, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [cleanupExpiredAssessments]);

  // Memoized return object
  return useMemo(() => ({
    // State
    assessments,
    currentAssessment,
    assessmentResults,
    loading,
    error,
    
    // Actions
    loadAssessments,
    createAssessment,
    getAssessment,
    updateAssessmentResponse,
    completeAssessment,
    cancelAssessment,
    deleteAssessment,
    
    // Assessment flow
    startAssessment,
    continueAssessment,
    saveAndExit,
    
    // Patient-specific
    getPatientAssessments,
    getPatientStats,
    
    // Scale-specific
    getScaleAssessments,
    getScaleStats,
    
    // Filters and search
    activeFilters,
    setFilters,
    clearFilters,
    
    // Helpers
    refreshAssessments,
    getRecentAssessments,
    cleanupExpiredAssessments
  }), [
    assessments,
    currentAssessment,
    assessmentResults,
    loading,
    error,
    loadAssessments,
    createAssessment,
    getAssessment,
    updateAssessmentResponse,
    completeAssessment,
    cancelAssessment,
    deleteAssessment,
    startAssessment,
    continueAssessment,
    saveAndExit,
    getPatientAssessments,
    getPatientStats,
    getScaleAssessments,
    getScaleStats,
    activeFilters,
    setFilters,
    clearFilters,
    refreshAssessments,
    getRecentAssessments,
    cleanupExpiredAssessments
  ]);
}