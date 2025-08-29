/**
 * HOOK OPTIMIZADO - Data Fetching para Expedix
 * Implementa caching, batch requests, y lazy loading para mejor performance
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Patient } from '@/lib/api/expedix-client';

interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface BatchRequest {
  key: string;
  resolver: () => Promise<any>;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class DataCache {
  private cache = new Map<string, CachedData>();
  private pendingRequests = new Map<string, Promise<any>>();
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  // Cache con expiración
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  // Batch requests para reducir llamadas simultáneas
  async batchRequest<T>(key: string, resolver: () => Promise<T>): Promise<T> {
    // Si ya tenemos la data en cache, devolverla inmediatamente
    const cached = this.get<T>(key);
    if (cached) return cached;

    // Si ya hay una petición pendiente para esta key, esperarla
    const pending = this.pendingRequests.get(key);
    if (pending) return pending;

    // Crear nueva promesa y agregarla a la cola de batch
    return new Promise<T>((resolve, reject) => {
      this.batchQueue.push({ key, resolver, resolve, reject });
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Procesar batch después de 10ms para agrupar requests
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, 10);
    });
  }

  private async processBatch(): void {
    const currentBatch = [...this.batchQueue];
    this.batchQueue.length = 0;
    this.batchTimeout = null;

    // Agrupar requests similares
    const grouped = this.groupSimilarRequests(currentBatch);
    
    for (const group of grouped) {
      await this.processGroup(group);
    }
  }

  private groupSimilarRequests(requests: BatchRequest[]): BatchRequest[][] {
    // Lógica simple: agrupar por prefijo de key (ej: "patient-", "consultations-")
    const groups: { [prefix: string]: BatchRequest[] } = {};
    
    requests.forEach(request => {
      const prefix = request.key.split('-')[0];
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(request);
    });
    
    return Object.values(groups);
  }

  private async processGroup(group: BatchRequest[]): Promise<void> {
    for (const request of group) {
      const promise = request.resolver();
      this.pendingRequests.set(request.key, promise);
      
      try {
        const result = await promise;
        this.set(request.key, result);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        this.pendingRequests.delete(request.key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Instancia global del cache
const globalCache = new DataCache();

export interface UseOptimizedExpedixDataOptions {
  patientId?: string;
  autoLoad?: boolean;
  cacheKey?: string;
  ttl?: number; // Time to live en milisegundos
}

export interface ExpedixDataState {
  patient: Patient | null;
  consultations: any[];
  prescriptions: any[];
  assessments: any[];
  appointments: any[];
  documents: any[];
  loading: boolean;
  error: string | null;
}

export function useOptimizedExpedixData(options: UseOptimizedExpedixDataOptions = {}) {
  const { patientId, autoLoad = true, cacheKey, ttl = 5 * 60 * 1000 } = options;
  
  const [state, setState] = useState<ExpedixDataState>({
    patient: null,
    consultations: [],
    prescriptions: [],
    assessments: [],
    appointments: [],
    documents: [],
    loading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController>();

  // Función optimizada para cargar datos del paciente
  const loadPatientData = useCallback(async (id: string) => {
    if (!id) return;

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Usar batch requests para cargar todos los datos en paralelo
      const baseKey = cacheKey || `patient-${id}`;
      
      const [patient, consultations, prescriptions, assessments, appointments, documents] = await Promise.all([
        globalCache.batchRequest(`${baseKey}-patient`, () => 
          fetchPatientData(id, signal)
        ),
        globalCache.batchRequest(`${baseKey}-consultations`, () => 
          fetchConsultations(id, signal)
        ),
        globalCache.batchRequest(`${baseKey}-prescriptions`, () => 
          fetchPrescriptions(id, signal)
        ),
        globalCache.batchRequest(`${baseKey}-assessments`, () => 
          fetchAssessments(id, signal)
        ),
        globalCache.batchRequest(`${baseKey}-appointments`, () => 
          fetchAppointments(id, signal)
        ),
        globalCache.batchRequest(`${baseKey}-documents`, () => 
          fetchDocuments(id, signal)
        )
      ]);

      if (!signal.aborted) {
        setState({
          patient,
          consultations,
          prescriptions,
          assessments,
          appointments,
          documents,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      if (!signal.aborted) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    }
  }, [cacheKey, ttl]);

  // Función para refresh de datos específicos
  const refreshSection = useCallback(async (section: keyof ExpedixDataState, id: string) => {
    if (!id || loading) return;

    const baseKey = cacheKey || `patient-${id}`;
    const sectionKey = `${baseKey}-${section}`;
    
    // Limpiar cache para esta sección
    globalCache.set(sectionKey, null, 0);
    
    try {
      let data;
      switch (section) {
        case 'consultations':
          data = await globalCache.batchRequest(sectionKey, () => fetchConsultations(id));
          break;
        case 'prescriptions':
          data = await globalCache.batchRequest(sectionKey, () => fetchPrescriptions(id));
          break;
        case 'assessments':
          data = await globalCache.batchRequest(sectionKey, () => fetchAssessments(id));
          break;
        // ... otros casos
        default:
          return;
      }
      
      setState(prev => ({ ...prev, [section]: data }));
    } catch (error) {
      console.error(`Error refreshing ${section}:`, error);
    }
  }, [cacheKey, loading]);

  // Auto-load cuando cambia patientId
  useEffect(() => {
    if (autoLoad && patientId) {
      loadPatientData(patientId);
    }
  }, [patientId, autoLoad, loadPatientData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    loadPatientData,
    refreshSection,
    clearCache: globalCache.clear.bind(globalCache)
  };
}

// Funciones de fetch optimizadas (implementar con tu API real)
async function fetchPatientData(id: string, signal?: AbortSignal): Promise<Patient> {
  const response = await fetch(`/api/expedix/django/patients/${id}/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar datos del paciente');
  return response.json();
}

async function fetchConsultations(id: string, signal?: AbortSignal): Promise<any[]> {
  const response = await fetch(`/api/expedix/django/patients/${id}/consultations/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar consultas');
  return response.json();
}

async function fetchPrescriptions(id: string, signal?: AbortSignal): Promise<any[]> {
  const response = await fetch(`/api/expedix/django/patients/${id}/prescriptions/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar prescripciones');
  return response.json();
}

async function fetchAssessments(id: string, signal?: AbortSignal): Promise<any[]> {
  const response = await fetch(`/api/expedix/django/patients/${id}/assessments/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar evaluaciones');
  return response.json();
}

async function fetchAppointments(id: string, signal?: AbortSignal): Promise<any[]> {
  const response = await fetch(`/api/expedix/django/patients/${id}/appointments/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar citas');
  return response.json();
}

async function fetchDocuments(id: string, signal?: AbortSignal): Promise<any[]> {
  const response = await fetch(`/api/expedix/django/patients/${id}/documents/`, {
    signal,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) throw new Error('Error al cargar documentos');
  return response.json();
}