/**
 * 🏥 MEDICAL CREDENTIALS API
 * 
 * Gestión de credenciales médicas básicas
 * Para actualizar información profesional médica
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface MedicalCredentialsUpdate {
  professional_license_number?: string;
  medical_specialization?: string;
  medical_school?: string;
  graduation_year?: number;
  professional_board?: string;
  license_expiry_date?: string;
  secondary_specializations?: string[];
  professional_signature_url?: string;
}

/**
 * GET /api/medical-credentials - Obtener credenciales médicas del usuario
 */
export async function GET(request: Request) {
  try {
    console.log('[MEDICAL CREDENTIALS] Getting user medical credentials');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener datos médicos del perfil
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        professional_license_number,
        medical_specialization,
        medical_school,
        graduation_year,
        professional_board,
        license_expiry_date,
        credentials_verified,
        verification_status,
        secondary_specializations,
        professional_signature_url
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[MEDICAL CREDENTIALS] Error fetching profile:', error);
      return createErrorResponse('Database error', 'Error fetching medical credentials', 500);
    }

    console.log('[MEDICAL CREDENTIALS] Medical credentials retrieved successfully');

    return createResponse({
      success: true,
      data: profile || {},
      message: 'Medical credentials retrieved successfully'
    });

  } catch (error) {
    console.error('[MEDICAL CREDENTIALS] GET Error:', error);
    return createErrorResponse(
      'Failed to fetch medical credentials',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * PUT /api/medical-credentials - Actualizar credenciales médicas del usuario
 */
export async function PUT(request: Request) {
  try {
    console.log('[MEDICAL CREDENTIALS] Updating user medical credentials');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body: MedicalCredentialsUpdate = await request.json();
    
    // Validar datos básicos
    if (body.professional_license_number && typeof body.professional_license_number !== 'string') {
      return createErrorResponse('Invalid data', 'Professional license number must be a string', 400);
    }

    if (body.graduation_year && (body.graduation_year < 1950 || body.graduation_year > new Date().getFullYear())) {
      return createErrorResponse('Invalid data', 'Invalid graduation year', 400);
    }

    // Preparar datos para actualización
    const updateData: Partial<MedicalCredentialsUpdate> = {};
    
    if (body.professional_license_number !== undefined) {
      updateData.professional_license_number = body.professional_license_number.trim();
    }
    
    if (body.medical_specialization !== undefined) {
      updateData.medical_specialization = body.medical_specialization.trim();
    }
    
    if (body.medical_school !== undefined) {
      updateData.medical_school = body.medical_school.trim();
    }
    
    if (body.graduation_year !== undefined) {
      updateData.graduation_year = body.graduation_year;
    }
    
    if (body.professional_board !== undefined) {
      updateData.professional_board = body.professional_board.trim();
    }
    
    if (body.license_expiry_date !== undefined) {
      updateData.license_expiry_date = body.license_expiry_date;
    }
    
    if (body.secondary_specializations !== undefined) {
      updateData.secondary_specializations = body.secondary_specializations;
    }
    
    if (body.professional_signature_url !== undefined) {
      updateData.professional_signature_url = body.professional_signature_url;
    }

    console.log('[MEDICAL CREDENTIALS] Updating with data:', Object.keys(updateData));

    // Actualizar credenciales médicas
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select(`
        professional_license_number,
        medical_specialization,
        medical_school,
        graduation_year,
        professional_board,
        license_expiry_date,
        credentials_verified,
        verification_status,
        secondary_specializations,
        professional_signature_url
      `)
      .single();

    if (error) {
      console.error('[MEDICAL CREDENTIALS] Error updating profile:', error);
      return createErrorResponse('Database error', error.message, 500);
    }

    console.log('[MEDICAL CREDENTIALS] Medical credentials updated successfully');

    return createResponse({
      success: true,
      data: updatedProfile,
      message: 'Medical credentials updated successfully'
    });

  } catch (error) {
    console.error('[MEDICAL CREDENTIALS] PUT Error:', error);
    return createErrorResponse(
      'Failed to update medical credentials',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/medical-credentials/verify - Solicitar verificación de credenciales
 */
export async function POST(request: Request) {
  try {
    console.log('[MEDICAL CREDENTIALS] Requesting credentials verification');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Verificar que el usuario tenga datos médicos mínimos
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('professional_license_number, medical_specialization, medical_school')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return createErrorResponse('Profile not found', 'User profile not found', 404);
    }

    if (!profile.professional_license_number || !profile.medical_specialization) {
      return createErrorResponse(
        'Incomplete credentials',
        'Professional license number and specialization are required for verification',
        400
      );
    }

    // Actualizar estado de verificación a 'pending'
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[MEDICAL CREDENTIALS] Error updating verification status:', updateError);
      return createErrorResponse('Database error', updateError.message, 500);
    }

    console.log('[MEDICAL CREDENTIALS] Verification request submitted successfully');

    return createResponse({
      success: true,
      data: {
        verification_status: 'pending',
        message: 'Verification request submitted successfully. Our team will review your credentials within 24-48 hours.'
      },
      message: 'Verification request submitted successfully'
    });

  } catch (error) {
    console.error('[MEDICAL CREDENTIALS] POST Error:', error);
    return createErrorResponse(
      'Failed to request verification',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}