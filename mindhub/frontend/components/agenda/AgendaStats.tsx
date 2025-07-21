'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

interface StatsData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalPatients: number;
  averageDuration: number;
  busyDays: string[];
  appointmentsByType: { [key: string]: number };
  monthlyTrend: { month: string; appointments: number; completed: number }[];
  weeklyStats: { day: string; appointments: number }[];
}

export default function AgendaStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    // Simular datos de estadísticas
    const mockStats: StatsData = {
      totalAppointments: 128,
      completedAppointments: 95,
      cancelledAppointments: 18,
      noShowAppointments: 15,
      totalPatients: 76,
      averageDuration: 52,
      busyDays: ['Martes', 'Miércoles', 'Jueves'],
      appointmentsByType: {
        'Consulta inicial': 35,
        'Seguimiento': 42,
        'Evaluación psicológica': 28,
        'Terapia de pareja': 15,
        'Control': 8
      },
      monthlyTrend: [
        { month: 'Enero', appointments: 98, completed: 82 },
        { month: 'Febrero', appointments: 105, completed: 89 },
        { month: 'Marzo', appointments: 112, completed: 94 },
        { month: 'Abril', appointments: 118, completed: 98 },
        { month: 'Mayo', appointments: 125, completed: 102 },
        { month: 'Junio', appointments: 132, completed: 108 },
        { month: 'Julio', appointments: 128, completed: 95 }
      ],
      weeklyStats: [
        { day: 'Lun', appointments: 18 },
        { day: 'Mar', appointments: 24 },
        { day: 'Mié', appointments: 26 },
        { day: 'Jue', appointments: 22 },
        { day: 'Vie', appointments: 20 },
        { day: 'Sáb', appointments: 8 },
        { day: 'Dom', appointments: 2 }
      ]
    };
    setStats(mockStats);
  }, [selectedPeriod]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: 'var(--primary-500)' }}
        />
        <span className="ml-3" style={{ color: 'var(--neutral-600)' }}>
          Cargando estadísticas...
        </span>
      </div>
    );
  }

  const completionRate = Math.round((stats.completedAppointments / stats.totalAppointments) * 100);
  const cancellationRate = Math.round((stats.cancelledAppointments / stats.totalAppointments) * 100);
  const noShowRate = Math.round((stats.noShowAppointments / stats.totalAppointments) * 100);

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div 
        className="bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="flex items-center justify-between">
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Estadísticas de Agenda
          </h2>
          <div className="flex items-center space-x-2">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedPeriod === period ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: selectedPeriod === period 
                    ? 'var(--primary-500)' 
                    : 'var(--neutral-100)',
                  color: selectedPeriod === period 
                    ? 'white' 
                    : 'var(--neutral-600)'
                }}
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)',
            borderLeft: '4px solid var(--primary-500)'
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                color: 'var(--primary-600)'
              }}
            >
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--dark-green)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {stats.totalAppointments}
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: 'var(--neutral-600)' }}
              >
                Total de Citas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)',
            borderLeft: '4px solid var(--secondary-500)'
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--secondary-100), var(--secondary-200))',
                color: 'var(--secondary-600)'
              }}
            >
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--dark-green)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {completionRate}%
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: 'var(--neutral-600)' }}
              >
                Tasa de Finalización
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)',
            borderLeft: '4px solid var(--accent-500)'
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-100), var(--accent-200))',
                color: 'var(--accent-600)'
              }}
            >
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--dark-green)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {stats.totalPatients}
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: 'var(--neutral-600)' }}
              >
                Pacientes Únicos
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)',
            borderLeft: '4px solid #f59e0b'
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                color: '#d97706'
              }}
            >
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--dark-green)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {stats.averageDuration}
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: 'var(--neutral-600)' }}
              >
                Min Promedio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia mensual */}
        <div 
          className="bg-white rounded-xl p-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Tendencia Mensual
          </h3>
          <div className="space-y-3">
            {stats.monthlyTrend.slice(-6).map((month, index) => {
              const prevMonth = index > 0 ? stats.monthlyTrend[stats.monthlyTrend.length - 6 + index - 1] : null;
              const trend = prevMonth ? month.appointments - prevMonth.appointments : 0;
              
              return (
                <div key={month.month} className="flex items-center justify-between">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--neutral-700)' }}
                  >
                    {month.month}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span 
                        className="text-sm font-bold"
                        style={{ color: 'var(--dark-green)' }}
                      >
                        {month.appointments}
                      </span>
                      {trend !== 0 && (
                        <div className="flex items-center">
                          {trend > 0 ? (
                            <TrendingUpIcon className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3 text-red-500" />
                          )}
                          <span 
                            className={`text-xs ml-1 ${
                              trend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {Math.abs(trend)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div 
                      className="w-24 bg-gray-200 rounded-full h-2"
                      style={{ backgroundColor: 'var(--neutral-200)' }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (month.completed / month.appointments) * 100)}%`,
                          backgroundColor: 'var(--secondary-500)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por día de la semana */}
        <div 
          className="bg-white rounded-xl p-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Distribución Semanal
          </h3>
          <div className="space-y-3">
            {stats.weeklyStats.map((day) => {
              const maxAppointments = Math.max(...stats.weeklyStats.map(d => d.appointments));
              const percentage = (day.appointments / maxAppointments) * 100;
              
              return (
                <div key={day.day} className="flex items-center justify-between">
                  <span 
                    className="text-sm font-medium w-12"
                    style={{ color: 'var(--neutral-700)' }}
                  >
                    {day.day}
                  </span>
                  <div className="flex-1 mx-4">
                    <div 
                      className="w-full bg-gray-200 rounded-full h-3"
                      style={{ backgroundColor: 'var(--neutral-200)' }}
                    >
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: stats.busyDays.includes(day.day) 
                            ? 'var(--accent-500)' 
                            : 'var(--primary-500)'
                        }}
                      />
                    </div>
                  </div>
                  <span 
                    className="text-sm font-bold w-8 text-right"
                    style={{ color: 'var(--dark-green)' }}
                  >
                    {day.appointments}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tipos de citas y métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tipos de citas */}
        <div 
          className="bg-white rounded-xl p-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Tipos de Citas
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.appointmentsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  {type}
                </span>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-bold"
                    style={{ color: 'var(--dark-green)' }}
                  >
                    {count}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--neutral-500)' }}
                  >
                    ({Math.round((count / stats.totalAppointments) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas de eficiencia */}
        <div 
          className="bg-white rounded-xl p-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Eficiencia
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Finalización
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: 'var(--secondary-700)' }}
                >
                  {completionRate}%
                </span>
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-2"
                style={{ backgroundColor: 'var(--neutral-200)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    backgroundColor: 'var(--secondary-500)'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Cancelaciones
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: 'var(--accent-700)' }}
                >
                  {cancellationRate}%
                </span>
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-2"
                style={{ backgroundColor: 'var(--neutral-200)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${cancellationRate}%`,
                    backgroundColor: 'var(--accent-500)'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  No asistencia
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: '#d97706' }}
                >
                  {noShowRate}%
                </span>
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-2"
                style={{ backgroundColor: 'var(--neutral-200)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${noShowRate}%`,
                    backgroundColor: '#f59e0b'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Días más ocupados */}
        <div 
          className="bg-white rounded-xl p-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Días Más Ocupados
          </h3>
          <div className="space-y-3">
            {stats.busyDays.map((day, index) => (
              <div 
                key={day}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--accent-50)' }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--accent-500)' }}
                  >
                    {index + 1}
                  </div>
                  <span 
                    className="font-medium"
                    style={{ color: 'var(--dark-green)' }}
                  >
                    {day}
                  </span>
                </div>
                <ChartBarIcon 
                  className="h-4 w-4"
                  style={{ color: 'var(--accent-500)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}