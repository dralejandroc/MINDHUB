/**
 * Dashboard React Hook
 * React integration layer for Dashboard Clean Architecture
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dashboard, DashboardType, DashboardLayout } from '../entities/Dashboard';
import { DashboardWidget, WidgetType, WidgetSize, RefreshInterval } from '../entities/DashboardWidget';
import { DashboardData } from '../entities/DashboardData';
import { DashboardContainer } from '../container/DashboardContainer';
import {
  ManageDashboardUseCase,
  CreateDashboardRequest,
  AddWidgetRequest,
  UpdateDashboardConfigurationRequest,
  DashboardOperationResult,
  DashboardAnalytics
} from '../usecases/ManageDashboardUseCase';
import { 
  DashboardPresenter, 
  DashboardViewModel, 
  WidgetViewModel,
  StatisticWidgetViewModel,
  ChartWidgetViewModel,
  ListWidgetViewModel,
  ActivityWidgetViewModel,
  DashboardOverviewViewModel
} from '../presenters/DashboardPresenter';

interface UseDashboardState {
  dashboards: DashboardViewModel[];
  currentDashboard: DashboardViewModel | null;
  widgets: WidgetViewModel[];
  widgetData: Map<string, DashboardData>;
  overview: DashboardOverviewViewModel | null;
  analytics: DashboardAnalytics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  warnings: string[];
}

interface UseDashboardOperations {
  // Dashboard operations
  loadDashboards: (userId: string, clinicId?: string, workspaceId?: string) => Promise<void>;
  loadDashboard: (dashboardId: string) => Promise<void>;
  createDashboard: (request: CreateDashboardRequest) => Promise<DashboardViewModel | null>;
  updateDashboard: (dashboard: Dashboard) => Promise<DashboardViewModel | null>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
  cloneDashboard: (dashboardId: string, newName: string, userId: string, clinicId?: string, workspaceId?: string) => Promise<DashboardViewModel | null>;
  
  // Widget operations
  addWidget: (request: AddWidgetRequest) => Promise<WidgetViewModel | null>;
  updateWidget: (widget: DashboardWidget) => Promise<WidgetViewModel | null>;
  removeWidget: (dashboardId: string, widgetId: string, removedBy: string) => Promise<void>;
  reorderWidgets: (dashboardId: string, newOrder: Array<{ widgetId: string; position: { row: number; column: number } }>, reorderedBy: string) => Promise<void>;
  
  // Data operations
  refreshDashboardData: (dashboardId?: string, widgetIds?: string[]) => Promise<void>;
  refreshWidgetData: (widgetId: string) => Promise<void>;
  
  // Configuration
  updateConfiguration: (request: UpdateDashboardConfigurationRequest) => Promise<void>;
  
  // Analytics
  loadAnalytics: (dashboardId: string, dateRange: { startDate: Date; endDate: Date }) => Promise<void>;
  loadOverview: (userId: string, clinicId?: string, workspaceId?: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  clearWarnings: () => void;
  reset: () => void;
}

export interface UseDashboard extends UseDashboardState, UseDashboardOperations {}

export function useDashboard(
  userId?: string,
  clinicId?: string,
  workspaceId?: string,
  autoLoad = true
): UseDashboard {
  const [state, setState] = useState<UseDashboardState>({
    dashboards: [],
    currentDashboard: null,
    widgets: [],
    widgetData: new Map(),
    overview: null,
    analytics: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    warnings: [],
  });

  // Get dependencies from container
  const container = DashboardContainer.getInstance();
  const manageDashboardUseCase = container.getManageDashboardUseCase();
  const presenter = container.getDashboardPresenter();

  // Auto-refresh interval refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const widgetRefreshIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load dashboards
  const loadDashboards = useCallback(async (
    loadUserId: string,
    loadClinicId?: string,
    loadWorkspaceId?: string
  ) => {
    if (state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const dashboardRepo = container.getDashboardRepository();
      const widgetRepo = container.getWidgetRepository();

      // Load dashboards
      const dashboards = await dashboardRepo.findByUser(loadUserId, {
        clinicId: loadClinicId,
        workspaceId: loadWorkspaceId
      });

      // Load all widgets for these dashboards
      const allWidgets: DashboardWidget[] = [];
      for (const dashboard of dashboards) {
        const widgets = await widgetRepo.findByDashboard(dashboard.id);
        allWidgets.push(...widgets);
      }

      // Present data
      const dashboardViewModels = dashboards.map(dashboard => {
        const dashboardWidgets = allWidgets.filter(w => w.dashboardId === dashboard.id);
        return presenter.presentDashboard(dashboard, dashboardWidgets, loadUserId);
      });

      const widgetViewModels = allWidgets.map(widget => 
        presenter.presentWidget(widget)
      );

      setState(prev => ({
        ...prev,
        dashboards: dashboardViewModels,
        widgets: widgetViewModels,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar dashboards',
      }));
    }
  }, [state.isLoading, container, presenter]);

  // Load specific dashboard
  const loadDashboard = useCallback(async (dashboardId: string) => {
    if (state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await manageDashboardUseCase.getDashboardWithWidgets(dashboardId);
      
      const dashboardViewModel = presenter.presentDashboard(
        result.dashboard, 
        result.widgets, 
        userId
      );

      const widgetViewModels = result.widgets.map(widget => 
        presenter.presentWidget(widget)
      );

      setState(prev => ({
        ...prev,
        currentDashboard: dashboardViewModel,
        widgets: widgetViewModels,
        warnings: result.warnings,
        isLoading: false,
      }));

      // Start auto-refresh if enabled
      if (result.dashboard.configuration.autoRefresh) {
        startAutoRefresh(dashboardId, result.dashboard.configuration.refreshInterval);
      }

      // Load widget data
      await refreshDashboardData(dashboardId);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar dashboard',
      }));
    }
  }, [state.isLoading, manageDashboardUseCase, presenter, userId]);

  // Create dashboard
  const createDashboard = useCallback(async (
    request: CreateDashboardRequest
  ): Promise<DashboardViewModel | null> => {
    if (state.isLoading) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await manageDashboardUseCase.createDashboard(request);
      
      const dashboardViewModel = presenter.presentDashboard(
        result.dashboard, 
        result.widgets,
        request.userId
      );

      setState(prev => ({
        ...prev,
        dashboards: [...prev.dashboards, dashboardViewModel],
        warnings: result.warnings,
        isLoading: false,
      }));

      return dashboardViewModel;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear dashboard',
      }));
      return null;
    }
  }, [state.isLoading, manageDashboardUseCase, presenter]);

  // Update dashboard
  const updateDashboard = useCallback(async (
    dashboard: Dashboard
  ): Promise<DashboardViewModel | null> => {
    try {
      const dashboardRepo = container.getDashboardRepository();
      const updatedDashboard = await dashboardRepo.update(dashboard);
      
      const dashboardViewModel = presenter.presentDashboard(
        updatedDashboard,
        [],
        userId
      );

      setState(prev => ({
        ...prev,
        dashboards: prev.dashboards.map(d => 
          d.id === dashboard.id ? dashboardViewModel : d
        ),
        currentDashboard: prev.currentDashboard?.id === dashboard.id 
          ? dashboardViewModel 
          : prev.currentDashboard,
      }));

      return dashboardViewModel;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al actualizar dashboard',
      }));
      return null;
    }
  }, [container, presenter, userId]);

  // Delete dashboard
  const deleteDashboard = useCallback(async (dashboardId: string) => {
    try {
      const dashboardRepo = container.getDashboardRepository();
      await dashboardRepo.delete(dashboardId);

      setState(prev => ({
        ...prev,
        dashboards: prev.dashboards.filter(d => d.id !== dashboardId),
        currentDashboard: prev.currentDashboard?.id === dashboardId 
          ? null 
          : prev.currentDashboard,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al eliminar dashboard',
      }));
    }
  }, [container]);

  // Clone dashboard
  const cloneDashboard = useCallback(async (
    dashboardId: string,
    newName: string,
    cloneUserId: string,
    cloneClinicId?: string,
    cloneWorkspaceId?: string
  ): Promise<DashboardViewModel | null> => {
    try {
      const result = await manageDashboardUseCase.cloneDashboard(
        dashboardId,
        newName,
        cloneUserId,
        cloneClinicId,
        cloneWorkspaceId
      );

      const dashboardViewModel = presenter.presentDashboard(
        result.dashboard,
        result.widgets,
        cloneUserId
      );

      setState(prev => ({
        ...prev,
        dashboards: [...prev.dashboards, dashboardViewModel],
        warnings: result.warnings,
      }));

      return dashboardViewModel;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al clonar dashboard',
      }));
      return null;
    }
  }, [manageDashboardUseCase, presenter]);

  // Add widget
  const addWidget = useCallback(async (
    request: AddWidgetRequest
  ): Promise<WidgetViewModel | null> => {
    try {
      const result = await manageDashboardUseCase.addWidgetToDashboard(request);
      
      const widgetViewModels = result.widgets.map(widget => 
        presenter.presentWidget(widget)
      );

      setState(prev => ({
        ...prev,
        widgets: widgetViewModels,
        warnings: result.warnings,
      }));

      const newWidget = widgetViewModels.find(w => w.title === request.title);
      return newWidget || null;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al agregar widget',
      }));
      return null;
    }
  }, [manageDashboardUseCase, presenter]);

  // Update widget
  const updateWidget = useCallback(async (
    widget: DashboardWidget
  ): Promise<WidgetViewModel | null> => {
    try {
      const widgetRepo = container.getWidgetRepository();
      const updatedWidget = await widgetRepo.update(widget);
      
      const widgetViewModel = presenter.presentWidget(updatedWidget);

      setState(prev => ({
        ...prev,
        widgets: prev.widgets.map(w => 
          w.id === widget.id ? widgetViewModel : w
        ),
      }));

      return widgetViewModel;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al actualizar widget',
      }));
      return null;
    }
  }, [container, presenter]);

  // Remove widget
  const removeWidget = useCallback(async (
    dashboardId: string,
    widgetId: string,
    removedBy: string
  ) => {
    try {
      await manageDashboardUseCase.removeWidgetFromDashboard(
        dashboardId,
        widgetId,
        removedBy
      );

      setState(prev => ({
        ...prev,
        widgets: prev.widgets.filter(w => w.id !== widgetId),
        widgetData: new Map(
          Array.from(prev.widgetData.entries()).filter(([id]) => id !== widgetId)
        ),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al eliminar widget',
      }));
    }
  }, [manageDashboardUseCase]);

  // Reorder widgets
  const reorderWidgets = useCallback(async (
    dashboardId: string,
    newOrder: Array<{ widgetId: string; position: { row: number; column: number } }>,
    reorderedBy: string
  ) => {
    try {
      const result = await manageDashboardUseCase.reorderWidgets(
        dashboardId,
        newOrder,
        reorderedBy
      );

      const widgetViewModels = result.widgets.map(widget => 
        presenter.presentWidget(widget)
      );

      setState(prev => ({
        ...prev,
        widgets: widgetViewModels,
        warnings: result.warnings,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al reordenar widgets',
      }));
    }
  }, [manageDashboardUseCase, presenter]);

  // Refresh dashboard data
  const refreshDashboardData = useCallback(async (
    dashboardId?: string,
    widgetIds?: string[]
  ) => {
    if (!dashboardId && !state.currentDashboard) return;

    const targetDashboardId = dashboardId || state.currentDashboard!.id;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      const result = await manageDashboardUseCase.refreshDashboardData(
        targetDashboardId,
        widgetIds
      );

      // Load widget data
      const dataRepo = container.getDataRepository();
      const targetWidgetIds = widgetIds || state.widgets
        .filter(w => w.canBeRefreshed)
        .map(w => w.id);

      const newWidgetData = new Map(state.widgetData);
      
      for (const widgetId of targetWidgetIds) {
        try {
          const data = await dataRepo.getWidgetData(widgetId);
          newWidgetData.set(widgetId, data);
        } catch (error) {
          console.warn(`Failed to load data for widget ${widgetId}:`, error);
        }
      }

      setState(prev => ({
        ...prev,
        widgetData: newWidgetData,
        isRefreshing: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Error al actualizar datos',
      }));
    }
  }, [state.currentDashboard, state.widgets, state.widgetData, manageDashboardUseCase, container]);

  // Refresh single widget data
  const refreshWidgetData = useCallback(async (widgetId: string) => {
    try {
      const dataRepo = container.getDataRepository();
      const data = await dataRepo.getWidgetData(widgetId, { forceRefresh: true });
      
      setState(prev => ({
        ...prev,
        widgetData: new Map(prev.widgetData.set(widgetId, data)),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al actualizar widget',
      }));
    }
  }, [container]);

  // Update configuration
  const updateConfiguration = useCallback(async (
    request: UpdateDashboardConfigurationRequest
  ) => {
    try {
      const result = await manageDashboardUseCase.updateDashboardConfiguration(request);
      
      const dashboardViewModel = presenter.presentDashboard(
        result.dashboard,
        result.widgets,
        userId
      );

      setState(prev => ({
        ...prev,
        currentDashboard: dashboardViewModel,
        warnings: result.warnings,
      }));

      // Restart auto-refresh with new interval if changed
      if (result.dashboard.configuration.refreshInterval !== state.currentDashboard?.configuration.refreshIntervalMs) {
        stopAutoRefresh();
        if (result.dashboard.configuration.autoRefresh) {
          startAutoRefresh(request.dashboardId, result.dashboard.configuration.refreshInterval);
        }
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al actualizar configuración',
      }));
    }
  }, [manageDashboardUseCase, presenter, userId, state.currentDashboard]);

  // Load analytics
  const loadAnalytics = useCallback(async (
    dashboardId: string,
    dateRange: { startDate: Date; endDate: Date }
  ) => {
    try {
      const analytics = await manageDashboardUseCase.getDashboardAnalytics(
        dashboardId,
        dateRange
      );

      setState(prev => ({
        ...prev,
        analytics,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar analíticas',
      }));
    }
  }, [manageDashboardUseCase]);

  // Load overview
  const loadOverview = useCallback(async (
    overviewUserId: string,
    overviewClinicId?: string,
    overviewWorkspaceId?: string
  ) => {
    try {
      const dashboardRepo = container.getDashboardRepository();
      const widgetRepo = container.getWidgetRepository();

      const dashboards = await dashboardRepo.findByUser(overviewUserId, {
        clinicId: overviewClinicId,
        workspaceId: overviewWorkspaceId
      });

      const domainDashboards = dashboards;
      const allWidgets: DashboardWidget[] = [];
      for (const dashboard of domainDashboards) {
        const widgets = await widgetRepo.findByDashboard(dashboard.id);
        allWidgets.push(...widgets);
      }

      const statistics = await dashboardRepo.getStatistics({
        userId: overviewUserId,
        clinicId: overviewClinicId,
        workspaceId: overviewWorkspaceId
      });

      const overview = presenter.presentDashboardOverview(
        domainDashboards,
        allWidgets,
        statistics
      );

      setState(prev => ({
        ...prev,
        overview,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar resumen',
      }));
    }
  }, [container, presenter]);

  // Auto-refresh functionality
  const startAutoRefresh = useCallback((dashboardId: string, intervalMs: number) => {
    stopAutoRefresh();
    
    refreshIntervalRef.current = setInterval(() => {
      refreshDashboardData(dashboardId);
    }, intervalMs);
  }, [refreshDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearWarnings = useCallback(() => {
    setState(prev => ({ ...prev, warnings: [] }));
  }, []);

  const reset = useCallback(() => {
    stopAutoRefresh();
    setState({
      dashboards: [],
      currentDashboard: null,
      widgets: [],
      widgetData: new Map(),
      overview: null,
      analytics: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      warnings: [],
    });
  }, [stopAutoRefresh]);

  // Auto-load effect
  useEffect(() => {
    if (autoLoad && userId && !state.isLoading && state.dashboards.length === 0) {
      loadDashboards(userId, clinicId, workspaceId);
    }
  }, [autoLoad, userId, clinicId, workspaceId, state.isLoading, state.dashboards.length, loadDashboards]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      // Clear all widget refresh intervals
      widgetRefreshIntervalsRef.current.forEach(interval => clearInterval(interval));
      widgetRefreshIntervalsRef.current.clear();
    };
  }, [stopAutoRefresh]);

  return {
    ...state,
    loadDashboards,
    loadDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    cloneDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,
    refreshDashboardData,
    refreshWidgetData,
    updateConfiguration,
    loadAnalytics,
    loadOverview,
    clearError,
    clearWarnings,
    reset,
  };
}