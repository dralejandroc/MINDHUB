/**
 * Authentication and Authorization Middleware for Integrix API
 * 
 * Comprehensive JWT authentication with role-based access control
 * for healthcare professionals and patients
 */

const jwt = require('jsonwebtoken');
const { auth } = require('express-oauth-server');
const rateLimit = require('express-rate-limit');
const { promisify } = require('util');

class AuthenticationMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'mindhub-secret-key';
    this.jwtIssuer = process.env.JWT_ISSUER || 'mindhub.com';
    this.jwtAudience = process.env.JWT_AUDIENCE || 'mindhub-api';
    
    // Healthcare professional roles with permissions
    this.roles = {
      psychiatrist: {
        level: 5,
        permissions: [
          'read:all_patient_data',
          'write:medical_records',
          'write:prescriptions',
          'write:diagnoses',
          'read:clinical_assessments',
          'write:clinical_assessments',
          'read:forms',
          'write:forms',
          'read:resources',
          'write:resources'
        ],
        accessScopes: ['expedix:full', 'clinimetrix:full', 'formx:full', 'resources:full']
      },
      psychologist: {
        level: 4,
        permissions: [
          'read:patient_data',
          'read:medical_records',
          'write:psychological_reports',
          'read:clinical_assessments',
          'write:clinical_assessments',
          'read:forms',
          'write:forms',
          'read:resources'
        ],
        accessScopes: ['expedix:read', 'clinimetrix:full', 'formx:full', 'resources:read']
      },
      nurse: {
        level: 3,
        permissions: [
          'read:patient_basic_data',
          'write:care_notes',
          'read:treatment_plans',
          'write:vital_signs',
          'read:forms',
          'write:form_submissions'
        ],
        accessScopes: ['expedix:limited', 'formx:submit', 'resources:read']
      },
      admin: {
        level: 6,
        permissions: [
          'read:all_data',
          'write:all_data',
          'manage:users',
          'manage:roles',
          'read:audit_logs',
          'manage:system_config'
        ],
        accessScopes: ['expedix:admin', 'clinimetrix:admin', 'formx:admin', 'resources:admin', 'integrix:admin']
      },
      patient: {
        level: 1,
        permissions: [
          'read:own_data',
          'write:own_forms',
          'read:own_assessments',
          'read:assigned_resources'
        ],
        accessScopes: ['expedix:own', 'formx:own', 'resources:assigned']
      },
      system: {
        level: 7,
        permissions: [
          'read:all_data',
          'write:all_data',
          'manage:all_operations',
          'bypass:rate_limits'
        ],
        accessScopes: ['*:*']
      }
    };

    // Rate limiting configuration by role
    this.rateLimits = {
      psychiatrist: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
      psychologist: { windowMs: 15 * 60 * 1000, max: 800 },  // 800 requests per 15 minutes
      nurse: { windowMs: 15 * 60 * 1000, max: 500 },         // 500 requests per 15 minutes
      admin: { windowMs: 15 * 60 * 1000, max: 2000 },        // 2000 requests per 15 minutes
      patient: { windowMs: 15 * 60 * 1000, max: 200 },       // 200 requests per 15 minutes
      system: { windowMs: 15 * 60 * 1000, max: 10000 },      // 10000 requests per 15 minutes
      default: { windowMs: 15 * 60 * 1000, max: 100 }        // 100 requests per 15 minutes
    };
  }

  /**
   * JWT Authentication Middleware
   */
  authenticate() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication token is required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        // Verify and decode JWT token
        const decoded = await this.verifyToken(token);
        
        // Validate token claims
        await this.validateTokenClaims(decoded);
        
        // Add user information to request
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || this.roles[decoded.role]?.permissions || [],
          organizationId: decoded.organization_id,
          professionalLicense: decoded.professional_license,
          sessionId: decoded.session_id,
          iat: decoded.iat,
          exp: decoded.exp
        };

        // Add authentication audit log
        await this.logAuthenticationEvent(req, 'AUTH_SUCCESS');

        next();
      } catch (error) {
        await this.logAuthenticationEvent(req, 'AUTH_FAILURE', error.message);
        
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Authentication token has expired',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid authentication token',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Authentication failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || this.generateRequestId()
          }
        });
      }
    };
  }

  /**
   * Role-Based Authorization Middleware
   */
  authorize(requiredRoles = [], requiredPermissions = []) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'User must be authenticated',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        const userRole = req.user.role;
        const userPermissions = req.user.permissions || [];

        // Check role authorization
        if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
          await this.logAuthorizationEvent(req, 'ROLE_DENIED', { requiredRoles, userRole });
          
          return res.status(403).json({
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: 'User role does not have access to this resource',
              requiredRoles,
              userRole,
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        // Check permission authorization
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*')
          );

          if (!hasRequiredPermissions) {
            await this.logAuthorizationEvent(req, 'PERMISSION_DENIED', { requiredPermissions, userPermissions });
            
            return res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'User does not have required permissions',
                requiredPermissions,
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || this.generateRequestId()
              }
            });
          }
        }

        // Add authorization audit log
        await this.logAuthorizationEvent(req, 'AUTH_SUCCESS', { userRole, requiredRoles, requiredPermissions });

        next();
      } catch (error) {
        await this.logAuthorizationEvent(req, 'AUTH_ERROR', { error: error.message });
        
        return res.status(500).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || this.generateRequestId()
          }
        });
      }
    };
  }

  /**
   * Resource-Based Authorization (Patient Data Access)
   */
  authorizePatientAccess() {
    return async (req, res, next) => {
      try {
        const patientId = req.params.patientId || req.params.patient_id || req.body.patient_id;
        const userRole = req.user.role;
        const userId = req.user.id;

        // Admin and system roles have access to all patient data
        if (['admin', 'system'].includes(userRole)) {
          return next();
        }

        // Patients can only access their own data
        if (userRole === 'patient') {
          if (userId !== patientId) {
            await this.logAuthorizationEvent(req, 'PATIENT_ACCESS_DENIED', { userId, requestedPatientId: patientId });
            
            return res.status(403).json({
              error: {
                code: 'PATIENT_ACCESS_DENIED',
                message: 'Patients can only access their own data',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || this.generateRequestId()
              }
            });
          }
          return next();
        }

        // Healthcare professionals need to be assigned to the patient or same organization
        if (['psychiatrist', 'psychologist', 'nurse'].includes(userRole)) {
          const hasPatientAccess = await this.verifyPatientAccess(userId, patientId, userRole);
          
          if (!hasPatientAccess) {
            await this.logAuthorizationEvent(req, 'PATIENT_ACCESS_DENIED', { 
              userId, 
              requestedPatientId: patientId, 
              userRole 
            });
            
            return res.status(403).json({
              error: {
                code: 'PATIENT_ACCESS_DENIED',
                message: 'Healthcare professional is not assigned to this patient',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || this.generateRequestId()
              }
            });
          }
        }

        next();
      } catch (error) {
        await this.logAuthorizationEvent(req, 'PATIENT_ACCESS_ERROR', { error: error.message });
        
        return res.status(500).json({
          error: {
            code: 'PATIENT_ACCESS_ERROR',
            message: 'Patient access verification failed',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || this.generateRequestId()
          }
        });
      }
    };
  }

  /**
   * Rate Limiting Middleware by Role
   */
  rateLimitByRole() {
    return (req, res, next) => {
      const userRole = req.user?.role || 'default';
      const limits = this.rateLimits[userRole] || this.rateLimits.default;

      // Skip rate limiting for system role
      if (userRole === 'system' && req.user?.permissions?.includes('bypass:rate_limits')) {
        return next();
      }

      const limiter = rateLimit({
        windowMs: limits.windowMs,
        max: limits.max,
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Limit: ${limits.max} requests per ${limits.windowMs / 60000} minutes`,
            role: userRole,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || this.generateRequestId()
          }
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `${req.user?.id || req.ip}:${userRole}`,
        onLimitReached: async (req) => {
          await this.logRateLimitEvent(req, 'RATE_LIMIT_EXCEEDED');
        }
      });

      limiter(req, res, next);
    };
  }

  /**
   * Session Management Middleware
   */
  validateSession() {
    return async (req, res, next) => {
      try {
        const sessionId = req.user?.sessionId;
        const userId = req.user?.id;

        if (!sessionId || !userId) {
          return next();
        }

        // Validate active session
        const isSessionValid = await this.verifyActiveSession(userId, sessionId);
        
        if (!isSessionValid) {
          await this.logSessionEvent(req, 'INVALID_SESSION');
          
          return res.status(401).json({
            error: {
              code: 'SESSION_INVALID',
              message: 'Session is no longer valid',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || this.generateRequestId()
            }
          });
        }

        // Update session activity
        await this.updateSessionActivity(userId, sessionId);

        next();
      } catch (error) {
        await this.logSessionEvent(req, 'SESSION_ERROR', error.message);
        
        return res.status(500).json({
          error: {
            code: 'SESSION_ERROR',
            message: 'Session validation failed',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || this.generateRequestId()
          }
        });
      }
    };
  }

  /**
   * Extract JWT token from request headers
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return authHeader;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
        algorithms: ['HS256', 'RS256']
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Validate token claims
   */
  async validateTokenClaims(decoded) {
    // Check required claims
    const requiredClaims = ['sub', 'role', 'iat', 'exp'];
    for (const claim of requiredClaims) {
      if (!decoded[claim]) {
        throw new Error(`Missing required claim: ${claim}`);
      }
    }

    // Validate role
    if (!this.roles[decoded.role]) {
      throw new Error(`Invalid role: ${decoded.role}`);
    }

    // Check token expiration (redundant but explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      throw new Error('Token has expired');
    }

    // Additional validation for healthcare professionals
    if (['psychiatrist', 'psychologist', 'nurse'].includes(decoded.role)) {
      if (!decoded.professional_license) {
        throw new Error('Professional license required for healthcare role');
      }
    }

    return true;
  }

  /**
   * Verify patient access for healthcare professionals
   */
  async verifyPatientAccess(userId, patientId, userRole) {
    // This would typically check a database for patient-provider assignments
    // For now, returning true for same organization members
    
    try {
      // Mock implementation - in real system, this would query the database
      // to check if the healthcare professional is assigned to the patient
      
      return true; // Placeholder - implement actual patient access verification
    } catch (error) {
      console.error('Error verifying patient access:', error);
      return false;
    }
  }

  /**
   * Verify active session
   */
  async verifyActiveSession(userId, sessionId) {
    // Mock implementation - in real system, this would check session store
    return true;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId, sessionId) {
    // Mock implementation - in real system, this would update session timestamp
    return true;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log authentication events
   */
  async logAuthenticationEvent(req, eventType, details = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.originalUrl,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    // In production, this would write to a secure audit log system
    console.log('AUTH_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Log authorization events
   */
  async logAuthorizationEvent(req, eventType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    // In production, this would write to a secure audit log system
    console.log('AUTHZ_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Log rate limiting events
   */
  async logRateLimitEvent(req, eventType) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    console.log('RATE_LIMIT_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Log session events
   */
  async logSessionEvent(req, eventType, details = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || 'anonymous',
      sessionId: req.user?.sessionId || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    console.log('SESSION_EVENT:', JSON.stringify(logEntry));
  }
}

module.exports = AuthenticationMiddleware;