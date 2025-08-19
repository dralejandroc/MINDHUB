/**
 * FormX Django API Client
 * Integración con backend Django FormX implementado en Fase 1
 * Endpoints: /formx/api/* desde backend Django
 */

import { toast } from 'react-hot-toast';

// Base URL for Django FormX APIs  
const getFormXBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-django-backend.vercel.app';
  return `${apiUrl}/formx`;
};

// Types matching Django FormX models
export interface FormXTemplate {
  id: string;
  name: string;
  form_type: 'clinical' | 'document' | 'survey' | 'intake' | 'consent' | 'follow_up';
  description: string;
  integration_type: 'expedix' | 'clinimetrix' | 'standalone';
  is_active: boolean;
  is_default: boolean;
  requires_auth: boolean;
  mobile_optimized: boolean;
  auto_sync_expedix: boolean;
  expedix_mapping: Record<string, string>;
  email_template: string;
  success_message: string;
  redirect_url: string;
  created_at: string;
  updated_at: string;
  total_fields: number;
  total_submissions: number;
  fields?: FormXField[];
}

export interface FormXField {
  id?: string;
  template: string;
  field_name: string;
  field_type: string;
  label: string;
  help_text: string;
  placeholder: string;
  required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  order: number;
  css_classes: string;
  choices: Array<{value: string, label: string}>;
  show_conditions: Record<string, any>;
  validation_rules: Record<string, any>;
  expedix_field: string;
}

export interface FormXSubmission {
  id: string;
  template: string;
  patient_id: string;
  patient_email: string;
  access_token: string;
  form_data: Record<string, any>;
  submitted_at: string;
  status: 'draft' | 'submitted' | 'processed' | 'synced' | 'error';
  is_processed: boolean;
  synced_to_expedix: boolean;
  expedix_sync_date?: string;
  ip_address?: string;
  user_agent: string;
  device_type: string;
  processing_notes: string;
  error_message: string;
}

export interface FormXDocumentTemplate {
  id: string;
  name: string;
  document_type: 'consent' | 'privacy' | 'therapeutic' | 'policy' | 'appointment' | 'follow_up' | 'birthday' | 'survey';
  description: string;
  template_content: string;
  auto_fill_fields: string[];
  requires_signature: boolean;
  is_active: boolean;
  is_default: boolean;
  email_subject: string;
  email_body: string;
  created_at: string;
  updated_at: string;
}

export interface FormXStats {
  total_templates: number;
  active_templates: number;
  total_submissions: number;
  processed_submissions: number;
  synced_submissions: number;
  total_documents: number;
  recent_submissions: number;
  processing_rate: number;
  sync_rate: number;
}

export interface FormXCatalogResponse {
  templates: FormXTemplate[];
  total: number;
  categories: Array<{
    key: string;
    name: string;
  }>;
}

// Auth helper
const getAuthHeaders = () => {
  // TODO: Integrate with Supabase auth from existing MindHub system
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${token}` // Will be added when auth is integrated
  };
};

// Error handler
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

export class FormXDjangoClient {
  
  // ============================================================================
  // HEALTH CHECK
  // ============================================================================
  
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/health/`);
      return await response.json();
    } catch (error) {
      handleApiError(error, 'health check');
      throw error;
    }
  }
  
  // ============================================================================
  // FORM TEMPLATES CRUD
  // ============================================================================
  
  static async getTemplatesCatalog(): Promise<FormXCatalogResponse> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/catalog/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener catálogo de templates');
      throw error;
    }
  }
  
  static async getTemplate(templateId: string): Promise<FormXTemplate> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}/`, {
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
  
  static async createTemplate(templateData: Partial<FormXTemplate>): Promise<FormXTemplate> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/`, {
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
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}/`, {
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
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}/`, {
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
  
  // ============================================================================
  // FORM BUILDING & MANAGEMENT
  // ============================================================================
  
  static async createFormFromBuilder(formData: {
    name: string;
    form_type: string;
    description?: string;
    integration_type?: string;
    auto_sync_expedix?: boolean;
    expedix_mapping?: Record<string, string>;
    fields: Array<Partial<FormXField>>;
  }): Promise<{ template_id: string; message: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/form-builder/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Formulario creado exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'crear formulario');
      throw error;
    }
  }
  
  static async previewTemplate(templateId: string): Promise<{
    template_name: string;
    fields: any[];
    total_fields: number;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}/preview/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'previsualizar template');
      throw error;
    }
  }
  
  // ============================================================================
  // PATIENT FORM ASSIGNMENT
  // ============================================================================
  
  static async sendFormToPatient(data: {
    template_id: string;
    patient_id: string;
    patient_email: string;
  }): Promise<{
    message: string;
    form_link: string;
    submission_id: string;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/send-form/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Formulario enviado exitosamente al paciente');
      return result;
    } catch (error) {
      handleApiError(error, 'enviar formulario a paciente');
      throw error;
    }
  }
  
  static async sendFormFromTemplate(templateId: string, data: {
    patient_id: string;
    patient_email: string;
  }): Promise<{
    message: string;
    form_link: string;
    submission_id: string;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/templates/${templateId}/send_to_patient/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Formulario enviado exitosamente al paciente');
      return result;
    } catch (error) {
      handleApiError(error, 'enviar formulario a paciente');
      throw error;
    }
  }
  
  // ============================================================================
  // FORM SUBMISSIONS
  // ============================================================================
  
  static async getSubmissions(templateId?: string): Promise<FormXSubmission[]> {
    try {
      const url = templateId 
        ? `${getFormXBaseUrl()}/submissions/?template=${templateId}`
        : `${getFormXBaseUrl()}/submissions/`;
        
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.results || result;
    } catch (error) {
      handleApiError(error, 'obtener respuestas');
      throw error;
    }
  }
  
  static async syncSubmissionToExpedix(submissionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/submissions/${submissionId}/sync_to_expedix/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Respuesta sincronizada con Expedix');
      return result;
    } catch (error) {
      handleApiError(error, 'sincronizar con Expedix');
      throw error;
    }
  }
  
  // ============================================================================
  // EXPEDIX INTEGRATION
  // ============================================================================
  
  static async getExpedixMapping(fields: Array<{field_name: string}>): Promise<{
    auto_mapping: Record<string, string>;
    suggestions: Array<{
      field_name: string;
      suggested_mapping: string;
      confidence: number;
    }>;
    total_mapped: number;
    total_suggestions: number;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/expedix-mapping/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fields }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener mapeo de Expedix');
      throw error;
    }
  }
  
  // ============================================================================
  // DOCUMENT TEMPLATES
  // ============================================================================
  
  static async getDocumentTemplates(): Promise<FormXDocumentTemplate[]> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/documents/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.results || result;
    } catch (error) {
      handleApiError(error, 'obtener templates de documentos');
      throw error;
    }
  }
  
  static async generateDocument(data: {
    template_id: string;
    patient_id: string;
  }): Promise<{
    document_content: string;
    generated_at: string;
  }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/generate-document/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'generar documento');
      throw error;
    }
  }
  
  static async sendDocument(data: {
    template_id: string;
    patient_id: string;
    patient_email: string;
  }): Promise<{ message: string }> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/send-document/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast.success('Documento enviado exitosamente');
      return result;
    } catch (error) {
      handleApiError(error, 'enviar documento');
      throw error;
    }
  }
  
  // ============================================================================
  // DASHBOARD & STATS
  // ============================================================================
  
  static async getDashboardStats(): Promise<FormXStats> {
    try {
      const response = await fetch(`${getFormXBaseUrl()}/dashboard/stats/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      handleApiError(error, 'obtener estadísticas');
      throw error;
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  static async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
  
  // Convert legacy form structure to Django FormX format
  static convertLegacyFormToDjango(legacyForm: any): Partial<FormXTemplate> & { fields: Array<Partial<FormXField>> } {
    return {
      name: legacyForm.title || legacyForm.name,
      form_type: legacyForm.category || 'clinical',
      description: legacyForm.description || '',
      integration_type: 'expedix',
      auto_sync_expedix: true,
      mobile_optimized: true,
      requires_auth: false,
      fields: (legacyForm.sections || []).flatMap((section: any, sectionIndex: number) => 
        (section.fields || []).map((field: any, fieldIndex: number) => ({
          field_name: field.id || `field_${sectionIndex}_${fieldIndex}`,
          field_type: this.mapLegacyFieldType(field.type),
          label: field.label || '',
          help_text: field.description || '',
          placeholder: field.placeholder || '',
          required: field.required || false,
          order: (sectionIndex * 100) + fieldIndex,
          choices: field.options ? field.options.map((opt: string, i: number) => ({
            value: `option_${i}`,
            label: opt
          })) : [],
          validation_rules: field.validation || {},
          expedix_field: field.expedixField || ''
        }))
      )
    };
  }
  
  private static mapLegacyFieldType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'textarea': 'textarea',
      'email': 'email',
      'phone': 'phone',
      'number': 'number',
      'date': 'date',
      'select': 'select',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'boolean': 'boolean',
      'file': 'file',
      // Medical specific mappings
      'name': 'name',
      'address': 'address',
      'insurance': 'insurance',
      'emergency_contact': 'emergency_contact',
      'signature': 'signature',
      'rating': 'rating',
      'scale': 'scale'
    };
    
    return typeMap[legacyType] || 'text';
  }
}

export default FormXDjangoClient;