const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and extracts user information
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Authentication attempt without token', { 
      ip: req.ip, 
      path: req.path 
    });
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.info('Successful authentication', { 
      userId: decoded.sub, 
      email: decoded.email,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('Token verification failed', { 
      error: error.message,
      ip: req.ip,
      path: req.path 
    });
    
    return res.status(403).json({ 
      error: 'Invalid token.' 
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.sub,
        userRoles,
        requiredRoles,
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions.' 
      });
    }

    next();
  };
};

/**
 * Health professional authorization
 * Ensures user is a healthcare professional
 */
const authorizeHealthProfessional = authorizeRole([
  'psychiatrist', 
  'psychologist', 
  'mental_health_professional'
]);

/**
 * Admin authorization
 * Ensures user is an administrator
 */
const authorizeAdmin = authorizeRole(['admin', 'super_admin']);

/**
 * Alternative authentication middleware for compatibility
 * Alias for authenticateToken to match Expedix route expectations
 */
const requireAuth = authenticateToken;

/**
 * Permission-based authorization middleware
 * Checks if user has specific permissions
 */
const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    const userPermissions = req.user.permissions || [];
    const userRoles = req.user.roles || [];
    
    // Check if user has required permissions directly
    const hasDirectPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    // Check if user has permissions through roles
    const hasRolePermission = requiredPermissions.some(permission => {
      if (permission.startsWith('read:patients') || permission.startsWith('write:patients')) {
        return userRoles.includes('psychiatrist') || 
               userRoles.includes('psychologist') || 
               userRoles.includes('mental_health_professional');
      }
      if (permission.startsWith('read:assessments') || permission.startsWith('write:assessments')) {
        return userRoles.includes('psychiatrist') || 
               userRoles.includes('psychologist') || 
               userRoles.includes('mental_health_professional');
      }
      if (permission.startsWith('read:forms') || permission.startsWith('write:forms')) {
        return userRoles.includes('psychiatrist') || 
               userRoles.includes('psychologist') || 
               userRoles.includes('mental_health_professional');
      }
      if (permission.startsWith('read:resources') || permission.startsWith('write:resources')) {
        return userRoles.includes('psychiatrist') || 
               userRoles.includes('psychologist') || 
               userRoles.includes('mental_health_professional');
      }
      if (permission.startsWith('admin:')) {
        return userRoles.includes('admin') || userRoles.includes('super_admin');
      }
      return false;
    });

    if (!hasDirectPermission && !hasRolePermission) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.sub,
        userPermissions,
        userRoles,
        requiredPermissions,
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions for this operation.' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeHealthProfessional,
  authorizeAdmin,
  requireAuth,
  checkPermissions
};