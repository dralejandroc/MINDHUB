// Common user type for UnifiedSidebar and other components
export interface CurrentUser {
  name?: string;
  email?: string;
  role?: string;
}

export interface UserMetrics {
  loginCount: number;
  patientsAdded: number;
  scalesApplied: number;
  formsCreated: number;
  resourcesUploaded: number;
  lastLogin: string;
  firstLogin: string;
  favoriteScales: string[];
  closeFollowupPatients: string[];
  mostUsedForms: string[];
  mostUsedResources: string[];
}

export interface DashboardConfig {
  mode: 'beginner' | 'advanced';
  autoSwitch: boolean;
  customLayout: DashboardWidget[];
  theme: 'default' | 'compact' | 'minimal';
}

export interface DashboardWidget {
  id: string;
  type: 'favorite-scales' | 'followup-patients' | 'used-forms' | 'used-resources' | 'quick-stats' | 'recent-activity';
  position: { x: number; y: number };
  size: { width: number; height: number };
  enabled: boolean;
  config?: Record<string, any>;
}

export interface AdminDashboardSettings {
  forceBeginnerMode: boolean;
  forcedLayout?: DashboardWidget[];
  allowUserCustomization: boolean;
  autoSwitchThresholds: {
    loginCount: number;
    patientsAdded: number;
    scalesApplied: number;
  };
}

export interface UserPreferences {
  userId: string;
  metrics: UserMetrics;
  dashboardConfig: DashboardConfig;
  isAdmin: boolean;
  adminSettings?: AdminDashboardSettings;
}