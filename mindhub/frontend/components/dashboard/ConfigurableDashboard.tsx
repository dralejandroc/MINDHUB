'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { 
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import { DashboardConfigModal } from './DashboardConfigModal';
import { SortableWidget } from './SortableWidget';

// Import all available widgets
import { QuickStatsWidget } from './widgets/QuickStatsWidget';
import { FavoriteScalesWidget } from './widgets/FavoriteScalesWidget';
import { FollowupPatientsWidget } from './widgets/FollowupPatientsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import PatientClassificationWidget from './widgets/PatientClassificationWidget';
import SatisfactionSurveyWidget from './widgets/SatisfactionSurveyWidget';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large';
  category: 'stats' | 'patients' | 'analytics' | 'clinical';
  isVisible: boolean;
  order: number;
  props?: any;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'quick-stats',
    name: 'Estadísticas Rápidas',
    description: 'Métricas principales de la clínica',
    component: QuickStatsWidget,
    size: 'large',
    category: 'stats',
    isVisible: true,
    order: 0
  },
  {
    id: 'analytics-indicators',
    name: 'Indicadores de Rendimiento',
    description: 'KPIs y métricas avanzadas',
    component: AnalyticsWidget,
    size: 'large',
    category: 'analytics',
    isVisible: true,
    order: 1
  },
  {
    id: 'patient-classification',
    name: 'Clasificación de Pacientes',
    description: 'Distribución por nivel de integración',
    component: PatientClassificationWidget,
    size: 'medium',
    category: 'patients',
    isVisible: true,
    order: 2
  },
  {
    id: 'favorite-scales',
    name: 'Escalas Favoritas',
    description: 'Acceso rápido a evaluaciones',
    component: FavoriteScalesWidget,
    size: 'medium',
    category: 'clinical',
    isVisible: true,
    order: 3
  },
  {
    id: 'followup-patients',
    name: 'Pacientes en Seguimiento',
    description: 'Lista de seguimientos pendientes',
    component: FollowupPatientsWidget,
    size: 'medium',
    category: 'patients',
    isVisible: true,
    order: 4
  },
  {
    id: 'recent-activity',
    name: 'Actividad Reciente',
    description: 'Últimas acciones realizadas',
    component: RecentActivityWidget,
    size: 'medium',
    category: 'stats',
    isVisible: true,
    order: 5
  },
  {
    id: 'satisfaction-survey',
    name: 'Encuestas de Satisfacción',
    description: 'Feedback de pacientes',
    component: SatisfactionSurveyWidget,
    size: 'medium',
    category: 'analytics',
    isVisible: false,
    order: 6
  }
];

export function ConfigurableDashboard() {
  const { preferences, updateDashboardConfig, realDashboardData } = useUserMetrics();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const quickActions = [
    { 
      name: 'Nuevo Paciente', 
      path: '/hubs/expedix?action=new-patient', 
      icon: PlusIcon, 
      color: 'bg-blue-600 hover:bg-blue-700' 
    },
    { 
      name: 'Nueva Evaluación', 
      path: '/hubs/clinimetrix', 
      icon: ClipboardDocumentListIcon, 
      color: 'bg-purple-600 hover:bg-purple-700' 
    },
    { 
      name: 'Crear Formulario', 
      path: '/hubs/formx?action=new-form', 
      icon: DocumentTextIcon, 
      color: 'bg-emerald-600 hover:bg-emerald-700' 
    },
    { 
      name: 'Agenda', 
      path: '/hubs/agenda', 
      icon: CalendarIcon, 
      color: 'bg-indigo-600 hover:bg-indigo-700' 
    }
  ];
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved widget configuration from Django API
  useEffect(() => {
    const loadWidgetConfig = async () => {
      try {
        const response = await fetch('/api/accounts/django/dashboard-config/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.widgets) {
            // Merge with default widgets to ensure all widgets exist
            const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
              const savedWidget = data.widgets.find((w: WidgetConfig) => w.id === defaultWidget.id);
              return savedWidget ? { ...defaultWidget, ...savedWidget, component: defaultWidget.component } : defaultWidget;
            });
            setWidgets(mergedWidgets);
          } else {
            setWidgets(DEFAULT_WIDGETS);
          }
        } else {
          console.log('No saved widget configuration found, using defaults');
          setWidgets(DEFAULT_WIDGETS);
        }
      } catch (error) {
        console.error('Error loading widget configuration:', error);
        setWidgets(DEFAULT_WIDGETS);
      }
    };
    
    loadWidgetConfig();
  }, []);

  // Save widget configuration whenever it changes
  const saveWidgetConfig = async (newWidgets: WidgetConfig[]) => {
    const configToSave = newWidgets.map(({ component, ...widget }) => widget);
    
    try {
      const response = await fetch('/api/accounts/django/dashboard-config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgets: configToSave,
          config_type: 'dashboard_widgets'
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save widget configuration');
      }
    } catch (error) {
      console.error('Error saving widget configuration:', error);
    }
    
    setWidgets(newWidgets);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = widgets.findIndex((widget) => widget.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = [...widgets];
        const [reorderedWidget] = newWidgets.splice(oldIndex, 1);
        newWidgets.splice(newIndex, 0, reorderedWidget);
        
        // Update order values
        const updatedWidgets = newWidgets.map((widget, index) => ({ 
          ...widget, 
          order: index 
        }));
        
        saveWidgetConfig(updatedWidgets);
      }
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, isVisible: !widget.isVisible }
        : widget
    );
    saveWidgetConfig(newWidgets);
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch('/api/accounts/django/dashboard-config/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config_type: 'dashboard_widgets'
        })
      });
      
      if (!response.ok) {
        console.error('Failed to reset widget configuration');
      }
    } catch (error) {
      console.error('Error resetting widget configuration:', error);
    }
    
    setWidgets(DEFAULT_WIDGETS);
  };

  const visibleWidgets = widgets
    .filter(widget => widget.isVisible)
    .sort((a, b) => a.order - b.order);

  const getGridClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 lg:col-span-2';
      case 'large':
        return 'col-span-1 lg:col-span-4';
      default:
        return 'col-span-1 lg:col-span-2';
    }
  };

  const categoryColors = {
    stats: 'border-blue-200 bg-blue-50/50',
    patients: 'border-green-200 bg-green-50/50',
    analytics: 'border-purple-200 bg-purple-50/50',
    clinical: 'border-orange-200 bg-orange-50/50'
  };

  return (
    <div className="space-y-6 bg-theme-primary text-theme-primary">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Dashboard</h1>
          <p className="text-sm text-theme-secondary mt-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • 
            Personaliza tu vista en configuración
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-theme-muted">
            {visibleWidgets.length} de {widgets.length} widgets visibles
          </div>
          
          <Button
            onClick={() => setShowConfigModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.path}>
            <Button className={`w-full h-20 ${action.color} text-white flex flex-col items-center justify-center space-y-2`}>
              <action.icon className="h-6 w-6" />
              <span className="text-sm">{action.name}</span>
            </Button>
          </Link>
        ))}
      </div>

      {/* Quick Toggle Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-3">Vista rápida:</span>
          {widgets.map(widget => (
            <Button
              key={widget.id}
              onClick={() => toggleWidgetVisibility(widget.id)}
              variant={widget.isVisible ? "primary" : "outline"}
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              {widget.isVisible ? (
                <EyeIcon className="h-3 w-3" />
              ) : (
                <EyeSlashIcon className="h-3 w-3" />
              )}
              {widget.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Draggable Widgets Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext 
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {visibleWidgets.map((widget) => {
              const WidgetComponent = widget.component;
              return (
                <SortableWidget 
                  key={widget.id}
                  id={widget.id}
                  className={`${getGridClass(widget.size)} ${categoryColors[widget.category] || ''}`}
                >
                  <div className="h-full">
                    <WidgetComponent 
                      title={widget.name}
                      description={widget.description}
                      {...(widget.props || {})}
                    />
                  </div>
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No hay widgets visibles</h3>
              <p className="text-gray-600 mt-1">
                Configura tu dashboard para mostrar la información más importante para ti
              </p>
            </div>
            <Button onClick={() => setShowConfigModal(true)}>
              Configurar Dashboard
            </Button>
          </div>
        </Card>
      )}

      {/* Hub Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/hubs/expedix">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Expedix</h3>
              <p className="text-xs text-gray-600">Gestión de Pacientes</p>
            </div>
          </Card>
        </Link>

        <Link href="/hubs/clinimetrix">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Clinimetrix</h3>
              <p className="text-xs text-gray-600">Evaluación Clínica</p>
            </div>
          </Card>
        </Link>

        <Link href="/hubs/formx">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center">
              <DocumentTextIcon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">FormX</h3>
              <p className="text-xs text-gray-600">Constructor de Formularios</p>
            </div>
          </Card>
        </Link>

        <Link href="/hubs/resources">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center">
              <BookOpenIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Recursos</h3>
              <p className="text-xs text-gray-600">Biblioteca Digital</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Configuration Modal */}
      <DashboardConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        widgets={widgets}
        onWidgetsChange={saveWidgetConfig}
        onReset={resetToDefaults}
      />
    </div>
  );
}