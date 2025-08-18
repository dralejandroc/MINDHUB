/**
 * Comprehensive Middleware Integration
 * 
 * Integrates all error handling, logging, and monitoring middleware
 * for the MindHub healthcare platform
 */

const express = require('express');
const { requestLoggingMiddleware, errorLoggingMiddleware } = require('./request-logging');
const { performanceMonitoringMiddleware, systemMetricsMonitoring } = require('./performance-monitoring');
const { contextMiddleware } = require('../config/request-context');
const { initializeLogging } = require('../config/logging');
const errorHandling = require('./error-handling');
const rateLimit = require('./rate-limiting');
// const auth = require('./auth'); // REMOVED - Using Supabase auth only
const healthRoutes = require('../routes/health');

/**
 * Initialize comprehensive middleware stack
 */
const initializeMiddleware = (app, options = {}) => {
  const {
    enableRequestLogging = true,
    enablePerformanceMonitoring = true,
    enableSystemMetrics = true,
    logLevel = 'info',
    auditLevel = 'detailed',
    excludePaths = ['/health', '/ping', '/metrics'],
    maxRequestBodySize = '10mb'
  } = options;

  // Initialize logging system
  initializeLogging();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Parse request bodies
  app.use(express.json({ limit: maxRequestBodySize }));
  app.use(express.urlencoded({ extended: true, limit: maxRequestBodySize }));

  // Request context middleware (must be early in the stack)
  app.use(contextMiddleware({
    auditLevel: auditLevel
  }));

  // Rate limiting middleware
  app.use(rateLimit.createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  }));

  // Performance monitoring middleware
  if (enablePerformanceMonitoring) {
    app.use(performanceMonitoringMiddleware({
      enableDetailedMetrics: process.env.NODE_ENV !== 'production',
      excludePaths,
      samplingRate: parseFloat(process.env.MONITORING_SAMPLE_RATE) || 1.0
    }));
  }

  // System metrics monitoring
  if (enableSystemMetrics) {
    app.use(systemMetricsMonitoring());
  }

  // Request/response logging middleware
  if (enableRequestLogging) {
    app.use(requestLoggingMiddleware({
      logLevel,
      auditLevel,
      excludePaths,
      includeRequestBody: process.env.NODE_ENV !== 'production',
      includeResponseBody: process.env.NODE_ENV !== 'production',
      maxBodySize: 10 * 1024 // 10KB
    }));
  }

  // Health check routes (before authentication)
  app.use('/health', healthRoutes);
  app.use('/ping', healthRoutes);
  app.use('/metrics', healthRoutes);

  // Authentication middleware (for protected routes) - REMOVED - Using Supabase auth only
  // app.use('/api', auth.authenticateToken);

  // Authorization middleware (for role-based access control) - REMOVED - Using Supabase auth only  
  // app.use('/api', auth.authorizeRequest);

  // Error logging middleware
  app.use(errorLoggingMiddleware);

  // Main error handling middleware (must be last)
  app.use(errorHandling.errorHandler);
  app.use(errorHandling.notFoundHandler);

  return app;
};

/**
 * Create monitoring dashboard endpoint
 */
const createMonitoringDashboard = () => {
  const router = express.Router();

  // Real-time metrics endpoint
  router.get('/dashboard/metrics', async (req, res) => {
    try {
      const { getCurrentMetrics } = require('./performance-monitoring');
      const metrics = getCurrentMetrics();
      
      res.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform
          },
          performance: metrics,
          health: {
            status: metrics.health.status,
            checks: metrics.health.checks || {}
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve monitoring metrics',
        details: error.message
      });
    }
  });

  // Audit logs endpoint
  router.get('/dashboard/audit', async (req, res) => {
    try {
      const AuditLogger = require('../utils/audit-logger');
      const auditLogger = new AuditLogger();
      
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };
      
      const auditData = await auditLogger.queryAuditLogs(filters);
      
      res.json({
        success: true,
        data: auditData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit logs',
        details: error.message
      });
    }
  });

  // Compliance report endpoint
  router.get('/dashboard/compliance', async (req, res) => {
    try {
      const AuditLogger = require('../utils/audit-logger');
      const auditLogger = new AuditLogger();
      
      const { startDate, endDate } = req.query;
      const report = await auditLogger.generateComplianceReport(startDate, endDate);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report',
        details: error.message
      });
    }
  });

  // System alerts endpoint
  router.get('/dashboard/alerts', async (req, res) => {
    try {
      const { metricsCollector } = require('./performance-monitoring');
      const alerts = getActiveAlerts(metricsCollector);
      
      res.json({
        success: true,
        data: {
          alerts,
          totalCount: alerts.length,
          criticalCount: alerts.filter(a => a.severity === 'critical').length,
          warningCount: alerts.filter(a => a.severity === 'warning').length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system alerts',
        details: error.message
      });
    }
  });

  return router;
};

/**
 * Get active alerts from metrics collector
 */
const getActiveAlerts = (metricsCollector) => {
  const alerts = [];
  const currentMetrics = require('./performance-monitoring').getCurrentMetrics();
  
  // Memory usage alerts
  if (currentMetrics.system.memoryUsage.heapUsed > 500 * 1024 * 1024) {
    alerts.push({
      id: 'memory_high',
      type: 'system',
      severity: 'warning',
      message: 'High memory usage detected',
      value: currentMetrics.system.memoryUsage.heapUsed,
      threshold: 500 * 1024 * 1024,
      timestamp: new Date().toISOString()
    });
  }
  
  // Response time alerts
  if (currentMetrics.requests.averageTime > 1000) {
    alerts.push({
      id: 'response_time_high',
      type: 'performance',
      severity: 'warning',
      message: 'High average response time',
      value: currentMetrics.requests.averageTime,
      threshold: 1000,
      timestamp: new Date().toISOString()
    });
  }
  
  // Error rate alerts
  const errorRate = currentMetrics.requests.total > 0 ? 
    (currentMetrics.errors.total / currentMetrics.requests.total) * 100 : 0;
  
  if (errorRate > 5) {
    alerts.push({
      id: 'error_rate_high',
      type: 'reliability',
      severity: errorRate > 10 ? 'critical' : 'warning',
      message: 'High error rate detected',
      value: errorRate,
      threshold: 5,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
};

/**
 * Setup graceful shutdown handling
 */
const setupGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close database connections
      // Close other resources
      
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

module.exports = {
  initializeMiddleware,
  createMonitoringDashboard,
  setupGracefulShutdown,
  getActiveAlerts
};