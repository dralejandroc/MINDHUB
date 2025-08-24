import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;
    console.log('[RESOURCE TRACKING] Processing GET request for patient:', patientId);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[RESOURCE TRACKING] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Call Django backend for patient resource tracking
    const djangoResponse = await fetch(
      `${BACKEND_URL}/api/resources/tracking/patient/${patientId}/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'X-User-Id': user.id,
          'X-User-Email': user.email || '',
          'X-Proxy-Auth': 'verified',
        },
      }
    );

    if (!djangoResponse.ok) {
      console.log('[RESOURCE TRACKING] Django response not ok, returning empty array');
      // Return empty array for graceful fallback
      return createResponse({
        success: true,
        data: [],
        total: 0,
        message: 'No resource tracking found'
      });
    }

    const data = await djangoResponse.json();
    console.log('[RESOURCE TRACKING] Successfully retrieved resource tracking');
    
    return createResponse({
      success: true,
      data: data.results || data.data || [],
      total: data.count || data.total || 0
    });

  } catch (error) {
    console.error('Error fetching resource tracking:', error);
    
    // Return empty array for graceful fallback
    return createResponse({
      success: true,
      data: [],
      total: 0,
      message: 'Resource tracking temporarily unavailable'
    });
  }
}