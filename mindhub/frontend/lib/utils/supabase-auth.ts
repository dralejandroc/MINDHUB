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
    
    if (error || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Add Authorization header with Supabase JWT
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${session.access_token}`);
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