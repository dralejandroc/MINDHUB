'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { AppointmentTooltip } from './AppointmentTooltip';

interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'confirmed-no-deposit' | 'completed' | 'cancelled' | 'no-show' | 'modified';
  typeColor?: string;
  hasDeposit?: boolean;
  notes?: string;
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
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);

  // Cargar configuración de agenda y citas
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Starting to load agenda data...');
        console.log('🔗 API URL:', process.env.NEXT_PUBLIC_API_URL);
        
        // Cargar configuración de agenda
        const configUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/expedix/schedule-config`;
        console.log('🔄 Fetching config from:', configUrl);
        const configResponse = await fetch(configUrl);
        console.log('📡 Config response status:', configResponse.status);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success && configData.data) {
            setScheduleConfig(configData.data);
            console.log('📅 Loaded schedule config:', configData.data);
          }
        } else {
          console.error('❌ Config response failed:', configResponse.status, await configResponse.text());
        }

        // Cargar citas
        const appointmentsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/expedix/agenda/appointments`;
        console.log('🔄 Fetching appointments from:', appointmentsUrl);
        const appointmentsResponse = await fetch(appointmentsUrl);
        console.log('📡 Appointments response status:', appointmentsResponse.status);
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          console.log('📅 Raw appointments data:', appointmentsData);
          console.log('📊 Total appointments received:', appointmentsData?.data?.length || 0);
          
          if (appointmentsData.success && appointmentsData.data) {
            // Transform appointments to match expected format by date
            const appointmentsByDate: { [key: string]: Appointment[] } = {};
            
            appointmentsData.data.forEach((apt: any) => {
              const appointment: Appointment = {
                id: apt.id,
                patientId: apt.patientId,
                patientName: apt.patient?.name || 'Paciente desconocido',
                time: apt.time,
                duration: apt.duration || 60,
                type: apt.type,
                status: apt.status as any,
                typeColor: apt.typeColor || '#6B7280', // Use color from backend directly
                hasDeposit: apt.status === 'confirmed',
                notes: apt.notes || ''
              };
              
              console.log(`📌 Processing appointment: ${apt.date} ${apt.time} - ${apt.patient?.name}`);
              
              if (!appointmentsByDate[apt.date]) {
                appointmentsByDate[apt.date] = [];
              }
              appointmentsByDate[apt.date].push(appointment);
            });
            
            console.log('📋 Processed appointments by date:', appointmentsByDate);
            console.log('📅 Dates with appointments:', Object.keys(appointmentsByDate).sort());
            
            // Check July 2025 specifically
            const july2025Dates = Object.keys(appointmentsByDate).filter(date => date.startsWith('2025-07'));
            console.log('🌟 July 2025 dates with appointments:', july2025Dates);
            
            setAppointments(appointmentsByDate);
            console.log('✅ Appointments state updated with', Object.keys(appointmentsByDate).length, 'dates');
          } else {
            console.warn('⚠️ Appointments data not successful or missing data property');
          }
        } else {
          console.error('❌ Appointments response failed:', appointmentsResponse.status, await appointmentsResponse.text());
        }
      } catch (error) {
        console.error('❌ Error loading agenda data:', error);
        // Initialize with empty appointments on error
        setAppointments({});
      }
    };
    
    loadData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get working days from config
    const workingDays = scheduleConfig?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const startDate = new Date(firstDay);
    // Ajustar para empezar en lunes
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Domingo = 7
    startDate.setDate(startDate.getDate() - (firstDayOfWeek - 1));
    
    const days: Date[] = [];
    // Generate up to 42 days (6 weeks) and filter by working days
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dayName = dayMap[day.getDay()];
      
      if (workingDays.includes(dayName)) {
        days.push(day);
      }
    }
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    // Ajustar para empezar en lunes (si es domingo, retroceder 6 días)
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    const days: Date[] = [];
    // Get working days from config, default to Monday-Saturday
    const workingDays = scheduleConfig?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Generate 7 days and filter by working days
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayName = dayMap[day.getDay()];
      
      if (workingDays.includes(dayName)) {
        days.push(day);
      }
    }
    
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    
    // Configuración por defecto
    let startTime = '08:00';
    let endTime = '20:00';
    let lunchBreak = null;
    let defaultDuration = 60; // minutos
    let bufferTime = 0; // minutos
    
    if (scheduleConfig) {
      startTime = scheduleConfig.workingHours.start;
      endTime = scheduleConfig.workingHours.end;
      defaultDuration = scheduleConfig.defaultAppointmentDuration || 60;
      bufferTime = scheduleConfig.bufferTime || 0;
      
      if (scheduleConfig.lunchBreak?.enabled) {
        lunchBreak = {
          start: scheduleConfig.lunchBreak.start,
          end: scheduleConfig.lunchBreak.end
        };
      }
    }
    
    // Convertir tiempos a minutos para cálculos precisos
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const workStartMinutes = (startHour * 60) + startMinute;
    const workEndMinutes = (endHour * 60) + endMinute;
    
    // La agenda debe mostrar desde 1 hora antes del inicio hasta 30 min después del final
    const agendaStartMinutes = workStartMinutes - 60; // 1 hora antes
    const agendaEndMinutes = workEndMinutes + 30;     // 30 min después
    
    // Generar slots basados en la duración configurada (no 15 min fijos)
    const slotInterval = defaultDuration; // Usar la duración configurada como intervalo
    
    // Crear slots de tiempo usando la duración configurada
    for (let minutes = agendaStartMinutes; minutes < agendaEndMinutes; minutes += slotInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      // Validar horarios válidos (no negativos, no más de 23:59)
      if (hours >= 0 && hours < 24) {
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        // Incluir todos los slots, los de comida se mostrarán de manera especial
        slots.push(timeSlot);
      }
    }
    
    return slots;
  };

  const isTimeInRange = (time: string, start: string, end: string) => {
    const timeNum = parseTimeToMinutes(time);
    const startNum = parseTimeToMinutes(start);
    const endNum = parseTimeToMinutes(end);
    return timeNum >= startNum && timeNum < endNum;
  };

  const parseTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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
    const dayAppointments = appointments[dateKey] || [];
    if (dayAppointments.length > 0) {
      console.log(`🗓️ Found ${dayAppointments.length} appointments for ${dateKey}:`, dayAppointments);
    }
    return dayAppointments;
  };

  const getStatusIndicatorColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-400'; // Amarillo - Agendada sin depósito
      case 'confirmed':
        return 'bg-green-500'; // Verde - Confirmada con depósito
      case 'confirmed-no-deposit':
        return 'bg-orange-500'; // Naranja - Confirmada sin depósito
      case 'completed':
        return 'bg-blue-500'; // Azul - Completada
      case 'no-show':
        return 'bg-red-500'; // Rojo - Inasistencia
      case 'cancelled':
      case 'modified':
        return 'bg-gray-400'; // Gris - Cancelada/Modificada
      default:
        return 'bg-gray-300';
    }
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
            <div className={`grid gap-1 mb-2 grid-cols-${days.length}`}>
              {(() => {
                const workingDays = scheduleConfig?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                
                return dayMap.map((dayName, index) => 
                  workingDays.includes(dayName) ? (
                    <div 
                      key={dayName}
                      className="p-1 text-center text-xs font-medium"
                      style={{ color: 'var(--neutral-600)' }}
                    >
                      {dayLabels[index]}
                    </div>
                  ) : null
                ).filter(Boolean);
              })()}
            </div>

            {/* Días del mes */}
            <div className={`grid gap-1 grid-cols-${Math.min(days.length, 7)}`}>
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelectedDate = isSelected(day);
                const hasBlockedTime = dayAppointments.some(apt => apt.type === 'blocked');

                return (
                  <button
                    key={index}
                    onClick={() => onDateSelect(day)}
                    className={`
                      relative p-2 text-xs rounded transition-all duration-200 min-h-[70px] flex flex-col items-center
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
                    <span className="text-sm mb-1">{day.getDate()}</span>
                    {dayAppointments.length > 0 && isCurrentMonth && (
                      <>
                        {/* Número de citas */}
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white
                          ${hasBlockedTime ? 'bg-gray-500' : dayAppointments.length > 5 ? 'bg-red-500' : dayAppointments.length > 2 ? 'bg-orange-500' : 'bg-green-500'}
                        `}>
                          {dayAppointments.filter(apt => apt.type !== 'blocked').length}
                        </div>
                        
                        {/* Indicador de bloqueo si existe */}
                        {hasBlockedTime && (
                          <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-500 rounded-full" title="Tiempo bloqueado" />
                        )}
                      </>
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
              {timeSlots.map((timeSlot, timeIndex) => {
                // Verificar si este slot es el inicio del horario de comida
                const isLunchStart = scheduleConfig?.lunchBreak?.enabled && 
                  timeSlot === scheduleConfig.lunchBreak.start;
                
                // Si es el inicio del lunch break, renderizar una fila especial compacta
                if (isLunchStart) {
                  return (
                    <React.Fragment key={`lunch-${timeSlot}`}>
                      <div 
                        className="p-1 text-xs border-r font-medium"
                        style={{ 
                          color: 'var(--orange-600)',
                          borderColor: 'var(--neutral-200)',
                          backgroundColor: '#FEF3C7'
                        }}
                      >
                        🍽️ Comida
                      </div>
                      {days.map((day, dayIndex) => (
                        <div
                          key={`${dayIndex}-lunch`}
                          className="p-1 border-b border-r min-h-[25px] text-center cursor-not-allowed"
                          style={{ 
                            borderColor: 'var(--neutral-200)',
                            backgroundColor: '#FEF3C7'
                          }}
                        >
                          <div className="flex items-center justify-center h-full">
                            <div className="text-xs text-yellow-800 font-medium leading-tight">
                              🍽️ {scheduleConfig.lunchBreak.start} - {scheduleConfig.lunchBreak.end}
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                }

                // Verificar si este slot está dentro del rango del horario de comida (pero no es el inicio)
                const isInLunchRange = scheduleConfig?.lunchBreak?.enabled && 
                  isTimeInRange(timeSlot, scheduleConfig.lunchBreak.start, scheduleConfig.lunchBreak.end) &&
                  timeSlot !== scheduleConfig.lunchBreak.start;

                // Saltar los slots que están dentro del rango del lunch (excepto el primero)
                if (isInLunchRange) {
                  return null;
                }

                return (
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
                      
                      // Buscar cita que inicia en este slot
                      const slotAppointment = dayAppointments.find(apt => apt.time === timeSlot);
                      
                      // Buscar si este slot está ocupado por una cita que empezó antes
                      const occupiedByAppointment = dayAppointments.find(apt => {
                        if (apt.time === timeSlot) return false; // Ya lo manejamos arriba
                        
                        const aptStartMinutes = parseTimeToMinutes(apt.time);
                        const slotMinutes = parseTimeToMinutes(timeSlot);
                        const aptEndMinutes = aptStartMinutes + (apt.duration || 60);
                        
                        return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
                      });
                      
                      const effectiveAppointment = slotAppointment || occupiedByAppointment;
                      const isAppointmentStart = !!slotAppointment; // True solo si la cita inicia aquí
                      
                      return (
                        <button
                          key={`${dayIndex}-${timeSlot}`}
                          onClick={() => {
                            onDateSelect(day);
                            if (effectiveAppointment) {
                              // Si hay una cita ocupando este slot, mostrar detalles
                              if (onAppointmentClick) {
                                onAppointmentClick(effectiveAppointment, day);
                              }
                            } else {
                              // Si el slot está vacío, abrir modal de nueva cita
                              onNewAppointment(day, timeSlot);
                            }
                          }}
                          className={`p-0.5 border-b border-r min-h-[25px] transition-all duration-200 text-left relative ${
                            effectiveAppointment ? 'hover:opacity-90' : 'hover:bg-blue-50 hover:shadow-sm'
                          }`}
                          style={{ 
                            borderColor: 'var(--neutral-200)',
                            backgroundColor: effectiveAppointment ? 'transparent' : (
                              // Sombrear espacios disponibles
                              timeSlot.endsWith(':00') ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)'
                            )
                          }}
                        >
                          {effectiveAppointment && isAppointmentStart ? (
                            <div className="relative h-full">
                              <AppointmentTooltip 
                                appointment={effectiveAppointment} 
                                position="right"
                              >
                                {/* Cita unificada que puede expandirse a múltiples slots */}
                                <div 
                                  className={`absolute inset-0 text-white cursor-pointer ${
                                    effectiveAppointment.status === 'cancelled' || effectiveAppointment.status === 'modified' 
                                      ? 'line-through opacity-60' : ''
                                  }`}
                                  style={{
                                    height: `${Math.max(1, Math.ceil((effectiveAppointment.duration || 30) / (scheduleConfig?.defaultAppointmentDuration || 30))) * 25}px`,
                                    backgroundColor: effectiveAppointment.typeColor?.startsWith('#') 
                                      ? effectiveAppointment.typeColor 
                                      : '#6B7280', // Default gray
                                    zIndex: 10,
                                    borderRadius: '4px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                                  }}
                                >
                                  <div className="p-1 h-full flex flex-col justify-center overflow-hidden">
                                    {effectiveAppointment.duration <= 30 ? (
                                      // Layout compacto para citas de 30 minutos o menos
                                      <div className="text-xs font-medium truncate leading-tight">
                                        {effectiveAppointment.patientName}
                                      </div>
                                    ) : (
                                      // Layout expandido para citas más largas
                                      <>
                                        <div className="text-xs font-medium truncate leading-tight">
                                          {effectiveAppointment.patientName}
                                        </div>
                                        <div className="text-xs opacity-90 truncate leading-tight">
                                          {effectiveAppointment.type}
                                        </div>
                                        {effectiveAppointment.duration !== 60 && (
                                          <div className="text-xs opacity-75 leading-tight">
                                            {effectiveAppointment.duration}min
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Círculo de estado */}
                                  <div 
                                    className={`absolute top-0 right-0 w-2 h-2 rounded-full border border-white ${
                                      getStatusIndicatorColor(effectiveAppointment.status)
                                    }`}
                                    style={{ margin: '2px' }}
                                  />
                                </div>
                              </AppointmentTooltip>
                            </div>
                          ) : effectiveAppointment && !isAppointmentStart ? (
                            // Slot ocupado por cita que empezó antes - mantener espacio pero sin contenido visible
                            <div className="h-full bg-transparent">
                              {/* Espacio reservado para la cita que se extiende desde arriba */}
                            </div>
                          ) : (
                            // Espacio disponible con indicador visual sutil
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center opacity-20 text-xs text-gray-400">
                                +
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}