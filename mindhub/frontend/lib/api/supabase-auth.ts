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
    // Get current user (more secure than getSession)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[AUTH] No valid user found - user must be authenticated');
      throw new Error('Authentication required. Please log in.');
    }
    
    // Get session for access token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('[AUTH] No valid session found - user must be authenticated');
      throw new Error('Authentication required. Please log in.');
    }
    
    const token = session.access_token;

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
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

/**
 * Get access token for API calls
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};