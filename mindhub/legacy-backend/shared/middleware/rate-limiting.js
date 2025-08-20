/**
 * Simplified Rate Limiting Middleware for MindHub Healthcare Platform
 * Local development version without Redis dependency
 */

const rateLimit = require('express-rate-limit');

class RateLimitingMiddleware {
  constructor() {
    // No Redis client for local development
    // this.auditLogger = new AuditLogger(); // Commented for local development

    // Rate limit configurations for different endpoints
    this.rateLimitConfigs = {
      // Authentication endpoints - strict limits
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
            type: 'auth_rate_limit'
          }
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true
      },

      // API endpoints - moderate limits per role
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: (req) => {
          const role = req.user?.role;
          switch (role) {
            case 'admin': return 1000;
            case 'psychiatrist': return 500;
            case 'psychologist': return 500;
            case 'nurse': return 300;
            case 'patient': return 100;
            default: return 50;
          }
        },
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API rate limit exceeded, please slow down',
            type: 'api_rate_limit'
          }
        },
        standardHeaders: true,
        legacyHeaders: false
      },

      // Patient data access - strict healthcare compliance
      patientData: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: (req) => {
          const role = req.user?.role;
          switch (role) {
            case 'admin': return 200;
            case 'psychiatrist': return 150;
            case 'psychologist': return 150;
            case 'nurse': return 100;
            case 'patient': return 20; // Patients can only access their own data
            default: return 10;
          }
        },
        message: {
          error: {
            code: 'PATIENT_DATA_RATE_LIMIT',
            message: 'Patient data access rate limit exceeded',
            type: 'compliance_rate_limit'
          }
        },
        keyGenerator: (req) => {
          // Include user ID and patient ID for patient-specific limits
          return `patient_access:${req.user?.id}:${req.params.patientId || 'general'}`;
        }
      },

      // Form submissions - prevent spam
      formSubmission: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 5, // 5 submissions per window
        message: {
          error: {
            code: 'FORM_SUBMISSION_RATE_LIMIT',
            message: 'Too many form submissions, please wait before submitting again',
            type: 'form_rate_limit'
          }
        },
        keyGenerator: (req) => {
          return `form_submission:${req.ip}:${req.params.id || 'general'}`;
        }
      },

      // Search endpoints - prevent abuse
      search: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: (req) => {
          const role = req.user?.role;
          return role ? 30 : 10; // Higher limit for authenticated users
        },
        message: {
          error: {
            code: 'SEARCH_RATE_LIMIT',
            message: 'Search rate limit exceeded, please wait',
            type: 'search_rate_limit'
          }
        }
      },

      // File upload endpoints
      upload: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: (req) => {
          const role = req.user?.role;
          switch (role) {
            case 'admin': return 100;
            case 'psychiatrist': return 50;
            case 'psychologist': return 50;
            case 'nurse': return 30;
            case 'patient': return 10;
            default: return 5;
          }
        },
        message: {
          error: {
            code: 'UPLOAD_RATE_LIMIT',
            message: 'File upload rate limit exceeded',
            type: 'upload_rate_limit'
          }
        }
      },

      // Public endpoints - basic protection
      public: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
          error: {
            code: 'PUBLIC_RATE_LIMIT',
            message: 'Rate limit exceeded for public endpoints',
            type: 'public_rate_limit'
          }
        }
      }
    };

    // Suspicious activity thresholds
    this.suspiciousActivityThresholds = {
      rapidRequests: {
        windowMs: 1 * 60 * 1000, // 1 minute
        threshold: 50 // 50 requests in 1 minute
      },
      multipleIPs: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        threshold: 5 // Same user from 5+ different IPs
      },
      failedAuth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        threshold: 10 // 10 failed auth attempts
      }
    };
  }

  /**
   * Create rate limiter with memory store (local development)
   */
  createRateLimiter(config, options = {}) {
    return rateLimit({
      ...config,
      handler: async (req, res, next) => {
        await this.handleRateLimitExceeded(req, res, config, options);
      }
      // onLimitReached is deprecated in express-rate-limit v7
      // onLimitReached: async (req, res, options) => {
      //   await this.logRateLimitReached(req, options);
      // }
    });
  }

  /**
   * Authentication rate limiter
   */
  authRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.auth, {
      prefix: 'auth_rl:',
      type: 'authentication'
    });
  }

  /**
   * API rate limiter with role-based limits
   */
  apiRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.api, {
      prefix: 'api_rl:',
      type: 'api'
    });
  }

  /**
   * Patient data access rate limiter
   */
  patientDataRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.patientData, {
      prefix: 'patient_rl:',
      type: 'patient_data'
    });
  }

  /**
   * Form submission rate limiter
   */
  formSubmissionRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.formSubmission, {
      prefix: 'form_rl:',
      type: 'form_submission'
    });
  }

  /**
   * Search rate limiter
   */
  searchRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.search, {
      prefix: 'search_rl:',
      type: 'search'
    });
  }

  /**
   * Upload rate limiter
   */
  uploadRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.upload, {
      prefix: 'upload_rl:',
      type: 'upload'
    });
  }

  /**
   * Public endpoints rate limiter
   */
  publicRateLimit() {
    return this.createRateLimiter(this.rateLimitConfigs.public, {
      prefix: 'public_rl:',
      type: 'public'
    });
  }

  /**
   * Custom rate limiter factory
   */
  customRateLimit(windowMs, max, prefix) {
    const config = {
      windowMs,
      max,
      message: {
        error: {
          code: 'CUSTOM_RATE_LIMIT',
          message: 'Rate limit exceeded',
          type: 'custom_rate_limit'
        }
      },
      standardHeaders: true,
      legacyHeaders: false
    };

    return this.createRateLimiter(config, {
      prefix: `custom_${prefix}_rl:`,
      type: 'custom'
    });
  }

  /**
   * Adaptive rate limiting based on server load
   */
  adaptiveRateLimit() {
    return async (req, res, next) => {
      try {
        const serverLoad = await this.getServerLoad();
        const baseLimit = this.rateLimitConfigs.api.max(req);
        
        // Reduce limits when server load is high
        let adaptedLimit = baseLimit;
        if (serverLoad > 0.8) {
          adaptedLimit = Math.floor(baseLimit * 0.5); // 50% reduction
        } else if (serverLoad > 0.6) {
          adaptedLimit = Math.floor(baseLimit * 0.7); // 30% reduction
        }

        // Create temporary rate limiter with adapted limits
        const adaptiveConfig = {
          ...this.rateLimitConfigs.api,
          max: adaptedLimit
        };

        const limiter = this.createRateLimiter(adaptiveConfig, {
          prefix: 'adaptive_rl:',
          type: 'adaptive'
        });

        return limiter(req, res, next);

      } catch (error) {
        // Fallback to regular rate limiting if adaptive fails
        return this.apiRateLimit()(req, res, next);
      }
    };
  }

  /**
   * DDoS protection middleware
   */
  ddosProtection() {
    const suspiciousIPs = new Map();
    const rapidRequestTracking = new Map();

    return async (req, res, next) => {
      const clientIP = req.ip;
      const now = Date.now();

      try {
        // Track rapid requests
        const ipRequests = rapidRequestTracking.get(clientIP) || [];
        const recentRequests = ipRequests.filter(
          timestamp => now - timestamp < this.suspiciousActivityThresholds.rapidRequests.windowMs
        );
        
        recentRequests.push(now);
        rapidRequestTracking.set(clientIP, recentRequests);

        // Check for suspicious activity
        if (recentRequests.length > this.suspiciousActivityThresholds.rapidRequests.threshold) {
          await this.handleSuspiciousActivity(req, 'rapid_requests');
          
          return res.status(429).json({
            error: {
              code: 'DDOS_PROTECTION_TRIGGERED',
              message: 'Suspicious activity detected, access temporarily blocked',
              type: 'ddos_protection'
            }
          });
        }

        // Check if IP is marked as suspicious
        if (suspiciousIPs.has(clientIP)) {
          const suspiciousEntry = suspiciousIPs.get(clientIP);
          if (now - suspiciousEntry.timestamp < 30 * 60 * 1000) { // 30 minutes
            return res.status(429).json({
              error: {
                code: 'IP_TEMPORARILY_BLOCKED',
                message: 'IP temporarily blocked due to suspicious activity',
                type: 'ip_blocked'
              }
            });
          } else {
            suspiciousIPs.delete(clientIP);
          }
        }

        next();

      } catch (error) {
        console.error('DDoS protection error:', error);
        next(); // Continue on error to avoid breaking the application
      }
    };
  }

  /**
   * Handle rate limit exceeded
   */
  async handleRateLimitExceeded(req, res, config, options) {
    const rateLimitInfo = {
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      endpoint: req.originalUrl,
      method: req.method,
      rateLimitType: options.type,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Log security event (commented for local development)
    // await this.auditLogger.logSecurityEvent(
    //   req.user?.id,
    //   'RATE_LIMIT_EXCEEDED',
    //   {
    //     ...rateLimitInfo,
    //     threatLevel: 'MEDIUM',
    //     action: 'BLOCKED',
    //     result: 'ACCESS_DENIED'
    //   }
    // );
    console.log('Rate limit exceeded:', rateLimitInfo);

    // Set security headers
    res.set({
      'X-RateLimit-Limit': config.max,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(config.windowMs / 1000),
      'Retry-After': Math.ceil(config.windowMs / 1000)
    });

    return res.status(429).json(config.message);
  }

  /**
   * Log when rate limit is reached
   */
  async logRateLimitReached(req, options) {
    // await this.auditLogger.logSystemEvent(
    //   req.user?.id,
    //   'RATE_LIMIT_REACHED',
    //   {
    //     ip: req.ip,
    //     userId: req.user?.id,
    //     endpoint: req.originalUrl,
    //     method: req.method,
    //     level: 'warning'
    //   }
    // );
    console.log('Rate limit reached for:', req.originalUrl);
  }

  /**
   * Handle suspicious activity detection
   */
  async handleSuspiciousActivity(req, activityType) {
    const suspiciousActivity = {
      ip: req.ip,
      userId: req.user?.id,
      activityType,
      endpoint: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Log security event (commented for local development)
    // await this.auditLogger.logSecurityEvent(
    //   req.user?.id,
    //   'SUSPICIOUS_ACTIVITY_DETECTED',
    //   {
    //     ...suspiciousActivity,
    //     threatLevel: 'HIGH',
    //     action: 'MONITORING',
    //     result: 'FLAGGED_FOR_REVIEW'
    //   }
    // );
    console.log('Suspicious activity detected:', suspiciousActivity);

    // Alert security team for critical cases
    if (activityType === 'rapid_requests') {
      console.warn('SUSPICIOUS ACTIVITY DETECTED:', suspiciousActivity);
    }
  }

  /**
   * Get server load (CPU usage)
   */
  async getServerLoad() {
    return new Promise((resolve) => {
      const usage = process.cpuUsage();
      const totalUsage = usage.user + usage.system;
      const load = totalUsage / 1000000; // Convert to seconds
      resolve(Math.min(load / 100, 1)); // Normalize to 0-1
    });
  }

  /**
   * Whitelist middleware for trusted IPs
   */
  whitelist(trustedIPs = []) {
    return (req, res, next) => {
      const clientIP = req.ip;
      
      // Check if IP is in whitelist
      if (trustedIPs.includes(clientIP)) {
        req.isWhitelisted = true;
      }
      
      next();
    };
  }

  /**
   * Bypass rate limiting for whitelisted requests
   */
  skipWhitelisted() {
    return (req, res, next) => {
      if (req.isWhitelisted) {
        return next();
      }
      next();
    };
  }

  /**
   * Health check rate limiter (very permissive)
   */
  healthCheckRateLimit() {
    return this.customRateLimit(
      1 * 60 * 1000, // 1 minute
      100, // 100 requests per minute
      'health'
    );
  }

  /**
   * Metrics endpoint rate limiter
   */
  metricsRateLimit() {
    return this.customRateLimit(
      5 * 60 * 1000, // 5 minutes
      50, // 50 requests per 5 minutes
      'metrics'
    );
  }

  /**
   * Emergency access bypass (for critical healthcare situations)
   */
  emergencyBypass() {
    return (req, res, next) => {
      const emergencyHeader = req.headers['x-emergency-access'];
      const emergencyCode = req.headers['x-emergency-code'];
      
      // Validate emergency access (implement proper validation)
      if (emergencyHeader === 'true' && this.validateEmergencyCode(emergencyCode)) {
        req.isEmergencyAccess = true;
        
        // Log emergency access (commented for local development)
        // this.auditLogger.logSecurityEvent(
        //   req.user?.id,
        //   'EMERGENCY_ACCESS_GRANTED',
        //   {
        //     ip: req.ip,
        //     emergencyCode,
        //     endpoint: req.originalUrl,
        //     threatLevel: 'HIGH',
        //     action: 'EMERGENCY_BYPASS',
        //     result: 'ACCESS_GRANTED'
        //   }
        // );
        console.log('Emergency access granted for:', req.originalUrl);
      }
      
      next();
    };
  }

  /**
   * Validate emergency access code
   */
  validateEmergencyCode(code) {
    // Implement proper emergency code validation
    // This is a placeholder - in production, use proper validation
    const validCodes = process.env.EMERGENCY_CODES?.split(',') || [];
    return validCodes.includes(code);
  }

  /**
   * Create healthcare-specific rate limiting
   */
  createHealthcareRateLimit(options = {}) {
    const config = {
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 1000,
      message: options.message || {
        error: {
          code: 'HEALTHCARE_RATE_LIMIT_EXCEEDED',
          message: 'Healthcare API rate limit exceeded',
          type: 'healthcare_rate_limit',
          retryAfter: options.retryAfter || '15 minutes'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use IP + user ID for healthcare-specific rate limiting
        return `healthcare:${req.ip}:${req.user?.id || 'anonymous'}`;
      }
    };

    return this.createRateLimiter(config, {
      prefix: 'healthcare_rl:',
      type: 'healthcare'
    });
  }

  /**
   * Clean up expired entries (no-op for local development)
   */
  async cleanup() {
    console.log('Rate limiting cache cleanup (local development - no-op)');
  }
}

// Create singleton instance
const rateLimitingInstance = new RateLimitingMiddleware();

// Export both the class and instance
module.exports = rateLimitingInstance;
module.exports.RateLimitingMiddleware = RateLimitingMiddleware;