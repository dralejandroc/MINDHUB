/**
 * =====================================================================
 * FORMX UNIFIED CLIENT - ENDPOINTS ÚNICOS Y CONSISTENTES
 * REEMPLAZA A formx-django-client.ts - ÚNICO CLIENTE PARA FORMX
 * =====================================================================
 */

import { toast } from 'react-hot-toast';

// =====================================================================
// CONFIGURACIÓN BASE
// =====================================================================

const getFormXBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app';
  return `${apiUrl}/api/formx`;
};

// =====================================================================
// TIPOS ÚNICOS PARA FORMX
// =====================================================================

export interface FormXField {
  id?: string;
  field_name: string;
  field_type: string;
  label: string;
  help_text?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  choices?: string[];
  expedix_field?: string;
}

export interface FormXTemplate {
  id: string;
  name: string;
  description: string;
  form_type: string;
  integration_type: string;
  auto_sync_expedix: boolean;
  mobile_optimized: boolean;
  formType: string;
  category: string;
  structure: any;
  settings: any;
  expedixMapping?: Record<string, string>;
  autoSyncExpedix: boolean;
  requiresAuth: boolean;
  isActive: boolean;
  version: string;
  fields?: FormXField[];
  total_fields?: number;
  total_submissions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormXStats {
  totalTemplates: number;
  total_templates?: number; // Alias for compatibility
  activeTemplates: number;
  totalSubmissions: number;
  total_submissions?: number; // Alias for compatibility
  pendingAssignments: number;
  completedToday: number;
  averageCompletionTime: number;
  processed_submissions?: number;
  synced_submissions?: number;
  recent_submissions?: number;
  processing_rate?: number;
  sync_rate?: number;
}

export interface FormXCatalogResponse {
  templates: FormXTemplate[];
  total: number;
  page?: number;
  pageSize?: number;
  categories?: Array<{ key: string; name: string; }>;
}

export interface FormXAssignment {
  id: string;
  templateId: string;
  patientId: string;
  assignedBy: string;
  accessToken: string;
  patientEmail: string;
  expiresAt: string;
  formData?: any;
  status: 'pending' | 'completed' | 'expired';
  submittedAt?: string;
  syncedToExpedix: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormXPatientForm {
  template: FormXTemplate;
  assignment: FormXAssignment;
  isExpired: boolean;
}

// =====================================================================
// UTILIDADES DE AUTENTICACIÓN
// =====================================================================

const getAuthHeaders = () => {
  // TODO: Integrar con Auth cuando esté disponible
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${supabaseToken}` // Se agregará cuando Auth esté integrado
  };
};

// =====================================================================
// MANEJO DE ERRORES UNIFICADO
// =====================================================================

const handleApiError = (error: any, operation: string) => {
  console.error(`FormX API Error in ${operation}:`, error);
  
  if (error.response?.status === 401) {
    toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
    return;
  }
  
  if (error.response?.status === 403) {
    toast.error('No tienes permisos para realizar esta acción.');
    return;
  }
  
  const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
  toast.error(`Error en ${operation}: ${errorMessage}`);
  throw error;
};

// =====================================================================
// CLIENTE FORMX UNIFICADO
// =====================================================================

export class FormXUnifiedClient {
  
  // ===================================================================
  // HEALTH CHECK
  // ===================================================================
  
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/../health`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      handleApiError(error, 'health check');
      throw error;
    }
  }
  
  // ===================================================================
  // GESTIÓN DE TEMPLATES
  // ===================================================================
  
  static async getTemplates(): Promise<{ templates: FormXTemplate[]; total: number }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener templates');
      throw error;
    }
  }
  
  static async getTemplate(templateId: string): Promise<FormXTemplate> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener template');
      throw error;
    }
  }
  
  static async createTemplate(templateData: Partial<FormXTemplate>): Promise<{ templateId: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Template creado exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'crear template');
      throw error;
    }
  }
  
  static async updateTemplate(templateId: string, templateData: Partial<FormXTemplate>): Promise<FormXTemplate> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Template actualizado exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'actualizar template');
      throw error;
    }
  }
  
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      toast.success('Template eliminado exitosamente');
    } catch (error) {
      handleApiError(error, 'eliminar template');
      throw error;
    }
  }
  
  // ===================================================================
  // ASIGNACIÓN DE FORMULARIOS A PACIENTES
  // ===================================================================
  
  static async assignFormToPatient(data: {
    templateId: string;
    patientId: string;
    patientEmail: string;
  }): Promise<{
    assignmentId: string;
    accessToken: string;
    link: string;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Formulario asignado exitosamente al paciente');
      return result;
    } catch (error) {
      handleApiError(error, 'asignar formulario a paciente');
      throw error;
    }
  }
  
  static async getAssignment(assignmentId: string): Promise<FormXAssignment> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/assignments/${assignmentId}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener asignación');
      throw error;
    }
  }
  
  static async getPatientAssignments(patientId: string): Promise<{ assignments: FormXAssignment[] }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/patients/${patientId}/assignments`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener asignaciones del paciente');
      throw error;
    }
  }
  
  // ===================================================================
  // FORMULARIOS PÚBLICOS (SIN AUTENTICACIÓN)
  // ===================================================================
  
  static async getPublicForm(token: string): Promise<FormXPatientForm> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/form/${token}`, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener formulario público');
      throw error;
    }
  }
  
  static async submitPublicForm(token: string, formData: any): Promise<{ message: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/form/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formData }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Formulario enviado exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'enviar formulario');
      throw error;
    }
  }
  
  // ===================================================================
  // INTEGRACIÓN CON EXPEDIX
  // ===================================================================
  
  static async syncAssignmentToExpedix(assignmentId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/assignments/${assignmentId}/sync-expedix`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Datos sincronizados con Expedix exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'sincronizar con Expedix');
      throw error;
    }
  }
  
  // ===================================================================
  // UTILIDADES
  // ===================================================================
  
  static async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
  
  // Conversión de datos legacy (si es necesario)
  static convertLegacyFormData(legacyData: any): Partial<FormXTemplate> {
    return {
      name: legacyData.title || legacyData.name,
      description: legacyData.description || '',
      formType: legacyData.category || 'clinical',
      category: legacyData.category || 'general',
      structure: legacyData.sections || legacyData.structure || {},
      settings: legacyData.settings || {},
      expedixMapping: legacyData.expedixMapping || {},
      autoSyncExpedix: legacyData.autoSyncExpedix || false,
      requiresAuth: legacyData.requiresAuth || false,
      isActive: legacyData.isActive !== false,
      version: legacyData.version || '1.0'
    };
  }
}

export default FormXUnifiedClient;

// =====================================================================
// BACKWARD COMPATIBILITY
// =====================================================================

// Alias para mantener compatibilidad con código existente
export const FormXDjangoClient = FormXUnifiedClient;