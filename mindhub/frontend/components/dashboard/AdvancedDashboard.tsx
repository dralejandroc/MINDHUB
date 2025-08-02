'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import { FavoriteScalesWidget } from './widgets/FavoriteScalesWidget';
import { FollowupPatientsWidget } from './widgets/FollowupPatientsWidget';
import { QuickStatsWidget } from './widgets/QuickStatsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import Link from 'next/link';

interface AdvancedDashboardProps {
  onCustomizeLayout?: () => void;
}

export function AdvancedDashboard({ onCustomizeLayout }: AdvancedDashboardProps) {
  const { preferences, realDashboardData } = useUserMetrics();
  const [showCustomization, setShowCustomization] = useState(false);

  // Use real dashboard data if available, fallback to localStorage
  const useRealData = realDashboardData !== null;
  
  const stats = [
    {
      label: 'Pacientes Totales',
      value: useRealData ? realDashboardData.totalPatients : (preferences.metrics.patientsAdded || 0),
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Escalas Aplicadas',
      value: useRealData ? realDashboardData.totalScaleApplications : (preferences.metrics.scalesApplied || 0),
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Formularios Creados',
      value: useRealData ? realDashboardData.totalFormInstances : (preferences.metrics.formsCreated || 0),
      icon: DocumentTextIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      label: 'Recursos Subidos',
      value: useRealData ? realDashboardData.totalResources : (preferences.metrics.resourcesUploaded || 0),
      icon: BookOpenIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

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

  return (
    <div className="space-y-6">
      {/* Header with Customization */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600">Acceso rápido a tus herramientas principales</p>
        </div>
        <Button
          onClick={() => setShowCustomization(!showCustomization)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>Personalizar</span>
        </Button>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <QuickStatsWidget />
        <FavoriteScalesWidget />
        <FollowupPatientsWidget />
        <RecentActivityWidget />
      </div>

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

      {/* Auto-Switch Notification */}
      {preferences.dashboardConfig.mode === 'advanced' && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-800">
              <span className="font-semibold">Dashboard Avanzado activado:</span> Has desbloqueado funciones avanzadas 
              basadas en tu experiencia con la plataforma.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}