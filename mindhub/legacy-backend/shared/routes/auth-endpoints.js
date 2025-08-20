/**
 * Authentication Endpoints for MindHub Integrix API
 * 
 * Comprehensive authentication system supporting multiple identity providers
 * and healthcare-specific authentication flows
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const IdentityProviderIntegration = require('../middleware/identity-providers');
const AuthenticationMiddleware = require('../middleware/auth-middleware');
const { getPrismaClient, executeQuery } = require('../config/prisma');
const { logger } = require('../config/storage');

const router = express.Router();
const identityProvider = new IdentityProviderIntegration();
const authMiddleware = new AuthenticationMiddleware();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /auth/providers
 * Get available identity providers
 */
router.get('/providers', async (req, res) => {
  try {
    const availableProviders = identityProvider.getAvailableProviders();
    
    const providersInfo = availableProviders.map(provider => ({
      id: provider,
      name: provider.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: provider.includes('fhir') ? 'healthcare' : 'standard',
      description: getProviderDescription(provider)
    }));

    res.json({
      success: true,
      data: {
        providers: providersInfo,
        count: providersInfo.length
      }
    });
  } catch (error) {
    logger.error('Failed to get identity providers', { error: error.message });
    res.status(500).json({
      error: {
        code: 'PROVIDERS_RETRIEVAL_FAILED',
        message: 'Failed to retrieve identity providers'
      }
    });
  }
});

/**
 * POST /auth/login/:provider
 * Initiate OAuth2 login with identity provider
 */
router.post('/login/:provider', 
  authRateLimit,
  [
    param('provider').isIn(['azure_ad', 'google', 'auth0', 'okta', 'smart_fhir']).withMessage('Invalid provider'),
    body('organizationId').optional().isUUID().withMessage('Invalid organization ID'),
    body('redirectUri').isURL().withMessage('Valid redirect URI is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid request parameters',
            details: errors.array()
          }
        });
      }

      const { provider } = req.params;
      const { organizationId, redirectUri } = req.body;

      // Validate provider configuration
      const providerValidation = identityProvider.validateProviderConfig(provider);
      if (!providerValidation.valid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PROVIDER',
            message: providerValidation.error
          }
        });
      }

      // Generate authorization URL
      const authResult = identityProvider.generateAuthorizationUrl(provider, redirectUri, organizationId);

      // Log authentication initiation
      logger.info('OAuth authentication initiated', {
        provider,
        organizationId,
        state: authResult.state,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: {
          authorizationUrl: authResult.authorizationUrl,
          state: authResult.state,
          provider: provider
        }
      });
    } catch (error) {
      logger.error('Authentication initiation failed', {
        error: error.message,
        provider: req.params.provider,
        ip: req.ip
      });

      res.status(500).json({
        error: {
          code: 'AUTH_INIT_FAILED',
          message: 'Failed to initiate authentication'
        }
      });
    }
  }
);

/**
 * POST /auth/callback/:provider
 * Handle OAuth2 callback from identity provider
 */
router.post('/callback/:provider',
  authRateLimit,
  [
    param('provider').isIn(['azure_ad', 'google', 'auth0', 'okta', 'smart_fhir']).withMessage('Invalid provider'),
    body('code').isString().withMessage('Authorization code is required'),
    body('state').isString().withMessage('State parameter is required'),
    body('redirectUri').isURL().withMessage('Valid redirect URI is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid callback parameters',
            details: errors.array()
          }
        });
      }

      const { provider } = req.params;
      const { code, state, redirectUri } = req.body;

      // Handle OAuth callback
      const authResult = await identityProvider.handleCallback(provider, code, state, redirectUri);

      // Log successful authentication
      logger.info('OAuth authentication successful', {
        provider,
        userId: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          token: authResult.token,
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            name: authResult.user.name,
            role: authResult.user.role,
            organizationId: authResult.user.organizationId,
            provider: provider
          },
          tokenType: 'Bearer',
          expiresIn: 86400 // 24 hours
        }
      });
    } catch (error) {
      logger.error('OAuth callback failed', {
        error: error.message,
        provider: req.params.provider,
        ip: req.ip
      });

      res.status(401).json({
        error: {
          code: 'AUTH_CALLBACK_FAILED',
          message: 'Authentication callback failed',
          details: error.message
        }
      });
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  authRateLimit,
  [
    body('refreshToken').isString().withMessage('Refresh token is required'),
    body('provider').isIn(['azure_ad', 'google', 'auth0', 'okta', 'smart_fhir']).withMessage('Invalid provider')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid refresh parameters',
            details: errors.array()
          }
        });
      }

      const { refreshToken, provider } = req.body;

      // Refresh external token
      const tokenResponse = await identityProvider.refreshToken(provider, refreshToken);

      // Get user info with new token
      const userInfo = await identityProvider.getUserInfo(provider, tokenResponse.access_token);

      // Generate new MindHub token
      const mappedUser = await identityProvider.mapExternalUser(provider, userInfo, tokenResponse, {});
      const newJwtToken = await identityProvider.generateMindHubToken(mappedUser);

      res.json({
        success: true,
        data: {
          token: newJwtToken,
          tokenType: 'Bearer',
          expiresIn: 86400,
          externalToken: {
            accessToken: tokenResponse.access_token,
            expiresIn: tokenResponse.expires_in
          }
        }
      });
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message,
        provider: req.body.provider,
        ip: req.ip
      });

      res.status(401).json({
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh token'
        }
      });
    }
  }
);

/**
 * POST /auth/logout
 * Logout and invalidate session
 */
router.post('/logout',
  authMiddleware.authenticate(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.user.sessionId;

      // Invalidate user session
      if (sessionId) {
        await executeQuery(
          (prisma) => prisma.userSession.update({
            where: { id: sessionId },
            data: { 
              isActive: false,
              loggedOutAt: new Date(),
              updatedAt: new Date()
            }
          }),
          'logoutUser'
        );
      }

      // Log logout event
      logger.info('User logged out', {
        userId,
        sessionId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      logger.error('Logout failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });

      res.status(500).json({
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout'
        }
      });
    }
  }
);

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile',
  authMiddleware.authenticate(),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user profile from database
      const userProfile = await executeQuery(
        (prisma) => prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            organizationId: true,
            provider: true,
            profilePicture: true,
            emailVerified: true,
            professionalLicense: true,
            locale: true,
            timezone: true,
            createdAt: true,
            lastLogin: true,
            isActive: true
          }
        }),
        'getUserProfile'
      );

      if (!userProfile) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found'
          }
        });
      }

      // Get user permissions
      const rolePermissions = authMiddleware.roles[userProfile.role];
      const permissions = rolePermissions?.permissions || [];

      res.json({
        success: true,
        data: {
          user: userProfile,
          permissions,
          session: {
            id: req.user.sessionId,
            provider: req.user.provider,
            issuedAt: new Date(req.user.iat * 1000),
            expiresAt: new Date(req.user.exp * 1000)
          }
        }
      });
    } catch (error) {
      logger.error('Profile retrieval failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });

      res.status(500).json({
        error: {
          code: 'PROFILE_RETRIEVAL_FAILED',
          message: 'Failed to retrieve user profile'
        }
      });
    }
  }
);

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put('/profile',
  authMiddleware.authenticate(),
  [
    body('firstName').optional().isString().isLength({ min: 1, max: 100 }),
    body('lastName').optional().isString().isLength({ min: 1, max: 100 }),
    body('locale').optional().isString().isLength({ min: 2, max: 10 }),
    body('timezone').optional().isString().isLength({ min: 3, max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid profile data',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      // Update user profile
      const updatedUser = await executeQuery(
        (prisma) => prisma.user.update({
          where: { id: userId },
          data: {
            ...updateData,
            name: updateData.firstName && updateData.lastName ? 
              `${updateData.firstName} ${updateData.lastName}` : undefined,
            updatedAt: new Date()
          },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            locale: true,
            timezone: true,
            updatedAt: true
          }
        }),
        'updateUserProfile'
      );

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData),
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      logger.error('Profile update failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });

      res.status(500).json({
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update user profile'
        }
      });
    }
  }
);

/**
 * GET /auth/sessions
 * Get user sessions
 */
router.get('/sessions',
  authMiddleware.authenticate(),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user sessions
      const sessions = await executeQuery(
        (prisma) => prisma.userSession.findMany({
          where: { userId },
          select: {
            id: true,
            provider: true,
            isActive: true,
            createdAt: true,
            lastActivity: true,
            expiresAt: true,
            loggedOutAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        'getUserSessions'
      );

      res.json({
        success: true,
        data: {
          sessions,
          currentSession: req.user.sessionId
        }
      });
    } catch (error) {
      logger.error('Sessions retrieval failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });

      res.status(500).json({
        error: {
          code: 'SESSIONS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve user sessions'
        }
      });
    }
  }
);

/**
 * Helper function to get provider description
 */
function getProviderDescription(provider) {
  const descriptions = {
    azure_ad: 'Microsoft Azure Active Directory for healthcare organizations',
    google: 'Google Workspace for healthcare organizations',
    auth0: 'Auth0 healthcare identity management',
    okta: 'Okta enterprise SSO for healthcare',
    smart_fhir: 'SMART on FHIR healthcare interoperability'
  };

  return descriptions[provider] || 'Healthcare identity provider';
}

module.exports = router;