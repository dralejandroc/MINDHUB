// Expedix Prescriptions by ID Django Proxy
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Processing GET request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX PRESCRIPTIONS ID PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}`;
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Forwarding to:', djangoUrl);
    
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
      console.error('[EXPEDIX PRESCRIPTIONS ID PROXY] Django error:', response.status, response.statusText);
      
      // Return empty array for 404 to prevent crashes
      if (response.status === 404) {
        return createResponse({ data: [] });
      }
      
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Successfully proxied request');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX PRESCRIPTIONS ID PROXY] Error:', error);
    
    // Return empty data instead of error to prevent frontend crashes
    return createResponse({ data: [] });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Processing PUT request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}`;
    
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
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Successfully updated prescription');

    return createResponse(data);

  } catch (error) {
    console.error('[EXPEDIX PRESCRIPTIONS ID PROXY] Error:', error);
    return createErrorResponse(
      'Failed to update prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Processing DELETE request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}`;
    
    const response = await fetch(djangoUrl, {
      method: 'DELETE',
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
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    console.log('[EXPEDIX PRESCRIPTIONS ID PROXY] Successfully deleted prescription');

    return createResponse({ success: true });

  } catch (error) {
    console.error('[EXPEDIX PRESCRIPTIONS ID PROXY] Error:', error);
    return createErrorResponse(
      'Failed to delete prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}