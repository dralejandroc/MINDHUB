/**
 * Comprehensive Audit Logger for MindHub Healthcare Platform
 * 
 * Advanced logging system with healthcare compliance requirements,
 * structured logging, and audit trail management
 */

const winston = require('winston');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../../logs');
    this.ensureLogDirectory();
    
    // Create different loggers for different purposes
    this.auditLogger = this.createAuditLogger();
    this.securityLogger = this.createSecurityLogger();
    this.complianceLogger = this.createComplianceLogger();
    this.systemLogger = this.createSystemLogger();
    this.performanceLogger = this.createPerformanceLogger();
    
    // Log levels
    this.logLevels = {
      emergency: 0,   // System is unusable
      alert: 1,       // Action must be taken immediately
      critical: 2,    // Critical conditions
      error: 3,       // Error conditions
      warning: 4,     // Warning conditions
      notice: 5,      // Normal but significant condition
      info: 6,        // Informational messages
      debug: 7        // Debug-level messages
    };

    // Healthcare event types for compliance tracking
    this.healthcareEventTypes = {
      PATIENT_DATA_ACCESS: 'patient_data_access',
      PATIENT_DATA_MODIFICATION: 'patient_data_modification',
      CLINICAL_ASSESSMENT_ACCESS: 'clinical_assessment_access',
      CLINICAL_ASSESSMENT_CREATION: 'clinical_assessment_creation',
      MEDICAL_RECORD_ACCESS: 'medical_record_access',
      MEDICAL_RECORD_MODIFICATION: 'medical_record_modification',
      PRESCRIPTION_ACCESS: 'prescription_access',
      PRESCRIPTION_CREATION: 'prescription_creation',
      FORM_SUBMISSION: 'form_submission',
      RESOURCE_ACCESS: 'resource_access',
      EMERGENCY_ACCESS: 'emergency_access',
      CONSENT_MODIFICATION: 'consent_modification',
      DATA_EXPORT: 'data_export',
      DATA_IMPORT: 'data_import',
      BACKUP_OPERATION: 'backup_operation',
      SYSTEM_CONFIGURATION_CHANGE: 'system_configuration_change'
    };
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Create subdirectories for different log types
    const logTypes = ['audit', 'security', 'compliance', 'system', 'performance', 'errors'];
    logTypes.forEach(type => {
      const typeDir = path.join(this.logDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
    });
  }

  /**
   * Create audit logger for healthcare data access
   */
  createAuditLogger() {
    return winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(info => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            eventType: info.eventType,
            userId: info.userId,
            sessionId: info.sessionId,
            ip: info.ip,
            userAgent: info.userAgent,
            resource: info.resource,
            action: info.action,
            details: info.details,
            patientId: info.patientId,
            organizationId: info.organizationId,
            complianceFlags: info.complianceFlags,
            dataClassification: info.dataClassification,
            auditId: info.auditId || this.generateAuditId()
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'audit', 'healthcare-audit.log'),
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 30, // Keep 30 files
          tailable: true
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'audit', 'healthcare-audit-error.log'),
          level: 'error',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10
        })
      ]
    });
  }

  /**
   * Create security logger for security events
   */
  createSecurityLogger() {
    return winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(info => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            securityEventType: info.securityEventType,
            userId: info.userId,
            sessionId: info.sessionId,
            ip: info.ip,
            userAgent: info.userAgent,
            threatLevel: info.threatLevel,
            action: info.action,
            result: info.result,
            details: info.details,
            geolocation: info.geolocation,
            deviceFingerprint: info.deviceFingerprint,
            securityId: info.securityId || this.generateSecurityId()
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'security', 'security-events.log'),
          maxsize: 100 * 1024 * 1024,
          maxFiles: 50,
          tailable: true
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'security', 'security-critical.log'),
          level: 'critical',
          maxsize: 50 * 1024 * 1024,
          maxFiles: 100
        })
      ]
    });
  }

  /**
   * Create compliance logger for regulatory compliance
   */
  createComplianceLogger() {
    return winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(info => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            regulation: info.regulation || 'NOM-024-SSA3-2010',
            complianceEventType: info.complianceEventType,
            userId: info.userId,
            userRole: info.userRole,
            professionalLicense: info.professionalLicense,
            organizationId: info.organizationId,
            patientId: info.patientId,
            dataType: info.dataType,
            action: info.action,
            justification: info.justification,
            consentStatus: info.consentStatus,
            retentionPolicy: info.retentionPolicy,
            encryptionStatus: info.encryptionStatus,
            accessLevel: info.accessLevel,
            details: info.details,
            complianceId: info.complianceId || this.generateComplianceId()
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'compliance', 'nom-024-compliance.log'),
          maxsize: 200 * 1024 * 1024, // 200MB
          maxFiles: 365, // Keep for 1 year
          tailable: true
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'compliance', 'compliance-violations.log'),
          level: 'warning',
          maxsize: 100 * 1024 * 1024,
          maxFiles: 100
        })
      ]
    });
  }

  /**
   * Create system logger for system events
   */
  createSystemLogger() {
    return winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'system', 'system.log'),
          maxsize: 50 * 1024 * 1024,
          maxFiles: 20
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'system', 'system-error.log'),
          level: 'error',
          maxsize: 50 * 1024 * 1024,
          maxFiles: 20
        }),
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Create performance logger
   */
  createPerformanceLogger() {
    return winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'performance', 'performance.log'),
          maxsize: 100 * 1024 * 1024,
          maxFiles: 30
        })
      ]
    });
  }

  /**
   * Log healthcare data access for compliance
   */
  async logDataAccess(userId, eventType, details = {}) {
    const auditEntry = {
      level: 'info',
      eventType: this.healthcareEventTypes[eventType] || eventType,
      userId: userId,
      sessionId: details.sessionId,
      ip: details.ip,
      userAgent: details.userAgent,
      resource: details.resource,
      action: details.action || 'READ',
      patientId: details.patientId,
      organizationId: details.organizationId,
      dataClassification: details.dataClassification || 'PHI',
      complianceFlags: details.complianceFlags || ['NOM-024-SSA3-2010'],
      details: this.sanitizeDetails(details),
      auditId: this.generateAuditId()
    };

    this.auditLogger.info(auditEntry);

    // Also log to compliance logger for regulatory tracking
    if (this.isComplianceRelevant(eventType)) {
      await this.logComplianceEvent(userId, eventType, details);
    }
  }

  /**
   * Log clinical events with professional validation
   */
  async logClinicalEvent(userId, eventType, details = {}) {
    const clinicalEntry = {
      level: details.level || 'info',
      eventType: eventType,
      userId: userId,
      userRole: details.userRole,
      professionalLicense: details.professionalLicense,
      sessionId: details.sessionId,
      ip: details.ip,
      userAgent: details.userAgent,
      patientId: details.patientId,
      assessmentId: details.assessmentId,
      scaleId: details.scaleId,
      clinicalAction: details.action,
      clinicalSeverity: details.severity,
      intervention: details.intervention,
      followUpRequired: details.followUpRequired,
      organizationId: details.organizationId,
      details: this.sanitizeDetails(details),
      auditId: this.generateAuditId()
    };

    this.auditLogger.info(clinicalEntry);

    // Enhanced compliance logging for clinical events
    await this.logComplianceEvent(userId, 'CLINICAL_EVENT', {
      ...details,
      clinicalEventType: eventType,
      requiresProfessionalValidation: true
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(userId, eventType, details = {}) {
    const securityEntry = {
      level: details.level || this.determineSecurityLevel(eventType),
      securityEventType: eventType,
      userId: userId,
      sessionId: details.sessionId,
      ip: details.ip,
      userAgent: details.userAgent,
      threatLevel: details.threatLevel || this.determineThreatLevel(eventType),
      action: details.action,
      result: details.result || 'UNKNOWN',
      geolocation: details.geolocation,
      deviceFingerprint: details.deviceFingerprint,
      authenticationMethod: details.authenticationMethod,
      failureReason: details.failureReason,
      suspiciousActivity: details.suspiciousActivity,
      details: this.sanitizeDetails(details),
      securityId: this.generateSecurityId()
    };

    this.securityLogger.log(securityEntry.level, securityEntry);

    // Alert for critical security events
    if (securityEntry.threatLevel === 'CRITICAL' || securityEntry.level === 'critical') {
      await this.alertSecurityTeam(securityEntry);
    }
  }

  /**
   * Log compliance events for regulatory tracking
   */
  async logComplianceEvent(userId, eventType, details = {}) {
    const complianceEntry = {
      level: details.level || 'info',
      regulation: details.regulation || 'NOM-024-SSA3-2010',
      complianceEventType: eventType,
      userId: userId,
      userRole: details.userRole,
      professionalLicense: details.professionalLicense,
      organizationId: details.organizationId,
      patientId: details.patientId,
      dataType: details.dataType,
      action: details.action,
      justification: details.justification,
      consentStatus: details.consentStatus,
      retentionPolicy: details.retentionPolicy,
      encryptionStatus: details.encryptionStatus,
      accessLevel: details.accessLevel,
      legalBasis: details.legalBasis,
      dataMinimization: details.dataMinimization,
      purposeLimitation: details.purposeLimitation,
      details: this.sanitizeDetails(details),
      complianceId: this.generateComplianceId()
    };

    this.complianceLogger.info(complianceEntry);

    // Check for compliance violations
    if (this.isComplianceViolation(complianceEntry)) {
      await this.handleComplianceViolation(complianceEntry);
    }
  }

  /**
   * Log system events
   */
  async logSystemEvent(userId, eventType, details = {}) {
    const systemEntry = {
      level: details.level || 'info',
      systemEventType: eventType,
      userId: userId || 'system',
      component: details.component,
      service: details.service,
      action: details.action,
      result: details.result,
      performance: details.performance,
      errorDetails: details.error,
      configuration: details.configuration,
      details: this.sanitizeDetails(details),
      systemId: this.generateSystemId()
    };

    this.systemLogger.log(systemEntry.level, systemEntry);
  }

  /**
   * Log performance metrics
   */
  async logPerformance(operation, metrics = {}) {
    const performanceEntry = {
      level: 'info',
      operation: operation,
      duration: metrics.duration,
      responseTime: metrics.responseTime,
      throughput: metrics.throughput,
      errorRate: metrics.errorRate,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
      databaseQueries: metrics.databaseQueries,
      cacheHitRate: metrics.cacheHitRate,
      userAgent: metrics.userAgent,
      endpoint: metrics.endpoint,
      method: metrics.method,
      statusCode: metrics.statusCode,
      details: metrics.details,
      performanceId: this.generatePerformanceId()
    };

    this.performanceLogger.info(performanceEntry);

    // Alert for performance issues
    if (this.isPerformanceIssue(performanceEntry)) {
      await this.alertPerformanceTeam(performanceEntry);
    }
  }

  /**
   * Performance monitoring middleware
   */
  performanceMiddleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      // Capture original methods
      const originalSend = res.send;
      const originalJson = res.json;

      // Override response methods to capture metrics
      res.send = function(data) {
        res.locals.responseSize = Buffer.byteLength(data || '');
        return originalSend.call(this, data);
      };

      res.json = function(data) {
        res.locals.responseSize = Buffer.byteLength(JSON.stringify(data || {}));
        return originalJson.call(this, data);
      };

      // Log performance when response finishes
      res.on('finish', async () => {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        const metrics = {
          duration: endTime - startTime,
          responseTime: endTime - startTime,
          memoryUsage: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal,
            external: endMemory.external
          },
          responseSize: res.locals.responseSize || 0,
          statusCode: res.statusCode,
          method: req.method,
          endpoint: req.route?.path || req.path,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          userId: req.user?.id
        };

        await this.logPerformance(`${req.method} ${req.path}`, metrics);
      });

      next();
    };
  }

  /**
   * Generate unique audit ID
   */
  generateAuditId() {
    return `AUD_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique security ID
   */
  generateSecurityId() {
    return `SEC_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique compliance ID
   */
  generateComplianceId() {
    return `CMP_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique system ID
   */
  generateSystemId() {
    return `SYS_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique performance ID
   */
  generatePerformanceId() {
    return `PRF_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Sanitize details to remove sensitive information
   */
  sanitizeDetails(details) {
    if (!details || typeof details !== 'object') return details;

    const sanitized = { ...details };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'ssn', 'curp', 'medical_record_number', 'credit_card'
    ];

    function sanitizeObject(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Determine security level based on event type
   */
  determineSecurityLevel(eventType) {
    const criticalEvents = [
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'PRIVILEGE_ESCALATION',
      'DATA_BREACH_DETECTED',
      'MALICIOUS_ACTIVITY_DETECTED'
    ];

    const warningEvents = [
      'FAILED_LOGIN_ATTEMPT',
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_EXCEEDED'
    ];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  }

  /**
   * Determine threat level
   */
  determineThreatLevel(eventType) {
    const criticalThreats = [
      'DATA_BREACH_DETECTED',
      'MALICIOUS_ACTIVITY_DETECTED',
      'PRIVILEGE_ESCALATION'
    ];

    const highThreats = [
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'SUSPICIOUS_ACTIVITY'
    ];

    const mediumThreats = [
      'FAILED_LOGIN_ATTEMPT',
      'RATE_LIMIT_EXCEEDED'
    ];

    if (criticalThreats.includes(eventType)) return 'CRITICAL';
    if (highThreats.includes(eventType)) return 'HIGH';
    if (mediumThreats.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Check if event is compliance relevant
   */
  isComplianceRelevant(eventType) {
    const complianceEvents = [
      'PATIENT_DATA_ACCESS',
      'PATIENT_DATA_MODIFICATION',
      'CLINICAL_ASSESSMENT_ACCESS',
      'MEDICAL_RECORD_ACCESS',
      'PRESCRIPTION_ACCESS',
      'EMERGENCY_ACCESS',
      'DATA_EXPORT'
    ];

    return complianceEvents.includes(eventType);
  }

  /**
   * Check for compliance violations
   */
  isComplianceViolation(complianceEntry) {
    // Check for various compliance violation patterns
    if (complianceEntry.accessLevel === 'UNAUTHORIZED') return true;
    if (complianceEntry.consentStatus === 'REVOKED') return true;
    if (complianceEntry.encryptionStatus === 'UNENCRYPTED' && complianceEntry.dataType === 'PHI') return true;
    if (complianceEntry.justification === 'NONE' && complianceEntry.dataType === 'SENSITIVE') return true;
    
    return false;
  }

  /**
   * Check for performance issues
   */
  isPerformanceIssue(performanceEntry) {
    return performanceEntry.duration > 5000 || // 5 seconds
           performanceEntry.errorRate > 0.1 ||  // 10% error rate
           (performanceEntry.memoryUsage?.heapUsed > 100 * 1024 * 1024); // 100MB memory increase
  }

  /**
   * Handle compliance violation
   */
  async handleComplianceViolation(complianceEntry) {
    // Log as critical
    this.complianceLogger.critical('COMPLIANCE_VIOLATION_DETECTED', complianceEntry);
    
    // Alert compliance team
    console.error('COMPLIANCE VIOLATION DETECTED:', complianceEntry);
    
    // In production, this would trigger alerts to compliance officers
  }

  /**
   * Alert security team for critical events
   */
  async alertSecurityTeam(securityEntry) {
    console.error('CRITICAL SECURITY EVENT:', securityEntry);
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
  }

  /**
   * Alert performance team for issues
   */
  async alertPerformanceTeam(performanceEntry) {
    console.warn('PERFORMANCE ISSUE DETECTED:', performanceEntry);
    // In production, this would send performance alerts
  }
}

module.exports = AuditLogger;