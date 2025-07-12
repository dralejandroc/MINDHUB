/**
 * Clinimetrix Hub - Clinical Assessment System
 * 
 * Main router for the Clinimetrix clinical assessment hub.
 * Handles routing and middleware for all assessment-related operations.
 */

const express = require('express');
const { checkPermissions, requireAuth } = require('../shared/middleware/auth');
const { logger } = require('../shared/config/storage');

const router = express.Router();

// Import route modules
const scalesRoutes = require('./routes/scales');
const assessmentRoutes = require('./routes/assessments');
const administrationRoutes = require('./routes/administration');

// Hub information endpoint
router.get('/', (req, res) => {
  res.json({
    hub: 'Clinimetrix',
    description: 'Clinical Assessment System',
    version: '1.0.0',
    features: [
      '50+ Validated Clinical Assessment Scales',
      'Self-administered and Hetero-administered Modes',
      'Secure Tokenized Remote Assessments', 
      'Automated Scoring and Interpretation',
      'Statistical Analysis and Reporting',
      'Scale Administration Tracking'
    ],
    endpoints: {
      scales: '/api/clinimetrix/scales',
      assessments: '/api/clinimetrix/assessments',
      administration: '/api/clinimetrix/administration'
    },
    capabilities: {
      assessmentModes: ['self_administered', 'hetero_administered', 'remote_tokenized'],
      supportedScales: [
        'PHQ-9', 'GAD-7', 'BECK-II', 'HAMILTON-D', 'HAMILTON-A',
        'MADRS', 'YMRS', 'PANSS', 'BPRS', 'CGI-S', 'CGI-I',
        'MINI', 'SCID-5', 'WAIS-IV', 'MMSE', 'MOCA'
      ]
    }
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      hub: 'Clinimetrix',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'active',
        logging: 'operational',
        scoring_engine: 'active'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      hub: 'Clinimetrix',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// Apply permission checks for different resource types
router.use('/scales', checkPermissions(['read:assessments']));
router.use('/assessments', checkPermissions(['read:assessments']));
router.use('/administration', checkPermissions(['read:assessments']));

// Mount route modules
router.use('/scales', scalesRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/administration', administrationRoutes);

// Hub-specific error handler
router.use((error, req, res, next) => {
  logger.error('Clinimetrix hub error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip
  });

  // Check if error is related to assessment data access
  if (error.message.includes('Assessment not found') || error.message.includes('Scale not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested assessment resource was not found or you do not have access to it.',
      hub: 'Clinimetrix'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An error occurred while processing your assessment request.',
    hub: 'Clinimetrix',
    ...(process.env.NODE_ENV !== 'production' && { 
      details: error.message 
    })
  });
});

module.exports = router;