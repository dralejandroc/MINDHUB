/**
 * Comprehensive Error Handling Middleware for MindHub Healthcare Platform
 * 
 * Advanced error handling with healthcare-specific error types,
 * compliance logging, and structured error responses
 */

const AuditLogger = require('../utils/audit-logger');
const { v4: uuidv4 } = require('uuid');

class ErrorHandlingMiddleware {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Healthcare-specific error types
    this.errorTypes = {
      VALIDATION_ERROR: {
        statusCode: 400,
        category: 'client_error',
        severity: 'low',
        recoverable: true
      },
      AUTHENTICATION_ERROR: {
        statusCode: 401,
        category: 'security_error',
        severity: 'medium',
        recoverable: true
      },
      AUTHORIZATION_ERROR: {
        statusCode: 403,
        category: 'security_error',
        severity: 'medium',
        recoverable: false
      },
      PATIENT_ACCESS_DENIED: {
        statusCode: 403,
        category: 'compliance_error',
        severity: 'high',
        recoverable: false
      },
      RESOURCE_NOT_FOUND: {
        statusCode: 404,
        category: 'client_error',
        severity: 'low',
        recoverable: true
      },
      DUPLICATE_RESOURCE: {
        statusCode: 409,
        category: 'business_logic_error',
        severity: 'medium',
        recoverable: true
      },
      RATE_LIMIT_EXCEEDED: {
        statusCode: 429,
        category: 'security_error',
        severity: 'medium',
        recoverable: true
      },
      BUSINESS_LOGIC_ERROR: {
        statusCode: 422,
        category: 'business_logic_error',
        severity: 'medium',
        recoverable: true
      },
      DATABASE_ERROR: {
        statusCode: 500,
        category: 'system_error',
        severity: 'high',
        recoverable: false
      },
      EXTERNAL_SERVICE_ERROR: {
        statusCode: 502,
        category: 'system_error',
        severity: 'high',
        recoverable: true
      },
      SERVICE_UNAVAILABLE: {
        statusCode: 503,
        category: 'system_error',
        severity: 'high',
        recoverable: true
      },
      COMPLIANCE_VIOLATION: {
        statusCode: 400,
        category: 'compliance_error',
        severity: 'critical',
        recoverable: false
      },
      DATA_INTEGRITY_ERROR: {
        statusCode: 500,
        category: 'data_error',
        severity: 'critical',
        recoverable: false
      },
      ENCRYPTION_ERROR: {
        statusCode: 500,
        category: 'security_error',
        severity: 'critical',
        recoverable: false
      }
    };

    // Sensitive field patterns that should be masked in error logs
    this.sensitiveFieldPatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /ssn/i,
      /social/i,
      /curp/i,
      /medical_record/i,
      /phone/i,
      /email/i,
      /address/i
    ];
  }

  /**
   * Main error handling middleware
   */
  handleError() {
    return async (error, req, res, next) => {
      try {
        // Generate unique error ID for tracking
        const errorId = uuidv4();
        
        // Parse and classify error
        const errorInfo = this.parseError(error, req, errorId);
        
        // Log error with appropriate level
        await this.logError(errorInfo, req);
        
        // Send appropriate response
        const response = this.formatErrorResponse(errorInfo, req);
        
        // Set security headers
        this.setSecurityHeaders(res, errorInfo);
        
        return res.status(errorInfo.statusCode).json(response);
        
      } catch (handlingError) {
        // Fallback error handling
        console.error('Error in error handler:', handlingError);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }
    };
  }

  /**
   * Parse and classify incoming error
   */
  parseError(error, req, errorId) {
    const timestamp = new Date().toISOString();
    let errorType = 'INTERNAL_SERVER_ERROR';
    let statusCode = 500;
    let category = 'system_error';
    let severity = 'high';
    let recoverable = false;
    let userMessage = 'An unexpected error occurred';
    let details = null;

    // Classify error based on type and properties
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      errorType = 'VALIDATION_ERROR';
      details = error.details || error.errors;
      userMessage = 'Invalid input provided';
    } else if (error.name === 'UnauthorizedError' || error.code === 'AUTHENTICATION_ERROR') {
      errorType = 'AUTHENTICATION_ERROR';
      userMessage = 'Authentication required';
    } else if (error.code === 'PATIENT_ACCESS_DENIED') {
      errorType = 'PATIENT_ACCESS_DENIED';
      userMessage = 'Access to patient data denied';
    } else if (error.name === 'NotFoundError' || error.code === 'RESOURCE_NOT_FOUND') {
      errorType = 'RESOURCE_NOT_FOUND';
      userMessage = 'Requested resource not found';
    } else if (error.code === 'DUPLICATE_RESOURCE' || error.code === 11000) {
      errorType = 'DUPLICATE_RESOURCE';
      userMessage = 'Resource already exists';
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      errorType = 'RATE_LIMIT_EXCEEDED';
      userMessage = 'Too many requests, please try again later';
    } else if (error.name === 'PrismaClientKnownRequestError') {
      errorType = 'DATABASE_ERROR';
      userMessage = 'Database operation failed';
      details = this.parsePrismaError(error);
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorType = 'DATABASE_ERROR';
      userMessage = 'Database operation failed';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorType = 'EXTERNAL_SERVICE_ERROR';
      userMessage = 'External service unavailable';
    } else if (error.code === 'COMPLIANCE_VIOLATION') {
      errorType = 'COMPLIANCE_VIOLATION';
      userMessage = 'Operation violates compliance requirements';
    } else if (error.code === 'ENCRYPTION_ERROR') {
      errorType = 'ENCRYPTION_ERROR';
      userMessage = 'Encryption operation failed';
    }

    // Get error type configuration
    const errorConfig = this.errorTypes[errorType] || this.errorTypes.INTERNAL_SERVER_ERROR;
    statusCode = errorConfig.statusCode;
    category = errorConfig.category;
    severity = errorConfig.severity;
    recoverable = errorConfig.recoverable;

    return {
      errorId,
      errorType,
      statusCode,
      category,
      severity,
      recoverable,
      userMessage,
      originalError: error,
      details,
      timestamp,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }

  /**
   * Parse Prisma-specific errors
   */
  parsePrismaError(error) {
    const details = {
      code: error.code,
      meta: error.meta
    };

    switch (error.code) {
      case 'P2002':
        details.message = 'Unique constraint violation';
        break;
      case 'P2025':
        details.message = 'Record not found';
        break;
      case 'P2003':
        details.message = 'Foreign key constraint violation';
        break;
      case 'P2014':
        details.message = 'Invalid ID provided';
        break;
      default:
        details.message = 'Database operation failed';
    }

    return details;
  }

  /**
   * Log error with appropriate level and compliance requirements
   */
  async logError(errorInfo, req) {
    const logData = {
      errorId: errorInfo.errorId,
      errorType: errorInfo.errorType,
      category: errorInfo.category,
      severity: errorInfo.severity,
      statusCode: errorInfo.statusCode,
      userMessage: errorInfo.userMessage,
      timestamp: errorInfo.timestamp,
      
      // Request context
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      requestId: req.headers['x-request-id'],
      
      // User context (if available)
      userId: req.user?.id,
      userRole: req.user?.role,
      organizationId: req.user?.organizationId,
      
      // Error details (sanitized)
      details: this.sanitizeErrorDetails(errorInfo.details),
      stack: errorInfo.stack,
      
      // Original error info (sanitized)
      originalMessage: this.sanitizeMessage(errorInfo.originalError.message),
      originalName: errorInfo.originalError.name
    };

    // Log based on severity
    switch (errorInfo.severity) {
      case 'critical':
        console.error('CRITICAL ERROR:', logData);
        await this.auditLogger.logSecurityEvent(req.user?.id, 'CRITICAL_ERROR', logData);
        await this.alertAdministrators(errorInfo, req);
        break;
      case 'high':
        console.error('HIGH SEVERITY ERROR:', logData);
        await this.auditLogger.logSystemEvent(req.user?.id, 'HIGH_SEVERITY_ERROR', logData);
        break;
      case 'medium':
        console.warn('MEDIUM SEVERITY ERROR:', logData);
        await this.auditLogger.logSystemEvent(req.user?.id, 'MEDIUM_SEVERITY_ERROR', logData);
        break;
      case 'low':
        console.log('LOW SEVERITY ERROR:', logData);
        break;
    }

    // Special logging for compliance errors
    if (errorInfo.category === 'compliance_error') {
      await this.auditLogger.logComplianceEvent(req.user?.id, 'COMPLIANCE_ERROR', {
        ...logData,
        complianceViolationType: errorInfo.errorType,
        requiresReporting: errorInfo.severity === 'critical'
      });
    }

    // Special logging for security errors
    if (errorInfo.category === 'security_error') {
      await this.auditLogger.logSecurityEvent(req.user?.id, 'SECURITY_ERROR', {
        ...logData,
        securityEventType: errorInfo.errorType,
        potentialThreat: errorInfo.severity === 'critical'
      });
    }
  }

  /**
   * Format error response for client
   */
  formatErrorResponse(errorInfo, req) {
    const baseResponse = {
      error: {
        code: errorInfo.errorType,
        message: errorInfo.userMessage,
        timestamp: errorInfo.timestamp,
        requestId: req.headers['x-request-id'] || errorInfo.errorId,
        recoverable: errorInfo.recoverable
      }
    };

    // Add details for client errors (400-499)
    if (errorInfo.statusCode >= 400 && errorInfo.statusCode < 500 && errorInfo.details) {
      baseResponse.error.details = this.sanitizeErrorDetails(errorInfo.details);
    }

    // Add additional info for development
    if (process.env.NODE_ENV === 'development') {
      baseResponse.error.errorId = errorInfo.errorId;
      baseResponse.error.category = errorInfo.category;
      baseResponse.error.severity = errorInfo.severity;
      
      if (errorInfo.stack) {
        baseResponse.error.stack = errorInfo.stack;
      }
    }

    // Add retry information for recoverable errors
    if (errorInfo.recoverable) {
      baseResponse.error.retryAfter = this.calculateRetryDelay(errorInfo);
    }

    // Add help information for specific error types
    baseResponse.error.help = this.getHelpInformation(errorInfo.errorType);

    return baseResponse;
  }

  /**
   * Calculate retry delay for recoverable errors
   */
  calculateRetryDelay(errorInfo) {
    switch (errorInfo.errorType) {
      case 'RATE_LIMIT_EXCEEDED':
        return 60; // 1 minute
      case 'EXTERNAL_SERVICE_ERROR':
        return 30; // 30 seconds
      case 'SERVICE_UNAVAILABLE':
        return 120; // 2 minutes
      default:
        return 10; // 10 seconds
    }
  }

  /**
   * Get help information for error types
   */
  getHelpInformation(errorType) {
    const helpMap = {
      VALIDATION_ERROR: 'Please check your input data and ensure all required fields are provided correctly.',
      AUTHENTICATION_ERROR: 'Please log in again or check your authentication credentials.',
      AUTHORIZATION_ERROR: 'You do not have permission to perform this action. Contact your administrator if needed.',
      PATIENT_ACCESS_DENIED: 'You do not have access to this patient\'s data. Ensure you are assigned to this patient.',
      RESOURCE_NOT_FOUND: 'The requested resource could not be found. Please check the ID and try again.',
      DUPLICATE_RESOURCE: 'A resource with this information already exists. Please use a different identifier.',
      RATE_LIMIT_EXCEEDED: 'You have exceeded the rate limit. Please wait before making more requests.',
      DATABASE_ERROR: 'A database error occurred. Please try again later.',
      EXTERNAL_SERVICE_ERROR: 'An external service is currently unavailable. Please try again later.',
      SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
      COMPLIANCE_VIOLATION: 'This action violates healthcare compliance requirements and cannot be completed.',
      ENCRYPTION_ERROR: 'An encryption error occurred. Please contact support.'
    };

    return helpMap[errorType] || 'An unexpected error occurred. Please contact support if the problem persists.';
  }

  /**
   * Set security headers based on error type
   */
  setSecurityHeaders(res, errorInfo) {
    // Add security headers for security-related errors
    if (errorInfo.category === 'security_error') {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });
    }

    // Add rate limiting headers
    if (errorInfo.errorType === 'RATE_LIMIT_EXCEEDED') {
      res.set({
        'Retry-After': this.calculateRetryDelay(errorInfo).toString(),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + this.calculateRetryDelay(errorInfo)
      });
    }
  }

  /**
   * Sanitize error details to remove sensitive information
   */
  sanitizeErrorDetails(details) {
    if (!details) return null;
    
    if (typeof details === 'string') {
      return this.sanitizeMessage(details);
    }
    
    if (Array.isArray(details)) {
      return details.map(detail => this.sanitizeErrorDetails(detail));
    }
    
    if (typeof details === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(details)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeErrorDetails(value);
        }
      }
      return sanitized;
    }
    
    return details;
  }

  /**
   * Sanitize error message to remove sensitive information
   */
  sanitizeMessage(message) {
    if (!message || typeof message !== 'string') return message;
    
    // Remove potential SQL injection patterns
    let sanitized = message.replace(/['";]|(--)|(\/\*)|(\*\/)/g, '[REDACTED]');
    
    // Remove potential file paths
    sanitized = sanitized.replace(/([A-Za-z]:\\|\/)[^\s]*/g, '[PATH_REDACTED]');
    
    // Remove potential connection strings
    sanitized = sanitized.replace(/mongodb:\/\/[^\s]*|mysql:\/\/[^\s]*|postgres:\/\/[^\s]*/g, '[CONNECTION_REDACTED]');
    
    return sanitized;
  }

  /**
   * Check if field name indicates sensitive data
   */
  isSensitiveField(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') return false;
    
    return this.sensitiveFieldPatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * Alert administrators for critical errors
   */
  async alertAdministrators(errorInfo, req) {
    const alertData = {
      errorId: errorInfo.errorId,
      errorType: errorInfo.errorType,
      severity: errorInfo.severity,
      timestamp: errorInfo.timestamp,
      userId: req.user?.id,
      userRole: req.user?.role,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    // In a real implementation, this would send alerts via email, Slack, PagerDuty, etc.
    console.error('CRITICAL ERROR ALERT:', alertData);
    
    // Log alert to audit system
    await this.auditLogger.logSystemEvent('system', 'CRITICAL_ERROR_ALERT', alertData);
  }

  /**
   * 404 Not Found handler
   */
  notFoundHandler() {
    return (req, res, next) => {
      const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
      error.code = 'RESOURCE_NOT_FOUND';
      error.statusCode = 404;
      next(error);
    };
  }

  /**
   * Async error wrapper for route handlers
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validation error handler for express-validator
   */
  validationErrorHandler() {
    return (req, res, next) => {
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = errors.array();
        return next(error);
      }
      
      next();
    };
  }

  /**
   * Timeout handler
   */
  timeoutHandler(timeoutMs = 30000) {
    return (req, res, next) => {
      const timeout = setTimeout(() => {
        const error = new Error('Request timeout');
        error.code = 'REQUEST_TIMEOUT';
        error.statusCode = 408;
        next(error);
      }, timeoutMs);

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    };
  }

  /**
   * Create custom error
   */
  createError(type, message, details = null) {
    const error = new Error(message);
    error.code = type;
    if (details) {
      error.details = details;
    }
    return error;
  }
}

module.exports = ErrorHandlingMiddleware;