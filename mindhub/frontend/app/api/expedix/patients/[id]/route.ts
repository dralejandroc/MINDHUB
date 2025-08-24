// Prevent static generation for this API route
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('[PATIENT BY ID] Processing GET request for patient:', id);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Forward request to Django backend with trailing slash
    const djangoUrl = `${BACKEND_URL}/api/expedix/patients/${id}/`;
    console.log('[PATIENT BY ID] Forwarding to Django:', djangoUrl);

    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
    });

    if (!response.ok) {
      console.error('[PATIENT BY ID] Django error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PATIENT BY ID] Successfully retrieved patient');
    
    // Ensure we return the data in the expected format
    if (data && !data.data) {
      return createResponse({ data: data });
    }
    return createResponse(data);
  } catch (error) {
    console.error('Error proxying patient request:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to fetch patient from backend',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('[PATIENT BY ID] Processing PUT request for patient:', id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] PUT Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django backend with trailing slash
    const djangoUrl = `${BACKEND_URL}/api/expedix/patients/${id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[PATIENT BY ID] PUT Django error:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PATIENT BY ID] Successfully updated patient');
    
    // Ensure we return the data in the expected format
    if (data && !data.data) {
      return createResponse({ data: data });
    }
    return createResponse(data);
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to update patient',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('[PATIENT BY ID] Processing DELETE request for patient:', id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PATIENT BY ID] DELETE Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django backend with trailing slash
    const djangoUrl = `${BACKEND_URL}/api/expedix/patients/${id}/`;
    
    const response = await fetch(djangoUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
    });

    if (!response.ok) {
      console.error('[PATIENT BY ID] DELETE Django error:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('[PATIENT BY ID] Successfully deleted patient');
    return createResponse({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to delete patient',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}