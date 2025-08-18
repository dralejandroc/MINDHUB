/**
 * Clerk Authentication Utilities
 * Utilities for getting Clerk session tokens and user data
 */

// import { useAuth, useUser } from '@clerk/nextjs';

/**
 * Hook to get Clerk session token for API calls (client-side)
 * This must be used within React components
 */
export function useClerkToken() {
  const { getToken } = useAuth();
  
  return async (): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') {
        return null; // Server-side, use server method
      }

      const token = await getToken({ template: 'mindhub-backend' });
      return token;
    } catch (error) {
      console.error('Error getting Clerk token:', error);
      return null;
    }
  };
}

/**
 * Hook to get Clerk user data for API calls (client-side)
 * This must be used within React components
 */
export function useClerkUser() {
  const { user } = useUser();
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress,
    name: user.fullName || user.firstName || '',
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Get Clerk session token for API calls (server-side)
 * Note: Server-side token handling removed to avoid client/server import conflicts
 * Use server components directly for server-side auth
 */

/**
 * Hook to create authentication headers for API requests
 * This must be used within React components
 */
export function useAuthHeaders() {
  const getToken = useClerkToken();
  const user = useClerkUser();
  
  return async (): Promise<HeadersInit> => {
    const token = await getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (user?.id) {
      const userContext = {
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || '',
      };
      headers['X-User-Context'] = JSON.stringify(userContext);
    }

    return headers;
  };
}

/**
 * Hook for enhanced fetch with automatic Clerk authentication
 * This must be used within React components
 */
export function useAuthenticatedFetch() {
  const getAuthHeaders = useAuthHeaders();
  
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    return fetch(url, config);
  };
}

/**
 * Hook to create user context for API requests
 * This must be used within React components
 */
export function useUserContext() {
  const user = useClerkUser();
  
  return {
    userId: user?.id || '',
    userEmail: user?.email || '',
    userName: user?.name || '',
  };
}

/**
 * Create authentication headers with provided token (for API clients)
 */
export function createAuthHeaders(token?: string | null, userContext?: any): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (userContext) {
    headers['X-User-Context'] = JSON.stringify(userContext);
  }

  return headers;
}

/**
 * Enhanced fetch with provided token (for API clients)
 */
export async function authenticatedFetchWithToken(
  url: string, 
  token?: string | null, 
  userContext?: any, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = createAuthHeaders(token, userContext);
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  return fetch(url, config);
}