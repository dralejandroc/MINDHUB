/**
 * Clinical Workflows API Routes for Clinimetrix Hub
 * 
 * Advanced clinical workflow management including assessment batteries,
 * treatment protocols, and clinical decision support
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

// Import services
const ScaleRepository = require('../../repositories/ScaleRepository');
const scaleRepository = new ScaleRepository();

/**
 * POST /api/v1/clinimetrix/workflows/assessment-battery
 * Create an assessment battery for a patient
 */
router.post('/assessment-battery',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('batteryName').isString().isLength({ min: 1, max: 200 }).withMessage('Battery name is required'),
    body('scaleIds').isArray().withMessage('Scale IDs must be an array'),
    body('scaleIds.*').isString().withMessage('Each scale ID must be a string'),
    body('clinicalRationale').optional().isString().isLength({ max: 2000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('scheduledDate').optional().isISO8601(),
    body('estimatedDuration').optional().isInt({ min: 1, max: 300 })
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
        batteryName,
        scaleIds,
        clinicalRationale,
        priority = 'medium',
        scheduledDate,
        estimatedDuration
      } = req.body;

      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
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

      // Verify all scales exist
      const scales = await Promise.all(
        scaleIds.map(scaleId => scaleRepository.getScaleById(scaleId))
      );

      const missingScales = scaleIds.filter((scaleId, index) => !scales[index]);
      if (missingScales.length > 0) {
        return res.status(404).json({
          error: 'Scales not found',
          message: `The following scales were not found: ${missingScales.join(', ')}`
        });
      }

      // Calculate total estimated duration
      const totalEstimatedDuration = estimatedDuration || 
        scales.reduce((sum, scale) => sum + (scale.estimatedDurationMinutes || 0), 0);

      // Create assessment battery
      const batteryId = uuidv4();
      const battery = await executeTransaction([
        async (prisma) => {
          // Create battery record
          const newBattery = await prisma.assessmentBattery.create({
            data: {
              id: batteryId,
              patientId: patientId,
              batteryName: batteryName,
              createdBy: userId,
              clinicalRationale: clinicalRationale,
              priority: priority,
              scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
              estimatedDuration: totalEstimatedDuration,
              status: 'planned',
              totalScales: scaleIds.length,
              completedScales: 0,
              createdAt: new Date()
            }
          });

          // Create individual assessments for each scale
          const assessments = await Promise.all(
            scaleIds.map(async (scaleId, index) => {
              const scale = scales[index];
              return await prisma.scaleAdministration.create({
                data: {
                  id: uuidv4(),
                  patientId: patientId,
                  scaleId: scaleId,
                  administeredBy: userId,
                  administrationMode: 'clinician_administered',
                  assessmentType: 'screening',
                  priority: priority,
                  batteryId: batteryId,
                  batteryOrder: index + 1,
                  status: 'created',
                  totalItems: scale.totalItems,
                  currentItemIndex: 0,
                  completionPercentage: 0,
                  createdAt: new Date()
                }
              });
            })
          );

          return {
            battery: newBattery,
            assessments: assessments
          };
        }
      ], 'createAssessmentBattery');

      // Log battery creation
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_BATTERY_CREATE',
        {
          batteryId: batteryId,
          patientId: patientId,
          batteryName: batteryName,
          scaleIds: scaleIds,
          totalScales: scaleIds.length,
          estimatedDuration: totalEstimatedDuration,
          medicalRecordNumber: patient.medicalRecordNumber
        }
      );

      res.status(201).json({
        success: true,
        message: 'Assessment battery created successfully',
        data: {
          battery: battery.battery,
          assessments: battery.assessments,
          scales: scales.map(scale => ({
            id: scale.id,
            name: scale.name,
            estimatedDuration: scale.estimatedDurationMinutes
          })),
          patient: patient
        }
      });

    } catch (error) {
      logger.error('Failed to create assessment battery', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        patientId: req.body.patientId
      });

      res.status(500).json({
        error: 'Battery creation failed',
        message: 'An error occurred while creating the assessment battery'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/workflows/assessment-batteries
 * Get assessment batteries with filtering
 */
router.get('/assessment-batteries',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    query('patientId').optional().isUUID(),
    query('status').optional().isIn(['planned', 'in_progress', 'completed', 'cancelled']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
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
        status,
        priority,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0
      } = req.query;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Build where clause
      const whereClause = {};

      if (patientId) {
        whereClause.patientId = patientId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (priority) {
        whereClause.priority = priority;
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

      // Role-based filtering
      if (userRole === 'nurse') {
        whereClause.createdBy = userId;
      } else if (!['admin', 'system'].includes(userRole)) {
        whereClause.createdBy = userId;
      }

      // Get batteries
      const batteries = await executeQuery(
        (prisma) => prisma.assessmentBattery.findMany({
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
            creator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            assessments: {
              select: {
                id: true,
                scaleId: true,
                status: true,
                completionPercentage: true,
                batteryOrder: true
              },
              orderBy: {
                batteryOrder: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        'getAssessmentBatteries'
      );

      // Get total count
      const total = await executeQuery(
        (prisma) => prisma.assessmentBattery.count({
          where: whereClause
        }),
        'countAssessmentBatteries'
      );

      // Enrich with scale information
      const batteriesWithScales = await Promise.all(
        batteries.map(async (battery) => {
          const scaleInfo = await Promise.all(
            battery.assessments.map(async (assessment) => {
              const scale = await scaleRepository.getScaleById(assessment.scaleId);
              return {
                ...assessment,
                scale: scale ? {
                  id: scale.id,
                  name: scale.name,
                  abbreviation: scale.abbreviation
                } : null
              };
            })
          );

          return {
            ...battery,
            assessments: scaleInfo
          };
        })
      );

      // Log access
      await auditLogger.logDataAccess(
        userId,
        'assessment_batteries',
        'list',
        'view',
        {
          filters: req.query,
          resultCount: batteries.length,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: batteriesWithScales,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      logger.error('Failed to get assessment batteries', {
        error: error.message,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Batteries retrieval failed',
        message: 'An error occurred while retrieving assessment batteries'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/workflows/assessment-batteries/:id/start
 * Start execution of an assessment battery
 */
router.post('/:id/start',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    param('id').isUUID().withMessage('Invalid battery ID format'),
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

      // Get battery
      const battery = await executeQuery(
        (prisma) => prisma.assessmentBattery.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            assessments: {
              orderBy: {
                batteryOrder: 'asc'
              }
            }
          }
        }),
        `getBatteryForStart(${id})`
      );

      if (!battery) {
        return res.status(404).json({
          error: 'Battery not found',
          message: 'The specified assessment battery was not found'
        });
      }

      if (battery.status !== 'planned') {
        return res.status(400).json({
          error: 'Battery already started',
          message: 'This assessment battery has already been started'
        });
      }

      // Start battery and first assessment
      const updatedBattery = await executeTransaction([
        async (prisma) => {
          // Update battery status
          await prisma.assessmentBattery.update({
            where: { id },
            data: {
              status: 'in_progress',
              startedAt: new Date(),
              administrationContext: administrationContext,
              updatedAt: new Date()
            }
          });

          // Start first assessment
          if (battery.assessments.length > 0) {
            const firstAssessment = battery.assessments[0];
            await prisma.scaleAdministration.update({
              where: { id: firstAssessment.id },
              data: {
                status: 'in_progress',
                startedAt: new Date(),
                administrationContext: administrationContext,
                updatedAt: new Date()
              }
            });
          }

          return battery;
        }
      ], 'startAssessmentBattery');

      // Log battery start
      await auditLogger.logDataModification(
        userId,
        'ASSESSMENT_BATTERY_START',
        {
          batteryId: id,
          patientId: battery.patientId,
          batteryName: battery.batteryName,
          totalScales: battery.totalScales,
          medicalRecordNumber: battery.patient.medicalRecordNumber,
          administrationContext: administrationContext
        }
      );

      res.json({
        success: true,
        message: 'Assessment battery started successfully',
        data: {
          battery: updatedBattery,
          nextAssessment: battery.assessments[0] || null
        }
      });

    } catch (error) {
      logger.error('Failed to start assessment battery', {
        error: error.message,
        batteryId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Battery start failed',
        message: 'An error occurred while starting the assessment battery'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/workflows/clinical-insights/:patientId
 * Get clinical insights and recommendations for a patient
 */
router.get('/clinical-insights/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'admin'], ['read:clinical_assessments']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y', 'all'])
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
      const { timeframe = '30d' } = req.query;
      const userId = req.user?.id;

      // Calculate date range
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        'all': new Date(0)
      };

      const fromDate = dateRanges[timeframe];

      // Get completed assessments
      const assessments = await executeQuery(
        (prisma) => prisma.scaleAdministration.findMany({
          where: {
            patientId: patientId,
            status: 'completed',
            completedAt: {
              gte: fromDate
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        }),
        `getPatientInsights(${patientId})`
      );

      // Analyze trends and patterns
      const insights = await generateClinicalInsights(assessments, patientId);

      // Log insights access
      await auditLogger.logDataAccess(
        userId,
        'clinical_insights',
        patientId,
        'view',
        {
          patientId: patientId,
          timeframe: timeframe,
          assessmentCount: assessments.length
        }
      );

      res.json({
        success: true,
        data: insights
      });

    } catch (error) {
      logger.error('Failed to get clinical insights', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Insights retrieval failed',
        message: 'An error occurred while retrieving clinical insights'
      });
    }
  }
);

/**
 * Helper function to generate clinical insights
 */
async function generateClinicalInsights(assessments, patientId) {
  const insights = {
    summary: {
      totalAssessments: assessments.length,
      assessmentTypes: {},
      completionRate: 0,
      averageScores: {},
      trends: {}
    },
    recommendations: [],
    alerts: [],
    patterns: []
  };

  // Group assessments by scale
  const assessmentsByScale = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.scaleId]) {
      acc[assessment.scaleId] = [];
    }
    acc[assessment.scaleId].push(assessment);
    return acc;
  }, {});

  // Analyze each scale
  for (const [scaleId, scaleAssessments] of Object.entries(assessmentsByScale)) {
    const scale = await scaleRepository.getScaleById(scaleId);
    if (!scale) continue;

    // Calculate trends
    const scores = scaleAssessments
      .filter(a => a.results?.totalScore !== undefined)
      .map(a => ({
        score: a.results.totalScore,
        date: a.completedAt
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (scores.length >= 2) {
      const trend = calculateTrend(scores);
      insights.summary.trends[scaleId] = {
        scaleName: scale.name,
        trend: trend,
        latestScore: scores[scores.length - 1].score,
        previousScore: scores[scores.length - 2].score,
        change: scores[scores.length - 1].score - scores[scores.length - 2].score
      };
    }

    // Generate recommendations
    const latestAssessment = scaleAssessments[0];
    if (latestAssessment.results?.interpretation) {
      const interpretation = latestAssessment.results.interpretation;
      
      if (interpretation.riskLevel === 'high') {
        insights.alerts.push({
          type: 'high_risk',
          scale: scale.name,
          message: `High risk level detected in ${scale.name}`,
          recommendation: 'Consider immediate clinical intervention'
        });
      }

      if (interpretation.riskLevel === 'moderate') {
        insights.recommendations.push({
          type: 'monitoring',
          scale: scale.name,
          message: `Moderate risk level in ${scale.name}`,
          recommendation: 'Continue monitoring and consider targeted interventions'
        });
      }
    }
  }

  return insights;
}

/**
 * Helper function to calculate trend
 */
function calculateTrend(scores) {
  if (scores.length < 2) return 'stable';
  
  const recent = scores.slice(-3); // Last 3 scores
  let increasing = 0;
  let decreasing = 0;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].score > recent[i-1].score) {
      increasing++;
    } else if (recent[i].score < recent[i-1].score) {
      decreasing++;
    }
  }
  
  if (increasing > decreasing) return 'increasing';
  if (decreasing > increasing) return 'decreasing';
  return 'stable';
}

module.exports = router;