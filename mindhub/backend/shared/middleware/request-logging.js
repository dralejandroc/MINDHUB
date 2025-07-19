/**
 * Request/Response Logging Middleware
 * 
 * Comprehensive logging middleware for HTTP requests and responses with:
 * - Correlation IDs for request tracing
 * - Performance metrics collection
 * - Healthcare-compliant logging
 * - Sensitive data sanitization
 * - Request context propagation
 */

const { v4: uuidv4 } = require('uuid');
const { AsyncLocalStorage } = require('async_hooks');
const { logger } = require('../config/storage');
const AuditLogger = require('../utils/audit-logger');

const auditLogger = new AuditLogger();

// Create async local storage for request context
const requestContext = new AsyncLocalStorage();

/**
 * Get current request context
 */
const getCurrentContext = () => requestContext.getStore();

/**
 * Get current correlation ID
 */
const getCorrelationId = () => {
  const context = getCurrentContext();
  return context?.correlationId || null;
};

/**
 * Sanitize sensitive data from request/response
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'authorization', 'cookie', 'session',
    'ssn', 'socialSecurityNumber', 'medicalRecordNumber',
    'dateOfBirth', 'dob', 'phoneNumber', 'email', 'address',
    'creditCard', 'bankAccount', 'apiKey', 'secret'
  ];
  
  const sanitized = { ...data };
  
  const sanitizeObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      const fullPath = path ? `${path}.${key}` : key;
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key], fullPath);
      }
    }
    
    return obj;
  };
  
  return sanitizeObject(sanitized);
};

/**
 * Extract user info from request
 */
const extractUserInfo = (req) => {
  const user = req.user;
  if (!user) return null;
  
  return {
    id: user.id,
    role: user.role,
    email: user.email ? '[REDACTED]' : null,
    hub: user.hub || null
  };
};

/**
 * Determine if request should be logged
 */
const shouldLogRequest = (req) => {
  const skipPaths = [
    '/health',
    '/ping',
    '/favicon.ico',
    '/metrics',
    '/status'
  ];
  
  const skipExtensions = ['.css', '.js', '.png', '.jpg', '.ico', '.svg'];
  
  // Skip health check endpoints
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return false;
  }
  
  // Skip static assets
  if (skipExtensions.some(ext => req.path.endsWith(ext))) {
    return false;
  }
  
  return true;
};

/**
 * Calculate request size
 */
const calculateRequestSize = (req) => {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  
  // Estimate size from body if available
  if (req.body) {
    return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
  }
  
  return 0;
};

/**
 * Main request logging middleware
 */
const requestLoggingMiddleware = (options = {}) => {
  const {
    logLevel = 'info',
    includeRequestBody = false,
    includeResponseBody = false,
    maxBodySize = 1024 * 10, // 10KB
    excludePaths = [],
    auditLevel = 'basic' // 'basic', 'detailed', 'full'
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    // Skip logging for certain paths
    if (!shouldLogRequest(req) || excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Set correlation ID in request headers
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Create request context
    const context = {
      correlationId,
      startTime,
      requestId: uuidv4(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      user: extractUserInfo(req)
    };
    
    // Run in async context
    requestContext.run(context, () => {
      // Log request start
      const requestSize = calculateRequestSize(req);
      
      const requestLog = {
        type: 'request',
        correlationId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        query: sanitizeData(req.query),
        headers: sanitizeData(req.headers),
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        user: context.user,
        requestSize,
        ...(includeRequestBody && req.body && requestSize < maxBodySize && {
          body: sanitizeData(req.body)
        })
      };
      
      logger.info('HTTP Request', requestLog);
      
      // Audit log for compliance
      if (auditLevel !== 'none') {
        auditLogger.logHttpRequest(
          context.user?.id || 'anonymous',
          req.method,
          req.path,
          req.ip,
          {
            correlationId,
            userAgent: req.headers['user-agent'],
            ...(auditLevel === 'detailed' && { query: sanitizeData(req.query) }),
            ...(auditLevel === 'full' && { headers: sanitizeData(req.headers) })
          }
        );
      }
      
      // Capture original response methods
      const originalSend = res.send;
      const originalJson = res.json;
      let responseBody = null;
      
      // Override res.send to capture response body
      res.send = function(data) {
        if (includeResponseBody && data && Buffer.byteLength(data) < maxBodySize) {
          responseBody = data;
        }
        return originalSend.call(this, data);
      };
      
      // Override res.json to capture response body
      res.json = function(data) {
        if (includeResponseBody && data && Buffer.byteLength(JSON.stringify(data)) < maxBodySize) {
          responseBody = data;
        }
        return originalJson.call(this, data);
      };
      
      // Log response when request finishes
      const logResponse = () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const responseSize = res.getHeader('content-length') || 0;
        
        const responseLog = {
          type: 'response',
          correlationId,
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl || req.url,
          path: req.path,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          duration,
          responseSize: parseInt(responseSize, 10) || 0,
          user: context.user,
          ...(includeResponseBody && responseBody && {
            body: sanitizeData(responseBody)
          })
        };
        
        // Log with appropriate level based on status code
        if (res.statusCode >= 500) {
          logger.error('HTTP Response Error', responseLog);
        } else if (res.statusCode >= 400) {
          logger.warn('HTTP Response Client Error', responseLog);
        } else {
          logger.info('HTTP Response', responseLog);
        }
        
        // Performance monitoring
        if (duration > 1000) { // Slow requests > 1 second
          logger.warn('Slow HTTP Request', {
            correlationId,
            method: req.method,
            path: req.path,
            duration,
            statusCode: res.statusCode,
            user: context.user
          });
        }
        
        // Audit log for compliance
        if (auditLevel !== 'none') {
          auditLogger.logHttpResponse(
            context.user?.id || 'anonymous',
            req.method,
            req.path,
            res.statusCode,
            duration,
            {
              correlationId,
              responseSize: parseInt(responseSize, 10) || 0,
              ...(res.statusCode >= 400 && { error: true })
            }
          );
        }
      };
      
      // Log response on finish
      res.on('finish', logResponse);
      res.on('close', logResponse);
      
      // Continue with request processing
      next();
    });
  };
};

/**
 * Enhanced error logging middleware
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  const correlationId = getCorrelationId();
  const context = getCurrentContext();
  
  const errorLog = {
    type: 'error',
    correlationId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode || 500
    },
    user: context?.user,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };
  
  logger.error('HTTP Request Error', errorLog);
  
  // Audit log for security compliance
  auditLogger.logError(
    context?.user?.id || 'anonymous',
    err.name,
    err.message,
    {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: err.statusCode || 500,
      ip: req.ip
    }
  );
  
  next(err);
};

/**
 * Performance metrics middleware
 */
const metricsMiddleware = () => {
  const metrics = {
    requests: {
      total: 0,
      byMethod: {},
      byStatus: {},
      byPath: {}
    },
    responseTime: {
      total: 0,
      average: 0,
      min: Infinity,
      max: 0
    },
    errors: {
      total: 0,
      byType: {},
      byStatus: {}
    }
  };
  
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Capture original end method
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Update metrics
      metrics.requests.total++;
      metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
      metrics.requests.byStatus[res.statusCode] = (metrics.requests.byStatus[res.statusCode] || 0) + 1;
      metrics.requests.byPath[req.path] = (metrics.requests.byPath[req.path] || 0) + 1;
      
      metrics.responseTime.total += duration;
      metrics.responseTime.average = metrics.responseTime.total / metrics.requests.total;
      metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
      metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
      
      if (res.statusCode >= 400) {
        metrics.errors.total++;
        metrics.errors.byStatus[res.statusCode] = (metrics.errors.byStatus[res.statusCode] || 0) + 1;
      }
      
      // Store metrics in request context for potential use
      const context = getCurrentContext();
      if (context) {
        context.metrics = { duration, statusCode: res.statusCode };
      }
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

module.exports = {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  metricsMiddleware,
  getCurrentContext,
  getCorrelationId,
  sanitizeData
};