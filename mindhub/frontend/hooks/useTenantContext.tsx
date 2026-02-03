'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';

interface TenantContext {
  tenant_id: string | null;
  tenant_type: 'clinic' | 'workspace' | null;
  tenant_name: string | null;
}

interface AvailableContext {
  id: string;
  name: string;
  business_name?: string;
  logo_url?: string;
  type: 'clinic' | 'workspace';
  membership?: {
    role: string;
    joined_at: string;
  };
}

interface TenantContextData {
  // Current context
  currentContext: TenantContext | null;
  loading: boolean;
  error: string | null;
  
  // Available contexts for switching
  availableContexts: {
    workspace: AvailableContext | null;
    clinics: AvailableContext[];
  };
  
  // Actions
  refreshContext: () => Promise<void>;
  switchContext: (tenantId: string, tenantType: 'clinic' | 'workspace') => Promise<boolean>;
  isClinicContext: boolean;
  isWorkspaceContext: boolean;
  
  // Utility functions
  getCurrentTenantId: () => string | null;
  getCurrentTenantType: () => 'clinic' | 'workspace' | null;
  canAccessTenant: (tenantId: string, tenantType: 'clinic' | 'workspace') => boolean;
}

const TenantContextContext = createContext<TenantContextData | null>(null);

export function useTenantContext(): TenantContextData {
  const [currentContext, setCurrentContext] = useState<TenantContext | null>(null);
  const [availableContexts, setAvailableContexts] = useState<{
    workspace: AvailableContext | null;
    clinics: AvailableContext[];
  }>({
    workspace: null,
    clinics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenant context from API
  const refreshContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setCurrentContext(null);
        setAvailableContexts({ workspace: null, clinics: [] });
        return;
      }

      const response = await fetch('/api/tenant/context', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentContext(result.data.current_context);
        setAvailableContexts(result.data.available_contexts);
        console.log('RESULT TENANT:', result.data);
        
        // Store in localStorage for persistence
        if (result.data.current_context) {
          localStorage.setItem('tenant_context', JSON.stringify(result.data.current_context));
        }
      }

    } catch (err) {
      console.error('[useTenantContext] Error refreshing context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant context');
    } finally {
      setLoading(false);
    }
  }, []);

  // Switch to a different tenant context
  const switchContext = useCallback(async (tenantId: string, tenantType: 'clinic' | 'workspace'): Promise<boolean> => {
    try {
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Validate the switch with the API
      const response = await fetch('/api/tenant/context', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId, tenant_type: tenantType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch context');
      }
      const result = await response.json();
      console.log('RESULT TENANTT:', result.data);
      // Update local context
      const newContext: TenantContext = {
        tenant_id: tenantId,
        tenant_type: tenantType,
        tenant_name: tenantType === 'workspace' 
          ? availableContexts.workspace?.name || 'Mi Consultorio'
          : availableContexts.clinics.find(c => c.id === tenantId)?.name || 'Clínica'
      };

      setCurrentContext(newContext);
      localStorage.setItem('tenant_context', JSON.stringify(newContext));

      console.log(`[useTenantContext] Context switched to: ${tenantType} - ${newContext.tenant_name}`);
      return true;

    } catch (err) {
      console.error('[useTenantContext] Error switching context:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch context');
      return false;
    }
  }, [availableContexts]);

  // Initialize context on mount
  useEffect(() => {
    // Try to load from localStorage first
    const storedContext = localStorage.getItem('tenant_context');
    if (storedContext) {
      try {
        const parsed = JSON.parse(storedContext);
        setCurrentContext(parsed);
      } catch (e) {
        console.warn('[useTenantContext] Invalid stored context, will refresh from API');
      }
    }

    // Always refresh from API to get latest data
    refreshContext();
  }, [refreshContext]);

  // Utility functions
  const getCurrentTenantId = useCallback(() => currentContext?.tenant_id || null, [currentContext]);
  const getCurrentTenantType = useCallback(() => currentContext?.tenant_type || null, [currentContext]);
  
  const canAccessTenant = useCallback((tenantId: string, tenantType: 'clinic' | 'workspace') => {
    if (tenantType === 'workspace') {
      return availableContexts.workspace?.id === tenantId;
    } else {
      return availableContexts.clinics.some(c => c.id === tenantId);
    }
  }, [availableContexts]);

  const isClinicContext = currentContext?.tenant_type === 'clinic';
  const isWorkspaceContext = currentContext?.tenant_type === 'workspace';

  return {
    currentContext,
    loading,
    error,
    availableContexts,
    refreshContext,
    switchContext,
    isClinicContext,
    isWorkspaceContext,
    getCurrentTenantId,
    getCurrentTenantType,
    canAccessTenant
  };
}

// Context provider component for app-wide tenant context
export function TenantContextProvider({ children }: { children: React.ReactNode }) {
  const tenantContext = useTenantContext();
  
  return (
    <TenantContextContext.Provider value={tenantContext}>
      {children}
    </TenantContextContext.Provider>
  );
}

// Hook to use the tenant context (must be used within provider)
export function useAppTenantContext(): TenantContextData {
  const context = useContext(TenantContextContext);
  if (!context) {
    throw new Error('useAppTenantContext must be used within a TenantContextProvider');
  }
  return context;
}

// Utility hook for making tenant-aware API calls
export function useTenantAwareApi() {
  const { getCurrentTenantId, getCurrentTenantType } = useTenantContext();

  const makeRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const tenantId = getCurrentTenantId();
    const tenantType = getCurrentTenantType();

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId || '',
      'X-Tenant-Type': tenantType || '',
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  }, [getCurrentTenantId, getCurrentTenantType]);

  return { makeRequest };
}