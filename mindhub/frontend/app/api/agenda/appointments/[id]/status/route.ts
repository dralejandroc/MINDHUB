// Agenda appointment status endpoint - Proxy to Django
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[AGENDA APPOINTMENT STATUS] Processing PUT request for appointment status:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    console.log('[AGENDA APPOINTMENT STATUS] Status update payload:', body);
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/appointments/${params.id}/status/`;
    
    console.log('[AGENDA APPOINTMENT STATUS] Forwarding to Django URL:', djangoUrl);
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AGENDA APPOINTMENT STATUS] Django API error:', response.status, errorText);
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[AGENDA APPOINTMENT STATUS] Successfully updated appointment status via Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA APPOINTMENT STATUS] Error:', error);
    return createErrorResponse(
      'Failed to update appointment status',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}