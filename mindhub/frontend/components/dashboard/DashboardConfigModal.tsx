'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface DashboardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onReset: () => void;
}

export function DashboardConfigModal({
  isOpen,
  onClose,
  widgets,
  onWidgetsChange,
  onReset
}: DashboardConfigModalProps) {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [activeTab, setActiveTab] = useState<'all' | 'visible' | 'hidden'>('all');

  if (!isOpen) return null;

  const handleToggleVisibility = (widgetId: string) => {
    const newWidgets = localWidgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, isVisible: !widget.isVisible }
        : widget
    );
    setLocalWidgets(newWidgets);
  };

  const handleMoveUp = (widgetId: string) => {
    const currentIndex = localWidgets.findIndex(w => w.id === widgetId);
    if (currentIndex > 0) {
      const newWidgets = [...localWidgets];
      [newWidgets[currentIndex - 1], newWidgets[currentIndex]] = 
      [newWidgets[currentIndex], newWidgets[currentIndex - 1]];
      
      // Update order values
      const updatedWidgets = newWidgets.map((widget, index) => ({
        ...widget,
        order: index
      }));
      setLocalWidgets(updatedWidgets);
    }
  };

  const handleMoveDown = (widgetId: string) => {
    const currentIndex = localWidgets.findIndex(w => w.id === widgetId);
    if (currentIndex < localWidgets.length - 1) {
      const newWidgets = [...localWidgets];
      [newWidgets[currentIndex], newWidgets[currentIndex + 1]] = 
      [newWidgets[currentIndex + 1], newWidgets[currentIndex]];
      
      // Update order values
      const updatedWidgets = newWidgets.map((widget, index) => ({
        ...widget,
        order: index
      }));
      setLocalWidgets(updatedWidgets);
    }
  };

  const handleSave = () => {
    onWidgetsChange(localWidgets);
    onClose();
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que deseas resetear la configuración del dashboard a los valores por defecto?')) {
      onReset();
      onClose();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      stats: 'bg-blue-100 text-blue-800',
      patients: 'bg-green-100 text-green-800',
      analytics: 'bg-purple-100 text-purple-800',
      clinical: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return '□';
      case 'medium': return '▢';
      case 'large': return '■';
      default: return '▢';
    }
  };

  const filteredWidgets = localWidgets.filter(widget => {
    switch (activeTab) {
      case 'visible': return widget.isVisible;
      case 'hidden': return !widget.isVisible;
      default: return true;
    }
  }).sort((a, b) => a.order - b.order);

  const visibleCount = localWidgets.filter(w => w.isVisible).length;
  const totalCount = localWidgets.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="h-6 w-6" />
              Configurar Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Personaliza qué widgets mostrar y en qué orden
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                <span className="font-medium text-green-600">{visibleCount}</span> visibles de <span className="font-medium">{totalCount}</span> widgets
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex border-b">
            {[
              { id: 'all', label: 'Todos', count: totalCount },
              { id: 'visible', label: 'Visibles', count: visibleCount },
              { id: 'hidden', label: 'Ocultos', count: totalCount - visibleCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {filteredWidgets.map((widget, index) => (
              <div
                key={widget.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  widget.isVisible 
                    ? 'bg-white border-gray-200 shadow-sm' 
                    : 'bg-gray-50 border-gray-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg" title={`Tamaño: ${widget.size}`}>
                        {getSizeIcon(widget.size)}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">{widget.name}</h3>
                        <p className="text-sm text-gray-600">{widget.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className={cn("text-xs", getCategoryColor(widget.category))}
                      >
                        {widget.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Orden: #{widget.order + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Move Up/Down */}
                    <div className="flex flex-col">
                      <Button
                        onClick={() => handleMoveUp(widget.id)}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUpIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleMoveDown(widget.id)}
                        disabled={index === filteredWidgets.length - 1}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDownIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <Button
                      onClick={() => handleToggleVisibility(widget.id)}
                      variant={widget.isVisible ? "primary" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {widget.isVisible ? (
                        <>
                          <EyeIcon className="h-4 w-4" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="h-4 w-4" />
                          Oculto
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button onClick={handleReset} variant="outline">
            Resetear a valores por defecto
          </Button>
          
          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="ghost">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4" />
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}