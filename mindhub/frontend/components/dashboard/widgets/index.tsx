'use client';

import React from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  HeartIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { StatCard } from '@/components/design-system/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { WidgetConfig } from '../CustomizableDashboard';

/**
 * Today's Appointments Widget
 */
export const TodayAppointmentsWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  const appointments = [
    { time: '09:00', patient: 'Juan Pérez', type: 'Consulta' },
    { time: '10:30', patient: 'María García', type: 'Seguimiento' },
    { time: '12:00', patient: 'Carlos López', type: 'Primera vez' },
  ];

  return (
    <div className="space-y-2">
      {appointments.slice(0, isExpanded ? undefined : 3).map((apt, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{apt.time}</span>
          </div>
          <div className="text-sm text-gray-600">{apt.patient}</div>
        </div>
      ))}
      {!isExpanded && appointments.length > 3 && (
        <p className="text-xs text-center text-gray-500">
          +{appointments.length - 3} más
        </p>
      )}
    </div>
  );
};

/**
 * Patient Statistics Widget
 */
export const PatientStatsWidget: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-2xl font-bold text-gray-900">156</p>
        <p className="text-xs text-gray-600">Total Pacientes</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-600">+12</p>
        <p className="text-xs text-gray-600">Este mes</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-blue-600">8</p>
        <p className="text-xs text-gray-600">Hoy</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-yellow-600">3</p>
        <p className="text-xs text-gray-600">En espera</p>
      </div>
    </div>
  );
};

/**
 * Revenue Overview Widget
 */
export const RevenueWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  const revenue = {
    today: 2500,
    week: 15000,
    month: 65000,
    pending: 8500
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Hoy</span>
        <span className="text-lg font-bold text-green-600">
          ${revenue.today.toLocaleString()}
        </span>
      </div>
      {isExpanded && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Esta semana</span>
            <span className="text-lg font-bold text-blue-600">
              ${revenue.week.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Este mes</span>
            <span className="text-lg font-bold text-purple-600">
              ${revenue.month.toLocaleString()}
            </span>
          </div>
        </>
      )}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Pendiente</span>
          <span className="text-lg font-bold text-yellow-600">
            ${revenue.pending.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Recent Activities Widget
 */
export const RecentActivitiesWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  const activities = [
    { time: '10:30', action: 'Nueva consulta', user: 'Dr. García' },
    { time: '09:45', action: 'Paciente registrado', user: 'Recepción' },
    { time: '09:15', action: 'Receta generada', user: 'Dr. López' },
    { time: '08:30', action: 'Cita confirmada', user: 'Sistema' },
  ];

  return (
    <div className="space-y-2">
      {activities.slice(0, isExpanded ? undefined : 3).map((activity, idx) => (
        <div key={idx} className="flex items-start gap-2 text-sm">
          <span className="text-gray-500 text-xs">{activity.time}</span>
          <div className="flex-1">
            <p className="text-gray-900">{activity.action}</p>
            <p className="text-xs text-gray-500">{activity.user}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Quick Actions Widget
 */
export const QuickActionsWidget: React.FC = () => {
  const actions = [
    { label: 'Nueva Cita', icon: CalendarIcon, color: 'text-blue-600' },
    { label: 'Nuevo Paciente', icon: UserGroupIcon, color: 'text-green-600' },
    { label: 'Nueva Receta', icon: DocumentTextIcon, color: 'text-purple-600' },
    { label: 'Cobrar', icon: CurrencyDollarIcon, color: 'text-yellow-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex flex-col items-center gap-2"
          >
            <Icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs text-gray-700">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Notifications Widget
 */
export const NotificationsWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  const notifications = [
    { type: 'warning', message: '3 citas sin confirmar', time: 'Hace 5 min' },
    { type: 'info', message: 'Nuevo mensaje de paciente', time: 'Hace 15 min' },
    { type: 'success', message: 'Pago recibido - Juan Pérez', time: 'Hace 1 hora' },
  ];

  const typeColors = {
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-2">
      {notifications.slice(0, isExpanded ? undefined : 2).map((notif, idx) => (
        <div
          key={idx}
          className={`p-2 rounded-lg text-sm ${typeColors[notif.type as keyof typeof typeColors]}`}
        >
          <p className="font-medium">{notif.message}</p>
          <p className="text-xs opacity-75">{notif.time}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Available widgets configuration
 */
export const availableDashboardWidgets: WidgetConfig[] = [
  {
    id: 'today-appointments',
    type: 'appointments',
    title: 'Citas de Hoy',
    description: 'Vista rápida de las citas programadas para hoy',
    component: TodayAppointmentsWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 5 },
    resizable: true,
    removable: true,
    configurable: false
  },
  {
    id: 'patient-stats',
    type: 'statistics',
    title: 'Estadísticas de Pacientes',
    description: 'Métricas generales de pacientes',
    component: PatientStatsWidget,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    resizable: true,
    removable: true,
    configurable: false
  },
  {
    id: 'revenue-overview',
    type: 'finance',
    title: 'Resumen de Ingresos',
    description: 'Vista general de ingresos y cobros pendientes',
    component: RevenueWidget,
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    removable: true,
    configurable: false
  },
  {
    id: 'recent-activities',
    type: 'activity',
    title: 'Actividad Reciente',
    description: 'Últimas acciones en el sistema',
    component: RecentActivitiesWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 5 },
    resizable: true,
    removable: true,
    configurable: false
  },
  {
    id: 'quick-actions',
    type: 'actions',
    title: 'Acciones Rápidas',
    description: 'Accesos directos a funciones frecuentes',
    component: QuickActionsWidget,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    resizable: false,
    removable: true,
    configurable: false
  },
  {
    id: 'notifications',
    type: 'notifications',
    title: 'Notificaciones',
    description: 'Alertas y mensajes importantes',
    component: NotificationsWidget,
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    removable: true,
    configurable: false
  }
];