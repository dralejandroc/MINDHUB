'use client';

import React from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CalendarIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export interface AppointmentData {
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
  patientInfo?: {
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    lastVisit?: Date;
    followUpMonths?: number;
  };
  consultationType?: 'presencial' | 'virtual' | 'telefonica';
  location?: string;
  priority?: 'normal' | 'urgent' | 'followup';
}

interface AppointmentCardProps {
  appointment: AppointmentData;
  onClick: (event?: React.MouseEvent) => void;
  className?: string;
  size?: 'compact' | 'normal' | 'expanded';
  showPatientInfo?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  className = '',
  size = 'normal',
  showPatientInfo = false,
  draggable = false,
  onDragStart,
  onDragEnd
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'bg-green-500 hover:bg-green-600 border-green-600',
          icon: CheckCircleIcon,
          label: 'Confirmada'
        };
      case 'scheduled':
        return {
          color: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
          icon: ClockIcon,
          label: 'Agendada'
        };
      case 'completed':
        return {
          color: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
          icon: CheckCircleIcon,
          label: 'Completada'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-500 hover:bg-gray-600 border-gray-600',
          icon: XCircleIcon,
          label: 'Cancelada'
        };
      case 'no-show':
        return {
          color: 'bg-red-500 hover:bg-red-600 border-red-600',
          icon: ExclamationTriangleIcon,
          label: 'No asistió'
        };
      case 'modified':
        return {
          color: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
          icon: CalendarIcon,
          label: 'Modificada'
        };
      default:
        return {
          color: 'bg-primary-500 hover:bg-primary-600 border-primary-600',
          icon: CalendarIcon,
          label: 'Programada'
        };
    }
  };

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 border-l-4';
      case 'followup':
        return 'border-l-blue-500 border-l-4';
      default:
        return '';
    }
  };

  const getConsultationTypeIcon = (type?: string) => {
    switch (type) {
      case 'virtual':
        return VideoCameraIcon;
      case 'telefonica':
        return PhoneIcon;
      case 'presencial':
      default:
        return MapPinIcon;
    }
  };

  const getAppointmentTypeColor = (type?: string) => {
    // Colors by appointment type - override status colors
    switch (type?.toLowerCase()) {
      case 'primera vez':
      case 'primera consulta':
      case 'nuevo paciente':
        return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'; // Green for new patients
      case 'consulta subsecuente':
      case 'seguimiento':
      case 'control':
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600'; // Blue for follow-up
      case 'urgencia':
      case 'urgente':
        return 'bg-red-500 hover:bg-red-600 border-red-600'; // Red for urgent
      case 'terapia':
      case 'psicoterapia':
        return 'bg-purple-500 hover:bg-purple-600 border-purple-600'; // Purple for therapy
      case 'evaluación':
      case 'evaluacion':
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600'; // Orange for evaluation
      case 'interconsulta':
        return 'bg-teal-500 hover:bg-teal-600 border-teal-600'; // Teal for consultation
      default:
        // Fall back to status color if no specific type color
        return null;
    }
  };

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;
  const ConsultationIcon = getConsultationTypeIcon(appointment.consultationType);
  
  // Use appointment type color if available, otherwise use status color
  const typeColor = getAppointmentTypeColor(appointment.type);
  const cardColor = typeColor || statusConfig.color;
  
  const startTime = format(appointment.startTime, 'HH:mm');
  const endTime = format(appointment.endTime, 'HH:mm');

  if (size === 'compact') {
    return (
      <div
        className={`
          group relative p-2 rounded-lg cursor-pointer transition-all duration-200
          ${cardColor} text-white shadow-sm hover:shadow-md
          transform hover:scale-[1.02] ${getPriorityBorder(appointment.priority)}
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
          ${className}
        `}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="text-xs font-semibold truncate">{appointment.patientName}</div>
        <div className="text-xs text-white/80 truncate">
          {startTime} • {appointment.type}
        </div>
        {appointment.hasDeposit && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">$</span>
          </div>
        )}
      </div>
    );
  }

  if (size === 'expanded') {
    return (
      <div
        className={`
          group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md
          cursor-pointer transition-all duration-200 overflow-hidden
          ${getPriorityBorder(appointment.priority)} ${className}
        `}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Status Bar */}
        <div className={`h-1 ${cardColor.split(' ')[0]}`}></div>
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{appointment.patientName}</h3>
              <p className="text-sm text-gray-600 truncate">{appointment.type}</p>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <ConsultationIcon className="w-4 h-4 text-gray-400" />
              {appointment.hasDeposit && (
                <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
              )}
              <StatusIcon className={`w-4 h-4 ${cardColor.split(' ')[0].replace('bg-', 'text-')}`} />
            </div>
          </div>

          {/* Time and Duration */}
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              {startTime} - {endTime}
            </div>
            <div className="text-sm text-gray-500">
              {appointment.duration} min
            </div>
          </div>

          {/* Patient Info */}
          {showPatientInfo && appointment.patientInfo && (
            <div className="space-y-2 mb-3 text-sm">
              {appointment.patientInfo.phone && (
                <div className="flex items-center text-gray-600">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  {appointment.patientInfo.phone}
                </div>
              )}
              {appointment.patientInfo.followUpMonths && (
                <div className="text-gray-500">
                  Seguimiento: {appointment.patientInfo.followUpMonths} meses
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2">{appointment.notes}</p>
            </div>
          )}

          {/* Status Label */}
          <div className="flex items-center justify-between mt-3">
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${cardColor.replace('hover:bg-', 'bg-').split(' ')[0]}/10
              ${cardColor.replace('bg-', 'text-').split(' ')[0]}
            `}>
              {statusConfig.label}
            </span>
            
            {appointment.priority === 'urgent' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Urgente
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal size (default)
  return (
    <div
      className={`
        group relative p-3 rounded-lg cursor-pointer transition-all duration-200
        ${cardColor} text-white shadow-sm hover:shadow-md
        transform hover:scale-[1.02] ${getPriorityBorder(appointment.priority)}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${className}
      `}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Patient Name */}
      <div className="font-semibold text-sm truncate mb-1">{appointment.patientName}</div>
      
      {/* Time and Type */}
      <div className="text-xs text-white/90 truncate mb-1">
        {startTime} - {endTime} • {appointment.type}
      </div>
      
      {/* Consultation Type */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <ConsultationIcon className="w-3 h-3 text-white/80" />
          {appointment.location && (
            <span className="text-xs text-white/80 truncate">{appointment.location}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {appointment.hasDeposit && (
            <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {appointment.priority === 'urgent' && (
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
      
      {/* Drag Handle */}
      {draggable && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-4 h-4 flex flex-col items-center justify-center space-y-0.5">
            <div className="w-0.5 h-0.5 bg-white/60 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-white/60 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-white/60 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};