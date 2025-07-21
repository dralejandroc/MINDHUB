'use client';

import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  BookOpenIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { useUserMetrics } from '@/contexts/UserMetricsContext';

export function QuickStatsWidget() {
  const { preferences } = useUserMetrics();

  const stats = [
    {
      label: 'Pacientes',
      value: preferences.metrics.patientsAdded,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      growth: '+2 esta semana'
    },
    {
      label: 'Escalas',
      value: preferences.metrics.scalesApplied,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      growth: '+5 este mes'
    },
    {
      label: 'Formularios',
      value: preferences.metrics.formsCreated,
      icon: DocumentTextIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      growth: '+1 este mes'
    },
    {
      label: 'Recursos',
      value: preferences.metrics.resourcesUploaded,
      icon: BookOpenIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      growth: '+3 este mes'
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ChartBarIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Estadísticas Rápidas</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">{stat.growth}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total de sesiones</span>
          <span className="font-semibold text-gray-900">{preferences.metrics.loginCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Último acceso</span>
          <span className="text-gray-500">
            {new Date(preferences.metrics.lastLogin).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
}