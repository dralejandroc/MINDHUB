'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { dashboardDataService } from '@/lib/dashboard-data-service';

// Types for dashboard data
interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  pendingAssessments: number;
  completedAssessmentsToday: number;
  scheduledAppointments: number;
}

interface RecentActivity {
  id: string;
  type: 'assessment' | 'consultation' | 'patient_registration';
  description: string;
  timestamp: Date;
  patientName: string;
  status: 'completed' | 'pending' | 'in_progress';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color: string;
  hub: 'expedix' | 'clinimetrix' | 'formx' | 'resources';
}

interface MainDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization?: string;
  };
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ user }) => {
  const { getToken } = useAuth();
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHub, setSelectedHub] = useState<string>('all');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get Clerk auth token
      const token = await getToken();
      
      // Use the fixed dashboard data service instead of broken proxy routes
      const dashboardData = await dashboardDataService.fetchDashboardData(user.id, token);
      
      // Convert dashboard data to component format
      setStats({
        totalPatients: dashboardData.totalPatients,
        activePatients: dashboardData.totalPatients, // Assume all are active for now
        pendingAssessments: Math.max(0, dashboardData.totalScaleApplications - dashboardData.weeklyStats.assessments),
        completedAssessmentsToday: dashboardData.weeklyStats.assessments,
        scheduledAppointments: dashboardData.weeklyStats.consultations,
      });
      
      // Convert recent activity to component format
      const recentActivityFormatted = dashboardData.recentActivity.map((activity, index) => ({
        id: `activity-${index}`,
        type: activity.type as 'assessment' | 'consultation' | 'patient_registration',
        description: activity.description,
        timestamp: new Date(activity.timestamp),
        patientName: 'Unknown', // Extract from description if needed
        status: 'completed' as const,
      }));
      
      setRecentActivity(recentActivityFormatted);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setStats({
        totalPatients: 0,
        activePatients: 0,
        pendingAssessments: 0,
        completedAssessmentsToday: 0,
        scheduledAppointments: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  // Define quick actions for each hub
  const quickActions: QuickAction[] = [
    {
      id: 'new_patient',
      title: 'Nuevo Paciente',
      description: 'Registrar un nuevo paciente en el sistema',
      icon: UserGroupIcon,
      action: () => window.location.href = '/expedix/patients/new',
      color: 'bg-gradient-to-r from-expedix-500 to-expedix-600',
      hub: 'expedix'
    },
    {
      id: 'apply_scale',
      title: 'Aplicar Escala',
      description: 'Administrar una evaluación psicológica',
      icon: ClipboardDocumentCheckIcon,
      action: () => window.location.href = '/clinimetrix/assessments/new',
      color: 'bg-gradient-to-r from-clinimetrix-500 to-clinimetrix-600',
      hub: 'clinimetrix'
    },
    {
      id: 'create_form',
      title: 'Crear Formulario',
      description: 'Diseñar un nuevo formulario personalizado',
      icon: DocumentTextIcon,
      action: () => window.location.href = '/formx/forms/new',
      color: 'bg-gradient-to-r from-formx-500 to-formx-600',
      hub: 'formx'
    },
    {
      id: 'schedule_consultation',
      title: 'Agendar Consulta',
      description: 'Programar una nueva cita médica',
      icon: CalendarDaysIcon,
      action: () => window.location.href = '/expedix/consultations/new',
      color: 'bg-gradient-to-r from-expedix-500 to-expedix-600',
      hub: 'expedix'
    },
    {
      id: 'resource_library',
      title: 'Biblioteca',
      description: 'Acceder a recursos y documentos',
      icon: DocumentTextIcon,
      action: () => window.location.href = '/resources/library',
      color: 'bg-gradient-to-r from-resources-500 to-resources-600',
      hub: 'resources'
    },
    {
      id: 'generate_report',
      title: 'Generar Reporte',
      description: 'Crear reporte de evaluaciones',
      icon: ChartBarIcon,
      action: () => window.location.href = '/clinimetrix/reports/new',
      color: 'bg-gradient-to-r from-clinimetrix-500 to-clinimetrix-600',
      hub: 'clinimetrix'
    }
  ];

  // Filter actions based on selected hub
  const filteredActions = selectedHub === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.hub === selectedHub);

  // Hub colors for navigation
  const hubColors = {
    expedix: 'bg-expedix-500 hover:bg-expedix-600',
    clinimetrix: 'bg-clinimetrix-500 hover:bg-clinimetrix-600', 
    formx: 'bg-formx-500 hover:bg-formx-600',
    resources: 'bg-resources-500 hover:bg-resources-600',
    all: 'bg-gray-500 hover:bg-gray-600'
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getTimeOfDayGreeting()}, {user.name}
              </h1>
              <p className="text-gray-600">
                {user.organization && `${user.organization} • `}
                {new Intl.DateTimeFormat('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }).format(new Date())}
              </p>
            </div>
            
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pacientes, escalas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pacientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activePatients || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Evaluaciones Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingAssessments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedAssessmentsToday || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100">
                <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Citas Programadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.scheduledAppointments || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
                  
                  {/* Hub Filter */}
                  <div className="flex space-x-2">
                    {['all', 'expedix', 'clinimetrix', 'formx', 'resources'].map((hub) => (
                      <button
                        key={hub}
                        onClick={() => setSelectedHub(hub)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          selectedHub === hub 
                            ? hubColors[hub as keyof typeof hubColors]?.replace('hover:', '') + ' text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {hub === 'all' ? 'Todos' : hub.charAt(0).toUpperCase() + hub.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="p-4 text-left rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
            </div>
            
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">No hay actividad reciente</p>
                  <p className="text-sm text-gray-500">
                    Las acciones aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hub Navigation */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Módulos del Sistema</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <a 
                  href="/expedix"
                  className="group p-6 bg-gradient-to-br from-expedix-50 to-expedix-100 rounded-xl border border-expedix-200 hover:border-expedix-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-expedix-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-expedix-900 mb-2">Expedix</h3>
                    <p className="text-sm text-expedix-700">
                      Gestión de pacientes y expedientes médicos
                    </p>
                  </div>
                </a>

                <a 
                  href="/clinimetrix"
                  className="group p-6 bg-gradient-to-br from-clinimetrix-50 to-clinimetrix-100 rounded-xl border border-clinimetrix-200 hover:border-clinimetrix-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-clinimetrix-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-clinimetrix-900 mb-2">Clinimetrix</h3>
                    <p className="text-sm text-clinimetrix-700">
                      Escalas y evaluaciones psicológicas
                    </p>
                  </div>
                </a>

                <a 
                  href="/formx"
                  className="group p-6 bg-gradient-to-br from-formx-50 to-formx-100 rounded-xl border border-formx-200 hover:border-formx-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-formx-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-formx-900 mb-2">FormX</h3>
                    <p className="text-sm text-formx-700">
                      Formularios personalizados y plantillas
                    </p>
                  </div>
                </a>

                <a 
                  href="/resources"
                  className="group p-6 bg-gradient-to-br from-resources-50 to-resources-100 rounded-xl border border-resources-200 hover:border-resources-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-resources-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ChartBarIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-resources-900 mb-2">Resources</h3>
                    <p className="text-sm text-resources-700">
                      Biblioteca de recursos y documentos
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;