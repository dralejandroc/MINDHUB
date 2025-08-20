/**
 * Finance Module Entry Point
 * 
 * Manages financial operations, income tracking, and reporting
 * for the MindHub healthcare platform.
 */

const express = require('express');
const { logger } = require('../shared/config/logging');

// Initialize module router
const financeRouter = express.Router();

// Load Finance routes
const financeRoutes = require('./routes/finance');
const configRoutes = require('./routes/config');
const cashRegisterRoutes = require('./routes/cash-register');
const contractRoutes = require('./routes/professional-contracts');

// Mount Finance routes
financeRouter.use('/', financeRoutes);
financeRouter.use('/config', configRoutes);
financeRouter.use('/cash-register', cashRegisterRoutes);
financeRouter.use('/professional-contracts', contractRoutes);

// Health check endpoint
financeRouter.get('/health', (req, res) => {
  res.json({
    module: 'Finance',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Module information
financeRouter.get('/info', (req, res) => {
  res.json({
    module: 'Finance',
    description: 'Financial management and income tracking',
    version: '1.0.0',
    features: [
      'Income tracking',
      'Payment method management',
      'Financial reporting',
      'Consultation billing integration',
      'Professional income analytics'
    ],
    endpoints: {
      'POST /income': 'Create income record',
      'GET /income': 'List income records',
      'GET /income/:id': 'Get specific income record',
      'PUT /income/:id': 'Update income record',
      'DELETE /income/:id': 'Cancel income record',
      'GET /stats': 'Get financial statistics',
      'POST /income/from-consultation': 'Create income from consultation',
      'GET /config': 'Get finance configuration',
      'PUT /config/:id': 'Update finance configuration',
      'POST /config/:id/services': 'Create service',
      'PUT /config/services/:id': 'Update service',
      'POST /config/:id/discount-plans': 'Create discount plan',
      'POST /config/patients/:patientId/services': 'Assign service to patient',
      'POST /config/patients/:patientId/discounts': 'Assign discount to patient',
      'GET /config/patients/:patientId/services/:serviceId/price': 'Calculate patient service price'
    }
  });
});

logger.info('Finance module initialized', {
  routes: ['/', '/health', '/info'],
  timestamp: new Date().toISOString()
});

module.exports = financeRouter;