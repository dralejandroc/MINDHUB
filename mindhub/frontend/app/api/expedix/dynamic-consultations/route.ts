// Dynamic consultations API route - handles form-based consultations with file uploads
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[DYNAMIC CONSULTATIONS API] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const body = await request.json();
    console.log('[DYNAMIC CONSULTATIONS API] Creating consultation with template:', body.template_id, 'with tenant context:', { tenantId, tenantType });

    // Validate required fields
    if (!body.patient_id || !body.template_id) {
      return createErrorResponse('Validation error', 'patient_id and template_id are required', 400);
    }

    try {
      // Try Django backend first (if available)
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/dynamic-consultations/`, {
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

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('[DYNAMIC CONSULTATIONS API] Successfully created in Django backend');
        
        return createResponse({
          success: true,
          data: backendData,
          message: 'Consultation created successfully'
        }, 201);
      } else {
        console.warn('[DYNAMIC CONSULTATIONS API] Django backend unavailable, using Supabase fallback');
        throw new Error('Django backend unavailable');
      }
    } catch (error) {
      console.error('[DYNAMIC CONSULTATIONS API] Backend error, using Supabase fallback:', error);
      
      // Django failed - use Supabase fallback
      console.log('[DYNAMIC CONSULTATIONS API] Using Supabase fallback for consultation creation');
      
      try {
        // Prepare consultation data for Supabase
        const consultationData = {
          id: crypto.randomUUID(),
          patient_id: body.patient_id,
          professional_id: user.id, // Current user is the professional
          consultation_date: body.consultation_date || new Date().toISOString(),
          consultation_type: body.template_type || 'general',
          
          // Dynamic form fields stored as JSON
          form_data: {
            template_id: body.template_id,
            template_name: body.template_name,
            fields: body
          },
          
          // Extract specific fields for database structure
          chief_complaint: body.subjective?.substring(0, 500) || '',
          history_present_illness: body.subjective || '',
          physical_examination: body.objective || '',
          assessment: body.analysis || '',
          plan: body.plan || '',
          
          // Structured diagnoses
          diagnosis_codes: [
            body.diagnosis_dsm5 && { type: 'DSM-5-TR', code: body.diagnosis_dsm5 },
            body.diagnosis_cie10 && { type: 'CIE-10', code: body.diagnosis_cie10 }
          ].filter(Boolean),
          
          // Follow up
          follow_up_date: body.next_appointment || null,
          
          // Metadata
          status: 'completed',
          duration_minutes: 60, // Default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Apply tenant context using dual-system pattern
          clinic_id: tenantType === 'clinic' ? tenantId : null,
          workspace_id: tenantType === 'workspace' ? (tenantId || user.id) : (tenantType !== 'clinic' ? user.id : null),
          
          // Additional fields for comprehensive record
          vital_signs: body.vital_signs ? JSON.parse(JSON.stringify(body.vital_signs)) : null,
          prescriptions: body.prescriptions_section || null,
          notes: body.additional_notes || '',
          
          // Integration references
          clinimetrix_assessments: body.clinimetrix_section || null,
          resources_sent: body.resources_section || null,
        };

        // Insert consultation into Supabase
        const { data: consultation, error: insertError } = await supabaseAdmin
          .from('consultations')
          .insert(consultationData)
          .select()
          .single();

        if (insertError) {
          console.error('[DYNAMIC CONSULTATIONS API] Supabase insert error:', insertError);
          throw new Error(`Failed to create consultation in database: ${insertError.message}`);
        }

        // Handle file uploads if present
        if (body.attached_files && Object.keys(body.attached_files).length > 0) {
          console.log('[DYNAMIC CONSULTATIONS API] Processing file uploads...');
          
          // TODO: Implement file upload handling
          // This would involve:
          // 1. Upload files to storage (Supabase Storage or similar)
          // 2. Create records in documents table
          // 3. Link documents to consultation
          
          console.log('[DYNAMIC CONSULTATIONS API] File upload feature - to be implemented');
        }

        console.log('[DYNAMIC CONSULTATIONS API] Supabase fallback success - consultation created:', consultation.id);
        return createResponse({
          success: true,
          data: consultation,
          message: 'Consultation created successfully',
          source: 'supabase_fallback'
        }, 201);

      } catch (supabaseError) {
        console.error('[DYNAMIC CONSULTATIONS API] Supabase fallback completely failed:', supabaseError);
        return createErrorResponse(
          'Failed to create consultation',
          `Could not create consultation in any database: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
          500
        );
      }
    }

  } catch (error) {
    console.error('[DYNAMIC CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to create dynamic consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log('[DYNAMIC CONSULTATIONS API] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patient_id');
    
    console.log('[DYNAMIC CONSULTATIONS API] Fetching consultations for patient:', patientId, 'with tenant context:', { tenantId, tenantType });

    try {
      // Build query for consultations with tenant filtering
      let query = supabaseAdmin
        .from('consultations')
        .select(`
          id,
          patient_id,
          professional_id,
          consultation_date,
          consultation_type,
          form_data,
          chief_complaint,
          history_present_illness,
          physical_examination,
          assessment,
          plan,
          diagnosis_codes,
          follow_up_date,
          status,
          duration_minutes,
          created_at,
          updated_at
        `);

      // Apply tenant filtering
      if (tenantType === 'clinic' && tenantId) {
        query = query.eq('clinic_id', tenantId);
      } else {
        // For individual workspace, filter by professional and workspace
        query = query.eq('professional_id', user.id).eq('workspace_id', tenantId || user.id);
      }

      query = query.order('consultation_date', { ascending: false });

      // Filter by patient if specified
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data: consultations, error: queryError } = await query;
      
      if (queryError) {
        console.error('[DYNAMIC CONSULTATIONS API] Query error:', queryError);
        throw new Error(`Failed to query consultations: ${queryError.message}`);
      }
      
      console.log(`[DYNAMIC CONSULTATIONS API] Found ${consultations?.length || 0} consultations`);
      
      return createResponse({
        success: true,
        data: consultations || [],
        count: consultations?.length || 0,
        source: 'supabase_direct'
      });

    } catch (supabaseError) {
      console.error('[DYNAMIC CONSULTATIONS API] Database query failed:', supabaseError);
      return createErrorResponse(
        'Failed to fetch consultations',
        `Database error: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
        500
      );
    }

  } catch (error) {
    console.error('[DYNAMIC CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch dynamic consultations',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}