// Next appointment API route - Django Backend with Supabase Fallback
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

interface Context {
  params: { id: string };
}

export async function GET(request: Request, { params }: Context) {
  try {
    console.log('[NEXT-APPOINTMENT API] Processing GET request for patient:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[NEXT-APPOINTMENT API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    try {
      // TRY Django backend first
      const backendUrl = `${API_CONFIG.BACKEND_URL}/api/expedix/patients/${params.id}/next-appointment/`;
      console.log('[NEXT-APPOINTMENT API] Trying Django backend:', backendUrl);

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
        console.log('[NEXT-APPOINTMENT API] Successfully fetched from Django backend');

        return createResponse({
          success: true,
          appointment: backendData.appointment,
          message: backendData.message || 'Next appointment retrieved successfully',
          source: 'django_backend'
        });
      } else {
        console.warn('[NEXT-APPOINTMENT API] Django backend unavailable, falling back to Supabase');
        throw new Error(`Django backend error: ${backendResponse.status}`);
      }
    } catch (djangoError) {
      console.error('[NEXT-APPOINTMENT API] Django backend failed, using Supabase fallback:', djangoError);

      // FALLBACK: Direct Supabase connection
      console.log('[NEXT-APPOINTMENT API] Using Supabase direct connection as fallback');
      
      // Build Supabase query to find next upcoming appointment
      const { data: appointments, error } = await supabaseAdmin
        .from('consultations')
        .select(`
          id,
          patient_id,
          professional_id,
          consultation_date,
          status,
          chief_complaint,
          created_at
        `)
        .eq('patient_id', params.id)
        .gt('consultation_date', new Date().toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('consultation_date', { ascending: true })
        .limit(1);

      if (error) {
        console.error('[NEXT-APPOINTMENT API] Supabase fallback error:', error);
        return createErrorResponse(
          'Database connection failed',
          `Supabase error: ${error.message}`,
          500
        );
      }

      console.log('[NEXT-APPOINTMENT API] Successfully queried Supabase fallback:', appointments?.length, 'appointments found');

      const nextAppointment = appointments && appointments.length > 0 ? appointments[0] : null;

      return createResponse({
        success: true,
        appointment: nextAppointment,
        message: nextAppointment ? 'Next appointment found' : 'No upcoming appointments found',
        source: 'supabase_fallback'
      });
    }

  } catch (error) {
    console.error('[NEXT-APPOINTMENT API] Error:', error);
    return createErrorResponse(
      'Failed to fetch next appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}