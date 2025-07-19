/**
 * Auth0 Integration Routes for Integrix
 * 
 * OAuth2/OpenID Connect endpoints for Auth0 SSO integration
 * with healthcare professional authentication
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, validationResult } = require('express-validator');
const { logger } = require('../../shared/config/storage');
const Auth0Service = require('../services/auth0-service');
const AuthenticationMiddleware = require('../../shared/middleware/auth-middleware');
const jwt = require('jsonwebtoken');

const router = express.Router();
const auth0Service = new Auth0Service();
const authMiddleware = new AuthenticationMiddleware();

// In-memory state storage (use Redis in production)
const stateStore = new Map();

/**
 * GET /api/auth/auth0/login
 * Initiate Auth0 login flow
 */
router.get('/login', async (req, res) => {
  try {
    // Validate Auth0 configuration
    auth0Service.validateConfiguration();

    // Generate state parameter for CSRF protection
    const state = uuidv4();
    const redirectTo = req.query.redirect_to || '/dashboard';

    // Store state temporarily (use Redis in production)
    stateStore.set(state, {
      redirectTo: redirectTo,
      timestamp: Date.now()
    });

    // Clean up expired states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [key, value] of stateStore) {
      if (value.timestamp < tenMinutesAgo) {
        stateStore.delete(key);
      }
    }

    // Generate Auth0 authorization URL
    const authUrl = auth0Service.getAuthorizationUrl(state, 'openid profile email');

    logger.info('Auth0 login initiated', {
      state: state,
      redirectTo: redirectTo,
      clientIP: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
      }
    });

  } catch (error) {
    logger.error('Auth0 login initiation failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Authentication initiation failed',
      message: 'Unable to start Auth0 login process'
    });
  }
});

/**
 * GET /api/auth/auth0/callback
 * Handle Auth0 callback after user authentication
 */
router.get('/callback', [
  query('code').notEmpty().withMessage('Authorization code is required'),
  query('state').notEmpty().withMessage('State parameter is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid callback parameters',
        details: errors.array()
      });
    }

    const { code, state, error, error_description } = req.query;

    // Handle Auth0 error responses
    if (error) {
      logger.error('Auth0 callback error', {
        error: error,
        description: error_description,
        state: state
      });

      return res.status(400).json({
        error: 'Authentication failed',
        message: error_description || 'Auth0 authentication error'
      });
    }

    // Verify state parameter
    const stateData = stateStore.get(state);
    if (!stateData) {
      return res.status(400).json({
        error: 'Invalid state parameter',
        message: 'State parameter is invalid or expired'
      });
    }

    // Remove used state
    stateStore.delete(state);

    // Exchange code for tokens
    const auth0Tokens = await auth0Service.exchangeCodeForTokens(code, state);

    // Get additional user profile information
    const auth0Profile = await auth0Service.getUserProfile(auth0Tokens.accessToken);

    // Sync user with local database
    const user = await auth0Service.syncUserWithDatabase(auth0Tokens.userInfo, auth0Profile);

    // Create local session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionExpiry = new Date(Date.now() + (8 * 60 * 60 * 1000)); // 8 hours

    // Create session record
    await require('../../shared/config/prisma').executeQuery(
      (prisma) => prisma.userSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          isActive: true,
          expiresAt: sessionExpiry,
          lastActivity: new Date(),
          clientIP: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          deviceInfo: {},
          rememberMe: false,
          auth0AccessToken: auth0Tokens.accessToken,
          auth0RefreshToken: auth0Tokens.refreshToken
        }
      }),
      'createAuth0Session'
    );

    // Generate local JWT token
    const localToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: authMiddleware.roles[user.role]?.permissions || [],
        organization_id: user.organizationId,
        professional_license: user.professionalLicense,
        session_id: sessionId,
        token_type: 'access',
        auth0_managed: true
      },
      process.env.JWT_SECRET || 'mindhub-secret-key',
      {
        issuer: process.env.JWT_ISSUER || 'mindhub.com',
        audience: process.env.JWT_AUDIENCE || 'mindhub-api',
        expiresIn: '8h'
      }
    );

    logger.info('Auth0 authentication successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId,
      auth0Id: user.auth0Id
    });

    // Return authentication success with redirect
    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: authMiddleware.roles[user.role]?.permissions || [],
          organization: user.organization,
          professionalLicense: user.professionalLicense,
          lastLogin: user.lastLogin,
          auth0Managed: true
        },
        session: {
          id: sessionId,
          expiresAt: sessionExpiry
        },
        tokens: {
          accessToken: localToken,
          tokenType: 'Bearer',
          expiresIn: 28800 // 8 hours in seconds
        },
        redirectTo: stateData.redirectTo
      }
    });

  } catch (error) {
    logger.error('Auth0 callback processing failed', {
      error: error.message,
      stack: error.stack,
      code: req.query.code ? 'present' : 'missing',
      state: req.query.state
    });

    res.status(500).json({
      error: 'Authentication callback failed',
      message: 'Unable to process authentication callback'
    });
  }
});

/**
 * POST /api/auth/auth0/logout
 * Logout from Auth0 and revoke tokens
 */
router.post('/logout', authMiddleware.authenticate(), async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;
    const userId = req.user?.id;

    if (sessionId) {
      // Get session with Auth0 tokens
      const session = await require('../../shared/config/prisma').executeQuery(
        (prisma) => prisma.userSession.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            auth0RefreshToken: true
          }
        }),
        'getAuth0Session'
      );

      // Revoke Auth0 refresh token if present
      if (session?.auth0RefreshToken) {
        try {
          await auth0Service.revokeRefreshToken(session.auth0RefreshToken);
        } catch (error) {
          logger.warn('Failed to revoke Auth0 refresh token', {
            error: error.message,
            sessionId: sessionId
          });
        }
      }

      // Invalidate local session
      await require('../../shared/config/prisma').executeQuery(
        (prisma) => prisma.userSession.update({
          where: { id: sessionId },
          data: {
            isActive: false,
            loggedOutAt: new Date()
          }
        }),
        'invalidateAuth0Session'
      );

      logger.info('Auth0 logout successful', {
        userId: userId,
        sessionId: sessionId
      });
    }

    // Generate Auth0 logout URL
    const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `returnTo=${encodeURIComponent(process.env.AUTH0_LOGOUT_URL || 'http://localhost:3000')}`;

    res.json({
      success: true,
      message: 'Logout successful',
      data: {
        logoutUrl: logoutUrl
      }
    });

  } catch (error) {
    logger.error('Auth0 logout failed', {
      error: error.message,
      userId: req.user?.id,
      sessionId: req.user?.sessionId
    });

    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /api/auth/auth0/refresh
 * Refresh Auth0 tokens
 */
router.post('/refresh', authMiddleware.authenticate(), async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;
    const userId = req.user?.id;

    // Get current session with Auth0 tokens
    const session = await require('../../shared/config/prisma').executeQuery(
      (prisma) => prisma.userSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          auth0RefreshToken: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organizationId: true,
              professionalLicense: true
            }
          }
        }
      }),
      'getAuth0SessionForRefresh'
    );

    if (!session?.auth0RefreshToken) {
      return res.status(401).json({
        error: 'No refresh token available',
        message: 'Session does not have Auth0 refresh token'
      });
    }

    // Refresh Auth0 tokens
    const response = await require('axios').post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      grant_type: 'refresh_token',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      refresh_token: session.auth0RefreshToken
    });

    const { access_token, id_token, refresh_token } = response.data;

    // Update session with new tokens
    await require('../../shared/config/prisma').executeQuery(
      (prisma) => prisma.userSession.update({
        where: { id: sessionId },
        data: {
          auth0AccessToken: access_token,
          auth0RefreshToken: refresh_token || session.auth0RefreshToken,
          lastActivity: new Date()
        }
      }),
      'updateAuth0Tokens'
    );

    // Generate new local JWT token
    const newLocalToken = jwt.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
        permissions: authMiddleware.roles[session.user.role]?.permissions || [],
        organization_id: session.user.organizationId,
        professional_license: session.user.professionalLicense,
        session_id: sessionId,
        token_type: 'access',
        auth0_managed: true
      },
      process.env.JWT_SECRET || 'mindhub-secret-key',
      {
        issuer: process.env.JWT_ISSUER || 'mindhub.com',
        audience: process.env.JWT_AUDIENCE || 'mindhub-api',
        expiresIn: '8h'
      }
    );

    logger.info('Auth0 token refresh successful', {
      userId: userId,
      sessionId: sessionId
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newLocalToken,
        tokenType: 'Bearer',
        expiresIn: 28800 // 8 hours in seconds
      }
    });

  } catch (error) {
    logger.error('Auth0 token refresh failed', {
      error: error.message,
      userId: req.user?.id,
      sessionId: req.user?.sessionId
    });

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Unable to refresh authentication tokens'
    });
  }
});

/**
 * GET /api/auth/auth0/user
 * Get user profile from Auth0
 */
router.get('/user', authMiddleware.authenticate(), async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;

    // Get session with Auth0 access token
    const session = await require('../../shared/config/prisma').executeQuery(
      (prisma) => prisma.userSession.findUnique({
        where: { id: sessionId },
        select: {
          auth0AccessToken: true
        }
      }),
      'getAuth0AccessToken'
    );

    if (!session?.auth0AccessToken) {
      return res.status(401).json({
        error: 'No Auth0 access token available',
        message: 'Session does not have Auth0 access token'
      });
    }

    // Get user profile from Auth0
    const auth0Profile = await auth0Service.getUserProfile(session.auth0AccessToken);

    res.json({
      success: true,
      data: {
        auth0Profile: auth0Profile,
        localUser: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get Auth0 user profile', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Profile retrieval failed',
      message: 'Unable to retrieve Auth0 user profile'
    });
  }
});

module.exports = router;