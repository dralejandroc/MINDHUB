/**
 * Waiting Queue Presenter
 * Transforms WaitingQueue entities into UI-ready formats for FrontDesk module
 */

import { WaitingQueue, QueueItem, QueueMetrics } from '../entities/WaitingQueue';

export interface QueueItemViewModel {
  id: string;
  patientId: string;
  patientName: string;
  position: number;
  arrivalTime: string;
  waitingTime: string;
  waitingMinutes: number;
  estimatedWaitTime: string;
  priority: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  priorityColor: 'green' | 'yellow' | 'orange' | 'red';
  urgency: string;
  urgencyDisplay: string;
  urgencyColor: 'green' | 'yellow' | 'orange' | 'red';
  professionalName: string;
  appointmentType: string;
  typeDisplay: string;
  isWalkIn: boolean;
  hasSpecialNeeds: boolean;
  specialNeedsLabels: string[];
  requiresTranslation: boolean;
  hasInsuranceIssues: boolean;
  notes?: string;
  badges: {
    text: string;
    color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
    icon?: string;
  }[];
  isOverdue: boolean;
  canBeMoved: boolean;
  quickActions: {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
  }[];
}

export interface QueueSummaryViewModel {
  id: string;
  name: string;
  location: string;
  status: string;
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
  totalWaiting: number;
  capacity: number;
  capacityUsage: number;
  capacityColor: 'green' | 'yellow' | 'orange' | 'red';
  averageWaitTime: string;
  longestWaitTime: string;
  urgentCount: number;
  walkInCount: number;
  specialNeedsCount: number;
  nextPatient?: {
    name: string;
    waitTime: string;
  };
  professionalCount: number;
  configuration: {
    walkInAllowed: boolean;
    maxWaitTime: string;
    estimatedServiceTime: string;
  };
  alerts: {
    type: 'info' | 'warning' | 'error';
    message: string;
    count?: number;
  }[];
}

export interface QueueDetailsViewModel {
  // Basic Information
  id: string;
  name: string;
  location: string;
  status: string;
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
  isActive: boolean;
  
  // Capacity and Usage
  currentCapacity: number;
  maxCapacity: number;
  capacityUsage: number;
  capacityColor: 'green' | 'yellow' | 'orange' | 'red';
  
  // Metrics
  metrics: {
    totalWaiting: number;
    averageWaitTime: string;
    averageWaitTimeMinutes: number;
    longestWaitTime: string;
    longestWaitTimeMinutes: number;
    urgentPatients: number;
    walkInPatients: number;
    appointmentPatients: number;
    specialNeedsPatients: number;
    estimatedProcessingTime: string;
    transactionVelocity: number;
  };
  
  // Configuration
  configuration: {
    maxWaitTime: string;
    urgentPatientPriority: number;
    walkInAllowed: boolean;
    maxQueueSize: number;
    estimatedServiceTime: string;
    prioritizeAppointments: boolean;
  };
  
  // Queue Items
  items: QueueItemViewModel[];
  
  // Professionals
  professionals: {
    id: string;
    name: string;
    patientCount: number;
    averageServiceTime: string;
  }[];
  
  // Sort Options
  sortMethod: string;
  sortOptions: {
    value: string;
    label: string;
    description: string;
  }[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface QueueDashboardViewModel {
  overview: {
    totalQueues: number;
    activeQueues: number;
    totalWaitingPatients: number;
    averageWaitTime: string;
    queuesOverCapacity: number;
    urgentPatientsWaiting: number;
    longestWaitingPatient?: {
      queueName: string;
      patientName: string;
      waitTime: string;
    };
  };
  
  queueSummaries: QueueSummaryViewModel[];
  
  alerts: {
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    queueId?: string;
    actionRequired: boolean;
    timestamp: string;
  }[];
  
  metrics: {
    totalPatientThroughput: number;
    averageProcessingTime: string;
    queueEfficiency: number;
    patientSatisfaction: number;
  };
  
  trends: {
    label: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    color: 'green' | 'red' | 'blue';
  }[];
}

export interface QueueAnalyticsViewModel {
  performanceMetrics: {
    averageWaitTime: string;
    averageServiceTime: string;
    patientThroughput: number;
    efficiency: number;
    capacityUtilization: number;
    patientSatisfactionScore: number;
    noShowRate: number;
  };
  
  peakHours: {
    hour: string;
    count: number;
    percentage: number;
  }[];
  
  waitTimeByUrgency: {
    urgency: string;
    averageWaitTime: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
  }[];
  
  trends: {
    date: string;
    waitTime: number;
    throughput: number;
    satisfaction: number;
  }[];
  
  recommendations: {
    type: 'configuration' | 'staffing' | 'process';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    expectedImprovement: string;
    implementationEffort: 'easy' | 'medium' | 'hard';
    icon: string;
  }[];
}

export class WaitingQueuePresenter {
  
  /**
   * Present queue item for display
   */
  presentQueueItem(item: QueueItem): QueueItemViewModel {
    const waitingMinutes = Math.floor((new Date().getTime() - item.arrivalTime.getTime()) / (1000 * 60));
    
    return {
      id: item.id,
      patientId: item.patientId,
      patientName: item.patientName,
      position: item.position,
      arrivalTime: this.formatTime(item.arrivalTime),
      waitingTime: this.formatDuration(waitingMinutes),
      waitingMinutes,
      estimatedWaitTime: this.formatDuration(item.estimatedWaitTime),
      priority: item.priority,
      priorityLevel: this.getPriorityLevel(item.priority),
      priorityColor: this.getPriorityColor(item.priority),
      urgency: item.urgency,
      urgencyDisplay: this.getUrgencyDisplay(item.urgency),
      urgencyColor: this.getUrgencyColor(item.urgency),
      professionalName: item.professionalName,
      appointmentType: item.appointmentType,
      typeDisplay: this.getAppointmentTypeDisplay(item.appointmentType),
      isWalkIn: item.isWalkIn,
      hasSpecialNeeds: item.specialNeeds.length > 0,
      specialNeedsLabels: item.specialNeeds,
      requiresTranslation: item.requiresTranslation,
      hasInsuranceIssues: item.hasInsuranceIssues,
      notes: item.notes,
      badges: this.generateItemBadges(item),
      isOverdue: this.isItemOverdue(item, waitingMinutes),
      canBeMoved: true, // Usually true unless there are business constraints
      quickActions: this.generateItemQuickActions(item),
    };
  }

  /**
   * Present queue summary for overview
   */
  presentQueueSummary(queue: WaitingQueue): QueueSummaryViewModel {
    const metrics = queue.getMetrics();
    const nextPatient = queue.getNextPatient();
    
    return {
      id: queue.id,
      name: queue.name,
      location: queue.location,
      status: queue.status,
      statusDisplay: this.getStatusDisplay(queue.status),
      statusColor: this.getStatusColor(queue.status),
      totalWaiting: metrics.totalWaiting,
      capacity: queue.maxCapacity,
      capacityUsage: Math.round((metrics.totalWaiting / queue.maxCapacity) * 100),
      capacityColor: this.getCapacityColor(metrics.totalWaiting / queue.maxCapacity),
      averageWaitTime: this.formatDuration(metrics.averageWaitTime),
      longestWaitTime: this.formatDuration(metrics.longestWaitTime),
      urgentCount: metrics.urgentCount,
      walkInCount: metrics.walkInCount,
      specialNeedsCount: metrics.specialNeedsCount,
      nextPatient: nextPatient ? {
        name: nextPatient.patientName,
        waitTime: this.formatDuration(nextPatient.actualWaitTime),
      } : undefined,
      professionalCount: queue.professionalIds.length,
      configuration: {
        walkInAllowed: queue.configuration.walkInAllowed,
        maxWaitTime: this.formatDuration(queue.configuration.maxWaitTime),
        estimatedServiceTime: this.formatDuration(queue.configuration.estimatedServiceTime),
      },
      alerts: this.generateQueueAlerts(queue, metrics),
    };
  }

  /**
   * Present queue details for management view
   */
  presentQueueDetails(queue: WaitingQueue): QueueDetailsViewModel {
    const metrics = queue.getMetrics();
    
    return {
      // Basic Information
      id: queue.id,
      name: queue.name,
      location: queue.location,
      status: queue.status,
      statusDisplay: this.getStatusDisplay(queue.status),
      statusColor: this.getStatusColor(queue.status),
      isActive: queue.isActive,
      
      // Capacity and Usage
      currentCapacity: metrics.totalWaiting,
      maxCapacity: queue.maxCapacity,
      capacityUsage: Math.round((metrics.totalWaiting / queue.maxCapacity) * 100),
      capacityColor: this.getCapacityColor(metrics.totalWaiting / queue.maxCapacity),
      
      // Metrics
      metrics: {
        totalWaiting: metrics.totalWaiting,
        averageWaitTime: this.formatDuration(metrics.averageWaitTime),
        averageWaitTimeMinutes: metrics.averageWaitTime,
        longestWaitTime: this.formatDuration(metrics.longestWaitTime),
        longestWaitTimeMinutes: metrics.longestWaitTime,
        urgentPatients: metrics.urgentCount,
        walkInPatients: metrics.walkInCount,
        appointmentPatients: metrics.appointmentCount,
        specialNeedsPatients: metrics.specialNeedsCount,
        estimatedProcessingTime: this.formatDuration(metrics.estimatedProcessingTime),
        transactionVelocity: queue.items.length > 0 ? 
          Math.round((queue.items.length / Math.max(queue.getOperatingHours(), 1)) * 100) / 100 : 0,
      },
      
      // Configuration
      configuration: {
        maxWaitTime: this.formatDuration(queue.configuration.maxWaitTime),
        urgentPatientPriority: queue.configuration.urgentPatientPriority,
        walkInAllowed: queue.configuration.walkInAllowed,
        maxQueueSize: queue.configuration.maxQueueSize,
        estimatedServiceTime: this.formatDuration(queue.configuration.estimatedServiceTime),
        prioritizeAppointments: queue.configuration.prioritizeAppointments,
      },
      
      // Queue Items
      items: queue.items.map(item => this.presentQueueItem(item)),
      
      // Professionals (would normally get from professional service)
      professionals: queue.professionalIds.map(id => ({
        id,
        name: `Professional ${id}`, // TODO: Get from service
        patientCount: queue.getPatientsForProfessional(id).length,
        averageServiceTime: this.formatDuration(queue.configuration.estimatedServiceTime),
      })),
      
      // Sort Options
      sortMethod: queue.sortMethod,
      sortOptions: this.getSortOptions(),
      
      // Timestamps
      createdAt: this.formatDateTime(queue.createdAt),
      updatedAt: this.formatDateTime(queue.updatedAt),
    };
  }

  /**
   * Present dashboard overview
   */
  presentDashboard(
    queues: WaitingQueue[],
    statistics: any,
    alerts: any[]
  ): QueueDashboardViewModel {
    const activeQueues = queues.filter(q => q.isActive && q.status === 'active');
    const totalWaiting = activeQueues.reduce((sum, q) => sum + q.items.length, 0);
    const allWaitTimes = activeQueues.flatMap(q => 
      q.items.map(item => Math.floor((new Date().getTime() - item.arrivalTime.getTime()) / (1000 * 60)))
    );
    const averageWaitTime = allWaitTimes.length > 0 
      ? Math.round(allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length)
      : 0;
    
    const queuesOverCapacity = activeQueues.filter(q => 
      (q.items.length / q.maxCapacity) > 0.9
    ).length;
    
    const urgentPatientsWaiting = activeQueues.reduce((sum, q) => 
      sum + q.getUrgentPatients().length, 0
    );

    // Find longest waiting patient
    let longestWaitingPatient: { queueName: string; patientName: string; waitTime: string } | undefined;
    let longestWaitTime = 0;
    
    activeQueues.forEach(queue => {
      queue.items.forEach(item => {
        const waitTime = Math.floor((new Date().getTime() - item.arrivalTime.getTime()) / (1000 * 60));
        if (waitTime > longestWaitTime) {
          longestWaitTime = waitTime;
          longestWaitingPatient = {
            queueName: queue.name,
            patientName: item.patientName,
            waitTime: this.formatDuration(waitTime),
          };
        }
      });
    });

    return {
      overview: {
        totalQueues: queues.length,
        activeQueues: activeQueues.length,
        totalWaitingPatients: totalWaiting,
        averageWaitTime: this.formatDuration(averageWaitTime),
        queuesOverCapacity,
        urgentPatientsWaiting,
        longestWaitingPatient,
      },
      
      queueSummaries: activeQueues.map(queue => this.presentQueueSummary(queue)),
      
      alerts: this.presentDashboardAlerts(alerts),
      
      metrics: {
        totalPatientThroughput: statistics?.totalPatientThroughput || 0,
        averageProcessingTime: this.formatDuration(statistics?.averageProcessingTime || 30),
        queueEfficiency: statistics?.queueEfficiency || 85,
        patientSatisfaction: statistics?.patientSatisfaction || 4.2,
      },
      
      trends: this.generateTrends(statistics),
    };
  }

  /**
   * Present queue analytics
   */
  presentAnalytics(
    performanceMetrics: any,
    recommendations: any[]
  ): QueueAnalyticsViewModel {
    return {
      performanceMetrics: {
        averageWaitTime: this.formatDuration(performanceMetrics.averageWaitTime || 0),
        averageServiceTime: this.formatDuration(performanceMetrics.averageServiceTime || 0),
        patientThroughput: performanceMetrics.patientThroughput || 0,
        efficiency: performanceMetrics.efficiency || 0,
        capacityUtilization: performanceMetrics.capacityUtilization || 0,
        patientSatisfactionScore: performanceMetrics.patientSatisfactionScore || 0,
        noShowRate: performanceMetrics.noShowRate || 0,
      },
      
      peakHours: (performanceMetrics.peakHours || []).map((hour: any) => ({
        hour: `${hour.hour}:00`,
        count: hour.count,
        percentage: Math.round((hour.count / Math.max(...(performanceMetrics.peakHours || []).map((h: any) => h.count), 1)) * 100),
      })),
      
      waitTimeByUrgency: Object.entries(performanceMetrics.waitTimeByUrgency || {}).map(([urgency, waitTime]) => ({
        urgency: this.getUrgencyDisplay(urgency),
        averageWaitTime: this.formatDuration(waitTime as number),
        color: this.getUrgencyColor(urgency),
      })),
      
      trends: (performanceMetrics.trends || []).map((trend: any) => ({
        date: this.formatDate(new Date(trend.date)),
        waitTime: trend.waitTime,
        throughput: trend.throughput,
        satisfaction: trend.satisfaction,
      })),
      
      recommendations: recommendations.map(rec => ({
        type: rec.type,
        priority: rec.priority,
        title: this.getRecommendationTitle(rec.type, rec.priority),
        description: rec.description,
        expectedImprovement: rec.expectedImprovement,
        implementationEffort: rec.implementationEffort,
        icon: this.getRecommendationIcon(rec.type),
      })),
    };
  }

  // Private helper methods

  private getPriorityLevel(priority: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (priority >= 8) return 'urgent';
    if (priority >= 6) return 'high';
    if (priority >= 4) return 'medium';
    return 'low';
  }

  private getPriorityColor(priority: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (priority >= 8) return 'red';
    if (priority >= 6) return 'orange';
    if (priority >= 4) return 'yellow';
    return 'green';
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

  private getAppointmentTypeDisplay(type: string): string {
    const displayMap = {
      'walk-in': 'Sin Cita',
      'scheduled': 'Programada',
      'consultation': 'Consulta',
      'follow-up': 'Seguimiento',
      'emergency': 'Emergencia',
    };
    return displayMap[type as keyof typeof displayMap] || type;
  }

  private getStatusDisplay(status: string): string {
    const displayMap = {
      active: 'Activa',
      paused: 'Pausada',
      closed: 'Cerrada',
    };
    return displayMap[status as keyof typeof displayMap] || status;
  }

  private getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
    const colorMap = {
      active: 'green' as const,
      paused: 'yellow' as const,
      closed: 'gray' as const,
    };
    return colorMap[status as keyof typeof colorMap] || 'gray';
  }

  private getCapacityColor(utilization: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (utilization >= 0.9) return 'red';
    if (utilization >= 0.75) return 'orange';
    if (utilization >= 0.5) return 'yellow';
    return 'green';
  }

  private isItemOverdue(item: QueueItem, waitingMinutes: number): boolean {
    const maxWaitTime = item.urgency === 'urgent' ? 15 : 45; // Different thresholds by urgency
    return waitingMinutes > maxWaitTime;
  }

  private generateItemBadges(item: QueueItem): {
    text: string;
    color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
    icon?: string;
  }[] {
    const badges = [];

    if (item.isWalkIn) {
      badges.push({
        text: 'Sin Cita',
        color: 'blue' as const,
        icon: 'user-plus',
      });
    }

    if (item.specialNeeds.length > 0) {
      badges.push({
        text: 'Necesidades Especiales',
        color: 'purple' as const,
        icon: 'accessibility',
      });
    }

    if (item.requiresTranslation) {
      badges.push({
        text: 'Traducción',
        color: 'yellow' as const,
        icon: 'globe',
      });
    }

    if (item.hasInsuranceIssues) {
      badges.push({
        text: 'Problema Seguro',
        color: 'red' as const,
        icon: 'alert-triangle',
      });
    }

    return badges;
  }

  private generateItemQuickActions(item: QueueItem): {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: string;
  }[] {
    return [
      {
        label: 'Llamar Siguiente',
        action: 'call_next',
        color: 'primary',
        icon: 'phone',
      },
      {
        label: 'Mover',
        action: 'move',
        color: 'secondary',
        icon: 'move',
      },
      {
        label: 'Remover',
        action: 'remove',
        color: 'danger',
        icon: 'x',
      },
      {
        label: 'Detalles',
        action: 'details',
        color: 'secondary',
        icon: 'eye',
      },
    ];
  }

  private generateQueueAlerts(queue: WaitingQueue, metrics: QueueMetrics): {
    type: 'info' | 'warning' | 'error';
    message: string;
    count?: number;
  }[] {
    const alerts = [];

    // Capacity alerts
    const capacityUsage = metrics.totalWaiting / queue.maxCapacity;
    if (capacityUsage >= 0.9) {
      alerts.push({
        type: 'error' as const,
        message: 'Cola cerca de la capacidad máxima',
      });
    } else if (capacityUsage >= 0.75) {
      alerts.push({
        type: 'warning' as const,
        message: 'Cola al 75% de capacidad',
      });
    }

    // Wait time alerts
    if (metrics.longestWaitTime > 60) {
      alerts.push({
        type: 'error' as const,
        message: 'Paciente esperando más de 1 hora',
      });
    } else if (metrics.averageWaitTime > 30) {
      alerts.push({
        type: 'warning' as const,
        message: 'Tiempo de espera promedio elevado',
      });
    }

    // Urgent patient alerts
    if (metrics.urgentCount > 0) {
      alerts.push({
        type: 'warning' as const,
        message: 'Pacientes urgentes en cola',
        count: metrics.urgentCount,
      });
    }

    // Status alerts
    if (queue.status === 'paused') {
      alerts.push({
        type: 'info' as const,
        message: 'Cola pausada',
      });
    }

    return alerts;
  }

  private getSortOptions(): {
    value: string;
    label: string;
    description: string;
  }[] {
    return [
      {
        value: 'arrival_time',
        label: 'Orden de Llegada',
        description: 'Ordenar por tiempo de llegada',
      },
      {
        value: 'priority',
        label: 'Prioridad',
        description: 'Ordenar por prioridad del paciente',
      },
      {
        value: 'urgency',
        label: 'Urgencia',
        description: 'Ordenar por nivel de urgencia',
      },
      {
        value: 'appointment_time',
        label: 'Hora de Cita',
        description: 'Citas programadas primero',
      },
    ];
  }

  private presentDashboardAlerts(alerts: any[]): {
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    queueId?: string;
    actionRequired: boolean;
    timestamp: string;
  }[] {
    return alerts.map(alert => ({
      type: alert.severity || 'info',
      title: this.getAlertTitle(alert.alertType),
      message: alert.message,
      queueId: alert.queueId,
      actionRequired: alert.actionRequired || false,
      timestamp: this.formatDateTime(new Date(alert.timestamp)),
    }));
  }

  private generateTrends(statistics: any): {
    label: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    color: 'green' | 'red' | 'blue';
  }[] {
    if (!statistics) {
      return [];
    }

    return [
      {
        label: 'Tiempo Promedio Espera',
        current: statistics.currentAverageWait || 0,
        previous: statistics.previousAverageWait || 0,
        change: statistics.waitTimeChange || 0,
        trend: this.getTrend(statistics.waitTimeChange),
        color: statistics.waitTimeChange > 0 ? 'red' : 'green',
      },
      {
        label: 'Satisfacción Paciente',
        current: statistics.currentSatisfaction || 0,
        previous: statistics.previousSatisfaction || 0,
        change: statistics.satisfactionChange || 0,
        trend: this.getTrend(statistics.satisfactionChange),
        color: statistics.satisfactionChange > 0 ? 'green' : 'red',
      },
    ];
  }

  private getTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private getAlertTitle(alertType: string): string {
    const titleMap = {
      wait_time: 'Tiempo de Espera',
      capacity: 'Capacidad',
      efficiency: 'Eficiencia',
      patient_needs: 'Necesidades del Paciente',
    };
    return titleMap[alertType as keyof typeof titleMap] || 'Alerta';
  }

  private getRecommendationTitle(type: string, priority: string): string {
    const typeMap = {
      configuration: 'Configuración',
      staffing: 'Personal',
      process: 'Proceso',
    };
    const priorityMap = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    
    return `${typeMap[type as keyof typeof typeMap]} (${priorityMap[priority as keyof typeof priorityMap]})`;
  }

  private getRecommendationIcon(type: string): string {
    const iconMap = {
      configuration: 'settings',
      staffing: 'users',
      process: 'workflow',
    };
    return iconMap[type as keyof typeof iconMap] || 'lightbulb';
  }

  // Utility formatting methods

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
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