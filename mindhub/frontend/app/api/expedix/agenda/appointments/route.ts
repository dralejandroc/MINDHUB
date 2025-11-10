// Expedix appointments API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { start } from 'repl';

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
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patient_id');
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const appointmentStatus = searchParams.get('appointment_status');

    // NUEVO: parámetro 'patient' para filtrar por nombre/apellidos del paciente
    const patient = (searchParams.get('patient') || '').trim();

    console.log('[APPOINTMENTS API] Query params:', { search, limit, offset, status, patientId, date, appointmentStatus, startDate, endDate, patient });

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
      // .range(offset, offset + limit - 1);
      

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

    if (startDate && endDate) {
      query = query.gte('appointment_date', `${startDate}T00:00:00`).lte('appointment_date', `${endDate}T23:59:59`);
    }

    // === NUEVO: filtro por nombre/apellidos del paciente ===
    if (patient) {
      // Normaliza y divide por espacios para permitir múltiples términos
      const tokens = patient
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      // Requiere que TODOS los tokens aparezcan (AND entre tokens).
      // Para cada token, permitimos coincidencia en cualquiera de los 4 campos (OR entre campos).
      for (const tok of tokens) {
        const pat = `%${tok}%`;
        query = query.or(
          [
            `first_name.ilike.${pat}`,
            `last_name.ilike.${pat}`,
            `paternal_last_name.ilike.${pat}`,
            `maternal_last_name.ilike.${pat}`,
          ].join(','),
          { foreignTable: 'patients' } // <- clave: filtra sobre la tabla relacionada
        );
      }
    }

    // Execute query
    const { data: appointments, error, count } = await query;

    if (error) {
      console.error('[APPOINTMENTS API] Supabase error:', error);
      return createErrorResponse(
        'Database connection failed',
        'Unable to fetch appointments from database',
        503
      );
    }

    console.log('[APPOINTMENTS API] Successfully fetched appointments:', count, 'total');

    // Return real appointments or empty array if none exist
    console.log('[APPOINTMENTS API] Returning appointments:', appointments?.length || 0, 'found');

    return createResponse({
      success: true,
      data: appointments || [],
      total: count || 0,
      limit,
      offset,
      search,
      status,
      patient_id: patientId,
      date,
      appointment_status: appointmentStatus,
      // patient
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

    // Calculate end_time from appointment_time and duration
    const startTime = body.appointment_time; // e.g., "10:30"
    const duration = body.duration || 60; // Default 60 minutes
    
    // Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + (duration * 60000));
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    // Prepare appointment data matching the real table structure
    const appointmentData = {
      id: crypto.randomUUID(),
      patient_id: body.patient_id,
      professional_id: user.id,
      appointment_date: body.appointment_date,
      start_time: startTime,
      end_time: endTime,
      appointment_type: body.appointment_type || 'Consulta',
      status: body.status || 'scheduled',
      reason: body.reason || '',
      notes: body.notes || '',
      confirmation_sent: false,
      reminder_sent: false,
      is_recurring: false,
      // Add dual system support - get user's workspace/clinic context
      workspace_id: null, // Will be set below
      clinic_id: null,    // Will be set below
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get user's workspace/clinic context for dual system
    console.log('[APPOINTMENTS API] Getting user context for dual system...');
    
    // Check for individual workspace first
    const { data: workspace } = await supabaseAdmin
      .from('individual_workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    
    if (workspace) {
      appointmentData.workspace_id = workspace.id;
      console.log('[APPOINTMENTS API] Using workspace context:', workspace.id);
    } else {
      // Check for clinic membership
      const { data: membership } = await supabaseAdmin
        .from('tenant_memberships')
        .select('clinic_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (membership) {
        appointmentData.clinic_id = membership.clinic_id;
        console.log('[APPOINTMENTS API] Using clinic context:', membership.clinic_id);
      } else {
        console.error('[APPOINTMENTS API] No workspace or clinic context found for user');
        return createErrorResponse(
          'Context error',
          'User workspace or clinic context not found',
          400
        );
      }
    }

    // Insert appointment into Supabase with correct field mapping
    console.log('[APPOINTMENTS API] Inserting appointment with data:', appointmentData);
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          paternal_last_name,
          maternal_last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('[APPOINTMENTS API] Supabase insert error:', error);
      return createErrorResponse(
        'Database connection failed',
        'Unable to create appointment in database',
        503
      );
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