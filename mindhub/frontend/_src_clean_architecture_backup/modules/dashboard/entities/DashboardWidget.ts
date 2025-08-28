/**
 * Dashboard Widget Entity
 * Core business logic for dashboard widgets
 */

export type WidgetType = 'stats' | 'chart' | 'list' | 'metric' | 'activity' | 'calendar';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type RefreshInterval = 'never' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h';

export interface WidgetConfiguration {
  title: string;
  type: WidgetType;
  size: WidgetSize;
  refreshInterval: RefreshInterval;
  dataSource: string;
  filters: Record<string, any>;
  displayOptions: Record<string, any>;
  position: {
    row: number;
    column: number;
  };
}

export class DashboardWidget {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dashboardId: string,
    public readonly title: string,
    public readonly type: WidgetType,
    public readonly size: WidgetSize,
    public readonly position: { row: number; column: number },
    public readonly configuration: WidgetConfiguration,
    public readonly isVisible: boolean = true,
    public readonly refreshInterval: RefreshInterval = '5m',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly clinicId?: string,
    public readonly workspaceId?: string
  ) {
    this.validateWidget();
  }

  private validateWidget(): void {
    if (!this.title.trim()) {
      throw new Error('Widget title cannot be empty');
    }

    if (this.position.row < 0 || this.position.column < 0) {
      throw new Error('Widget position must be non-negative');
    }

    if (!this.userId || !this.dashboardId) {
      throw new Error('Widget must belong to a user and dashboard');
    }
  }

  // Business logic methods
  canBeRefreshed(): boolean {
    return this.refreshInterval !== 'never' && this.isVisible;
  }

  getRefreshIntervalMs(): number {
    const intervals: Record<RefreshInterval, number> = {
      'never': 0,
      '30s': 30 * 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
    };
    return intervals[this.refreshInterval];
  }

  updateConfiguration(newConfig: Partial<WidgetConfiguration>): DashboardWidget {
    const updatedConfig = { ...this.configuration, ...newConfig };
    
    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      newConfig.title || this.title,
      newConfig.type || this.type,
      newConfig.size || this.size,
      newConfig.position || this.position,
      updatedConfig,
      this.isVisible,
      newConfig.refreshInterval || this.refreshInterval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  updatePosition(row: number, column: number): DashboardWidget {
    if (row < 0 || column < 0) {
      throw new Error('Position must be non-negative');
    }

    const newPosition = { row, column };
    const updatedConfig = { ...this.configuration, position: newPosition };

    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      this.title,
      this.type,
      this.size,
      newPosition,
      updatedConfig,
      this.isVisible,
      this.refreshInterval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  hide(): DashboardWidget {
    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      this.title,
      this.type,
      this.size,
      this.position,
      this.configuration,
      false,
      this.refreshInterval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  show(): DashboardWidget {
    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      this.title,
      this.type,
      this.size,
      this.position,
      this.configuration,
      true,
      this.refreshInterval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  resize(newSize: WidgetSize): DashboardWidget {
    const updatedConfig = { ...this.configuration, size: newSize };

    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      this.title,
      this.type,
      newSize,
      this.position,
      updatedConfig,
      this.isVisible,
      this.refreshInterval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  updateRefreshInterval(interval: RefreshInterval): DashboardWidget {
    const updatedConfig = { ...this.configuration, refreshInterval: interval };

    return new DashboardWidget(
      this.id,
      this.userId,
      this.dashboardId,
      this.title,
      this.type,
      this.size,
      this.position,
      updatedConfig,
      this.isVisible,
      interval,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  // Validation methods
  isStatsWidget(): boolean {
    return this.type === 'stats';
  }

  isChartWidget(): boolean {
    return this.type === 'chart';
  }

  isListWidget(): boolean {
    return this.type === 'list';
  }

  requiresRealTimeData(): boolean {
    const realTimeWidgets: WidgetType[] = ['activity', 'stats', 'metric'];
    return realTimeWidgets.includes(this.type);
  }

  getGridSpan(): { rows: number; columns: number } {
    const spans: Record<WidgetSize, { rows: number; columns: number }> = {
      'small': { rows: 1, columns: 1 },
      'medium': { rows: 1, columns: 2 },
      'large': { rows: 2, columns: 2 },
      'full': { rows: 1, columns: 4 },
    };
    return spans[this.size];
  }

  getDataSourceUrl(): string {
    const baseUrls: Record<string, string> = {
      'patients': '/api/expedix/stats',
      'appointments': '/api/agenda/stats',
      'finance': '/api/finance/stats',
      'clinimetrix': '/api/clinimetrix-pro/stats',
      'activity': '/api/activity/recent',
    };
    return baseUrls[this.configuration.dataSource] || '/api/dashboard/data';
  }

  // Factory methods
  static createStatsWidget(
    id: string,
    userId: string,
    dashboardId: string,
    title: string,
    dataSource: string,
    position: { row: number; column: number },
    clinicId?: string,
    workspaceId?: string
  ): DashboardWidget {
    const configuration: WidgetConfiguration = {
      title,
      type: 'stats',
      size: 'medium',
      refreshInterval: '5m',
      dataSource,
      filters: {},
      displayOptions: {
        showTrends: true,
        showComparison: true,
      },
      position,
    };

    return new DashboardWidget(
      id,
      userId,
      dashboardId,
      title,
      'stats',
      'medium',
      position,
      configuration,
      true,
      '5m',
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }

  static createChartWidget(
    id: string,
    userId: string,
    dashboardId: string,
    title: string,
    chartType: string,
    dataSource: string,
    position: { row: number; column: number },
    clinicId?: string,
    workspaceId?: string
  ): DashboardWidget {
    const configuration: WidgetConfiguration = {
      title,
      type: 'chart',
      size: 'large',
      refreshInterval: '15m',
      dataSource,
      filters: {},
      displayOptions: {
        chartType,
        showLegend: true,
        showDataLabels: false,
      },
      position,
    };

    return new DashboardWidget(
      id,
      userId,
      dashboardId,
      title,
      'chart',
      'large',
      position,
      configuration,
      true,
      '15m',
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }

  static createActivityWidget(
    id: string,
    userId: string,
    dashboardId: string,
    title: string,
    position: { row: number; column: number },
    clinicId?: string,
    workspaceId?: string
  ): DashboardWidget {
    const configuration: WidgetConfiguration = {
      title,
      type: 'activity',
      size: 'medium',
      refreshInterval: '1m',
      dataSource: 'activity',
      filters: { limit: 10 },
      displayOptions: {
        showTimestamps: true,
        showUserActions: true,
      },
      position,
    };

    return new DashboardWidget(
      id,
      userId,
      dashboardId,
      title,
      'activity',
      'medium',
      position,
      configuration,
      true,
      '1m',
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }
}