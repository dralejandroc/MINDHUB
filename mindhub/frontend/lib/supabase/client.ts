/**
 * Supabase Client Configuration
 * Single source of truth for Supabase connection
 */

import { createBrowserClient } from '@supabase/ssr'
import { handleSupabaseAuthError } from './cleanup'

// Cookie error handler
const handleCookieError = (error: any) => {
  if (error?.message?.includes('Unexpected token') || 
      error?.message?.includes('base64-eyJ') ||
      error?.message?.includes('not valid JSON')) {
    console.warn('🍪 Cookie parsing error detected, clearing problematic cookies');
    // Clear Supabase-related cookies that might be corrupted
    const cookiesToClear = ['sb-jvbcpldzoyicefdtnwkd-auth-token', 'supabase-auth-token', 'sb-access-token', 'sb-refresh-token'];
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    });
    return true; // Indicates error was handled
  }
  return false;
}

// Environment variables with fallbacks - using the current production anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbcpldzoyicefdtnwkd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM2MTcwOTEsImV4cCI6MjAwOTE5MzA5MX0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single supabase client for interacting with your database
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get: (name: string) => {
      try {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        
        if (cookieValue && cookieValue.startsWith('base64-')) {
          // Handle problematic base64 cookies
          try {
            return atob(cookieValue.substring(7)); // Remove 'base64-' prefix
          } catch {
            console.warn(`🍪 Invalid base64 cookie detected: ${name}, clearing it`);
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            return undefined;
          }
        }
        return cookieValue;
      } catch (error) {
        if (handleCookieError(error)) {
          return undefined;
        }
        throw error;
      }
    },
    set: (name: string, value: string, options?: any) => {
      try {
        const optionsStr = options 
          ? Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')
          : '';
        document.cookie = `${name}=${value}; path=/; ${optionsStr}`;
      } catch (error) {
        handleCookieError(error);
      }
    },
    remove: (name: string, options?: any) => {
      try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      } catch (error) {
        handleCookieError(error);
      }
    }
  }
})

// Auto-refresh and handle session expiration
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 JWT token refreshed successfully')
  }
  
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    console.log('🚪 User signed out or token expired')
    // Clear any local storage or cached data if needed
    localStorage.removeItem('mindhub-user-preferences')
  }
  
  if (event === 'SIGNED_IN' && session) {
    console.log('🔐 User signed in, token expires at:', new Date(session.expires_at! * 1000))
  }
})

// Export createClient function for compatibility
export const createClient = () => supabase

// Helper functions for auth
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      handleSupabaseAuthError(error)
    }
    
    return { data, error }
  } catch (error) {
    handleSupabaseAuthError(error)
    throw error
  }
}

export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}

export const signUpWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

export const updateUserEmail = async (newEmail: string) => {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })
  return { data, error }
}