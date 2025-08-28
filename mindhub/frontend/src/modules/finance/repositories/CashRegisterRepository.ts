/**
 * Cash Register Repository Interface
 * Abstraction for cash register operations
 */

import { CashRegister } from '../entities/CashRegister';

export interface CashRegisterFilters {
  status?: 'open' | 'closed';
  operatorId?: string;
  startDate?: Date;
  endDate?: Date;
  clinicId?: string;
  workspaceId?: string;
}

export interface CashRegisterSummary {
  sessionId: string;
  openedAt: Date;
  closedAt?: Date;
  operator: {
    id: string;
    name: string;
  };
  summary: {
    initialAmount: number;
    totalIncome: number;
    totalExpenses: number;
    expectedCash: number;
    actualCash: number;
    difference: number;
    transactionCount: number;
  };
  paymentMethods: Record<string, number>;
}

export interface DailySummary {
  date: Date;
  totalSessions: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  cashDiscrepancies: number;
  operators: string[];
}

export interface CashRegisterRepository {
  // Session management
  openRegister(register: CashRegister): Promise<CashRegister>;
  closeRegister(sessionId: string, closingData: {
    finalAmount: number;
    actualCash: number;
    notes?: string;
    closedBy: string;
  }): Promise<CashRegister>;
  
  // Basic CRUD
  create(register: CashRegister): Promise<CashRegister>;
  findById(id: string): Promise<CashRegister | null>;
  findAll(filters?: CashRegisterFilters): Promise<CashRegister[]>;
  update(register: CashRegister): Promise<CashRegister>;
  delete(id: string): Promise<void>;
  
  // Session queries
  getCurrentSession(operatorId?: string, clinicId?: string, workspaceId?: string): Promise<CashRegister | null>;
  getSessionHistory(operatorId?: string, filters?: CashRegisterFilters): Promise<CashRegister[]>;
  getOpenSessions(filters?: CashRegisterFilters): Promise<CashRegister[]>;
  
  // Transaction management
  addIncome(sessionId: string, amount: number, method: string, reference?: string): Promise<void>;
  addExpense(sessionId: string, amount: number, concept: string, reference?: string): Promise<void>;
  recordTransaction(sessionId: string, transaction: {
    type: 'income' | 'expense';
    amount: number;
    method: string;
    concept?: string;
    reference?: string;
  }): Promise<void>;
  
  // Reports and summaries
  getSessionSummary(sessionId: string): Promise<CashRegisterSummary>;
  getDailySummary(date: Date, filters?: CashRegisterFilters): Promise<DailySummary>;
  getWeeklySummary(startDate: Date, filters?: CashRegisterFilters): Promise<DailySummary[]>;
  getMonthlySummary(year: number, month: number, filters?: CashRegisterFilters): Promise<DailySummary[]>;
  
  // Cash flow
  calculateExpectedCash(sessionId: string): Promise<number>;
  getCashDiscrepancies(filters?: CashRegisterFilters): Promise<Array<{
    sessionId: string;
    date: Date;
    expected: number;
    actual: number;
    difference: number;
    operator: string;
  }>>;
  
  // Auditing
  getAuditTrail(sessionId: string): Promise<Array<{
    timestamp: Date;
    action: string;
    amount?: number;
    method?: string;
    reference?: string;
    operator: string;
  }>>;
  
  // Validation
  validateSession(sessionId: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }>;
}