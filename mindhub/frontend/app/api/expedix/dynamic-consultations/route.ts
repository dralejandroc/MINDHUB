// DEPRECATED: Dynamic consultations functionality moved to unified consultations API
// This endpoint redirects to the main consultations API for harmonized workflow
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[DYNAMIC CONSULTATIONS API] DEPRECATED - Redirecting to unified consultations API');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    console.log('[DYNAMIC CONSULTATIONS API] Redirecting dynamic consultation creation to main consultations API');

    // Transform dynamic consultation data to standard consultation format
    const consultationData = {
      patient_id: body.patient_id,
      consultation_type: body.template_type || 'general',
      template_id: body.template_id,
      template_name: body.template_name,
      
      // Map dynamic fields to consultation structure
      chief_complaint: body.subjective?.substring(0, 500) || body.chiefComplaint || '',
      history_present_illness: body.subjective || body.currentCondition || '',
      physical_examination: body.objective || body.physicalExamination || body.emergencyExam || '',
      
      // Mental exam integration (now unified)
      mental_exam: body.mental_exam || body.mentalExam || body.mentalStatusExam || {},
      
      assessment: body.analysis || body.assessment || body.riskAssessment || '',
      plan: body.plan || body.treatmentPlan || body.emergencyTreatment || body.treatmentAdjustments || '',
      
      // Additional dynamic data stored as metadata
      form_data: {
        template_id: body.template_id,
        template_name: body.template_name,
        original_fields: body
      },
      
      // Status and metadata
      status: 'completed',
      is_draft: false,
      is_finalized: true,
      consultation_date: body.consultation_date || new Date().toISOString().split('T')[0],
      consultation_time: new Date().toTimeString().split(' ')[0],
      duration_minutes: 60,
      
      // Integrations
      clinimetrix_integrations: body.clinimetrix_section || [],
      resources_sent: body.resources_section || [],
      prescriptions: body.prescriptions_section || [],
      
      // Follow up
      follow_up_date: body.next_appointment || body.follow_up_date || null,
      follow_up_instructions: body.next_appointment_notes || ''
    };

    // Call unified consultations API internally
    const consultationsUrl = new URL('/api/expedix/consultations', request.url).toString();
    
    const consultationResponse = await fetch(consultationsUrl, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'Content-Type': 'application/json',
        'X-Internal-Redirect': 'true',
        'X-Original-Endpoint': 'dynamic-consultations'
      },
      body: JSON.stringify(consultationData)
    });

    if (!consultationResponse.ok) {
      const errorData = await consultationResponse.json().catch(() => ({}));
      console.error('[DYNAMIC CONSULTATIONS API] Unified API error:', consultationResponse.status, errorData);
      
      return createErrorResponse(
        'Consultation creation failed',
        `Unified consultations API error: ${errorData.error || 'Unknown error'}`,
        consultationResponse.status
      );
    }

    const result = await consultationResponse.json();
    console.log('[DYNAMIC CONSULTATIONS API] Successfully created via unified API:', result.data?.id);

    return createResponse({
      success: true,
      data: result.data,
      message: 'Dynamic consultation created successfully via unified API',
      redirect_source: 'dynamic-consultations',
      unified_api_used: true
    }, 201);

  } catch (error) {
    console.error('[DYNAMIC CONSULTATIONS API] Error:', error);
    return createErrorResponse(
      'Failed to create dynamic consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// GET, PUT, DELETE methods not supported - redirect to consultations API
export async function GET(request: Request) {
  return createErrorResponse(
    'Endpoint deprecated',
    'Dynamic consultations have been unified. Use /api/expedix/consultations instead.',
    410
  );
}

export async function PUT(request: Request) {
  return createErrorResponse(
    'Endpoint deprecated', 
    'Dynamic consultations have been unified. Use /api/expedix/consultations instead.',
    410
  );
}

export async function DELETE(request: Request) {
  return createErrorResponse(
    'Endpoint deprecated',
    'Dynamic consultations have been unified. Use /api/expedix/consultations instead.',
    410
  );
}