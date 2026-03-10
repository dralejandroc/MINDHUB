// Expedix consultations API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'
import { resolveTenantContext, withTenantContext, addConsultationTenantContext, getUserProfile } from '@/lib/tenant-resolver'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing GET request - Django Backend with Supabase Fallback');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patient_id');

    console.log('[CONSULTATIONS API] Query params:', { search, limit, offset, status, patientId });

    try {
      // TRY Django backend first
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (limit) queryParams.append('limit', limit);
      if (offset) queryParams.append('offset', offset);
      if (status) queryParams.append('status', status);
      if (patientId) queryParams.append('patient_id', patientId);

      const backendUrl = `${API_CONFIG.BACKEND_URL}/api/expedix/consultations/?${queryParams.toString()}`;
      console.log('[CONSULTATIONS API] Trying Django backend:', backendUrl);

      const backendResponse = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('RESPONSE', backendData);
        console.log('[CONSULTATIONS API] Successfully fetched from Django backend:', backendData.count || backendData.length, 'consultations');

        return createResponse({
          success: true,
          data: backendData.results || backendData.data || backendData,
          total: backendData.count || backendData.total || (backendData.results?.length || 0),
          limit: parseInt(limit),
          offset: parseInt(offset),
          search,
          status,
          patient_id: patientId,
          source: 'django_backend'
        });
      } else {
        console.warn('[CONSULTATIONS API] Django backend unavailable, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CONSULTATIONS API] Django backend failed, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase connection with tenant filtering
      console.log('[CONSULTATIONS API] Using Supabase direct connection as fallback');
      
      // Resolve tenant context for proper filtering
      const tenantContext = await resolveTenantContext(user.id);
      console.log('[CONSULTATIONS API] Resolved tenant context for query:', tenantContext);
      
      // Build Supabase query with tenant filtering
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
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply tenant filtering based on simplified context
      if (tenantContext.clinic_id) {
        query = query.eq('clinic_id', true);
      } else {
        query = query.eq('user_id', tenantContext.user_id);
      }

      // Filter by patient if specified
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      // Apply search if provided
      if (search) {
        query = query.or(`chief_complaint.ilike.%${search}%,history_present_illness.ilike.%${search}%,assessment.ilike.%${search}%`);
      }

      // Execute query
      const { data: consultations, error, count } = await query;

      if (error) {
        console.error('[CONSULTATIONS API] Supabase fallback error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CONSULTATIONS API] Successfully fetched from Supabase fallback:', count, 'total consultations');

      return createResponse({
        success: true,
        data: consultations || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        status,
        patient_id: patientId,
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch consultations',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// Auto-create an appointment for a consultation when none is linked yet.
// Returns the new appointment id, or null if creation failed (non-blocking).
async function autoCreateAppointmentForConsultation(
  consultationId: string,
  patientId: string,
  userId: string,
  consultationDate: string,
  consultationType: string,
  reason: string
): Promise<string | null> {
  try {
    // If consultationDate is just YYYY-MM-DD, use it directly to avoid timezone drift.
    // If it contains a time component (T...), extract both the date and time parts.
    let appointmentDate: string;
    let startTime: string;
    let endTime: string;

    if (consultationDate.includes('T') || consultationDate.includes(' ')) {
      const dt = new Date(consultationDate);
      appointmentDate = dt.toISOString().split('T')[0];
      const h = dt.getUTCHours();
      const m = dt.getUTCMinutes();
      startTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const endH = h + 1 >= 24 ? 23 : h + 1;
      endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else {
      // Plain YYYY-MM-DD — use the current server time for start/end, keep the date as-is
      appointmentDate = consultationDate;
      const now = new Date();
      const h = now.getUTCHours();
      const m = now.getUTCMinutes();
      startTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const endH = h + 1 >= 24 ? 23 : h + 1;
      endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Resolve workspace/clinic context (same pattern as appointments POST)
    let workspaceId: string | null = null;
    let clinicId: string | null = null;

    const { data: workspace } = await supabaseAdmin
      .from('individual_workspaces')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (workspace) {
      workspaceId = workspace.id;
    } else {
      const { data: membership } = await supabaseAdmin
        .from('tenant_memberships')
        .select('clinic_id')
        .eq('user_id', userId)
        .limit(1)
        .single();
      if (membership) {
        clinicId = membership.clinic_id;
      }
    }

    // workspace/clinic are nullable — proceed even if neither is found
    if (!workspaceId && !clinicId) {
      console.warn('[CONSULTATIONS API] auto-appointment: no workspace/clinic context found, creating appointment without tenant context');
    }

    const appointmentId = crypto.randomUUID();
    const { error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        id: appointmentId,
        patient_id: patientId,
        professional_id: userId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        appointment_type: consultationType || 'Consulta',
        status: 'in_progress',
        reason: reason || '',
        notes: '',
        confirmation_sent: false,
        reminder_sent: false,
        is_recurring: false,
        workspace_id: workspaceId,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (apptError) {
      console.error('[CONSULTATIONS API] auto-appointment insert error:', apptError.message);
      return null;
    }

    // Link back the appointment to the consultation
    await supabaseAdmin
      .from('consultations')
      .update({ linked_appointment_id: appointmentId, updated_at: new Date().toISOString() })
      .eq('id', consultationId);

    console.log('[CONSULTATIONS API] Auto-created appointment:', appointmentId, 'linked to consultation:', consultationId);
    return appointmentId;
  } catch (err) {
    console.error('[CONSULTATIONS API] auto-appointment unexpected error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing POST request - Django Backend with Supabase Fallback');

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[CONSULTATIONS API] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    const body = await request.json();
    console.log('[CONSULTATIONS API] Creating consultation with data:', Object.keys(body));

    // Validate required fields
    if (!body.patient_id) {
      return createErrorResponse('Validation error', 'patient_id is required', 400);
    }

    try {
      // TRY Django backend first
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        const consultationId = backendData.id || backendData.data?.id;
        console.log('[CONSULTATIONS API] Successfully created consultation in Django backend:', consultationId);

        // Note: "Próxima Cita" appointment scheduling is handled by the frontend after save

        return createResponse({
          success: true,
          data: backendData,
          message: 'Consultation created successfully',
          source: 'django_backend'
        }, 201);
      } else {
        console.warn('[CONSULTATIONS API] Django backend unavailable for POST, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CONSULTATIONS API] Django backend failed for POST, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase creation with consultation-specific tenant resolver
      console.log('[CONSULTATIONS API] Using Supabase direct creation with consultation tenant resolver');

      // Get user profile to ensure we have clinic_id
      const userProfile = await getUserProfile(user.id);
      console.log('[CONSULTATIONS API] User profile:', userProfile);

      // Use the unified tenant resolver - this NEVER fails
      const tenantContext = await resolveTenantContext(user.id);
      console.log('[CONSULTATIONS API] Resolved tenant context:', tenantContext);

      // Prepare consultation data with unified tenant context
      // Store the date as-is to avoid UTC midnight timezone shift (YYYY-MM-DD stays YYYY-MM-DD)
      const consultationDateTime = body.consultation_date || new Date().toISOString();

      const baseConsultationData = {
        id: crypto.randomUUID(),
        patient_id: body.patient_id,
        professional_id: user.id,
        consultation_date: consultationDateTime,
        consultation_type: body.consultation_type || 'general',
        chief_complaint: body.chief_complaint || body.subjective?.substring(0, 500) || '',
        history_present_illness: body.history_present_illness || body.subjective || body.currentCondition || '',
        physical_examination: body.physical_examination || body.objective || body.physicalExamination || '',
        assessment: body.assessment || body.analysis || body.assessment_plan || '',
        plan: body.plan || body.treatment_plan || '',
        notes: body.notes || '',
        status: body.status || 'completed',
        duration_minutes: body.duration_minutes || 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add consultation-specific tenant context (ensures clinic_id is always present)
      const consultationData = addConsultationTenantContext(baseConsultationData, tenantContext);

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
        console.error('[CONSULTATIONS API] Supabase fallback insert error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CONSULTATIONS API] Successfully created consultation via Supabase fallback:', consultation.id);

      // Note: "Próxima Cita" appointment scheduling is handled by the frontend after save

      return createResponse({
        success: true,
        data: consultation,
        message: 'Consultation created successfully (fallback)',
        source: 'supabase_fallback'
      }, 201);
    }

  } catch (error) {
    console.error('[CONSULTATIONS API] Error creating consultation:', error);
    return createErrorResponse(
      'Failed to create consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing PUT request - Django Backend with Supabase Fallback');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const consultationId = url.searchParams.get('consultation_id');
    
    if (!consultationId) {
      return createErrorResponse('Validation error', 'Consultation ID is required', 400);
    }

    const body = await request.json();
    console.log('[CONSULTATIONS API] Updating consultation:', consultationId, 'with tenant context:', { tenantId, tenantType });

    try {
      // TRY Django backend first
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultations/${consultationId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('[CONSULTATIONS API] Successfully updated consultation in Django backend:', backendData.id);

        return createResponse({
          success: true,
          data: backendData,
          message: 'Consultation updated successfully',
          source: 'django_backend'
        });
      } else {
        console.warn('[CONSULTATIONS API] Django backend unavailable for PUT, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CONSULTATIONS API] Django backend failed for PUT, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase update — only include real DB columns
      console.log('[CONSULTATIONS API] Using Supabase direct update as fallback');

      // Only columns confirmed to exist in the real Supabase consultations table
      const ALLOWED_COLUMNS = new Set([
        'patient_id', 'professional_id', 'consultation_date', 'consultation_type',
        'chief_complaint', 'history_present_illness', 'physical_examination',
        'assessment', 'plan', 'diagnosis', 'notes', 'clinical_notes', 'private_notes',
        'mental_exam', 'vital_signs', 'prescriptions', 'follow_up_instructions',
        'status', 'is_draft', 'is_finalized', 'template_config', 'form_customizations',
        'consultation_metadata', 'sections_completed', 'linked_assessments',
        'linked_appointment_id', 'additional_instructions', 'current_condition',
        'evaluations', 'next_appointment', 'diagnoses', 'indications',
        'treatment_plan', 'edited_by', 'edit_reason', 'duration_minutes',
        'is_billable', 'updated_at',
        // Extended clinical columns — present if DB was migrated
        'sintomatologia_actual', 'historia_personal', 'antecedentes_psiquiatricos',
        'historia_riesgo', 'uso_sustancias', 'antecedentes_medicos',
        'antecedentes_heredofamiliares', 'historia_personal_social', 'plan_manejo',
        'analisis_conclusiones', 'formulacion_caso', 'estado_inicio',
        'contenido_sesion', 'otros_campos', 'red_apoyo', 'intervencion_crisis',
      ]);

      const filteredBody = Object.fromEntries(
        Object.entries(body).filter(([key]) => ALLOWED_COLUMNS.has(key))
      );

      const updateData = {
        ...filteredBody,
        updated_at: new Date().toISOString()
      };

      const { data: consultation, error } = await supabaseAdmin
        .from('consultations')
        .update(updateData)
        .eq('id', consultationId)
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
        console.error('[CONSULTATIONS API] Supabase fallback update error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CONSULTATIONS API] Successfully updated consultation via Supabase fallback:', consultation.id);

      return createResponse({
        success: true,
        data: consultation,
        message: 'Consultation updated successfully (fallback)',
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[CONSULTATIONS API] Error updating consultation:', error);
    return createErrorResponse(
      'Failed to update consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const consultationId = url.searchParams.get('consultation_id');
    const action = url.searchParams.get('action');

    if (!consultationId) {
      return createErrorResponse('Validation error', 'Consultation ID is required', 400);
    }

    try {
      // Call Django finalize_consultation action
      const djangoUrl = action === 'finalize'
        ? `${API_CONFIG.BACKEND_URL}/api/expedix/consultations/${consultationId}/finalize_consultation/`
        : `${API_CONFIG.BACKEND_URL}/api/expedix/consultations/${consultationId}/`;

      const backendResponse = await fetch(djangoUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        return createResponse({ success: true, data: backendData, source: 'django_backend' });
      } else {
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CONSULTATIONS API] Django backend failed for PATCH:', djangoError);
      // Fallback: update via Supabase directly
      const { error } = await supabaseAdmin
        .from('consultations')
        .update({ is_finalized: true, is_draft: false, status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', consultationId);

      if (error) {
        return createErrorResponse('Database error', error.message, 500);
      }
      return createResponse({ success: true, data: { id: consultationId, is_finalized: true }, source: 'supabase_fallback' });
    }
  } catch (error) {
    return createErrorResponse('Failed to finalize consultation', error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing DELETE request - Django Backend with Supabase Fallback');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const consultationId = url.searchParams.get('consultation_id');
    
    if (!consultationId) {
      return createErrorResponse('Validation error', 'Consultation ID is required', 400);
    }

    console.log('[CONSULTATIONS API] Deleting consultation:', consultationId, 'with tenant context:', { tenantId, tenantType });

    try {
      // TRY Django backend first
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultations/${consultationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        console.log('[CONSULTATIONS API] Successfully deleted consultation in Django backend:', consultationId);

        return createResponse({
          success: true,
          message: 'Consultation deleted successfully',
          source: 'django_backend'
        });
      } else {
        console.warn('[CONSULTATIONS API] Django backend unavailable for DELETE, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CONSULTATIONS API] Django backend failed for DELETE, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase deletion
      console.log('[CONSULTATIONS API] Using Supabase direct deletion as fallback');

      const { error } = await supabaseAdmin
        .from('consultations')
        .delete()
        .eq('id', consultationId);

      if (error) {
        console.error('[CONSULTATIONS API] Supabase fallback delete error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CONSULTATIONS API] Successfully deleted consultation via Supabase fallback:', consultationId);

      return createResponse({
        success: true,
        message: 'Consultation deleted successfully (fallback)',
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[CONSULTATIONS API] Error deleting consultation:', error);
    return createErrorResponse(
      'Failed to delete consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}