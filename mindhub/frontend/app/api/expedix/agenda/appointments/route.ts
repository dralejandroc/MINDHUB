// Expedix appointments API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[APPOINTMENTS API] Processing GET request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[APPOINTMENTS API] Authenticated user:', user.id);

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patient_id');
    const date = searchParams.get('date');
    const appointmentStatus = searchParams.get('appointment_status');

    console.log('[APPOINTMENTS API] Query params:', { search, limit, offset, status, patientId, date, appointmentStatus });

    // Build Supabase query
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email,
          phone
        )
      `, { count: 'exact' })
      .order('appointment_date', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters (removed is_active check as column may not exist)
    // Status filtering can be added when schema is updated

    // Filter by patient if specified
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    // Filter by appointment status
    if (appointmentStatus) {
      query = query.eq('status', appointmentStatus);
    }

    // Filter by date if specified
    if (date) {
      query = query.gte('appointment_date', `${date}T00:00:00`).lt('appointment_date', `${date}T23:59:59`);
    }

    // Apply search if provided
    if (search) {
      query = query.or(`notes.ilike.%${search}%,appointment_type.ilike.%${search}%,reason.ilike.%${search}%`);
    }

    // Execute query
    const { data: appointments, error, count } = await query;

    if (error) {
      console.error('[APPOINTMENTS API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[APPOINTMENTS API] Successfully fetched appointments:', count, 'total');

    return createResponse({
      success: true,
      data: appointments,
      total: count,
      limit,
      offset,
      search,
      status,
      patient_id: patientId,
      date,
      appointment_status: appointmentStatus
    });

  } catch (error) {
    console.error('[APPOINTMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch appointments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[APPOINTMENTS API] Processing POST request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[APPOINTMENTS API] Authenticated user:', user.id);

    // Get request body
    const body = await request.json();
    console.log('[APPOINTMENTS API] Creating appointment with data:', Object.keys(body));

    // Validate required fields
    if (!body.patient_id || !body.appointment_date || !body.appointment_time) {
      return createErrorResponse('Validation error', 'patient_id, appointment_date, and appointment_time are required', 400);
    }

    // Prepare appointment data
    const appointmentData = {
      ...body,
      professional_id: user.id,
      status: body.status || 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert appointment into Supabase
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('[APPOINTMENTS API] Supabase insert error:', error);
      
      // Handle specific errors
      if (error.code === '23503') { // Foreign key violation
        return createErrorResponse('Invalid data', 'Patient not found or invalid references', 400);
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[APPOINTMENTS API] Successfully created appointment:', appointment.id);

    return createResponse({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    }, 201);

  } catch (error) {
    console.error('[APPOINTMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to create appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[APPOINTMENTS API] Processing PUT request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return createErrorResponse('Validation error', 'Appointment ID is required', 400);
    }

    // Prepare update data
    const appointmentUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Update appointment in Supabase
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(appointmentUpdateData)
      .eq('id', id)
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('[APPOINTMENTS API] Supabase update error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[APPOINTMENTS API] Successfully updated appointment:', appointment.id);

    return createResponse({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('[APPOINTMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to update appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}