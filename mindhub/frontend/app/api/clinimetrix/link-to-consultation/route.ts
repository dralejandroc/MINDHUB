// ClinimetrixPro integration with Expedix - Link scale assessments to patient consultations
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function POST(request: Request) {
  try {
    console.log('[CLINIMETRIX INTEGRATION] Processing POST request to link assessment to consultation');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get request body
    const linkData = await request.json();
    console.log('[CLINIMETRIX INTEGRATION] Link data received:', {
      assessmentId: linkData.assessmentId,
      consultationId: linkData.consultationId,
      patientId: linkData.patientId,
      scaleId: linkData.scaleId
    });

    // Validate required fields
    if (!linkData.assessmentId || !linkData.consultationId || !linkData.patientId) {
      return createErrorResponse(
        'Missing required fields', 
        'assessmentId, consultationId, and patientId are required', 
        400
      );
    }
    
    // Forward request to Django backend to create the link
    const djangoUrl = `${DJANGO_API_BASE}/api/clinimetrix/link-assessment/`;
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      },
      body: JSON.stringify({
        ...linkData,
        linked_by: user.id,
        linked_at: new Date().toISOString(),
        integration_type: 'expedix_consultation',
        sync_status: 'pending'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CLINIMETRIX INTEGRATION] Django API error:', response.status, errorText);
      throw new Error(`Failed to link assessment: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[CLINIMETRIX INTEGRATION] Successfully linked assessment to consultation');

    // Also update the consultation with the assessment reference
    try {
      const consultationUpdateUrl = `${DJANGO_API_BASE}/api/expedix/consultations/${linkData.consultationId}/`;
      
      const consultationResponse = await fetch(consultationUpdateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
          'X-User-Email': user.email || '',
          'X-Proxy-Auth': 'verified',
        },
        body: JSON.stringify({
          linked_assessments: [
            ...(result.existing_assessments || []),
            {
              assessment_id: linkData.assessmentId,
              scale_id: linkData.scaleId,
              scale_name: linkData.scaleName,
              completed_at: linkData.completedAt,
              score: linkData.score,
              interpretation: linkData.interpretation,
              linked_at: new Date().toISOString()
            }
          ]
        }),
      });

      if (consultationResponse.ok) {
        console.log('[CLINIMETRIX INTEGRATION] Successfully updated consultation with assessment link');
      } else {
        console.warn('[CLINIMETRIX INTEGRATION] Failed to update consultation, but assessment link was created');
      }
    } catch (consultationError) {
      console.error('[CLINIMETRIX INTEGRATION] Error updating consultation:', consultationError);
      // Don't fail the entire request if consultation update fails
    }

    return createResponse({
      success: true,
      message: 'Assessment successfully linked to consultation',
      data: result,
      integration: {
        assessment_id: linkData.assessmentId,
        consultation_id: linkData.consultationId,
        patient_id: linkData.patientId,
        linked_at: new Date().toISOString(),
        linked_by: user.id
      }
    });

  } catch (error) {
    console.error('[CLINIMETRIX INTEGRATION] Error:', error);
    return createErrorResponse(
      'Failed to link assessment to consultation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX INTEGRATION] Processing GET request for consultation links');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const patientId = searchParams.get('patientId');
    const assessmentId = searchParams.get('assessmentId');

    if (!consultationId && !patientId && !assessmentId) {
      return createErrorResponse(
        'Missing parameters', 
        'At least one of consultationId, patientId, or assessmentId is required', 
        400
      );
    }
    
    // Build query parameters for Django
    const queryParams = new URLSearchParams();
    if (consultationId) queryParams.append('consultation_id', consultationId);
    if (patientId) queryParams.append('patient_id', patientId);
    if (assessmentId) queryParams.append('assessment_id', assessmentId);

    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/clinimetrix/assessment-links/?${queryParams}`;
    
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
      const errorText = await response.text();
      console.error('[CLINIMETRIX INTEGRATION] Django API error:', response.status, errorText);
      throw new Error(`Failed to get assessment links: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CLINIMETRIX INTEGRATION] Successfully retrieved assessment links');

    return createResponse(data);

  } catch (error) {
    console.error('[CLINIMETRIX INTEGRATION] Error:', error);
    return createErrorResponse(
      'Failed to get assessment links',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}