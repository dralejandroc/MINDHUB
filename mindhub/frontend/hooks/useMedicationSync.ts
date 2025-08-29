/**
 * HOOK ESPECIALIZADO - Sincronización Automática de Medicamentos
 * Autoalimenta el historial de medicamentos desde consultas y recetas
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { expedixApi } from '@/lib/api/expedix-client';

export interface MedicationSyncOptions {
  patientId: string;
  autoSync?: boolean;
  syncIntervalMs?: number;
  onSyncComplete?: (newMedications: number) => void;
  onSyncError?: (error: Error) => void;
}

interface SyncedMedication {
  id: string;
  name: string;
  substance: string;
  presentation: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued' | 'suspended';
  consultationId: string;
  prescriptionId: string;
  lastSynced: string;
}

interface MedicationSyncResult {
  success: boolean;
  newMedications: number;
  updatedMedications: number;
  errors: string[];
}

export function useMedicationSync(options: MedicationSyncOptions) {
  const { 
    patientId, 
    autoSync = true, 
    syncIntervalMs = 30000, // 30 segundos
    onSyncComplete,
    onSyncError 
  } = options;

  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const lastSyncRef = useRef<string>();
  const isSyncingRef = useRef<boolean>(false);

  // Función principal de sincronización
  const syncMedications = useCallback(async (): Promise<MedicationSyncResult> => {
    if (isSyncingRef.current) {
      return { success: true, newMedications: 0, updatedMedications: 0, errors: [] };
    }

    isSyncingRef.current = true;
    
    try {
      // Obtener datos de consultas y recetas desde la última sincronización
      const [consultationsResult, prescriptionsResult] = await Promise.allSettled([
        expedixApi.getPatientConsultationForms(patientId),
        expedixApi.getPatientPrescriptions(patientId)
      ]);

      const consultations = consultationsResult.status === 'fulfilled' ? consultationsResult.value?.data || [] : [];
      const prescriptions = prescriptionsResult.status === 'fulfilled' ? prescriptionsResult.value?.data || [] : [];

      // Procesar y sincronizar medicamentos
      const syncResult = await processMedicationSync(consultations, prescriptions, patientId);

      // Actualizar timestamp de última sincronización
      lastSyncRef.current = new Date().toISOString();

      // Notificar completado
      if (onSyncComplete) {
        onSyncComplete(syncResult.newMedications);
      }

      return syncResult;

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Error desconocido en sincronización');
      
      if (onSyncError) {
        onSyncError(syncError);
      }

      return {
        success: false,
        newMedications: 0,
        updatedMedications: 0,
        errors: [syncError.message]
      };
    } finally {
      isSyncingRef.current = false;
    }
  }, [patientId, onSyncComplete, onSyncError]);

  // Función para forzar sincronización manual
  const forceSyncMedications = useCallback(async () => {
    lastSyncRef.current = undefined; // Reset para obtener todos los datos
    return await syncMedications();
  }, [syncMedications]);

  // Configurar auto-sync si está habilitado
  useEffect(() => {
    if (!autoSync || !patientId) return;

    // Sincronización inicial
    syncMedications();

    // Configurar intervalo
    syncIntervalRef.current = setInterval(syncMedications, syncIntervalMs);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, patientId, syncIntervalMs, syncMedications]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      isSyncingRef.current = false;
    };
  }, []);

  return {
    syncMedications,
    forceSyncMedications,
    isAutoSyncEnabled: autoSync,
    lastSync: lastSyncRef.current
  };
}

// Función auxiliar para procesar sincronización de medicamentos
async function processMedicationSync(
  consultations: any[], 
  prescriptions: any[], 
  patientId: string
): Promise<MedicationSyncResult> {
  let newMedications = 0;
  let updatedMedications = 0;
  const errors: string[] = [];

  try {
    // Obtener medicamentos existentes del almacenamiento local
    const existingMedications = await getExistingMedications(patientId);
    const existingMedicationMap = new Map(existingMedications.map(med => [med.id, med]));

    // Procesar recetas nuevas o actualizadas
    for (const prescription of prescriptions) {
      if (prescription.medications && Array.isArray(prescription.medications)) {
        for (const med of prescription.medications) {
          try {
            const medicationId = generateMedicationId(med, prescription.id);
            const syncedMed: SyncedMedication = {
              id: medicationId,
              name: med.name || 'Medicamento no especificado',
              substance: med.substance || '',
              presentation: med.presentation || '',
              dosage: med.dosage || med.prescription || '',
              frequency: med.frequency || 'Según indicación médica',
              duration: med.duration || 'No especificada',
              startDate: prescription.date || prescription.created_at,
              status: determineStatus(prescription, prescription.date || prescription.created_at),
              consultationId: prescription.consultation_id || '',
              prescriptionId: prescription.id,
              lastSynced: new Date().toISOString()
            };

            if (existingMedicationMap.has(medicationId)) {
              // Actualizar medicamento existente
              await updateMedication(patientId, syncedMed);
              updatedMedications++;
            } else {
              // Crear nuevo medicamento
              await createMedication(patientId, syncedMed);
              newMedications++;
            }
          } catch (medError) {
            errors.push(`Error procesando medicamento ${med.name}: ${medError}`);
          }
        }
      }
    }

    // Procesar consultas para detectar cambios en medicamentos
    for (const consultation of consultations) {
      if (consultation.medications && Array.isArray(consultation.medications)) {
        for (const med of consultation.medications) {
          try {
            // Buscar si este medicamento tiene cambios respecto a prescripciones anteriores
            await processMedicationChanges(med, consultation, patientId);
          } catch (changeError) {
            errors.push(`Error procesando cambios de ${med.name}: ${changeError}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      newMedications,
      updatedMedications,
      errors
    };

  } catch (error) {
    return {
      success: false,
      newMedications: 0,
      updatedMedications: 0,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    };
  }
}

// Funciones auxiliares para almacenamiento local
async function getExistingMedications(patientId: string): Promise<SyncedMedication[]> {
  try {
    const stored = localStorage.getItem(`medication-history-${patientId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function createMedication(patientId: string, medication: SyncedMedication): Promise<void> {
  const existing = await getExistingMedications(patientId);
  existing.push(medication);
  localStorage.setItem(`medication-history-${patientId}`, JSON.stringify(existing));
}

async function updateMedication(patientId: string, medication: SyncedMedication): Promise<void> {
  const existing = await getExistingMedications(patientId);
  const index = existing.findIndex(med => med.id === medication.id);
  
  if (index !== -1) {
    existing[index] = medication;
    localStorage.setItem(`medication-history-${patientId}`, JSON.stringify(existing));
  }
}

async function processMedicationChanges(
  medication: any, 
  consultation: any, 
  patientId: string
): Promise<void> {
  // Lógica para detectar cambios en medicamentos existentes
  // Por ejemplo, cambios en dosis, frecuencia, suspensiones, etc.
  
  const existing = await getExistingMedications(patientId);
  const similarMedication = existing.find(med => 
    med.name.toLowerCase() === medication.name?.toLowerCase() ||
    med.substance.toLowerCase() === medication.substance?.toLowerCase()
  );

  if (similarMedication) {
    // Detectar cambios
    const hasChanges = 
      similarMedication.dosage !== (medication.dosage || medication.prescription) ||
      similarMedication.frequency !== medication.frequency ||
      similarMedication.status !== medication.status;

    if (hasChanges) {
      // Crear registro de cambio
      const change = {
        id: `change-${Date.now()}`,
        date: consultation.date || consultation.created_at,
        type: 'dose_change' as const,
        previousValue: similarMedication.dosage,
        newValue: medication.dosage || medication.prescription,
        reason: `Ajuste en consulta del ${new Date(consultation.date || consultation.created_at).toLocaleDateString()}`,
        prescribedBy: consultation.professional_name || 'Dr. Sin especificar',
        consultationId: consultation.id
      };

      // Actualizar medicamento con cambio
      similarMedication.endDate = consultation.date || consultation.created_at;
      similarMedication.lastSynced = new Date().toISOString();
      
      await updateMedication(patientId, similarMedication);
    }
  }
}

function generateMedicationId(medication: any, prescriptionId: string): string {
  const name = medication.name || 'unknown';
  const substance = medication.substance || 'unknown';
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${substance.toLowerCase().replace(/\s+/g, '-')}-${prescriptionId}`;
}

function determineStatus(prescription: any, date: string): 'active' | 'completed' | 'discontinued' | 'suspended' {
  if (prescription.status === 'discontinued') return 'discontinued';
  if (prescription.status === 'suspended') return 'suspended';
  if (prescription.status === 'active') return 'active';
  
  // Lógica basada en fecha si no hay estado explícito
  const prescriptionDate = new Date(date);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - prescriptionDate.getTime()) / (1000 * 3600 * 24));
  
  return daysDiff > 30 ? 'completed' : 'active';
}

// Hook secundario para notificaciones de cambios
export function useMedicationChangeNotifications(patientId: string) {
  const [recentChanges, setRecentChanges] = useState<any[]>([]);

  const checkForRecentChanges = useCallback(async () => {
    const medications = await getExistingMedications(patientId);
    const recent = medications.filter(med => {
      const lastSync = new Date(med.lastSynced);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      return hoursSinceSync <= 24; // Cambios en las últimas 24 horas
    });
    
    setRecentChanges(recent);
  }, [patientId]);

  useEffect(() => {
    checkForRecentChanges();
    const interval = setInterval(checkForRecentChanges, 60000); // Cada minuto
    
    return () => clearInterval(interval);
  }, [checkForRecentChanges]);

  return {
    recentChanges,
    hasRecentChanges: recentChanges.length > 0
  };
}