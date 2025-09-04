// Expedix consultations API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

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
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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

      // FALLBACK: Direct Supabase connection
      console.log('[CONSULTATIONS API] Using Supabase direct connection as fallback');
      
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
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

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
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
        console.log('[CONSULTATIONS API] Successfully created consultation in Django backend:', backendData.id);

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

      // FALLBACK: Direct Supabase creation
      console.log('[CONSULTATIONS API] Using Supabase direct creation as fallback');

      // Get user's workspace/clinic context for dual system
      console.log('[CONSULTATIONS API] Getting user context for dual system...');
      console.log('[CONSULTATIONS API] Tenant headers received:', { tenantId, tenantType });
      
      let clinic_id = null;
      let workspace_id = null;
      
      // First try to use tenant context from headers
      if (tenantType && tenantId) {
        if (tenantType === 'clinic') {
          clinic_id = tenantId;
          console.log('[CONSULTATIONS API] Using clinic context from headers:', tenantId);
        } else if (tenantType === 'workspace') {
          workspace_id = tenantId;
          console.log('[CONSULTATIONS API] Using workspace context from headers:', tenantId);
        }
      } else {
        // Fallback: Check for individual workspace first
        const { data: workspace, error: workspaceError } = await supabaseAdmin
          .from('individual_workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (workspace && !workspaceError) {
          workspace_id = workspace.id;
          console.log('[CONSULTATIONS API] Using workspace context from DB:', workspace.id);
        } else {
          // Check for clinic membership
          const { data: membership, error: membershipError } = await supabaseAdmin
            .from('tenant_memberships')
            .select('clinic_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
          
          if (membership && !membershipError) {
            clinic_id = membership.clinic_id;
            console.log('[CONSULTATIONS API] Using clinic context from DB:', membership.clinic_id);
          } else {
            console.error('[CONSULTATIONS API] No workspace or clinic context found:', {
              workspaceError,
              membershipError,
              userId: user.id,
              tenantHeaders: { tenantId, tenantType }
            });
            
            // Last resort: create individual workspace for this user
            console.log('[CONSULTATIONS API] Creating individual workspace for user:', user.id);
            
            const { data: newWorkspace, error: createError } = await supabaseAdmin
              .from('individual_workspaces')
              .insert({
                id: crypto.randomUUID(),
                owner_id: user.id,
                name: `Workspace - ${user.email || 'Usuario'}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single();
            
            if (newWorkspace && !createError) {
              workspace_id = newWorkspace.id;
              console.log('[CONSULTATIONS API] Created new workspace:', newWorkspace.id);
            } else {
              console.error('[CONSULTATIONS API] Failed to create workspace:', createError);
              return createErrorResponse(
                'Context error',
                'Unable to establish user workspace or clinic context',
                500
              );
            }
          }
        }
      }

      // Prepare consultation data for Supabase - Use consultation_date as timestamp (not consultation_time)
      const consultationDateTime = body.consultation_date 
        ? new Date(body.consultation_date).toISOString() 
        : new Date().toISOString();

      const consultationData = {
        id: crypto.randomUUID(),
        patient_id: body.patient_id,
        professional_id: user.id,
        consultation_date: consultationDateTime, // This is timestamp with time zone in DB
        consultation_type: body.consultation_type || 'general',
        chief_complaint: body.chief_complaint || body.subjective?.substring(0, 500) || '',
        history_present_illness: body.history_present_illness || body.subjective || body.currentCondition || '',
        physical_examination: body.physical_examination || body.objective || body.physicalExamination || '',
        assessment: body.assessment || body.analysis || body.assessment_plan || '',
        plan: body.plan || body.treatment_plan || '',
        notes: body.notes || '',
        status: body.status || 'completed',
        duration_minutes: body.duration_minutes || 60,
        // Dual system context
        clinic_id,
        workspace_id,
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
        console.error('[CONSULTATIONS API] Supabase fallback insert error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CONSULTATIONS API] Successfully created consultation via Supabase fallback:', consultation.id);

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
    const consultationId = url.searchParams.get('id');
    
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
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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

      // FALLBACK: Direct Supabase update
      console.log('[CONSULTATIONS API] Using Supabase direct update as fallback');

      const updateData = {
        ...body,
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