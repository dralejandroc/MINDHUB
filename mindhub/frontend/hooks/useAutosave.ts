/**
 * Autosave Hook for Consultation Notes
 * Implements automatic saving with unsaved changes warning
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface AutosaveOptions {
  intervalMs?: number;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  consultationId?: string;
  enableWarning?: boolean;
}

export interface AutosaveState {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useAutosave<T extends Record<string, any>>(
  data: T,
  options: AutosaveOptions = {}
) {
  const {
    intervalMs = 30000, // 30 seconds
    onSave,
    onError,
    consultationId,
    enableWarning = true
  } = options;

  const [state, setState] = useState<AutosaveState>({
    isSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null
  });

  const dataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const initialDataRef = useRef<string>();

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
    
    // Set initial data hash on first load
    if (!initialDataRef.current) {
      initialDataRef.current = JSON.stringify(data);
      return;
    }

    // Check if data has changed
    const currentDataHash = JSON.stringify(data);
    const hasChanges = currentDataHash !== initialDataRef.current;

    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
      error: null
    }));

    // Clear existing timeout and set new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only start autosave if we have changes and consultationId
    if (hasChanges && consultationId && onSave) {
      timeoutRef.current = setTimeout(() => {
        performAutosave();
      }, intervalMs);
    }
  }, [data, intervalMs, consultationId, onSave]);

  const performAutosave = useCallback(async () => {
    if (!onSave || !consultationId || state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await onSave(dataRef.current);
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        error: null
      }));

      // Update initial data hash after successful save
      initialDataRef.current = JSON.stringify(dataRef.current);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Autosave failed';
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [onSave, consultationId, state.isSaving, onError]);

  const manualSave = useCallback(async () => {
    if (!onSave) return;
    await performAutosave();
  }, [performAutosave, onSave]);

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    if (!enableWarning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.hasUnsavedChanges, enableWarning]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    manualSave,
    performAutosave
  };
}

// API client for autosave functionality
export class ConsultationAutosaveApi {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8002/api/expedix'
    : '/api/expedix/django';

  async autosave(consultationId: string, content: any, sessionId?: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.baseUrl}/consultations/${consultationId}/autosave/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          session_id: sessionId || `session_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Autosave failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Autosave failed');
      }
    } catch (error) {
      console.error('Autosave API error:', error);
      throw error;
    }
  }

  async getAutosave(consultationId: string): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.baseUrl}/consultations/${consultationId}/get_autosave/`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Get autosave failed: ${response.status}`);
      }

      const result = await response.json();
      
      return result.has_autosave ? result.content : null;
    } catch (error) {
      console.error('Get autosave API error:', error);
      throw error;
    }
  }

  async saveConsultation(consultationId: string, data: any): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.baseUrl}/consultations/${consultationId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Save consultation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Save consultation failed');
      }
    } catch (error) {
      console.error('Save consultation API error:', error);
      throw error;
    }
  }

  async finalizeConsultation(consultationId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.baseUrl}/consultations/${consultationId}/finalize/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Finalize consultation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Finalize consultation failed');
      }
    } catch (error) {
      console.error('Finalize consultation API error:', error);
      throw error;
    }
  }
}

export const consultationAutosaveApi = new ConsultationAutosaveApi();