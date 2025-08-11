// Expedix API Client - Centralized API communication for patient management
import { createAuthHeaders, authenticatedFetchWithToken } from '@/lib/utils/clerk-auth';

// Use backend directly instead of Next.js proxy routes to avoid API route issues
const API_BASE_URL = 'https://mindhub-production.up.railway.app/api';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, getToken?: () => Promise<string | null>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get authentication headers from Clerk if available
    let authHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add Bearer token if getToken function is provided
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          authHeaders['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No auth token available for request:', endpoint);
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        throw new Error('Authentication required');
      }
    } else {
      // For server-side or non-authenticated requests
      console.warn('No getToken function provided for:', endpoint);
      throw new Error('Authorization header with Bearer token is required');
    }

    const defaultHeaders = {
      ...authHeaders,
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

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Patient Management
  async getPatients(searchTerm?: string, getToken?: () => Promise<string | null>): Promise<{ data: Patient[]; total: number }> {
    const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    const response = await this.makeRequest<{ success: boolean; data: Patient[]; pagination: { total: number } }>(`/expedix/patients${params}`, {}, getToken);
    
    return {
      data: response.data || [],
      total: response.pagination?.total || 0
    };
  }

  async getPatient(id: string, getToken?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(`/expedix/patients/${id}`, {}, getToken);
    
    return {
      data: response.data
    };
  }

  async createPatient(patientData: Partial<Patient>, getToken?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>('/expedix/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }, getToken);
    
    return {
      data: response.data
    };
  }

  async updatePatient(id: string, patientData: Partial<Patient>, getToken?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(`/expedix/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    }, getToken);
    
    return {
      data: response.data
    };
  }

  async deletePatient(id: string, getToken?: () => Promise<string | null>): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/expedix/patients/${id}`, {
      method: 'DELETE',
    }, getToken);
  }

  // Prescription Management
  async getPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`);
  }

  async createPrescription(prescriptionData: Partial<Prescription>): Promise<{ data: Prescription }> {
    return this.makeRequest<{ data: Prescription }>('/expedix/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async generatePrescriptionPDF(prescriptionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/expedix/prescriptions/${prescriptionId}/pdf`);
    if (!response.ok) {
      throw new Error('Failed to generate prescription PDF');
    }
    return response.blob();
  }

  async getPatientPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`);
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
    const response = await fetch(`${this.baseUrl}/expedix/documents/download/${documentId}`);
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

  async confirmAppointment(token: string, confirmed: boolean): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/portal/confirm-appointment', {
      method: 'POST',
      body: JSON.stringify({ token, confirmed }),
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

// Export singleton instance
export const expedixApi = new ExpedixApiClient();

// Named exports for convenience
export { ExpedixApiClient };

// React Hook for authenticated Expedix API calls
export function useExpedixApi() {
  // Import dynamically to avoid server-side issues
  const { useAuth } = require('@clerk/nextjs');
  const { getToken } = useAuth();
  
  return {
    // Patient Management
    getPatients: (searchTerm?: string) => expedixApi.getPatients(searchTerm, getToken),
    getPatient: (id: string) => expedixApi.getPatient(id, getToken),
    createPatient: (data: Partial<Patient>) => expedixApi.createPatient(data, getToken),
    updatePatient: (id: string, data: Partial<Patient>) => expedixApi.updatePatient(id, data, getToken),
    deletePatient: (id: string) => expedixApi.deletePatient(id, getToken),
    
    // Appointments and Prescriptions - need to update these methods to support getToken
    getAppointments: (patientId?: string) => {
      // Temporary implementation - these methods need to be updated to support authentication
      console.warn('getAppointments called but not yet updated for authentication');
      return Promise.resolve({ data: [] });
    },
    getPrescriptions: (patientId: string) => {
      // Temporary implementation - these methods need to be updated to support authentication
      console.warn('getPrescriptions called but not yet updated for authentication');
      return Promise.resolve({ data: [] });
    },
  };
}