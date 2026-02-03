'use client';

import { useState, useEffect } from 'react';
import { Timeline, type TimelineEntry } from './Timeline';
import { expedixApi } from '@/lib/api/expedix-client';
import { patientTimelineApi } from '@/lib/api/patient-timeline-client';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import {
  FunnelIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axiosClient from '@/lib/axiosClient';
import { get } from 'http';

interface PatientTimelineProps {
  patientId: string;
  patientName?: string;
  showHeader?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
}

type EventType = 'all' | 'consultation' | 'prescription' | 'lab' | 'assessment' | 'note' | 'appointment' | 'vital' | 'diagnosis';

export default function PatientTimeline({ 
  patientId, 
  patientName = 'Paciente',
  showHeader = true,
  maxHeight,
  showFilters = true
}: PatientTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<EventType>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    loadTimelineData();
  }, [patientId]);

  const getConsultatiosAxios = async (patient: string) => {
    try {
      const result = await axiosClient.get(`/api/expedix/consultations?patient_id=${patient}`);
      console.log('getConsultationsAxios:', result);
      const { data } = result;
      return data.results;
    } catch (error) {
      console.error('Error fetching consultations via axios:', error);
      return [];
    }
  }

  const getPrescriptionsAxios = async (patient: string) => {
    try {
      const result = await axiosClient.get(`/api/expedix/prescriptions?patient_id=${patient}`);
      console.log('getPrescriptionsAxios:', result);
      return result.data;
    } catch (error) {
      console.error('Error fetching prescriptions via axios:', error);
      return { data: [] };
    }
  };

  const getPatientsAssessmentsAxios = async (patient: string) => {
    try {
      const result = await axiosClient.get(`/api/assessments/patient/${patient}`);
      console.log('getPatientsAssessmentsAxios:', result);
      return result.data.results;
    } catch (error) {
      console.error('Error fetching patient assessments via axios:', error);
      return [];
    }
  };

  const getAppointmentsAxios = async (patient: string) => {
    try {
      const result = await axiosClient.get(`/api/expedix/appointments?patient_id=${patient}`);
      console.log('getAppointmentsAxios:', result);
      return result.data;
    } catch (error) {
      console.error('Error fetching appointments via axios:', error);
      return { data: [] };
    }
  };

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all patient data in parallel
      const [consultations, prescriptions, assessments, appointments] = await Promise.allSettled([
        getConsultatiosAxios(patientId), // Fix: Use getConsultations instead of getPatientConsultationForms
        // expedixApi.getPatientPrescriptions(patientId),
        getPrescriptionsAxios(patientId),
        clinimetrixProClient.getPatientAssessments(patientId),
        // getPatientsAssessmentsAxios(patientId),
        expedixApi.getAppointments(patientId)
        // getAppointmentsAxios(patientId)
      ]);
      console.log('consultations:', consultations);
      
      const events: TimelineEntry[] = [];

      // Process consultations
      if (consultations.status === 'fulfilled' && consultations?.value && Array.isArray(consultations.value)) {
        
        consultations.value.forEach((consultation: any) => {
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
                        <span className="text-gray-500">TA:</span> {consultation.vital_signs?.blood_pressure?.systolic}/{consultation.vital_signs?.blood_pressure?.diastolic} mmHg
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
      if (prescriptions.status === 'fulfilled' && prescriptions.value?.data && Array.isArray(prescriptions.value.data)) {
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
      if (assessments.status === 'fulfilled' && assessments.value && Array.isArray(assessments.value)) {
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
      if (appointments.status === 'fulfilled' && appointments.value?.data && Array.isArray(appointments.value.data)) {
        appointments.value.data.forEach((appointment: any) => {
          events.push({
            id: `appointment-${appointment.id}`,
            title: 'Cita Médica',
            date: appointment.date,
            type: 'appointment',
            content: (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Hora:</span> {appointment.time}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Motivo:</span> {appointment.reason || 'Consulta de seguimiento'}
                </p>
                {appointment.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {appointment.notes}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    appointment.status === 'no_show' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {appointment.status === 'completed' ? 'Completada' :
                     appointment.status === 'cancelled' ? 'Cancelada' :
                     appointment.status === 'no_show' ? 'No asistió' :
                     'Programada'}
                  </span>
                </div>
              </div>
            ),
            metadata: {
              professional: appointment.professional_name,
              status: appointment.status
            }
          });
        });
      }

      // Sort events by date (most recent first)
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setTimelineEvents(events);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('Error al cargar el historial del paciente');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected type
  const filteredEvents = timelineEvents.filter(event => {
    if (selectedFilter === 'all') return true;
    return event.type === selectedFilter;
  });

  // Filter by date range if specified
  const finalEvents = dateRange.start || dateRange.end
    ? filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        if (dateRange.start && eventDate < dateRange.start) return false;
        if (dateRange.end && eventDate > dateRange.end) return false;
        return true;
      })
    : filteredEvents;

  const filterButtons = [
    { value: 'all' as const, label: 'Todos', icon: CalendarDaysIcon },
    { value: 'consultation' as const, label: 'Consultas', icon: DocumentTextIcon },
    { value: 'prescription' as const, label: 'Recetas', icon: DocumentTextIcon },
    { value: 'assessment' as const, label: 'Evaluaciones', icon: ClipboardDocumentCheckIcon },
    { value: 'lab' as const, label: 'Laboratorios', icon: BeakerIcon },
    { value: 'diagnosis' as const, label: 'Diagnósticos', icon: ChartBarIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando historial médico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button
          onClick={loadTimelineData}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showFilters && (
        <div className="mb-6 px-4">
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            {filterButtons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedFilter(value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectedFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {value !== 'all' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({timelineEvents.filter(e => e.type === value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={maxHeight ? `overflow-y-auto ${maxHeight}` : ''}>
        {finalEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay eventos en el historial</p>
          </div>
        ) : (
          <Timeline 
            data={finalEvents}
            title={showHeader ? `Historial de ${patientName}` : undefined}
            subtitle={showHeader ? `${finalEvents.length} eventos registrados` : undefined}
          />
        )}
      </div>
    </div>
  );
}