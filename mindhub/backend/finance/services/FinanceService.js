/**
 * Finance Service
 * 
 * Business logic for financial operations, income tracking, expense management,
 * and financial reporting in the MindHub platform.
 */

const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

class FinanceService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Create a new income record
   * @param {Object} incomeData - Income data
   * @returns {Promise<Object>} Created income record
   */
  async createIncome(incomeData) {
    try {
      const income = await executeQuery(
        (prisma) => prisma.income.create({
          data: {
            amount: parseFloat(incomeData.amount),
            source: incomeData.source,
            paymentMethod: incomeData.paymentMethod,
            currency: incomeData.currency || 'MXN',
            patientId: incomeData.patientId,
            consultationId: incomeData.consultationId,
            professionalId: incomeData.professionalId,
            description: incomeData.description,
            concept: incomeData.concept,
            notes: incomeData.notes,
            reference: incomeData.reference,
            status: incomeData.status || 'confirmed',
            receivedDate: incomeData.receivedDate ? new Date(incomeData.receivedDate) : new Date(),
            dueDate: incomeData.dueDate ? new Date(incomeData.dueDate) : null
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            consultation: {
              select: {
                id: true,
                consultationDate: true,
                reason: true
              }
            },
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        'createIncome'
      );

      logger.info('Income record created', {
        incomeId: income.id,
        amount: income.amount,
        source: income.source,
        patientId: income.patientId,
        professionalId: income.professionalId
      });

      return income;
    } catch (error) {
      logger.error('Failed to create income record', {
        error: error.message,
        incomeData: { ...incomeData, amount: parseFloat(incomeData.amount) }
      });
      throw error;
    }
  }

  /**
   * Get income records with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Income records with pagination
   */
  async getIncomes(params) {
    try {
      const {
        page = 1,
        limit = 20,
        source,
        paymentMethod,
        status,
        professionalId,
        patientId,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount
      } = params;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};
      
      if (source) where.source = source;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (status) where.status = status;
      if (professionalId) where.professionalId = professionalId;
      if (patientId) where.patientId = patientId;
      
      if (dateFrom || dateTo) {
        where.receivedDate = {};
        if (dateFrom) where.receivedDate.gte = new Date(dateFrom);
        if (dateTo) where.receivedDate.lte = new Date(dateTo);
      }
      
      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) where.amount.gte = parseFloat(minAmount);
        if (maxAmount) where.amount.lte = parseFloat(maxAmount);
      }

      const [incomes, totalCount] = await executeTransaction([
        (prisma) => prisma.income.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            consultation: {
              select: {
                id: true,
                consultationDate: true,
                reason: true
              }
            },
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { receivedDate: 'desc' }
        }),
        (prisma) => prisma.income.count({ where })
      ], 'getIncomes');

      return {
        incomes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      };
    } catch (error) {
      logger.error('Failed to get income records', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Get financial statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Financial statistics
   */
  async getFinancialStats(params) {
    try {
      const {
        period = 'month',
        dateFrom,
        dateTo,
        professionalId
      } = params;

      // Calculate period dates if not provided
      let startDate, endDate;
      
      if (dateFrom && dateTo) {
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
      } else {
        endDate = new Date();
        
        switch (period) {
          case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }
      }

      const where = {
        receivedDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'confirmed'
      };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      // Get various statistics
      const [
        totalIncome,
        incomeBySource,
        incomeByPaymentMethod,
        incomeByProfessional,
        dailyIncome
      ] = await executeTransaction([
        // Total income
        (prisma) => prisma.income.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
          _avg: { amount: true }
        }),
        
        // Income by source
        (prisma) => prisma.income.groupBy({
          by: ['source'],
          where,
          _sum: { amount: true },
          _count: true
        }),
        
        // Income by payment method
        (prisma) => prisma.income.groupBy({
          by: ['paymentMethod'],
          where,
          _sum: { amount: true },
          _count: true
        }),
        
        // Income by professional
        (prisma) => prisma.income.groupBy({
          by: ['professionalId'],
          where,
          _sum: { amount: true },
          _count: true
        }),
        
        // Daily income trend
        (prisma) => prisma.$queryRaw`
          SELECT 
            DATE(receivedDate) as date,
            SUM(amount) as total,
            COUNT(*) as transactions
          FROM incomes 
          WHERE receivedDate BETWEEN ${startDate} AND ${endDate}
            AND status = 'confirmed'
            ${professionalId ? `AND professionalId = '${professionalId}'` : ''}
          GROUP BY DATE(receivedDate)
          ORDER BY date DESC
          LIMIT 30
        `
      ], 'getFinancialStats');

      return {
        summary: {
          totalAmount: totalIncome._sum.amount || 0,
          totalTransactions: totalIncome._count,
          averageAmount: totalIncome._avg.amount || 0,
          period: {
            from: startDate,
            to: endDate
          }
        },
        breakdown: {
          bySource: incomeBySource,
          byPaymentMethod: incomeByPaymentMethod,
          byProfessional: incomeByProfessional
        },
        trends: {
          daily: dailyIncome
        }
      };
    } catch (error) {
      logger.error('Failed to get financial statistics', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Update an income record
   * @param {string} id - Income ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated income record
   */
  async updateIncome(id, updateData) {
    try {
      const income = await executeQuery(
        (prisma) => prisma.income.update({
          where: { id },
          data: {
            ...(updateData.amount && { amount: parseFloat(updateData.amount) }),
            ...(updateData.source && { source: updateData.source }),
            ...(updateData.paymentMethod && { paymentMethod: updateData.paymentMethod }),
            ...(updateData.description && { description: updateData.description }),
            ...(updateData.concept && { concept: updateData.concept }),
            ...(updateData.notes && { notes: updateData.notes }),
            ...(updateData.reference && { reference: updateData.reference }),
            ...(updateData.status && { status: updateData.status }),
            ...(updateData.receivedDate && { receivedDate: new Date(updateData.receivedDate) }),
            ...(updateData.dueDate && { dueDate: new Date(updateData.dueDate) })
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            consultation: {
              select: {
                id: true,
                consultationDate: true,
                reason: true
              }
            },
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        `updateIncome(${id})`
      );

      logger.info('Income record updated', {
        incomeId: id,
        changes: Object.keys(updateData)
      });

      return income;
    } catch (error) {
      logger.error('Failed to update income record', {
        error: error.message,
        incomeId: id,
        updateData
      });
      throw error;
    }
  }

  /**
   * Delete an income record (soft delete by status)
   * @param {string} id - Income ID
   * @returns {Promise<Object>} Updated income record
   */
  async deleteIncome(id) {
    try {
      const income = await executeQuery(
        (prisma) => prisma.income.update({
          where: { id },
          data: { status: 'cancelled' }
        }),
        `deleteIncome(${id})`
      );

      logger.warn('Income record cancelled', {
        incomeId: id,
        amount: income.amount,
        source: income.source
      });

      return income;
    } catch (error) {
      logger.error('Failed to delete income record', {
        error: error.message,
        incomeId: id
      });
      throw error;
    }
  }

  /**
   * Create income from consultation completion
   * @param {Object} consultationData - Consultation data
   * @returns {Promise<Object>} Created income record
   */
  async createIncomeFromConsultation(consultationData) {
    try {
      const {
        consultationId,
        patientId,
        professionalId,
        consultationType,
        amount,
        paymentMethod = 'cash',
        notes
      } = consultationData;

      // Determine source based on consultation type
      let source;
      switch (consultationType) {
        case 'followup':
          source = 'followup';
          break;
        case 'therapy':
          source = 'therapy';
          break;
        case 'evaluation':
          source = 'evaluation';
          break;
        default:
          source = 'consultation';
      }

      const income = await this.createIncome({
        amount,
        source,
        paymentMethod,
        patientId,
        consultationId,
        professionalId,
        description: `Income from ${consultationType} consultation`,
        concept: consultationType,
        notes,
        status: 'confirmed'
      });

      logger.info('Income created from consultation', {
        consultationId,
        incomeId: income.id,
        amount: income.amount
      });

      return income;
    } catch (error) {
      logger.error('Failed to create income from consultation', {
        error: error.message,
        consultationData
      });
      throw error;
    }
  }
}

module.exports = FinanceService;