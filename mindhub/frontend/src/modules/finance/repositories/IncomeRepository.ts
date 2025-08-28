/**
 * Income Repository Interface
 * Abstraction for income data access operations
 */

import { Income } from '../entities/Income';

export interface IncomeStatistics {
  totalIncome: number;
  totalCount: number;
  averageIncome: number;
  byPaymentMethod: Record<string, number>;
  byService: Record<string, number>;
  byPeriod: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

export interface IncomeFilters {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  serviceId?: string;
  patientId?: string;
  professionalId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  clinicId?: string;
  workspaceId?: string;
}

export interface IncomeRepository {
  // Basic CRUD
  create(income: Income): Promise<Income>;
  findById(id: string): Promise<Income | null>;
  findAll(filters?: IncomeFilters): Promise<Income[]>;
  update(income: Income): Promise<Income>;
  delete(id: string): Promise<void>;
  
  // Specialized queries
  findByPatient(patientId: string, filters?: IncomeFilters): Promise<Income[]>;
  findByProfessional(professionalId: string, filters?: IncomeFilters): Promise<Income[]>;
  findByDateRange(startDate: Date, endDate: Date, filters?: IncomeFilters): Promise<Income[]>;
  findByPaymentMethod(method: string, filters?: IncomeFilters): Promise<Income[]>;
  findPending(filters?: IncomeFilters): Promise<Income[]>;
  
  // Statistics
  getStatistics(filters?: IncomeFilters): Promise<IncomeStatistics>;
  getDailyTotal(date: Date, filters?: IncomeFilters): Promise<number>;
  getMonthlyTotal(year: number, month: number, filters?: IncomeFilters): Promise<number>;
  getYearlyTotal(year: number, filters?: IncomeFilters): Promise<number>;
  
  // Bulk operations
  createBulk(incomes: Income[]): Promise<Income[]>;
  updateStatus(ids: string[], status: string): Promise<void>;
  
  // Refunds and adjustments
  processRefund(incomeId: string, amount: number, reason: string): Promise<Income>;
  applyDiscount(incomeId: string, discountAmount: number, reason: string): Promise<Income>;
  
  // Reports
  getIncomeByService(startDate: Date, endDate: Date): Promise<Record<string, number>>;
  getIncomeByProfessional(startDate: Date, endDate: Date): Promise<Record<string, number>>;
  getPaymentMethodDistribution(filters?: IncomeFilters): Promise<Record<string, number>>;
}