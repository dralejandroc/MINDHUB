/**
 * Authenticated fetch utility for API requests with Supabase JWT
 */

import { supabase } from '@/lib/supabase/client';

export async function authFetch(url: string, options: RequestInit = {}) {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Add authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    };

    // Make the request with auth headers
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
}

/**
 * Convenience method for GET requests
 */
export async function authGet(url: string) {
  return authFetch(url, { method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function authPost(url: string, data?: any) {
  return authFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function authPut(url: string, data?: any) {
  return authFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function authDelete(url: string) {
  return authFetch(url, { method: 'DELETE' });
}