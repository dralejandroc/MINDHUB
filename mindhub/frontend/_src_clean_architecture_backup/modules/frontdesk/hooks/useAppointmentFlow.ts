/**
 * useAppointmentFlow Hook
 * React hook for appointment flow management in FrontDesk module
 */

import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../entities/Appointment';
import { 
  ManageAppointmentFlowUseCase, 
  AppointmentFlowRequest, 
  StartConsultationRequest,
  CompleteAppointmentRequest,
  AppointmentDashboard
} from '../usecases/ManageAppointmentFlowUseCase';
import { 
  AppointmentPresenter, 
  AppointmentListItemViewModel, 
  AppointmentDetailsViewModel,
  AppointmentDashboardViewModel,
  WaitingQueueViewModel
} from '../presenters/AppointmentPresenter';
import { DjangoAppointmentAdapter } from '../adapters/DjangoAppointmentAdapter';
import { DjangoPatientAdapter } from '../adapters/DjangoPatientAdapter';

interface UseAppointmentFlowState {
  dashboard: AppointmentDashboardViewModel | null;
  appointments: AppointmentListItemViewModel[];
  selectedAppointment: AppointmentDetailsViewModel | null;
  waitingQueue: WaitingQueueViewModel | null;
  loading: boolean;
  error: string | null;
  flowLoading: boolean;
  dashboardLoading: boolean;
}

interface UseAppointmentFlowActions {
  // Dashboard operations
  loadDashboard: (date?: Date) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  
  // Appointment selection
  selectAppointment: (appointmentId: string) => Promise<void>;
  clearSelectedAppointment: () => void;
  
  // Flow operations
  startConsultation: (request: StartConsultationRequest) => Promise<void>;
  completeAppointment: (request: CompleteAppointmentRequest) => Promise<void>;
  markAsNoShow: (appointmentId: string, reason: string, markedBy: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason: string, cancelledBy: string) => Promise<void>;
  
  // Queue operations
  loadWaitingQueue: (queueName?: string, location?: string) => Promise<void>;
  refreshWaitingQueue: () => Promise<void>;
  
  // History and analytics
  getAppointmentFlowHistory: (appointmentId: string) => Promise<any>;
  
  // Data refresh
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
}

export interface UseAppointmentFlowResult {
  state: UseAppointmentFlowState;
  actions: UseAppointmentFlowActions;
}

export function useAppointmentFlow(
  clinicId?: string,
  workspaceId?: string,
  professionalId?: string
): UseAppointmentFlowResult {
  
  // State
  const [state, setState] = useState<UseAppointmentFlowState>({
    dashboard: null,
    appointments: [],
    selectedAppointment: null,
    waitingQueue: null,
    loading: false,
    error: null,
    flowLoading: false,
    dashboardLoading: false,
  });

  // Dependencies
  const appointmentAdapter = new DjangoAppointmentAdapter();
  const patientAdapter = new DjangoPatientAdapter();
  const appointmentFlowUseCase = new ManageAppointmentFlowUseCase(appointmentAdapter, patientAdapter);
  const presenter = new AppointmentPresenter();

  // Load dashboard
  const loadDashboard = useCallback(async (date: Date = new Date()) => {
    setState(prev => ({ ...prev, dashboardLoading: true, error: null }));
    
    try {
      const dashboard = await appointmentFlowUseCase.getAppointmentDashboard(
        date,
        clinicId,
        workspaceId
      );
      
      // Get today's appointments for the dashboard
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const appointments = await appointmentAdapter.findByDateRange(
        startOfDay,
        endOfDay,
        { clinicId, workspaceId, professionalId }
      );
      
      const dashboardViewModel = presenter.presentDashboard(appointments, date);
      
      setState(prev => ({
        ...prev,
        dashboard: dashboardViewModel,
        appointments: presenter.presentList(appointments),
        dashboardLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading dashboard',
        dashboardLoading: false,
      }));
    }
  }, [clinicId, workspaceId, professionalId]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  // Select appointment
  const selectAppointment = useCallback(async (appointmentId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const appointment = await appointmentAdapter.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      const selectedAppointment = presenter.presentForDetails(appointment);
      
      setState(prev => ({
        ...prev,
        selectedAppointment,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading appointment details',
        loading: false,
      }));
    }
  }, []);

  // Clear selected appointment
  const clearSelectedAppointment = useCallback(() => {
    setState(prev => ({ ...prev, selectedAppointment: null }));
  }, []);

  // Start consultation
  const startConsultation = useCallback(async (request: StartConsultationRequest) => {
    setState(prev => ({ ...prev, flowLoading: true, error: null }));
    
    try {
      const result = await appointmentFlowUseCase.startConsultation(request);
      
      // Update selected appointment if it matches
      if (state.selectedAppointment?.id === request.appointmentId) {
        const updatedAppointment = presenter.presentForDetails(result.appointment);
        setState(prev => ({
          ...prev,
          selectedAppointment: updatedAppointment,
          flowLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, flowLoading: false }));
      }
      
      // Refresh dashboard and waiting queue
      await refreshDashboard();
      if (state.waitingQueue) {
        await refreshWaitingQueue();
      }
      
      // Show notifications if any
      if (result.notifications.length > 0) {
        // TODO: Show notifications using toast/notification system
        console.log('Notifications:', result.notifications);
      }
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error starting consultation',
        flowLoading: false,
      }));
      throw error;
    }
  }, [state.selectedAppointment?.id, state.waitingQueue]);

  // Complete appointment
  const completeAppointment = useCallback(async (request: CompleteAppointmentRequest) => {
    setState(prev => ({ ...prev, flowLoading: true, error: null }));
    
    try {
      const result = await appointmentFlowUseCase.completeAppointment(request);
      
      // Update selected appointment if it matches
      if (state.selectedAppointment?.id === request.appointmentId) {
        const updatedAppointment = presenter.presentForDetails(result.appointment);
        setState(prev => ({
          ...prev,
          selectedAppointment: updatedAppointment,
          flowLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, flowLoading: false }));
      }
      
      // Refresh dashboard
      await refreshDashboard();
      
      // Show notifications if any
      if (result.notifications.length > 0) {
        console.log('Notifications:', result.notifications);
      }
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error completing appointment',
        flowLoading: false,
      }));
      throw error;
    }
  }, [state.selectedAppointment?.id]);

  // Mark as no show
  const markAsNoShow = useCallback(async (
    appointmentId: string,
    reason: string,
    markedBy: string
  ) => {
    setState(prev => ({ ...prev, flowLoading: true, error: null }));
    
    try {
      const result = await appointmentFlowUseCase.markAsNoShow({
        appointmentId,
        actionBy: markedBy,
        reason,
      });
      
      // Update selected appointment if it matches
      if (state.selectedAppointment?.id === appointmentId) {
        const updatedAppointment = presenter.presentForDetails(result.appointment);
        setState(prev => ({
          ...prev,
          selectedAppointment: updatedAppointment,
          flowLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, flowLoading: false }));
      }
      
      // Refresh dashboard
      await refreshDashboard();
      
      // Show notifications if any
      if (result.notifications.length > 0) {
        console.log('Notifications:', result.notifications);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error marking appointment as no show',
        flowLoading: false,
      }));
      throw error;
    }
  }, [state.selectedAppointment?.id]);

  // Cancel appointment
  const cancelAppointment = useCallback(async (
    appointmentId: string,
    reason: string,
    cancelledBy: string
  ) => {
    setState(prev => ({ ...prev, flowLoading: true, error: null }));
    
    try {
      const result = await appointmentFlowUseCase.cancelAppointment({
        appointmentId,
        actionBy: cancelledBy,
        reason,
      });
      
      // Update selected appointment if it matches
      if (state.selectedAppointment?.id === appointmentId) {
        const updatedAppointment = presenter.presentForDetails(result.appointment);
        setState(prev => ({
          ...prev,
          selectedAppointment: updatedAppointment,
          flowLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, flowLoading: false }));
      }
      
      // Refresh dashboard
      await refreshDashboard();
      
      // Show notifications if any
      if (result.notifications.length > 0) {
        console.log('Notifications:', result.notifications);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error cancelling appointment',
        flowLoading: false,
      }));
      throw error;
    }
  }, [state.selectedAppointment?.id]);

  // Load waiting queue
  const loadWaitingQueue = useCallback(async (
    queueName: string = 'Main Queue',
    location: string = 'Main'
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const appointments = await appointmentAdapter.findByStatus('arrived', {
        clinicId,
        workspaceId,
        professionalId,
      });
      
      const waitingQueue = presenter.presentWaitingQueue(appointments, queueName, location);
      
      setState(prev => ({
        ...prev,
        waitingQueue,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading waiting queue',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId, professionalId]);

  // Refresh waiting queue
  const refreshWaitingQueue = useCallback(async () => {
    if (state.waitingQueue) {
      await loadWaitingQueue(state.waitingQueue.queueName, state.waitingQueue.location);
    }
  }, [state.waitingQueue, loadWaitingQueue]);

  // Get appointment flow history
  const getAppointmentFlowHistory = useCallback(async (appointmentId: string) => {
    try {
      return await appointmentFlowUseCase.getAppointmentFlowHistory(appointmentId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error getting appointment history',
      }));
      throw error;
    }
  }, []);

  // Refresh appointments
  const refreshAppointments = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const appointments = await appointmentAdapter.findByDateRange(
        startOfDay,
        endOfDay,
        { clinicId, workspaceId, professionalId }
      );
      
      const presentedAppointments = presenter.presentList(appointments);
      
      setState(prev => ({
        ...prev,
        appointments: presentedAppointments,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading appointments',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId, professionalId]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load initial data
  useEffect(() => {
    loadDashboard();
    loadWaitingQueue();
  }, [loadDashboard, loadWaitingQueue]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.loading && !state.flowLoading && !state.dashboardLoading) {
        refreshDashboard();
        if (state.waitingQueue) {
          refreshWaitingQueue();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshDashboard, refreshWaitingQueue, state.loading, state.flowLoading, state.dashboardLoading, state.waitingQueue]);

  return {
    state,
    actions: {
      loadDashboard,
      refreshDashboard,
      selectAppointment,
      clearSelectedAppointment,
      startConsultation,
      completeAppointment,
      markAsNoShow,
      cancelAppointment,
      loadWaitingQueue,
      refreshWaitingQueue,
      getAppointmentFlowHistory,
      refreshAppointments,
      clearError,
    },
  };
}