// Prevent static generation for this API route
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DJANGO_BACKEND_URL = API_CONFIG.BACKEND_URL;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('[PATIENT BY ID] Processing GET request for patient:', id);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENT BY ID] Authenticated user:', user.id);
    let djangoWorking = true;

    try {
      // Forward request to Django backend with trailing slash and service role auth
      const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${id}/`;
      console.log('[PATIENT BY ID] Trying Django:', djangoUrl);

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(djangoUrl, {
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
      
      console.log('[PATIENT BY ID] Django response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[PATIENT BY ID] Django success');
        
        // Ensure we return the data in the expected format
        if (data && !data.data) {
          return createResponse({ data: data });
        }
        return createResponse(data);
      } else {
        djangoWorking = false;
        const errorText = await response.text();
        console.error('[PATIENT BY ID] Django error response:', errorText);
      }

    } catch (djangoError) {
      djangoWorking = false;
      console.error('[PATIENT BY ID] Django connection failed:', djangoError);
    }

    // Django failed - use Supabase fallback
    if (!djangoWorking) {
      console.log('[PATIENT BY ID] Django failed - falling back to Supabase direct');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get patient from Supabase directly
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .eq('created_by', user.id) // Ensure user owns this patient
          .eq('is_active', true)
          .single();
        
        if (patientError || !patient) {
          console.error('[PATIENT BY ID] Supabase patient not found:', patientError);
          return createErrorResponse(
            'Patient not found',
            `Patient ${id} not found or not accessible`,
            404
          );
        }
        
        // Get related consultations
        const { data: consultations, error: consultationsError } = await supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', id)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        // Get related assessments
        const { data: assessments, error: assessmentsError } = await supabase
          .from('clinimetrix_assessments')
          .select('*')
          .eq('patient_id', id)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        // Transform to Django-compatible format
        const transformedPatient = {
          id: patient.id,
          first_name: patient.first_name,
          paternal_last_name: patient.paternal_last_name,
          maternal_last_name: patient.maternal_last_name || '',
          birth_date: patient.date_of_birth,
          age: patient.age || 0,
          gender: patient.gender,
          email: patient.email,
          cell_phone: patient.phone,
          phone: patient.phone,
          curp: patient.curp,
          address: patient.address,
          city: patient.city,
          state: patient.state,
          postal_code: patient.postal_code,
          consultations_count: consultations?.length || 0,
          assessments_count: assessments?.length || 0,
          consultations: consultations || [],
          assessments: assessments || [],
          created_at: patient.created_at,
          updated_at: patient.updated_at,
          fallback: true,
          source: 'supabase_direct'
        };
        
        console.log('[PATIENT BY ID] Supabase fallback success');
        return createResponse({ data: transformedPatient });
      
      } catch (supabaseError) {
        console.error('[PATIENT BY ID] Supabase fallback failed:', supabaseError);
        return createErrorResponse(
          'Database error',
          `Could not retrieve patient from any source: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
          500
        );
      }
    }

    // This should never happen, but just in case
    return createErrorResponse(
      'Backend connection failed',
      'Patient data unavailable - all backends failed',
      503
    );
    
  } catch (error) {
    console.error('[PATIENT BY ID] Unexpected error:', error);
    
    return createErrorResponse(
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('[PATIENT BY ID] Processing PUT request for patient:', id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] PUT Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django backend with trailing slash
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[PATIENT BY ID] PUT Django error:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PATIENT BY ID] Successfully updated patient');
    
    // Ensure we return the data in the expected format
    if (data && !data.data) {
      return createResponse({ data: data });
    }
    return createResponse(data);
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to update patient',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('[PATIENT BY ID] Processing DELETE request for patient:', id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] DELETE Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django backend with trailing slash
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
    });

    if (!response.ok) {
      console.error('[PATIENT BY ID] DELETE Django error:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('[PATIENT BY ID] Successfully deleted patient');
    return createResponse({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to delete patient',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}