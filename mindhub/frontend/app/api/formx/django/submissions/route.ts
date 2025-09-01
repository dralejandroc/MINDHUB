// FormX Django Submissions API - Form responses management
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[FORMX SUBMISSIONS] Processing submissions request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX SUBMISSIONS] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[FORMX SUBMISSIONS] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django FormX submissions API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/submissions/${queryParams ? '?' + queryParams : ''}`;
    console.log('[FORMX SUBMISSIONS] Forwarding to Django:', djangoUrl);
    
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
    
    console.log('[FORMX SUBMISSIONS] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX SUBMISSIONS] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX SUBMISSIONS] Successfully fetched submissions:', data?.length || 0);

    return createResponse(data);

  } catch (error) {
    console.error('[FORMX SUBMISSIONS] Error:', error);
    return createErrorResponse(
      'Failed to fetch form submissions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[FORMX SUBMISSIONS] Processing submit form request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX SUBMISSIONS] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    console.log('[FORMX SUBMISSIONS] Submitting form for template:', body?.template_id);
    
    // Forward request to Django FormX submissions API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/submissions/`;
    console.log('[FORMX SUBMISSIONS] Forwarding POST to Django:', djangoUrl);
    
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
    
    console.log('[FORMX SUBMISSIONS] Django POST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX SUBMISSIONS] Django POST error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX SUBMISSIONS] Successfully submitted form:', data?.id);

    return createResponse(data, 201);

  } catch (error) {
    console.error('[FORMX SUBMISSIONS] POST Error:', error);
    return createErrorResponse(
      'Failed to submit form',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}