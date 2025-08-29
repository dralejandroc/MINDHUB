/**
 * COMPONENTE ESPECIALIZADO - Historial de Medicamentos
 * Vista detallada de medicamentos con timeline y cambios automáticos
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  StopCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { expedixApi } from '@/lib/api/expedix-client';
import { useMedicationSync } from '@/hooks/useMedicationSync';

interface MedicationEvent {
  id: string;
  medicationName: string;
  substance: string;
  presentation: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate?: string;
  discontinuedDate?: string;
  status: 'active' | 'completed' | 'discontinued' | 'suspended';
  prescriptionId: string;
  consultationId: string;
  consultationDate: string;
  prescribedBy: string;
  reason?: string; // Razón de suspensión/cambio
  indications?: string;
  sideEffects?: string[];
  adherence?: 'good' | 'partial' | 'poor';
  changes: MedicationChange[];
}

interface MedicationChange {
  id: string;
  date: string;
  type: 'dose_change' | 'frequency_change' | 'suspension' | 'discontinuation' | 'restart';
  previousValue?: string;
  newValue?: string;
  reason: string;
  prescribedBy: string;
  consultationId: string;
}

interface MedicationHistoryProps {
  patientId: string;
  onMedicationReuse?: (medication: MedicationEvent) => void;
}

export default function MedicationHistory({ patientId, onMedicationReuse }: MedicationHistoryProps) {
  const [medications, setMedications] = useState<MedicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'discontinued'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Hook de sincronización automática
  const { syncMedications, forceSyncMedications, isAutoSyncEnabled, lastSync } = useMedicationSync({
    patientId,
    autoSync: true,
    syncIntervalMs: 30000, // 30 segundos
    onSyncComplete: (newMeds) => {
      if (newMeds > 0) {
        console.log(`✅ Sincronización completada: ${newMeds} medicamentos nuevos`);
        loadMedicationHistory(); // Recargar para mostrar cambios
      }
    },
    onSyncError: (error) => {
      console.error('❌ Error en sincronización automática:', error);
    }
  });

  useEffect(() => {
    loadMedicationHistory();
  }, [patientId]);

  const loadMedicationHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener prescripciones y consultas del paciente
      const [prescriptionsResult, consultationsResult] = await Promise.allSettled([
        expedixApi.getPatientPrescriptions(patientId),
        expedixApi.getPatientConsultationForms(patientId)
      ]);

      const prescriptions = prescriptionsResult.status === 'fulfilled' ? prescriptionsResult.value?.data || [] : [];
      const consultations = consultationsResult.status === 'fulfilled' ? consultationsResult.value?.data || [] : [];

      // Procesar y construir historial de medicamentos
      const medicationHistory = processMedicationHistory(prescriptions, consultations);
      
      setMedications(medicationHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial de medicamentos');
    } finally {
      setLoading(false);
    }
  };

  const processMedicationHistory = (prescriptions: any[], consultations: any[]): MedicationEvent[] => {
    const medicationMap = new Map<string, MedicationEvent>();

    // Procesar cada prescripción
    prescriptions.forEach((prescription: any) => {
      const consultation = consultations.find(c => c.id === prescription.consultation_id);
      const prescriptionDate = prescription.date || prescription.created_at;

      if (prescription.medications && Array.isArray(prescription.medications)) {
        prescription.medications.forEach((med: any) => {
          const medicationKey = `${med.name}-${med.substance}`;
          
          // Crear o actualizar evento de medicamento
          if (!medicationMap.has(medicationKey)) {
            medicationMap.set(medicationKey, {
              id: `${medicationKey}-${prescription.id}`,
              medicationName: med.name || 'Medicamento no especificado',
              substance: med.substance || '',
              presentation: med.presentation || '',
              dosage: med.dosage || med.prescription || '',
              frequency: med.frequency || 'Según indicación médica',
              duration: med.duration || 'No especificada',
              startDate: prescriptionDate,
              status: determineStatus(prescription, prescriptionDate),
              prescriptionId: prescription.id,
              consultationId: prescription.consultation_id || '',
              consultationDate: consultation?.date || prescriptionDate,
              prescribedBy: prescription.doctor_name || prescription.professional_name || 'Dr. Sin especificar',
              indications: prescription.indications || med.indications,
              changes: []
            });
          } else {
            // Si ya existe, agregar como cambio
            const existing = medicationMap.get(medicationKey)!;
            const change: MedicationChange = {
              id: `change-${prescription.id}`,
              date: prescriptionDate,
              type: 'dose_change',
              previousValue: existing.dosage,
              newValue: med.dosage || med.prescription || '',
              reason: `Ajuste en consulta del ${new Date(prescriptionDate).toLocaleDateString()}`,
              prescribedBy: prescription.doctor_name || prescription.professional_name || 'Dr. Sin especificar',
              consultationId: prescription.consultation_id || ''
            };
            
            existing.changes.push(change);
            existing.dosage = med.dosage || med.prescription || existing.dosage;
            existing.endDate = prescriptionDate; // Actualizar fecha de último cambio
          }
        });
      }
    });

    // Convertir mapa a array y ordenar por fecha de inicio (más reciente primero)
    return Array.from(medicationMap.values())
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const determineStatus = (prescription: any, date: string): 'active' | 'completed' | 'discontinued' | 'suspended' => {
    if (prescription.status === 'discontinued') return 'discontinued';
    if (prescription.status === 'suspended') return 'suspended';
    if (prescription.status === 'active') return 'active';
    
    // Lógica basada en fecha si no hay estado explícito
    const prescriptionDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - prescriptionDate.getTime()) / (1000 * 3600 * 24));
    
    return daysDiff > 30 ? 'completed' : 'active';
  };

  // Filtrar medicamentos
  const filteredMedications = useMemo(() => {
    return medications.filter(med => {
      const matchesStatus = filterStatus === 'all' || med.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        med.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.substance.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [medications, filterStatus, searchQuery]);

  const toggleExpanded = (medId: string) => {
    const newExpanded = new Set(expandedMeds);
    if (newExpanded.has(medId)) {
      newExpanded.delete(medId);
    } else {
      newExpanded.add(medId);
    }
    setExpandedMeds(newExpanded);
  };

  const getStatusColor = (status: MedicationEvent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: MedicationEvent['status']) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'completed': return <ClockIcon className="w-4 h-4" />;
      case 'discontinued': return <StopCircleIcon className="w-4 h-4" />;
      case 'suspended': return <PauseCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  // Función para sincronización manual
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await forceSyncMedications();
      if (result.success && (result.newMedications > 0 || result.updatedMedications > 0)) {
        await loadMedicationHistory();
      }
    } catch (error) {
      console.error('Error en sincronización manual:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando historial de medicamentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadMedicationHistory} variant="outline">
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar medicamento o sustancia activa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="completed">Completados</option>
              <option value="discontinued">Descontinuados</option>
              <option value="suspended">Suspendidos</option>
            </select>

            <Button
              onClick={handleManualSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
        
        {/* Información de sincronización */}
        {isAutoSyncEnabled && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sincronización automática activa</span>
            </div>
            {lastSync && (
              <span>Última actualización: {new Date(lastSync).toLocaleTimeString()}</span>
            )}
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{medications.filter(m => m.status === 'active').length}</div>
            <div className="text-gray-500">Activos</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{medications.filter(m => m.status === 'completed').length}</div>
            <div className="text-gray-500">Completados</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{medications.filter(m => m.status === 'discontinued').length}</div>
            <div className="text-gray-500">Descontinuados</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{medications.length}</div>
            <div className="text-gray-500">Total</div>
          </div>
        </div>
      </Card>

      {/* Lista de medicamentos */}
      <div className="space-y-3">
        {filteredMedications.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No se encontraron medicamentos</p>
            {searchQuery && (
              <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
            )}
          </Card>
        ) : (
          filteredMedications.map((medication) => (
            <Card key={medication.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpanded(medication.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{medication.medicationName}</h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(medication.status)}`}>
                        {getStatusIcon(medication.status)}
                        {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {medication.substance && (
                        <p><span className="font-medium">Sustancia:</span> {medication.substance}</p>
                      )}
                      <p><span className="font-medium">Dosis:</span> {medication.dosage}</p>
                      <p><span className="font-medium">Frecuencia:</span> {medication.frequency}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>📅 Inicio: {new Date(medication.startDate).toLocaleDateString()}</span>
                        {medication.endDate && (
                          <span>📅 Última modificación: {new Date(medication.endDate).toLocaleDateString()}</span>
                        )}
                        <span>👨‍⚕️ {medication.prescribedBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {onMedicationReuse && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMedicationReuse(medication);
                        }}
                        className="text-xs"
                      >
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Reutilizar
                      </Button>
                    )}
                    <ArrowRightIcon 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedMeds.has(medication.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedMeds.has(medication.id) && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="space-y-4">
                    {/* Información adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {medication.presentation && (
                        <div>
                          <span className="font-medium text-gray-700">Presentación:</span>
                          <p className="text-gray-600">{medication.presentation}</p>
                        </div>
                      )}
                      {medication.duration && (
                        <div>
                          <span className="font-medium text-gray-700">Duración:</span>
                          <p className="text-gray-600">{medication.duration}</p>
                        </div>
                      )}
                    </div>

                    {medication.indications && (
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Indicaciones:</span>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{medication.indications}</p>
                      </div>
                    )}

                    {/* Historial de cambios */}
                    {medication.changes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Historial de cambios:</h4>
                        <div className="space-y-2">
                          {medication.changes.map((change) => (
                            <div key={change.id} className="bg-white p-3 rounded border-l-4 border-orange-400">
                              <div className="flex items-start justify-between">
                                <div className="text-sm">
                                  <p className="font-medium text-gray-800">
                                    {change.type === 'dose_change' ? 'Cambio de dosis' : 
                                     change.type === 'frequency_change' ? 'Cambio de frecuencia' :
                                     change.type === 'suspension' ? 'Suspensión' :
                                     change.type === 'discontinuation' ? 'Descontinuación' :
                                     'Reinicio'}
                                  </p>
                                  <p className="text-gray-600 mt-1">{change.reason}</p>
                                  {change.previousValue && change.newValue && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      De "{change.previousValue}" a "{change.newValue}"
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                  <p>{new Date(change.date).toLocaleDateString()}</p>
                                  <p>{change.prescribedBy}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}