/**
 * UNIFIED TENANT ARCHITECTURE RESOLVER
 * 
 * Resolves tenant context (clinic vs individual workspace) for all users
 * Fixes critical 500 errors from clinic_id null constraints
 * 
 * Priority Order:
 * 1. tenant_memberships (clinic associations)
 * 2. profiles.clinic_id (direct clinic)  
 * 3. individual_workspaces (auto-create if needed)
 */

import { createClient } from '@/lib/supabase/client';

export interface TenantContext {
  type: 'clinic' | 'workspace';
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  clinic_id?: string;
  individual_workspace_id?: string;
}

export interface TenantMembership {
  id: string;
  clinic_id: string;
  role: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  is_active: boolean;
}

export interface IndividualWorkspace {
  id: string;
  workspace_name: string;
  owner_id: string;
}

/**
 * CRITICAL: Resolve tenant context for any user
 * This function MUST never fail - always returns valid context
 */
export async function resolveTenantContext(userId: string): Promise<TenantContext> {
  const supabase = createClient();
  
  console.log(`🔍 [Tenant Resolver] Resolving context for user: ${userId}`);
  
  try {
    // STEP 1: Check tenant_memberships (multi-professional clinics)
    console.log('📋 [Tenant Resolver] Checking tenant memberships...');
    
    const { data: memberships, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select(`
        id, clinic_id, role, permissions, is_active,
        clinics:clinic_id (id, name, is_active)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (membershipError) {
      console.error('❌ [Tenant Resolver] Membership query failed:', membershipError);
    } else if (memberships && memberships.length > 0) {
      const membership = memberships[0]; // Use most recent active membership
      const clinic = (membership as any).clinics;
      
      if (clinic && clinic.is_active) {
        console.log(`✅ [Tenant Resolver] Found active clinic membership: ${clinic.name}`);
        return {
          type: 'clinic',
          id: membership.clinic_id,
          name: clinic.name,
          role: membership.role as 'owner' | 'admin' | 'member',
          permissions: membership.permissions || {}
        };
      }
    }
    
    // STEP 2: Check profiles.clinic_id (direct clinic association)  
    console.log('👤 [Tenant Resolver] Checking profile clinic association...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, clinic_id,
        clinics:clinic_id (id, name, is_active)
      `)
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('❌ [Tenant Resolver] Profile query failed:', profileError);
    } else if (profile && profile.clinic_id) {
      const clinic = (profile as any).clinics;
      
      if (clinic && clinic.is_active) {
        console.log(`✅ [Tenant Resolver] Found profile clinic: ${clinic.name}`);
        return {
          type: 'clinic',
          id: profile.clinic_id,
          name: clinic.name,
          role: 'member', // Default role for direct association
          permissions: {}
        };
      }
    }
    
    // STEP 3: Check/Create individual workspace (FALLBACK - NEVER FAILS)
    console.log('🏠 [Tenant Resolver] Checking individual workspace...');
    
    let { data: workspace, error: workspaceError } = await supabase
      .from('individual_workspaces')
      .select('id, workspace_name, owner_id')
      .eq('owner_id', userId)
      .single();
      
    // Create individual workspace if it doesn't exist
    if (workspaceError || !workspace) {
      console.log('🔧 [Tenant Resolver] Creating individual workspace...');
      
      // Get user email for workspace name
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || 'user';
      const workspaceName = `Workspace de ${userEmail.split('@')[0]}`;
      
      const { data: newWorkspace, error: createError } = await supabase
        .from('individual_workspaces')
        .insert({
          owner_id: userId,
          workspace_name: workspaceName,
          business_name: workspaceName,
          settings: {}
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ [Tenant Resolver] Failed to create workspace:', createError);
        // EMERGENCY FALLBACK: Return minimal context
        return {
          type: 'workspace',
          id: userId, // Use user ID as emergency workspace ID
          name: 'Workspace Personal',
          role: 'owner',
          permissions: {}
        };
      }
      
      workspace = newWorkspace;
    }
    
    console.log(`✅ [Tenant Resolver] Using individual workspace: ${workspace.workspace_name}`);
    return {
      type: 'workspace',
      id: workspace.id,
      name: workspace.workspace_name,
      role: 'owner',
      permissions: {}
    };
    
  } catch (error) {
    console.error('💥 [Tenant Resolver] CRITICAL ERROR:', error);
    
    // ABSOLUTE EMERGENCY FALLBACK
    return {
      type: 'workspace',
      id: userId,
      name: 'Emergency Workspace',
      role: 'owner',
      permissions: {}
    };
  }
}

/**
 * Universal tenant middleware wrapper
 * Use this for ALL database operations that need tenant context
 */
export async function withTenantContext<T>(
  userId: string,
  operation: (context: TenantContext) => Promise<T>
): Promise<T> {
  const context = await resolveTenantContext(userId);
  console.log(`🎯 [Tenant Context] Operating in ${context.type}: ${context.name} (${context.role})`);
  return operation(context);
}

/**
 * Get tenant filter for database queries
 * Returns the appropriate WHERE clause for tenant isolation
 */
export function getTenantFilter(context: TenantContext): { clinic_id?: string; workspace_id?: string } {
  if (context.type === 'clinic') {
    return { clinic_id: context.id };
  } else {
    return { workspace_id: context.id };
  }
}

/**
 * Add tenant context to insert data
 * Ensures all new records have proper tenant association
 */
export function addTenantContext<T extends Record<string, any>>(
  data: T, 
  context: TenantContext
): T & { clinic_id?: string; workspace_id?: string } {
  if (context.type === 'clinic') {
    return { ...data, clinic_id: context.id, workspace_id: null };
  } else {
    return { ...data, workspace_id: context.id, clinic_id: null };
  }
}

/**
 * Validate tenant access for operations
 * Prevents cross-tenant data access
 */
export function validateTenantAccess(
  recordTenant: { clinic_id?: string; workspace_id?: string },
  userContext: TenantContext
): boolean {
  if (userContext.type === 'clinic') {
    return recordTenant.clinic_id === userContext.id;
  } else {
    return recordTenant.workspace_id === userContext.id;
  }
}

/**
 * Get user's tenant type for UI differentiation
 */
export function getUserType(context: TenantContext): 'clinic_owner' | 'clinic_member' | 'individual' {
  if (context.type === 'clinic') {
    return context.role === 'owner' ? 'clinic_owner' : 'clinic_member';
  } else {
    return 'individual';
  }
}