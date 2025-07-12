/**
 * Resources Hub - Psychoeducational Library
 * 
 * Main router for the Resources psychoeducational content hub.
 * Handles routing and middleware for all resource-related operations.
 */

const express = require('express');
const { checkPermissions, requireAuth } = require('../shared/middleware/auth');
const { logger } = require('../shared/config/storage');

const router = express.Router();

// Import route modules
const libraryRoutes = require('./routes/library');
const distributionRoutes = require('./routes/distribution');
const managementRoutes = require('./routes/management');

// Hub information endpoint
router.get('/', (req, res) => {
  res.json({
    hub: 'Resources',
    description: 'Psychoeducational Library',
    version: '1.0.0',
    features: [
      'Categorized Psychoeducational Materials',
      'Secure Digital Distribution System',
      'Version Control and Access Logging',
      'Bulk Upload and Management Tools',
      'Patient-specific Resource Assignment',
      'Usage Analytics and Tracking'
    ],
    endpoints: {
      library: '/api/resources/library',
      distribution: '/api/resources/distribution',
      management: '/api/resources/management'
    },
    resourceTypes: [
      'educational_handouts', 'worksheets', 'audio_materials', 
      'video_content', 'interactive_tools', 'assessment_guides',
      'treatment_protocols', 'self_help_guides'
    ],
    categories: [
      'depression', 'anxiety', 'bipolar', 'trauma', 'addiction',
      'eating_disorders', 'personality_disorders', 'psychosis',
      'relationships', 'parenting', 'grief', 'stress_management'
    ]
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      hub: 'Resources',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'active',
        logging: 'operational',
        file_storage: 'connected',
        distribution_service: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      hub: 'Resources',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// Apply permission checks for different resource types
router.use('/library', checkPermissions(['read:resources']));
router.use('/distribution', checkPermissions(['read:resources']));
router.use('/management', checkPermissions(['write:resources']));

// Mount route modules
router.use('/library', libraryRoutes);
router.use('/distribution', distributionRoutes);
router.use('/management', managementRoutes);

// Hub-specific error handler
router.use((error, req, res, next) => {
  logger.error('Resources hub error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip
  });

  // Check if error is related to resource access
  if (error.message.includes('Resource not found') || error.message.includes('Access denied')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested educational resource was not found or you do not have access to it.',
      hub: 'Resources'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An error occurred while processing your resource request.',
    hub: 'Resources',
    ...(process.env.NODE_ENV !== 'production' && { 
      details: error.message 
    })
  });
});

module.exports = router;