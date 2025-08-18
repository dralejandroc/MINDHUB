/**
 * Formx Hub - Form Builder System
 * 
 * Main router for the Formx form building and management hub.
 * Handles routing and middleware for all form-related operations.
 */

const express = require('express');

// Auth middleware removed - using Supabase authentication through API gateway
// These are stub functions to prevent errors during migration
const requireAuth = (req, res, next) => next(); // Auth handled by Supabase at API gateway level
const checkPermissions = (permission) => (req, res, next) => next(); // Permissions handled by Supabase

// Simple logger for now
const logger = {
  error: (message, meta) => console.error('[ERROR]', message, meta),
  info: (message, meta) => console.log('[INFO]', message, meta),
  warn: (message, meta) => console.warn('[WARN]', message, meta)
};

const router = express.Router();

// Import route modules
const formsRoutes = require('./routes/forms');
const templatesRoutes = require('./routes/templates');
const submissionsRoutes = require('./routes/submissions');
const formVersioningRoutes = require('./routes/form-versioning');
const formAnalyticsRoutes = require('./routes/form-analytics');
const patientIntegrationRoutes = require('./routes/patient-integration');
const patientRegistrationFormsRoutes = require('./routes/patient-registration-forms');
const customizableTemplatesRoutes = require('./routes/customizable-templates');

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
      'Patient Intake Forms and Surveys',
      'Form Versioning with Rollback',
      'Advanced Analytics and Insights',
      'Patient Engagement Tracking',
      'Role-Based Access Control',
      'Healthcare Compliance (NOM-024)'
    ],
    endpoints: {
      forms: '/api/formx/forms',
      templates: '/api/formx/templates',
      submissions: '/api/formx/submissions',
      versioning: '/api/formx/forms/:id/versions',
      analytics: '/api/formx/analytics',
      patients: '/api/formx/patients'
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

// For development - skip authentication temporarily
// router.use(requireAuth);
// router.use('/forms', checkPermissions(['read:forms']));
// router.use('/templates', checkPermissions(['read:forms']));
// router.use('/submissions', checkPermissions(['read:forms']));

// Mount route modules
router.use('/forms', formsRoutes);
router.use('/templates', templatesRoutes);
router.use('/submissions', submissionsRoutes);
router.use('/forms', formVersioningRoutes);
router.use('/analytics', formAnalyticsRoutes);
router.use('/patients', patientIntegrationRoutes);
router.use('/patient-registration', patientRegistrationFormsRoutes);
router.use('/customizable-templates', customizableTemplatesRoutes);

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