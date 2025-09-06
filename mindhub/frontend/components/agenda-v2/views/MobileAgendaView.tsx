'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  MapPinIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { AppointmentData } from '../shared/AppointmentCard';
import { cn } from '@/lib/utils';

interface MobileAgendaViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentData[];
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onNewAppointment?: () => void;
  onStartConsultation?: (appointmentId: string) => void;
}

/**
 * Mobile-optimized agenda view with swipe gestures and touch-friendly interface
 */
export const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  onAppointmentClick,
  onNewAppointment,
  onStartConsultation
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next day
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      onDateChange(nextDay);
    }
    
    if (isRightSwipe) {
      // Swipe right - previous day
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      onDateChange(prevDay);
    }
  };

  // Group appointments by time
  const appointmentsByTime = appointments.reduce((acc, apt) => {
    const timeKey = format(apt.startTime, 'HH:mm');
    if (!acc[timeKey]) {
      acc[timeKey] = [];
    }
    acc[timeKey].push(apt);
    return acc;
  }, {} as Record<string, AppointmentData[]>);

  const getConsultationIcon = (type?: string) => {
    switch (type) {
      case 'virtual':
        return VideoCameraIcon;
      case 'telefonica':
        return PhoneIcon;
      default:
        return MapPinIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Date Header with Swipe Hints */}
      <div 
        className="bg-white border-b border-gray-200 px-4 py-3"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const prevDay = new Date(currentDate);
              prevDay.setDate(prevDay.getDate() - 1);
              onDateChange(prevDay);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Día anterior"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'EEEE', { locale: es })}
            </h2>
            <p className="text-sm text-gray-600">
              {format(currentDate, 'd \'de\' MMMM, yyyy', { locale: es })}
            </p>
          </div>

          <button
            onClick={() => {
              const nextDay = new Date(currentDate);
              nextDay.setDate(nextDay.getDate() + 1);
              onDateChange(nextDay);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Día siguiente"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Swipe hint */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Desliza para cambiar de día
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {Object.keys(appointmentsByTime).length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay citas programadas</p>
            <button
              onClick={onNewAppointment}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg 
                       hover:bg-primary-700 transition-colors touch-manipulation"
            >
              Agendar cita
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(appointmentsByTime)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([time, apts]) => (
                <div key={time}>
                  {/* Time header */}
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{time}</span>
                  </div>

                  {/* Appointment cards */}
                  <div className="space-y-2">
                    {apts.map((appointment) => {
                      const ConsultationIcon = getConsultationIcon(appointment.consultationType);
                      
                      return (
                        <div
                          key={appointment.id}
                          onClick={() => onAppointmentClick?.(appointment)}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all touch-manipulation',
                            'hover:shadow-md active:scale-[0.98]',
                            getStatusColor(appointment.status)
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <UserIcon className="h-4 w-4" />
                                <span className="font-medium text-sm">
                                  {appointment.patientName}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <ConsultationIcon className="h-3 w-3" />
                                  <span>{appointment.consultationType}</span>
                                </div>
                                <span>{appointment.duration} min</span>
                              </div>

                              {appointment.notes && (
                                <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>

                            {/* Quick action button */}
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartConsultation?.(appointment.id);
                                }}
                                className="ml-2 px-3 py-2 bg-green-600 text-white text-xs 
                                         font-medium rounded-lg hover:bg-green-700 
                                         transition-colors touch-manipulation"
                              >
                                Iniciar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onNewAppointment}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white 
                   rounded-full shadow-lg hover:bg-primary-700 transition-all 
                   hover:shadow-xl active:scale-95 touch-manipulation z-20
                   flex items-center justify-center"
        aria-label="Nueva cita"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
};