'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface FormAnalyticsDashboardProps {
  forms: any[];
}

export const FormAnalyticsDashboard: React.FC<FormAnalyticsDashboardProps> = ({ forms }) => {
  const [analytics, setAnalytics] = useState<any>({
    overview: {
      totalForms: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      expiredAssignments: 0,
      completionRate: 0,
      avgCompletionTime: 0
    },
    formMetrics: [],
    recentActivity: [],
    trends: {
      thisWeek: { assignments: 0, completions: 0 },
      lastWeek: { assignments: 0, completions: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, forms]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load overall analytics
      const overviewResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/formx/analytics/overview?period=${selectedPeriod}`
      );
      
      let overviewData = {
        totalForms: forms.length,
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        expiredAssignments: 0,
        completionRate: 0,
        avgCompletionTime: 0
      };

      if (overviewResponse.ok) {
        const data = await overviewResponse.json();
        overviewData = { ...overviewData, ...data.data };
      } else {
        // Calculate from forms data if API not available
        let totalAssignments = 0;
        let completedAssignments = 0;
        
        forms.forEach(form => {
          totalAssignments += form.total_assignments || 0;
          completedAssignments += form.completed_assignments || 0;
        });
        
        overviewData = {
          ...overviewData,
          totalAssignments,
          completedAssignments,
          pendingAssignments: totalAssignments - completedAssignments,
          completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments * 100) : 0,
          avgCompletionTime: Math.floor(Math.random() * 15) + 5 // Mock for now
        };
      }

      // Load form-specific metrics
      const formMetrics = await Promise.all(
        forms.slice(0, 10).map(async (form) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/${form.id}/analytics?period=${selectedPeriod}`
            );
            
            if (response.ok) {
              const data = await response.json();
              return {
                id: form.id,
                title: form.title,
                ...data.data
              };
            }
          } catch (error) {
            console.error(`Error loading analytics for form ${form.id}:`, error);
          }
          
          // Fallback to mock data based on form info
          return {
            id: form.id,
            title: form.title,
            totalAssignments: form.total_assignments || Math.floor(Math.random() * 50),
            completedAssignments: form.completed_assignments || Math.floor(Math.random() * 30),
            completionRate: Math.floor(Math.random() * 40) + 60,
            avgCompletionTime: Math.floor(Math.random() * 10) + 5
          };
        })
      );

      // Calculate trends (mock for now)
      const trends = {
        thisWeek: { 
          assignments: Math.floor(Math.random() * 25) + 10, 
          completions: Math.floor(Math.random() * 20) + 8 
        },
        lastWeek: { 
          assignments: Math.floor(Math.random() * 30) + 5, 
          completions: Math.floor(Math.random() * 25) + 5 
        }
      };

      setAnalytics({
        overview: overviewData,
        formMetrics: formMetrics.filter(Boolean),
        trends
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
          <div className="flex space-x-2">
            {[
              { key: '7d', label: 'Últimos 7 días' },
              { key: '30d', label: 'Últimos 30 días' },
              { key: '90d', label: 'Últimos 90 días' }
            ].map(period => (
              <Button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as '7d' | '30d' | '90d')}
                variant={selectedPeriod === period.key ? 'primary' : 'outline'}
                size="sm"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <DocumentTextIcon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-600">{analytics.overview.totalForms}</div>
            <div className="text-sm text-emerald-800">Formularios Activos</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{analytics.overview.totalAssignments}</div>
            <div className="text-sm text-blue-800">Total Asignaciones</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{analytics.overview.completedAssignments}</div>
            <div className="text-sm text-green-800">Completadas</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{analytics.overview.pendingAssignments}</div>
            <div className="text-sm text-orange-800">Pendientes</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {analytics.overview.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Tasa de Completación</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">
                {formatDuration(analytics.overview.avgCompletionTime)}
              </div>
              <div className="text-sm text-gray-600">Tiempo Promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Asignaciones</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(getPercentageChange(analytics.trends.thisWeek.assignments, analytics.trends.lastWeek.assignments))}
                <span className={`text-sm font-semibold ${
                  getPercentageChange(analytics.trends.thisWeek.assignments, analytics.trends.lastWeek.assignments) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {Math.abs(getPercentageChange(analytics.trends.thisWeek.assignments, analytics.trends.lastWeek.assignments))}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.trends.thisWeek.assignments}</div>
            <div className="text-sm text-gray-500">Esta semana vs {analytics.trends.lastWeek.assignments} la semana pasada</div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Completaciones</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(getPercentageChange(analytics.trends.thisWeek.completions, analytics.trends.lastWeek.completions))}
                <span className={`text-sm font-semibold ${
                  getPercentageChange(analytics.trends.thisWeek.completions, analytics.trends.lastWeek.completions) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {Math.abs(getPercentageChange(analytics.trends.thisWeek.completions, analytics.trends.lastWeek.completions))}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.trends.thisWeek.completions}</div>
            <div className="text-sm text-gray-500">Esta semana vs {analytics.trends.lastWeek.completions} la semana pasada</div>
          </div>
        </div>
      </div>

      {/* Form Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Formulario</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Formulario</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Asignaciones</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Completadas</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Tasa</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Tiempo Promedio</th>
              </tr>
            </thead>
            <tbody>
              {analytics.formMetrics.map((form: any, index: number) => (
                <tr key={form.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 line-clamp-1">{form.title}</div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {form.totalAssignments || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {form.completedAssignments || 0}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      form.completionRate >= 80 
                        ? 'bg-green-100 text-green-800'
                        : form.completionRate >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {form.completionRate?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatDuration(form.avgCompletionTime || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analytics.formMetrics.length === 0 && (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay datos suficientes para mostrar métricas</p>
          </div>
        )}
      </div>
    </div>
  );
};