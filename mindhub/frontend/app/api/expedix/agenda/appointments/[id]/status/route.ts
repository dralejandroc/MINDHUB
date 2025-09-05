import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';
import { resolveTenantContext, validateTenantAccess } from '@/lib/tenant-resolver';

// Robust appointment status update with tenant validation
async function updateAppointmentStatus(request: Request, params: { id: string }) {
  try {
    console.log('[APPOINTMENT STATUS] Processing update for appointment:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const { id } = params;
    const body = await request.json();
    
    // Get tenant context for validation
    const tenantContext = await resolveTenantContext(user.id);
    console.log('[APPOINTMENT STATUS] User context:', tenantContext);
    
    // First, fetch the appointment to validate tenant access
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, clinic_id, workspace_id, status, patient_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !appointment) {
      return createErrorResponse(
        'Appointment not found', 
        `No appointment found with ID: ${id}`,
        404
      );
    }
    
    // Validate tenant access
    if (!validateTenantAccess(appointment, tenantContext)) {
      return createErrorResponse(
        'Access denied',
        'You do not have permission to update this appointment',
        403
      );
    }
    
    // Update appointment status
    const updateData: {
      status: any;
      updated_at: string;
      confirmation_sent?: boolean;
      confirmation_date?: string;
    } = {
      status: body.status || 'updated',
      updated_at: new Date().toISOString()
    };
    
    // Add confirmation tracking if status is 'confirmed'
    if (body.status === 'confirmed') {
      updateData.confirmation_sent = true;
      updateData.confirmation_date = new Date().toISOString();
    }
    
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, email
        )
      `)
      .single();
      
    if (updateError) {
      console.error('[APPOINTMENT STATUS] Update failed:', updateError);
      return createErrorResponse(
        'Update failed',
        `Failed to update appointment: ${updateError.message}`,
        500
      );
    }
    
    console.log('[APPOINTMENT STATUS] Successfully updated appointment:', id, 'to status:', body.status);
    
    return createResponse({
      success: true,
      data: updatedAppointment,
      message: `Appointment status updated to ${body.status}`,
      source: 'supabase_direct'
    });

  } catch (error) {
    console.error('[APPOINTMENT STATUS] Error:', error);
    return createErrorResponse(
      'Failed to update appointment status',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateAppointmentStatus(request, params);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return updateAppointmentStatus(request, params);
}