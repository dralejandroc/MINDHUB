/**
 * Patient Presenter
 * Transforms Patient entities into UI-ready formats for FrontDesk module
 */

import { Patient } from '../entities/Patient';

export interface PatientListItemViewModel {
  id: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  email: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  medicalRecordNumber: string;
  waitingTime?: string;
  priority: number;
  hasSpecialNeeds: boolean;
  isMinor: boolean;
  isUrgent: boolean;
  insuranceStatus: string;
  insuranceStatusColor: 'green' | 'yellow' | 'red' | 'gray';
  lastVisit?: string;
  checkInLocation?: string;
  specialNeedsIndicators: string[];
}

export interface PatientDetailsViewModel {
  // Basic Information
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  isMinor: boolean;
  
  // Contact Information
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  preferredLanguage: string;
  
  // Medical Information
  medicalRecordNumber: string;
  hasSpecialNeeds: boolean;
  specialNeedsDescription: string[];
  notes: string;
  
  // Status Information
  status: string;
  statusDisplay: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  isCheckedIn: boolean;
  requiresAttention: boolean;
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relation: string;
    phoneNumber: string;
    email?: string;
    displayText: string;
  };
  
  // Insurance Information
  insurance?: {
    providerName: string;
    policyNumber: string;
    groupNumber?: string;
    status: string;
    statusDisplay: string;
    statusColor: 'green' | 'yellow' | 'red' | 'gray';
    expirationDate?: string;
    copayAmount?: number;
    displaySummary: string;
  };
  
  // Check-in Information
  checkIn?: {
    checkedInAt: string;
    checkedInTime: string;
    checkedInBy: string;
    waitingTime: string;
    waitingMinutes: number;
    location?: string;
    estimatedWaitTime?: number;
    specialNeeds: string[];
    isOverdue: boolean;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface PatientCardViewModel {
  id: string;
  fullName: string;
  age: number;
  status: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  waitingTime?: string;
  priority: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  priorityColor: 'green' | 'yellow' | 'orange' | 'red';
  avatar: string;
  badges: {
    text: string;
    color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
    icon?: string;
  }[];
  quickActions: {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    disabled: boolean;
  }[];
}

export interface WaitingRoomViewModel {
  totalWaiting: number;
  averageWaitTime: string;
  longestWaitTime: string;
  urgentCount: number;
  specialNeedsCount: number;
  locations: {
    name: string;
    count: number;
    averageWait: string;
  }[];
  patients: PatientCardViewModel[];
  alerts: {
    type: 'info' | 'warning' | 'error';
    message: string;
    patientId?: string;
  }[];
}

export class PatientPresenter {
  
  /**
   * Present patient for list view
   */
  presentForList(patient: Patient): PatientListItemViewModel {
    return {
      id: patient.id,
      fullName: patient.getFullName(),
      age: patient.getAge(),
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      status: patient.status,
      statusColor: this.getStatusColor(patient.status),
      medicalRecordNumber: patient.medicalRecordNumber,
      waitingTime: this.formatWaitingTime(patient),
      priority: patient.getPriorityScore(),
      hasSpecialNeeds: patient.hasSpecialNeeds,
      isMinor: patient.isMinor,
      isUrgent: patient.requiresSpecialAttention(),
      insuranceStatus: patient.insuranceInfo?.status || 'none',
      insuranceStatusColor: this.getInsuranceStatusColor(patient.insuranceInfo?.status),
      lastVisit: this.formatLastVisit(patient),
      checkInLocation: patient.checkInInfo?.waitingRoomLocation,
      specialNeedsIndicators: this.getSpecialNeedsIndicators(patient),
    };
  }

  /**
   * Present patient for detailed view
   */
  presentForDetails(patient: Patient): PatientDetailsViewModel {
    return {
      // Basic Information
      id: patient.id,
      fullName: patient.getFullName(),
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.getAge(),
      dateOfBirth: this.formatDate(patient.dateOfBirth),
      isMinor: patient.isMinor,
      
      // Contact Information
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      address: {
        street: patient.address,
        city: patient.city,
        state: patient.state,
        zipCode: patient.zipCode,
        fullAddress: `${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}`,
      },
      preferredLanguage: patient.preferredLanguage,
      
      // Medical Information
      medicalRecordNumber: patient.medicalRecordNumber,
      hasSpecialNeeds: patient.hasSpecialNeeds,
      specialNeedsDescription: this.getSpecialNeedsIndicators(patient),
      notes: patient.notes,
      
      // Status Information
      status: patient.status,
      statusDisplay: this.getStatusDisplay(patient.status),
      statusColor: this.getStatusColor(patient.status),
      isCheckedIn: patient.isCheckedIn(),
      requiresAttention: patient.requiresSpecialAttention(),
      
      // Emergency Contact
      emergencyContact: {
        name: patient.emergencyContact.name,
        relation: patient.emergencyContact.relation,
        phoneNumber: patient.emergencyContact.phoneNumber,
        email: patient.emergencyContact.email,
        displayText: `${patient.emergencyContact.name} (${patient.emergencyContact.relation}) - ${patient.emergencyContact.phoneNumber}`,
      },
      
      // Insurance Information
      insurance: patient.insuranceInfo ? {
        providerName: patient.insuranceInfo.providerName,
        policyNumber: patient.insuranceInfo.policyNumber,
        groupNumber: patient.insuranceInfo.groupNumber,
        status: patient.insuranceInfo.status,
        statusDisplay: this.getInsuranceStatusDisplay(patient.insuranceInfo.status),
        statusColor: this.getInsuranceStatusColor(patient.insuranceInfo.status),
        expirationDate: patient.insuranceInfo.expirationDate ? this.formatDate(patient.insuranceInfo.expirationDate) : undefined,
        copayAmount: patient.insuranceInfo.copayAmount,
        displaySummary: `${patient.insuranceInfo.providerName} - ${patient.insuranceInfo.policyNumber}`,
      } : undefined,
      
      // Check-in Information
      checkIn: patient.checkInInfo ? {
        checkedInAt: this.formatDateTime(patient.checkInInfo.checkedInAt),
        checkedInTime: this.formatTime(patient.checkInInfo.checkedInAt),
        checkedInBy: patient.checkInInfo.checkedInBy,
        waitingTime: this.formatDuration(patient.getWaitingTimeMinutes()),
        waitingMinutes: patient.getWaitingTimeMinutes(),
        location: patient.checkInInfo.waitingRoomLocation,
        estimatedWaitTime: patient.checkInInfo.estimatedWaitTime,
        specialNeeds: patient.checkInInfo.specialNeeds || [],
        isOverdue: patient.hasExcessiveWaitTime(),
      } : undefined,
      
      // Timestamps
      createdAt: this.formatDateTime(patient.createdAt),
      updatedAt: this.formatDateTime(patient.updatedAt),
      lastActivity: this.formatRelativeTime(patient.updatedAt),
    };
  }

  /**
   * Present patient for card view
   */
  presentForCard(patient: Patient): PatientCardViewModel {
    const priority = patient.getPriorityScore();
    const badges = this.generateBadges(patient);
    const quickActions = this.generateQuickActions(patient);

    return {
      id: patient.id,
      fullName: patient.getFullName(),
      age: patient.getAge(),
      status: patient.status,
      statusColor: this.getStatusColor(patient.status),
      waitingTime: this.formatWaitingTime(patient),
      priority,
      priorityLevel: this.getPriorityLevel(priority),
      priorityColor: this.getPriorityColor(priority),
      avatar: this.generateAvatar(patient),
      badges,
      quickActions,
    };
  }

  /**
   * Present multiple patients for list view
   */
  presentList(patients: Patient[]): PatientListItemViewModel[] {
    return patients.map(patient => this.presentForList(patient));
  }

  /**
   * Present waiting room status
   */
  presentWaitingRoom(patients: Patient[]): WaitingRoomViewModel {
    const waitingPatients = patients.filter(p => p.status === 'waiting');
    const waitTimes = waitingPatients.map(p => p.getWaitingTimeMinutes()).filter(t => t > 0);
    
    const totalWaiting = waitingPatients.length;
    const averageWait = waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;
    const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const urgentCount = waitingPatients.filter(p => p.requiresSpecialAttention()).length;
    const specialNeedsCount = waitingPatients.filter(p => p.hasSpecialNeeds).length;

    // Group by location
    const locationCounts: { [location: string]: { count: number; waitTimes: number[] } } = {};
    waitingPatients.forEach(patient => {
      const location = patient.checkInInfo?.waitingRoomLocation || 'General';
      if (!locationCounts[location]) {
        locationCounts[location] = { count: 0, waitTimes: [] };
      }
      locationCounts[location].count++;
      if (patient.getWaitingTimeMinutes() > 0) {
        locationCounts[location].waitTimes.push(patient.getWaitingTimeMinutes());
      }
    });

    const locations = Object.entries(locationCounts).map(([name, data]) => ({
      name,
      count: data.count,
      averageWait: data.waitTimes.length > 0 
        ? this.formatDuration(Math.round(data.waitTimes.reduce((a, b) => a + b, 0) / data.waitTimes.length))
        : '0m',
    }));

    // Generate alerts
    const alerts = this.generateWaitingRoomAlerts(waitingPatients);

    return {
      totalWaiting,
      averageWaitTime: this.formatDuration(averageWait),
      longestWaitTime: this.formatDuration(longestWait),
      urgentCount,
      specialNeedsCount,
      locations,
      patients: waitingPatients.map(p => this.presentForCard(p)),
      alerts,
    };
  }

  // Private helper methods

  private getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
    const colorMap = {
      waiting: 'yellow' as const,
      in_consultation: 'blue' as const,
      completed: 'green' as const,
      no_show: 'red' as const,
      cancelled: 'gray' as const,
    };
    return colorMap[status as keyof typeof colorMap] || 'gray';
  }

  private getStatusDisplay(status: string): string {
    const displayMap = {
      waiting: 'En Espera',
      in_consultation: 'En Consulta',
      completed: 'Completado',
      no_show: 'No Se Presentó',
      cancelled: 'Cancelado',
    };
    return displayMap[status as keyof typeof displayMap] || status;
  }

  private getInsuranceStatusColor(status?: string): 'green' | 'yellow' | 'red' | 'gray' {
    if (!status || status === 'none') return 'gray';
    
    const colorMap = {
      active: 'green' as const,
      expired: 'red' as const,
      pending: 'yellow' as const,
      none: 'gray' as const,
    };
    return colorMap[status as keyof typeof colorMap] || 'gray';
  }

  private getInsuranceStatusDisplay(status: string): string {
    const displayMap = {
      active: 'Activo',
      expired: 'Vencido',
      pending: 'Pendiente',
      none: 'Sin Seguro',
    };
    return displayMap[status as keyof typeof displayMap] || status;
  }

  private formatWaitingTime(patient: Patient): string | undefined {
    if (patient.status !== 'waiting' || !patient.checkInInfo) {
      return undefined;
    }
    return this.formatDuration(patient.getWaitingTimeMinutes());
  }

  private formatLastVisit(patient: Patient): string {
    return this.formatRelativeTime(patient.updatedAt);
  }

  private getSpecialNeedsIndicators(patient: Patient): string[] {
    const indicators: string[] = [];
    
    if (patient.isMinor) indicators.push('Menor');
    if (patient.hasSpecialNeeds) indicators.push('Necesidades Especiales');
    if (patient.getAge() >= 65) indicators.push('Adulto Mayor');
    if (patient.insuranceInfo?.status === 'expired') indicators.push('Seguro Vencido');
    if (patient.checkInInfo?.specialNeeds?.length) {
      indicators.push(...patient.checkInInfo.specialNeeds);
    }
    
    return indicators;
  }

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

  private generateAvatar(patient: Patient): string {
    // Generate a simple avatar based on initials
    const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#4F46E5"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
          ${initials}
        </text>
      </svg>
    `)}`;
  }

  private generateBadges(patient: Patient): {
    text: string;
    color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
    icon?: string;
  }[] {
    const badges = [];

    if (patient.isMinor) {
      badges.push({
        text: 'Menor',
        color: 'blue' as const,
        icon: 'baby',
      });
    }

    if (patient.hasSpecialNeeds) {
      badges.push({
        text: 'Necesidades Especiales',
        color: 'purple' as const,
        icon: 'accessibility',
      });
    }

    if (patient.getAge() >= 65) {
      badges.push({
        text: 'Adulto Mayor',
        color: 'green' as const,
        icon: 'user-plus',
      });
    }

    if (patient.insuranceInfo?.status === 'expired') {
      badges.push({
        text: 'Seguro Vencido',
        color: 'red' as const,
        icon: 'alert-triangle',
      });
    }

    if (patient.hasExcessiveWaitTime()) {
      badges.push({
        text: 'Espera Excesiva',
        color: 'red' as const,
        icon: 'clock',
      });
    }

    return badges;
  }

  private generateQuickActions(patient: Patient): {
    label: string;
    action: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    disabled: boolean;
  }[] {
    const actions = [];

    if (patient.status === 'waiting') {
      actions.push({
        label: 'Iniciar Consulta',
        action: 'start_consultation',
        color: 'primary' as const,
        disabled: false,
      });

      actions.push({
        label: 'Marcar No Show',
        action: 'mark_no_show',
        color: 'warning' as const,
        disabled: false,
      });
    }

    if (patient.status === 'in_consultation') {
      actions.push({
        label: 'Completar',
        action: 'complete',
        color: 'success' as const,
        disabled: false,
      });
    }

    if (['waiting', 'in_consultation'].includes(patient.status)) {
      actions.push({
        label: 'Cancelar',
        action: 'cancel',
        color: 'danger' as const,
        disabled: false,
      });
    }

    actions.push({
      label: 'Ver Detalles',
      action: 'view_details',
      color: 'secondary' as const,
      disabled: false,
    });

    return actions;
  }

  private generateWaitingRoomAlerts(patients: Patient[]): {
    type: 'info' | 'warning' | 'error';
    message: string;
    patientId?: string;
  }[] {
    const alerts = [];

    // Check for excessive wait times
    const excessiveWaitPatients = patients.filter(p => p.hasExcessiveWaitTime());
    if (excessiveWaitPatients.length > 0) {
      alerts.push({
        type: 'error' as const,
        message: `${excessiveWaitPatients.length} paciente(s) con tiempo de espera excesivo`,
      });
    }

    // Check for urgent patients
    const urgentPatients = patients.filter(p => p.requiresSpecialAttention());
    if (urgentPatients.length > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${urgentPatients.length} paciente(s) requieren atención especial`,
      });
    }

    // Check for insurance issues
    const insuranceIssues = patients.filter(p => p.insuranceInfo?.status === 'expired');
    if (insuranceIssues.length > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${insuranceIssues.length} paciente(s) con problemas de seguro`,
      });
    }

    return alerts;
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

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return this.formatDate(date);
  }
}