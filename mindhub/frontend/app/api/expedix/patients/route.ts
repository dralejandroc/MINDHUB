// Expedix patients API route - PROXY to Django Backend
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Django backend URL
const DJANGO_BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request - Django Backend Proxy');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Proxying to Django backend');

    // Extract query parameters from original request
    const url = new URL(request.url);
    const queryString = url.search; // Preserva todos los query parameters

    // Build Django backend URL
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients${queryString}`;
    console.log('[PATIENTS API] Proxying to Django:', djangoUrl);

    // Get auth token from request 
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to Django backend
    const djangoResponse = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || `Bearer ${user.id}`, // Forward auth or use user ID
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
      }
    });

    console.log('[PATIENTS API] Django response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      console.error('[PATIENTS API] Django backend error:', errorText);
      
      return createErrorResponse(
        'Backend error',
        `Django backend responded with ${djangoResponse.status}`,
        djangoResponse.status
      );
    }

    // Get response data from Django
    const responseData = await djangoResponse.json();
    console.log('[PATIENTS API] Successfully proxied to Django, patients returned:', responseData.data?.length || 0);

    // Return Django response as-is
    return createResponse(responseData);

  } catch (error) {
    console.error('[PATIENTS API] Proxy error:', error);
    return createErrorResponse(
      'Failed to fetch patients',
      error instanceof Error ? error.message : 'Unknown error',
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

    // Build Django backend URL
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients`;
    console.log('[PATIENTS API] Proxying POST to Django:', djangoUrl);

    // Get auth token from request 
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to Django backend
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || `Bearer ${user.id}`, // Forward auth or use user ID
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
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
    console.log('[PATIENTS API] Successfully proxied POST to Django, patient created:', responseData.data?.id || 'unknown');

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