'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay, eachHourOfInterval, isBefore, isAfter, addMinutes, isSameHour } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClockIcon,
  PlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CalendarHeader } from '../shared/CalendarHeader';
import { AppointmentCard, AppointmentData } from '../shared/AppointmentCard';
import { PatientTooltip, PatientTooltipData } from '../shared/PatientTooltip';
import { AppointmentContextMenu } from '../shared/AppointmentContextMenu';
import { ScheduleConfig } from '../shared/TimeSlotGrid';

export interface DailyViewProps {
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
  
  // Drag & Drop handlers
  onAppointmentDragStart?: (appointment: AppointmentData) => void;
  onAppointmentDrop?: (appointment: AppointmentData, newDate: Date, newHour: number, newMinute: number) => void;
  
  // Context menu handlers
  onStartConsultation?: (appointmentId: string) => void;
  onConfirm?: (appointmentId: string, withDeposit: boolean) => void;
  onCancel?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onGoToRecord?: (patientId: string) => void;
  onViewTimeline?: (patientId: string) => void;
  onSendForm?: (patientId: string) => void;
  onSendResource?: (patientId: string) => void;
  onSendScale?: (patientId: string) => void;
  onAddComment?: (appointmentId: string) => void;
  
  className?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  datetime: Date;
  isAvailable: boolean;
  appointments: AppointmentData[];
}

export const DailyView: React.FC<DailyViewProps> = ({
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
  onStartConsultation,
  onConfirm,
  onCancel,
  onReschedule,
  onGoToRecord,
  onViewTimeline,
  onSendForm,
  onSendResource,
  onSendScale,
  onAddComment,
  className = ''
}) => {
  const [contextMenu, setContextMenu] = useState<{
    appointment: AppointmentData;
    position: { x: number; y: number };
  } | null>(null);

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    console.log('View change requested:', view);
    onViewChange?.(view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(currentDate);
    
    // Create time slots based on schedule config
    for (let hour = scheduleConfig.startHour; hour < scheduleConfig.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += scheduleConfig.slotDuration) {
        const slotTime = new Date(dayStart);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Find appointments in this slot
        const slotAppointments = appointments.filter(apt => 
          apt.startTime.getHours() === hour && 
          apt.startTime.getMinutes() === minute
        );
        
        // Check if slot is blocked
        const isBlocked = scheduleConfig.blockedSlots?.some(blocked => 
          blocked.getTime() === slotTime.getTime()
        );
        
        slots.push({
          hour,
          minute,
          datetime: slotTime,
          isAvailable: !isBlocked && slotAppointments.length === 0,
          appointments: slotAppointments
        });
      }
    }
    
    return slots;
  }, [currentDate, appointments, scheduleConfig]);

  // Group slots by hour for better organization
  const slotsByHour = useMemo(() => {
    const grouped = new Map<number, TimeSlot[]>();
    timeSlots.forEach(slot => {
      const hour = slot.hour;
      if (!grouped.has(hour)) {
        grouped.set(hour, []);
      }
      grouped.get(hour)!.push(slot);
    });
    return grouped;
  }, [timeSlots]);

  // Calculate day statistics
  const dayStats = useMemo(() => {
    const totalSlots = timeSlots.length;
    const availableSlots = timeSlots.filter(slot => slot.isAvailable).length;
    const bookedSlots = timeSlots.filter(slot => slot.appointments.length > 0).length;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    
    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      occupancyRate
    };
  }, [timeSlots]);

  // Handle appointment context menu
  const handleAppointmentRightClick = (e: React.MouseEvent, appointment: AppointmentData) => {
    e.preventDefault();
    setContextMenu({
      appointment,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleAppointmentLeftClick = (appointment: AppointmentData) => {
    onAppointmentClick?.(appointment);
  };

  // Handle available slot click
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      onTimeSlotClick?.(slot.datetime, slot.hour, slot.minute);
    }
  };

  // Create patient tooltip data
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
    canViewContactInfo: true,
    canViewClinicalHistory: true,
    encryptionStatus: 'encrypted'
  });

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType="day"
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

      {/* Day Statistics */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </h2>
            <p className="text-sm text-gray-600">
              {dayStats.bookedSlots} citas programadas • {dayStats.availableSlots} espacios disponibles
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{dayStats.occupancyRate}%</div>
              <div className="text-xs text-gray-500">Ocupación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dayStats.availableSlots}</div>
              <div className="text-xs text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dayStats.bookedSlots}</div>
              <div className="text-xs text-gray-500">Ocupados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {Array.from(slotsByHour.entries()).map(([hour, hourSlots]) => (
            <div key={hour} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Hour Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>
                      {hourSlots.filter(slot => slot.appointments.length > 0).length} ocupados • {' '}
                      {hourSlots.filter(slot => slot.isAvailable).length} disponibles
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="p-4">
                <div className="grid gap-3">
                  {hourSlots.map((slot) => (
                    <div key={`${slot.hour}-${slot.minute}`} className="flex items-start space-x-4">
                      {/* Time */}
                      <div className="w-16 text-sm font-medium text-gray-700 pt-2">
                        {slot.hour.toString().padStart(2, '0')}:{slot.minute.toString().padStart(2, '0')}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        {slot.appointments.length > 0 ? (
                          // Render appointments
                          <div className="space-y-2">
                            {slot.appointments.map((appointment) => (
                              <PatientTooltip
                                key={appointment.id}
                                patientData={createPatientTooltipData(appointment)}
                                position="auto"
                                delay={300}
                              >
                                <div
                                  onContextMenu={(e) => handleAppointmentRightClick(e, appointment)}
                                  onClick={() => handleAppointmentLeftClick(appointment)}
                                >
                                  <AppointmentCard
                                    appointment={appointment}
                                    onClick={() => handleAppointmentLeftClick(appointment)}
                                    size="expanded"
                                    showPatientInfo={true}
                                    className="cursor-pointer"
                                  />
                                </div>
                              </PatientTooltip>
                            ))}
                          </div>
                        ) : slot.isAvailable ? (
                          // Available slot
                          <button
                            onClick={() => handleSlotClick(slot)}
                            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-25 transition-colors group"
                          >
                            <div className="flex items-center justify-center space-x-2 text-gray-500 group-hover:text-primary-600">
                              <PlusIcon className="w-5 h-5" />
                              <span className="text-sm font-medium">Espacio disponible - Click para agendar</span>
                            </div>
                          </button>
                        ) : (
                          // Blocked slot
                          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <ExclamationTriangleIcon className="w-5 h-5" />
                              <span className="text-sm">Horario bloqueado</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {timeSlots.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay horarios configurados</h3>
              <p className="text-gray-600 mb-4">
                Configura tu horario de trabajo para ver los espacios disponibles.
              </p>
              <button
                onClick={onSettings}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Configurar Horarios
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <AppointmentContextMenu
          appointment={contextMenu.appointment}
          isVisible={true}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onStartConsultation={onStartConsultation}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onReschedule={onReschedule}
          onGoToRecord={onGoToRecord}
          onViewTimeline={onViewTimeline}
          onSendForm={onSendForm}
          onSendResource={onSendResource}
          onSendScale={onSendScale}
          onAddComment={onAddComment}
          licenseType={licenseType}
        />
      )}
    </div>
  );
};