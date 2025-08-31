'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserMetricsManager } from '@/lib/user-metrics';
import { UserPreferences, DashboardConfig, AdminDashboardSettings } from '@/types/user-metrics';
import { dashboardGraphQLService as dashboardDataService, DashboardData } from '@/lib/dashboard-graphql-service';
import { useAuth } from '@/lib/providers/AuthProvider';

interface UserMetricsContextType {
  preferences: UserPreferences;
  dashboardMode: 'beginner' | 'advanced';
  isAdmin: boolean;
  realDashboardData: DashboardData | null;
  isLoadingDashboardData: boolean;
  
  // Metric recording functions
  recordLogin: () => void;
  recordPatientAdded: () => void;
  recordScaleApplied: (scaleId?: string) => void;
  recordFormCreated: (formId?: string) => void;
  recordResourceUploaded: (resourceId?: string) => void;
  
  // Favorite management
  addCloseFollowupPatient: (patientId: string) => void;
  removeCloseFollowupPatient: (patientId: string) => void;
  
  // Configuration updates
  updateDashboardConfig: (config: Partial<DashboardConfig>) => void;
  saveAdminSettings: (settings: AdminDashboardSettings) => void;
  getAdminSettings: () => AdminDashboardSettings;
  
  // Refresh data
  refreshPreferences: () => void;
  refreshDashboardData: () => void;
}

const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export function UserMetricsProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const [metricsManager] = useState(() => UserMetricsManager.getInstance());
  const [preferences, setPreferences] = useState<UserPreferences>(() => metricsManager.getUserPreferences());
  const [dashboardMode, setDashboardMode] = useState<'beginner' | 'advanced'>(() => metricsManager.getDashboardMode());
  const [realDashboardData, setRealDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const refreshPreferences = () => {
    const newPreferences = metricsManager.getUserPreferences();
    const newMode = metricsManager.getDashboardMode();
    setPreferences(newPreferences);
    setDashboardMode(newMode);
  };

  const refreshDashboardData = async () => {
    // Only fetch dashboard data if user is authenticated
    if (!user || !session || authLoading) {
      console.log('[UserMetrics] Skipping dashboard data fetch - user not authenticated');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoadingDashboardData) {
      console.log('[UserMetrics] Dashboard data fetch already in progress, skipping');
      return;
    }

    setIsLoadingDashboardData(true);
    try {
      console.log('[UserMetrics] Fetching dashboard data for authenticated user:', user.id);
      // Use normal fetch with cache instead of forceRefresh to prevent excessive API calls
      const data = await dashboardDataService.fetchDashboardData(user.id);
      setRealDashboardData(data);
      console.log('[UserMetrics] Dashboard data loaded:', data);
    } catch (error) {
      console.error('[UserMetrics] Error fetching dashboard data:', error);
    } finally {
      setIsLoadingDashboardData(false);
    }
  };

  // Record login on mount and fetch dashboard data only when authenticated
  useEffect(() => {
    if (!authLoading && !hasInitialized) {
      if (user && session) {
        console.log('[UserMetrics] User authenticated, initializing metrics (one-time)');
        metricsManager.recordLogin();
        refreshPreferences();
        refreshDashboardData();
        setHasInitialized(true);
      } else {
        console.log('[UserMetrics] User not authenticated, skipping data fetch');
        refreshPreferences(); // Still refresh preferences (local data)
        setHasInitialized(true);
      }
    }
  }, [user, session, authLoading, hasInitialized]);

  const recordLogin = () => {
    metricsManager.recordLogin();
    refreshPreferences();
  };

  const recordPatientAdded = () => {
    metricsManager.recordPatientAdded();
    refreshPreferences();
  };

  const recordScaleApplied = (scaleId?: string) => {
    metricsManager.recordScaleApplied(scaleId);
    refreshPreferences();
  };

  const recordFormCreated = (formId?: string) => {
    metricsManager.recordFormCreated(formId);
    refreshPreferences();
  };

  const recordResourceUploaded = (resourceId?: string) => {
    metricsManager.recordResourceUploaded(resourceId);
    refreshPreferences();
  };

  const addCloseFollowupPatient = (patientId: string) => {
    metricsManager.addCloseFollowupPatient(patientId);
    refreshPreferences();
  };

  const removeCloseFollowupPatient = (patientId: string) => {
    metricsManager.removeCloseFollowupPatient(patientId);
    refreshPreferences();
  };

  const updateDashboardConfig = (config: Partial<DashboardConfig>) => {
    metricsManager.updateDashboardConfig(config);
    refreshPreferences();
  };

  const saveAdminSettings = (settings: AdminDashboardSettings) => {
    metricsManager.saveAdminSettings(settings);
    refreshPreferences();
  };

  const getAdminSettings = () => {
    return metricsManager.getAdminSettings();
  };

  const value: UserMetricsContextType = {
    preferences,
    dashboardMode,
    isAdmin: preferences.isAdmin,
    realDashboardData,
    isLoadingDashboardData,
    recordLogin,
    recordPatientAdded,
    recordScaleApplied,
    recordFormCreated,
    recordResourceUploaded,
    addCloseFollowupPatient,
    removeCloseFollowupPatient,
    updateDashboardConfig,
    saveAdminSettings,
    getAdminSettings,
    refreshPreferences,
    refreshDashboardData
  };

  return (
    <UserMetricsContext.Provider value={value}>
      {children}
    </UserMetricsContext.Provider>
  );
}

export function useUserMetrics() {
  const context = useContext(UserMetricsContext);
  if (context === undefined) {
    throw new Error('useUserMetrics must be used within a UserMetricsProvider');
  }
  return context;
}