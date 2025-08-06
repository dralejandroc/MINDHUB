const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  fromWaitingList?: boolean;
  paymentConfirmed?: boolean;
  paymentAmount?: number;
}

export interface WaitingListEntry {
  id: string;
  patientId: string;
  patient?: Patient;
  appointmentType: string;
  preferredDates: string[];
  preferredTimes: string[];
  priority: 'alta' | 'media' | 'baja';
  notes?: string;
  addedDate: string;
  status: 'waiting' | 'contacted' | 'scheduled' | 'expired';
}

export interface AppointmentInvitation {
  id: string;
  waitingListEntry: WaitingListEntry & { patient: Patient };
  availableSlot: AvailableSlot;
  invitationSentDate: string;
  expirationDate: string;
  status: 'sent' | 'viewed' | 'accepted' | 'payment_pending' | 'confirmed' | 'expired' | 'declined';
  paymentRequired: number;
  paymentMethod?: 'card' | 'transfer' | 'cash';
  confirmationDeadline: string;
  viewedDate?: string;
  acceptedDate?: string;
  paymentDate?: string;
  declinedReason?: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  duration: number;
  reason: 'cancellation' | 'gap' | 'extension' | 'available';
}

export interface AppointmentData {
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
}

export interface WaitingListData {
  patientId: string;
  appointmentType: string;
  preferredDates: string[];
  preferredTimes: string[];
  priority: 'alta' | 'media' | 'baja';
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

// ==================== APPOINTMENTS ====================

export const agendaApi = {
  // Obtener citas
  async getAppointments(params?: {
    date?: string;
    status?: string;
    patientId?: string;
  }): Promise<ApiResponse<Appointment[]>> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.patientId) searchParams.append('patientId', params.patientId);

    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/appointments?${searchParams}`);
    return response.json();
  },

  // Crear nueva cita
  async createAppointment(appointmentData: AppointmentData): Promise<ApiResponse<Appointment>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    return response.json();
  },

  // Actualizar cita
  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  // Cancelar cita
  async cancelAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // ==================== WAITING LIST ====================

  // Obtener lista de espera
  async getWaitingList(params?: {
    priority?: string;
    status?: string;
  }): Promise<ApiResponse<WaitingListEntry[]>> {
    const searchParams = new URLSearchParams();
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.status) searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/waiting-list?${searchParams}`);
    return response.json();
  },

  // Agregar a lista de espera
  async addToWaitingList(waitingListData: WaitingListData): Promise<ApiResponse<WaitingListEntry>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/waiting-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waitingListData),
    });
    return response.json();
  },

  // Actualizar entrada en lista de espera
  async updateWaitingListEntry(entryId: string, updates: Partial<WaitingListEntry>): Promise<ApiResponse<WaitingListEntry>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/waiting-list/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  // Remover de lista de espera
  async removeFromWaitingList(entryId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/waiting-list/${entryId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // ==================== INVITATIONS ====================

  // Enviar invitaciones
  async sendInvitations(data: {
    availableSlot: AvailableSlot;
    selectedEntries: string[];
    paymentAmount: number;
    confirmationHours: number;
  }): Promise<ApiResponse<AppointmentInvitation[]>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/invitations/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Obtener invitaciones
  async getInvitations(params?: {
    status?: string;
    timeFilter?: string;
  }): Promise<ApiResponse<AppointmentInvitation[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.timeFilter) searchParams.append('timeFilter', params.timeFilter);

    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/invitations?${searchParams}`);
    return response.json();
  },

  // Actualizar estado de invitación
  async updateInvitationStatus(
    invitationId: string, 
    status: AppointmentInvitation['status'],
    data?: { paymentMethod?: 'card' | 'transfer' | 'cash' }
  ): Promise<ApiResponse<AppointmentInvitation>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/invitations/${invitationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, ...data }),
    });
    return response.json();
  },

  // ==================== AVAILABLE SLOTS ====================

  // Obtener espacios disponibles
  async getAvailableSlots(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<AvailableSlot[]>> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/available-slots?${searchParams}`);
    return response.json();
  },

  // ==================== PATIENTS ====================

  // Obtener pacientes
  async getPatients(search?: string): Promise<ApiResponse<Patient[]>> {
    const searchParams = new URLSearchParams();
    if (search) searchParams.append('search', search);

    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/patients?${searchParams}`);
    return response.json();
  },

  // ==================== DEADLINE MONITOR ====================

  // Estado del monitor
  async getMonitorStatus(): Promise<ApiResponse<{
    isRunning: boolean;
    monitoredInvitations: number;
    invitations: AppointmentInvitation[];
  }>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/monitor/status`);
    return response.json();
  },

  // Probar recordatorio
  async testReminder(invitationId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/api/v1/expedix/agenda/monitor/test-reminder/${invitationId}`, {
      method: 'POST',
    });
    return response.json();
  },

  // ==================== STATISTICS ====================

  // Obtener estadísticas de agenda
  async getAgendaStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    totalAppointments: number;
    confirmedAppointments: number;
    cancelledAppointments: number;
    waitingListTotal: number;
    pendingInvitations: number;
    confirmationRate: number;
    averageWaitTime: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    // Para esta implementación inicial, calcularemos estadísticas desde el frontend
    // En el futuro se puede crear un endpoint específico en el backend
    const [appointmentsRes, waitingListRes, invitationsRes] = await Promise.all([
      this.getAppointments(),
      this.getWaitingList(),
      this.getInvitations()
    ]);

    const appointments = appointmentsRes.data || [];
    const waitingList = waitingListRes.data || [];
    const invitations = invitationsRes.data || [];

    const stats = {
      totalAppointments: appointments.length,
      confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
      waitingListTotal: waitingList.filter(entry => entry.status === 'waiting').length,
      pendingInvitations: invitations.filter(inv => ['sent', 'viewed', 'accepted', 'payment_pending'].includes(inv.status)).length,
      confirmationRate: invitations.length > 0 
        ? Math.round((invitations.filter(inv => inv.status === 'confirmed').length / invitations.length) * 100)
        : 0,
      averageWaitTime: waitingList.length > 0
        ? Math.round(waitingList.reduce((acc, entry) => {
            const days = Math.ceil((new Date().getTime() - new Date(entry.addedDate).getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }, 0) / waitingList.length)
        : 0
    };

    return {
      success: true,
      data: stats
    };
  }
};

export default agendaApi;