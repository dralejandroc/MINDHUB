'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import QuickPayment from '@/components/frontdesk/QuickPayment';
import QuickScheduling from '@/components/frontdesk/QuickScheduling';
import ResourceSender from '@/components/frontdesk/ResourceSender';
import DayOverview from '@/components/frontdesk/DayOverview';

export default function FrontDeskPage() {
  const [activeModule, setActiveModule] = useState('overview');
  const [todaysStats, setTodaysStats] = useState({
    appointments: 0,
    payments: 0,
    pendingPayments: 0,
    resourcesSent: 0
  });

  useEffect(() => {
    loadTodaysStats();
  }, []);

  const loadTodaysStats = async () => {
    try {
      const response = await fetch('/api/frontdesk/stats/today');
      const data = await response.json();
      if (data.success) {
        setTodaysStats(data.data);
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const modules = [
    {
      id: 'overview',
      name: 'Vista General',
      icon: ClipboardDocumentListIcon,
      description: 'Resumen del día',
      color: 'bg-blue-500'
    },
    {
      id: 'payments',
      name: 'Cobros',
      icon: CurrencyDollarIcon,
      description: 'Gestionar pagos y anticipos',
      color: 'bg-green-500'
    },
    {
      id: 'scheduling',
      name: 'Agendar',
      icon: CalendarDaysIcon,
      description: 'Programar citas rápidamente',
      color: 'bg-purple-500'
    },
    {
      id: 'resources',
      name: 'Recursos',
      icon: DocumentTextIcon,
      description: 'Enviar materiales a pacientes',
      color: 'bg-orange-500'
    }
  ];

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'overview':
        return <DayOverview stats={todaysStats} onRefresh={loadTodaysStats} />;
      case 'payments':
        return <QuickPayment onPaymentComplete={loadTodaysStats} />;
      case 'scheduling':
        return <QuickScheduling onAppointmentScheduled={loadTodaysStats} />;
      case 'resources':
        return <ResourceSender />;
      default:
        return <DayOverview stats={todaysStats} onRefresh={loadTodaysStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="FrontDesk"
        description="Sistema de gestión para recepción y secretarias"
        icon={ClipboardDocumentListIcon}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <Link href="/hubs">
              <Button variant="outline">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-3xl font-bold text-blue-600">{todaysStats.appointments}</p>
              </div>
              <CalendarDaysIcon className="h-12 w-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cobros</p>
                <p className="text-3xl font-bold text-green-600">{todaysStats.payments}</p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">{todaysStats.pendingPayments}</p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recursos</p>
                <p className="text-3xl font-bold text-purple-600">{todaysStats.resourcesSent}</p>
              </div>
              <DocumentTextIcon className="h-12 w-12 text-purple-500" />
            </div>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Módulos</h3>
              <nav className="space-y-2">
                {modules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        activeModule === module.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          activeModule === module.id ? 'bg-blue-200' : 'bg-gray-200'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            activeModule === module.id ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-sm text-gray-500">{module.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => setActiveModule('payments')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Cobro Rápido
                </Button>
                <Button 
                  onClick={() => setActiveModule('scheduling')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
                <Button 
                  onClick={() => setActiveModule('resources')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="sm"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Enviar Recurso
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="p-6 min-h-[600px]">
              {renderActiveModule()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}