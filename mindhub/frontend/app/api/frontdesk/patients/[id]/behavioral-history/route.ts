import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: patientId } = params;
    console.log('[BEHAVIORAL HISTORY] Processing GET request for patient:', patientId);

    // Try to get authentication, but don't fail if it's not available
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.log('[BEHAVIORAL HISTORY] No authentication, returning empty data');
      // Return empty data instead of error for graceful fallback
      return createResponse({
        success: true,
        data: [],
        total: 0,
        message: 'No behavioral history found - authentication required'
      });
    }

    // Call Django backend for behavioral history/assessments
    const djangoResponse = await fetch(
      `${BACKEND_URL}/api/expedix/patients/${patientId}/assessments/`,
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
      console.log('[BEHAVIORAL HISTORY] Django response not ok, returning empty array');
      // Return empty array instead of error for non-fatal cases
      return createResponse({
        success: true,
        data: [],
        total: 0,
        message: 'No behavioral history found'
      });
    }

    const data = await djangoResponse.json();
    console.log('[BEHAVIORAL HISTORY] Successfully retrieved behavioral history');
    
    return createResponse({
      success: true,
      data: data.results || data.data || [],
      total: data.count || data.total || 0
    });

  } catch (error) {
    console.error('Error fetching behavioral history:', error);
    
    // Return empty array for graceful fallback
    return createResponse({
      success: true,
      data: [],
      total: 0,
      message: 'Behavioral history temporarily unavailable'
    });
  }
}