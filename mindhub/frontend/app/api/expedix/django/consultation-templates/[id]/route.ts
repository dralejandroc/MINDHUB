// Expedix Consultation Templates by ID Django Proxy
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[CONSULTATION TEMPLATE ID PROXY] Processing GET request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[CONSULTATION TEMPLATE ID PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/consultation-templates/${params.id}/`;
    console.log('[CONSULTATION TEMPLATE ID PROXY] Forwarding to:', djangoUrl);
    
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
      console.error('[CONSULTATION TEMPLATE ID PROXY] Django error:', response.status, response.statusText);
      
      if (response.status === 404) {
        return createErrorResponse('Template not found', 'The requested consultation template was not found', 404);
      }
      
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CONSULTATION TEMPLATE ID PROXY] Successfully retrieved template');

    return createResponse(data);

  } catch (error) {
    console.error('[CONSULTATION TEMPLATE ID PROXY] Error:', error);
    return createErrorResponse(
      'Failed to retrieve consultation template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[CONSULTATION TEMPLATE ID PROXY] Processing PUT request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/consultation-templates/${params.id}/`;
    
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
    console.log('[CONSULTATION TEMPLATE ID PROXY] Successfully updated template');

    return createResponse(data);

  } catch (error) {
    console.error('[CONSULTATION TEMPLATE ID PROXY] Error:', error);
    return createErrorResponse(
      'Failed to update consultation template',
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
    console.log('[CONSULTATION TEMPLATE ID PROXY] Processing DELETE request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/consultation-templates/${params.id}/`;
    
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

    console.log('[CONSULTATION TEMPLATE ID PROXY] Successfully deleted template');

    return createResponse({ success: true });

  } catch (error) {
    console.error('[CONSULTATION TEMPLATE ID PROXY] Error:', error);
    return createErrorResponse(
      'Failed to delete consultation template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}