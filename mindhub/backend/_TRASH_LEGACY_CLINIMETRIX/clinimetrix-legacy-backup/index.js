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
const assessmentRoutes = require('./routes/assessments');
// const administrationRoutes = require('./routes/administration'); // Commented for now

// Import clinical assessment routes (new clinical workflow extension)
const clinicalAssessmentRoutes = require('./routes/clinical-assessments');
const clinicalScalesRoutes = require('./routes/clinical-scales');
const clinicalWorkflowRoutes = require('./routes/clinical-workflows');
const clinicalResultsRoutes = require('./routes/clinical-results');
const complianceRoutes = require('./routes/compliance');

// Import public routes for development (no authentication required)
const scalesPublicRoutes = require('./routes/scales-public');
const assessmentCompletionRoutes = require('./routes/assessment-completion');
const remoteAssessmentsRoutes = require('./routes/remote-assessments');

// Patient assessments endpoint (simple, no auth for development)
router.get('/patient-assessments/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { scaleId } = req.query;
    
    const { getPrismaClient } = require('../shared/config/prisma');
    const prisma = getPrismaClient();
    
    // Build where clause
    const whereClause = { patientId: patientId };
    if (scaleId) whereClause.scaleId = scaleId;

    // Get assessments for the patient
    const assessments = await prisma.scaleAdministration.findMany({
      where: whereClause,
      include: {
        scale: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            category: true
          }
        },
        subscaleScores: {
          select: {
            id: true,
            subscaleId: true,
            subscaleName: true,
            score: true,
            severity: true,
            interpretation: true
          }
        }
      },
      orderBy: {
        administrationDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: assessments,
      total: assessments.length
    });

  } catch (error) {
    console.error('Error fetching patient assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient assessments',
      message: error.message
    });
  }
});

// Hub information endpoint
router.get('/', (req, res) => {
  res.json({
    hub: 'Clinimetrix',
    description: 'Clinical Assessment System',
    version: '1.0.0',
    features: [
      'Universal Clinical Assessment System',
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
      scales: '/api/clinimetrix/scales',
      assessments: '/api/clinimetrix/assessments',
      remote_assessments: '/api/clinimetrix/remote-assessments',
      workflows: '/api/clinimetrix/workflows',
      results: '/api/clinimetrix/results',
      compliance: '/api/clinimetrix/compliance',
      administration: '/api/clinimetrix/administration'
    },
    capabilities: {
      assessmentModes: ['self_administered', 'clinician_administered', 'both'],
      supportedScales: 'Universal - Any validated clinical scale',
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
// router.use('/administration', administrationRoutes); // Commented for now

// Mount public routes first (no authentication required for development)
router.use('/scales', scalesPublicRoutes);

// Mount assessment routes
router.use('/assessments', assessmentRoutes);

// Mount assessment completion routes (autoguardado system)
router.use('/assessments', assessmentCompletionRoutes);

// Mount remote assessments routes (evaluaciones remotas via tokens)
router.use('/remote-assessments', remoteAssessmentsRoutes);

// Mount clinical assessment routes (clinical workflow extension) 
router.use('/clinical-assessments', clinicalAssessmentRoutes);
// Note: scales route is mounted above for public access
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