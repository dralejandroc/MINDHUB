/**
 * Finance Configuration API Routes
 * 
 * RESTful API endpoints for managing finance configuration,
 * services, pricing, and discount plans.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const FinanceConfigService = require('../services/FinanceConfigService');
const { logger } = require('../../shared/config/logging');

const router = express.Router();
const configService = new FinanceConfigService();

/**
 * GET /api/finance/config
 * Get finance configuration for current user
 */
router.get('/',
  ...middleware.utils.forHub('finance'),
  async (req, res) => {
    try {
      // For development, use a placeholder user ID
      const userId = req.user?.id || 'default-user';
      
      const config = await configService.getConfiguration(userId);

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Failed to get finance configuration', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        error: 'Failed to retrieve finance configuration',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/config/:id
 * Update finance configuration
 */
router.put('/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid configuration ID'),
    body('isAutomatic').optional().isBoolean().withMessage('isAutomatic must be boolean'),
    body('defaultCurrency').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
    body('invoicePrefix').optional().trim().isLength({ max: 10 }).withMessage('Invoice prefix too long'),
    body('paymentTerms').optional().trim().isLength({ max: 500 }).withMessage('Payment terms too long'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const config = await configService.updateConfiguration(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: config
      });
    } catch (error) {
      logger.error('Failed to update finance configuration', {
        error: error.message,
        configId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update finance configuration',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/config/:id/services
 * Create a new service
 */
router.post('/:id/services',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid configuration ID'),
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Service name required and max 100 chars'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('code').optional().trim().isLength({ max: 20 }).withMessage('Service code too long'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be positive number'),
    body('currency').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer'),
    body('category').isIn(['consultation', 'therapy', 'evaluation', 'other']).withMessage('Invalid category')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const service = await configService.createService(req.params.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service
      });
    } catch (error) {
      logger.error('Failed to create service', {
        error: error.message,
        configId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create service',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/config/services/:serviceId
 * Update a service
 */
router.put('/services/:serviceId',
  ...middleware.utils.forHub('finance'),
  [
    param('serviceId').isUUID().withMessage('Invalid service ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Service name max 100 chars'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('code').optional().trim().isLength({ max: 20 }).withMessage('Service code too long'),
    body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be positive number'),
    body('currency').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer'),
    body('category').optional().isIn(['consultation', 'therapy', 'evaluation', 'other']).withMessage('Invalid category'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const service = await configService.updateService(req.params.serviceId, req.body);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: service
      });
    } catch (error) {
      logger.error('Failed to update service', {
        error: error.message,
        serviceId: req.params.serviceId,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update service',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/config/:id/discount-plans
 * Create a new discount plan
 */
router.post('/:id/discount-plans',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid configuration ID'),
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Plan name required and max 100 chars'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('discountType').isIn(['percentage', 'fixed_amount', 'custom_price']).withMessage('Invalid discount type'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive number'),
    body('currency').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('validUntil').optional().isISO8601().withMessage('Invalid valid until date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const plan = await configService.createDiscountPlan(req.params.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Discount plan created successfully',
        data: plan
      });
    } catch (error) {
      logger.error('Failed to create discount plan', {
        error: error.message,
        configId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create discount plan',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/config/discount-plans/:discountId
 * Update a discount plan
 */
router.put('/discount-plans/:discountId',
  ...middleware.utils.forHub('finance'),
  [
    param('discountId').isUUID().withMessage('Invalid discount plan ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Plan name max 100 chars'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('discountType').optional().isIn(['percentage', 'fixed_amount', 'custom_price']).withMessage('Invalid discount type'),
    body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be positive number'),
    body('currency').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('validUntil').optional().isISO8601().withMessage('Invalid valid until date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const plan = await configService.updateDiscountPlan(req.params.discountId, req.body);

      res.json({
        success: true,
        message: 'Discount plan updated successfully',
        data: plan
      });
    } catch (error) {
      logger.error('Failed to update discount plan', {
        error: error.message,
        discountId: req.params.discountId,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update discount plan',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/finance/config/services/:serviceId
 * Delete a service
 */
router.delete('/services/:serviceId',
  ...middleware.utils.forHub('finance'),
  [
    param('serviceId').isUUID().withMessage('Invalid service ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      await configService.deleteService(req.params.serviceId);

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete service', {
        error: error.message,
        serviceId: req.params.serviceId
      });
      res.status(500).json({
        error: 'Failed to delete service',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/finance/config/discount-plans/:discountId
 * Delete a discount plan
 */
router.delete('/discount-plans/:discountId',
  ...middleware.utils.forHub('finance'),
  [
    param('discountId').isUUID().withMessage('Invalid discount plan ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      await configService.deleteDiscountPlan(req.params.discountId);

      res.json({
        success: true,
        message: 'Discount plan deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete discount plan', {
        error: error.message,
        discountId: req.params.discountId
      });
      res.status(500).json({
        error: 'Failed to delete discount plan',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/config/patients/:patientId/services
 * Assign service to patient
 */
router.post('/patients/:patientId/services',
  ...middleware.utils.forHub('finance'),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID'),
    body('serviceId').isUUID().withMessage('Invalid service ID'),
    body('customPrice').optional().isFloat({ min: 0 }).withMessage('Custom price must be positive number'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const assignment = await configService.assignServiceToPatient(
        req.params.patientId,
        req.body.serviceId,
        {
          customPrice: req.body.customPrice,
          notes: req.body.notes
        }
      );

      res.status(201).json({
        success: true,
        message: 'Service assigned to patient successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Failed to assign service to patient', {
        error: error.message,
        patientId: req.params.patientId,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to assign service to patient',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/config/patients/:patientId/discounts
 * Assign discount to patient
 */
router.post('/patients/:patientId/discounts',
  ...middleware.utils.forHub('finance'),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID'),
    body('discountPlanId').isUUID().withMessage('Invalid discount plan ID'),
    body('customValue').optional().isFloat({ min: 0 }).withMessage('Custom value must be positive number'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
    body('validUntil').optional().isISO8601().withMessage('Invalid valid until date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const assignment = await configService.assignDiscountToPatient(
        req.params.patientId,
        req.body.discountPlanId,
        {
          customValue: req.body.customValue,
          notes: req.body.notes,
          validUntil: req.body.validUntil
        }
      );

      res.status(201).json({
        success: true,
        message: 'Discount assigned to patient successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Failed to assign discount to patient', {
        error: error.message,
        patientId: req.params.patientId,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to assign discount to patient',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/config/patients/:patientId/services/:serviceId/price
 * Calculate price for patient service with discounts
 */
router.get('/patients/:patientId/services/:serviceId/price',
  ...middleware.utils.forHub('finance'),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID'),
    param('serviceId').isUUID().withMessage('Invalid service ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const calculation = await configService.calculatePatientServicePrice(
        req.params.patientId,
        req.params.serviceId
      );

      res.json({
        success: true,
        data: calculation
      });
    } catch (error) {
      logger.error('Failed to calculate patient service price', {
        error: error.message,
        patientId: req.params.patientId,
        serviceId: req.params.serviceId
      });
      res.status(500).json({
        error: 'Failed to calculate price',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/patients/:patientId/services
 * Get patient service assignments
 */
router.get('/patients/:patientId/services',
  ...middleware.utils.forHub('finance'),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const assignments = await configService.getPatientServices(req.params.patientId);

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      logger.error('Failed to get patient services', {
        error: error.message,
        patientId: req.params.patientId
      });
      res.status(500).json({
        error: 'Failed to get patient services',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/patients/:patientId/discounts
 * Get patient discount assignments
 */
router.get('/patients/:patientId/discounts',
  ...middleware.utils.forHub('finance'),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const assignments = await configService.getPatientDiscounts(req.params.patientId);

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      logger.error('Failed to get patient discounts', {
        error: error.message,
        patientId: req.params.patientId
      });
      res.status(500).json({
        error: 'Failed to get patient discounts',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/finance/patients/services/:assignmentId
 * Remove patient service assignment
 */
router.delete('/patients/services/:assignmentId',
  ...middleware.utils.forHub('finance'),
  [
    param('assignmentId').isUUID().withMessage('Invalid assignment ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      await configService.removePatientService(req.params.assignmentId);

      res.json({
        success: true,
        message: 'Service assignment removed successfully'
      });
    } catch (error) {
      logger.error('Failed to remove patient service assignment', {
        error: error.message,
        assignmentId: req.params.assignmentId
      });
      res.status(500).json({
        error: 'Failed to remove service assignment',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/finance/patients/discounts/:assignmentId
 * Remove patient discount assignment
 */
router.delete('/patients/discounts/:assignmentId',
  ...middleware.utils.forHub('finance'),
  [
    param('assignmentId').isUUID().withMessage('Invalid assignment ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      await configService.removePatientDiscount(req.params.assignmentId);

      res.json({
        success: true,
        message: 'Discount assignment removed successfully'
      });
    } catch (error) {
      logger.error('Failed to remove patient discount assignment', {
        error: error.message,
        assignmentId: req.params.assignmentId
      });
      res.status(500).json({
        error: 'Failed to remove discount assignment',
        details: error.message
      });
    }
  }
);

module.exports = router;