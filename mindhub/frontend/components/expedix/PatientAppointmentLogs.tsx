'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AppointmentLog {
  id: string;
  appointmentId: string;
  action: string;
  userName: string;
  changes: string;
  reason?: string;
  createdAt: string;
  previousData?: any;
  newData?: any;
}

interface AppointmentStats {
  totalAppointments: number;
  totalChanges: number;
  totalCancellations: number;
  totalNoShows: number;
  averageChangesPerAppointment: number;
}

interface PatientAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  isActive: boolean;
}

interface PatientAppointmentLogsProps {
  patientId: string;
}

export default function PatientAppointmentLogs({ patientId }: PatientAppointmentLogsProps) {
  const [logs, setLogs] = useState<AppointmentLog[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadAppointmentData();
    }
  }, [patientId]);

  const loadAppointmentData = async () => {
    setIsLoading(true);
    try {
      // Load logs, stats, and alerts in parallel
      const [logsResponse, statsResponse, alertsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_EXPEDIX_API}/api/v1/expedix/appointment-logs/patient/${patientId}?limit=10`),
        fetch(`${process.env.NEXT_PUBLIC_EXPEDIX_API}/api/v1/expedix/appointment-logs/patient/${patientId}/stats`),
        fetch(`${process.env.NEXT_PUBLIC_EXPEDIX_API}/api/v1/expedix/appointment-logs/patient/${patientId}/alerts`)
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.data || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data || []);
      }

    } catch (error) {
      console.error('Error loading appointment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'updated':
      case 'rescheduled':
      case 'date_changed':
      case 'time_changed':
        return <ArrowPathIcon className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'no_show':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      created: 'Cita creada',
      updated: 'Cita actualizada',
      rescheduled: 'Cita reprogramada',
      date_changed: 'Fecha cambiada',
      time_changed: 'Hora cambiada',
      cancelled: 'Cita cancelada',
      no_show: 'No se presentó',
      completed: 'Cita completada'
    };
    return labels[action] || action;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-sm font-semibold text-orange-800">Alertas del Paciente</h3>
          </div>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-2 rounded border text-xs ${getSeverityColor(alert.severity)}`}>
                <div className="font-medium">{alert.message}</div>
                <div className="text-xs opacity-75 mt-1">
                  {formatDate(alert.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics Summary */}
      {stats && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Resumen de Citas</h3>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showDetails ? 'Ocultar' : 'Ver Detalles'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center p-2 bg-primary-50 rounded">
              <div className="text-lg font-bold text-primary-600">{stats.totalAppointments}</div>
              <div className="text-gray-600">Total Citas</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="text-lg font-bold text-orange-600">{stats.totalChanges}</div>
              <div className="text-gray-600">Cambios</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{stats.totalCancellations}</div>
              <div className="text-gray-600">Cancelaciones</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-600">{stats.totalNoShows}</div>
              <div className="text-gray-600">No Asistió</div>
            </div>
          </div>

          {stats.averageChangesPerAppointment > 1.5 && (
            <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs">
              <div className="flex items-center text-orange-800">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Patrón de cambios frecuentes detectado</span>
              </div>
              <div className="text-orange-700 mt-1">
                Promedio de {stats.averageChangesPerAppointment.toFixed(1)} cambios por cita
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detailed Logs */}
      {showDetails && logs.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-dark-green mb-3">Historial Detallado de Citas</h3>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-900">
                      {getActionLabel(log.action)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                  
                  {log.changes && (
                    <div className="text-xs text-gray-600 mt-1">
                      {log.changes}
                    </div>
                  )}
                  
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3 mr-1" />
                    <span>{log.userName}</span>
                  </div>
                  
                  {log.reason && (
                    <div className="text-xs text-blue-600 mt-1 italic">
                      Motivo: {log.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {logs.length === 0 && !isLoading && (
        <Card className="p-4 text-center">
          <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600">
            No hay historial de citas disponible
          </div>
        </Card>
      )}
    </div>
  );
}