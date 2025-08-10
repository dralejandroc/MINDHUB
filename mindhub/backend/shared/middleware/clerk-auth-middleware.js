/**
 * Clerk JWT Authentication Middleware
 * 
 * Validates Clerk tokens and extracts user context for API requests
 * Integrates with the existing MindHub user system through Prisma
 */

const { createClerkClient, verifyToken } = require('@clerk/backend');
const { getPrismaClient } = require('../config/prisma');

const prisma = getPrismaClient();

/**
 * Manual token verification middleware
 * Validates Clerk JWT token manually without using ClerkExpress
 */
const clerkOptionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      req.auth = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Verify token using Clerk backend
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      req.auth = {
        userId: verifiedToken.sub,
        user: verifiedToken
      };
    } catch (error) {
      console.warn('Clerk token verification failed:', error.message);
      req.auth = null;
    }

    next();
  } catch (error) {
    console.error('Clerk optional auth error:', error);
    req.auth = null;
    next();
  }
};

/**
 * Required Clerk authentication middleware
 * Validates token, requires authentication, and sets up user context
 * Returns 401 if token is invalid or missing
 */
const clerkRequiredAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authorization header with Bearer token is required',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Get full user data from Clerk
      const clerkUser = await clerk.users.getUser(verifiedToken.sub);
      
      // Find or create user in local database
      let localUser = await findOrCreateLocalUser(verifiedToken.sub, clerkUser);

      req.auth = {
        userId: verifiedToken.sub,
        user: verifiedToken
      };

      // Set up comprehensive user context
      req.user = {
        clerkUserId: verifiedToken.sub,
        clerkUser: clerkUser,
        id: localUser.id,
        email: localUser.email || clerkUser.emailAddresses[0]?.emailAddress,
        name: localUser.name || `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
        role: localUser.role || 'professional', // Default to professional for healthcare platform
        isAuthenticated: true,
        authProvider: 'clerk',
        
        // Healthcare-specific context
        permissions: getUserPermissions(localUser.role),
        canAccessPatientData: ['professional', 'admin', 'psychiatrist', 'psychologist', 'nurse'].includes(localUser.role)
      };
      
      console.log(`✅ User authenticated: ${req.user.email} (Role: ${req.user.role})`);
      next();
    } catch (error) {
      console.error('Clerk token verification failed:', error);
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired Clerk token',
        code: 'CLERK_TOKEN_INVALID'
      });
    }
  } catch (error) {
    console.error('Clerk required auth error:', error);
    return res.status(500).json({
      error: 'Authentication middleware failed',
      message: 'Internal authentication error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Enhanced middleware that validates Clerk token and enriches with user context
 * This middleware:
 * 1. Validates the Clerk JWT token
 * 2. Extracts user information from both token and X-User-Context header
 * 3. Maps Clerk User ID to local database user record
 * 4. Populates req.user with complete user context
 */
const clerkAuthWithContext = async (req, res, next) => {
  try {
    // First apply Clerk authentication
    await clerkOptionalAuth(req, res, async () => {

      // Check if user is authenticated through Clerk
      if (req.auth?.userId) {
        try {
          // Extract user context from header if provided
          let userContext = null;
          if (req.headers['x-user-context']) {
            try {
              userContext = JSON.parse(req.headers['x-user-context']);
            } catch (parseError) {
              console.warn('Failed to parse X-User-Context header:', parseError);
            }
          }

          // Find or create user in local database using Clerk User ID
          let localUser = await findOrCreateLocalUser(req.auth.userId, userContext);

          // Populate req.user with complete context
          req.user = {
            // Clerk data
            clerkUserId: req.auth.userId,
            clerkUser: req.auth.user,
            
            // Local database data
            id: localUser.id,
            email: localUser.email,
            name: localUser.name,
            role: localUser.role || 'user',
            
            // Additional context
            context: userContext,
            isAuthenticated: true,
            authProvider: 'clerk'
          };

          // Add user ID to request for database queries
          req.userId = localUser.id;
          req.clerkUserId = req.auth.userId;

          console.log(`Authenticated user: ${localUser.email} (Clerk ID: ${req.auth.userId})`);
          
        } catch (dbError) {
          console.error('Database error during user authentication:', dbError);
          return res.status(500).json({
            error: 'Authentication processing failed',
            message: 'Unable to process user authentication',
            code: 'AUTH_DB_ERROR'
          });
        }
      } else {
        // No authentication provided
        req.user = {
          isAuthenticated: false,
          authProvider: null
        };
        req.userId = null;
        req.clerkUserId = null;
      }

      next();
    });

  } catch (error) {
    console.error('Clerk middleware error:', error);
    res.status(500).json({
      error: 'Authentication middleware failed',
      message: 'Internal authentication error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Middleware that requires authentication
 * Returns 401 if user is not authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.isAuthenticated) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'This resource requires authentication',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware that requires specific role
 * @param {string|Array} roles - Required role(s)
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user || !req.user.isAuthenticated) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This resource requires authentication',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`❌ Access denied: User ${req.user.email} with role "${req.user.role}" tried to access resource requiring roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    console.log(`✅ Access granted: User ${req.user.email} with role "${req.user.role}" accessing resource`);
    next();
  };
};

/**
 * Middleware that requires specific permissions
 * @param {string|Array} permissions - Required permission(s)
 */
const requirePermission = (permissions) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return (req, res, next) => {
    if (!req.user || !req.user.isAuthenticated) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This resource requires authentication',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.warn(`❌ Permission denied: User ${req.user.email} lacks required permissions: ${requiredPermissions.join(', ')}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following permissions: ${requiredPermissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSION'
      });
    }

    console.log(`✅ Permission granted: User ${req.user.email} has required permissions`);
    next();
  };
};

/**
 * Get user permissions based on role
 * @param {string} role - User role
 * @returns {Array} Array of permissions
 */
function getUserPermissions(role) {
  const rolePermissions = {
    admin: [
      'read:all_data', 'write:all_data', 'delete:all_data',
      'manage:users', 'manage:roles', 'manage:system'
    ],
    professional: [
      'read:patient_data', 'write:patient_data', 'read:assessments', 
      'write:assessments', 'read:consultations', 'write:consultations'
    ],
    psychiatrist: [
      'read:all_patient_data', 'write:medical_records', 'write:prescriptions',
      'write:diagnoses', 'read:assessments', 'write:assessments'
    ],
    psychologist: [
      'read:patient_data', 'write:psychological_reports', 'write:clinical_assessments',
      'read:assessments', 'write:assessments'
    ],
    nurse: [
      'read:patient_basic_data', 'write:care_notes', 'write:vital_signs',
      'read:basic_assessments'
    ],
    patient: [
      'read:own_data', 'write:own_forms', 'read:own_assessments'
    ]
  };
  
  return rolePermissions[role] || rolePermissions.professional;
}

/**
 * Find or create local user record based on Clerk User ID
 * @param {string} clerkUserId - Clerk User ID
 * @param {Object} userContext - Additional user context from Clerk user object
 * @returns {Object} Local user record
 */
async function findOrCreateLocalUser(clerkUserId, userContext = null) {
  try {
    // Try to find existing user by Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId }
    });

    if (!user) {
      // User doesn't exist, create new record
      const userData = {
        clerk_user_id: clerkUserId,
        email: userContext?.primaryEmailAddress?.emailAddress || `clerk_${clerkUserId}@temp.com`,
        name: userContext?.fullName || `User ${clerkUserId.slice(-8)}`,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add optional fields if available in context
      if (userContext?.firstName) userData.first_name = userContext.firstName;
      if (userContext?.lastName) userData.last_name = userContext.lastName;
      if (userContext?.imageUrl) userData.avatar_url = userContext.imageUrl;

      user = await prisma.user.create({
        data: userData
      });

      console.log(`Created new user for Clerk ID ${clerkUserId}: ${user.email}`);
    } else {
      // Update existing user with latest context if available
      if (userContext && (userContext.fullName || userContext.primaryEmailAddress)) {
        const updateData = {};
        
        if (userContext.fullName && userContext.fullName !== user.name) {
          updateData.name = userContext.fullName;
        }
        
        if (userContext.primaryEmailAddress?.emailAddress && 
            userContext.primaryEmailAddress.emailAddress !== user.email) {
          updateData.email = userContext.primaryEmailAddress.emailAddress;
        }
        
        if (userContext.firstName) updateData.first_name = userContext.firstName;
        if (userContext.lastName) updateData.last_name = userContext.lastName;
        if (userContext.imageUrl) updateData.avatar_url = userContext.imageUrl;
        
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date();
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });
        }
      }
    }

    return user;
    
  } catch (error) {
    console.error('Error in findOrCreateLocalUser:', error);
    throw error;
  }
}

/**
 * Middleware to validate API key for service-to-service communication
 * Fallback authentication method for internal services
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (!validApiKey) {
    console.warn('INTERNAL_API_KEY not configured for API key validation');
    return next();
  }

  if (apiKey && apiKey === validApiKey) {
    req.user = {
      isAuthenticated: true,
      authProvider: 'api_key',
      role: 'system',
      id: 'system',
      email: 'system@mindhub.cloud',
      name: 'System Service'
    };
    req.userId = 'system';
    console.log('Authenticated via API key');
    return next();
  }

  next();
};

/**
 * Combined authentication middleware that supports multiple auth methods
 * 1. Clerk JWT tokens (primary)
 * 2. API keys (for service-to-service)
 */
const combinedAuth = async (req, res, next) => {
  // First try API key authentication
  if (req.headers['x-api-key']) {
    return validateApiKey(req, res, next);
  }

  // Then try Clerk authentication
  return clerkAuthWithContext(req, res, next);
};

module.exports = {
  // Basic Clerk middlewares
  clerkOptionalAuth,
  clerkRequiredAuth,
  
  // Enhanced middlewares
  clerkAuthWithContext,
  requireAuth,
  requireRole,
  requirePermission,
  validateApiKey,
  combinedAuth,
  
  // Utility functions
  findOrCreateLocalUser,
  getUserPermissions
};