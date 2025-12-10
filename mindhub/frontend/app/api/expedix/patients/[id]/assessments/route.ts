import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin';
import { API_CONFIG } from '@/lib/config/api-endpoints';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use centralized backend URL configuration
const DJANGO_BACKEND_URL = API_CONFIG.BACKEND_URL;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: patientId } = params;
    console.log('[PATIENT ASSESSMENTS] Processing GET request for patient assessments:', patientId);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT ASSESSMENTS] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENT ASSESSMENTS] Authenticated user:', user.id, '- Fetching assessments from ClinimetrixPro');

    // Try to get assessments from Django ClinimetrixPro
    let djangoAssessments = [];
    let djangoWorking = true;

    try {
      // Get assessments from Django backend
      const djangoUrl = `${DJANGO_BACKEND_URL}/assessments/api/patient/${patientId}/assessments/`;
      console.log('[PATIENT ASSESSMENTS] Requesting Django assessments from:', djangoUrl);

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
      
      const djangoResponse = await fetch(djangoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Proxy-Auth': 'verified',
          'X-Patient-ID': patientId,
        },
        signal: AbortSignal.timeout(5000)
      });

      console.log('[PATIENT ASSESSMENTS] Django response status:', djangoResponse.status);

      if (djangoResponse.ok) {
        const responseData = await djangoResponse.json();
        djangoAssessments = responseData.results || responseData.assessments || responseData.data || [];
        console.log('[PATIENT ASSESSMENTS] Django success - assessments returned:', djangoAssessments.length);
      } else {
        djangoWorking = false;
        const errorText = await djangoResponse.text();
        console.error('[PATIENT ASSESSMENTS] Django error response:', errorText);
      }

    } catch (djangoError) {
      djangoWorking = false;
      console.error('[PATIENT ASSESSMENTS] Django connection failed:', djangoError);
    }

    // Fallback to Supabase direct query if Django fails
    if (!djangoWorking) {
      console.log('[PATIENT ASSESSMENTS] Django failed - falling back to direct Supabase');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
        console.log('supabase key',supabaseServiceKey);
        
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Query assessments directly from Supabase
        const { data: assessments, error: supabaseError } = await supabase
          .from('clinimetrix_assessments')
          .select(`
            id,
            patient_id,
            template_id,
            status,
            scores,
            created_at,
            completed_at,
            interpretation
          `)
          .eq('patient_id', patientId)
          // .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error('[PATIENT ASSESSMENTS] Supabase fallback error:', supabaseError);
          return createResponse({
            success: true,
            data: {
              assessments: [],
              count: 0,
              source: 'fallback_error'
            }
          });
        }
        
        console.log('[PATIENT ASSESSMENTS] Supabase fallback success - assessments returned:', assessments?.length || 0);
        
        return createResponse({
          success: true,
          data: {
            assessments: assessments || [],
            count: assessments?.length || 0,
            source: 'supabase_direct'
          }
        });

      } catch (supabaseError) {
        console.error('[PATIENT ASSESSMENTS] Supabase fallback completely failed:', supabaseError);
        return createResponse({
          success: true, // Return success for graceful fallback
          data: {
            assessments: [],
            count: 0,
            source: 'graceful_fallback'
          }
        });
      }
    }

    // Return Django assessments
    return createResponse({
      success: true,
      data: {
        assessments: djangoAssessments,
        count: djangoAssessments.length,
        source: 'django'
      }
    });

  } catch (error) {
    console.error('[PATIENT ASSESSMENTS] Unexpected error:', error);
    
    // Graceful fallback - return empty assessments instead of error
    return createResponse({
      success: true,
      data: {
        assessments: [],
        count: 0,
        source: 'error_fallback'
      }
    });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: patientId } = params;
    console.log('[PATIENT ASSESSMENTS] Processing POST request to create assessment for patient:', patientId);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    console.log('[PATIENT ASSESSMENTS] Creating assessment with data:', Object.keys(body));

    // Forward to Django backend for assessment creation
    const djangoUrl = `${DJANGO_BACKEND_URL}/assessments/api/create-from-react/`;
    console.log('[PATIENT ASSESSMENTS] Creating assessment via Django:', djangoUrl);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
    
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify({
        ...body,
        patient_id: patientId,
        created_by: user.id
      })
    });

    console.log('[PATIENT ASSESSMENTS] Django POST response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      console.error('[PATIENT ASSESSMENTS] Django backend POST error:', errorText);
      
      return createErrorResponse(
        'Backend error',
        `Django backend responded with ${djangoResponse.status}`,
        djangoResponse.status
      );
    }

    // Get response data from Django
    const responseData = await djangoResponse.json();
    console.log('[PATIENT ASSESSMENTS] Successfully created assessment via Django');

    return createResponse(responseData, djangoResponse.status);

  } catch (error) {
    console.error('[PATIENT ASSESSMENTS] POST error:', error);
    return createErrorResponse(
      'Failed to create assessment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}