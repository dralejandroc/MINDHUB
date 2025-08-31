/**
 * Finance GraphQL Service - MindHub Finance Module
 * 100% GraphQL implementation for financial operations
 */

import { client } from './apollo/client'
import { 
  GET_FINANCE_SERVICES, 
  GET_ACTIVE_FINANCE_SERVICES, 
  GET_FINANCE_SERVICES_STATS 
} from './apollo/queries/finance/services'
import { 
  GET_FINANCE_INCOME, 
  GET_TODAY_FINANCE_INCOME, 
  GET_FINANCE_INCOME_STATS,
  GET_PENDING_FINANCE_INCOME 
} from './apollo/queries/finance/income'
import { 
  GET_CASH_REGISTER_CUTS, 
  GET_LATEST_CASH_REGISTER_CUT, 
  GET_TODAY_CASH_STATS 
} from './apollo/queries/finance/cash-register'
// Note: Using 'any' types for now until GraphQL types are properly generated

export interface FinanceStats {
  totalRevenue: number
  totalServices: number
  activeServices: number
  todayIncome: number
  pendingPayments: number
  cashOnHand: number
  weeklyRevenue: number
  monthlyGrowth: number
}

export interface ServiceSummary {
  id: string
  name: string
  price: number
  category: string
  isActive: boolean
  totalEarned: number
  timesUsed: number
}

export interface IncomeSummary {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  serviceName: string
  status: string
  patientId?: string
}

export interface CashRegisterSummary {
  id: string
  cutDate: string
  openingAmount: number
  closingAmount: number
  totalIncome: number
  totalCash: number
  totalCard: number
  totalTransfers: number
  status: string
}

class FinanceGraphQLService {
  private static instance: FinanceGraphQLService
  private cachedStats: FinanceStats | null = null
  private lastFetch: number = 0
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  static getInstance(): FinanceGraphQLService {
    if (!FinanceGraphQLService.instance) {
      FinanceGraphQLService.instance = new FinanceGraphQLService()
    }
    return FinanceGraphQLService.instance
  }

  /**
   * Get financial dashboard data
   */
  async getFinanceStats(clinicId?: string, workspaceId?: string): Promise<FinanceStats> {
    const now = Date.now()
    if (this.cachedStats && (now - this.lastFetch) < this.cacheTimeout) {
      console.log('✅ [Finance GraphQL] Returning cached stats')
      return this.cachedStats
    }

    try {
      console.log('🚀 [Finance GraphQL] Fetching finance stats via GraphQL')
      
      const today = new Date().toISOString().split('T')[0]
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [servicesResult, incomeResult, todayIncomeResult, cashResult] = await Promise.all([
        this.getServices(clinicId, workspaceId),
        this.getIncomeByDateRange(oneWeekAgo, today, clinicId, workspaceId),
        this.getTodayIncome(today, clinicId),
        this.getLatestCashCut(clinicId, workspaceId)
      ])

      // Calculate stats
      const totalServices = servicesResult.length
      const activeServices = servicesResult.filter(s => s.isActive).length
      const weeklyRevenue = incomeResult.reduce((sum, income) => sum + income.amount, 0)
      const todayIncome = todayIncomeResult.reduce((sum, income) => sum + income.amount, 0)
      const cashOnHand = cashResult?.closingAmount || 0

      // Calculate pending payments
      const pendingPayments = await this.getPendingPaymentsTotal(clinicId)

      const stats: FinanceStats = {
        totalRevenue: weeklyRevenue,
        totalServices,
        activeServices,
        todayIncome,
        pendingPayments,
        cashOnHand,
        weeklyRevenue,
        monthlyGrowth: 0 // TODO: Implement month-over-month comparison
      }

      this.cachedStats = stats
      this.lastFetch = now

      console.log('📊 [Finance GraphQL] Stats calculated:', stats)
      return stats

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching stats:', error)
      return {
        totalRevenue: 0,
        totalServices: 0,
        activeServices: 0,
        todayIncome: 0,
        pendingPayments: 0,
        cashOnHand: 0,
        weeklyRevenue: 0,
        monthlyGrowth: 0
      }
    }
  }

  /**
   * Get all services for clinic/workspace
   */
  async getServices(clinicId?: string, workspaceId?: string): Promise<ServiceSummary[]> {
    try {
      const result = await client.query({
        query: GET_FINANCE_SERVICES,
        variables: {
          filter: {
            and: [
              clinicId ? { clinic_id: { eq: clinicId } } : {},
              workspaceId ? { workspace_id: { eq: workspaceId } } : {}
            ]
          },
          orderBy: [{ name: 'AscNullsFirst' }]
        },
        fetchPolicy: 'network-only'
      })

      return result.data?.finance_servicesCollection?.edges?.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        price: parseFloat(edge.node.price || '0'),
        category: edge.node.category || 'General',
        isActive: edge.node.is_active || false,
        totalEarned: 0, // TODO: Calculate from income records
        timesUsed: 0    // TODO: Calculate from income records
      })) || []

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching services:', error)
      return []
    }
  }

  /**
   * Get income records by date range
   */
  async getIncomeByDateRange(startDate: string, endDate: string, clinicId?: string, workspaceId?: string): Promise<IncomeSummary[]> {
    try {
      const result = await client.query({
        query: GET_FINANCE_INCOME,
        variables: {
          filter: {
            and: [
              { payment_date: { gte: startDate } },
              { payment_date: { lte: endDate } },
              clinicId ? { clinic_id: { eq: clinicId } } : {},
              workspaceId ? { workspace_id: { eq: workspaceId } } : {}
            ]
          },
          orderBy: [{ payment_date: 'DescNullsLast' }]
        },
        fetchPolicy: 'network-only'
      })

      return result.data?.finance_incomeCollection?.edges?.map((edge: any) => ({
        id: edge.node.id,
        amount: parseFloat(edge.node.amount || '0'),
        paymentMethod: edge.node.payment_method || 'cash',
        paymentDate: edge.node.payment_date || edge.node.created_at,
        serviceName: edge.node.finance_services?.name || 'Servicio general',
        status: edge.node.status || 'completed',
        patientId: edge.node.patient_id || undefined
      })) || []

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching income:', error)
      return []
    }
  }

  /**
   * Get today's income
   */
  async getTodayIncome(date: string, clinicId?: string): Promise<IncomeSummary[]> {
    try {
      const result = await client.query({
        query: GET_TODAY_FINANCE_INCOME,
        variables: { date, clinicId },
        fetchPolicy: 'network-only'
      })

      return result.data?.finance_incomeCollection?.edges?.map((edge: any) => ({
        id: edge.node.id,
        amount: parseFloat(edge.node.amount || '0'),
        paymentMethod: edge.node.payment_method || 'cash',
        paymentDate: edge.node.payment_date || edge.node.created_at,
        serviceName: edge.node.finance_services?.name || 'Servicio general',
        status: edge.node.status || 'completed'
      })) || []

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching today income:', error)
      return []
    }
  }

  /**
   * Get latest cash register cut
   */
  async getLatestCashCut(clinicId?: string, workspaceId?: string): Promise<CashRegisterSummary | null> {
    try {
      const result = await client.query({
        query: GET_LATEST_CASH_REGISTER_CUT,
        variables: { clinicId, workspaceId },
        fetchPolicy: 'network-only'
      })

      const cut = result.data?.finance_cash_register_cutsCollection?.edges?.[0]?.node
      if (!cut) return null

      return {
        id: cut.id,
        cutDate: cut.cut_date,
        openingAmount: parseFloat(cut.opening_amount || '0'),
        closingAmount: parseFloat(cut.closing_amount || '0'),
        totalIncome: parseFloat(cut.total_income || '0'),
        totalCash: parseFloat(cut.total_cash_payments || '0'),
        totalCard: parseFloat(cut.total_card_payments || '0'),
        totalTransfers: parseFloat(cut.total_transfers || '0'),
        status: cut.status || 'completed'
      }

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching cash cut:', error)
      return null
    }
  }

  /**
   * Get total pending payments
   */
  private async getPendingPaymentsTotal(clinicId?: string): Promise<number> {
    try {
      const result = await client.query({
        query: GET_PENDING_FINANCE_INCOME,
        variables: { clinicId },
        fetchPolicy: 'network-only'
      })

      return result.data?.finance_incomeCollection?.edges?.reduce((sum: number, edge: any) => {
        return sum + parseFloat(edge.node.amount || '0')
      }, 0) || 0

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching pending payments:', error)
      return 0
    }
  }

  /**
   * Get cash register summary for period
   */
  async getCashRegisterSummary(startDate: string, endDate: string, clinicId?: string): Promise<CashRegisterSummary[]> {
    try {
      const result = await client.query({
        query: GET_CASH_REGISTER_CUTS,
        variables: {
          filter: {
            and: [
              { cut_date: { gte: startDate } },
              { cut_date: { lte: endDate } },
              clinicId ? { clinic_id: { eq: clinicId } } : {}
            ]
          },
          orderBy: [{ cut_date: 'DescNullsLast' }]
        },
        fetchPolicy: 'network-only'
      })

      return result.data?.finance_cash_register_cutsCollection?.edges?.map((edge: any) => ({
        id: edge.node.id,
        cutDate: edge.node.cut_date,
        openingAmount: parseFloat(edge.node.opening_amount || '0'),
        closingAmount: parseFloat(edge.node.closing_amount || '0'),
        totalIncome: parseFloat(edge.node.total_income || '0'),
        totalCash: parseFloat(edge.node.total_cash_payments || '0'),
        totalCard: parseFloat(edge.node.total_card_payments || '0'),
        totalTransfers: parseFloat(edge.node.total_transfers || '0'),
        status: edge.node.status || 'completed'
      })) || []

    } catch (error) {
      console.error('❌ [Finance GraphQL] Error fetching cash register summary:', error)
      return []
    }
  }

  /**
   * Invalidate cache
   */
  invalidateCache(): void {
    this.cachedStats = null
    this.lastFetch = 0
    console.log('🔄 [Finance GraphQL] Cache invalidated')
  }

  /**
   * Force refresh data
   */
  async forceRefresh(clinicId?: string, workspaceId?: string): Promise<FinanceStats> {
    this.invalidateCache()
    return this.getFinanceStats(clinicId, workspaceId)
  }
}

export const financeGraphQLService = FinanceGraphQLService.getInstance()

// Log service initialization
console.log('🚀 Finance GraphQL Service initialized - Ready for financial operations! 💰')