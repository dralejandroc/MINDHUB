/**
 * Organizations Client Stub - Legacy Removed
 * This is a temporary stub to prevent build errors
 * Organizations functionality has been removed in favor of Clerk auth
 */

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

// Stub functions that return disabled messages
export async function getMyOrganization(): Promise<{ success: boolean; message?: string; data?: { organization: Organization; userRole: string; isOwner: boolean } }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function createOrganization(data: any): Promise<{ success: boolean; message?: string }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function updateOrganization(data: any): Promise<{ success: boolean; message?: string }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function inviteUser(data: any): Promise<{ success: boolean; message?: string; data?: { userAdded?: boolean; email?: string; organizationName?: string } }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function removeUser(userId: string): Promise<{ success: boolean; message?: string }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function getOrganizationStats(): Promise<{ success: boolean; message?: string; data?: { organization: Organization; stats: OrganizationStats } }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}

export async function acceptInvitation(data: any): Promise<{ success: boolean; message?: string }> {
  return {
    success: false,
    message: 'Organizations feature disabled - using Clerk auth only'
  };
}