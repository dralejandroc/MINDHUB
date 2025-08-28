/**
 * Dashboard Repository Interface
 * Data access abstraction for Dashboard entities
 */

import { Dashboard, DashboardType, DashboardLayout } from '../entities/Dashboard';

export interface DashboardSearchFilters {
  userId?: string;
  clinicId?: string;
  workspaceId?: string;
  type?: DashboardType;
  layout?: DashboardLayout;
  isDefault?: boolean;
  isShared?: boolean;
  isActive?: boolean;
}

export interface DashboardUsageStatistics {
  totalViews: number;
  averageViewTime: number;
  mostViewedWidgets: Array<{
    widgetId: string;
    title: string;
    views: number;
  }>;
  peakUsageHours: Array<{
    hour: number;
    views: number;
  }>;
}

export interface DashboardPerformanceStatistics {
  averageLoadTime: number;
  slowestWidgets: Array<{
    widgetId: string;
    title: string;
    averageLoadTime: number;
  }>;
  errorRate: number;
  refreshSuccess: number;
}

export interface DashboardRepository {
  /**
   * Find dashboard by ID
   */
  findById(id: string): Promise<Dashboard | null>;

  /**
   * Find dashboards by user
   */
  findByUser(userId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Find default dashboard by type
   */
  findDefaultByType(userId: string, type: DashboardType): Promise<Dashboard | null>;

  /**
   * Find shared dashboards
   */
  findShared(filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Find dashboards by type
   */
  findByType(type: DashboardType, filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Find dashboards by clinic
   */
  findByClinic(clinicId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Find dashboards by workspace
   */
  findByWorkspace(workspaceId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Search dashboards by name
   */
  searchByName(query: string, filters?: DashboardSearchFilters): Promise<Dashboard[]>;

  /**
   * Find recently accessed dashboards
   */
  findRecentlyAccessed(userId: string, limit?: number): Promise<Dashboard[]>;

  /**
   * Find most used dashboards
   */
  findMostUsed(userId: string, limit?: number): Promise<Dashboard[]>;

  /**
   * Create new dashboard
   */
  create(dashboard: Dashboard): Promise<Dashboard>;

  /**
   * Update existing dashboard
   */
  update(dashboard: Dashboard): Promise<Dashboard>;

  /**
   * Delete dashboard (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Archive dashboard
   */
  archive(id: string, archivedBy: string, reason?: string): Promise<Dashboard>;

  /**
   * Restore archived dashboard
   */
  restore(id: string, restoredBy: string): Promise<Dashboard>;

  /**
   * Set as default dashboard
   */
  setAsDefault(id: string, userId: string, type: DashboardType): Promise<Dashboard>;

  /**
   * Share dashboard
   */
  share(id: string, sharedBy: string, shareSettings?: {
    allowEdit?: boolean;
    allowCopy?: boolean;
    expiresAt?: Date;
    sharedWithUsers?: string[];
    sharedWithRoles?: string[];
  }): Promise<Dashboard>;

  /**
   * Unshare dashboard
   */
  unshare(id: string, unsharedBy: string): Promise<Dashboard>;

  /**
   * Clone dashboard
   */
  clone(
    id: string,
    newName: string,
    clonedBy: string,
    clinicId?: string,
    workspaceId?: string
  ): Promise<Dashboard>;

  /**
   * Get dashboard statistics
   */
  getStatistics(filters?: DashboardSearchFilters): Promise<{
    totalDashboards: number;
    dashboardsByType: { [type: string]: number };
    dashboardsByLayout: { [layout: string]: number };
    totalWidgets: number;
    averageWidgetsPerDashboard: number;
    sharedDashboards: number;
    defaultDashboards: number;
    recentlyCreated: number;
    mostActiveDashboard: {
      id: string;
      name: string;
      views: number;
    } | null;
  }>;

  /**
   * Get usage statistics
   */
  getUsageStatistics(
    dashboardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardUsageStatistics>;

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(
    dashboardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardPerformanceStatistics>;

  /**
   * Track dashboard view
   */
  trackView(
    dashboardId: string,
    userId: string,
    sessionInfo: {
      userAgent: string;
      ipAddress: string;
      timestamp: Date;
      duration?: number;
    }
  ): Promise<void>;

  /**
   * Track dashboard interaction
   */
  trackInteraction(
    dashboardId: string,
    userId: string,
    interaction: {
      type: 'widget_click' | 'refresh' | 'resize' | 'reorder' | 'filter';
      widgetId?: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void>;

  /**
   * Get dashboard templates
   */
  getTemplates(
    type?: DashboardType,
    category?: string
  ): Promise<Array<{
    id: string;
    name: string;
    description: string;
    type: DashboardType;
    category: string;
    previewUrl?: string;
    widgetCount: number;
    tags: string[];
  }>>;

  /**
   * Create dashboard from template
   */
  createFromTemplate(
    templateId: string,
    name: string,
    userId: string,
    clinicId?: string,
    workspaceId?: string,
    customizations?: {
      configuration?: Partial<Dashboard['configuration']>;
      widgetCustomizations?: Record<string, unknown>;
    }
  ): Promise<Dashboard>;

  /**
   * Bulk operations
   */
  bulkUpdate(
    dashboardIds: string[],
    updates: Partial<Pick<Dashboard, 'configuration' | 'isShared' | 'layout'>>,
    updatedBy: string
  ): Promise<Dashboard[]>;

  /**
   * Bulk delete
   */
  bulkDelete(dashboardIds: string[], deletedBy: string): Promise<void>;

  /**
   * Export dashboard configuration
   */
  export(
    dashboardId: string,
    format: 'json' | 'yaml',
    includeData?: boolean
  ): Promise<{
    filename: string;
    content: string;
    size: number;
  }>;

  /**
   * Import dashboard configuration
   */
  import(
    configuration: string,
    format: 'json' | 'yaml',
    userId: string,
    clinicId?: string,
    workspaceId?: string,
    options?: {
      overwriteExisting?: boolean;
      generateNewIds?: boolean;
      validateBeforeImport?: boolean;
    }
  ): Promise<Dashboard>;

  /**
   * Get dashboard health check
   */
  getHealthCheck(dashboardId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: Record<string, unknown>;
    }>;
    lastChecked: Date;
    recommendations: Array<{
      type: 'performance' | 'layout' | 'data' | 'accessibility';
      priority: 'low' | 'medium' | 'high';
      message: string;
      actionRequired: boolean;
    }>;
  }>;

  /**
   * Optimize dashboard performance
   */
  optimize(
    dashboardId: string,
    optimizations: Array<{
      type: 'widget_caching' | 'data_compression' | 'layout_optimization' | 'query_optimization';
      enabled: boolean;
      parameters?: Record<string, unknown>;
    }>
  ): Promise<{
    optimizationsApplied: number;
    estimatedPerformanceGain: string;
    warnings: string[];
  }>;

  /**
   * Get dashboard accessibility score
   */
  getAccessibilityScore(dashboardId: string): Promise<{
    score: number; // 0-100
    issues: Array<{
      type: 'color_contrast' | 'keyboard_navigation' | 'screen_reader' | 'focus_management';
      severity: 'low' | 'medium' | 'high';
      description: string;
      suggestion: string;
      widgetIds?: string[];
    }>;
    compliantStandards: string[];
    recommendations: string[];
  }>;

  /**
   * Schedule dashboard refresh
   */
  scheduleRefresh(
    dashboardId: string,
    schedule: {
      type: 'interval' | 'cron' | 'event_based';
      configuration: string;
      enabled: boolean;
      nextRun?: Date;
    },
    scheduledBy: string
  ): Promise<void>;

  /**
   * Get scheduled refreshes
   */
  getScheduledRefreshes(dashboardId: string): Promise<Array<{
    id: string;
    type: 'interval' | 'cron' | 'event_based';
    configuration: string;
    enabled: boolean;
    nextRun: Date;
    lastRun?: Date;
    status: 'active' | 'paused' | 'failed';
  }>>;

  /**
   * Archive old dashboard versions
   */
  archiveOldVersions(
    beforeDate: Date,
    options: {
      keepLatestVersion: boolean;
      compressionEnabled: boolean;
      archiveLocation?: string;
    }
  ): Promise<{
    archivedDashboards: number;
    archivedVersions: number;
    archiveSize: string;
  }>;
}