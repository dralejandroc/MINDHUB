// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    console.log('[Patients API] Processing GET request with Supabase');
    const { searchParams } = new URL(request.url);
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: patients, error, count } = await query;

    if (error) {
      console.error('[Patients API] Supabase error:', error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    console.log(`[Patients API] Successfully retrieved ${patients?.length || 0} patients`);
    
    return createSuccessResponse({
      data: patients || [],
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }, 'Patients retrieved successfully');

  } catch (error) {
    console.error('[Patients API] Error:', error);
    return createErrorResponse('Failed to fetch patients', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Patients API] Processing POST request with Supabase');
    const body = await request.json();
    
    const supabase = createSupabaseServer()
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!body.first_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation error',
        message: 'First name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare patient data
    const patientData = {
      ...body,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert patient
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (error) {
      console.error('[Patients API] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log('[Patients API] Successfully created patient:', patient.id);

    return new Response(JSON.stringify({
      success: true,
      data: patient,
      message: 'Patient created successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Patients API] Error creating patient:', error);
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to create patient',
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}