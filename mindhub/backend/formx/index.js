/**
 * Formx Hub - Form Builder System
 * 
 * Main router for the Formx form building and management hub.
 * Handles routing and middleware for all form-related operations.
 */

const express = require('express');
const { checkPermissions, requireAuth } = require('../shared/middleware/auth');
const { logger } = require('../shared/config/storage');

const router = express.Router();

// Import route modules
const formsRoutes = require('./routes/forms');
const templatesRoutes = require('./routes/templates');
const submissionsRoutes = require('./routes/submissions');

// Hub information endpoint
router.get('/', (req, res) => {
  res.json({
    hub: 'Formx',
    description: 'Form Builder System',
    version: '1.0.0',
    features: [
      'Drag-and-drop Form Builder Interface',
      'PDF and JotForm Import Capabilities', 
      'Custom Field Types and Validation',
      'Automated Email Delivery and Collection',
      'Pre/Post-consultation Questionnaires',
      'Patient Intake Forms and Surveys'
    ],
    endpoints: {
      forms: '/api/formx/forms',
      templates: '/api/formx/templates',
      submissions: '/api/formx/submissions'
    },
    fieldTypes: [
      'text', 'textarea', 'number', 'email', 'phone', 'date', 'time',
      'select', 'radio', 'checkbox', 'scale', 'file_upload', 'signature',
      'matrix', 'likert_scale', 'conditional_logic'
    ],
    integrations: {
      emailProviders: ['sendgrid', 'mailgun', 'ses'],
      importFormats: ['pdf', 'jotform', 'typeform', 'google_forms']
    }
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      hub: 'Formx',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'active',
        logging: 'operational',
        form_builder: 'active',
        email_service: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      hub: 'Formx',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// Apply permission checks for different resource types
router.use('/forms', checkPermissions(['read:forms']));
router.use('/templates', checkPermissions(['read:forms']));
router.use('/submissions', checkPermissions(['read:forms']));

// Mount route modules
router.use('/forms', formsRoutes);
router.use('/templates', templatesRoutes);
router.use('/submissions', submissionsRoutes);

// Hub-specific error handler
router.use((error, req, res, next) => {
  logger.error('Formx hub error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip
  });

  // Check if error is related to form data access
  if (error.message.includes('Form not found') || error.message.includes('Template not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested form resource was not found or you do not have access to it.',
      hub: 'Formx'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An error occurred while processing your form request.',
    hub: 'Formx',
    ...(process.env.NODE_ENV !== 'production' && { 
      details: error.message 
    })
  });
});

module.exports = router;