/**
 * Advanced Security Middleware for MindHub Healthcare Platform
 * 
 * Comprehensive security suite with healthcare-specific protections,
 * compliance enforcement, threat detection, and access control
 */

const helmet = require('helmet');
const crypto = require('crypto');
const validator = require('validator');
const AuditLogger = require('../utils/audit-logger');

class AdvancedSecurityMiddleware {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Security configurations
    this.securityConfig = {
      // Content Security Policy for healthcare applications
      csp: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://mindhub.cloud", "https://www.mindhub.cloud", "https://api.mindhub.com", "https://mindhub-production.up.railway.app", "https://api.mindhub.health", "http://localhost:*"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          childSrc: ["'none'"],
          workerSrc: ["'none'"],
          manifestSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"]
        },
        reportOnly: false
      },

      // CORS configuration for healthcare API
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://app.mindhub.health',
            'https://admin.mindhub.health',
            'https://patient.mindhub.health'
          ].filter(Boolean);

          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-CSRF-Token',
          'X-Request-ID',
          'X-Emergency-Access',
          'X-Emergency-Code'
        ],
        exposedHeaders: [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset'
        ]
      },

      // Suspicious patterns for threat detection
      threatPatterns: {
        sqlInjection: [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
          /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
          /(;|\-\-|\/\*|\*\/)/,
          /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i
        ],
        xss: [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
        ],
        pathTraversal: [
          /\.\./,
          /\/etc\/passwd/,
          /\/windows\/system32/,
          /\\windows\\system32/
        ],
        commandInjection: [
          /[\$`|&;]/,
          /\b(cat|ls|pwd|whoami|uname|id|ps|netstat)\b/i
        ]
      }
    };

    // IP reputation tracking
    this.ipReputation = new Map();
    
    // Session security tracking
    this.sessionSecurity = new Map();
  }

  /**
   * Enhanced Helmet configuration for healthcare
   */
  enhancedHelmet() {
    return helmet({
      contentSecurityPolicy: this.securityConfig.csp,
      
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
          notifications: ['self'],
          payment: ['none'],
          usb: ['none']
        }
      },

      // Hide X-Powered-By header
      hidePoweredBy: true,

      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: true,

      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: {
        policy: 'same-origin'
      },

      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    });
  }

  /**
   * Input validation and sanitization middleware
   */
  inputValidation() {
    return async (req, res, next) => {
      try {
        // Validate and sanitize request data
        this.validateRequestData(req);
        
        // Check for malicious patterns
        const threats = this.detectThreats(req);
        
        if (threats.length > 0) {
          await this.handleThreatDetection(req, threats);
          
          return res.status(400).json({
            error: {
              code: 'MALICIOUS_INPUT_DETECTED',
              message: 'Request contains potentially malicious content',
              type: 'security_violation'
            }
          });
        }

        next();

      } catch (error) {
        await this.auditLogger.logSecurityEvent(
          req.user?.id,
          'INPUT_VALIDATION_ERROR',
          {
            error: error.message,
            ip: req.ip,
            endpoint: req.originalUrl
          }
        );

        return res.status(400).json({
          error: {
            code: 'INPUT_VALIDATION_FAILED',
            message: 'Invalid input data',
            type: 'validation_error'
          }
        });
      }
    };
  }

  /**
   * CSRF protection middleware
   */
  csrfProtection() {
    return (req, res, next) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;

      if (!token || !sessionToken || token !== sessionToken) {
        this.auditLogger.logSecurityEvent(
          req.user?.id,
          'CSRF_TOKEN_MISMATCH',
          {
            ip: req.ip,
            endpoint: req.originalUrl,
            providedToken: token ? '[PROVIDED]' : '[MISSING]',
            threatLevel: 'HIGH'
          }
        );

        return res.status(403).json({
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed',
            type: 'csrf_error'
          }
        });
      }

      next();
    };
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(req, res, next) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    res.locals.csrfToken = req.session.csrfToken;
    next();
  }

  /**
   * IP reputation and geolocation middleware
   */
  ipReputation() {
    return async (req, res, next) => {
      const clientIP = req.ip;
      const now = Date.now();

      try {
        // Get IP reputation data
        let reputation = this.ipReputation.get(clientIP) || {
          score: 100, // Start with good reputation
          lastSeen: now,
          violations: 0,
          countries: new Set()
        };

        // Update last seen
        reputation.lastSeen = now;

        // Geolocation check (basic implementation)
        const country = req.headers['cf-ipcountry'] || 'unknown';
        reputation.countries.add(country);

        // Check for suspicious geographic patterns
        if (reputation.countries.size > 3) {
          reputation.score -= 10;
          await this.auditLogger.logSecurityEvent(
            req.user?.id,
            'MULTIPLE_COUNTRIES_DETECTED',
            {
              ip: clientIP,
              countries: Array.from(reputation.countries),
              threatLevel: 'MEDIUM'
            }
          );
        }

        // Block IPs with very low reputation
        if (reputation.score < 30) {
          return res.status(403).json({
            error: {
              code: 'IP_REPUTATION_LOW',
              message: 'Access denied due to low IP reputation',
              type: 'ip_blocked'
            }
          });
        }

        this.ipReputation.set(clientIP, reputation);
        req.ipReputation = reputation;

        next();

      } catch (error) {
        console.error('IP reputation check failed:', error);
        next(); // Continue on error
      }
    };
  }

  /**
   * Session security middleware
   */
  sessionSecurity() {
    return async (req, res, next) => {
      if (!req.user || !req.sessionID) {
        return next();
      }

      const sessionId = req.sessionID;
      const userId = req.user.id;
      const userAgent = req.headers['user-agent'];
      const clientIP = req.ip;

      try {
        let sessionInfo = this.sessionSecurity.get(sessionId) || {
          userId,
          createdAt: Date.now(),
          userAgent,
          ip: clientIP,
          lastActivity: Date.now(),
          requestCount: 0
        };

        // Update session activity
        sessionInfo.lastActivity = Date.now();
        sessionInfo.requestCount++;

        // Detect session hijacking attempts
        if (sessionInfo.userAgent !== userAgent) {
          await this.handleSessionAnomaly(req, 'USER_AGENT_CHANGED');
          
          return res.status(403).json({
            error: {
              code: 'SESSION_ANOMALY_DETECTED',
              message: 'Session security violation detected',
              type: 'session_hijacking'
            }
          });
        }

        // Check for IP changes (allow some flexibility for mobile users)
        if (sessionInfo.ip !== clientIP) {
          await this.auditLogger.logSecurityEvent(
            userId,
            'SESSION_IP_CHANGED',
            {
              sessionId,
              originalIP: sessionInfo.ip,
              newIP: clientIP,
              threatLevel: 'MEDIUM'
            }
          );

          sessionInfo.ip = clientIP; // Update IP
        }

        // Session timeout check (healthcare-specific timeouts)
        const maxAge = this.getSessionMaxAge(req.user.role);
        if (Date.now() - sessionInfo.createdAt > maxAge) {
          this.sessionSecurity.delete(sessionId);
          
          return res.status(401).json({
            error: {
              code: 'SESSION_EXPIRED',
              message: 'Session has expired due to inactivity',
              type: 'session_timeout'
            }
          });
        }

        this.sessionSecurity.set(sessionId, sessionInfo);
        next();

      } catch (error) {
        console.error('Session security check failed:', error);
        next(); // Continue on error
      }
    };
  }

  /**
   * Healthcare data access control
   */
  healthcareAccessControl() {
    return async (req, res, next) => {
      try {
        // Check if accessing patient data
        const patientId = req.params.patientId || req.body.patientId;
        
        if (patientId && req.user) {
          // Verify access permissions
          const hasAccess = await this.verifyPatientAccess(req.user, patientId);
          
          if (!hasAccess) {
            await this.auditLogger.logComplianceEvent(
              req.user.id,
              'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT',
              {
                patientId,
                userRole: req.user.role,
                endpoint: req.originalUrl,
                ip: req.ip,
                complianceViolationType: 'PATIENT_ACCESS_DENIED'
              }
            );

            return res.status(403).json({
              error: {
                code: 'PATIENT_ACCESS_DENIED',
                message: 'Insufficient permissions to access patient data',
                type: 'compliance_violation'
              }
            });
          }

          // Log legitimate access
          await this.auditLogger.logComplianceEvent(
            req.user.id,
            'PATIENT_DATA_ACCESS',
            {
              patientId,
              userRole: req.user.role,
              endpoint: req.originalUrl,
              ip: req.ip,
              accessLevel: 'AUTHORIZED'
            }
          );
        }

        next();

      } catch (error) {
        console.error('Healthcare access control error:', error);
        next();
      }
    };
  }

  /**
   * Request integrity verification
   */
  requestIntegrity() {
    return (req, res, next) => {
      // Generate request fingerprint
      const fingerprint = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          timestamp: Date.now()
        }))
        .digest('hex');

      req.requestFingerprint = fingerprint;

      // Add integrity headers to response
      res.set({
        'X-Request-ID': req.headers['x-request-id'] || crypto.randomUUID(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });

      next();
    };
  }

  /**
   * Validate request data
   */
  validateRequestData(req) {
    // Validate URL parameters
    if (req.params) {
      Object.values(req.params).forEach(param => {
        if (typeof param === 'string' && !validator.isLength(param, { max: 500 })) {
          throw new Error('Parameter too long');
        }
      });
    }

    // Validate query parameters
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (typeof value === 'string') {
          if (!validator.isLength(value, { max: 1000 })) {
            throw new Error(`Query parameter ${key} too long`);
          }
        }
      });
    }

    // Validate request body size
    if (req.body && JSON.stringify(req.body).length > 10 * 1024 * 1024) { // 10MB
      throw new Error('Request body too large');
    }
  }

  /**
   * Detect security threats in request
   */
  detectThreats(req) {
    const threats = [];
    const dataToCheck = [
      ...Object.values(req.params || {}),
      ...Object.values(req.query || {}),
      ...(req.body ? this.flattenObject(req.body) : [])
    ];

    dataToCheck.forEach(data => {
      if (typeof data === 'string') {
        // Check SQL injection patterns
        if (this.securityConfig.threatPatterns.sqlInjection.some(pattern => pattern.test(data))) {
          threats.push({ type: 'sql_injection', data });
        }

        // Check XSS patterns
        if (this.securityConfig.threatPatterns.xss.some(pattern => pattern.test(data))) {
          threats.push({ type: 'xss', data });
        }

        // Check path traversal
        if (this.securityConfig.threatPatterns.pathTraversal.some(pattern => pattern.test(data))) {
          threats.push({ type: 'path_traversal', data });
        }

        // Check command injection
        if (this.securityConfig.threatPatterns.commandInjection.some(pattern => pattern.test(data))) {
          threats.push({ type: 'command_injection', data });
        }
      }
    });

    return threats;
  }

  /**
   * Handle threat detection
   */
  async handleThreatDetection(req, threats) {
    const threatInfo = {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      method: req.method,
      threats: threats.map(t => ({ type: t.type, pattern: '[REDACTED]' })),
      userAgent: req.headers['user-agent']
    };

    await this.auditLogger.logSecurityEvent(
      req.user?.id,
      'MALICIOUS_INPUT_DETECTED',
      {
        ...threatInfo,
        threatLevel: 'CRITICAL',
        action: 'BLOCKED',
        result: 'ACCESS_DENIED'
      }
    );

    // Reduce IP reputation
    const clientIP = req.ip;
    if (this.ipReputation.has(clientIP)) {
      const reputation = this.ipReputation.get(clientIP);
      reputation.score -= 20;
      reputation.violations++;
      this.ipReputation.set(clientIP, reputation);
    }
  }

  /**
   * Handle session anomaly
   */
  async handleSessionAnomaly(req, anomalyType) {
    await this.auditLogger.logSecurityEvent(
      req.user?.id,
      'SESSION_ANOMALY_DETECTED',
      {
        anomalyType,
        sessionId: req.sessionID,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        threatLevel: 'HIGH'
      }
    );

    // Invalidate session
    req.session.destroy();
    this.sessionSecurity.delete(req.sessionID);
  }

  /**
   * Get session max age based on role
   */
  getSessionMaxAge(role) {
    const timeouts = {
      admin: 4 * 60 * 60 * 1000,      // 4 hours
      psychiatrist: 8 * 60 * 60 * 1000, // 8 hours
      psychologist: 8 * 60 * 60 * 1000, // 8 hours
      nurse: 6 * 60 * 60 * 1000,      // 6 hours
      patient: 2 * 60 * 60 * 1000     // 2 hours
    };

    return timeouts[role] || 2 * 60 * 60 * 1000; // Default 2 hours
  }

  /**
   * Verify patient access permissions
   */
  async verifyPatientAccess(user, patientId) {
    // Implement your patient access verification logic here
    // This is a placeholder implementation
    
    if (user.role === 'admin') return true;
    if (user.role === 'patient' && user.patientId === patientId) return true;
    if (['psychiatrist', 'psychologist', 'nurse'].includes(user.role)) {
      // Check if healthcare provider has access to this patient
      // Implement database query here
      return true; // Placeholder
    }

    return false;
  }

  /**
   * Flatten object for threat detection
   */
  flattenObject(obj, prefix = '') {
    const flattened = [];
    
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) continue;
      
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        flattened.push(...this.flattenObject(obj[key], `${prefix}${key}.`));
      } else {
        flattened.push(obj[key]);
      }
    }
    
    return flattened;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Cleanup IP reputation
    for (const [ip, data] of this.ipReputation.entries()) {
      if (now - data.lastSeen > maxAge) {
        this.ipReputation.delete(ip);
      }
    }

    // Cleanup session security
    for (const [sessionId, data] of this.sessionSecurity.entries()) {
      if (now - data.lastActivity > maxAge) {
        this.sessionSecurity.delete(sessionId);
      }
    }
  }
}

module.exports = AdvancedSecurityMiddleware;