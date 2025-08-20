const { 
  verifyToken, 
  extractUserInfo, 
  hasRole, 
  hasPermission,
  ROLES,
  PERMISSIONS 
} = require('../config/auth0');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Auth0 JWT Authentication Middleware
 * Validates Auth0 JWT tokens and extracts user information
 */
const authenticateAuth0 = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      logger.warn('Authentication attempt without authorization header', { 
        ip: req.ip, 
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      logger.warn('Authentication attempt with malformed authorization header', { 
        ip: req.ip, 
        path: req.path,
        authHeader: authHeader.substring(0, 20) + '...' // Log partial header for debugging
      });
      
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Malformed authorization header',
        code: 'MALFORMED_AUTH_HEADER'
      });
    }

    // Verify JWT token with Auth0
    const decodedToken = await verifyToken(token);
    
    // Extract user information from token
    const userInfo = extractUserInfo(decodedToken);
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < now) {
      logger.warn('Authentication attempt with expired token', { 
        userId: userInfo.id,
        email: userInfo.email,
        expiration: decodedToken.exp,
        now: now
      });
      
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // Add user info to request object
    req.user = userInfo;
    req.auth0Token = decodedToken;
    
    logger.info('Successful Auth0 authentication', { 
      userId: userInfo.id,
      email: userInfo.email,
      roles: userInfo.roles,
      specialty: userInfo.specialty,
      clinicId: userInfo.clinicId,
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Auth0 authentication failed', { 
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Role-based authorization middleware for Auth0
 * Checks if user has required role(s)
 */
const authorizeAuth0Role = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('Authorization check without authentication', { 
        path: req.path,
        ip: req.ip 
      });
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!hasRole(userRoles, rolesArray)) {
      logger.warn('Authorization failed - insufficient role permissions', {
        userId: req.user.id,
        email: req.user.email,
        userRoles,
        requiredRoles: rolesArray,
        path: req.path,
        specialty: req.user.specialty,
        clinicId: req.user.clinicId
      });
      
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
        requiredRoles: rolesArray
      });
    }

    logger.info('Role authorization successful', {
      userId: req.user.id,
      email: req.user.email,
      userRoles,
      requiredRoles: rolesArray,
      path: req.path
    });

    next();
  };
};

/**
 * Permission-based authorization middleware for Auth0
 * Checks if user has required permission(s)
 */
const authorizeAuth0Permission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('Permission check without authentication', { 
        path: req.path,
        ip: req.ip 
      });
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    if (!hasPermission(userPermissions, permissionsArray)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        email: req.user.email,
        userPermissions,
        requiredPermissions: permissionsArray,
        path: req.path,
        specialty: req.user.specialty,
        clinicId: req.user.clinicId
      });
      
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissionsArray
      });
    }

    logger.info('Permission authorization successful', {
      userId: req.user.id,
      email: req.user.email,
      userPermissions,
      requiredPermissions: permissionsArray,
      path: req.path
    });

    next();
  };
};

/**
 * Healthcare professional authorization
 * Ensures user is a licensed healthcare professional
 */
const authorizeHealthcareProfessional = authorizeAuth0Role([
  ROLES.PSYCHIATRIST, 
  ROLES.PSYCHOLOGIST
]);

/**
 * Clinical access authorization
 * Ensures user can access clinical data
 */
const authorizeClinicalAccess = authorizeAuth0Permission([
  PERMISSIONS.READ_PATIENTS,
  PERMISSIONS.READ_ASSESSMENTS
]);

/**
 * Administrative access authorization
 * Ensures user has administrative permissions
 */
const authorizeAdministrativeAccess = authorizeAuth0Role([
  ROLES.CLINIC_ADMIN,
  ROLES.SUPER_ADMIN
]);

/**
 * Same clinic authorization
 * Ensures user can only access data from their own clinic
 */
const authorizeSameClinic = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  // Extract clinic ID from request (could be in params, query, or body)
  const requestedClinicId = req.params.clinicId || req.query.clinicId || req.body.clinicId;
  const userClinicId = req.user.clinicId;

  // Super admins can access any clinic
  if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
    return next();
  }

  // Check if user belongs to the same clinic
  if (requestedClinicId && userClinicId !== requestedClinicId) {
    logger.warn('Cross-clinic access attempt blocked', {
      userId: req.user.id,
      email: req.user.email,
      userClinicId,
      requestedClinicId,
      path: req.path
    });
    
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Cannot access data from different clinic',
      code: 'CROSS_CLINIC_ACCESS_DENIED'
    });
  }

  next();
};

/**
 * Rate limiting for authenticated users
 * Different limits based on user roles
 */
const roleBasedRateLimit = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const userRoles = req.user.roles || [];
  let rateLimit = 100; // Default requests per hour

  // Adjust rate limits based on role
  if (userRoles.includes(ROLES.SUPER_ADMIN)) {
    rateLimit = 1000;
  } else if (userRoles.includes(ROLES.CLINIC_ADMIN)) {
    rateLimit = 500;
  } else if (userRoles.includes(ROLES.PSYCHIATRIST) || userRoles.includes(ROLES.PSYCHOLOGIST)) {
    rateLimit = 200;
  }

  // Store rate limit info for potential middleware use
  req.rateLimit = rateLimit;
  
  next();
};

/**
 * Audit logging middleware
 * Logs all actions performed by authenticated users
 */
const auditLog = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const auditData = {
      userId: req.user.id,
      email: req.user.email,
      action,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      clinicId: req.user.clinicId,
      specialty: req.user.specialty,
      licenseNumber: req.user.licenseNumber,
      sessionId: req.sessionID
    };

    logger.info('User action audit', auditData);
    
    // Store audit data in request for potential database logging
    req.auditData = auditData;
    
    next();
  };
};

module.exports = {
  authenticateAuth0,
  authorizeAuth0Role,
  authorizeAuth0Permission,
  authorizeHealthcareProfessional,
  authorizeClinicalAccess,
  authorizeAdministrativeAccess,
  authorizeSameClinic,
  roleBasedRateLimit,
  auditLog
};