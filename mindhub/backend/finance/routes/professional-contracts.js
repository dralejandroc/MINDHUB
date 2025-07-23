/**
 * Professional Contracts API Routes
 * 
 * RESTful API endpoints for managing professional contracts,
 * commission rates, and payment calculations.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const ProfessionalContractService = require('../services/ProfessionalContractService');
const { logger } = require('../../shared/config/logging');

const router = express.Router();
const contractService = new ProfessionalContractService();

/**
 * POST /api/v1/finance/professional-contracts
 * Create a new professional contract
 */
router.post('/',
  ...middleware.utils.forHub('finance'),
  [
    body('professionalId').isUUID().withMessage('Invalid professional ID'),
    body('contractType').isIn(['percentage', 'fixed_amount', 'hourly', 'salary']).withMessage('Invalid contract type'),
    body('commissionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
    body('fixedAmount').optional().isFloat({ min: 0 }).withMessage('Fixed amount must be positive'),
    body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
    body('monthlyRate').optional().isFloat({ min: 0 }).withMessage('Monthly rate must be positive'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
    body('clinicId').optional().isUUID().withMessage('Invalid clinic ID')
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

      const { professionalId, ...contractData } = req.body;

      // Validate contract type requirements
      if (contractData.contractType === 'percentage' && !contractData.commissionRate) {
        return res.status(400).json({
          error: 'Commission rate is required for percentage contracts'
        });
      }

      if (contractData.contractType === 'fixed_amount' && !contractData.fixedAmount) {
        return res.status(400).json({
          error: 'Fixed amount is required for fixed amount contracts'
        });
      }

      if (contractData.contractType === 'hourly' && !contractData.hourlyRate) {
        return res.status(400).json({
          error: 'Hourly rate is required for hourly contracts'
        });
      }

      if (contractData.contractType === 'salary' && !contractData.monthlyRate) {
        return res.status(400).json({
          error: 'Monthly rate is required for salary contracts'
        });
      }

      const contract = await contractService.createContract(professionalId, contractData);

      res.status(201).json({
        success: true,
        message: 'Professional contract created successfully',
        data: contract
      });
    } catch (error) {
      logger.error('Failed to create professional contract', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create professional contract',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/v1/finance/professional-contracts/professional/:professionalId
 * Get contracts for a specific professional
 */
router.get('/professional/:professionalId',
  ...middleware.utils.forHub('finance'),
  [
    param('professionalId').isUUID().withMessage('Invalid professional ID')
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

      const contracts = await contractService.getProfessionalContracts(req.params.professionalId);

      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      logger.error('Failed to get professional contracts', {
        error: error.message,
        professionalId: req.params.professionalId
      });
      res.status(500).json({
        error: 'Failed to get professional contracts',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/v1/finance/professional-contracts/professional/:professionalId/active
 * Get active contract for a professional
 */
router.get('/professional/:professionalId/active',
  ...middleware.utils.forHub('finance'),
  [
    param('professionalId').isUUID().withMessage('Invalid professional ID'),
    query('referenceDate').optional().isISO8601().withMessage('Invalid reference date')
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

      const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate) : new Date();
      const contract = await contractService.getActiveContract(req.params.professionalId, referenceDate);

      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      logger.error('Failed to get active contract', {
        error: error.message,
        professionalId: req.params.professionalId
      });
      res.status(500).json({
        error: 'Failed to get active contract',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/v1/finance/professional-contracts/professionals
 * Get all professionals with their active contracts
 */
router.get('/professionals',
  ...middleware.utils.forHub('finance'),
  [
    query('clinicId').optional().isUUID().withMessage('Invalid clinic ID')
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

      const professionals = await contractService.getProfessionalsWithContracts(req.query);

      res.json({
        success: true,
        data: professionals
      });
    } catch (error) {
      logger.error('Failed to get professionals with contracts', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        error: 'Failed to get professionals with contracts',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/v1/finance/professional-contracts/:id
 * Update a professional contract
 */
router.put('/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid contract ID'),
    body('contractType').optional().isIn(['percentage', 'fixed_amount', 'hourly', 'salary']).withMessage('Invalid contract type'),
    body('commissionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
    body('fixedAmount').optional().isFloat({ min: 0 }).withMessage('Fixed amount must be positive'),
    body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
    body('monthlyRate').optional().isFloat({ min: 0 }).withMessage('Monthly rate must be positive'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
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

      const contract = await contractService.updateContract(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Professional contract updated successfully',
        data: contract
      });
    } catch (error) {
      logger.error('Failed to update professional contract', {
        error: error.message,
        contractId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update professional contract',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/v1/finance/professional-contracts/:id
 * Deactivate a professional contract
 */
router.delete('/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid contract ID'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date')
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

      const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
      const contract = await contractService.deactivateContract(req.params.id, endDate);

      res.json({
        success: true,
        message: 'Professional contract deactivated successfully',
        data: contract
      });
    } catch (error) {
      logger.error('Failed to deactivate professional contract', {
        error: error.message,
        contractId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to deactivate professional contract',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/v1/finance/professional-contracts/calculate-payment
 * Calculate payment amounts for a service
 */
router.post('/calculate-payment',
  ...middleware.utils.forHub('finance'),
  [
    body('professionalId').isUUID().withMessage('Invalid professional ID'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be positive'),
    body('serviceDate').optional().isISO8601().withMessage('Invalid service date')
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

      const { professionalId, totalAmount, serviceDate } = req.body;
      const calculation = await contractService.calculatePaymentAmounts(
        professionalId,
        totalAmount,
        serviceDate ? new Date(serviceDate) : new Date()
      );

      res.json({
        success: true,
        data: calculation
      });
    } catch (error) {
      logger.error('Failed to calculate payment amounts', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to calculate payment amounts',
        details: error.message
      });
    }
  }
);

module.exports = router;