/**
 * usePatientManagement Hook
 * React hook for patient management operations in FrontDesk module
 */

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '../entities/Patient';
import { ManagePatientCheckInUseCase, CheckInPatientRequest, CheckInResult, PatientSearchRequest } from '../usecases/ManagePatientCheckInUseCase';
import { PatientPresenter, PatientListItemViewModel, PatientDetailsViewModel, WaitingRoomViewModel } from '../presenters/PatientPresenter';
import { DjangoPatientAdapter } from '../adapters/DjangoPatientAdapter';

interface UsePatientManagementState {
  patients: PatientListItemViewModel[];
  selectedPatient: PatientDetailsViewModel | null;
  waitingRoom: WaitingRoomViewModel | null;
  searchResults: PatientListItemViewModel[];
  loading: boolean;
  error: string | null;
  checkInLoading: boolean;
  searchLoading: boolean;
}

interface UsePatientManagementActions {
  // Search operations
  searchPatients: (request: PatientSearchRequest) => Promise<void>;
  clearSearchResults: () => void;
  
  // Patient selection
  selectPatient: (patientId: string) => Promise<void>;
  clearSelectedPatient: () => void;
  
  // Check-in operations
  checkInPatient: (request: CheckInPatientRequest) => Promise<CheckInResult>;
  verifyPatientInfo: (patientId: string, verificationData: any) => Promise<any>;
  
  // Waiting room operations
  refreshWaitingRoom: () => Promise<void>;
  getWaitingRoomStatus: () => Promise<void>;
  
  // Patient operations
  updatePatient: (patient: Patient) => Promise<void>;
  markPatientAsNoShow: (patientId: string, reason: string, markedBy: string) => Promise<void>;
  
  // Data refresh
  refreshPatients: () => Promise<void>;
  clearError: () => void;
}

export interface UsePatientManagementResult {
  state: UsePatientManagementState;
  actions: UsePatientManagementActions;
}

export function usePatientManagement(
  clinicId?: string,
  workspaceId?: string
): UsePatientManagementResult {
  
  // State
  const [state, setState] = useState<UsePatientManagementState>({
    patients: [],
    selectedPatient: null,
    waitingRoom: null,
    searchResults: [],
    loading: false,
    error: null,
    checkInLoading: false,
    searchLoading: false,
  });

  // Dependencies
  const patientAdapter = new DjangoPatientAdapter();
  const checkInUseCase = new ManagePatientCheckInUseCase(patientAdapter, {} as any); // TODO: Add appointment repository
  const presenter = new PatientPresenter();

  // Search patients
  const searchPatients = useCallback(async (request: PatientSearchRequest) => {
    setState(prev => ({ ...prev, searchLoading: true, error: null }));
    
    try {
      const patients = await checkInUseCase.searchPatients({
        ...request,
        clinicId: clinicId || request.clinicId,
        workspaceId: workspaceId || request.workspaceId,
      });
      
      const searchResults = presenter.presentList(patients);
      
      setState(prev => ({
        ...prev,
        searchResults,
        searchLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error searching patients',
        searchLoading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [] }));
  }, []);

  // Select patient
  const selectPatient = useCallback(async (patientId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const patient = await patientAdapter.findById(patientId);
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      const selectedPatient = presenter.presentForDetails(patient);
      
      setState(prev => ({
        ...prev,
        selectedPatient,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading patient details',
        loading: false,
      }));
    }
  }, []);

  // Clear selected patient
  const clearSelectedPatient = useCallback(() => {
    setState(prev => ({ ...prev, selectedPatient: null }));
  }, []);

  // Check-in patient
  const checkInPatient = useCallback(async (request: CheckInPatientRequest): Promise<CheckInResult> => {
    setState(prev => ({ ...prev, checkInLoading: true, error: null }));
    
    try {
      const result = await checkInUseCase.checkInPatient(request);
      
      // Update local state
      setState(prev => ({
        ...prev,
        checkInLoading: false,
      }));
      
      // Refresh waiting room and selected patient if applicable
      if (state.selectedPatient?.id === request.patientId) {
        await selectPatient(request.patientId);
      }
      await refreshWaitingRoom();
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error checking in patient',
        checkInLoading: false,
      }));
      throw error;
    }
  }, [state.selectedPatient?.id]);

  // Verify patient info
  const verifyPatientInfo = useCallback(async (patientId: string, verificationData: any) => {
    try {
      return await checkInUseCase.verifyPatientInfo(patientId, verificationData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error verifying patient info',
      }));
      throw error;
    }
  }, []);

  // Refresh waiting room
  const refreshWaitingRoom = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const waitingPatients = await patientAdapter.findWaitingPatients({
        clinicId,
        workspaceId,
      });
      
      const waitingRoom = presenter.presentWaitingRoom(waitingPatients);
      
      setState(prev => ({
        ...prev,
        waitingRoom,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading waiting room',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Get waiting room status
  const getWaitingRoomStatus = useCallback(async () => {
    try {
      const status = await checkInUseCase.getWaitingRoomStatus(clinicId, workspaceId);
      
      // Update state with status information
      setState(prev => ({
        ...prev,
        waitingRoom: prev.waitingRoom ? {
          ...prev.waitingRoom,
          totalWaiting: status.totalWaiting,
          averageWaitTime: `${status.averageWaitTime}m`,
          urgentCount: status.urgentPatients,
          specialNeedsCount: status.specialNeedsPatients,
        } : null,
      }));
      
      return status;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error getting waiting room status',
      }));
      throw error;
    }
  }, [clinicId, workspaceId]);

  // Update patient
  const updatePatient = useCallback(async (patient: Patient) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedPatient = await patientAdapter.update(patient);
      
      // Update selected patient if it matches
      if (state.selectedPatient?.id === patient.id) {
        const presentedPatient = presenter.presentForDetails(updatedPatient);
        setState(prev => ({
          ...prev,
          selectedPatient: presentedPatient,
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      // Refresh related data
      await refreshWaitingRoom();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating patient',
        loading: false,
      }));
      throw error;
    }
  }, [state.selectedPatient?.id]);

  // Mark patient as no show
  const markPatientAsNoShow = useCallback(async (
    patientId: string,
    reason: string,
    markedBy: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const patient = await patientAdapter.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      const updatedPatient = patient.markAsNoShow(markedBy, reason);
      await patientAdapter.update(updatedPatient);
      
      // Update selected patient if it matches
      if (state.selectedPatient?.id === patientId) {
        const presentedPatient = presenter.presentForDetails(updatedPatient);
        setState(prev => ({
          ...prev,
          selectedPatient: presentedPatient,
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      // Refresh waiting room
      await refreshWaitingRoom();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error marking patient as no show',
        loading: false,
      }));
      throw error;
    }
  }, [state.selectedPatient?.id]);

  // Refresh patients list
  const refreshPatients = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const patients = await patientAdapter.findRecentlyActive(50, {
        clinicId,
        workspaceId,
      });
      
      const presentedPatients = presenter.presentList(patients);
      
      setState(prev => ({
        ...prev,
        patients: presentedPatients,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading patients',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load initial data
  useEffect(() => {
    refreshPatients();
    refreshWaitingRoom();
  }, [refreshPatients, refreshWaitingRoom]);

  // Auto-refresh waiting room every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.loading && !state.checkInLoading) {
        refreshWaitingRoom();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshWaitingRoom, state.loading, state.checkInLoading]);

  return {
    state,
    actions: {
      searchPatients,
      clearSearchResults,
      selectPatient,
      clearSelectedPatient,
      checkInPatient,
      verifyPatientInfo,
      refreshWaitingRoom,
      getWaitingRoomStatus,
      updatePatient,
      markPatientAsNoShow,
      refreshPatients,
      clearError,
    },
  };
}