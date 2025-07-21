'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface AgendaCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onNewAppointment: () => void;
}

export default function AgendaCalendar({ selectedDate, onDateSelect, onNewAppointment }: AgendaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<{ [key: string]: Appointment[] }>({});

  // Datos de ejemplo
  useEffect(() => {
    const mockAppointments: { [key: string]: Appointment[] } = {
      '2025-07-20': [
        {
          id: '1',
          patientName: 'María González',
          time: '09:00',
          duration: 60,
          type: 'Consulta inicial',
          status: 'confirmed'
        },
        {
          id: '2',
          patientName: 'Carlos Rodríguez',
          time: '10:30',
          duration: 45,
          type: 'Seguimiento',
          status: 'scheduled'
        },
        {
          id: '3',
          patientName: 'Ana Martínez',
          time: '15:00',
          duration: 60,
          type: 'Evaluación',
          status: 'confirmed'
        }
      ],
      '2025-07-21': [
        {
          id: '4',
          patientName: 'Pedro López',
          time: '11:00',
          duration: 30,
          type: 'Control',
          status: 'scheduled'
        }
      ],
      '2025-07-22': [
        {
          id: '5',
          patientName: 'Sofía García',
          time: '14:00',
          duration: 90,
          type: 'Terapia',
          status: 'confirmed'
        }
      ]
    };
    setAppointments(mockAppointments);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date, month: Date) => {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return appointments[dateKey] || [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendario */}
      <div 
        className="lg:col-span-2 bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-xl font-bold capitalize"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {monthName}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" style={{ color: 'var(--primary-600)' }} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)'
              }}
            >
              Hoy
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" style={{ color: 'var(--primary-600)' }} />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div 
              key={day}
              className="p-2 text-center text-xs font-medium"
              style={{ color: 'var(--neutral-600)' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isSelectedDate = isSelected(day);

            return (
              <button
                key={index}
                onClick={() => onDateSelect(day)}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200 min-h-[80px] flex flex-col items-start justify-start
                  ${isCurrentMonth ? 'hover:bg-gray-50' : 'text-gray-300'}
                  ${isTodayDate ? 'font-bold' : ''}
                  ${isSelectedDate ? 'ring-2' : ''}
                `}
                style={{
                  backgroundColor: isSelectedDate ? 'var(--primary-50)' : 'transparent',
                  borderColor: isTodayDate ? 'var(--secondary-500)' : 'transparent',
                  border: isTodayDate ? '2px solid' : '2px solid transparent',
                  ringColor: isSelectedDate ? 'var(--primary-500)' : undefined,
                  color: isCurrentMonth ? (isTodayDate ? 'var(--secondary-700)' : 'var(--dark-green)') : 'var(--neutral-400)'
                }}
              >
                <span className="mb-1">{day.getDate()}</span>
                {dayAppointments.length > 0 && (
                  <div className="w-full space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="text-xs p-1 rounded text-white truncate w-full"
                        style={{
                          backgroundColor: appointment.status === 'confirmed' 
                            ? 'var(--secondary-500)' 
                            : appointment.status === 'completed'
                            ? 'var(--primary-500)'
                            : 'var(--accent-500)'
                        }}
                      >
                        {appointment.time}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div 
                        className="text-xs text-center"
                        style={{ color: 'var(--neutral-500)' }}
                      >
                        +{dayAppointments.length - 2} más
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel lateral - Citas del día seleccionado */}
      <div 
        className="bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="text-lg font-bold"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {selectedDate.toLocaleDateString('es-ES', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </h3>
          <button
            onClick={onNewAppointment}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--secondary-100)',
              color: 'var(--secondary-700)'
            }}
          >
            <ClockIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {getAppointmentsForDate(selectedDate).length > 0 ? (
            getAppointmentsForDate(selectedDate).map((appointment) => (
              <div
                key={appointment.id}
                className="p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ 
                  border: '1px solid var(--neutral-200)',
                  backgroundColor: appointment.status === 'confirmed' 
                    ? 'var(--secondary-50)' 
                    : appointment.status === 'completed'
                    ? 'var(--primary-50)'
                    : 'var(--neutral-50)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span 
                        className="font-medium text-sm"
                        style={{ color: 'var(--dark-green)' }}
                      >
                        {appointment.time}
                      </span>
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: appointment.status === 'confirmed' 
                            ? 'var(--secondary-100)' 
                            : appointment.status === 'completed'
                            ? 'var(--primary-100)'
                            : 'var(--accent-100)',
                          color: appointment.status === 'confirmed' 
                            ? 'var(--secondary-700)' 
                            : appointment.status === 'completed'
                            ? 'var(--primary-700)'
                            : 'var(--accent-700)'
                        }}
                      >
                        {appointment.status === 'confirmed' ? 'Confirmada' : 
                         appointment.status === 'completed' ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mb-1">
                      <UserIcon className="h-3 w-3" style={{ color: 'var(--neutral-500)' }} />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {appointment.patientName}
                      </span>
                    </div>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      {appointment.type} • {appointment.duration} min
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ClockIcon 
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: 'var(--neutral-300)' }}
              />
              <p 
                className="text-sm font-medium mb-2"
                style={{ color: 'var(--neutral-600)' }}
              >
                No hay citas programadas
              </p>
              <p 
                className="text-xs"
                style={{ color: 'var(--neutral-500)' }}
              >
                Haz clic en "Nueva Cita" para agendar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}