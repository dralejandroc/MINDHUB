'use client';

import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  BeakerIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PhoneIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { expedixApi } from '@/lib/api/expedix-client';
import { patientTimelineApi, type TimelineEvent as ApiTimelineEvent } from '@/lib/api/patient-timeline-client';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TimelineEvent {
  id: string;
  type: 'consultation' | 'prescription' | 'assessment' | 'note' | 'resource' | 'appointment' | 'vital_signs' | 'alert';
  title: string;
  description?: string;
  date: string;
  time?: string;
  status?: 'completed' | 'pending' | 'cancelled' | 'active' | 'inactive';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  professional?: {
    name: string;
    role: string;
  };
  data?: any; // Specific data for each event type
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

interface PatientTimelineProps {
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    medicalRecordNumber: string;
  };
  onNewConsultation?: () => void;
  onClinicalAssessment?: () => void;
  onSelectPatient?: (patient: any) => void;
}

export default function PatientTimeline({ patient, onNewConsultation, onClinicalAssessment, onSelectPatient }: PatientTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'consultation' | 'prescription' | 'assessment' | 'note'>('all');
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Mock timeline data - replace with real API calls
  const mockTimelineEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'consultation',
      title: 'Consulta Inicial - Primera Visita',
      description: 'Evaluación general del estado mental. Paciente presenta síntomas de ansiedad moderada.',
      date: '2024-01-15',
      time: '10:30',
      status: 'completed',
      priority: 'medium',
      professional: {
        name: 'Dr. María González',
        role: 'Psicóloga Clínica'
      },
      data: {
        diagnosis: 'Trastorno de ansiedad generalizada F41.1',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: '85',
          temperature: '36.5°C'
        },
        notes: 'Paciente refiere nerviosismo constante y dificultad para concentrarse en el trabajo.'
      },
      actions: [
        { label: 'Ver Detalle', onClick: () => console.log('Ver consulta'), variant: 'primary' },
        { label: 'Imprimir', onClick: () => console.log('Imprimir'), variant: 'secondary' }
      ]
    },
    {
      id: '2',
      type: 'assessment',
      title: 'Evaluación GAD-7 - Escala de Ansiedad',
      description: 'Puntuación: 12/21 - Ansiedad moderada',
      date: '2024-01-15',
      time: '11:00',
      status: 'completed',
      priority: 'medium',
      professional: {
        name: 'Dr. María González',
        role: 'Psicóloga Clínica'
      },
      data: {
        scale: 'GAD-7',
        score: 12,
        maxScore: 21,
        interpretation: 'Ansiedad moderada',
        recommendations: [
          'Terapia cognitivo-conductual',
          'Técnicas de relajación',
          'Seguimiento en 2 semanas'
        ]
      },
      actions: [
        { label: 'Ver Resultados', onClick: () => console.log('Ver resultados'), variant: 'primary' },
        { label: 'Repetir Evaluación', onClick: onClinicalAssessment || (() => {}), variant: 'secondary' }
      ]
    },
    {
      id: '3',
      type: 'prescription',
      title: 'Prescripción - Tratamiento para Ansiedad',
      description: 'Sertralina 50mg, 1 tableta diaria',
      date: '2024-01-15',
      time: '11:15',
      status: 'active',
      priority: 'high',
      professional: {
        name: 'Dr. María González',
        role: 'Psicóloga Clínica'
      },
      data: {
        medications: [
          {
            name: 'Sertralina',
            dose: '50mg',
            frequency: '1 vez al día',
            duration: '30 días',
            instructions: 'Tomar por las mañanas con el desayuno'
          }
        ],
        notes: 'Evaluar tolerancia y eficacia en próxima cita'
      },
      actions: [
        { label: 'Ver Receta', onClick: () => console.log('Ver receta'), variant: 'primary' },
        { label: 'Renovar', onClick: () => console.log('Renovar'), variant: 'secondary' }
      ]
    },
    {
      id: '4',
      type: 'note',
      title: 'Nota Clínica - Seguimiento Telefónico',
      description: 'Paciente reporta mejoría en síntomas de ansiedad',
      date: '2024-01-29',
      time: '14:00',
      status: 'completed',
      priority: 'low',
      professional: {
        name: 'Enf. Ana López',
        role: 'Enfermera'
      },
      data: {
        content: 'Paciente contactado vía telefónica. Reporta que se siente mejor desde que inició medicación. No presenta efectos secundarios significativos. Se le recuerda cita de seguimiento.',
        contactType: 'Telefónico'
      }
    },
    {
      id: '5',
      type: 'resource',
      title: 'Recurso Enviado - Técnicas de Respiración',
      description: 'Material psicoeducativo sobre manejo de la ansiedad',
      date: '2024-01-30',
      time: '09:00',
      status: 'completed',
      professional: {
        name: 'Dr. María González',
        role: 'Psicóloga Clínica'
      },
      data: {
        resourceType: 'PDF',
        title: 'Guía de Técnicas de Respiración para la Ansiedad',
        sentVia: 'Email'
      },
      actions: [
        { label: 'Ver Recurso', onClick: () => console.log('Ver recurso'), variant: 'primary' },
        { label: 'Reenviar', onClick: () => console.log('Reenviar'), variant: 'secondary' }
      ]
    },
    {
      id: '6',
      type: 'appointment',
      title: 'Próxima Cita Programada',
      description: 'Seguimiento de tratamiento',
      date: '2024-02-12',
      time: '10:00',
      status: 'pending',
      priority: 'medium',
      professional: {
        name: 'Dr. María González',
        role: 'Psicóloga Clínica'
      },
      data: {
        type: 'Seguimiento',
        duration: '45 minutos',
        location: 'Consultorio 3'
      },
      actions: [
        { label: 'Confirmar', onClick: () => console.log('Confirmar'), variant: 'primary' },
        { label: 'Reagendar', onClick: () => console.log('Reagendar'), variant: 'secondary' }
      ]
    },
    {
      id: '7',
      type: 'alert',
      title: 'Alerta - Medicamento por Vencer',
      description: 'La prescripción de Sertralina vence en 5 días',
      date: '2024-02-10',
      time: '08:00',
      status: 'pending',
      priority: 'urgent',
      data: {
        alertType: 'medication_expiry',
        medication: 'Sertralina 50mg',
        daysUntilExpiry: 5
      },
      actions: [
        { label: 'Renovar Receta', onClick: () => console.log('Renovar'), variant: 'primary' },
        { label: 'Programar Cita', onClick: () => console.log('Programar'), variant: 'secondary' }
      ]
    }
  ];

  useEffect(() => {
    loadTimelineData();
  }, [patient?.id]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from real API first, fallback to mock data
      try {
        if (patient?.id) {
          const response = await patientTimelineApi.getPatientTimeline(patient.id, {
            limit: 50,
            eventTypes: ['consultation', 'prescription', 'assessment', 'note', 'appointment']
          });
          
          if (response.success) {
            setTimelineEvents(response.data.timeline);
          } else {
            throw new Error('API returned unsuccessful response');
          }
        } else {
          // No specific patient selected, show general timeline or patient selector
          setTimelineEvents([]);
        }
      } catch (apiError) {
        console.warn('API unavailable, using mock data:', apiError);
        // Use mock data as fallback only if we have a patient
        setTimelineEvents(patient?.id ? mockTimelineEvents : []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading timeline:', error);
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return CalendarIcon;
      case 'prescription':
        return BeakerIcon;
      case 'assessment':
        return DocumentChartBarIcon;
      case 'note':
        return ChatBubbleLeftEllipsisIcon;
      case 'resource':
        return BookOpenIcon;
      case 'appointment':
        return ClockIcon;
      case 'alert':
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getEventColor = (type: string, status?: string) => {
    if (type === 'alert') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    switch (type) {
      case 'consultation':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'prescription':
        return status === 'active' ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200';
      case 'assessment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'note':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'resource':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'appointment':
        return status === 'pending' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case 'high':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredEvents = timelineEvents.filter(event => 
    filter === 'all' || event.type === filter
  );

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      // Try to save via API first
      try {
        const response = await patientTimelineApi.addClinicalNote(patient.id, {
          title: 'Nueva Nota Clínica',
          content: newNote,
          priority: 'medium',
          category: 'general'
        });
        
        if (response.success) {
          // Add the new event to the top of the timeline
          setTimelineEvents([response.data, ...timelineEvents]);
          setNewNote('');
          setShowNewNoteModal(false);
          return;
        }
      } catch (apiError) {
        console.warn('API unavailable for note creation, creating locally:', apiError);
      }

      // Fallback: create note locally
      const noteEvent: TimelineEvent = {
        id: Date.now().toString(),
        type: 'note',
        title: 'Nueva Nota Clínica',
        description: newNote,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        priority: 'medium',
        professional: {
          name: 'Usuario Actual',
          role: 'Profesional'
        },
        data: {
          content: newNote,
          contactType: 'Presencial'
        }
      };

      setTimelineEvents([noteEvent, ...timelineEvents]);
      setNewNote('');
      setShowNewNoteModal(false);
    } catch (error) {
      console.error('Error adding note:', error);
      // TODO: Show user-friendly error message
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando timeline...</span>
      </div>
    );
  }

  // If no patient is selected, show patient selector for timeline view
  if (!patient) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Vista Timeline
        </h3>
        <p className="text-gray-500 mb-6">
          Selecciona un paciente para ver su timeline médico, o usa las vistas de Lista o Tarjetas para explorar todos los pacientes.
        </p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => onSelectPatient && onSelectPatient(null)} variant="outline">
            Ver Lista de Pacientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Timeline Médico
            </h2>
            <p className="text-gray-600 text-sm">
              Historial cronológico de eventos médicos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowNewNoteModal(true)}
              variant="outline"
              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
            >
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
              Nueva Nota
            </Button>
            <Button
              onClick={onNewConsultation || (() => {})}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nueva Consulta
            </Button>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="mt-3 flex items-center space-x-1">
          <span className="text-xs font-medium text-gray-600">Filtrar:</span>
          {[
            { key: 'all', label: 'Todo', count: timelineEvents.length, icon: '📋' },
            { key: 'consultation', label: 'Consultas', count: timelineEvents.filter(e => e.type === 'consultation').length, icon: '🩺' },
            { key: 'prescription', label: 'Recetas', count: timelineEvents.filter(e => e.type === 'prescription').length, icon: '💊' },
            { key: 'assessment', label: 'Evaluaciones', count: timelineEvents.filter(e => e.type === 'assessment').length, icon: '📊' },
            { key: 'note', label: 'Notas', count: timelineEvents.filter(e => e.type === 'note').length, icon: '📝' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50'
              }`}
            >
              {filterOption.icon} {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin eventos en el timeline
            </h3>
            <p className="text-gray-600 mb-6">
              Usa los controles del header para agregar nueva información médica
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => setShowNewNoteModal(true)}
                variant="outline"
              >
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
                Agregar Nota Rápida
              </Button>
            </div>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const colorClasses = getEventColor(event.type, event.status);
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline Line */}
                {index < filteredEvents.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Event Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClasses}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {event.title}
                            </h3>
                            {getPriorityIndicator(event.priority)}
                            {getStatusIcon(event.status)}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {new Date(event.date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {event.time && (
                              <span className="flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {event.time}
                              </span>
                            )}
                            {event.professional && (
                              <span className="flex items-center">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {event.professional.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {event.actions && event.actions.length > 0 && (
                          <div className="flex items-center space-x-2 ml-4">
                            {event.actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                onClick={() => {
                                  if (action.onClick) {
                                    action.onClick();
                                  } else if ('action' in action) {
                                    patientTimelineApi.executeTimelineAction(
                                      action.action, 
                                      action.targetId, 
                                      { patientId: patient.id, scaleId: event.data?.scaleId }
                                    );
                                  }
                                }}
                                variant={action.variant === 'primary' ? 'outline' : 'ghost'}
                                className="text-xs px-2 py-1"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Event Specific Details */}
                      {event.data && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          {event.type === 'consultation' && event.data.diagnosis && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Diagnóstico:</span>
                              <span className="text-gray-600 ml-1">{event.data.diagnosis}</span>
                            </div>
                          )}
                          
                          {event.type === 'assessment' && event.data.score && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Puntuación:</span>
                              <span className="text-gray-600 ml-1">
                                {event.data.score}/{event.data.maxScore} - {event.data.interpretation}
                              </span>
                            </div>
                          )}

                          {event.type === 'prescription' && event.data.medications && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Medicamento:</span>
                              <span className="text-gray-600 ml-1">
                                {event.data.medications[0].name} {event.data.medications[0].dose}
                              </span>
                            </div>
                          )}

                          {event.type === 'alert' && event.data.daysUntilExpiry && (
                            <div className="text-xs text-red-600">
                              <span className="font-medium">Vence en {event.data.daysUntilExpiry} días</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nueva Nota Clínica</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe tu nota clínica aquí..."
              className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => setShowNewNoteModal(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddNote}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newNote.trim()}
              >
                Agregar Nota
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}