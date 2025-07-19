/**
 * Healthcare Compliance API Routes for Clinimetrix Hub
 * 
 * NOM-024-SSA3-2010 compliance management endpoints for clinical assessments
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { executeQuery } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const HealthcareCompliance = require('../middleware/healthcare-compliance');

const router = express.Router();
const healthcareCompliance = new HealthcareCompliance();

/**
 * GET /api/v1/clinimetrix/compliance/status
 * Get compliance status for organization
 */
router.get('/status',
  ...middleware.utils.forRoles(['admin', 'psychiatrist', 'psychologist'], ['read:compliance']),
  async (req, res) => {
    try {
      const organizationId = req.user.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          error: 'Organization ID is required',
          message: 'User must be associated with an organization'
        });
      }

      const complianceStatus = await healthcareCompliance.getComplianceStatus(organizationId);

      res.json({
        success: true,
        data: complianceStatus
      });
    } catch (error) {
      logger.error('Failed to get compliance status', {
        error: error.message,
        organizationId: req.user?.organizationId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Compliance status retrieval failed',
        message: 'An error occurred while retrieving compliance status'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/compliance/report
 * Generate compliance report
 */
router.post('/report',
  ...middleware.utils.forRoles(['admin'], ['generate:compliance_reports']),
  [
    body('fromDate').isISO8601().withMessage('Valid from date is required'),
    body('toDate').isISO8601().withMessage('Valid to date is required'),
    body('organizationId').optional().isUUID().withMessage('Invalid organization ID format')
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

      const { fromDate, toDate, organizationId } = req.body;
      const targetOrganizationId = organizationId || req.user.organizationId;

      if (!targetOrganizationId) {
        return res.status(400).json({
          error: 'Organization ID is required',
          message: 'Organization ID must be provided or user must be associated with an organization'
        });
      }

      const complianceReport = await healthcareCompliance.generateComplianceReport(
        targetOrganizationId,
        new Date(fromDate),
        new Date(toDate)
      );

      res.json({
        success: true,
        data: complianceReport
      });
    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error.message,
        organizationId: req.body.organizationId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Compliance report generation failed',
        message: 'An error occurred while generating compliance report'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/compliance/standards
 * Get available compliance standards
 */
router.get('/standards',
  ...middleware.utils.forRoles(['admin', 'psychiatrist', 'psychologist'], ['read:compliance']),
  async (req, res) => {
    try {
      const standards = {
        'NOM-024-SSA3-2010': {
          name: 'Norma Oficial Mexicana NOM-024-SSA3-2010',
          description: 'Sistemas de información de registro electrónico para la salud. Intercambio de información en salud',
          country: 'Mexico',
          requirements: [
            {
              id: 'patient_consent',
              name: 'Patient Consent',
              description: 'Patients must provide informed consent for clinical assessments',
              mandatory: true
            },
            {
              id: 'data_encryption',
              name: 'Data Encryption',
              description: 'All healthcare data must be encrypted in transit and at rest',
              mandatory: true
            },
            {
              id: 'audit_logging',
              name: 'Audit Logging',
              description: 'All healthcare data access must be logged for audit purposes',
              mandatory: true
            },
            {
              id: 'professional_authentication',
              name: 'Professional Authentication',
              description: 'Healthcare professionals must be properly authenticated and authorized',
              mandatory: true
            },
            {
              id: 'data_retention',
              name: 'Data Retention',
              description: 'Clinical assessment data must be retained for minimum 5 years',
              mandatory: true
            },
            {
              id: 'access_control',
              name: 'Access Control',
              description: 'Role-based access control must be implemented for healthcare data',
              mandatory: true
            }
          ]
        },
        'HIPAA': {
          name: 'Health Insurance Portability and Accountability Act',
          description: 'US healthcare privacy and security regulations',
          country: 'United States',
          requirements: [
            {
              id: 'patient_consent',
              name: 'Patient Consent',
              description: 'Patients must provide consent for data usage',
              mandatory: true
            },
            {
              id: 'data_encryption',
              name: 'Data Encryption',
              description: 'PHI must be encrypted according to HIPAA requirements',
              mandatory: true
            },
            {
              id: 'audit_logging',
              name: 'Audit Logging',
              description: 'Access to PHI must be logged and monitored',
              mandatory: true
            },
            {
              id: 'access_control',
              name: 'Access Control',
              description: 'Minimum necessary access to PHI must be enforced',
              mandatory: true
            },
            {
              id: 'business_associates',
              name: 'Business Associates',
              description: 'Third-party vendors must sign business associate agreements',
              mandatory: true
            }
          ]
        }
      };

      res.json({
        success: true,
        data: standards
      });
    } catch (error) {
      logger.error('Failed to get compliance standards', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Compliance standards retrieval failed',
        message: 'An error occurred while retrieving compliance standards'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/compliance/patient-consent
 * Record patient consent for clinical assessments
 */
router.post('/patient-consent',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_consent']),
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('consentType').isIn(['clinical_assessment', 'data_sharing', 'research']).withMessage('Invalid consent type'),
    body('consentGiven').isBoolean().withMessage('Consent status is required'),
    body('consentDate').isISO8601().withMessage('Valid consent date is required'),
    body('expiresAt').optional().isISO8601().withMessage('Valid expiration date is required'),
    body('witnessName').optional().isString().isLength({ min: 2, max: 100 }),
    body('notes').optional().isString().isLength({ max: 1000 })
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
        consentType,
        consentGiven,
        consentDate,
        expiresAt,
        witnessName,
        notes
      } = req.body;
      const userId = req.user?.id;

      // Record patient consent
      const consent = await executeQuery(
        (prisma) => prisma.patientConsent.create({
          data: {
            patientId,
            consentType,
            consentGiven,
            consentDate: new Date(consentDate),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            witnessName,
            notes,
            recordedBy: userId,
            isActive: consentGiven,
            createdAt: new Date()
          }
        }),
        'recordPatientConsent'
      );

      // If consent is withdrawn, deactivate any existing active consents
      if (!consentGiven) {
        await executeQuery(
          (prisma) => prisma.patientConsent.updateMany({
            where: {
              patientId,
              consentType,
              isActive: true,
              id: { not: consent.id }
            },
            data: {
              isActive: false,
              updatedAt: new Date()
            }
          }),
          'deactivateExistingConsents'
        );
      }

      logger.info('Patient consent recorded', {
        patientId,
        consentType,
        consentGiven,
        recordedBy: userId,
        consentId: consent.id
      });

      res.status(201).json({
        success: true,
        data: consent,
        message: `Patient consent ${consentGiven ? 'granted' : 'withdrawn'} successfully`
      });
    } catch (error) {
      logger.error('Failed to record patient consent', {
        error: error.message,
        patientId: req.body.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Patient consent recording failed',
        message: 'An error occurred while recording patient consent'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/compliance/patient-consent/:patientId
 * Get patient consent status
 */
router.get('/patient-consent/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_consent']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('consentType').optional().isIn(['clinical_assessment', 'data_sharing', 'research'])
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
      const { consentType } = req.query;

      // Build where clause
      const whereClause = { patientId };
      if (consentType) {
        whereClause.consentType = consentType;
      }

      // Get patient consents
      const consents = await executeQuery(
        (prisma) => prisma.patientConsent.findMany({
          where: whereClause,
          include: {
            recordedBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        `getPatientConsents(${patientId})`
      );

      // Get current active consents
      const activeConsents = consents.filter(consent => 
        consent.isActive && 
        consent.consentGiven &&
        (!consent.expiresAt || consent.expiresAt > new Date())
      );

      res.json({
        success: true,
        data: {
          patientId,
          consents,
          activeConsents,
          summary: {
            totalConsents: consents.length,
            activeConsents: activeConsents.length,
            hasActiveClinicalAssessmentConsent: activeConsents.some(c => c.consentType === 'clinical_assessment')
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get patient consent status', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Patient consent retrieval failed',
        message: 'An error occurred while retrieving patient consent status'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/compliance/audit-logs
 * Get audit logs for compliance monitoring
 */
router.get('/audit-logs',
  ...middleware.utils.forRoles(['admin'], ['read:audit_logs']),
  [
    query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
    query('toDate').optional().isISO8601().withMessage('Valid to date is required'),
    query('eventType').optional().isString(),
    query('userId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
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

      const {
        fromDate,
        toDate,
        eventType,
        userId,
        page = 1,
        limit = 50
      } = req.query;

      // Build where clause
      const whereClause = {};
      if (fromDate) whereClause.createdAt = { gte: new Date(fromDate) };
      if (toDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(toDate) };
      if (eventType) whereClause.eventType = eventType;
      if (userId) whereClause.userId = userId;

      // Get audit logs
      const auditLogs = await executeQuery(
        (prisma) => prisma.auditLog.findMany({
          where: whereClause,
          include: {
            user: {
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
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        'getAuditLogs'
      );

      // Get total count
      const totalCount = await executeQuery(
        (prisma) => prisma.auditLog.count({
          where: whereClause
        }),
        'getAuditLogsCount'
      );

      res.json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get audit logs', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Audit logs retrieval failed',
        message: 'An error occurred while retrieving audit logs'
      });
    }
  }
);

module.exports = router;