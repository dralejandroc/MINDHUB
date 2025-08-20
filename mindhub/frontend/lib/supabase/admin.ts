// Supabase Admin Client for API Routes
// This client bypasses RLS and should only be used in server-side API routes

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbcpldzoyicefdtnwkd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl) {
  console.error('[SUPABASE] Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  throw new Error('Missing Supabase URL')
}

if (!supabaseServiceKey) {
  console.warn('[SUPABASE] Warning: SUPABASE_SERVICE_ROLE_KEY not configured. Some features may not work.')
}

// Admin client for server-side operations (bypasses RLS)
// Using fallback service key if environment variable not set
const serviceKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ'

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Helper function to get authenticated user from request headers
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  console.log('[AUTH] Checking authentication, authHeader present:', !!authHeader)
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[AUTH] No valid authorization header found')
    return { user: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('[AUTH] Token length:', token.length, 'First 20 chars:', token.substring(0, 20))
  
  // TESTING: Allow service role key for admin testing
  if (serviceKey && token === serviceKey) {
    console.log('[AUTH] Using service role key - admin access granted')
    return { 
      user: { 
        id: 'a2733be9-6292-4381-a594-6fa386052052', // Valid UUID for testing
        email: 'admin@mindhub.com',
        role: 'admin'
      }, 
      error: null 
    }
  }
  
  try {
    // Verify JWT token with Supabase
    console.log('[AUTH] Verifying JWT token with Supabase...')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
      console.error('[AUTH] Supabase auth error:', error.message)
      return { user: null, error: `Supabase error: ${error.message}` }
    }
    
    if (!user) {
      console.error('[AUTH] No user found for token')
      return { user: null, error: 'Invalid token - no user found' }
    }

    console.log('[AUTH] User authenticated successfully:', user.email)
    return { user, error: null }
  } catch (error) {
    console.error('[AUTH] Token verification exception:', error)
    return { user: null, error: 'Token verification failed' }
  }
}

// Helper function to create response with CORS headers
export function createResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Context',
    }
  })
}

// Helper function to handle errors consistently
export function createErrorResponse(error: string, message?: string, status: number = 500) {
  return createResponse({
    success: false,
    error,
    message: message || error,
    timestamp: new Date().toISOString()
  }, status)
}