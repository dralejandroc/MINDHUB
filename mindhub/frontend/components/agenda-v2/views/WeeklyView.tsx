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
  onAppointmentClick?: (appointment: AppointmentData) => void;
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<AppointmentData | null>(null);
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
    setSelectedTimeSlot({ date, hour, minute });
    onTimeSlotClick?.(date, hour, minute);
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

        {/* Time Grid and Appointments */}
        <div className="flex-1 overflow-auto" ref={containerRef}>
          <div className="relative">
            {/* Background Grid */}
            <div className="grid grid-cols-8 divide-x divide-gray-200 bg-white">
              {/* Time slots column */}
              <div className="bg-gray-50">
                <TimeSlotGrid
                  scheduleConfig={scheduleConfig}
                  date={currentDate}
                  appointments={[]} // We'll render appointments separately
                  onSlotClick={() => {}} // Handled by day columns
                  onAppointmentClick={() => {}}
                  showCurrentTime={false}
                  className="border-r border-gray-200"
                />
              </div>

              {/* Day columns */}
              {weekDays.map((day) => {
                const dayAppointments = appointmentsByDay[format(day, 'yyyy-MM-dd')] || [];
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      relative min-h-full border-r border-gray-200
                      ${isCurrentDay ? 'bg-primary-25' : 'bg-white'}
                    `}
                    style={{
                      minHeight: `${((scheduleConfig.endHour - scheduleConfig.startHour) * 60 / scheduleConfig.slotDuration) * 60}px`
                    }}
                  >
                    {/* Time Slot Grid for this day */}
                    <TimeSlotGrid
                      scheduleConfig={scheduleConfig}
                      currentDate={day}
                      appointments={dayAppointments}
                      onTimeSlotClick={(hour, minute) => handleTimeSlotClick(day, hour, minute)}
                      onTimeSlotDrop={(hour, minute) => handleTimeSlotDrop(day, hour, minute)}
                      showCurrentTimeIndicator={isCurrentDay}
                      renderAppointments={(appointment, style) => (
                        <div
                          key={appointment.id}
                          style={style}
                          className="absolute inset-x-1 z-10"
                        >
                          <PatientTooltip 
                            patientData={createPatientTooltipData(appointment)}
                            position="auto"
                            delay={300}
                          >
                            <AppointmentCard
                              appointment={appointment}
                              onClick={() => onAppointmentClick?.(appointment)}
                              size="compact"
                              draggable={true}
                              onDragStart={() => handleAppointmentDragStart(appointment)}
                              onDragEnd={handleAppointmentDragEnd}
                              className="h-full shadow-sm hover:shadow-md transition-shadow"
                            />
                          </PatientTooltip>
                        </div>
                      )}
                      timeSlotHeight={60}
                      className="absolute inset-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selection indicator for new appointments */}
      {selectedTimeSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Nueva Cita</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(selectedTimeSlot.date, 'EEEE, d MMMM yyyy', { locale: es })} a las{' '}
              {selectedTimeSlot.hour.toString().padStart(2, '0')}:
              {selectedTimeSlot.minute.toString().padStart(2, '0')}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedTimeSlot(null);
                  onNewAppointment?.();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Crear Cita
              </button>
              <button
                onClick={() => setSelectedTimeSlot(null)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};