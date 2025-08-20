/**
 * Identity Provider Integration for MindHub Authentication
 * 
 * Supports OAuth2/OpenID Connect integration with external identity providers
 * for healthcare organizations and single sign-on (SSO) capabilities
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { URL } = require('url');

class IdentityProviderIntegration {
  constructor() {
    this.providers = {
      // Azure AD / Microsoft 365 for healthcare organizations
      azure_ad: {
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID,
        authorizationUrl: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
        userinfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid profile email User.Read',
        responseType: 'code'
      },

      // Google Workspace for healthcare organizations
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userinfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid profile email',
        responseType: 'code'
      },

      // Auth0 for healthcare identity management
      auth0: {
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        domain: process.env.AUTH0_DOMAIN,
        authorizationUrl: `https://${process.env.AUTH0_DOMAIN}/authorize`,
        tokenUrl: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        userinfoUrl: `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        scope: 'openid profile email',
        responseType: 'code'
      },

      // Okta for enterprise healthcare SSO
      okta: {
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET,
        domain: process.env.OKTA_DOMAIN,
        authorizationUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/authorize`,
        tokenUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/token`,
        userinfoUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/userinfo`,
        scope: 'openid profile email',
        responseType: 'code'
      },

      // SMART on FHIR for healthcare interoperability
      smart_fhir: {
        clientId: process.env.SMART_FHIR_CLIENT_ID,
        clientSecret: process.env.SMART_FHIR_CLIENT_SECRET,
        fhirServer: process.env.SMART_FHIR_SERVER,
        authorizationUrl: `${process.env.SMART_FHIR_SERVER}/auth/authorize`,
        tokenUrl: `${process.env.SMART_FHIR_SERVER}/auth/token`,
        scope: 'openid profile fhirUser patient/*.read',
        responseType: 'code'
      }
    };

    // State storage for OAuth2 flows (in production, use Redis or database)
    this.stateStore = new Map();
    
    // Healthcare role mapping from external providers
    this.roleMappings = {
      // Azure AD groups to MindHub roles
      azure_ad: {
        'Psychiatrists': 'psychiatrist',
        'Psychologists': 'psychologist',
        'Nurses': 'nurse',
        'Healthcare Admins': 'admin',
        'Patients': 'patient'
      },
      
      // Google Workspace groups to MindHub roles
      google: {
        'psychiatrists@healthcare.org': 'psychiatrist',
        'psychologists@healthcare.org': 'psychologist',
        'nurses@healthcare.org': 'nurse',
        'admins@healthcare.org': 'admin',
        'patients@healthcare.org': 'patient'
      },
      
      // Auth0 roles to MindHub roles
      auth0: {
        'Healthcare:Psychiatrist': 'psychiatrist',
        'Healthcare:Psychologist': 'psychologist',
        'Healthcare:Nurse': 'nurse',
        'Healthcare:Admin': 'admin',
        'Healthcare:Patient': 'patient'
      }
    };
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthorizationUrl(provider, redirectUri, organizationId = null) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported identity provider: ${provider}`);
    }

    // Generate secure state parameter
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Store state with metadata
    this.stateStore.set(state, {
      provider,
      redirectUri,
      organizationId,
      nonce,
      timestamp: Date.now()
    });

    // Clean up old states (older than 10 minutes)
    this.cleanupExpiredStates();

    // Build authorization URL
    const authUrl = new URL(config.authorizationUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', config.responseType);
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);

    // Provider-specific parameters
    if (provider === 'azure_ad') {
      authUrl.searchParams.set('response_mode', 'query');
      authUrl.searchParams.set('prompt', 'select_account');
    }

    if (provider === 'google') {
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
    }

    if (provider === 'smart_fhir') {
      authUrl.searchParams.set('aud', config.fhirServer);
    }

    return {
      authorizationUrl: authUrl.toString(),
      state,
      nonce
    };
  }

  /**
   * Handle OAuth2 callback and exchange code for tokens
   */
  async handleCallback(provider, code, state, redirectUri) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported identity provider: ${provider}`);
    }

    // Verify state parameter
    const stateData = this.stateStore.get(state);
    if (!stateData || stateData.provider !== provider) {
      throw new Error('Invalid or expired state parameter');
    }

    // Remove used state
    this.stateStore.delete(state);

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(provider, code, redirectUri);
      
      // Get user information
      const userInfo = await this.getUserInfo(provider, tokenResponse.access_token);
      
      // Map external user to MindHub user
      const mappedUser = await this.mapExternalUser(provider, userInfo, tokenResponse, stateData);
      
      // Generate MindHub JWT token
      const jwtToken = await this.generateMindHubToken(mappedUser);
      
      return {
        success: true,
        token: jwtToken,
        user: mappedUser,
        externalTokens: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresIn: tokenResponse.expires_in
        }
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(provider, code, redirectUri) {
    const config = this.providers[provider];
    
    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };

    // Provider-specific token exchange
    if (provider === 'azure_ad') {
      tokenData.scope = config.scope;
    }

    try {
      const response = await axios.post(config.tokenUrl, tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get user information from identity provider
   */
  async getUserInfo(provider, accessToken) {
    const config = this.providers[provider];
    
    try {
      const response = await axios.get(config.userinfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`User info retrieval failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Map external user to MindHub user format
   */
  async mapExternalUser(provider, userInfo, tokenResponse, stateData) {
    const { getPrismaClient, executeQuery } = require('../config/prisma');
    
    // Base user mapping
    const mappedUser = {
      id: userInfo.sub || userInfo.id,
      email: userInfo.email,
      name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
      firstName: userInfo.given_name || userInfo.first_name,
      lastName: userInfo.family_name || userInfo.last_name,
      provider: provider,
      providerId: userInfo.sub || userInfo.id,
      organizationId: stateData.organizationId,
      profilePicture: userInfo.picture,
      emailVerified: userInfo.email_verified || false,
      locale: userInfo.locale || 'en-US',
      timezone: userInfo.zoneinfo || 'UTC'
    };

    // Map roles based on provider
    mappedUser.role = await this.mapUserRole(provider, userInfo, stateData.organizationId);
    
    // Get healthcare-specific attributes
    if (provider === 'smart_fhir') {
      mappedUser.fhirUser = userInfo.fhirUser;
      mappedUser.professionalLicense = userInfo.professional_license;
    }

    // Map professional license from Azure AD custom attributes
    if (provider === 'azure_ad' && userInfo.extension_professionalLicense) {
      mappedUser.professionalLicense = userInfo.extension_professionalLicense;
    }

    // Store or update user in database
    try {
      const existingUser = await executeQuery(
        (prisma) => prisma.users.findFirst({
          where: {
            OR: [
              { email: mappedUser.email },
              { 
                providerId: mappedUser.providerId,
                provider: provider
              }
            ]
          }
        }),
        'findExternalUser'
      );

      if (existingUser) {
        // Update existing user
        await executeQuery(
          (prisma) => prisma.users.update({
            where: { id: existingUser.id },
            data: {
              name: mappedUser.name,
              firstName: mappedUser.firstName,
              lastName: mappedUser.lastName,
              profilePicture: mappedUser.profilePicture,
              lastLogin: new Date(),
              updatedAt: new Date()
            }
          }),
          'updateExternalUser'
        );
        
        mappedUser.id = existingUser.id;
      } else {
        // Create new user
        const newUser = await executeQuery(
          (prisma) => prisma.users.create({
            data: {
              id: mappedUser.id,
              email: mappedUser.email,
              name: mappedUser.name,
              firstName: mappedUser.firstName,
              lastName: mappedUser.lastName,
              role: mappedUser.role,
              provider: provider,
              providerId: mappedUser.providerId,
              organizationId: mappedUser.organizationId,
              profilePicture: mappedUser.profilePicture,
              emailVerified: mappedUser.emailVerified,
              professionalLicense: mappedUser.professionalLicense,
              locale: mappedUser.locale,
              timezone: mappedUser.timezone,
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date()
            }
          }),
          'createExternalUser'
        );
        
        mappedUser.id = newUser.id;
      }
    } catch (error) {
      console.error('Error storing external user:', error);
      // Continue with authentication even if user storage fails
    }

    return mappedUser;
  }

  /**
   * Map user role from external provider
   */
  async mapUserRole(provider, userInfo, organizationId) {
    const roleMappings = this.roleMappings[provider] || {};
    
    // Default role mapping logic
    let role = 'patient'; // Default role
    
    if (provider === 'azure_ad' && userInfo.groups) {
      // Map Azure AD groups to roles
      for (const group of userInfo.groups) {
        if (roleMappings[group]) {
          role = roleMappings[group];
          break;
        }
      }
    } else if (provider === 'google' && userInfo.email) {
      // Map Google Workspace groups to roles
      if (roleMappings[userInfo.email]) {
        role = roleMappings[userInfo.email];
      }
    } else if (provider === 'auth0' && userInfo.roles) {
      // Map Auth0 roles to MindHub roles
      for (const authRole of userInfo.roles) {
        if (roleMappings[authRole]) {
          role = roleMappings[authRole];
          break;
        }
      }
    } else if (provider === 'smart_fhir' && userInfo.fhirUser) {
      // Extract role from FHIR user info
      const fhirRole = this.extractFhirRole(userInfo.fhirUser);
      if (fhirRole) {
        role = fhirRole;
      }
    }

    // Organization-specific role mapping
    if (organizationId) {
      role = await this.applyOrganizationRoleMapping(organizationId, userInfo.email, role);
    }

    return role;
  }

  /**
   * Extract healthcare role from FHIR user
   */
  extractFhirRole(fhirUser) {
    if (!fhirUser || !fhirUser.resourceType) {
      return null;
    }

    // Map FHIR resource types to MindHub roles
    const fhirRoleMap = {
      'Practitioner': 'psychologist', // Default healthcare professional
      'PractitionerRole': 'psychologist',
      'Patient': 'patient',
      'Person': 'patient'
    };

    return fhirRoleMap[fhirUser.resourceType] || null;
  }

  /**
   * Apply organization-specific role mapping
   */
  async applyOrganizationRoleMapping(organizationId, userEmail, defaultRole) {
    try {
      const { getPrismaClient, executeQuery } = require('../config/prisma');
      
      // Get organization role mappings
      const orgRoleMapping = await executeQuery(
        (prisma) => prisma.organizationRoleMapping.findFirst({
          where: {
            organizationId: organizationId,
            userEmail: userEmail
          }
        }),
        'getOrganizationRoleMapping'
      );

      if (orgRoleMapping) {
        return orgRoleMapping.role;
      }

      // Check domain-based role mapping
      const domain = userEmail.split('@')[1];
      const domainRoleMapping = await executeQuery(
        (prisma) => prisma.organizationRoleMapping.findFirst({
          where: {
            organizationId: organizationId,
            emailDomain: domain
          }
        }),
        'getDomainRoleMapping'
      );

      if (domainRoleMapping) {
        return domainRoleMapping.role;
      }

      return defaultRole;
    } catch (error) {
      console.error('Error applying organization role mapping:', error);
      return defaultRole;
    }
  }

  /**
   * Generate MindHub JWT token
   */
  async generateMindHubToken(user) {
    const { getPrismaClient, executeQuery } = require('../config/prisma');
    
    // Generate session ID
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Create user session
    try {
      await executeQuery(
        (prisma) => prisma.usersSession.create({
          data: {
            id: sessionId,
            userId: user.id,
            provider: user.provider,
            isActive: true,
            createdAt: new Date(),
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        }),
        'createUserSession'
      );
    } catch (error) {
      console.error('Error creating user session:', error);
      // Continue without session if creation fails
    }

    // JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
      organization_id: user.organizationId,
      professional_license: user.professionalLicense,
      session_id: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iss: process.env.JWT_ISSUER || 'mindhub.com',
      aud: process.env.JWT_AUDIENCE || 'mindhub-api'
    };

    // Get role permissions
    const AuthenticationMiddleware = require('./auth-middleware');
    const authMiddleware = new AuthenticationMiddleware();
    const rolePermissions = authMiddleware.roles[user.role];
    
    if (rolePermissions) {
      payload.permissions = rolePermissions.permissions;
      payload.access_scopes = rolePermissions.accessScopes;
    }

    // Sign JWT token
    const jwtSecret = process.env.JWT_SECRET || 'mindhub-secret-key';
    return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Refresh external provider tokens
   */
  async refreshToken(provider, refreshToken) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported identity provider: ${provider}`);
    }

    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    try {
      const response = await axios.post(config.tokenUrl, tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates() {
    const now = Date.now();
    const expiredStates = [];
    
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
        expiredStates.push(state);
      }
    }
    
    for (const state of expiredStates) {
      this.stateStore.delete(state);
    }
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(provider) {
    const config = this.providers[provider];
    if (!config) {
      return { valid: false, error: `Unsupported provider: ${provider}` };
    }

    const requiredFields = ['clientId', 'clientSecret', 'authorizationUrl', 'tokenUrl'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      return { 
        valid: false, 
        error: `Missing configuration for ${provider}: ${missingFields.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Get available configured providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter(provider => {
      const validation = this.validateProviderConfig(provider);
      return validation.valid;
    });
  }
}

module.exports = IdentityProviderIntegration;