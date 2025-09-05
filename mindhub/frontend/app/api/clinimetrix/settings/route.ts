// ClinimetrixPro Settings API endpoint
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX SETTINGS] Processing GET request for user settings');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/clinimetrix/user-settings/`;
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
    });

    if (!response.ok) {
      // If no settings exist, return default configuration
      if (response.status === 404) {
        console.log('[CLINIMETRIX SETTINGS] No existing settings found, returning defaults');
        return createResponse({
          success: true,
          data: {
            // Default ClinimetrixPro configuration
            defaultView: 'grid',
            scalesPerPage: 15,
            autoSaveResults: true,
            showScalePreview: true,
            enableFavoriteScales: true,
            favoriteScales: [],
            // Add more defaults as needed
          }
        });
      }
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CLINIMETRIX SETTINGS] Successfully retrieved user settings');

    return createResponse(data);

  } catch (error) {
    console.error('[CLINIMETRIX SETTINGS] Error:', error);
    return createErrorResponse(
      'Failed to get ClinimetrixPro settings',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[CLINIMETRIX SETTINGS] Processing PUT request to update settings');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const settings = await request.json();
    console.log('[CLINIMETRIX SETTINGS] Updating settings for user:', user.id);
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/clinimetrix/user-settings/`;
    
    const response = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify({
        ...settings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CLINIMETRIX SETTINGS] Django API error:', response.status, errorText);
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CLINIMETRIX SETTINGS] Successfully updated user settings');

    return createResponse(data);

  } catch (error) {
    console.error('[CLINIMETRIX SETTINGS] Error:', error);
    return createErrorResponse(
      'Failed to update ClinimetrixPro settings',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}