'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { 
  getCurrentSubdomain, 
  getCurrentSubdomainConfig, 
  hasSubdomainPermission,
  getHubUrl,
  type SubdomainConfig 
} from '@/lib/auth0-config';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: string | null;
  permissions: string[];
  currentSubdomain: string;
  currentHubConfig: SubdomainConfig;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasCurrentHubAccess: () => boolean;
  navigateToHub: (hubName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('app');
  const [currentHubConfig, setCurrentHubConfig] = useState<SubdomainConfig>(getCurrentSubdomainConfig());

  useEffect(() => {
    // Set current subdomain and hub config
    const subdomain = getCurrentSubdomain();
    const hubConfig = getCurrentSubdomainConfig();
    
    setCurrentSubdomain(subdomain);
    setCurrentHubConfig(hubConfig);
  }, []);

  useEffect(() => {
    if (user) {
      // Extract role and permissions from Auth0 custom claims
      const namespace = 'https://mindhub.cloud/';
      const role = user[`${namespace}role`] || user['https://mindhub.com/role'] || null;
      const userPermissions = user[`${namespace}permissions`] || user['https://mindhub.com/permissions'] || [];
      
      setUserRole(typeof role === 'string' ? role : null);
      setPermissions(Array.isArray(userPermissions) ? userPermissions : []);
    } else {
      setUserRole(null);
      setPermissions([]);
    }
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission) || permissions.includes('admin:all');
  };

  const hasRole = (role: string): boolean => {
    return userRole === role;
  };

  const hasCurrentHubAccess = (): boolean => {
    return hasSubdomainPermission(permissions);
  };

  const navigateToHub = (hubName: string): void => {
    const targetUrl = getHubUrl(hubName);
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    userRole,
    permissions,
    currentSubdomain,
    currentHubConfig,
    hasPermission,
    hasRole,
    hasCurrentHubAccess,
    navigateToHub,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}