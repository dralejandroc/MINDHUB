/**
 * Clerk Cookie Authentication Middleware
 * 
 * Validates Clerk session tokens from cookies automatically
 * No manual Bearer token handling required - Clerk manages everything
 * Integrates with the existing MindHub user system through Prisma
 */

const { createClerkClient, verifyToken } = require('@clerk/backend');
const { getPrismaClient } = require('../config/prisma');

const prisma = getPrismaClient();
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Extract Clerk session token from cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Session token or null
 */
function extractSessionFromCookies(req) {
  // Clerk typically stores session token in __session cookie
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  
  // Parse cookies to find Clerk session
  const cookieArray = cookies.split(';');
  for (let cookie of cookieArray) {
    const [name, value] = cookie.trim().split('=');
    if (name === '__session' || name.startsWith('__clerk_')) {
      return value;
    }
  }
  
  return null;
}

/**
 * Cookie-based optional authentication middleware
 * Validates Clerk session from cookies automatically
 */
const clerkOptionalAuth = async (req, res, next) => {
  try {
    // Try to get session token from cookies first (preferred method)
    const sessionToken = extractSessionFromCookies(req);
    
    if (sessionToken) {
      try {
        const verifiedToken = await verifyToken(sessionToken, {
          secretKey: process.env.CLERK_SECRET_KEY,
          issuer: 'https://clerk.mindhub.cloud',
          jwksUrl: 'https://clerk.mindhub.cloud/.well-known/jwks.json'
        });

        // Use custom claims from mindhub-backend template
        const userId = verifiedToken.user_id || verifiedToken.sub;
        
        req.auth = {
          userId: userId,
          user: verifiedToken
        };
        console.log('✅ Authenticated via Clerk cookie');
        return next();
      } catch (error) {
        console.warn('Clerk cookie token verification failed:', error.message);
      }
    }

    // Fallback to Bearer token for API compatibility
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
          issuer: 'https://clerk.mindhub.cloud',
          jwksUrl: 'https://clerk.mindhub.cloud/.well-known/jwks.json'
        });

        // Use custom claims from mindhub-backend template
        const userId = verifiedToken.user_id || verifiedToken.sub;

        req.auth = {
          userId: userId,
          user: verifiedToken
        };
        console.log('✅ Authenticated via Bearer token (fallback)');
        return next();
      } catch (error) {
        console.warn('Clerk Bearer token verification failed:', error.message);
      }
    }

    // No authentication found
    req.auth = null;
    next();
  } catch (error) {
    console.error('Clerk optional auth error:', error);
    req.auth = null;
    next();
  }
};

/**
 * Required Clerk authentication middleware  
 * Validates session from cookies or Bearer token, requires authentication
 * Returns 401 if token is invalid or missing
 */
const clerkRequiredAuth = async (req, res, next) => {
  try {
    let token = null;
    let authMethod = null;

    // Try cookies first (preferred method)
    const sessionToken = extractSessionFromCookies(req);
    if (sessionToken) {
      token = sessionToken;
      authMethod = 'cookie';
    } else {
      // Fallback to Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        authMethod = 'bearer';
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid session found. Please log in.',
        code: 'MISSING_AUTHENTICATION'
      });
    }
    
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        issuer: 'https://clerk.mindhub.cloud',
        jwksUrl: 'https://clerk.mindhub.cloud/.well-known/jwks.json'
      });
      
      // IMPORTANTE: Template 'mindhub-backend' usa claims personalizadas:
      // - 'user_id' en vez de 'sub'
      // - 'email' directo en vez de email en sub-object
      const userId = verifiedToken.user_id || verifiedToken.sub;
      const userEmail = verifiedToken.email || verifiedToken.email_address;
      
      console.log(`✅ User authenticated via ${authMethod}:`, { userId, userEmail });
      console.log('🔍 Token claims:', Object.keys(verifiedToken));

      // Try to get role from custom claims first (if configured in Clerk)
      let clerkRole = verifiedToken.role || verifiedToken.org_role || 'member';
      let clerkUser = null;
      
      // If no custom claims, fall back to API calls
      if (!verifiedToken.role && !verifiedToken.org_role) {
        console.log('📞 No custom claims found, falling back to Clerk API calls...');
        
        try {
          // Get full user data from Clerk using the correct userId
          clerkUser = await clerk.users.getUser(userId);
          
          // Check public_metadata for role first
          if (clerkUser.publicMetadata?.role) {
            clerkRole = clerkUser.publicMetadata.role;
            console.log('✅ Found role in public_metadata:', clerkRole);
          } else {
            // Fall back to organization memberships
            const orgMemberships = await clerk.users.getOrganizationMembershipList({
              userId: userId
            });
            
            if (orgMemberships.length > 0) {
              // Check if user is admin in any organization
              const isAdmin = orgMemberships.some(membership => membership.role === 'org:admin');
              clerkRole = isAdmin ? 'admin' : 'member';
            } else {
              clerkRole = 'member'; // Default to member
            }
          }
        } catch (apiError) {
          console.error('Clerk API call failed:', apiError.message);
          // Continue with default role
          clerkRole = 'member';
        }
      } else {
        console.log('✅ Using role from custom claims:', clerkRole);
      }
      
      // Find or create user in local database
      let localUser = await findOrCreateLocalUser(userId, clerkUser);

      req.auth = {
        userId: userId,
        user: verifiedToken
      };

      // Set up comprehensive user context
      req.user = {
        clerkUserId: userId,
        clerkUser: clerkUser,
        id: localUser.id,
        email: localUser.email || userEmail || (clerkUser && clerkUser.emailAddresses[0]?.emailAddress) || 'unknown@mindhub.com',
        name: localUser.name || verifiedToken.name || (clerkUser && `${clerkUser.firstName} ${clerkUser.lastName}`.trim()) || 'Unknown User',
        role: clerkRole, // Use Clerk role directly
        isAuthenticated: true,
        authProvider: 'clerk',
        
        // Simplified permissions based on Clerk roles
        permissions: getUserPermissions(clerkRole),
        canAccessPatientData: true, // Both members and admins can access patient data
        isAdmin: clerkRole === 'admin' || clerkRole === 'org:admin'
      };
      
      console.log(`✅ User context set: ${req.user.email} (Role: ${req.user.role})`);
      next();
    } catch (error) {
      console.error('Clerk token verification failed:', error);
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired session. Please log in again.',
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
 * 1. Validates the Clerk JWT token from cookies or headers
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
 * Get user permissions based on Clerk role (Member/Admin only)
 * @param {string} clerkRole - Clerk role (org:member or org:admin)
 * @returns {Array} Array of permissions
 */
function getUserPermissions(clerkRole) {
  const rolePermissions = {
    'admin': [
      'read:all_data', 'write:all_data', 'delete:all_data',
      'manage:users', 'manage:system', 'access:admin_panel'
    ],
    'org:admin': [
      'read:all_data', 'write:all_data', 'delete:all_data',
      'manage:users', 'manage:system', 'access:admin_panel'
    ],
    'member': [
      'read:own_data', 'write:own_data', 'read:own_patients', 
      'write:own_patients', 'read:own_assessments', 'write:own_assessments'
    ],
    'org:member': [
      'read:own_data', 'write:own_data', 'read:own_patients', 
      'write:own_patients', 'read:own_assessments', 'write:own_assessments'
    ]
  };
  
  // Default to member permissions if role not found
  return rolePermissions[clerkRole] || rolePermissions['member'];
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
    let user = await prisma.users.findUnique({
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

      user = await prisma.users.create({
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
          user = await prisma.users.update({
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
 * 1. Clerk cookies (primary)
 * 2. Clerk JWT tokens (fallback)
 * 3. API keys (for service-to-service)
 */
const combinedAuth = async (req, res, next) => {
  // First try API key authentication
  if (req.headers['x-api-key']) {
    return validateApiKey(req, res, next);
  }

  // Then try Clerk authentication (cookies + JWT fallback)
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
  getUserPermissions,
  extractSessionFromCookies
};