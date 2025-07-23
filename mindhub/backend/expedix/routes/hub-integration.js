/**
 * Hub Integration Controller for Expedix
 * 
 * Central hub that integrates Expedix with Clinimetrix assessments
 * and FormX forms for comprehensive patient management
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Hub integration configuration
 */
const HUB_CONFIG = {
  CLINIMETRIX_URL: process.env.CLINIMETRIX_API_URL || 'http://localhost:3001/api/v1/clinimetrix',
  FORMX_URL: process.env.FORMX_API_URL || 'http://localhost:3002/api/v1/formx',
  EXPEDIX_URL: process.env.EXPEDIX_API_URL || 'http://localhost:3003/api/v1/expedix',
  INTEGRATION_TIMEOUT: 10000 // 10 seconds
};

/**
 * Integration workflow types
 */
const WORKFLOW_TYPES = {
  PATIENT_ONBOARDING: {
    name: 'Patient Onboarding',
    steps: ['formx_registration', 'expedix_patient_creation', 'clinimetrix_baseline_assessment'],
    description: 'Complete patient onboarding from registration to baseline assessment'
  },
  CLINICAL_EVALUATION: {
    name: 'Clinical Evaluation',
    steps: ['clinimetrix_assessment', 'expedix_consultation', 'prescription_management'],
    description: 'Full clinical evaluation with assessment, consultation, and treatment'
  },
  FOLLOW_UP_CARE: {
    name: 'Follow-up Care',
    steps: ['appointment_scheduling', 'progress_assessment', 'treatment_adjustment'],
    description: 'Ongoing patient care with scheduled follow-ups and progress tracking'
  },
  TREATMENT_COMPLETION: {
    name: 'Treatment Completion',
    steps: ['final_assessment', 'outcome_documentation', 'discharge_planning'],
    description: 'Treatment completion workflow with final evaluation and discharge'
  }
};

/**
 * GET /api/v1/expedix/hub-integration/overview
 * Get hub integration overview and status
 */
router.get('/overview',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:hub_integration']),
  async (req, res) => {
    try {
      // Check connectivity to other hubs
      const hubStatus = await checkHubConnectivity();

      // Get integration statistics
      const integrationStats = await getIntegrationStatistics();

      // Get recent activities
      const recentActivities = await getRecentHubActivities();

      res.json({
        success: true,
        data: {
          hubStatus: hubStatus,
          integrationStats: integrationStats,
          recentActivities: recentActivities,
          availableWorkflows: WORKFLOW_TYPES,
          configuration: {
            expedixVersion: '1.0.0',
            integrationTimeout: HUB_CONFIG.INTEGRATION_TIMEOUT,
            supportedHubs: ['Clinimetrix', 'FormX']
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get hub integration overview', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve hub overview',
        message: 'An error occurred while retrieving hub integration overview'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/hub-integration/patient/:patientId/sync
 * Synchronize patient data across all hubs
 */
router.post('/patient/:patientId/sync',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:hub_integration']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('includeAssessments').optional().isBoolean(),
    body('includeForms').optional().isBoolean(),
    body('forceSync').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        includeAssessments = true,
        includeForms = true,
        forceSync = false
      } = req.body;

      const userId = req.user?.id;

      // Get patient data from Expedix
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            medicalHistory: true,
            familyHistory: true,
            prescriptions: {
              where: { status: 'active' },
              include: { medication: true }
            },
            appointments: {
              where: {
                appointmentDate: { gte: new Date() }
              },
              include: { provider: true }
            }
          }
        }),
        `getPatientForSync(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      const syncResults = {};

      // Sync with Clinimetrix if assessments are included
      if (includeAssessments) {
        try {
          const clinimetrixSync = await syncPatientWithClinimetrix(patient, forceSync);
          syncResults.clinimetrix = clinimetrixSync;
        } catch (error) {
          logger.error('Failed to sync with Clinimetrix', {
            error: error.message,
            patientId: patientId
          });
          syncResults.clinimetrix = { success: false, error: error.message };
        }
      }

      // Sync with FormX if forms are included
      if (includeForms) {
        try {
          const formxSync = await syncPatientWithFormX(patient, forceSync);
          syncResults.formx = formxSync;
        } catch (error) {
          logger.error('Failed to sync with FormX', {
            error: error.message,
            patientId: patientId
          });
          syncResults.formx = { success: false, error: error.message };
        }
      }

      // Create sync record
      const syncRecord = await executeQuery(
        (prisma) => prisma.hubIntegrationSync.create({
          data: {
            id: uuidv4(),
            patientId: patientId,
            syncType: 'PATIENT_DATA_SYNC',
            initiatedBy: userId,
            syncResults: syncResults,
            includeAssessments: includeAssessments,
            includeForms: includeForms,
            forceSync: forceSync,
            syncedAt: new Date(),
            status: Object.values(syncResults).every(result => result.success) ? 'SUCCESS' : 'PARTIAL_FAILURE'
          }
        }),
        'createSyncRecord'
      );

      // Log sync operation
      logger.info('Patient data sync completed', {
        patientId: patientId,
        medicalRecordNumber: patient.medicalRecordNumber,
        syncResults: syncResults,
        initiatedBy: userId
      });

      res.json({
        success: true,
        message: 'Patient data synchronization completed',
        data: {
          syncId: syncRecord.id,
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            medicalRecordNumber: patient.medicalRecordNumber
          },
          syncResults: syncResults,
          syncedAt: syncRecord.syncedAt,
          status: syncRecord.status
        }
      });

    } catch (error) {
      logger.error('Failed to sync patient data', {
        error: error.message,
        stack: error.stack,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to sync patient data',
        message: 'An error occurred while synchronizing patient data across hubs'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/hub-integration/workflow/:workflowType/start
 * Start an integrated workflow
 */
router.post('/workflow/:workflowType/start',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:hub_integration']),
  [
    param('workflowType').isIn(Object.keys(WORKFLOW_TYPES)).withMessage('Invalid workflow type'),
    body('patientId').optional().isUUID().withMessage('Invalid patient ID'),
    body('parameters').optional().isObject(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('scheduledFor').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const { workflowType } = req.params;
      const {
        patientId,
        parameters = {},
        priority = 'normal',
        scheduledFor
      } = req.body;

      const userId = req.user?.id;
      const workflowConfig = WORKFLOW_TYPES[workflowType];

      // Create workflow instance
      const workflowInstance = await executeQuery(
        (prisma) => prisma.integrationWorkflow.create({
          data: {
            id: uuidv4(),
            workflowType: workflowType,
            patientId: patientId,
            initiatedBy: userId,
            parameters: parameters,
            priority: priority,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            status: 'INITIATED',
            currentStep: 0,
            totalSteps: workflowConfig.steps.length,
            steps: workflowConfig.steps,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }),
        'createWorkflowInstance'
      );

      // Start workflow execution
      const executionResult = await executeWorkflow(workflowInstance);

      // Log workflow initiation
      logger.info('Integration workflow started', {
        workflowId: workflowInstance.id,
        workflowType: workflowType,
        patientId: patientId,
        initiatedBy: userId,
        priority: priority
      });

      res.status(201).json({
        success: true,
        message: 'Integration workflow started successfully',
        data: {
          workflowId: workflowInstance.id,
          workflowType: workflowType,
          status: executionResult.status,
          currentStep: executionResult.currentStep,
          totalSteps: workflowConfig.steps.length,
          estimatedCompletion: executionResult.estimatedCompletion,
          nextAction: executionResult.nextAction
        }
      });

    } catch (error) {
      logger.error('Failed to start workflow', {
        error: error.message,
        stack: error.stack,
        workflowType: req.params.workflowType,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to start workflow',
        message: 'An error occurred while starting the integration workflow'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/hub-integration/patient/:patientId/timeline
 * Get integrated patient timeline across all hubs
 */
router.get('/patient/:patientId/timeline',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('includeAssessments').optional().isBoolean(),
    query('includeForms').optional().isBoolean(),
    query('includeAppointments').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        startDate,
        endDate,
        includeAssessments = true,
        includeForms = true,
        includeAppointments = true
      } = req.query;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Security check for patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only access their own timeline'
        });
      }

      // Build date range filter
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const timeline = [];

      // Get Expedix events (appointments, prescriptions, consultations)
      if (includeAppointments) {
        const expedixEvents = await getExpedixTimelineEvents(patientId, dateFilter);
        timeline.push(...expedixEvents);
      }

      // Get Clinimetrix events (assessments, scale administrations)
      if (includeAssessments) {
        const clinimetrixEvents = await getClinimetrixTimelineEvents(patientId, dateFilter);
        timeline.push(...clinimetrixEvents);
      }

      // Get FormX events (form submissions, updates)
      if (includeForms) {
        const formxEvents = await getFormXTimelineEvents(patientId, dateFilter);
        timeline.push(...formxEvents);
      }

      // Sort timeline by date
      timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Group events by date for better visualization
      const groupedTimeline = groupTimelineByDate(timeline);

      res.json({
        success: true,
        data: {
          patientId: patientId,
          timeline: timeline,
          groupedTimeline: groupedTimeline,
          summary: {
            totalEvents: timeline.length,
            dateRange: {
              start: startDate,
              end: endDate
            },
            eventTypes: {
              expedix: timeline.filter(e => e.hub === 'expedix').length,
              clinimetrix: timeline.filter(e => e.hub === 'clinimetrix').length,
              formx: timeline.filter(e => e.hub === 'formx').length
            }
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient timeline', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient timeline',
        message: 'An error occurred while retrieving patient timeline'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/hub-integration/patient/:patientId/comprehensive-view
 * Get comprehensive patient view across all hubs
 */
router.get('/patient/:patientId/comprehensive-view',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:comprehensive_view']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const userId = req.user?.id;

      // Get comprehensive patient data
      const comprehensiveView = await buildComprehensivePatientView(patientId);

      // Log comprehensive view access
      logger.info('Comprehensive patient view accessed', {
        patientId: patientId,
        accessedBy: userId,
        dataPoints: Object.keys(comprehensiveView).length
      });

      // Audit log
      await auditLogger.logDataAccess(
        userId,
        'comprehensive_view',
        patientId,
        'view',
        {
          includedSections: Object.keys(comprehensiveView),
          dataSourceHubs: ['expedix', 'clinimetrix', 'formx']
        }
      );

      res.json({
        success: true,
        data: comprehensiveView
      });

    } catch (error) {
      logger.error('Failed to get comprehensive patient view', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve comprehensive view',
        message: 'An error occurred while building comprehensive patient view'
      });
    }
  }
);

/**
 * Helper functions for hub integration
 */

async function checkHubConnectivity() {
  const status = {
    expedix: { online: true, lastCheck: new Date() },
    clinimetrix: { online: false, lastCheck: new Date() },
    formx: { online: false, lastCheck: new Date() }
  };

  try {
    // Check Clinimetrix connectivity
    const clinimetrixResponse = await axios.get(`${HUB_CONFIG.CLINIMETRIX_URL}/health`, {
      timeout: 5000
    });
    status.clinimetrix.online = clinimetrixResponse.status === 200;
  } catch (error) {
    status.clinimetrix.error = error.message;
  }

  try {
    // Check FormX connectivity
    const formxResponse = await axios.get(`${HUB_CONFIG.FORMX_URL}/health`, {
      timeout: 5000
    });
    status.formx.online = formxResponse.status === 200;
  } catch (error) {
    status.formx.error = error.message;
  }

  return status;
}

async function getIntegrationStatistics() {
  const stats = await executeQuery(
    (prisma) => prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalPatients,
        COUNT(CASE WHEN portalAccess.isActive = true THEN 1 END) as patientsWithPortalAccess,
        COUNT(CASE WHEN appointments.status = 'confirmed' THEN 1 END) as confirmedAppointments,
        COUNT(CASE WHEN prescriptions.status = 'active' THEN 1 END) as activePrescriptions
      FROM patients 
      LEFT JOIN patient_portal_access portalAccess ON patients.id = portalAccess.patientId
      LEFT JOIN appointments ON patients.id = appointments.patientId AND appointments.appointmentDate >= CURDATE()
      LEFT JOIN prescriptions ON patients.id = prescriptions.patientId
    `,
    'getIntegrationStatistics'
  );

  return stats[0] || {
    totalPatients: 0,
    patientsWithPortalAccess: 0,
    confirmedAppointments: 0,
    activePrescriptions: 0
  };
}

async function getRecentHubActivities() {
  // This would get recent activities across all hubs
  // For now, return mock data structure
  return [
    {
      id: uuidv4(),
      type: 'patient_sync',
      description: 'Patient data synchronized across all hubs',
      timestamp: new Date(),
      hub: 'expedix'
    }
  ];
}

async function syncPatientWithClinimetrix(patient, forceSync) {
  try {
    // This would make actual API calls to Clinimetrix
    // For now, return mock sync result
    return {
      success: true,
      assessmentsFound: 3,
      scalesAdministered: 5,
      lastAssessment: new Date(),
      syncedFields: ['demographics', 'assessments', 'progress_notes']
    };
  } catch (error) {
    throw new Error(`Clinimetrix sync failed: ${error.message}`);
  }
}

async function syncPatientWithFormX(patient, forceSync) {
  try {
    // This would make actual API calls to FormX
    // For now, return mock sync result
    return {
      success: true,
      formsFound: 4,
      templatesUsed: 2,
      lastSubmission: new Date(),
      syncedFields: ['demographics', 'medical_history', 'emergency_contacts']
    };
  } catch (error) {
    throw new Error(`FormX sync failed: ${error.message}`);
  }
}

async function executeWorkflow(workflowInstance) {
  // Mock workflow execution
  // In real implementation, this would orchestrate calls across hubs
  return {
    status: 'IN_PROGRESS',
    currentStep: 1,
    estimatedCompletion: new Date(Date.now() + (2 * 60 * 60 * 1000)), // 2 hours
    nextAction: 'Wait for form completion'
  };
}

async function getExpedixTimelineEvents(patientId, dateFilter) {
  const events = [];

  // Get appointments
  const appointments = await executeQuery(
    (prisma) => prisma.appointment.findMany({
      where: {
        patientId: patientId,
        ...(Object.keys(dateFilter).length > 0 && { appointmentDate: dateFilter })
      },
      include: {
        provider: { select: { name: true } }
      },
      orderBy: { appointmentDate: 'desc' }
    }),
    'getAppointmentTimelineEvents'
  );

  events.push(...appointments.map(apt => ({
    id: apt.id,
    type: 'appointment',
    date: apt.appointmentDate,
    title: `Cita con ${apt.provider.name}`,
    description: `Cita médica - ${apt.status}`,
    hub: 'expedix',
    status: apt.status,
    metadata: {
      appointmentType: apt.appointmentType,
      duration: apt.duration
    }
  })));

  // Get prescriptions
  const prescriptions = await executeQuery(
    (prisma) => prisma.prescription.findMany({
      where: {
        patientId: patientId,
        ...(Object.keys(dateFilter).length > 0 && { prescribedAt: dateFilter })
      },
      include: {
        medication: { select: { genericName: true } }
      },
      orderBy: { prescribedAt: 'desc' }
    }),
    'getPrescriptionTimelineEvents'
  );

  events.push(...prescriptions.map(presc => ({
    id: presc.id,
    type: 'prescription',
    date: presc.prescribedAt,
    title: `Prescripción: ${presc.medication.genericName}`,
    description: `Medicamento prescrito - ${presc.status}`,
    hub: 'expedix',
    status: presc.status,
    metadata: {
      dosage: presc.dosage,
      frequency: presc.frequency
    }
  })));

  return events;
}

async function getClinimetrixTimelineEvents(patientId, dateFilter) {
  // Mock Clinimetrix events - in real implementation would call Clinimetrix API
  return [
    {
      id: uuidv4(),
      type: 'assessment',
      date: new Date(),
      title: 'Evaluación PHQ-9',
      description: 'Escala de depresión administrada',
      hub: 'clinimetrix',
      status: 'completed',
      metadata: {
        scaleName: 'PHQ-9',
        score: 12,
        severity: 'moderate'
      }
    }
  ];
}

async function getFormXTimelineEvents(patientId, dateFilter) {
  // Mock FormX events - in real implementation would call FormX API
  return [
    {
      id: uuidv4(),
      type: 'form_submission',
      date: new Date(),
      title: 'Formulario de Historia Médica',
      description: 'Historia médica actualizada',
      hub: 'formx',
      status: 'completed',
      metadata: {
        formType: 'medical_history',
        fieldsUpdated: 5
      }
    }
  ];
}

function groupTimelineByDate(timeline) {
  const grouped = {};
  
  timeline.forEach(event => {
    const dateKey = event.date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  return grouped;
}

async function buildComprehensivePatientView(patientId) {
  // Get data from Expedix
  const expedixData = await executeQuery(
    (prisma) => prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalHistory: true,
        familyHistory: true,
        prescriptions: {
          where: { status: 'active' },
          include: { medication: true }
        },
        appointments: {
          where: { appointmentDate: { gte: new Date() } },
          include: { provider: true }
        },
        documents: {
          where: { isActive: true },
          select: {
            id: true,
            originalName: true,
            category: true,
            uploadedAt: true
          }
        },
        tagAssignments: {
          where: { isActive: true },
          include: { tag: true }
        }
      }
    }),
    `getComprehensivePatientData(${patientId})`
  );

  // In real implementation, would also fetch from Clinimetrix and FormX APIs
  const comprehensiveView = {
    patient: {
      id: expedixData.id,
      firstName: expedixData.firstName,
      lastName: expedixData.lastName,
      medicalRecordNumber: expedixData.medicalRecordNumber,
      dateOfBirth: expedixData.dateOfBirth,
      email: expedixData.email,
      cellPhone: expedixData.cellPhone
    },
    medicalInfo: {
      medicalHistory: expedixData.medicalHistory,
      familyHistory: expedixData.familyHistory,
      activePrescriptions: expedixData.prescriptions,
      tags: expedixData.tagAssignments.map(ta => ta.tag)
    },
    appointments: {
      upcoming: expedixData.appointments,
      total: expedixData.appointments.length
    },
    documents: {
      available: expedixData.documents,
      total: expedixData.documents.length
    },
    assessments: {
      // Mock data - would come from Clinimetrix
      recent: [],
      total: 0
    },
    forms: {
      // Mock data - would come from FormX
      submitted: [],
      total: 0
    },
    summary: {
      lastActivity: new Date(),
      overallStatus: 'active',
      riskLevel: 'low',
      treatmentPhase: 'ongoing'
    }
  };

  return comprehensiveView;
}

module.exports = router;