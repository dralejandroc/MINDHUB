/**
 * Base API Client - Centralized configuration for all API communication
 * Provides consistent authentication, error handling, and endpoint management
 */

// Conditional imports to handle both client and server environments
let useAuth: any;
let auth: any;

if (typeof window !== 'undefined') {
  // Client-side only
  try {
    const clerkNext = require('@clerk/nextjs');
    useAuth = clerkNext.useAuth;
  } catch (e) {
    console.warn('Clerk client-side import failed:', e);
  }
} else {
  // Server-side only
  try {
    const clerkServer = require('@clerk/nextjs/server');
    auth = clerkServer.auth;
  } catch (e) {
    console.warn('Clerk server-side import failed:', e);
  }
}

// Backend configuration - use Next.js API routes as proxies
const API_BASE_URL = '/api';

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

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class BaseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create authentication headers for API requests
   */
  private async createAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      // For server-side requests
      if (typeof window === 'undefined') {
        const { getToken } = await auth();
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      // For client-side requests, the token will be handled by the useAuth hook
      // This is just the base headers setup
    } catch (error) {
      console.warn('Authentication temporarily bypassed due to error:', error);
    }

    return headers;
  }

  /**
   * Create authentication headers for client-side requests
   */
  public async createClientAuthHeaders(getToken?: () => Promise<string | null>): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Authentication temporarily bypassed:', error);
      }
    }

    return headers;
  }

  /**
   * Make authenticated API request
   */
  public async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    getToken?: () => Promise<string | null>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create headers based on environment
    let authHeaders: HeadersInit;
    if (typeof window === 'undefined') {
      authHeaders = await this.createAuthHeaders();
    } else {
      authHeaders = await this.createClientAuthHeaders(getToken);
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

      // Handle non-JSON responses (like HTML error pages)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${contentType || 'non-JSON'} response. Expected JSON.`);
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Network error' };
        }
        
        const error: ApiError = {
          message: errorData.message || `HTTP error! status: ${response.status}`,
          code: errorData.code,
          status: response.status,
        };
        
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, getToken);
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data?: any, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, getToken);
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data?: any, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, getToken);
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, getToken);
  }
}

/**
 * Hook for client-side API calls with authentication
 */
export function useApiClient() {
  const { getToken } = useAuth();
  const client = new BaseApiClient();

  return {
    get: <T>(endpoint: string) => client.get<T>(endpoint, getToken),
    post: <T>(endpoint: string, data?: any) => client.post<T>(endpoint, data, getToken),
    put: <T>(endpoint: string, data?: any) => client.put<T>(endpoint, data, getToken),
    delete: <T>(endpoint: string) => client.delete<T>(endpoint, getToken),
  };
}

// Export singleton instance for direct usage
export const apiClient = new BaseApiClient();