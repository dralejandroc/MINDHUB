/**
 * Manage Dashboard Use Case
 * Application business rules for dashboard operations
 */

import { Dashboard, DashboardType, DashboardLayout } from '../entities/Dashboard';
import { DashboardWidget, WidgetType, WidgetSize, RefreshInterval } from '../entities/DashboardWidget';
import { DashboardData, StatisticMetric, ChartDataPoint, ActivityItem } from '../entities/DashboardData';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { DashboardWidgetRepository } from '../repositories/DashboardWidgetRepository';
import { DashboardDataRepository } from '../repositories/DashboardDataRepository';

export interface CreateDashboardRequest {
  userId: string;
  name: string;
  type: DashboardType;
  layout?: DashboardLayout;
  isDefault?: boolean;
  isShared?: boolean;
  clinicId?: string;
  workspaceId?: string;
  configuration?: Partial<Dashboard['configuration']>;
}

export interface AddWidgetRequest {
  dashboardId: string;
  title: string;
  type: WidgetType;
  size?: WidgetSize;
  position?: { row: number; column: number };
  refreshInterval?: RefreshInterval;
  dataSource: string;
  filters?: Record<string, unknown>;
  displayOptions?: Record<string, unknown>;
}

export interface UpdateDashboardConfigurationRequest {
  dashboardId: string;
  configuration: Partial<Dashboard['configuration']>;
  updatedBy: string;
}

export interface DashboardOperationResult {
  dashboard: Dashboard;
  widgets: DashboardWidget[];
  warnings: string[];
  metrics: {
    totalWidgets: number;
    visibleWidgets: number;
    dataSourcesUsed: string[];
    refreshableWidgets: number;
    lastRefreshTime: Date;
  };
}

export interface DashboardAnalytics {
  usageStats: {
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
  };
  performanceStats: {
    averageLoadTime: number;
    slowestWidgets: Array<{
      widgetId: string;
      title: string;
      averageLoadTime: number;
    }>;
    errorRate: number;
    refreshSuccess: number;
  };
  contentStats: {
    widgetTypeDistribution: { [type: string]: number };
    dataSourceUsage: { [source: string]: number };
    refreshIntervalDistribution: { [interval: string]: number };
  };
}

export class ManageDashboardUseCase {
  constructor(
    private dashboardRepository: DashboardRepository,
    private widgetRepository: DashboardWidgetRepository,
    private dataRepository: DashboardDataRepository
  ) {}

  /**
   * Create new dashboard
   */
  async createDashboard(request: CreateDashboardRequest): Promise<DashboardOperationResult> {
    // Business rule: Validate request
    this.validateCreateDashboardRequest(request);

    try {
      // Business rule: Check if user already has a default dashboard of this type
      if (request.isDefault) {
        await this.ensureOnlyOneDefaultDashboard(request.userId, request.type);
      }

      // Business rule: Create dashboard with factory method
      let dashboard: Dashboard;
      switch (request.type) {
        case 'main':
          dashboard = Dashboard.createMainDashboard(
            `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request.userId,
            request.name,
            request.clinicId,
            request.workspaceId
          );
          break;
        case 'clinical':
          dashboard = Dashboard.createClinicalDashboard(
            `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request.userId,
            request.name,
            request.clinicId,
            request.workspaceId
          );
          break;
        case 'financial':
          dashboard = Dashboard.createFinancialDashboard(
            `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request.userId,
            request.name,
            request.clinicId,
            request.workspaceId
          );
          break;
        default:
          dashboard = new Dashboard(
            `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request.userId,
            request.name,
            request.type,
            request.layout || 'grid',
            request.isDefault || false,
            request.isShared || false,
            [],
            {
              columns: 4,
              autoRefresh: true,
              refreshInterval: 300000,
              theme: 'default',
              showTitle: true,
              allowReordering: true,
              ...request.configuration
            },
            new Date(),
            new Date(),
            request.clinicId,
            request.workspaceId
          );
      }

      // Apply custom configuration if provided
      if (request.configuration) {
        dashboard = dashboard.updateConfiguration(request.configuration);
      }

      // Save dashboard
      const savedDashboard = await this.dashboardRepository.create(dashboard);

      // Business rule: Generate warnings
      const warnings = await this.generateDashboardWarnings(savedDashboard);

      // Business rule: Calculate metrics
      const metrics = this.calculateDashboardMetrics(savedDashboard, []);

      // Business rule: Log dashboard creation
      await this.logDashboardOperation('dashboard_created', savedDashboard);

      return {
        dashboard: savedDashboard,
        widgets: [],
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to create dashboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidgetToDashboard(request: AddWidgetRequest): Promise<DashboardOperationResult> {
    // Business rule: Validate request
    this.validateAddWidgetRequest(request);

    try {
      // Get dashboard
      const dashboard = await this.dashboardRepository.findById(request.dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Business rule: Determine position if not specified
      const position = request.position || dashboard.getNextAvailablePosition();

      // Business rule: Check if position is available
      if (!dashboard.canAddWidget(position)) {
        throw new Error('Position is not available');
      }

      // Create widget with factory method
      let widget: DashboardWidget;
      switch (request.type) {
        case 'stats':
          widget = DashboardWidget.createStatsWidget(
            `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dashboard.userId,
            dashboard.id,
            request.title,
            request.dataSource,
            position,
            dashboard.clinicId,
            dashboard.workspaceId
          );
          break;
        case 'chart':
          widget = DashboardWidget.createChartWidget(
            `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dashboard.userId,
            dashboard.id,
            request.title,
            'line', // Default chart type
            request.dataSource,
            position,
            dashboard.clinicId,
            dashboard.workspaceId
          );
          break;
        case 'activity':
          widget = DashboardWidget.createActivityWidget(
            `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dashboard.userId,
            dashboard.id,
            request.title,
            position,
            dashboard.clinicId,
            dashboard.workspaceId
          );
          break;
        default:
          throw new Error(`Widget type '${request.type}' is not supported yet`);
      }

      // Apply custom configuration if provided
      if (request.size || request.refreshInterval || request.filters || request.displayOptions) {
        widget = widget.updateConfiguration({
          ...widget.configuration,
          size: request.size || widget.size,
          refreshInterval: request.refreshInterval || widget.refreshInterval,
          filters: request.filters || widget.configuration.filters,
          displayOptions: request.displayOptions || widget.configuration.displayOptions,
        });
      }

      // Save widget
      const savedWidget = await this.widgetRepository.create(widget);

      // Update dashboard with new widget
      const updatedDashboard = dashboard.addWidget(savedWidget);
      const savedDashboard = await this.dashboardRepository.update(updatedDashboard);

      // Get all widgets
      const allWidgets = await this.widgetRepository.findByDashboard(savedDashboard.id);

      // Business rule: Generate warnings
      const warnings = await this.generateDashboardWarnings(savedDashboard, allWidgets);

      // Business rule: Calculate metrics
      const metrics = this.calculateDashboardMetrics(savedDashboard, allWidgets);

      // Business rule: Log widget addition
      await this.logDashboardOperation('widget_added', savedDashboard, { widgetId: savedWidget.id, widgetType: savedWidget.type });

      return {
        dashboard: savedDashboard,
        widgets: allWidgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to add widget to dashboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidgetFromDashboard(
    dashboardId: string,
    widgetId: string,
    removedBy: string
  ): Promise<DashboardOperationResult> {
    try {
      // Get dashboard
      const dashboard = await this.dashboardRepository.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Get widget
      const widget = await this.widgetRepository.findById(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }

      // Business rule: Check if widget belongs to dashboard
      if (widget.dashboardId !== dashboardId) {
        throw new Error('Widget does not belong to this dashboard');
      }

      // Delete widget
      await this.widgetRepository.delete(widgetId);

      // Update dashboard
      const updatedDashboard = dashboard.removeWidget(widgetId);
      const savedDashboard = await this.dashboardRepository.update(updatedDashboard);

      // Get remaining widgets
      const remainingWidgets = await this.widgetRepository.findByDashboard(savedDashboard.id);

      // Business rule: Generate warnings
      const warnings = await this.generateDashboardWarnings(savedDashboard, remainingWidgets);

      // Business rule: Calculate metrics
      const metrics = this.calculateDashboardMetrics(savedDashboard, remainingWidgets);

      // Business rule: Log widget removal
      await this.logDashboardOperation('widget_removed', savedDashboard, { 
        widgetId: widget.id, 
        widgetType: widget.type, 
        removedBy 
      });

      return {
        dashboard: savedDashboard,
        widgets: remainingWidgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to remove widget from dashboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reorder widgets in dashboard
   */
  async reorderWidgets(
    dashboardId: string,
    newOrder: Array<{ widgetId: string; position: { row: number; column: number } }>,
    reorderedBy: string
  ): Promise<DashboardOperationResult> {
    try {
      // Get dashboard
      const dashboard = await this.dashboardRepository.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Business rule: Validate all widgets exist
      const widgets = await this.widgetRepository.findByDashboard(dashboardId);
      const existingWidgetIds = new Set(widgets.map(w => w.id));
      
      for (const order of newOrder) {
        if (!existingWidgetIds.has(order.widgetId)) {
          throw new Error(`Widget ${order.widgetId} not found in dashboard`);
        }
      }

      // Business rule: Validate positions don't overlap
      this.validateWidgetPositions(newOrder);

      // Update widget positions
      const updatedWidgets = await Promise.all(
        newOrder.map(async (order) => {
          const widget = widgets.find(w => w.id === order.widgetId);
          if (!widget) throw new Error(`Widget ${order.widgetId} not found`);
          
          const updatedWidget = widget.updatePosition(order.position.row, order.position.column);
          return await this.widgetRepository.update(updatedWidget);
        })
      );

      // Update dashboard
      const reorderedDashboard = dashboard.reorderWidgets(newOrder);
      const savedDashboard = await this.dashboardRepository.update(reorderedDashboard);

      // Business rule: Generate warnings
      const warnings = await this.generateDashboardWarnings(savedDashboard, updatedWidgets);

      // Business rule: Calculate metrics
      const metrics = this.calculateDashboardMetrics(savedDashboard, updatedWidgets);

      // Business rule: Log reordering
      await this.logDashboardOperation('widgets_reordered', savedDashboard, { 
        reorderedBy,
        widgetCount: newOrder.length
      });

      return {
        dashboard: savedDashboard,
        widgets: updatedWidgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to reorder widgets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update dashboard configuration
   */
  async updateDashboardConfiguration(
    request: UpdateDashboardConfigurationRequest
  ): Promise<DashboardOperationResult> {
    try {
      // Get dashboard
      const dashboard = await this.dashboardRepository.findById(request.dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Business rule: Update configuration
      const updatedDashboard = dashboard.updateConfiguration(request.configuration);
      const savedDashboard = await this.dashboardRepository.update(updatedDashboard);

      // Get widgets
      const widgets = await this.widgetRepository.findByDashboard(savedDashboard.id);

      // Business rule: If columns changed, check layout validity
      if (request.configuration.columns && request.configuration.columns !== dashboard.configuration.columns) {
        const needsCompaction = widgets.some(w => w.position.column >= request.configuration.columns!);
        if (needsCompaction) {
          const compactedDashboard = savedDashboard.compactLayout();
          const finalDashboard = await this.dashboardRepository.update(compactedDashboard);
          
          // Update widget positions accordingly
          const reorderData = finalDashboard.widgets.map(w => ({
            widgetId: w.id,
            position: w.position
          }));
          await this.reorderWidgets(finalDashboard.id, reorderData, request.updatedBy);
          
          return this.getDashboardWithWidgets(finalDashboard.id);
        }
      }

      // Business rule: Generate warnings
      const warnings = await this.generateDashboardWarnings(savedDashboard, widgets);

      // Business rule: Calculate metrics
      const metrics = this.calculateDashboardMetrics(savedDashboard, widgets);

      // Business rule: Log configuration update
      await this.logDashboardOperation('configuration_updated', savedDashboard, { 
        updatedBy: request.updatedBy,
        changes: request.configuration
      });

      return {
        dashboard: savedDashboard,
        widgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to update dashboard configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get dashboard with all widgets
   */
  async getDashboardWithWidgets(dashboardId: string): Promise<DashboardOperationResult> {
    try {
      const dashboard = await this.dashboardRepository.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      const widgets = await this.widgetRepository.findByDashboard(dashboardId);

      const warnings = await this.generateDashboardWarnings(dashboard, widgets);
      const metrics = this.calculateDashboardMetrics(dashboard, widgets);

      return {
        dashboard,
        widgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to get dashboard with widgets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboardData(
    dashboardId: string,
    widgetIds?: string[]
  ): Promise<{
    refreshedWidgets: string[];
    failedWidgets: Array<{ widgetId: string; error: string }>;
    refreshTime: Date;
  }> {
    try {
      const dashboard = await this.dashboardRepository.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      let widgets = await this.widgetRepository.findByDashboard(dashboardId);
      
      // Filter widgets if specific ones requested
      if (widgetIds && widgetIds.length > 0) {
        widgets = widgets.filter(w => widgetIds.includes(w.id));
      }

      // Only refresh widgets that can be refreshed
      const refreshableWidgets = widgets.filter(w => w.canBeRefreshed());

      const refreshedWidgets: string[] = [];
      const failedWidgets: Array<{ widgetId: string; error: string }> = [];
      const refreshTime = new Date();

      // Refresh each widget's data
      for (const widget of refreshableWidgets) {
        try {
          const dataUrl = widget.getDataSourceUrl();
          await this.dataRepository.refreshWidgetData(widget.id, dataUrl);
          refreshedWidgets.push(widget.id);
        } catch (error) {
          failedWidgets.push({
            widgetId: widget.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Business rule: Log refresh operation
      await this.logDashboardOperation('data_refreshed', dashboard, {
        refreshedCount: refreshedWidgets.length,
        failedCount: failedWidgets.length,
        refreshTime
      });

      return {
        refreshedWidgets,
        failedWidgets,
        refreshTime
      };

    } catch (error) {
      throw new Error(`Failed to refresh dashboard data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(
    dashboardId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<DashboardAnalytics> {
    try {
      // Get dashboard usage statistics
      const usageStats = await this.dashboardRepository.getUsageStatistics(
        dashboardId, 
        dateRange.startDate, 
        dateRange.endDate
      );

      // Get performance statistics
      const performanceStats = await this.dashboardRepository.getPerformanceStatistics(
        dashboardId,
        dateRange.startDate,
        dateRange.endDate
      );

      // Get content statistics
      const widgets = await this.widgetRepository.findByDashboard(dashboardId);
      const contentStats = this.calculateContentStatistics(widgets);

      return {
        usageStats,
        performanceStats,
        contentStats
      };

    } catch (error) {
      throw new Error(`Failed to get dashboard analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clone dashboard
   */
  async cloneDashboard(
    dashboardId: string,
    newName: string,
    userId: string,
    clinicId?: string,
    workspaceId?: string
  ): Promise<DashboardOperationResult> {
    try {
      // Get original dashboard
      const originalDashboard = await this.dashboardRepository.findById(dashboardId);
      if (!originalDashboard) {
        throw new Error('Dashboard not found');
      }

      // Get original widgets
      const originalWidgets = await this.widgetRepository.findByDashboard(dashboardId);

      // Create new dashboard
      const newDashboard = new Dashboard(
        `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        newName,
        originalDashboard.type,
        originalDashboard.layout,
        false, // Not default
        false, // Not shared
        [],
        { ...originalDashboard.configuration },
        new Date(),
        new Date(),
        clinicId,
        workspaceId
      );

      const savedDashboard = await this.dashboardRepository.create(newDashboard);

      // Clone widgets
      const clonedWidgets: DashboardWidget[] = [];
      for (const originalWidget of originalWidgets) {
        const clonedWidget = new DashboardWidget(
          `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          savedDashboard.id,
          originalWidget.title,
          originalWidget.type,
          originalWidget.size,
          originalWidget.position,
          originalWidget.configuration,
          originalWidget.isVisible,
          originalWidget.refreshInterval,
          new Date(),
          new Date(),
          clinicId,
          workspaceId
        );

        const savedWidget = await this.widgetRepository.create(clonedWidget);
        clonedWidgets.push(savedWidget);
      }

      const warnings = await this.generateDashboardWarnings(savedDashboard, clonedWidgets);
      const metrics = this.calculateDashboardMetrics(savedDashboard, clonedWidgets);

      // Business rule: Log cloning
      await this.logDashboardOperation('dashboard_cloned', savedDashboard, {
        originalDashboardId: dashboardId,
        widgetCount: clonedWidgets.length
      });

      return {
        dashboard: savedDashboard,
        widgets: clonedWidgets,
        warnings,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to clone dashboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private helper methods

  /**
   * Business rule: Validate create dashboard request
   */
  private validateCreateDashboardRequest(request: CreateDashboardRequest): void {
    if (!request.userId?.trim()) {
      throw new Error('User ID is required');
    }

    if (!request.name?.trim()) {
      throw new Error('Dashboard name is required');
    }

    if (request.name.length > 100) {
      throw new Error('Dashboard name cannot exceed 100 characters');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Dashboard must belong to either a clinic or workspace');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Dashboard cannot belong to both clinic and workspace');
    }
  }

  /**
   * Business rule: Validate add widget request
   */
  private validateAddWidgetRequest(request: AddWidgetRequest): void {
    if (!request.dashboardId?.trim()) {
      throw new Error('Dashboard ID is required');
    }

    if (!request.title?.trim()) {
      throw new Error('Widget title is required');
    }

    if (request.title.length > 100) {
      throw new Error('Widget title cannot exceed 100 characters');
    }

    if (!request.dataSource?.trim()) {
      throw new Error('Widget data source is required');
    }

    if (request.position) {
      if (request.position.row < 0 || request.position.column < 0) {
        throw new Error('Widget position must be non-negative');
      }
    }
  }

  /**
   * Business rule: Ensure only one default dashboard per type
   */
  private async ensureOnlyOneDefaultDashboard(userId: string, type: DashboardType): Promise<void> {
    try {
      const existingDefault = await this.dashboardRepository.findDefaultByType(userId, type);
      if (existingDefault) {
        // Remove default status from existing dashboard
        const updatedDashboard = new Dashboard(
          existingDefault.id,
          existingDefault.userId,
          existingDefault.name,
          existingDefault.type,
          existingDefault.layout,
          false, // Remove default
          existingDefault.isShared,
          existingDefault.widgets,
          existingDefault.configuration,
          existingDefault.createdAt,
          new Date(),
          existingDefault.clinicId,
          existingDefault.workspaceId
        );
        await this.dashboardRepository.update(updatedDashboard);
      }
    } catch (error) {
      console.warn('Could not check for existing default dashboard:', error);
      // Don't block operation if check fails
    }
  }

  /**
   * Business rule: Validate widget positions don't overlap
   */
  private validateWidgetPositions(positions: Array<{ widgetId: string; position: { row: number; column: number } }>): void {
    const positionKeys = positions.map(p => `${p.position.row}-${p.position.column}`);
    const uniquePositions = new Set(positionKeys);

    if (positionKeys.length !== uniquePositions.size) {
      throw new Error('Widget positions cannot overlap');
    }
  }

  /**
   * Business rule: Generate dashboard-related warnings
   */
  private async generateDashboardWarnings(
    dashboard: Dashboard,
    widgets?: DashboardWidget[]
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Layout warnings
    if (!dashboard.isValidLayout()) {
      warnings.push('Dashboard layout has overlapping widgets');
    }

    if (!dashboard.hasVisibleWidgets() && widgets && widgets.length > 0) {
      warnings.push('Dashboard has widgets but none are visible');
    }

    // Configuration warnings
    if (dashboard.configuration.columns > 6) {
      warnings.push('Dashboard has many columns which may affect mobile viewing');
    }

    if (dashboard.configuration.refreshInterval < 60000) {
      warnings.push('Very short refresh interval may impact performance');
    }

    // Widget-specific warnings
    if (widgets) {
      const refreshableWidgets = widgets.filter(w => w.canBeRefreshed());
      if (refreshableWidgets.length > 10) {
        warnings.push('Many refreshable widgets may impact performance');
      }

      const realTimeWidgets = widgets.filter(w => w.requiresRealTimeData());
      if (realTimeWidgets.length > 5) {
        warnings.push('Many real-time widgets may impact performance');
      }
    }

    return warnings;
  }

  /**
   * Business rule: Calculate dashboard metrics
   */
  private calculateDashboardMetrics(
    dashboard: Dashboard,
    widgets: DashboardWidget[]
  ): {
    totalWidgets: number;
    visibleWidgets: number;
    dataSourcesUsed: string[];
    refreshableWidgets: number;
    lastRefreshTime: Date;
  } {
    const dataSourcesUsed = Array.from(new Set(widgets.map(w => w.configuration.dataSource)));
    const refreshableWidgets = widgets.filter(w => w.canBeRefreshed()).length;

    return {
      totalWidgets: widgets.length,
      visibleWidgets: widgets.filter(w => w.isVisible).length,
      dataSourcesUsed,
      refreshableWidgets,
      lastRefreshTime: new Date()
    };
  }

  /**
   * Business rule: Calculate content statistics
   */
  private calculateContentStatistics(widgets: DashboardWidget[]): {
    widgetTypeDistribution: { [type: string]: number };
    dataSourceUsage: { [source: string]: number };
    refreshIntervalDistribution: { [interval: string]: number };
  } {
    const widgetTypeDistribution: { [type: string]: number } = {};
    const dataSourceUsage: { [source: string]: number } = {};
    const refreshIntervalDistribution: { [interval: string]: number } = {};

    for (const widget of widgets) {
      // Type distribution
      widgetTypeDistribution[widget.type] = (widgetTypeDistribution[widget.type] || 0) + 1;

      // Data source usage
      const dataSource = widget.configuration.dataSource;
      dataSourceUsage[dataSource] = (dataSourceUsage[dataSource] || 0) + 1;

      // Refresh interval distribution
      refreshIntervalDistribution[widget.refreshInterval] = (refreshIntervalDistribution[widget.refreshInterval] || 0) + 1;
    }

    return {
      widgetTypeDistribution,
      dataSourceUsage,
      refreshIntervalDistribution
    };
  }

  /**
   * Business rule: Log dashboard operations for audit
   */
  private async logDashboardOperation(
    operation: string,
    dashboard: Dashboard,
    additionalData?: unknown
  ): Promise<void> {
    try {
      const auditLog = {
        operation,
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        dashboardType: dashboard.type,
        userId: dashboard.userId,
        timestamp: new Date(),
        clinicId: dashboard.clinicId,
        workspaceId: dashboard.workspaceId,
        ...(additionalData && typeof additionalData === 'object' ? additionalData : {})
      };

      console.log('Dashboard operation logged:', auditLog);
      // TODO: Implement audit logging service
      // await this.auditRepository.log(auditLog);

    } catch (error) {
      console.warn('Failed to log dashboard operation:', error);
      // Don't fail operation if logging fails
    }
  }
}