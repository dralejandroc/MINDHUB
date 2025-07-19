/**
 * Forms Management API Routes for Formx Hub
 * 
 * Comprehensive form management endpoints with dynamic form building,
 * conditional logic, validation, and submission handling
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const AuditLogger = require('../../shared/utils/audit-logger');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

// Initialize utilities
const auditLogger = new AuditLogger();

// Validation middleware for forms
const validateForm = [
  body('title').isString().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('category').isString().isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment']).withMessage('Invalid category'),
  body('fields').isArray().withMessage('Fields must be an array'),
  body('fields.*.type').isString().withMessage('Field type is required'),
  body('fields.*.label').isString().withMessage('Field label is required'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  body('isActive').optional().isBoolean()
];

/**
 * GET /api/v1/formx/forms
 * List forms with filtering, pagination, and search
 */
router.get('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('category').optional().trim(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      search,
      category,
      isActive = true
    } = req.query;

    // Simple implementation for now
    const forms = [
      {
        id: '1',
        name: 'Patient Intake Form',
        description: 'Initial patient information collection form',
        category: 'intake',
        isActive: true,
        createdAt: new Date().toISOString(),
        estimatedDuration: 15
      },
      {
        id: '2',
        name: 'Pre-consultation Questionnaire',
        description: 'Questions to complete before consultation',
        category: 'pre-consultation',
        isActive: true,
        createdAt: new Date().toISOString(),
        estimatedDuration: 10
      }
    ];

    // Apply basic filtering
    let filteredForms = forms;
    if (search) {
      filteredForms = forms.filter(form => 
        form.name.toLowerCase().includes(search.toLowerCase()) ||
        form.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredForms = filteredForms.filter(form => form.category === category);
    }

    res.json({
      success: true,
      data: filteredForms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredForms.length,
        pages: Math.ceil(filteredForms.length / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get forms', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Forms retrieval failed',
      message: 'An error occurred while retrieving forms'
    });
  }
});

/**
 * GET /api/v1/formx/forms/:id
 * Get specific form details with configuration
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:forms']),
  [
  param('id').isUUID().withMessage('Invalid form ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    
    const form = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      }),
      `getForm(${id})`
    );

    if (!form) {
      return res.status(404).json({ 
        error: 'Form not found' 
      });
    }

    // Log access for compliance
    logger.info('Form details accessed', {
      formId: id,
      formTitle: form.title,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    logger.error('Failed to get form', { 
      error: error.message,
      formId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve form', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/formx/forms
 * Create a new form template
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  validateForm,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const formData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Process fields and assign order if not provided
    const fieldsWithOrder = formData.fields.map((field, index) => ({
      ...field,
      order: field.order !== undefined ? field.order : index + 1
    }));

    const form = await executeQuery(
      (prisma) => prisma.form.create({
        data: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          settings: formData.settings || {},
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          createdBy: userId,
          fields: {
            create: fieldsWithOrder.map(field => ({
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              required: field.required,
              order: field.order,
              validation: field.validation || {},
              options: field.options || [],
              conditionalLogic: field.conditionalLogic || {}
            }))
          }
        },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      'createForm'
    );

    // Log creation for compliance
    logger.info('Form created', {
      formId: form.id,
      formTitle: form.title,
      category: form.category,
      fieldCount: form.fields.length,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: form
    });

  } catch (error) {
    logger.error('Failed to create form', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create form', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/v1/formx/forms/:id
 * Update complete form template
 */
router.put('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
  param('id').isUUID().withMessage('Invalid form ID format'),
  ...validateForm
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    // Check if form exists
    const existingForm = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id },
        select: { id: true, title: true }
      }),
      `checkForm(${id})`
    );

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Process fields and assign order if not provided
    const fieldsWithOrder = updateData.fields.map((field, index) => ({
      ...field,
      order: field.order !== undefined ? field.order : index + 1
    }));

    // Update form using transaction to handle field updates
    const form = await executeQuery(
      (prisma) => prisma.form.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          category: updateData.category,
          settings: updateData.settings || {},
          isActive: updateData.isActive,
          updatedAt: new Date(),
          fields: {
            deleteMany: {}, // Delete existing fields
            create: fieldsWithOrder.map(field => ({
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              required: field.required,
              order: field.order,
              validation: field.validation || {},
              options: field.options || [],
              conditionalLogic: field.conditionalLogic || {}
            }))
          }
        },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      `updateForm(${id})`
    );

    // Log update for compliance
    logger.info('Form updated', {
      formId: id,
      formTitle: existingForm.title,
      updatedBy: userId,
      changes: Object.keys(updateData),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: form
    });

  } catch (error) {
    logger.error('Failed to update form', { 
      error: error.message,
      formId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update form', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/v1/formx/forms/:id
 * Soft delete form template (archive)
 */
router.delete('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'admin'], ['delete:forms']),
  [
  param('id').isUUID().withMessage('Invalid form ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    // Check if form exists
    const existingForm = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id },
        select: { id: true, title: true, isActive: true }
      }),
      `checkForm(${id})`
    );

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!existingForm.isActive) {
      return res.status(400).json({ error: 'Form is already inactive' });
    }

    // Soft delete (set isActive to false)
    await executeQuery(
      (prisma) => prisma.form.update({
        where: { id },
        data: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: userId
        }
      }),
      `deactivateForm(${id})`
    );

    // Log deletion for compliance
    logger.warn('Form deactivated', {
      formId: id,
      formTitle: existingForm.title,
      deactivatedBy: userId,
      reason,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Form deactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to deactivate form', { 
      error: error.message,
      formId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to deactivate form', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/formx/forms/:id/submit
 * Submit form response with validation
 */
router.post('/:id/submit',
  ...middleware.presets.public,
  [
  param('id').isUUID().withMessage('Invalid form ID format'),
  body('responses').isObject().withMessage('Responses are required'),
  body('submitterName').optional().trim().isLength({ max: 255 }),
  body('submitterEmail').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { responses, submitterName, submitterEmail, signature } = req.body;

    // Check if form exists and is active
    const form = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id },
        select: { 
          id: true, 
          title: true, 
          isActive: true,
          definition: true,
          settings: true
        }
      }),
      `getFormForSubmission(${id})`
    );

    if (!form || !form.isActive) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Parse form definition to validate responses
    const definition = typeof form.definition === 'string' ? JSON.parse(form.definition) : form.definition;
    const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;

    // Basic validation - check required fields
    const requiredFields = [];
    definition.pages.forEach(page => {
      page.fields.forEach(field => {
        if (field.required && field.type !== 'section_header' && field.type !== 'info_text') {
          requiredFields.push(field.id);
        }
      });
    });

    const missingFields = requiredFields.filter(fieldId => !responses[fieldId]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: `Required fields missing: ${missingFields.join(', ')}`
      });
    }

    // Create submission
    const submission = await executeQuery(
      (prisma) => prisma.formSubmission.create({
        data: {
          formId: id,
          responseData: JSON.stringify(responses),
          submitterName,
          submitterEmail,
          signature,
          submittedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }),
      'createFormSubmission'
    );

    logger.info('Form submitted', {
      formId: id,
      submissionId: submission.id,
      submitterEmail,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: settings.thankYouMessage || 'Formulario enviado exitosamente',
      submissionId: submission.id
    });

  } catch (error) {
    logger.error('Failed to submit form', { 
      error: error.message,
      formId: req.params.id,
      ipAddress: req.ip
    });
    res.status(500).json({ 
      error: 'Failed to submit form', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/formx/forms/:id/duplicate
 * Create a copy of an existing form
 */
router.post('/:id/duplicate',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
  param('id').isUUID().withMessage('Invalid form ID format'),
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user?.id;

    // Get original form
    const originalForm = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      `getFormForDuplication(${id})`
    );

    if (!originalForm) {
      return res.status(404).json({ error: 'Original form not found' });
    }

    // Create duplicate
    const duplicateForm = await executeQuery(
      (prisma) => prisma.form.create({
        data: {
          title: title || `${originalForm.title} (Copy)`,
          description: originalForm.description,
          category: originalForm.category,
          settings: originalForm.settings,
          isActive: true,
          createdBy: userId,
          fields: {
            create: originalForm.fields.map(field => ({
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              required: field.required,
              order: field.order,
              validation: field.validation,
              options: field.options,
              conditionalLogic: field.conditionalLogic
            }))
          }
        },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      'duplicateForm'
    );

    // Log duplication
    logger.info('Form duplicated', {
      originalFormId: id,
      duplicateFormId: duplicateForm.id,
      duplicateTitle: duplicateForm.title,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Form duplicated successfully',
      data: duplicateForm
    });

  } catch (error) {
    logger.error('Failed to duplicate form', { 
      error: error.message,
      originalFormId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to duplicate form', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/formx/forms/category/:category
 * Get forms by category
 */
router.get('/category/:category',
  ...middleware.utils.forHub('formx'),
  [
  param('category').isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { category } = req.params;
    
    const forms = await executeQuery(
      (prisma) => prisma.form.findMany({
        where: { 
          category,
          isActive: true 
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: { title: 'asc' }
      }),
      `getFormsByCategory(${category})`
    );

    res.json({
      success: true,
      data: forms,
      category,
      count: forms.length
    });

  } catch (error) {
    logger.error('Failed to get forms by category', { 
      error: error.message,
      category: req.params.category,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve forms by category', 
      details: error.message 
    });
  }
});

module.exports = router;