/**
 * Clinic Management Client - Proper Django Integration
 * Replaces the organization-client-stub with actual Django backend calls
 */

import { supabase } from '@/lib/supabase/client';

export interface Organization {
  id: string;
  name: string;
  type: 'CLINIC' | 'HOSPITAL' | 'CONSULTORIO';
  maxUsers: number;
  isActive: boolean;
  isBetaOrg: boolean;
  createdAt: string;
  updatedAt: string;
  users?: OrganizationUser[];
}

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  accountType: 'INDIVIDUAL' | 'CLINIC';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface OrganizationStats {
  totalUsers: number;
  maxUsers: number;
  availableSlots: number;
  activeUsers: number;
  recentUsers: number;
  usersByType: Record<string, number>;
  lastActivity: OrganizationUser[];
}

/**
 * Get current user's organization/clinic
 */
export async function getMyOrganization(): Promise<{ 
  success: boolean; 
  message?: string; 
  data?: { 
    organization: Organization; 
    userRole: string; 
    isOwner: boolean 
  } 
}> {
  try {
    console.log('[CLINIC CLIENT] Fetching user organization...');
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch('/api/clinic', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });

    if (!response.ok) {
      console.error('[CLINIC CLIENT] Failed to fetch clinic:', response.status);
      return {
        success: false,
        message: `Error al obtener información de la clínica: ${response.status}`
      };
    }

    const data = await response.json();
    console.log('[CLINIC CLIENT] Clinic data received:', data);

    // Check if user has a clinic/organization
    if (data.clinic) {
      return {
        success: true,
        data: {
          organization: {
            id: data.clinic.id,
            name: data.clinic.name,
            type: 'CLINIC',
            maxUsers: data.clinic.max_users || 5,
            isActive: data.clinic.is_active !== false,
            isBetaOrg: false,
            createdAt: data.clinic.created_at,
            updatedAt: data.clinic.updated_at,
            users: []
          },
          userRole: 'owner',
          isOwner: true
        }
      };
    }

    // No organization found
    return {
      success: true,
      data: undefined
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error fetching organization:', error);
    return {
      success: false,
      message: 'Error de conexión al obtener información de la clínica'
    };
  }
}

/**
 * Create a new clinic/organization
 */
export async function createOrganization(data: {
  name: string;
  type: 'CLINIC' | 'HOSPITAL' | 'CONSULTORIO';
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[CLINIC CLIENT] Creating organization:', data);
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch('/api/clinic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        name: data.name,
        clinic_type: data.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CLINIC CLIENT] Failed to create clinic:', response.status, errorData);
      return {
        success: false,
        message: errorData.message || `Error al crear la clínica: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('[CLINIC CLIENT] Clinic created successfully:', result);

    return {
      success: true,
      message: 'Clínica creada exitosamente'
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error creating organization:', error);
    return {
      success: false,
      message: 'Error de conexión al crear la clínica'
    };
  }
}

/**
 * Update clinic/organization
 */
export async function updateOrganization(data: {
  name: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[CLINIC CLIENT] Updating organization:', data);

    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch('/api/clinic', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        name: data.name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CLINIC CLIENT] Failed to update clinic:', response.status, errorData);
      return {
        success: false,
        message: errorData.message || `Error al actualizar la clínica: ${response.status}`
      };
    }

    return {
      success: true,
      message: 'Clínica actualizada exitosamente'
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error updating organization:', error);
    return {
      success: false,
      message: 'Error de conexión al actualizar la clínica'
    };
  }
}

/**
 * Invite a user to the clinic/organization
 */
export async function inviteUser(data: {
  email: string;
  name?: string;
}): Promise<{ 
  success: boolean; 
  message?: string; 
  data?: { 
    userAdded?: boolean; 
    email?: string; 
    organizationName?: string 
  } 
}> {
  try {
    console.log('[CLINIC CLIENT] Inviting user:', data);
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch('/api/clinics/django/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        email: data.email,
        name: data.name
      }),
    });

    if (!response.ok) {
      console.error('[CLINIC CLIENT] Failed to invite user:', response.status);
      return {
        success: false,
        message: `Error al enviar invitación: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('[CLINIC CLIENT] User invited successfully:', result);

    return {
      success: true,
      message: 'Invitación enviada exitosamente',
      data: {
        userAdded: result.user_added || false,
        email: data.email
      }
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error inviting user:', error);
    return {
      success: false,
      message: 'Error de conexión al enviar invitación'
    };
  }
}

/**
 * Remove a user from the clinic/organization
 */
export async function removeUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[CLINIC CLIENT] Removing user:', userId);
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`/api/clinics/django/clinics`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        user_id: userId
      }),
    });

    if (!response.ok) {
      console.error('[CLINIC CLIENT] Failed to remove user:', response.status);
      return {
        success: false,
        message: `Error al remover usuario: ${response.status}`
      };
    }

    return {
      success: true,
      message: 'Usuario removido exitosamente'
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error removing user:', error);
    return {
      success: false,
      message: 'Error de conexión al remover usuario'
    };
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(): Promise<{ 
  success: boolean; 
  message?: string; 
  data?: { 
    organization: Organization; 
    stats: OrganizationStats 
  } 
}> {
  try {
    console.log('[CLINIC CLIENT] Fetching organization stats...');
    
    // For now, return mock stats since Django might not have this endpoint yet
    // This can be implemented later when the Django backend has statistics
    const orgData = await getMyOrganization();
    if (!orgData.success || !orgData.data) {
      return {
        success: false,
        message: 'No se pudo obtener información de la organización'
      };
    }

    const mockStats: OrganizationStats = {
      totalUsers: orgData.data.organization.users?.length || 0,
      maxUsers: orgData.data.organization.maxUsers,
      availableSlots: orgData.data.organization.maxUsers - (orgData.data.organization.users?.length || 0),
      activeUsers: orgData.data.organization.users?.filter(u => u.isActive).length || 0,
      recentUsers: 0,
      usersByType: {
        'INDIVIDUAL': orgData.data.organization.users?.filter(u => u.accountType === 'INDIVIDUAL').length || 0,
        'CLINIC': orgData.data.organization.users?.filter(u => u.accountType === 'CLINIC').length || 0
      },
      lastActivity: orgData.data.organization.users || []
    };

    return {
      success: true,
      data: {
        organization: orgData.data.organization,
        stats: mockStats
      }
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error fetching organization stats:', error);
    return {
      success: false,
      message: 'Error de conexión al obtener estadísticas'
    };
  }
}

/**
 * Accept an invitation to join a clinic
 */
export async function acceptInvitation(data: {
  token: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[CLINIC CLIENT] Accepting invitation:', data.token);
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch('/api/clinics/django/invitations/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        token: data.token
      }),
    });

    if (!response.ok) {
      console.error('[CLINIC CLIENT] Failed to accept invitation:', response.status);
      return {
        success: false,
        message: `Error al aceptar invitación: ${response.status}`
      };
    }

    return {
      success: true,
      message: 'Invitación aceptada exitosamente'
    };

  } catch (error) {
    console.error('[CLINIC CLIENT] Error accepting invitation:', error);
    return {
      success: false,
      message: 'Error de conexión al aceptar invitación'
    };
  }
}