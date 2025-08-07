/**
 * Security Middleware Suite for MindHub Healthcare Platform
 * 
 * Comprehensive security middleware including CORS, CSP, rate limiting,
 * request validation, and healthcare-specific security controls
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const validator = require('validator');
const crypto = require('crypto');

class SecurityMiddleware {
  constructor() {
    this.trustedDomains = [
      'https://mindhub.com',
      'https://*.mindhub.com',
      'https://clinimetrix.mindhub.com',
      'https://expedix.mindhub.com',
      'https://formx.mindhub.com',
      'https://resources.mindhub.com'
    ];

    this.developmentDomains = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

    // Security configuration
    this.securityConfig = {
      maxRequestSize: '10mb',
      maxFileUploadSize: '50mb',
      maxFieldsPerRequest: 100,
      maxFilesPerRequest: 10,
      allowedFileTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/json'
      ],
      sensitiveHeaders: [
        'authorization',
        'x-api-key',
        'x-session-id',
        'x-patient-id'
      ]
    };
  }

  /**
   * Core security headers using Helmet
   */
  securityHeaders() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React in development
            "https://cdn.auth0.com",
            "https://js.stripe.com",
            "https://maps.googleapis.com"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for styled-components
            "https://fonts.googleapis.com",
            "https://cdn.auth0.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdn.auth0.com"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:"
          ],
          connectSrc: [
            "'self'",
            "https://mindhub.cloud",
            "https://www.mindhub.cloud", 
            "https://api.mindhub.com",
            "https://mindhub-production.up.railway.app",
            "https://*.auth0.com",
            "https://api.stripe.com",
            "https://maps.googleapis.com",
            "http://localhost:*"
          ],
          frameSrc: [
            "'self'",
            "https://js.stripe.com"
          ],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
          childSrc: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        },
        reportOnly: process.env.NODE_ENV === 'development'
      },

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },

      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: true,

      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },

      // Permissions Policy
      permissionsPolicy: {
        features: {
          camera: ['self'],
          microphone: ['self'],
          geolocation: ['self'],
          payment: ['self'],
          accelerometer: [],
          gyroscope: [],
          magnetometer: [],
          usb: [],
          bluetooth: []
        }
      },

      // Hide X-Powered-By header
      hidePoweredBy: true,

      // Expect-CT header
      expectCt: {
        maxAge: 86400, // 24 hours
        enforce: process.env.NODE_ENV === 'production'
      }
    });
  }

  /**
   * CORS configuration for healthcare applications
   */
  corsConfiguration() {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? this.trustedDomains 
      : [...this.trustedDomains, ...this.developmentDomains];

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (allowedOrigin.includes('*')) {
            const regex = new RegExp(allowedOrigin.replace('*', '.*'));
            return regex.test(origin);
          }
          return allowedOrigin === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          this.logSecurityEvent('CORS_VIOLATION', { origin, allowedOrigins });
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Session-ID',
        'X-Request-ID',
        'X-User-Role',
        'X-Organization-ID'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Request-ID',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset'
      ],
      credentials: true,
      maxAge: 86400, // 24 hours preflight cache
      optionsSuccessStatus: 200
    });
  }

  /**
   * Rate limiting with healthcare-specific rules
   */
  rateLimiting() {
    return [
      // Global rate limit
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Limit each IP to 1000 requests per windowMs
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later',
            timestamp: new Date().toISOString()
          }
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          // Use user ID if authenticated, otherwise IP
          return req.user?.id || req.ip;
        },
        skip: (req) => {
          // Skip rate limiting for health checks and system endpoints
          return req.path === '/health' || req.path === '/system/status';
        },
        onLimitReached: (req) => {
          this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            ip: req.ip,
            userId: req.user?.id,
            path: req.path
          });
        }
      }),

      // Slow down repeated requests
      slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 100, // Allow 100 requests per windowMs without delay
        delayMs: 500, // Add 500ms delay after delayAfter requests
        maxDelayMs: 5000, // Maximum delay of 5 seconds
        keyGenerator: (req) => req.user?.id || req.ip
      })
    ];
  }

  /**
   * Strict rate limiting for authentication endpoints
   */
  authRateLimiting() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 login attempts per windowMs
      message: {
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts, please try again later',
          timestamp: new Date().toISOString()
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `auth:${req.ip}`,
      onLimitReached: (req) => {
        this.logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path
        });
      }
    });
  }

  /**
   * Request validation middleware
   */
  requestValidation() {
    return (req, res, next) => {
      try {
        // Validate request size
        if (req.headers['content-length']) {
          const contentLength = parseInt(req.headers['content-length']);
          const maxSize = req.path.includes('/upload') 
            ? this.parseSize(this.securityConfig.maxFileUploadSize)
            : this.parseSize(this.securityConfig.maxRequestSize);

          if (contentLength > maxSize) {
            this.logSecurityEvent('REQUEST_TOO_LARGE', {
              path: req.path,
              contentLength,
              maxSize,
              ip: req.ip
            });

            return res.status(413).json({
              error: {
                code: 'REQUEST_TOO_LARGE',
                message: 'Request entity too large',
                maxSize: this.securityConfig.maxRequestSize,
                timestamp: new Date().toISOString()
              }
            });
          }
        }

        // Validate content type for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const contentType = req.headers['content-type'];
          if (!contentType) {
            return res.status(400).json({
              error: {
                code: 'MISSING_CONTENT_TYPE',
                message: 'Content-Type header is required',
                timestamp: new Date().toISOString()
              }
            });
          }

          // Validate JSON content type
          if (contentType.includes('application/json')) {
            // Additional JSON validation will be handled by body parser
          }
        }

        // Sanitize sensitive headers
        this.sanitizeSensitiveHeaders(req);

        // Add security headers to response
        res.set({
          'X-Request-ID': req.headers['x-request-id'] || this.generateRequestId(),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        });

        next();
      } catch (error) {
        this.logSecurityEvent('REQUEST_VALIDATION_ERROR', {
          error: error.message,
          path: req.path,
          ip: req.ip
        });

        return res.status(400).json({
          error: {
            code: 'REQUEST_VALIDATION_FAILED',
            message: 'Request validation failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Input sanitization middleware
   */
  inputSanitization() {
    return (req, res, next) => {
      try {
        // Sanitize query parameters
        if (req.query) {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize request body
        if (req.body) {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize URL parameters
        if (req.params) {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        this.logSecurityEvent('SANITIZATION_ERROR', {
          error: error.message,
          path: req.path,
          ip: req.ip
        });

        return res.status(400).json({
          error: {
            code: 'INPUT_SANITIZATION_FAILED',
            message: 'Input sanitization failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * SQL injection protection
   */
  sqlInjectionProtection() {
    return (req, res, next) => {
      try {
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
          /((\%27)|(\')|(\')|(\%2D)|(-)|(\-\-))/gi,
          /((\%3B)|(;))/gi,
          /((\%2A)|(\*))/gi
        ];

        const checkValue = (value) => {
          if (typeof value === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(value)) {
                return false;
              }
            }
          }
          return true;
        };

        const validateObject = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              if (!validateObject(obj[key])) return false;
            } else {
              if (!checkValue(obj[key])) return false;
            }
          }
          return true;
        };

        // Check query parameters
        if (req.query && !validateObject(req.query)) {
          this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            type: 'query',
            data: req.query,
            ip: req.ip,
            path: req.path
          });

          return res.status(400).json({
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid characters detected in request',
              timestamp: new Date().toISOString()
            }
          });
        }

        // Check request body
        if (req.body && !validateObject(req.body)) {
          this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            type: 'body',
            data: req.body,
            ip: req.ip,
            path: req.path
          });

          return res.status(400).json({
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid characters detected in request',
              timestamp: new Date().toISOString()
            }
          });
        }

        next();
      } catch (error) {
        this.logSecurityEvent('SQL_INJECTION_CHECK_ERROR', {
          error: error.message,
          path: req.path,
          ip: req.ip
        });

        return res.status(500).json({
          error: {
            code: 'SECURITY_CHECK_FAILED',
            message: 'Security validation failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * XSS protection middleware
   */
  xssProtection() {
    return (req, res, next) => {
      try {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<img[^>]+src[\\s]*=[\\s]*[\\"\\']/gi
        ];

        const sanitizeValue = (value) => {
          if (typeof value === 'string') {
            for (const pattern of xssPatterns) {
              if (pattern.test(value)) {
                this.logSecurityEvent('XSS_ATTEMPT', {
                  value,
                  pattern: pattern.toString(),
                  ip: req.ip,
                  path: req.path
                });

                // Remove potentially dangerous content
                value = value.replace(pattern, '');
              }
            }
            
            // HTML encode special characters
            return validator.escape(value);
          }
          return value;
        };

        const sanitizeObject = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              sanitizeObject(obj[key]);
            } else {
              obj[key] = sanitizeValue(obj[key]);
            }
          }
        };

        // Sanitize all input
        if (req.query) sanitizeObject(req.query);
        if (req.body) sanitizeObject(req.body);
        if (req.params) sanitizeObject(req.params);

        next();
      } catch (error) {
        this.logSecurityEvent('XSS_PROTECTION_ERROR', {
          error: error.message,
          path: req.path,
          ip: req.ip
        });

        return res.status(500).json({
          error: {
            code: 'XSS_PROTECTION_FAILED',
            message: 'XSS protection failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * File upload security middleware
   */
  fileUploadSecurity() {
    return (req, res, next) => {
      try {
        if (!req.files && !req.file) {
          return next();
        }

        const files = req.files || [req.file];
        const filesArray = Array.isArray(files) ? files : Object.values(files).flat();

        for (const file of filesArray) {
          if (!file) continue;

          // Check file type
          if (!this.securityConfig.allowedFileTypes.includes(file.mimetype)) {
            this.logSecurityEvent('INVALID_FILE_TYPE', {
              filename: file.originalname,
              mimetype: file.mimetype,
              allowedTypes: this.securityConfig.allowedFileTypes,
              ip: req.ip
            });

            return res.status(400).json({
              error: {
                code: 'INVALID_FILE_TYPE',
                message: `File type ${file.mimetype} is not allowed`,
                allowedTypes: this.securityConfig.allowedFileTypes,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Check file size
          const maxSize = this.parseSize(this.securityConfig.maxFileUploadSize);
          if (file.size > maxSize) {
            this.logSecurityEvent('FILE_TOO_LARGE', {
              filename: file.originalname,
              size: file.size,
              maxSize,
              ip: req.ip
            });

            return res.status(413).json({
              error: {
                code: 'FILE_TOO_LARGE',
                message: `File size exceeds maximum allowed size of ${this.securityConfig.maxFileUploadSize}`,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Sanitize filename
          file.originalname = this.sanitizeFilename(file.originalname);
        }

        next();
      } catch (error) {
        this.logSecurityEvent('FILE_SECURITY_ERROR', {
          error: error.message,
          path: req.path,
          ip: req.ip
        });

        return res.status(500).json({
          error: {
            code: 'FILE_SECURITY_CHECK_FAILED',
            message: 'File security check failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? validator.escape(obj) : obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = validator.escape(key);
        sanitized[sanitizedKey] = this.sanitizeObject(obj[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize sensitive headers
   */
  sanitizeSensitiveHeaders(req) {
    // Remove or mask sensitive headers in logs
    for (const header of this.securityConfig.sensitiveHeaders) {
      if (req.headers[header]) {
        // Keep first and last 4 characters, mask the rest
        const value = req.headers[header];
        if (value.length > 8) {
          req.headers[`${header}-masked`] = `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
        }
      }
    }
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters
      .replace(/\.\./g, '_') // Remove directory traversal attempts
      .substring(0, 255); // Limit length
  }

  /**
   * Parse size string to bytes
   */
  parseSize(sizeStr) {
    const units = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+)(kb|mb|gb)?$/);
    
    if (!match) return 0;
    
    const size = parseInt(match[1]);
    const unit = match[2] || 'b';
    
    return size * (units[unit] || 1);
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      component: 'SecurityMiddleware',
      severity: this.getEventSeverity(eventType),
      details
    };

    // In production, this would write to a secure audit log system
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Get event severity level
   */
  getEventSeverity(eventType) {
    const highSeverityEvents = [
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'AUTH_RATE_LIMIT_EXCEEDED',
      'CORS_VIOLATION'
    ];

    const mediumSeverityEvents = [
      'RATE_LIMIT_EXCEEDED',
      'INVALID_FILE_TYPE',
      'FILE_TOO_LARGE',
      'REQUEST_TOO_LARGE'
    ];

    if (highSeverityEvents.includes(eventType)) return 'HIGH';
    if (mediumSeverityEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = SecurityMiddleware;