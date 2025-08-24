// Expedix patients API route - PROXY to Django Backend
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Django backend URL
const DJANGO_BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request - Django Backend Proxy with Supabase Fallback [v2.0]');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Attempting Django backend');
    console.log('[PATIENTS API] User object:', JSON.stringify(user, null, 2));

    // Extract query parameters from original request
    const url = new URL(request.url);
    const queryString = url.search; // Preserva todos los query parameters

    let djangoWorking = true;

    try {
      // Build Django backend URL correctly
      const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${queryString || ''}`;
      console.log('[PATIENTS API] Proxying to Django:', djangoUrl);

      // Get auth token from request 
      const authHeader = request.headers.get('Authorization');
      
      // Forward request to Django backend with service role key for internal auth
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
      
      // Implement timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout to reach fallback faster

      const djangoResponse = await fetch(djangoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Proxy-Auth': 'verified',
          'X-MindHub-Dual-System': 'enabled',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('[PATIENTS API] Django response status:', djangoResponse.status);

      if (djangoResponse.ok) {
        // Django working - return response
        const responseData = await djangoResponse.json();
        const patientCount = responseData.results?.length || responseData.count || 0;
        console.log('[PATIENTS API] Django success - patients returned:', patientCount);
        return createResponse(responseData);
      } else {
        djangoWorking = false;
        const errorText = await djangoResponse.text();
        console.error('[PATIENTS API] Django error response:', errorText);
        console.warn('[PATIENTS API] Django returned error status:', djangoResponse.status);
      }

    } catch (djangoError) {
      djangoWorking = false;
      console.error('[PATIENTS API] Django connection failed:', djangoError);
    }

    // Django failed - use Supabase fallback
    if (!djangoWorking) {
      console.log('[PATIENTS API] Django failed - falling back to direct Supabase');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        console.log('[PATIENTS API] Supabase URL:', supabaseUrl);
        console.log('[PATIENTS API] Service key length:', supabaseServiceKey?.length || 'undefined');
        console.log('[PATIENTS API] Service key start:', supabaseServiceKey?.substring(0, 50) || 'undefined');
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        let patients = null;
        
        // Direct approach - matching the working dual-system-test endpoint structure  
        console.log('[PATIENTS API] Using service role key for direct Supabase access');
        
        // First, try to get all patients and then filter (bypassing potential RLS issues)
        const { data: allPatients, error: allError } = await supabase
          .from('patients')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (allError) {
          console.error('[PATIENTS API] Failed to query patients table:', allError);
          throw new Error(`Supabase query failed: ${allError.message}`);
        }
        
        // Filter to user's patients (based on created_by field)
        const userPatients = allPatients?.filter(p => p.created_by === user.id) || [];
        patients = userPatients;
        
        console.log(`[PATIENTS API] Found ${allPatients?.length || 0} total patients, ${userPatients.length} for user ${user.id}`);
        
        // Error handling is now inside the try-catch above
        if (!patients) {
          console.error('[PATIENTS API] No patients data received');
          return createErrorResponse(
            'Database error',
            'No patients data available',
            500
          );
        }
      
      // Transform data to Django-compatible format with correct field mapping
      const transformedPatients = patients?.map(patient => ({
        id: patient.id,
        first_name: patient.first_name,
        paternal_last_name: patient.paternal_last_name,
        maternal_last_name: patient.maternal_last_name || '',
        birth_date: patient.date_of_birth,  // Correct field from Supabase
        age: patient.age || 0,
        gender: patient.gender,
        email: patient.email,
        cell_phone: patient.phone,  // Map phone to cell_phone
        phone: patient.phone,
        curp: patient.curp,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        postal_code: patient.postal_code,
        consultations_count: 0, // Will be populated by Django backend when available
        created_at: patient.created_at,
        updated_at: patient.updated_at
      })) || [];
      
      console.log('[PATIENTS API] Supabase fallback success - patients returned:', transformedPatients.length);
      
      // Return in Django-compatible format
      return createResponse({
        count: transformedPatients.length,
        results: transformedPatients,
        fallback: true,
        source: 'supabase_direct'
      });
      
      } catch (supabaseFallbackError) {
        console.error('[PATIENTS API] Supabase fallback completely failed:', supabaseFallbackError);
        return createErrorResponse(
          'Database error',
          `Could not retrieve patient data from any source: ${supabaseFallbackError instanceof Error ? supabaseFallbackError.message : 'Unknown error'}`,
          500
        );
      }
    }

    // This should never happen, but just in case
    return createErrorResponse(
      'Backend connection failed',
      'No patient data available - all backends unavailable',
      503
    );

  } catch (error) {
    console.error('[PATIENTS API] Unexpected error:', error);
    
    return createErrorResponse(
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[PATIENTS API] Processing POST request - Django Backend Proxy');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Proxying POST to Django backend');

    // Get request body
    const body = await request.json();
    console.log('[PATIENTS API] Creating patient with data:', Object.keys(body));

    // Build Django backend URL - Django requires trailing slash
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/`;
    console.log('[PATIENTS API] Proxying POST to Django:', djangoUrl);

    // Get auth token from request 
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to Django backend with service role key for internal auth
    // Since we've already validated the user in Next.js, we can use service role for Django
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
    
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`, // Use service role for Django auth
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified', // Indicate this request is pre-authenticated
      },
      body: JSON.stringify(body)
    });

    console.log('[PATIENTS API] Django POST response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      console.error('[PATIENTS API] Django backend POST error:', errorText);
      
      return createErrorResponse(
        'Backend error',
        `Django backend responded with ${djangoResponse.status}`,
        djangoResponse.status
      );
    }

    // Get response data from Django
    const responseData = await djangoResponse.json();
    console.log('[PATIENTS API] Successfully proxied POST to Django, patient created:', responseData.id || 'unknown');

    // Return Django response as-is
    return createResponse(responseData, djangoResponse.status);

  } catch (error) {
    console.error('[PATIENTS API] Proxy POST error:', error);
    return createErrorResponse(
      'Failed to create patient',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}