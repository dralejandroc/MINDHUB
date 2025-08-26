// Emergency FrontDesk Stats API - Direct Supabase connection
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[FRONTDESK EMERGENCY] Processing stats request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get user's workspace or clinic context
    let contextFilter: any = {};
    
    // Check for individual workspace
    const { data: workspace } = await supabaseAdmin
      .from('individual_workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    
    if (workspace) {
      contextFilter.workspace_id = workspace.id;
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
      } else {
        // No context found - return empty stats
        return createResponse({
          success: true,
          data: {
            appointments: 0,
            payments: 0,
            pendingPayments: 0,
            resourcesSent: 0,
            patients: 0
          }
        });
      }
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats with proper context filtering
    const stats = {
      appointments: 0,
      payments: 0,
      pendingPayments: 0,
      resourcesSent: 0,
      patients: 0
    };

    // Count appointments for today
    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date', today.toISOString())
      .lt('appointment_date', tomorrow.toISOString());
    
    if (contextFilter.workspace_id) {
      appointmentsQuery = appointmentsQuery.eq('workspace_id', contextFilter.workspace_id);
    } else if (contextFilter.clinic_id) {
      appointmentsQuery = appointmentsQuery.eq('clinic_id', contextFilter.clinic_id);
    }
    
    const { count: appointmentCount } = await appointmentsQuery;
    stats.appointments = appointmentCount || 0;

    // Count patients
    let patientsQuery = supabaseAdmin
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (contextFilter.workspace_id) {
      patientsQuery = patientsQuery.eq('workspace_id', contextFilter.workspace_id);
    } else if (contextFilter.clinic_id) {
      patientsQuery = patientsQuery.eq('clinic_id', contextFilter.clinic_id);
    }
    
    const { count: patientCount } = await patientsQuery;
    stats.patients = patientCount || 0;

    console.log('[FRONTDESK EMERGENCY] Stats retrieved:', stats);

    return createResponse({
      success: true,
      data: stats,
      message: 'Emergency stats retrieved successfully'
    });

  } catch (error) {
    console.error('[FRONTDESK EMERGENCY] Error:', error);
    return createErrorResponse(
      'Failed to get stats',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}