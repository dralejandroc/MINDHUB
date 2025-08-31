// Setup user profile for clinic_id context
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

export async function POST() {
  try {
    console.log('[SETUP USER PROFILE] Creating profile for dr_aleks_c...');
    
    const supabase = createSupabaseServerClient();
    
    // Create or update profile for dr_aleks_c
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: '0bd9f9ed-f768-4dbd-8c83-037552a48f9c', // dr_aleks_c ID
        email: 'dr_aleks_c@hotmail.com',
        first_name: 'Dr. Alejandro',
        last_name: 'Constante',
        license_type: 'clinic',
        clinic_id: 1,
        clinic_role: 'admin',
        individual_workspace_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('[SETUP USER PROFILE] Profile error:', profileError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create profile',
        details: profileError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[SETUP USER PROFILE] Profile created successfully:', profile);

    return new Response(JSON.stringify({
      success: true,
      message: 'User profile created successfully',
      profile: profile,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SETUP USER PROFILE] Exception:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Setup failed',
      details: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}