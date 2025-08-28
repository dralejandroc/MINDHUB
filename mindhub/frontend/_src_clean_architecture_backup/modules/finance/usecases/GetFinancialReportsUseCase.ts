/**
 * Get Financial Reports Use Case
 * Application business rules for financial reporting and analytics
 */

import { Income } from '../entities/Income';
import { Service } from '../entities/Service';
import { IncomeRepository } from '../repositories/IncomeRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';

export interface FinancialReportRequest {
  startDate: Date;
  endDate: Date;
  clinicId?: string;
  workspaceId?: string;
  professionalIds?: string[];
  includeRefunds?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
  currency?: string;
}

export interface FinancialSummary {
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  totals: {
    grossIncome: number;
    netIncome: number;
    refunds: number;
    transactionCount: number;
    averageTransaction: number;
  };
  breakdown: {
    bySource: Array<{
      source: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    byPaymentMethod: Array<{
      method: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    byProfessional: Array<{
      professionalId: string;
      professionalName: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    byService: Array<{
      serviceId: string;
      serviceName: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };
  trends: {
    daily: Array<{
      date: Date;
      income: number;
      transactions: number;
      growth: number; // percentage change from previous period
    }>;
    periodic: Array<{
      period: string;
      income: number;
      transactions: number;
      growth: number;
    }>;
  };
  performance: {
    topServices: Array<{
      service: Service;
      revenue: number;
      sessions: number;
      averagePrice: number;
    }>;
    topProfessionals: Array<{
      professionalId: string;
      name: string;
      revenue: number;
      sessions: number;
      averageRevenue: number;
    }>;
  };
  insights: {
    peakDays: string[];
    peakHours: number[];
    preferredPaymentMethods: string[];
    averageSessionValue: number;
    revenueGrowth: number;
    warnings: string[];
    recommendations: string[];
  };
}

export class GetFinancialReportsUseCase {
  constructor(
    private incomeRepository: IncomeRepository,
    private serviceRepository: ServiceRepository
  ) {}

  async execute(request: FinancialReportRequest): Promise<FinancialSummary> {
    // Business rule: Validate request parameters
    this.validateRequest(request);

    // Business rule: Get income data for period
    const incomes = await this.getIncomeData(request);
    
    // Business rule: Get services data for context
    const services = await this.getServicesData(request);

    // Business rule: Calculate financial summary
    const summary = this.calculateFinancialSummary(request, incomes, services);

    // Business rule: Generate insights and recommendations
    const insights = this.generateInsights(incomes, summary);

    // Business rule: Add performance metrics
    const performance = this.calculatePerformanceMetrics(incomes, services);

    return {
      ...summary,
      performance,
      insights
    };
  }

  /**
   * Business rule: Validate report request parameters
   */
  private validateRequest(request: FinancialReportRequest): void {
    if (request.startDate >= request.endDate) {
      throw new Error('Start date must be before end date');
    }

    const maxPeriodDays = 365; // Maximum 1 year period
    const periodDays = (request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (periodDays > maxPeriodDays) {
      throw new Error(`Report period cannot exceed ${maxPeriodDays} days`);
    }

    // Business rule: Must specify either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Must specify either clinic ID or workspace ID');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Cannot specify both clinic ID and workspace ID');
    }
  }

  /**
   * Business rule: Get filtered income data
   */
  private async getIncomeData(request: FinancialReportRequest): Promise<Income[]> {
    const filters = {
      startDate: request.startDate,
      endDate: request.endDate,
      clinicId: request.clinicId,
      workspaceId: request.workspaceId,
      professionalIds: request.professionalIds,
      status: ['confirmed'] as const,
      includeRefunds: request.includeRefunds || false
    };

    return await this.incomeRepository.findByDateRange(filters);
  }

  /**
   * Business rule: Get services data for context
   */
  private async getServicesData(request: FinancialReportRequest): Promise<Service[]> {
    const filters = {
      clinicId: request.clinicId,
      workspaceId: request.workspaceId,
      isActive: true
    };

    return await this.serviceRepository.findAll(filters);
  }

  /**
   * Business rule: Calculate comprehensive financial summary
   */
  private calculateFinancialSummary(
    request: FinancialReportRequest,
    incomes: Income[],
    services: Service[]
  ): Omit<FinancialSummary, 'performance' | 'insights'> {
    // Calculate totals
    const grossIncome = incomes
      .filter(i => !i.isRefund())
      .reduce((sum, i) => sum + i.amount, 0);

    const refunds = incomes
      .filter(i => i.isRefund())
      .reduce((sum, i) => sum + Math.abs(i.amount), 0);

    const netIncome = grossIncome - refunds;
    const transactionCount = incomes.filter(i => !i.isRefund()).length;
    const averageTransaction = transactionCount > 0 ? grossIncome / transactionCount : 0;

    // Calculate breakdowns
    const breakdown = {
      bySource: this.calculateSourceBreakdown(incomes, grossIncome),
      byPaymentMethod: this.calculatePaymentMethodBreakdown(incomes, grossIncome),
      byProfessional: this.calculateProfessionalBreakdown(incomes, grossIncome),
      byService: this.calculateServiceBreakdown(incomes, services, grossIncome)
    };

    // Calculate trends
    const trends = {
      daily: this.calculateDailyTrends(incomes, request.startDate, request.endDate),
      periodic: this.calculatePeriodicTrends(incomes, request.groupBy || 'week')
    };

    return {
      period: {
        from: request.startDate,
        to: request.endDate,
        label: this.formatPeriodLabel(request.startDate, request.endDate)
      },
      totals: {
        grossIncome,
        netIncome,
        refunds,
        transactionCount,
        averageTransaction
      },
      breakdown,
      trends
    };
  }

  /**
   * Business logic: Calculate income breakdown by source
   */
  private calculateSourceBreakdown(incomes: Income[], totalIncome: number): Array<{
    source: string;
    amount: number;
    count: number;
    percentage: number;
  }> {
    const sourceMap = new Map<string, { amount: number; count: number }>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const existing = sourceMap.get(income.source) || { amount: 0, count: 0 };
        existing.amount += income.amount;
        existing.count += 1;
        sourceMap.set(income.source, existing);
      });

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Business logic: Calculate income breakdown by payment method
   */
  private calculatePaymentMethodBreakdown(incomes: Income[], totalIncome: number): Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }> {
    const methodMap = new Map<string, { amount: number; count: number }>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const existing = methodMap.get(income.paymentMethod) || { amount: 0, count: 0 };
        existing.amount += income.amount;
        existing.count += 1;
        methodMap.set(income.paymentMethod, existing);
      });

    return Array.from(methodMap.entries())
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Business logic: Calculate income breakdown by professional
   */
  private calculateProfessionalBreakdown(incomes: Income[], totalIncome: number): Array<{
    professionalId: string;
    professionalName: string;
    amount: number;
    count: number;
    percentage: number;
  }> {
    const professionalMap = new Map<string, { name: string; amount: number; count: number }>();

    incomes
      .filter(i => !i.isRefund() && i.professional)
      .forEach(income => {
        const profId = income.professional!.id;
        const existing = professionalMap.get(profId) || { 
          name: income.professional!.name, 
          amount: 0, 
          count: 0 
        };
        existing.amount += income.amount;
        existing.count += 1;
        professionalMap.set(profId, existing);
      });

    return Array.from(professionalMap.entries())
      .map(([professionalId, data]) => ({
        professionalId,
        professionalName: data.name,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Business logic: Calculate income breakdown by service
   */
  private calculateServiceBreakdown(
    incomes: Income[], 
    services: Service[], 
    totalIncome: number
  ): Array<{
    serviceId: string;
    serviceName: string;
    amount: number;
    count: number;
    percentage: number;
  }> {
    // This would require linking incomes to services
    // For now, return breakdown by source as proxy
    const sourceToService = new Map<string, string>();
    services.forEach(service => {
      sourceToService.set(service.serviceType, service.name);
    });

    const serviceMap = new Map<string, { name: string; amount: number; count: number }>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const serviceName = sourceToService.get(income.source) || income.getReportingCategory();
        const serviceId = income.source;
        const existing = serviceMap.get(serviceId) || { 
          name: serviceName, 
          amount: 0, 
          count: 0 
        };
        existing.amount += income.amount;
        existing.count += 1;
        serviceMap.set(serviceId, existing);
      });

    return Array.from(serviceMap.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        serviceName: data.name,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Business logic: Calculate daily income trends
   */
  private calculateDailyTrends(incomes: Income[], startDate: Date, endDate: Date): Array<{
    date: Date;
    income: number;
    transactions: number;
    growth: number;
  }> {
    const dailyMap = new Map<string, { income: number; transactions: number }>();

    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateKey, { income: 0, transactions: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const dateKey = income.receivedDate.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey);
        if (existing) {
          existing.income += income.amount;
          existing.transactions += 1;
        }
      });

    // Calculate growth rates
    const trends: Array<{
      date: Date;
      income: number;
      transactions: number;
      growth: number;
    }> = [];

    let previousIncome = 0;
    for (const [dateKey, data] of dailyMap) {
      const growth = previousIncome > 0 ? 
        ((data.income - previousIncome) / previousIncome) * 100 : 0;

      trends.push({
        date: new Date(dateKey),
        income: data.income,
        transactions: data.transactions,
        growth
      });

      previousIncome = data.income;
    }

    return trends;
  }

  /**
   * Business logic: Calculate periodic trends (weekly/monthly)
   */
  private calculatePeriodicTrends(
    incomes: Income[], 
    groupBy: 'day' | 'week' | 'month' | 'quarter'
  ): Array<{
    period: string;
    income: number;
    transactions: number;
    growth: number;
  }> {
    const periodMap = new Map<string, { income: number; transactions: number }>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const periodKey = this.getPeriodKey(income.receivedDate, groupBy);
        const existing = periodMap.get(periodKey) || { income: 0, transactions: 0 };
        existing.income += income.amount;
        existing.transactions += 1;
        periodMap.set(periodKey, existing);
      });

    const trends: Array<{
      period: string;
      income: number;
      transactions: number;
      growth: number;
    }> = [];

    let previousIncome = 0;
    for (const [period, data] of Array.from(periodMap.entries()).sort()) {
      const growth = previousIncome > 0 ? 
        ((data.income - previousIncome) / previousIncome) * 100 : 0;

      trends.push({
        period,
        income: data.income,
        transactions: data.transactions,
        growth
      });

      previousIncome = data.income;
    }

    return trends;
  }

  /**
   * Business logic: Calculate performance metrics
   */
  private calculatePerformanceMetrics(incomes: Income[], services: Service[]): FinancialSummary['performance'] {
    // Calculate top services by revenue
    const serviceRevenue = new Map<string, { revenue: number; sessions: number }>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const serviceKey = income.source;
        const existing = serviceRevenue.get(serviceKey) || { revenue: 0, sessions: 0 };
        existing.revenue += income.amount;
        existing.sessions += 1;
        serviceRevenue.set(serviceKey, existing);
      });

    const topServices = Array.from(serviceRevenue.entries())
      .map(([serviceType, data]) => {
        const service = services.find(s => s.serviceType === serviceType);
        return {
          service: service || {
            id: serviceType,
            name: serviceType,
            serviceType,
            basePrice: data.revenue / data.sessions
          } as Service,
          revenue: data.revenue,
          sessions: data.sessions,
          averagePrice: data.sessions > 0 ? data.revenue / data.sessions : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate top professionals
    const professionalRevenue = new Map<string, { name: string; revenue: number; sessions: number }>();

    incomes
      .filter(i => !i.isRefund() && i.professional)
      .forEach(income => {
        const profId = income.professional!.id;
        const existing = professionalRevenue.get(profId) || { 
          name: income.professional!.name, 
          revenue: 0, 
          sessions: 0 
        };
        existing.revenue += income.amount;
        existing.sessions += 1;
        professionalRevenue.set(profId, existing);
      });

    const topProfessionals = Array.from(professionalRevenue.entries())
      .map(([professionalId, data]) => ({
        professionalId,
        name: data.name,
        revenue: data.revenue,
        sessions: data.sessions,
        averageRevenue: data.sessions > 0 ? data.revenue / data.sessions : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      topServices,
      topProfessionals
    };
  }

  /**
   * Business logic: Generate insights and recommendations
   */
  private generateInsights(incomes: Income[], summary: Omit<FinancialSummary, 'performance' | 'insights'>): FinancialSummary['insights'] {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze payment methods
    const cashPayments = summary.breakdown.byPaymentMethod.find(p => p.method === 'cash');
    const cashPercentage = cashPayments?.percentage || 0;

    if (cashPercentage > 70) {
      warnings.push('Alto porcentaje de pagos en efectivo (>70%)');
      recommendations.push('Considerar promover pagos electrónicos para mejor control');
    }

    // Analyze growth trends
    const recentTrends = summary.trends.daily.slice(-7); // Last 7 days
    const averageGrowth = recentTrends.reduce((sum, t) => sum + t.growth, 0) / recentTrends.length;

    if (averageGrowth < -10) {
      warnings.push('Tendencia de ingresos descendente en los últimos 7 días');
      recommendations.push('Revisar estrategias de captación de pacientes');
    }

    // Peak analysis
    const hourMap = new Map<number, number>();
    const dayMap = new Map<string, number>();

    incomes
      .filter(i => !i.isRefund())
      .forEach(income => {
        const hour = income.receivedDate.getHours();
        const day = income.receivedDate.toLocaleDateString('es-ES', { weekday: 'long' });
        
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });

    const peakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const peakDays = Array.from(dayMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    // Preferred payment methods
    const preferredPaymentMethods = summary.breakdown.byPaymentMethod
      .slice(0, 3)
      .map(p => p.method);

    // Calculate average session value
    const averageSessionValue = summary.totals.averageTransaction;

    return {
      peakDays,
      peakHours,
      preferredPaymentMethods,
      averageSessionValue,
      revenueGrowth: averageGrowth,
      warnings,
      recommendations
    };
  }

  // Helper methods
  private formatPeriodLabel(startDate: Date, endDate: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return `${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', options)}`;
  }

  private getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month' | 'quarter'): string {
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}