// Expedix Prescriptions API - Direct Supabase implementation with Django fallback
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[EXPEDIX PRESCRIPTIONS API] Processing GET request - Direct Supabase');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX PRESCRIPTIONS API] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    // Extract query parameters
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patient_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('[EXPEDIX PRESCRIPTIONS API] Request with tenant context:', { tenantId, tenantType });

    // Query Supabase for prescriptions with tenant filtering
    let query = supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          paternal_last_name,
          maternal_last_name,
          email
        )
      `);

    // Apply tenant filtering
    if (tenantType === 'clinic' && tenantId) {
      query = query.eq('clinic_id', tenantId);
    } else {
      // For individual workspace, filter by created_by and workspace_id
      query = query.eq('created_by', user.id).eq('workspace_id', tenantId || user.id);
    }

    // Filter by patient if specified
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: prescriptions, error } = await query;

    if (error) {
      console.error('[EXPEDIX PRESCRIPTIONS API] Supabase query error:', error);
      
      // Try Django fallback
      try {
        console.log('[EXPEDIX PRESCRIPTIONS API] Attempting Django fallback');
        const queryParams = url.searchParams.toString();
        const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions${queryParams ? '?' + queryParams : ''}`;
        
        const response = await fetch(djangoUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'X-Proxy-Auth': 'verified',
            'X-User-Id': user.id,
            'X-User-Email': user.email || '',
            'X-Tenant-ID': tenantId || '',
            'X-Tenant-Type': tenantType || '',
            'X-MindHub-Dual-System': 'enabled',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[EXPEDIX PRESCRIPTIONS API] Django fallback success');
          return createResponse(data);
        }
      } catch (djangoError) {
        console.error('[EXPEDIX PRESCRIPTIONS API] Django fallback failed:', djangoError);
      }
      
      // Return empty array as final fallback
      return createResponse({ data: [] });
    }

    console.log(`[EXPEDIX PRESCRIPTIONS API] Successfully fetched ${prescriptions?.length || 0} prescriptions`);

    return createResponse({ 
      success: true, 
      data: prescriptions || [] 
    });

  } catch (error) {
    console.error('[EXPEDIX PRESCRIPTIONS API] Error:', error);
    
    // Return empty data instead of error to prevent frontend crashes
    return createResponse({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[EXPEDIX PRESCRIPTIONS API] Processing POST request - Direct Supabase');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    // Get request body
    const body = await request.json();
    console.log('[EXPEDIX PRESCRIPTIONS API] Creating prescription with data:', Object.keys(body), 'with tenant context:', { tenantId, tenantType });
    
    // Validate required fields
    if (!body.patient_id) {
      return createErrorResponse('Validation error', 'patient_id is required', 400);
    }

    // Prepare prescription data with tenant context
    const prescriptionData = {
      id: crypto.randomUUID(),
      patient_id: body.patient_id,
      practitioner_name: body.practitioner_name || 'Dr. Expedix',
      practitioner_license: body.practitioner_license || 'MED123456',
      diagnosis: body.diagnosis || '',
      medications: JSON.stringify(body.medications || []),
      notes: body.notes || '',
      status: body.status || 'active',
      created_by: user.id,
      // Apply tenant context using dual-system pattern
      clinic_id: tenantType === 'clinic' ? tenantId : null,
      workspace_id: tenantType === 'workspace' ? (tenantId || user.id) : (tenantType !== 'clinic' ? user.id : null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to insert into Supabase
    const { data: prescription, error: insertError } = await supabaseAdmin
      .from('prescriptions')
      .insert(prescriptionData)
      .select()
      .single();

    if (insertError) {
      console.error('[EXPEDIX PRESCRIPTIONS API] Supabase insert error:', insertError);
      
      // Try Django as fallback
      try {
        console.log('[EXPEDIX PRESCRIPTIONS API] Attempting Django fallback');
        const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/`;
        
        const response = await fetch(djangoUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'X-Proxy-Auth': 'verified',
            'X-User-Id': user.id,
            'X-User-Email': user.email || '',
            'X-Tenant-ID': tenantId || '',
            'X-Tenant-Type': tenantType || '',
            'X-MindHub-Dual-System': 'enabled',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[EXPEDIX PRESCRIPTIONS API] Django fallback success');
          return createResponse(data, 201);
        }
      } catch (djangoError) {
        console.error('[EXPEDIX PRESCRIPTIONS API] Django fallback failed:', djangoError);
      }
      
      return createErrorResponse(
        'Failed to create prescription',
        `Database error: ${insertError.message}`,
        500
      );
    }

    console.log('[EXPEDIX PRESCRIPTIONS API] Successfully created prescription:', prescription.id);

    return createResponse({ 
      success: true, 
      data: prescription 
    }, 201);

  } catch (error) {
    console.error('[EXPEDIX PRESCRIPTIONS API] Error:', error);
    return createErrorResponse(
      'Failed to create prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}