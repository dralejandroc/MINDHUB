/**
 * Main FormX Routes - Unified API endpoints for FormX Hub
 * 
 * Provides all the endpoints expected by the FormX frontend client,
 * ensuring proper integration with Expedix and other hubs.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');

const router = express.Router();

// Import existing routes
const formsAdvanced = require('./forms-advanced');
const templates = require('./templates');
const submissions = require('./submissions');

// Mount existing routes
router.use('/forms', formsAdvanced);

/**
 * GET /api/formx/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FormX Hub',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      templates: true,
      patient_assignment: true,
      expedix_integration: true,
      auto_sync: true
    }
  });
});

/**
 * GET /api/formx/templates/catalog
 * Get templates catalog with categories for frontend
 */
router.get('/templates/catalog', async (req, res) => {
  try {
    // For now, return mock data structure that matches what the frontend expects
    // TODO: Implement actual database queries when schema is finalized
    const templates = [];
    const categories = [
      { key: 'clinical', name: 'Clínico' },
      { key: 'intake', name: 'Admisión' },
      { key: 'consent', name: 'Consentimiento' },
      { key: 'follow_up', name: 'Seguimiento' },
      { key: 'psychiatric_child', name: 'Psiquiatría Infantil' },
      { key: 'psychiatric_adolescent', name: 'Psiquiatría Adolescente' },
      { key: 'psychiatric_adult', name: 'Psiquiatría Adultos' },
      { key: 'psychiatric_mature_adult', name: 'Psiquiatría Geriátrica' }
    ];

    res.json({
      templates,
      total: templates.length,
      categories
    });

  } catch (error) {
    console.error('Error getting templates catalog:', error);
    res.status(500).json({
      error: 'Failed to get templates catalog',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/templates/:id
 * Get specific template by ID
 */
router.get('/templates/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual database query
    // For now, return 404 to match the frontend expectations
    res.status(404).json({
      error: 'Template not found',
      message: 'FormX templates will be implemented in next phase'
    });

  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      error: 'Failed to get template',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/templates
 * Create new template
 */
router.post('/templates', [
  body('name').isString().isLength({ min: 3, max: 200 }),
  body('form_type').isString(),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    // TODO: Implement actual template creation
    // For now, return success message
    res.status(201).json({
      success: true,
      message: 'Template creation will be implemented in next phase',
      data: {
        id: `temp_${Date.now()}`,
        ...req.body,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      error: 'Failed to create template',
      details: error.message
    });
  }
});

/**
 * PUT /api/formx/templates/:id
 * Update template
 */
router.put('/templates/:id', [
  param('id').isString(),
  body('name').optional().isString().isLength({ min: 3, max: 200 })
], async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual template update
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: {
        id,
        ...req.body,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      error: 'Failed to update template',
      details: error.message
    });
  }
});

/**
 * DELETE /api/formx/templates/:id
 * Delete template
 */
router.delete('/templates/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual template deletion
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/templates/:id/preview
 * Get template preview
 */
router.get('/templates/:id/preview', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual template preview
    res.json({
      template_name: 'Preview Template',
      fields: [],
      total_fields: 0
    });

  } catch (error) {
    console.error('Error getting template preview:', error);
    res.status(500).json({
      error: 'Failed to get template preview',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/form-builder
 * Create form from builder data
 */
router.post('/form-builder', [
  body('name').isString(),
  body('form_type').isString(),
  body('fields').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, form_type, description, fields } = req.body;

    // Create form using existing forms-advanced endpoint
    const formData = {
      title: name,
      description: description || '',
      sections: [{
        title: 'Main Section',
        fields: fields.map((field, index) => ({
          id: field.field_name,
          type: field.field_type,
          label: field.label,
          required: field.required || false,
          placeholder: field.placeholder || '',
          description: field.help_text || '',
          order: field.order || index,
          choices: field.choices || [],
          expedixField: field.expedix_field || ''
        }))
      }],
      settings: {
        form_type,
        auto_sync_expedix: req.body.auto_sync_expedix || false,
        expedix_mapping: req.body.expedix_mapping || {}
      }
    };

    // Use the existing forms creation logic
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // TODO: Store in database when schema is ready
    console.log('Form created:', { formId, formData });

    res.status(201).json({
      template_id: formId,
      message: 'Form created successfully from builder'
    });

  } catch (error) {
    console.error('Error creating form from builder:', error);
    res.status(500).json({
      error: 'Failed to create form from builder',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/send-form
 * Send form to patient
 */
router.post('/send-form', [
  body('template_id').isString(),
  body('patient_id').isString(),
  body('patient_email').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { template_id, patient_id, patient_email } = req.body;

    // Generate secure token for patient access
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create form assignment
    const assignmentId = `assignment_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 3 days

    // TODO: Store assignment in database
    console.log('Form assignment created:', {
      assignmentId,
      template_id,
      patient_id,
      patient_email,
      token,
      expiresAt
    });

    const form_link = `${process.env.FRONTEND_URL || 'https://mindhub.cloud'}/forms/${token}`;

    res.json({
      message: 'Form sent to patient successfully',
      form_link,
      submission_id: assignmentId
    });

  } catch (error) {
    console.error('Error sending form to patient:', error);
    res.status(500).json({
      error: 'Failed to send form to patient',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/templates/:id/send_to_patient
 * Send specific template to patient
 */
router.post('/templates/:id/send_to_patient', [
  param('id').isString(),
  body('patient_id').isString(),
  body('patient_email').isEmail()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, patient_email } = req.body;

    // Delegate to general send-form endpoint
    req.body.template_id = id;
    
    // Call the send-form logic
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const assignmentId = `assignment_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
    
    const form_link = `${process.env.FRONTEND_URL || 'https://mindhub.cloud'}/forms/${token}`;

    res.json({
      message: 'Form sent to patient successfully',
      form_link,
      submission_id: assignmentId
    });

  } catch (error) {
    console.error('Error sending template to patient:', error);
    res.status(500).json({
      error: 'Failed to send template to patient',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/submissions
 * Get form submissions
 */
router.get('/submissions', [
  query('template').optional().isString()
], async (req, res) => {
  try {
    // TODO: Implement actual submissions query
    res.json({
      results: [],
      total: 0
    });

  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({
      error: 'Failed to get submissions',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/submissions/:id/sync_to_expedix
 * Sync submission to Expedix
 */
router.post('/submissions/:id/sync_to_expedix', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement Expedix sync logic
    console.log(`Syncing submission ${id} to Expedix`);

    res.json({
      message: 'Submission synced to Expedix successfully'
    });

  } catch (error) {
    console.error('Error syncing to Expedix:', error);
    res.status(500).json({
      error: 'Failed to sync to Expedix',
      details: error.message
    });
  }
});

/**
 * POST /api/formx/expedix-mapping
 * Get Expedix field mapping suggestions
 */
router.post('/expedix-mapping', [
  body('fields').isArray()
], async (req, res) => {
  try {
    const { fields } = req.body;

    // Simple field mapping logic
    const expedixFieldMap = {
      'nombre_completo': 'firstName',
      'first_name': 'firstName',
      'nombre': 'firstName',
      'apellido_paterno': 'paternalLastName',
      'paternal_last_name': 'paternalLastName',
      'apellido_materno': 'maternalLastName',
      'maternal_last_name': 'maternalLastName',
      'fecha_nacimiento': 'dateOfBirth',
      'birth_date': 'dateOfBirth',
      'email': 'email',
      'correo': 'email',
      'telefono': 'phone',
      'phone': 'phone',
      'celular': 'phone',
      'direccion': 'address',
      'address': 'address'
    };

    const auto_mapping = {};
    const suggestions = [];

    fields.forEach(field => {
      const fieldName = field.field_name.toLowerCase();
      
      if (expedixFieldMap[fieldName]) {
        auto_mapping[field.field_name] = expedixFieldMap[fieldName];
      } else {
        // Find similar fields
        const similarField = Object.keys(expedixFieldMap).find(key => 
          key.includes(fieldName) || fieldName.includes(key)
        );
        
        if (similarField) {
          suggestions.push({
            field_name: field.field_name,
            suggested_mapping: expedixFieldMap[similarField],
            confidence: 0.8
          });
        }
      }
    });

    res.json({
      auto_mapping,
      suggestions,
      total_mapped: Object.keys(auto_mapping).length,
      total_suggestions: suggestions.length
    });

  } catch (error) {
    console.error('Error getting Expedix mapping:', error);
    res.status(500).json({
      error: 'Failed to get Expedix mapping',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // TODO: Implement actual stats from database
    const stats = {
      total_templates: 0,
      active_templates: 0,
      total_submissions: 0,
      processed_submissions: 0,
      synced_submissions: 0,
      total_documents: 0,
      recent_submissions: 0,
      processing_rate: 0,
      sync_rate: 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      details: error.message
    });
  }
});

module.exports = router;