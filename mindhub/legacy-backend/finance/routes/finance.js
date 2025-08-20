/**
 * Finance API Routes
 * 
 * RESTful API endpoints for financial management, income tracking,
 * and financial reporting in the MindHub platform.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const FinanceService = require('../services/FinanceService');
const { logger } = require('../../shared/config/logging');

const router = express.Router();
const financeService = new FinanceService();

/**
 * Validation middleware for income creation
 */
const validateIncomeCreation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  body('source')
    .isIn(['consultation', 'advance', 'therapy', 'evaluation', 'other'])
    .withMessage('Invalid income source'),
  
  body('paymentMethod')
    .isIn(['cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check'])
    .withMessage('Invalid payment method'),
  
  body('currency')
    .optional()
    .isIn(['MXN', 'USD', 'EUR'])
    .withMessage('Invalid currency'),
  
  body('patientId')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID'),
  
  body('consultationId')
    .optional()
    .isUUID()
    .withMessage('Invalid consultation ID'),
  
  body('professionalId')
    .optional()
    .isUUID()
    .withMessage('Invalid professional ID'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
  
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('receivedDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid received date'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date')
];

/**
 * POST /api/finance/income
 * Create a new income record
 */
router.post('/income',
  ...middleware.utils.forHub('finance'),
  validateIncomeCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const income = await financeService.createIncome(req.body);

      res.status(201).json({
        success: true,
        message: 'Income record created successfully',
        data: income
      });
    } catch (error) {
      logger.error('Failed to create income', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create income record',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/income
 * Get income records with filtering and pagination
 */
router.get('/income',
  ...middleware.utils.forHub('finance'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('source').optional().isIn(['consultation', 'advance', 'therapy', 'evaluation', 'other']),
    query('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled']),
    query('professionalId').optional().isUUID().withMessage('Invalid professional ID'),
    query('patientId').optional().isUUID().withMessage('Invalid patient ID'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
    query('minAmount').optional().isFloat({ min: 0 }).withMessage('Invalid minAmount'),
    query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Invalid maxAmount')
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

      const result = await financeService.getIncomes(req.query);

      res.json({
        success: true,
        data: result.incomes,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get income records', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        error: 'Failed to retrieve income records',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/income/:id
 * Get a specific income record
 */
router.get('/income/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid income ID')
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

      const result = await financeService.getIncomes({ 
        limit: 1,
        // We'll need to modify getIncomes to support ID filtering
        // For now, we'll implement a separate method
      });

      // This is a simplified implementation - should be replaced with a dedicated getIncomeById method
      const income = result.incomes.find(i => i.id === req.params.id);
      
      if (!income) {
        return res.status(404).json({
          error: 'Income record not found'
        });
      }

      res.json({
        success: true,
        data: income
      });
    } catch (error) {
      logger.error('Failed to get income record', {
        error: error.message,
        incomeId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to retrieve income record',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/income/:id
 * Update an income record
 */
router.put('/income/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid income ID'),
    ...validateIncomeCreation.filter(validator => 
      // Make all fields optional for updates
      !validator.builder.hasOwnProperty('notEmpty') &&
      !validator.builder.hasOwnProperty('exists')
    )
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

      const income = await financeService.updateIncome(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Income record updated successfully',
        data: income
      });
    } catch (error) {
      logger.error('Failed to update income record', {
        error: error.message,
        incomeId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update income record',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/finance/income/:id
 * Delete (cancel) an income record
 */
router.delete('/income/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid income ID')
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

      const income = await financeService.deleteIncome(req.params.id);

      res.json({
        success: true,
        message: 'Income record cancelled successfully',
        data: income
      });
    } catch (error) {
      logger.error('Failed to delete income record', {
        error: error.message,
        incomeId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to delete income record',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/stats
 * Get financial statistics
 */
router.get('/stats',
  ...middleware.utils.forHub('finance'),
  [
    query('period').optional().isIn(['week', 'month', 'year']).withMessage('Invalid period'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
    query('professionalId').optional().isUUID().withMessage('Invalid professional ID')
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

      const stats = await financeService.getFinancialStats(req.query);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get financial statistics', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        error: 'Failed to retrieve financial statistics',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/income/from-consultation
 * Create income record from consultation completion
 */
router.post('/income/from-consultation',
  ...middleware.utils.forHub('finance'),
  [
    body('consultationId').isUUID().withMessage('Invalid consultation ID'),
    body('patientId').isUUID().withMessage('Invalid patient ID'),
    body('professionalId').optional().isUUID().withMessage('Invalid professional ID'),
    body('consultationType').isIn(['consultation', 'followup', 'therapy', 'evaluation']).withMessage('Invalid consultation type'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']).withMessage('Invalid payment method')
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

      const income = await financeService.createIncomeFromConsultation(req.body);

      res.status(201).json({
        success: true,
        message: 'Income created from consultation successfully',
        data: income
      });
    } catch (error) {
      logger.error('Failed to create income from consultation', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create income from consultation',
        details: error.message
      });
    }
  }
);

module.exports = router;