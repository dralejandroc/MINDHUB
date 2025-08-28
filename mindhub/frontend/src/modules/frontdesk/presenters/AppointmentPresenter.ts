/**
 * Appointment Presenter
 * Transforms Appointment entities into UI-ready formats for FrontDesk module
 */

import { Appointment } from '../entities/Appointment';

export interface AppointmentListItemViewModel {
  id: string;
  patientName: string;
  professionalName: string;
  appointmentTime: string;
  appointmentDate: string;
  duration: string;
  status: string;
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange';
  urgency: string;
  urgencyColor: 'green' | 'yellow' | 'orange' | 'red';
  appointmentType: string;
  typeDisplay: string;
  isOverdue: boolean;
  canCheckIn: boolean;
  waitTime?: string;
  estimatedDelay?: string;
}

export interface AppointmentDetailsViewModel {
  // Basic Information
  id: string;
  patientName: string;
  patientId: string;
  professionalName: string;
  professionalId: string;
  
  // Timing Information
  appointmentDate: string;
  appointmentTime: string;
  appointmentDateTime: string;
  estimatedDuration: string;
  actualDuration?: string;
  
  // Status Information
  status: string;
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange';
  urgency: string;
  urgencyDisplay: string;
  urgencyColor: 'green' | 'yellow' | 'orange' | 'red';
  
  // Type and Reason
  appointmentType: string;
  typeDisplay: string;
  reason: string;
  notes: string;
  
  // Timing Analysis
  isOverdue: boolean;
  canCheckIn: boolean;
  timeUntilAppointment?: string;
  waitTime?: string;
  isReady: boolean;
  
  // Location and Instructions
  waitingRoomLocation?: string;
  specialInstructions?: string;
  
  // Actual Times (if started/completed)
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Flow History
  history: {
    status: string;
    statusDisplay: string;
    timestamp: string;
    timeDisplay: string;
    performedBy: string;
    notes?: string;
    duration?: string;
  }[];
  
  // Reminders and Confirmations
  reminderSent: boolean;
  confirmationRequired: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
}

export interface AppointmentCardViewModel {
  id: string;
  patientName: string;
  professionalName: string;
  appointmentTime: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange';
  urgencyBadge: {
    text: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
    visible: boolean;
  };
  timeBadge: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
    icon: string;
  };
  indicators: {
    icon: string;
    color: string;
    tooltip: string;
  }[];
  quickActions: {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled: boolean;
  }[];
}

export interface AppointmentDashboardViewModel {
  todayStats: {
    total: number;
    scheduled: number;
    arrived: number;
    inProgress: number;
    completed: number;
    noShow: number;
    cancelled: number;
    completionRate: number;
    noShowRate: number;
  };
  
  timelineGroups: {
    title: string;
    count: number;
    color: 'blue' | 'yellow' | 'green' | 'red';
    appointments: AppointmentCardViewModel[];
  }[];
  
  alerts: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    appointmentId?: string;
    actionRequired: boolean;
  }[];
  
  metrics: {
    averageWaitTime: string;
    averageConsultationTime: string;
    onTimeRate: number;
    patientSatisfaction: number;
  };
}

export interface WaitingQueueViewModel {
  queueName: string;
  location: string;
  totalWaiting: number;
  averageWaitTime: string;
  nextAppointment?: {
    patientName: string;
    estimatedTime: string;
  };
  waitingAppointments: AppointmentCardViewModel[];
  alerts: string[];
}

export class AppointmentPresenter {
  
  /**
   * Present appointment for list view
   */
  presentForList(appointment: Appointment): AppointmentListItemViewModel {
    return {
      id: appointment.id,
      patientName: appointment.getPatientName(),
      professionalName: appointment.professional.name,
      appointmentTime: this.formatTime(appointment.timeSlot.startTime),
      appointmentDate: this.formatDate(appointment.timeSlot.startTime),
      duration: this.formatDuration(appointment.getScheduledDuration()),
      status: appointment.status,
      statusDisplay: this.getStatusDisplay(appointment.status),
      statusColor: this.getStatusColor(appointment.status),
      urgency: appointment.urgency,
      urgencyColor: this.getUrgencyColor(appointment.urgency),
      appointmentType: appointment.appointmentType,
      typeDisplay: this.getTypeDisplay(appointment.appointmentType),
      isOverdue: appointment.isOverdue(),
      canCheckIn: appointment.canBeCheckedIn(),
      waitTime: appointment.getWaitTime() > 0 ? this.formatDuration(appointment.getWaitTime()) : undefined,
      estimatedDelay: this.calculateEstimatedDelay(appointment),
    };
  }

  /**
   * Present appointment for detailed view
   */
  presentForDetails(appointment: Appointment): AppointmentDetailsViewModel {
    return {
      // Basic Information
      id: appointment.id,
      patientName: appointment.getPatientName(),
      patientId: appointment.patient.id,
      professionalName: appointment.professional.name,
      professionalId: appointment.professional.id,
      
      // Timing Information
      appointmentDate: this.formatDate(appointment.timeSlot.startTime),
      appointmentTime: this.formatTime(appointment.timeSlot.startTime),
      appointmentDateTime: this.formatDateTime(appointment.timeSlot.startTime),
      estimatedDuration: this.formatDuration(appointment.estimatedDuration),
      actualDuration: appointment.getActualDuration() > 0 ? this.formatDuration(appointment.getActualDuration()) : undefined,
      
      // Status Information
      status: appointment.status,
      statusDisplay: this.getStatusDisplay(appointment.status),
      statusColor: this.getStatusColor(appointment.status),
      urgency: appointment.urgency,
      urgencyDisplay: this.getUrgencyDisplay(appointment.urgency),
      urgencyColor: this.getUrgencyColor(appointment.urgency),
      
      // Type and Reason
      appointmentType: appointment.appointmentType,
      typeDisplay: this.getTypeDisplay(appointment.appointmentType),
      reason: appointment.reason,
      notes: appointment.notes,
      
      // Timing Analysis
      isOverdue: appointment.isOverdue(),
      canCheckIn: appointment.canBeCheckedIn(),
      timeUntilAppointment: this.formatTimeUntil(appointment.timeSlot.startTime),
      waitTime: appointment.getWaitTime() > 0 ? this.formatDuration(appointment.getWaitTime()) : undefined,
      isReady: appointment.isReadyToStart(),
      
      // Location and Instructions
      waitingRoomLocation: appointment.waitingRoomLocation,
      specialInstructions: appointment.specialInstructions,
      
      // Actual Times
      actualStartTime: appointment.actualStartTime ? this.formatDateTime(appointment.actualStartTime) : undefined,
      actualEndTime: appointment.actualEndTime ? this.formatDateTime(appointment.actualEndTime) : undefined,
      
      // Flow History
      history: this.presentHistory(appointment),
      
      // Reminders and Confirmations
      reminderSent: appointment.reminderSent,
      confirmationRequired: appointment.confirmationRequired,
      isRecurring: appointment.isRecurring,
      recurringPattern: appointment.recurringPattern,
    };
  }

  /**
   * Present appointment for card view
   */
  presentForCard(appointment: Appointment): AppointmentCardViewModel {
    return {
      id: appointment.id,
      patientName: appointment.getPatientName(),
      professionalName: appointment.professional.name,
      appointmentTime: this.formatTime(appointment.timeSlot.startTime),
      status: appointment.status,
      statusColor: this.getStatusColor(appointment.status),
      urgencyBadge: this.generateUrgencyBadge(appointment),
      timeBadge: this.generateTimeBadge(appointment),
      indicators: this.generateIndicators(appointment),
      quickActions: this.generateQuickActions(appointment),
    };
  }

  /**
   * Present multiple appointments for list view
   */
  presentList(appointments: Appointment[]): AppointmentListItemViewModel[] {
    return appointments.map(appointment => this.presentForList(appointment));
  }

  /**
   * Present appointment dashboard
   */
  presentDashboard(appointments: Appointment[], date: Date = new Date()): AppointmentDashboardViewModel {
    // Calculate today's stats
    const todayStats = this.calculateTodayStats(appointments);
    
    // Group appointments by status/time
    const timelineGroups = this.groupAppointmentsForTimeline(appointments);
    
    // Generate alerts
    const alerts = this.generateDashboardAlerts(appointments);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(appointments);

    return {
      todayStats,
      timelineGroups,
      alerts,
      metrics,
    };
  }

  /**
   * Present waiting queue
   */
  presentWaitingQueue(
    appointments: Appointment[],
    queueName: string,
    location: string
  ): WaitingQueueViewModel {
    const waitingAppointments = appointments.filter(a => a.status === 'arrived');
    const waitTimes = waitingAppointments.map(a => a.getWaitTime()).filter(t => t > 0);
    const averageWaitTime = waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    // Find next appointment
    const inProgressAppointments = appointments.filter(a => a.status === 'in_progress');
    const nextAppointment = waitingAppointments.length > 0 ? waitingAppointments[0] : undefined;

    return {
      queueName,
      location,
      totalWaiting: waitingAppointments.length,
      averageWaitTime: this.formatDuration(averageWaitTime),
      nextAppointment: nextAppointment ? {
        patientName: nextAppointment.getPatientName(),
        estimatedTime: this.formatTime(nextAppointment.timeSlot.startTime),
      } : undefined,
      waitingAppointments: waitingAppointments.map(a => this.presentForCard(a)),
      alerts: this.generateQueueAlerts(waitingAppointments),
    };
  }

  // Private helper methods

  private getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange' {
    const colorMap = {
      scheduled: 'blue' as const,
      arrived: 'yellow' as const,
      in_progress: 'orange' as const,
      completed: 'green' as const,
      cancelled: 'gray' as const,
      no_show: 'red' as const,
      rescheduled: 'yellow' as const,
    };
    return colorMap[status as keyof typeof colorMap] || 'gray';
  }

  private getStatusDisplay(status: string): string {
    const displayMap = {
      scheduled: 'Programada',
      arrived: 'Paciente Llegó',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Se Presentó',
      rescheduled: 'Reprogramada',
    };
    return displayMap[status as keyof typeof displayMap] || status;
  }

  private getUrgencyColor(urgency: string): 'green' | 'yellow' | 'orange' | 'red' {
    const colorMap = {
      low: 'green' as const,
      medium: 'yellow' as const,
      high: 'orange' as const,
      urgent: 'red' as const,
    };
    return colorMap[urgency as keyof typeof colorMap] || 'green';
  }

  private getUrgencyDisplay(urgency: string): string {
    const displayMap = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return displayMap[urgency as keyof typeof displayMap] || urgency;
  }

  private getTypeDisplay(type: string): string {
    const displayMap = {
      consultation: 'Consulta',
      follow_up: 'Seguimiento',
      emergency: 'Emergencia',
      routine: 'Rutina',
      evaluation: 'Evaluación',
      therapy: 'Terapia',
      procedure: 'Procedimiento',
    };
    return displayMap[type as keyof typeof displayMap] || type;
  }

  private calculateEstimatedDelay(appointment: Appointment): string | undefined {
    if (appointment.status !== 'scheduled' || !appointment.isOverdue()) {
      return undefined;
    }

    const now = new Date();
    const scheduledTime = appointment.timeSlot.startTime;
    const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / (1000 * 60));
    
    return `+${this.formatDuration(delayMinutes)}`;
  }

  private formatTimeUntil(appointmentTime: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes < 0) {
      return `Hace ${this.formatDuration(Math.abs(diffInMinutes))}`;
    } else if (diffInMinutes < 60) {
      return `En ${diffInMinutes}m`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return minutes > 0 ? `En ${hours}h ${minutes}m` : `En ${hours}h`;
    }
  }

  private presentHistory(appointment: Appointment): {
    status: string;
    statusDisplay: string;
    timestamp: string;
    timeDisplay: string;
    performedBy: string;
    notes?: string;
    duration?: string;
  }[] {
    return appointment.history.map((historyItem, index) => {
      let duration: string | undefined;
      
      // Calculate duration between this step and the next
      if (index < appointment.history.length - 1) {
        const nextItem = appointment.history[index + 1];
        const durationMinutes = Math.floor(
          (nextItem.timestamp.getTime() - historyItem.timestamp.getTime()) / (1000 * 60)
        );
        duration = this.formatDuration(durationMinutes);
      }

      return {
        status: historyItem.status,
        statusDisplay: this.getStatusDisplay(historyItem.status),
        timestamp: this.formatDateTime(historyItem.timestamp),
        timeDisplay: this.formatTime(historyItem.timestamp),
        performedBy: historyItem.changedBy,
        notes: historyItem.notes,
        duration,
      };
    });
  }

  private generateUrgencyBadge(appointment: Appointment): {
    text: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
    visible: boolean;
  } {
    return {
      text: this.getUrgencyDisplay(appointment.urgency),
      color: this.getUrgencyColor(appointment.urgency),
      visible: appointment.urgency !== 'low',
    };
  }

  private generateTimeBadge(appointment: Appointment): {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
    icon: string;
  } {
    if (appointment.isOverdue()) {
      return {
        text: 'Atrasada',
        color: 'red',
        icon: 'clock-x',
      };
    } else if (appointment.canBeCheckedIn()) {
      return {
        text: 'Listo',
        color: 'green',
        icon: 'clock-check',
      };
    } else {
      const timeUntil = this.formatTimeUntil(appointment.timeSlot.startTime);
      return {
        text: timeUntil,
        color: 'blue',
        icon: 'clock',
      };
    }
  }

  private generateIndicators(appointment: Appointment): {
    icon: string;
    color: string;
    tooltip: string;
  }[] {
    const indicators = [];

    if (appointment.isRecurring) {
      indicators.push({
        icon: 'repeat',
        color: 'blue',
        tooltip: 'Cita recurrente',
      });
    }

    if (appointment.confirmationRequired && !appointment.reminderSent) {
      indicators.push({
        icon: 'phone',
        color: 'orange',
        tooltip: 'Requiere confirmación',
      });
    }

    if (appointment.specialInstructions) {
      indicators.push({
        icon: 'alert-circle',
        color: 'purple',
        tooltip: 'Instrucciones especiales',
      });
    }

    if (appointment.waitingRoomLocation) {
      indicators.push({
        icon: 'map-pin',
        color: 'green',
        tooltip: `Sala: ${appointment.waitingRoomLocation}`,
      });
    }

    return indicators;
  }

  private generateQuickActions(appointment: Appointment): {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
    disabled: boolean;
  }[] {
    const actions = [];

    if (appointment.canBeCheckedIn()) {
      actions.push({
        label: 'Check-in',
        action: 'check_in',
        color: 'primary' as const,
        icon: 'user-check',
        disabled: false,
      });
    }

    if (appointment.isReadyToStart()) {
      actions.push({
        label: 'Iniciar',
        action: 'start',
        color: 'success' as const,
        icon: 'play',
        disabled: false,
      });
    }

    if (appointment.status === 'in_progress') {
      actions.push({
        label: 'Completar',
        action: 'complete',
        color: 'success' as const,
        icon: 'check',
        disabled: false,
      });
    }

    if (['scheduled', 'arrived'].includes(appointment.status)) {
      actions.push({
        label: 'Cancelar',
        action: 'cancel',
        color: 'danger' as const,
        icon: 'x',
        disabled: false,
      });

      actions.push({
        label: 'No Show',
        action: 'no_show',
        color: 'warning' as const,
        icon: 'user-x',
        disabled: false,
      });
    }

    actions.push({
      label: 'Detalles',
      action: 'view_details',
      color: 'secondary' as const,
      icon: 'eye',
      disabled: false,
    });

    return actions;
  }

  private calculateTodayStats(appointments: Appointment[]): {
    total: number;
    scheduled: number;
    arrived: number;
    inProgress: number;
    completed: number;
    noShow: number;
    cancelled: number;
    completionRate: number;
    noShowRate: number;
  } {
    const total = appointments.length;
    const scheduled = appointments.filter(a => a.status === 'scheduled').length;
    const arrived = appointments.filter(a => a.status === 'arrived').length;
    const inProgress = appointments.filter(a => a.status === 'in_progress').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const noShow = appointments.filter(a => a.status === 'no_show').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;

    return {
      total,
      scheduled,
      arrived,
      inProgress,
      completed,
      noShow,
      cancelled,
      completionRate: Math.round(completionRate),
      noShowRate: Math.round(noShowRate),
    };
  }

  private groupAppointmentsForTimeline(appointments: Appointment[]): {
    title: string;
    count: number;
    color: 'blue' | 'yellow' | 'green' | 'red';
    appointments: AppointmentCardViewModel[];
  }[] {
    const groups = [];

    // Upcoming appointments
    const upcoming = appointments.filter(a => a.status === 'scheduled' && !a.isOverdue());
    if (upcoming.length > 0) {
      groups.push({
        title: 'Próximas Citas',
        count: upcoming.length,
        color: 'blue' as const,
        appointments: upcoming.map(a => this.presentForCard(a)),
      });
    }

    // Waiting patients
    const waiting = appointments.filter(a => a.status === 'arrived');
    if (waiting.length > 0) {
      groups.push({
        title: 'Pacientes Esperando',
        count: waiting.length,
        color: 'yellow' as const,
        appointments: waiting.map(a => this.presentForCard(a)),
      });
    }

    // In progress
    const inProgress = appointments.filter(a => a.status === 'in_progress');
    if (inProgress.length > 0) {
      groups.push({
        title: 'En Consulta',
        count: inProgress.length,
        color: 'green' as const,
        appointments: inProgress.map(a => this.presentForCard(a)),
      });
    }

    // Overdue
    const overdue = appointments.filter(a => a.status === 'scheduled' && a.isOverdue());
    if (overdue.length > 0) {
      groups.push({
        title: 'Citas Atrasadas',
        count: overdue.length,
        color: 'red' as const,
        appointments: overdue.map(a => this.presentForCard(a)),
      });
    }

    return groups;
  }

  private generateDashboardAlerts(appointments: Appointment[]): {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    appointmentId?: string;
    actionRequired: boolean;
  }[] {
    const alerts = [];

    // Overdue appointments
    const overdueAppointments = appointments.filter(a => a.isOverdue());
    if (overdueAppointments.length > 0) {
      alerts.push({
        type: 'error' as const,
        title: 'Citas Atrasadas',
        message: `${overdueAppointments.length} cita(s) están atrasadas`,
        actionRequired: true,
      });
    }

    // Long waiting times
    const longWaitingAppointments = appointments.filter(a => 
      a.status === 'arrived' && a.getWaitTime() > 45
    );
    if (longWaitingAppointments.length > 0) {
      alerts.push({
        type: 'warning' as const,
        title: 'Tiempos de Espera Largos',
        message: `${longWaitingAppointments.length} paciente(s) han estado esperando más de 45 minutos`,
        actionRequired: true,
      });
    }

    // Urgent appointments
    const urgentAppointments = appointments.filter(a => a.urgency === 'urgent' && a.status !== 'completed');
    if (urgentAppointments.length > 0) {
      alerts.push({
        type: 'warning' as const,
        title: 'Citas Urgentes',
        message: `${urgentAppointments.length} cita(s) marcadas como urgentes`,
        actionRequired: true,
      });
    }

    // Confirmations needed
    const needingConfirmation = appointments.filter(a => 
      a.confirmationRequired && !a.reminderSent && a.status === 'scheduled'
    );
    if (needingConfirmation.length > 0) {
      alerts.push({
        type: 'info' as const,
        title: 'Confirmaciones Pendientes',
        message: `${needingConfirmation.length} cita(s) requieren confirmación`,
        actionRequired: false,
      });
    }

    return alerts;
  }

  private generateQueueAlerts(appointments: Appointment[]): string[] {
    const alerts = [];

    const longWaiting = appointments.filter(a => a.getWaitTime() > 30);
    if (longWaiting.length > 0) {
      alerts.push(`${longWaiting.length} paciente(s) esperando más de 30 minutos`);
    }

    const urgent = appointments.filter(a => a.urgency === 'urgent');
    if (urgent.length > 0) {
      alerts.push(`${urgent.length} paciente(s) urgentes en cola`);
    }

    return alerts;
  }

  private calculateMetrics(appointments: Appointment[]): {
    averageWaitTime: string;
    averageConsultationTime: string;
    onTimeRate: number;
    patientSatisfaction: number;
  } {
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    
    // Calculate average wait time
    const waitTimes = appointments
      .filter(a => a.getWaitTime() > 0)
      .map(a => a.getWaitTime());
    const averageWaitTime = waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    // Calculate average consultation time
    const consultationTimes = completedAppointments
      .filter(a => a.getActualDuration() > 0)
      .map(a => a.getActualDuration());
    const averageConsultationTime = consultationTimes.length > 0
      ? Math.round(consultationTimes.reduce((a, b) => a + b, 0) / consultationTimes.length)
      : 0;

    // Calculate on-time rate
    const onTimeAppointments = appointments.filter(a => !a.isOverdue());
    const onTimeRate = appointments.length > 0 
      ? (onTimeAppointments.length / appointments.length) * 100
      : 0;

    return {
      averageWaitTime: this.formatDuration(averageWaitTime),
      averageConsultationTime: this.formatDuration(averageConsultationTime),
      onTimeRate: Math.round(onTimeRate),
      patientSatisfaction: 4.2, // This would come from actual patient feedback
    };
  }

  // Utility formatting methods

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}