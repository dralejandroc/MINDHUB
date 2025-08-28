/**
 * Django Dashboard Adapter
 * Implements repositories using Django REST API endpoints
 */

import { Dashboard, DashboardType, DashboardLayout } from '../entities/Dashboard';
import { DashboardWidget, WidgetType, WidgetSize, RefreshInterval } from '../entities/DashboardWidget';
import { DashboardData, StatisticMetric, ChartDataPoint, ActivityItem } from '../entities/DashboardData';
import {
  DashboardRepository,
  DashboardSearchFilters,
  DashboardUsageStatistics,
  DashboardPerformanceStatistics
} from '../repositories/DashboardRepository';
import {
  DashboardWidgetRepository,
  WidgetSearchFilters,
  WidgetPerformanceMetrics
} from '../repositories/DashboardWidgetRepository';
import {
  DashboardDataRepository,
  DataRefreshOptions,
  DataCacheInfo
} from '../repositories/DashboardDataRepository';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mindhub-django-backend.vercel.app' 
  : 'http://localhost:8002';

/**
 * Django Dashboard Repository Adapter
 */
export class DjangoDashboardAdapter implements DashboardRepository {

  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/dashboard${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `Dashboard API error: ${response.status}`);
    }

    return response.json();
  }

  private mapApiDashboardToDomain(apiData: any): Dashboard {
    return new Dashboard(
      apiData.id,
      apiData.user_id,
      apiData.name,
      apiData.type as DashboardType,
      apiData.layout as DashboardLayout,
      apiData.is_default,
      apiData.is_shared,
      [], // Widgets loaded separately
      apiData.configuration || {
        columns: 4,
        autoRefresh: true,
        refreshInterval: 300000,
        theme: 'default',
        showTitle: true,
        allowReordering: true,
      },
      new Date(apiData.created_at),
      new Date(apiData.updated_at),
      apiData.clinic_id,
      apiData.workspace_id
    );
  }

  private mapDomainToApiDashboard(dashboard: Dashboard): any {
    return {
      id: dashboard.id,
      user_id: dashboard.userId,
      name: dashboard.name,
      type: dashboard.type,
      layout: dashboard.layout,
      is_default: dashboard.isDefault,
      is_shared: dashboard.isShared,
      configuration: dashboard.configuration,
      clinic_id: dashboard.clinicId,
      workspace_id: dashboard.workspaceId,
    };
  }

  async findById(id: string): Promise<Dashboard | null> {
    try {
      const data = await this.apiRequest<any>(`/dashboards/${id}/`);
      return this.mapApiDashboardToDomain(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findByUser(userId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      user_id: userId,
      ...(filters?.clinicId && { clinic_id: filters.clinicId }),
      ...(filters?.workspaceId && { workspace_id: filters.workspaceId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.layout && { layout: filters.layout }),
      ...(filters?.isDefault !== undefined && { is_default: filters.isDefault.toString() }),
      ...(filters?.isShared !== undefined && { is_shared: filters.isShared.toString() }),
      ...(filters?.isActive !== undefined && { is_active: filters.isActive.toString() })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async findDefaultByType(userId: string, type: DashboardType): Promise<Dashboard | null> {
    const params = new URLSearchParams({
      user_id: userId,
      type,
      is_default: 'true'
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.length > 0 ? this.mapApiDashboardToDomain(data.results[0]) : null;
  }

  async findShared(filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      is_shared: 'true',
      ...(filters?.clinicId && { clinic_id: filters.clinicId }),
      ...(filters?.workspaceId && { workspace_id: filters.workspaceId }),
      ...(filters?.type && { type: filters.type })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async findByType(type: DashboardType, filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      type,
      ...(filters?.userId && { user_id: filters.userId }),
      ...(filters?.clinicId && { clinic_id: filters.clinicId }),
      ...(filters?.workspaceId && { workspace_id: filters.workspaceId })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async findByClinic(clinicId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    return this.findByUser(filters?.userId || '', { ...filters, clinicId });
  }

  async findByWorkspace(workspaceId: string, filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    return this.findByUser(filters?.userId || '', { ...filters, workspaceId });
  }

  async searchByName(query: string, filters?: DashboardSearchFilters): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      search: query,
      ...(filters?.userId && { user_id: filters.userId }),
      ...(filters?.clinicId && { clinic_id: filters.clinicId }),
      ...(filters?.workspaceId && { workspace_id: filters.workspaceId })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async findRecentlyAccessed(userId: string, limit = 10): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      user_id: userId,
      ordering: '-last_accessed',
      limit: limit.toString()
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async findMostUsed(userId: string, limit = 10): Promise<Dashboard[]> {
    const params = new URLSearchParams({
      user_id: userId,
      ordering: '-usage_count',
      limit: limit.toString()
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/?${params}`);
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async create(dashboard: Dashboard): Promise<Dashboard> {
    const apiData = this.mapDomainToApiDashboard(dashboard);
    const data = await this.apiRequest<any>('/dashboards/', {
      method: 'POST',
      body: JSON.stringify(apiData)
    });
    return this.mapApiDashboardToDomain(data);
  }

  async update(dashboard: Dashboard): Promise<Dashboard> {
    const apiData = this.mapDomainToApiDashboard(dashboard);
    const data = await this.apiRequest<any>(`/dashboards/${dashboard.id}/`, {
      method: 'PUT',
      body: JSON.stringify(apiData)
    });
    return this.mapApiDashboardToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.apiRequest(`/dashboards/${id}/`, {
      method: 'DELETE'
    });
  }

  async archive(id: string, archivedBy: string, reason?: string): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/archive/`, {
      method: 'POST',
      body: JSON.stringify({ archived_by: archivedBy, reason })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async restore(id: string, restoredBy: string): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/restore/`, {
      method: 'POST',
      body: JSON.stringify({ restored_by: restoredBy })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async setAsDefault(id: string, userId: string, type: DashboardType): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/set-default/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, type })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async share(id: string, sharedBy: string, shareSettings?: any): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/share/`, {
      method: 'POST',
      body: JSON.stringify({ shared_by: sharedBy, ...shareSettings })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async unshare(id: string, unsharedBy: string): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/unshare/`, {
      method: 'POST',
      body: JSON.stringify({ unshared_by: unsharedBy })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async clone(id: string, newName: string, clonedBy: string, clinicId?: string, workspaceId?: string): Promise<Dashboard> {
    const data = await this.apiRequest<any>(`/dashboards/${id}/clone/`, {
      method: 'POST',
      body: JSON.stringify({
        new_name: newName,
        cloned_by: clonedBy,
        clinic_id: clinicId,
        workspace_id: workspaceId
      })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async getStatistics(filters?: DashboardSearchFilters): Promise<any> {
    const params = new URLSearchParams({
      ...(filters?.userId && { user_id: filters.userId }),
      ...(filters?.clinicId && { clinic_id: filters.clinicId }),
      ...(filters?.workspaceId && { workspace_id: filters.workspaceId })
    });

    return this.apiRequest<any>(`/dashboards/statistics/?${params}`);
  }

  async getUsageStatistics(dashboardId: string, startDate: Date, endDate: Date): Promise<DashboardUsageStatistics> {
    const params = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    return this.apiRequest<DashboardUsageStatistics>(`/dashboards/${dashboardId}/usage-statistics/?${params}`);
  }

  async getPerformanceStatistics(dashboardId: string, startDate: Date, endDate: Date): Promise<DashboardPerformanceStatistics> {
    const params = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    return this.apiRequest<DashboardPerformanceStatistics>(`/dashboards/${dashboardId}/performance-statistics/?${params}`);
  }

  async trackView(dashboardId: string, userId: string, sessionInfo: any): Promise<void> {
    await this.apiRequest(`/dashboards/${dashboardId}/track-view/`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        session_info: sessionInfo
      })
    });
  }

  async trackInteraction(dashboardId: string, userId: string, interaction: any): Promise<void> {
    await this.apiRequest(`/dashboards/${dashboardId}/track-interaction/`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        interaction
      })
    });
  }

  // Implement remaining methods with similar patterns...
  async getTemplates(type?: DashboardType, category?: string): Promise<any[]> {
    const params = new URLSearchParams({
      ...(type && { type }),
      ...(category && { category })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/dashboard-templates/?${params}`);
    return data.results;
  }

  async createFromTemplate(templateId: string, name: string, userId: string, clinicId?: string, workspaceId?: string, customizations?: any): Promise<Dashboard> {
    const data = await this.apiRequest<any>('/dashboards/create-from-template/', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        name,
        user_id: userId,
        clinic_id: clinicId,
        workspace_id: workspaceId,
        customizations
      })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async bulkUpdate(dashboardIds: string[], updates: any, updatedBy: string): Promise<Dashboard[]> {
    const data = await this.apiRequest<{ results: any[] }>('/dashboards/bulk-update/', {
      method: 'POST',
      body: JSON.stringify({
        dashboard_ids: dashboardIds,
        updates,
        updated_by: updatedBy
      })
    });
    return data.results.map(item => this.mapApiDashboardToDomain(item));
  }

  async bulkDelete(dashboardIds: string[], deletedBy: string): Promise<void> {
    await this.apiRequest('/dashboards/bulk-delete/', {
      method: 'POST',
      body: JSON.stringify({
        dashboard_ids: dashboardIds,
        deleted_by: deletedBy
      })
    });
  }

  async export(dashboardId: string, format: 'json' | 'yaml', includeData?: boolean): Promise<any> {
    const params = new URLSearchParams({
      format,
      ...(includeData !== undefined && { include_data: includeData.toString() })
    });

    return this.apiRequest<any>(`/dashboards/${dashboardId}/export/?${params}`);
  }

  async import(configuration: string, format: 'json' | 'yaml', userId: string, clinicId?: string, workspaceId?: string, options?: any): Promise<Dashboard> {
    const data = await this.apiRequest<any>('/dashboards/import/', {
      method: 'POST',
      body: JSON.stringify({
        configuration,
        format,
        user_id: userId,
        clinic_id: clinicId,
        workspace_id: workspaceId,
        options
      })
    });
    return this.mapApiDashboardToDomain(data);
  }

  async getHealthCheck(dashboardId: string): Promise<any> {
    return this.apiRequest<any>(`/dashboards/${dashboardId}/health-check/`);
  }

  async optimize(dashboardId: string, optimizations: any[]): Promise<any> {
    return this.apiRequest<any>(`/dashboards/${dashboardId}/optimize/`, {
      method: 'POST',
      body: JSON.stringify({ optimizations })
    });
  }

  async getAccessibilityScore(dashboardId: string): Promise<any> {
    return this.apiRequest<any>(`/dashboards/${dashboardId}/accessibility-score/`);
  }

  async scheduleRefresh(dashboardId: string, schedule: any, scheduledBy: string): Promise<void> {
    await this.apiRequest(`/dashboards/${dashboardId}/schedule-refresh/`, {
      method: 'POST',
      body: JSON.stringify({
        schedule,
        scheduled_by: scheduledBy
      })
    });
  }

  async getScheduledRefreshes(dashboardId: string): Promise<any[]> {
    const data = await this.apiRequest<{ results: any[] }>(`/dashboards/${dashboardId}/scheduled-refreshes/`);
    return data.results;
  }

  async archiveOldVersions(beforeDate: Date, options: any): Promise<any> {
    return this.apiRequest<any>('/dashboards/archive-old-versions/', {
      method: 'POST',
      body: JSON.stringify({
        before_date: beforeDate.toISOString(),
        options
      })
    });
  }
}

/**
 * Django Widget Repository Adapter
 */
export class DjangoWidgetAdapter implements DashboardWidgetRepository {

  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/dashboard${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `Widget API error: ${response.status}`);
    }

    return response.json();
  }

  private mapApiWidgetToDomain(apiData: any): DashboardWidget {
    return new DashboardWidget(
      apiData.id,
      apiData.user_id,
      apiData.dashboard_id,
      apiData.title,
      apiData.type as WidgetType,
      apiData.size as WidgetSize,
      { row: apiData.position_row, column: apiData.position_column },
      apiData.configuration,
      apiData.is_visible,
      apiData.refresh_interval as RefreshInterval,
      new Date(apiData.created_at),
      new Date(apiData.updated_at),
      apiData.clinic_id,
      apiData.workspace_id
    );
  }

  private mapDomainToApiWidget(widget: DashboardWidget): any {
    return {
      id: widget.id,
      user_id: widget.userId,
      dashboard_id: widget.dashboardId,
      title: widget.title,
      type: widget.type,
      size: widget.size,
      position_row: widget.position.row,
      position_column: widget.position.column,
      configuration: widget.configuration,
      is_visible: widget.isVisible,
      refresh_interval: widget.refreshInterval,
      clinic_id: widget.clinicId,
      workspace_id: widget.workspaceId
    };
  }

  async findById(id: string): Promise<DashboardWidget | null> {
    try {
      const data = await this.apiRequest<any>(`/widgets/${id}/`);
      return this.mapApiWidgetToDomain(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findByDashboard(dashboardId: string): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({ dashboard_id: dashboardId });
    const data = await this.apiRequest<{ results: any[] }>(`/widgets/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findVisibleByDashboard(dashboardId: string): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({ 
      dashboard_id: dashboardId,
      is_visible: 'true'
    });
    const data = await this.apiRequest<{ results: any[] }>(`/widgets/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findByUser(userId: string, filters?: WidgetSearchFilters): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({
      user_id: userId,
      ...(filters?.dashboardId && { dashboard_id: filters.dashboardId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.size && { size: filters.size }),
      ...(filters?.isVisible !== undefined && { is_visible: filters.isVisible.toString() })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/widgets/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findByType(type: WidgetType, filters?: WidgetSearchFilters): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({
      type,
      ...(filters?.dashboardId && { dashboard_id: filters.dashboardId }),
      ...(filters?.userId && { user_id: filters.userId })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/widgets/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findByDataSource(dataSource: string, filters?: WidgetSearchFilters): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({
      data_source: dataSource,
      ...(filters?.dashboardId && { dashboard_id: filters.dashboardId }),
      ...(filters?.userId && { user_id: filters.userId })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/widgets/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findRequiringRefresh(maxAge: number, filters?: WidgetSearchFilters): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({
      max_age: maxAge.toString(),
      ...(filters?.dashboardId && { dashboard_id: filters.dashboardId })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/widgets/requiring-refresh/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findByPositionRange(dashboardId: string, startRow: number, endRow: number, startColumn?: number, endColumn?: number): Promise<DashboardWidget[]> {
    const params = new URLSearchParams({
      dashboard_id: dashboardId,
      start_row: startRow.toString(),
      end_row: endRow.toString(),
      ...(startColumn !== undefined && { start_column: startColumn.toString() }),
      ...(endColumn !== undefined && { end_column: endColumn.toString() })
    });

    const data = await this.apiRequest<{ results: any[] }>(`/widgets/by-position-range/?${params}`);
    return data.results.map(item => this.mapApiWidgetToDomain(item));
  }

  async findWithPerformanceIssues(thresholds: any): Promise<Array<{ widget: DashboardWidget; issues: string[]; metrics: WidgetPerformanceMetrics; }>> {
    const data = await this.apiRequest<{ results: any[] }>('/widgets/performance-issues/', {
      method: 'POST',
      body: JSON.stringify({ thresholds })
    });

    return data.results.map(item => ({
      widget: this.mapApiWidgetToDomain(item.widget),
      issues: item.issues,
      metrics: item.metrics
    }));
  }

  async create(widget: DashboardWidget): Promise<DashboardWidget> {
    const apiData = this.mapDomainToApiWidget(widget);
    const data = await this.apiRequest<any>('/widgets/', {
      method: 'POST',
      body: JSON.stringify(apiData)
    });
    return this.mapApiWidgetToDomain(data);
  }

  async update(widget: DashboardWidget): Promise<DashboardWidget> {
    const apiData = this.mapDomainToApiWidget(widget);
    const data = await this.apiRequest<any>(`/widgets/${widget.id}/`, {
      method: 'PUT',
      body: JSON.stringify(apiData)
    });
    return this.mapApiWidgetToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.apiRequest(`/widgets/${id}/`, {
      method: 'DELETE'
    });
  }

  // Implement remaining methods with similar patterns...
  async hide(id: string, hiddenBy: string): Promise<DashboardWidget> {
    const data = await this.apiRequest<any>(`/widgets/${id}/hide/`, {
      method: 'POST',
      body: JSON.stringify({ hidden_by: hiddenBy })
    });
    return this.mapApiWidgetToDomain(data);
  }

  async show(id: string, shownBy: string): Promise<DashboardWidget> {
    const data = await this.apiRequest<any>(`/widgets/${id}/show/`, {
      method: 'POST',
      body: JSON.stringify({ shown_by: shownBy })
    });
    return this.mapApiWidgetToDomain(data);
  }

  // ... implement remaining methods following the same pattern
  
  // For brevity, I'll implement a few key methods and indicate the pattern for others

  async getStatistics(filters?: WidgetSearchFilters): Promise<any> {
    const params = new URLSearchParams({
      ...(filters?.dashboardId && { dashboard_id: filters.dashboardId }),
      ...(filters?.userId && { user_id: filters.userId })
    });

    return this.apiRequest<any>(`/widgets/statistics/?${params}`);
  }

  async getPerformanceMetrics(widgetId: string, startDate: Date, endDate: Date): Promise<WidgetPerformanceMetrics> {
    const params = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    return this.apiRequest<WidgetPerformanceMetrics>(`/widgets/${widgetId}/performance-metrics/?${params}`);
  }

  // Placeholder implementations for remaining methods
  async moveToDashboard(widgetId: string, targetDashboardId: string, position: { row: number; column: number; }, movedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async duplicate(widgetId: string, targetDashboardId: string, position: { row: number; column: number; }, newTitle?: string, duplicatedBy?: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async resize(id: string, newSize: WidgetSize, resizedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async updatePosition(id: string, newPosition: { row: number; column: number; }, updatedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async updateRefreshInterval(id: string, interval: RefreshInterval, updatedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async updateDataSource(id: string, dataSource: string, updatedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async updateFilters(id: string, filters: Record<string, unknown>, updatedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async updateDisplayOptions(id: string, displayOptions: Record<string, unknown>, updatedBy: string): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async findNeedingAttention(filters?: WidgetSearchFilters): Promise<Array<{ widget: DashboardWidget; issues: Array<{ type: "performance" | "data" | "configuration" | "accessibility"; severity: "low" | "medium" | "high"; description: string; suggestion: string; }>; priority: "low" | "medium" | "high" | "critical"; }>> {
    throw new Error('Method not implemented.');
  }

  async optimize(widgetId: string, optimizations: Array<{ type: "caching" | "data_compression" | "query_optimization" | "rendering"; enabled: boolean; parameters?: Record<string, unknown>; }>): Promise<{ optimizationsApplied: number; estimatedPerformanceGain: string; newConfiguration: Record<string, unknown>; }> {
    throw new Error('Method not implemented.');
  }

  async getTemplates(type?: WidgetType): Promise<Array<{ id: string; name: string; description: string; type: WidgetType; size: WidgetSize; previewUrl?: string; category: string; tags: string[]; configuration: Record<string, unknown>; }>> {
    throw new Error('Method not implemented.');
  }

  async createFromTemplate(templateId: string, dashboardId: string, position: { row: number; column: number; }, customizations?: { title?: string; size?: WidgetSize; refreshInterval?: RefreshInterval; dataSource?: string; filters?: Record<string, unknown>; displayOptions?: Record<string, unknown>; }): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async bulkUpdate(widgetIds: string[], updates: Partial<Pick<DashboardWidget, "isVisible" | "refreshInterval" | "size">>, updatedBy: string): Promise<DashboardWidget[]> {
    throw new Error('Method not implemented.');
  }

  async bulkMoveToDashboard(widgetIds: string[], targetDashboardId: string, startPosition: { row: number; column: number; }, movedBy: string): Promise<DashboardWidget[]> {
    throw new Error('Method not implemented.');
  }

  async bulkDelete(widgetIds: string[], deletedBy: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async trackInteraction(widgetId: string, userId: string, interaction: { type: "view" | "click" | "resize" | "move" | "refresh" | "configure"; timestamp: Date; duration?: number; metadata?: Record<string, unknown>; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getUsageAnalytics(widgetId: string, startDate: Date, endDate: Date): Promise<{ totalViews: number; uniqueUsers: number; averageViewTime: number; interactionsByType: { [type: string]: number; }; peakUsageHours: Array<{ hour: number; views: number; }>; userEngagement: { clickThroughRate: number; bounceRate: number; averageInteractionsPerView: number; }; }> {
    throw new Error('Method not implemented.');
  }

  async export(widgetId: string, format: "json" | "yaml"): Promise<{ filename: string; content: string; size: number; }> {
    throw new Error('Method not implemented.');
  }

  async import(configuration: string, format: "json" | "yaml", dashboardId: string, position: { row: number; column: number; }, options?: { generateNewId?: boolean; validateBeforeImport?: boolean; overrideConflicts?: boolean; }): Promise<DashboardWidget> {
    throw new Error('Method not implemented.');
  }

  async getHealthCheck(widgetId: string): Promise<{ status: "healthy" | "warning" | "error"; checks: Array<{ name: string; status: "pass" | "fail" | "warning"; message: string; }>; dataFreshness: { lastUpdated: Date; isStale: boolean; stalenessThreshold: number; }; performance: { loadTime: number; renderTime: number; memoryUsage: number; }; recommendations: string[]; }> {
    throw new Error('Method not implemented.');
  }

  async validateConfiguration(configuration: Record<string, unknown>, type: WidgetType): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; suggestions: string[]; }> {
    throw new Error('Method not implemented.');
  }

  async getDependencies(widgetId: string): Promise<{ dataSources: string[]; externalAPIs: string[]; requiredPermissions: string[]; relatedWidgets: Array<{ widgetId: string; relationship: "filter" | "drill_down" | "context" | "data_source"; }>; }> {
    throw new Error('Method not implemented.');
  }

  async testDataConnection(dataSource: string, configuration: Record<string, unknown>): Promise<{ isConnected: boolean; responseTime: number; dataPreview?: unknown[]; errors?: string[]; warnings?: string[]; }> {
    throw new Error('Method not implemented.');
  }

  async scheduleRefresh(widgetId: string, schedule: { type: "interval" | "cron" | "event_based"; configuration: string; enabled: boolean; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async cancelScheduledRefresh(widgetId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getRefreshHistory(widgetId: string, limit?: number): Promise<Array<{ timestamp: Date; status: "success" | "failure" | "partial"; duration: number; recordsUpdated?: number; error?: string; }>> {
    throw new Error('Method not implemented.');
  }
}

/**
 * Django Data Repository Adapter
 */
export class DjangoDataAdapter implements DashboardDataRepository {

  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/dashboard${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `Data API error: ${response.status}`);
    }

    return response.json();
  }

  private mapApiDataToDomain(apiData: any, widgetId: string): DashboardData {
    switch (apiData.data_type) {
      case 'statistics':
        return DashboardData.createStatisticsData(
          widgetId,
          apiData.data.metrics || [],
          apiData.metadata
        );
      case 'chart':
        return DashboardData.createChartData(
          widgetId,
          apiData.data.chart_type || 'line',
          apiData.data.data_points || [],
          apiData.data.options,
          apiData.metadata
        );
      case 'list':
        return DashboardData.createListData(
          widgetId,
          apiData.data.items || [],
          apiData.metadata
        );
      case 'activity':
        return DashboardData.createActivityData(
          widgetId,
          apiData.data.activities || [],
          apiData.metadata
        );
      default:
        throw new Error(`Unknown data type: ${apiData.data_type}`);
    }
  }

  async getWidgetData(widgetId: string, options?: DataRefreshOptions): Promise<DashboardData> {
    const params = new URLSearchParams({
      ...(options?.forceRefresh && { force_refresh: 'true' }),
      ...(options?.cacheMaxAge && { cache_max_age: options.cacheMaxAge.toString() }),
      ...(options?.timeout && { timeout: options.timeout.toString() })
    });

    const data = await this.apiRequest<any>(`/data/widgets/${widgetId}/?${params}`);
    return this.mapApiDataToDomain(data, widgetId);
  }

  async refreshWidgetData(widgetId: string, dataSourceUrl: string, options?: DataRefreshOptions): Promise<DashboardData> {
    const requestData = {
      data_source_url: dataSourceUrl,
      options: {
        force_refresh: options?.forceRefresh || false,
        cache_max_age: options?.cacheMaxAge || 5,
        timeout: options?.timeout || 30000,
        retry_attempts: options?.retryAttempts || 3
      }
    };

    const data = await this.apiRequest<any>(`/data/widgets/${widgetId}/refresh/`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, widgetId);
  }

  async getStatisticsData(dataSource: string, filters?: Record<string, unknown>, options?: DataRefreshOptions): Promise<DashboardData> {
    const requestData = {
      data_source: dataSource,
      filters: filters || {},
      options: options || {}
    };

    const data = await this.apiRequest<any>('/data/statistics/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, `stats_${Date.now()}`);
  }

  async getChartData(dataSource: string, chartType: "line" | "bar" | "pie" | "area" | "scatter", filters?: Record<string, unknown>, options?: DataRefreshOptions): Promise<DashboardData> {
    const requestData = {
      data_source: dataSource,
      chart_type: chartType,
      filters: filters || {},
      options: options || {}
    };

    const data = await this.apiRequest<any>('/data/chart/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, `chart_${Date.now()}`);
  }

  async getListData(dataSource: string, filters?: Record<string, unknown>, options?: DataRefreshOptions): Promise<DashboardData> {
    const requestData = {
      data_source: dataSource,
      filters: filters || {},
      options: options || {}
    };

    const data = await this.apiRequest<any>('/data/list/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, `list_${Date.now()}`);
  }

  async getActivityData(dataSource: string, filters?: Record<string, unknown>, options?: DataRefreshOptions): Promise<DashboardData> {
    const requestData = {
      data_source: dataSource,
      filters: filters || {},
      options: options || {}
    };

    const data = await this.apiRequest<any>('/data/activity/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, `activity_${Date.now()}`);
  }

  async getRealTimeData(widgetId: string, dataSource: string, lastUpdateTime?: Date): Promise<DashboardData> {
    const requestData = {
      data_source: dataSource,
      ...(lastUpdateTime && { last_update_time: lastUpdateTime.toISOString() })
    };

    const data = await this.apiRequest<any>(`/data/widgets/${widgetId}/realtime/`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.mapApiDataToDomain(data, widgetId);
  }

  async subscribeToRealTimeData(widgetId: string, dataSource: string, callback: (data: DashboardData) => void): Promise<() => void> {
    // Implementation would depend on WebSocket or Server-Sent Events setup
    console.warn('Real-time subscription not implemented yet');
    return () => {};
  }

  async getCacheInfo(widgetId: string): Promise<DataCacheInfo> {
    return this.apiRequest<DataCacheInfo>(`/data/widgets/${widgetId}/cache-info/`);
  }

  async clearCache(widgetId: string): Promise<void> {
    await this.apiRequest(`/data/widgets/${widgetId}/clear-cache/`, {
      method: 'POST'
    });
  }

  async clearAllCache(): Promise<void> {
    await this.apiRequest('/data/clear-all-cache/', {
      method: 'POST'
    });
  }

  // Placeholder implementations for remaining methods
  async preloadWidgetData(widgetIds: string[]): Promise<{ preloaded: string[]; failed: Array<{ widgetId: string; error: string; }>; }> {
    throw new Error('Method not implemented.');
  }

  async batchGetWidgetData(widgetIds: string[], options?: DataRefreshOptions): Promise<Map<string, DashboardData>> {
    throw new Error('Method not implemented.');
  }

  async getDataSourceStatus(dataSource: string): Promise<{ isAvailable: boolean; responseTime: number; lastChecked: Date; errorCount: number; lastError?: string; }> {
    throw new Error('Method not implemented.');
  }

  async testDataSourceConnection(dataSource: string, configuration?: Record<string, unknown>): Promise<{ isConnected: boolean; responseTime: number; sampleData?: unknown; error?: string; }> {
    throw new Error('Method not implemented.');
  }

  async getAvailableDataSources(): Promise<Array<{ id: string; name: string; description: string; type: "api" | "database" | "file" | "realtime" | "mock"; endpoints: string[]; supportedFormats: Array<"statistics" | "chart" | "list" | "activity">; requiresAuth: boolean; rateLimit?: { requestsPerMinute: number; requestsPerHour: number; }; documentation?: string; }>> {
    throw new Error('Method not implemented.');
  }

  async transformData(data: unknown, targetFormat: "statistics" | "chart" | "list" | "activity", configuration?: Record<string, unknown>): Promise<DashboardData> {
    throw new Error('Method not implemented.');
  }

  async validateDataFormat(data: unknown, expectedFormat: "statistics" | "chart" | "list" | "activity"): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; }> {
    throw new Error('Method not implemented.');
  }

  async getDataSchema(dataSource: string): Promise<{ fields: Array<{ name: string; type: "string" | "number" | "boolean" | "date" | "object" | "array"; required: boolean; description?: string; format?: string; examples?: unknown[]; }>; relationships?: Array<{ field: string; relatedDataSource: string; relatedField: string; }>; }> {
    throw new Error('Method not implemented.');
  }

  async getDataQualityMetrics(widgetId: string, startDate: Date, endDate: Date): Promise<{ completeness: number; accuracy: number; consistency: number; timeliness: number; issues: Array<{ type: "missing_data" | "invalid_format" | "outdated" | "duplicate"; count: number; severity: "low" | "medium" | "high"; description: string; }>; trends: Array<{ date: Date; completeness: number; accuracy: number; }>; }> {
    throw new Error('Method not implemented.');
  }

  async getDataUsageAnalytics(dataSource: string, startDate: Date, endDate: Date): Promise<{ totalRequests: number; averageRequestsPerDay: number; peakUsageHours: Array<{ hour: number; requests: number; }>; errorRate: number; averageResponseTime: number; dataTransferVolume: number; mostActiveWidgets: Array<{ widgetId: string; requests: number; }>; cacheEfficiency: { hitRate: number; missRate: number; evictionRate: number; }; }> {
    throw new Error('Method not implemented.');
  }

  async exportWidgetData(widgetId: string, format: "json" | "csv" | "excel", options?: { includeMetadata?: boolean; dateRange?: { start: Date; end: Date; }; filters?: Record<string, unknown>; }): Promise<{ filename: string; content: string | Buffer; size: number; recordCount: number; }> {
    throw new Error('Method not implemented.');
  }

  async importWidgetData(widgetId: string, data: string | Buffer, format: "json" | "csv" | "excel", options?: { validateData?: boolean; replaceExisting?: boolean; transformRules?: Record<string, string>; }): Promise<{ recordsImported: number; recordsSkipped: number; errors: string[]; warnings: string[]; }> {
    throw new Error('Method not implemented.');
  }

  async scheduleRefresh(widgetId: string, schedule: { type: "interval" | "cron"; configuration: string; enabled: boolean; options?: DataRefreshOptions; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getScheduledRefreshes(widgetId?: string): Promise<Array<{ widgetId: string; schedule: { type: "interval" | "cron"; configuration: string; enabled: boolean; }; nextRun: Date; lastRun?: Date; status: "active" | "paused" | "failed"; statistics: { totalRuns: number; successfulRuns: number; failedRuns: number; averageDuration: number; }; }>> {
    throw new Error('Method not implemented.');
  }

  async cancelScheduledRefresh(widgetId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getRefreshHistory(widgetId: string, limit?: number): Promise<Array<{ timestamp: Date; status: "success" | "failure" | "timeout" | "cancelled"; duration: number; recordsUpdated: number; error?: string; cacheUsed: boolean; dataSource: string; }>> {
    throw new Error('Method not implemented.');
  }

  async setupDataAlert(widgetId: string, alert: { name: string; condition: { field: string; operator: ">" | "<" | "=" | "!=" | "contains" | "missing"; value: unknown; }; notification: { email?: string[]; webhook?: string; dashboard?: boolean; }; enabled: boolean; }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getDataAlerts(widgetId?: string): Promise<Array<{ id: string; widgetId: string; name: string; condition: { field: string; operator: string; value: unknown; }; notification: Record<string, unknown>; enabled: boolean; lastTriggered?: Date; triggerCount: number; }>> {
    throw new Error('Method not implemented.');
  }

  async deleteDataAlert(alertId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getDataLineage(widgetId: string): Promise<{ sources: Array<{ id: string; name: string; type: string; lastUpdated: Date; }>; transformations: Array<{ step: string; description: string; timestamp: Date; }>; dependencies: Array<{ widgetId: string; dependencyType: "filter" | "calculation" | "aggregation"; }>; }> {
    throw new Error('Method not implemented.');
  }

  async optimizeQueries(dataSource: string, queryPatterns: Array<{ query: string; frequency: number; responseTime: number; }>): Promise<{ optimizedQueries: Array<{ original: string; optimized: string; expectedImprovement: string; }>; cacheRecommendations: Array<{ query: string; suggestedTTL: number; reason: string; }>; indexRecommendations: Array<{ table: string; fields: string[]; reason: string; }>; }> {
    throw new Error('Method not implemented.');
  }
}