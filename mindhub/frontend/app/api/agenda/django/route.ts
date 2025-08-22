// Agenda Django Proxy API - DUAL SYSTEM
// Bridges to Django backend with automatic license type detection
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[AGENDA DJANGO PROXY] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA DJANGO PROXY] Successfully proxied request to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[AGENDA DJANGO PROXY] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Dual-System': 'enabled',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA DJANGO PROXY] Successfully proxied POST to Django');

    return createResponse(data, 201);

  } catch (error) {
    console.error('[AGENDA DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy POST request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[AGENDA DJANGO PROXY] Processing PUT request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Dual-System': 'enabled',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA DJANGO PROXY] Successfully proxied PUT to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy PUT request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('[AGENDA DJANGO PROXY] Processing DELETE request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/agenda/${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AGENDA DJANGO PROXY] Successfully proxied DELETE to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[AGENDA DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy DELETE request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}