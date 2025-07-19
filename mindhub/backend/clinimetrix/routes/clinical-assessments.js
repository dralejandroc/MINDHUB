/**
 * Clinical Assessments API Routes for Clinimetrix Hub
 * 
 * Comprehensive clinical assessment management with healthcare compliance,
 * role-based access control, and integration with clinical workflows
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

// Import assessment services
const AssessmentRepository = require('../../repositories/AssessmentRepository');
const ScaleRepository = require('../../repositories/ScaleRepository');
const UniversalScaleService = require('../../services/UniversalScaleService');
const ScaleCalculatorService = require('../../services/ScaleCalculatorService');
const ScaleValidationService = require('../../services/ScaleValidationService');
const ScaleExportService = require('../../services/ScaleExportService');

// Initialize services
const assessmentRepository = new AssessmentRepository();
const scaleRepository = new ScaleRepository();
const scaleService = new UniversalScaleService();
const calculatorService = new ScaleCalculatorService();
const validationService = new ScaleValidationService();
const exportService = new ScaleExportService();

/**
 * Validation middleware for clinical assessments
 */
const validateAssessmentCreation = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('scaleId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Scale ID is required and must be valid'),
  
  body('administrationMode')
    .isIn(['self_administered', 'clinician_administered', 'remote_supervised'])
    .withMessage('Invalid administration mode'),
  
  body('assessmentType')
    .optional()
    .isIn(['screening', 'diagnostic', 'monitoring', 'outcome'])
    .withMessage('Invalid assessment type'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format'),
  
  body('clinicalContext')
    .optional()
    .isObject()
    .withMessage('Clinical context must be an object'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters')
];

const validateAssessmentResponse = [
  body('itemId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Item ID is required'),
  
  body('responseValue')
    .notEmpty()
    .withMessage('Response value is required'),
  
  body('responseTimeMs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Response time must be a positive integer'),
  
  body('confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1')
];

/**
 * POST /api/v1/clinimetrix/assessments
 * Create a new clinical assessment
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  validateAssessmentCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        patientId,
        scaleId,
        administrationMode,
        assessmentType = 'screening',
        priority = 'medium',
        scheduledAt,
        clinicalContext = {},
        notes
      } = req.body;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient exists and user has access
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            organizationId: true
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          message: 'The specified patient was not found'
        });
      }

      // Verify scale exists
      const scale = await scaleRepository.getScaleById(scaleId);
      if (!scale) {
        return res.status(404).json({
          error: 'Scale not found',
          message: 'The specified clinical scale was not found'
        });
      }

      // Create assessment
      const assessmentId = uuidv4();
      const assessment = await executeTransaction([
        async (prisma) => {
          // Create assessment record
          const newAssessment = await prisma.scaleAdministration.create({
            data: {
              id: assessmentId,
              patientId: patientId,
              scaleId: scaleId,
              administeredBy: userId,
              administrationMode: administrationMode,
              assessmentType: assessmentType,
              priority: priority,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
              clinicalContext: clinicalContext,
              notes: notes,
              status: 'created',
              totalItems: scale.totalItems,
              currentItemIndex: 0,
              completionPercentage: 0,
              createdAt: new Date()
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  medicalRecordNumber: true
                }
              },
              administrator: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          });

          return newAssessment;
        }
      ], 'createClinicalAssessment');

      // Log assessment creation
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_CREATE',
        {
          assessmentId: assessmentId,
          patientId: patientId,
          scaleId: scaleId,
          administrationMode: administrationMode,
          assessmentType: assessmentType,
          priority: priority,
          medicalRecordNumber: patient.medicalRecordNumber,
          clinicalContext: clinicalContext
        }
      );

      res.status(201).json({
        success: true,
        message: 'Clinical assessment created successfully',
        data: {
          assessment: assessment,
          scale: {
            id: scale.id,
            name: scale.name,
            totalItems: scale.totalItems,
            estimatedDuration: scale.estimatedDuration
          }
        }
      });

    } catch (error) {
      logger.error('Failed to create clinical assessment', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        patientId: req.body.patientId,
        scaleId: req.body.scaleId
      });

      res.status(500).json({
        error: 'Assessment creation failed',
        message: 'An error occurred while creating the clinical assessment'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/assessments
 * Get clinical assessments with filtering and pagination
 */
router.get('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    query('patientId').optional().isUUID(),
    query('scaleId').optional().isString(),
    query('status').optional().isIn(['created', 'in_progress', 'completed', 'cancelled']),
    query('administrationMode').optional().isIn(['self_administered', 'clinician_administered', 'remote_supervised']),
    query('assessmentType').optional().isIn(['screening', 'diagnostic', 'monitoring', 'outcome']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        patientId,
        scaleId,
        status,
        administrationMode,
        assessmentType,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0
      } = req.query;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Build where clause based on filters and user permissions
      const whereClause = {};

      if (patientId) {
        whereClause.patientId = patientId;
      }

      if (scaleId) {
        whereClause.scaleId = scaleId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (administrationMode) {
        whereClause.administrationMode = administrationMode;
      }

      if (assessmentType) {
        whereClause.assessmentType = assessmentType;
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo);
        }
      }

      // Role-based filtering
      if (userRole === 'nurse') {
        // Nurses can only see assessments they're involved in
        whereClause.administeredBy = userId;
      } else if (!['admin', 'system'].includes(userRole)) {
        // Healthcare professionals can see assessments they administered
        whereClause.administeredBy = userId;
      }

      // Get assessments
      const assessments = await executeQuery(
        (prisma) => prisma.scaleAdministration.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            administrator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        'getClinicalAssessments'
      );

      // Get total count for pagination
      const total = await executeQuery(
        (prisma) => prisma.scaleAdministration.count({
          where: whereClause
        }),
        'countClinicalAssessments'
      );

      // Log access for compliance
      await auditLogger.logDataAccess(
        userId,
        'clinical_assessments',
        'list',
        'view',
        {
          filters: req.query,
          resultCount: assessments.length,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: assessments,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      logger.error('Failed to get clinical assessments', {
        error: error.message,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Assessment retrieval failed',
        message: 'An error occurred while retrieving clinical assessments'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/assessments/:id
 * Get specific clinical assessment details
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get assessment with full details
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true,
                dateOfBirth: true,
                gender: true
              }
            },
            administrator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            responses: {
              orderBy: {
                itemNumber: 'asc'
              }
            }
          }
        }),
        `getClinicalAssessment(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      // Check permissions
      if (userRole === 'nurse' && assessment.administeredBy !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view this assessment'
        });
      }

      // Get scale information
      const scale = await scaleRepository.getScaleById(assessment.scaleId);

      // Log access for compliance
      await auditLogger.logDataAccess(
        userId,
        'clinical_assessment',
        assessment.id,
        'view',
        {
          assessmentId: assessment.id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: {
          assessment: assessment,
          scale: scale,
          progress: {
            totalItems: assessment.totalItems,
            completedItems: assessment.responses?.length || 0,
            completionPercentage: assessment.completionPercentage,
            estimatedTimeRemaining: scale?.estimatedDuration ? 
              Math.max(0, scale.estimatedDuration - (assessment.responses?.length || 0) * (scale.estimatedDuration / assessment.totalItems)) : 
              null
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get clinical assessment', {
        error: error.message,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Assessment retrieval failed',
        message: 'An error occurred while retrieving the clinical assessment'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/assessments/:id/start
 * Start assessment administration
 */
router.post('/:id/start',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format'),
    body('administrationContext').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { administrationContext = {} } = req.body;
      const userId = req.user?.id;

      // Get assessment
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        `getAssessmentForStart(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      if (assessment.status !== 'created') {
        return res.status(400).json({
          error: 'Assessment already started',
          message: 'This assessment has already been started or completed'
        });
      }

      // Update assessment status
      const updatedAssessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.update({
          where: { id },
          data: {
            status: 'in_progress',
            startedAt: new Date(),
            administrationContext: administrationContext,
            updatedAt: new Date()
          }
        }),
        'startAssessment'
      );

      // Log assessment start
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_START',
        {
          assessmentId: id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          medicalRecordNumber: assessment.patient.medicalRecordNumber,
          administrationContext: administrationContext
        }
      );

      res.json({
        success: true,
        message: 'Assessment started successfully',
        data: updatedAssessment
      });

    } catch (error) {
      logger.error('Failed to start clinical assessment', {
        error: error.message,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Assessment start failed',
        message: 'An error occurred while starting the clinical assessment'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/assessments/:id/responses
 * Submit assessment responses
 */
router.post('/:id/responses',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format'),
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.itemId').isString().withMessage('Item ID is required'),
    body('responses.*.responseValue').notEmpty().withMessage('Response value is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { responses } = req.body;
      const userId = req.user?.id;

      // Get assessment
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        `getAssessmentForResponses(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      if (assessment.status !== 'in_progress') {
        return res.status(400).json({
          error: 'Assessment not in progress',
          message: 'This assessment is not currently in progress'
        });
      }

      // Save responses
      await executeTransaction([
        async (prisma) => {
          // Save each response
          for (const response of responses) {
            await prisma.scaleResponse.create({
              data: {
                id: uuidv4(),
                administrationId: id,
                itemId: response.itemId,
                itemNumber: response.itemNumber || 0,
                responseValue: response.responseValue,
                responseLabel: response.responseLabel,
                scoreValue: response.scoreValue,
                responseTimeMs: response.responseTimeMs,
                wasSkipped: response.wasSkipped || false,
                confidence: response.confidence,
                createdAt: new Date()
              }
            });
          }

          // Update assessment progress
          const completedResponses = await prisma.scaleResponse.count({
            where: { administrationId: id }
          });

          const completionPercentage = Math.round((completedResponses / assessment.totalItems) * 100);

          await prisma.scaleAdministration.update({
            where: { id },
            data: {
              currentItemIndex: completedResponses,
              completionPercentage: completionPercentage,
              updatedAt: new Date()
            }
          });
        }
      ], 'saveAssessmentResponses');

      // Log response submission
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_RESPONSES',
        {
          assessmentId: id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          responseCount: responses.length,
          medicalRecordNumber: assessment.patient.medicalRecordNumber
        }
      );

      res.json({
        success: true,
        message: 'Assessment responses saved successfully',
        data: {
          responseCount: responses.length,
          completionPercentage: Math.round((responses.length / assessment.totalItems) * 100)
        }
      });

    } catch (error) {
      logger.error('Failed to save assessment responses', {
        error: error.message,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Response save failed',
        message: 'An error occurred while saving assessment responses'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/assessments/:id/complete
 * Complete assessment and calculate results
 */
router.post('/:id/complete',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format'),
    body('finalNotes').optional().trim().isLength({ max: 2000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { finalNotes } = req.body;
      const userId = req.user?.id;

      // Get assessment with responses
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            responses: {
              orderBy: {
                itemNumber: 'asc'
              }
            }
          }
        }),
        `getAssessmentForCompletion(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      if (assessment.status !== 'in_progress') {
        return res.status(400).json({
          error: 'Assessment not in progress',
          message: 'This assessment is not currently in progress'
        });
      }

      // Get scale information
      const scale = await scaleRepository.getScaleById(assessment.scaleId);
      if (!scale) {
        return res.status(404).json({
          error: 'Scale not found',
          message: 'The clinical scale was not found'
        });
      }

      // Validate responses
      const validation = validationService.validateResponses(scale, assessment.responses);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid responses',
          message: 'Assessment responses are invalid',
          details: validation.errors
        });
      }

      // Calculate results
      const scores = calculatorService.calculateScores(scale, assessment.responses);
      const interpretation = calculatorService.interpretScore(scale, scores.totalScore);
      const alerts = calculatorService.detectAlerts(scale, assessment.responses);
      const consistency = calculatorService.checkResponseConsistency(scale, assessment.responses);

      const results = {
        totalScore: scores.totalScore,
        subscaleScores: scores.subscaleScores,
        interpretation: interpretation,
        alerts: alerts,
        consistency: consistency,
        completionPercentage: (scores.validResponses / scale.totalItems) * 100,
        validResponses: scores.validResponses,
        calculatedAt: new Date().toISOString()
      };

      // Complete assessment
      const completedAssessment = await executeTransaction([
        async (prisma) => {
          // Update assessment
          const updated = await prisma.scaleAdministration.update({
            where: { id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              finalNotes: finalNotes,
              results: results,
              completionPercentage: 100,
              updatedAt: new Date()
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  medicalRecordNumber: true
                }
              },
              administrator: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          });

          // Create assessment summary for clinical workflow
          await prisma.assessmentSummary.create({
            data: {
              id: uuidv4(),
              assessmentId: id,
              patientId: assessment.patientId,
              scaleId: assessment.scaleId,
              totalScore: results.totalScore,
              interpretation: results.interpretation,
              riskLevel: interpretation.riskLevel || 'low',
              alerts: results.alerts,
              completedAt: new Date(),
              createdBy: userId
            }
          });

          return updated;
        }
      ], 'completeAssessment');

      // Log assessment completion
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_COMPLETE',
        {
          assessmentId: id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          totalScore: results.totalScore,
          interpretation: results.interpretation,
          alerts: results.alerts,
          medicalRecordNumber: assessment.patient.medicalRecordNumber
        }
      );

      res.json({
        success: true,
        message: 'Assessment completed successfully',
        data: {
          assessment: completedAssessment,
          results: results,
          scale: {
            id: scale.id,
            name: scale.name,
            version: scale.version
          }
        }
      });

    } catch (error) {
      logger.error('Failed to complete clinical assessment', {
        error: error.message,
        stack: error.stack,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Assessment completion failed',
        message: 'An error occurred while completing the clinical assessment'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/assessments/:id/results
 * Get assessment results and interpretation
 */
router.get('/:id/results',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get assessment with results
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            administrator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }),
        `getAssessmentResults(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      if (assessment.status !== 'completed') {
        return res.status(400).json({
          error: 'Assessment not completed',
          message: 'This assessment has not been completed yet'
        });
      }

      // Check permissions
      if (userRole === 'nurse' && assessment.administeredBy !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view these results'
        });
      }

      // Get scale information
      const scale = await scaleRepository.getScaleById(assessment.scaleId);

      // Log results access
      await auditLogger.logDataAccess(
        userId,
        'clinical_assessment_results',
        assessment.id,
        'view',
        {
          assessmentId: assessment.id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: {
          assessment: {
            id: assessment.id,
            patientId: assessment.patientId,
            scaleId: assessment.scaleId,
            status: assessment.status,
            completedAt: assessment.completedAt,
            administrationMode: assessment.administrationMode,
            assessmentType: assessment.assessmentType,
            priority: assessment.priority,
            finalNotes: assessment.finalNotes
          },
          patient: assessment.patient,
          administrator: assessment.administrator,
          scale: scale,
          results: assessment.results
        }
      });

    } catch (error) {
      logger.error('Failed to get assessment results', {
        error: error.message,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Results retrieval failed',
        message: 'An error occurred while retrieving assessment results'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/patients/:patientId/assessments
 * Get all assessments for a specific patient
 */
router.get('/patients/:patientId/assessments',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('scaleId').optional().isString(),
    query('status').optional().isIn(['created', 'in_progress', 'completed', 'cancelled']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { patientId } = req.params;
      const { scaleId, status, dateFrom, dateTo, limit = 50 } = req.query;
      const userId = req.user?.id;

      // Build where clause
      const whereClause = { patientId };

      if (scaleId) {
        whereClause.scaleId = scaleId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo);
        }
      }

      // Get assessments
      const assessments = await executeQuery(
        (prisma) => prisma.scaleAdministration.findMany({
          where: whereClause,
          include: {
            administrator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit)
        }),
        `getPatientAssessments(${patientId})`
      );

      // Get scale information for each assessment
      const assessmentsWithScales = await Promise.all(
        assessments.map(async (assessment) => {
          const scale = await scaleRepository.getScaleById(assessment.scaleId);
          return {
            ...assessment,
            scale: scale ? {
              id: scale.id,
              name: scale.name,
              version: scale.version,
              totalItems: scale.totalItems
            } : null
          };
        })
      );

      // Log access
      await auditLogger.logDataAccess(
        userId,
        'patient_assessments',
        patientId,
        'view',
        {
          patientId: patientId,
          resultCount: assessments.length,
          filters: req.query
        }
      );

      res.json({
        success: true,
        data: assessmentsWithScales,
        count: assessments.length
      });

    } catch (error) {
      logger.error('Failed to get patient assessments', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Patient assessments retrieval failed',
        message: 'An error occurred while retrieving patient assessments'
      });
    }
  }
);

/**
 * PUT /api/v1/clinimetrix/assessments/:id/cancel
 * Cancel an assessment
 */
router.put('/:id/cancel',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid assessment ID format'),
    body('reason').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
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

      // Get assessment
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        `getAssessmentForCancel(${id})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified clinical assessment was not found'
        });
      }

      if (assessment.status === 'completed') {
        return res.status(400).json({
          error: 'Cannot cancel completed assessment',
          message: 'This assessment has already been completed'
        });
      }

      // Cancel assessment
      const cancelledAssessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.update({
          where: { id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason,
            updatedAt: new Date()
          }
        }),
        'cancelAssessment'
      );

      // Log cancellation
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_CANCEL',
        {
          assessmentId: id,
          patientId: assessment.patientId,
          scaleId: assessment.scaleId,
          reason: reason,
          medicalRecordNumber: assessment.patient.medicalRecordNumber
        }
      );

      res.json({
        success: true,
        message: 'Assessment cancelled successfully',
        data: cancelledAssessment
      });

    } catch (error) {
      logger.error('Failed to cancel clinical assessment', {
        error: error.message,
        assessmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Assessment cancellation failed',
        message: 'An error occurred while cancelling the clinical assessment'
      });
    }
  }
);

module.exports = router;