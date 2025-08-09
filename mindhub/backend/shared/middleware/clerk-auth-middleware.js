/**
 * Clerk JWT Authentication Middleware
 * 
 * Validates Clerk tokens and extracts user context for API requests
 * Integrates with the existing MindHub user system through Prisma
 */

const { ClerkExpressWithAuth, ClerkExpressRequireAuth } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Optional Clerk authentication middleware
 * Validates token if present, but doesn't require authentication
 * Populates req.user with Clerk user data if token is valid
 */
const clerkOptionalAuth = ClerkExpressWithAuth({
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Custom error handler
  onError: (error) => {
    console.error('Clerk Auth Error:', error);
    return null; // Allow request to continue without auth
  }
});

/**
 * Required Clerk authentication middleware
 * Validates token and requires authentication
 * Returns 401 if token is invalid or missing
 */
const clerkRequiredAuth = ClerkExpressRequireAuth({
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Custom error handler for required auth
  onError: (error, req, res, next) => {
    console.error('Clerk Required Auth Error:', error);
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Valid Clerk token is required to access this resource',
      code: 'CLERK_AUTH_REQUIRED'
    });
  }
});

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
    clerkOptionalAuth(req, res, async (error) => {
      if (error) {
        console.error('Clerk authentication failed:', error);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired Clerk token',
          code: 'CLERK_TOKEN_INVALID'
        });
      }

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
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Find or create local user record based on Clerk User ID
 * @param {string} clerkUserId - Clerk User ID
 * @param {Object} userContext - Additional user context from header
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
  validateApiKey,
  combinedAuth,
  
  // Utility functions
  findOrCreateLocalUser
};