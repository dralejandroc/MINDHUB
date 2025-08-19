/**
 * Supabase Server Utilities
 * Common helper functions for API routes
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServer() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function getAuthenticatedUser() {
  try {
    const supabase = createSupabaseServer()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      // For development - return mock user if no session
      console.log('[Auth] No session found, using mock user for development')
      return {
        id: 'demo-user-123',
        email: 'dr_aleks_c@hotmail.com',
        user_metadata: {
          full_name: 'Dr. Alejandro',
          role: 'doctor'
        }
      }
    }
    
    return session.user
  } catch (error) {
    console.log('[Auth] Error getting session, using mock user:', error)
    // Fallback to mock user on any error
    return {
      id: 'demo-user-123',
      email: 'dr_aleks_c@hotmail.com',
      user_metadata: {
        full_name: 'Dr. Alejandro',
        role: 'doctor'
      }
    }
  }
}

export function createAuthResponse(message = 'Authentication required') {
  return new Response(JSON.stringify({
    success: false,
    error: 'Authentication required',
    message,
    code: 'AUTHENTICATION_REQUIRED'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function createErrorResponse(
  message: string, 
  error?: Error, 
  status = 500
) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    message: error?.message || 'Unknown error',
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function createSuccessResponse(
  data: any, 
  message?: string, 
  status = 200
) {
  return new Response(JSON.stringify({
    success: true,
    data,
    message: message || 'Operation successful',
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}