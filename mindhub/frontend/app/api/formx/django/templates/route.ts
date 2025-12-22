// FormX Django Templates API - Template management
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[FORMX TEMPLATES] Processing templates request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX TEMPLATES] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[FORMX TEMPLATES] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django FormX templates API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/templates/${queryParams ? '?' + queryParams : ''}`;
    console.log('[FORMX TEMPLATES] Forwarding to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-FormX': 'enabled',
      },
    });
    
    console.log('[FORMX TEMPLATES] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX TEMPLATES] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX TEMPLATES] Successfully fetched templates:', data?.length || 0);

    return createResponse(data);

  } catch (error) {
    console.error('[FORMX TEMPLATES] Error:', error);
    return createErrorResponse(
      'Failed to fetch form templates',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[FORMX TEMPLATES] Processing create template request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX TEMPLATES] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    console.log('[FORMX TEMPLATES] Creating template:', body?.name);
    
    // Forward request to Django FormX templates API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/templates/`;
    console.log('[FORMX TEMPLATES] Forwarding POST to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-FormX': 'enabled',
      },
      body: JSON.stringify(body),
    });
    
    console.log('[FORMX TEMPLATES] Django POST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX TEMPLATES] Django POST error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX TEMPLATES] Successfully created template:', data?.template_id);

    return createResponse(data, 201);

  } catch (error) {
    console.error('[FORMX TEMPLATES] POST Error:', error);
    return createErrorResponse(
      'Failed to create form template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}