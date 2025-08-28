/**
 * useWaitingQueue Hook
 * React hook for waiting queue management in FrontDesk module
 */

import { useState, useEffect, useCallback } from 'react';
import { WaitingQueue } from '../entities/WaitingQueue';
import { 
  ManageWaitingQueueUseCase, 
  AddToQueueRequest, 
  QueueOperationResult 
} from '../usecases/ManageWaitingQueueUseCase';
import { 
  WaitingQueuePresenter, 
  QueueSummaryViewModel, 
  QueueDetailsViewModel,
  QueueDashboardViewModel,
  QueueAnalyticsViewModel
} from '../presenters/WaitingQueuePresenter';
import { DjangoWaitingQueueAdapter } from '../adapters/DjangoWaitingQueueAdapter';
import { DjangoPatientAdapter } from '../adapters/DjangoPatientAdapter';
import { DjangoAppointmentAdapter } from '../adapters/DjangoAppointmentAdapter';

interface UseWaitingQueueState {
  queues: QueueSummaryViewModel[];
  selectedQueue: QueueDetailsViewModel | null;
  dashboard: QueueDashboardViewModel | null;
  analytics: QueueAnalyticsViewModel | null;
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  dashboardLoading: boolean;
  analyticsLoading: boolean;
}

interface UseWaitingQueueActions {
  // Queue management
  loadQueues: () => Promise<void>;
  selectQueue: (queueId: string) => Promise<void>;
  clearSelectedQueue: () => void;
  
  // Patient queue operations
  addPatientToQueue: (request: AddToQueueRequest) => Promise<QueueOperationResult>;
  removePatientFromQueue: (queueId: string, patientId: string, reason: string, removedBy: string) => Promise<void>;
  movePatientInQueue: (queueId: string, patientId: string, newPosition: number, movedBy: string, reason?: string) => Promise<void>;
  getNextPatient: (queueId: string) => Promise<any>;
  
  // Queue configuration
  updateQueueConfiguration: (queueId: string, configuration: any, updatedBy: string) => Promise<void>;
  resortQueue: (queueId: string, sortMethod: string, resortedBy: string) => Promise<void>;
  
  // Queue state management
  pauseQueue: (queueId: string, pausedBy: string, reason?: string) => Promise<void>;
  resumeQueue: (queueId: string, resumedBy: string) => Promise<void>;
  clearQueue: (queueId: string, clearedBy: string, reason?: string) => Promise<void>;
  
  // Dashboard and analytics
  loadDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  loadAnalytics: (queueId: string, dateRange: { startDate: Date; endDate: Date }) => Promise<void>;
  
  // Utility operations
  findOptimalQueue: (patientId: string, professionalId: string, urgency: string, specialNeeds: string[]) => Promise<any>;
  getPatientsWithExcessiveWaitTimes: () => Promise<any>;
  
  // Data refresh
  refreshQueues: () => Promise<void>;
  refreshSelectedQueue: () => Promise<void>;
  clearError: () => void;
}

export interface UseWaitingQueueResult {
  state: UseWaitingQueueState;
  actions: UseWaitingQueueActions;
}

export function useWaitingQueue(
  clinicId?: string,
  workspaceId?: string
): UseWaitingQueueResult {
  
  // State
  const [state, setState] = useState<UseWaitingQueueState>({
    queues: [],
    selectedQueue: null,
    dashboard: null,
    analytics: null,
    loading: false,
    error: null,
    operationLoading: false,
    dashboardLoading: false,
    analyticsLoading: false,
  });

  // Dependencies
  const queueAdapter = new DjangoWaitingQueueAdapter();
  const patientAdapter = new DjangoPatientAdapter();
  const appointmentAdapter = new DjangoAppointmentAdapter();
  const queueUseCase = new ManageWaitingQueueUseCase(queueAdapter, patientAdapter, appointmentAdapter);
  const presenter = new WaitingQueuePresenter();

  // Load queues
  const loadQueues = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queues = await queueUseCase.getActiveQueues(clinicId, workspaceId);
      const queueSummaries = queues.map(queue => presenter.presentQueueSummary(queue));
      
      setState(prev => ({
        ...prev,
        queues: queueSummaries,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading queues',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Select queue
  const selectQueue = useCallback(async (queueId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queue = await queueAdapter.findById(queueId);
      
      if (!queue) {
        throw new Error('Queue not found');
      }
      
      const selectedQueue = presenter.presentQueueDetails(queue);
      
      setState(prev => ({
        ...prev,
        selectedQueue,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading queue details',
        loading: false,
      }));
    }
  }, []);

  // Clear selected queue
  const clearSelectedQueue = useCallback(() => {
    setState(prev => ({ ...prev, selectedQueue: null }));
  }, []);

  // Add patient to queue
  const addPatientToQueue = useCallback(async (request: AddToQueueRequest): Promise<QueueOperationResult> => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      const result = await queueUseCase.addPatientToQueue(request);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === request.queueId) {
        await selectQueue(request.queueId);
      }
      
      // Refresh queues and dashboard
      await loadQueues();
      if (state.dashboard) {
        await refreshDashboard();
      }
      
      setState(prev => ({ ...prev, operationLoading: false }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error adding patient to queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id, state.dashboard]);

  // Remove patient from queue
  const removePatientFromQueue = useCallback(async (
    queueId: string,
    patientId: string,
    reason: string,
    removedBy: string
  ) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueUseCase.removePatientFromQueue(queueId, patientId, reason, removedBy);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues and dashboard
      await loadQueues();
      if (state.dashboard) {
        await refreshDashboard();
      }
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error removing patient from queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id, state.dashboard]);

  // Move patient in queue
  const movePatientInQueue = useCallback(async (
    queueId: string,
    patientId: string,
    newPosition: number,
    movedBy: string,
    reason?: string
  ) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueUseCase.movePatientInQueue(queueId, patientId, newPosition, movedBy, reason);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues
      await loadQueues();
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error moving patient in queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id]);

  // Get next patient
  const getNextPatient = useCallback(async (queueId: string) => {
    try {
      return await queueUseCase.getNextPatient(queueId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error getting next patient',
      }));
      throw error;
    }
  }, []);

  // Update queue configuration
  const updateQueueConfiguration = useCallback(async (
    queueId: string,
    configuration: any,
    updatedBy: string
  ) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueUseCase.updateQueueConfiguration(queueId, configuration, updatedBy);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues
      await loadQueues();
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating queue configuration',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id]);

  // Resort queue
  const resortQueue = useCallback(async (
    queueId: string,
    sortMethod: string,
    resortedBy: string
  ) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueUseCase.resortQueue(queueId, sortMethod as any, resortedBy);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues
      await loadQueues();
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error resorting queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id]);

  // Pause queue
  const pauseQueue = useCallback(async (queueId: string, pausedBy: string, reason?: string) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueAdapter.pause(queueId, pausedBy, reason);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues and dashboard
      await loadQueues();
      if (state.dashboard) {
        await refreshDashboard();
      }
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error pausing queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id, state.dashboard]);

  // Resume queue
  const resumeQueue = useCallback(async (queueId: string, resumedBy: string) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueAdapter.resume(queueId, resumedBy);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues and dashboard
      await loadQueues();
      if (state.dashboard) {
        await refreshDashboard();
      }
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error resuming queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id, state.dashboard]);

  // Clear queue
  const clearQueue = useCallback(async (queueId: string, clearedBy: string, reason?: string) => {
    setState(prev => ({ ...prev, operationLoading: true, error: null }));
    
    try {
      await queueAdapter.clear(queueId, clearedBy, reason);
      
      // Update selected queue if it matches
      if (state.selectedQueue?.id === queueId) {
        await selectQueue(queueId);
      }
      
      // Refresh queues and dashboard
      await loadQueues();
      if (state.dashboard) {
        await refreshDashboard();
      }
      
      setState(prev => ({ ...prev, operationLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error clearing queue',
        operationLoading: false,
      }));
      throw error;
    }
  }, [state.selectedQueue?.id, state.dashboard]);

  // Load dashboard
  const loadDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, dashboardLoading: true, error: null }));
    
    try {
      const queues = await queueUseCase.getActiveQueues(clinicId, workspaceId);
      const statistics = await queueAdapter.getStatistics({ clinicId, workspaceId });
      const alerts = await queueAdapter.getQueueAlerts({ clinicId, workspaceId });
      
      const dashboard = presenter.presentDashboard(queues, statistics, alerts);
      
      setState(prev => ({
        ...prev,
        dashboard,
        dashboardLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading dashboard',
        dashboardLoading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  // Load analytics
  const loadAnalytics = useCallback(async (
    queueId: string,
    dateRange: { startDate: Date; endDate: Date }
  ) => {
    setState(prev => ({ ...prev, analyticsLoading: true, error: null }));
    
    try {
      const performanceMetrics = await queueAdapter.getPerformanceMetrics(
        queueId,
        dateRange.startDate,
        dateRange.endDate
      );
      
      const recommendations = await queueAdapter.getEfficiencyRecommendations(queueId, 30);
      
      const analytics = presenter.presentAnalytics(performanceMetrics, recommendations.recommendations);
      
      setState(prev => ({
        ...prev,
        analytics,
        analyticsLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading analytics',
        analyticsLoading: false,
      }));
    }
  }, []);

  // Find optimal queue
  const findOptimalQueue = useCallback(async (
    patientId: string,
    professionalId: string,
    urgency: string,
    specialNeeds: string[]
  ) => {
    try {
      return await queueAdapter.findOptimalQueue(
        patientId,
        professionalId,
        urgency as any,
        specialNeeds,
        { clinicId, workspaceId }
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error finding optimal queue',
      }));
      throw error;
    }
  }, [clinicId, workspaceId]);

  // Get patients with excessive wait times
  const getPatientsWithExcessiveWaitTimes = useCallback(async () => {
    try {
      return await queueUseCase.getPatientsWithExcessiveWaitTimes(clinicId, workspaceId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error getting patients with excessive wait times',
      }));
      throw error;
    }
  }, [clinicId, workspaceId]);

  // Refresh queues
  const refreshQueues = useCallback(async () => {
    await loadQueues();
  }, [loadQueues]);

  // Refresh selected queue
  const refreshSelectedQueue = useCallback(async () => {
    if (state.selectedQueue) {
      await selectQueue(state.selectedQueue.id);
    }
  }, [state.selectedQueue, selectQueue]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load initial data
  useEffect(() => {
    loadQueues();
    loadDashboard();
  }, [loadQueues, loadDashboard]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.loading && !state.operationLoading && !state.dashboardLoading) {
        refreshQueues();
        if (state.selectedQueue) {
          refreshSelectedQueue();
        }
        if (state.dashboard) {
          refreshDashboard();
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    refreshQueues,
    refreshSelectedQueue,
    refreshDashboard,
    state.loading,
    state.operationLoading,
    state.dashboardLoading,
    state.selectedQueue,
    state.dashboard
  ]);

  return {
    state,
    actions: {
      loadQueues,
      selectQueue,
      clearSelectedQueue,
      addPatientToQueue,
      removePatientFromQueue,
      movePatientInQueue,
      getNextPatient,
      updateQueueConfiguration,
      resortQueue,
      pauseQueue,
      resumeQueue,
      clearQueue,
      loadDashboard,
      refreshDashboard,
      loadAnalytics,
      findOptimalQueue,
      getPatientsWithExcessiveWaitTimes,
      refreshQueues,
      refreshSelectedQueue,
      clearError,
    },
  };
}