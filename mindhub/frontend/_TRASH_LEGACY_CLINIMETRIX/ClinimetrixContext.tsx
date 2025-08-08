/**
 * Clinimetrix Context
 * React context for managing clinical assessment state
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
// import { useAuth } from '../hooks/useAuth'; // DISABLED - using Clerk now
import { ClinimetrixApiClient, createClinimetrixApiClient, ApiClientContextType } from '../lib/clinimetrix/api/ClinimetrixApiClient';
import {
  ClinicalScale,
  AssessmentSession,
  ScaleAdministration,
  ItemResponse,
  SessionStatus,
  AdministrationStatus,
  ScaleFilters,
  SessionFilters
} from '../types/clinimetrix';

// =============================================================================
// TYPES
// =============================================================================

export interface ClinimetrixState {
  // API Client
  apiClient: ClinimetrixApiClient | null;
  isConnected: boolean;
  lastError: Error | null;
  
  // Clinical Scales
  scales: ClinicalScale[];
  scalesLoading: boolean;
  currentScale: ClinicalScale | null;
  
  // Assessment Sessions
  sessions: AssessmentSession[];
  sessionsLoading: boolean;
  currentSession: AssessmentSession | null;
  
  // Scale Administrations
  administrations: Map<string, ScaleAdministration>;
  currentAdministration: ScaleAdministration | null;
  
  // Item Responses
  responses: Map<string, ItemResponse[]>;
  currentResponses: ItemResponse[];
  
  // UI State
  isAssessmentActive: boolean;
  currentItemIndex: number;
  
  // Filters
  scaleFilters: ScaleFilters;
  sessionFilters: SessionFilters;
}

export type ClinimetrixAction =
  | { type: 'SET_API_CLIENT'; payload: ClinimetrixApiClient }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_SCALES'; payload: ClinicalScale[] }
  | { type: 'SET_SCALES_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_SCALE'; payload: ClinicalScale | null }
  | { type: 'SET_SESSIONS'; payload: AssessmentSession[] }
  | { type: 'SET_SESSIONS_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_SESSION'; payload: AssessmentSession | null }
  | { type: 'ADD_SESSION'; payload: AssessmentSession }
  | { type: 'UPDATE_SESSION'; payload: AssessmentSession }
  | { type: 'SET_ADMINISTRATION'; payload: ScaleAdministration }
  | { type: 'SET_CURRENT_ADMINISTRATION'; payload: ScaleAdministration | null }
  | { type: 'UPDATE_ADMINISTRATION'; payload: ScaleAdministration }
  | { type: 'SET_RESPONSES'; payload: { administrationId: string; responses: ItemResponse[] } }
  | { type: 'ADD_RESPONSE'; payload: { administrationId: string; response: ItemResponse } }
  | { type: 'SET_CURRENT_RESPONSES'; payload: ItemResponse[] }
  | { type: 'SET_ASSESSMENT_ACTIVE'; payload: boolean }
  | { type: 'SET_CURRENT_ITEM_INDEX'; payload: number }
  | { type: 'SET_SCALE_FILTERS'; payload: ScaleFilters }
  | { type: 'SET_SESSION_FILTERS'; payload: SessionFilters }
  | { type: 'RESET_STATE' };

// =============================================================================
// REDUCER
// =============================================================================

const initialState: ClinimetrixState = {
  apiClient: null,
  isConnected: false,
  lastError: null,
  
  scales: [],
  scalesLoading: false,
  currentScale: null,
  
  sessions: [],
  sessionsLoading: false,
  currentSession: null,
  
  administrations: new Map(),
  currentAdministration: null,
  
  responses: new Map(),
  currentResponses: [],
  
  isAssessmentActive: false,
  currentItemIndex: 0,
  
  scaleFilters: {},
  sessionFilters: {}
};

function clinimetrixReducer(state: ClinimetrixState, action: ClinimetrixAction): ClinimetrixState {
  switch (action.type) {
    case 'SET_API_CLIENT':
      return { ...state, apiClient: action.payload };
      
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
      
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
      
    case 'SET_SCALES':
      return { ...state, scales: action.payload };
      
    case 'SET_SCALES_LOADING':
      return { ...state, scalesLoading: action.payload };
      
    case 'SET_CURRENT_SCALE':
      return { ...state, currentScale: action.payload };
      
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
      
    case 'SET_SESSIONS_LOADING':
      return { ...state, sessionsLoading: action.payload };
      
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
      
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        currentSession: action.payload
      };
      
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ),
        currentSession: state.currentSession?.id === action.payload.id 
          ? action.payload 
          : state.currentSession
      };
      
    case 'SET_ADMINISTRATION':
      const newAdministrations = new Map(state.administrations);
      newAdministrations.set(action.payload.id, action.payload);
      return { ...state, administrations: newAdministrations };
      
    case 'SET_CURRENT_ADMINISTRATION':
      return { ...state, currentAdministration: action.payload };
      
    case 'UPDATE_ADMINISTRATION':
      const updatedAdministrations = new Map(state.administrations);
      updatedAdministrations.set(action.payload.id, action.payload);
      return {
        ...state,
        administrations: updatedAdministrations,
        currentAdministration: state.currentAdministration?.id === action.payload.id 
          ? action.payload 
          : state.currentAdministration
      };
      
    case 'SET_RESPONSES':
      const newResponses = new Map(state.responses);
      newResponses.set(action.payload.administrationId, action.payload.responses);
      return { ...state, responses: newResponses };
      
    case 'ADD_RESPONSE':
      const responsesMap = new Map(state.responses);
      const existingResponses = responsesMap.get(action.payload.administrationId) || [];
      const updatedResponses = existingResponses.filter(r => r.itemId !== action.payload.response.itemId);
      updatedResponses.push(action.payload.response);
      responsesMap.set(action.payload.administrationId, updatedResponses);
      
      return {
        ...state,
        responses: responsesMap,
        currentResponses: state.currentAdministration?.id === action.payload.administrationId 
          ? updatedResponses 
          : state.currentResponses
      };
      
    case 'SET_CURRENT_RESPONSES':
      return { ...state, currentResponses: action.payload };
      
    case 'SET_ASSESSMENT_ACTIVE':
      return { ...state, isAssessmentActive: action.payload };
      
    case 'SET_CURRENT_ITEM_INDEX':
      return { ...state, currentItemIndex: action.payload };
      
    case 'SET_SCALE_FILTERS':
      return { ...state, scaleFilters: action.payload };
      
    case 'SET_SESSION_FILTERS':
      return { ...state, sessionFilters: action.payload };
      
    case 'RESET_STATE':
      return { ...initialState, apiClient: state.apiClient, isConnected: state.isConnected };
      
    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

export interface ClinimetrixContextType {
  state: ClinimetrixState;
  dispatch: React.Dispatch<ClinimetrixAction>;
  
  // API Methods
  loadScales: (filters?: ScaleFilters) => Promise<void>;
  loadSessions: (filters?: SessionFilters) => Promise<void>;
  createSession: (data: any) => Promise<AssessmentSession>;
  startAdministration: (sessionId: string, scaleId: string) => Promise<ScaleAdministration>;
  submitResponse: (administrationId: string, response: any) => Promise<void>;
  completeAdministration: (administrationId: string) => Promise<void>;
  
  // UI Methods
  selectScale: (scale: ClinicalScale) => void;
  selectSession: (session: AssessmentSession) => void;
  startAssessment: (administration: ScaleAdministration) => void;
  nextItem: () => void;
  previousItem: () => void;
  goToItem: (index: number) => void;
  
  // Utility Methods
  getResponseForItem: (itemId: string) => ItemResponse | undefined;
  getCompletionPercentage: () => number;
  canProceed: () => boolean;
  getCurrentItem: () => any;
}

const ClinimetrixContext = createContext<ClinimetrixContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export interface ClinimetrixProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

export function ClinimetrixProvider({ children, apiBaseUrl }: ClinimetrixProviderProps) {
  const [state, dispatch] = useReducer(clinimetrixReducer, initialState);
  // const { authState } = useAuth(); // DISABLED - using Clerk now
  const authState = { isAuthenticated: false, user: null }; // Placeholder
  const userLoading = authState.isLoading;

  // Initialize API client
  useEffect(() => {
    if (!userLoading && !state.apiClient) {
      const client = createClinimetrixApiClient({
        baseUrl: apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      });
      
      dispatch({ type: 'SET_API_CLIENT', payload: client });
      
      // Test connection
      client.getHealthStatus()
        .then(() => dispatch({ type: 'SET_CONNECTION_STATUS', payload: true }))
        .catch(error => {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
          dispatch({ type: 'SET_ERROR', payload: error });
        });
    }
  }, [userLoading, state.apiClient, apiBaseUrl]);

  // =============================================================================
  // API METHODS
  // =============================================================================

  const loadScales = async (filters: ScaleFilters = {}) => {
    if (!state.apiClient) return;
    
    try {
      dispatch({ type: 'SET_SCALES_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await state.apiClient.getScales(filters);
      dispatch({ type: 'SET_SCALES', payload: response.data });
      dispatch({ type: 'SET_SCALE_FILTERS', payload: filters });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    } finally {
      dispatch({ type: 'SET_SCALES_LOADING', payload: false });
    }
  };

  const loadSessions = async (filters: SessionFilters = {}) => {
    if (!state.apiClient) return;
    
    try {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await state.apiClient.getAssessmentSessions(filters);
      dispatch({ type: 'SET_SESSIONS', payload: response.data });
      dispatch({ type: 'SET_SESSION_FILTERS', payload: filters });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    } finally {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: false });
    }
  };

  const createSession = async (data: any): Promise<AssessmentSession> => {
    if (!state.apiClient) throw new Error('API client not initialized');
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await state.apiClient.createAssessmentSession(data);
      if (response.success) {
        dispatch({ type: 'ADD_SESSION', payload: response.data });
        return response.data;
      }
      throw new Error(response.error || 'Failed to create session');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  };

  const startAdministration = async (sessionId: string, scaleId: string): Promise<ScaleAdministration> => {
    if (!state.apiClient) throw new Error('API client not initialized');
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await state.apiClient.startScaleAdministration(sessionId, scaleId);
      if (response.success) {
        dispatch({ type: 'SET_ADMINISTRATION', payload: response.data });
        dispatch({ type: 'SET_CURRENT_ADMINISTRATION', payload: response.data });
        return response.data;
      }
      throw new Error(response.error || 'Failed to start administration');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  };

  const submitResponse = async (administrationId: string, response: any): Promise<void> => {
    if (!state.apiClient) throw new Error('API client not initialized');
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const apiResponse = await state.apiClient.submitItemResponse(administrationId, response);
      if (apiResponse.success) {
        dispatch({
          type: 'ADD_RESPONSE',
          payload: { administrationId, response: apiResponse.data }
        });
      } else {
        throw new Error(apiResponse.error || 'Failed to submit response');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  };

  const completeAdministration = async (administrationId: string): Promise<void> => {
    if (!state.apiClient) throw new Error('API client not initialized');
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await state.apiClient.completeScaleAdministration(administrationId);
      if (response.success) {
        dispatch({ type: 'UPDATE_ADMINISTRATION', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to complete administration');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  };

  // =============================================================================
  // UI METHODS
  // =============================================================================

  const selectScale = (scale: ClinicalScale) => {
    dispatch({ type: 'SET_CURRENT_SCALE', payload: scale });
  };

  const selectSession = (session: AssessmentSession) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
  };

  const startAssessment = (administration: ScaleAdministration) => {
    dispatch({ type: 'SET_CURRENT_ADMINISTRATION', payload: administration });
    dispatch({ type: 'SET_ASSESSMENT_ACTIVE', payload: true });
    dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: 0 });
    
    // Load existing responses
    const existingResponses = state.responses.get(administration.id) || [];
    dispatch({ type: 'SET_CURRENT_RESPONSES', payload: existingResponses });
  };

  const nextItem = () => {
    if (state.currentScale && state.currentItemIndex < state.currentScale.items!.length - 1) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: state.currentItemIndex + 1 });
    }
  };

  const previousItem = () => {
    if (state.currentItemIndex > 0) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: state.currentItemIndex - 1 });
    }
  };

  const goToItem = (index: number) => {
    if (state.currentScale && index >= 0 && index < state.currentScale.items!.length) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: index });
    }
  };

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  const getResponseForItem = (itemId: string): ItemResponse | undefined => {
    return state.currentResponses.find(response => response.itemId === itemId);
  };

  const getCompletionPercentage = (): number => {
    if (!state.currentScale || !state.currentScale.items) return 0;
    
    const totalItems = state.currentScale.items.length;
    const completedItems = state.currentResponses.filter(
      response => !response.wasSkipped && response.responseValue !== ''
    ).length;
    
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const canProceed = (): boolean => {
    if (!state.currentScale || !state.currentScale.items) return false;
    
    const currentItem = state.currentScale.items[state.currentItemIndex];
    if (!currentItem) return false;
    
    const response = getResponseForItem(currentItem.id);
    const isRequired = currentItem.required ?? false;
    
    if (!isRequired) return true;
    
    return !!(response && !(response.wasSkipped ?? false) && response.responseValue !== '');
  };

  const getCurrentItem = () => {
    if (!state.currentScale || !state.currentScale.items) return null;
    return state.currentScale.items[state.currentItemIndex];
  };

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: ClinimetrixContextType = {
    state,
    dispatch,
    
    // API Methods
    loadScales,
    loadSessions,
    createSession,
    startAdministration,
    submitResponse,
    completeAdministration,
    
    // UI Methods
    selectScale,
    selectSession,
    startAssessment,
    nextItem,
    previousItem,
    goToItem,
    
    // Utility Methods
    getResponseForItem,
    getCompletionPercentage,
    canProceed,
    getCurrentItem
  };

  return (
    <ClinimetrixContext.Provider value={contextValue}>
      {children}
    </ClinimetrixContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useClinimetrix(): ClinimetrixContextType {
  const context = useContext(ClinimetrixContext);
  if (!context) {
    throw new Error('useClinimetrix must be used within a ClinimetrixProvider');
  }
  return context;
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

export function useScales(filters?: ScaleFilters) {
  const { state, loadScales } = useClinimetrix();
  
  useEffect(() => {
    loadScales(filters);
  }, [JSON.stringify(filters)]);
  
  return {
    scales: state.scales,
    loading: state.scalesLoading,
    error: state.lastError,
    currentScale: state.currentScale,
    refetch: () => loadScales(filters)
  };
}

export function useSessions(filters?: SessionFilters) {
  const { state, loadSessions } = useClinimetrix();
  
  useEffect(() => {
    loadSessions(filters);
  }, [JSON.stringify(filters)]);
  
  return {
    sessions: state.sessions,
    loading: state.sessionsLoading,
    error: state.lastError,
    currentSession: state.currentSession,
    refetch: () => loadSessions(filters)
  };
}

export function useAssessment() {
  const { state, startAssessment, nextItem, previousItem, goToItem, getResponseForItem, getCompletionPercentage, canProceed, getCurrentItem } = useClinimetrix();
  
  return {
    isActive: state.isAssessmentActive,
    administration: state.currentAdministration,
    currentItemIndex: state.currentItemIndex,
    currentItem: getCurrentItem(),
    responses: state.currentResponses,
    completionPercentage: getCompletionPercentage(),
    canProceed,
    
    // Methods
    start: startAssessment,
    next: nextItem,
    previous: previousItem,
    goTo: goToItem,
    getResponse: getResponseForItem
  };
}