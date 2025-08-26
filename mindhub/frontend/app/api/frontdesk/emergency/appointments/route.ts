// Emergency FrontDesk Appointments API - Direct Supabase connection
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[FRONTDESK EMERGENCY] Processing appointments request');
    
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
        // No context found - return empty appointments
        return createResponse({
          success: true,
          data: [],
          count: 0
        });
      }
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get appointments with patient details
    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        type,
        notes,
        created_at,
        updated_at,
        patients (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .gte('appointment_date', today.toISOString())
      .lt('appointment_date', tomorrow.toISOString())
      .order('appointment_time', { ascending: true });
    
    if (contextFilter.workspace_id) {
      appointmentsQuery = appointmentsQuery.eq('workspace_id', contextFilter.workspace_id);
    } else if (contextFilter.clinic_id) {
      appointmentsQuery = appointmentsQuery.eq('clinic_id', contextFilter.clinic_id);
    }
    
    const { data: appointments, error } = await appointmentsQuery;

    if (error) {
      console.error('[FRONTDESK EMERGENCY] Database error:', error);
      throw error;
    }

    console.log('[FRONTDESK EMERGENCY] Appointments retrieved:', appointments?.length || 0);

    return createResponse({
      success: true,
      data: appointments || [],
      count: appointments?.length || 0,
      message: 'Emergency appointments retrieved successfully'
    });

  } catch (error) {
    console.error('[FRONTDESK EMERGENCY] Error:', error);
    return createErrorResponse(
      'Failed to get appointments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}