'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import AgendaCalendar from '@/components/agenda/AgendaCalendar';
import AppointmentList from '@/components/agenda/AppointmentList';
import NewAppointmentModal from '@/components/agenda/NewAppointmentModal';
import AgendaStats from '@/components/agenda/AgendaStats';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export default function AgendaPage() {
  const [activeView, setActiveView] = useState('calendar');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const viewButtons = [
    { id: 'calendar', name: 'Calendario', icon: CalendarIcon },
    { id: 'list', name: 'Lista', icon: ClockIcon },
    { id: 'stats', name: 'Estadísticas', icon: UserGroupIcon }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda y Citas"
        description="Gestiona tu agenda diaria, citas programadas y disponibilidad."
        icon={CalendarIcon}
        iconColor="text-blue-600"
        actions={
          <Button 
            onClick={() => setShowNewAppointment(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        }
      >
        {/* Navigation tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {viewButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <button
                key={button.id}
                onClick={() => setActiveView(button.id)}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeView === button.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {button.name}
              </button>
            );
          })}
        </div>
      </PageHeader>

      {/* Contenido principal */}
      <div>
        {activeView === 'calendar' && (
          <AgendaCalendar 
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onNewAppointment={() => setShowNewAppointment(true)}
          />
        )}
        
        {activeView === 'list' && (
          <AppointmentList 
            selectedDate={selectedDate}
            onNewAppointment={() => setShowNewAppointment(true)}
          />
        )}
        
        {activeView === 'stats' && (
          <AgendaStats />
        )}
      </div>

      {/* Modal para nueva cita */}
      {showNewAppointment && (
        <NewAppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowNewAppointment(false)}
          onSave={(appointment) => {
            // TODO: Guardar cita
            console.log('Nueva cita:', appointment);
            setShowNewAppointment(false);
          }}
        />
      )}
    </div>
  );
}