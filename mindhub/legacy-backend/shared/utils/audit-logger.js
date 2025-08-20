/**
 * Audit Logger for Healthcare Compliance
 * 
 * Comprehensive audit logging system for healthcare data access and modifications
 * implementing requirements for NOM-024-SSA3-2010 compliance
 */

const { getPrismaClient, executeQuery } = require('../config/prisma');
const { logger } = require('../config/storage');

class AuditLogger {
  constructor() {
    this.eventTypes = {
      // Authentication events
      AUTH_SUCCESS: 'authentication_success',
      AUTH_FAILURE: 'authentication_failure',
      LOGIN_SUCCESS: 'login_success',
      LOGIN_FAILURE: 'login_failure',
      LOGOUT: 'logout',
      TOKEN_REFRESH: 'token_refresh',
      SESSION_EXPIRED: 'session_expired',
      
      // Authorization events
      ACCESS_GRANTED: 'access_granted',
      ACCESS_DENIED: 'access_denied',
      PERMISSION_DENIED: 'permission_denied',
      
      // Data access events
      PATIENT_DATA_ACCESS: 'patient_data_access',
      MEDICAL_RECORD_ACCESS: 'medical_record_access',
      ASSESSMENT_DATA_ACCESS: 'assessment_data_access',
      
      // Data modification events
      PATIENT_DATA_CREATE: 'patient_data_create',
      PATIENT_DATA_UPDATE: 'patient_data_update',
      PATIENT_DATA_DELETE: 'patient_data_delete',
      MEDICAL_RECORD_CREATE: 'medical_record_create',
      MEDICAL_RECORD_UPDATE: 'medical_record_update',
      ASSESSMENT_CREATE: 'assessment_create',
      ASSESSMENT_UPDATE: 'assessment_update',
      
      // System events
      SYSTEM_ERROR: 'system_error',
      SECURITY_INCIDENT: 'security_incident',
      COMPLIANCE_VIOLATION: 'compliance_violation'
    };
  }

  /**
   * Log authentication events
   */
  async logAuthenticationEvent(userId, eventType, eventData = {}) {
    try {
      const auditEntry = {
        userId: userId,
        eventType: this.eventTypes[eventType] || eventType,
        eventCategory: 'authentication',
        eventData: eventData,
        timestamp: new Date(),
        ipAddress: eventData.clientIP || eventData.ip || 'unknown',
        userAgent: eventData.userAgent || 'unknown',
        sessionId: eventData.sessionId || null,
        success: eventType.includes('SUCCESS') || eventType.includes('GRANTED'),
        severity: this.getEventSeverity(eventType)
      };

      await this.saveAuditEntry(auditEntry);
      
      // Log to console for immediate visibility
      logger.info('Authentication audit event', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log authentication event', {
        error: error.message,
        eventType: eventType,
        userId: userId
      });
    }
  }

  /**
   * Log data access events
   */
  async logDataAccess(userId, resourceType, resourceId, action, eventData = {}) {
    try {
      const auditEntry = {
        userId: userId,
        eventType: `${resourceType}_${action}`,
        eventCategory: 'data_access',
        resourceType: resourceType,
        resourceId: resourceId,
        action: action,
        eventData: eventData,
        timestamp: new Date(),
        ipAddress: eventData.clientIP || eventData.ip || 'unknown',
        userAgent: eventData.userAgent || 'unknown',
        sessionId: eventData.sessionId || null,
        success: true,
        severity: this.getDataAccessSeverity(resourceType, action)
      };

      await this.saveAuditEntry(auditEntry);
      
      // Log to console for immediate visibility
      logger.info('Data access audit event', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log data access event', {
        error: error.message,
        resourceType: resourceType,
        resourceId: resourceId,
        userId: userId
      });
    }
  }

  /**
   * Log data modification events
   */
  async logDataModification(userId, eventType, eventData = {}) {
    try {
      const auditEntry = {
        userId: userId,
        eventType: this.eventTypes[eventType] || eventType,
        eventCategory: 'data_modification',
        eventData: eventData,
        timestamp: new Date(),
        ipAddress: eventData.clientIP || eventData.ip || 'unknown',
        userAgent: eventData.userAgent || 'unknown',
        sessionId: eventData.sessionId || null,
        success: true,
        severity: 'medium'
      };

      await this.saveAuditEntry(auditEntry);
      
      // Log to console for immediate visibility
      logger.info('Data modification audit event', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log data modification event', {
        error: error.message,
        eventType: eventType,
        userId: userId
      });
    }
  }

  /**
   * Log security incidents
   */
  async logSecurityIncident(userId, incidentType, eventData = {}) {
    try {
      const auditEntry = {
        userId: userId,
        eventType: incidentType,
        eventCategory: 'security_incident',
        eventData: eventData,
        timestamp: new Date(),
        ipAddress: eventData.clientIP || eventData.ip || 'unknown',
        userAgent: eventData.userAgent || 'unknown',
        sessionId: eventData.sessionId || null,
        success: false,
        severity: 'high'
      };

      await this.saveAuditEntry(auditEntry);
      
      // Log to console with warning level
      logger.warn('Security incident audit event', auditEntry);
      
    } catch (error) {
      logger.error('Failed to log security incident', {
        error: error.message,
        incidentType: incidentType,
        userId: userId
      });
    }
  }

  /**
   * Log system errors
   */
  async logSystemError(userId, error, context = {}) {
    try {
      const auditEntry = {
        userId: userId,
        eventType: 'system_error',
        eventCategory: 'system',
        eventData: {
          error: error.message,
          stack: error.stack,
          context: context
        },
        timestamp: new Date(),
        ipAddress: context.clientIP || context.ip || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || null,
        success: false,
        severity: 'high'
      };

      await this.saveAuditEntry(auditEntry);
      
      // Log to console with error level
      logger.error('System error audit event', auditEntry);
      
    } catch (auditError) {
      logger.error('Failed to log system error', {
        originalError: error.message,
        auditError: auditError.message,
        userId: userId
      });
    }
  }

  /**
   * Save audit entry to database
   */
  async saveAuditEntry(auditEntry) {
    try {
      // Save to database audit table
      await executeQuery(
        (prisma) => prisma.auditLog.create({
          data: {
            userId: auditEntry.userId,
            eventType: auditEntry.eventType,
            eventCategory: auditEntry.eventCategory,
            resourceType: auditEntry.resourceType || null,
            resourceId: auditEntry.resourceId || null,
            action: auditEntry.action || null,
            eventData: auditEntry.eventData || {},
            timestamp: auditEntry.timestamp,
            ipAddress: auditEntry.ipAddress,
            userAgent: auditEntry.userAgent,
            sessionId: auditEntry.sessionId,
            success: auditEntry.success,
            severity: auditEntry.severity
          }
        }),
        'createAuditEntry'
      );
      
      // Also log to file for redundancy
      const logEntry = {
        ...auditEntry,
        timestamp: auditEntry.timestamp.toISOString()
      };
      
      logger.audit('Audit Event', logEntry);
      
    } catch (error) {
      // If database save fails, ensure we at least log to file
      logger.error('Failed to save audit entry to database', {
        error: error.message,
        auditEntry: auditEntry
      });
      
      // Fallback to console logging for compliance
      console.log('AUDIT_LOG_FALLBACK:', JSON.stringify({
        ...auditEntry,
        timestamp: auditEntry.timestamp.toISOString(),
        dbError: error.message
      }, null, 2));
      
      // Don't throw - we want to continue processing even if audit fails
    }
  }

  /**
   * Get event severity based on event type
   */
  getEventSeverity(eventType) {
    const highSeverityEvents = [
      'AUTH_FAILURE',
      'LOGIN_FAILURE',
      'ACCESS_DENIED',
      'PERMISSION_DENIED',
      'SECURITY_INCIDENT',
      'COMPLIANCE_VIOLATION'
    ];
    
    const mediumSeverityEvents = [
      'LOGIN_SUCCESS',
      'LOGOUT',
      'TOKEN_REFRESH',
      'SESSION_EXPIRED'
    ];
    
    if (highSeverityEvents.includes(eventType)) {
      return 'high';
    } else if (mediumSeverityEvents.includes(eventType)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get data access severity based on resource type and action
   */
  getDataAccessSeverity(resourceType, action) {
    const sensitiveResources = [
      'patient_data',
      'medical_records',
      'assessment_data',
      'prescription_data'
    ];
    
    const highRiskActions = ['delete', 'export', 'bulk_access'];
    
    if (sensitiveResources.includes(resourceType) && highRiskActions.includes(action)) {
      return 'high';
    } else if (sensitiveResources.includes(resourceType)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Query audit logs (for compliance reporting)
   */
  async queryAuditLogs(filters = {}) {
    try {
      const {
        userId,
        eventType,
        eventCategory,
        resourceType,
        startDate,
        endDate,
        severity,
        success,
        page = 1,
        limit = 100
      } = filters;
      
      const whereClause = {};
      
      if (userId) whereClause.userId = userId;
      if (eventType) whereClause.eventType = eventType;
      if (eventCategory) whereClause.eventCategory = eventCategory;
      if (resourceType) whereClause.resourceType = resourceType;
      if (severity) whereClause.severity = severity;
      if (success !== undefined) whereClause.success = success;
      
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }
      
      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        executeQuery(
          (prisma) => prisma.auditLog.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
          }),
          'queryAuditLogs'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({
            where: whereClause
          }),
          'countAuditLogs'
        )
      ]);
      
      logger.info('Audit log query completed', {
        filters,
        resultCount: logs.length,
        totalCount: total
      });
      
      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters
      };
      
    } catch (error) {
      logger.error('Failed to query audit logs', {
        error: error.message,
        filters: filters
      });
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate, options = {}) {
    try {
      const reportId = `compliance_${Date.now()}`;
      
      logger.info('Compliance report requested', {
        reportId,
        startDate: startDate,
        endDate: endDate,
        options: options
      });
      
      const whereClause = {};
      if (startDate) whereClause.timestamp = { gte: new Date(startDate) };
      if (endDate) {
        whereClause.timestamp = { 
          ...whereClause.timestamp, 
          lte: new Date(endDate) 
        };
      }
      
      // Get overall metrics
      const [
        totalEvents,
        authenticationEvents,
        dataAccessEvents,
        dataModificationEvents,
        securityIncidents,
        systemErrors,
        eventsByCategory,
        eventsBySeverity,
        failedEvents,
        uniqueUsers
      ] = await Promise.all([
        executeQuery(
          (prisma) => prisma.auditLog.count({ where: whereClause }),
          'countTotalEvents'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, eventCategory: 'authentication' } 
          }),
          'countAuthEvents'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, eventCategory: 'data_access' } 
          }),
          'countDataAccess'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, eventCategory: 'data_modification' } 
          }),
          'countDataModification'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, eventCategory: 'security_incident' } 
          }),
          'countSecurityIncidents'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, eventCategory: 'system' } 
          }),
          'countSystemErrors'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.groupBy({
            by: ['eventCategory'],
            where: whereClause,
            _count: { eventCategory: true }
          }),
          'groupByCategory'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.groupBy({
            by: ['severity'],
            where: whereClause,
            _count: { severity: true }
          }),
          'groupBySeverity'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({ 
            where: { ...whereClause, success: false } 
          }),
          'countFailedEvents'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.findMany({
            where: whereClause,
            select: { userId: true },
            distinct: ['userId']
          }),
          'getUniqueUsers'
        )
      ]);
      
      // Calculate compliance metrics
      const complianceMetrics = {
        totalEvents,
        authenticationEvents,
        dataAccessEvents,
        dataModificationEvents,
        securityIncidents,
        systemErrors,
        failedEvents,
        uniqueUsers: uniqueUsers.length,
        successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents * 100).toFixed(2) : 100,
        eventsByCategory: eventsByCategory.reduce((acc, item) => {
          acc[item.eventCategory] = item._count.eventCategory;
          return acc;
        }, {}),
        eventsBySeverity: eventsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {})
      };
      
      // Generate summary
      const summary = this.generateComplianceSummary(complianceMetrics);
      
      // Get recent critical events
      const criticalEvents = await executeQuery(
        (prisma) => prisma.auditLog.findMany({
          where: { 
            ...whereClause, 
            severity: 'high',
            success: false
          },
          take: 10,
          orderBy: { timestamp: 'desc' }
        }),
        'getCriticalEvents'
      );
      
      const report = {
        reportId,
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate,
          endDate: endDate
        },
        metrics: complianceMetrics,
        summary,
        criticalEvents,
        recommendations: this.generateRecommendations(complianceMetrics),
        complianceStatus: this.assessComplianceStatus(complianceMetrics)
      };
      
      logger.info('Compliance report generated successfully', {
        reportId,
        totalEvents,
        uniqueUsers: uniqueUsers.length,
        criticalEvents: criticalEvents.length
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error.message,
        startDate: startDate,
        endDate: endDate
      });
      throw error;
    }
  }
  
  /**
   * Generate compliance summary
   */
  generateComplianceSummary(metrics) {
    const summary = [];
    
    if (metrics.totalEvents === 0) {
      summary.push('No audit events recorded for the specified period.');
      return summary.join(' ');
    }
    
    summary.push(`A total of ${metrics.totalEvents} audit events were recorded.`);
    
    if (metrics.authenticationEvents > 0) {
      summary.push(`${metrics.authenticationEvents} authentication events were logged.`);
    }
    
    if (metrics.dataAccessEvents > 0) {
      summary.push(`${metrics.dataAccessEvents} data access events were recorded.`);
    }
    
    if (metrics.securityIncidents > 0) {
      summary.push(`${metrics.securityIncidents} security incidents were detected.`);
    }
    
    if (metrics.failedEvents > 0) {
      summary.push(`${metrics.failedEvents} failed events occurred (success rate: ${metrics.successRate}%).`);
    }
    
    summary.push(`${metrics.uniqueUsers} unique users were active during this period.`);
    
    return summary.join(' ');
  }
  
  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.securityIncidents > 0) {
      recommendations.push({
        priority: 'high',
        type: 'security',
        message: `${metrics.securityIncidents} security incidents detected. Review security incidents and implement additional safeguards.`
      });
    }
    
    if (metrics.failedEvents > metrics.totalEvents * 0.05) {
      recommendations.push({
        priority: 'medium',
        type: 'reliability',
        message: `High failure rate detected (${((metrics.failedEvents / metrics.totalEvents) * 100).toFixed(1)}%). Review system reliability and error handling.`
      });
    }
    
    if (metrics.dataAccessEvents > metrics.totalEvents * 0.7) {
      recommendations.push({
        priority: 'low',
        type: 'data_governance',
        message: 'High volume of data access events. Consider implementing additional data governance controls.'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Assess overall compliance status
   */
  assessComplianceStatus(metrics) {
    let status = 'compliant';
    const issues = [];
    
    if (metrics.securityIncidents > 0) {
      status = 'non_compliant';
      issues.push('Security incidents detected');
    }
    
    if (metrics.failedEvents > metrics.totalEvents * 0.1) {
      status = 'at_risk';
      issues.push('High failure rate');
    }
    
    if (metrics.authenticationEvents === 0 && metrics.totalEvents > 0) {
      status = 'at_risk';
      issues.push('No authentication events logged');
    }
    
    return {
      status,
      issues,
      lastAssessed: new Date().toISOString()
    };
  }
  
  /**
   * Add HTTP request logging methods
   */
  async logHttpRequest(userId, method, path, ip, metadata = {}) {
    try {
      await this.logDataAccess(userId, 'http_request', path, 'request', {
        method,
        ip,
        ...metadata
      });
    } catch (error) {
      logger.error('Failed to log HTTP request', {
        error: error.message,
        userId,
        method,
        path
      });
    }
  }
  
  async logHttpResponse(userId, method, path, statusCode, duration, metadata = {}) {
    try {
      await this.logDataAccess(userId, 'http_response', path, 'response', {
        method,
        statusCode,
        duration,
        ...metadata
      });
    } catch (error) {
      logger.error('Failed to log HTTP response', {
        error: error.message,
        userId,
        method,
        path,
        statusCode
      });
    }
  }
  
  async logError(userId, errorName, errorMessage, metadata = {}) {
    try {
      await this.logSystemError(userId, new Error(errorMessage), {
        errorName,
        ...metadata
      });
    } catch (error) {
      logger.error('Failed to log error', {
        error: error.message,
        userId,
        errorName,
        errorMessage
      });
    }
  }

  /**
   * Hub interaction logging methods for inter-hub communication audit
   */
  async logHubInteraction(interactionData) {
    try {
      const auditEntry = {
        userId: interactionData.userId,
        eventType: 'hub_interaction_started',
        eventCategory: 'inter_hub_communication',
        resourceType: 'hub_link',
        resourceId: interactionData.tokenId,
        action: interactionData.operation,
        eventData: {
          sourceHub: interactionData.sourceHub,
          targetHub: interactionData.targetHub,
          operation: interactionData.operation,
          entityId: interactionData.entityId,
          tokenId: interactionData.tokenId
        },
        timestamp: new Date(),
        ipAddress: interactionData.ipAddress || 'unknown',
        userAgent: interactionData.userAgent || 'unknown',
        sessionId: interactionData.tokenId,
        success: true,
        severity: 'medium'
      };

      await this.saveAuditEntry(auditEntry);
      logger.info('Hub interaction started', auditEntry.eventData);

    } catch (error) {
      logger.error('Failed to log hub interaction', {
        error: error.message,
        interactionData
      });
    }
  }

  async logHubInteractionComplete(completionData) {
    try {
      const auditEntry = {
        userId: completionData.userId,
        eventType: 'hub_interaction_completed',
        eventCategory: 'inter_hub_communication',
        resourceType: 'hub_link',
        resourceId: completionData.tokenId,
        action: completionData.operation,
        eventData: {
          sourceHub: completionData.sourceHub,
          targetHub: completionData.targetHub,
          operation: completionData.operation,
          entityId: completionData.entityId,
          method: completionData.method,
          path: completionData.path,
          statusCode: completionData.statusCode,
          duration: completionData.duration,
          requestSize: completionData.requestSize,
          responseSize: completionData.responseSize,
          tokenId: completionData.tokenId
        },
        timestamp: new Date(),
        ipAddress: completionData.ipAddress || 'unknown',
        userAgent: completionData.userAgent || 'unknown',
        sessionId: completionData.tokenId,
        success: completionData.statusCode >= 200 && completionData.statusCode < 400,
        severity: completionData.statusCode >= 400 ? 'high' : 'low'
      };

      await this.saveAuditEntry(auditEntry);
      logger.info('Hub interaction completed', auditEntry.eventData);

    } catch (error) {
      logger.error('Failed to log hub interaction completion', {
        error: error.message,
        completionData
      });
    }
  }

  async logTokenGeneration(tokenData) {
    try {
      const auditEntry = {
        userId: tokenData.userId,
        eventType: 'hub_token_generated',
        eventCategory: 'inter_hub_communication',
        resourceType: 'hub_token',
        resourceId: tokenData.entityId,
        action: 'generate_token',
        eventData: {
          tokenType: tokenData.tokenType,
          entityId: tokenData.entityId,
          sourceHub: tokenData.sourceHub,
          requestingHub: tokenData.requestingHub
        },
        timestamp: new Date(),
        ipAddress: tokenData.ipAddress || 'unknown',
        userAgent: 'system',
        sessionId: null,
        success: true,
        severity: 'medium'
      };

      await this.saveAuditEntry(auditEntry);
      logger.info('Hub token generated', auditEntry.eventData);

    } catch (error) {
      logger.error('Failed to log token generation', {
        error: error.message,
        tokenData
      });
    }
  }

  async logUnauthorizedAccess(accessData) {
    try {
      const auditEntry = {
        userId: accessData.userId,
        eventType: 'unauthorized_hub_access',
        eventCategory: 'security_incident',
        resourceType: 'hub_link',
        resourceId: accessData.operation,
        action: 'access_denied',
        eventData: {
          requiredPermission: accessData.requiredPermission,
          userPermissions: accessData.userPermissions,
          operation: accessData.operation,
          attemptedResource: accessData.resource
        },
        timestamp: new Date(),
        ipAddress: accessData.ipAddress || 'unknown',
        userAgent: 'system',
        sessionId: null,
        success: false,
        severity: 'high'
      };

      await this.saveAuditEntry(auditEntry);
      logger.warn('Unauthorized hub access attempt', auditEntry.eventData);

    } catch (error) {
      logger.error('Failed to log unauthorized access', {
        error: error.message,
        accessData
      });
    }
  }

  /**
   * Query hub interaction logs for monitoring and compliance
   */
  async queryHubInteractions(filters = {}) {
    try {
      const {
        userId,
        sourceHub,
        targetHub,
        operation,
        startDate,
        endDate,
        success,
        page = 1,
        limit = 50
      } = filters;

      const whereClause = {
        eventCategory: 'inter_hub_communication'
      };

      if (userId) whereClause.userId = userId;
      if (success !== undefined) whereClause.success = success;

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }

      // Additional filtering by eventData JSON fields would require raw SQL
      // For now, we'll filter in application layer for sourceHub/targetHub/operation

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        executeQuery(
          (prisma) => prisma.auditLog.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
          }),
          'queryHubInteractions'
        ),
        executeQuery(
          (prisma) => prisma.auditLog.count({
            where: whereClause
          }),
          'countHubInteractions'
        )
      ]);

      // Filter in application layer for JSON fields
      let filteredLogs = logs;
      if (sourceHub || targetHub || operation) {
        filteredLogs = logs.filter(log => {
          const eventData = log.eventData || {};
          if (sourceHub && eventData.sourceHub !== sourceHub) return false;
          if (targetHub && eventData.targetHub !== targetHub) return false;
          if (operation && eventData.operation !== operation) return false;
          return true;
        });
      }

      logger.info('Hub interaction query completed', {
        filters,
        resultCount: filteredLogs.length,
        totalCount: total
      });

      return {
        logs: filteredLogs,
        total: filteredLogs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredLogs.length / limit),
        filters
      };

    } catch (error) {
      logger.error('Failed to query hub interactions', {
        error: error.message,
        filters
      });
      throw error;
    }
  }
}

module.exports = AuditLogger;