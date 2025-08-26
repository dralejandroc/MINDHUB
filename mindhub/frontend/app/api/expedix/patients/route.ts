// Expedix patients API route - PROXY to Django Backend
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

import { API_CONFIG } from '@/lib/config/api-endpoints';

// Django backend URL - Using centralized configuration
const DJANGO_BACKEND_URL = API_CONFIG.BACKEND_URL;

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request - Django Backend Proxy with Supabase Fallback');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', `Auth failed: ${authError}`, 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Attempting Django backend');
    console.log('[PATIENTS API] User object:', JSON.stringify(user, null, 2));

    // Extract query parameters from original request
    const url = new URL(request.url);
    const searchParam = url.searchParams.get('search');
    console.log('[PATIENTS API] Search parameter:', searchParam);
    const queryString = url.search; // Preserva todos los query parameters

    let djangoWorking = true;

    try {
      // Build Django backend URL correctly
      const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${queryString || ''}`;
      console.log('[PATIENTS API] Proxying to Django:', djangoUrl);

      // Get auth token from request 
      const authHeader = request.headers.get('Authorization');
      
      // Forward request to Django backend with service role key for internal auth
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
      
      // Implement timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout to reach fallback faster

      const djangoResponse = await fetch(djangoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Proxy-Auth': 'verified',
          'X-MindHub-Dual-System': 'enabled',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('[PATIENTS API] Django response status:', djangoResponse.status);

      if (djangoResponse.ok) {
        // Django working - return response
        const responseData = await djangoResponse.json();
        const patientCount = responseData.results?.length || responseData.count || 0;
        console.log('[PATIENTS API] Django success - patients returned:', patientCount);
        return createResponse(responseData);
      } else {
        djangoWorking = false;
        const errorText = await djangoResponse.text();
        console.error('[PATIENTS API] Django error response:', errorText);
        console.warn('[PATIENTS API] Django returned error status:', djangoResponse.status);
      }

    } catch (djangoError) {
      djangoWorking = false;
      console.error('[PATIENTS API] Django connection failed:', djangoError);
    }

    // Django failed - use Supabase fallback
    if (!djangoWorking) {
      console.log('[PATIENTS API] Django failed - falling back to direct Supabase');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        console.log('[PATIENTS API] Supabase URL:', supabaseUrl);
        console.log('[PATIENTS API] Service key length:', supabaseServiceKey?.length || 'undefined');
        console.log('[PATIENTS API] Service key start:', supabaseServiceKey?.substring(0, 50) || 'undefined');
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        let patients = null;
        
        // Direct approach - matching the working dual-system-test endpoint structure  
        console.log('[PATIENTS API] Using service role key for direct Supabase access');
        
        // Get user's workspace context (DUAL SYSTEM)
        // Note: individual_workspaces doesn't have is_active column
        const { data: workspace } = await supabase
          .from('individual_workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        console.log('[PATIENTS API] Workspace found:', workspace?.id);

        // Build tenant-aware query
        let query = supabase
          .from('patients')
          .select('*')
          .eq('is_active', true);

        // Apply tenant filtering
        if (workspace) {
          // Individual workspace context: show patients in user's workspace
          query = query.eq('workspace_id', workspace.id);
          console.log('[PATIENTS API] Using workspace context:', workspace.id);
        } else {
          // Check for clinic membership as fallback
          const { data: membership } = await supabase
            .from('tenant_memberships')
            .select('clinic_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (membership) {
            query = query.eq('clinic_id', membership.clinic_id);
            console.log('[PATIENTS API] Using clinic context:', membership.clinic_id);
          } else {
            // No context found - return empty
            console.log('[PATIENTS API] No context found');
            return createResponse({
              count: 0,
              results: [],
              fallback: true,
              source: 'supabase_direct'
            });
          }
        }

        // Add search functionality if search parameter is provided
        if (searchParam && searchParam.trim()) {
          console.log('[PATIENTS API] Applying search filter:', searchParam);
          const searchTerm = searchParam.trim().toLowerCase();
          
          // Use OR condition for multiple search fields
          query = query.or(`first_name.ilike.%${searchTerm}%,paternal_last_name.ilike.%${searchTerm}%,maternal_last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,medical_record_number.ilike.%${searchTerm}%`);
        }

        // Execute query with ordering
        const { data: allPatients, error: allError } = await query
          .order('created_at', { ascending: false });
        
        if (allError) {
          console.error('[PATIENTS API] Failed to query patients table:', allError);
          throw new Error(`Supabase query failed: ${allError.message}`);
        }
        
        patients = allPatients || [];
        
        console.log(`[PATIENTS API] Found ${allPatients?.length || 0} patients for user ${user.id}${searchParam ? ` (search: "${searchParam}")` : ''}`);
        
        // Error handling is now inside the try-catch above
        if (!patients) {
          console.error('[PATIENTS API] No patients data received');
          return createErrorResponse(
            'Database error',
            'No patients data available',
            500
          );
        }
      
      // Transform data to Django-compatible format with correct field mapping
      const transformedPatients = patients?.map(patient => {
        // Calculate age from birth date if age field doesn't exist
        let calculatedAge = 0;
        if (patient.date_of_birth) {
          const birthDate = new Date(patient.date_of_birth);
          const today = new Date();
          calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
        
        return {
          id: patient.id,
          first_name: patient.first_name,
          paternal_last_name: patient.paternal_last_name,
          maternal_last_name: patient.maternal_last_name || '',
          birth_date: patient.date_of_birth,  // Correct field from Supabase
          age: patient.age || calculatedAge,  // Use existing age or calculate from birth_date
          gender: patient.gender,
          email: patient.email,
          cell_phone: patient.phone,  // Map phone to cell_phone
          phone: patient.phone,
          curp: patient.curp || '',
          rfc: patient.rfc || '',
          blood_type: patient.blood_type || '',
          allergies: patient.allergies || '',
          medical_history: patient.medical_history || '',
          current_medications: patient.current_medications || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
          emergency_contact_relationship: patient.emergency_contact_relationship || '',
          address: patient.address || '',
          city: patient.city || '',
          state: patient.state || '',
          postal_code: patient.postal_code || '',
          occupation: patient.occupation || '',
          education_level: patient.education_level || '',
          consultations_count: 0, // Will be populated by Django backend when available
          created_at: patient.created_at,
          updated_at: patient.updated_at
        };
      }) || [];
      
      console.log('[PATIENTS API] Supabase fallback success - patients returned:', transformedPatients.length);
      
      // Return in Django-compatible format
      return createResponse({
        count: transformedPatients.length,
        results: transformedPatients,
        fallback: true,
        source: 'supabase_direct'
      });
      
      } catch (supabaseFallbackError) {
        console.error('[PATIENTS API] Supabase fallback completely failed:', supabaseFallbackError);
        return createErrorResponse(
          'Database error',
          `Could not retrieve patient data from any source: ${supabaseFallbackError instanceof Error ? supabaseFallbackError.message : 'Unknown error'}`,
          500
        );
      }
    }

    // This should never happen, but just in case
    return createErrorResponse(
      'Backend connection failed',
      'No patient data available - all backends unavailable',
      503
    );

  } catch (error) {
    console.error('[PATIENTS API] Unexpected error:', error);
    
    return createErrorResponse(
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[PATIENTS API] Processing POST request - Django Backend Proxy with Supabase Fallback');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id);

    // Get request body
    const body = await request.json();
    console.log('[PATIENTS API] Creating patient with data:', Object.keys(body));

    let djangoWorking = true;

    try {
      // Try Django backend first (after schema fixes)
      const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/`;
      console.log('[PATIENTS API] Trying Django backend:', djangoUrl);

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Get tenant context from headers (optional - API can derive from user ID)
      const tenantId = request.headers.get('X-Tenant-ID');
      const tenantType = request.headers.get('X-Tenant-Type');
      
      console.log('[PATIENTS API] Creating with tenant context:', { tenantId, tenantType, userId: user.id });

      const djangoResponse = await fetch(djangoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || 'workspace',
          'X-Proxy-Auth': 'verified',
          'X-MindHub-Dual-System': 'enabled',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[PATIENTS API] Django POST response status:', djangoResponse.status);

      if (djangoResponse.ok) {
        const responseData = await djangoResponse.json();
        console.log('[PATIENTS API] Django success - patient created:', responseData.id || 'unknown');
        return createResponse(responseData, djangoResponse.status);
      } else {
        djangoWorking = false;
        const errorText = await djangoResponse.text();
        console.error('[PATIENTS API] Django POST error:', errorText);
      }

    } catch (djangoError) {
      djangoWorking = false;
      console.error('[PATIENTS API] Django POST connection failed:', djangoError);
    }

    // Django failed - use Supabase fallback
    if (!djangoWorking) {
      console.log('[PATIENTS API] Django failed - creating patient via Supabase fallback');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Calculate age from birth date if not provided
        let age = body.age;
        if (!age && (body.birth_date || body.date_of_birth)) {
          const birthDate = new Date(body.birth_date || body.date_of_birth);
          const today = new Date();
          age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
        
        // Get user's workspace for tenant context
        console.log('[PATIENTS API] Looking for workspace for user:', user.id);
        
        const { data: workspace, error: workspaceError } = await supabase
          .from('individual_workspaces')
          .select('id, workspace_name, owner_id')
          .eq('owner_id', user.id)
          .single();
        
        console.log('[PATIENTS API] Workspace query result:', { workspace, workspaceError });
        
        if (!workspace) {
          console.error('[PATIENTS API] No workspace found for user:', {
            userId: user.id,
            userEmail: user.email,
            workspaceError: workspaceError?.message
          });
          throw new Error(`User workspace not found - cannot create patient. User: ${user.email || user.id}`);
        }
        
        console.log('[PATIENTS API] Creating patient in workspace:', workspace.id);
        
        // Prepare patient data for Supabase (matching actual schema)
        const patientData = {
          id: crypto.randomUUID(),
          first_name: body.first_name,
          paternal_last_name: body.paternal_last_name,
          maternal_last_name: body.maternal_last_name || '',
          date_of_birth: body.birth_date || body.date_of_birth,
          gender: body.gender,
          email: body.email,
          phone: body.cell_phone || body.phone,
          curp: body.curp || '',
          rfc: body.rfc || '',
          blood_type: body.blood_type || '',
          address: body.address || '',
          city: body.city || '',
          state: body.state || '',
          postal_code: body.postal_code || '',
          occupation: body.occupation || '',
          education_level: body.education_level || '',
          medical_history: body.medical_history || '',
          emergency_contact_name: body.emergency_contact_name || '',
          emergency_contact_phone: body.emergency_contact_phone || '',
          emergency_contact_relationship: body.emergency_contact_relationship || '',
          workspace_id: workspace.id, // CRITICAL: Set workspace context
          created_by: user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert patient into Supabase
        const { data: patient, error: insertError } = await supabase
          .from('patients')
          .insert(patientData)
          .select()
          .single();

        if (insertError) {
          console.error('[PATIENTS API] Supabase insert error:', insertError);
          throw new Error(`Failed to create patient in database: ${insertError.message}`);
        }

        // Transform back to Django-compatible format
        const transformedPatient = {
          id: patient.id,
          first_name: patient.first_name,
          paternal_last_name: patient.paternal_last_name,
          maternal_last_name: patient.maternal_last_name,
          birth_date: patient.date_of_birth,
          age: age, // Use calculated age
          gender: patient.gender,
          email: patient.email,
          cell_phone: patient.phone,
          phone: patient.phone,
          curp: patient.curp || '',
          rfc: patient.rfc || '',
          blood_type: patient.blood_type || '',
          allergies: patient.allergies || '',
          medical_history: patient.medical_history || '',
          current_medications: patient.current_medications || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
          emergency_contact_relationship: patient.emergency_contact_relationship || '',
          address: patient.address || '',
          city: patient.city || '',
          state: patient.state || '',
          postal_code: patient.postal_code || '',
          occupation: patient.occupation || '',
          education_level: patient.education_level || '',
          consultations_count: 0,
          created_at: patient.created_at,
          updated_at: patient.updated_at,
          fallback: true,
          source: 'supabase_direct'
        };

        console.log('[PATIENTS API] Supabase fallback success - patient created:', patient.id);
        return createResponse({ data: transformedPatient }, 201);

      } catch (supabaseError) {
        console.error('[PATIENTS API] Supabase fallback completely failed:', supabaseError);
        return createErrorResponse(
          'Database error',
          `Could not create patient in any database: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
          500
        );
      }
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
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[PATIENTS API] Authenticated user:', user.id, '- Proxying PUT to Django backend');

    // Get request body
    const body = await request.json();
    console.log('[PATIENTS API] Updating patient with data:', Object.keys(body));

    // Extract patient ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const patientId = pathParts[pathParts.length - 1]; // Last part of the path

    // Build Django backend URL
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/patients/${patientId}/`;
    console.log('[PATIENTS API] Proxying PUT to Django:', djangoUrl);

    // Get auth token from request 
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to Django backend with service role key for internal auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
    
    const djangoResponse = await fetch(djangoUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`, // Use service role for Django auth
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified', // Indicate this request is pre-authenticated
        'X-MindHub-Dual-System': 'enabled',
      },
      body: JSON.stringify(body)
    });

    console.log('[PATIENTS API] Django PUT response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      console.error('[PATIENTS API] Django backend PUT error:', errorText);
      
      return createErrorResponse(
        'Failed to update patient',
        `HTTP error! status: ${djangoResponse.status}`,
        500
      );
    }

    // Get response data from Django
    const responseData = await djangoResponse.json();
    console.log('[PATIENTS API] Successfully proxied PUT to Django, patient updated:', responseData.id || 'unknown');

    // Return Django response as-is
    return createResponse(responseData, djangoResponse.status);

  } catch (error) {
    console.error('[PATIENTS API] Proxy PUT error:', error);
    return createErrorResponse(
      'Failed to update patient',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}