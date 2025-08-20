/**
 * Finance Configuration Service
 * 
 * Manages finance configuration, services, pricing, and discount plans
 * for the MindHub platform finance system.
 */

const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

class FinanceConfigService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get finance configuration for a user/clinic
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Finance configuration
   */
  async getConfiguration(userId) {
    try {
      const config = await executeQuery(
        (prisma) => prisma.financeConfiguration.findFirst({
          where: {
            createdBy: userId,
            isActive: true
          },
          include: {
            services: {
              where: { isActive: true },
              orderBy: { name: 'asc' }
            },
            discountPlans: {
              where: { isActive: true },
              orderBy: { name: 'asc' }
            }
          }
        }),
        'getFinanceConfiguration'
      );

      // If no configuration exists, create default one
      if (!config) {
        return await this.createDefaultConfiguration(userId);
      }

      return config;
    } catch (error) {
      logger.error('Failed to get finance configuration', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Create default finance configuration
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created configuration
   */
  async createDefaultConfiguration(userId) {
    try {
      const config = await executeQuery(
        (prisma) => prisma.financeConfiguration.create({
          data: {
            createdBy: userId,
            isAutomatic: false,
            defaultCurrency: 'MXN',
            invoicePrefix: 'INV',
            invoiceCounter: 1,
            services: {
              create: [
                {
                  name: 'Consulta General',
                  description: 'Consulta médica general',
                  code: 'CONS-GEN',
                  basePrice: 800.00,
                  duration: 60,
                  category: 'consultation'
                },
                {
                  name: 'Consulta de Seguimiento',
                  description: 'Consulta de seguimiento',
                  code: 'CONS-SEG',
                  basePrice: 600.00,
                  duration: 45,
                  category: 'consultation'
                },
                {
                  name: 'Terapia Individual',
                  description: 'Sesión de terapia individual',
                  code: 'THER-IND',
                  basePrice: 1200.00,
                  duration: 90,
                  category: 'therapy'
                },
                {
                  name: 'Evaluación Psicológica',
                  description: 'Evaluación psicológica completa',
                  code: 'EVAL-PSI',
                  basePrice: 1500.00,
                  duration: 120,
                  category: 'evaluation'
                }
              ]
            },
            discountPlans: {
              create: [
                {
                  name: 'Descuento Estudiante',
                  description: 'Descuento para estudiantes con credencial válida',
                  discountType: 'percentage',
                  discountValue: 20.00
                },
                {
                  name: 'Descuento Adulto Mayor',
                  description: 'Descuento para personas mayores de 65 años',
                  discountType: 'percentage',
                  discountValue: 15.00
                },
                {
                  name: 'Programa Social',
                  description: 'Tarifa social para familias de bajos recursos',
                  discountType: 'fixed_amount',
                  discountValue: 200.00
                }
              ]
            }
          },
          include: {
            services: true,
            discountPlans: true
          }
        }),
        'createDefaultFinanceConfiguration'
      );

      logger.info('Default finance configuration created', {
        configId: config.id,
        userId,
        servicesCount: config.services.length,
        discountPlansCount: config.discountPlans.length
      });

      return config;
    } catch (error) {
      logger.error('Failed to create default finance configuration', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Update finance configuration
   * @param {string} configId - Configuration ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated configuration
   */
  async updateConfiguration(configId, updateData) {
    try {
      const config = await executeQuery(
        (prisma) => prisma.financeConfiguration.update({
          where: { id: configId },
          data: {
            ...(updateData.isAutomatic !== undefined && { isAutomatic: updateData.isAutomatic }),
            ...(updateData.defaultCurrency && { defaultCurrency: updateData.defaultCurrency }),
            ...(updateData.taxRate !== undefined && { taxRate: parseFloat(updateData.taxRate) }),
            ...(updateData.invoicePrefix && { invoicePrefix: updateData.invoicePrefix }),
            ...(updateData.paymentTerms && { paymentTerms: updateData.paymentTerms }),
            ...(updateData.notes && { notes: updateData.notes })
          },
          include: {
            services: { where: { isActive: true } },
            discountPlans: { where: { isActive: true } }
          }
        }),
        `updateFinanceConfiguration(${configId})`
      );

      logger.info('Finance configuration updated', {
        configId,
        changes: Object.keys(updateData)
      });

      return config;
    } catch (error) {
      logger.error('Failed to update finance configuration', {
        error: error.message,
        configId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Create a new service
   * @param {string} configId - Configuration ID
   * @param {Object} serviceData - Service data
   * @returns {Promise<Object>} Created service
   */
  async createService(configId, serviceData) {
    try {
      const service = await executeQuery(
        (prisma) => prisma.service.create({
          data: {
            configId,
            name: serviceData.name,
            description: serviceData.description,
            code: serviceData.code,
            basePrice: parseFloat(serviceData.basePrice),
            currency: serviceData.currency || 'MXN',
            duration: serviceData.duration,
            category: serviceData.category
          }
        }),
        'createService'
      );

      logger.info('Service created', {
        serviceId: service.id,
        configId,
        name: service.name,
        basePrice: service.basePrice
      });

      return service;
    } catch (error) {
      logger.error('Failed to create service', {
        error: error.message,
        configId,
        serviceData
      });
      throw error;
    }
  }

  /**
   * Update a service
   * @param {string} serviceId - Service ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated service
   */
  async updateService(serviceId, updateData) {
    try {
      const service = await executeQuery(
        (prisma) => prisma.service.update({
          where: { id: serviceId },
          data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.description !== undefined && { description: updateData.description }),
            ...(updateData.code !== undefined && { code: updateData.code }),
            ...(updateData.basePrice !== undefined && { basePrice: parseFloat(updateData.basePrice) }),
            ...(updateData.currency && { currency: updateData.currency }),
            ...(updateData.duration !== undefined && { duration: parseInt(updateData.duration) }),
            ...(updateData.category && { category: updateData.category }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive })
          }
        }),
        `updateService(${serviceId})`
      );

      logger.info('Service updated', {
        serviceId,
        changes: Object.keys(updateData)
      });

      return service;
    } catch (error) {
      logger.error('Failed to update service', {
        error: error.message,
        serviceId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Delete a service
   * @param {string} serviceId - Service ID
   * @returns {Promise<void>}
   */
  async deleteService(serviceId) {
    try {
      // Check if service has patient assignments
      const assignments = await executeQuery(
        (prisma) => prisma.patientService.count({
          where: { serviceId }
        }),
        'checkServiceAssignments'
      );

      if (assignments > 0) {
        throw new Error('Cannot delete service with active patient assignments');
      }

      await executeQuery(
        (prisma) => prisma.service.delete({
          where: { id: serviceId }
        }),
        `deleteService(${serviceId})`
      );

      logger.info('Service deleted', { serviceId });
    } catch (error) {
      logger.error('Failed to delete service', {
        error: error.message,
        serviceId
      });
      throw error;
    }
  }

  /**
   * Create a discount plan
   * @param {string} configId - Configuration ID
   * @param {Object} planData - Discount plan data
   * @returns {Promise<Object>} Created discount plan
   */
  async createDiscountPlan(configId, planData) {
    try {
      const plan = await executeQuery(
        (prisma) => prisma.discountPlan.create({
          data: {
            configId,
            name: planData.name,
            description: planData.description,
            discountType: planData.discountType,
            discountValue: parseFloat(planData.discountValue),
            currency: planData.currency || 'MXN',
            validUntil: planData.validUntil ? new Date(planData.validUntil) : null
          }
        }),
        'createDiscountPlan'
      );

      logger.info('Discount plan created', {
        planId: plan.id,
        configId,
        name: plan.name,
        discountType: plan.discountType,
        discountValue: plan.discountValue
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create discount plan', {
        error: error.message,
        configId,
        planData
      });
      throw error;
    }
  }

  /**
   * Update a discount plan
   * @param {string} discountId - Discount plan ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated discount plan
   */
  async updateDiscountPlan(discountId, updateData) {
    try {
      const plan = await executeQuery(
        (prisma) => prisma.discountPlan.update({
          where: { id: discountId },
          data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.description !== undefined && { description: updateData.description }),
            ...(updateData.discountType && { discountType: updateData.discountType }),
            ...(updateData.discountValue !== undefined && { discountValue: parseFloat(updateData.discountValue) }),
            ...(updateData.currency && { currency: updateData.currency }),
            ...(updateData.validUntil !== undefined && { 
              validUntil: updateData.validUntil ? new Date(updateData.validUntil) : null 
            }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive })
          }
        }),
        `updateDiscountPlan(${discountId})`
      );

      logger.info('Discount plan updated', {
        discountId,
        changes: Object.keys(updateData)
      });

      return plan;
    } catch (error) {
      logger.error('Failed to update discount plan', {
        error: error.message,
        discountId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Delete a discount plan
   * @param {string} discountId - Discount plan ID
   * @returns {Promise<void>}
   */
  async deleteDiscountPlan(discountId) {
    try {
      // Check if discount plan has patient assignments
      const assignments = await executeQuery(
        (prisma) => prisma.patientDiscount.count({
          where: { discountPlanId: discountId }
        }),
        'checkDiscountAssignments'
      );

      if (assignments > 0) {
        throw new Error('Cannot delete discount plan with active patient assignments');
      }

      await executeQuery(
        (prisma) => prisma.discountPlan.delete({
          where: { id: discountId }
        }),
        `deleteDiscountPlan(${discountId})`
      );

      logger.info('Discount plan deleted', { discountId });
    } catch (error) {
      logger.error('Failed to delete discount plan', {
        error: error.message,
        discountId
      });
      throw error;
    }
  }

  /**
   * Assign service to patient
   * @param {string} patientId - Patient ID
   * @param {string} serviceId - Service ID
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Patient service assignment
   */
  async assignServiceToPatient(patientId, serviceId, options = {}) {
    try {
      // Check if already assigned
      const existing = await executeQuery(
        (prisma) => prisma.patientService.findUnique({
          where: {
            patientId_serviceId: {
              patientId,
              serviceId
            }
          }
        }),
        'checkExistingPatientService'
      );

      if (existing) {
        if (!existing.isActive) {
          // Reactivate if was deactivated
          return await executeQuery(
            (prisma) => prisma.patientService.update({
              where: { id: existing.id },
              data: {
                isActive: true,
                customPrice: options.customPrice ? parseFloat(options.customPrice) : null,
                notes: options.notes
              },
              include: {
                service: true
              }
            }),
            `reactivatePatientService(${existing.id})`
          );
        }
        throw new Error('Service already assigned to patient');
      }

      const assignment = await executeQuery(
        (prisma) => prisma.patientService.create({
          data: {
            patientId,
            serviceId,
            customPrice: options.customPrice ? parseFloat(options.customPrice) : null,
            notes: options.notes
          },
          include: {
            service: true,
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        'assignServiceToPatient'
      );

      logger.info('Service assigned to patient', {
        assignmentId: assignment.id,
        patientId,
        serviceId,
        serviceName: assignment.service.name,
        customPrice: assignment.customPrice
      });

      return assignment;
    } catch (error) {
      logger.error('Failed to assign service to patient', {
        error: error.message,
        patientId,
        serviceId,
        options
      });
      throw error;
    }
  }

  /**
   * Assign discount to patient
   * @param {string} patientId - Patient ID
   * @param {string} discountPlanId - Discount plan ID
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Patient discount assignment
   */
  async assignDiscountToPatient(patientId, discountPlanId, options = {}) {
    try {
      // Check if already assigned
      const existing = await executeQuery(
        (prisma) => prisma.patientDiscount.findUnique({
          where: {
            patientId_discountPlanId: {
              patientId,
              discountPlanId
            }
          }
        }),
        'checkExistingPatientDiscount'
      );

      if (existing) {
        if (!existing.isActive) {
          // Reactivate if was deactivated
          return await executeQuery(
            (prisma) => prisma.patientDiscount.update({
              where: { id: existing.id },
              data: {
                isActive: true,
                customValue: options.customValue ? parseFloat(options.customValue) : null,
                notes: options.notes,
                validUntil: options.validUntil ? new Date(options.validUntil) : null
              },
              include: {
                discountPlan: true
              }
            }),
            `reactivatePatientDiscount(${existing.id})`
          );
        }
        throw new Error('Discount plan already assigned to patient');
      }

      const assignment = await executeQuery(
        (prisma) => prisma.patientDiscount.create({
          data: {
            patientId,
            discountPlanId,
            customValue: options.customValue ? parseFloat(options.customValue) : null,
            notes: options.notes,
            validUntil: options.validUntil ? new Date(options.validUntil) : null
          },
          include: {
            discountPlan: true,
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        'assignDiscountToPatient'
      );

      logger.info('Discount assigned to patient', {
        assignmentId: assignment.id,
        patientId,
        discountPlanId,
        discountName: assignment.discountPlan.name,
        customValue: assignment.customValue
      });

      return assignment;
    } catch (error) {
      logger.error('Failed to assign discount to patient', {
        error: error.message,
        patientId,
        discountPlanId,
        options
      });
      throw error;
    }
  }

  /**
   * Calculate price for patient service with discounts
   * @param {string} patientId - Patient ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} Price calculation
   */
  async calculatePatientServicePrice(patientId, serviceId) {
    try {
      const [patientService, patientDiscounts, service] = await executeTransaction([
        // Get patient service (with custom price if any)
        (prisma) => prisma.patientService.findUnique({
          where: {
            patientId_serviceId: {
              patientId,
              serviceId
            }
          }
        }),
        
        // Get active patient discounts
        (prisma) => prisma.patientDiscount.findMany({
          where: {
            patientId,
            isActive: true,
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } }
            ]
          },
          include: {
            discountPlan: true
          }
        }),
        
        // Get service details
        (prisma) => prisma.service.findUnique({
          where: { id: serviceId }
        })
      ], 'calculatePatientServicePrice');

      if (!service) {
        throw new Error('Service not found');
      }

      // Base price (custom price overrides service base price)
      const basePrice = patientService?.customPrice || service.basePrice;
      let finalPrice = parseFloat(basePrice);
      let totalDiscount = 0;
      const appliedDiscounts = [];

      // Apply discounts
      for (const patientDiscount of patientDiscounts) {
        const discount = patientDiscount.discountPlan;
        const discountValue = patientDiscount.customValue || discount.discountValue;

        let discountAmount = 0;
        
        switch (discount.discountType) {
          case 'percentage':
            discountAmount = finalPrice * (parseFloat(discountValue) / 100);
            break;
          case 'fixed_amount':
            discountAmount = parseFloat(discountValue);
            break;
          case 'custom_price':
            finalPrice = parseFloat(discountValue);
            discountAmount = basePrice - finalPrice;
            break;
        }

        totalDiscount += discountAmount;
        appliedDiscounts.push({
          id: discount.id,
          name: discount.name,
          type: discount.discountType,
          value: discountValue,
          amount: discountAmount
        });

        // Apply discount (except for custom_price which sets final price directly)
        if (discount.discountType !== 'custom_price') {
          finalPrice -= discountAmount;
        }
      }

      // Ensure price doesn't go below 0
      finalPrice = Math.max(0, finalPrice);

      const calculation = {
        serviceId,
        serviceName: service.name,
        basePrice: parseFloat(basePrice),
        finalPrice,
        totalDiscount,
        appliedDiscounts,
        currency: service.currency
      };

      logger.info('Patient service price calculated', {
        patientId,
        serviceId,
        basePrice: calculation.basePrice,
        finalPrice: calculation.finalPrice,
        totalDiscount: calculation.totalDiscount,
        discountsApplied: appliedDiscounts.length
      });

      return calculation;
    } catch (error) {
      logger.error('Failed to calculate patient service price', {
        error: error.message,
        patientId,
        serviceId
      });
      throw error;
    }
  }

  /**
   * Get patient service assignments
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Patient services
   */
  async getPatientServices(patientId) {
    try {
      const assignments = await executeQuery(
        (prisma) => prisma.patientService.findMany({
          where: {
            patientId,
            isActive: true
          },
          include: {
            service: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        `getPatientServices(${patientId})`
      );

      logger.info('Patient services retrieved', {
        patientId,
        count: assignments.length
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to get patient services', {
        error: error.message,
        patientId
      });
      throw error;
    }
  }

  /**
   * Get patient discount assignments
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Patient discounts
   */
  async getPatientDiscounts(patientId) {
    try {
      const assignments = await executeQuery(
        (prisma) => prisma.patientDiscount.findMany({
          where: {
            patientId,
            isActive: true
          },
          include: {
            discountPlan: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        `getPatientDiscounts(${patientId})`
      );

      logger.info('Patient discounts retrieved', {
        patientId,
        count: assignments.length
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to get patient discounts', {
        error: error.message,
        patientId
      });
      throw error;
    }
  }

  /**
   * Remove patient service assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<void>}
   */
  async removePatientService(assignmentId) {
    try {
      await executeQuery(
        (prisma) => prisma.patientService.update({
          where: { id: assignmentId },
          data: { isActive: false }
        }),
        `removePatientService(${assignmentId})`
      );

      logger.info('Patient service assignment removed', { assignmentId });
    } catch (error) {
      logger.error('Failed to remove patient service assignment', {
        error: error.message,
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Remove patient discount assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<void>}
   */
  async removePatientDiscount(assignmentId) {
    try {
      await executeQuery(
        (prisma) => prisma.patientDiscount.update({
          where: { id: assignmentId },
          data: { isActive: false }
        }),
        `removePatientDiscount(${assignmentId})`
      );

      logger.info('Patient discount assignment removed', { assignmentId });
    } catch (error) {
      logger.error('Failed to remove patient discount assignment', {
        error: error.message,
        assignmentId
      });
      throw error;
    }
  }
}

module.exports = FinanceConfigService;