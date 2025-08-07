/**
 * Configuración general para APIs de MindHub
 */

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Función utilitaria para hacer requests a la API
 */
export async function apiRequest(
  url: string, 
  options: ApiRequestOptions = {}
): Promise<any> {
  const { timeout = 10000, ...fetchOptions } = options;

  // Configuración por defecto
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...fetchOptions,
  };

  // Crear un controller para el timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    
    throw new Error('Unknown error occurred');
  }
}

/**
 * Configuración de URLs base para diferentes servicios
 * Using relative paths to go through Next.js proxy
 */
const API_URL = '/api';

export const API_BASE_URLS = {
  EXPEDIX: API_URL,
  CLINIMETRIX: API_URL,
  FORMX: API_URL,
  AGENDA: API_URL,
} as const;

/**
 * Headers comunes para autenticación
 */
export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Cliente API general para hacer requests
 */
export const apiClient = {
  get: (url: string, options?: ApiRequestOptions) => 
    apiRequest(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options?: ApiRequestOptions) => 
    apiRequest(url, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  put: (url: string, data?: any, options?: ApiRequestOptions) => 
    apiRequest(url, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  delete: (url: string, options?: ApiRequestOptions) => 
    apiRequest(url, { ...options, method: 'DELETE' })
};