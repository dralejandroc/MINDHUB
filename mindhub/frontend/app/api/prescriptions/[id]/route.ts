/**
 * 💊 DIGITAL PRESCRIPTION INDIVIDUAL API
 * 
 * Gestión de recetas individuales: obtener, actualizar, cancelar
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';
import { resolveTenantContext, validateTenantAccess } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

/**
 * GET /api/prescriptions/[id] - Obtener receta específica
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION API] Processing GET request for ID:', params.id);
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    
    // Obtener la receta completa
    const { data: prescription, error } = await supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, maternal_last_name,
          date_of_birth, email, phone, allergies, chronic_conditions
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty, phone, email
        ),
        prescription_medications(
          id, medication_name, active_ingredient, concentration,
          pharmaceutical_form, presentation, dosage, frequency, duration,
          quantity_prescribed, unit_of_measure, administration_route,
          special_instructions, food_instructions, is_controlled_substance,
          order_index, plm_product_id, registry_number, laboratory
        ),
        consultations(
          id, consultation_type, consultation_date, chief_complaint
        ),
        prescription_interactions(
          id, interaction_type, severity_level, description, recommendation,
          acknowledged_by_doctor, override_reason
        ),
        prescription_dispensing_log(
          id, dispensed_at, quantity_dispensed, remaining_quantity,
          pharmacy_name, pharmacist_name, verification_method, notes
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('[PRESCRIPTION API] Database error:', error);
      return createErrorResponse(
        'Prescription not found',
        `No prescription found with ID: ${params.id}`,
        404
      );
    }

    // Validar acceso del tenant
    if (!validateTenantAccess(prescription, tenantContext)) {
      return createErrorResponse(
        'Access denied',
        'You do not have permission to access this prescription',
        403
      );
    }

    console.log('[PRESCRIPTION API] Successfully retrieved prescription:', prescription.prescription_number);

    return createResponse({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('[PRESCRIPTION API] GET Error:', error);
    return createErrorResponse(
      'Failed to retrieve prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * PUT /api/prescriptions/[id] - Actualizar receta
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION API] Processing PUT request for ID:', params.id);
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    
    const body = await request.json();

    // Verificar que la receta existe y el usuario tiene acceso
    const { data: existingPrescription, error: fetchError } = await supabaseAdmin
      .from('digital_prescriptions')
      .select('id, clinic_id, workspace_id, status, professional_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingPrescription) {
      return createErrorResponse(
        'Prescription not found',
        `No prescription found with ID: ${params.id}`,
        404
      );
    }

    // Validar acceso del tenant
    if (!validateTenantAccess(existingPrescription, tenantContext)) {
      return createErrorResponse(
        'Access denied',
        'You do not have permission to modify this prescription',
        403
      );
    }

    // Solo el médico que creó la receta puede modificarla (a menos que sea admin)
    if (existingPrescription.professional_id !== user.id && tenantContext.role !== 'admin' && tenantContext.role !== 'owner') {
      return createErrorResponse(
        'Access denied',
        'Only the prescribing doctor can modify this prescription',
        403
      );
    }

    // No permitir modificar recetas ya dispensadas o expiradas
    if (existingPrescription.status === 'dispensed' || existingPrescription.status === 'expired') {
      return createErrorResponse(
        'Cannot modify prescription',
        `Prescription is ${existingPrescription.status} and cannot be modified`,
        400
      );
    }

    // Actualizar la receta principal
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // No permitir cambiar ciertos campos críticos
    delete updateData.id;
    delete updateData.prescription_number;
    delete updateData.verification_code;
    delete updateData.patient_id;
    delete updateData.professional_id;
    delete updateData.clinic_id;
    delete updateData.workspace_id;
    delete updateData.created_at;

    const { data: updatedPrescription, error: updateError } = await supabaseAdmin
      .from('digital_prescriptions')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, maternal_last_name,
          date_of_birth, email
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty
        ),
        prescription_medications(
          id, medication_name, dosage, frequency, duration,
          quantity_prescribed, unit_of_measure, order_index
        )
      `)
      .single();

    if (updateError) {
      console.error('[PRESCRIPTION API] Update error:', updateError);
      return createErrorResponse(
        'Update failed',
        `Failed to update prescription: ${updateError.message}`,
        500
      );
    }

    console.log('[PRESCRIPTION API] Successfully updated prescription:', params.id);

    return createResponse({
      success: true,
      data: updatedPrescription,
      message: 'Prescription updated successfully'
    });

  } catch (error) {
    console.error('[PRESCRIPTION API] PUT Error:', error);
    return createErrorResponse(
      'Failed to update prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * DELETE /api/prescriptions/[id] - Cancelar receta
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION API] Processing DELETE request for ID:', params.id);
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    
    // Verificar que la receta existe y el usuario tiene acceso
    const { data: existingPrescription, error: fetchError } = await supabaseAdmin
      .from('digital_prescriptions')
      .select('id, clinic_id, workspace_id, status, professional_id, prescription_number')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingPrescription) {
      return createErrorResponse(
        'Prescription not found',
        `No prescription found with ID: ${params.id}`,
        404
      );
    }

    // Validar acceso del tenant
    if (!validateTenantAccess(existingPrescription, tenantContext)) {
      return createErrorResponse(
        'Access denied',
        'You do not have permission to cancel this prescription',
        403
      );
    }

    // Solo el médico que creó la receta puede cancelarla (a menos que sea admin)
    if (existingPrescription.professional_id !== user.id && tenantContext.role !== 'admin' && tenantContext.role !== 'owner') {
      return createErrorResponse(
        'Access denied',
        'Only the prescribing doctor can cancel this prescription',
        403
      );
    }

    // No permitir cancelar recetas ya dispensadas
    if (existingPrescription.status === 'dispensed') {
      return createErrorResponse(
        'Cannot cancel prescription',
        'Prescription has already been dispensed and cannot be cancelled',
        400
      );
    }

    // Marcar como cancelada
    const { data: cancelledPrescription, error: cancelError } = await supabaseAdmin
      .from('digital_prescriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        regulatory_notes: `Cancelled by ${user.email} on ${new Date().toISOString()}`
      })
      .eq('id', params.id)
      .select()
      .single();

    if (cancelError) {
      console.error('[PRESCRIPTION API] Cancel error:', cancelError);
      return createErrorResponse(
        'Cancel failed',
        `Failed to cancel prescription: ${cancelError.message}`,
        500
      );
    }

    console.log('[PRESCRIPTION API] Successfully cancelled prescription:', existingPrescription.prescription_number);

    return createResponse({
      success: true,
      data: cancelledPrescription,
      message: `Prescription ${existingPrescription.prescription_number} has been cancelled`
    });

  } catch (error) {
    console.error('[PRESCRIPTION API] DELETE Error:', error);
    return createErrorResponse(
      'Failed to cancel prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}