/**
 * Remote Assessments API Client
 * Cliente para el sistema de evaluaciones remotas de escalas clínicas
 */

import { apiClient } from './api-config';

// Tipos para evaluaciones remotas
export interface RemoteAssessmentCreate {
  patientId: string;
  scaleId: string;
  administratorId: string;
  expirationDays: number;
  customMessage?: string;
  patientEmail?: string;
  patientPhone?: string;
  deliveryMethod?: 'email' | 'sms' | 'whatsapp' | 'copy_link';
  reminderEnabled?: boolean;
  privacyNoticeId?: string;
}

export interface RemoteAssessmentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    token: string;
    assessmentUrl: string;
    patient: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };
    scale: {
      id: string;
      name: string;
      abbreviation: string;
      totalItems: number;
      estimatedDuration?: number;
    };
    administrator: {
      id: string;
      name: string;
      email: string;
    };
    settings: {
      expiresAt: string;
      expirationDays: number;
      deliveryMethod: string;
      reminderEnabled: boolean;
      customMessage?: string;
    };
    status: 'pending' | 'accessed' | 'in_progress' | 'completed' | 'expired';
    createdAt: string;
  };
}

export interface RemoteAssessmentDetails {
  success: boolean;
  data: {
    id: string;
    token: string;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    administrator: {
      name: string;
    };
    customMessage?: string;
    scale: {
      id: string;
      name: string;
      abbreviation: string;
      totalItems: number;
      estimatedDurationMinutes?: number;
      items: any[];
      responseOptions: any[];
      subscales: any[];
      interpretationRules: any[];
      documentation: any;
    };
    progress?: {
      currentItemIndex: number;
      percentageComplete: number;
      responses: any[];
    };
    expiresAt: string;
    createdAt: string;
  };
}

export interface RemoteAssessmentProgress {
  responses: Array<{
    itemId: string;
    value: string;
    responseText?: string;
  }>;
  currentItemIndex: number;
  percentageComplete: number;
}

export interface RemoteAssessmentCompletion {
  responses: Array<{
    itemId: string;
    value: string;
    responseText?: string;
  }>;
}

export interface AdministratorAssessments {
  success: boolean;
  data: {
    assessments: Array<{
      id: string;
      token: string;
      status: string;
      patient: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
      };
      scale: {
        id: string;
        name: string;
        abbreviation: string;
        totalItems: number;
        estimatedDurationMinutes?: number;
      };
      customMessage?: string;
      deliveryMethod: string;
      expirationDays: number;
      reminderEnabled: boolean;
      reminderCount: number;
      createdAt: string;
      expiresAt: string;
      accessedAt?: string;
      completedAt?: string;
      lastAccess?: {
        accessedAt: string;
        action: string;
        deviceType: string;
      };
      assessmentUrl: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      pending: number;
      accessed: number;
      in_progress: number;
      completed: number;
      expired: number;
    };
  };
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'followup' | 'initial' | 'pre_appointment' | 'post_appointment' | 'custom';
  messageTemplate: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export class RemoteAssessmentsClient {
  /**
   * Crear una nueva evaluación remota
   */
  static async createRemoteAssessment(data: RemoteAssessmentCreate): Promise<RemoteAssessmentResponse> {
    try {
      console.log('🚀 Creando evaluación remota:', data);
      
      const response = await apiClient.post('/clinimetrix/remote-assessments/create', data);
      
      console.log('✅ Evaluación remota creada:', response.data.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando evaluación remota:', error);
      
      // Manejo de errores específicos
      if (error.response?.status === 404) {
        throw new Error(error.response.data.error || 'Paciente o escala no encontrada');
      }
      
      if (error.response?.status === 400) {
        const details = error.response.data.details;
        if (details && details.length > 0) {
          throw new Error(`Datos inválidos: ${details.map((d: any) => d.msg).join(', ')}`);
        }
        throw new Error(error.response.data.error || 'Datos de entrada inválidos');
      }
      
      throw new Error(error.response?.data?.message || 'Error creando evaluación remota');
    }
  }

  /**
   * Obtener evaluaciones remotas de un administrador
   */
  static async getAdministratorAssessments(
    administratorId: string,
    options: {
      status?: 'pending' | 'accessed' | 'in_progress' | 'completed' | 'expired';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AdministratorAssessments> {
    try {
      console.log('📋 Obteniendo evaluaciones del administrador:', administratorId);
      
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      
      const url = `/clinimetrix/remote-assessments/administrator/${administratorId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      
      console.log(`✅ ${response.data.data.assessments.length} evaluaciones obtenidas`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo evaluaciones remotas');
    }
  }

  /**
   * Obtener plantillas de mensajes
   */
  static async getMessageTemplates(category?: string): Promise<{ success: boolean; data: MessageTemplate[] }> {
    try {
      console.log('📝 Obteniendo plantillas de mensajes');
      
      const url = category 
        ? `/clinimetrix/remote-assessments/message-templates?category=${category}`
        : '/clinimetrix/remote-assessments/message-templates';
      
      const response = await apiClient.get(url);
      
      console.log(`✅ ${response.data.data.length} plantillas obtenidas`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo plantillas:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo plantillas de mensajes');
    }
  }
}

/**
 * Cliente público para evaluaciones remotas (sin autenticación)
 * Se usa desde la página pública del paciente
 */
export class PublicRemoteAssessmentsClient {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app';

  /**
   * Obtener detalles de evaluación remota por token
   */
  static async getAssessmentByToken(token: string): Promise<RemoteAssessmentDetails> {
    try {
      console.log('🔍 Validando token de evaluación remota:', token.substring(0, 8) + '...');
      
      const response = await fetch(`${this.baseURL}/api/v1/clinimetrix/remote-assessments/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 404) {
          throw new Error('Esta evaluación no existe o el enlace es inválido');
        }
        
        if (response.status === 410) {
          throw new Error('Esta evaluación ha expirado');
        }
        
        if (response.status === 409) {
          throw new Error('Esta evaluación ya fue completada');
        }
        
        throw new Error(errorData.error || 'Error validando evaluación');
      }

      const data = await response.json();
      console.log('✅ Token validado exitosamente');
      return data;
    } catch (error: any) {
      console.error('❌ Error validando token:', error);
      throw error;
    }
  }

  /**
   * Guardar progreso de evaluación remota
   */
  static async saveProgress(token: string, progress: RemoteAssessmentProgress): Promise<{ success: boolean }> {
    try {
      console.log('💾 Guardando progreso:', progress.percentageComplete + '%');
      
      const response = await fetch(`${this.baseURL}/api/v1/clinimetrix/remote-assessments/${token}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error guardando progreso');
      }

      const data = await response.json();
      console.log('✅ Progreso guardado exitosamente');
      return data;
    } catch (error: any) {
      console.error('❌ Error guardando progreso:', error);
      throw error;
    }
  }

  /**
   * Completar evaluación remota
   */
  static async completeAssessment(token: string, completion: RemoteAssessmentCompletion): Promise<any> {
    try {
      console.log('🎯 Completando evaluación remota con', completion.responses.length, 'respuestas');
      
      const response = await fetch(`${this.baseURL}/api/v1/clinimetrix/remote-assessments/${token}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completion),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error completando evaluación');
      }

      const data = await response.json();
      console.log('🎉 Evaluación completada exitosamente');
      return data;
    } catch (error: any) {
      console.error('❌ Error completando evaluación:', error);
      throw error;
    }
  }
}

export default RemoteAssessmentsClient;