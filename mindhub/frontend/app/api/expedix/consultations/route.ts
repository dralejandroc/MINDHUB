// Expedix consultations API route - UNIFIED Django Backend Connection
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing GET request - Django Backend Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patient_id');

    console.log('[CONSULTATIONS API] Query params:', { search, limit, offset, status, patientId });

    // Build query parameters for Django backend
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);
    if (status) queryParams.append('status', status);
    if (patientId) queryParams.append('patient_id', patientId);

    // Call Django backend with proper authentication and tenant context
    const backendUrl = `${API_CONFIG.BACKEND_URL}/api/expedix/consultations/?${queryParams.toString()}`;
    console.log('[CONSULTATIONS API] Calling Django backend:', backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Tenant-ID': tenantId || '',
        'X-Tenant-Type': tenantType || '',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[CONSULTATIONS API] Django backend error:', backendResponse.status, errorText);
      
      return createErrorResponse(
        'Backend service error',
        `Django backend error: ${backendResponse.status}`,
        503
      );
    }

    const backendData = await backendResponse.json();
    console.log('[CONSULTATIONS API] Successfully fetched from Django backend:', backendData.count || backendData.length, 'consultations');

    return createResponse({
      success: true,
      data: backendData.results || backendData.data || backendData,
      total: backendData.count || backendData.total || (backendData.results?.length || 0),
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      status,
      patient_id: patientId,
      source: 'django_backend'
    });

  } catch (error) {
    console.error('[CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch consultations',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing POST request - Django Backend Connection');
    
    // Verify authentication using same pattern as working endpoints
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[CONSULTATIONS API] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    console.log('[CONSULTATIONS API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    const body = await request.json();
    console.log('[CONSULTATIONS API] Creating consultation with data:', Object.keys(body));

    // Validate required fields
    if (!body.patient_id) {
      return createErrorResponse('Validation error', 'patient_id is required', 400);
    }

    // Call Django backend to create consultation
    const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultations/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Tenant-ID': tenantId || '',
        'X-Tenant-Type': tenantType || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[CONSULTATIONS API] Django backend error:', backendResponse.status, errorText);
      
      return createErrorResponse(
        'Backend service error',
        `Django backend error: ${backendResponse.status}`,
        503
      );
    }

    const backendData = await backendResponse.json();
    console.log('[CONSULTATIONS API] Successfully created consultation in Django backend:', backendData.id);

    return createResponse({
      success: true,
      data: backendData,
      message: 'Consultation created successfully',
      source: 'django_backend'
    }, 201);

  } catch (error) {
    console.error('[CONSULTATIONS API] Error creating consultation:', error);
    return createErrorResponse(
      'Failed to create consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[CONSULTATIONS API] Processing PUT request - Django Backend Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const consultationId = url.searchParams.get('id');
    
    if (!consultationId) {
      return createErrorResponse('Validation error', 'Consultation ID is required', 400);
    }

    const body = await request.json();
    console.log('[CONSULTATIONS API] Updating consultation:', consultationId, 'with tenant context:', { tenantId, tenantType });

    // Call Django backend to update consultation
    const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultations/${consultationId}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Tenant-ID': tenantId || '',
        'X-Tenant-Type': tenantType || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[CONSULTATIONS API] Django backend error:', backendResponse.status, errorText);
      
      return createErrorResponse(
        'Backend service error',
        `Django backend error: ${backendResponse.status}`,
        503
      );
    }

    const backendData = await backendResponse.json();
    console.log('[CONSULTATIONS API] Successfully updated consultation in Django backend:', backendData.id);

    return createResponse({
      success: true,
      data: backendData,
      message: 'Consultation updated successfully',
      source: 'django_backend'
    });

  } catch (error) {
    console.error('[CONSULTATIONS API] Error updating consultation:', error);
    return createErrorResponse(
      'Failed to update consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}