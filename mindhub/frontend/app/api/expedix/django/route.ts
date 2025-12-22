// Expedix Django Proxy API - Bridges to Django backend
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[EXPEDIX DJANGO PROXY] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract query parameters and path
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Extract the endpoint path from the Next.js API route
    // This proxy handles ALL /api/expedix/* requests, so we need to forward the full path
    const expedixPath = url.pathname.replace('/api/expedix/django', ''); // Remove the proxy prefix
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix${expedixPath}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX DJANGO PROXY] Successfully proxied request to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[EXPEDIX DJANGO PROXY] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Extract the endpoint path from the Next.js API route
    const url = new URL(request.url);
    const expedixPath = url.pathname.replace('/api/expedix/django', ''); // Remove the proxy prefix
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix${expedixPath}`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
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
    console.log('[EXPEDIX DJANGO PROXY] Successfully proxied POST to Django');

    return createResponse(data, 201);

  } catch (error) {
    console.error('[EXPEDIX DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy POST request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[EXPEDIX DJANGO PROXY] Processing PUT request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Extract the endpoint path from the Next.js API route
    const expedixPath = url.pathname.replace('/api/expedix/django', ''); // Remove the proxy prefix
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix${expedixPath}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
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
    console.log('[EXPEDIX DJANGO PROXY] Successfully proxied PUT to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy PUT request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('[EXPEDIX DJANGO PROXY] Processing DELETE request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Extract the endpoint path from the Next.js API route
    const expedixPath = url.pathname.replace('/api/expedix/django', ''); // Remove the proxy prefix
    
    // Forward request to Django with dual system headers
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix${expedixPath}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(djangoUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        // 🎯 DUAL SYSTEM: Headers for automatic license type detection
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX DJANGO PROXY] Successfully proxied DELETE to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX DJANGO PROXY] Error:', error);
    return createErrorResponse(
      'Failed to proxy DELETE request to Django',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}