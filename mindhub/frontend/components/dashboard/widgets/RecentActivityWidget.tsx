'use client';

import { 
  ClockIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { useUserMetrics } from '@/contexts/UserMetricsContext';

export function RecentActivityWidget() {
  const { preferences } = useUserMetrics();

  // Mock recent activities based on user metrics
  const getRecentActivities = () => {
    const activities = [];
    
    if (preferences.metrics.patientsAdded > 0) {
      activities.push({
        id: 1,
        type: 'patient',
        title: 'Nuevo paciente registrado',
        description: 'Paciente agregado al sistema',
        time: '2 horas',
        icon: UserPlusIcon,
        color: 'text-blue-600'
      });
    }
    
    if (preferences.metrics.scalesApplied > 0) {
      activities.push({
        id: 2,
        type: 'scale',
        title: 'Escala clínica aplicada',
        description: preferences.metrics.favoriteScales[0] || 'Evaluación completada',
        time: '4 horas',
        icon: ClipboardDocumentListIcon,
        color: 'text-purple-600'
      });
    }
    
    if (preferences.metrics.formsCreated > 0) {
      activities.push({
        id: 3,
        type: 'form',
        title: 'Formulario creado',
        description: preferences.metrics.mostUsedForms[0] || 'Nuevo formulario',
        time: '1 día',
        icon: DocumentTextIcon,
        color: 'text-emerald-600'
      });
    }
    
    if (preferences.metrics.resourcesUploaded > 0) {
      activities.push({
        id: 4,
        type: 'resource',
        title: 'Recurso compartido',
        description: preferences.metrics.mostUsedResources[0] || 'Material psicoeducativo',
        time: '2 días',
        icon: BookOpenIcon,
        color: 'text-orange-600'
      });
    }
    
    return activities.slice(0, 4);
  };

  const activities = getRecentActivities();

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ClockIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
      </div>
      
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400">
                hace {activity.time}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay actividad reciente</p>
          </div>
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver toda la actividad
          </button>
        </div>
      )}
    </Card>
  );
}