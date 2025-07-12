const { auth } = require('express-oauth-server');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Auth0 configuration
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  audience: process.env.AUTH0_AUDIENCE,
  scope: process.env.AUTH0_SCOPE || 'openid profile email',
  callbackURL: process.env.AUTH0_CALLBACK_URL,
  logoutURL: process.env.AUTH0_LOGOUT_URL,
  sessionCookieSecret: process.env.AUTH0_SESSION_COOKIE_SECRET,
  sessionCookieLifetime: parseInt(process.env.AUTH0_SESSION_COOKIE_LIFETIME) || 604800, // 7 days
};

// Validate Auth0 configuration
const validateAuth0Config = () => {
  const requiredFields = ['domain', 'clientId', 'clientSecret', 'audience'];
  const missingFields = requiredFields.filter(field => !auth0Config[field]);
  
  if (missingFields.length > 0) {
    const error = `Missing required Auth0 configuration: ${missingFields.join(', ')}`;
    logger.error('Auth0 configuration validation failed', { missingFields });
    throw new Error(error);
  }
  
  logger.info('Auth0 configuration validated successfully');
  return true;
};

// JWKS client for token verification
const jwksClientInstance = jwksClient({
  jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
  cache: true, // Default value
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key for JWT verification
const getSigningKey = (header, callback) => {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key', { error: err.message, kid: header.kid });
      return callback(err);
    }
    
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, {
      audience: auth0Config.audience,
      issuer: `https://${auth0Config.domain}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        logger.error('JWT verification failed', { error: err.message });
        reject(err);
      } else {
        logger.info('JWT verification successful', { 
          sub: decoded.sub, 
          aud: decoded.aud,
          exp: decoded.exp 
        });
        resolve(decoded);
      }
    });
  });
};

// Extract user information from token
const extractUserInfo = (decodedToken) => {
  const namespace = 'https://mindhub.com/';
  
  return {
    id: decodedToken.sub,
    email: decodedToken.email,
    name: decodedToken.name,
    picture: decodedToken.picture,
    roles: decodedToken[`${namespace}roles`] || [],
    permissions: decodedToken[`${namespace}permissions`] || [],
    metadata: decodedToken[`${namespace}user_metadata`] || {},
    licenseNumber: decodedToken[`${namespace}license_number`],
    specialty: decodedToken[`${namespace}specialty`],
    clinicId: decodedToken[`${namespace}clinic_id`],
    tokenExpiration: decodedToken.exp
  };
};

// Check if user has required role
const hasRole = (userRoles, requiredRoles) => {
  if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) {
    return false;
  }
  
  return requiredRoles.some(role => userRoles.includes(role));
};

// Check if user has required permission
const hasPermission = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(userPermissions) || !Array.isArray(requiredPermissions)) {
    return false;
  }
  
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Generate Auth0 login URL
const generateLoginURL = (state, returnTo) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: auth0Config.clientId,
    redirect_uri: auth0Config.callbackURL,
    scope: auth0Config.scope,
    audience: auth0Config.audience,
    state: state || '',
    ...(returnTo && { returnTo })
  });
  
  return `https://${auth0Config.domain}/authorize?${params.toString()}`;
};

// Generate Auth0 logout URL
const generateLogoutURL = (returnTo) => {
  const params = new URLSearchParams({
    client_id: auth0Config.clientId,
    returnTo: returnTo || auth0Config.logoutURL
  });
  
  return `https://${auth0Config.domain}/v2/logout?${params.toString()}`;
};

// Auth0 roles and permissions mapping
const ROLES = {
  PSYCHIATRIST: 'psychiatrist',
  PSYCHOLOGIST: 'psychologist',
  CLINIC_ADMIN: 'clinic_admin',
  SUPER_ADMIN: 'super_admin'
};

const PERMISSIONS = {
  // Profile permissions
  READ_PROFILE: 'read:profile',
  
  // Patient permissions (Expedix)
  READ_PATIENTS: 'read:patients',
  WRITE_PATIENTS: 'write:patients',
  
  // Assessment permissions (Clinimetrix)
  READ_ASSESSMENTS: 'read:assessments',
  WRITE_ASSESSMENTS: 'write:assessments',
  
  // Form permissions (Formx)
  READ_FORMS: 'read:forms',
  WRITE_FORMS: 'write:forms',
  
  // Resource permissions (Resources)
  READ_RESOURCES: 'read:resources',
  WRITE_RESOURCES: 'write:resources',
  
  // Administrative permissions
  ADMIN_MANAGE: 'admin:manage'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.PSYCHIATRIST]: [
    PERMISSIONS.READ_PROFILE,
    PERMISSIONS.READ_PATIENTS,
    PERMISSIONS.WRITE_PATIENTS,
    PERMISSIONS.READ_ASSESSMENTS,
    PERMISSIONS.WRITE_ASSESSMENTS,
    PERMISSIONS.READ_FORMS,
    PERMISSIONS.WRITE_FORMS,
    PERMISSIONS.READ_RESOURCES
  ],
  [ROLES.PSYCHOLOGIST]: [
    PERMISSIONS.READ_PROFILE,
    PERMISSIONS.READ_PATIENTS,
    PERMISSIONS.WRITE_PATIENTS,
    PERMISSIONS.READ_ASSESSMENTS,
    PERMISSIONS.WRITE_ASSESSMENTS,
    PERMISSIONS.READ_FORMS,
    PERMISSIONS.WRITE_FORMS,
    PERMISSIONS.READ_RESOURCES
  ],
  [ROLES.CLINIC_ADMIN]: [
    PERMISSIONS.READ_PROFILE,
    PERMISSIONS.READ_PATIENTS,
    PERMISSIONS.READ_ASSESSMENTS,
    PERMISSIONS.READ_FORMS,
    PERMISSIONS.READ_RESOURCES,
    PERMISSIONS.WRITE_RESOURCES,
    PERMISSIONS.ADMIN_MANAGE
  ],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
};

// Get user permissions based on roles
const getUserPermissions = (userRoles) => {
  if (!Array.isArray(userRoles)) {
    return [];
  }
  
  const permissions = new Set();
  userRoles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  });
  
  return Array.from(permissions);
};

// Health check for Auth0 configuration
const healthCheck = async () => {
  try {
    validateAuth0Config();
    
    // Try to fetch JWKS to verify connection
    const response = await fetch(`https://${auth0Config.domain}/.well-known/jwks.json`);
    
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }
    
    const jwks = await response.json();
    
    if (!jwks.keys || jwks.keys.length === 0) {
      throw new Error('No keys found in JWKS');
    }
    
    logger.info('Auth0 health check passed');
    return true;
  } catch (error) {
    logger.error('Auth0 health check failed', { error: error.message });
    return false;
  }
};

module.exports = {
  auth0Config,
  validateAuth0Config,
  verifyToken,
  extractUserInfo,
  hasRole,
  hasPermission,
  generateLoginURL,
  generateLogoutURL,
  getUserPermissions,
  healthCheck,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};