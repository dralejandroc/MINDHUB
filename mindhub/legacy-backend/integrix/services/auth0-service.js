/**
 * Auth0 Integration Service for Integrix
 * 
 * Handles OAuth2/OpenID Connect integration with Auth0 for enterprise SSO
 * and healthcare professional authentication
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

class Auth0Service {
  constructor() {
    this.domain = process.env.AUTH0_DOMAIN;
    this.clientId = process.env.AUTH0_CLIENT_ID;
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET;
    this.audience = process.env.AUTH0_AUDIENCE;
    this.redirectUri = process.env.AUTH0_REDIRECT_URI;
    this.managementApiAudience = `https://${this.domain}/api/v2/`;
    
    this.auditLogger = new AuditLogger();
    this.managementToken = null;
    this.managementTokenExpiry = null;
    
    // Healthcare role mapping from Auth0 to MindHub
    this.roleMappings = {
      'healthcare:psychiatrist': 'psychiatrist',
      'healthcare:psychologist': 'psychologist',
      'healthcare:nurse': 'nurse',
      'healthcare:admin': 'admin',
      'patient': 'patient',
      'system:admin': 'admin'
    };
  }

  /**
   * Generate Auth0 authorization URL
   */
  getAuthorizationUrl(state, scope = 'openid profile email') {
    if (!this.domain || !this.clientId) {
      throw new Error('Auth0 configuration missing');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope,
      state: state,
      audience: this.audience
    });

    return `https://${this.domain}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code, state) {
    try {
      const response = await axios.post(`https://${this.domain}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { access_token, id_token, refresh_token, expires_in } = response.data;

      // Verify and decode ID token
      const userInfo = await this.verifyIdToken(id_token);

      return {
        accessToken: access_token,
        idToken: id_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        userInfo: userInfo
      };

    } catch (error) {
      logger.error('Auth0 token exchange failed', {
        error: error.message,
        code: code ? 'present' : 'missing',
        state: state
      });
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Verify and decode Auth0 ID token
   */
  async verifyIdToken(idToken) {
    try {
      // Get Auth0 public keys
      const jwksResponse = await axios.get(`https://${this.domain}/.well-known/jwks.json`);
      const jwks = jwksResponse.data;

      // Decode token header to get key ID
      const tokenHeader = jwt.decode(idToken, { complete: true });
      const kid = tokenHeader.header.kid;

      // Find matching key
      const signingKey = jwks.keys.find(key => key.kid === kid);
      if (!signingKey) {
        throw new Error('Unable to find matching signing key');
      }

      // Verify token
      const publicKey = this.getPublicKey(signingKey);
      const decoded = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: this.clientId,
        issuer: `https://${this.domain}/`
      });

      return decoded;

    } catch (error) {
      logger.error('ID token verification failed', {
        error: error.message
      });
      throw new Error('Invalid ID token');
    }
  }

  /**
   * Convert JWK to PEM format
   */
  getPublicKey(jwk) {
    // This is a simplified implementation
    // In production, use a proper JWK to PEM conversion library
    const { n, e } = jwk;
    const modulus = Buffer.from(n, 'base64');
    const exponent = Buffer.from(e, 'base64');
    
    // Return the key in PEM format
    // Note: This is a placeholder implementation
    // Use a proper library like 'jwk-to-pem' in production
    return jwk.x5c ? `-----BEGIN CERTIFICATE-----\n${jwk.x5c[0]}\n-----END CERTIFICATE-----` : null;
  }

  /**
   * Get user profile from Auth0
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`https://${this.domain}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to get user profile from Auth0', {
        error: error.message
      });
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Sync Auth0 user with local database
   */
  async syncUserWithDatabase(auth0User, auth0Profile) {
    try {
      return await executeTransaction([
        async (prisma) => {
          // Extract user information
          const email = auth0User.email || auth0Profile.email;
          const name = auth0User.name || auth0Profile.name;
          const auth0Id = auth0User.sub;
          
          // Map Auth0 roles to MindHub roles
          const auth0Roles = auth0User['https://mindhub.com/roles'] || [];
          const mappedRole = this.mapAuth0Role(auth0Roles);
          
          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { email: email }
          });

          if (user) {
            // Update existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: name,
                role: mappedRole,
                auth0Id: auth0Id,
                lastLogin: new Date(),
                isActive: true
              }
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: email,
                name: name,
                role: mappedRole,
                auth0Id: auth0Id,
                isActive: true,
                lastLogin: new Date(),
                // Set a placeholder password for Auth0 users
                password: 'auth0_managed',
                professionalLicense: auth0User['https://mindhub.com/license'],
                organizationId: auth0User['https://mindhub.com/organization']
              }
            });

            // Log new user creation
            await this.auditLogger.logAuthenticationEvent(
              user.id,
              'USER_CREATED_AUTH0',
              {
                email: email,
                role: mappedRole,
                auth0Id: auth0Id
              }
            );
          }

          return user;
        }
      ], 'syncAuth0User');

    } catch (error) {
      logger.error('Failed to sync Auth0 user', {
        error: error.message,
        auth0Id: auth0User?.sub,
        email: auth0User?.email
      });
      throw new Error('Failed to sync user with database');
    }
  }

  /**
   * Map Auth0 roles to MindHub roles
   */
  mapAuth0Role(auth0Roles) {
    if (!Array.isArray(auth0Roles) || auth0Roles.length === 0) {
      return 'patient'; // Default role
    }

    // Find first matching role
    for (const auth0Role of auth0Roles) {
      if (this.roleMappings[auth0Role]) {
        return this.roleMappings[auth0Role];
      }
    }

    return 'patient'; // Default fallback
  }

  /**
   * Get management API token
   */
  async getManagementToken() {
    try {
      // Check if we have a valid cached token
      if (this.managementToken && this.managementTokenExpiry > Date.now()) {
        return this.managementToken;
      }

      // Request new management token
      const response = await axios.post(`https://${this.domain}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.managementApiAudience
      });

      const { access_token, expires_in } = response.data;
      
      // Cache token
      this.managementToken = access_token;
      this.managementTokenExpiry = Date.now() + (expires_in * 1000) - 60000; // 1 minute buffer

      return access_token;

    } catch (error) {
      logger.error('Failed to get Auth0 management token', {
        error: error.message
      });
      throw new Error('Failed to get management API token');
    }
  }

  /**
   * Update user roles in Auth0
   */
  async updateUserRoles(auth0Id, roles) {
    try {
      const managementToken = await this.getManagementToken();

      // Convert MindHub roles to Auth0 role IDs
      const auth0RoleIds = await this.getMindHubRoleIds(roles);

      // Update user roles
      await axios.post(
        `https://${this.domain}/api/v2/users/${auth0Id}/roles`,
        { roles: auth0RoleIds },
        {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Updated user roles in Auth0', {
        auth0Id: auth0Id,
        roles: roles
      });

    } catch (error) {
      logger.error('Failed to update user roles in Auth0', {
        error: error.message,
        auth0Id: auth0Id,
        roles: roles
      });
      throw new Error('Failed to update user roles');
    }
  }

  /**
   * Get Auth0 role IDs for MindHub roles
   */
  async getMindHubRoleIds(roles) {
    try {
      const managementToken = await this.getManagementToken();

      // Get all roles from Auth0
      const response = await axios.get(`https://${this.domain}/api/v2/roles`, {
        headers: {
          'Authorization': `Bearer ${managementToken}`
        }
      });

      const auth0Roles = response.data;
      const roleIds = [];

      // Map MindHub roles to Auth0 role IDs
      for (const role of roles) {
        const auth0Role = auth0Roles.find(r => r.name === `healthcare:${role}` || r.name === role);
        if (auth0Role) {
          roleIds.push(auth0Role.id);
        }
      }

      return roleIds;

    } catch (error) {
      logger.error('Failed to get Auth0 role IDs', {
        error: error.message,
        roles: roles
      });
      return [];
    }
  }

  /**
   * Revoke Auth0 refresh token
   */
  async revokeRefreshToken(refreshToken) {
    try {
      await axios.post(`https://${this.domain}/oauth/revoke`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        token: refreshToken
      });

      logger.info('Auth0 refresh token revoked');

    } catch (error) {
      logger.error('Failed to revoke Auth0 refresh token', {
        error: error.message
      });
      // Don't throw - this is not critical
    }
  }

  /**
   * Validate Auth0 configuration
   */
  validateConfiguration() {
    const required = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_REDIRECT_URI'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing Auth0 configuration: ${missing.join(', ')}`);
    }

    return true;
  }
}

module.exports = Auth0Service;