// Expedix API Client - Centralized API communication for patient management
const API_BASE_URL = process.env.NEXT_PUBLIC_EXPEDIX_API || 'http://localhost:8080';

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
  curp?: string;
  rfc?: string;
  blood_type?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  consultations_count?: number;
  evaluations_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  practitioner_name: string;
  practitioner_license: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
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

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Patient Management
  async getPatients(searchTerm?: string): Promise<{ data: Patient[]; total: number }> {
    const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    const response = await this.makeRequest<{ success: boolean; data: Patient[]; pagination: { total: number } }>(`/api/v1/expedix/patients${params}`);
    
    return {
      data: response.data || [],
      total: response.pagination?.total || 0
    };
  }

  async getPatient(id: string): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(`/api/v1/expedix/patients/${id}`);
    
    return {
      data: response.data
    };
  }

  async createPatient(patientData: Partial<Patient>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>('/api/v1/expedix/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    
    return {
      data: response.data
    };
  }

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<{ data: Patient }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient }>(`/api/v1/expedix/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
    
    return {
      data: response.data
    };
  }

  async deletePatient(id: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/api/v1/expedix/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Prescription Management
  async getPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/api/v1/expedix/prescriptions/patient/${patientId}`);
  }

  async createPrescription(prescriptionData: Partial<Prescription>): Promise<{ data: Prescription }> {
    return this.makeRequest<{ data: Prescription }>('/api/v1/expedix/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async generatePrescriptionPDF(prescriptionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/expedix/prescriptions/${prescriptionId}/pdf`);
    if (!response.ok) {
      throw new Error('Failed to generate prescription PDF');
    }
    return response.blob();
  }

  async getPatientPrescriptions(patientId: string): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>(`/api/v1/expedix/prescriptions/patient/${patientId}`);
  }

  // Appointment Management
  async getAppointments(patientId?: string): Promise<{ data: Appointment[] }> {
    const params = patientId ? `?patient_id=${patientId}` : '';
    return this.makeRequest<{ data: Appointment[] }>(`/api/v1/expedix/appointments${params}`);
  }

  async createAppointment(appointmentData: Partial<Appointment>): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>('/api/v1/expedix/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<{ data: Appointment }> {
    return this.makeRequest<{ data: Appointment }>(`/api/v1/expedix/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Document Management
  async getPatientDocuments(patientId: string): Promise<{ data: Document[] }> {
    return this.makeRequest<{ data: Document[] }>(`/api/v1/expedix/documents/${patientId}`);
  }

  async uploadDocument(patientId: string, file: File, category: string): Promise<{ data: Document }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.makeRequest<{ data: Document }>(`/api/v1/expedix/documents/${patientId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/expedix/documents/download/${documentId}`);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    return response.blob();
  }

  // Medical History
  async getMedicalHistory(patientId: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/api/v1/expedix/medical-history/${patientId}`);
  }

  async updateMedicalHistory(patientId: string, historyData: any): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/api/v1/expedix/medical-history/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(historyData),
    });
  }

  // Analytics & Reports
  async getPatientStats(): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/api/v1/expedix/analytics/patient-stats');
  }

  async getTodayAppointments(): Promise<{ data: Appointment[] }> {
    return this.makeRequest<{ data: Appointment[] }>('/api/v1/expedix/analytics/today-appointments');
  }

  async getPendingAssessments(): Promise<{ data: any[] }> {
    return this.makeRequest<{ data: any[] }>('/api/v1/expedix/analytics/pending-assessments');
  }

  async getTodayPrescriptions(): Promise<{ data: Prescription[] }> {
    return this.makeRequest<{ data: Prescription[] }>('/api/v1/expedix/analytics/today-prescriptions');
  }

  // Patient Portal
  async getPortalAccess(patientId: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/api/v1/expedix/portal/${patientId}/access`);
  }

  async confirmAppointment(token: string, confirmed: boolean): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/api/v1/expedix/portal/confirm-appointment', {
      method: 'POST',
      body: JSON.stringify({ token, confirmed }),
    });
  }

  // Drug Interactions
  async checkDrugInteractions(medications: string[]): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>('/api/v1/expedix/drug-interactions/check', {
      method: 'POST',
      body: JSON.stringify({ medications }),
    });
  }

  // Consultation Forms
  async getConsultationTemplates(): Promise<{ data: any[], total: number }> {
    return this.makeRequest<{ success: boolean; data: any[]; total: number }>('/api/v1/expedix/forms/templates');
  }

  async getConsultationTemplate(templateId: string): Promise<{ data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/api/v1/expedix/forms/templates/${templateId}`);
  }

  async createConsultationForm(formData: { templateId: string; patientId: string; title?: string; consultationId?: string }): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>('/api/v1/expedix/forms/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  }

  async getConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/api/v1/expedix/forms/forms/${formId}`);
  }

  async updateConsultationForm(formId: string, fieldId: string, value: any): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/api/v1/expedix/forms/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify({ fieldId, value }),
    });
  }

  async completeConsultationForm(formId: string): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(`/api/v1/expedix/forms/forms/${formId}/complete`, {
      method: 'POST',
    });
  }

  async getPatientConsultationForms(patientId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(`/api/v1/expedix/forms/forms/patient/${patientId}`);
  }
}

// Export singleton instance
export const expedixApi = new ExpedixApiClient();

// Named exports for convenience
export { ExpedixApiClient };