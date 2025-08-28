/**
 * Dashboard Entity
 * Core business logic for dashboard management
 */

import { DashboardWidget } from './DashboardWidget';

export type DashboardType = 'main' | 'clinical' | 'financial' | 'custom';
export type DashboardLayout = 'grid' | 'masonry' | 'flexible';

export class Dashboard {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly type: DashboardType,
    public readonly layout: DashboardLayout = 'grid',
    public readonly isDefault: boolean = false,
    public readonly isShared: boolean = false,
    public readonly widgets: DashboardWidget[] = [],
    public readonly configuration: {
      columns: number;
      autoRefresh: boolean;
      refreshInterval: number;
      theme: string;
      showTitle: boolean;
      allowReordering: boolean;
    } = {
      columns: 4,
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
      theme: 'default',
      showTitle: true,
      allowReordering: true,
    },
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly clinicId?: string,
    public readonly workspaceId?: string
  ) {
    this.validateDashboard();
  }

  private validateDashboard(): void {
    if (!this.name.trim()) {
      throw new Error('Dashboard name cannot be empty');
    }

    if (!this.userId) {
      throw new Error('Dashboard must belong to a user');
    }

    if (this.configuration.columns < 1 || this.configuration.columns > 12) {
      throw new Error('Dashboard must have between 1 and 12 columns');
    }
  }

  // Widget management
  addWidget(widget: DashboardWidget): Dashboard {
    if (widget.dashboardId !== this.id) {
      throw new Error('Widget must belong to this dashboard');
    }

    // Check for position conflicts
    const positionConflict = this.widgets.some(w => 
      w.position.row === widget.position.row && 
      w.position.column === widget.position.column &&
      w.id !== widget.id
    );

    if (positionConflict) {
      throw new Error('Widget position conflicts with existing widget');
    }

    const newWidgets = [...this.widgets, widget];

    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      newWidgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  removeWidget(widgetId: string): Dashboard {
    const newWidgets = this.widgets.filter(w => w.id !== widgetId);

    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      newWidgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  updateWidget(widgetId: string, updatedWidget: DashboardWidget): Dashboard {
    const newWidgets = this.widgets.map(w => 
      w.id === widgetId ? updatedWidget : w
    );

    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      newWidgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  reorderWidgets(newOrder: Array<{ widgetId: string; position: { row: number; column: number } }>): Dashboard {
    const updatedWidgets = this.widgets.map(widget => {
      const newPosition = newOrder.find(order => order.widgetId === widget.id);
      if (newPosition) {
        return widget.updatePosition(newPosition.position.row, newPosition.position.column);
      }
      return widget;
    });

    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      updatedWidgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  // Dashboard configuration
  updateConfiguration(newConfig: Partial<typeof this.configuration>): Dashboard {
    const updatedConfig = { ...this.configuration, ...newConfig };

    if (updatedConfig.columns < 1 || updatedConfig.columns > 12) {
      throw new Error('Dashboard must have between 1 and 12 columns');
    }

    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      this.widgets,
      updatedConfig,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  updateName(newName: string): Dashboard {
    if (!newName.trim()) {
      throw new Error('Dashboard name cannot be empty');
    }

    return new Dashboard(
      this.id,
      this.userId,
      newName.trim(),
      this.type,
      this.layout,
      this.isDefault,
      this.isShared,
      this.widgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  setAsDefault(): Dashboard {
    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      true,
      this.isShared,
      this.widgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  share(): Dashboard {
    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      true,
      this.widgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  unshare(): Dashboard {
    return new Dashboard(
      this.id,
      this.userId,
      this.name,
      this.type,
      this.layout,
      this.isDefault,
      false,
      this.widgets,
      this.configuration,
      this.createdAt,
      new Date(),
      this.clinicId,
      this.workspaceId
    );
  }

  // Query methods
  getVisibleWidgets(): DashboardWidget[] {
    return this.widgets.filter(w => w.isVisible);
  }

  getWidgetById(widgetId: string): DashboardWidget | null {
    return this.widgets.find(w => w.id === widgetId) || null;
  }

  getWidgetsByType(type: string): DashboardWidget[] {
    return this.widgets.filter(w => w.type === type);
  }

  getWidgetsByRow(row: number): DashboardWidget[] {
    return this.widgets
      .filter(w => w.position.row === row)
      .sort((a, b) => a.position.column - b.position.column);
  }

  getMaxRow(): number {
    if (this.widgets.length === 0) return 0;
    return Math.max(...this.widgets.map(w => w.position.row));
  }

  getMaxColumn(): number {
    if (this.widgets.length === 0) return 0;
    return Math.max(...this.widgets.map(w => w.position.column));
  }

  // Validation methods
  hasWidgets(): boolean {
    return this.widgets.length > 0;
  }

  hasVisibleWidgets(): boolean {
    return this.getVisibleWidgets().length > 0;
  }

  isValidLayout(): boolean {
    // Check for overlapping widgets
    const positions = this.widgets.map(w => `${w.position.row}-${w.position.column}`);
    return new Set(positions).size === positions.length;
  }

  canAddWidget(position: { row: number; column: number }): boolean {
    if (position.row < 0 || position.column < 0) return false;
    if (position.column >= this.configuration.columns) return false;

    return !this.widgets.some(w => 
      w.position.row === position.row && w.position.column === position.column
    );
  }

  // Auto-layout methods
  getNextAvailablePosition(): { row: number; column: number } {
    for (let row = 0; row <= this.getMaxRow() + 1; row++) {
      for (let column = 0; column < this.configuration.columns; column++) {
        if (this.canAddWidget({ row, column })) {
          return { row, column };
        }
      }
    }
    return { row: 0, column: 0 };
  }

  compactLayout(): Dashboard {
    const sortedWidgets = [...this.widgets].sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.column - b.position.column;
    });

    const newOrder: Array<{ widgetId: string; position: { row: number; column: number } }> = [];
    let currentRow = 0;
    let currentColumn = 0;

    for (const widget of sortedWidgets) {
      if (currentColumn >= this.configuration.columns) {
        currentRow++;
        currentColumn = 0;
      }

      newOrder.push({
        widgetId: widget.id,
        position: { row: currentRow, column: currentColumn }
      });

      currentColumn++;
    }

    return this.reorderWidgets(newOrder);
  }

  // Factory methods
  static createMainDashboard(
    id: string,
    userId: string,
    name: string,
    clinicId?: string,
    workspaceId?: string
  ): Dashboard {
    return new Dashboard(
      id,
      userId,
      name,
      'main',
      'grid',
      true,
      false,
      [],
      {
        columns: 4,
        autoRefresh: true,
        refreshInterval: 300000,
        theme: 'default',
        showTitle: true,
        allowReordering: true,
      },
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }

  static createClinicalDashboard(
    id: string,
    userId: string,
    name: string,
    clinicId?: string,
    workspaceId?: string
  ): Dashboard {
    return new Dashboard(
      id,
      userId,
      name,
      'clinical',
      'grid',
      false,
      false,
      [],
      {
        columns: 3,
        autoRefresh: true,
        refreshInterval: 180000, // 3 minutes
        theme: 'clinical',
        showTitle: true,
        allowReordering: true,
      },
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }

  static createFinancialDashboard(
    id: string,
    userId: string,
    name: string,
    clinicId?: string,
    workspaceId?: string
  ): Dashboard {
    return new Dashboard(
      id,
      userId,
      name,
      'financial',
      'grid',
      false,
      false,
      [],
      {
        columns: 4,
        autoRefresh: true,
        refreshInterval: 600000, // 10 minutes
        theme: 'financial',
        showTitle: true,
        allowReordering: true,
      },
      new Date(),
      new Date(),
      clinicId,
      workspaceId
    );
  }
}