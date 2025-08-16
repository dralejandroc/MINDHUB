// Expedix API Client - Centralized API communication for patient management
import { createAuthHeaders, authenticatedFetchWithToken } from '@/lib/utils/clerk-auth';
import { useAuth } from '@clerk/nextjs';
import { createApiUrl, createApiUrlWithParams, API_ROUTES, logApiCall } from './api-url-builders';
import { useAuthenticatedApiCall, AuthenticationError, NetworkError } from '@/lib/utils/auth-retry';

export interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  age: number;
  gender: 'masculine' | 'feminine';
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
  constructor() {
    // No necesitamos baseUrl porque las URLs se construyen dinámicamente
  }

  private async makeRequest<T>(route: string, options: RequestInit = {}, token?: string): Promise<T> {
    // Usar createApiUrl para construir URL del cliente (proxy /api)
    const url = createApiUrl(route);
    
    // Log de la llamada para debugging
    logApiCall(route, options.method || 'GET', 'client');
    
    // Create authenticated headers with Bearer token
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add Authorization header if token is provided
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
      console.log(`[ExpedixAPI] Making authenticated request to ${route} with token: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`[ExpedixAPI] Making request to ${route} WITHOUT authentication token - this may cause 401 errors`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include', // Include cookies as fallback
      });

      console.log(`[ExpedixAPI] Response status for ${route}: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        
        if (response.status === 401) {
          console.error(`[ExpedixAPI] 401 Unauthorized error on ${route}. Token provided: ${!!token}`);
          throw new Error('Authentication required. Please log in again.');
        }
        
        console.error(`[ExpedixAPI] HTTP error on ${route}:`, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[ExpedixAPI] Error on ${route}:`, error);
      throw error;
    }
  }

  // Patient Management - Now with authentication token support
  async getPatients(searchTerm?: string, token?: string): Promise<{ data: Patient[]; total: number }> {
    if (!token) {
      console.error('[ExpedixAPI] getPatients called without authentication token');
      throw new Error('Authentication token is required');
    }
    
    // Usar la ruta base y agregar parámetros si es necesario
    const baseRoute = API_ROUTES.expedix.patients;
    const queryParams = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    const fullRoute = `${baseRoute}${queryParams}`;
    
    const response = await this.makeRequest<{ success: boolean; data: Patient[]; pagination: { total: number } }>(fullRoute, {}, token);
    
    return {
      data: response.data || [],
      total: response.pagination?.total || 0
    };
  }

  async getPatient(id: string, token?: string): Promise<{ data: Patient }> {
    if (!token) {
      console.error('[ExpedixAPI] getPatient called without authentication token');
      throw new Error('Authentication token is required');
    }
    
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(API_ROUTES.expedix.patientById(id), {}, token);
    
    return {
      data: response.data
    };
  }

  async createPatient(patientData: Partial<Patient>, token?: string): Promise<{ data: Patient }> {
    if (!token) {
      console.error('[ExpedixAPI] createPatient called without authentication token');
      throw new Error('Authentication token is required');
    }
    
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(API_ROUTES.expedix.patients, {
      method: 'POST',
      body: JSON.stringify(patientData),
    }, token);
    
    return {
      data: response.data
    };
  }

  async updatePatient(id: string, patientData: Partial<Patient>, token?: string): Promise<{ data: Patient }> {
    if (!token) {
      console.error('[ExpedixAPI] updatePatient called without authentication token');
      throw new Error('Authentication token is required');
    }
    
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(API_ROUTES.expedix.patientById(id), {
      method: 'PUT',
      body: JSON.stringify(patientData),
    }, token);
    
    return {
      data: response.data
    };
  }

  async deletePatient(id: string, token?: string): Promise<{ success: boolean }> {
    if (!token) {
      console.error('[ExpedixAPI] deletePatient called without authentication token');
      throw new Error('Authentication token is required');
    }
    
    return this.makeRequest<{ success: boolean }>(API_ROUTES.expedix.patientById(id), {
      method: 'DELETE',
    }, token);
  }

  // Prescription Management
  async getPrescriptions(patientId: string, token?: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(API_ROUTES.expedix.patientPrescriptions(patientId), {}, token);
  }

  async createPrescription(prescriptionData: Partial<Prescription>, token?: string): Promise<{ data: Prescription }> {
    return this.makeRequest<{ data: Prescription }>(API_ROUTES.expedix.prescriptions, {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    }, token);
  }

  async generatePrescriptionPDF(prescriptionId: string, token?: string): Promise<Blob> {
    const url = createApiUrl(`/expedix/prescriptions/${prescriptionId}/pdf`);
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Failed to generate prescription PDF');
    }
    return response.blob();
  }

  async getPatientPrescriptions(patientId: string, token?: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/${patientId}`, {}, token);
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
  async getPatientDocuments(patientId: string, token: string): Promise<{ data: Document[] }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: Document[] }>(`/expedix/documents/${patientId}`, {}, token);
  }

  async uploadDocument(patientId: string, file: File, category: string, token: string): Promise<{ data: Document }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.makeRequest<{ data: Document }>(`/expedix/documents/${patientId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    }, token);
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    const url = createApiUrl(`/expedix/documents/download/${documentId}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    return response.blob();
  }

  // Medical History
  async getMedicalHistory(patientId: string, token: string): Promise<{ data: any }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`, {}, token);
  }

  async updateMedicalHistory(patientId: string, historyData: any, token: string): Promise<{ data: any }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(historyData),
    }, token);
  }

  // Analytics & Reports
  async getPatientStats(token: string): Promise<{ data: any }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>('/expedix/analytics/patient-stats', {}, token);
  }

  async getTodayAppointments(token: string): Promise<{ data: Appointment[] }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: Appointment[] }>('/expedix/analytics/today-appointments', {}, token);
  }

  async getPendingAssessments(token: string): Promise<{ data: any[] }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any[] }>('/expedix/analytics/pending-assessments', {}, token);
  }

  async getTodayPrescriptions(token: string): Promise<{ data: Prescription[] }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: Prescription[] }>('/expedix/analytics/today-prescriptions', {}, token);
  }

  // Patient Portal
  async getPortalAccess(patientId: string, token: string): Promise<{ data: any }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>(`/expedix/portal/${patientId}/access`, {}, token);
  }

  async confirmAppointment(appointmentToken: string, confirmed: boolean, authToken: string): Promise<{ data: any }> {
    if (!authToken) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>('/expedix/portal/confirm-appointment', {
      method: 'POST',
      body: JSON.stringify({ token: appointmentToken, confirmed }),
    }, authToken);
  }

  // Drug Interactions
  async checkDrugInteractions(medications: string[], token: string): Promise<{ data: any }> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return this.makeRequest<{ data: any }>('/expedix/drug-interactions/check', {
      method: 'POST',
      body: JSON.stringify({ medications }),
    }, token);
  }

  // Consultation Forms
  async getConsultationTemplates(): Promise<{ data: any[], total: number }> {
    return this.makeRequest<{ success: boolean; data: any[]; total: number }>('/expedix/forms/templates');
  }

  async getConsultationTemplate(templateId: string): Promise<{ data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/templates/${templateId}`);
  }

  async createConsultationForm(formData: { templateId: string; patientId: string; title?: string; consultationId?: string }): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>('/expedix/forms/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  }

  async getConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}`);
  }

  async updateConsultationForm(formId: string, fieldId: string, value: any): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify({ fieldId, value }),
    });
  }

  async completeConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}/complete`, {
      method: 'POST',
    });
  }

  async getPatientConsultationForms(patientId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(`/expedix/forms/forms/patient/${patientId}`);
  }
}

// Export simple singleton instance - authentication handled by backend cookies
export const expedixApi = new ExpedixApiClient();

// Named exports for convenience
export { ExpedixApiClient };

// Enhanced React Hook with Clerk authentication and retry logic
export function useExpedixApi() {
  const { makeAuthenticatedCall } = useAuthenticatedApiCall();
  
  // Return API client methods with automatic authentication
  return {
    // Patient Management with automatic retry on auth failures
    getPatients: async (searchTerm?: string) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getPatients(searchTerm, token)
      );
    },
    getPatient: async (id: string) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getPatient(id, token)
      );
    },
    createPatient: async (data: Partial<Patient>) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.createPatient(data, token)
      );
    },
    updatePatient: async (id: string, data: Partial<Patient>) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.updatePatient(id, data, token)
      );
    },
    deletePatient: async (id: string) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.deletePatient(id, token)
      );
    },
    
    // Other methods with retry capability (will be implemented as needed)
    // Note: These methods need to be updated to use authentication tokens
    getPrescriptions: (patientId: string) => {
      console.warn('[ExpedixAPI] getPrescriptions not yet updated for auth retry');
      return expedixApi.getPrescriptions(patientId);
    },
    createPrescription: (data: Partial<Prescription>) => {
      console.warn('[ExpedixAPI] createPrescription not yet updated for auth retry');
      return expedixApi.createPrescription(data);
    },
    getPatientPrescriptions: (patientId: string) => {
      console.warn('[ExpedixAPI] getPatientPrescriptions not yet updated for auth retry');
      return expedixApi.getPatientPrescriptions(patientId);
    },
    
    // Appointment Management
    getAppointments: (patientId?: string) => {
      console.warn('[ExpedixAPI] getAppointments not yet updated for auth retry');
      return expedixApi.getAppointments(patientId);
    },
    createAppointment: (data: Partial<Appointment>) => {
      console.warn('[ExpedixAPI] createAppointment not yet updated for auth retry');
      return expedixApi.createAppointment(data);
    },
    
    // Document Management
    getPatientDocuments: (patientId: string) => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getPatientDocuments(patientId, token)
      );
    },
    
    // Analytics & Reports
    getPatientStats: () => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getPatientStats(token)
      );
    },
    getTodayAppointments: () => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getTodayAppointments(token)
      );
    },
    getPendingAssessments: () => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getPendingAssessments(token)
      );
    },
    getTodayPrescriptions: () => {
      return makeAuthenticatedCall(
        (token: string) => expedixApi.getTodayPrescriptions(token)
      );
    },
  };
}