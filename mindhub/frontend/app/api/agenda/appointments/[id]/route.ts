// Individual agenda appointment endpoint - Proxy to Django
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[AGENDA APPOINTMENT GET] Processing GET request for appointment:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/appointments/${params.id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA APPOINTMENT GET] Successfully proxied request to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA APPOINTMENT GET] Error:', error);
    return createErrorResponse(
      'Failed to get appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[AGENDA APPOINTMENT PATCH] Processing PATCH request for appointment:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/appointments/${params.id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA APPOINTMENT PATCH] Successfully proxied PATCH to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA APPOINTMENT PATCH] Error:', error);
    return createErrorResponse(
      'Failed to update appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}