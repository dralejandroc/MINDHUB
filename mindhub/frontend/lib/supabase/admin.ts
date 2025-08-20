// Supabase Admin Client for API Routes
// This client bypasses RLS and should only be used in server-side API routes

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Helper function to get authenticated user from request headers
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // TESTING: Allow service role key for admin testing
  if (token === supabaseServiceKey) {
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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid token' }
    }

    return { user, error: null }
  } catch (error) {
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