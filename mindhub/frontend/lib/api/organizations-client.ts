/**
 * Organizations API Client
 * Handles clinic/organization management functionality
 */

import { apiRequest } from './api-config';

const ORGANIZATIONS_BASE_URL = '/api/organizations';

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

export interface OrganizationResponse {
  success: boolean;
  data?: {
    organization: Organization;
    userRole: string;
    isOwner: boolean;
  };
  message?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type?: 'CLINIC' | 'HOSPITAL' | 'CONSULTORIO';
}

export interface InviteUserRequest {
  email: string;
  name?: string;
}

export interface InviteUserResponse {
  success: boolean;
  data?: {
    email: string;
    organizationName: string;
    inviteToken: string;
    expiresAt: string;
    userAdded?: boolean;
  };
  message?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  email: string;
  password: string;
  name: string;
}

/**
 * Get user's organization information
 */
export async function getMyOrganization(): Promise<OrganizationResponse> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error getting organization:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener organización'
    };
  }
}

/**
 * Create new organization (for clinic owners)
 */
export async function createOrganization(data: CreateOrganizationRequest): Promise<OrganizationResponse> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(ORGANIZATIONS_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return response;
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear organización'
    };
  }
}

/**
 * Update organization information
 */
export async function updateOrganization(data: Partial<CreateOrganizationRequest>): Promise<OrganizationResponse> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/my`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return response;
  } catch (error) {
    console.error('Error updating organization:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar organización'
    };
  }
}

/**
 * Invite user to organization
 */
export async function inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return response;
  } catch (error) {
    console.error('Error inviting user:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al enviar invitación'
    };
  }
}

/**
 * Accept organization invitation
 */
export async function acceptInvitation(data: AcceptInvitationRequest): Promise<InviteUserResponse> {
  try {
    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/accept-invitation`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Store auth data if invitation accepted successfully
    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al aceptar invitación'
    };
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(): Promise<{ success: boolean; data?: { organization: Organization; stats: OrganizationStats }; message?: string }> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error getting organization stats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
}

/**
 * Remove user from organization
 */
export async function removeUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest(`${ORGANIZATIONS_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error removing user:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al remover usuario'
    };
  }
}