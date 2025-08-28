/**
 * AppointmentPresenter
 * Transforms domain entities into UI-friendly view models
 */

import { Appointment } from '../entities/Appointment';
import { AppointmentWithMetadata } from '../usecases/GetAppointmentsUseCase';
import { format, differenceInMinutes, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AppointmentViewModel {
  id: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  duration: string;
  dateLabel: string;
  status: {
    value: string;
    label: string;
    color: string;
    icon: string;
  };
  payment: {
    status: string;
    label: string;
    hasDeposit: boolean;
    color: string;
  };
  actions: {
    canStart: boolean;
    canConfirm: boolean;
    canCancel: boolean;
    canReschedule: boolean;
    canMarkNoShow: boolean;
  };
  style: {
    borderColor: string;
    backgroundColor: string;
    textColor: string;
  };
  metadata: {
    isOverdue: boolean;
    hasConflicts: boolean;
    conflictCount: number;
    isToday: boolean;
    isTomorrow: boolean;
  };
}

export class AppointmentPresenter {
  /**
   * Transform domain entity to view model for UI
   */
  static toViewModel(
    appointment: Appointment,
    patientName?: string,
    metadata?: AppointmentWithMetadata
  ): AppointmentViewModel {
    const now = new Date();
    
    return {
      id: appointment.id,
      title: patientName || `Paciente ${appointment.patientId}`,
      subtitle: `${appointment.type} - ${this.getConsultationTypeLabel(appointment.consultationType)}`,
      startTime: format(appointment.startTime, 'HH:mm'),
      endTime: format(appointment.endTime, 'HH:mm'),
      duration: this.formatDuration(appointment.getDurationMinutes()),
      dateLabel: this.getDateLabel(appointment.startTime),
      status: this.getStatusDisplay(appointment.status),
      payment: this.getPaymentDisplay(appointment.paymentStatus, appointment.hasDeposit),
      actions: {
        canStart: metadata?.canStart || appointment.canStartConsultation(),
        canConfirm: appointment.status === 'scheduled',
        canCancel: metadata?.canCancel || appointment.canBeCancelled(),
        canReschedule: metadata?.canReschedule || appointment.canBeRescheduled(),
        canMarkNoShow: appointment.status === 'confirmed' && appointment.startTime < now
      },
      style: this.getAppointmentStyle(appointment),
      metadata: {
        isOverdue: metadata?.isOverdue || appointment.isOverdue(),
        hasConflicts: (metadata?.conflictsWith?.length || 0) > 0,
        conflictCount: metadata?.conflictsWith?.length || 0,
        isToday: isToday(appointment.startTime),
        isTomorrow: isTomorrow(appointment.startTime)
      }
    };
  }

  /**
   * Transform multiple appointments for calendar view
   */
  static toCalendarEvents(
    appointments: AppointmentWithMetadata[],
    patientNames: Map<string, string>
  ): AppointmentViewModel[] {
    return appointments.map(({ appointment, ...metadata }) => 
      this.toViewModel(
        appointment, 
        patientNames.get(appointment.patientId),
        { appointment, ...metadata }
      )
    );
  }

  /**
   * Get consultation type label
   */
  private static getConsultationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'presencial': 'Presencial',
      'telemedicina': 'Telemedicina',
      'domicilio': 'A domicilio'
    };
    return labels[type] || type;
  }

  /**
   * Format duration for display
   */
  private static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Get date label for display
   */
  private static getDateLabel(date: Date): string {
    if (isToday(date)) {
      return 'Hoy';
    }
    
    if (isTomorrow(date)) {
      return 'Mañana';
    }
    
    return format(date, 'EEEE d MMMM', { locale: es });
  }

  /**
   * Get status display configuration
   */
  private static getStatusDisplay(status: string): AppointmentViewModel['status'] {
    const statusConfig: Record<string, AppointmentViewModel['status']> = {
      'scheduled': {
        value: status,
        label: 'Agendada',
        color: 'blue',
        icon: 'calendar'
      },
      'confirmed': {
        value: status,
        label: 'Confirmada',
        color: 'green',
        icon: 'check-circle'
      },
      'in_progress': {
        value: status,
        label: 'En progreso',
        color: 'yellow',
        icon: 'clock'
      },
      'completed': {
        value: status,
        label: 'Completada',
        color: 'gray',
        icon: 'check'
      },
      'cancelled': {
        value: status,
        label: 'Cancelada',
        color: 'red',
        icon: 'x-circle'
      },
      'no_show': {
        value: status,
        label: 'No asistió',
        color: 'orange',
        icon: 'exclamation'
      }
    };

    return statusConfig[status] || {
      value: status,
      label: status,
      color: 'gray',
      icon: 'question'
    };
  }

  /**
   * Get payment display configuration
   */
  private static getPaymentDisplay(
    status: string, 
    hasDeposit: boolean
  ): AppointmentViewModel['payment'] {
    const paymentConfig: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Pendiente', color: 'yellow' },
      'partial': { label: 'Parcial', color: 'blue' },
      'paid': { label: 'Pagado', color: 'green' },
      'cancelled': { label: 'Cancelado', color: 'red' }
    };

    const config = paymentConfig[status] || { label: status, color: 'gray' };

    return {
      status,
      label: config.label,
      hasDeposit,
      color: config.color
    };
  }

  /**
   * Get appointment style configuration
   */
  private static getAppointmentStyle(appointment: Appointment): AppointmentViewModel['style'] {
    // Style based on status
    const statusStyles: Record<string, AppointmentViewModel['style']> = {
      'scheduled': {
        borderColor: 'border-blue-400',
        backgroundColor: 'bg-blue-50',
        textColor: 'text-blue-900'
      },
      'confirmed': {
        borderColor: 'border-green-400',
        backgroundColor: 'bg-green-50',
        textColor: 'text-green-900'
      },
      'in_progress': {
        borderColor: 'border-yellow-400',
        backgroundColor: 'bg-yellow-50',
        textColor: 'text-yellow-900'
      },
      'completed': {
        borderColor: 'border-gray-300',
        backgroundColor: 'bg-gray-50',
        textColor: 'text-gray-600'
      },
      'cancelled': {
        borderColor: 'border-red-300',
        backgroundColor: 'bg-red-50',
        textColor: 'text-red-600'
      },
      'no_show': {
        borderColor: 'border-orange-300',
        backgroundColor: 'bg-orange-50',
        textColor: 'text-orange-600'
      }
    };

    return statusStyles[appointment.status] || {
      borderColor: 'border-gray-300',
      backgroundColor: 'bg-white',
      textColor: 'text-gray-900'
    };
  }

  /**
   * Group appointments by date for list view
   */
  static groupByDate(appointments: AppointmentViewModel[]): Map<string, AppointmentViewModel[]> {
    const grouped = new Map<string, AppointmentViewModel[]>();

    appointments.forEach(appointment => {
      const dateKey = appointment.dateLabel;
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      
      grouped.get(dateKey)!.push(appointment);
    });

    return grouped;
  }

  /**
   * Calculate statistics for dashboard
   */
  static calculateStats(appointments: AppointmentViewModel[]): {
    total: number;
    confirmed: number;
    pending: number;
    completed: number;
    noShow: number;
    cancelled: number;
    todayCount: number;
    tomorrowCount: number;
  } {
    return {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status.value === 'confirmed').length,
      pending: appointments.filter(a => a.status.value === 'scheduled').length,
      completed: appointments.filter(a => a.status.value === 'completed').length,
      noShow: appointments.filter(a => a.status.value === 'no_show').length,
      cancelled: appointments.filter(a => a.status.value === 'cancelled').length,
      todayCount: appointments.filter(a => a.metadata.isToday).length,
      tomorrowCount: appointments.filter(a => a.metadata.isTomorrow).length
    };
  }
}