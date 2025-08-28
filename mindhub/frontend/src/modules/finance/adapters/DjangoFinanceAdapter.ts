/**
 * Django Finance Adapter
 * Implementation of finance repositories using Django REST API
 */

import { Income } from '../entities/Income';
import { Service } from '../entities/Service';
import { CashRegister } from '../entities/CashRegister';
import { IncomeRepository, IncomeFilters, IncomeStatistics } from '../repositories/IncomeRepository';
import { ServiceRepository, ServiceFilters, ServiceStatistics } from '../repositories/ServiceRepository';
import { CashRegisterRepository, CashRegisterFilters, CashRegisterSummary, DailySummary } from '../repositories/CashRegisterRepository';

export class DjangoIncomeAdapter implements IncomeRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/finance/django') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token') || ''}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data;
  }

  private mapToIncome(data: any): Income {
    return new Income(
      data.id,
      data.patient_id,
      data.service_id,
      data.professional_id,
      data.amount,
      data.payment_method,
      data.concept,
      new Date(data.date),
      data.status,
      data.notes,
      data.clinic_id,
      data.workspace_id
    );
  }

  async create(income: Income): Promise<Income> {
    const data = await this.makeRequest<any>('/incomes/', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: income.patientId,
        service_id: income.serviceId,
        professional_id: income.professionalId,
        amount: income.amount,
        payment_method: income.paymentMethod,
        concept: income.concept,
        date: income.date.toISOString(),
        status: income.status,
        notes: income.notes,
        clinic_id: income.clinicId,
        workspace_id: income.workspaceId,
      }),
    });

    return this.mapToIncome(data);
  }

  async findById(id: string): Promise<Income | null> {
    try {
      const data = await this.makeRequest<any>(`/incomes/${id}/`);
      return this.mapToIncome(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findAll(filters?: IncomeFilters): Promise<Income[]> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    if (filters?.endDate) params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    if (filters?.paymentMethod) params.append('payment_method', filters.paymentMethod);
    if (filters?.serviceId) params.append('service_id', filters.serviceId);
    if (filters?.patientId) params.append('patient_id', filters.patientId);
    if (filters?.professionalId) params.append('professional_id', filters.professionalId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<any[]>(`/incomes/?${params.toString()}`);
    return data.map(this.mapToIncome);
  }

  async update(income: Income): Promise<Income> {
    const data = await this.makeRequest<any>(`/incomes/${income.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: income.amount,
        payment_method: income.paymentMethod,
        concept: income.concept,
        status: income.status,
        notes: income.notes,
      }),
    });

    return this.mapToIncome(data);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/incomes/${id}/`, {
      method: 'DELETE',
    });
  }

  async findByPatient(patientId: string, filters?: IncomeFilters): Promise<Income[]> {
    return this.findAll({ ...filters, patientId });
  }

  async findByProfessional(professionalId: string, filters?: IncomeFilters): Promise<Income[]> {
    return this.findAll({ ...filters, professionalId });
  }

  async findByDateRange(startDate: Date, endDate: Date, filters?: IncomeFilters): Promise<Income[]> {
    return this.findAll({ ...filters, startDate, endDate });
  }

  async findByPaymentMethod(method: string, filters?: IncomeFilters): Promise<Income[]> {
    return this.findAll({ ...filters, paymentMethod: method });
  }

  async findPending(filters?: IncomeFilters): Promise<Income[]> {
    return this.findAll({ ...filters, status: 'pending' });
  }

  async getStatistics(filters?: IncomeFilters): Promise<IncomeStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    if (filters?.endDate) params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<IncomeStatistics>(`/incomes/statistics/?${params.toString()}`);
  }

  async getDailyTotal(date: Date, filters?: IncomeFilters): Promise<number> {
    const params = new URLSearchParams();
    params.append('date', date.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<{ total: number }>(`/incomes/daily-total/?${params.toString()}`);
    return data.total;
  }

  async getMonthlyTotal(year: number, month: number, filters?: IncomeFilters): Promise<number> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    params.append('month', month.toString());
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<{ total: number }>(`/incomes/monthly-total/?${params.toString()}`);
    return data.total;
  }

  async getYearlyTotal(year: number, filters?: IncomeFilters): Promise<number> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<{ total: number }>(`/incomes/yearly-total/?${params.toString()}`);
    return data.total;
  }

  async createBulk(incomes: Income[]): Promise<Income[]> {
    const data = await this.makeRequest<any[]>('/incomes/bulk/', {
      method: 'POST',
      body: JSON.stringify({
        incomes: incomes.map(income => ({
          patient_id: income.patientId,
          service_id: income.serviceId,
          professional_id: income.professionalId,
          amount: income.amount,
          payment_method: income.paymentMethod,
          concept: income.concept,
          date: income.date.toISOString(),
          status: income.status,
          notes: income.notes,
          clinic_id: income.clinicId,
          workspace_id: income.workspaceId,
        })),
      }),
    });

    return data.map(this.mapToIncome);
  }

  async updateStatus(ids: string[], status: string): Promise<void> {
    await this.makeRequest('/incomes/bulk-status/', {
      method: 'PUT',
      body: JSON.stringify({ ids, status }),
    });
  }

  async processRefund(incomeId: string, amount: number, reason: string): Promise<Income> {
    const data = await this.makeRequest<any>(`/incomes/${incomeId}/refund/`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });

    return this.mapToIncome(data);
  }

  async applyDiscount(incomeId: string, discountAmount: number, reason: string): Promise<Income> {
    const data = await this.makeRequest<any>(`/incomes/${incomeId}/discount/`, {
      method: 'POST',
      body: JSON.stringify({ discount_amount: discountAmount, reason }),
    });

    return this.mapToIncome(data);
  }

  async getIncomeByService(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    return this.makeRequest<Record<string, number>>(`/incomes/by-service/?${params.toString()}`);
  }

  async getIncomeByProfessional(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    return this.makeRequest<Record<string, number>>(`/incomes/by-professional/?${params.toString()}`);
  }

  async getPaymentMethodDistribution(filters?: IncomeFilters): Promise<Record<string, number>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    if (filters?.endDate) params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<Record<string, number>>(`/incomes/payment-methods/?${params.toString()}`);
  }
}

export class DjangoServiceAdapter implements ServiceRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/finance/django') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token') || ''}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data;
  }

  private mapToService(data: any): Service {
    return new Service(
      data.id,
      data.name,
      data.description,
      data.price,
      data.duration,
      data.category,
      data.professional_id,
      data.is_active,
      data.clinic_id,
      data.workspace_id
    );
  }

  async create(service: Service): Promise<Service> {
    const data = await this.makeRequest<any>('/services/', {
      method: 'POST',
      body: JSON.stringify({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        professional_id: service.professionalId,
        is_active: service.isActive,
        clinic_id: service.clinicId,
        workspace_id: service.workspaceId,
      }),
    });

    return this.mapToService(data);
  }

  async findById(id: string): Promise<Service | null> {
    try {
      const data = await this.makeRequest<any>(`/services/${id}/`);
      return this.mapToService(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findAll(filters?: ServiceFilters): Promise<Service[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());
    if (filters?.professionalId) params.append('professional_id', filters.professionalId);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);

    const data = await this.makeRequest<any[]>(`/services/?${params.toString()}`);
    return data.map(this.mapToService);
  }

  async update(service: Service): Promise<Service> {
    const data = await this.makeRequest<any>(`/services/${service.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        is_active: service.isActive,
      }),
    });

    return this.mapToService(data);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/services/${id}/`, {
      method: 'DELETE',
    });
  }

  async findByCategory(category: string): Promise<Service[]> {
    return this.findAll({ category });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]> {
    return this.findAll({ priceRange: { min: minPrice, max: maxPrice } });
  }

  async findByProfessional(professionalId: string): Promise<Service[]> {
    return this.findAll({ professionalId });
  }

  async findActive(): Promise<Service[]> {
    return this.findAll({ isActive: true });
  }

  async search(term: string, filters?: ServiceFilters): Promise<Service[]> {
    return this.findAll({ ...filters, searchTerm: term });
  }

  async activate(id: string): Promise<Service> {
    const data = await this.makeRequest<any>(`/services/${id}/activate/`, {
      method: 'POST',
    });

    return this.mapToService(data);
  }

  async deactivate(id: string): Promise<Service> {
    const data = await this.makeRequest<any>(`/services/${id}/deactivate/`, {
      method: 'POST',
    });

    return this.mapToService(data);
  }

  async updatePrice(id: string, newPrice: number): Promise<Service> {
    const data = await this.makeRequest<any>(`/services/${id}/price/`, {
      method: 'PUT',
      body: JSON.stringify({ price: newPrice }),
    });

    return this.mapToService(data);
  }

  async updateDuration(id: string, newDuration: number): Promise<Service> {
    const data = await this.makeRequest<any>(`/services/${id}/duration/`, {
      method: 'PUT',
      body: JSON.stringify({ duration: newDuration }),
    });

    return this.mapToService(data);
  }

  async getCategories(): Promise<string[]> {
    return this.makeRequest<string[]>('/services/categories/');
  }

  async getServicesByCategory(): Promise<Record<string, Service[]>> {
    const data = await this.makeRequest<any>('/services/by-category/');
    const result: Record<string, Service[]> = {};
    
    for (const [category, services] of Object.entries(data)) {
      result[category] = (services as any[]).map(this.mapToService);
    }
    
    return result;
  }

  async getStatistics(filters?: ServiceFilters): Promise<ServiceStatistics> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.professionalId) params.append('professional_id', filters.professionalId);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<ServiceStatistics>(`/services/statistics/?${params.toString()}`);
  }

  async getUsageStatistics(startDate: Date, endDate: Date): Promise<Array<{
    service: Service;
    usageCount: number;
    revenue: number;
  }>> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    const data = await this.makeRequest<any[]>(`/services/usage-stats/?${params.toString()}`);
    
    return data.map(item => ({
      service: this.mapToService(item.service),
      usageCount: item.usage_count,
      revenue: item.revenue,
    }));
  }

  async getMostExpensive(limit: number = 10): Promise<Service[]> {
    const data = await this.makeRequest<any[]>(`/services/most-expensive/?limit=${limit}`);
    return data.map(this.mapToService);
  }

  async getMostAffordable(limit: number = 10): Promise<Service[]> {
    const data = await this.makeRequest<any[]>(`/services/most-affordable/?limit=${limit}`);
    return data.map(this.mapToService);
  }

  async getAveragePrice(category?: string): Promise<number> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const data = await this.makeRequest<{ average_price: number }>(`/services/average-price/?${params.toString()}`);
    return data.average_price;
  }

  async createBulk(services: Service[]): Promise<Service[]> {
    const data = await this.makeRequest<any[]>('/services/bulk/', {
      method: 'POST',
      body: JSON.stringify({
        services: services.map(service => ({
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          category: service.category,
          professional_id: service.professionalId,
          is_active: service.isActive,
          clinic_id: service.clinicId,
          workspace_id: service.workspaceId,
        })),
      }),
    });

    return data.map(this.mapToService);
  }

  async updateBulk(updates: Array<{ id: string; changes: Partial<Service> }>): Promise<Service[]> {
    const data = await this.makeRequest<any[]>('/services/bulk-update/', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });

    return data.map(this.mapToService);
  }

  async activateBulk(ids: string[]): Promise<void> {
    await this.makeRequest('/services/bulk-activate/', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async deactivateBulk(ids: string[]): Promise<void> {
    await this.makeRequest('/services/bulk-deactivate/', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }
}

export class DjangoCashRegisterAdapter implements CashRegisterRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/finance/django') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token') || ''}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data;
  }

  private mapToCashRegister(data: any): CashRegister {
    return new CashRegister(
      data.id,
      data.operator_id,
      data.initial_amount,
      new Date(data.opened_at),
      data.closed_at ? new Date(data.closed_at) : undefined,
      data.final_amount,
      data.actual_cash,
      data.status,
      data.notes,
      data.clinic_id,
      data.workspace_id
    );
  }

  async openRegister(register: CashRegister): Promise<CashRegister> {
    const data = await this.makeRequest<any>('/cash-register/open/', {
      method: 'POST',
      body: JSON.stringify({
        operator_id: register.operatorId,
        initial_amount: register.initialAmount,
        notes: register.notes,
        clinic_id: register.clinicId,
        workspace_id: register.workspaceId,
      }),
    });

    return this.mapToCashRegister(data);
  }

  async closeRegister(sessionId: string, closingData: {
    finalAmount: number;
    actualCash: number;
    notes?: string;
    closedBy: string;
  }): Promise<CashRegister> {
    const data = await this.makeRequest<any>(`/cash-register/${sessionId}/close/`, {
      method: 'POST',
      body: JSON.stringify({
        final_amount: closingData.finalAmount,
        actual_cash: closingData.actualCash,
        notes: closingData.notes,
        closed_by: closingData.closedBy,
      }),
    });

    return this.mapToCashRegister(data);
  }

  async create(register: CashRegister): Promise<CashRegister> {
    return this.openRegister(register);
  }

  async findById(id: string): Promise<CashRegister | null> {
    try {
      const data = await this.makeRequest<any>(`/cash-register/${id}/`);
      return this.mapToCashRegister(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findAll(filters?: CashRegisterFilters): Promise<CashRegister[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.operatorId) params.append('operator_id', filters.operatorId);
    if (filters?.startDate) params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    if (filters?.endDate) params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<any[]>(`/cash-register/?${params.toString()}`);
    return data.map(this.mapToCashRegister);
  }

  async update(register: CashRegister): Promise<CashRegister> {
    const data = await this.makeRequest<any>(`/cash-register/${register.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        notes: register.notes,
        actual_cash: register.actualCash,
      }),
    });

    return this.mapToCashRegister(data);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/cash-register/${id}/`, {
      method: 'DELETE',
    });
  }

  async getCurrentSession(operatorId?: string, clinicId?: string, workspaceId?: string): Promise<CashRegister | null> {
    const params = new URLSearchParams();
    params.append('status', 'open');
    if (operatorId) params.append('operator_id', operatorId);
    if (clinicId) params.append('clinic_id', clinicId);
    if (workspaceId) params.append('workspace_id', workspaceId);

    const sessions = await this.findAll({ status: 'open', operatorId, clinicId, workspaceId });
    return sessions.length > 0 ? sessions[0] : null;
  }

  async getSessionHistory(operatorId?: string, filters?: CashRegisterFilters): Promise<CashRegister[]> {
    return this.findAll({ ...filters, operatorId });
  }

  async getOpenSessions(filters?: CashRegisterFilters): Promise<CashRegister[]> {
    return this.findAll({ ...filters, status: 'open' });
  }

  async addIncome(sessionId: string, amount: number, method: string, reference?: string): Promise<void> {
    await this.makeRequest(`/cash-register/${sessionId}/income/`, {
      method: 'POST',
      body: JSON.stringify({ amount, method, reference }),
    });
  }

  async addExpense(sessionId: string, amount: number, concept: string, reference?: string): Promise<void> {
    await this.makeRequest(`/cash-register/${sessionId}/expense/`, {
      method: 'POST',
      body: JSON.stringify({ amount, concept, reference }),
    });
  }

  async recordTransaction(sessionId: string, transaction: {
    type: 'income' | 'expense';
    amount: number;
    method: string;
    concept?: string;
    reference?: string;
  }): Promise<void> {
    await this.makeRequest(`/cash-register/${sessionId}/transaction/`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getSessionSummary(sessionId: string): Promise<CashRegisterSummary> {
    return this.makeRequest<CashRegisterSummary>(`/cash-register/${sessionId}/summary/`);
  }

  async getDailySummary(date: Date, filters?: CashRegisterFilters): Promise<DailySummary> {
    const params = new URLSearchParams();
    params.append('date', date.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<DailySummary>(`/cash-register/daily-summary/?${params.toString()}`);
  }

  async getWeeklySummary(startDate: Date, filters?: CashRegisterFilters): Promise<DailySummary[]> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<DailySummary[]>(`/cash-register/weekly-summary/?${params.toString()}`);
  }

  async getMonthlySummary(year: number, month: number, filters?: CashRegisterFilters): Promise<DailySummary[]> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    params.append('month', month.toString());
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    return this.makeRequest<DailySummary[]>(`/cash-register/monthly-summary/?${params.toString()}`);
  }

  async calculateExpectedCash(sessionId: string): Promise<number> {
    const data = await this.makeRequest<{ expected_cash: number }>(`/cash-register/${sessionId}/expected-cash/`);
    return data.expected_cash;
  }

  async getCashDiscrepancies(filters?: CashRegisterFilters): Promise<Array<{
    sessionId: string;
    date: Date;
    expected: number;
    actual: number;
    difference: number;
    operator: string;
  }>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    if (filters?.endDate) params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    if (filters?.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters?.workspaceId) params.append('workspace_id', filters.workspaceId);

    const data = await this.makeRequest<any[]>(`/cash-register/discrepancies/?${params.toString()}`);
    
    return data.map(item => ({
      sessionId: item.session_id,
      date: new Date(item.date),
      expected: item.expected,
      actual: item.actual,
      difference: item.difference,
      operator: item.operator,
    }));
  }

  async getAuditTrail(sessionId: string): Promise<Array<{
    timestamp: Date;
    action: string;
    amount?: number;
    method?: string;
    reference?: string;
    operator: string;
  }>> {
    const data = await this.makeRequest<any[]>(`/cash-register/${sessionId}/audit-trail/`);
    
    return data.map(item => ({
      timestamp: new Date(item.timestamp),
      action: item.action,
      amount: item.amount,
      method: item.method,
      reference: item.reference,
      operator: item.operator,
    }));
  }

  async validateSession(sessionId: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    return this.makeRequest<{
      isValid: boolean;
      issues: string[];
      warnings: string[];
    }>(`/cash-register/${sessionId}/validate/`);
  }
}