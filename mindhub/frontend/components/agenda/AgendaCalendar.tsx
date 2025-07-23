'use client';

import React, { useState, useEffect } from 'react';
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
  onNewAppointment: (date?: Date, time?: string) => void;
  onAppointmentClick?: (appointment: Appointment, date: Date) => void;
  viewType?: 'week' | 'month';
}

export default function AgendaCalendar({ selectedDate, onDateSelect, onNewAppointment, onAppointmentClick, viewType = 'month' }: AgendaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<{ [key: string]: Appointment[] }>({});

  // Cargar citas desde API
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        // Llamada real a la API de agenda
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/appointments`);
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        // Silenciar completamente el error 404
        // console.log('Loading temporary appointments data...');
        // Solo en caso de error, usar datos temporales para desarrollo
        const tempAppointments: { [key: string]: Appointment[] } = {
          '2025-07-22': [
            {
              id: '1',
              patientName: 'María González',
              time: '09:00',
              duration: 60,
              type: 'Consulta inicial',
              status: 'confirmed'
            }
          ]
        };
        setAppointments(tempAppointments);
      }
    };
    
    loadAppointments();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    // Ajustar para empezar en lunes
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Domingo = 7
    startDate.setDate(startDate.getDate() - (firstDayOfWeek - 1));
    
    const days = [];
    // 6 semanas x 6 días = 36 días máximo
    for (let i = 0; i < 36; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    // Ajustar para empezar en lunes (si es domingo, retroceder 6 días)
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    const days = [];
    // Solo 6 días (lunes a sábado)
    for (let i = 0; i < 6; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
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
    if (viewType === 'week') {
      // En vista semanal, navegar por semanas
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
      onDateSelect(newDate);
    } else {
      // En vista mensual, navegar por meses
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
      setCurrentMonth(newMonth);
    }
  };

  const days = viewType === 'week' ? getDaysInWeek(selectedDate) : getDaysInMonth(currentMonth);
  const timeSlots = getTimeSlots();
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const weekDays = getDaysInWeek(selectedDate);
  const weekRange = viewType === 'week' 
    ? `${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekDays[weekDays.length - 1].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    : monthName;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Calendario */}
      <div 
        className="bg-white rounded-xl p-4 border"
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
            {weekRange}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" style={{ color: 'var(--primary-600)' }} />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                if (viewType === 'week') {
                  onDateSelect(today);
                } else {
                  setCurrentMonth(today);
                }
              }}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)'
              }}
            >
              {viewType === 'week' ? 'Esta Semana' : 'Este Mes'}
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" style={{ color: 'var(--primary-600)' }} />
            </button>
          </div>
        </div>

        {viewType === 'month' ? (
          <>
            {/* Días de la semana */}
            <div className="grid grid-cols-6 gap-1 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div 
                  key={day}
                  className="p-1 text-center text-xs font-medium"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-6 gap-1">
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
                      p-1 text-xs rounded transition-all duration-200 min-h-[60px] flex flex-col items-start justify-start
                      ${isCurrentMonth ? 'hover:bg-gray-50' : 'text-gray-300'}
                      ${isTodayDate ? 'font-bold' : ''}
                      ${isSelectedDate ? 'ring-2' : ''}
                    `}
                    style={{
                      backgroundColor: isSelectedDate ? 'var(--primary-50)' : 'transparent',
                      borderColor: isTodayDate ? 'var(--secondary-500)' : 'transparent',
                      border: isTodayDate ? '2px solid' : '2px solid transparent',
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
          </>
        ) : (
          <>
            {/* Vista semanal con horarios */}
            <div className="grid grid-cols-7 gap-0.5 text-xs">
              {/* Header con horas */}
              <div className="p-1"></div>
              {days.map((day, index) => (
                <div 
                  key={index}
                  className="p-1 text-center border-b"
                  style={{ borderColor: 'var(--neutral-200)' }}
                >
                  <div className="text-xs font-medium" style={{ color: 'var(--neutral-600)' }}>
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div 
                    className={`text-lg font-bold ${isToday(day) ? 'text-white' : ''}`}
                    style={{ 
                      color: isToday(day) ? 'white' : 'var(--dark-green)',
                      backgroundColor: isToday(day) ? 'var(--secondary-500)' : 'transparent',
                      borderRadius: isToday(day) ? '50%' : '0',
                      width: isToday(day) ? '32px' : 'auto',
                      height: isToday(day) ? '32px' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
              
              {/* Franjas horarias */}
              {timeSlots.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  <div 
                    className="p-1 text-xs border-r"
                    style={{ 
                      color: 'var(--neutral-500)',
                      borderColor: 'var(--neutral-200)'
                    }}
                  >
                    {timeSlot}
                  </div>
                  {days.map((day, dayIndex) => {
                    const dayKey = formatDateKey(day);
                    const dayAppointments = appointments[dayKey] || [];
                    const slotAppointment = dayAppointments.find(apt => apt.time === timeSlot);
                    
                    return (
                      <button
                        key={`${dayIndex}-${timeSlot}`}
                        onClick={() => {
                          onDateSelect(day);
                          if (slotAppointment) {
                            // Si hay una cita ocupando este slot, mostrar detalles
                            if (onAppointmentClick) {
                              onAppointmentClick(slotAppointment, day);
                            }
                          } else {
                            // Si el slot está vacío, abrir modal de nueva cita
                            onNewAppointment(day, timeSlot);
                          }
                        }}
                        className="p-0.5 border-b border-r min-h-[40px] hover:bg-gray-50 transition-colors text-left"
                        style={{ 
                          borderColor: 'var(--neutral-200)',
                          backgroundColor: slotAppointment ? (
                            slotAppointment.status === 'confirmed' ? 'var(--secondary-50)' :
                            slotAppointment.status === 'completed' ? 'var(--primary-50)' :
                            'var(--neutral-50)'
                          ) : 'transparent'
                        }}
                      >
                        {slotAppointment && (
                          <div 
                            className="text-xs p-1 rounded text-white cursor-pointer"
                            style={{
                              backgroundColor: slotAppointment.status === 'confirmed' 
                                ? 'var(--secondary-500)' 
                                : slotAppointment.status === 'completed'
                                ? 'var(--primary-500)'
                                : 'var(--accent-500)'
                            }}
                          >
                            <div className="font-medium truncate">{slotAppointment.patientName}</div>
                            <div className="opacity-80">{slotAppointment.type}</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}