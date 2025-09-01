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
import { ConfigurableDashboard } from './ConfigurableDashboard';
import Link from 'next/link';

interface AdvancedDashboardProps {
  onCustomizeLayout?: () => void;
}

export function AdvancedDashboard({ onCustomizeLayout }: AdvancedDashboardProps) {
  const { preferences, realDashboardData } = useUserMetrics();

  // Use real dashboard data if available, fallback to localStorage
  const useRealData = realDashboardData !== null;
  
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

      {/* Configurable Dashboard with All Widgets */}
      <ConfigurableDashboard />

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