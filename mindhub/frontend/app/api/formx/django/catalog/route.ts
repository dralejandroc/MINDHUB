// FormX Django Catalog API - Template catalog for selection
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[FORMX CATALOG] Processing catalog request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[FORMX CATALOG] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[FORMX CATALOG] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django FormX catalog API
    const djangoUrl = `${DJANGO_API_BASE}/formx/api/templates/catalog/${queryParams ? '?' + queryParams : ''}`;
    console.log('[FORMX CATALOG] Forwarding to Django:', djangoUrl);
    
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
    
    console.log('[FORMX CATALOG] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FORMX CATALOG] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[FORMX CATALOG] Successfully fetched catalog:', data?.templates?.length || 0);

    return createResponse(data);

  } catch (error) {
    console.error('[FORMX CATALOG] Error:', error);
    return createErrorResponse(
      'Failed to fetch form template catalog',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}