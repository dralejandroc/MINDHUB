// Assessment link creation API for ClinimetrixPro
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[ASSESSMENT LINK API] Processing POST request to create assessment link');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    console.log('[ASSESSMENT LINK API] Creating assessment link with data:', Object.keys(body));

    // Validate required fields - handle both naming conventions
    const patientId = body.patient_id || body.patientId;
    const scaleId = body.scale_id || body.scaleId;
    
    if (!patientId || !scaleId) {
      return createErrorResponse('Validation error', 'patient_id/patientId and scale_id/scaleId are required', 400);
    }

    // Generate unique assessment token
    const assessmentToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Get tenant context
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    let clinic_id = null;
    let workspace_id = null;

    if (tenantType && tenantId) {
      if (tenantType === 'clinic') {
        clinic_id = tenantId;
      } else if (tenantType === 'workspace') {
        workspace_id = tenantId;
      }
    } else {
      // Fallback: Check for user's workspace
      const { data: workspace } = await supabaseAdmin
        .from('individual_workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (workspace) {
        workspace_id = workspace.id;
      }
    }

    // Create assessment record
    const assessmentData = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      scale_id: scaleId,
      professional_id: user.id,
      token: assessmentToken,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      clinic_id,
      workspace_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: assessment, error } = await supabaseAdmin
      .from('assessments')
      .insert(assessmentData)
      .select(`
        *,
        patients!inner(id, first_name, last_name, paternal_last_name),
        scales!inner(id, name, abbreviation)
      `)
      .single();

    if (error) {
      console.error('[ASSESSMENT LINK API] Error creating assessment:', error);
      return createErrorResponse(
        'Database error',
        `Failed to create assessment: ${error.message}`,
        500
      );
    }

    // Generate public link
    const publicLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/remote/${assessmentToken}`;
    
    console.log('[ASSESSMENT LINK API] Successfully created assessment link:', assessment.id);

    return createResponse({
      success: true,
      data: assessment,
      link: publicLink,
      publicLink: publicLink,
      message: 'Assessment link created successfully'
    }, 201);

  } catch (error) {
    console.error('[ASSESSMENT LINK API] Error:', error);
    return createErrorResponse(
      'Failed to create assessment link',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}