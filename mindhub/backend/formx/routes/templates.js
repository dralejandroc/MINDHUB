/**
 * Formx Templates Routes
 * 
 * Manages form templates and pre-built form configurations.
 * Handles template creation, sharing, and importing.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * GET /api/formx/templates
 * Get all form templates
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment']),
  query('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { page = 1, limit = 20, category, isPublic } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      isActive: true,
      ...(category && { category }),
      ...(isPublic !== undefined && { isPublic: isPublic === 'true' })
    };

    const [templates, totalCount] = await executeTransaction([
      (prisma) => prisma.formTemplate.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              usageHistory: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      (prisma) => prisma.formTemplate.count({ where })
    ], 'getFormTemplates');

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get form templates', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve form templates', 
      details: error.message 
    });
  }
});

/**
 * POST /api/formx/templates/:id/use
 * Create a form from a template
 */
router.post('/:id/use', [
  param('id').isUUID().withMessage('Invalid template ID format'),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('customizations').optional().isObject()
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
    const { title, customizations } = req.body;
    const userId = req.user?.id;

    // Get template
    const template = await executeQuery(
      (prisma) => prisma.formTemplate.findUnique({
        where: { id },
        include: {
          templateFields: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      `getTemplate(${id})`
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create form from template
    const form = await executeQuery(
      (prisma) => prisma.form.create({
        data: {
          title,
          description: template.description,
          category: template.category,
          settings: { ...template.settings, ...customizations },
          isActive: true,
          createdBy: userId,
          templateId: template.id,
          fields: {
            create: template.templateFields.map(field => ({
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
          }
        }
      }),
      'createFormFromTemplate'
    );

    // Record template usage
    await executeQuery(
      (prisma) => prisma.templateUsage.create({
        data: {
          templateId: template.id,
          formId: form.id,
          userId
        }
      }),
      'recordTemplateUsage'
    );

    res.status(201).json({
      success: true,
      message: 'Form created from template successfully',
      data: form
    });

  } catch (error) {
    logger.error('Failed to create form from template', { 
      error: error.message,
      templateId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create form from template', 
      details: error.message 
    });
  }
});

module.exports = router;