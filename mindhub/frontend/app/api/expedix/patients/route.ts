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
      
      // Get auth header for Django request - but use service role key instead
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
      }

      // Use service role key for Django backend (Django expects service role key)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

      // Get user's workspace_id for proper filtering
      let workspaceId = null;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        const { data: workspace } = await supabase
          .from('individual_workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        workspaceId = workspace?.id;
        console.log('[PATIENTS API] Found workspace_id for user:', workspaceId);
      } catch (wsError) {
        console.warn('[PATIENTS API] Could not fetch workspace_id:', wsError);
      }

      // Forward request to Django backend with service role authentication
      const djangoResponse = await fetch(djangoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          // Add proxy headers so Django knows the real user and workspace
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Workspace-ID': workspaceId || '',
          'X-MindHub-Context': 'expedix-patients',
        },
      });

      if (djangoResponse.ok) {
        const data = await djangoResponse.json();
        const patientCount = data?.results?.length || data?.data?.length || 0;
        console.log('[PATIENTS API] Django backend success, patients count:', patientCount);
        
        // If Django returns no patients but we have a workspace_id, try direct Supabase fallback
        if (patientCount === 0 && workspaceId) {
          console.log('[PATIENTS API] Django returned 0 patients, trying Supabase fallback...');
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              { auth: { autoRefreshToken: false, persistSession: false } }
            );
            
            const { data: fallbackPatients, error } = await supabase
              .from('patients')
              .select('*')
              .eq('workspace_id', workspaceId)
              .order('created_at', { ascending: false });
            
            if (!error && fallbackPatients && fallbackPatients.length > 0) {
              console.log('[PATIENTS API] Supabase fallback found', fallbackPatients.length, 'patients');
              
              // Format patients to match expected structure
              const formattedPatients = fallbackPatients.map((p: any) => ({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                paternal_last_name: p.paternal_last_name,
                maternal_last_name: p.maternal_last_name,
                phone: p.phone,
                cell_phone: p.cell_phone,
                email: p.email,
                date_of_birth: p.date_of_birth,
                created_at: p.created_at,
                updated_at: p.updated_at
              }));
              
              return createResponse({
                count: formattedPatients.length,
                results: formattedPatients,
                next: null,
                previous: null,
                source: 'supabase-fallback'
              });
            }
          } catch (fallbackError) {
            console.warn('[PATIENTS API] Supabase fallback failed:', fallbackError);
          }
        }
        
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
    
    // Forward to Django backend using service role key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

    // Get user's workspace_id for proper filtering
    let workspaceId = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { data: workspace } = await supabase
        .from('individual_workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      workspaceId = workspace?.id;
    } catch (wsError) {
      console.warn('[PATIENTS API POST] Could not fetch workspace_id:', wsError);
    }

    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/`;
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Workspace-ID': workspaceId || '',
        'X-MindHub-Context': 'expedix-patients',
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
    
    // Forward to Django backend using service role key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'Missing authorization header', 401);
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

    // Get user's workspace_id for proper filtering
    let workspaceId = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { data: workspace } = await supabase
        .from('individual_workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      workspaceId = workspace?.id;
    } catch (wsError) {
      console.warn('[PATIENTS API PUT] Could not fetch workspace_id:', wsError);
    }

    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${patientId}/`;
    const djangoResponse = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Workspace-ID': workspaceId || '',
        'X-MindHub-Context': 'expedix-patients',
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