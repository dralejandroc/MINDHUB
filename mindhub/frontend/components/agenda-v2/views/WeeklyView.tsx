'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarHeader } from '../shared/CalendarHeader';
import { TimeSlotGrid, ScheduleConfig } from '../shared/TimeSlotGrid';
import { AppointmentCard, AppointmentData } from '../shared/AppointmentCard';
import { PatientTooltip, PatientTooltipData } from '../shared/PatientTooltip';

export interface WeeklyViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentData[];
  scheduleConfig: ScheduleConfig;
  licenseType: 'clinic' | 'individual';
  canSwitchToClinicViews?: boolean;
  
  // Header props
  onNewAppointment?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onViewChange?: (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => void;
  todayStats?: {
    totalAppointments: number;
    confirmed: number;
    pending: number;
    completed: number;
  };
  
  // Loading states
  isLoading?: boolean;
  lastRefresh?: Date;
  
  // Event handlers
  onAppointmentClick?: (appointment: AppointmentData, event?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, minute: number) => void;
  onAppointmentDragStart?: (appointment: AppointmentData) => void;
  onAppointmentDrop?: (appointment: AppointmentData, newDate: Date, newHour: number, newMinute: number) => void;
  
  className?: string;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  scheduleConfig,
  licenseType,
  canSwitchToClinicViews = false,
  onNewAppointment,
  onSettings,
  onRefresh,
  onSearch,
  onViewChange,
  todayStats,
  isLoading = false,
  lastRefresh,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentDragStart,
  onAppointmentDrop,
  className = ''
}) => {
  const [draggedAppointment, setDraggedAppointment] = useState<AppointmentData | null>(null);
  const [holdingAppointment, setHoldingAppointment] = useState<string | null>(null); // appointment being held
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [moreOpenKey, setMoreOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!moreOpenKey) return;

    const onDocDown = (e: PointerEvent) => {
      const el = popoverRef.current;
      if (!el) return;

      // ✅ si el click fue dentro del popover, NO cierres
      if (el.contains(e.target as Node)) return;

      setMoreOpenKey(null);
    };

    document.addEventListener('pointerdown', onDocDown);

    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [moreOpenKey]);



  // Group appointments by day
  const appointmentsByDay = appointments.reduce((acc, appointment) => {
    const dayKey = format(appointment.startTime, 'yyyy-MM-dd');
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(appointment);
    return acc;
  }, {} as Record<string, AppointmentData[]>);

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    console.log('View change requested:', view);
    onViewChange?.(view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Handle time slot clicks
  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    // Directly open new appointment modal instead of showing popup
    onTimeSlotClick?.(date, hour, minute);
    onNewAppointment?.();
  };

  // Handle appointment drag and drop
  const handleAppointmentDragStart = (appointment: AppointmentData) => {
    setDraggedAppointment(appointment);
    onAppointmentDragStart?.(appointment);
  };

  const handleTimeSlotDrop = (date: Date, hour: number, minute: number) => {
    if (draggedAppointment) {
      onAppointmentDrop?.(draggedAppointment, date, hour, minute);
      setDraggedAppointment(null);
    }
  };

  const handleAppointmentDragEnd = () => {
    setDraggedAppointment(null);
  };

  // Create patient tooltip data from appointment
  const createPatientTooltipData = (appointment: AppointmentData): PatientTooltipData => ({
    patientId: appointment.patientId,
    name: appointment.patientName,
    dateOfBirth: appointment.patientInfo?.dateOfBirth,
    appointmentTime: format(appointment.startTime, 'HH:mm'),
    duration: appointment.duration,
    consultationType: appointment.consultationType || 'presencial',
    location: appointment.location,
    followUpTimeMonths: appointment.patientInfo?.followUpMonths,
    lastVisitDate: appointment.patientInfo?.lastVisit ? format(appointment.patientInfo.lastVisit, 'yyyy-MM-dd') : undefined,
    phone: appointment.patientInfo?.phone,
    paymentStatus: appointment.paymentStatus,
    licenseType,
    canViewContactInfo: true, // This should come from user permissions
    canViewClinicalHistory: true, // This should come from user permissions
    encryptionStatus: 'encrypted' // Default security status
  });

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType="week"
        onDateChange={onDateChange}
        onViewChange={handleViewChange}
        onToday={handleToday}
        licenseType={licenseType}
        canSwitchToClinicViews={canSwitchToClinicViews}
        onNewAppointment={onNewAppointment}
        onSettings={onSettings}
        onRefresh={onRefresh}
        onSearch={onSearch}
        todayStats={todayStats}
        isLoading={isLoading}
        lastRefresh={lastRefresh}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Week Days Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="grid grid-cols-8 divide-x divide-gray-200">
            {/* Time column header */}
            <div className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              Hora
            </div>
            
            {/* Day headers */}
            {weekDays.map((day) => {
              const dayAppointments = appointmentsByDay[format(day, 'yyyy-MM-dd')] || [];
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-3 text-center border-r border-gray-200 transition-colors
                    ${isCurrentDay 
                      ? 'bg-primary-50 border-primary-200' 
                      : 'bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`
                    text-sm font-medium
                    ${isCurrentDay ? 'text-primary-700' : 'text-gray-900'}
                  `}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`
                    text-lg font-semibold
                    ${isCurrentDay ? 'text-primary-700' : 'text-gray-900'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {dayAppointments.length} citas
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid and Appointments - Mobile/Tablet Friendly */}
        <div className="flex-1 overflow-auto" ref={containerRef}>
          <div className="relative">
            {/* Mobile/Tablet optimized grid */}
            <div className="flex bg-white">
              {/* Time slots column - wider for readability */}
              <div className="bg-gray-50 w-20 flex-shrink-0 border-r border-gray-200">
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 h-12"></div>
                {/* Time labels - Dynamic based on slot duration */}
                {Array.from({ 
                  length: Math.ceil((scheduleConfig.endHour - scheduleConfig.startHour) * (60 / scheduleConfig.slotDuration))
                }, (_, i) => {
                  const totalMinutes = i * scheduleConfig.slotDuration;
                  const hour = scheduleConfig.startHour + Math.floor(totalMinutes / 60);
                  const minute = totalMinutes % 60;
                  
                  // Only show labels for major time marks (every hour or every 30 minutes)
                  const showLabel = scheduleConfig.slotDuration <= 30 
                    ? (minute === 0 || minute === 30) 
                    : minute === 0;

                  return (
                    <div
                      key={`${hour}-${minute}`}
                      className={`h-12 border-b border-gray-100 flex items-center justify-center text-xs text-gray-600 ${
                        !showLabel ? 'border-gray-50' : ''
                      }`}
                    >
                      {showLabel && `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                    </div>
                  );
                })}
              </div>

              {/* Day columns - responsive width */}
              <div className="flex-1 grid grid-cols-7 divide-x divide-gray-200">
                {weekDays.map((day) => {
                const dayAppointments = appointmentsByDay[format(day, 'yyyy-MM-dd')] || [];
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      relative ${isCurrentDay ? 'bg-blue-50' : 'bg-white'} min-h-0
                    `}
                  >
                    {/* Day header */}
                    <div className="h-12 border-b border-gray-200 flex items-center justify-center bg-white sticky top-0 z-10">
                      <span className={`text-xs font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-600'}`}>
                        {format(day, 'EEE d', { locale: es })}
                      </span>
                    </div>

                    {/* Time slots for this day - Dynamic based on slot duration */}
                    <div className="relative">
                      {Array.from({ 
                        length: Math.ceil((scheduleConfig.endHour - scheduleConfig.startHour) * (60 / scheduleConfig.slotDuration))
                      }, (_, i) => {
                        const totalMinutes = i * scheduleConfig.slotDuration;
                        const hour = scheduleConfig.startHour + Math.floor(totalMinutes / 60);
                        const minute = totalMinutes % 60;
                        
                        return (
                          <div
                            key={`${hour}-${minute}`}
                            className="h-12 border-b border-gray-100 hover:bg-gray-50 cursor-pointer relative"
                            onClick={() => handleTimeSlotClick(day, hour, minute)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('bg-blue-100');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('bg-blue-100');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-blue-100');
                              handleTimeSlotDrop(day, hour, minute);
                            }}
                          >
                          {/* Appointments for this time slot */}
                            {(() => {
                              const slotAppointments = dayAppointments.filter(apt => {
                                const aptHour = apt.startTime.getHours();
                                const aptMinute = apt.startTime.getMinutes();
                                return (
                                  aptHour === hour &&
                                  Math.floor(aptMinute / scheduleConfig.slotDuration) * scheduleConfig.slotDuration === minute
                                );
                              });

                              if (slotAppointments.length === 0) return null;
                              const dayKey = format(day, 'yyyy-MM-dd');
                              const slotKey = `${dayKey}-${hour}-${minute}`;

                              const MAX_VISIBLE = 2;
                              const visible = slotAppointments.slice(0, MAX_VISIBLE);
                              const remaining = slotAppointments.length - visible.length;

                              return (
                                <div 
                                  ref={popoverRef}
                                  className="absolute inset-1 flex flex-col gap-1"
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {visible.map((appointment) => {
                                    const eachHeightPx = 22; // prueba 22 o 24
                                    return (
                                    <div
                                      key={appointment.id}
                                      className="relative w-full"
                                      style={{ height: `${eachHeightPx}px` }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAppointmentClick?.(appointment, e);
                                      }}
                                      onPointerDown={(e) => {
                                        // IMPORTANTÍSIMO: evita que el slot detecte click/drag/menú
                                        e.stopPropagation();
                                      }}
                                    >
                                      <AppointmentCard
                                        appointment={appointment}
                                        size="compact"
                                        draggable={false}
                                        onClick={() => {}}
                                        className="w-full h-full"   // 👈 sin overflow-hidden
                                      />
                                    </div>
                                  )})}

                                  {remaining > 0 && (
                                    <>
                                      <button
                                        type="button"
                                        className="absolute -bottom-1 right-0 z-50 pointer-events-auto text-[10px] leading-none px-2 py-1 rounded-full bg-gray-900 text-white shadow"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation(); // 👈 evita que el slot abra modal/menú
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setMoreOpenKey((prev) => (prev === slotKey ? null : slotKey));
                                        }}
                                        title={`Ver ${remaining} más`}
                                      >
                                        +{remaining}
                                      </button>

                                      {moreOpenKey === slotKey && (
                                        <div
                                          className="absolute right-0 bottom-7 z-50 w-64 rounded-lg bg-white shadow-xl border border-gray-200 p-2 pointer-events-auto"
                                          style={{ overflow: 'hidden' }}   // ✅ evita scroll raro del contenedor
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="text-xs font-semibold text-gray-700 mb-2">
                                            Más citas ({slotAppointments.length})
                                          </div>

                                          <div className="max-h-56 overflow-y-auto overflow-x-hidden pr-1 space-y-1">
                                            {slotAppointments.slice(MAX_VISIBLE).map((apt) => (
                                              <div
                                                key={apt.id}
                                                className="h-9"
                                                onPointerDown={(e) => {
                                                  // evita que el slot o document capture cierre/abra cosas
                                                  e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                }}
                                                onContextMenu={(e) => {
                                                  // si tu menú usa click derecho
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                }}
                                              >
                                                <AppointmentCard
                                                  appointment={apt}
                                                  size="compact"
                                                  draggable={false}
                                                  onClick={(e: any) => {
                                                    // ✅ aquí sí llama tu misma lógica
                                                    // pero NO cierres el popover todavía
                                                    onAppointmentClick?.(apt, e);
                                                  }}
                                                  className="w-full h-full"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}

                                </div>
                              );
                            })()}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};