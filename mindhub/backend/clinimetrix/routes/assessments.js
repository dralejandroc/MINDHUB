/**
 * Clinical Assessments API Routes for Clinimetrix Hub
 * 
 * Comprehensive clinical assessment endpoints with psychological scales,
 * scoring algorithms, and professional validation workflows
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const AssessmentController = require('../controllers/assessment-controller');
const ScoringEngine = require('../utils/scoring-engine');
const AuditLogger = require('../../shared/utils/audit-logger');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const crypto = require('crypto');

const router = express.Router();

// Initialize controllers and utilities
const assessmentController = new AssessmentController();
const scoringEngine = new ScoringEngine();
const auditLogger = new AuditLogger();

/**
 * Validation middleware for assessment creation
 */
const validateAssessment = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('scaleId')
    .isUUID()
    .withMessage('Invalid scale ID format'),
  
  body('administrationType')
    .isIn(['self_administered', 'hetero_administered', 'remote_tokenized'])
    .withMessage('Invalid administration type'),
  
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Responses must be a non-empty array'),
  
  body('responses.*.itemId')
    .isUUID()
    .withMessage('Invalid item ID format'),
  
  body('responses.*.value')
    .notEmpty()
    .withMessage('Response value is required'),
  
  body('administrationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid administration date format')
];

/**
 * GET /api/v1/clinimetrix/assessments
 * List clinical assessments with filtering and pagination
 */
router.get('/',
  ...middleware.utils.forHub('clinimetrix'),
  query('page').optional().isInt({ min: 1, max: 1000 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('patient_id').optional().isUUID(4),
  query('scale_type').optional().isIn(['depression', 'anxiety', 'cognitive', 'personality', 'substance_use', 'trauma']),
  query('status').optional().isIn(['draft', 'in_progress', 'completed', 'reviewed', 'cancelled']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('administered_by').optional().isUUID(4),
  query('severity').optional().isIn(['minimal', 'mild', 'moderate', 'severe', 'very_severe']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Assessment validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id']
          }
        });
      }

      const result = await assessmentController.listAssessments(req.query, req.user);
      
      res.status(200).json({
        data: result.assessments,
        meta: {
          pagination: result.pagination,
          total: result.total,
          filters: req.query,
          summary: result.summary
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'ASSESSMENT_LIST_ERROR',
          message: 'Failed to retrieve assessments',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        }
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/patients/:patient_id/assessments
 * Get all assessments for a specific patient
 */
router.get('/patients/:patient_id/assessments',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('scaleId').optional().isUUID().withMessage('Invalid scale ID format')
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
    const { page = 1, limit = 20, scaleId } = req.query;
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
      ...(scaleId && { scaleId })
    };

    const [assessments, totalCount] = await executeTransaction([
      (prisma) => prisma.scaleAdministration.findMany({
        where,
        include: {
          scale: {
            select: { 
              id: true, 
              name: true, 
              abbreviation: true, 
              category: true 
            }
          },
          administrator: {
            select: { id: true, name: true, email: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { administrationDate: 'desc' }
      }),
      (prisma) => prisma.scaleAdministration.count({ where })
    ], 'getPatientAssessments');

    // Log access for compliance
    logger.info('Patient assessments accessed', {
      patientId,
      assessmentCount: assessments.length,
      scaleId,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: assessments,
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
    logger.error('Failed to get patient assessments', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve assessments', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/clinimetrix/assessments/:id
 * Get specific assessment details
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
  param('id').isUUID().withMessage('Invalid assessment ID format')
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
    
    const assessment = await executeQuery(
      (prisma) => prisma.scaleAdministration.findUnique({
        where: { id },
        include: {
          scale: {
            include: {
              scaleItems: {
                orderBy: { itemOrder: 'asc' }
              },
              interpretationRules: {
                orderBy: { minScore: 'asc' }
              }
            }
          },
          responses: {
            include: {
              scaleItem: true
            },
            orderBy: { scaleItem: { itemOrder: 'asc' } }
          },
          administrator: {
            select: { id: true, name: true, email: true }
          },
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      `getAssessment(${id})`
    );

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get interpretation for the score
    const interpretation = assessment.scale.interpretationRules.find(rule =>
      assessment.totalScore >= rule.minScore && assessment.totalScore <= rule.maxScore
    );

    // Log access for compliance
    logger.info('Assessment accessed', {
      assessmentId: id,
      patientId: assessment.patientId,
      scaleId: assessment.scaleId,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        ...assessment,
        interpretation
      }
    });

  } catch (error) {
    logger.error('Failed to get assessment', { 
      error: error.message,
      assessmentId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve assessment', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/clinimetrix/assessments
 * Create a new clinical assessment
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  validateAssessment,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const assessmentData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify patient and scale exist
    const [patient, scale] = await executeTransaction([
      (prisma) => prisma.patient.findUnique({
        where: { id: assessmentData.patientId },
        select: { id: true, medicalRecordNumber: true }
      }),
      (prisma) => prisma.scale.findUnique({
        where: { id: assessmentData.scaleId },
        include: {
          scaleItems: true,
          scoringRules: true
        }
      })
    ], 'verifyAssessmentData');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!scale) {
      return res.status(404).json({ error: 'Scale not found' });
    }

    // Validate responses match scale items
    const scaleItemIds = scale.scaleItems.map(item => item.id);
    const responseItemIds = assessmentData.responses.map(r => r.itemId);
    const missingItems = scaleItemIds.filter(id => !responseItemIds.includes(id));

    if (missingItems.length > 0) {
      return res.status(400).json({ 
        error: 'Incomplete assessment',
        message: 'All scale items must have responses',
        missingItems
      });
    }

    // Calculate total score
    let totalScore = 0;
    for (const response of assessmentData.responses) {
      const item = scale.scaleItems.find(i => i.id === response.itemId);
      if (item && item.scoreValue !== null) {
        totalScore += parseInt(response.value) * (item.scoreValue || 1);
      }
    }

    // Create assessment with responses
    const assessment = await executeQuery(
      (prisma) => prisma.scaleAdministration.create({
        data: {
          patientId: assessmentData.patientId,
          scaleId: assessmentData.scaleId,
          administrationType: assessmentData.administrationType,
          administrationDate: assessmentData.administrationDate || new Date(),
          administratorId: userId,
          totalScore,
          rawScore: totalScore,
          notes: assessmentData.notes,
          responses: {
            create: assessmentData.responses.map(response => ({
              scaleItemId: response.itemId,
              responseValue: response.value,
              responseText: response.text
            }))
          }
        },
        include: {
          scale: {
            select: { name: true, abbreviation: true }
          },
          administrator: {
            select: { id: true, name: true, email: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      'createAssessment'
    );

    // Log creation for compliance
    logger.info('Assessment created', {
      assessmentId: assessment.id,
      patientId: assessment.patientId,
      scaleId: assessment.scaleId,
      totalScore: assessment.totalScore,
      administrationType: assessment.administrationType,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });

  } catch (error) {
    logger.error('Failed to create assessment', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create assessment', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/clinimetrix/assessments/remote-token
 * Generate token for remote assessment
 */
router.post('/remote-token',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
  body('patientId').isUUID().withMessage('Invalid patient ID format'),
  body('scaleId').isUUID().withMessage('Invalid scale ID format'),
  body('expiresIn').optional().isInt({ min: 1, max: 168 }).withMessage('Expires in must be between 1 and 168 hours')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { patientId, scaleId, expiresIn = 24 } = req.body;
    const userId = req.user?.id;

    // Verify patient and scale exist
    const [patient, scale] = await executeTransaction([
      (prisma) => prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true, firstName: true, lastName: true, email: true }
      }),
      (prisma) => prisma.scale.findUnique({
        where: { id: scaleId },
        select: { id: true, name: true, administrationType: true }
      })
    ], 'verifyRemoteAssessmentData');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!scale) {
      return res.status(404).json({ error: 'Scale not found' });
    }

    if (!['self_administered', 'both'].includes(scale.administrationType)) {
      return res.status(400).json({ 
        error: 'Scale does not support self-administration' 
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    // Create assessment token record
    const assessmentToken = await executeQuery(
      (prisma) => prisma.assessmentToken.create({
        data: {
          token,
          patientId,
          scaleId,
          createdBy: userId,
          expiresAt,
          isUsed: false
        },
        include: {
          patient: {
            select: { firstName: true, lastName: true, email: true }
          },
          scale: {
            select: { name: true, estimatedDuration: true }
          }
        }
      }),
      'createAssessmentToken'
    );

    // Log token creation
    logger.info('Remote assessment token created', {
      tokenId: assessmentToken.id,
      patientId,
      scaleId,
      expiresAt,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Remote assessment token created successfully',
      data: {
        token,
        assessmentUrl: `${process.env.FRONTEND_URL}/assessment/${token}`,
        expiresAt,
        patient: assessmentToken.patient,
        scale: assessmentToken.scale
      }
    });

  } catch (error) {
    logger.error('Failed to create remote assessment token', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create remote assessment token', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/clinimetrix/assessments/compare/:patient_id/:scale_id
 * Compare assessment results over time for a patient and scale
 */
router.get('/compare/:patient_id/:scale_id',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  param('scaleId').isUUID().withMessage('Invalid scale ID format'),
  query('limit').optional().isInt({ min: 2, max: 20 }).withMessage('Limit must be between 2 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { patientId, scaleId } = req.params;
    const { limit = 10 } = req.query;

    const assessments = await executeQuery(
      (prisma) => prisma.scaleAdministration.findMany({
        where: { patientId, scaleId },
        include: {
          scale: {
            select: { 
              name: true, 
              abbreviation: true,
              interpretationRules: {
                orderBy: { minScore: 'asc' }
              }
            }
          },
          administrator: {
            select: { name: true }
          }
        },
        orderBy: { administrationDate: 'desc' },
        take: parseInt(limit)
      }),
      `compareAssessments(${patientId}, ${scaleId})`
    );

    if (assessments.length === 0) {
      return res.status(404).json({ 
        error: 'No assessments found for this patient and scale' 
      });
    }

    // Add interpretations and calculate trends
    const assessmentsWithInterpretation = assessments.map(assessment => {
      const interpretation = assessment.scale.interpretationRules.find(rule =>
        assessment.totalScore >= rule.minScore && assessment.totalScore <= rule.maxScore
      );
      
      return {
        ...assessment,
        interpretation: interpretation?.interpretation || 'No interpretation available',
        severity: interpretation?.severity || 'unknown'
      };
    });

    // Calculate trend
    const trend = assessments.length > 1 ? 
      (assessments[0].totalScore - assessments[assessments.length - 1].totalScore) : 0;

    res.json({
      success: true,
      data: {
        assessments: assessmentsWithInterpretation,
        summary: {
          totalAssessments: assessments.length,
          latestScore: assessments[0].totalScore,
          earliestScore: assessments[assessments.length - 1].totalScore,
          trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
          trendValue: trend
        }
      }
    });

  } catch (error) {
    logger.error('Failed to compare assessments', { 
      error: error.message,
      patientId: req.params.patientId,
      scaleId: req.params.scaleId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to compare assessments', 
      details: error.message 
    });
  }
});

module.exports = router;