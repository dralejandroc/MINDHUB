// FormX templates endpoint - Proxy to Django
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[FORMX TEMPLATES] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/formx/templates/${queryParams ? '?' + queryParams : ''}`;
    
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
    console.log('[FORMX TEMPLATES] Successfully proxied request to Django');

    return createResponse(data);

  } catch (error) {
    console.error('[FORMX TEMPLATES] Error:', error);
    return createErrorResponse(
      'Failed to get form templates',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[FORMX TEMPLATES] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/formx/templates/`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
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
    console.log('[FORMX TEMPLATES] Successfully proxied POST to Django');

    return createResponse(data, 201);

  } catch (error) {
    console.error('[FORMX TEMPLATES] Error:', error);
    return createErrorResponse(
      'Failed to create form template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}