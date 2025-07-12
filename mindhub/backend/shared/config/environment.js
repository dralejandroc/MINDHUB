/**
 * Environment Configuration Manager
 * 
 * Centralized configuration management for all MindHub services
 * Handles environment-specific settings and validation
 */

const fs = require('fs');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Load configuration based on environment
   * @returns {object} Configuration object
   */
  loadConfig() {
    const baseConfig = {
      // Server Configuration
      server: {
        port: process.env.PORT || 8080,
        host: process.env.HOST || '0.0.0.0',
        cors: {
          origin: this.getCorsOrigins(),
          credentials: true
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
          message: 'Too many requests from this IP, please try again later.'
        }
      },

      // Database Configuration
      database: {
        mysql: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_NAME || 'mindhub_mvp',
          connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
          acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
          timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
          ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
          } : false
        }
      },

      // Authentication Configuration
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'mindhub-dev-secret',
        jwtExpiration: process.env.JWT_EXPIRATION || '24h',
        sessionSecret: process.env.SESSION_SECRET || 'mindhub-session-secret',
        sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
        auth0: {
          domain: process.env.AUTH0_DOMAIN,
          clientId: process.env.AUTH0_CLIENT_ID,
          clientSecret: process.env.AUTH0_CLIENT_SECRET,
          audience: process.env.AUTH0_AUDIENCE,
          scope: process.env.AUTH0_SCOPE || 'openid profile email'
        }
      },

      // Security Configuration
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 minutes
        encryption: {
          algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
          keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH) || 32
        }
      },

      // Storage Configuration
      storage: {
        local: {
          uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads'),
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
          allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(',')
        },
        cloud: {
          provider: process.env.CLOUD_STORAGE_PROVIDER || 'gcs', // gcs, aws, azure
          bucket: process.env.CLOUD_STORAGE_BUCKET,
          region: process.env.CLOUD_STORAGE_REGION,
          credentials: process.env.CLOUD_STORAGE_CREDENTIALS
        }
      },

      // Email Configuration
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.EMAIL_FROM || 'noreply@mindhub.com',
        templates: {
          welcomeUser: process.env.EMAIL_TEMPLATE_WELCOME || 'welcome-user',
          resetPassword: process.env.EMAIL_TEMPLATE_RESET || 'reset-password',
          appointmentReminder: process.env.EMAIL_TEMPLATE_REMINDER || 'appointment-reminder'
        }
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: {
          enabled: process.env.LOG_FILE_ENABLED !== 'false',
          maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
          maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5,
          directory: process.env.LOG_DIR || path.join(__dirname, '../../../logs')
        },
        console: {
          enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
          colorize: process.env.LOG_COLORIZE !== 'false'
        }
      },

      // Health Check Configuration
      health: {
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000, // 5 seconds
        maxConsecutiveFailures: parseInt(process.env.HEALTH_MAX_FAILURES) || 3
      },

      // Hub-specific Configuration
      hubs: {
        expedix: {
          enabled: process.env.HUB_EXPEDIX_ENABLED !== 'false',
          prescriptionQrEnabled: process.env.EXPEDIX_QR_ENABLED === 'true',
          maxPatientsPerProfessional: parseInt(process.env.EXPEDIX_MAX_PATIENTS) || 1000
        },
        clinimetrix: {
          enabled: process.env.HUB_CLINIMETRIX_ENABLED === 'true',
          assessmentLinkExpiration: parseInt(process.env.CLINIMETRIX_LINK_EXPIRATION) || 24 * 60 * 60 * 1000, // 24 hours
          maxAssessmentsPerDay: parseInt(process.env.CLINIMETRIX_MAX_ASSESSMENTS) || 50
        },
        formx: {
          enabled: process.env.HUB_FORMX_ENABLED === 'true',
          maxFormsPerUser: parseInt(process.env.FORMX_MAX_FORMS) || 100,
          maxResponsesPerForm: parseInt(process.env.FORMX_MAX_RESPONSES) || 10000
        },
        resources: {
          enabled: process.env.HUB_RESOURCES_ENABLED === 'true',
          maxFileSize: parseInt(process.env.RESOURCES_MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
          allowedCategories: (process.env.RESOURCES_CATEGORIES || 'educational,therapeutic,administrative').split(',')
        }
      }
    };

    // Environment-specific overrides
    if (this.env === 'production') {
      baseConfig.security.sessionTimeout = 15 * 60 * 1000; // 15 minutes in production
      baseConfig.logging.level = 'warn';
      baseConfig.server.cors.origin = this.getProductionOrigins();
    } else if (this.env === 'development') {
      baseConfig.logging.level = 'debug';
      baseConfig.security.bcryptRounds = 4; // Faster for development
    } else if (this.env === 'test') {
      baseConfig.logging.level = 'error';
      baseConfig.database.mysql.database = 'mindhub_test';
      baseConfig.security.bcryptRounds = 1; // Fastest for tests
    }

    return baseConfig;
  }

  /**
   * Get CORS origins based on environment
   * @returns {Array|string} CORS origins
   */
  getCorsOrigins() {
    if (process.env.CORS_ORIGINS) {
      return process.env.CORS_ORIGINS.split(',');
    }

    switch (this.env) {
      case 'production':
        return this.getProductionOrigins();
      case 'development':
        return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
      case 'test':
        return ['http://localhost:3000'];
      default:
        return ['http://localhost:3000'];
    }
  }

  /**
   * Get production origins
   * @returns {Array} Production origins
   */
  getProductionOrigins() {
    return [
      'https://mindhub.com',
      'https://www.mindhub.com',
      'https://app.mindhub.com',
      'https://clinimetrix.mindhub.com',
      'https://expedix.mindhub.com',
      'https://formx.mindhub.com',
      'https://resources.mindhub.com'
    ];
  }

  /**
   * Validate configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfig() {
    const requiredEnvVars = [];

    // Check required variables for production
    if (this.env === 'production') {
      requiredEnvVars.push(
        'JWT_SECRET',
        'SESSION_SECRET',
        'DB_HOST',
        'DB_USER',
        'DB_PASS',
        'DB_NAME'
      );

      // Check if Auth0 is configured
      if (process.env.AUTH0_DOMAIN) {
        requiredEnvVars.push(
          'AUTH0_CLIENT_ID',
          'AUTH0_CLIENT_SECRET',
          'AUTH0_AUDIENCE'
        );
      }
    }

    // Check for missing required variables
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate data types
    this.validateNumericValues();
    this.validateBooleanValues();

    // Create required directories
    this.createRequiredDirectories();
  }

  /**
   * Validate numeric environment variables
   */
  validateNumericValues() {
    const numericVars = [
      'PORT', 'DB_PORT', 'DB_CONNECTION_LIMIT', 'BCRYPT_ROUNDS',
      'RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX', 'SESSION_MAX_AGE'
    ];

    numericVars.forEach(varName => {
      const value = process.env[varName];
      if (value && isNaN(parseInt(value))) {
        throw new Error(`Invalid numeric value for ${varName}: ${value}`);
      }
    });
  }

  /**
   * Validate boolean environment variables
   */
  validateBooleanValues() {
    const booleanVars = [
      'DB_SSL', 'SMTP_SECURE', 'LOG_FILE_ENABLED', 'LOG_CONSOLE_ENABLED',
      'HUB_EXPEDIX_ENABLED', 'HUB_CLINIMETRIX_ENABLED', 'HUB_FORMX_ENABLED', 'HUB_RESOURCES_ENABLED'
    ];

    booleanVars.forEach(varName => {
      const value = process.env[varName];
      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        throw new Error(`Invalid boolean value for ${varName}: ${value}. Must be 'true' or 'false'`);
      }
    });
  }

  /**
   * Create required directories
   */
  createRequiredDirectories() {
    const directories = [
      this.config.storage.local.uploadDir,
      this.config.logging.file.directory
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot-separated path (e.g., 'database.mysql.host')
   * @returns {any} Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Check if a feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} True if enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`hubs.${feature}.enabled`) === true;
  }

  /**
   * Get all configuration
   * @returns {object} Complete configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Get environment name
   * @returns {string} Environment name
   */
  getEnvironment() {
    return this.env;
  }

  /**
   * Check if running in production
   * @returns {boolean} True if production
   */
  isProduction() {
    return this.env === 'production';
  }

  /**
   * Check if running in development
   * @returns {boolean} True if development
   */
  isDevelopment() {
    return this.env === 'development';
  }

  /**
   * Check if running in test
   * @returns {boolean} True if test
   */
  isTest() {
    return this.env === 'test';
  }
}

// Create singleton instance
const environment = new EnvironmentConfig();

module.exports = environment;