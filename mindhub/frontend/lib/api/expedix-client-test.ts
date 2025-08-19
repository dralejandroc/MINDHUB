// TEMPORARY TEST VERSION - Use working endpoints
import { useAuthenticatedFetch } from './supabase-auth';
import { createApiUrl } from './api-url-builders';

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
  country?: string;
  occupation?: string;
  marital_status?: string;
  education_level?: string;
  preferred_language?: string;
  insurance_provider?: string;
  insurance_number?: string;
  referring_physician?: string;
  created_at?: string;
  updated_at?: string;
}

class ExpedixApiClientTest {
  private authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authenticatedFetch = authenticatedFetch;
  }

  private async makeRequest<T>(route: string, options: RequestInit = {}): Promise<T> {
    const url = createApiUrl(route);
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    console.log(`[ExpedixAPITest] Making request to ${route} via ${url}`);

    try {
      const fetchFunction = this.authenticatedFetch || fetch;
      const response = await fetchFunction(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include',
      });

      console.log(`[ExpedixAPITest] Response status for ${route}: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned text/html; charset=utf-8 response. Expected JSON.`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[ExpedixAPITest] Error on ${route}:`, error);
      throw error;
    }
  }

  // Use working endpoints for testing
  async getPatients(searchTerm?: string): Promise<{ data: Patient[]; total: number }> {
    const response = await this.makeRequest<{ success: boolean; data: Patient[]; pagination: { total: number } }>('/expedix/patients-working');
    
    return {
      data: response.data || [],
      total: response.pagination?.total || 0
    };
  }

  async getConsultations(patientId?: string): Promise<{ data: any[]; total: number }> {
    const response = await this.makeRequest<{ success: boolean; data: any[]; pagination: { total: number } }>('/expedix/consultations-working');
    
    return {
      data: response.data || [],
      total: response.pagination?.total || 0
    };
  }
}

// Export test hook
export function useExpedixApiTest() {
  // const { getToken } = useAuth(); // TODO: Replace with Supabase auth
  const getToken = () => Promise.resolve(null);
  const authenticatedFetch = useAuthenticatedFetch();
  
  // Create API client instance with authenticated fetch
  const apiClient = new ExpedixApiClientTest(authenticatedFetch);
  
  return {
    getPatients: (searchTerm?: string) => apiClient.getPatients(searchTerm),
    getConsultations: (patientId?: string) => apiClient.getConsultations(patientId),
  };
}