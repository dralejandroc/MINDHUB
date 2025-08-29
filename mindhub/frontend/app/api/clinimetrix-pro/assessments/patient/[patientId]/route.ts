// ClinimetrixPro patient assessments API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Processing GET request - Django Backend with Supabase Fallback for patient:', patientId);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status');
    const templateId = searchParams.get('template_id');

    console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Query params:', { limit, offset, status, templateId });

    try {
      // TRY Django backend first
      const queryParams = new URLSearchParams();
      queryParams.append('patient_id', patientId);
      if (limit) queryParams.append('limit', limit);
      if (offset) queryParams.append('offset', offset);
      if (status) queryParams.append('status', status);
      if (templateId) queryParams.append('template_id', templateId);

      const backendUrl = `${API_CONFIG.BACKEND_URL}/api/clinimetrix/assessments/?${queryParams.toString()}`;
      console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Trying Django backend:', backendUrl);

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
        console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Successfully fetched from Django backend:', backendData.count || backendData.length, 'assessments');

        return createResponse({
          success: true,
          data: backendData.results || backendData.data || backendData,
          total: backendData.count || backendData.total || (backendData.results?.length || 0),
          limit: parseInt(limit),
          offset: parseInt(offset),
          status,
          template_id: templateId,
          patient_id: patientId,
          source: 'django_backend'
        });
      } else {
        console.warn('[CLINIMETRIX PATIENT ASSESSMENTS API] Django backend unavailable, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[CLINIMETRIX PATIENT ASSESSMENTS API] Django backend failed, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase connection
      console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Using Supabase direct connection as fallback');
      
      // Build Supabase query for patient assessments
      let query = supabaseAdmin
        .from('clinimetrix_assessments')
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
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      // Execute query
      const { data: assessments, error, count } = await query;

      if (error) {
        console.error('[CLINIMETRIX PATIENT ASSESSMENTS API] Supabase fallback error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[CLINIMETRIX PATIENT ASSESSMENTS API] Successfully fetched from Supabase fallback:', count, 'total assessments');

      // Transform data to include patient metadata
      const transformedAssessments = assessments?.map(assessment => ({
        ...assessment,
        patient_full_name: `${assessment.patients?.first_name || ''} ${assessment.patients?.paternal_last_name || ''} ${assessment.patients?.maternal_last_name || ''}`.trim()
      })) || [];

      return createResponse({
        success: true,
        data: transformedAssessments,
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        template_id: templateId,
        patient_id: patientId,
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[CLINIMETRIX PATIENT ASSESSMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch patient assessments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}