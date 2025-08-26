// FrontDesk Pending Tasks API - Direct Supabase with dual system support
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[FRONTDESK TASKS] Processing pending tasks request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get user's workspace or clinic context (DUAL SYSTEM)
    let contextFilter: any = {};
    
    // Check for individual workspace first
    const { data: workspace } = await supabaseAdmin
      .from('individual_workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (workspace) {
      contextFilter.workspace_id = workspace.id;
      console.log('[FRONTDESK TASKS] Using workspace context:', workspace.id);
    } else {
      // Check for clinic membership
      const { data: membership } = await supabaseAdmin
        .from('tenant_memberships')
        .select('clinic_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (membership) {
        contextFilter.clinic_id = membership.clinic_id;
        console.log('[FRONTDESK TASKS] Using clinic context:', membership.clinic_id);
      } else {
        // No context found - return empty tasks
        console.log('[FRONTDESK TASKS] No context found, returning empty tasks');
        return createResponse({
          success: true,
          data: [],
          count: 0
        });
      }
    }

    // For now, return upcoming appointments as "pending tasks"
    // This provides meaningful data for the FrontDesk
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        appointment_type,
        patients (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('appointment_date', tomorrowISO)
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true })
      .limit(10);
    
    if (contextFilter.workspace_id) {
      appointmentsQuery = appointmentsQuery.eq('workspace_id', contextFilter.workspace_id);
    } else if (contextFilter.clinic_id) {
      appointmentsQuery = appointmentsQuery.eq('clinic_id', contextFilter.clinic_id);
    }
    
    const { data: appointments, error } = await appointmentsQuery;

    if (error) {
      console.error('[FRONTDESK TASKS] Database error:', error);
      throw error;
    }

    // Transform appointments into task format
    const tasks = (appointments || []).map(appointment => {
      const patient = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;
      return {
        id: appointment.id,
        type: 'upcoming_appointment',
        title: `Cita: ${patient?.first_name || 'N/A'} ${patient?.last_name || ''}`,
        description: `${appointment.appointment_type || 'Consulta'} - ${appointment.start_time}`,
        priority: 'normal',
        due_date: appointment.appointment_date,
        patient_name: `${patient?.first_name || 'N/A'} ${patient?.last_name || ''}`,
        patient_phone: patient?.phone || '',
        created_at: new Date().toISOString()
      };
    });

    console.log('[FRONTDESK TASKS] Tasks retrieved:', tasks.length);

    return createResponse({
      success: true,
      data: tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('[FRONTDESK TASKS] Error:', error);
    return createErrorResponse(
      'Failed to get tasks',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}