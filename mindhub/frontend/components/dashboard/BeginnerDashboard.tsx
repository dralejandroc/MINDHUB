'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRightIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface BeginnerDashboardProps {
  onNavigate?: (path: string) => void;
}

export function BeginnerDashboard({ onNavigate }: BeginnerDashboardProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyStats, setWeeklyStats] = useState({
    totalPatients: 47,
    totalAppointments: 23,
    completedAssessments: 12,
    pendingAlerts: 3
  });

  // Generate week days starting from Monday
  const getWeekDays = () => {
    const week = [];
    const start = new Date(currentWeek);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push({
        date: date,
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNum: date.getDate(),
        appointments: Math.floor(Math.random() * 8) + 1, // Mock data
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return week;
  };

  const weekDays = getWeekDays();

  const favoriteScales = [
    { name: 'PHQ-9', description: 'Depresión', uses: 24, color: 'bg-purple-100 text-purple-700' },
    { name: 'GAD-7', description: 'Ansiedad', uses: 18, color: 'bg-emerald-100 text-emerald-700' },
    { name: 'BDI-21', description: 'Beck Depresión', uses: 15, color: 'bg-orange-100 text-orange-700' },
    { name: 'MADRS', description: 'Montgomery', uses: 12, color: 'bg-primary-100 text-primary-700' }
  ];

  const quickActions = [
    { name: 'Nuevo Paciente', path: '/hubs/expedix?action=new-patient' },
    { name: 'Ver Agenda', path: '/hubs/agenda' },
    { name: 'Nueva Evaluación', path: '/hubs/clinimetrix' },
    { name: 'Crear Formulario', path: '/hubs/formx?action=new-form' },
    { name: 'Biblioteca', path: '/hubs/resources' }
  ];

  const recentAlerts = [
    { id: 1, patient: 'Ana López', message: 'PHQ-9 indica severidad alta', severity: 'high', time: '2h' },
    { id: 2, patient: 'Carlos Ruiz', message: 'Cita pendiente de confirmar', severity: 'medium', time: '4h' },
    { id: 3, patient: 'María García', message: 'Evaluación completada', severity: 'low', time: '1d' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard Clínico
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Resumen ejecutivo de tu práctica clínica con métricas clave y agenda semanal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-primary-50 border-primary-200 hover-lift">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Pacientes</p>
              <p className="text-lg font-bold text-primary-600">{weeklyStats.totalPatients}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-orange-50 border-orange-200 hover-lift">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Citas Esta Semana</p>
              <p className="text-lg font-bold text-orange-600">{weeklyStats.totalAppointments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-purple-50 border-purple-200 hover-lift">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-purple rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Evaluaciones</p>
              <p className="text-lg font-bold text-purple-600">{weeklyStats.completedAssessments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-secondary-50 border-secondary-200 hover-lift">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <BellIcon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Alertas</p>
              <p className="text-lg font-bold text-secondary-600">{weeklyStats.pendingAlerts}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Agenda */}
        <Card className="lg:col-span-2 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Agenda Semanal</h3>
            <Link href="/hubs/agenda">
              <Button variant="outline" size="sm" className="text-xs">
                Ver Completa
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`text-center p-2 rounded-lg border transition-all duration-200 ${
                  day.isToday 
                    ? 'bg-primary-100 border-primary-300 text-primary-700' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="text-xs font-medium">{day.dayName}</div>
                <div className="text-lg font-bold">{day.dayNum}</div>
                <div className={`text-xs ${day.isToday ? 'text-primary-600' : 'text-gray-600'}`}>
                  {day.appointments} citas
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Favorite Scales */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Escalas Favoritas</h3>
            <Link href="/hubs/clinimetrix">
              <Button variant="outline" size="sm" className="text-xs">
                Ver Todas
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {favoriteScales.map((scale, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div>
                  <div className="text-xs font-semibold text-gray-900">{scale.name}</div>
                  <div className="text-xs text-gray-600">{scale.description}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${scale.color}`}>
                  {scale.uses}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary">
          <h3 className="text-sm font-semibold text-dark-green mb-3">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.path}>
                <div className="p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200 cursor-pointer hover-lift border border-primary-200 text-center">
                  <span className="text-xs font-medium text-primary-700">{action.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Alertas Recientes</h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
              {recentAlerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${
                  alert.severity === 'high' ? 'bg-red-500' : 
                  alert.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">{alert.patient}</div>
                  <div className="text-xs text-gray-600">{alert.message}</div>
                </div>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}