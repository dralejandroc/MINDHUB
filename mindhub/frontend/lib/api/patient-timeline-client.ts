/**
 * Patient Timeline API Client
 * Handles all operations related to patient timeline and medical history
 */

const API_BASE_URL = '/api';

export interface TimelineEvent {
  id: string;
  type: 'consultation' | 'prescription' | 'assessment' | 'note' | 'resource' | 'appointment' | 'alert';
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
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    targetId?: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface TimelineResponse {
  success: boolean;
  data: {
    patient: {
      id: string;
      name: string;
      medicalRecordNumber: string;
    };
    timeline: TimelineEvent[];
    summary: {
      totalEvents: number;
      eventTypes: {
        consultation: number;
        prescription: number;
        assessment: number;
        note: number;
        appointment: number;
      };
      dateRange: {
        earliest: string;
        latest: string;
      } | null;
    };
    filters: {
      startDate?: string;
      endDate?: string;
      eventTypes: string[];
      limit: number;
    };
  };
}

export interface TimelineFilters {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  limit?: number;
}

export interface ClinicalNote {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

class PatientTimelineApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/expedix`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Patient Timeline API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive timeline for a patient
   */
  async getPatientTimeline(patientId: string, filters?: TimelineFilters): Promise<TimelineResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) {
      queryParams.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      queryParams.append('endDate', filters.endDate);
    }
    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      queryParams.append('eventTypes', filters.eventTypes.join(','));
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/patient-timeline/${patientId}${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<TimelineResponse>(endpoint);
  }

  /**
   * Add a clinical note to patient timeline
   */
  async addClinicalNote(patientId: string, note: ClinicalNote): Promise<{ success: boolean; data: TimelineEvent }> {
    return this.makeRequest<{ success: boolean; data: TimelineEvent }>(`/patient-timeline/${patientId}/note`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  /**
   * Get active alerts and reminders for patient
   */
  async getPatientAlerts(patientId: string): Promise<{
    success: boolean;
    data: {
      patientId: string;
      alerts: TimelineEvent[];
      summary: {
        total: number;
        urgent: number;
        high: number;
      };
    };
  }> {
    return this.makeRequest<{
      success: boolean;
      data: {
        patientId: string;
        alerts: TimelineEvent[];
        summary: {
          total: number;
          urgent: number;
          high: number;
        };
      };
    }>(`/patient-timeline/${patientId}/alerts`);
  }

  /**
   * Handle timeline event actions
   */
  async executeTimelineAction(action: string, targetId?: string, data?: any): Promise<void> {
    switch (action) {
      case 'view_consultation':
        if (targetId) {
          window.location.href = `/hubs/expedix/consultation/${targetId}`;
        }
        break;
      
      case 'print_consultation':
        if (targetId) {
          window.open(`/hubs/expedix/consultation/${targetId}/print`, '_blank');
        }
        break;
      
      case 'view_prescription':
        if (targetId) {
          window.location.href = `/hubs/expedix/prescription/${targetId}`;
        }
        break;
      
      case 'renew_prescription':
        if (targetId) {
          window.location.href = `/hubs/expedix/prescription/${targetId}/renew`;
        }
        break;
      
      case 'view_assessment':
        if (targetId) {
          window.location.href = `/hubs/clinimetrix/assessment/${targetId}`;
        }
        break;
      
      case 'new_assessment':
        if (data?.patientId && data?.scaleId) {
          window.location.href = `/hubs/clinimetrix?patient=${data.patientId}&scale=${data.scaleId}`;
        } else if (data?.patientId) {
          window.location.href = `/hubs/expedix?patient=${data.patientId}&action=assessment`;
        }
        break;
      
      case 'schedule_appointment':
        if (data?.patientId) {
          window.location.href = `/hubs/agenda?patient=${data.patientId}&action=schedule`;
        }
        break;
      
      case 'view_resource':
        if (targetId) {
          window.open(`/hubs/resources/resource/${targetId}`, '_blank');
        }
        break;
      
      case 'resend_resource':
        if (targetId && data?.patientId) {
          // In a full implementation, make API call to resend resource
          console.log(`Resending resource ${targetId} to patient ${data.patientId}`);
        }
        break;
      
      default:
        console.warn(`Unknown timeline action: ${action}`);
    }
  }

  /**
   * Generate mock timeline data for development
   */
  generateMockTimeline(patientId: string): TimelineResponse {
    const mockEvents: TimelineEvent[] = [
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
          { label: 'Ver Detalle', action: 'view_consultation', targetId: '1' },
          { label: 'Imprimir', action: 'print_consultation', targetId: '1' }
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
          { label: 'Ver Resultados', action: 'view_assessment', targetId: '2' },
          { label: 'Nueva Evaluación', action: 'new_assessment' }
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
          { label: 'Ver Receta', action: 'view_prescription', targetId: '3' },
          { label: 'Renovar', action: 'renew_prescription', targetId: '3' }
        ]
      }
    ];

    return {
      success: true,
      data: {
        patient: {
          id: patientId,
          name: 'Paciente Ejemplo',
          medicalRecordNumber: 'EXP-001'
        },
        timeline: mockEvents,
        summary: {
          totalEvents: mockEvents.length,
          eventTypes: {
            consultation: mockEvents.filter(e => e.type === 'consultation').length,
            prescription: mockEvents.filter(e => e.type === 'prescription').length,
            assessment: mockEvents.filter(e => e.type === 'assessment').length,
            note: mockEvents.filter(e => e.type === 'note').length,
            appointment: mockEvents.filter(e => e.type === 'appointment').length
          },
          dateRange: {
            earliest: '2024-01-15',
            latest: '2024-01-15'
          }
        },
        filters: {
          eventTypes: ['consultation', 'prescription', 'assessment', 'note', 'appointment'],
          limit: 50
        }
      }
    };
  }
}

// Export singleton instance
export const patientTimelineApi = new PatientTimelineApiClient();