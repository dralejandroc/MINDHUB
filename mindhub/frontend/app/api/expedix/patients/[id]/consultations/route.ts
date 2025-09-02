// Expedix Patient Consultations API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    console.log('[PATIENT CONSULTATIONS API] Processing GET request for patient:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT CONSULTATIONS API] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[PATIENT CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status') || 'active';

    console.log('[PATIENT CONSULTATIONS API] Query params:', { search, limit, offset, status });

    try {
      // TRY Django backend first
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (limit) queryParams.append('limit', limit);
      if (offset) queryParams.append('offset', offset);
      if (status) queryParams.append('status', status);
      queryParams.append('patient_id', params.id);

      const backendUrl = `${API_CONFIG.BACKEND_URL}/api/expedix/consultations/?${queryParams.toString()}`;
      console.log('[PATIENT CONSULTATIONS API] Trying Django backend:', backendUrl);

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
        console.log('[PATIENT CONSULTATIONS API] Successfully fetched from Django backend:', backendData.count || backendData.length, 'consultations');

        return createResponse({
          success: true,
          data: backendData.results || backendData.data || backendData,
          total: backendData.count || backendData.total || (backendData.results?.length || 0),
          limit: parseInt(limit),
          offset: parseInt(offset),
          search,
          status,
          patient_id: params.id,
          source: 'django_backend'
        });
      } else {
        console.warn('[PATIENT CONSULTATIONS API] Django backend unavailable, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[PATIENT CONSULTATIONS API] Django backend failed, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase connection
      console.log('[PATIENT CONSULTATIONS API] Using Supabase direct connection as fallback');
      
      // Build Supabase query - specifically for patient consultations
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
        .eq('patient_id', params.id) // Filter by specific patient
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply search if provided
      if (search) {
        query = query.or(`chief_complaint.ilike.%${search}%,history_present_illness.ilike.%${search}%,assessment.ilike.%${search}%`);
      }

      // Execute query
      const { data: consultations, error, count } = await query;

      if (error) {
        console.error('[PATIENT CONSULTATIONS API] Supabase fallback error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[PATIENT CONSULTATIONS API] Successfully fetched from Supabase fallback:', count, 'consultations for patient:', params.id);

      return createResponse({
        success: true,
        data: consultations || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        status,
        patient_id: params.id,
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[PATIENT CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch patient consultations',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    console.log('[PATIENT CONSULTATIONS API] Processing POST request for patient:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT CONSULTATIONS API] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[PATIENT CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    const body = await request.json();
    // Force patient_id to match route parameter
    body.patient_id = params.id;
    
    console.log('[PATIENT CONSULTATIONS API] Creating consultation for patient:', params.id, 'with data:', Object.keys(body));

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
        console.log('[PATIENT CONSULTATIONS API] Successfully created consultation in Django backend:', backendData.id);

        return createResponse({
          success: true,
          data: backendData,
          message: 'Patient consultation created successfully',
          source: 'django_backend'
        }, 201);
      } else {
        console.warn('[PATIENT CONSULTATIONS API] Django backend unavailable for POST, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[PATIENT CONSULTATIONS API] Django backend failed for POST, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase creation
      console.log('[PATIENT CONSULTATIONS API] Using Supabase direct creation as fallback');

      // Get user's workspace/clinic context for dual system
      console.log('[PATIENT CONSULTATIONS API] Getting user context for dual system...');
      
      // Check for individual workspace first
      const { data: workspace } = await supabaseAdmin
        .from('individual_workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      let clinic_id = null;
      let workspace_id = null;
      
      if (workspace) {
        workspace_id = workspace.id;
        console.log('[PATIENT CONSULTATIONS API] Using workspace context:', workspace.id);
      } else {
        // Check for clinic membership
        const { data: membership } = await supabaseAdmin
          .from('tenant_memberships')
          .select('clinic_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        
        if (membership) {
          clinic_id = membership.clinic_id;
          console.log('[PATIENT CONSULTATIONS API] Using clinic context:', membership.clinic_id);
        } else {
          console.error('[PATIENT CONSULTATIONS API] No workspace or clinic context found for user');
          return createErrorResponse(
            'Context error',
            'User workspace or clinic context not found',
            400
          );
        }
      }

      // Prepare consultation data for Supabase - Use consultation_date as timestamp (not consultation_time)
      const consultationDateTime = body.consultation_date 
        ? new Date(body.consultation_date).toISOString() 
        : new Date().toISOString();

      const consultationData = {
        id: crypto.randomUUID(),
        patient_id: params.id, // Ensure patient_id matches route param
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
        console.error('[PATIENT CONSULTATIONS API] Supabase fallback insert error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[PATIENT CONSULTATIONS API] Successfully created consultation via Supabase fallback:', consultation.id);

      return createResponse({
        success: true,
        data: consultation,
        message: 'Patient consultation created successfully (fallback)',
        source: 'supabase_fallback'
      }, 201);
    }

  } catch (error) {
    console.error('[PATIENT CONSULTATIONS API] Error creating patient consultation:', error);
    return createErrorResponse(
      'Failed to create patient consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}