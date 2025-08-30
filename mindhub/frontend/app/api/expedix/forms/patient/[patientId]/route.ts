// Patient forms API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { patientId: string } }) {
  try {
    console.log('[PATIENT FORMS API] Processing GET request for patient:', params.patientId);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[PATIENT FORMS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    const patientId = params.patientId;
    if (!patientId) {
      return createErrorResponse('Validation error', 'Patient ID is required', 400);
    }

    try {
      // TRY Django backend first
      const backendUrl = `${API_CONFIG.BACKEND_URL}/api/expedix/forms/patient/${patientId}/`;
      console.log('[PATIENT FORMS API] Trying Django backend:', backendUrl);

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
        console.log('[PATIENT FORMS API] Successfully fetched from Django backend');

        return createResponse({
          success: true,
          data: backendData.results || backendData.data || backendData,
          source: 'django_backend'
        });
      } else {
        console.warn('[PATIENT FORMS API] Django backend unavailable, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[PATIENT FORMS API] Django backend failed, using Supabase fallback:', djangoError);

      // FALLBACK: Return consultation templates available for this patient
      console.log('[PATIENT FORMS API] Using Supabase direct connection as fallback');
      
      // First verify the patient exists and get their context
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('id, clinic_id, workspace_id')
        .eq('id', patientId)
        .single();

      if (patientError || !patient) {
        return createErrorResponse(
          'Patient not found',
          'Invalid patient ID or access denied',
          404
        );
      }

      // Get consultation templates available for this patient's context
      let query = supabaseAdmin
        .from('consultation_templates')
        .select(`
          id,
          name,
          description,
          template_type,
          fields_config,
          is_default,
          is_active,
          created_at
        `)
        .eq('is_active', true);

      // Filter by patient's context (dual system)
      if (patient.clinic_id) {
        query = query.eq('clinic_id', patient.clinic_id);
      } else if (patient.workspace_id) {
        query = query.eq('workspace_id', patient.workspace_id);
      }

      const { data: templates, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('[PATIENT FORMS API] Supabase fallback error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[PATIENT FORMS API] Successfully fetched', templates?.length || 0, 'templates from Supabase fallback');

      return createResponse({
        success: true,
        data: templates || [],
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[PATIENT FORMS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch patient forms',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}