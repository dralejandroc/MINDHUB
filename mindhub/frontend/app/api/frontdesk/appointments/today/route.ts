// FrontDesk Appointments Today API - Direct Supabase with dual system support
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[FRONTDESK APPOINTMENTS] Processing today appointments request');
    
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
      console.log('[FRONTDESK APPOINTMENTS] Using workspace context:', workspace.id);
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
        console.log('[FRONTDESK APPOINTMENTS] Using clinic context:', membership.clinic_id);
      } else {
        // No context found - return empty appointments
        console.log('[FRONTDESK APPOINTMENTS] No context found, returning empty appointments');
        return createResponse({
          success: true,
          data: [],
          count: 0
        });
      }
    }

    // Get today's date
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    // Get appointments with patient details
    let appointmentsQuery = supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        appointment_type,
        notes,
        created_at,
        updated_at,
        patients!inner (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('appointment_date', todayISO)
      .order('start_time', { ascending: true });
    
    if (contextFilter.workspace_id) {
      appointmentsQuery = appointmentsQuery.eq('workspace_id', contextFilter.workspace_id);
    } else if (contextFilter.clinic_id) {
      appointmentsQuery = appointmentsQuery.eq('clinic_id', contextFilter.clinic_id);
    }
    
    const { data: appointments, error } = await appointmentsQuery;

    if (error) {
      console.error('[FRONTDESK APPOINTMENTS] Database error:', error);
      throw error;
    }

    console.log('[FRONTDESK APPOINTMENTS] Appointments retrieved:', appointments?.length || 0);

    return createResponse({
      success: true,
      data: appointments || [],
      count: appointments?.length || 0
    });

  } catch (error) {
    console.error('[FRONTDESK APPOINTMENTS] Error:', error);
    return createErrorResponse(
      'Failed to get appointments',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}