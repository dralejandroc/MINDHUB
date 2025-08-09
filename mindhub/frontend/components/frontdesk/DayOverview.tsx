'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DayOverviewProps {
  stats: {
    appointments: number;
    payments: number;
    pendingPayments: number;
    resourcesSent: number;
  };
  onRefresh: () => void;
}

interface TodaysAppointment {
  id: string;
  patientName: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial';
  amount: number;
}

interface PendingTask {
  id: string;
  type: 'payment' | 'callback' | 'resource' | 'followup';
  description: string;
  patientName: string;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
}

export default function DayOverview({ stats, onRefresh }: DayOverviewProps) {
  const [appointments, setAppointments] = useState<TodaysAppointment[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTodaysData();
  }, []);

  const loadTodaysData = async () => {
    try {
      const [appointmentsRes, tasksRes] = await Promise.all([
        fetch(`/api/frontdesk/appointments/today`),
        fetch(`/api/frontdesk/tasks/pending`)
      ]);

      const appointmentsData = await appointmentsRes.json();
      const tasksData = await tasksRes.json();

      if (appointmentsData.success) {
        setAppointments(appointmentsData.data);
      }

      if (tasksData.success) {
        setPendingTasks(tasksData.data);
      }
    } catch (error) {
      console.error('Error loading todays data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodaysData();
    onRefresh();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'payment': return CurrencyDollarIcon;
      case 'callback': return ClockIcon;
      case 'resource': return DocumentTextIcon;
      case 'followup': return UserIcon;
      default: return ClockIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando información del día...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Vista General - {new Date().toLocaleDateString('es-MX')}
          </h3>
          <p className="text-gray-600 mt-1">
            Resumen de actividades y tareas pendientes del día
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <ArrowPathIcon className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Citas de Hoy ({appointments.length})
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay citas programadas para hoy</p>
              </div>
            ) : (
              appointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          {appointment.patientName}
                        </h5>
                        <span className="text-sm font-medium text-gray-600">
                          {appointment.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status === 'scheduled' ? 'Programada' :
                           appointment.status === 'in-progress' ? 'En curso' :
                           appointment.status === 'completed' ? 'Completada' :
                           'Cancelada'}
                        </span>
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                          {appointment.paymentStatus === 'paid' ? 'Pagado' :
                           appointment.paymentStatus === 'partial' ? 'Parcial' :
                           'Pendiente'}
                        </span>
                        
                        <span className="text-sm font-semibold text-green-600">
                          ${appointment.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
            Tareas Pendientes ({pendingTasks.length})
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>¡Excelente! No hay tareas pendientes</p>
              </div>
            ) : (
              pendingTasks.map((task) => {
                const IconComponent = getTaskIcon(task.type);
                return (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-gray-900">
                            {task.patientName}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'high' ? 'Alta' :
                               task.priority === 'medium' ? 'Media' :
                               'Baja'}
                            </span>
                            {task.dueTime && (
                              <span className="text-xs text-gray-500">
                                {task.dueTime}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Día</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.appointments}</div>
            <div className="text-sm text-gray-600">Citas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.payments}</div>
            <div className="text-sm text-gray-600">Cobros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.resourcesSent}</div>
            <div className="text-sm text-gray-600">Recursos</div>
          </div>
        </div>
      </Card>
    </div>
  );
}