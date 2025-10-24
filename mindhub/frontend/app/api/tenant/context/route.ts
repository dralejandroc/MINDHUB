// Tenant Context API - Maneja el contexto actual del usuario (clínica o workspace individual)
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

interface TenantContext {
  tenant_id: string | null;
  tenant_type: 'workspace' | 'clinic';
  tenant_name: string;
}

export async function GET(request: Request) {
  try {
    console.log('[TENANT CONTEXT API] Getting current tenant context');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    try {
      console.log('[TENANT CONTEXT API] Fetching user workspace and memberships...');

      // Also get user memberships for switching contexts
      const { data: memberships, error: membershipsError } = await supabaseAdmin
        .from('tenant_memberships')
        .select(`
          id,
          clinic_id,
          role,
          is_active,
          joined_at,
          clinics (
            id,
            name,
            business_name,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (membershipsError) {
        console.warn('[TENANT CONTEXT API] Error getting memberships:', membershipsError);
      }

      // Get individual workspace info
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('individual_workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (workspaceError) {
        console.warn('[TENANT CONTEXT API] Error getting workspace:', workspaceError);
      }

      // Determine current context - prioritize workspace if available, otherwise first clinic
      const currentContext: TenantContext = workspace ? {
        tenant_id: workspace.id,
        tenant_type: 'workspace',
        tenant_name: workspace.workspace_name || 'Mi Consultorio'
      } : (memberships && memberships.length > 0) ? {
        tenant_id: memberships[0].clinic_id,
        tenant_type: 'clinic',
        tenant_name: (memberships[0] as any).clinics?.name || (memberships[0] as any).clinics?.business_name
      } : {
        tenant_id: null,
        tenant_type: 'workspace',
        tenant_name: 'Mi Consultorio'
      };

      const response = {
        current_context: currentContext,
        available_contexts: {
          workspace: workspace ? {
            id: workspace.id,
            name: workspace.workspace_name || 'Mi Consultorio',
            business_name: workspace.business_name,
            type: 'workspace'
          } : null,
          clinics: (memberships || []).map((m: any) => ({
            id: m.clinics.id,
            name: m.clinics.name,
            business_name: m.clinics.business_name,
            logo_url: m.clinics.logo_url,
            type: 'clinic',
            membership: {
              role: m.role,
              joined_at: m.joined_at
            }
          }))
        },
        user_id: user.id
      };

      console.log(`[TENANT CONTEXT API] Context retrieved: ${currentContext.tenant_type} - ${currentContext.tenant_name}`);
      
      return createResponse({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('[TENANT CONTEXT API] Database error:', error);
      return createErrorResponse(
        'Failed to get tenant context',
        error instanceof Error ? error.message : 'Database error',
        500
      );
    }

  } catch (error) {
    console.error('[TENANT CONTEXT API] Error:', error);
    return createErrorResponse(
      'Failed to get tenant context',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[TENANT CONTEXT API] Switching tenant context');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    const { tenant_id, tenant_type } = body;

    if (!tenant_id || !tenant_type) {
      return createErrorResponse('Validation error', 'tenant_id and tenant_type are required', 400);
    }

    // Validate that user can access this tenant
    if (tenant_type === 'clinic') {
      // Check if user is a member of this clinic
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('id, role, is_active')
        .eq('user_id', user.id)
        .eq('clinic_id', tenant_id)
        .eq('is_active', true)
        .single();

      if (membershipError || !membership) {
        return createErrorResponse('Access denied', 'User is not a member of this clinic', 403);
      }

    } else if (tenant_type === 'workspace') {
      // Check if this is user's individual workspace
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('individual_workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .eq('id', tenant_id)
        .single();

      if (workspaceError || !workspace) {
        return createErrorResponse('Access denied', 'This is not your individual workspace', 403);
      }
    }

    // Context switching is handled on client side with local storage/cookies
    // This endpoint just validates the switch is allowed
    console.log(`[TENANT CONTEXT API] Context switch validated: ${tenant_type} ${tenant_id}`);

    return createResponse({
      success: true,
      message: 'Context switch validated',
      data: {
        tenant_id,
        tenant_type,
        switched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[TENANT CONTEXT API] Error:', error);
    return createErrorResponse(
      'Failed to switch tenant context',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}