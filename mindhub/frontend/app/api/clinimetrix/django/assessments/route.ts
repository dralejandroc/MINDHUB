// Clinimetrix Django Assessments API - Dashboard specific endpoint
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX ASSESSMENTS] Processing assessments request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[CLINIMETRIX ASSESSMENTS] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX ASSESSMENTS] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django assessments endpoint
    const djangoUrl = `${DJANGO_API_BASE}/api/clinimetrix/assessments/${queryParams ? '?' + queryParams : ''}`;
    console.log('[CLINIMETRIX ASSESSMENTS] Forwarding to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[CLINIMETRIX ASSESSMENTS] Service key configured:', !!serviceKey, 'length:', serviceKey?.length || 0);
    
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
    
    console.log('[CLINIMETRIX ASSESSMENTS] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CLINIMETRIX ASSESSMENTS] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Django API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[CLINIMETRIX ASSESSMENTS] Successfully fetched assessments:', data?.length || 0);

    return createResponse(data);

  } catch (error) {
    console.error('[CLINIMETRIX ASSESSMENTS] Error:', error);
    return createErrorResponse(
      'Failed to fetch assessments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}