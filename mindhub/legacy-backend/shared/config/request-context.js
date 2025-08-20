/**
 * Request Context Management
 * 
 * Provides request-scoped context using AsyncLocalStorage for:
 * - Correlation ID propagation
 * - User context tracking
 * - Performance metrics
 * - Healthcare compliance data
 */

const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');

// Create async local storage instance
const requestContext = new AsyncLocalStorage();

/**
 * Get current request context
 */
const getCurrentContext = () => {
  return requestContext.getStore() || null;
};

/**
 * Get correlation ID from current context
 */
const getCorrelationId = () => {
  const context = getCurrentContext();
  return context?.correlationId || null;
};

/**
 * Get user ID from current context
 */
const getUserId = () => {
  const context = getCurrentContext();
  return context?.userId || null;
};

/**
 * Get user info from current context
 */
const getUserInfo = () => {
  const context = getCurrentContext();
  return context?.user || null;
};

/**
 * Set context value
 */
const setContextValue = (key, value) => {
  const context = getCurrentContext();
  if (context) {
    context[key] = value;
  }
};

/**
 * Get context value
 */
const getContextValue = (key) => {
  const context = getCurrentContext();
  return context?.[key] || null;
};

/**
 * Create new request context
 */
const createContext = (req, res, options = {}) => {
  const correlationId = req.headers['x-correlation-id'] || 
                       req.headers['x-request-id'] || 
                       uuidv4();
  
  const startTime = Date.now();
  
  return {
    correlationId,
    requestId: uuidv4(),
    startTime,
    timestamp: new Date().toISOString(),
    
    // HTTP context
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    
    // Client context
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    
    // User context (if authenticated)
    userId: req.user?.id || null,
    user: req.user ? {
      id: req.user.id,
      role: req.user.role,
      hub: req.user.hub,
      email: req.user.email ? '[REDACTED]' : null
    } : null,
    
    // Performance tracking
    metrics: {
      startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    
    // Healthcare compliance
    compliance: {
      dataAccessed: [],
      actionsPerformed: [],
      auditRequired: false
    },
    
    // Custom options
    ...options
  };
};

/**
 * Run function with request context
 */
const runWithContext = (context, fn) => {
  return requestContext.run(context, fn);
};

/**
 * Middleware to create and set request context
 */
const contextMiddleware = (options = {}) => {
  return (req, res, next) => {
    const context = createContext(req, res, options);
    
    // Set correlation ID header for response
    res.setHeader('X-Correlation-ID', context.correlationId);
    
    // Store context in request for later use
    req.context = context;
    
    // Run the rest of the middleware chain with context
    runWithContext(context, next);
  };
};

/**
 * Add audit event to context
 */
const addAuditEvent = (event, data = {}) => {
  const context = getCurrentContext();
  if (context) {
    context.compliance.auditRequired = true;
    context.compliance.actionsPerformed.push({
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Add data access event to context
 */
const addDataAccess = (resourceType, resourceId, action = 'read') => {
  const context = getCurrentContext();
  if (context) {
    context.compliance.dataAccessed.push({
      resourceType,
      resourceId,
      action,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update performance metrics
 */
const updateMetrics = (additionalMetrics = {}) => {
  const context = getCurrentContext();
  if (context) {
    const currentTime = Date.now();
    context.metrics = {
      ...context.metrics,
      duration: currentTime - context.startTime,
      endTime: currentTime,
      currentMemoryUsage: process.memoryUsage(),
      currentCpuUsage: process.cpuUsage(),
      ...additionalMetrics
    };
  }
};

/**
 * Get performance metrics from context
 */
const getMetrics = () => {
  const context = getCurrentContext();
  if (!context) return null;
  
  return {
    ...context.metrics,
    duration: Date.now() - context.startTime
  };
};

/**
 * Get compliance data from context
 */
const getComplianceData = () => {
  const context = getCurrentContext();
  return context?.compliance || null;
};

/**
 * Create child context (for async operations)
 */
const createChildContext = (additionalData = {}) => {
  const parentContext = getCurrentContext();
  if (!parentContext) return null;
  
  return {
    ...parentContext,
    parentCorrelationId: parentContext.correlationId,
    correlationId: uuidv4(),
    isChildContext: true,
    ...additionalData
  };
};

/**
 * Get context summary for logging
 */
const getContextSummary = () => {
  const context = getCurrentContext();
  if (!context) return {};
  
  return {
    correlationId: context.correlationId,
    requestId: context.requestId,
    userId: context.userId,
    method: context.method,
    path: context.path,
    ip: context.ip,
    userAgent: context.userAgent,
    duration: Date.now() - context.startTime,
    auditRequired: context.compliance.auditRequired
  };
};

/**
 * Enhanced logging functions with context
 */
const createContextualLogger = (baseLogger) => {
  return {
    debug: (message, meta = {}) => {
      const context = getContextSummary();
      baseLogger.debug(message, { ...meta, ...context });
    },
    
    info: (message, meta = {}) => {
      const context = getContextSummary();
      baseLogger.info(message, { ...meta, ...context });
    },
    
    warn: (message, meta = {}) => {
      const context = getContextSummary();
      baseLogger.warn(message, { ...meta, ...context });
    },
    
    error: (message, meta = {}) => {
      const context = getContextSummary();
      baseLogger.error(message, { ...meta, ...context });
    },
    
    withContext: (additionalContext) => {
      const context = getContextSummary();
      return {
        debug: (message, meta = {}) => baseLogger.debug(message, { ...meta, ...context, ...additionalContext }),
        info: (message, meta = {}) => baseLogger.info(message, { ...meta, ...context, ...additionalContext }),
        warn: (message, meta = {}) => baseLogger.warn(message, { ...meta, ...context, ...additionalContext }),
        error: (message, meta = {}) => baseLogger.error(message, { ...meta, ...context, ...additionalContext })
      };
    }
  };
};

module.exports = {
  requestContext,
  getCurrentContext,
  getCorrelationId,
  getUserId,
  getUserInfo,
  setContextValue,
  getContextValue,
  createContext,
  runWithContext,
  contextMiddleware,
  addAuditEvent,
  addDataAccess,
  updateMetrics,
  getMetrics,
  getComplianceData,
  createChildContext,
  getContextSummary,
  createContextualLogger
};