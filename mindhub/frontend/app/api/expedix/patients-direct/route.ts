// Direct Supabase endpoint to bypass Django backend temporarily
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

function createSupabaseServerClient() {
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

export async function GET() {
  try {
    console.log('[DIRECT SUPABASE] Fetching patients directly...');
    
    const supabase = createSupabaseServerClient();
    
    // Test direct database connection
    const { data: patients, error } = await supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        created_at,
        clinic_id,
        workspace_id
      `)
      .limit(10);
    
    if (error) {
      console.error('[DIRECT SUPABASE] Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Database query failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[DIRECT SUPABASE] Success! Found', patients?.length || 0, 'patients');
    
    return new Response(JSON.stringify({
      success: true,
      data: patients || [],
      count: patients?.length || 0,
      message: 'Direct Supabase connection working',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[DIRECT SUPABASE] Exception:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}