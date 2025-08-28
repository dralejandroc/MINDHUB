/**
 * useAppointments Hook
 * React hook that provides appointments functionality using Clean Architecture
 */

import { useState, useCallback, useEffect } from 'react';
import { AgendaContainer } from '../container/AgendaContainer';
import { AppointmentPresenter, AppointmentViewModel } from '../presenters/AppointmentPresenter';
import { GetAppointmentsRequest, AppointmentWithMetadata } from '../usecases/GetAppointmentsUseCase';
import { CreateAppointmentRequest } from '../usecases/CreateAppointmentUseCase';
import { RescheduleAppointmentRequest } from '../usecases/RescheduleAppointmentUseCase';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/hooks/useTenantContext';
import toast from 'react-hot-toast';

export interface UseAppointmentsOptions {
  viewType?: 'day' | 'week' | 'month';
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAppointmentsReturn {
  appointments: AppointmentViewModel[];
  loading: boolean;
  error: string | null;
  stats: ReturnType<typeof AppointmentPresenter.calculateStats>;
  
  // Actions
  refresh: () => Promise<void>;
  createAppointment: (request: CreateAppointmentRequest) => Promise<void>;
  rescheduleAppointment: (request: RescheduleAppointmentRequest) => Promise<void>;
  confirmAppointment: (id: string, hasDeposit: boolean) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  markAsNoShow: (id: string) => Promise<void>;
  startConsultation: (id: string) => Promise<string>;
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const { user } = useAuth();
  const { getCurrentTenantId, getCurrentTenantType } = useTenantContext();
  
  // Get container instance
  const container = AgendaContainer.getInstance();
  const getAppointmentsUseCase = container.getGetAppointmentsUseCase();
  const createAppointmentUseCase = container.getCreateAppointmentUseCase();
  const rescheduleAppointmentUseCase = container.getRescheduleAppointmentUseCase();
  const appointmentRepository = container.getAppointmentRepository();

  // State
  const [appointments, setAppointments] = useState<AppointmentViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());

  /**
   * Load appointments using Clean Architecture
   */
  const loadAppointments = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Prepare request with tenant context
      const request: GetAppointmentsRequest = {
        professionalId: user.id,
        viewType: options.viewType,
        startDate: options.startDate,
        endDate: options.endDate,
        patientId: options.patientId,
        clinicId: getCurrentTenantType() === 'clinic' ? (getCurrentTenantId() || undefined) : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? (getCurrentTenantId() || undefined) : undefined
      };

      // Execute use case
      const appointmentsWithMetadata = await getAppointmentsUseCase.execute(request);

      // TODO: Load patient names from patient repository
      // For now, we'll use a mock map
      const mockPatientNames = new Map<string, string>();
      appointmentsWithMetadata.forEach(({ appointment }) => {
        mockPatientNames.set(appointment.patientId, `Paciente ${appointment.patientId.slice(0, 8)}`);
      });
      setPatientNames(mockPatientNames);

      // Transform to view models using presenter
      const viewModels = AppointmentPresenter.toCalendarEvents(
        appointmentsWithMetadata,
        mockPatientNames
      );

      setAppointments(viewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading appointments';
      setError(errorMessage);
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    options.viewType,
    options.startDate,
    options.endDate,
    options.patientId,
    getCurrentTenantId,
    getCurrentTenantType,
    getAppointmentsUseCase
  ]);

  /**
   * Create new appointment
   */
  const createAppointment = useCallback(async (request: CreateAppointmentRequest) => {
    try {
      // Add tenant context
      const fullRequest = {
        ...request,
        clinicId: getCurrentTenantType() === 'clinic' ? (getCurrentTenantId() || undefined) : undefined,
        workspaceId: getCurrentTenantType() === 'workspace' ? (getCurrentTenantId() || undefined) : undefined
      };

      // Execute use case
      await createAppointmentUseCase.execute(fullRequest);
      
      toast.success('Cita creada exitosamente');
      
      // Refresh appointments
      await loadAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating appointment';
      toast.error(errorMessage);
      throw err;
    }
  }, [createAppointmentUseCase, getCurrentTenantId, getCurrentTenantType, loadAppointments]);

  /**
   * Reschedule appointment
   */
  const rescheduleAppointment = useCallback(async (request: RescheduleAppointmentRequest) => {
    try {
      await rescheduleAppointmentUseCase.execute(request);
      
      toast.success('Cita reprogramada exitosamente');
      
      // Refresh appointments
      await loadAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error rescheduling appointment';
      toast.error(errorMessage);
      throw err;
    }
  }, [rescheduleAppointmentUseCase, loadAppointments]);

  /**
   * Confirm appointment
   */
  const confirmAppointment = useCallback(async (id: string, hasDeposit: boolean) => {
    try {
      await appointmentRepository.confirm(id, hasDeposit);
      
      toast.success('Cita confirmada');
      
      // Refresh appointments
      await loadAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error confirming appointment';
      toast.error(errorMessage);
      throw err;
    }
  }, [appointmentRepository, loadAppointments]);

  /**
   * Cancel appointment
   */
  const cancelAppointment = useCallback(async (id: string, reason?: string) => {
    try {
      await appointmentRepository.cancel(id, reason);
      
      toast.success('Cita cancelada');
      
      // Refresh appointments
      await loadAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cancelling appointment';
      toast.error(errorMessage);
      throw err;
    }
  }, [appointmentRepository, loadAppointments]);

  /**
   * Mark appointment as no-show
   */
  const markAsNoShow = useCallback(async (id: string) => {
    try {
      await appointmentRepository.markAsNoShow(id);
      
      toast.success('Cita marcada como no asistida');
      
      // Refresh appointments
      await loadAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error marking no-show';
      toast.error(errorMessage);
      throw err;
    }
  }, [appointmentRepository, loadAppointments]);

  /**
   * Start consultation from appointment
   */
  const startConsultation = useCallback(async (id: string): Promise<string> => {
    try {
      // TODO: Create consultation through consultation repository
      // For now, create a mock consultation ID
      const consultationId = `consultation-${Date.now()}`;
      
      await appointmentRepository.startConsultation(id, consultationId);
      
      toast.success('Consulta iniciada');
      
      // Refresh appointments
      await loadAppointments();
      
      return consultationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error starting consultation';
      toast.error(errorMessage);
      throw err;
    }
  }, [appointmentRepository, loadAppointments]);

  /**
   * Initial load and auto-refresh
   */
  useEffect(() => {
    loadAppointments();

    // Setup auto-refresh if enabled
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(loadAppointments, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadAppointments, options.autoRefresh, options.refreshInterval]);

  // Calculate statistics using presenter
  const stats = AppointmentPresenter.calculateStats(appointments);

  return {
    appointments,
    loading,
    error,
    stats,
    refresh: loadAppointments,
    createAppointment,
    rescheduleAppointment,
    confirmAppointment,
    cancelAppointment,
    markAsNoShow,
    startConsultation
  };
}