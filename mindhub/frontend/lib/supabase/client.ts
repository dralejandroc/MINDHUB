/**
 * Supabase Client Configuration
 * Single source of truth for Supabase connection
 */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { handleSupabaseAuthError } from './cleanup'

// Cookie error handler
const handleCookieError = (error: any) => {
  if (typeof window === 'undefined') return false; // Skip on server
  
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
// export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
//   cookies: {
//     get: (name: string) => {
//       if (typeof window === 'undefined') return undefined; // Skip on server
//       try {
//         const cookieValue = document.cookie
//           .split('; ')
//           .find(row => row.startsWith(`${name}=`))
//           ?.split('=')[1];
        
//         if (cookieValue && cookieValue.startsWith('base64-')) {
//           // Handle problematic base64 cookies
//           try {
//             return atob(cookieValue.substring(7)); // Remove 'base64-' prefix
//           } catch {
//             console.warn(`🍪 Invalid base64 cookie detected: ${name}, clearing it`);
//             document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
//             return undefined;
//           }
//         }
//         return cookieValue;
//       } catch (error) {
//         if (handleCookieError(error)) {
//           return undefined;
//         }
//         throw error;
//       }
//     },
//     set: (name: string, value: string, options?: any) => {
//       if (typeof window === 'undefined') return; // Skip on server
//       try {
//         const optionsStr = options 
//           ? Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')
//           : '';
//         document.cookie = `${name}=${value}; path=/; ${optionsStr}`;
//       } catch (error) {
//         handleCookieError(error);
//       }
//     },
//     remove: (name: string, options?: any) => {
//       if (typeof window === 'undefined') return; // Skip on server
//       try {
//         document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
//       } catch (error) {
//         handleCookieError(error);
//       }
//     }
//   }
// })

// SIMPLIFIED: Use default localStorage instead of custom cookie handling
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      // Fuerza localStorage explícitamente
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]}-auth-token`,
      detectSessionInUrl: true,
    },
  }
)

// Auto-refresh and handle session expiration - only run on client
if (typeof window !== 'undefined') {
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
}

// Export createClient function for compatibility
export const createClient = () => supabase

// Helper functions for auth
export const signIn = async (email: string, password: string) => {
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
      const { session } = data || {};
      if (session) {
        console.log('User signed in, token expires at:', new Date(session.expires_at! * 1000));
        localStorage.setItem('mindhub-token', session.access_token);
        localStorage.setItem('mindhub-refresh-token', session.refresh_token);
      }
    
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

// Type for signOut options
export interface SignOutOpts {
  hard?: boolean;
}

export const signOut = async ({ hard = false }: SignOutOpts = {}) => {
  const { error } = await supabase.auth.signOut({ scope: 'global' })

  // 2) Avisar al servidor para que borre cookies HTTP-only (middleware verá que ya no hay sesión)
  try {
    await fetch('/api/auth/callback', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'SIGNED_OUT', session: null }),
    })
  } catch {
    /* no-op */
  }

  // 3) Limpiar almacenamiento del navegador
  try {
    if (typeof window !== 'undefined') {
      // Remueve claves de Supabase/GoTrue y las tuyas si aplica
      const purge = (storage: Storage) => {
        const keys = Object.keys(storage)
        keys.forEach(k => {
          if (
            k.startsWith('sb-') ||               // sb-<project-ref>-auth-token
            k.startsWith('supabase.') ||         // por si el SDK usa prefijos internos
            k.startsWith('gotrue.') ||           // PKCE / estados OAuth
            k.startsWith('mindhub-')             // tus claves propias
          ) {
            storage.removeItem(k)
          }
        })
      }
      purge(localStorage)
      purge(sessionStorage)
    }
  } catch {/* no-op */}

  // 4) Opcional: limpieza “dura” de caches / SW (similar a Cmd+Shift+R)
  if (typeof window !== 'undefined' && hard) {
    try {
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
    } catch {/* no-op */}
  }

  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Current user:', user);
  
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export const resetPassword = async (email: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mindhub.cloud';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })
  return { error }
}

export const signInWithGoogle = async () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mindhub.cloud';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}

export const signUpWithGoogle = async () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mindhub.cloud';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
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