// Expedix Configuration Django Proxy
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[EXPEDIX CONFIG PROXY] Processing GET request for configuration');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX CONFIG PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/configuration/`;
    console.log('[EXPEDIX CONFIG PROXY] Forwarding to:', djangoUrl);
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      console.error('[EXPEDIX CONFIG PROXY] Django error:', response.status, response.statusText);
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX CONFIG PROXY] Successfully retrieved configuration');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX CONFIG PROXY] Error:', error);
    return createErrorResponse(
      'Failed to retrieve configuration',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[EXPEDIX CONFIG PROXY] Processing POST request for configuration');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/configuration/`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX CONFIG PROXY] Successfully created configuration');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX CONFIG PROXY] Error:', error);
    return createErrorResponse(
      'Failed to create configuration',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[EXPEDIX CONFIG PROXY] Processing PUT request for configuration');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/configuration/`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX CONFIG PROXY] Successfully updated configuration');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX CONFIG PROXY] Error:', error);
    return createErrorResponse(
      'Failed to update configuration',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}