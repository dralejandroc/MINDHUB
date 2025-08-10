/**
 * FrontDesk API Client - Handles all front desk operations
 * Uses the standardized BaseApiClient for consistent API communication
 */

import { BaseApiClient, ApiResponse } from './base-client';

export interface TodayStats {
  appointments: number;
  payments: number;
  pendingPayments: number;
  resourcesSent: number;
}

export interface TodayAppointment {
  id: string;
  patientName: string;
  patientId: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedTo?: string;
  type: 'payment' | 'appointment' | 'resource' | 'follow-up' | 'other';
}

class FrontDeskApiClient extends BaseApiClient {
  constructor() {
    super();
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(getToken?: () => Promise<string | null>): Promise<ApiResponse<TodayStats>> {
    return this.get<ApiResponse<TodayStats>>('/frontdesk/stats/today', getToken);
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(getToken?: () => Promise<string | null>): Promise<ApiResponse<TodayAppointment[]>> {
    return this.get<ApiResponse<TodayAppointment[]>>('/frontdesk/appointments/today', getToken);
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(getToken?: () => Promise<string | null>): Promise<ApiResponse<PendingTask[]>> {
    return this.get<ApiResponse<PendingTask[]>>('/frontdesk/tasks/pending', getToken);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, getToken?: () => Promise<string | null>): Promise<ApiResponse<PendingTask>> {
    return this.put<ApiResponse<PendingTask>>(`/frontdesk/tasks/${taskId}/status`, { status }, getToken);
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, getToken?: () => Promise<string | null>): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<ApiResponse<{ success: boolean }>>(`/frontdesk/tasks/${taskId}/complete`, {}, getToken);
  }

  /**
   * Create quick payment
   */
  async createQuickPayment(paymentData: {
    patientId: string;
    amount: number;
    method: string;
    description?: string;
  }, getToken?: () => Promise<string | null>): Promise<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/frontdesk/payments/quick', paymentData, getToken);
  }

  /**
   * Send resource to patient
   */
  async sendResourceToPatient(resourceData: {
    patientId: string;
    resourceId: string;
    method: 'email' | 'sms' | 'whatsapp';
    message?: string;
  }, getToken?: () => Promise<string | null>): Promise<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/frontdesk/resources/send', resourceData, getToken);
  }
}

// Export singleton instance
export const frontdeskApi = new FrontDeskApiClient();

// Named exports for convenience
export { FrontDeskApiClient };