/**
 * Formx Submissions Routes
 * 
 * Manages form submission collection and analysis.
 * Handles submission retrieval, export, and patient data integration.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * GET /api/formx/submissions/form/:formId
 * Get all submissions for a specific form
 */
router.get('/form/:formId', [
  param('formId').isUUID().withMessage('Invalid form ID format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('Invalid patient ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { formId } = req.params;
    const { page = 1, limit = 20, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify form exists
    const form = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id: formId },
        select: { id: true, title: true, category: true }
      }),
      `checkForm(${formId})`
    );

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const where = {
      formId,
      ...(patientId && { patientId })
    };

    const [submissions, totalCount] = await executeTransaction([
      (prisma) => prisma.formSubmission.findMany({
        where,
        include: {
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          },
          form: {
            select: { 
              id: true,
              title: true, 
              category: true 
            }
          },
          responses: {
            include: {
              field: {
                select: { label: true, type: true }
              }
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { submittedAt: 'desc' }
      }),
      (prisma) => prisma.formSubmission.count({ where })
    ], 'getFormSubmissions');

    res.json({
      success: true,
      data: submissions,
      form: {
        id: form.id,
        title: form.title,
        category: form.category
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get form submissions', { 
      error: error.message,
      formId: req.params.formId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve form submissions', 
      details: error.message 
    });
  }
});

/**
 * GET /api/formx/submissions/patient/:patientId
 * Get all submissions for a specific patient
 */
router.get('/patient/:patientId', [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { patientId } = req.params;
    const { page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true }
      }),
      `checkPatient(${patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const where = {
      patientId,
      ...(category && {
        form: { category }
      })
    };

    const [submissions, totalCount] = await executeTransaction([
      (prisma) => prisma.formSubmission.findMany({
        where,
        include: {
          form: {
            select: { 
              id: true,
              title: true, 
              category: true 
            }
          },
          responses: {
            include: {
              field: {
                select: { label: true, type: true }
              }
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { submittedAt: 'desc' }
      }),
      (prisma) => prisma.formSubmission.count({ where })
    ], 'getPatientSubmissions');

    res.json({
      success: true,
      data: submissions,
      patient: {
        id: patient.id,
        medicalRecordNumber: patient.medicalRecordNumber,
        fullName: `${patient.firstName} ${patient.lastName}`
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get patient submissions', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve patient submissions', 
      details: error.message 
    });
  }
});

/**
 * POST /api/formx/submissions
 * Create new form submission
 */
router.post('/', [
  body('formId').isUUID().withMessage('Invalid form ID format'),
  body('patientId').optional().isUUID().withMessage('Invalid patient ID format'),
  body('responses').isArray({ min: 1 }).withMessage('Responses must be a non-empty array'),
  body('responses.*.fieldId').isUUID().withMessage('Invalid field ID format'),
  body('responses.*.value').notEmpty().withMessage('Response value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const submissionData = req.body;
    const userId = req.user?.id;

    // Verify form exists and get field requirements
    const form = await executeQuery(
      (prisma) => prisma.form.findUnique({
        where: { id: submissionData.formId },
        include: {
          fields: true
        }
      }),
      `getFormForSubmission(${submissionData.formId})`
    );

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate required fields
    const requiredFields = form.fields.filter(field => field.required);
    const responseFieldIds = submissionData.responses.map(r => r.fieldId);
    const missingRequiredFields = requiredFields.filter(field => 
      !responseFieldIds.includes(field.id)
    );

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields: missingRequiredFields.map(f => f.label)
      });
    }

    // Create submission with responses
    const submission = await executeQuery(
      (prisma) => prisma.formSubmission.create({
        data: {
          formId: submissionData.formId,
          patientId: submissionData.patientId,
          submittedBy: userId,
          submittedAt: new Date(),
          metadata: submissionData.metadata || {},
          responses: {
            create: submissionData.responses.map(response => ({
              fieldId: response.fieldId,
              value: response.value,
              textValue: response.textValue
            }))
          }
        },
        include: {
          form: {
            select: { title: true, category: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          },
          responses: {
            include: {
              field: {
                select: { label: true, type: true }
              }
            }
          }
        }
      }),
      'createFormSubmission'
    );

    // Log submission for compliance
    logger.info('Form submission created', {
      submissionId: submission.id,
      formId: submission.formId,
      formTitle: submission.form.title,
      patientId: submission.patientId,
      responseCount: submission.responses.length,
      submittedBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Form submission created successfully',
      data: submission
    });

  } catch (error) {
    logger.error('Failed to create form submission', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create form submission', 
      details: error.message 
    });
  }
});

/**
 * GET /api/formx/submissions/stats/summary
 * Get form submission statistics
 */
router.get('/stats/summary', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('formId').optional().isUUID().withMessage('Invalid form ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate, formId } = req.query;
    
    const dateFilter = startDate && endDate ? {
      submittedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const where = {
      ...dateFilter,
      ...(formId && { formId })
    };

    const [
      totalSubmissions,
      submissionsByForm,
      submissionsByCategory,
      recentSubmissions
    ] = await executeTransaction([
      // Total submissions
      (prisma) => prisma.formSubmission.count({ where }),
      
      // Submissions by form
      (prisma) => prisma.formSubmission.groupBy({
        by: ['formId'],
        where,
        _count: { formId: true },
        orderBy: { _count: { formId: 'desc' } },
        take: 10
      }),
      
      // Submissions by category
      (prisma) => prisma.formSubmission.groupBy({
        by: ['form'],
        where,
        _count: { formId: true }
      }),
      
      // Recent submissions
      (prisma) => prisma.formSubmission.findMany({
        where,
        include: {
          form: {
            select: { title: true, category: true }
          },
          patient: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 10
      })
    ], 'getSubmissionStats');

    res.json({
      success: true,
      data: {
        totalSubmissions,
        submissionsByForm,
        submissionsByCategory,
        recentSubmissions
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get submission stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve submission statistics', 
      details: error.message 
    });
  }
});

module.exports = router;