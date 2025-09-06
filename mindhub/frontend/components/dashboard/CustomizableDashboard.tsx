'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Squares2X2Icon,
  Cog6ToothIcon,
  XMarkIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  resizable?: boolean;
  removable?: boolean;
  configurable?: boolean;
  props?: any;
}

/**
 * Widget instance with position and size
 */
export interface WidgetInstance {
  id: string;
  configId: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  isExpanded?: boolean;
  customProps?: any;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  columns: number;
  rowHeight: number;
}

interface CustomizableDashboardProps {
  availableWidgets: WidgetConfig[];
  defaultLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onSaveLayout?: (layout: DashboardLayout) => Promise<void>;
  editable?: boolean;
  className?: string;
}

/**
 * Customizable dashboard with draggable and resizable widgets
 */
export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  availableWidgets,
  defaultLayout,
  onLayoutChange,
  onSaveLayout,
  editable = true,
  className = ''
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(
    defaultLayout || {
      id: 'default',
      name: 'Mi Dashboard',
      widgets: [],
      columns: 12,
      rowHeight: 80
    }
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid size
  useEffect(() => {
    const updateGridSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setGridSize({
          width: rect.width / layout.columns,
          height: layout.rowHeight
        });
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, [layout.columns, layout.rowHeight]);

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setLayout(parsed);
      } catch (error) {
        console.error('Failed to load saved layout:', error);
      }
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = async () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    await onSaveLayout?.(layout);
  };

  // Handle widget drag start
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle widget drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle widget drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - dragOffset.x) / gridSize.width);
    const y = Math.round((e.clientY - rect.top - dragOffset.y) / gridSize.height);

    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === draggedWidget
        ? { ...widget, position: { x: Math.max(0, x), y: Math.max(0, y) } }
        : widget
    );

    setLayout({ ...layout, widgets: updatedWidgets });
    setDraggedWidget(null);
    onLayoutChange?.({ ...layout, widgets: updatedWidgets });
  };

  // Add new widget
  const addWidget = (configId: string) => {
    const config = availableWidgets.find(w => w.id === configId);
    if (!config) return;

    const newWidget: WidgetInstance = {
      id: `widget-${Date.now()}`,
      configId,
      position: { x: 0, y: 0 },
      size: config.defaultSize
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget]
    };

    setLayout(updatedLayout);
    onLayoutChange?.(updatedLayout);
    setShowWidgetPicker(false);
  };

  // Remove widget
  const removeWidget = (widgetId: string) => {
    const updatedWidgets = layout.widgets.filter(w => w.id !== widgetId);
    const updatedLayout = { ...layout, widgets: updatedWidgets };
    setLayout(updatedLayout);
    onLayoutChange?.(updatedLayout);
  };

  // Toggle widget expansion
  const toggleWidgetExpansion = (widgetId: string) => {
    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, isExpanded: !widget.isExpanded }
        : widget
    );
    setLayout({ ...layout, widgets: updatedWidgets });
  };

  // Resize widget
  const resizeWidget = (widgetId: string, newSize: { w: number; h: number }) => {
    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, size: newSize }
        : widget
    );
    setLayout({ ...layout, widgets: updatedWidgets });
    onLayoutChange?.({ ...layout, widgets: updatedWidgets });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Dashboard controls */}
      {editable && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{layout.name}</h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetPicker(true)}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Agregar Widget
            </Button>
            
            <Button
              variant={isEditMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
            >
              {isEditMode ? 'Terminar Edición' : 'Editar Dashboard'}
            </Button>
            
            {isEditMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={saveLayout}
              >
                Guardar Diseño
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Widget grid */}
      <div
        ref={containerRef}
        className={cn(
          'relative min-h-[600px] bg-gray-50 rounded-lg',
          isEditMode && 'bg-grid-pattern'
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {layout.widgets.map(widget => {
          const config = availableWidgets.find(w => w.id === widget.configId);
          if (!config) return null;

          const WidgetComponent = config.component;
          const widgetStyle = {
            position: 'absolute' as const,
            left: widget.position.x * gridSize.width,
            top: widget.position.y * gridSize.height,
            width: widget.isExpanded 
              ? '100%' 
              : widget.size.w * gridSize.width,
            height: widget.isExpanded
              ? 'auto'
              : widget.size.h * gridSize.height,
            minHeight: widget.size.h * gridSize.height,
            transition: 'all 0.3s ease',
            zIndex: widget.isExpanded ? 10 : 1
          };

          return (
            <div
              key={widget.id}
              style={widgetStyle}
              className={cn(
                'p-2',
                isEditMode && 'cursor-move hover:shadow-lg',
                widget.isExpanded && 'p-4'
              )}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
            >
              <Card 
                className="h-full relative group"
                variant={widget.isExpanded ? 'elevated' : 'default'}
              >
                {/* Widget header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">
                    {config.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {config.resizable && (
                      <button
                        onClick={() => toggleWidgetExpansion(widget.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        aria-label={widget.isExpanded ? 'Contraer' : 'Expandir'}
                      >
                        {widget.isExpanded ? (
                          <ArrowsPointingInIcon className="h-4 w-4" />
                        ) : (
                          <ArrowsPointingOutIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    
                    {isEditMode && config.removable && (
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                        aria-label="Eliminar widget"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Widget content */}
                <div className="p-3 overflow-auto h-[calc(100%-50px)]">
                  <WidgetComponent 
                    {...config.props} 
                    {...widget.customProps}
                    isExpanded={widget.isExpanded}
                  />
                </div>

                {/* Resize handle */}
                {isEditMode && config.resizable && !widget.isExpanded && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400 opacity-0 group-hover:opacity-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // Implement resize logic here
                    }}
                  />
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* Widget picker modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agregar Widget</h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]">
              {availableWidgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                >
                  <h4 className="font-medium text-gray-900">{widget.title}</h4>
                  {widget.description && (
                    <p className="mt-1 text-sm text-gray-600">{widget.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add CSS for grid pattern
const gridPatternCSS = `
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gridPatternCSS;
  document.head.appendChild(style);
}