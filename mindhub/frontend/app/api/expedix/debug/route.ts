// Debug endpoint to test Expedix API chain
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing Expedix API chain...');
    
    // Test 1: Environment variables
    const frontendSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const frontendAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const djangoUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';
    
    console.log('🔍 Environment check:', {
      supabaseUrl: !!frontendSupabaseUrl,
      anonKey: !!frontendAnonKey,
      serviceKey: !!serviceRoleKey,
      djangoUrl
    });
    
    // Test 2: Try Django backend direct
    let djangoTest = null;
    try {
      const djangoResponse = await fetch(`${djangoUrl}/api/expedix/debug-auth/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      djangoTest = {
        status: djangoResponse.status,
        ok: djangoResponse.ok,
        data: djangoResponse.ok ? await djangoResponse.json() : await djangoResponse.text()
      };
    } catch (djangoError) {
      djangoTest = {
        error: djangoError instanceof Error ? djangoError.message : 'Unknown error'
      };
    }
    
    // Test 3: Try authenticated Django call
    let authenticatedTest = null;
    try {
      const authHeader = request.headers.get('Authorization');
      const authenticatedResponse = await fetch(`${djangoUrl}/api/expedix/patients/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-User-ID': 'test-user',
          'X-User-Email': 'test@example.com',
          'X-Proxy-Auth': 'verified',
        }
      });
      authenticatedTest = {
        status: authenticatedResponse.status,
        ok: authenticatedResponse.ok,
        data: authenticatedResponse.ok ? await authenticatedResponse.json() : await authenticatedResponse.text()
      };
    } catch (authError) {
      authenticatedTest = {
        error: authError instanceof Error ? authError.message : 'Unknown error'
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug_results: {
        environment: {
          supabase_url_configured: !!frontendSupabaseUrl,
          anon_key_configured: !!frontendAnonKey,
          service_key_configured: !!serviceRoleKey,
          django_url: djangoUrl
        },
        django_direct_test: djangoTest,
        django_authenticated_test: authenticatedTest,
        request_headers: {
          authorization: !!request.headers.get('Authorization'),
          user_agent: request.headers.get('User-Agent'),
          host: request.headers.get('Host')
        }
      }
    });
    
  } catch (error) {
    console.error('🔍 DEBUG endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}