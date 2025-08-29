// Expedix patients API route - PROXY to Django Backend ONLY
// Architecture: Frontend → Next.js API → Django → Supabase PostgreSQL
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

import { API_CONFIG } from '@/lib/config/api-endpoints';

// Django backend URL - Using centralized configuration
const DJANGO_BACKEND_URL = API_CONFIG.BACKEND_URL;

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request - Django Backend Proxy ONLY');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Using Django backend');

    // Extract query parameters from original request
    const url = new URL(request.url);
    const queryString = url.search; // Preserve all query parameters

    // Use Django Backend - Following documented architecture in CLAUDE.md
    console.log('[PATIENTS API] Using Django backend as per architecture:', DJANGO_BACKEND_URL);
    
    try {
      // Construct Django API URL with query parameters
      const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${queryString}`;
      
      // Get auth header for Django request
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
      }

      // Forward request to Django backend with authentication
      const djangoResponse = await fetch(djangoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (djangoResponse.ok) {
        const data = await djangoResponse.json();
        console.log('[PATIENTS API] Django backend success, patients count:', data?.results?.length || data?.data?.length || 0);
        return createResponse(data);
      } else {
        console.error('[PATIENTS API] Django backend failed:', djangoResponse.status, djangoResponse.statusText);
        return createErrorResponse('Backend Error', `Django API failed: ${djangoResponse.status}`, djangoResponse.status);
      }
      
    } catch (djangoError) {
      console.error('[PATIENTS API] Django backend error:', djangoError);
      return createErrorResponse('Backend Error', 'Django backend unavailable', 500);
    }

  } catch (error) {
    console.error('[PATIENTS API] Error:', error);
    return createErrorResponse(
      'Failed to get patients',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[PATIENTS API] Processing POST request - Django Backend Proxy');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    // Get request body
    const body = await request.json();
    
    // Forward to Django backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
    }

    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/`;
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const responseData = await djangoResponse.json();
    
    if (djangoResponse.ok) {
      console.log('[PATIENTS API] Patient created successfully via Django');
      return createResponse(responseData, djangoResponse.status);
    } else {
      console.error('[PATIENTS API] Django creation failed:', responseData);
      return createErrorResponse(
        'Failed to create patient', 
        responseData.message || 'Django backend error',
        djangoResponse.status
      );
    }

  } catch (error) {
    console.error('[PATIENTS API] Proxy POST error:', error);
    return createErrorResponse(
      'Failed to create patient',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[PATIENTS API] Processing PUT request - Django Backend Proxy');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    // Get request body and URL
    const body = await request.json();
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const patientId = pathSegments[pathSegments.length - 1];
    
    // Forward to Django backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
    }

    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${patientId}/`;
    const djangoResponse = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const responseData = await djangoResponse.json();
    
    if (djangoResponse.ok) {
      console.log('[PATIENTS API] Patient updated successfully via Django');
      return createResponse(responseData, djangoResponse.status);
    } else {
      console.error('[PATIENTS API] Django update failed:', responseData);
      return createErrorResponse(
        'Failed to update patient', 
        responseData.message || 'Django backend error',
        djangoResponse.status
      );
    }

  } catch (error) {
    console.error('[PATIENTS API] Proxy PUT error:', error);
    return createErrorResponse(
      'Failed to update patient',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}