/**
 * API URL Builders - Funciones helper para construir URLs de API
 * 
 * ARQUITECTURA:
 * - createApiUrl(): Cliente → usa /api proxy de Next.js
 * - createBackendApiUrl(): Servidor → directo a Django en Vercel
 * - createApiUrlWithParams(): URLs con parámetros de query
 * 
 * IMPORTANTE:
 * - Cliente usa proxy de Next.js para CORS y auth
 * - Servidor accede directo a Django backend en Vercel
 * - Todas las rutas vienen de shared/config/api-routes.ts
 */

import API_ROUTES from '../config/api-routes';

// Variables de entorno
// NEW: Django backend on Vercel
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';
const API_BASE = '/api'; // Proxy de Next.js

/**
 * createApiUrl - Para uso en CLIENTE (frontend)
 * Usa el proxy de Next.js (/api) que maneja autenticación automáticamente
 * 
 * @param route - Ruta desde API_ROUTES (ej: API_ROUTES.expedix.patients)
 * @returns URL proxy de Next.js con forwarding automático de tokens Auth
 * 
 * @example
 * createApiUrl(API_ROUTES.expedix.patients) → '/api/expedix/patients'
 * createApiUrl(API_ROUTES.expedix.patientById('123')) → '/api/expedix/patients/123'
 */
export function createApiUrl(route: string): string {
  // Use Next.js API routes proxy for now (they forward to Django backend)
  // This maintains authentication flow and provides proper CORS handling
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${API_BASE}${cleanRoute}`;
}

/**
 * createBackendApiUrl - Para uso en SERVIDOR (API routes, SSR)
 * Construye URL directa al backend Django en Vercel
 * 
 * @param route - Ruta desde API_ROUTES
 * @returns URL directa a Django backend
 * 
 * @example
 * createBackendApiUrl(API_ROUTES.expedix.patients) → 'https://mindhub-django-backend.vercel.app/api/expedix/patients'
 */
export function createBackendApiUrl(route: string): string {
  // Asegurar que la ruta empiece con /
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${BACKEND_URL}${cleanRoute}`;
}

/**
 * createApiUrlWithParams - Para URLs con parámetros de query
 * Construye URL de cliente con parámetros
 * 
 * @param route - Ruta base desde API_ROUTES
 * @param params - Objeto con parámetros de query
 * @returns URL proxy con parámetros
 * 
 * @example
 * createApiUrlWithParams(API_ROUTES.expedix.patients, { search: 'juan', limit: 10 })
 * → '/api/expedix/patients?search=juan&limit=10'
 */
export function createApiUrlWithParams(
  route: string, 
  params: Record<string, string | number | boolean>
): string {
  // Use client API URL with parameters
  const baseUrl = createApiUrl(route);
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * createBackendApiUrlWithParams - Para URLs de servidor con parámetros
 * Construye URL directa a Django backend con parámetros
 * 
 * @param route - Ruta base desde API_ROUTES
 * @param params - Objeto con parámetros de query
 * @returns URL directa a Django backend con parámetros
 */
export function createBackendApiUrlWithParams(
  route: string,
  params: Record<string, string | number | boolean>
): string {
  const baseUrl = createBackendApiUrl(route);
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Helpers para logging y debugging
 */
export function logApiCall(route: string, method: string = 'GET', context: 'client' | 'server' = 'client') {
  if (process.env.NODE_ENV === 'development') {
    const url = context === 'client' ? createApiUrl(route) : createBackendApiUrl(route);
    console.log(`[API ${context.toUpperCase()}] ${method} ${url}`);
  }
}

/**
 * Verificar si estamos en cliente o servidor
 */
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

/**
 * Helper para decidir automáticamente qué URL usar
 * EXPERIMENTAL - usar con cuidado
 */
export function createSmartApiUrl(route: string): string {
  return isClient ? createApiUrl(route) : createBackendApiUrl(route);
}

/**
 * Tipos para TypeScript
 */
export type ApiContext = 'client' | 'server';
export type QueryParams = Record<string, string | number | boolean>;

/**
 * Exports rápidos para facilitar uso
 */
export { API_ROUTES };

/**
 * Ejemplos de uso:
 * 
 * // En componente React (cliente):
 * const url = createApiUrl(API_ROUTES.expedix.patients); // → '/api/expedix/patients'
 * 
 * // En API route (servidor):
 * const url = createBackendApiUrl(API_ROUTES.expedix.patients); // → 'https://mindhub-django-backend.vercel.app/expedix/patients'
 * 
 * // Con parámetros:
 * const url = createApiUrlWithParams(API_ROUTES.expedix.patients, { search: 'juan' }); // → '/api/expedix/patients?search=juan'
 * 
 * // Con ID dinámico:
 * const url = createApiUrl(API_ROUTES.expedix.patientById('123')); // → '/api/expedix/patients/123'
 */