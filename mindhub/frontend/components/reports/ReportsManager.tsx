/**
 * Reports Dashboard with Draggable Widgets - MindHub
 * Implementa funcionalidad de widgets arrastrables y análisis de datos
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Interfaces
interface WidgetData {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'gauge';
  data: any;
  position: number;
  size: 'small' | 'medium' | 'large';
}

interface ReportsData {
  totalEvaluations: number;
  evaluationsThisMonth: number;
  mostUsedScales: Array<{ name: string; count: number; percentage: number }>;
  averageCompletionTime: string;
  patientDemographics: {
    totalPatients: number;
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
  };
  scaleStatistics: Array<{
    scale: string;
    totalApplications: number;
    averageScore: number;
    completionRate: number;
  }>;
  alertsSummary: {
    criticalAlerts: number;
    moderateAlerts: number;
    mildAlerts: number;
  };
}

// Datos mock para desarrollo
const mockReportsData: ReportsData = {
  totalEvaluations: 1247,
  evaluationsThisMonth: 89,
  mostUsedScales: [
    { name: 'PHQ-9', count: 456, percentage: 36.6 },
    { name: 'SLUMS', count: 234, percentage: 18.8 },
    { name: 'AQ-Adolescent', count: 198, percentage: 15.9 },
    { name: 'PAS', count: 167, percentage: 13.4 },
    { name: 'GAD-7', count: 192, percentage: 15.4 }
  ],
  averageCompletionTime: '8.5 min',
  patientDemographics: {
    totalPatients: 342,
    ageGroups: [
      { range: '18-25', count: 67, percentage: 19.6 },
      { range: '26-35', count: 89, percentage: 26.0 },
      { range: '36-50', count: 98, percentage: 28.7 },
      { range: '51-65', count: 67, percentage: 19.6 },
      { range: '65+', count: 21, percentage: 6.1 }
    ],
    genderDistribution: [
      { gender: 'Femenino', count: 198, percentage: 57.9 },
      { gender: 'Masculino', count: 134, percentage: 39.2 },
      { gender: 'Otro', count: 10, percentage: 2.9 }
    ]
  },
  scaleStatistics: [
    { scale: 'PHQ-9', totalApplications: 456, averageScore: 12.4, completionRate: 94.5 },
    { scale: 'SLUMS', totalApplications: 234, averageScore: 23.8, completionRate: 89.2 },
    { scale: 'AQ-Adolescent', totalApplications: 198, averageScore: 28.3, completionRate: 92.1 },
    { scale: 'PAS', totalApplications: 167, averageScore: 15.7, completionRate: 96.8 }
  ],
  alertsSummary: {
    criticalAlerts: 12,
    moderateAlerts: 34,
    mildAlerts: 78
  }
};

// Configuración inicial de widgets
const initialWidgets: WidgetData[] = [
  {
    id: 'total-evaluations',
    title: 'Evaluaciones Totales',
    type: 'metric',
    data: { value: 1247, change: '+12%', trend: 'up' },
    position: 0,
    size: 'medium'
  },
  {
    id: 'monthly-evaluations',
    title: 'Evaluaciones Este Mes',
    type: 'metric', 
    data: { value: 89, change: '+5%', trend: 'up' },
    position: 1,
    size: 'medium'
  },
  {
    id: 'completion-time',
    title: 'Tiempo Promedio',
    type: 'metric',
    data: { value: '8.5 min', change: '-2%', trend: 'down' },
    position: 2,
    size: 'medium'
  },
  {
    id: 'active-alerts',
    title: 'Alertas Activas',
    type: 'metric',
    data: { value: 124, change: '+8%', trend: 'up' },
    position: 3,
    size: 'medium'
  },
  {
    id: 'most-used-scales',
    title: 'Escalas Más Utilizadas',
    type: 'chart',
    data: mockReportsData.mostUsedScales,
    position: 4,
    size: 'large'
  },
  {
    id: 'demographics',
    title: 'Demografía de Pacientes',
    type: 'chart',
    data: mockReportsData.patientDemographics,
    position: 5,
    size: 'large'
  },
  {
    id: 'scale-performance',
    title: 'Rendimiento por Escala',
    type: 'list',
    data: mockReportsData.scaleStatistics,
    position: 6,
    size: 'large'
  },
  {
    id: 'alerts-summary',
    title: 'Resumen de Alertas',
    type: 'gauge',
    data: mockReportsData.alertsSummary,
    position: 7,
    size: 'medium'
  }
];

// Componente Widget individual
const Widget: React.FC<{ widget: WidgetData; isDragging: boolean }> = ({ widget, isDragging }) => {
  const renderContent = () => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {widget.data.value}
            </div>
            <div className={`text-sm ${widget.data.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {widget.data.change} vs mes anterior
            </div>
          </div>
        );
      
      case 'chart':
        if (widget.id === 'most-used-scales') {
          return (
            <div>
              <div className="space-y-3">
                {widget.data.slice(0, 5).map((scale: any, index: number) => (
                  <div key={scale.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{scale.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${scale.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{scale.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        } else if (widget.id === 'demographics') {
          return (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Por Edad</h4>
                {widget.data.ageGroups.slice(0, 3).map((group: any) => (
                  <div key={group.range} className="flex justify-between text-xs">
                    <span>{group.range}</span>
                    <span>{group.percentage}%</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Por Género</h4>
                {widget.data.genderDistribution.map((gender: any) => (
                  <div key={gender.gender} className="flex justify-between text-xs">
                    <span>{gender.gender}</span>
                    <span>{gender.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        break;
      
      case 'list':
        return (
          <div className="space-y-2">
            {widget.data.slice(0, 4).map((item: any) => (
              <div key={item.scale} className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.scale}</span>
                <div className="flex space-x-2 text-xs text-gray-500">
                  <span>{item.totalApplications}</span>
                  <span>{item.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'gauge':
        const total = widget.data.criticalAlerts + widget.data.moderateAlerts + widget.data.mildAlerts;
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">{total}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-red-600">
                <div className="font-bold">{widget.data.criticalAlerts}</div>
                <div>Críticas</div>
              </div>
              <div className="text-orange-600">
                <div className="font-bold">{widget.data.moderateAlerts}</div>
                <div>Moderadas</div>
              </div>
              <div className="text-yellow-600">
                <div className="font-bold">{widget.data.mildAlerts}</div>
                <div>Leves</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Widget no disponible</div>;
    }
  };

  const getWidgetSize = () => {
    switch (widget.size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-1';
      case 'large': return 'col-span-1 md:col-span-2';
      default: return 'col-span-1';
    }
  };

  return (
    <div 
      className={`
        ${getWidgetSize()}
        bg-white rounded-lg p-6 shadow-sm border border-gray-200 
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:shadow-md'}
        transition-all duration-200
      `}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{widget.title}</h3>
      {renderContent()}
    </div>
  );
};

// Componente principal del Manager de Reportes
export const ReportsManager: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetData[]>(initialWidgets);
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [period, setPeriod] = useState('month');
  const [reportsData, setReportsData] = useState<ReportsData>(mockReportsData);

  // Cargar datos de reportes
  useEffect(() => {
    loadReportsData();
  }, [period]);

  const loadReportsData = async () => {
    try {
      // Simular carga de datos reales
      // En producción, esto sería una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 500));
      setReportsData(mockReportsData);
    } catch (error) {
      console.error('Error loading reports data:', error);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar posiciones
    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      position: index
    }));

    setWidgets(updatedWidgets);
    
    // Guardar layout en localStorage
    localStorage.setItem('reportsWidgetLayout', JSON.stringify(updatedWidgets));
  };

  const toggleArrangeMode = () => {
    setIsArrangeMode(!isArrangeMode);
  };

  const exportReport = () => {
    // Implementar exportación de reportes
    console.log('Exporting report...');
    // Aquí iría la lógica para generar PDF o Excel
  };

  const resetLayout = () => {
    setWidgets(initialWidgets);
    localStorage.removeItem('reportsWidgetLayout');
  };

  // Cargar layout guardado al montar el componente
  useEffect(() => {
    const savedLayout = localStorage.getItem('reportsWidgetLayout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setWidgets(parsedLayout);
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes y Análisis"
        description="Dashboard completo de estadísticas y métricas del sistema MindHub"
        icon={ChartBarIcon}
        iconColor="text-blue-600"
        actions={[
          <select
            key="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>,
          
          <button
            key="arrange"
            onClick={toggleArrangeMode}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isArrangeMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isArrangeMode ? (
              <>
                <i className="fas fa-save mr-2"></i>
                Guardar Acomodo
              </>
            ) : (
              <>
                <i className="fas fa-arrows-alt mr-2"></i>
                Acomodar Widgets
              </>
            )}
          </button>,
          
          <button
            key="reset"
            onClick={resetLayout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Restablecer
          </button>,
          
          <button
            key="export"
            onClick={exportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-download mr-2"></i>
            Exportar
          </button>
        ]}
      />

      {/* Widgets Container */}
      {isArrangeMode ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets-container">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {widgets
                  .sort((a, b) => a.position - b.position)
                  .map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Widget widget={widget} isDragging={snapshot.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgets
            .sort((a, b) => a.position - b.position)
            .map((widget) => (
              <Widget key={widget.id} widget={widget} isDragging={false} />
            ))}
        </div>
      )}

      {/* Arrange Mode Info */}
      {isArrangeMode && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-info-circle text-blue-600 mr-2"></i>
            <span className="text-blue-800 text-sm">
              Modo de edición activado. Arrastra los widgets para reorganizarlos y luego haz clic en "Guardar Acomodo".
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;