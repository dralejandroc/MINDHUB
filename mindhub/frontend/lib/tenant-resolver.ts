/**
 * SIMPLIFIED TENANT ARCHITECTURE RESOLVER
 * 
 * New simplified architecture:
 * - clinic_id: Boolean (true = clinic shared, false = individual user)
 * - user_id: For record ownership
 * - NO MORE workspace_id references
 */

import { createClient } from '@/lib/supabase/client';

export interface TenantContext {
  type: 'clinic' | 'individual';
  clinic_id: boolean;
  user_id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  clinic_id?: string;
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

// IndividualWorkspace interface removed - no longer needed

/**
 * Get user profile with clinic_id information
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, clinic_id, email, first_name, last_name')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('❌ [Tenant Resolver] Error fetching user profile:', error);
    return null;
  }
  
  return profile as UserProfile;
}

/**
 * SIMPLIFIED: Resolve tenant context for any user
 * Returns clinic_id boolean and user_id for record ownership
 */
export async function resolveTenantContext(userId: string): Promise<TenantContext> {
  const supabase = createClient();
  
  console.log(`🔍 [Tenant Resolver] Resolving simplified context for user: ${userId}`);
  
  try {
    // Check if user belongs to a clinic
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, clinic_id, first_name, last_name,
        clinics:clinic_id (id, name, is_active)
      `)
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('❌ [Tenant Resolver] Profile query failed:', profileError);
    }
    
    // Check for clinic membership
    const { data: memberships } = await supabase
      .from('tenant_memberships')
      .select(`
        id, clinic_id, role, permissions, is_active,
        clinics:clinic_id (id, name, is_active)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const hasClinicMembership = memberships && memberships.length > 0;
    const hasDirectClinicAccess = profile && profile.clinic_id;
    
    if (hasClinicMembership || hasDirectClinicAccess) {
      const clinicData = hasClinicMembership 
        ? (memberships[0] as any).clinics
        : (profile as any).clinics;
      
      const role = hasClinicMembership 
        ? memberships[0].role 
        : 'member';
        
      console.log(`✅ [Tenant Resolver] User belongs to clinic: ${clinicData?.name}`);
      return {
        type: 'clinic',
        clinic_id: true,
        user_id: userId,
        name: clinicData?.name || 'Clinic',
        role: role as 'owner' | 'admin' | 'member',
        permissions: hasClinicMembership ? memberships[0].permissions : {}
      };
    }
    
    // Individual user
    const userName = profile?.first_name ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}` : 'Usuario';
    console.log(`✅ [Tenant Resolver] Individual user: ${userName}`);
    return {
      type: 'individual',
      clinic_id: false,
      user_id: userId,
      name: `Workspace de ${userName}`,
      role: 'owner',
      permissions: {}
    };
    
  } catch (error) {
    console.error('💥 [Tenant Resolver] CRITICAL ERROR:', error);
    
    // EMERGENCY FALLBACK
    return {
      type: 'individual',
      clinic_id: false,
      user_id: userId,
      name: 'Workspace Personal',
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
 * Returns the appropriate WHERE clause for simplified architecture
 */
export function getTenantFilter(context: TenantContext): { clinic_id?: boolean; user_id?: string } {
  if (context.clinic_id) {
    return { clinic_id: true };
  } else {
    return { user_id: context.user_id };
  }
}

/**
 * Add tenant context to insert data
 * Uses simplified architecture with clinic_id boolean and user_id
 */
export function addTenantContext<T extends Record<string, any>>(
  data: T, 
  context: TenantContext
): T & { clinic_id: boolean; user_id: string } {
  return {
    ...data,
    clinic_id: context.clinic_id,
    user_id: context.user_id
  };
}

/**
 * Add tenant context specifically for consultations table
 * Uses simplified architecture with clinic_id boolean and user_id
 */
export function addConsultationTenantContext<T extends Record<string, any>>(
  data: T,
  context: TenantContext
): T & { clinic_id: boolean; user_id: string } {
  console.log(`📝 [Tenant Resolver] Adding consultation context: clinic_id=${context.clinic_id}, user_id=${context.user_id}`);
  return {
    ...data,
    clinic_id: context.clinic_id,
    user_id: context.user_id
  };
}

/**
 * Validate tenant access for operations
 * Uses simplified architecture
 */
export function validateTenantAccess(
  recordTenant: { clinic_id?: boolean; user_id?: string },
  userContext: TenantContext
): boolean {
  if (userContext.clinic_id) {
    return recordTenant.clinic_id === true;
  } else {
    return recordTenant.user_id === userContext.user_id;
  }
}

/**
 * Get user's tenant type for UI differentiation
 */
export function getUserType(context: TenantContext): 'clinic_owner' | 'clinic_member' | 'individual' {
  if (context.clinic_id) {
    return context.role === 'owner' ? 'clinic_owner' : 'clinic_member';
  } else {
    return 'individual';
  }
}