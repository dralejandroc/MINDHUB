// Expedix patients API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id);

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';

    console.log('[PATIENTS API] Query params:', { search, limit, offset, status });

    // Build Supabase query
    let query = supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply search if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,paternal_last_name.ilike.%${search}%,maternal_last_name.ilike.%${search}%`);
    }

    // Execute query
    const { data: patients, error, count } = await query;

    if (error) {
      console.error('[PATIENTS API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[PATIENTS API] Successfully fetched patients:', count, 'total');

    return createResponse({
      success: true,
      data: patients,
      total: count,
      limit,
      offset,
      search,
      status
    });

  } catch (error) {
    console.error('[PATIENTS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch patients',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[PATIENTS API] Processing POST request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id);

    // Get request body
    const body = await request.json();
    console.log('[PATIENTS API] Creating patient with data:', Object.keys(body));

    // Validate required fields
    if (!body.first_name || !body.last_name) {
      return createErrorResponse('Validation error', 'first_name and last_name are required', 400);
    }

    // Prepare patient data
    const patientData = {
      ...body,
      assigned_professional_id: user.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert patient into Supabase
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert(patientData)
      .select()
      .single();

    if (error) {
      console.error('[PATIENTS API] Supabase insert error:', error);
      
      // Handle specific errors
      if (error.code === '23505') { // Unique constraint violation
        return createErrorResponse('Duplicate data', 'Patient with this email already exists', 409);
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[PATIENTS API] Successfully created patient:', patient.id);

    return createResponse({
      success: true,
      data: patient,
      message: 'Patient created successfully'
    }, 201);

  } catch (error) {
    console.error('[PATIENTS API] Error:', error);
    return createErrorResponse(
      'Failed to create patient',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}