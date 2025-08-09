/**
 * Clerk Authentication Utilities
 * Utilities for getting Clerk session tokens and user data
 */

import { useAuth } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Get Clerk session token for API calls (client-side)
 */
export async function getClerkToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') {
      return null; // Server-side, use server method
    }

    // Get Clerk's session token
    const { getToken } = useAuth();
    const token = await getToken();
    return token;
  } catch (error) {
    console.error('Error getting Clerk token:', error);
    return null;
  }
}

/**
 * Get Clerk user data for API calls (client-side)
 */
export function getClerkUser() {
  const { user } = useAuth();
  
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
 */
export async function getClerkTokenServer(): Promise<string | null> {
  try {
    const user = await currentUser();
    if (!user) return null;
    
    // For server-side, we'll need to get the session token differently
    // This will be implemented based on Clerk's server-side auth
    return user.id; // Temporary - will be updated with proper server token
  } catch (error) {
    console.error('Error getting Clerk token server-side:', error);
    return null;
  }
}

/**
 * Create authentication headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getClerkToken();
  const userContext = getUserContext();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (userContext.userId) {
    headers['X-User-Context'] = JSON.stringify(userContext);
  }

  return headers;
}

/**
 * Enhanced fetch with automatic Clerk authentication
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  return fetch(url, config);
}

/**
 * Create user context for API requests
 */
export function getUserContext() {
  const user = getClerkUser();
  
  return {
    userId: user?.id || '',
    userEmail: user?.email || '',
    userName: user?.name || '',
  };
}