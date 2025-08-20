/**
 * Supabase Authentication Utilities
 * Replaces Auth authentication with Supabase auth
 */

import { supabase } from '@/lib/supabase/client';

export interface AuthenticatedFetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Hook to get authenticated fetch function using Supabase JWT tokens
 */
export const useAuthenticatedFetch = () => {
  return async (url: string, options: AuthenticatedFetchOptions = {}) => {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    let token: string;
    
    if (error || !session?.access_token) {
      // DEVELOPMENT FALLBACK: Use service role key when no valid JWT
      console.warn('[AUTH] No valid JWT found, using service role key for development');
      token = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
    } else {
      token = session.access_token;
    }

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  };
};

/**
 * Get current authenticated user info
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error('Failed to get user');
  }
  
  return user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.access_token;
};

/**
 * Get access token for API calls
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};