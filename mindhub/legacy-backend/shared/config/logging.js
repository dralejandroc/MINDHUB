/**
 * Structured Logging Configuration
 * 
 * Centralized logging system with:
 * - Winston-based structured logging
 * - Multiple transports (console, file, database)
 * - Log rotation and retention
 * - Healthcare compliance features
 * - Context propagation
 * - Performance optimizations
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
// const { ElasticsearchTransport } = require('winston-elasticsearch'); // Disabled for local development
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for healthcare-compliant logging
 */
const healthcareFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      correlationId,
      userId,
      ip,
      userAgent,
      method,
      path,
      statusCode,
      duration,
      error,
      ...meta
    } = info;

    const logEntry = {
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      message,
      service: 'mindhub-backend',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      ...(correlationId && { correlationId }),
      ...(userId && { userId }),
      ...(ip && { clientIp: ip }),
      ...(userAgent && { userAgent }),
      ...(method && { httpMethod: method }),
      ...(path && { httpPath: path }),
      ...(statusCode && { httpStatusCode: statusCode }),
      ...(duration && { responseDuration: duration }),
      ...(error && { error: error }),
      ...meta
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * Development console format
 */
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({
    format: 'HH:mm:ss'
  }),
  format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      correlationId,
      method,
      path,
      statusCode,
      duration,
      ...meta
    } = info;

    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (correlationId) {
      logMessage += ` [${correlationId}]`;
    }
    
    if (method && path) {
      logMessage += ` ${method} ${path}`;
    }
    
    if (statusCode) {
      logMessage += ` (${statusCode})`;
    }
    
    if (duration) {
      logMessage += ` ${duration}ms`;
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

/**
 * Create transports based on environment
 */
const createTransports = () => {
  const transports = [];
  
  // Console transport
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: devFormat,
        level: 'debug'
      })
    );
  } else {
    transports.push(
      new winston.transports.Console({
        format: healthcareFormat,
        level: 'info'
      })
    );
  }
  
  // File transports with rotation
  transports.push(
    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'mindhub-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: healthcareFormat,
      level: 'info'
    }),
    
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'mindhub-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d', // Keep error logs longer for compliance
      format: healthcareFormat,
      level: 'error'
    }),
    
    // Audit logs (separate for compliance)
    new DailyRotateFile({
      filename: path.join(logsDir, 'mindhub-audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '2555d', // Keep audit logs for 7 years (healthcare compliance)
      format: healthcareFormat,
      level: 'info'
    })
  );
  
  // Elasticsearch transport for production (disabled for local development)
  // if (process.env.ELASTICSEARCH_URL && process.env.NODE_ENV === 'production') {
  //   transports.push(
  //     new ElasticsearchTransport({
  //       level: 'info',
  //       clientOpts: {
  //         node: process.env.ELASTICSEARCH_URL,
  //         auth: {
  //           username: process.env.ELASTICSEARCH_USERNAME,
  //           password: process.env.ELASTICSEARCH_PASSWORD
  //         }
  //       },
  //       index: 'mindhub-logs',
  //       transformer: (logData) => {
  //         const transformed = {
  //           '@timestamp': new Date().toISOString(),
  //           ...logData
  //         };
  //         delete transformed.timestamp;
  //         return transformed;
  //       }
  //     })
  //   );
  // }
  
  return transports;
};

/**
 * Create main logger instance - SIMPLIFIED VERSION
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',  // Only log errors for now
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
  exitOnError: false
});

/**
 * Audit logger for compliance
 */
const auditLogger = winston.createLogger({
  level: 'info',
  format: healthcareFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '2555d', // 7 years for healthcare compliance
      format: format.combine(
        format.timestamp(),
        format.json(),
        format.printf((info) => {
          return JSON.stringify({
            '@timestamp': info.timestamp,
            level: 'AUDIT',
            service: 'mindhub-backend',
            environment: process.env.NODE_ENV || 'development',
            ...info
          });
        })
      )
    })
  ]
});

/**
 * Performance logger for monitoring
 */
const performanceLogger = winston.createLogger({
  level: 'info',
  format: healthcareFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: format.combine(
        format.timestamp(),
        format.json(),
        format.printf((info) => {
          return JSON.stringify({
            '@timestamp': info.timestamp,
            level: 'PERFORMANCE',
            service: 'mindhub-backend',
            environment: process.env.NODE_ENV || 'development',
            ...info
          });
        })
      )
    })
  ]
});

/**
 * Security logger for security events
 */
const securityLogger = winston.createLogger({
  level: 'info',
  format: healthcareFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '2555d', // 7 years for compliance
      format: format.combine(
        format.timestamp(),
        format.json(),
        format.printf((info) => {
          return JSON.stringify({
            '@timestamp': info.timestamp,
            level: 'SECURITY',
            service: 'mindhub-backend',
            environment: process.env.NODE_ENV || 'development',
            ...info
          });
        })
      )
    })
  ]
});

/**
 * Enhanced logging methods with context
 */
const createContextualLogger = (baseLogger) => {
  return {
    debug: (message, meta = {}) => {
      const context = require('./request-context').getCurrentContext();
      baseLogger.debug(message, { ...meta, ...context });
    },
    
    info: (message, meta = {}) => {
      const context = require('./request-context').getCurrentContext();
      baseLogger.info(message, { ...meta, ...context });
    },
    
    warn: (message, meta = {}) => {
      const context = require('./request-context').getCurrentContext();
      baseLogger.warn(message, { ...meta, ...context });
    },
    
    error: (message, meta = {}) => {
      const context = require('./request-context').getCurrentContext();
      baseLogger.error(message, { ...meta, ...context });
    },
    
    // Healthcare-specific methods
    audit: (event, data = {}) => {
      const context = require('./request-context').getCurrentContext();
      auditLogger.info(event, { 
        eventType: 'audit',
        ...data, 
        ...context 
      });
    },
    
    security: (event, data = {}) => {
      const context = require('./request-context').getCurrentContext();
      securityLogger.warn(event, { 
        eventType: 'security',
        ...data, 
        ...context 
      });
    },
    
    performance: (metric, data = {}) => {
      const context = require('./request-context').getCurrentContext();
      performanceLogger.info(metric, { 
        eventType: 'performance',
        ...data, 
        ...context 
      });
    }
  };
};

/**
 * Log levels configuration
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

/**
 * Log sampling for high-volume endpoints
 */
const shouldSample = (path, method) => {
  const highVolumeEndpoints = [
    '/health',
    '/ping',
    '/metrics',
    '/status'
  ];
  
  const sampleRate = parseFloat(process.env.LOG_SAMPLE_RATE) || 1.0;
  
  if (highVolumeEndpoints.some(endpoint => path.startsWith(endpoint))) {
    return Math.random() < (sampleRate * 0.1); // 10% of sample rate for health checks
  }
  
  return Math.random() < sampleRate;
};

/**
 * Initialize logging system - SIMPLIFIED
 */
const initializeLogging = () => {
  console.log('Simple logging system initialized');
};

module.exports = {
  logger: createContextualLogger(logger),
  auditLogger,
  performanceLogger,
  securityLogger,
  healthcareFormat,
  logLevels,
  shouldSample,
  initializeLogging
};