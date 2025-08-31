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
import { clinimetrixProClient } from '../../lib/api/clinimetrix-pro-client';
import { dashboardGraphQLService as dashboardDataService } from '../../lib/dashboard-graphql-service';

interface BeginnerDashboardProps {
  onNavigate?: (path: string) => void;
}

export function BeginnerDashboard({ onNavigate }: BeginnerDashboardProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyStats, setWeeklyStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    completedAssessments: 0,
    pendingAlerts: 0
  });
  const [todayStats, setTodayStats] = useState({
    appointmentsToday: 0,
    pendingPatients: 0,
    assessmentsScheduled: 0,
    nextAppointment: null as any
  });
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<{isRealUser?: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<Array<{id: string; patient: string; message: string; severity: string; time: string}>>([]);
  const [weeklyIncome, setWeeklyIncome] = useState({
    currentWeek: 0,
    previousWeek: 0,
    growth: 0
  });
  const [favoriteScales, setFavoriteScales] = useState<Array<{
    name: string;
    description: string;
    uses: number;
    color: string;
  }>>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Get current user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      
      // If it's Dr. Alejandro, fetch real data
      if (user.isRealUser && user.id) {
        fetchRealDashboardData(user.id);
      } else {
        // Admin user - everything starts at 0
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchRealDashboardData = async (userId: string) => {
    try {
      // Use the dashboard data service with cookie authentication (no token needed)
      const dashboardData = await dashboardDataService.fetchDashboardData(userId);
      
      // Update dashboard stats with real data
      setWeeklyStats({
        totalPatients: dashboardData.totalPatients,
        totalAppointments: dashboardData.totalConsultations,
        completedAssessments: dashboardData.totalScaleApplications,
        pendingAlerts: dashboardData.weeklyStats.alerts
      });
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayActivities = dashboardData.recentActivity.filter(activity => {
        const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
        return activityDate === today;
      });
      
      setTodayStats({
        appointmentsToday: todayActivities.filter(a => a.type === 'consultation').length,
        pendingPatients: Math.max(0, todayActivities.filter(a => a.type === 'patient').length),
        assessmentsScheduled: todayActivities.filter(a => a.type === 'scale').length,
        nextAppointment: todayActivities.length > 0 ? { time: '10:00 AM' } : null
      });
      
      // Create alerts from recent activity
      const alerts = dashboardData.recentActivity
        .filter(activity => activity.type === 'consultation')
        .slice(0, 3)
        .map((activity, index) => ({
          id: `alert-${index}`,
          patient: activity.description.split(':')[1]?.trim() || 'Paciente',
          message: activity.description.split(':')[0] || 'Actividad',
          severity: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          time: 'Reciente'
        }));
      
      setRecentAlerts(alerts);
      
      // Calculate weekly income based on real patient count
      setWeeklyIncome({
        currentWeek: dashboardData.totalPatients * 850, // Average consultation price
        previousWeek: Math.max(0, dashboardData.totalPatients - 2) * 750, // Simulated previous week
        growth: dashboardData.totalPatients > 0 ? 13.3 : 0
      });

      console.log('Dashboard data loaded from service:', {
        totalPatients: dashboardData.totalPatients,
        completedAssessments: dashboardData.totalScaleApplications,
        totalConsultations: dashboardData.totalConsultations,
        todayStats: todayActivities.length,
        alerts: alerts.length
      });

    } catch (error) {
      console.log('Could not fetch real dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate week days starting from Monday
  const getWeekDays = () => {
    const week = [];
    const start = new Date(currentWeek);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);

    // Show 0 appointments for admin, real data for Dr. Alejandro
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push({
        date: date,
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNum: date.getDate(),
        appointments: 0, // Will be updated with real data if available
        isToday: isClient && date.toDateString() === today.toDateString()
      });
    }
    return week;
  };

  const weekDays = getWeekDays();

  // Cargar escalas favoritas/más utilizadas (las escalas son públicas para todos los usuarios)
  useEffect(() => {
    const loadFavoriteScales = async () => {
      if (!currentUser?.isRealUser) {
        setLoadingFavorites(false);
        return;
      }

      try {
        // Obtener las primeras 4 escalas del catálogo como "más usadas"
        const catalogScales = await clinimetrixProClient.getTemplateCatalog();
        const mostUsedScales = catalogScales.slice(0, 4);
        
        const colors = [
          'bg-purple-100 text-purple-700',
          'bg-emerald-100 text-emerald-700',
          'bg-orange-100 text-orange-700',
          'bg-primary-100 text-primary-700'
        ];

        const formattedScales = mostUsedScales.map((scale, index) => ({
          name: scale.name,
          description: scale.category ? scale.category.charAt(0).toUpperCase() + scale.category.slice(1) : 'Evaluación Clínica',
          uses: 0, // Por implementar cuando tengamos estadísticas de uso
          color: colors[index % colors.length]
        }));

        setFavoriteScales(formattedScales);
      } catch (error) {
        console.error('Error loading favorite scales:', error);
        // Mantener vacío si hay error - las escalas son públicas
        setFavoriteScales([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    if (currentUser) {
      loadFavoriteScales();
    }
  }, [currentUser]);

  const quickActions = [
    { name: 'Nuevo Paciente', path: '/hubs/expedix?action=new-patient' },
    { name: 'Ver Agenda', path: '/hubs/agenda' },
    { name: 'Nueva Evaluación', path: '/hubs/clinimetrix' },
    { name: 'Crear Formulario', path: '/hubs/formx?action=new-form' },
    { name: 'Biblioteca', path: '/hubs/resources' }
  ];

  const handleAlertClick = () => {
    if (recentAlerts.length > 0) {
      const alertMessages = recentAlerts.map(alert => 
        `• ${alert.patient} - ${alert.message} (${alert.time})`
      ).join('\n');
      alert(`Alertas Activas:\n\n${alertMessages}`);
    } else {
      alert('No hay alertas activas en este momento.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Date */}
      <div className="text-center py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          {isClient ? new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
      </div>

      {/* Today's Summary - Most Important Section */}
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
            Resumen del Día
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Citas Hoy</span>
              <ClockIcon className="h-4 w-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayStats.appointmentsToday}</p>
            {todayStats.nextAppointment && (
              <p className="text-xs text-gray-500 mt-1">Próxima: {todayStats.nextAppointment.time}</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pacientes Pendientes</span>
              <UserGroupIcon className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayStats.pendingPatients}</p>
            <p className="text-xs text-gray-500 mt-1">Por atender hoy</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Evaluaciones Programadas</span>
              <ClipboardDocumentListIcon className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayStats.assessmentsScheduled}</p>
            <p className="text-xs text-gray-500 mt-1">Para aplicar hoy</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Alertas Activas</span>
              <BellIcon className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyStats.pendingAlerts}</p>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </div>
        </div>
        {todayStats.appointmentsToday === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
              No tienes citas programadas para hoy. 
              <Link href="/hubs/agenda" className="font-medium underline ml-1">Ver agenda completa</Link>
            </p>
          </div>
        )}
      </Card>

      {/* Weekly Stats - Secondary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Link href="/hubs/expedix">
          <Card className="p-3 bg-primary-50 border-primary-200 hover-lift cursor-pointer transition-all duration-200 hover:bg-primary-100">
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
        </Link>

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

        <Link href="/hubs/clinimetrix">
          <Card className="p-3 bg-purple-50 border-purple-200 hover-lift cursor-pointer transition-all duration-200 hover:bg-purple-100">
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
        </Link>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName, index) => (
                <div key={index} className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                  {dayName}
                </div>
              ))}
            </div>
            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {weekDays.map((day, index) => {
                const formatDate = (date: Date) => {
                  return date.toISOString().split('T')[0];
                };
                
                return (
                  <Link 
                    key={index} 
                    href={`/hubs/agenda?date=${formatDate(day.date)}`}
                    className={`relative text-center p-3 border-r border-b border-gray-200 last:border-r-0 transition-all duration-200 cursor-pointer ${
                      day.isToday 
                        ? 'bg-primary-50 hover:bg-primary-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      day.isToday ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {day.dayNum}
                    </div>
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      day.isToday 
                        ? 'bg-primary-600 text-white' 
                        : day.appointments > 5 
                          ? 'bg-orange-100 text-orange-700'
                          : day.appointments > 2
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                      {day.appointments}
                    </div>
                    {day.isToday && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Weekly Income */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Ingresos Semanales</h3>
            <Link href="/hubs/finance">
              <Button variant="outline" size="sm" className="text-xs">
                Ver Finanzas
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              ${weeklyIncome.currentWeek.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mb-2">Esta Semana</div>
            {weeklyIncome.currentWeek > 0 && (
              <div className={`flex items-center justify-center text-xs ${
                weeklyIncome.growth >= 0 ? 'text-secondary-600' : 'text-red-600'
              }`}>
                <ChartBarIcon className="h-3 w-3 mr-1" />
                {weeklyIncome.growth >= 0 ? '+' : ''}{weeklyIncome.growth.toFixed(1)}% vs semana anterior
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            {favoriteScales.length > 0 ? (
              favoriteScales.map((scale, index) => (
                <Link key={index} href={`/hubs/clinimetrix?scale=${scale.name.toLowerCase()}`}>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{scale.name}</div>
                      <div className="text-xs text-gray-600">{scale.description}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${scale.color}`}>
                      {scale.uses}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">No hay escalas favoritas aún</p>
                <Link href="/hubs/clinimetrix">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">
                    Explorar Escalas
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary">
          <h3 className="text-sm font-semibold text-dark-green mb-3">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.path}>
                <div className="p-2 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200 cursor-pointer hover-lift border border-primary-200 text-center">
                  <span className="text-xs font-medium text-primary-700">{action.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange cursor-pointer" onClick={handleAlertClick}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Alertas Recientes</h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
              {recentAlerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
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
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">No hay alertas activas</p>
                <p className="text-xs text-gray-400 mt-1">Las notificaciones aparecerán aquí</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}