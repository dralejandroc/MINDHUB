/**
 * Professional Contract Service
 * 
 * Manages professional contracts, commission rates, and payment calculations
 * for the MindHub platform finance system.
 */

const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

class ProfessionalContractService {
  /**
   * Create a new professional contract
   * @param {string} professionalId - Professional ID
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} Created contract
   */
  async createContract(professionalId, contractData) {
    try {
      // Deactivate existing contracts if needed
      if (contractData.isActive) {
        await executeQuery(
          (prisma) => prisma.professionalContract.updateMany({
            where: {
              professionalId,
              isActive: true
            },
            data: {
              isActive: false,
              endDate: new Date()
            }
          }),
          'deactivateExistingContracts'
        );
      }

      const contract = await executeQuery(
        (prisma) => prisma.professionalContract.create({
          data: {
            professionalId,
            clinicId: contractData.clinicId,
            contractType: contractData.contractType,
            commissionRate: contractData.commissionRate,
            fixedAmount: contractData.fixedAmount,
            hourlyRate: contractData.hourlyRate,
            monthlyRate: contractData.monthlyRate,
            startDate: contractData.startDate ? new Date(contractData.startDate) : new Date(),
            endDate: contractData.endDate ? new Date(contractData.endDate) : null,
            notes: contractData.notes,
            isActive: contractData.isActive !== false
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        'createProfessionalContract'
      );

      logger.info('Professional contract created', {
        contractId: contract.id,
        professionalId,
        contractType: contract.contractType,
        commissionRate: contract.commissionRate
      });

      return contract;
    } catch (error) {
      logger.error('Failed to create professional contract', {
        error: error.message,
        professionalId,
        contractData
      });
      throw error;
    }
  }

  /**
   * Get active contract for a professional
   * @param {string} professionalId - Professional ID
   * @param {Date} referenceDate - Reference date for contract validity
   * @returns {Promise<Object|null>} Active contract
   */
  async getActiveContract(professionalId, referenceDate = new Date()) {
    try {
      const contract = await executeQuery(
        (prisma) => prisma.professionalContract.findFirst({
          where: {
            professionalId,
            isActive: true,
            startDate: { lte: referenceDate },
            OR: [
              { endDate: null },
              { endDate: { gte: referenceDate } }
            ]
          },
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
            startDate: 'desc'
          }
        }),
        `getActiveContract(${professionalId})`
      );

      return contract;
    } catch (error) {
      logger.error('Failed to get active contract', {
        error: error.message,
        professionalId,
        referenceDate
      });
      throw error;
    }
  }

  /**
   * Get all contracts for a professional
   * @param {string} professionalId - Professional ID
   * @returns {Promise<Array>} Professional contracts
   */
  async getProfessionalContracts(professionalId) {
    try {
      const contracts = await executeQuery(
        (prisma) => prisma.professionalContract.findMany({
          where: { professionalId },
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
            startDate: 'desc'
          }
        }),
        `getProfessionalContracts(${professionalId})`
      );

      return contracts;
    } catch (error) {
      logger.error('Failed to get professional contracts', {
        error: error.message,
        professionalId
      });
      throw error;
    }
  }

  /**
   * Update a contract
   * @param {string} contractId - Contract ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated contract
   */
  async updateContract(contractId, updateData) {
    try {
      const contract = await executeQuery(
        (prisma) => prisma.professionalContract.update({
          where: { id: contractId },
          data: {
            ...updateData,
            startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
            endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        `updateContract(${contractId})`
      );

      logger.info('Professional contract updated', {
        contractId,
        professionalId: contract.professionalId,
        changes: Object.keys(updateData)
      });

      return contract;
    } catch (error) {
      logger.error('Failed to update contract', {
        error: error.message,
        contractId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Calculate payment amounts for a service
   * @param {string} professionalId - Professional ID
   * @param {number} totalAmount - Total service amount
   * @param {Date} serviceDate - Service date
   * @returns {Promise<Object>} Payment calculation
   */
  async calculatePaymentAmounts(professionalId, totalAmount, serviceDate = new Date()) {
    try {
      const contract = await this.getActiveContract(professionalId, serviceDate);
      
      const calculation = {
        totalAmount: parseFloat(totalAmount),
        professionalAmount: 0,
        clinicAmount: 0,
        commissionRate: 0,
        contractType: 'none',
        contractId: null
      };

      if (!contract) {
        // Default 50-50 split if no contract
        calculation.professionalAmount = parseFloat(totalAmount) * 0.5;
        calculation.clinicAmount = parseFloat(totalAmount) * 0.5;
        calculation.commissionRate = 50;
        calculation.contractType = 'default';
      } else {
        calculation.contractId = contract.id;
        calculation.contractType = contract.contractType;
        
        switch (contract.contractType) {
          case 'percentage':
            calculation.commissionRate = parseFloat(contract.commissionRate);
            calculation.professionalAmount = parseFloat(totalAmount) * (calculation.commissionRate / 100);
            calculation.clinicAmount = parseFloat(totalAmount) - calculation.professionalAmount;
            break;
            
          case 'fixed_amount':
            calculation.professionalAmount = parseFloat(contract.fixedAmount) || 0;
            calculation.clinicAmount = parseFloat(totalAmount) - calculation.professionalAmount;
            calculation.commissionRate = calculation.professionalAmount > 0 
              ? (calculation.professionalAmount / parseFloat(totalAmount)) * 100 
              : 0;
            break;
            
          case 'hourly':
            // For hourly, need duration information - default to full amount
            calculation.professionalAmount = parseFloat(totalAmount);
            calculation.clinicAmount = 0;
            calculation.commissionRate = 100;
            break;
            
          case 'salary':
            // For salary, clinic gets all service income
            calculation.professionalAmount = 0;
            calculation.clinicAmount = parseFloat(totalAmount);
            calculation.commissionRate = 0;
            break;
            
          default:
            // Default 50-50 split
            calculation.professionalAmount = parseFloat(totalAmount) * 0.5;
            calculation.clinicAmount = parseFloat(totalAmount) * 0.5;
            calculation.commissionRate = 50;
        }
      }

      // Ensure amounts don't go negative
      calculation.professionalAmount = Math.max(0, calculation.professionalAmount);
      calculation.clinicAmount = Math.max(0, calculation.clinicAmount);

      logger.info('Payment amounts calculated', {
        professionalId,
        totalAmount: calculation.totalAmount,
        professionalAmount: calculation.professionalAmount,
        clinicAmount: calculation.clinicAmount,
        commissionRate: calculation.commissionRate,
        contractType: calculation.contractType
      });

      return calculation;
    } catch (error) {
      logger.error('Failed to calculate payment amounts', {
        error: error.message,
        professionalId,
        totalAmount,
        serviceDate
      });
      throw error;
    }
  }

  /**
   * Get all professionals with their active contracts
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Professionals with contracts
   */
  async getProfessionalsWithContracts(filters = {}) {
    try {
      const where = {};
      
      if (filters.clinicId) {
        where.id = {
          in: await executeQuery(
            (prisma) => prisma.professionalContract.findMany({
              where: {
                clinicId: filters.clinicId,
                isActive: true
              },
              select: { professionalId: true }
            }).then(contracts => contracts.map(c => c.professionalId)),
            'getProfessionalsByClinic'
          )
        };
      }

      const professionals = await executeQuery(
        (prisma) => prisma.user.findMany({
          where: {
            ...where,
            userRoles: {
              some: {
                role: {
                  name: { in: ['doctor', 'therapist', 'psychologist', 'professional'] }
                }
              }
            }
          },
          include: {
            contracts: {
              where: {
                isActive: true,
                startDate: { lte: new Date() },
                OR: [
                  { endDate: null },
                  { endDate: { gte: new Date() } }
                ]
              },
              orderBy: { startDate: 'desc' },
              take: 1
            }
          },
          orderBy: { name: 'asc' }
        }),
        'getProfessionalsWithContracts'
      );

      return professionals;
    } catch (error) {
      logger.error('Failed to get professionals with contracts', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Deactivate a contract
   * @param {string} contractId - Contract ID
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Updated contract
   */
  async deactivateContract(contractId, endDate = new Date()) {
    try {
      const contract = await executeQuery(
        (prisma) => prisma.professionalContract.update({
          where: { id: contractId },
          data: {
            isActive: false,
            endDate: endDate
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        `deactivateContract(${contractId})`
      );

      logger.info('Professional contract deactivated', {
        contractId,
        professionalId: contract.professionalId,
        endDate
      });

      return contract;
    } catch (error) {
      logger.error('Failed to deactivate contract', {
        error: error.message,
        contractId,
        endDate
      });
      throw error;
    }
  }
}

module.exports = ProfessionalContractService;