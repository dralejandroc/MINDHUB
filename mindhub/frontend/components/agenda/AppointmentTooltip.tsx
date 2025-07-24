'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UserIcon, 
  ClockIcon, 
  CalendarIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

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

interface AppointmentTooltipProps {
  appointment: Appointment;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const AppointmentTooltip = React.memo(function AppointmentTooltip({ 
  appointment, 
  children, 
  position = 'top' 
}: AppointmentTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 500);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-[100] bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 p-3 
      transition-opacity duration-150 pointer-events-none min-w-[220px] max-w-xs
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `;

    return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-3`;
  };


  return (
    <div 
      ref={triggerRef}
      className="relative w-full h-full"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getTooltipClasses()}
          role="tooltip"
        >
        <div className="space-y-2">
          {/* Paciente */}
          <div className="font-semibold text-sm text-gray-900 truncate">
            {appointment.patientName}
          </div>
          
          {/* Tipo */}
          <div className="text-sm text-gray-700 truncate">
            {appointment.type}
          </div>
          
          {/* Horario */}
          <div className="text-xs text-gray-600">
            {appointment.time} - {(() => {
              const [hours, minutes] = appointment.time.split(':').map(Number);
              const endMinutes = hours * 60 + minutes + appointment.duration;
              const endHours = Math.floor(endMinutes / 60);
              const endMins = endMinutes % 60;
              return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
            })()} ({appointment.duration} min)
          </div>

          {/* Estado */}
          <div className={`text-xs px-2 py-1 rounded text-white inline-block ${
            appointment.status === 'confirmed' ? 'bg-green-500' :
            appointment.status === 'scheduled' ? 'bg-yellow-500' :
            appointment.status === 'cancelled' ? 'bg-gray-500' :
            'bg-blue-500'
          }`}>
            {appointment.status === 'confirmed' ? 'Confirmada' :
             appointment.status === 'scheduled' ? 'Agendada' :
             appointment.status === 'cancelled' ? 'Cancelada' :
             'Completada'}
          </div>
        </div>
        
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-6 border-r-white border-t-transparent border-b-transparent border-l-transparent drop-shadow-md" />
        </div>
      )}
    </div>
  );
});