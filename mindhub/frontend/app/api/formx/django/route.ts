// FormX Django API - Main proxy route for all FormX operations
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[FORMX DJANGO] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX DJANGO] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[FORMX DJANGO] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django FormX API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/dashboard/stats/${queryParams ? '?' + queryParams : ''}`;
    console.log('[FORMX DJANGO] Forwarding to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-FormX': 'enabled',
      },
    });
    
    console.log('[FORMX DJANGO] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX DJANGO] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX DJANGO] Successfully fetched FormX stats');

    return createResponse(data);

  } catch (error) {
    console.error('[FORMX DJANGO] Error:', error);
    return createErrorResponse(
      'Failed to fetch FormX data',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[FORMX DJANGO] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX DJANGO] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    console.log('[FORMX DJANGO] Request body received');
    
    // Forward request to Django FormX API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/form-builder/`;
    console.log('[FORMX DJANGO] Forwarding POST to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-FormX': 'enabled',
      },
      body: JSON.stringify(body),
    });
    
    console.log('[FORMX DJANGO] Django POST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX DJANGO] Django POST error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX DJANGO] Successfully created form via Django');

    return createResponse(data, 201);

  } catch (error) {
    console.error('[FORMX DJANGO] POST Error:', error);
    return createErrorResponse(
      'Failed to create form',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}