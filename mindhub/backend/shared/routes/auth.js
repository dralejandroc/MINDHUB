const express = require('express');
const { 
  generateLoginURL, 
  generateLogoutURL, 
  auth0Config,
  healthCheck 
} = require('../config/auth0');
const { authenticateAuth0 } = require('../middleware/auth0');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * GET /auth/login
 * Initiates Auth0 login flow
 */
router.get('/login', (req, res) => {
  try {
    const { returnTo, state } = req.query;
    
    // Generate state parameter for CSRF protection if not provided
    const stateParam = state || require('crypto').randomBytes(32).toString('hex');
    
    // Store state in session for verification
    req.session.auth0State = stateParam;
    
    // Generate Auth0 login URL
    const loginURL = generateLoginURL(stateParam, returnTo);
    
    logger.info('Auth0 login initiated', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      returnTo,
      state: stateParam
    });
    
    res.json({
      loginURL,
      state: stateParam
    });
  } catch (error) {
    logger.error('Error generating login URL', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to generate login URL'
    });
  }
});

/**
 * GET /auth/logout
 * Initiates Auth0 logout flow
 */
router.get('/logout', (req, res) => {
  try {
    const { returnTo } = req.query;
    
    // Clear session data
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session', { error: err.message });
      }
    });
    
    // Generate Auth0 logout URL
    const logoutURL = generateLogoutURL(returnTo);
    
    logger.info('Auth0 logout initiated', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      returnTo,
      userId: req.user ? req.user.id : 'anonymous'
    });
    
    res.json({
      logoutURL
    });
  } catch (error) {
    logger.error('Error generating logout URL', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to generate logout URL'
    });
  }
});

/**
 * POST /auth/callback
 * Handles Auth0 callback after authentication
 */
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Verify state parameter for CSRF protection
    if (!state || state !== req.session.auth0State) {
      logger.warn('Invalid state parameter in callback', {
        receivedState: state,
        sessionState: req.session.auth0State,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid state parameter',
        message: 'Potential CSRF attack detected'
      });
    }
    
    // Clear state from session
    delete req.session.auth0State;
    
    if (!code) {
      logger.warn('No authorization code in callback', { ip: req.ip });
      
      return res.status(400).json({
        error: 'Missing authorization code',
        message: 'Authorization code is required'
      });
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        code,
        redirect_uri: auth0Config.callbackURL,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error('Token exchange failed', { 
        error: errorData,
        status: tokenResponse.status 
      });
      
      return res.status(400).json({
        error: 'Token exchange failed',
        message: 'Unable to exchange authorization code for tokens'
      });
    }
    
    const tokens = await tokenResponse.json();
    
    logger.info('Auth0 callback successful', {
      ip: req.ip,
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in
    });
    
    // Return tokens to client
    res.json({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in
    });
    
  } catch (error) {
    logger.error('Error in Auth0 callback', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to process authentication callback'
    });
  }
});

/**
 * GET /auth/user
 * Returns authenticated user information
 */
router.get('/user', authenticateAuth0, (req, res) => {
  try {
    const userInfo = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      roles: req.user.roles,
      permissions: req.user.permissions,
      specialty: req.user.specialty,
      licenseNumber: req.user.licenseNumber,
      clinicId: req.user.clinicId,
      metadata: req.user.metadata
    };
    
    logger.info('User profile requested', {
      userId: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
      specialty: req.user.specialty
    });
    
    res.json(userInfo);
  } catch (error) {
    logger.error('Error fetching user profile', { 
      error: error.message,
      userId: req.user ? req.user.id : 'unknown'
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch user profile'
    });
  }
});

/**
 * GET /auth/verify
 * Verifies if the current token is valid
 */
router.get('/verify', authenticateAuth0, (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const tokenExpiration = req.user.tokenExpiration;
    const isValid = tokenExpiration > now;
    
    res.json({
      valid: isValid,
      expires_at: tokenExpiration,
      expires_in: isValid ? tokenExpiration - now : 0,
      user: {
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      }
    });
  } catch (error) {
    logger.error('Error verifying token', { 
      error: error.message,
      userId: req.user ? req.user.id : 'unknown'
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to verify token'
    });
  }
});

/**
 * POST /auth/refresh
 * Refreshes the access token (if refresh token is available)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }
    
    // Exchange refresh token for new access token
    const tokenResponse = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        refresh_token,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error('Token refresh failed', { 
        error: errorData,
        status: tokenResponse.status 
      });
      
      return res.status(400).json({
        error: 'Token refresh failed',
        message: 'Unable to refresh access token'
      });
    }
    
    const tokens = await tokenResponse.json();
    
    logger.info('Token refresh successful', {
      ip: req.ip,
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      expiresIn: tokens.expires_in
    });
    
    res.json({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in
    });
    
  } catch (error) {
    logger.error('Error refreshing token', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to refresh token'
    });
  }
});

/**
 * GET /auth/health
 * Health check for Auth0 configuration
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      auth0_configured: !!auth0Config.domain,
      domain: auth0Config.domain,
      audience: auth0Config.audience,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Auth0 health check failed', { 
      error: error.message 
    });
    
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;