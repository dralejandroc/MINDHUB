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
      // No valid JWT - user needs to login
      console.error('[AUTH] No valid JWT found - user must be authenticated');
      throw new Error('Authentication required. Please log in.');
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