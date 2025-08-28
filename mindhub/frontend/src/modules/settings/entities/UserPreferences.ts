/**
 * UserPreferences Entity
 * Domain entity for user-specific preferences and customization settings
 */

export type PreferenceCategory = 
  | 'appearance'
  | 'notifications'
  | 'workflow'
  | 'privacy'
  | 'accessibility'
  | 'integration'
  | 'dashboard'
  | 'reporting'
  | 'communication'
  | 'security'
  | 'custom';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'portal' | 'desktop';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Language = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'ja' | 'zh';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MMM-YYYY';

export type TimeFormat = '12h' | '24h';

export type NumberFormat = 'US' | 'EU' | 'UK' | 'IN';

export interface AppearancePreferences {
  theme: ThemeMode;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  customCSS?: string;
}

export interface LocalizationPreferences {
  language: Language;
  region: string;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  currency: string;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
}

export interface NotificationPreferences {
  channels: {
    [channel in NotificationChannel]: boolean;
  };
  types: {
    appointments: boolean;
    messages: boolean;
    reminders: boolean;
    alerts: boolean;
    reports: boolean;
    system: boolean;
    marketing: boolean;
  };
  priorities: {
    [priority in NotificationPriority]: {
      enabled: boolean;
      channels: NotificationChannel[];
      quietHours: {
        enabled: boolean;
        start: string; // HH:MM
        end: string; // HH:MM
      };
    };
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
    day?: number; // Day of week/month
  };
}

export interface WorkflowPreferences {
  defaultView: string;
  itemsPerPage: number;
  autoSave: boolean;
  confirmActions: boolean;
  keyboardShortcuts: boolean;
  bulkOperations: boolean;
  quickActions: string[];
  favoriteFeatures: string[];
  customWorkflows: {
    [workflowId: string]: {
      name: string;
      steps: string[];
      triggers: string[];
      enabled: boolean;
    };
  };
}

export interface PrivacyPreferences {
  shareData: boolean;
  analytics: boolean;
  tracking: boolean;
  telemetry: boolean;
  crashReports: boolean;
  usageStatistics: boolean;
  dataRetention: number; // days
  activityLog: boolean;
  exportData: boolean;
  deleteAccount: boolean;
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
  colorBlindSupport: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
  magnification: number; // 1.0 = 100%
  captionsEnabled: boolean;
  soundNotifications: boolean;
  vibrationEnabled: boolean;
}

export interface DashboardPreferences {
  layout: 'grid' | 'list' | 'cards';
  widgets: {
    [widgetId: string]: {
      enabled: boolean;
      position: { x: number; y: number };
      size: { width: number; height: number };
      settings: { [key: string]: any };
    };
  };
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  compactMode: boolean;
  showWelcome: boolean;
  recentItems: number;
}

export interface IntegrationPreferences {
  connectedApps: {
    [appId: string]: {
      enabled: boolean;
      permissions: string[];
      settings: { [key: string]: any };
      lastSync: Date;
    };
  };
  apiKeys: {
    [keyId: string]: {
      name: string;
      permissions: string[];
      lastUsed: Date;
      expiresAt?: Date;
    };
  };
  webhooks: {
    [hookId: string]: {
      url: string;
      events: string[];
      enabled: boolean;
    };
  };
}

export interface SecurityPreferences {
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  passwordExpiry: number; // days
  lockAfterInactivity: number; // minutes
  trustedDevices: {
    [deviceId: string]: {
      name: string;
      lastSeen: Date;
      trusted: boolean;
    };
  };
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  dataDownloadApproval: boolean;
}

export interface PreferenceHistory {
  changedAt: Date;
  category: PreferenceCategory;
  key: string;
  previousValue: any;
  newValue: any;
  source: 'manual' | 'import' | 'sync' | 'api';
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
  };
}

export class UserPreferences {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly appearance: AppearancePreferences,
    public readonly localization: LocalizationPreferences,
    public readonly notifications: NotificationPreferences,
    public readonly workflow: WorkflowPreferences,
    public readonly privacy: PrivacyPreferences,
    public readonly accessibility: AccessibilityPreferences,
    public readonly dashboard: DashboardPreferences,
    public readonly integrations: IntegrationPreferences,
    public readonly security: SecurityPreferences,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly customPreferences: { [key: string]: any } = {},
    public readonly history: PreferenceHistory[] = [],
    public readonly lastSyncedAt?: Date,
    public readonly syncEnabled: boolean = true,
    public readonly version: number = 1,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validatePreferences();
  }

  private validatePreferences(): void {
    if (!this.id.trim()) {
      throw new Error('Preferences ID is required');
    }

    if (!this.userId.trim()) {
      throw new Error('User ID is required');
    }

    // Validate appearance preferences
    if (this.appearance.fontSize && !['small', 'medium', 'large', 'extra-large'].includes(this.appearance.fontSize)) {
      throw new Error('Invalid font size preference');
    }

    if (this.appearance.density && !['compact', 'comfortable', 'spacious'].includes(this.appearance.density)) {
      throw new Error('Invalid density preference');
    }

    // Validate localization preferences
    if (!this.localization.timezone) {
      throw new Error('Timezone is required');
    }

    // Validate notification preferences
    if (this.notifications.digest.enabled && !this.notifications.digest.time) {
      throw new Error('Digest time is required when digest is enabled');
    }

    // Validate security preferences
    if (this.security.sessionTimeout < 5 || this.security.sessionTimeout > 480) { // 5 min to 8 hours
      throw new Error('Session timeout must be between 5 and 480 minutes');
    }
  }

  // Business Logic Methods

  canBeModified(): boolean {
    return true; // Users can always modify their preferences
  }

  canBeSynced(): boolean {
    return this.syncEnabled && this.privacy.shareData;
  }

  canBeExported(): boolean {
    return this.privacy.exportData;
  }

  hasNotificationChannel(channel: NotificationChannel): boolean {
    return this.notifications.channels[channel] === true;
  }

  isNotificationEnabled(type: keyof NotificationPreferences['types']): boolean {
    return this.notifications.types[type] === true;
  }

  isInQuietHours(priority: NotificationPriority = 'medium'): boolean {
    const prioritySettings = this.notifications.priorities[priority];
    if (!prioritySettings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(prioritySettings.quietHours.start);
    const endTime = this.parseTime(prioritySettings.quietHours.end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  shouldReceiveNotification(type: keyof NotificationPreferences['types'], priority: NotificationPriority, channel: NotificationChannel): boolean {
    return this.isNotificationEnabled(type) &&
           this.hasNotificationChannel(channel) &&
           this.notifications.priorities[priority].enabled &&
           this.notifications.priorities[priority].channels.includes(channel) &&
           !this.isInQuietHours(priority);
  }

  isAppConnected(appId: string): boolean {
    return this.integrations.connectedApps[appId]?.enabled === true;
  }

  isTrustedDevice(deviceId: string): boolean {
    return this.security.trustedDevices[deviceId]?.trusted === true;
  }

  isDashboardWidgetEnabled(widgetId: string): boolean {
    return this.dashboard.widgets[widgetId]?.enabled === true;
  }

  getCustomPreference(key: string, defaultValue?: any): any {
    return this.customPreferences[key] ?? defaultValue;
  }

  hasRecentChanges(minutes: number = 60): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.history.some(h => h.changedAt > cutoff);
  }

  getRecentChanges(minutes: number = 60): PreferenceHistory[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.history.filter(h => h.changedAt > cutoff);
  }

  // State Transformation Methods

  updateAppearance(newAppearance: Partial<AppearancePreferences>): UserPreferences {
    const updatedAppearance = { ...this.appearance, ...newAppearance };
    
    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'appearance',
      key: 'appearance',
      previousValue: this.appearance,
      newValue: updatedAppearance,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      updatedAppearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  updateNotifications(newNotifications: Partial<NotificationPreferences>): UserPreferences {
    const updatedNotifications = { 
      ...this.notifications, 
      ...newNotifications,
      // Deep merge for nested objects
      channels: { ...this.notifications.channels, ...newNotifications.channels },
      types: { ...this.notifications.types, ...newNotifications.types },
      priorities: { ...this.notifications.priorities, ...newNotifications.priorities }
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'notifications',
      key: 'notifications',
      previousValue: this.notifications,
      newValue: updatedNotifications,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      updatedNotifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  updateWorkflow(newWorkflow: Partial<WorkflowPreferences>): UserPreferences {
    const updatedWorkflow = { 
      ...this.workflow, 
      ...newWorkflow,
      customWorkflows: { ...this.workflow.customWorkflows, ...newWorkflow.customWorkflows }
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'workflow',
      key: 'workflow',
      previousValue: this.workflow,
      newValue: updatedWorkflow,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      updatedWorkflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  updateDashboard(newDashboard: Partial<DashboardPreferences>): UserPreferences {
    const updatedDashboard = { 
      ...this.dashboard, 
      ...newDashboard,
      widgets: { ...this.dashboard.widgets, ...newDashboard.widgets }
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'dashboard',
      key: 'dashboard',
      previousValue: this.dashboard,
      newValue: updatedDashboard,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      updatedDashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  updateSecurity(newSecurity: Partial<SecurityPreferences>): UserPreferences {
    const updatedSecurity = { 
      ...this.security, 
      ...newSecurity,
      trustedDevices: { ...this.security.trustedDevices, ...newSecurity.trustedDevices }
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'security',
      key: 'security',
      previousValue: this.security,
      newValue: updatedSecurity,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      updatedSecurity,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  setCustomPreference(key: string, value: any): UserPreferences {
    const updatedCustomPreferences = { ...this.customPreferences, [key]: value };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'custom',
      key,
      previousValue: this.customPreferences[key],
      newValue: value,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      updatedCustomPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  removeCustomPreference(key: string): UserPreferences {
    const updatedCustomPreferences = { ...this.customPreferences };
    const previousValue = updatedCustomPreferences[key];
    delete updatedCustomPreferences[key];

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'custom',
      key,
      previousValue,
      newValue: undefined,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      updatedCustomPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  connectApp(appId: string, permissions: string[], settings: { [key: string]: any } = {}): UserPreferences {
    const updatedConnectedApps = {
      ...this.integrations.connectedApps,
      [appId]: {
        enabled: true,
        permissions,
        settings,
        lastSync: new Date()
      }
    };

    const updatedIntegrations = {
      ...this.integrations,
      connectedApps: updatedConnectedApps
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'integration',
      key: `app_${appId}`,
      previousValue: this.integrations.connectedApps[appId] || null,
      newValue: updatedConnectedApps[appId],
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      updatedIntegrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  disconnectApp(appId: string): UserPreferences {
    const updatedConnectedApps = { ...this.integrations.connectedApps };
    const previousValue = updatedConnectedApps[appId];
    delete updatedConnectedApps[appId];

    const updatedIntegrations = {
      ...this.integrations,
      connectedApps: updatedConnectedApps
    };

    const history: PreferenceHistory = {
      changedAt: new Date(),
      category: 'integration',
      key: `app_${appId}`,
      previousValue,
      newValue: null,
      source: 'manual'
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      updatedIntegrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      [...this.history, history],
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  trustDevice(deviceId: string, deviceName: string): UserPreferences {
    const updatedTrustedDevices = {
      ...this.security.trustedDevices,
      [deviceId]: {
        name: deviceName,
        lastSeen: new Date(),
        trusted: true
      }
    };

    const updatedSecurity = {
      ...this.security,
      trustedDevices: updatedTrustedDevices
    };

    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      updatedSecurity,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      this.history,
      this.lastSyncedAt,
      this.syncEnabled,
      this.version + 1,
      this.createdAt,
      new Date()
    );
  }

  sync(source: string = 'sync'): UserPreferences {
    return new UserPreferences(
      this.id,
      this.userId,
      this.appearance,
      this.localization,
      this.notifications,
      this.workflow,
      this.privacy,
      this.accessibility,
      this.dashboard,
      this.integrations,
      this.security,
      this.clinicId,
      this.workspaceId,
      this.customPreferences,
      this.history,
      new Date(), // lastSyncedAt
      this.syncEnabled,
      this.version,
      this.createdAt,
      new Date()
    );
  }

  // Helper Methods

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Static Factory Methods

  static createDefault(userId: string, clinicId?: string, workspaceId?: string): UserPreferences {
    return new UserPreferences(
      `pref_${userId}_${Date.now()}`,
      userId,
      // Default appearance preferences
      {
        theme: 'system',
        primaryColor: '#3B82F6',
        fontSize: 'medium',
        density: 'comfortable',
        animations: true,
        reducedMotion: false,
        highContrast: false
      },
      // Default localization preferences
      {
        language: 'en',
        region: 'US',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: 'US',
        currency: 'USD',
        firstDayOfWeek: 0
      },
      // Default notification preferences
      {
        channels: {
          email: true,
          sms: false,
          push: true,
          portal: true,
          desktop: false
        },
        types: {
          appointments: true,
          messages: true,
          reminders: true,
          alerts: true,
          reports: false,
          system: true,
          marketing: false
        },
        priorities: {
          low: { enabled: true, channels: ['email', 'portal'], quietHours: { enabled: false, start: '22:00', end: '08:00' } },
          medium: { enabled: true, channels: ['email', 'push', 'portal'], quietHours: { enabled: true, start: '22:00', end: '08:00' } },
          high: { enabled: true, channels: ['email', 'push', 'portal'], quietHours: { enabled: false, start: '22:00', end: '08:00' } },
          urgent: { enabled: true, channels: ['email', 'sms', 'push', 'portal'], quietHours: { enabled: false, start: '22:00', end: '08:00' } }
        },
        digest: {
          enabled: false,
          frequency: 'daily',
          time: '09:00'
        }
      },
      // Default workflow preferences
      {
        defaultView: 'dashboard',
        itemsPerPage: 20,
        autoSave: true,
        confirmActions: true,
        keyboardShortcuts: true,
        bulkOperations: false,
        quickActions: [],
        favoriteFeatures: [],
        customWorkflows: {}
      },
      // Default privacy preferences
      {
        shareData: true,
        analytics: true,
        tracking: false,
        telemetry: true,
        crashReports: true,
        usageStatistics: true,
        dataRetention: 365,
        activityLog: true,
        exportData: true,
        deleteAccount: false
      },
      // Default accessibility preferences
      {
        screenReader: false,
        keyboardNavigation: false,
        focusIndicator: true,
        colorBlindSupport: false,
        textToSpeech: false,
        speechToText: false,
        magnification: 1.0,
        captionsEnabled: false,
        soundNotifications: true,
        vibrationEnabled: false
      },
      // Default dashboard preferences
      {
        layout: 'grid',
        widgets: {},
        refreshInterval: 300,
        autoRefresh: true,
        compactMode: false,
        showWelcome: true,
        recentItems: 10
      },
      // Default integration preferences
      {
        connectedApps: {},
        apiKeys: {},
        webhooks: {}
      },
      // Default security preferences
      {
        twoFactorAuth: false,
        sessionTimeout: 60,
        passwordExpiry: 90,
        lockAfterInactivity: 30,
        trustedDevices: {},
        loginNotifications: true,
        suspiciousActivityAlerts: true,
        dataDownloadApproval: false
      },
      clinicId,
      workspaceId
    );
  }
}