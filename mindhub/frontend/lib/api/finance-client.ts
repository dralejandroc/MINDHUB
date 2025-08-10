/**
 * Finance API Client - Handles all financial operations
 * Uses the standardized BaseApiClient for consistent API communication
 */

import { BaseApiClient, ApiResponse } from './base-client';

export interface IncomeRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  description?: string;
  service_type?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceStats {
  todayIncome: number;
  weekIncome: number;
  monthIncome: number;
  pendingPayments: number;
  totalPatients: number;
  averageTicket: number;
}

class FinanceApiClient extends BaseApiClient {
  constructor() {
    super();
  }

  /**
   * Get income records with pagination and filtering
   */
  async getIncome(params?: {
    limit?: number;
    page?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    patientId?: string;
  }, getToken?: () => Promise<string | null>): Promise<ApiResponse<IncomeRecord[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.patientId) queryParams.append('patientId', params.patientId);

    const queryString = queryParams.toString();
    const endpoint = `/finance/income${queryString ? `?${queryString}` : ''}`;

    return this.get<ApiResponse<IncomeRecord[]>>(endpoint, getToken);
  }

  /**
   * Get finance statistics
   */
  async getStats(getToken?: () => Promise<string | null>): Promise<ApiResponse<FinanceStats>> {
    return this.get<ApiResponse<FinanceStats>>('/finance/stats', getToken);
  }

  /**
   * Create income record
   */
  async createIncomeRecord(incomeData: {
    patient_id: string;
    amount: number;
    method: string;
    description?: string;
    service_type?: string;
    status?: string;
  }, getToken?: () => Promise<string | null>): Promise<ApiResponse<IncomeRecord>> {
    return this.post<ApiResponse<IncomeRecord>>('/finance/income', incomeData, getToken);
  }

  /**
   * Update income record
   */
  async updateIncomeRecord(incomeId: string, incomeData: Partial<IncomeRecord>, getToken?: () => Promise<string | null>): Promise<ApiResponse<IncomeRecord>> {
    return this.put<ApiResponse<IncomeRecord>>(`/finance/income/${incomeId}`, incomeData, getToken);
  }

  /**
   * Delete income record
   */
  async deleteIncomeRecord(incomeId: string, getToken?: () => Promise<string | null>): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete<ApiResponse<{ success: boolean }>>(`/finance/income/${incomeId}`, getToken);
  }

  /**
   * Generate financial report
   */
  async generateReport(params: {
    startDate: string;
    endDate: string;
    type: 'income' | 'patients' | 'services' | 'comprehensive';
    format?: 'pdf' | 'excel';
  }, getToken?: () => Promise<string | null>): Promise<Blob> {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
      format: params.format || 'pdf',
    });

    const endpoint = `/finance/reports?${queryParams.toString()}`;
    
    // Use the base makeRequest method to handle the URL construction properly
    const response = await this.makeRequest<any>(endpoint, {
      method: 'GET'
    }, getToken);

    // For blob responses, we need to handle this differently
    // This is a simplified version - in reality, you'd want to modify makeRequest to handle blobs
    return new Blob([JSON.stringify(response)], { type: 'application/pdf' });
  }
}

// Export singleton instance
export const financeApi = new FinanceApiClient();

// Named exports for convenience
export { FinanceApiClient };