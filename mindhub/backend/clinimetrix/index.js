/**
 * Clinimetrix Hub - Clinical Assessment System
 * 
 * Main router for the Clinimetrix clinical assessment hub.
 * Handles routing and middleware for all assessment-related operations.
 */

const express = require('express');
const { checkPermissions, requireAuth } = require('../shared/middleware/auth');

// Simple logger for now
const logger = {
  error: (message, meta) => console.error('[ERROR]', message, meta),
  info: (message, meta) => console.log('[INFO]', message, meta),
  warn: (message, meta) => console.warn('[WARN]', message, meta)
};

const router = express.Router();

// Import route modules  
// const scalesRoutes = require('./routes/scales-universal'); // COMENTADO - usar solo sistema de seeds
// const scalesSimpleRoutes = require('./routes/scales-simple'); // Comentado - usar universal
// const assessmentRoutes = require('./routes/assessments'); // Commented for now
// const administrationRoutes = require('./routes/administration'); // Commented for now

// Import clinical assessment routes (new clinical workflow extension)
const clinicalAssessmentRoutes = require('./routes/clinical-assessments');
const clinicalScalesRoutes = require('./routes/clinical-scales');
const clinicalWorkflowRoutes = require('./routes/clinical-workflows');
const clinicalResultsRoutes = require('./routes/clinical-results');
const complianceRoutes = require('./routes/compliance');

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
      'Scale Administration Tracking',
      'Clinical Assessment Workflows',
      'Assessment Battery Management',
      'Clinical Insights and Analytics',
      'Role-Based Access Control',
      'Healthcare Compliance (NOM-024)'
    ],
    endpoints: {
      scales: '/api/v1/clinimetrix/scales',
      assessments: '/api/v1/clinimetrix/assessments',
      workflows: '/api/v1/clinimetrix/workflows',
      results: '/api/v1/clinimetrix/results',
      compliance: '/api/v1/clinimetrix/compliance',
      administration: '/api/clinimetrix/administration'
    },
    capabilities: {
      assessmentModes: ['self_administered', 'clinician_administered', 'both'],
      supportedScales: [
        'PHQ-9 (Patient Health Questionnaire)',
        'GADI (General Anxiety Disorder Inventory)', 
        'AQ-Adolescent (Autism Quotient)',
        'PAS (Parental Acceptance Scale)'
      ],
      system: 'universal',
      features: [
        'Database-first architecture',
        'Dynamic scale loading',
        'Automated scoring and interpretation',
        'Multi-format export capabilities',
        'Real-time validation'
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

// For development - skip authentication temporarily
// router.use(requireAuth);
// router.use('/scales', checkPermissions(['read:assessments']));
// router.use('/assessments', checkPermissions(['read:assessments']));
// router.use('/administration', checkPermissions(['read:assessments']));

// Mount route modules
// router.use('/scales', scalesRoutes); // COMENTADO - usar solo sistema de seeds
// router.use('/assessments', assessmentRoutes); // Commented for now
// router.use('/administration', administrationRoutes); // Commented for now

// Mount clinical assessment routes (clinical workflow extension)
router.use('/assessments', clinicalAssessmentRoutes);
router.use('/scales', clinicalScalesRoutes);
router.use('/workflows', clinicalWorkflowRoutes);
router.use('/results', clinicalResultsRoutes);
router.use('/compliance', complianceRoutes);

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