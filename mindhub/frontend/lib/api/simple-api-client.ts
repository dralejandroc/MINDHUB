/**
 * Simple API Client - Direct backend communication with Supabase authentication
 * This client handles Supabase token authentication for direct backend calls
 */

// This client should be used from components that have access to Supabase context

// Backend configuration - HOTFIX: Direct Railway connection until Vercel fixed
const API_BASE_URL = 'https://mindhub-production.up.railway.app/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Simple API client that calls backend directly
 * Bypasses the broken Next.js proxy routes
 */
export class SimpleApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get Supabase token for authentication
    let supabaseToken: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        // Get token from Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!, 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        supabaseToken = session?.access_token || null;
        console.log('[SimpleApiClient] Got Supabase token:', supabaseToken ? 'Token obtained' : 'No token');
      } catch (error) {
        console.error('[SimpleApiClient] Could not get Supabase token:', error);
      }
    } else {
      console.warn('[SimpleApiClient] Supabase not available on server side');
    }
    
    // Headers with JWT token for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Add Authorization header if we have a token
    if (supabaseToken) {
      headers['Authorization'] = `Bearer ${supabaseToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Still include cookies as fallback
      });

      // Handle non-JSON responses (detect HTML error pages)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${contentType || 'non-JSON'} response. Expected JSON.`);
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status} error` };
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // FrontDesk API methods
  async getFrontDeskTodayStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>('/frontdesk/stats/today');
  }

  async getFrontDeskTodayAppointments(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>('/frontdesk/appointments/today');
  }

  async getFrontDeskPendingTasks(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>('/frontdesk/tasks/pending');
  }

  // Finance API methods
  async getFinanceIncome(params?: { limit?: number; status?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = `/finance/income${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ApiResponse<any[]>>(endpoint);
  }

  // Expedix API methods  
  async getExpedixPatients(searchTerm?: string): Promise<ApiResponse<any[]>> {
    const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    return this.makeRequest<ApiResponse<any[]>>(`/expedix/patients${params}`);
  }

  async getExpedixConsultations(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>('/expedix/consultations');
  }
}

// Export singleton instance
export const simpleApiClient = new SimpleApiClient();