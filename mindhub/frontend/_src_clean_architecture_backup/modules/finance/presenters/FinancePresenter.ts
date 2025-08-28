/**
 * Finance Presenter
 * Transforms finance entities into view models for React components
 */

import { Income } from '../entities/Income';
import { Service } from '../entities/Service';
import { CashRegister } from '../entities/CashRegister';
import { IncomeStatistics } from '../repositories/IncomeRepository';
import { ServiceStatistics } from '../repositories/ServiceRepository';

// View Models
export interface IncomeListItemViewModel {
  id: string;
  patientName: string;
  serviceName: string;
  amount: string;
  formattedAmount: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  date: string;
  formattedDate: string;
  status: string;
  statusBadge: {
    color: string;
    label: string;
  };
  concept: string;
}

export interface IncomeDetailsViewModel extends IncomeListItemViewModel {
  professionalName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  canRefund: boolean;
  canEdit: boolean;
  transactionHistory: Array<{
    action: string;
    date: string;
    amount?: string;
    reason?: string;
  }>;
}

export interface ServiceListItemViewModel {
  id: string;
  name: string;
  description: string;
  price: string;
  formattedPrice: string;
  duration: string;
  formattedDuration: string;
  category: string;
  categoryLabel: string;
  isActive: boolean;
  statusBadge: {
    color: string;
    label: string;
  };
  usageCount?: number;
}

export interface ServiceDetailsViewModel extends ServiceListItemViewModel {
  professionalName: string;
  createdAt: string;
  updatedAt: string;
  priceHistory: Array<{
    price: string;
    date: string;
    changedBy: string;
  }>;
  usageStatistics: {
    totalUsage: number;
    monthlyUsage: number;
    totalRevenue: string;
    monthlyRevenue: string;
  };
}

export interface CashRegisterViewModel {
  id: string;
  operatorName: string;
  status: string;
  statusBadge: {
    color: string;
    label: string;
  };
  openedAt: string;
  closedAt?: string;
  duration: string;
  initialAmount: string;
  formattedInitialAmount: string;
  finalAmount?: string;
  formattedFinalAmount?: string;
  actualCash?: string;
  formattedActualCash?: string;
  difference?: string;
  formattedDifference?: string;
  differenceColor: string;
  transactionCount: number;
  totalIncome: string;
  totalExpenses: string;
  netAmount: string;
}

export interface FinancialSummaryViewModel {
  period: string;
  totalIncome: string;
  formattedTotalIncome: string;
  totalExpenses: string;
  formattedTotalExpenses: string;
  netIncome: string;
  formattedNetIncome: string;
  transactionCount: number;
  averageTransaction: string;
  formattedAverageTransaction: string;
  growthRate: number;
  growthRateFormatted: string;
  topServices: Array<{
    name: string;
    revenue: string;
    count: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: string;
    percentage: number;
  }>;
}

export class FinancePresenter {
  
  // Income presentations
  presentIncomeForList(income: Income): IncomeListItemViewModel {
    return {
      id: income.id,
      patientName: 'Paciente', // Would be resolved from patient service
      serviceName: 'Servicio', // Would be resolved from service
      amount: income.amount.toString(),
      formattedAmount: this.formatCurrency(income.amount),
      paymentMethod: income.paymentMethod,
      paymentMethodLabel: this.getPaymentMethodLabel(income.paymentMethod),
      date: income.date.toISOString().split('T')[0],
      formattedDate: this.formatDate(income.date),
      status: income.status,
      statusBadge: this.getIncomeStatusBadge(income.status),
      concept: income.concept,
    };
  }

  presentIncomeForDetails(income: Income): IncomeDetailsViewModel {
    const base = this.presentIncomeForList(income);
    
    return {
      ...base,
      professionalName: 'Profesional', // Would be resolved from professional service
      notes: income.notes || '',
      createdAt: this.formatDateTime(income.date),
      updatedAt: this.formatDateTime(income.date),
      canRefund: income.canBeRefunded(),
      canEdit: income.canBeModified(),
      transactionHistory: [], // Would be populated from transaction history
    };
  }

  presentIncomeList(incomes: Income[]): IncomeListItemViewModel[] {
    return incomes.map(income => this.presentIncomeForList(income));
  }

  // Service presentations
  presentServiceForList(service: Service): ServiceListItemViewModel {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      formattedPrice: this.formatCurrency(service.price),
      duration: service.duration.toString(),
      formattedDuration: this.formatDuration(service.duration),
      category: service.category,
      categoryLabel: this.getCategoryLabel(service.category),
      isActive: service.isActive,
      statusBadge: this.getServiceStatusBadge(service.isActive),
    };
  }

  presentServiceForDetails(service: Service): ServiceDetailsViewModel {
    const base = this.presentServiceForList(service);
    
    return {
      ...base,
      professionalName: 'Profesional', // Would be resolved from professional service
      createdAt: this.formatDateTime(new Date()), // Would come from entity
      updatedAt: this.formatDateTime(new Date()), // Would come from entity
      priceHistory: [], // Would be populated from price history
      usageStatistics: {
        totalUsage: 0,
        monthlyUsage: 0,
        totalRevenue: '$0',
        monthlyRevenue: '$0',
      },
    };
  }

  presentServiceList(services: Service[]): ServiceListItemViewModel[] {
    return services.map(service => this.presentServiceForList(service));
  }

  // Cash Register presentations
  presentCashRegister(register: CashRegister): CashRegisterViewModel {
    const difference = register.actualCash !== undefined && register.finalAmount !== undefined 
      ? register.actualCash - register.finalAmount 
      : 0;

    return {
      id: register.id,
      operatorName: 'Operador', // Would be resolved from user service
      status: register.status,
      statusBadge: this.getCashRegisterStatusBadge(register.status),
      openedAt: this.formatDateTime(register.openedAt),
      closedAt: register.closedAt ? this.formatDateTime(register.closedAt) : undefined,
      duration: this.calculateDuration(register.openedAt, register.closedAt),
      initialAmount: register.initialAmount.toString(),
      formattedInitialAmount: this.formatCurrency(register.initialAmount),
      finalAmount: register.finalAmount?.toString(),
      formattedFinalAmount: register.finalAmount ? this.formatCurrency(register.finalAmount) : undefined,
      actualCash: register.actualCash?.toString(),
      formattedActualCash: register.actualCash ? this.formatCurrency(register.actualCash) : undefined,
      difference: difference.toString(),
      formattedDifference: this.formatCurrency(Math.abs(difference)),
      differenceColor: difference >= 0 ? 'text-green-600' : 'text-red-600',
      transactionCount: 0, // Would be calculated from transactions
      totalIncome: '$0', // Would be calculated
      totalExpenses: '$0', // Would be calculated
      netAmount: '$0', // Would be calculated
    };
  }

  presentCashRegisterList(registers: CashRegister[]): CashRegisterViewModel[] {
    return registers.map(register => this.presentCashRegister(register));
  }

  // Statistics presentations
  presentIncomeStatistics(stats: IncomeStatistics): FinancialSummaryViewModel {
    return {
      period: 'Período actual',
      totalIncome: stats.totalIncome.toString(),
      formattedTotalIncome: this.formatCurrency(stats.totalIncome),
      totalExpenses: '0', // Would be calculated from expenses
      formattedTotalExpenses: '$0',
      netIncome: stats.totalIncome.toString(),
      formattedNetIncome: this.formatCurrency(stats.totalIncome),
      transactionCount: stats.totalCount,
      averageTransaction: stats.averageIncome.toString(),
      formattedAverageTransaction: this.formatCurrency(stats.averageIncome),
      growthRate: 0, // Would be calculated from period comparison
      growthRateFormatted: '0%',
      topServices: Object.entries(stats.byService).map(([service, amount]) => ({
        name: service,
        revenue: this.formatCurrency(amount),
        count: 0, // Would be calculated
      })),
      paymentMethods: Object.entries(stats.byPaymentMethod).map(([method, amount]) => ({
        method: this.getPaymentMethodLabel(method),
        amount: this.formatCurrency(amount),
        percentage: Math.round((amount / stats.totalIncome) * 100),
      })),
    };
  }

  presentServiceStatistics(stats: ServiceStatistics): {
    totalServices: number;
    activeServices: number;
    averagePrice: string;
    priceRange: string;
    categories: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    mostUsed: Array<{
      name: string;
      usageCount: number;
      revenue: string;
    }>;
  } {
    return {
      totalServices: stats.totalServices,
      activeServices: stats.activeServices,
      averagePrice: this.formatCurrency(stats.averagePrice),
      priceRange: `${this.formatCurrency(stats.priceRange.min)} - ${this.formatCurrency(stats.priceRange.max)}`,
      categories: Object.entries(stats.byCategory).map(([category, count]) => ({
        name: this.getCategoryLabel(category),
        count,
        percentage: Math.round((count / stats.totalServices) * 100),
      })),
      mostUsed: stats.mostUsed.map(item => ({
        name: item.service.name,
        usageCount: item.usageCount,
        revenue: this.formatCurrency(0), // Would be calculated
      })),
    };
  }

  // Utility methods
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  }

  private calculateDuration(start: Date, end?: Date): string {
    const endTime = end || new Date();
    const diffMs = endTime.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`;
    }
    return `${diffMinutes}min`;
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash': 'Efectivo',
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'transfer': 'Transferencia',
      'check': 'Cheque',
      'other': 'Otro',
    };
    return labels[method] || method;
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'consultation': 'Consulta',
      'therapy': 'Terapia',
      'evaluation': 'Evaluación',
      'procedure': 'Procedimiento',
      'laboratory': 'Laboratorio',
      'other': 'Otro',
    };
    return labels[category] || category;
  }

  private getIncomeStatusBadge(status: string): { color: string; label: string } {
    const badges: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'paid': { color: 'bg-green-100 text-green-800', label: 'Pagado' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
      'refunded': { color: 'bg-purple-100 text-purple-800', label: 'Reembolsado' },
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  }

  private getServiceStatusBadge(isActive: boolean): { color: string; label: string } {
    return isActive
      ? { color: 'bg-green-100 text-green-800', label: 'Activo' }
      : { color: 'bg-red-100 text-red-800', label: 'Inactivo' };
  }

  private getCashRegisterStatusBadge(status: string): { color: string; label: string } {
    const badges: Record<string, { color: string; label: string }> = {
      'open': { color: 'bg-green-100 text-green-800', label: 'Abierto' },
      'closed': { color: 'bg-gray-100 text-gray-800', label: 'Cerrado' },
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  }
}