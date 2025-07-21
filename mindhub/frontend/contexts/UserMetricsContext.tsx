'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserMetricsManager } from '@/lib/user-metrics';
import { UserPreferences, DashboardConfig, AdminDashboardSettings } from '@/types/user-metrics';

interface UserMetricsContextType {
  preferences: UserPreferences;
  dashboardMode: 'beginner' | 'advanced';
  isAdmin: boolean;
  
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
}

const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export function UserMetricsProvider({ children }: { children: React.ReactNode }) {
  const [metricsManager] = useState(() => UserMetricsManager.getInstance());
  const [preferences, setPreferences] = useState<UserPreferences>(() => metricsManager.getUserPreferences());
  const [dashboardMode, setDashboardMode] = useState<'beginner' | 'advanced'>(() => metricsManager.getDashboardMode());

  const refreshPreferences = () => {
    const newPreferences = metricsManager.getUserPreferences();
    const newMode = metricsManager.getDashboardMode();
    setPreferences(newPreferences);
    setDashboardMode(newMode);
  };

  // Record login on mount
  useEffect(() => {
    metricsManager.recordLogin();
    refreshPreferences();
  }, [metricsManager]);

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
    refreshPreferences
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