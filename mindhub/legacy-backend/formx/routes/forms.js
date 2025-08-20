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
 * GET /api/formx/forms
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

    // Build where clause for filtering
    const whereClause = {
      is_active: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    // Clean up undefined values
    Object.keys(whereClause).forEach(key => {
      if (whereClause[key] === undefined) {
        delete whereClause[key];
      }
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get forms with pagination
    const [forms, totalCount] = await Promise.all([
      executeQuery(
        (prisma) => prisma.forms.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            is_active: true,
            created_at: true,
            updated_at: true,
            usage_count: true,
            last_used_at: true,
            version: true
          },
          orderBy: { created_at: 'desc' },
          skip,
          take
        }),
        'getForms'
      ),
      executeQuery(
        (prisma) => prisma.forms.count({ where: whereClause }),
        'getFormsCount'
      )
    ]);

    // Transform data to match expected format
    const transformedForms = forms.map(form => ({
      id: form.id,
      name: form.title,
      description: form.description,
      category: form.category,
      isActive: form.is_active,
      createdAt: form.created_at.toISOString(),
      updatedAt: form.updated_at.toISOString(),
      usageCount: form.usage_count || 0,
      lastUsedAt: form.last_used_at?.toISOString(),
      version: form.version
    }));

    res.json({
      success: true,
      data: transformedForms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
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
 * GET /api/formx/stats
 * Get FormX statistics
 */
router.get('/stats',
  ...middleware.utils.forHub('formx'),
  async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [todayResponses, totalResponses, pendingAssignments] = await Promise.all([
      // Today's responses
      executeQuery(
        (prisma) => prisma.form_submissions.count({
          where: {
            submitted_at: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        'getTodayResponses'
      ),
      
      // Total responses
      executeQuery(
        (prisma) => prisma.form_submissions.count(),
        'getTotalResponses'
      ),
      
      // Pending assignments
      executeQuery(
        (prisma) => prisma.form_assignments.count({
          where: {
            status: 'pending',
            expires_at: {
              gt: new Date()
            }
          }
        }),
        'getPendingAssignments'
      )
    ]);

    res.json({
      success: true,
      data: {
        todayResponses,
        totalResponses,
        pendingAssignments
      }
    });

  } catch (error) {
    logger.error('Failed to get FormX statistics', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve statistics', 
      details: error.message 
    });
  }
});

/**
 * GET /api/formx/forms/:id
 * Get specific form details with configuration
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format')
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
      (prisma) => prisma.forms.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          structure: true,
          settings: true,
          category: true,
          created_by: true,
          created_at: true,
          updated_at: true,
          is_active: true,
          version: true,
          usage_count: true,
          last_used_at: true
        }
      }),
      `getForm(${id})`
    );

    if (!form) {
      return res.status(404).json({ 
        error: 'Form not found' 
      });
    }

    // Parse JSON fields
    const formData = {
      ...form,
      structure: typeof form.structure === 'string' ? JSON.parse(form.structure) : form.structure,
      settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings || {}
    };

    // Log access for compliance
    logger.info('Form details accessed', {
      formId: id,
      formTitle: form.title,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: formData
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
 * POST /api/formx/forms
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

    // Generate unique form ID
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare form structure with fields
    const formStructure = {
      pages: [{
        id: 'page_1', 
        title: 'Formulario',
        fields: formData.fields.map((field, index) => ({
          id: `field_${index + 1}`,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          required: field.required !== undefined ? field.required : false,
          order: field.order !== undefined ? field.order : index + 1,
          validation: field.validation || {},
          options: field.options || [],
          conditionalLogic: field.conditionalLogic || {}
        }))
      }]
    };

    const form = await executeQuery(
      (prisma) => prisma.forms.create({
        data: {
          id: formId,
          title: formData.title,
          description: formData.description,
          structure: JSON.stringify(formStructure),
          settings: JSON.stringify(formData.settings || {}),
          category: formData.category,
          created_by: userId,
          is_active: formData.isActive !== undefined ? formData.isActive : true,
          version: 1,
          usage_count: 0
        }
      }),
      'createForm'
    );

    // Parse structure for response
    const responseData = {
      ...form,
      structure: JSON.parse(form.structure),
      settings: JSON.parse(form.settings)
    };

    // Log creation for compliance
    logger.info('Form created', {
      formId: form.id,
      formTitle: form.title,
      category: form.category,
      fieldCount: responseData.structure.pages[0].fields.length,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: responseData
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
 * PUT /api/formx/forms/:id
 * Update complete form template
 */
router.put('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format'),
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
      (prisma) => prisma.forms.findUnique({
        where: { id },
        select: { id: true, title: true, version: true }
      }),
      `checkForm(${id})`
    );

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Prepare updated form structure
    const formStructure = {
      pages: [{
        id: 'page_1',
        title: 'Formulario',
        fields: updateData.fields.map((field, index) => ({
          id: field.id || `field_${index + 1}`,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          required: field.required !== undefined ? field.required : false,
          order: field.order !== undefined ? field.order : index + 1,
          validation: field.validation || {},
          options: field.options || [],
          conditionalLogic: field.conditionalLogic || {}
        }))
      }]
    };

    // Update form
    const form = await executeQuery(
      (prisma) => prisma.forms.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          structure: JSON.stringify(formStructure),
          settings: JSON.stringify(updateData.settings || {}),
          category: updateData.category,
          is_active: updateData.isActive,
          version: (existingForm.version || 1) + 1,
          updated_at: new Date()
        }
      }),
      `updateForm(${id})`
    );

    // Parse structure for response
    const responseData = {
      ...form,
      structure: JSON.parse(form.structure),
      settings: JSON.parse(form.settings)
    };

    // Log update for compliance
    logger.info('Form updated', {
      formId: id,
      formTitle: existingForm.title,
      updatedBy: userId,
      changes: Object.keys(updateData),
      newVersion: form.version,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: responseData
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
 * DELETE /api/formx/forms/:id
 * Soft delete form template (archive)
 */
router.delete('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'admin'], ['delete:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format'),
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
      (prisma) => prisma.forms.findUnique({
        where: { id },
        select: { id: true, title: true, is_active: true }
      }),
      `checkForm(${id})`
    );

    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!existingForm.is_active) {
      return res.status(400).json({ error: 'Form is already inactive' });
    }

    // Soft delete (set is_active to false)
    await executeQuery(
      (prisma) => prisma.forms.update({
        where: { id },
        data: { 
          is_active: false,
          updated_at: new Date()
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
 * POST /api/formx/forms/:id/submit
 * Submit form response with validation
 */
router.post('/:id/submit',
  ...middleware.presets.public,
  [
  param('id').isString().withMessage('Invalid form ID format'),
  body('responses').isObject().withMessage('Responses are required'),
  body('submitterName').optional().trim().isLength({ max: 255 }),
  body('submitterEmail').optional().isEmail(),
  body('assignmentId').optional().isString()
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
    const { responses, submitterName, submitterEmail, signature, assignmentId } = req.body;

    // Check if form exists and is active
    const form = await executeQuery(
      (prisma) => prisma.forms.findUnique({
        where: { id },
        select: { 
          id: true, 
          title: true, 
          is_active: true,
          structure: true,
          settings: true
        }
      }),
      `getFormForSubmission(${id})`
    );

    if (!form || !form.is_active) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Parse form structure to validate responses
    const structure = typeof form.structure === 'string' ? JSON.parse(form.structure) : form.structure;
    const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;

    // Basic validation - check required fields
    const requiredFields = [];
    structure.pages.forEach(page => {
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

    // Generate submission ID
    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create submission
    const submission = await executeQuery(
      (prisma) => prisma.form_submissions.create({
        data: {
          id: submissionId,
          assignment_id: assignmentId || null,
          form_id: id,
          patient_id: req.user?.patientId || null,
          responses: responses,
          submitted_at: new Date(),
          submission_time_seconds: null,
          completion_percentage: 100,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          signature_data: signature
        }
      }),
      'createFormSubmission'
    );

    // Update form usage count
    await executeQuery(
      (prisma) => prisma.forms.update({
        where: { id },
        data: {
          usage_count: { increment: 1 },
          last_used_at: new Date()
        }
      }),
      'updateFormUsage'
    );

    // Update assignment status if provided
    if (assignmentId) {
      await executeQuery(
        (prisma) => prisma.form_assignments.update({
          where: { id: assignmentId },
          data: {
            status: 'completed',
            completed_at: new Date(),
            completion_percentage: 100
          }
        }),
        'updateAssignmentStatus'
      ).catch(err => {
        // Log but don't fail the submission if assignment update fails
        logger.warn('Failed to update assignment status', {
          assignmentId,
          error: err.message
        });
      });
    }

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
 * POST /api/formx/forms/:id/duplicate
 * Create a copy of an existing form
 */
router.post('/:id/duplicate',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format'),
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
      (prisma) => prisma.forms.findUnique({
        where: { id }
      }),
      `getFormForDuplication(${id})`
    );

    if (!originalForm) {
      return res.status(404).json({ error: 'Original form not found' });
    }

    // Generate new form ID
    const duplicateFormId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create duplicate
    const duplicateForm = await executeQuery(
      (prisma) => prisma.forms.create({
        data: {
          id: duplicateFormId,
          title: title || `${originalForm.title} (Copy)`,
          description: originalForm.description,
          structure: originalForm.structure,
          settings: originalForm.settings,
          category: originalForm.category,
          is_active: true,
          created_by: userId,
          version: 1,
          usage_count: 0
        }
      }),
      'duplicateForm'
    );

    // Parse structure for response
    const responseData = {
      ...duplicateForm,
      structure: JSON.parse(duplicateForm.structure),
      settings: JSON.parse(duplicateForm.settings)
    };

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
      data: responseData
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
 * POST /api/formx/forms/:id/assign
 * Assign form to patient(s)
 */
router.post('/:id/assign',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format'),
  body('patientIds').isArray().withMessage('Patient IDs must be an array'),
  body('patientIds.*').isString().withMessage('Each patient ID must be a string'),
  body('expiresInDays').optional().isInt({ min: 1, max: 90 }).withMessage('Expiration must be between 1 and 90 days'),
  body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must not exceed 1000 characters'),
  body('maxReminders').optional().isInt({ min: 0, max: 10 }).withMessage('Max reminders must be between 0 and 10')
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
    const { 
      patientIds, 
      expiresInDays = 7, 
      message, 
      maxReminders = 3 
    } = req.body;
    const userId = req.user?.id;

    // Check if form exists
    const form = await executeQuery(
      (prisma) => prisma.forms.findUnique({
        where: { id },
        select: { id: true, title: true, is_active: true }
      }),
      `checkFormForAssignment(${id})`
    );

    if (!form || !form.is_active) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Generate assignments
    const assignments = patientIds.map(patientId => {
      const token = require('crypto').randomBytes(32).toString('hex');
      const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${patientId}`;
      
      return {
        id: assignmentId,
        form_id: id,
        patient_id: patientId,
        token,
        assigned_by: userId,
        assigned_at: new Date(),
        expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        status: 'pending',
        message: message || null,
        reminders_sent: 0,
        max_reminders: maxReminders,
        completion_percentage: 0
      };
    });

    // Create assignments in batch
    const createdAssignments = await executeQuery(
      (prisma) => prisma.form_assignments.createMany({
        data: assignments,
        skipDuplicates: true
      }),
      'createFormAssignments'
    );

    // Log assignments
    logger.info('Form assigned to patients', {
      formId: id,
      formTitle: form.title,
      patientCount: patientIds.length,
      assignedBy: userId,
      expiresInDays,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Form assigned to ${patientIds.length} patient(s) successfully`,
      data: {
        formId: id,
        assignmentCount: createdAssignments.count,
        expiresAt: assignments[0].expiresAt
      }
    });

  } catch (error) {
    logger.error('Failed to assign form', { 
      error: error.message,
      formId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to assign form', 
      details: error.message 
    });
  }
});

/**
 * GET /api/formx/forms/:id/assignments
 * Get form assignments for a specific form
 */
router.get('/:id/assignments',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
  param('id').isString().withMessage('Invalid form ID format'),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'expired']),
  query('patientId').optional().isString()
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
    const { status, patientId } = req.query;

    const whereClause = { form_id: id };
    if (status) whereClause.status = status;
    if (patientId) whereClause.patient_id = patientId;

    const assignments = await executeQuery(
      (prisma) => prisma.form_assignments.findMany({
        where: whereClause,
        select: {
          id: true,
          patient_id: true,
          token: true,
          assigned_at: true,
          expires_at: true,
          status: true,
          completion_percentage: true,
          completed_at: true,
          message: true,
          reminders_sent: true,
          max_reminders: true
        },
        orderBy: { assigned_at: 'desc' }
      }),
      `getFormAssignments(${id})`
    );

    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });

  } catch (error) {
    logger.error('Failed to get form assignments', { 
      error: error.message,
      formId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve form assignments', 
      details: error.message 
    });
  }
});

/**
 * GET /api/formx/forms/category/:category
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
      (prisma) => prisma.forms.findMany({
        where: { 
          category,
          is_active: true 
        },
        select: {
          id: true,
          title: true,
          description: true,
          created_at: true,
          updated_at: true,
          usage_count: true,
          last_used_at: true
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