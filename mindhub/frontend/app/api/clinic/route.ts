// Direct Clinic Management API - Supabase Integration
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CLINIC API] Processing GET request for user clinic');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    console.log('[CLINIC API] Authenticated user:', user.id, user.email);

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user's clinic
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('[CLINIC API] Database error:', error);
      return createErrorResponse('Database Error', error.message, 500);
    }

    if (!clinic) {
      console.log('[CLINIC API] No clinic found for user');
      return createResponse({ clinic: null });
    }

    console.log('[CLINIC API] Found clinic:', clinic.name);
    return createResponse({ clinic });

  } catch (error) {
    console.error('[CLINIC API] Error:', error);
    return createErrorResponse(
      'Failed to get clinic',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CLINIC API] Processing POST request to create clinic');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    const body = await request.json();
    console.log('[CLINIC API] Creating clinic with data:', { name: body.name, type: body.clinic_type });

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already has a clinic
    const { data: existingClinic } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('created_by', user.id)
      .single();

    if (existingClinic) {
      return createErrorResponse('Clinic Exists', 'El usuario ya tiene una clínica registrada', 409);
    }

    // Create new clinic
    const { data: newClinic, error } = await supabase
      .from('clinics')
      .insert({
        name: body.name,
        legal_name: body.name,
        subscription_plan: 'individual',
        max_users: 5,
        max_patients: 100,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[CLINIC API] Database error creating clinic:', error);
      return createErrorResponse('Database Error', error.message, 500);
    }

    console.log('[CLINIC API] Clinic created successfully:', newClinic.name);
    return createResponse({ clinic: newClinic }, 201);

  } catch (error) {
    console.error('[CLINIC API] Error creating clinic:', error);
    return createErrorResponse(
      'Failed to create clinic',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[CLINIC API] Processing PUT request to update clinic');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    const body = await request.json();
    console.log('[CLINIC API] Updating clinic with data:', { name: body.name });

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Update user's clinic
    const { data: updatedClinic, error } = await supabase
      .from('clinics')
      .update({
        name: body.name,
        legal_name: body.name,
        updated_at: new Date().toISOString()
      })
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) {
      console.error('[CLINIC API] Database error updating clinic:', error);
      return createErrorResponse('Database Error', error.message, 500);
    }

    if (!updatedClinic) {
      return createErrorResponse('Not Found', 'No se encontró la clínica a actualizar', 404);
    }

    console.log('[CLINIC API] Clinic updated successfully:', updatedClinic.name);
    return createResponse({ clinic: updatedClinic });

  } catch (error) {
    console.error('[CLINIC API] Error updating clinic:', error);
    return createErrorResponse(
      'Failed to update clinic',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}