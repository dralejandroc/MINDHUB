// Tenant Memberships API - Gestiona invitaciones y membresías de clínica
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// GET: Obtener membresías del usuario actual
export async function GET(request: Request) {
  try {
    console.log('[TENANT MEMBERSHIPS API] Getting user memberships');
    
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const url = new URL(request.url);
    const clinicId = url.searchParams.get('clinic_id');

    try {
      let query = supabaseAdmin
        .from('tenant_memberships')
        .select(`
          id,
          clinic_id,
          role,
          permissions,
          is_active,
          joined_at,
          created_at,
          clinics (
            id,
            name,
            business_name,
            logo_url,
            subscription_plan,
            is_active
          ),
          invited_by_user:invited_by (
            id,
            email
          )
        `)
        .eq('user_id', user.id);

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data: memberships, error: membershipsError } = await query
        .order('joined_at', { ascending: false });

      if (membershipsError) {
        throw new Error(membershipsError.message);
      }

      console.log(`[TENANT MEMBERSHIPS API] Found ${memberships?.length || 0} memberships`);

      return createResponse({
        success: true,
        data: memberships || [],
        count: memberships?.length || 0
      });

    } catch (error) {
      console.error('[TENANT MEMBERSHIPS API] Database error:', error);
      return createErrorResponse(
        'Failed to get memberships',
        error instanceof Error ? error.message : 'Database error',
        500
      );
    }

  } catch (error) {
    console.error('[TENANT MEMBERSHIPS API] Error:', error);
    return createErrorResponse(
      'Failed to get memberships',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// POST: Invitar usuario a clínica o aceptar invitación
export async function POST(request: Request) {
  try {
    console.log('[TENANT MEMBERSHIPS API] Processing membership action');
    
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    const { action, clinic_id, user_email, role = 'member' } = body;

    if (!action || !clinic_id) {
      return createErrorResponse('Validation error', 'action and clinic_id are required', 400);
    }

    try {
      if (action === 'invite') {
        // Invitar a un usuario por email
        if (!user_email) {
          return createErrorResponse('Validation error', 'user_email is required for invite action', 400);
        }

        // Verificar que el usuario actual puede invitar (es admin de la clínica)
        const { data: currentMembership, error: membershipError } = await supabaseAdmin
          .from('tenant_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('clinic_id', clinic_id)
          .eq('is_active', true)
          .single();

        if (membershipError || !currentMembership || !['admin', 'owner'].includes(currentMembership.role)) {
          return createErrorResponse('Access denied', 'Only clinic admins can invite users', 403);
        }

        // Buscar el usuario por email
        const { data: invitedUser, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', user_email.toLowerCase())
          .single();

        if (userError || !invitedUser) {
          return createErrorResponse('User not found', 'No user found with that email address', 404);
        }

        // Verificar que no existe ya una membresía
        const { data: existingMembership } = await supabaseAdmin
          .from('tenant_memberships')
          .select('id, is_active')
          .eq('user_id', invitedUser.id)
          .eq('clinic_id', clinic_id)
          .single();

        if (existingMembership) {
          if (existingMembership.is_active) {
            return createErrorResponse('Already member', 'User is already a member of this clinic', 400);
          } else {
            // Reactivar membresía existente
            const { data: reactivated, error: reactivateError } = await supabaseAdmin
              .from('tenant_memberships')
              .update({ 
                is_active: true, 
                role, 
                invited_by: user.id,
                updated_at: new Date().toISOString() 
              })
              .eq('id', existingMembership.id)
              .select()
              .single();

            if (reactivateError) {
              throw new Error(reactivateError.message);
            }

            return createResponse({
              success: true,
              data: reactivated,
              message: 'User membership reactivated successfully'
            }, 200);
          }
        }

        // Crear nueva membresía
        const { data: newMembership, error: createError } = await supabaseAdmin
          .from('tenant_memberships')
          .insert({
            user_id: invitedUser.id,
            clinic_id,
            role,
            is_active: true,
            invited_by: user.id
          })
          .select(`
            id,
            role,
            is_active,
            joined_at,
            clinics (name, business_name)
          `)
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        console.log(`[TENANT MEMBERSHIPS API] User invited successfully: ${user_email} to clinic ${clinic_id}`);

        return createResponse({
          success: true,
          data: newMembership,
          message: 'User invited to clinic successfully'
        }, 201);

      } else if (action === 'leave') {
        // Abandonar clínica
        const { data: membership, error: updateError } = await supabaseAdmin
          .from('tenant_memberships')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('clinic_id', clinic_id)
          .eq('is_active', true)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        if (!membership) {
          return createErrorResponse('Not found', 'No active membership found', 404);
        }

        console.log(`[TENANT MEMBERSHIPS API] User left clinic: ${user.id} from ${clinic_id}`);

        return createResponse({
          success: true,
          data: membership,
          message: 'Left clinic successfully'
        });

      } else {
        return createErrorResponse('Invalid action', 'Supported actions: invite, leave', 400);
      }

    } catch (error) {
      console.error('[TENANT MEMBERSHIPS API] Database error:', error);
      return createErrorResponse(
        'Failed to process membership action',
        error instanceof Error ? error.message : 'Database error',
        500
      );
    }

  } catch (error) {
    console.error('[TENANT MEMBERSHIPS API] Error:', error);
    return createErrorResponse(
      'Failed to process membership action',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// PUT: Actualizar rol de membresía
export async function PUT(request: Request) {
  try {
    console.log('[TENANT MEMBERSHIPS API] Updating membership');
    
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    const { membership_id, role, is_active } = body;

    if (!membership_id) {
      return createErrorResponse('Validation error', 'membership_id is required', 400);
    }

    try {
      // Obtener la membresía y verificar permisos
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .select(`
          id,
          user_id,
          clinic_id,
          role,
          is_active
        `)
        .eq('id', membership_id)
        .single();

      if (membershipError || !membership) {
        return createErrorResponse('Not found', 'Membership not found', 404);
      }

      // Verificar que el usuario actual puede modificar esta membresía
      const { data: currentMembership, error: currentError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('clinic_id', membership.clinic_id)
        .eq('is_active', true)
        .single();

      if (currentError || !currentMembership || !['admin', 'owner'].includes(currentMembership.role)) {
        return createErrorResponse('Access denied', 'Only clinic admins can modify memberships', 403);
      }

      // Actualizar la membresía
      const updateData: any = { updated_at: new Date().toISOString() };
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedMembership, error: updateError } = await supabaseAdmin
        .from('tenant_memberships')
        .update(updateData)
        .eq('id', membership_id)
        .select(`
          id,
          role,
          is_active,
          joined_at,
          clinics (name, business_name)
        `)
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log(`[TENANT MEMBERSHIPS API] Membership updated: ${membership_id}`);

      return createResponse({
        success: true,
        data: updatedMembership,
        message: 'Membership updated successfully'
      });

    } catch (error) {
      console.error('[TENANT MEMBERSHIPS API] Database error:', error);
      return createErrorResponse(
        'Failed to update membership',
        error instanceof Error ? error.message : 'Database error',
        500
      );
    }

  } catch (error) {
    console.error('[TENANT MEMBERSHIPS API] Error:', error);
    return createErrorResponse(
      'Failed to update membership',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}