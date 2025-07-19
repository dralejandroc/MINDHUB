/**
 * CONTEXTO UNIVERSAL DE ESCALAS - ARQUITECTURA SIMPLIFICADA
 * Un solo contexto para TODAS las escalas clinimétricas
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';

// =====================================================================
// TIPOS UNIVERSALES
// =====================================================================

export interface UniversalScale {
  id: string;
  name: string;
  abbreviation: string;
  version: string;
  category: string;
  subcategory?: string;
  description: string;
  estimatedDurationMinutes: number;
  administrationMode: 'self_administered' | 'clinician_administered' | 'hybrid';
  targetPopulation: string;
  totalItems: number;
  isActive: boolean;
  
  // Definición para renderizado
  items: ScaleItem[];
  responseOptions: ResponseOption[];
  interpretationRules: InterpretationRule[];
  instructions: string[];
  subscales?: Subscale[];
  scoringMethod: 'sum' | 'subscales' | 'average' | 'weighted';
  scoreRange: { min: number; max: number };
}

export interface ScaleItem {
  id: string;
  number: number;
  text: string;
  responseOptions?: ResponseOption[];
  subscale?: string;
  alertTrigger?: boolean;
  alertCondition?: string;
}

export interface ResponseOption {
  value: string;
  label: string;
  score: number;
}

export interface InterpretationRule {
  minScore: number;
  maxScore: number;
  severity: string;
  label: string;
  color: string;
  description?: string;
  recommendations?: string[];
}

export interface Subscale {
  id: string;
  name: string;
  items: number[];
}

export interface AssessmentSession {
  id: string;
  patientId: string;
  clinicianId?: string;
  sessionType: 'screening' | 'diagnostic' | 'follow_up' | 'research';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  administrationMode: 'in_person' | 'remote' | 'hybrid';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ScaleAdministration {
  id: string;
  sessionId: string;
  scaleId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned' | 'invalidated';
  currentItemIndex: number;
  totalItems: number;
  completionPercentage: number;
  startedAt?: string;
  completedAt?: string;
  results?: AssessmentResults;
}

export interface ItemResponse {
  id: string;
  administrationId: string;
  itemId: string;
  itemNumber: number;
  responseValue: string;
  responseLabel: string;
  scoreValue: number;
  responseTimeMs?: number;
  wasSkipped: boolean;
  createdAt: string;
}

export interface AssessmentResults {
  totalScore: number;
  subscaleScores: Record<string, { score: number; itemCount: number; name: string }>;
  interpretation: {
    severity: string;
    label: string;
    color: string;
    description: string;
    recommendations: string[];
  } | null;
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    itemId: string;
    itemNumber: number;
    message: string;
    score: number;
  }>;
  completionPercentage: number;
  validResponses: number;
  calculatedAt: string;
}

export interface TimelineEntry {
  scaleId: string;
  scaleName: string;
  category: string;
  score: number;
  severity: string;
  date: string;
  assessmentNumber: number;
  previousScore?: number;
  scoreChange?: number;
  interpretation: any;
  alerts: any[];
}

// =====================================================================
// ESTADO Y ACCIONES
// =====================================================================

interface UniversalScalesState {
  // Datos
  scales: UniversalScale[];
  currentScale: UniversalScale | null;
  currentSession: AssessmentSession | null;
  currentAdministration: ScaleAdministration | null;
  responses: ItemResponse[];
  patientTimeline: TimelineEntry[];
  
  // Estado UI
  isLoading: boolean;
  isAssessmentActive: boolean;
  currentItemIndex: number;
  
  // Errores
  error: string | null;
  
  // Configuración
  apiBaseUrl: string;
}

type UniversalScalesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCALES'; payload: UniversalScale[] }
  | { type: 'SET_CURRENT_SCALE'; payload: UniversalScale | null }
  | { type: 'SET_CURRENT_SESSION'; payload: AssessmentSession | null }
  | { type: 'SET_CURRENT_ADMINISTRATION'; payload: ScaleAdministration | null }
  | { type: 'SET_RESPONSES'; payload: ItemResponse[] }
  | { type: 'ADD_RESPONSE'; payload: ItemResponse }
  | { type: 'SET_CURRENT_ITEM_INDEX'; payload: number }
  | { type: 'SET_ASSESSMENT_ACTIVE'; payload: boolean }
  | { type: 'SET_PATIENT_TIMELINE'; payload: TimelineEntry[] }
  | { type: 'RESET_ASSESSMENT' };

// =====================================================================
// REDUCER
// =====================================================================

const initialState: UniversalScalesState = {
  scales: [],
  currentScale: null,
  currentSession: null,
  currentAdministration: null,
  responses: [],
  patientTimeline: [],
  isLoading: false,
  isAssessmentActive: false,
  currentItemIndex: 0,
  error: null,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
};

function universalScalesReducer(state: UniversalScalesState, action: UniversalScalesAction): UniversalScalesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_SCALES':
      return { ...state, scales: action.payload };
      
    case 'SET_CURRENT_SCALE':
      return { ...state, currentScale: action.payload };
      
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
      
    case 'SET_CURRENT_ADMINISTRATION':
      return { ...state, currentAdministration: action.payload };
      
    case 'SET_RESPONSES':
      return { ...state, responses: action.payload };
      
    case 'ADD_RESPONSE':
      const updatedResponses = state.responses.filter(r => r.itemId !== action.payload.itemId);
      return { ...state, responses: [...updatedResponses, action.payload] };
      
    case 'SET_CURRENT_ITEM_INDEX':
      return { ...state, currentItemIndex: action.payload };
      
    case 'SET_ASSESSMENT_ACTIVE':
      return { ...state, isAssessmentActive: action.payload };
      
    case 'SET_PATIENT_TIMELINE':
      return { ...state, patientTimeline: action.payload };
      
    case 'RESET_ASSESSMENT':
      return {
        ...state,
        currentScale: null,
        currentSession: null,
        currentAdministration: null,
        responses: [],
        isAssessmentActive: false,
        currentItemIndex: 0
      };
      
    default:
      return state;
  }
}

// =====================================================================
// CLIENTE API UNIVERSAL
// =====================================================================

class UniversalScalesApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async fetchScales(): Promise<UniversalScale[]> {
    try {
      console.log('Fetching scales from:', `${this.baseUrl}/api/scales`);
      const response = await fetch(`${this.baseUrl}/api/scales`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener escalas');
      }
    
      // Transformar datos de API al formato del contexto
      return data.data.map((rawScale: any) => ({
        id: rawScale.id,
        name: rawScale.name,
        abbreviation: rawScale.abbreviation,
        version: rawScale.version || '1.0',
        category: rawScale.category,
        subcategory: rawScale.subcategory,
        description: rawScale.description,
        estimatedDurationMinutes: rawScale.estimatedDurationMinutes,
        administrationMode: rawScale.administrationMode,
        targetPopulation: rawScale.targetPopulation,
        totalItems: rawScale.totalItems,
        isActive: rawScale.isActive,
        
        // Para lista de escalas, no necesitamos cargar todos los detalles
        items: [],
        responseOptions: [],
        interpretationRules: [],
        instructions: [],
        subscales: [],
        scoringMethod: 'sum' as const,
        scoreRange: { min: 0, max: 100 }
      }));
    } catch (error) {
      console.error('Error fetching scales:', error);
      throw error;
    }
  }
  
  async fetchScale(scaleId: string): Promise<UniversalScale> {
    const response = await fetch(`${this.baseUrl}/api/scales/${scaleId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener escala');
    }
    
    // Transformar datos de API al formato del contexto
    const rawScale = data.data;
    const transformedScale: UniversalScale = {
      id: rawScale.id,
      name: rawScale.name,
      abbreviation: rawScale.abbreviation,
      version: rawScale.version || '1.0',
      category: rawScale.category,
      subcategory: rawScale.subcategory,
      description: rawScale.description,
      estimatedDurationMinutes: rawScale.estimatedDurationMinutes,
      administrationMode: rawScale.administrationMode,
      targetPopulation: rawScale.targetPopulation,
      totalItems: rawScale.totalItems,
      isActive: rawScale.isActive,
      
      // Transformar items
      items: rawScale.items?.map((item: any) => ({
        id: item.id,
        number: item.number,
        text: item.text,
        subscale: item.subscale,
        alertTrigger: item.alertTrigger || false,
        alertCondition: item.alertCondition
      })) || [],
      
      // Transformar opciones de respuesta
      responseOptions: rawScale.responseOptions?.map((option: any) => ({
        value: option.value,
        label: option.label,
        score: option.score
      })) || [],
      
      // Transformar reglas de interpretación
      interpretationRules: rawScale.interpretationRules?.map((rule: any) => ({
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        severity: rule.severity,
        label: rule.label,
        color: rule.color || '#95A5A6',
        description: rule.description,
        recommendations: rule.recommendations || []
      })) || [],
      
      // Transformar instrucciones
      instructions: rawScale.instructions || [],
      
      // Transformar subescalas
      subscales: rawScale.subscales?.map((subscale: any) => ({
        id: subscale.id,
        name: subscale.name,
        items: subscale.items || []
      })) || [],
      
      // Información de puntuación
      scoringMethod: rawScale.scoringMethod || 'sum',
      scoreRange: rawScale.scoreRange || { min: 0, max: 100 }
    };
    
    return transformedScale;
  }
  
  async createSession(patientId: string, clinicianId?: string): Promise<AssessmentSession> {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, clinicianId })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al crear sesión');
    }
    
    return data.data;
  }
  
  async startAdministration(sessionId: string, scaleId: string): Promise<ScaleAdministration> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/administrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scaleId })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al iniciar administración');
    }
    
    return data.data;
  }
  
  async saveResponse(
    administrationId: string,
    itemId: string,
    itemNumber: number,
    responseValue: string,
    responseLabel: string,
    scoreValue: number,
    responseTimeMs?: number,
    wasSkipped: boolean = false
  ): Promise<ItemResponse> {
    const response = await fetch(`${this.baseUrl}/api/administrations/${administrationId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        itemNumber,
        responseValue,
        responseLabel,
        scoreValue,
        responseTimeMs,
        wasSkipped
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al guardar respuesta');
    }
    
    return data.data;
  }
  
  async completeAdministration(administrationId: string, scaleId: string, responses: any[]): Promise<{ results: AssessmentResults }> {
    // Transform responses to match backend format
    const transformedResponses = responses.map(response => ({
      itemNumber: response.itemNumber,
      value: response.responseValue,
      label: response.responseLabel,
      score: response.scoreValue
    }));
    
    const response = await fetch(`${this.baseUrl}/api/administrations/${administrationId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scaleId: scaleId,
        responses: transformedResponses
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al completar administración');
    }
    
    return data.data;
  }
  
  async getPatientTimeline(patientId: string, scaleId?: string): Promise<TimelineEntry[]> {
    const url = scaleId 
      ? `${this.baseUrl}/api/patients/${patientId}/timeline?scaleId=${scaleId}`
      : `${this.baseUrl}/api/patients/${patientId}/timeline`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener historial');
    }
    
    return data.data;
  }
}

// =====================================================================
// CONTEXTO
// =====================================================================

interface UniversalScalesContextType {
  state: UniversalScalesState;
  dispatch: React.Dispatch<UniversalScalesAction>;
  
  // Métodos principales
  loadScales: () => Promise<void>;
  loadScale: (scaleId: string) => Promise<void>;
  startAssessment: (scaleId: string, patientId: string, clinicianId?: string) => Promise<void>;
  saveResponse: (itemId: string, responseValue: string, responseLabel: string, scoreValue: number, responseTimeMs?: number) => Promise<void>;
  completeAssessment: () => Promise<AssessmentResults>;
  nextItem: () => void;
  previousItem: () => void;
  goToItem: (index: number) => void;
  resetAssessment: () => void;
  loadPatientTimeline: (patientId: string, scaleId?: string) => Promise<void>;
  
  // Utilidades
  getCurrentItem: () => ScaleItem | null;
  getResponseForItem: (itemId: string) => ItemResponse | undefined;
  getCompletionPercentage: () => number;
  canProceed: () => boolean;
}

const UniversalScalesContext = createContext<UniversalScalesContextType | null>(null);

// =====================================================================
// PROVIDER
// =====================================================================

interface UniversalScalesProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

export function UniversalScalesProvider({ children, apiBaseUrl }: UniversalScalesProviderProps) {
  const [state, dispatch] = useReducer(universalScalesReducer, {
    ...initialState,
    apiBaseUrl: apiBaseUrl || initialState.apiBaseUrl
  });
  
  const apiClient = useMemo(() => new UniversalScalesApiClient(state.apiBaseUrl), [state.apiBaseUrl]);
  
  // ===================================================================
  // MÉTODOS PRINCIPALES
  // ===================================================================
  
  const loadScales = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const scales = await apiClient.fetchScales();
      dispatch({ type: 'SET_SCALES', payload: scales });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiClient]);
  
  const loadScale = useCallback(async (scaleId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const scale = await apiClient.fetchScale(scaleId);
      dispatch({ type: 'SET_CURRENT_SCALE', payload: scale });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiClient]);
  
  const startAssessment = useCallback(async (scaleId: string, patientId: string, clinicianId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Cargar escala si no está cargada
      if (!state.currentScale || state.currentScale.id !== scaleId) {
        await loadScale(scaleId);
      }
      
      // Crear sesión
      const session = await apiClient.createSession(patientId, clinicianId);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      
      // Iniciar administración
      const administration = await apiClient.startAdministration(session.id, scaleId);
      dispatch({ type: 'SET_CURRENT_ADMINISTRATION', payload: administration });
      
      // Activar assessment
      dispatch({ type: 'SET_ASSESSMENT_ACTIVE', payload: true });
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: 0 });
      dispatch({ type: 'SET_RESPONSES', payload: [] });
      
    } catch (error) {
      console.error('Error in startAssessment:', error);
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentScale, loadScale, apiClient]);
  
  const saveResponse = useCallback(async (
    itemId: string, 
    responseValue: string, 
    responseLabel: string, 
    scoreValue: number, 
    responseTimeMs?: number
  ) => {
    if (!state.currentAdministration) {
      throw new Error('No hay administración activa');
    }
    
    try {
      const item = state.currentScale?.items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Ítem no encontrado');
      }
      
      const response = await apiClient.saveResponse(
        state.currentAdministration.id,
        itemId,
        item.number,
        responseValue,
        responseLabel,
        scoreValue,
        responseTimeMs
      );
      
      dispatch({ type: 'ADD_RESPONSE', payload: response });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, [state.currentAdministration, state.currentScale?.items, apiClient]);
  
  const completeAssessment = useCallback(async (): Promise<AssessmentResults> => {
    if (!state.currentAdministration) {
      throw new Error('No hay administración activa');
    }
    
    if (!state.currentScale) {
      throw new Error('No hay escala activa');
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await apiClient.completeAdministration(
        state.currentAdministration.id,
        state.currentScale.id,
        state.responses
      );
      
      // Actualizar administración con resultados
      const updatedAdministration = {
        ...state.currentAdministration,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        results: result.results
      };
      
      dispatch({ type: 'SET_CURRENT_ADMINISTRATION', payload: updatedAdministration });
      dispatch({ type: 'SET_ASSESSMENT_ACTIVE', payload: false });
      
      return result.results;
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentAdministration, state.currentScale, state.responses, apiClient]);
  
  const loadPatientTimeline = useCallback(async (patientId: string, scaleId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const timeline = await apiClient.getPatientTimeline(patientId, scaleId);
      dispatch({ type: 'SET_PATIENT_TIMELINE', payload: timeline });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiClient]);
  
  // ===================================================================
  // NAVEGACIÓN DE ÍTEMS
  // ===================================================================
  
  const nextItem = useCallback(() => {
    if (state.currentScale && state.currentItemIndex < state.currentScale.totalItems - 1) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: state.currentItemIndex + 1 });
    }
  }, [state.currentScale, state.currentItemIndex]);
  
  const previousItem = useCallback(() => {
    if (state.currentItemIndex > 0) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: state.currentItemIndex - 1 });
    }
  }, [state.currentItemIndex]);
  
  const goToItem = useCallback((index: number) => {
    if (state.currentScale && index >= 0 && index < state.currentScale.totalItems) {
      dispatch({ type: 'SET_CURRENT_ITEM_INDEX', payload: index });
    }
  }, [state.currentScale]);
  
  const resetAssessment = useCallback(() => {
    dispatch({ type: 'RESET_ASSESSMENT' });
  }, []);
  
  // ===================================================================
  // UTILIDADES
  // ===================================================================
  
  const getCurrentItem = useCallback((): ScaleItem | null => {
    if (!state.currentScale || !state.currentScale.items) return null;
    return state.currentScale.items[state.currentItemIndex] || null;
  }, [state.currentScale, state.currentItemIndex]);
  
  const getResponseForItem = useCallback((itemId: string): ItemResponse | undefined => {
    return state.responses.find(response => response.itemId === itemId);
  }, [state.responses]);
  
  const getCompletionPercentage = useCallback((): number => {
    if (!state.currentScale) return 0;
    
    const completedItems = state.responses.filter(r => !r.wasSkipped).length;
    return state.currentScale.totalItems > 0 
      ? (completedItems / state.currentScale.totalItems) * 100 
      : 0;
  }, [state.currentScale, state.responses]);
  
  const canProceed = useCallback((): boolean => {
    const currentItem = getCurrentItem();
    if (!currentItem) return false;
    
    const response = getResponseForItem(currentItem.id);
    return !!(response && !response.wasSkipped && response.responseValue !== '');
  }, [getCurrentItem, getResponseForItem]);
  
  // ===================================================================
  // VALOR DEL CONTEXTO
  // ===================================================================
  
  const contextValue: UniversalScalesContextType = {
    state,
    dispatch,
    
    // Métodos principales
    loadScales,
    loadScale,
    startAssessment,
    saveResponse,
    completeAssessment,
    nextItem,
    previousItem,
    goToItem,
    resetAssessment,
    loadPatientTimeline,
    
    // Utilidades
    getCurrentItem,
    getResponseForItem,
    getCompletionPercentage,
    canProceed
  };
  
  return (
    <UniversalScalesContext.Provider value={contextValue}>
      {children}
    </UniversalScalesContext.Provider>
  );
}

// =====================================================================
// HOOK
// =====================================================================

export function useUniversalScales(): UniversalScalesContextType {
  const context = useContext(UniversalScalesContext);
  if (!context) {
    throw new Error('useUniversalScales must be used within a UniversalScalesProvider');
  }
  return context;
}

// Hook específico para cargar escalas
export function useScales() {
  const { state, loadScales } = useUniversalScales();
  
  useEffect(() => {
    if (state.scales.length === 0 && !state.isLoading) {
      loadScales();
    }
  }, [state.scales.length, state.isLoading, loadScales]);
  
  return {
    scales: state.scales,
    loading: state.isLoading,
    error: state.error,
    refetch: loadScales
  };
}

// Hook para assessment activo
export function useCurrentAssessment() {
  const { 
    state, 
    getCurrentItem, 
    getResponseForItem, 
    getCompletionPercentage, 
    canProceed,
    nextItem,
    previousItem,
    saveResponse,
    completeAssessment
  } = useUniversalScales();
  
  return {
    isActive: state.isAssessmentActive,
    scale: state.currentScale,
    administration: state.currentAdministration,
    session: state.currentSession,
    currentItemIndex: state.currentItemIndex,
    currentItem: getCurrentItem(),
    responses: state.responses,
    completionPercentage: getCompletionPercentage(),
    canProceed: canProceed(),
    
    // Métodos
    nextItem,
    previousItem,
    saveResponse,
    completeAssessment,
    getResponse: getResponseForItem
  };
}