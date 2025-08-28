/**
 * Dashboard Presenter
 * Transforms Dashboard entities into UI-ready formats
 */

import { Dashboard, DashboardType, DashboardLayout } from '../entities/Dashboard';
import { DashboardWidget, WidgetType, WidgetSize, RefreshInterval } from '../entities/DashboardWidget';
import { DashboardData, StatisticMetric, ChartDataPoint, ActivityItem } from '../entities/DashboardData';

export interface DashboardViewModel {
  id: string;
  name: string;
  type: DashboardType;
  typeDisplay: string;
  layout: DashboardLayout;
  layoutDisplay: string;
  isDefault: boolean;
  isShared: boolean;
  hasWidgets: boolean;
  widgetCount: number;
  visibleWidgetCount: number;
  
  // Configuration
  configuration: {
    columns: number;
    autoRefresh: boolean;
    refreshInterval: string;
    refreshIntervalMs: number;
    theme: string;
    showTitle: boolean;
    allowReordering: boolean;
  };
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastViewed?: string;
  ownerName: string;
  isOwner: boolean;
  
  // Badges
  badges: Array<{
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    icon?: string;
  }>;
  
  // Quick Actions
  quickActions: Array<{
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled?: boolean;
  }>;
}

export interface WidgetViewModel {
  id: string;
  title: string;
  type: WidgetType;
  typeDisplay: string;
  size: WidgetSize;
  sizeDisplay: string;
  isVisible: boolean;
  
  // Position & Layout
  position: {
    row: number;
    column: number;
  };
  gridSpan: {
    rows: number;
    columns: number;
  };
  
  // Data & Refresh
  refreshInterval: RefreshInterval;
  refreshIntervalDisplay: string;
  refreshIntervalMs: number;
  canBeRefreshed: boolean;
  requiresRealTimeData: boolean;
  dataSource: string;
  dataSourceDisplay: string;
  dataSourceUrl: string;
  
  // Status
  status: 'loading' | 'ready' | 'error' | 'stale';
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
  lastRefresh?: string;
  
  // Data State
  hasData: boolean;
  hasError: boolean;
  errorMessage?: string;
  dataAge?: string;
  isStale: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // UI State
  badges: Array<{
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    icon?: string;
  }>;
  
  quickActions: Array<{
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled?: boolean;
  }>;
}

export interface StatisticWidgetViewModel extends WidgetViewModel {
  metrics: Array<{
    label: string;
    value: string;
    previousValue?: string;
    change?: number;
    changePercentage?: number;
    trend: 'up' | 'down' | 'stable';
    trendDisplay: string;
    trendColor: 'green' | 'red' | 'blue';
    format: 'number' | 'currency' | 'percentage' | 'text';
    icon?: string;
    color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  }>;
}

export interface ChartWidgetViewModel extends WidgetViewModel {
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  chartData: {
    datasets: Array<{
      label: string;
      data: Array<{
        x: number | string | Date;
        y: number;
      }>;
      backgroundColor?: string;
      borderColor?: string;
      fill?: boolean;
    }>;
    labels?: string[];
  };
  chartOptions: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: {
      legend: {
        display: boolean;
        position: 'top' | 'right' | 'bottom' | 'left';
      };
      title: {
        display: boolean;
        text?: string;
      };
    };
    scales?: {
      x?: {
        display: boolean;
        title: {
          display: boolean;
          text?: string;
        };
      };
      y?: {
        display: boolean;
        title: {
          display: boolean;
          text?: string;
        };
      };
    };
  };
}

export interface ListWidgetViewModel extends WidgetViewModel {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    statusDisplay?: string;
    statusColor?: 'green' | 'yellow' | 'red' | 'blue';
    metadata?: Record<string, unknown>;
  }>;
  totalItems: number;
  hasMore: boolean;
}

export interface ActivityWidgetViewModel extends WidgetViewModel {
  activities: Array<{
    id: string;
    type: 'patient_created' | 'appointment_scheduled' | 'payment_received' | 'assessment_completed' | 'other';
    typeDisplay: string;
    title: string;
    description: string;
    timestamp: string;
    timeAgo: string;
    userId: string;
    userName: string;
    priority: 'low' | 'medium' | 'high';
    priorityDisplay: string;
    priorityColor: 'green' | 'yellow' | 'red';
    category: string;
    categoryDisplay: string;
    icon: string;
    iconColor: string;
  }>;
  totalActivities: number;
  hasMore: boolean;
}

export interface DashboardOverviewViewModel {
  totalDashboards: number;
  activeDashboards: number;
  sharedDashboards: number;
  totalWidgets: number;
  averageWidgetsPerDashboard: number;
  
  recentlyViewed: Array<{
    id: string;
    name: string;
    type: DashboardType;
    typeDisplay: string;
    lastViewed: string;
    widgetCount: number;
  }>;
  
  mostUsed: Array<{
    id: string;
    name: string;
    type: DashboardType;
    typeDisplay: string;
    views: number;
    widgetCount: number;
  }>;
  
  performanceAlerts: Array<{
    dashboardId: string;
    dashboardName: string;
    type: 'slow_loading' | 'high_error_rate' | 'stale_data';
    severity: 'low' | 'medium' | 'high';
    message: string;
    actionRequired: boolean;
  }>;
  
  usageMetrics: {
    totalViews: number;
    averageViewTime: string;
    peakUsageHours: Array<{
      hour: string;
      views: number;
    }>;
  };
}

export class DashboardPresenter {
  
  /**
   * Present dashboard for display
   */
  presentDashboard(
    dashboard: Dashboard,
    widgets: DashboardWidget[] = [],
    currentUserId?: string
  ): DashboardViewModel {
    const visibleWidgets = widgets.filter(w => w.isVisible);
    
    return {
      id: dashboard.id,
      name: dashboard.name,
      type: dashboard.type,
      typeDisplay: this.getDashboardTypeDisplay(dashboard.type),
      layout: dashboard.layout,
      layoutDisplay: this.getDashboardLayoutDisplay(dashboard.layout),
      isDefault: dashboard.isDefault,
      isShared: dashboard.isShared,
      hasWidgets: widgets.length > 0,
      widgetCount: widgets.length,
      visibleWidgetCount: visibleWidgets.length,
      
      configuration: {
        columns: dashboard.configuration.columns,
        autoRefresh: dashboard.configuration.autoRefresh,
        refreshInterval: this.formatDuration(dashboard.configuration.refreshInterval),
        refreshIntervalMs: dashboard.configuration.refreshInterval,
        theme: dashboard.configuration.theme,
        showTitle: dashboard.configuration.showTitle,
        allowReordering: dashboard.configuration.allowReordering,
      },
      
      status: this.getDashboardStatus(dashboard),
      statusDisplay: this.getDashboardStatusDisplay(dashboard),
      statusColor: this.getDashboardStatusColor(dashboard),
      
      createdAt: this.formatDateTime(dashboard.createdAt),
      updatedAt: this.formatDateTime(dashboard.updatedAt),
      ownerName: `User ${dashboard.userId}`, // TODO: Get from user service
      isOwner: currentUserId === dashboard.userId,
      
      badges: this.generateDashboardBadges(dashboard, widgets),
      quickActions: this.generateDashboardQuickActions(dashboard, currentUserId),
    };
  }

  /**
   * Present widget for display
   */
  presentWidget(
    widget: DashboardWidget,
    data?: DashboardData
  ): WidgetViewModel {
    const gridSpan = widget.getGridSpan();
    const refreshIntervalMs = widget.getRefreshIntervalMs();
    
    return {
      id: widget.id,
      title: widget.title,
      type: widget.type,
      typeDisplay: this.getWidgetTypeDisplay(widget.type),
      size: widget.size,
      sizeDisplay: this.getWidgetSizeDisplay(widget.size),
      isVisible: widget.isVisible,
      
      position: {
        row: widget.position.row,
        column: widget.position.column,
      },
      gridSpan: {
        rows: gridSpan.rows,
        columns: gridSpan.columns,
      },
      
      refreshInterval: widget.refreshInterval,
      refreshIntervalDisplay: this.getRefreshIntervalDisplay(widget.refreshInterval),
      refreshIntervalMs,
      canBeRefreshed: widget.canBeRefreshed(),
      requiresRealTimeData: widget.requiresRealTimeData(),
      dataSource: widget.configuration.dataSource,
      dataSourceDisplay: this.getDataSourceDisplay(widget.configuration.dataSource),
      dataSourceUrl: widget.getDataSourceUrl(),
      
      status: this.getWidgetStatus(widget, data),
      statusDisplay: this.getWidgetStatusDisplay(widget, data),
      statusColor: this.getWidgetStatusColor(widget, data),
      lastRefresh: data ? this.formatDateTime(data.lastUpdated) : undefined,
      
      hasData: data ? data.hasData() : false,
      hasError: data ? data.hasError() : false,
      errorMessage: data?.error || undefined,
      dataAge: data ? this.formatDuration(data.getAge()) : undefined,
      isStale: data ? data.isStale(refreshIntervalMs * 2) : false,
      
      createdAt: this.formatDateTime(widget.createdAt),
      updatedAt: this.formatDateTime(widget.updatedAt),
      
      badges: this.generateWidgetBadges(widget, data),
      quickActions: this.generateWidgetQuickActions(widget),
    };
  }

  /**
   * Present statistics widget
   */
  presentStatisticsWidget(
    widget: DashboardWidget,
    data: DashboardData
  ): StatisticWidgetViewModel {
    const baseWidget = this.presentWidget(widget, data);
    const statistics = data.getStatistics();
    
    const metrics = statistics.map(stat => ({
      label: stat.label,
      value: this.formatValue(stat.value, stat.format),
      previousValue: stat.previousValue ? this.formatValue(stat.previousValue, stat.format) : undefined,
      change: stat.change,
      changePercentage: stat.changePercentage,
      trend: stat.trend,
      trendDisplay: this.getTrendDisplay(stat.trend),
      trendColor: this.getTrendColor(stat.trend, stat.change),
      format: stat.format,
      icon: stat.icon,
      color: stat.color,
    }));
    
    return {
      ...baseWidget,
      metrics,
    };
  }

  /**
   * Present chart widget
   */
  presentChartWidget(
    widget: DashboardWidget,
    data: DashboardData
  ): ChartWidgetViewModel {
    const baseWidget = this.presentWidget(widget, data);
    const chartData = data.getChartData();
    
    if (!chartData) {
      return {
        ...baseWidget,
        chartType: 'line',
        chartData: { datasets: [] },
        chartOptions: this.getDefaultChartOptions(),
      };
    }
    
    return {
      ...baseWidget,
      chartType: chartData.chartType as any,
      chartData: this.transformChartData(chartData.dataPoints),
      chartOptions: {
        ...this.getDefaultChartOptions(),
        ...this.transformChartOptions(chartData.options),
      },
    };
  }

  /**
   * Present list widget
   */
  presentListWidget(
    widget: DashboardWidget,
    data: DashboardData
  ): ListWidgetViewModel {
    const baseWidget = this.presentWidget(widget, data);
    const listItems = data.getListItems();
    
    const items = listItems.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      value: item.value,
      status: item.status,
      statusDisplay: item.status ? this.getStatusDisplay(item.status) : undefined,
      statusColor: item.status ? this.getStatusColor(item.status) : undefined,
      metadata: item.metadata,
    }));
    
    return {
      ...baseWidget,
      items,
      totalItems: items.length,
      hasMore: false, // TODO: Implement pagination
    };
  }

  /**
   * Present activity widget
   */
  presentActivityWidget(
    widget: DashboardWidget,
    data: DashboardData
  ): ActivityWidgetViewModel {
    const baseWidget = this.presentWidget(widget, data);
    const activities = data.getActivities();
    
    const presentedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      typeDisplay: this.getActivityTypeDisplay(activity.type),
      title: activity.title,
      description: activity.description,
      timestamp: this.formatDateTime(activity.timestamp),
      timeAgo: this.formatTimeAgo(activity.timestamp),
      userId: activity.userId,
      userName: activity.userName,
      priority: activity.priority,
      priorityDisplay: this.getPriorityDisplay(activity.priority),
      priorityColor: this.getPriorityColor(activity.priority),
      category: activity.category,
      categoryDisplay: this.getCategoryDisplay(activity.category),
      icon: this.getActivityIcon(activity.type),
      iconColor: this.getActivityIconColor(activity.type),
    }));
    
    return {
      ...baseWidget,
      activities: presentedActivities,
      totalActivities: presentedActivities.length,
      hasMore: false, // TODO: Implement pagination
    };
  }

  /**
   * Present dashboard overview
   */
  presentDashboardOverview(
    dashboards: Dashboard[],
    widgets: DashboardWidget[],
    statistics: any
  ): DashboardOverviewViewModel {
    const activeDashboards = dashboards.filter(d => d.hasVisibleWidgets());
    const sharedDashboards = dashboards.filter(d => d.isShared);
    
    return {
      totalDashboards: dashboards.length,
      activeDashboards: activeDashboards.length,
      sharedDashboards: sharedDashboards.length,
      totalWidgets: widgets.length,
      averageWidgetsPerDashboard: dashboards.length > 0 
        ? Math.round(widgets.length / dashboards.length * 10) / 10
        : 0,
      
      recentlyViewed: [], // TODO: Implement from statistics
      mostUsed: [], // TODO: Implement from statistics
      performanceAlerts: [], // TODO: Implement from performance data
      
      usageMetrics: {
        totalViews: statistics?.totalViews || 0,
        averageViewTime: this.formatDuration(statistics?.averageViewTime || 0),
        peakUsageHours: (statistics?.peakUsageHours || []).map((hour: any) => ({
          hour: `${hour.hour}:00`,
          views: hour.views,
        })),
      },
    };
  }

  // Private helper methods

  private getDashboardTypeDisplay(type: DashboardType): string {
    const displayMap = {
      main: 'Principal',
      clinical: 'Clínico',
      financial: 'Financiero',
      custom: 'Personalizado',
    };
    return displayMap[type] || type;
  }

  private getDashboardLayoutDisplay(layout: DashboardLayout): string {
    const displayMap = {
      grid: 'Rejilla',
      masonry: 'Mosaico',
      flexible: 'Flexible',
    };
    return displayMap[layout] || layout;
  }

  private getDashboardStatus(dashboard: Dashboard): 'active' | 'inactive' | 'archived' {
    if (dashboard.hasVisibleWidgets()) return 'active';
    return 'inactive';
  }

  private getDashboardStatusDisplay(dashboard: Dashboard): string {
    const status = this.getDashboardStatus(dashboard);
    const displayMap = {
      active: 'Activo',
      inactive: 'Inactivo',
      archived: 'Archivado',
    };
    return displayMap[status];
  }

  private getDashboardStatusColor(dashboard: Dashboard): 'green' | 'yellow' | 'red' | 'gray' {
    const status = this.getDashboardStatus(dashboard);
    const colorMap = {
      active: 'green' as const,
      inactive: 'gray' as const,
      archived: 'yellow' as const,
    };
    return colorMap[status];
  }

  private getWidgetTypeDisplay(type: WidgetType): string {
    const displayMap = {
      stats: 'Estadísticas',
      chart: 'Gráfico',
      list: 'Lista',
      metric: 'Métrica',
      activity: 'Actividad',
      calendar: 'Calendario',
    };
    return displayMap[type] || type;
  }

  private getWidgetSizeDisplay(size: WidgetSize): string {
    const displayMap = {
      small: 'Pequeño',
      medium: 'Mediano',
      large: 'Grande',
      full: 'Completo',
    };
    return displayMap[size] || size;
  }

  private getRefreshIntervalDisplay(interval: RefreshInterval): string {
    const displayMap = {
      never: 'Nunca',
      '30s': '30 segundos',
      '1m': '1 minuto',
      '5m': '5 minutos',
      '15m': '15 minutos',
      '30m': '30 minutos',
      '1h': '1 hora',
    };
    return displayMap[interval] || interval;
  }

  private getDataSourceDisplay(dataSource: string): string {
    const displayMap: { [key: string]: string } = {
      patients: 'Pacientes',
      appointments: 'Citas',
      finance: 'Finanzas',
      clinimetrix: 'ClinimetrixPro',
      activity: 'Actividad',
    };
    return displayMap[dataSource] || dataSource;
  }

  private getWidgetStatus(
    widget: DashboardWidget,
    data?: DashboardData
  ): 'loading' | 'ready' | 'error' | 'stale' {
    if (!data) return 'loading';
    if (data.hasError()) return 'error';
    if (data.isLoading) return 'loading';
    if (data.isStale(widget.getRefreshIntervalMs() * 2)) return 'stale';
    return 'ready';
  }

  private getWidgetStatusDisplay(widget: DashboardWidget, data?: DashboardData): string {
    const status = this.getWidgetStatus(widget, data);
    const displayMap = {
      loading: 'Cargando',
      ready: 'Listo',
      error: 'Error',
      stale: 'Desactualizado',
    };
    return displayMap[status];
  }

  private getWidgetStatusColor(
    widget: DashboardWidget,
    data?: DashboardData
  ): 'green' | 'yellow' | 'red' | 'gray' {
    const status = this.getWidgetStatus(widget, data);
    const colorMap = {
      loading: 'gray' as const,
      ready: 'green' as const,
      error: 'red' as const,
      stale: 'yellow' as const,
    };
    return colorMap[status];
  }

  private getTrendDisplay(trend: 'up' | 'down' | 'stable'): string {
    const displayMap = {
      up: 'Subiendo',
      down: 'Bajando',
      stable: 'Estable',
    };
    return displayMap[trend];
  }

  private getTrendColor(trend: 'up' | 'down' | 'stable', change?: number): 'green' | 'red' | 'blue' {
    if (trend === 'stable') return 'blue';
    if (trend === 'up') return change && change > 0 ? 'green' : 'red';
    if (trend === 'down') return change && change < 0 ? 'red' : 'green';
    return 'blue';
  }

  private getStatusDisplay(status: 'success' | 'warning' | 'error' | 'info'): string {
    const displayMap = {
      success: 'Éxito',
      warning: 'Advertencia',
      error: 'Error',
      info: 'Información',
    };
    return displayMap[status];
  }

  private getStatusColor(status: 'success' | 'warning' | 'error' | 'info'): 'green' | 'yellow' | 'red' | 'blue' {
    const colorMap = {
      success: 'green' as const,
      warning: 'yellow' as const,
      error: 'red' as const,
      info: 'blue' as const,
    };
    return colorMap[status];
  }

  private getActivityTypeDisplay(type: ActivityItem['type']): string {
    const displayMap = {
      patient_created: 'Paciente Creado',
      appointment_scheduled: 'Cita Programada',
      payment_received: 'Pago Recibido',
      assessment_completed: 'Evaluación Completada',
      other: 'Otro',
    };
    return displayMap[type];
  }

  private getPriorityDisplay(priority: 'low' | 'medium' | 'high'): string {
    const displayMap = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    return displayMap[priority];
  }

  private getPriorityColor(priority: 'low' | 'medium' | 'high'): 'green' | 'yellow' | 'red' {
    const colorMap = {
      low: 'green' as const,
      medium: 'yellow' as const,
      high: 'red' as const,
    };
    return colorMap[priority];
  }

  private getCategoryDisplay(category: string): string {
    // TODO: Implement category display mapping
    return category;
  }

  private getActivityIcon(type: ActivityItem['type']): string {
    const iconMap = {
      patient_created: 'user-plus',
      appointment_scheduled: 'calendar',
      payment_received: 'credit-card',
      assessment_completed: 'clipboard-check',
      other: 'info',
    };
    return iconMap[type];
  }

  private getActivityIconColor(type: ActivityItem['type']): string {
    const colorMap = {
      patient_created: 'blue',
      appointment_scheduled: 'green',
      payment_received: 'purple',
      assessment_completed: 'orange',
      other: 'gray',
    };
    return colorMap[type];
  }

  private generateDashboardBadges(
    dashboard: Dashboard,
    widgets: DashboardWidget[]
  ): Array<{ text: string; color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'; icon?: string }> {
    const badges = [];

    if (dashboard.isDefault) {
      badges.push({
        text: 'Por Defecto',
        color: 'blue' as const,
        icon: 'star',
      });
    }

    if (dashboard.isShared) {
      badges.push({
        text: 'Compartido',
        color: 'green' as const,
        icon: 'share',
      });
    }

    const realTimeWidgets = widgets.filter(w => w.requiresRealTimeData()).length;
    if (realTimeWidgets > 0) {
      badges.push({
        text: `${realTimeWidgets} Tiempo Real`,
        color: 'purple' as const,
        icon: 'zap',
      });
    }

    return badges;
  }

  private generateWidgetBadges(
    widget: DashboardWidget,
    data?: DashboardData
  ): Array<{ text: string; color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'; icon?: string }> {
    const badges = [];

    if (widget.requiresRealTimeData()) {
      badges.push({
        text: 'Tiempo Real',
        color: 'purple' as const,
        icon: 'zap',
      });
    }

    if (!widget.isVisible) {
      badges.push({
        text: 'Oculto',
        color: 'yellow' as const,
        icon: 'eye-off',
      });
    }

    if (data?.hasError()) {
      badges.push({
        text: 'Error',
        color: 'red' as const,
        icon: 'alert-circle',
      });
    }

    return badges;
  }

  private generateDashboardQuickActions(
    dashboard: Dashboard,
    currentUserId?: string
  ): Array<{
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled?: boolean;
  }> {
    const actions = [];

    actions.push({
      label: 'Ver',
      action: 'view',
      color: 'primary' as const,
      icon: 'eye',
    });

    if (currentUserId === dashboard.userId) {
      actions.push({
        label: 'Editar',
        action: 'edit',
        color: 'secondary' as const,
        icon: 'edit',
      });
    }

    actions.push({
      label: 'Duplicar',
      action: 'clone',
      color: 'secondary' as const,
      icon: 'copy',
    });

    if (dashboard.isShared || currentUserId === dashboard.userId) {
      actions.push({
        label: 'Compartir',
        action: 'share',
        color: 'success' as const,
        icon: 'share',
      });
    }

    return actions;
  }

  private generateWidgetQuickActions(
    widget: DashboardWidget
  ): Array<{
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled?: boolean;
  }> {
    const actions = [];

    if (widget.canBeRefreshed()) {
      actions.push({
        label: 'Actualizar',
        action: 'refresh',
        color: 'primary' as const,
        icon: 'refresh-cw',
      });
    }

    actions.push({
      label: 'Configurar',
      action: 'configure',
      color: 'secondary' as const,
      icon: 'settings',
    });

    actions.push({
      label: 'Mover',
      action: 'move',
      color: 'secondary' as const,
      icon: 'move',
    });

    actions.push({
      label: 'Duplicar',
      action: 'duplicate',
      color: 'secondary' as const,
      icon: 'copy',
    });

    actions.push({
      label: 'Eliminar',
      action: 'delete',
      color: 'danger' as const,
      icon: 'trash',
    });

    return actions;
  }

  private transformChartData(dataPoints: ChartDataPoint[]): any {
    // TODO: Implement chart data transformation based on chart type
    return {
      datasets: [{
        label: 'Data',
        data: dataPoints.map(point => ({
          x: point.x,
          y: point.y,
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        fill: false,
      }],
    };
  }

  private transformChartOptions(options: Record<string, any>): any {
    return {
      plugins: {
        legend: {
          display: options.showLegend !== false,
          position: 'top',
        },
        title: {
          display: !!options.title,
          text: options.title,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: !!options.xAxisLabel,
            text: options.xAxisLabel,
          },
        },
        y: {
          display: true,
          title: {
            display: !!options.yAxisLabel,
            text: options.yAxisLabel,
          },
        },
      },
    };
  }

  private getDefaultChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: false,
          },
        },
        y: {
          display: true,
          title: {
            display: false,
          },
        },
      },
    };
  }

  // Utility formatting methods

  private formatValue(value: number | string, format: 'number' | 'currency' | 'percentage' | 'text'): string {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('es-MX').format(value);
      default:
        return String(value);
    }
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'hace un momento';
    if (diffMinutes < 60) return `hace ${diffMinutes}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 30) return `hace ${diffDays}d`;
    return this.formatDateTime(date);
  }

  private formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }
}