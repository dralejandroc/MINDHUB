/**
 * Dashboard Widget Repository Interface
 * Data access abstraction for DashboardWidget entities
 */

import { DashboardWidget, WidgetType, WidgetSize, RefreshInterval } from '../entities/DashboardWidget';

export interface WidgetSearchFilters {
  dashboardId?: string;
  userId?: string;
  clinicId?: string;
  workspaceId?: string;
  type?: WidgetType;
  size?: WidgetSize;
  isVisible?: boolean;
  dataSource?: string;
  refreshInterval?: RefreshInterval;
}

export interface WidgetPerformanceMetrics {
  widgetId: string;
  averageLoadTime: number;
  refreshCount: number;
  errorCount: number;
  lastRefresh: Date;
  dataSize: number;
  cacheHitRate: number;
}

export interface DashboardWidgetRepository {
  /**
   * Find widget by ID
   */
  findById(id: string): Promise<DashboardWidget | null>;

  /**
   * Find widgets by dashboard
   */
  findByDashboard(dashboardId: string): Promise<DashboardWidget[]>;

  /**
   * Find visible widgets by dashboard
   */
  findVisibleByDashboard(dashboardId: string): Promise<DashboardWidget[]>;

  /**
   * Find widgets by user
   */
  findByUser(userId: string, filters?: WidgetSearchFilters): Promise<DashboardWidget[]>;

  /**
   * Find widgets by type
   */
  findByType(type: WidgetType, filters?: WidgetSearchFilters): Promise<DashboardWidget[]>;

  /**
   * Find widgets by data source
   */
  findByDataSource(dataSource: string, filters?: WidgetSearchFilters): Promise<DashboardWidget[]>;

  /**
   * Find widgets requiring refresh
   */
  findRequiringRefresh(
    maxAge: number, // minutes
    filters?: WidgetSearchFilters
  ): Promise<DashboardWidget[]>;

  /**
   * Find widgets by position range
   */
  findByPositionRange(
    dashboardId: string,
    startRow: number,
    endRow: number,
    startColumn?: number,
    endColumn?: number
  ): Promise<DashboardWidget[]>;

  /**
   * Find widgets with performance issues
   */
  findWithPerformanceIssues(
    thresholds: {
      maxLoadTime?: number;
      maxErrorRate?: number;
      minCacheHitRate?: number;
    }
  ): Promise<Array<{
    widget: DashboardWidget;
    issues: string[];
    metrics: WidgetPerformanceMetrics;
  }>>;

  /**
   * Create new widget
   */
  create(widget: DashboardWidget): Promise<DashboardWidget>;

  /**
   * Update existing widget
   */
  update(widget: DashboardWidget): Promise<DashboardWidget>;

  /**
   * Delete widget
   */
  delete(id: string): Promise<void>;

  /**
   * Hide widget
   */
  hide(id: string, hiddenBy: string): Promise<DashboardWidget>;

  /**
   * Show widget
   */
  show(id: string, shownBy: string): Promise<DashboardWidget>;

  /**
   * Move widget to different dashboard
   */
  moveToDashboard(
    widgetId: string,
    targetDashboardId: string,
    position: { row: number; column: number },
    movedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Duplicate widget
   */
  duplicate(
    widgetId: string,
    targetDashboardId: string,
    position: { row: number; column: number },
    newTitle?: string,
    duplicatedBy?: string
  ): Promise<DashboardWidget>;

  /**
   * Resize widget
   */
  resize(
    id: string,
    newSize: WidgetSize,
    resizedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Update widget position
   */
  updatePosition(
    id: string,
    newPosition: { row: number; column: number },
    updatedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Update widget refresh interval
   */
  updateRefreshInterval(
    id: string,
    interval: RefreshInterval,
    updatedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Update widget data source
   */
  updateDataSource(
    id: string,
    dataSource: string,
    updatedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Update widget filters
   */
  updateFilters(
    id: string,
    filters: Record<string, unknown>,
    updatedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Update widget display options
   */
  updateDisplayOptions(
    id: string,
    displayOptions: Record<string, unknown>,
    updatedBy: string
  ): Promise<DashboardWidget>;

  /**
   * Get widget statistics
   */
  getStatistics(filters?: WidgetSearchFilters): Promise<{
    totalWidgets: number;
    widgetsByType: { [type: string]: number };
    widgetsBySize: { [size: string]: number };
    widgetsByRefreshInterval: { [interval: string]: number };
    visibleWidgets: number;
    hiddenWidgets: number;
    averageWidgetsPerDashboard: number;
    dataSourceDistribution: { [source: string]: number };
    mostUsedWidgetType: string;
    performanceIssues: number;
  }>;

  /**
   * Get widget performance metrics
   */
  getPerformanceMetrics(
    widgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WidgetPerformanceMetrics>;

  /**
   * Get widgets needing attention
   */
  findNeedingAttention(filters?: WidgetSearchFilters): Promise<Array<{
    widget: DashboardWidget;
    issues: Array<{
      type: 'performance' | 'data' | 'configuration' | 'accessibility';
      severity: 'low' | 'medium' | 'high';
      description: string;
      suggestion: string;
    }>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>>;

  /**
   * Optimize widget configuration
   */
  optimize(
    widgetId: string,
    optimizations: Array<{
      type: 'caching' | 'data_compression' | 'query_optimization' | 'rendering';
      enabled: boolean;
      parameters?: Record<string, unknown>;
    }>
  ): Promise<{
    optimizationsApplied: number;
    estimatedPerformanceGain: string;
    newConfiguration: Record<string, unknown>;
  }>;

  /**
   * Get widget templates
   */
  getTemplates(type?: WidgetType): Promise<Array<{
    id: string;
    name: string;
    description: string;
    type: WidgetType;
    size: WidgetSize;
    previewUrl?: string;
    category: string;
    tags: string[];
    configuration: Record<string, unknown>;
  }>>;

  /**
   * Create widget from template
   */
  createFromTemplate(
    templateId: string,
    dashboardId: string,
    position: { row: number; column: number },
    customizations?: {
      title?: string;
      size?: WidgetSize;
      refreshInterval?: RefreshInterval;
      dataSource?: string;
      filters?: Record<string, unknown>;
      displayOptions?: Record<string, unknown>;
    }
  ): Promise<DashboardWidget>;

  /**
   * Bulk operations
   */
  bulkUpdate(
    widgetIds: string[],
    updates: Partial<Pick<DashboardWidget, 'isVisible' | 'refreshInterval' | 'size'>>,
    updatedBy: string
  ): Promise<DashboardWidget[]>;

  /**
   * Bulk move to dashboard
   */
  bulkMoveToDashboard(
    widgetIds: string[],
    targetDashboardId: string,
    startPosition: { row: number; column: number },
    movedBy: string
  ): Promise<DashboardWidget[]>;

  /**
   * Bulk delete
   */
  bulkDelete(widgetIds: string[], deletedBy: string): Promise<void>;

  /**
   * Track widget interaction
   */
  trackInteraction(
    widgetId: string,
    userId: string,
    interaction: {
      type: 'view' | 'click' | 'resize' | 'move' | 'refresh' | 'configure';
      timestamp: Date;
      duration?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void>;

  /**
   * Get widget usage analytics
   */
  getUsageAnalytics(
    widgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalViews: number;
    uniqueUsers: number;
    averageViewTime: number;
    interactionsByType: { [type: string]: number };
    peakUsageHours: Array<{
      hour: number;
      views: number;
    }>;
    userEngagement: {
      clickThroughRate: number;
      bounceRate: number;
      averageInteractionsPerView: number;
    };
  }>;

  /**
   * Export widget configuration
   */
  export(
    widgetId: string,
    format: 'json' | 'yaml'
  ): Promise<{
    filename: string;
    content: string;
    size: number;
  }>;

  /**
   * Import widget configuration
   */
  import(
    configuration: string,
    format: 'json' | 'yaml',
    dashboardId: string,
    position: { row: number; column: number },
    options?: {
      generateNewId?: boolean;
      validateBeforeImport?: boolean;
      overrideConflicts?: boolean;
    }
  ): Promise<DashboardWidget>;

  /**
   * Get widget health check
   */
  getHealthCheck(widgetId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
    dataFreshness: {
      lastUpdated: Date;
      isStale: boolean;
      stalenessThreshold: number;
    };
    performance: {
      loadTime: number;
      renderTime: number;
      memoryUsage: number;
    };
    recommendations: string[];
  }>;

  /**
   * Validate widget configuration
   */
  validateConfiguration(
    configuration: Record<string, unknown>,
    type: WidgetType
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }>;

  /**
   * Get widget dependencies
   */
  getDependencies(widgetId: string): Promise<{
    dataSources: string[];
    externalAPIs: string[];
    requiredPermissions: string[];
    relatedWidgets: Array<{
      widgetId: string;
      relationship: 'filter' | 'drill_down' | 'context' | 'data_source';
    }>;
  }>;

  /**
   * Test widget data connection
   */
  testDataConnection(
    dataSource: string,
    configuration: Record<string, unknown>
  ): Promise<{
    isConnected: boolean;
    responseTime: number;
    dataPreview?: unknown[];
    errors?: string[];
    warnings?: string[];
  }>;

  /**
   * Schedule widget data refresh
   */
  scheduleRefresh(
    widgetId: string,
    schedule: {
      type: 'interval' | 'cron' | 'event_based';
      configuration: string;
      enabled: boolean;
    }
  ): Promise<void>;

  /**
   * Cancel scheduled refresh
   */
  cancelScheduledRefresh(widgetId: string): Promise<void>;

  /**
   * Get refresh history
   */
  getRefreshHistory(
    widgetId: string,
    limit?: number
  ): Promise<Array<{
    timestamp: Date;
    status: 'success' | 'failure' | 'partial';
    duration: number;
    recordsUpdated?: number;
    error?: string;
  }>>;
}