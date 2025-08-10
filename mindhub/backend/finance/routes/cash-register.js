/**
 * Cash Register API Routes
 * 
 * RESTful API endpoints for cash register cuts, payment breakdowns,
 * and financial reporting in the MindHub platform.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const CashRegisterService = require('../services/CashRegisterService');
const { logger } = require('../../shared/config/logging');

const router = express.Router();
const cashRegisterService = new CashRegisterService();

/**
 * POST /api/finance/cash-register/cuts
 * Create a new cash register cut
 */
router.post('/cuts',
  ...middleware.utils.forHub('finance'),
  [
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('cutType').optional().isIn(['daily', 'shift', 'manual']).withMessage('Invalid cut type'),
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

      const cut = await cashRegisterService.createCashCut({
        ...req.body,
        createdBy: req.user?.id || 'default-user'
      });

      res.status(201).json({
        success: true,
        message: 'Cash register cut created successfully',
        data: cut
      });
    } catch (error) {
      logger.error('Failed to create cash cut', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create cash cut',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/cash-register/cuts
 * Get cash register cuts with filters
 */
router.get('/cuts',
  ...middleware.utils.forHub('finance'),
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('cutType').optional().isIn(['daily', 'shift', 'manual']).withMessage('Invalid cut type'),
    query('status').optional().isIn(['open', 'closed', 'reconciled']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Invalid offset')
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

      const cuts = await cashRegisterService.getCashCuts(req.query);

      res.json({
        success: true,
        data: cuts
      });
    } catch (error) {
      logger.error('Failed to get cash cuts', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        error: 'Failed to get cash cuts',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/cash-register/cuts/:id
 * Get cash register cut by ID with full breakdown
 */
router.get('/cuts/:id',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid cut ID')
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

      const cut = await cashRegisterService.getCashCutById(req.params.id);

      res.json({
        success: true,
        data: cut
      });
    } catch (error) {
      logger.error('Failed to get cash cut', {
        error: error.message,
        cutId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to get cash cut',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/cash-register/cuts/:id/close
 * Close a cash register cut
 */
router.put('/cuts/:id/close',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid cut ID'),
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

      const cut = await cashRegisterService.closeCashCut(
        req.params.id,
        req.user?.id || 'default-user',
        req.body.notes
      );

      res.json({
        success: true,
        message: 'Cash register cut closed successfully',
        data: cut
      });
    } catch (error) {
      logger.error('Failed to close cash cut', {
        error: error.message,
        cutId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to close cash cut',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/finance/cash-register/cuts/:id/recalculate
 * Recalculate cash register cut totals
 */
router.put('/cuts/:id/recalculate',
  ...middleware.utils.forHub('finance'),
  [
    param('id').isUUID().withMessage('Invalid cut ID')
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

      await cashRegisterService.calculateCutTotals(req.params.id);
      const cut = await cashRegisterService.getCashCutById(req.params.id);

      res.json({
        success: true,
        message: 'Cash register cut recalculated successfully',
        data: cut
      });
    } catch (error) {
      logger.error('Failed to recalculate cash cut', {
        error: error.message,
        cutId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to recalculate cash cut',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/finance/cash-register/cuts/daily
 * Generate daily cash register cut
 */
router.post('/cuts/daily',
  ...middleware.utils.forHub('finance'),
  async (req, res) => {
    try {
      const cut = await cashRegisterService.generateDailyCut(
        req.user?.id || 'default-user'
      );

      res.status(201).json({
        success: true,
        message: 'Daily cash register cut generated successfully',
        data: cut
      });
    } catch (error) {
      logger.error('Failed to generate daily cash cut', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        error: 'Failed to generate daily cash cut',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/finance/cash-register/summary
 * Get financial summary for a period
 */
router.get('/summary',
  ...middleware.utils.forHub('finance'),
  [
    query('startDate').isISO8601().withMessage('Start date is required'),
    query('endDate').isISO8601().withMessage('End date is required'),
    query('professionalId').optional().isUUID().withMessage('Invalid professional ID'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'professional', 'service']).withMessage('Invalid groupBy')
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

      const summary = await cashRegisterService.getFinancialSummary(req.query);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Failed to get financial summary', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({
        error: 'Failed to get financial summary',
        details: error.message
      });
    }
  }
);

module.exports = router;