/**
 * Cash Register Service
 * 
 * Manages cash register cuts, payment breakdowns, professional commissions,
 * and financial reporting for the MindHub platform finance system.
 */

const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

class CashRegisterService {
  /**
   * Create a new cash register cut
   * @param {Object} cutData - Cut data
   * @returns {Promise<Object>} Created cut
   */
  async createCashCut(cutData) {
    try {
      // Get cut number first if not provided
      const cutNumber = cutData.cutNumber || await this.getNextCutNumber();
      
      const cut = await executeQuery(
        (prisma) => prisma.cashRegisterCut.create({
          data: {
            cutNumber: cutNumber,
            cutType: cutData.cutType || 'manual',
            startDate: new Date(cutData.startDate),
            endDate: new Date(cutData.endDate),
            totalIncome: 0, // Will be calculated
            totalDiscounts: 0,
            totalCourtesies: 0,
            netIncome: 0,
            notes: cutData.notes,
            createdBy: cutData.createdBy
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        'createCashCut'
      );

      // Calculate and populate cut data
      await this.calculateCutTotals(cut.id);

      logger.info('Cash register cut created', {
        cutId: cut.id,
        cutNumber: cut.cutNumber,
        period: `${cutData.startDate} to ${cutData.endDate}`
      });

      return await this.getCashCutById(cut.id);
    } catch (error) {
      logger.error('Failed to create cash cut', {
        error: error.message,
        cutData
      });
      throw error;
    }
  }

  /**
   * Get cash cut by ID with full breakdown
   * @param {string} cutId - Cut ID
   * @returns {Promise<Object>} Cash cut with breakdowns
   */
  async getCashCutById(cutId) {
    try {
      const cut = await executeQuery(
        (prisma) => prisma.cashRegisterCut.findUnique({
          where: { id: cutId },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            closer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            paymentBreakdown: {
              orderBy: { paymentMethod: 'asc' }
            },
            professionalBreakdown: {
              include: {
                professional: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: {
                professional: {
                  name: 'asc'
                }
              }
            }
          }
        }),
        `getCashCutById(${cutId})`
      );

      if (!cut) {
        throw new Error('Cash cut not found');
      }

      return cut;
    } catch (error) {
      logger.error('Failed to get cash cut', {
        error: error.message,
        cutId
      });
      throw error;
    }
  }

  /**
   * Get cash cuts with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Cash cuts
   */
  async getCashCuts(filters = {}) {
    try {
      const where = {};
      
      if (filters.startDate && filters.endDate) {
        where.startDate = {
          gte: new Date(filters.startDate)
        };
        where.endDate = {
          lte: new Date(filters.endDate)
        };
      }
      
      if (filters.cutType) {
        where.cutType = filters.cutType;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }

      const cuts = await executeQuery(
        (prisma) => prisma.cashRegisterCut.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            closer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                paymentBreakdown: true,
                professionalBreakdown: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        'getCashCuts'
      );

      return cuts;
    } catch (error) {
      logger.error('Failed to get cash cuts', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Calculate cut totals and breakdowns
   * @param {string} cutId - Cut ID
   * @returns {Promise<void>}
   */
  async calculateCutTotals(cutId) {
    try {
      const cut = await executeQuery(
        (prisma) => prisma.cashRegisterCut.findUnique({
          where: { id: cutId }
        }),
        `getCutForCalculation(${cutId})`
      );

      if (!cut) {
        throw new Error('Cash cut not found');
      }

      // Get all incomes in the period
      const incomes = await executeQuery(
        (prisma) => prisma.income.findMany({
          where: {
            receivedDate: {
              gte: cut.startDate,
              lte: cut.endDate
            },
            status: 'confirmed'
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                contracts: {
                  where: {
                    isActive: true,
                    startDate: { lte: cut.endDate },
                    OR: [
                      { endDate: null },
                      { endDate: { gte: cut.startDate } }
                    ]
                  },
                  orderBy: { startDate: 'desc' },
                  take: 1
                }
              }
            }
          }
        }),
        'getIncomesForCut'
      );

      // Calculate totals
      const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalDiscounts = incomes.reduce((sum, income) => 
        sum + (parseFloat(income.discountAmount) || 0), 0);
      const totalCourtesies = incomes
        .filter(income => income.isCourtesy)
        .reduce((sum, income) => sum + parseFloat(income.originalAmount || income.amount), 0);
      const netIncome = totalIncome;

      // Calculate payment method breakdown
      const paymentBreakdown = {};
      incomes.forEach(income => {
        if (!paymentBreakdown[income.paymentMethod]) {
          paymentBreakdown[income.paymentMethod] = {
            amount: 0,
            count: 0
          };
        }
        paymentBreakdown[income.paymentMethod].amount += parseFloat(income.amount);
        paymentBreakdown[income.paymentMethod].count += 1;
      });

      // Calculate professional breakdown
      const professionalBreakdown = {};
      incomes.forEach(income => {
        if (income.professionalId) {
          if (!professionalBreakdown[income.professionalId]) {
            professionalBreakdown[income.professionalId] = {
              totalIncome: 0,
              professionalAmount: 0,
              clinicAmount: 0,
              serviceCount: 0,
              commissionRate: 0
            };
          }
          
          const breakdown = professionalBreakdown[income.professionalId];
          const amount = parseFloat(income.amount);
          
          breakdown.totalIncome += amount;
          breakdown.serviceCount += 1;
          
          // Get commission rate from contract or income
          const contract = income.professional?.contracts?.[0];
          const commissionRate = income.commissionRate || contract?.commissionRate || 50;
          breakdown.commissionRate = commissionRate;
          
          // Calculate amounts
          if (contract?.contractType === 'percentage') {
            breakdown.professionalAmount += amount * (parseFloat(commissionRate) / 100);
            breakdown.clinicAmount += amount * (1 - parseFloat(commissionRate) / 100);
          } else if (contract?.contractType === 'fixed_amount') {
            breakdown.professionalAmount += parseFloat(contract.fixedAmount) || 0;
            breakdown.clinicAmount += amount - (parseFloat(contract.fixedAmount) || 0);
          } else {
            // Default to 50-50 split
            breakdown.professionalAmount += amount * 0.5;
            breakdown.clinicAmount += amount * 0.5;
          }
        }
      });

      // Update cut with calculated totals
      await executeTransaction([
        // Update main cut
        (prisma) => prisma.cashRegisterCut.update({
          where: { id: cutId },
          data: {
            totalIncome,
            totalDiscounts,
            totalCourtesies,
            netIncome
          }
        }),
        
        // Clear existing breakdowns
        (prisma) => prisma.cashCutPaymentBreakdown.deleteMany({
          where: { cashCutId: cutId }
        }),
        
        (prisma) => prisma.cashCutProfessionalBreakdown.deleteMany({
          where: { cashCutId: cutId }
        }),
        
        // Create payment breakdowns
        ...Object.entries(paymentBreakdown).map(([method, data]) =>
          (prisma) => prisma.cashCutPaymentBreakdown.create({
            data: {
              cashCutId: cutId,
              paymentMethod: method,
              amount: data.amount,
              transactionCount: data.count
            }
          })
        ),
        
        // Create professional breakdowns
        ...Object.entries(professionalBreakdown).map(([professionalId, data]) =>
          (prisma) => prisma.cashCutProfessionalBreakdown.create({
            data: {
              cashCutId: cutId,
              professionalId,
              totalIncome: data.totalIncome,
              professionalAmount: data.professionalAmount,
              clinicAmount: data.clinicAmount,
              commissionRate: data.commissionRate,
              serviceCount: data.serviceCount
            }
          })
        )
      ], 'calculateCutTotals');

      logger.info('Cut totals calculated', {
        cutId,
        totalIncome,
        totalDiscounts,
        totalCourtesies,
        netIncome,
        paymentMethods: Object.keys(paymentBreakdown).length,
        professionals: Object.keys(professionalBreakdown).length
      });

    } catch (error) {
      logger.error('Failed to calculate cut totals', {
        error: error.message,
        cutId
      });
      throw error;
    }
  }

  /**
   * Close a cash register cut
   * @param {string} cutId - Cut ID
   * @param {string} closedBy - User ID who closed it
   * @param {string} notes - Closing notes
   * @returns {Promise<Object>} Updated cut
   */
  async closeCashCut(cutId, closedBy, notes) {
    try {
      // Recalculate totals before closing
      await this.calculateCutTotals(cutId);
      
      const cut = await executeQuery(
        (prisma) => prisma.cashRegisterCut.update({
          where: { id: cutId },
          data: {
            status: 'closed',
            closedBy,
            closedAt: new Date(),
            notes: notes || undefined
          }
        }),
        `closeCashCut(${cutId})`
      );

      logger.info('Cash cut closed', {
        cutId,
        closedBy,
        totalIncome: cut.totalIncome
      });

      return await this.getCashCutById(cutId);
    } catch (error) {
      logger.error('Failed to close cash cut', {
        error: error.message,
        cutId,
        closedBy
      });
      throw error;
    }
  }

  /**
   * Get financial summary for a period
   * @param {Object} filters - Period and filters
   * @returns {Promise<Object>} Financial summary
   */
  async getFinancialSummary(filters = {}) {
    try {
      const { startDate, endDate, professionalId } = filters;
      
      const where = {
        receivedDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: 'confirmed'
      };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      const incomes = await executeQuery(
        (prisma) => prisma.income.findMany({
          where,
          include: {
            professional: {
              select: { id: true, name: true }
            },
            service: {
              select: { id: true, name: true, category: true }
            }
          }
        }),
        'getIncomesForSummary'
      );

      // Calculate summary
      const summary = {
        period: { startDate, endDate },
        totalIncome: 0,
        totalDiscounts: 0,
        totalCourtesies: 0,
        netIncome: 0,
        transactionCount: incomes.length,
        paymentMethodBreakdown: {},
        professionalBreakdown: {},
        serviceBreakdown: {},
        discountAnalysis: {
          totalDiscountPercentage: 0,
          courtesyCount: 0,
          discountedTransactions: 0
        }
      };

      incomes.forEach(income => {
        const amount = parseFloat(income.amount);
        const originalAmount = parseFloat(income.originalAmount) || amount;
        const discountAmount = parseFloat(income.discountAmount) || 0;
        
        summary.totalIncome += amount;
        summary.totalDiscounts += discountAmount;
        if (income.isCourtesy) {
          summary.totalCourtesies += originalAmount;
          summary.discountAnalysis.courtesyCount++;
        }
        
        if (discountAmount > 0) {
          summary.discountAnalysis.discountedTransactions++;
        }

        // Payment method breakdown
        if (!summary.paymentMethodBreakdown[income.paymentMethod]) {
          summary.paymentMethodBreakdown[income.paymentMethod] = {
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        summary.paymentMethodBreakdown[income.paymentMethod].amount += amount;
        summary.paymentMethodBreakdown[income.paymentMethod].count++;

        // Professional breakdown
        if (income.professionalId) {
          if (!summary.professionalBreakdown[income.professionalId]) {
            summary.professionalBreakdown[income.professionalId] = {
              professional: income.professional,
              totalIncome: 0,
              serviceCount: 0,
              professionalAmount: parseFloat(income.professionalAmount) || 0,
              clinicAmount: parseFloat(income.clinicAmount) || 0
            };
          }
          const profBreakdown = summary.professionalBreakdown[income.professionalId];
          profBreakdown.totalIncome += amount;
          profBreakdown.serviceCount++;
          profBreakdown.professionalAmount += parseFloat(income.professionalAmount) || 0;
          profBreakdown.clinicAmount += parseFloat(income.clinicAmount) || 0;
        }

        // Service breakdown
        if (income.service) {
          const serviceKey = income.service.id;
          if (!summary.serviceBreakdown[serviceKey]) {
            summary.serviceBreakdown[serviceKey] = {
              service: income.service,
              amount: 0,
              count: 0
            };
          }
          summary.serviceBreakdown[serviceKey].amount += amount;
          summary.serviceBreakdown[serviceKey].count++;
        }
      });

      summary.netIncome = summary.totalIncome;

      // Calculate percentages
      Object.values(summary.paymentMethodBreakdown).forEach(method => {
        method.percentage = summary.totalIncome > 0 
          ? (method.amount / summary.totalIncome) * 100 
          : 0;
      });

      summary.discountAnalysis.totalDiscountPercentage = originalAmount > 0
        ? (summary.totalDiscounts / originalAmount) * 100
        : 0;

      return summary;
    } catch (error) {
      logger.error('Failed to get financial summary', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get next cut number
   * @returns {Promise<number>} Next cut number
   */
  async getNextCutNumber() {
    try {
      const lastCut = await executeQuery(
        (prisma) => prisma.cashRegisterCut.findFirst({
          orderBy: { cutNumber: 'desc' }
        }),
        'getLastCutNumber'
      );

      return (lastCut?.cutNumber || 0) + 1;
    } catch (error) {
      logger.error('Failed to get next cut number', {
        error: error.message
      });
      return 1;
    }
  }

  /**
   * Generate daily cut automatically
   * @param {string} createdBy - User ID
   * @returns {Promise<Object>} Created daily cut
   */
  async generateDailyCut(createdBy) {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.createCashCut({
        cutType: 'daily',
        startDate: startOfDay,
        endDate: endOfDay,
        createdBy,
        notes: `Corte automático del día ${today.toLocaleDateString('es-MX')}`
      });
    } catch (error) {
      logger.error('Failed to generate daily cut', {
        error: error.message,
        createdBy
      });
      throw error;
    }
  }
}

module.exports = CashRegisterService;