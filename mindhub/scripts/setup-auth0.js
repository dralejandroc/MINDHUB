#!/usr/bin/env node

/**
 * Auth0 Setup Script for MindHub
 * 
 * This script helps configure Auth0 tenant, applications, and settings
 * for the MindHub healthcare platform.
 * 
 * Usage: node scripts/setup-auth0.js [options]
 */

const fs = require('fs');
const path = require('path');
const { ManagementClient } = require('auth0');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/auth0-applications.json'), 'utf8'));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function error(message) {
  log('❌ ' + message, 'red');
}

function success(message) {
  log('✅ ' + message, 'green');
}

function warning(message) {
  log('⚠️  ' + message, 'yellow');
}

function info(message) {
  log('ℹ️  ' + message, 'blue');
}

class Auth0Setup {
  constructor() {
    this.management = null;
    this.setupComplete = false;
  }

  async initialize() {
    try {
      // Check for required environment variables
      const requiredEnvVars = [
        'AUTH0_DOMAIN',
        'AUTH0_M2M_CLIENT_ID',
        'AUTH0_M2M_CLIENT_SECRET'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        error(`Missing required environment variables: ${missingVars.join(', ')}`);
        info('Please set these in your .env file:');
        info('AUTH0_DOMAIN=your-tenant.auth0.com');
        info('AUTH0_M2M_CLIENT_ID=your-machine-to-machine-client-id');
        info('AUTH0_M2M_CLIENT_SECRET=your-machine-to-machine-client-secret');
        return false;
      }

      // Initialize Auth0 Management API client
      this.management = new ManagementClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_M2M_CLIENT_ID,
        clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
        scope: 'read:client_grants create:client_grants delete:client_grants update:client_grants read:users update:users delete:users create:users read:users_app_metadata update:users_app_metadata delete:users_app_metadata create:users_app_metadata read:user_custom_blocks create:user_custom_blocks delete:user_custom_blocks read:branding update:branding delete:branding read:prompts update:prompts read:prompt_custom_text update:prompt_custom_text read:email_provider update:email_provider delete:email_provider create:email_provider read:email_templates create:email_templates update:email_templates read:connections read:clients create:clients update:clients delete:clients create:client_credentials update:client_credentials read:resource_servers create:resource_servers update:resource_servers delete:resource_servers read:device_credentials create:device_credentials update:device_credentials delete:device_credentials read:rules create:rules update:rules delete:rules read:rules_configs update:rules_configs delete:rules_configs read:email_provider update:email_provider delete:email_provider create:email_provider read:tenant_settings update:tenant_settings read:logs read:logs_users read:shields create:shields update:shields delete:shields read:anomaly_blocks delete:anomaly_blocks read:triggers update:triggers read:grants delete:grants read:guardian_factors update:guardian_factors read:guardian_enrollments delete:guardian_enrollments create:guardian_enrollment_tickets read:user_factors update:user_factors read:mfa_policies update:mfa_policies read:roles create:roles delete:roles update:roles read:prompts update:prompts read:branding update:branding delete:branding read:log_streams create:log_streams delete:log_streams update:log_streams create:signing_keys read:signing_keys update:signing_keys read:limits update:limits create:role_members read:role_members delete:role_members read:entitlements read:attack_protection update:attack_protection read:stats read:insights read:tenant_settings update:tenant_settings read:custom_domains create:custom_domains update:custom_domains delete:custom_domains read:email_templates create:email_templates update:email_templates read:connections create:connections update:connections delete:connections read:actions create:actions update:actions delete:actions read:organizations create:organizations update:organizations delete:organizations create:organization_members read:organization_members delete:organization_members create:organization_connections read:organization_connections update:organization_connections delete:organization_connections create:organization_member_roles read:organization_member_roles delete:organization_member_roles create:organization_invitations read:organization_invitations delete:organization_invitations'
      });

      success('Auth0 Management API client initialized');
      return true;
    } catch (error) {
      error(`Failed to initialize Auth0 client: ${error.message}`);
      return false;
    }
  }

  async setupAPI() {
    try {
      info('Setting up API resource...');
      
      // Check if API already exists
      const existingAPIs = await this.management.getResourceServers();
      const existingAPI = existingAPIs.find(api => api.identifier === config.api.identifier);
      
      if (existingAPI) {
        warning(`API "${config.api.name}" already exists`);
        return existingAPI;
      }

      // Create API
      const apiData = {
        name: config.api.name,
        identifier: config.api.identifier,
        signing_alg: config.api.signing_alg,
        allow_offline_access: config.api.allow_offline_access,
        token_lifetime: config.api.token_lifetime,
        token_lifetime_for_web: config.api.token_lifetime_for_web,
        skip_consent_for_verifiable_first_party_clients: config.api.skip_consent_for_verifiable_first_party_clients,
        scopes: config.api.scopes
      };

      const api = await this.management.createResourceServer(apiData);
      success(`API "${config.api.name}" created successfully`);
      return api;
    } catch (error) {
      error(`Failed to setup API: ${error.message}`);
      throw error;
    }
  }

  async setupApplications() {
    try {
      info('Setting up applications...');
      const createdApps = {};

      for (const [key, appConfig] of Object.entries(config.applications)) {
        try {
          // Check if application already exists
          const existingClients = await this.management.getClients();
          const existingClient = existingClients.find(client => client.name === appConfig.name);
          
          if (existingClient) {
            warning(`Application "${appConfig.name}" already exists`);
            createdApps[key] = existingClient;
            continue;
          }

          // Create application
          const clientData = {
            name: appConfig.name,
            app_type: appConfig.type,
            description: appConfig.description,
            logo_uri: appConfig.logo_uri,
            callbacks: appConfig.callbacks,
            allowed_logout_urls: appConfig.logout_urls,
            web_origins: appConfig.web_origins,
            allowed_origins: appConfig.allowed_origins,
            grant_types: appConfig.grant_types || ['authorization_code', 'refresh_token'],
            jwt_configuration: appConfig.jwt_configuration,
            refresh_token: appConfig.refresh_token
          };

          const client = await this.management.createClient(clientData);
          createdApps[key] = client;
          success(`Application "${appConfig.name}" created successfully`);
        } catch (error) {
          error(`Failed to create application "${appConfig.name}": ${error.message}`);
        }
      }

      return createdApps;
    } catch (error) {
      error(`Failed to setup applications: ${error.message}`);
      throw error;
    }
  }

  async setupRoles() {
    try {
      info('Setting up roles...');
      const createdRoles = {};

      for (const roleConfig of config.roles) {
        try {
          // Check if role already exists
          const existingRoles = await this.management.getRoles();
          const existingRole = existingRoles.find(role => role.name === roleConfig.name);
          
          if (existingRole) {
            warning(`Role "${roleConfig.name}" already exists`);
            createdRoles[roleConfig.name] = existingRole;
            continue;
          }

          // Create role
          const roleData = {
            name: roleConfig.name,
            description: roleConfig.description
          };

          const role = await this.management.createRole(roleData);
          createdRoles[roleConfig.name] = role;
          success(`Role "${roleConfig.name}" created successfully`);

          // Add permissions to role
          if (roleConfig.permissions && roleConfig.permissions.length > 0) {
            const permissions = roleConfig.permissions.map(permission => ({
              resource_server_identifier: config.api.identifier,
              permission_name: permission
            }));

            await this.management.addPermissionsInRole(role.id, { permissions });
            success(`Permissions added to role "${roleConfig.name}"`);
          }
        } catch (error) {
          error(`Failed to create role "${roleConfig.name}": ${error.message}`);
        }
      }

      return createdRoles;
    } catch (error) {
      error(`Failed to setup roles: ${error.message}`);
      throw error;
    }
  }

  async setupTestUsers() {
    try {
      info('Setting up test users...');
      const createdUsers = {};

      for (const userConfig of config.test_users) {
        try {
          // Check if user already exists
          const existingUsers = await this.management.getUsersByEmail(userConfig.email);
          
          if (existingUsers.length > 0) {
            warning(`User "${userConfig.email}" already exists`);
            createdUsers[userConfig.email] = existingUsers[0];
            continue;
          }

          // Create user
          const userData = {
            email: userConfig.email,
            password: userConfig.password,
            connection: 'Username-Password-Authentication',
            user_metadata: userConfig.user_metadata || {},
            email_verified: true
          };

          const user = await this.management.createUser(userData);
          createdUsers[userConfig.email] = user;
          success(`User "${userConfig.email}" created successfully`);

          // Assign roles to user
          if (userConfig.roles && userConfig.roles.length > 0) {
            const roles = await this.management.getRoles();
            const roleIds = userConfig.roles.map(roleName => {
              const role = roles.find(r => r.name === roleName);
              return role ? role.id : null;
            }).filter(Boolean);

            if (roleIds.length > 0) {
              await this.management.assignRolestoUser(user.user_id, { roles: roleIds });
              success(`Roles assigned to user "${userConfig.email}"`);
            }
          }
        } catch (error) {
          error(`Failed to create user "${userConfig.email}": ${error.message}`);
        }
      }

      return createdUsers;
    } catch (error) {
      error(`Failed to setup test users: ${error.message}`);
      throw error;
    }
  }

  async setupActions() {
    try {
      info('Setting up actions...');
      
      for (const actionConfig of config.actions) {
        try {
          // Check if action already exists
          const existingActions = await this.management.getActions();
          const existingAction = existingActions.find(action => action.name === actionConfig.name);
          
          if (existingAction) {
            warning(`Action "${actionConfig.name}" already exists`);
            continue;
          }

          // Create action
          const actionData = {
            name: actionConfig.name,
            supported_triggers: actionConfig.supported_triggers,
            code: actionConfig.code,
            dependencies: actionConfig.dependencies,
            runtime: actionConfig.runtime,
            status: actionConfig.status
          };

          const action = await this.management.createAction(actionData);
          success(`Action "${actionConfig.name}" created successfully`);
        } catch (error) {
          error(`Failed to create action "${actionConfig.name}": ${error.message}`);
        }
      }
    } catch (error) {
      error(`Failed to setup actions: ${error.message}`);
      throw error;
    }
  }

  async generateEnvFile(apps, domain = 'localhost') {
    try {
      info('Generating .env file with Auth0 configuration...');
      
      const mainApp = apps.main;
      if (!mainApp) {
        warning('Main application not found, skipping .env generation');
        return;
      }

      const isDev = domain === 'localhost' || !domain || domain.includes('localhost');
      const baseUrl = isDev ? 'http://localhost:3000' : `https://app.${domain}`;
      const apiUrl = isDev ? 'http://localhost:8080' : `https://api.${domain}`;

      const envContent = `# =============================================================================
# MindHub Auth0 Configuration (Generated by setup script)
# Generated on: ${new Date().toISOString()}
# =============================================================================

# Auth0 Next.js SDK Configuration
AUTH0_SECRET='${require('crypto').randomBytes(32).toString('hex')}'
AUTH0_BASE_URL=${baseUrl}
AUTH0_ISSUER_BASE_URL=https://${process.env.AUTH0_DOMAIN}
AUTH0_CLIENT_ID=${mainApp.client_id}
AUTH0_CLIENT_SECRET=${mainApp.client_secret || 'your-client-secret-here'}
AUTH0_AUDIENCE=${config.api.identifier}
AUTH0_SCOPE=openid profile email read:profile write:profile

# Application URLs
NEXT_PUBLIC_APP_URL=${baseUrl}
NEXT_PUBLIC_API_URL=${apiUrl}
NEXT_PUBLIC_DOMAIN=${domain}

# Microservices URLs
NEXT_PUBLIC_CLINIMETRIX_API=${isDev ? 'http://localhost:8081' : `https://clinimetrix.api.${domain}`}
NEXT_PUBLIC_EXPEDIX_API=${isDev ? 'http://localhost:8082' : `https://expedix.api.${domain}`}
NEXT_PUBLIC_FORMX_API=${isDev ? 'http://localhost:8083' : `https://formx.api.${domain}`}
NEXT_PUBLIC_RESOURCES_API=${isDev ? 'http://localhost:8084' : `https://resources.api.${domain}`}

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mindhub_dev
DATABASE_SSL=false

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET=mindhub-storage-${isDev ? 'dev' : 'prod'}
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Environment
NODE_ENV=${isDev ? 'development' : 'production'}
NEXT_PUBLIC_ENVIRONMENT=${isDev ? 'development' : 'production'}
PORT=8080

# Security
ENCRYPTION_KEY=${require('crypto').randomBytes(16).toString('hex')}
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
SESSION_SECRET=${require('crypto').randomBytes(32).toString('hex')}

# Healthcare Compliance
NEXT_PUBLIC_HIPAA_MODE=true
NEXT_PUBLIC_AUDIT_LOGGING=true
NEXT_PUBLIC_ENCRYPTION_ENABLED=true

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=${isDev}
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=false
`.trim();

      const envPath = path.join(__dirname, '../frontend/.env.local');
      fs.writeFileSync(envPath, envContent);
      success('.env.local file generated successfully in frontend directory');
      
      // Also generate backend .env
      const backendEnvContent = `# =============================================================================
# MindHub Backend Configuration (Generated by setup script)
# Generated on: ${new Date().toISOString()}
# =============================================================================

# Auth0 Configuration
AUTH0_DOMAIN=${process.env.AUTH0_DOMAIN}
AUTH0_CLIENT_ID=${mainApp.client_id}
AUTH0_CLIENT_SECRET=${mainApp.client_secret || 'your-client-secret-here'}
AUTH0_AUDIENCE=${config.api.identifier}

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mindhub_dev
DATABASE_SSL=false

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET=mindhub-storage-${isDev ? 'dev' : 'prod'}
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Environment
NODE_ENV=${isDev ? 'development' : 'production'}
PORT=8080

# Security
ENCRYPTION_KEY=${require('crypto').randomBytes(16).toString('hex')}
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
SESSION_SECRET=${require('crypto').randomBytes(32).toString('hex')}

# CORS Configuration
CORS_ORIGIN=${baseUrl}

# Healthcare Compliance
AUDIT_LOG_RETENTION_DAYS=2555
BACKUP_RETENTION_DAYS=2555
ENCRYPTION_ALGORITHM=aes-256-gcm
`.trim();

      const backendEnvPath = path.join(__dirname, '../.env');
      fs.writeFileSync(backendEnvPath, backendEnvContent);
      success('Backend .env file generated successfully');
    } catch (error) {
      error(`Failed to generate .env file: ${error.message}`);
    }
  }

  async promptForDomain() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter your domain [mindhub.cloud] or press Enter for localhost: ', (answer) => {
        rl.close();
        const domain = answer.trim();
        if (!domain) {
          resolve('localhost');
        } else if (domain === 'prod' || domain === 'production') {
          resolve('mindhub.cloud');
        } else {
          resolve(domain);
        }
      });
    });
  }

  async run() {
    try {
      log('🚀 Starting Auth0 setup for MindHub...', 'cyan');
      
      // Get domain from user
      const domain = await this.promptForDomain();
      const isDev = domain === 'localhost' || domain.includes('localhost');
      
      log(`\n📋 Configuration:`, 'blue');
      log(`   Domain: ${domain}`);
      log(`   Environment: ${isDev ? 'Development' : 'Production'}`);
      log(`   Frontend URL: ${isDev ? 'http://localhost:3000' : `https://app.${domain}`}`);
      log(`   API URL: ${isDev ? 'http://localhost:8080' : `https://api.${domain}`}`);
      
      if (!isDev) {
        log('\n🌐 Subdomain structure for production:', 'yellow');
        log(`   • Main App: https://app.${domain}`);
        log(`   • API Gateway: https://api.${domain}`);
        log(`   • Clinimetrix Hub: https://clinimetrix.${domain}`);
        log(`   • Expedix Hub: https://expedix.${domain}`);
        log(`   • Formx Hub: https://formx.${domain}`);
        log(`   • Resources Hub: https://resources.${domain}`);
        log(`   • Microservices APIs:`);
        log(`     - https://clinimetrix.api.${domain}`);
        log(`     - https://expedix.api.${domain}`);
        log(`     - https://formx.api.${domain}`);
        log(`     - https://resources.api.${domain}`);
        log(`   • Auth0 Custom Domain: https://auth.${domain} (optional)`);
      }
      
      // Initialize
      if (!await this.initialize()) {
        return false;
      }

      // Setup API
      await this.setupAPI();

      // Setup applications
      const apps = await this.setupApplications();

      // Setup roles
      await this.setupRoles();

      // Setup test users
      await this.setupTestUsers();

      // Setup actions
      await this.setupActions();

      // Generate .env file with domain
      await this.generateEnvFile(apps, domain);

      success('🎉 Auth0 setup completed successfully!');
      
      log('\n📋 Next steps:', 'yellow');
      log('1. Copy the generated .env.local file to your frontend directory');
      log('2. Update database credentials and other configuration values');
      
      if (!isDev) {
        log('3. Configure DNS records for your subdomains:');
        log('   - app.your-domain.com → Frontend App Engine service');
        log('   - api.your-domain.com → Backend API service');
        log('   - *.api.your-domain.com → Microservices');
        log('4. Set up SSL certificates in Google Cloud');
        log('5. Configure Auth0 custom domain (optional)');
        log('6. Update Auth0 application URLs for production');
      } else {
        log('3. Set up local PostgreSQL database');
        log('4. Install dependencies: npm install');
        log('5. Start development servers');
      }
      
      log('6. Test the authentication flow');
      
      return true;
    } catch (error) {
      error(`Setup failed: ${error.message}`);
      return false;
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  require('dotenv').config();
  
  const setup = new Auth0Setup();
  setup.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = Auth0Setup;