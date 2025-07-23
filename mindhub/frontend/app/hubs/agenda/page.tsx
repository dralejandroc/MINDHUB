'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import AgendaCalendar from '@/components/agenda/AgendaCalendar';
import AppointmentList from '@/components/agenda/AppointmentList';
import NewAppointmentModal from '@/components/agenda/NewAppointmentModal';
import BlockTimeModal from '@/components/agenda/BlockTimeModal';
import WaitingListModal from '@/components/agenda/WaitingListModal';
import AppointmentDetailsModal from '@/components/agenda/AppointmentDetailsModal';
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
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      
      if (response.ok) {
        // Recargar calendario
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
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
    setShowWaitingList(true);
  };

  const handleSaveBlockedTime = async (blockData: any) => {
    try {
      // TODO: Implement blocked-times endpoint in backend
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/blocked-times`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(blockData)
      // });
      
      console.log('Blocked time data:', blockData);
      // Temporary mock success - simulate successful response
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

  const handleSettings = () => {
    const setting = prompt(
      'Configuración de horarios:\n1. Horario de atención\n2. Duración de citas por defecto\n3. Días laborables\n4. Horario de comida\n5. Tipos de consulta',
      '1'
    );
    
    if (setting === '1') {
      const schedule = prompt('Horario de atención (ej: 08:00-20:00):', '08:00-20:00');
      if (schedule) alert(`Horario actualizado: ${schedule}`);
    } else if (setting === '2') {
      const duration = prompt('Duración por defecto (minutos):', '60');
      if (duration) alert(`Duración actualizada: ${duration} minutos`);
    } else if (setting === '3') {
      const days = prompt('Días laborables (L,M,X,J,V,S):', 'L,M,X,J,V,S');
      if (days) alert(`Días laborables actualizados: ${days}`);
    }
  };

  // Mock data for daily stats
  const dailyStats = {
    expectedIncome: 12500,
    advancePayments: 3200,
    actualIncome: 7800,
    firstTimeConsultations: 3,
    followUpConsultations: 8,
    videoConsultations: 2,
    blockedSlots: 2,
    blockedReasons: [
      { type: 'personal', count: 1, label: 'Espacio Personal' },
      { type: 'holiday', count: 1, label: 'Día Feriado' }
    ]
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda - Sistema de Citas"
        description="Gestiona citas médicas y programación de consultas"
        icon={CalendarIcon}
        iconColor="text-orange-600"
        actions={[
          <Button
            key="settings"
            onClick={handleSettings}
            variant="outline"
            size="sm"
            className="mr-1"
          >
            <Cog6ToothIcon className="h-3 w-3 mr-1" />
            Configurar
          </Button>,
          <Button
            key="new-appointment"
            onClick={handleNewAppointment}
            variant="orange"
            size="sm"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Nueva Cita
          </Button>
        ]}
      />
      
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
              <AgendaCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onNewAppointment={handleNewAppointment}
                onAppointmentClick={handleAppointmentClick}
                viewType={calendarView}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange">
              <AppointmentList
                selectedDate={selectedDate}
                onNewAppointment={handleNewAppointment}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Daily Stats */}
        <div className="lg:col-span-1 space-y-3">
          {/* Daily Financial Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-3 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient">
            <h3 className="text-sm font-semibold text-dark-green mb-3 flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
              Resumen del Día
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Estimado Esperado</span>
                <span className="font-medium text-gray-900 text-xs">${dailyStats.expectedIncome.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Anticipos Pagados</span>
                <span className="font-medium text-primary-600 text-xs">${dailyStats.advancePayments.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Ingresos Reales</span>
                <span className="font-medium text-emerald-600 text-xs">${dailyStats.actualIncome.toLocaleString()}</span>
              </div>
              
              <hr className="my-1.5 border-primary-100" />
              
              <div className="text-xs text-gray-500">
                Progreso: {Math.round((dailyStats.actualIncome / dailyStats.expectedIncome) * 100)}% del día
              </div>
            </div>
          </div>

          {/* Consultation Types */}
          <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-3 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient">
            <h3 className="text-sm font-semibold text-dark-green mb-3 flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-1.5 text-primary-600" />
              Tipos de Consulta
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-1.5"></div>
                  <span className="text-xs text-gray-600">Primera Vez</span>
                </div>
                <span className="font-medium text-gray-900 text-xs">{dailyStats.firstTimeConsultations}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></div>
                  <span className="text-xs text-gray-600">Subsecuente</span>
                </div>
                <span className="font-medium text-gray-900 text-xs">{dailyStats.followUpConsultations}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <VideoCameraIcon className="h-3 w-3 text-purple-500 mr-1.5" />
                  <span className="text-xs text-gray-600">Video Consulta</span>
                </div>
                <span className="font-medium text-gray-900 text-xs">{dailyStats.videoConsultations}</span>
              </div>
            </div>
          </div>

          {/* Blocked Slots */}
          <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-3 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient">
            <h3 className="text-sm font-semibold text-dark-green mb-3 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-orange-600" />
              Espacios Bloqueados
            </h3>
            
            <div className="space-y-2">
              {dailyStats.blockedReasons.map((reason, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></div>
                    <span className="text-xs text-gray-600">{reason.label}</span>
                  </div>
                  <span className="font-medium text-gray-900 text-xs">{reason.count}</span>
                </div>
              ))}
              
              <hr className="my-1.5 border-primary-100" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">Total Bloqueados</span>
                <span className="font-bold text-orange-600 text-xs">{dailyStats.blockedSlots}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-3 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient">
            <h3 className="text-sm font-semibold text-dark-green mb-3">Acciones Rápidas</h3>
            <div className="space-y-1.5">
              <Button 
                onClick={handleBlockTime}
                variant="outline" 
                className="w-full justify-start text-left border-orange-200 text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <ClockIcon className="h-3 w-3 mr-1.5" />
                Bloquear Horario
              </Button>
              <Button 
                onClick={handleWaitingList}
                variant="outline" 
                className="w-full justify-start text-left border-primary-200 text-primary-600 hover:bg-primary-50"
                size="sm"
              >
                <UserGroupIcon className="h-3 w-3 mr-1.5" />
                Lista de Espera
              </Button>
              <Button 
                onClick={handleExportAgenda}
                variant="outline" 
                className="w-full justify-start text-left border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                size="sm"
              >
                <CalendarDaysIcon className="h-3 w-3 mr-1.5" />
                Exportar Agenda
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
          }}
          onSave={handleSaveAppointment}
          selectedTime={appointmentTime}
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
          onEdit={(appointment) => {
            // Opcional: implementar edición de cita
            console.log('Edit appointment:', appointment);
          }}
          onDelete={(appointmentId) => {
            // Opcional: implementar eliminación de cita
            console.log('Delete appointment:', appointmentId);
          }}
          onStatusChange={(appointmentId, status) => {
            // Opcional: implementar cambio de estado
            console.log('Status change:', appointmentId, status);
          }}
        />
      )}
    </div>
  );
}