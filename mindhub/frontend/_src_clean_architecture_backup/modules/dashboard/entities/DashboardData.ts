/**
 * Dashboard Data Entity
 * Represents data for dashboard widgets
 */

export interface DataPoint {
  label: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChartDataPoint extends DataPoint {
  x: number | Date;
  y: number;
  series?: string;
  color?: string;
}

export interface StatisticMetric {
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changePercentage?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'currency' | 'percentage' | 'text';
  icon?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
}

export interface ActivityItem {
  id: string;
  type: 'patient_created' | 'appointment_scheduled' | 'payment_received' | 'assessment_completed' | 'other';
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export class DashboardData {
  constructor(
    public readonly widgetId: string,
    public readonly dataType: 'statistics' | 'chart' | 'list' | 'activity',
    public readonly data: any,
    public readonly lastUpdated: Date = new Date(),
    public readonly isLoading: boolean = false,
    public readonly error: string | null = null,
    public readonly metadata: Record<string, any> = {}
  ) {}

  // Factory methods for different data types
  static createStatisticsData(
    widgetId: string,
    metrics: StatisticMetric[],
    metadata?: Record<string, any>
  ): DashboardData {
    return new DashboardData(
      widgetId,
      'statistics',
      { metrics },
      new Date(),
      false,
      null,
      metadata || {}
    );
  }

  static createChartData(
    widgetId: string,
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter',
    dataPoints: ChartDataPoint[],
    options?: {
      title?: string;
      xAxisLabel?: string;
      yAxisLabel?: string;
      showLegend?: boolean;
      colors?: string[];
    },
    metadata?: Record<string, any>
  ): DashboardData {
    return new DashboardData(
      widgetId,
      'chart',
      {
        chartType,
        dataPoints,
        options: options || {},
      },
      new Date(),
      false,
      null,
      metadata || {}
    );
  }

  static createListData(
    widgetId: string,
    items: Array<{
      id: string;
      title: string;
      subtitle?: string;
      value?: string;
      status?: 'success' | 'warning' | 'error' | 'info';
      metadata?: Record<string, any>;
    }>,
    metadata?: Record<string, any>
  ): DashboardData {
    return new DashboardData(
      widgetId,
      'list',
      { items },
      new Date(),
      false,
      null,
      metadata || {}
    );
  }

  static createActivityData(
    widgetId: string,
    activities: ActivityItem[],
    metadata?: Record<string, any>
  ): DashboardData {
    return new DashboardData(
      widgetId,
      'activity',
      { activities },
      new Date(),
      false,
      null,
      metadata || {}
    );
  }

  static createLoadingData(widgetId: string, dataType: 'statistics' | 'chart' | 'list' | 'activity'): DashboardData {
    return new DashboardData(
      widgetId,
      dataType,
      null,
      new Date(),
      true,
      null,
      {}
    );
  }

  static createErrorData(
    widgetId: string,
    dataType: 'statistics' | 'chart' | 'list' | 'activity',
    error: string
  ): DashboardData {
    return new DashboardData(
      widgetId,
      dataType,
      null,
      new Date(),
      false,
      error,
      {}
    );
  }

  // Helper methods
  isStatisticsData(): boolean {
    return this.dataType === 'statistics';
  }

  isChartData(): boolean {
    return this.dataType === 'chart';
  }

  isListData(): boolean {
    return this.dataType === 'list';
  }

  isActivityData(): boolean {
    return this.dataType === 'activity';
  }

  hasData(): boolean {
    return !this.isLoading && !this.error && this.data !== null;
  }

  hasError(): boolean {
    return this.error !== null;
  }

  getStatistics(): StatisticMetric[] {
    if (!this.isStatisticsData() || !this.hasData()) {
      return [];
    }
    return this.data.metrics || [];
  }

  getChartData(): {
    chartType: string;
    dataPoints: ChartDataPoint[];
    options: Record<string, any>;
  } | null {
    if (!this.isChartData() || !this.hasData()) {
      return null;
    }
    return {
      chartType: this.data.chartType,
      dataPoints: this.data.dataPoints,
      options: this.data.options,
    };
  }

  getListItems(): Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    metadata?: Record<string, any>;
  }> {
    if (!this.isListData() || !this.hasData()) {
      return [];
    }
    return this.data.items || [];
  }

  getActivities(): ActivityItem[] {
    if (!this.isActivityData() || !this.hasData()) {
      return [];
    }
    return this.data.activities || [];
  }

  getAge(): number {
    return Date.now() - this.lastUpdated.getTime();
  }

  isStale(maxAgeMs: number): boolean {
    return this.getAge() > maxAgeMs;
  }

  // Update methods (return new instances)
  withData(newData: any): DashboardData {
    return new DashboardData(
      this.widgetId,
      this.dataType,
      newData,
      new Date(),
      false,
      null,
      this.metadata
    );
  }

  withError(error: string): DashboardData {
    return new DashboardData(
      this.widgetId,
      this.dataType,
      null,
      new Date(),
      false,
      error,
      this.metadata
    );
  }

  withLoading(loading: boolean): DashboardData {
    return new DashboardData(
      this.widgetId,
      this.dataType,
      this.data,
      this.lastUpdated,
      loading,
      this.error,
      this.metadata
    );
  }

  withMetadata(metadata: Record<string, any>): DashboardData {
    return new DashboardData(
      this.widgetId,
      this.dataType,
      this.data,
      this.lastUpdated,
      this.isLoading,
      this.error,
      { ...this.metadata, ...metadata }
    );
  }
}