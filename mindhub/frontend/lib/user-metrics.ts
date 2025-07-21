import { UserMetrics, UserPreferences, DashboardConfig, AdminDashboardSettings } from '@/types/user-metrics';

const USER_METRICS_KEY = 'mindhub_user_metrics';
const ADMIN_SETTINGS_KEY = 'mindhub_admin_settings';

// Default metrics for new users
const defaultMetrics: UserMetrics = {
  loginCount: 0,
  patientsAdded: 0,
  scalesApplied: 0,
  formsCreated: 0,
  resourcesUploaded: 0,
  lastLogin: new Date().toISOString(),
  firstLogin: new Date().toISOString(),
  favoriteScales: [],
  closeFollowupPatients: [],
  mostUsedForms: [],
  mostUsedResources: []
};

// Default dashboard configuration
const defaultDashboardConfig: DashboardConfig = {
  mode: 'beginner',
  autoSwitch: true,
  customLayout: [],
  theme: 'default'
};

// Default admin settings
const defaultAdminSettings: AdminDashboardSettings = {
  forceBeginnerMode: false,
  allowUserCustomization: true,
  autoSwitchThresholds: {
    loginCount: 10,
    patientsAdded: 20,
    scalesApplied: 15
  }
};

export class UserMetricsManager {
  private static instance: UserMetricsManager;
  private currentUser: string = 'default_user'; // In real app, get from auth

  static getInstance(): UserMetricsManager {
    if (!UserMetricsManager.instance) {
      UserMetricsManager.instance = new UserMetricsManager();
    }
    return UserMetricsManager.instance;
  }

  // Get user preferences
  getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      // Return default preferences for SSR
      return {
        userId: this.currentUser,
        metrics: { ...defaultMetrics },
        dashboardConfig: { ...defaultDashboardConfig },
        isAdmin: this.currentUser === 'admin'
      };
    }

    const stored = localStorage.getItem(`${USER_METRICS_KEY}_${this.currentUser}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        metrics: { ...defaultMetrics, ...parsed.metrics },
        dashboardConfig: { ...defaultDashboardConfig, ...parsed.dashboardConfig }
      };
    }

    return {
      userId: this.currentUser,
      metrics: { ...defaultMetrics },
      dashboardConfig: { ...defaultDashboardConfig },
      isAdmin: this.currentUser === 'admin' // Simple admin check
    };
  }

  // Save user preferences
  saveUserPreferences(preferences: UserPreferences): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${USER_METRICS_KEY}_${preferences.userId}`, JSON.stringify(preferences));
    }
  }

  // Increment specific metrics
  incrementMetric(metric: keyof Pick<UserMetrics, 'loginCount' | 'patientsAdded' | 'scalesApplied' | 'formsCreated' | 'resourcesUploaded'>): void {
    const preferences = this.getUserPreferences();
    preferences.metrics[metric]++;
    preferences.metrics.lastLogin = new Date().toISOString();
    this.saveUserPreferences(preferences);
  }

  // Add to array metrics
  addToArrayMetric(metric: keyof Pick<UserMetrics, 'favoriteScales' | 'closeFollowupPatients' | 'mostUsedForms' | 'mostUsedResources'>, value: string): void {
    const preferences = this.getUserPreferences();
    if (!preferences.metrics[metric].includes(value)) {
      preferences.metrics[metric].push(value);
      // Keep only last 10 items for performance
      preferences.metrics[metric] = preferences.metrics[metric].slice(-10);
      this.saveUserPreferences(preferences);
    }
  }

  // Remove from array metrics
  removeFromArrayMetric(metric: keyof Pick<UserMetrics, 'favoriteScales' | 'closeFollowupPatients' | 'mostUsedForms' | 'mostUsedResources'>, value: string): void {
    const preferences = this.getUserPreferences();
    preferences.metrics[metric] = preferences.metrics[metric].filter(item => item !== value);
    this.saveUserPreferences(preferences);
  }

  // Check if user should switch to advanced mode
  shouldSwitchToAdvanced(): boolean {
    const preferences = this.getUserPreferences();
    const adminSettings = this.getAdminSettings();
    
    if (adminSettings.forceBeginnerMode) return false;
    if (!preferences.dashboardConfig.autoSwitch) return false;
    
    const { metrics } = preferences;
    const thresholds = adminSettings.autoSwitchThresholds;
    
    return (
      metrics.loginCount >= thresholds.loginCount &&
      metrics.patientsAdded >= thresholds.patientsAdded &&
      metrics.scalesApplied >= thresholds.scalesApplied
    );
  }

  // Get admin settings
  getAdminSettings(): AdminDashboardSettings {
    if (typeof window === 'undefined') {
      return { ...defaultAdminSettings };
    }
    
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      return { ...defaultAdminSettings, ...JSON.parse(stored) };
    }
    return { ...defaultAdminSettings };
  }

  // Save admin settings
  saveAdminSettings(settings: AdminDashboardSettings): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    }
  }

  // Update dashboard config
  updateDashboardConfig(config: Partial<DashboardConfig>): void {
    const preferences = this.getUserPreferences();
    preferences.dashboardConfig = { ...preferences.dashboardConfig, ...config };
    this.saveUserPreferences(preferences);
  }

  // Record login
  recordLogin(): void {
    this.incrementMetric('loginCount');
  }

  // Record patient added
  recordPatientAdded(): void {
    this.incrementMetric('patientsAdded');
  }

  // Record scale applied
  recordScaleApplied(scaleId?: string): void {
    this.incrementMetric('scalesApplied');
    if (scaleId) {
      this.addToArrayMetric('favoriteScales', scaleId);
    }
  }

  // Record form created
  recordFormCreated(formId?: string): void {
    this.incrementMetric('formsCreated');
    if (formId) {
      this.addToArrayMetric('mostUsedForms', formId);
    }
  }

  // Record resource uploaded
  recordResourceUploaded(resourceId?: string): void {
    this.incrementMetric('resourcesUploaded');
    if (resourceId) {
      this.addToArrayMetric('mostUsedResources', resourceId);
    }
  }

  // Manage close followup patients
  addCloseFollowupPatient(patientId: string): void {
    this.addToArrayMetric('closeFollowupPatients', patientId);
  }

  removeCloseFollowupPatient(patientId: string): void {
    this.removeFromArrayMetric('closeFollowupPatients', patientId);
  }

  // Get dashboard mode based on user state and admin settings
  getDashboardMode(): 'beginner' | 'advanced' {
    const preferences = this.getUserPreferences();
    const adminSettings = this.getAdminSettings();
    
    if (adminSettings.forceBeginnerMode) return 'beginner';
    if (preferences.dashboardConfig.mode === 'advanced') return 'advanced';
    if (this.shouldSwitchToAdvanced()) return 'advanced';
    
    return 'beginner';
  }
}