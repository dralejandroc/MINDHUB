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
  async getPrescriptions(patientId: string, getToken?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`, {}, getToken);
  }

  async createPrescription(prescriptionData: Partial<Prescription>, getToken?: () => Promise<string | null>): Promise<{ data: Prescription }> {
    return this.makeRequest<{ data: Prescription }>('/expedix/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    }, getToken);
  }

  async generatePrescriptionPDF(prescriptionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/expedix/prescriptions/${prescriptionId}/pdf`);
    if (!response.ok) {
      throw new Error('Failed to generate prescription PDF');
    }
    return response.blob();
  }

  async getPatientPrescriptions(patientId: string, getToken?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`, {}, getToken);
  }

  // Appointment Management
  async getAppointments(patientId?: string, getToken?: () => Promise<string | null>): Promise<{ data: Appointment[] }> {
    const params = patientId ? `?patient_id=${patientId}` : '';
    return this.makeRequest<{ data: Appointment[] }>(`/expedix/appointments${params}`, {}, getToken);
  }

  async createAppointment(appointmentData: Partial<Appointment>, getToken?: () => Promise<string | null>): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>('/expedix/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }, getToken);
  }

  async updateAppointmentStatus(appointmentId: string, status: string, getToken?: () => Promise<string | null>): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>(`/expedix/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, getToken);
  }

  // Document Management
  async getPatientDocuments(patientId: string, getToken?: () => Promise<string | null>): Promise<{ data: Document[] }> {
    return this.makeRequest<{ data: Document[] }>(`/expedix/documents/${patientId}`, {}, getToken);
  }

  async uploadDocument(patientId: string, file: File, category: string, getToken?: () => Promise<string | null>): Promise<{ data: Document }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.makeRequest<{ data: Document }>(`/expedix/documents/${patientId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    }, getToken);
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/expedix/documents/download/${documentId}`);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    return response.blob();
  }

  // Medical History
  async getMedicalHistory(patientId: string, getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`, {}, getToken);
  }

  async updateMedicalHistory(patientId: string, historyData: any, getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/medical-history/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(historyData),
    }, getToken);
  }

  // Analytics & Reports
  async getPatientStats(getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/analytics/patient-stats', {}, getToken);
  }

  async getTodayAppointments(getToken?: () => Promise<string | null>): Promise<{ data: Appointment[] }> {
    return this.makeRequest<{ data: Appointment[] }>('/expedix/analytics/today-appointments', {}, getToken);
  }

  async getPendingAssessments(getToken?: () => Promise<string | null>): Promise<{ data: any[] }> {
    return this.makeRequest<{ data: any[] }>('/expedix/analytics/pending-assessments', {}, getToken);
  }

  async getTodayPrescriptions(getToken?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>('/expedix/analytics/today-prescriptions', {}, getToken);
  }

  // Patient Portal
  async getPortalAccess(patientId: string, getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/expedix/portal/${patientId}/access`, {}, getToken);
  }

  async confirmAppointment(token: string, confirmed: boolean, getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/portal/confirm-appointment', {
      method: 'POST',
      body: JSON.stringify({ token, confirmed }),
    }, getToken);
  }

  // Drug Interactions
  async checkDrugInteractions(medications: string[], getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/expedix/drug-interactions/check', {
      method: 'POST',
      body: JSON.stringify({ medications }),
    }, getToken);
  }

  // Consultation Forms
  async getConsultationTemplates(getToken?: () => Promise<string | null>): Promise<{ data: any[], total: number }> {
    return this.makeRequest<{ success: boolean; data: any[]; total: number }>('/expedix/forms/templates', {}, getToken);
  }

  async getConsultationTemplate(templateId: string, getToken?: () => Promise<string | null>): Promise<{ data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/templates/${templateId}`, {}, getToken);
  }

  async createConsultationForm(formData: { templateId: string; patientId: string; title?: string; consultationId?: string }, getToken?: () => Promise<string | null>): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>('/expedix/forms/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    }, getToken);
  }

  async getConsultationForm(formId: string, getToken?: () => Promise<string | null>): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}`, {}, getToken);
  }

  async updateConsultationForm(formId: string, fieldId: string, value: any, getToken?: () => Promise<string | null>): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify({ fieldId, value }),
    }, getToken);
  }

  async completeConsultationForm(formId: string, getToken?: () => Promise<string | null>): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/expedix/forms/forms/${formId}/complete`, {
      method: 'POST',
    }, getToken);
  }

  async getPatientConsultationForms(patientId: string, getToken?: () => Promise<string | null>): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(`/expedix/forms/forms/patient/${patientId}`, {}, getToken);
  }
}

// TEMPORARY: Set up a global token provider for quick fix
let globalTokenProvider: (() => Promise<string | null>) | null = null;

// Function to set global token provider (called from app root)
export function setGlobalTokenProvider(provider: () => Promise<string | null>) {
  globalTokenProvider = provider;
}

// Enhanced ExpedixApiClient that uses global token if no explicit token provided
class EnhancedExpedixApiClient extends ExpedixApiClient {
  private getAuthToken = async (getTokenOverride?: () => Promise<string | null>) => {
    const getTokenFn = getTokenOverride || globalTokenProvider;
    
    if (!getTokenFn) {
      throw new Error('Authorization header with Bearer token is required');
    }
    
    return getTokenFn;
  };

  async getPatients(searchTerm?: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Patient[]; total: number }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.getPatients(searchTerm, getTokenFn);
  }
  
  async getPatient(id: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.getPatient(id, getTokenFn);
  }
  
  async createPatient(patientData: Partial<Patient>, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.createPatient(patientData, getTokenFn);
  }

  async updatePatient(id: string, patientData: Partial<Patient>, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Patient }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.updatePatient(id, patientData, getTokenFn);
  }

  async deletePatient(id: string, getTokenOverride?: () => Promise<string | null>): Promise<{ success: boolean }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.deletePatient(id, getTokenFn);
  }

  // Prescription Management
  async getPrescriptions(patientId: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`, {}, getTokenFn);
  }

  async createPrescription(prescriptionData: Partial<Prescription>, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Prescription }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Prescription }>('/expedix/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    }, getTokenFn);
  }

  async getPatientPrescriptions(patientId: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Prescription[] }>(`/expedix/prescriptions/patient/${patientId}`, {}, getTokenFn);
  }

  // Appointment Management
  async getAppointments(patientId?: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Appointment[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    const params = patientId ? `?patient_id=${patientId}` : '';
    return super.makeRequest<{ data: Appointment[] }>(`/expedix/appointments${params}`, {}, getTokenFn);
  }

  async createAppointment(appointmentData: Partial<Appointment>, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Appointment }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Appointment }>('/expedix/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }, getTokenFn);
  }

  // Document Management
  async getPatientDocuments(patientId: string, getTokenOverride?: () => Promise<string | null>): Promise<{ data: Document[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Document[] }>(`/expedix/documents/${patientId}`, {}, getTokenFn);
  }

  // Analytics & Reports
  async getPatientStats(getTokenOverride?: () => Promise<string | null>): Promise<{ data: any }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: any }>('/expedix/analytics/patient-stats', {}, getTokenFn);
  }

  async getTodayAppointments(getTokenOverride?: () => Promise<string | null>): Promise<{ data: Appointment[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Appointment[] }>('/expedix/analytics/today-appointments', {}, getTokenFn);
  }

  async getPendingAssessments(getTokenOverride?: () => Promise<string | null>): Promise<{ data: any[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: any[] }>('/expedix/analytics/pending-assessments', {}, getTokenFn);
  }

  async getTodayPrescriptions(getTokenOverride?: () => Promise<string | null>): Promise<{ data: Prescription[] }> {
    const getTokenFn = await this.getAuthToken(getTokenOverride);
    return super.makeRequest<{ data: Prescription[] }>('/expedix/analytics/today-prescriptions', {}, getTokenFn);
  }
}

// Export enhanced singleton instance
export const expedixApi = new EnhancedExpedixApiClient();

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
    
    // Prescription Management
    getPrescriptions: (patientId: string) => expedixApi.getPrescriptions(patientId, getToken),
    createPrescription: (data: Partial<Prescription>) => expedixApi.createPrescription(data, getToken),
    getPatientPrescriptions: (patientId: string) => expedixApi.getPatientPrescriptions(patientId, getToken),
    
    // Appointment Management
    getAppointments: (patientId?: string) => expedixApi.getAppointments(patientId, getToken),
    createAppointment: (data: Partial<Appointment>) => expedixApi.createAppointment(data, getToken),
    
    // Document Management
    getPatientDocuments: (patientId: string) => expedixApi.getPatientDocuments(patientId, getToken),
    
    // Analytics & Reports
    getPatientStats: () => expedixApi.getPatientStats(getToken),
    getTodayAppointments: () => expedixApi.getTodayAppointments(getToken),
    getPendingAssessments: () => expedixApi.getPendingAssessments(getToken),
    getTodayPrescriptions: () => expedixApi.getTodayPrescriptions(getToken),
  };
}