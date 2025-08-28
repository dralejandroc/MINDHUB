/**
 * Dashboard Data Repository Interface
 * Data access abstraction for DashboardData entities
 */

import { DashboardData, StatisticMetric, ChartDataPoint, ActivityItem } from '../entities/DashboardData';

export interface DataRefreshOptions {
  forceRefresh?: boolean;
  cacheMaxAge?: number; // minutes
  timeout?: number; // milliseconds
  retryAttempts?: number;
  transformData?: (data: unknown) => unknown;
}

export interface DataCacheInfo {
  isCached: boolean;
  lastUpdated: Date;
  expiresAt: Date;
  hitCount: number;
  size: number; // bytes
}

export interface DashboardDataRepository {
  /**
   * Get widget data by widget ID
   */
  getWidgetData(widgetId: string, options?: DataRefreshOptions): Promise<DashboardData>;

  /**
   * Refresh widget data from data source
   */
  refreshWidgetData(widgetId: string, dataSourceUrl: string, options?: DataRefreshOptions): Promise<DashboardData>;

  /**
   * Get statistics data
   */
  getStatisticsData(
    dataSource: string,
    filters?: Record<string, unknown>,
    options?: DataRefreshOptions
  ): Promise<DashboardData>;

  /**
   * Get chart data
   */
  getChartData(
    dataSource: string,
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter',
    filters?: Record<string, unknown>,
    options?: DataRefreshOptions
  ): Promise<DashboardData>;

  /**
   * Get list data
   */
  getListData(
    dataSource: string,
    filters?: Record<string, unknown>,
    options?: DataRefreshOptions
  ): Promise<DashboardData>;

  /**
   * Get activity data
   */
  getActivityData(
    dataSource: string,
    filters?: Record<string, unknown>,
    options?: DataRefreshOptions
  ): Promise<DashboardData>;

  /**
   * Get real-time data
   */
  getRealTimeData(
    widgetId: string,
    dataSource: string,
    lastUpdateTime?: Date
  ): Promise<DashboardData>;

  /**
   * Subscribe to real-time data updates
   */
  subscribeToRealTimeData(
    widgetId: string,
    dataSource: string,
    callback: (data: DashboardData) => void
  ): Promise<() => void>; // Returns unsubscribe function

  /**
   * Get cached data information
   */
  getCacheInfo(widgetId: string): Promise<DataCacheInfo>;

  /**
   * Clear widget data cache
   */
  clearCache(widgetId: string): Promise<void>;

  /**
   * Clear all cached data
   */
  clearAllCache(): Promise<void>;

  /**
   * Preload widget data
   */
  preloadWidgetData(widgetIds: string[]): Promise<{
    preloaded: string[];
    failed: Array<{ widgetId: string; error: string }>;
  }>;

  /**
   * Batch get widget data
   */
  batchGetWidgetData(
    widgetIds: string[],
    options?: DataRefreshOptions
  ): Promise<Map<string, DashboardData>>;

  /**
   * Get data source status
   */
  getDataSourceStatus(dataSource: string): Promise<{
    isAvailable: boolean;
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
    lastError?: string;
  }>;

  /**
   * Test data source connection
   */
  testDataSourceConnection(
    dataSource: string,
    configuration?: Record<string, unknown>
  ): Promise<{
    isConnected: boolean;
    responseTime: number;
    sampleData?: unknown;
    error?: string;
  }>;

  /**
   * Get available data sources
   */
  getAvailableDataSources(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    type: 'api' | 'database' | 'file' | 'realtime' | 'mock';
    endpoints: string[];
    supportedFormats: Array<'statistics' | 'chart' | 'list' | 'activity'>;
    requiresAuth: boolean;
    rateLimit?: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    documentation?: string;
  }>>;

  /**
   * Transform data to specific format
   */
  transformData(
    data: unknown,
    targetFormat: 'statistics' | 'chart' | 'list' | 'activity',
    configuration?: Record<string, unknown>
  ): Promise<DashboardData>;

  /**
   * Validate data format
   */
  validateDataFormat(
    data: unknown,
    expectedFormat: 'statistics' | 'chart' | 'list' | 'activity'
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Get data schema
   */
  getDataSchema(dataSource: string): Promise<{
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
      required: boolean;
      description?: string;
      format?: string;
      examples?: unknown[];
    }>;
    relationships?: Array<{
      field: string;
      relatedDataSource: string;
      relatedField: string;
    }>;
  }>;

  /**
   * Get data quality metrics
   */
  getDataQualityMetrics(
    widgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    consistency: number; // 0-100%
    timeliness: number; // 0-100%
    issues: Array<{
      type: 'missing_data' | 'invalid_format' | 'outdated' | 'duplicate';
      count: number;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    trends: Array<{
      date: Date;
      completeness: number;
      accuracy: number;
    }>;
  }>;

  /**
   * Get data usage analytics
   */
  getDataUsageAnalytics(
    dataSource: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    averageRequestsPerDay: number;
    peakUsageHours: Array<{
      hour: number;
      requests: number;
    }>;
    errorRate: number;
    averageResponseTime: number;
    dataTransferVolume: number; // bytes
    mostActiveWidgets: Array<{
      widgetId: string;
      requests: number;
    }>;
    cacheEfficiency: {
      hitRate: number;
      missRate: number;
      evictionRate: number;
    };
  }>;

  /**
   * Export widget data
   */
  exportWidgetData(
    widgetId: string,
    format: 'json' | 'csv' | 'excel',
    options?: {
      includeMetadata?: boolean;
      dateRange?: { start: Date; end: Date };
      filters?: Record<string, unknown>;
    }
  ): Promise<{
    filename: string;
    content: string | Buffer;
    size: number;
    recordCount: number;
  }>;

  /**
   * Import data to widget
   */
  importWidgetData(
    widgetId: string,
    data: string | Buffer,
    format: 'json' | 'csv' | 'excel',
    options?: {
      validateData?: boolean;
      replaceExisting?: boolean;
      transformRules?: Record<string, string>;
    }
  ): Promise<{
    recordsImported: number;
    recordsSkipped: number;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Schedule data refresh
   */
  scheduleRefresh(
    widgetId: string,
    schedule: {
      type: 'interval' | 'cron';
      configuration: string;
      enabled: boolean;
      options?: DataRefreshOptions;
    }
  ): Promise<void>;

  /**
   * Get scheduled refreshes
   */
  getScheduledRefreshes(widgetId?: string): Promise<Array<{
    widgetId: string;
    schedule: {
      type: 'interval' | 'cron';
      configuration: string;
      enabled: boolean;
    };
    nextRun: Date;
    lastRun?: Date;
    status: 'active' | 'paused' | 'failed';
    statistics: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
      averageDuration: number;
    };
  }>>;

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
    status: 'success' | 'failure' | 'timeout' | 'cancelled';
    duration: number;
    recordsUpdated: number;
    error?: string;
    cacheUsed: boolean;
    dataSource: string;
  }>>;

  /**
   * Set up data alerts
   */
  setupDataAlert(
    widgetId: string,
    alert: {
      name: string;
      condition: {
        field: string;
        operator: '>' | '<' | '=' | '!=' | 'contains' | 'missing';
        value: unknown;
      };
      notification: {
        email?: string[];
        webhook?: string;
        dashboard?: boolean;
      };
      enabled: boolean;
    }
  ): Promise<string>; // Returns alert ID

  /**
   * Get data alerts
   */
  getDataAlerts(widgetId?: string): Promise<Array<{
    id: string;
    widgetId: string;
    name: string;
    condition: {
      field: string;
      operator: string;
      value: unknown;
    };
    notification: Record<string, unknown>;
    enabled: boolean;
    lastTriggered?: Date;
    triggerCount: number;
  }>>;

  /**
   * Delete data alert
   */
  deleteDataAlert(alertId: string): Promise<void>;

  /**
   * Get data lineage
   */
  getDataLineage(widgetId: string): Promise<{
    sources: Array<{
      id: string;
      name: string;
      type: string;
      lastUpdated: Date;
    }>;
    transformations: Array<{
      step: string;
      description: string;
      timestamp: Date;
    }>;
    dependencies: Array<{
      widgetId: string;
      dependencyType: 'filter' | 'calculation' | 'aggregation';
    }>;
  }>;

  /**
   * Optimize data queries
   */
  optimizeQueries(
    dataSource: string,
    queryPatterns: Array<{
      query: string;
      frequency: number;
      responseTime: number;
    }>
  ): Promise<{
    optimizedQueries: Array<{
      original: string;
      optimized: string;
      expectedImprovement: string;
    }>;
    cacheRecommendations: Array<{
      query: string;
      suggestedTTL: number; // minutes
      reason: string;
    }>;
    indexRecommendations: Array<{
      table: string;
      fields: string[];
      reason: string;
    }>;
  }>;
}