/**
 * Performance Monitoring Middleware
 * 
 * Comprehensive performance monitoring for healthcare applications:
 * - Response time tracking
 * - Memory and CPU usage monitoring
 * - Database query performance
 * - Slow request detection
 * - Resource utilization metrics
 * - Healthcare-specific performance thresholds
 */

const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { logger } = require('../config/logging');
const { getCurrentContext, updateMetrics, getMetrics } = require('../config/request-context');

// Performance metrics collector
const metricsCollector = new EventEmitter();

// Global performance metrics
let globalMetrics = {
  requests: {
    total: 0,
    totalTime: 0,
    averageTime: 0,
    slowRequests: 0,
    byMethod: {},
    byPath: {},
    byStatus: {}
  },
  system: {
    startTime: Date.now(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    lastUpdated: Date.now()
  },
  database: {
    totalQueries: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    connectionPoolUsage: 0
  },
  errors: {
    total: 0,
    byType: {},
    byStatus: {},
    rateLimited: 0,
    authFailures: 0
  }
};

// Performance thresholds (healthcare-specific)
const thresholds = {
  slowRequest: parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000, // 1 second
  criticalRequest: parseInt(process.env.CRITICAL_REQUEST_THRESHOLD) || 5000, // 5 seconds
  memoryUsage: parseInt(process.env.MEMORY_THRESHOLD) || 500 * 1024 * 1024, // 500MB
  cpuUsage: parseFloat(process.env.CPU_THRESHOLD) || 80, // 80%
  slowQuery: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 500, // 500ms
  criticalQuery: parseInt(process.env.CRITICAL_QUERY_THRESHOLD) || 2000 // 2 seconds
};

/**
 * Calculate percentiles for response times
 */
const calculatePercentiles = (times) => {
  const sorted = times.sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p50: sorted[Math.floor(len * 0.5)],
    p90: sorted[Math.floor(len * 0.9)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)]
  };
};

/**
 * Performance monitoring middleware
 */
const performanceMonitoringMiddleware = (options = {}) => {
  const {
    enableDetailedMetrics = true,
    enableSystemMetrics = true,
    alertThresholds = thresholds,
    excludePaths = ['/health', '/ping', '/metrics'],
    samplingRate = 1.0
  } = options;
  
  // Store response times for percentile calculation
  const responseTimes = [];
  const maxResponseTimesSamples = 10000; // Keep last 10k samples
  
  return (req, res, next) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    // Skip monitoring for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip based on sampling rate
    if (Math.random() > samplingRate) {
      return next();
    }
    
    // Store start metrics in context
    const context = getCurrentContext();
    if (context) {
      context.performance = {
        startTime,
        startMemory,
        startCpu
      };
    }
    
    // Hook into response finish
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      
      // Calculate memory and CPU deltas
      const memoryDelta = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      };
      
      const cpuDelta = {
        user: endCpu.user,
        system: endCpu.system,
        total: endCpu.user + endCpu.system
      };
      
      // Update global metrics
      globalMetrics.requests.total++;
      globalMetrics.requests.totalTime += duration;
      globalMetrics.requests.averageTime = globalMetrics.requests.totalTime / globalMetrics.requests.total;
      
      // Update method metrics
      const method = req.method;
      if (!globalMetrics.requests.byMethod[method]) {
        globalMetrics.requests.byMethod[method] = { count: 0, totalTime: 0, averageTime: 0 };
      }
      globalMetrics.requests.byMethod[method].count++;
      globalMetrics.requests.byMethod[method].totalTime += duration;
      globalMetrics.requests.byMethod[method].averageTime = 
        globalMetrics.requests.byMethod[method].totalTime / globalMetrics.requests.byMethod[method].count;
      
      // Update path metrics
      const path = req.path;
      if (!globalMetrics.requests.byPath[path]) {
        globalMetrics.requests.byPath[path] = { count: 0, totalTime: 0, averageTime: 0 };
      }
      globalMetrics.requests.byPath[path].count++;
      globalMetrics.requests.byPath[path].totalTime += duration;
      globalMetrics.requests.byPath[path].averageTime = 
        globalMetrics.requests.byPath[path].totalTime / globalMetrics.requests.byPath[path].count;
      
      // Update status metrics
      const status = res.statusCode;
      globalMetrics.requests.byStatus[status] = (globalMetrics.requests.byStatus[status] || 0) + 1;
      
      // Track response times for percentiles
      responseTimes.push(duration);
      if (responseTimes.length > maxResponseTimesSamples) {
        responseTimes.shift(); // Remove oldest sample
      }
      
      // Performance logging
      const performanceData = {
        method,
        path,
        statusCode: status,
        duration: Math.round(duration),
        memoryDelta,
        cpuDelta: {
          user: Math.round(cpuDelta.user / 1000), // Convert to milliseconds
          system: Math.round(cpuDelta.system / 1000),
          total: Math.round(cpuDelta.total / 1000)
        },
        requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0,
        responseSize: res.getHeader('content-length') ? parseInt(res.getHeader('content-length')) : 0
      };
      
      // Update context metrics
      if (context) {
        updateMetrics(performanceData);
      }
      
      // Log slow requests
      if (duration > alertThresholds.slowRequest) {
        globalMetrics.requests.slowRequests++;
        
        const logLevel = duration > alertThresholds.criticalRequest ? 'error' : 'warn';
        logger[logLevel]('Slow HTTP Request Detected', {
          ...performanceData,
          threshold: alertThresholds.slowRequest,
          isCritical: duration > alertThresholds.criticalRequest
        });
        
        // Emit performance event
        metricsCollector.emit('slowRequest', {
          ...performanceData,
          correlationId: context?.correlationId
        });
      }
      
      // Log detailed metrics if enabled
      if (enableDetailedMetrics) {
        logger.debug('HTTP Request Performance', performanceData);
      }
      
      // Check for memory leaks
      if (memoryDelta.heapUsed > alertThresholds.memoryUsage) {
        logger.warn('High Memory Usage Detected', {
          ...performanceData,
          memoryThreshold: alertThresholds.memoryUsage,
          currentHeapUsed: endMemory.heapUsed
        });
        
        metricsCollector.emit('highMemoryUsage', {
          ...performanceData,
          memoryUsage: endMemory
        });
      }
      
      // Update error metrics
      if (status >= 400) {
        globalMetrics.errors.total++;
        globalMetrics.errors.byStatus[status] = (globalMetrics.errors.byStatus[status] || 0) + 1;
        
        if (status === 429) {
          globalMetrics.errors.rateLimited++;
        } else if (status === 401 || status === 403) {
          globalMetrics.errors.authFailures++;
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Database query performance monitoring
 */
const databaseMonitoringMiddleware = () => {
  return (req, res, next) => {
    const originalQuery = req.query;
    const queries = [];
    
    // Mock database query interceptor (would integrate with actual DB driver)
    const interceptQuery = (query, params, callback) => {
      const startTime = performance.now();
      
      // Execute original query
      const result = callback(query, params);
      
      const duration = performance.now() - startTime;
      
      // Track query metrics
      queries.push({
        query: query.substring(0, 100), // Truncate for logging
        duration,
        params: params ? Object.keys(params).length : 0,
        timestamp: Date.now()
      });
      
      // Update global database metrics
      globalMetrics.database.totalQueries++;
      globalMetrics.database.totalQueryTime += duration;
      globalMetrics.database.averageQueryTime = 
        globalMetrics.database.totalQueryTime / globalMetrics.database.totalQueries;
      
      // Check for slow queries
      if (duration > thresholds.slowQuery) {
        globalMetrics.database.slowQueries++;
        
        const logLevel = duration > thresholds.criticalQuery ? 'error' : 'warn';
        logger[logLevel]('Slow Database Query Detected', {
          query: query.substring(0, 200),
          duration: Math.round(duration),
          params: params ? Object.keys(params).length : 0,
          threshold: thresholds.slowQuery,
          isCritical: duration > thresholds.criticalQuery
        });
        
        metricsCollector.emit('slowQuery', {
          query,
          duration,
          params,
          correlationId: getCurrentContext()?.correlationId
        });
      }
      
      return result;
    };
    
    // Store query interceptor in request
    req.dbMonitor = { queries, interceptQuery };
    
    next();
  };
};

/**
 * System metrics monitoring
 */
const systemMetricsMonitoring = () => {
  const updateSystemMetrics = () => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    globalMetrics.system = {
      ...globalMetrics.system,
      memoryUsage,
      cpuUsage,
      lastUpdated: Date.now(),
      uptime: process.uptime(),
      eventLoopDelay: performance.eventLoopUtilization()
    };
    
    // Check system health
    if (memoryUsage.heapUsed > thresholds.memoryUsage) {
      logger.warn('System Memory Usage High', {
        heapUsed: memoryUsage.heapUsed,
        threshold: thresholds.memoryUsage,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss
      });
      
      metricsCollector.emit('systemAlert', {
        type: 'memory',
        current: memoryUsage.heapUsed,
        threshold: thresholds.memoryUsage
      });
    }
  };
  
  // Update system metrics every 30 seconds
  setInterval(updateSystemMetrics, 30000);
  
  return (req, res, next) => {
    next();
  };
};

/**
 * Get current performance metrics
 */
const getCurrentMetrics = () => {
  const now = Date.now();
  const uptime = now - globalMetrics.system.startTime;
  
  return {
    ...globalMetrics,
    timestamp: now,
    uptime,
    percentiles: responseTimes.length > 0 ? calculatePercentiles([...responseTimes]) : null,
    health: {
      status: getSystemHealthStatus(),
      lastCheck: now
    }
  };
};

/**
 * Get system health status
 */
const getSystemHealthStatus = () => {
  const memoryUsage = process.memoryUsage();
  const isMemoryHealthy = memoryUsage.heapUsed < thresholds.memoryUsage;
  const isErrorRateHealthy = globalMetrics.errors.total < (globalMetrics.requests.total * 0.05); // 5% error rate
  const isResponseTimeHealthy = globalMetrics.requests.averageTime < thresholds.slowRequest;
  
  if (isMemoryHealthy && isErrorRateHealthy && isResponseTimeHealthy) {
    return 'healthy';
  } else if (!isMemoryHealthy || !isErrorRateHealthy) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
};

/**
 * Reset metrics (for testing or periodic cleanup)
 */
const resetMetrics = () => {
  globalMetrics = {
    requests: {
      total: 0,
      totalTime: 0,
      averageTime: 0,
      slowRequests: 0,
      byMethod: {},
      byPath: {},
      byStatus: {}
    },
    system: {
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      lastUpdated: Date.now()
    },
    database: {
      totalQueries: 0,
      totalQueryTime: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      connectionPoolUsage: 0
    },
    errors: {
      total: 0,
      byType: {},
      byStatus: {},
      rateLimited: 0,
      authFailures: 0
    }
  };
};

/**
 * Export metrics for external monitoring systems
 */
const exportMetrics = (format = 'json') => {
  const metrics = getCurrentMetrics();
  
  if (format === 'prometheus') {
    return convertToPrometheusFormat(metrics);
  }
  
  return metrics;
};

/**
 * Convert metrics to Prometheus format
 */
const convertToPrometheusFormat = (metrics) => {
  let output = '';
  
  // Request metrics
  output += `# HELP http_requests_total Total number of HTTP requests\n`;
  output += `# TYPE http_requests_total counter\n`;
  output += `http_requests_total ${metrics.requests.total}\n\n`;
  
  output += `# HELP http_request_duration_ms Average HTTP request duration in milliseconds\n`;
  output += `# TYPE http_request_duration_ms gauge\n`;
  output += `http_request_duration_ms ${metrics.requests.averageTime}\n\n`;
  
  // Memory metrics
  output += `# HELP process_memory_heap_used_bytes Process heap memory used in bytes\n`;
  output += `# TYPE process_memory_heap_used_bytes gauge\n`;
  output += `process_memory_heap_used_bytes ${metrics.system.memoryUsage.heapUsed}\n\n`;
  
  // Error metrics
  output += `# HELP http_errors_total Total number of HTTP errors\n`;
  output += `# TYPE http_errors_total counter\n`;
  output += `http_errors_total ${metrics.errors.total}\n\n`;
  
  return output;
};

module.exports = {
  performanceMonitoringMiddleware,
  databaseMonitoringMiddleware,
  systemMetricsMonitoring,
  getCurrentMetrics,
  getSystemHealthStatus,
  resetMetrics,
  exportMetrics,
  metricsCollector,
  thresholds
};