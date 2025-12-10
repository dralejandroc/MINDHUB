// Expedix Appointments Django Proxy - Routes appointments requests to Django backend
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[EXPEDIX APPOINTMENTS PROXY] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX APPOINTMENTS PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/appointments${queryParams ? '?' + queryParams : ''}`;
    console.log('[EXPEDIX APPOINTMENTS PROXY] Forwarding to:', djangoUrl);
    // console.log('TEST APPOINTMENT AUTH:', request.headers.get('Authorization'));
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
      },
    });

    if (!response.ok) {
      console.error('[EXPEDIX APPOINTMENTS PROXY] Django error:', response.status, response.statusText);
      
      // Return empty array for 404 to prevent crashes
      if (response.status === 404) {
        return createResponse({ data: [] });
      }
      
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX APPOINTMENTS PROXY] Successfully proxied request');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX APPOINTMENTS PROXY] Error:', error);
    
    // Return empty data instead of error to prevent frontend crashes
    return createResponse({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[EXPEDIX APPOINTMENTS PROXY] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/appointments/`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX APPOINTMENTS PROXY] Successfully created appointment');

    return createResponse(data, 201);

  } catch (error) {
    console.error('[EXPEDIX APPOINTMENTS PROXY] Error:', error);
    return createErrorResponse(
      'Failed to create appointment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}