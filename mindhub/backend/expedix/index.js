/**
 * Expedix Hub - Patient Management System
 * 
 * Main router for the Expedix patient management hub.
 * Handles routing and middleware for all patient-related operations.
 */

const express = require('express');
const { checkPermissions, requireAuth } = require('../shared/middleware/auth');
const { logger } = require('../shared/config/storage');

const router = express.Router();

// Import route modules
const patientsRoutes = require('./routes/patients-mysql');
const consultationsRoutes = require('./routes/consultations-mysql');
// const medicalHistoryRoutes = require('./routes/medical-history');

// Hub information endpoint
router.get('/', (req, res) => {
  res.json({
    hub: 'Expedix',
    description: 'Patient Management System',
    version: '1.0.0',
    features: [
      'Patient Demographics Management',
      'Medical History Tracking',
      'Clinical Consultations (SOAP Notes)',
      'Prescription Management',
      'Healthcare Compliance (NOM-024)',
      'Audit Logging'
    ],
    endpoints: {
      patients: '/api/expedix/patients',
      medicalHistory: '/api/expedix/medical-history',
      consultations: '/api/expedix/consultations'
    },
    compliance: {
      standard: 'NOM-024-SSA3-2010',
      features: [
        'Data encryption at rest',
        'Comprehensive audit logging',
        'Role-based access control',
        'Secure patient data handling'
      ]
    }
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Basic health check - could be expanded to check database connectivity
    res.json({
      status: 'healthy',
      hub: 'Expedix',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'active',
        logging: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      hub: 'Expedix',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// For development - skip authentication temporarily
// router.use(requireAuth);
// router.use('/patients', checkPermissions(['read:patients']));

// Mount route modules
router.use('/patients', patientsRoutes);
router.use('/consultations', consultationsRoutes);
// router.use('/medical-history', medicalHistoryRoutes);

// Hub-specific error handler
router.use((error, req, res, next) => {
  logger.error('Expedix hub error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip
  });

  // Check if error is related to patient data access
  if (error.message.includes('Patient not found') || error.message.includes('Access denied')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested patient resource was not found or you do not have access to it.',
      hub: 'Expedix'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An error occurred while processing your request.',
    hub: 'Expedix',
    ...(process.env.NODE_ENV !== 'production' && { 
      details: error.message 
    })
  });
});

module.exports = router;