'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import AgendaCalendar from '@/components/agenda/AgendaCalendar';
import AppointmentList from '@/components/agenda/AppointmentList';
import NewAppointmentModal from '@/components/agenda/NewAppointmentModal';
import BlockTimeModal from '@/components/agenda/BlockTimeModal';
import WaitingListModal from '@/components/agenda/WaitingListModal';
import AppointmentDetailsModal from '@/components/agenda/AppointmentDetailsModal';
import AddToWaitingListModal from '@/components/agenda/AddToWaitingListModal';
import NewPatientQuickModal from '@/components/agenda/NewPatientQuickModal';
import { AgendaErrorBoundary } from '@/components/agenda/AgendaErrorBoundary';
import { 
  CalendarIcon, 
  PlusIcon, 
  ListBulletIcon, 
  Cog6ToothIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { createApiUrlWithParams, createApiUrl } from '@/lib/api/api-url-builders';
import { authGet, authPost, authPut, authDelete } from '@/lib/api/auth-fetch';

type ViewType = 'calendar' | 'list';

export default function AgendaPage() {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlockTime, setShowBlockTime] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showAddToWaitingList, setShowAddToWaitingList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for new patient modal events
  useEffect(() => {
    const handleOpenNewPatientModal = (event: CustomEvent) => {
      if (event.detail?.fromAgenda) {
        setShowNewPatientModal(true);
        // Store callback if provided
        if (event.detail?.callback) {
          setNewPatientCallback(() => event.detail.callback);
        }
      }
    };

    window.addEventListener('openNewPatientModal', handleOpenNewPatientModal as any);
    return () => {
      window.removeEventListener('openNewPatientModal', handleOpenNewPatientModal as any);
    };
  }, []);

  const handleNewAppointment = (date?: Date, time?: string) => {
    if (date) setAppointmentDate(date);
    if (time) setAppointmentTime(time);
    setShowNewAppointment(true);
  };

  const handleAppointmentClick = (appointment: any, date: Date) => {
    // Enriquecer datos de la cita con fecha
    const appointmentWithDate = {
      ...appointment,
      date: date.toISOString().split('T')[0]
    };
    setSelectedAppointment(appointmentWithDate);
    setShowAppointmentDetails(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setShowAppointmentDetails(false);
    setShowNewAppointment(true);
  };

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authGet(createApiUrl('/expedix/agenda/appointments'));
      if (response.ok) {
        // Trigger refresh in AgendaCalendar by changing key
        setRefreshTrigger(prev => prev + 1);
        toast.success('Datos actualizados');
      } else {
        throw new Error('Error al cargar citas');
      }
    } catch (error) {
      console.error('Error refreshing appointments:', error);
      setError('Error al cargar las citas');
      toast.error('Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  const [newPatientCallback, setNewPatientCallback] = useState<((patient: any) => void) | null>(null);

  const handleNewPatientSaved = (patient: any) => {
    console.log('🎯 New patient created:', patient);
    setShowNewPatientModal(false);
    
    // If there's a callback (from appointment modal), call it
    if (newPatientCallback) {
      newPatientCallback(patient);
      setNewPatientCallback(null);
    }
    
    // Refresh appointments if modal is open
    if (showNewAppointment) {
      refreshAppointments();
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleCalendarViewChange = (view: 'week' | 'month') => {
    setCalendarView(view);
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    setLoading(true);
    try {
      console.log('🔄 Saving appointment:', appointmentData);
      
      const response = await authPost(createApiUrl('/expedix/agenda/appointments'), appointmentData);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Appointment saved successfully:', result);
        setShowNewAppointment(false);
        setAppointmentTime('');
        setEditingAppointment(null);
        // Refresh calendar without reload
        refreshAppointments();
        toast.success('Cita agendada exitosamente');
      } else {
        const errorData = await response.text();
        console.error('❌ Error response:', errorData);
        toast.error(`Error al agendar cita: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error saving appointment:', error);
      toast.error('Error de conexión al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Deleting appointment:', appointmentId);
      
      const response = await authDelete(createApiUrl(`/expedix/agenda/appointments/${appointmentId}`));
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Appointment deleted successfully');
        toast.success('Cita cancelada y espacio liberado');
        
        // Mostrar sugerencias de lista de espera si existen
        if (result.waitingListSuggestions && result.waitingListSuggestions.length > 0) {
          const suggestions = result.waitingListSuggestions;
          const topSuggestion = suggestions[0];
          
          const message = `🎯 SUGERENCIA DE LISTA DE ESPERA\n\n` +
            `Paciente disponible: ${topSuggestion.patientName}\n` +
            `Prioridad: ${topSuggestion.priority.toUpperCase()}\n` +
            `Tipo: ${topSuggestion.appointmentType}\n` +
            `Esperando desde: ${topSuggestion.waitingSince} días\n\n` +
            `¿Deseas contactar al paciente para este horario disponible?`;
          
          if (confirm(message)) {
            // Redirigir a la lista de espera o abrir modal de contacto
            window.open(`tel:${topSuggestion.patientPhone}`, '_blank');
          }
          
          console.log(`🎯 Waiting list suggestions:`, suggestions);
        }
        
        setShowAppointmentDetails(false);
        setSelectedAppointment(null);
        // Refresh calendar without reload
        refreshAppointments();
      } else {
        const errorData = await response.text();
        console.error('❌ Error deleting appointment:', errorData);
        toast.error(`Error al cancelar cita: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error deleting appointment:', error);
      toast.error('Error de conexión al cancelar cita');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    setLoading(true);
    try {
      console.log('🔄 Changing appointment status:', appointmentId, newStatus);
      
      const response = await authPut(createApiUrl(`/expedix/agenda/appointments/${appointmentId}/status`), { status: newStatus });
      
      if (response.ok) {
        console.log('✅ Status changed successfully');
        toast.success('Estado actualizado exitosamente');
        // Actualizar la cita en el estado local
        if (selectedAppointment) {
          setSelectedAppointment({
            ...selectedAppointment,
            status: newStatus
          });
        }
        // Refresh calendar without reload
        refreshAppointments();
      } else {
        const errorData = await response.text();
        console.error('❌ Error changing status:', errorData);
        toast.error(`Error al cambiar estado: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error changing status:', error);
      toast.error('Error de conexión al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAgenda = () => {
    const exportFormat = prompt('Seleccione formato de exportación: \n1. PDF\n2. Excel\n3. Google Calendar', '1');
    
    if (exportFormat === '1') {
      alert('Exportando agenda en formato PDF...');
      // Lógica para exportar PDF
    } else if (exportFormat === '2') {
      alert('Exportando agenda en formato Excel...');
      // Lógica para exportar Excel
    } else if (exportFormat === '3') {
      alert('Sincronizando con Google Calendar...');
      // Lógica para sincronizar con Google Calendar
    }
  };

  const handleBlockTime = () => {
    setShowBlockTime(true);
  };

  const handleWaitingList = () => {
    setShowAddToWaitingList(true);
  };

  const handleSaveBlockedTime = async (blockData: any) => {
    try {
      // TODO: Implement blocked-times endpoint in backend
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expedix/agenda/blocked-times`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(blockData)
      // });
      
      console.log('Blocked time data:', blockData);
      // TODO: Implement blocked-times endpoint in backend
      // if (response.ok) {
        // Recargar calendario
        // window.location.reload();
      // }
    } catch (error) {
      console.error('Error blocking time:', error);
    }
  };

  const handleAssignPatientFromWaitingList = (patient: any) => {
    // Abrir modal de nueva cita con datos del paciente
    setAppointmentDate(new Date());
    setAppointmentTime('');
    setShowWaitingList(false);
    setShowNewAppointment(true);
  };

  const handleSaveToWaitingList = async (waitingListData: any) => {
    try {
      console.log('💾 Saving to waiting list:', waitingListData);
      
      const response = await authPost(createApiUrl('/expedix/agenda/waiting-list'), waitingListData);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Patient added to waiting list successfully:', result);
        toast.success('Paciente agregado a la lista de espera exitosamente');
        setShowAddToWaitingList(false);
      } else {
        const errorData = await response.text();
        console.error('❌ Error adding to waiting list:', errorData);
        toast.error(`Error al agregar a lista de espera: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Network error adding to waiting list:', error);
      toast.error('Error de conexión al agregar a lista de espera');
    }
  };

  const handleSettings = () => {
    // Navigate to professional settings page
    window.location.href = '/hubs/agenda/settings';
  };

  // Daily stats state
  const [dailyStats, setDailyStats] = useState({
    expectedIncome: 0,
    advancePayments: 0,
    actualIncome: 0,
    firstTimeConsultations: 0,
    followUpConsultations: 0,
    videoConsultations: 0,
    blockedSlots: 0,
    blockedReasons: []
  });

  // Load daily stats
  useEffect(() => {
    const loadDailyStats = async () => {
      try {
        console.log('🔄 Loading daily stats...');
        const today = selectedDate.toISOString().split('T')[0];
        const response = await authGet(createApiUrlWithParams('/expedix/agenda/daily-stats', { date: today }));
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDailyStats(data.data);
            return;
          }
        }
        
        // Calculate from appointments if no dedicated endpoint
        const appointmentsResponse = await authGet(createApiUrl('/expedix/agenda/appointments'));
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          if (appointmentsData.success && appointmentsData.data) {
            const todayAppointments = appointmentsData.data.filter((apt: any) => apt.date === today);
            
            // Calculate stats from today's appointments
            const firstTimeConsultations = todayAppointments.filter((apt: any) => 
              apt.type.toLowerCase().includes('primera') || apt.type.toLowerCase().includes('inicial')
            ).length;
            
            const followUpConsultations = todayAppointments.filter((apt: any) => 
              apt.type.toLowerCase().includes('seguimiento') || apt.type.toLowerCase().includes('control')
            ).length;
            
            const videoConsultations = todayAppointments.filter((apt: any) => 
              apt.type.toLowerCase().includes('video') || apt.type.toLowerCase().includes('virtual')
            ).length;
            
            // Calculate income based on appointments
            const expectedIncome = todayAppointments.reduce((sum: number, apt: any) => sum + (apt.cost || 800), 0);
            const actualIncome = todayAppointments
              .filter((apt: any) => apt.status === 'completed' || apt.status === 'confirmed')
              .reduce((sum: number, apt: any) => sum + (apt.cost || 800), 0);
            
            const advancePayments = todayAppointments
              .filter((apt: any) => apt.paymentStatus === 'paid')
              .reduce((sum: number, apt: any) => sum + (apt.cost || 800), 0);
            
            setDailyStats({
              expectedIncome,
              advancePayments,
              actualIncome,
              firstTimeConsultations,
              followUpConsultations,
              videoConsultations,
              blockedSlots: 0, // TODO: Calculate blocked time slots
              blockedReasons: [] // TODO: Get blocked reasons
            });
          }
        }
      } catch (error) {
        console.error('❌ Error loading daily stats:', error);
      }
    };

    loadDailyStats();
  }, [selectedDate]);

  return (
    <AgendaErrorBoundary>
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-orange-600" />
            <div>
              <h1 className="text-lg font-bold text-dark-green">Agenda - Sistema de Citas</h1>
              <p className="text-xs text-gray-600">Gestiona citas médicas y programación de consultas</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSettings}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              <Cog6ToothIcon className="h-3 w-3 mr-1" />
              Config
            </Button>
            <Button
              onClick={handleWaitingList}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs border-primary-200 text-primary-600 hover:bg-primary-50"
            >
              <UserGroupIcon className="h-3 w-3 mr-1" />
              +Lista Espera
            </Button>
            <Button
              onClick={() => handleNewAppointment()}
              variant="orange"
              size="sm"  
              className="h-8 px-2 text-xs"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>
      
      {/* View Toggle and Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex space-x-0.5 bg-orange-50 p-0.5 rounded-lg border border-orange-200">
          <button
            onClick={() => handleViewChange('calendar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              currentView === 'calendar'
                ? 'gradient-orange text-white shadow-orange'
                : 'text-orange-600 hover:bg-orange-100'
            }`}
          >
            <CalendarIcon className="h-3 w-3 mr-1 inline" />
            Calendario
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              currentView === 'list'
                ? 'gradient-orange text-white shadow-orange'
                : 'text-orange-600 hover:bg-orange-100'
            }`}
          >
            <ListBulletIcon className="h-3 w-3 mr-1 inline" />
            Lista del Día
          </button>
        </div>

        {currentView === 'calendar' && (
          <div className="flex space-x-0.5 bg-primary-50 p-0.5 rounded-lg border border-primary-200">
            <button
              onClick={() => handleCalendarViewChange('week')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                calendarView === 'week'
                  ? 'gradient-primary text-white shadow-primary'
                  : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handleCalendarViewChange('month')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                calendarView === 'month'
                  ? 'gradient-primary text-white shadow-primary'
                  : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              Mes
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar/List View */}
        <div className="lg:col-span-3">
          {currentView === 'calendar' ? (
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-primary-600 font-medium">Actualizando agenda...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm z-40">
                  <div className="flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button 
                      onClick={() => setError(null)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              <AgendaCalendar
                key={refreshTrigger}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onNewAppointment={handleNewAppointment}
                onAppointmentClick={handleAppointmentClick}
                viewType={calendarView}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-primary-600 font-medium">Actualizando lista...</span>
                  </div>
                </div>
              )}
              <AppointmentList
                selectedDate={selectedDate}
                onNewAppointment={(date, time) => handleNewAppointment(date, time)}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Daily Stats */}
        <div className="lg:col-span-1 space-y-2">
          {/* Daily Financial Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-2 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-dark-green mb-1.5 flex items-center">
              <CurrencyDollarIcon className="h-3 w-3 mr-1 text-emerald-600" />
              Resumen del Día
            </h3>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600">Esperado</span>
                <span className="font-medium text-gray-900 text-[10px]">${dailyStats.expectedIncome.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600">Anticipos</span>
                <span className="font-medium text-primary-600 text-[10px]">${dailyStats.advancePayments.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600">Real</span>
                <span className="font-medium text-emerald-600 text-[10px]">${dailyStats.actualIncome.toLocaleString()}</span>
              </div>
              
              <div className="pt-1 border-t border-primary-100">
                <div className="text-[10px] text-gray-500 text-center">
                  {Math.round((dailyStats.actualIncome / dailyStats.expectedIncome) * 100)}% completado
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Types */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-2 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-dark-green mb-1.5 flex items-center">
              <UserGroupIcon className="h-3 w-3 mr-1 text-primary-600" />
              Tipos de Consulta
            </h3>
            
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-1"></div>
                  <span className="text-[10px] text-gray-600">Primera Vez</span>
                </div>
                <span className="font-medium text-gray-900 text-[10px]">{dailyStats.firstTimeConsultations}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></div>
                  <span className="text-[10px] text-gray-600">Subsecuente</span>
                </div>
                <span className="font-medium text-gray-900 text-[10px]">{dailyStats.followUpConsultations}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <VideoCameraIcon className="h-2.5 w-2.5 text-purple-500 mr-1" />
                  <span className="text-[10px] text-gray-600">Video</span>
                </div>
                <span className="font-medium text-gray-900 text-[10px]">{dailyStats.videoConsultations}</span>
              </div>
            </div>
          </div>

          {/* Blocked Slots */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-2 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-dark-green mb-1.5 flex items-center">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-orange-600" />
              Bloqueados
            </h3>
            
            <div className="space-y-0.5">
              {dailyStats.blockedReasons.length > 0 ? (
                dailyStats.blockedReasons.map((reason: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                      <span className="text-[10px] text-gray-600">{reason.label}</span>
                    </div>
                    <span className="font-medium text-gray-900 text-[10px]">{reason.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-gray-500 text-center py-1">
                  Sin horarios bloqueados
                </div>
              )}
              
              <div className="pt-1 border-t border-primary-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-gray-700">Total</span>
                  <span className="font-bold text-orange-600 text-[10px]">{dailyStats.blockedSlots}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estados de Citas - Now in a compact grid */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-2 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-dark-green mb-1.5">Estados</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Agendada</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Confirmada+$</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Confirmada</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Completada</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Inasistencia</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-[9px] text-gray-600">Cancelada</span>
              </div>
            </div>
          </div>

          {/* Quick Actions - Más compacto */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-2 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-dark-green mb-1.5">Acciones</h3>
            <div className="space-y-1">
              <Button 
                onClick={handleBlockTime}
                variant="outline" 
                className="w-full justify-start text-left border-orange-200 text-orange-600 hover:bg-orange-50 h-7 text-[10px] px-2"
                size="sm"
              >
                <ClockIcon className="h-2.5 w-2.5 mr-1" />
                Bloquear Horario
              </Button>
              <Button 
                onClick={handleWaitingList}
                variant="outline" 
                className="w-full justify-start text-left border-primary-200 text-primary-600 hover:bg-primary-50 h-7 text-[10px] px-2"
                size="sm"
              >
                <UserGroupIcon className="h-2.5 w-2.5 mr-1" />
                Lista de Espera
              </Button>
              <Button 
                onClick={handleExportAgenda}
                variant="outline" 
                className="w-full justify-start text-left border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-7 text-[10px] px-2"
                size="sm"
              >
                <CalendarDaysIcon className="h-2.5 w-2.5 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Cita */}
      {showNewAppointment && (
        <NewAppointmentModal
          selectedDate={appointmentDate}
          onClose={() => {
            setShowNewAppointment(false);
            setAppointmentTime('');
            setEditingAppointment(null);
          }}
          onSave={handleSaveAppointment}
          selectedTime={appointmentTime}
          editingAppointment={editingAppointment}
        />
      )}

      {/* Modal de Bloquear Horario */}
      <BlockTimeModal
        isOpen={showBlockTime}
        onClose={() => setShowBlockTime(false)}
        onSave={handleSaveBlockedTime}
      />

      {/* Modal de Lista de Espera */}
      <WaitingListModal
        isOpen={showWaitingList}
        onClose={() => setShowWaitingList(false)}
        onAssignPatient={handleAssignPatientFromWaitingList}
      />

      {/* Modal de Detalles de Cita */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showAppointmentDetails}
          onClose={() => {
            setShowAppointmentDetails(false);
            setSelectedAppointment(null);
          }}
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
          onStatusChange={handleStatusChange}
        />
      )}

      {showNewPatientModal && (
        <NewPatientQuickModal
          onClose={() => setShowNewPatientModal(false)}
          onSave={handleNewPatientSaved}
        />
      )}

      {/* Modal para Agregar a Lista de Espera */}
      {showAddToWaitingList && (
        <AddToWaitingListModal
          onClose={() => setShowAddToWaitingList(false)}
          onSave={handleSaveToWaitingList}
        />
      )}
    </div>
    </AgendaErrorBoundary>
  );
}