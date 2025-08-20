/**
 * Authentication API Routes for Integrix
 * 
 * Comprehensive authentication system with JWT tokens, session management,
 * and healthcare compliance for MindHub platform
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuthenticationMiddleware = require('../../shared/middleware/auth-middleware');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const authMiddleware = new AuthenticationMiddleware();
const auditLogger = new AuditLogger();

/**
 * JWT Configuration
 */
const JWT_SECRET = process.env.JWT_SECRET || 'mindhub-secret-key';
const JWT_ISSUER = process.env.JWT_ISSUER || 'mindhub.com';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mindhub-api';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '8h';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '30d';

/**
 * Validation middleware for login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Device info must be an object'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be boolean')
];

/**
 * Validation middleware for token refresh
 */
const validateRefreshToken = [
  body('refreshToken')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Valid refresh token is required')
];

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, deviceInfo, rememberMe } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Find user by email
    const user = await executeQuery(
      (prisma) => prisma.user.findUnique({
        where: { email },
        include: {
          organization: {
            select: { id: true, name: true, type: true }
          }
        }
      }),
      `findUserByEmail(${email})`
    );

    if (!user) {
      await auditLogger.logAuthenticationEvent(
        null,
        'LOGIN_FAILED',
        { email, reason: 'User not found', clientIP, userAgent }
      );
      
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await auditLogger.logAuthenticationEvent(
        user.id,
        'LOGIN_FAILED',
        { email, reason: 'Account inactive', clientIP, userAgent }
      );
      
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await auditLogger.logAuthenticationEvent(
        user.id,
        'LOGIN_FAILED',
        { email, reason: 'Invalid password', clientIP, userAgent }
      );
      
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Create session and tokens
    const sessionData = await executeTransaction([
      async (prisma) => {
        // Generate session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate expiration times
        const accessTokenExpiry = new Date(Date.now() + (8 * 60 * 60 * 1000)); // 8 hours
        const refreshTokenExpiry = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        const sessionExpiry = rememberMe ? refreshTokenExpiry : accessTokenExpiry;

        // Create session record
        const session = await prisma.userSession.create({
          data: {
            id: sessionId,
            userId: user.id,
            isActive: true,
            expiresAt: sessionExpiry,
            lastActivity: new Date(),
            clientIP,
            userAgent,
            deviceInfo: deviceInfo || {},
            rememberMe: rememberMe || false
          }
        });

        // Generate JWT tokens
        const accessToken = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: authMiddleware.roles[user.role]?.permissions || [],
            organization_id: user.organizationId,
            professional_license: user.professionalLicense,
            session_id: sessionId,
            token_type: 'access'
          },
          JWT_SECRET,
          {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: JWT_EXPIRATION
          }
        );

        const refreshToken = jwt.sign(
          {
            sub: user.id,
            session_id: sessionId,
            token_type: 'refresh'
          },
          JWT_SECRET,
          {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: REFRESH_TOKEN_EXPIRATION
          }
        );

        return {
          session,
          accessToken,
          refreshToken,
          accessTokenExpiry,
          refreshTokenExpiry
        };
      }
    ], 'createUserSession');

    // Update last login
    await executeQuery(
      (prisma) => prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLogin: new Date(),
          lastLoginIP: clientIP
        }
      }),
      'updateLastLogin'
    );

    // Log successful login
    await auditLogger.logAuthenticationEvent(
      user.id,
      'LOGIN_SUCCESS',
      { 
        email, 
        sessionId: sessionData.session.id,
        clientIP, 
        userAgent,
        rememberMe 
      }
    );

    // Return authentication response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: authMiddleware.roles[user.role]?.permissions || [],
          organization: user.organization,
          professionalLicense: user.professionalLicense,
          lastLogin: user.lastLogin
        },
        session: {
          id: sessionData.session.id,
          expiresAt: sessionData.session.expiresAt,
          rememberMe: sessionData.session.rememberMe
        },
        tokens: {
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          accessTokenExpiry: sessionData.accessTokenExpiry,
          refreshTokenExpiry: sessionData.refreshTokenExpiry,
          tokenType: 'Bearer'
        }
      }
    });

  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    if (decoded.token_type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Token is not a refresh token'
      });
    }

    // Verify session is still active
    const session = await executeQuery(
      (prisma) => prisma.userSession.findFirst({
        where: {
          id: decoded.session_id,
          userId: decoded.sub,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              organizationId: true,
              professionalLicense: true
            }
          }
        }
      }),
      'verifyRefreshSession'
    );

    if (!session) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'Session is no longer valid'
      });
    }

    if (!session.user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'User account has been deactivated'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
        permissions: authMiddleware.roles[session.user.role]?.permissions || [],
        organization_id: session.user.organizationId,
        professional_license: session.user.professionalLicense,
        session_id: session.id,
        token_type: 'access'
      },
      JWT_SECRET,
      {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: JWT_EXPIRATION
      }
    );

    // Update session activity
    await executeQuery(
      (prisma) => prisma.userSession.update({
        where: { id: session.id },
        data: { 
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }),
      'updateSessionActivity'
    );

    // Log token refresh
    await auditLogger.logAuthenticationEvent(
      session.user.id,
      'TOKEN_REFRESH',
      { 
        sessionId: session.id,
        clientIP: req.ip || req.connection.remoteAddress
      }
    );

    const accessTokenExpiry = new Date(Date.now() + (8 * 60 * 60 * 1000));

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        accessTokenExpiry,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expired',
        message: 'Please log in again'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Token is malformed or invalid'
      });
    }

    logger.error('Token refresh error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authMiddleware.authenticate(), async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;
    const userId = req.user?.id;

    if (sessionId) {
      // Invalidate session
      await executeQuery(
        (prisma) => prisma.userSession.update({
          where: { id: sessionId },
          data: {
            isActive: false,
            loggedOutAt: new Date()
          }
        }),
        'invalidateSession'
      );

      // Log logout
      await auditLogger.logAuthenticationEvent(
        userId,
        'LOGOUT_SUCCESS',
        { 
          sessionId,
          clientIP: req.ip || req.connection.remoteAddress
        }
      );
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error', {
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
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', 
  authMiddleware.authenticate(),
  authMiddleware.validateSession(),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      // Get user profile with organization details
      const userProfile = await executeQuery(
        (prisma) => prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            professionalLicense: true,
            lastLogin: true,
            lastLoginIP: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true
              }
            }
          }
        }),
        'getUserProfile'
      );

      if (!userProfile) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Get current session info
      const sessionInfo = await executeQuery(
        (prisma) => prisma.userSession.findFirst({
          where: {
            id: req.user.sessionId,
            userId: userId,
            isActive: true
          },
          select: {
            id: true,
            expiresAt: true,
            lastActivity: true,
            rememberMe: true,
            clientIP: true,
            createdAt: true
          }
        }),
        'getCurrentSession'
      );

      res.json({
        success: true,
        data: {
          user: {
            ...userProfile,
            permissions: authMiddleware.roles[userProfile.role]?.permissions || [],
            accessScopes: authMiddleware.roles[userProfile.role]?.accessScopes || []
          },
          session: sessionInfo
        }
      });

    } catch (error) {
      logger.error('Get user profile error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Profile retrieval failed',
        message: 'An error occurred while retrieving profile'
      });
    }
  }
);

/**
 * GET /api/auth/sessions
 * Get user's active sessions
 */
router.get('/sessions',
  authMiddleware.authenticate(),
  authMiddleware.validateSession(),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      const sessions = await executeQuery(
        (prisma) => prisma.userSession.findMany({
          where: {
            userId: userId,
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          },
          select: {
            id: true,
            createdAt: true,
            lastActivity: true,
            expiresAt: true,
            clientIP: true,
            userAgent: true,
            rememberMe: true
          },
          orderBy: {
            lastActivity: 'desc'
          }
        }),
        'getUserSessions'
      );

      // Mark current session
      const sessionsWithCurrent = sessions.map(session => ({
        ...session,
        isCurrent: session.id === req.user.sessionId
      }));

      res.json({
        success: true,
        data: sessionsWithCurrent,
        count: sessions.length
      });

    } catch (error) {
      logger.error('Get sessions error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Sessions retrieval failed',
        message: 'An error occurred while retrieving sessions'
      });
    }
  }
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId',
  authMiddleware.authenticate(),
  authMiddleware.validateSession(),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      // Verify session belongs to user
      const session = await executeQuery(
        (prisma) => prisma.userSession.findFirst({
          where: {
            id: sessionId,
            userId: userId
          }
        }),
        'verifySessionOwnership'
      );

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session not found or access denied'
        });
      }

      // Revoke session
      await executeQuery(
        (prisma) => prisma.userSession.update({
          where: { id: sessionId },
          data: {
            isActive: false,
            loggedOutAt: new Date()
          }
        }),
        'revokeSession'
      );

      // Log session revocation
      await auditLogger.logAuthenticationEvent(
        userId,
        'SESSION_REVOKED',
        { 
          revokedSessionId: sessionId,
          currentSessionId: req.user.sessionId,
          clientIP: req.ip || req.connection.remoteAddress
        }
      );

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      logger.error('Session revocation error', {
        error: error.message,
        userId: req.user?.id,
        sessionId: req.params.sessionId
      });

      res.status(500).json({
        error: 'Session revocation failed',
        message: 'An error occurred while revoking session'
      });
    }
  }
);

module.exports = router;