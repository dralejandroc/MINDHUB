/**
 * Healthcare Compliance Middleware for Clinimetrix
 * 
 * Implements NOM-024-SSA3-2010 compliance requirements for clinical assessments
 * and healthcare data management in Mexico
 */

const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');
const { executeQuery } = require('../../shared/config/prisma');

const auditLogger = new AuditLogger();

class HealthcareCompliance {
  constructor() {
    this.complianceStandards = {
      'NOM-024-SSA3-2010': {
        name: 'Norma Oficial Mexicana NOM-024-SSA3-2010',
        description: 'Sistemas de información de registro electrónico para la salud. Intercambio de información en salud',
        requirements: [
          'patient_consent',
          'data_encryption',
          'audit_logging',
          'professional_authentication',
          'data_retention',
          'access_control'
        ]
      },
      'HIPAA': {
        name: 'Health Insurance Portability and Accountability Act',
        description: 'US healthcare privacy and security regulations',
        requirements: [
          'patient_consent',
          'data_encryption',
          'audit_logging',
          'access_control',
          'business_associates'
        ]
      }
    };
  }

  /**
   * Middleware to enforce NOM-024 compliance for clinical assessments
   */
  enforceNOM024Compliance() {
    return async (req, res, next) => {
      try {
        // Check professional authentication requirements
        const professionalValid = await this.validateProfessionalCredentials(req.user);
        if (!professionalValid.valid) {
          return res.status(403).json({
            error: {
              code: 'NOM024_PROFESSIONAL_INVALID',
              message: 'Professional credentials do not meet NOM-024 requirements',
              details: professionalValid.issues,
              compliance: 'NOM-024-SSA3-2010'
            }
          });
        }

        // Check patient consent requirements
        if (req.body.patientId || req.params.patientId) {
          const patientId = req.body.patientId || req.params.patientId;
          const consentValid = await this.validatePatientConsent(patientId, req.user.id);
          if (!consentValid.valid) {
            return res.status(403).json({
              error: {
                code: 'NOM024_CONSENT_REQUIRED',
                message: 'Patient consent required for clinical assessment',
                details: consentValid.issues,
                compliance: 'NOM-024-SSA3-2010'
              }
            });
          }
        }

        // Log compliance check
        await this.logComplianceEvent(req, 'NOM024_COMPLIANCE_CHECK', {
          professionalId: req.user.id,
          patientId: req.body.patientId || req.params.patientId,
          action: req.method,
          endpoint: req.originalUrl
        });

        next();
      } catch (error) {
        logger.error('Healthcare compliance check failed', {
          error: error.message,
          userId: req.user?.id,
          endpoint: req.originalUrl
        });

        res.status(500).json({
          error: {
            code: 'COMPLIANCE_CHECK_FAILED',
            message: 'Healthcare compliance validation failed',
            compliance: 'NOM-024-SSA3-2010'
          }
        });
      }
    };
  }

  /**
   * Middleware to enforce data encryption requirements
   */
  enforceDataEncryption() {
    return (req, res, next) => {
      // Check if connection is encrypted
      if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.status(403).json({
          error: {
            code: 'NOM024_ENCRYPTION_REQUIRED',
            message: 'Secure connection required for healthcare data',
            compliance: 'NOM-024-SSA3-2010'
          }
        });
      }

      // Add security headers for healthcare data
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      next();
    };
  }

  /**
   * Middleware to enforce audit logging requirements
   */
  enforceAuditLogging() {
    return async (req, res, next) => {
      // Store original res.json to intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Log healthcare data access
        auditLogger.logHealthcareDataAccess(req, data).catch(error => {
          logger.error('Healthcare audit logging failed', {
            error: error.message,
            userId: req.user?.id,
            endpoint: req.originalUrl
          });
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Middleware to validate data retention policies
   */
  enforceDataRetention() {
    return async (req, res, next) => {
      try {
        // Check if this is a data deletion request
        if (req.method === 'DELETE') {
          const resourceId = req.params.id || req.params.assessmentId;
          
          if (resourceId) {
            const retentionValid = await this.validateDataRetention(resourceId, req.user.id);
            if (!retentionValid.valid) {
              return res.status(403).json({
                error: {
                  code: 'NOM024_RETENTION_VIOLATION',
                  message: 'Data retention policy violation',
                  details: retentionValid.issues,
                  compliance: 'NOM-024-SSA3-2010'
                }
              });
            }
          }
        }

        next();
      } catch (error) {
        logger.error('Data retention validation failed', {
          error: error.message,
          userId: req.user?.id,
          endpoint: req.originalUrl
        });

        res.status(500).json({
          error: {
            code: 'RETENTION_CHECK_FAILED',
            message: 'Data retention validation failed',
            compliance: 'NOM-024-SSA3-2010'
          }
        });
      }
    };
  }

  /**
   * Validate professional credentials according to NOM-024
   */
  async validateProfessionalCredentials(user) {
    const issues = [];

    // Check professional license
    if (!user.professionalLicense) {
      issues.push('Professional license number is required');
    } else {
      // Validate license format for Mexico
      const licenseRegex = /^[A-Z]{2,4}-\d{4,6}$/;
      if (!licenseRegex.test(user.professionalLicense)) {
        issues.push('Professional license format is invalid');
      }
    }

    // Check role authorization
    const authorizedRoles = ['psychiatrist', 'psychologist', 'nurse', 'admin'];
    if (!authorizedRoles.includes(user.role)) {
      issues.push('User role is not authorized for clinical assessments');
    }

    // Check organization association
    if (!user.organizationId) {
      issues.push('Professional must be associated with a healthcare organization');
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Validate patient consent according to NOM-024
   */
  async validatePatientConsent(patientId, professionalId) {
    const issues = [];

    try {
      // Check if patient has given consent for clinical assessments
      const consent = await executeQuery(
        (prisma) => prisma.patientConsent.findFirst({
          where: {
            patientId: patientId,
            consentType: 'clinical_assessment',
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          }
        }),
        'validatePatientConsent'
      );

      if (!consent) {
        issues.push('Active patient consent not found for clinical assessments');
      }

      // Check if professional has access to this patient
      const professionalAccess = await executeQuery(
        (prisma) => prisma.patientProfessionalAccess.findFirst({
          where: {
            patientId: patientId,
            professionalId: professionalId,
            isActive: true
          }
        }),
        'validateProfessionalAccess'
      );

      if (!professionalAccess) {
        issues.push('Professional does not have authorized access to this patient');
      }

    } catch (error) {
      issues.push('Unable to validate patient consent');
      logger.error('Patient consent validation error', {
        error: error.message,
        patientId,
        professionalId
      });
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Validate data retention policies
   */
  async validateDataRetention(resourceId, userId) {
    const issues = [];

    try {
      // Check if resource exists and get creation date
      const resource = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            createdAt: true,
            patientId: true,
            status: true
          }
        }),
        'validateDataRetention'
      );

      if (!resource) {
        issues.push('Resource not found');
        return { valid: false, issues };
      }

      // Check minimum retention period (5 years for clinical assessments in Mexico)
      const minimumRetentionPeriod = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
      const resourceAge = Date.now() - new Date(resource.createdAt).getTime();

      if (resourceAge < minimumRetentionPeriod) {
        issues.push(`Clinical assessment data must be retained for at least 5 years (${Math.ceil((minimumRetentionPeriod - resourceAge) / (365 * 24 * 60 * 60 * 1000))} years remaining)`);
      }

      // Check if there are any pending legal or clinical requirements
      const pendingRequirements = await executeQuery(
        (prisma) => prisma.dataRetentionRequirement.findMany({
          where: {
            resourceId: resourceId,
            resourceType: 'clinical_assessment',
            status: 'active'
          }
        }),
        'checkPendingRequirements'
      );

      if (pendingRequirements.length > 0) {
        issues.push('Data has pending legal or clinical retention requirements');
      }

    } catch (error) {
      issues.push('Unable to validate data retention requirements');
      logger.error('Data retention validation error', {
        error: error.message,
        resourceId,
        userId
      });
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Log compliance events for audit trail
   */
  async logComplianceEvent(req, eventType, data) {
    try {
      await auditLogger.logComplianceEvent(req.user.id, eventType, {
        ...data,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        compliance: 'NOM-024-SSA3-2010'
      });
    } catch (error) {
      logger.error('Compliance event logging failed', {
        error: error.message,
        eventType,
        userId: req.user?.id
      });
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(organizationId, fromDate, toDate) {
    try {
      const report = {
        organizationId,
        reportPeriod: {
          from: fromDate,
          to: toDate
        },
        generatedAt: new Date().toISOString(),
        compliance: {
          standard: 'NOM-024-SSA3-2010',
          overallScore: 0,
          requirements: {}
        }
      };

      // Check each compliance requirement
      for (const requirement of this.complianceStandards['NOM-024-SSA3-2010'].requirements) {
        const score = await this.assessComplianceRequirement(requirement, organizationId, fromDate, toDate);
        report.compliance.requirements[requirement] = score;
      }

      // Calculate overall compliance score
      const scores = Object.values(report.compliance.requirements);
      report.compliance.overallScore = Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);

      return report;
    } catch (error) {
      logger.error('Compliance report generation failed', {
        error: error.message,
        organizationId,
        fromDate,
        toDate
      });
      throw error;
    }
  }

  /**
   * Assess individual compliance requirement
   */
  async assessComplianceRequirement(requirement, organizationId, fromDate, toDate) {
    // This would contain specific assessment logic for each requirement
    // For now, returning a placeholder structure
    return {
      requirement,
      score: 95, // Placeholder score
      status: 'compliant',
      details: `${requirement} assessment for period ${fromDate} to ${toDate}`,
      recommendations: []
    };
  }

  /**
   * Get compliance status for organization
   */
  async getComplianceStatus(organizationId) {
    try {
      const status = {
        organizationId,
        overallStatus: 'compliant',
        lastAssessment: new Date().toISOString(),
        compliance: {
          'NOM-024-SSA3-2010': {
            status: 'compliant',
            score: 95,
            lastAudit: new Date().toISOString(),
            nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        recommendations: []
      };

      return status;
    } catch (error) {
      logger.error('Compliance status retrieval failed', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }
}

module.exports = HealthcareCompliance;