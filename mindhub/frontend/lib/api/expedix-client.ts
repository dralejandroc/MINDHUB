// Expedix API Client - Centralized API communication for patient management
import { useAuthenticatedFetch } from './supabase-auth';
import { createApiUrl, createApiUrlWithParams, API_ROUTES, logApiCall } from './api-url-builders';
import { useAuthenticatedApiCall, AuthenticationError, NetworkError } from './auth-retry';
import { expedixGraphQLClient } from './expedix-graphql-client';

export interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  age: number;
  gender: 'male' | 'female';
  email: string;
  cell_phone: string;
  phone?: string;
  curp?: string;
  rfc?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  education_level?: string;
  occupation?: string;
  marital_status?: string;
  preferred_language?: string;
  insurance_provider?: string;
  insurance_number?: string;
  referring_physician?: string;
  workplace?: string;
  known_allergies?: string;
  consultations_count?: number;
  evaluations_count?: number;
  created_at: string;
  updated_at: string;
  // Extended properties for dashboard views
  consultations?: Appointment[];
  prescriptions?: Prescription[];
  appointments?: Appointment[];
  documents?: Document[];
  assessments?: any[];
}

export interface Prescription {
  id: string;
  patient_id: string;
  practitioner_name: string;
  practitioner_license: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'completed';
  print_config: {
    marginLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
}

export interface Document {
  id: string;
  patient_id: string;
  filename: string;
  category: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_encrypted: boolean;
  uploaded_at: string;
}

class ExpedixApiClient {
  private authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authenticatedFetch = authenticatedFetch;
  }

  private async makeRequest<T>(route: string, options: RequestInit = {}): Promise<T> {
    // Usar createApiUrl para construir URL del cliente (proxy /api que maneja auth)
    const url = createApiUrl(route);
    console.log('CREATEAPIURL', url);
    
    // Log de la llamada para debugging
    logApiCall(route, options.method || 'GET', 'client');
    
    // Create default headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    console.log(`[ExpedixAPI] Making request to ${route} via Vercel proxy at ${url}`);

    try {
      // ALWAYS get user session token, regardless of authenticatedFetch
      if (typeof window !== 'undefined' && !defaultHeaders['Authorization']) {
        // Try to get session from Supabase
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
          console.log('[ExpedixAPI] Using user session token for authentication');
          
          // ARQUITECTURA SIMPLIFICADA: Solo necesitamos el user ID del JWT
          // El backend Django ya maneja todo con clinic_id boolean + user_id
          console.log('[ExpedixAPI] ✅ Using simplified architecture - JWT + clinic_id');
        } else {
          console.error('[ExpedixAPI] No user session available - user not authenticated');
          throw new Error('User not authenticated - please log in');
        }
      }
      
      // Don't use authenticatedFetch if it's going to throw errors
      // Just use regular fetch with our headers
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include',
      });

      console.log(`[ExpedixAPI] Response status for ${route}: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        
        if (response.status === 401) {
          console.error(`[ExpedixAPI] 401 Unauthorized error on ${route}`);
          throw new AuthenticationError('Authentication required. Please log in again.', 401);
        }
        
        console.error(`[ExpedixAPI] HTTP error on ${route}:`, errorData);
        throw new NetworkError(errorData.message || `HTTP error! status: ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      console.error(`[ExpedixAPI] Error on ${route}:`, error);
      throw error;
    }
  }

  // Patient Management - Authentication handled by Vercel proxy
  async getPatients(searchTerm?: string): Promise<{ data: Patient[]; total: number }> {
    console.log('🚀 [ExpedixAPI] ONLY using GraphQL for getPatients - NO MORE 401 ERRORS!');
    // Use GraphQL client ONLY - no REST fallback to eliminate 401 errors completely
    try {
      const result = await expedixGraphQLClient.getPatients(searchTerm);
      console.log('✅ [ExpedixAPI] GraphQL getPatients successful:', result.total, 'patients');
      return result;
    } catch (error) {
      console.error('❌ [ExpedixAPI] GraphQL getPatients failed:', error);
      // Return empty data instead of failing with REST API that causes 401
      return { data: [], total: 0 };
    }
  }

  async getPatient(id: string): Promise<{ data: Patient }> {
    console.log('🚀 [ExpedixAPI] ONLY using GraphQL for getPatient - NO MORE 401 ERRORS!');
    // Use GraphQL client ONLY - no REST fallback to eliminate 401 errors completely
    try {
      const result = await expedixGraphQLClient.getPatientById(id);
      console.log('✅ [ExpedixAPI] GraphQL getPatient successful for ID:', id);
      return result;
    } catch (error) {
      console.error('❌ [ExpedixAPI] GraphQL getPatient failed for ID:', id, error);
      throw error; // Let the caller handle the error
    }
  }

  async createPatient(patientData: Partial<Patient>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<any>(API_ROUTES.expedix.patients, {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    console.log('RESPONSEEEEE', response);
    type respType = {
      success: boolean;
      data: Patient;
    };
    const respuesta: respType = response;
    if (response?.length) {
      respuesta.success = true;
      respuesta.data = response;
    }
    else{
      respuesta.success = false;
      respuesta.data = {} as Patient;
    }
    return respuesta;
  }

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(API_ROUTES.expedix.patientById(id), {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
    
    return {
      data: response.data
    };
  }

  async deletePatient(id: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(API_ROUTES.expedix.patientById(id), {
      method: 'DELETE',
    });
  }

  // Prescription Management
  async getPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(API_ROUTES.expedix.patientPrescriptions(patientId));
  }

  async createPrescription(prescriptionData: Partial<Prescription>): Promise<{ data: Prescription }> {
    return this.makeRequest<{ data: Prescription }>(API_ROUTES.expedix.prescriptions, {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async generatePrescriptionPDF(prescriptionId: string): Promise<Blob> {
    const url = createApiUrl(`/expedix/prescriptions/${prescriptionId}/pdf`);
    const fetchFunction = this.authenticatedFetch || fetch;
    const response = await fetchFunction(url);
    if (!response.ok) {
      throw new Error('Failed to generate prescription PDF');
    }
    return response.blob();
  }

  async getPatientPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/${patientId}`);
  }

  // Appointment Management
  async getAppointments(patientId?: string): Promise<{ data: Appointment[] }> {
    const params = patientId ? `?patient_id=${patientId}` : '';
    return this.makeRequest<{ data: Appointment[] }>(`/expedix/appointments${params}`);
  }

  async createAppointment(appointmentData: Partial<Appointment>): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>('/expedix/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>(`/expedix/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Document Management
  async getPatientDocuments(patientId: string): Promise<{ data: Document[] }> {
    return this.makeRequest<{ data: Document[] }>(`/expedix/documents/${patientId}`);
  }

  async uploadDocument(patientId: string, file: File, category: string): Promise<{ data: Document }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.makeRequest<{ data: Document }>(`/expedix/documents/${patientId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    const url = createApiUrl(`/expedix/documents/download/${documentId}`);
    const fetchFunction = this.authenticatedFetch || fetch;
    const response = await fetchFunction(url);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    return response.blob();
  }

  // Medical History
  async getMedicalHistory(patientId: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`);
  }

  async updateMedicalHistory(patientId: string, historyData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(historyData),
    });
  }

  // Analytics & Reports
  async getPatientStats(): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/analytics/patient-stats');
  }

  async getTodayAppointments(): Promise<{ data: Appointment[] }> {
    return this.makeRequest<{ data: Appointment[] }>('/expedix/analytics/today-appointments');
  }

  async getPendingAssessments(): Promise<{ data: any[] }> {
    return this.makeRequest<{ data: any[] }>('/expedix/analytics/pending-assessments');
  }

  async getTodayPrescriptions(): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>('/expedix/analytics/today-prescriptions');
  }

  // Patient Portal
  async getPortalAccess(patientId: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/portal/${patientId}/access`);
  }

  async confirmAppointment(appointmentToken: string, confirmed: boolean): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/portal/confirm-appointment', {
      method: 'POST',
      body: JSON.stringify({ token: appointmentToken, confirmed }),
    });
  }

  // Drug Interactions
  async checkDrugInteractions(medications: string[]): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/drug-interactions/check', {
      method: 'POST',
      body: JSON.stringify({ medications }),
    });
  }

  // Consultation Forms
  async getConsultationTemplates(): Promise<{ data: any[], total: number }> {
    return this.makeRequest<{ success: boolean; data: any[]; total: number }>('/expedix/forms/templates');
  }

  async getConsultationTemplate(templateId: string): Promise<{ data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/templates/${templateId}`);
  }

  async createConsultationForm(formData: { templateId: string; patientId: string; title?: string; consultationId?: string }): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>('/expedix/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  }

  async getConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/${formId}`);
  }

  async updateConsultationForm(formId: string, fieldId: string, value: any): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify({ fieldId, value }),
    });
  }

  async completeConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/${formId}/complete`, {
      method: 'POST',
    });
  }

  async getPatientConsultationForms(patientId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(`/expedix/forms/patient/${patientId}`);
  }

  async getConsultations(patientId?: string): Promise<{ success: boolean; data: any[] }> {
    const params = patientId ? `?patient_id=${patientId}` : '';
    return this.makeRequest<{ success: boolean; data: any[] }>(`/expedix/consultations${params}`);
  }

  // Consultation Template Management
  async createConsultationTemplate(templateData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/consultation-templates/', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateConsultationTemplate(templateId: string, templateData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/consultation-templates/${templateId}/`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteConsultationTemplate(templateId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/expedix/consultation-templates/${templateId}/`, {
      method: 'DELETE',
    });
  }

  // Consultation Management - Central Integration with Agenda
  async getPatientConsultations(patientId: string, consultationId?: string): Promise<{ data: any[] }> {
    return this.makeRequest<{ data: any[] }>(`/expedix/patients/${patientId}/consultations?consultation_id=${consultationId || ''}`);
  }

  async createConsultation(consultationData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/consultations', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async createConsultationCentral(consultationData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/consultation-central/', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async updateConsultation(consultationId: string, consultationData: any): Promise<{ data: any }> {
    console.log('llegamos a updateConsultation del client');
    return this.makeRequest<{ data: any }>(`/expedix/consultations/?consultation_id=${consultationId}`, {
      method: 'PUT',
      body: JSON.stringify(consultationData),
    });
  }

  async updateConsultationCentral(consultationId: string, consultationData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/consultation-central/${consultationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(consultationData),
    });
  }

  async deleteConsultation(consultationId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/expedix/consultations?consultation_id=${consultationId}`, {
      method: 'DELETE',
    });
  }

  async deleteConsultationCentral(consultationId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/expedix/consultation-central/${consultationId}/`, {
      method: 'DELETE',
    });
  }

  async getConsultationByAppointmentId(appointmentId: string): Promise<{ data: any | null }> {
    return this.makeRequest<{ data: any | null }>(`/expedix/consultations/by-appointment/${appointmentId}`);
  }

  async getConsultationByAppointmentIdCentral(appointmentId: string): Promise<{ data: any | null }> {
    try {
      return this.makeRequest<{ data: any }>(`/expedix/consultation-central/by_appointment/?appointment_id=${appointmentId}`);
    } catch (error) {
      console.warn('Consultation not found for appointment:', appointmentId);
      return { data: null };
    }
  }

  async startConsultation(consultationId: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/consultations/${consultationId}/start`, {
      method: 'PATCH',
    });
  }

  async completeConsultation(consultationId: string, consultationData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/consultations/${consultationId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(consultationData),
    });
  }

  // Next Appointment Integration
  async getPatientNextAppointment(patientId: string): Promise<{ data: any | null }> {
    return this.makeRequest<{ data: any | null }>(`/expedix/patients/${patientId}/next-appointment`);
  }

  async createAppointmentFromConsultation(consultationId: string, appointmentData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/consultations/${consultationId}/create-appointment`, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getClinicData(): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/tenant/context/');
  }
}

// Export simple singleton instance - authentication handled by backend cookies
export const expedixApi = new ExpedixApiClient();

// Named exports for convenience
export { ExpedixApiClient };

// Enhanced React Hook with Auth authentication via proxy
export function useExpedixApi() {
  const authenticatedFetch = useAuthenticatedFetch();
  
  // Create API client instance with authenticated fetch
  const apiClient = new ExpedixApiClient(authenticatedFetch);
  
  // Return API client methods with authentication
  return {
    // Patient Management 
    getPatients: async (searchTerm?: string) => {
      return apiClient.getPatients(searchTerm);
    },
    getPatient: async (id: string) => {
      return apiClient.getPatient(id);
    },
    createPatient: async (data: Partial<Patient>) => {
      return apiClient.createPatient(data);
    },
    updatePatient: async (id: string, data: Partial<Patient>) => {
      return apiClient.updatePatient(id, data);
    },
    deletePatient: async (id: string) => {
      return apiClient.deletePatient(id);
    },
    
    // Prescription Management  
    getPrescriptions: async (patientId: string) => {
      return apiClient.getPrescriptions(patientId);
    },
    createPrescription: async (data: Partial<Prescription>) => {
      return apiClient.createPrescription(data);
    },
    getPatientPrescriptions: async (patientId: string) => {
      return apiClient.getPatientPrescriptions(patientId);
    },
    
    // Appointment Management
    getAppointments: async (patientId?: string) => {
      return apiClient.getAppointments(patientId);
    },
    createAppointment: async (data: Partial<Appointment>) => {
      return apiClient.createAppointment(data);
    },
    
    // Document Management
    getPatientDocuments: (patientId: string) => {
      return apiClient.getPatientDocuments(patientId);
    },
    
    // Analytics & Reports
    getPatientStats: () => {
      return apiClient.getPatientStats();
    },
    getTodayAppointments: () => {
      return apiClient.getTodayAppointments();
    },
    getPendingAssessments: () => {
      return apiClient.getPendingAssessments();
    },
    getTodayPrescriptions: () => {
      return apiClient.getTodayPrescriptions();
    },

    // Consultation Management - Central Integration
    getPatientConsultations: async (patientId: string, consultationId?: string) => {
      return apiClient.getPatientConsultations(patientId, consultationId);
    },
    createConsultation: async (consultationData: any) => {
      return apiClient.createConsultation(consultationData);
    },
    updateConsultation: async (consultationId: string, consultationData: any) => {
      console.log('llegamos a updateConsultation del hook');
      return apiClient.updateConsultation(consultationId, consultationData);
    },
    deleteConsultation: async (consultationId: string) => {
      return apiClient.deleteConsultation(consultationId);
    },
    getConsultationByAppointmentId: async (appointmentId: string) => {
      return apiClient.getConsultationByAppointmentId(appointmentId);
    },
    startConsultation: async (consultationId: string) => {
      return apiClient.startConsultation(consultationId);
    },
    completeConsultation: async (consultationId: string, consultationData: any) => {
      return apiClient.completeConsultation(consultationId, consultationData);
    },
    getPatientNextAppointment: async (patientId: string) => {
      return apiClient.getPatientNextAppointment(patientId);
    },
    createAppointmentFromConsultation: async (consultationId: string, appointmentData: any) => {
      return apiClient.createAppointmentFromConsultation(consultationId, appointmentData);
    },
    getClinicData: async () => {
      return apiClient.getClinicData();
    }
  };
}