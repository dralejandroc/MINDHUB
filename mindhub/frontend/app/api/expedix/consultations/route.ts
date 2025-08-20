// Expedix consultations API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing GET request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CONSULTATIONS API] Authenticated user:', user.id);

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patient_id');

    console.log('[CONSULTATIONS API] Query params:', { search, limit, offset, status, patientId });

    // Build Supabase query
    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters (removed is_active check as column doesn't exist)
    // Status filtering can be added when schema is updated

    // Filter by patient if specified
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    // Apply search if provided
    if (search) {
      query = query.or(`consultation_notes.ilike.%${search}%,diagnosis.ilike.%${search}%,treatment_plan.ilike.%${search}%`);
    }

    // Execute query
    const { data: consultations, error, count } = await query;

    if (error) {
      console.error('[CONSULTATIONS API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CONSULTATIONS API] Successfully fetched consultations:', count, 'total');

    return createResponse({
      success: true,
      data: consultations,
      total: count,
      limit,
      offset,
      search,
      status,
      patient_id: patientId
    });

  } catch (error) {
    console.error('[CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch consultations',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing POST request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CONSULTATIONS API] Authenticated user:', user.id);

    // Get request body
    const body = await request.json();
    console.log('[CONSULTATIONS API] Creating consultation with data:', Object.keys(body));

    // Validate required fields
    if (!body.patient_id || !body.consultation_date) {
      return createErrorResponse('Validation error', 'patient_id and consultation_date are required', 400);
    }

    // Prepare consultation data
    const consultationData = {
      ...body,
      professional_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert consultation into Supabase
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert(consultationData)
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('[CONSULTATIONS API] Supabase insert error:', error);
      
      // Handle specific errors
      if (error.code === '23503') { // Foreign key violation
        return createErrorResponse('Invalid data', 'Patient not found or invalid references', 400);
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CONSULTATIONS API] Successfully created consultation:', consultation.id);

    return createResponse({
      success: true,
      data: consultation,
      message: 'Consultation created successfully'
    }, 201);

  } catch (error) {
    console.error('[CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to create consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}