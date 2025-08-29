/**
 * COMPONENTE MEJORADO - PatientTimeline con Historial de Medicamentos
 * Integra vista de timeline general y vista especializada de medicamentos
 */

'use client';

import { useState, useEffect } from 'react';
import { Timeline, type TimelineEntry } from './Timeline';
import { expedixApi } from '@/lib/api/expedix-client';
import { patientTimelineApi } from '@/lib/api/patient-timeline-client';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import MedicationHistory from './MedicationHistory';
import {
  FunnelIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  ChartBarIcon,
  CubeIcon // Para medicamentos
} from '@heroicons/react/24/outline';

interface PatientTimelineEnhancedProps {
  patientId: string;
  patientName?: string;
  showHeader?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
  onMedicationReuse?: (medication: any) => void;
}

type EventType = 'all' | 'consultation' | 'prescription' | 'lab' | 'assessment' | 'note' | 'appointment' | 'vital' | 'diagnosis';
type ViewMode = 'timeline' | 'medications';

export default function PatientTimelineEnhanced({ 
  patientId, 
  patientName = 'Paciente',
  showHeader = true,
  maxHeight,
  showFilters = true,
  onMedicationReuse
}: PatientTimelineEnhancedProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<EventType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const eventFilters = [
    { value: 'all' as EventType, label: 'Todo', icon: CalendarDaysIcon, count: 0 },
    { value: 'consultation' as EventType, label: 'Consultas', icon: ClipboardDocumentCheckIcon, count: 0 },
    { value: 'prescription' as EventType, label: 'Recetas', icon: DocumentTextIcon, count: 0 },
    { value: 'assessment' as EventType, label: 'Evaluaciones', icon: ChartBarIcon, count: 0 },
    { value: 'lab' as EventType, label: 'Laboratorio', icon: BeakerIcon, count: 0 }
  ];

  const viewModes = [
    { value: 'timeline' as ViewMode, label: 'Timeline Completo', icon: CalendarDaysIcon },
    { value: 'medications' as ViewMode, label: 'Solo Medicamentos', icon: CubeIcon }
  ];

  useEffect(() => {
    if (viewMode === 'timeline') {
      loadTimelineData();
    }
  }, [patientId, viewMode]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all patient data in parallel
      const [consultations, prescriptions, assessments, appointments] = await Promise.allSettled([
        expedixApi.getPatientConsultationForms(patientId),
        expedixApi.getPatientPrescriptions(patientId),
        clinimetrixProClient.getPatientAssessments(patientId),
        expedixApi.getAppointments(patientId)
      ]);

      const events: TimelineEntry[] = [];

      // Process consultations
      if (consultations.status === 'fulfilled' && consultations.value?.data) {
        consultations.value.data.forEach((consultation: any) => {
          events.push({
            id: `consultation-${consultation.id}`,
            title: 'Consulta Médica',
            date: consultation.date || consultation.created_at,
            type: 'consultation',
            content: (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Motivo:</span> {consultation.reason || 'Consulta general'}
                </p>
                {consultation.diagnosis && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Diagnóstico:</span> {consultation.diagnosis}
                  </p>
                )}
                {consultation.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {consultation.notes}
                  </p>
                )}
                {consultation.vital_signs && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    {consultation.vital_signs.blood_pressure && (
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1">
                        <span className="text-gray-500">TA:</span> {consultation.vital_signs.blood_pressure}
                      </div>
                    )}
                    {consultation.vital_signs.heart_rate && (
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1">
                        <span className="text-gray-500">FC:</span> {consultation.vital_signs.heart_rate} bpm
                      </div>
                    )}
                    {consultation.vital_signs.temperature && (
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1">
                        <span className="text-gray-500">Temp:</span> {consultation.vital_signs.temperature}°C
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
            metadata: {
              professional: consultation.professional_name || consultation.created_by_name,
              status: consultation.status || 'completed'
            }
          });
        });
      }

      // Process prescriptions
      if (prescriptions.status === 'fulfilled' && prescriptions.value?.data) {
        prescriptions.value.data.forEach((prescription: any) => {
          const medicationsList = prescription.medications || [];
          events.push({
            id: `prescription-${prescription.id}`,
            title: 'Receta Médica',
            date: prescription.date || prescription.created_at,
            type: 'prescription',
            content: (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Medicamentos prescritos:
                </p>
                {medicationsList.length > 0 ? (
                  <ul className="space-y-1">
                    {medicationsList.map((med: any, index: number) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        • {med.name} - {med.dosage} - {med.frequency} por {med.duration}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay medicamentos registrados</p>
                )}
                {prescription.indications && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Indicaciones:</span> {prescription.indications}
                    </p>
                  </div>
                )}
              </div>
            ),
            metadata: {
              professional: prescription.doctor_name || prescription.professional_name,
              status: prescription.status || 'active'
            }
          });
        });
      }

      // Process assessments
      if (assessments.status === 'fulfilled' && assessments.value) {
        assessments.value.forEach((assessment: any) => {
          events.push({
            id: `assessment-${assessment.id}`,
            title: assessment.scale_name || 'Evaluación Clínica',
            date: assessment.completed_at || assessment.created_at,
            type: 'assessment',
            content: (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Escala:</span> {assessment.scale_abbreviation || assessment.scale_name}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assessment.severity === 'severe' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    assessment.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    assessment.severity === 'mild' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {assessment.severity || 'Normal'}
                  </span>
                </div>
                {assessment.total_score !== undefined && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Puntuación:</span> {assessment.total_score}
                    {assessment.max_score && ` / ${assessment.max_score}`}
                  </p>
                )}
                {assessment.interpretation && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    {assessment.interpretation}
                  </p>
                )}
              </div>
            ),
            metadata: {
              professional: assessment.administered_by || assessment.professional_name,
              status: 'completed'
            }
          });
        });
      }

      // Process appointments
      if (appointments.status === 'fulfilled' && appointments.value) {
        appointments.value.forEach((appointment: any) => {
          events.push({
            id: `appointment-${appointment.id}`,
            title: 'Cita Médica',
            date: appointment.date || appointment.scheduled_at,
            type: 'appointment',
            content: (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Tipo:</span> {appointment.appointment_type || 'Consulta general'}
                </p>
                {appointment.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {appointment.notes}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>📅 {appointment.time || 'Hora no especificada'}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    appointment.status === 'no-show' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {appointment.status || 'scheduled'}
                  </span>
                </div>
              </div>
            ),
            metadata: {
              professional: appointment.professional_name || appointment.doctor_name,
              status: appointment.status || 'scheduled'
            }
          });
        });
      }

      // Sort events by date (most recent first)
      const sortedEvents = events.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTimelineEvents(sortedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = timelineEvents.filter(event => {
    if (selectedFilter === 'all') return true;
    return event.type === selectedFilter;
  });

  const handleRefresh = () => {
    if (viewMode === 'timeline') {
      loadTimelineData();
    }
    // Para medications, el componente MedicationHistory maneja su propio refresh
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Timeline de {patientName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {viewMode === 'timeline' 
                ? 'Historial completo del paciente' 
                : 'Historial detallado de medicamentos'
              }
            </p>
          </div>
          
          {/* Selector de Vista */}
          <div className="flex items-center gap-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  variant={viewMode === mode.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </Button>
              );
            })}
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </div>
      )}

      {/* Contenido basado en la vista seleccionada */}
      {viewMode === 'timeline' ? (
        <>
          {/* Filtros para Timeline */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pb-4 border-b dark:border-gray-700">
              {eventFilters.map((filter) => {
                const Icon = filter.icon;
                const count = filter.value === 'all' ? 
                  timelineEvents.length : 
                  timelineEvents.filter(e => e.type === filter.value).length;
                
                return (
                  <Button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    variant={selectedFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                    <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Timeline Component */}
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadTimelineData} variant="outline">
                Reintentar
              </Button>
            </div>
          ) : (
            <div style={{ maxHeight }} className="overflow-y-auto">
              <Timeline 
                entries={filteredEvents}
                showMetadata={true}
                emptyMessage="No hay eventos para mostrar"
              />
            </div>
          )}
        </>
      ) : (
        /* Vista de Medicamentos */
        <MedicationHistory 
          patientId={patientId}
          onMedicationReuse={onMedicationReuse}
        />
      )}
    </div>
  );
}