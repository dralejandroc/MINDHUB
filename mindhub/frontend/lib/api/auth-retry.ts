/**
 * Authentication Retry Utilities
 * Sistema de retry para llamadas de API que fallan por problemas de autenticación
 * Updated to use Supabase Auth instead of Auth
 */

import { supabase } from '@/lib/supabase/client';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  exponentialBackoff: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  retryDelay: 1000,
  exponentialBackoff: true,
};

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Determina si un error es recuperable con retry
 */
export function isRetryableError(error: any): boolean {
  // Errores 401 son retryables (token expirado)
  if (error.statusCode === 401) return true;
  
  // Errores de red temporales
  if (error.name === 'NetworkError') return true;
  
  // Errores de timeout
  if (error.message?.includes('timeout')) return true;
  
  // Errores de conexión
  if (error.message?.includes('fetch')) return true;
  
  return false;
}

/**
 * Hook para realizar llamadas de API con retry automático usando Supabase
 */
export function useAuthenticatedApiCall() {
  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };
  
  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      isLoaded: true, // Supabase is always loaded
      isSignedIn: !!session?.access_token,
    };
  };

  const makeAuthenticatedCall = async <T>(
    apiCall: (token: string) => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> => {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Verificar estado de autenticación con Supabase
        const { isLoaded, isSignedIn } = await checkAuthState();
        
        if (!isLoaded) {
          throw new AuthenticationError('Supabase Auth is not loaded yet');
        }

        if (!isSignedIn) {
          throw new AuthenticationError('User is not signed in');
        }

        // Obtener token fresco
        const token = await getToken();
        if (!token) {
          throw new AuthenticationError('Failed to get authentication token');
        }

        console.log(`[AuthRetry] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} with token: ${token ? token.substring(0, 20) : 'null'}...`);

        // Realizar la llamada
        const result = await apiCall(token);
        
        if (attempt > 0) {
          console.log(`[AuthRetry] Success after ${attempt + 1} attempts`);
        }
        
        return result;

      } catch (error: any) {
        lastError = error;
        
        console.error(`[AuthRetry] Attempt ${attempt + 1} failed:`, error.message);

        // Si no es retryable o es el último intento, lanzar error
        if (!isRetryableError(error) || attempt === finalConfig.maxRetries) {
          console.error(`[AuthRetry] All attempts failed. Last error:`, error);
          throw error;
        }

        // Calcular delay para el siguiente intento
        const delay = finalConfig.exponentialBackoff 
          ? finalConfig.retryDelay * Math.pow(2, attempt)
          : finalConfig.retryDelay;

        console.log(`[AuthRetry] Retrying in ${delay}ms...`);
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  };

  return { makeAuthenticatedCall };
}

/**
 * Wrapper para funciones de API que necesitan retry automático
 */
export function withAuthRetry<TArgs extends any[], TReturn>(
  apiFunction: (token: string, ...args: TArgs) => Promise<TReturn>,
  retryConfig?: Partial<RetryConfig>
) {
  return async function (...args: TArgs): Promise<TReturn> {
    const { makeAuthenticatedCall } = useAuthenticatedApiCall();
    
    return makeAuthenticatedCall(
      (token: string) => apiFunction(token, ...args),
      retryConfig
    );
  };
}

/**
 * Helper para mostrar mensajes de error amigables al usuario
 */
export function getDisplayErrorMessage(error: any): string {
  if (error instanceof AuthenticationError) {
    if (error.message.includes('not signed in')) {
      return 'Por favor, inicia sesión para continuar.';
    }
    if (error.message.includes('not loaded')) {
      return 'Cargando autenticación, por favor espera...';
    }
    return 'Error de autenticación. Por favor, recarga la página e inicia sesión nuevamente.';
  }

  if (error instanceof NetworkError) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
  }

  if (error.message?.includes('401')) {
    return 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.';
  }

  if (error.message?.includes('fetch')) {
    return 'Error de conexión con el servidor. Por favor, intenta nuevamente.';
  }

  return error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
}

/**
 * Hook para manejar estados de error con reintentos automáticos
 */
export function useErrorHandling() {
  const handleError = (error: any, context: string = '') => {
    const displayMessage = getDisplayErrorMessage(error);
    
    console.error(`[ErrorHandler${context ? ` - ${context}` : ''}]`, {
      error,
      displayMessage,
      stack: error.stack,
    });

    return {
      displayMessage,
      isRetryable: isRetryableError(error),
      shouldReload: error.message?.includes('401') || error instanceof AuthenticationError,
    };
  };

  return { handleError };
}

export default {
  useAuthenticatedApiCall,
  withAuthRetry,
  getDisplayErrorMessage,
  useErrorHandling,
  AuthenticationError,
  NetworkError,
  isRetryableError,
};