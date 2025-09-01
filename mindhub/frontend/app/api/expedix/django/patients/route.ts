// Expedix Django Patients API - Dashboard specific endpoint
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[EXPEDIX PATIENTS] Processing patients request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX PATIENTS] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[EXPEDIX PATIENTS] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django patients endpoint
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/patients${queryParams ? '?' + queryParams : ''}`;
    console.log('[EXPEDIX PATIENTS] Forwarding to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[EXPEDIX PATIENTS] Service key configured:', !!serviceKey, 'length:', serviceKey?.length || 0);
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Dual-System': 'enabled',
      },
    });
    
    console.log('[EXPEDIX PATIENTS] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EXPEDIX PATIENTS] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX PATIENTS] Successfully fetched patients:', data?.length || 0);

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX PATIENTS] Error:', error);
    return createErrorResponse(
      'Failed to fetch patients',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}