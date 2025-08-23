'use client';

import React from 'react';
import { format, addMinutes, startOfDay, isToday, isSameHour, isSameMinute } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeSlot {
  time: Date;
  available: boolean;
  appointments: AppointmentData[];
}

interface AppointmentData {
  id: string;
  patientId: string;
  patientName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'confirmed-no-deposit' | 'completed' | 'cancelled' | 'no-show' | 'modified';
  hasDeposit?: boolean;
  paymentStatus?: 'paid' | 'pending' | 'deposit' | 'debt';
  notes?: string;
}

export interface ScheduleConfig {
  startHour: number; // 8 = 8:00 AM
  endHour: number;   // 18 = 6:00 PM  
  slotDuration: number; // minutes
  breakDuration: number; // minutes between slots
  workingDays: number[]; // [1,2,3,4,5] = Mon-Fri
  blockedSlots?: Date[];
}

interface TimeSlotGridProps {
  date?: Date;
  currentDate?: Date; // Alias for date
  appointments: AppointmentData[];
  scheduleConfig: ScheduleConfig;
  onSlotClick?: (time: Date) => void;
  onTimeSlotClick?: (hour: number, minute: number) => void;
  onTimeSlotDrop?: (hour: number, minute: number) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  className?: string;
  showCurrentTime?: boolean;
  showCurrentTimeIndicator?: boolean; // Alias for showCurrentTime
  timeSlotHeight?: number;
  renderAppointments?: (appointment: AppointmentData, style: React.CSSProperties) => React.ReactNode;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  date: dateProp,
  currentDate,
  appointments = [],
  scheduleConfig,
  onSlotClick,
  onTimeSlotClick,
  onTimeSlotDrop,
  onAppointmentClick,
  className = '',
  showCurrentTime,
  showCurrentTimeIndicator,
  timeSlotHeight = 60,
  renderAppointments
}) => {
  // Handle date prop aliases
  const date = dateProp || currentDate || new Date();
  const shouldShowCurrentTime = showCurrentTime ?? showCurrentTimeIndicator ?? true;
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startOfDayTime = startOfDay(date);
    
    // Generate slots from start to end hour
    for (let hour = scheduleConfig.startHour; hour <= scheduleConfig.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += scheduleConfig.slotDuration) {
        const slotTime = addMinutes(startOfDayTime, hour * 60 + minute);
        
        // Don't add slots after end hour
        if (hour === scheduleConfig.endHour && minute > 0) break;
        
        // Find appointments for this slot
        const slotAppointments = appointments.filter(apt => 
          apt.startTime <= slotTime && apt.endTime > slotTime
        );
        
        slots.push({
          time: slotTime,
          available: slotAppointments.length === 0,
          appointments: slotAppointments
        });
      }
    }
    
    return slots;
  };

  const getCurrentTimePosition = (): number => {
    if (!isToday(date)) return -1;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < scheduleConfig.startHour || currentHour >= scheduleConfig.endHour) {
      return -1;
    }
    
    const minutesFromStart = (currentHour - scheduleConfig.startHour) * 60 + currentMinute;
    const totalMinutes = (scheduleConfig.endHour - scheduleConfig.startHour) * 60;
    
    return (minutesFromStart / totalMinutes) * 100;
  };

  const getAppointmentStyle = (appointment: AppointmentData, slotTime: Date): React.CSSProperties => {
    const startMinutes = (appointment.startTime.getHours() - scheduleConfig.startHour) * 60 + 
                        appointment.startTime.getMinutes();
    const durationMinutes = appointment.duration;
    const totalDayMinutes = (scheduleConfig.endHour - scheduleConfig.startHour) * 60;
    
    const top = (startMinutes / totalDayMinutes) * 100;
    const height = (durationMinutes / totalDayMinutes) * 100;
    
    return {
      position: 'absolute',
      top: `${top}%`,
      height: `${height}%`,
      left: '0',
      right: '0',
      zIndex: 10
    };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'scheduled':
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
      case 'cancelled':
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
      case 'no-show':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'modified':
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      default:
        return 'bg-primary-500 hover:bg-primary-600 border-primary-600';
    }
  };

  const slots = generateTimeSlots();
  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className={`relative bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Time Labels */}
      <div className="flex">
        <div className="w-16 flex-shrink-0 border-r border-gray-200">
          {Array.from({ length: scheduleConfig.endHour - scheduleConfig.startHour + 1 }, (_, i) => {
            const hour = scheduleConfig.startHour + i;
            return (
              <div
                key={hour}
                className="h-15 flex items-start justify-center pt-2 text-xs text-gray-500 font-medium"
                style={{ height: `${timeSlotHeight}px` }}
              >
                {hour === scheduleConfig.startHour || hour % 2 === 0 ? (
                  format(new Date().setHours(hour, 0), 'HH:mm')
                ) : null}
              </div>
            );
          })}
        </div>
        
        {/* Main Grid */}
        <div className="flex-1 relative">
          {/* Grid Lines */}
          <div className="absolute inset-0">
            {slots.map((slot, index) => (
              <div
                key={index}
                className={`
                  border-b border-gray-100 cursor-pointer transition-colors duration-150
                  ${slot.available ? 'hover:bg-primary-50' : ''}
                  ${index % (60 / scheduleConfig.slotDuration) === 0 ? 'border-gray-200' : ''}
                `}
                style={{ height: `${timeSlotHeight / (60 / scheduleConfig.slotDuration)}px` }}
                onClick={() => {
                  if (slot.available) {
                    if (onSlotClick) {
                      onSlotClick(slot.time);
                    }
                    if (onTimeSlotClick) {
                      onTimeSlotClick(slot.time.getHours(), slot.time.getMinutes());
                    }
                  }
                }}
              >
                {/* Available slot indicator */}
                {slot.available && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-150 h-full w-full flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white text-xs">+</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Appointments */}
          {appointments.map((appointment) => {
            const style = getAppointmentStyle(appointment, appointment.startTime);
            
            // Use custom renderer if provided
            if (renderAppointments) {
              return renderAppointments(appointment, style);
            }
            
            // Default rendering
            return (
              <div
                key={appointment.id}
                className={`
                  rounded-lg border-l-4 px-3 py-2 cursor-pointer transition-all duration-200
                  text-white text-xs shadow-sm hover:shadow-md transform hover:scale-[1.02]
                  ${getStatusColor(appointment.status)}
                `}
                style={style}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                <div className="font-semibold truncate">{appointment.patientName}</div>
                <div className="text-white/80 truncate">
                  {format(appointment.startTime, 'HH:mm')} • {appointment.type}
                </div>
                {appointment.hasDeposit && (
                  <div className="text-white/90 text-xs">💳 Depósito</div>
                )}
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {shouldShowCurrentTime && currentTimePosition >= 0 && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="absolute -left-2 -top-1 w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="absolute -right-16 -top-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow-sm">
                {format(new Date(), 'HH:mm')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};