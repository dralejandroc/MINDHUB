// ClinimetrixPro assessments API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX ASSESSMENTS API] Processing GET request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX ASSESSMENTS API] Authenticated user:', user.id);

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patient_id');
    const templateId = searchParams.get('template_id');

    console.log('[CLINIMETRIX ASSESSMENTS API] Query params:', { search, limit, offset, status, patientId, templateId });

    // Build Supabase query for assessments
    let query = supabaseAdmin
      .from('clinimetrix_assessments')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email
        ),
        clinimetrix_templates!inner(
          id,
          template_data
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    // Apply search if provided
    if (search) {
      query = query.or(`notes.ilike.%${search}%,administered_by.ilike.%${search}%`);
    }

    // Execute query
    const { data: assessments, error, count } = await query;

    if (error) {
      console.error('[CLINIMETRIX ASSESSMENTS API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CLINIMETRIX ASSESSMENTS API] Successfully fetched assessments:', count, 'total');

    // Transform data to include template metadata
    const transformedAssessments = assessments.map(assessment => ({
      ...assessment,
      template_name: assessment.clinimetrix_templates?.template_data?.metadata?.name || 'Unknown Template',
      template_abbreviation: assessment.clinimetrix_templates?.template_data?.metadata?.abbreviation || 'N/A',
      patient_full_name: `${assessment.patients.first_name} ${assessment.patients.paternal_last_name} ${assessment.patients.maternal_last_name || ''}`.trim()
    }));

    return createResponse({
      success: true,
      data: transformedAssessments,
      total: count,
      limit,
      offset,
      search,
      status,
      patient_id: patientId,
      template_id: templateId
    });

  } catch (error) {
    console.error('[CLINIMETRIX ASSESSMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch assessments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CLINIMETRIX ASSESSMENTS API] Processing POST request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX ASSESSMENTS API] Authenticated user:', user.id);

    // Get request body
    const body = await request.json();
    console.log('[CLINIMETRIX ASSESSMENTS API] Creating assessment with data:', Object.keys(body));

    // Validate required fields
    if (!body.patient_id || !body.template_id) {
      return createErrorResponse('Validation error', 'patient_id and template_id are required', 400);
    }

    // Prepare assessment data
    const assessmentData = {
      ...body,
      administered_by: user.id,
      status: body.status || 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert assessment into Supabase
    const { data: assessment, error } = await supabaseAdmin
      .from('clinimetrix_assessments')
      .insert(assessmentData)
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          paternal_last_name,
          maternal_last_name,
          email
        ),
        clinimetrix_templates!inner(
          id,
          template_data
        )
      `)
      .single();

    if (error) {
      console.error('[CLINIMETRIX ASSESSMENTS API] Supabase insert error:', error);
      
      // Handle specific errors
      if (error.code === '23503') { // Foreign key violation
        return createErrorResponse('Invalid data', 'Patient or template not found', 400);
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CLINIMETRIX ASSESSMENTS API] Successfully created assessment:', assessment.id);

    // Transform response
    const transformedAssessment = {
      ...assessment,
      template_name: assessment.clinimetrix_templates?.template_data?.metadata?.name || 'Unknown Template',
      template_abbreviation: assessment.clinimetrix_templates?.template_data?.metadata?.abbreviation || 'N/A',
      patient_full_name: `${assessment.patients.first_name} ${assessment.patients.paternal_last_name} ${assessment.patients.maternal_last_name || ''}`.trim()
    };

    return createResponse({
      success: true,
      data: transformedAssessment,
      message: 'Assessment created successfully'
    }, 201);

  } catch (error) {
    console.error('[CLINIMETRIX ASSESSMENTS API] Error:', error);
    return createErrorResponse(
      'Failed to create assessment',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}