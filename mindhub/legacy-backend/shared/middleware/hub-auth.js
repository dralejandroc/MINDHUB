/**
 * Hub Authentication Middleware
 * 
 * Provides authentication and authorization for medical hub services
 * Supports role-based access control for healthcare professionals
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../config/storage');

// Healthcare professional roles with permissions
const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: ['*'], // Full access
    hubs: ['clinimetrix', 'expedix', 'formx', 'resources']
  },
  psychiatrist: {
    name: 'Psychiatrist',
    permissions: [
      'patients:read', 'patients:write', 'patients:create',
      'consultations:read', 'consultations:write', 'consultations:create',
      'assessments:read', 'assessments:write', 'assessments:create',
      'prescriptions:read', 'prescriptions:write', 'prescriptions:create',
      'resources:read'
    ],
    hubs: ['clinimetrix', 'expedix', 'formx', 'resources']
  },
  psychologist: {
    name: 'Psychologist',
    permissions: [
      'patients:read', 'patients:write', 'patients:create',
      'consultations:read', 'consultations:write', 'consultations:create',
      'assessments:read', 'assessments:write', 'assessments:create',
      'resources:read'
    ],
    hubs: ['clinimetrix', 'expedix', 'formx', 'resources']
  },
  nurse: {
    name: 'Nurse',
    permissions: [
      'patients:read', 'patients:write',
      'consultations:read',
      'assessments:read', 'assessments:write',
      'resources:read'
    ],
    hubs: ['expedix', 'resources']
  },
  professional: {
    name: 'Healthcare Professional',
    permissions: [
      'patients:read', 'patients:write', 'patients:create',
      'consultations:read', 'consultations:write', 'consultations:create',
      'assessments:read', 'assessments:write', 'assessments:create',
      'resources:read'
    ],
    hubs: ['clinimetrix', 'expedix', 'formx', 'resources']
  }
};

class HubAuthMiddleware {
  constructor() {
    this.developmentMode = process.env.NODE_ENV !== 'production';
    this.jwtSecret = process.env.JWT_SECRET || 'mindhub-dev-secret';
  }

  /**
   * Extract token from request headers
   * @param {Request} req - Express request object
   * @returns {string|null} JWT token or null
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Also check for token in cookies for web sessions
    if (req.cookies && req.cookies.authToken) {
      return req.cookies.authToken;
    }
    
    return null;
  }

  /**
   * Verify JWT token and extract user information
   * @param {string} token - JWT token
   * @returns {object} Decoded user information
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Check if user has required permission
   * @param {object} user - User object with role
   * @param {string} permission - Required permission
   * @returns {boolean} True if user has permission
   */
  hasPermission(user, permission) {
    if (!user || !user.role) {
      return false;
    }

    const userRole = ROLES[user.role];
    if (!userRole) {
      return false;
    }

    // Admin has all permissions
    if (userRole.permissions.includes('*')) {
      return true;
    }

    return userRole.permissions.includes(permission);
  }

  /**
   * Check if user has access to specific hub
   * @param {object} user - User object with role
   * @param {string} hubName - Hub name
   * @returns {boolean} True if user has hub access
   */
  hasHubAccess(user, hubName) {
    if (!user || !user.role) {
      return false;
    }

    const userRole = ROLES[user.role];
    if (!userRole) {
      return false;
    }

    return userRole.hubs.includes(hubName);
  }

  /**
   * Authentication middleware
   * Verifies JWT token and adds user to request
   */
  authenticate() {
    return async (req, res, next) => {
      try {
        // Skip authentication in development mode for certain endpoints
        if (this.developmentMode && req.path.includes('/health')) {
          return next();
        }

        const token = this.extractToken(req);

        // In development mode, create a demo user if no token
        if (this.developmentMode && !token) {
          req.user = {
            id: 'demo-user',
            email: 'demo@mindhub.com',
            name: 'Demo Professional',
            role: 'professional',
            isDemoUser: true
          };
          
          logger.debug('Using demo user for development', { 
            user: req.user.email,
            path: req.path 
          });
          
          return next();
        }

        if (!token) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No authentication token provided',
            code: 'NO_TOKEN'
          });
        }

        const decoded = this.verifyToken(token);
        
        // Validate required user fields
        if (!decoded.id || !decoded.email || !decoded.role) {
          throw new Error('Invalid token payload: missing required fields');
        }

        req.user = decoded;
        
        logger.info('User authenticated', {
          userId: decoded.id,
          email: decoded.email,
          role: decoded.role,
          path: req.path,
          method: req.method
        });

        next();
      } catch (error) {
        logger.warn('Authentication failed', {
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        res.status(401).json({
          error: 'Authentication failed',
          message: error.message,
          code: 'INVALID_TOKEN'
        });
      }
    };
  }

  /**
   * Authorization middleware factory
   * @param {string|Array<string>} permissions - Required permission(s)
   * @returns {Function} Express middleware
   */
  authorize(permissions) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Check each required permission
      const hasAllPermissions = requiredPermissions.every(permission => 
        this.hasPermission(req.user, permission)
      );

      if (!hasAllPermissions) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          role: req.user.role,
          requiredPermissions,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permissions: ${requiredPermissions.join(', ')}`,
          userRole: req.user.role,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.debug('Authorization successful', {
        userId: req.user.id,
        role: req.user.role,
        permissions: requiredPermissions,
        path: req.path
      });

      next();
    };
  }

  /**
   * Hub access middleware factory
   * @param {string} hubName - Hub name to check access for
   * @returns {Function} Express middleware
   */
  requireHubAccess(hubName) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!this.hasHubAccess(req.user, hubName)) {
        logger.warn('Hub access denied', {
          userId: req.user.id,
          role: req.user.role,
          hubName,
          path: req.path
        });

        return res.status(403).json({
          error: 'Hub access denied',
          message: `Access to ${hubName} hub not allowed for role: ${req.user.role}`,
          hubName,
          userRole: req.user.role,
          code: 'HUB_ACCESS_DENIED'
        });
      }

      next();
    };
  }

  /**
   * Get available roles
   * @returns {object} Available roles and their permissions
   */
  getRoles() {
    return ROLES;
  }

  /**
   * Middleware to add user role information to response
   */
  addRoleInfo() {
    return (req, res, next) => {
      if (req.user && req.user.role) {
        const roleInfo = ROLES[req.user.role];
        if (roleInfo) {
          req.user.roleInfo = roleInfo;
        }
      }
      next();
    };
  }
}

// Create singleton instance
const hubAuth = new HubAuthMiddleware();

module.exports = hubAuth;