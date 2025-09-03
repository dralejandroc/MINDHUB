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
                            {dayAppointments
                              .filter(apt => {
                                const aptHour = apt.startTime.getHours();
                                const aptMinute = apt.startTime.getMinutes();
                                return aptHour === hour && Math.floor(aptMinute / scheduleConfig.slotDuration) * scheduleConfig.slotDuration === minute;
                              })
                              .map(appointment => (
                                <div
                                  key={appointment.id}
                                  className="absolute inset-1"
                                  onClick={(e) => {
                                    // CRITICAL: Stop all propagation to prevent time slot click
                                    e.stopPropagation();
                                    e.preventDefault();
                                    console.log('Appointment clicked, showing context menu');
                                    onAppointmentClick?.(appointment, e);
                                  }}
                                  onMouseDown={(e) => {
                                    // Prevent bubbling to time slot
                                    e.stopPropagation();
                                    e.preventDefault();
                                    
                                    let holdTimer: NodeJS.Timeout;
                                    let isHolding = false;
                                    let hasClicked = false;
                                    
                                    // Start hold timer (1 second)
                                    holdTimer = setTimeout(() => {
                                      if (!hasClicked) {
                                        isHolding = true;
                                        setHoldingAppointment(appointment.id);
                                        console.log('Hold mode activated for', appointment.id);
                                        // Enable draggable
                                        const cardElement = e.currentTarget.querySelector('[data-appointment-card]') as HTMLElement;
                                        if (cardElement) {
                                          cardElement.draggable = true;
                                          cardElement.style.cursor = 'grab';
                                        }
                                      }
                                    }, 1000);
                                    
                                    const handleMouseUp = (upEvent: MouseEvent) => {
                                      clearTimeout(holdTimer);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                      
                                      if (!isHolding) {
                                        hasClicked = true;
                                        console.log('Quick click detected, context menu should show');
                                      }
                                      
                                      // Reset holding state
                                      if (isHolding) {
                                        setHoldingAppointment(null);
                                        const cardElement = e.currentTarget.querySelector('[data-appointment-card]') as HTMLElement;
                                        if (cardElement) {
                                          cardElement.draggable = false;
                                          cardElement.style.cursor = '';
                                        }
                                      }
                                    };
                                    
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                >
                                  <AppointmentCard
                                    appointment={appointment}
                                    size="compact"
                                    draggable={false}
                                    onClick={() => {
                                      // Empty - handled by parent wrapper
                                      console.log('AppointmentCard onClick (should be empty)');
                                    }}
                                    onDragStart={(e) => {
                                      console.log('Drag started for', appointment.id);
                                      e.dataTransfer.setData('text/plain', appointment.id);
                                      handleAppointmentDragStart(appointment);
                                    }}
                                    onDragEnd={(e) => {
                                      console.log('Drag ended for', appointment.id);
                                      handleAppointmentDragEnd();
                                      setHoldingAppointment(null);
                                    }}
                                    className={`w-full h-full transition-all duration-200 ${
                                      holdingAppointment === appointment.id 
                                        ? 'ring-2 ring-blue-400 ring-opacity-75 scale-105 shadow-lg cursor-grab' 
                                        : 'hover:shadow-md'
                                    }`}
                                    data-appointment-card="true"
                                  />
                                  
                                  {/* Visual indicator when holding */}
                                  {holdingAppointment === appointment.id && (
                                    <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold animate-pulse">
                                      ⇄
                                    </div>
                                  )}
                                </div>
                              ))}
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