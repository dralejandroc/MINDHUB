/**
 * Middleware Index for MindHub Healthcare Platform
 * 
 * Central export point for all authentication, authorization, and security middleware
 */

// Import Clerk authentication middleware
const { 
  clerkOptionalAuth, 
  clerkRequiredAuth, 
  combinedAuth, 
  requireRole, 
  requirePermission 
} = require('./clerk-auth-middleware');
const SessionManager = require('./session-manager');
const SecurityMiddleware = require('./security-middleware');
const rateLimitingMiddleware = require('./rate-limiting');
const AdvancedSecurityMiddleware = require('./advanced-security');
const ErrorHandlingMiddleware = require('./error-handling');
const APIVersioningMiddleware = require('./api-versioning');
const DataValidationMiddleware = require('./data-validation');
const DataSanitizers = require('../utils/data-sanitizers');
const FormValidators = require('../utils/form-validators');
const IdentityProviderIntegration = require('./identity-providers');
const RequestLoggingMiddleware = require('./request-logging');
const PerformanceMonitoringMiddleware = require('./performance-monitoring');
const ComprehensiveMiddleware = require('./comprehensive-middleware');

// Initialize middleware instances  
// const authMiddleware = new AuthenticationMiddleware(); // REMOVED - Using Clerk auth only
// Clerk-based auth middleware - REQUIRED authentication for production security
const authMiddleware = {
  authenticate: () => clerkRequiredAuth,
  authorize: (roles, permissions) => clerkRequiredAuth, // ALWAYS require valid Clerk tokens
  authorizePatientAccess: () => clerkRequiredAuth,
  rateLimitByRole: () => (req, res, next) => next() // Keep rate limiting disabled for now
};
const sessionManager = new SessionManager();
const securityMiddleware = new SecurityMiddleware();
// rateLimitingMiddleware is already an instance from the import
const advancedSecurityMiddleware = new AdvancedSecurityMiddleware();
const errorHandlingMiddleware = new ErrorHandlingMiddleware();
const apiVersioningMiddleware = new APIVersioningMiddleware();
const dataValidationMiddleware = DataValidationMiddleware;
const dataSanitizers = DataSanitizers;
const formValidators = FormValidators;
const identityProvider = new IdentityProviderIntegration();

/**
 * Pre-configured middleware combinations for common use cases
 */
const middlewarePresets = {
  /**
   * Public endpoints - minimal security
   */
  public: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.publicRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    advancedSecurityMiddleware.inputValidation()
    // advancedSecurityMiddleware.ipReputation() // Commented for local development
  ],

  /**
   * Authentication endpoints - strict rate limiting
   */
  auth: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.authRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    advancedSecurityMiddleware.inputValidation(),
    rateLimitingMiddleware.ddosProtection(),
    securityMiddleware.sqlInjectionProtection(),
    securityMiddleware.xssProtection()
  ],

  /**
   * Protected endpoints - full authentication and authorization
   */
  protected: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.apiRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    advancedSecurityMiddleware.inputValidation(),
    // advancedSecurityMiddleware.ipReputation(), // Commented for local development
    securityMiddleware.sqlInjectionProtection(),
    securityMiddleware.xssProtection(),
    authMiddleware.authenticate(),
    sessionManager.validateSession.bind(sessionManager),
    // advancedSecurityMiddleware.sessionSecurity() // Commented for local development
  ],

  /**
   * Admin endpoints - enhanced security
   */
  admin: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.apiRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    advancedSecurityMiddleware.inputValidation(),
    // advancedSecurityMiddleware.ipReputation(), // Commented for local development
    securityMiddleware.sqlInjectionProtection(),
    securityMiddleware.xssProtection(),
    authMiddleware.authenticate(),
    sessionManager.validateSession.bind(sessionManager),
    // advancedSecurityMiddleware.sessionSecurity() // Commented for local development,
    authMiddleware.authorize(['admin'], ['manage:system_config'])
  ],

  /**
   * File upload endpoints - file security
   */
  fileUpload: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.uploadRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    securityMiddleware.fileUploadSecurity(),
    authMiddleware.authenticate(),
    sessionManager.validateSession.bind(sessionManager),
    // advancedSecurityMiddleware.sessionSecurity() // Commented for local development
  ],

  /**
   * Patient data endpoints - patient access control
   */
  patientData: [
    advancedSecurityMiddleware.enhancedHelmet(),
    securityMiddleware.corsConfiguration(),
    rateLimitingMiddleware.patientDataRateLimit(),
    advancedSecurityMiddleware.requestIntegrity(),
    advancedSecurityMiddleware.inputValidation(),
    // advancedSecurityMiddleware.ipReputation(), // Commented for local development
    securityMiddleware.sqlInjectionProtection(),
    securityMiddleware.xssProtection(),
    authMiddleware.authenticate(),
    sessionManager.validateSession.bind(sessionManager),
    // advancedSecurityMiddleware.sessionSecurity() // Commented for local development,
    advancedSecurityMiddleware.healthcareAccessControl(),
    authMiddleware.authorizePatientAccess()
  ]
};

/**
 * Role-specific authorization presets
 */
const rolePresets = {
  psychiatrist: {
    roles: ['psychiatrist'],
    permissions: [
      'read:all_patient_data',
      'write:medical_records',
      'write:prescriptions',
      'write:diagnoses'
    ]
  },

  psychologist: {
    roles: ['psychologist'],
    permissions: [
      'read:patient_data',
      'write:psychological_reports',
      'write:clinical_assessments'
    ]
  },

  nurse: {
    roles: ['nurse'],
    permissions: [
      'read:patient_basic_data',
      'write:care_notes',
      'write:vital_signs'
    ]
  },

  healthcareProfessional: {
    roles: ['psychiatrist', 'psychologist', 'nurse'],
    permissions: [
      'read:patient_data',
      'write:clinical_notes'
    ]
  },

  admin: {
    roles: ['admin'],
    permissions: [
      'read:all_data',
      'write:all_data',
      'manage:users',
      'manage:roles'
    ]
  },

  patient: {
    roles: ['patient'],
    permissions: [
      'read:own_data',
      'write:own_forms'
    ]
  }
};

/**
 * Hub-specific middleware configurations
 */
const hubConfigurations = {
  expedix: {
    baseMiddleware: middlewarePresets.public, // Temporarily changed from protected to public for development
    additionalMiddleware: [
      // authMiddleware.authorize( // Temporarily disabled for development
      //   ['psychiatrist', 'psychologist', 'nurse', 'admin'],
      //   ['read:patient_data']
      // )
    ]
  },

  clinimetrix: {
    baseMiddleware: middlewarePresets.protected,
    additionalMiddleware: [
      authMiddleware.authorize(
        ['psychiatrist', 'psychologist', 'admin'],
        ['read:clinical_assessments']
      )
    ]
  },

  formx: {
    baseMiddleware: middlewarePresets.protected,
    additionalMiddleware: [
      authMiddleware.authorize(
        ['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'],
        ['read:forms']
      )
    ]
  },

  resources: {
    baseMiddleware: middlewarePresets.protected,
    additionalMiddleware: [
      authMiddleware.authorize(
        ['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'],
        ['read:resources']
      )
    ]
  },

  integrix: {
    baseMiddleware: middlewarePresets.protected,
    additionalMiddleware: [
      authMiddleware.authorize(
        ['psychiatrist', 'psychologist', 'admin', 'system'],
        ['read:cross_hub_data']
      )
    ]
  },

  finance: {
    baseMiddleware: middlewarePresets.public, // Using public for development, should be protected in production
    additionalMiddleware: [
      // authMiddleware.authorize( // Temporarily disabled for development
      //   ['psychiatrist', 'psychologist', 'admin', 'nurse', 'financial_manager'],
      //   ['read:financial_data', 'write:financial_data']
      // )
    ]
  }
};

/**
 * Utility functions for creating custom middleware stacks
 */
const utils = {
  /**
   * Create middleware stack for specific role requirements - SECURE Clerk-based
   */
  forRoles: (roles, permissions = []) => {
    return [
      clerkRequiredAuth,
      requireRole(roles),
      ...(permissions.length > 0 ? [requirePermission(permissions)] : [])
    ];
  },

  /**
   * Create middleware stack for specific hub
   */
  forHub: (hubName) => {
    const config = hubConfigurations[hubName];
    if (!config) {
      throw new Error(`Unknown hub: ${hubName}`);
    }
    return [...config.baseMiddleware, ...config.additionalMiddleware];
  },

  /**
   * Create middleware stack with patient access control
   */
  withPatientAccess: (roles = [], permissions = []) => {
    return [
      ...middlewarePresets.protected,
      authMiddleware.authorize(roles, permissions),
      authMiddleware.authorizePatientAccess()
    ];
  },

  /**
   * Create custom middleware stack
   */
  custom: (middlewareArray) => {
    return middlewareArray;
  },

  /**
   * Optional Clerk authentication - validates token if present, continues if not
   */
  withOptionalAuth: () => {
    return [clerkOptionalAuth];
  },

  /**
   * Required Clerk authentication - validates token and requires authentication
   */
  withRequiredAuth: () => {
    return [clerkRequiredAuth];
  }
};

/**
 * Healthcare-specific middleware configurations
 */
const healthcareMiddleware = {
  /**
   * HIPAA-like compliance middleware
   */
  compliance: [
    securityMiddleware.securityHeaders(),
    securityMiddleware.corsConfiguration(),
    securityMiddleware.requestValidation(),
    securityMiddleware.inputSanitization(),
    securityMiddleware.sqlInjectionProtection(),
    securityMiddleware.xssProtection(),
    authMiddleware.authenticate(),
    sessionManager.validateSession.bind(sessionManager),
    // Add compliance-specific logging and audit trails
    (req, res, next) => {
      // Log all healthcare data access
      if (req.path.includes('/patients/') || req.path.includes('/medical-records/')) {
        console.log('HEALTHCARE_DATA_ACCESS:', {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          userRole: req.user?.role,
          action: req.method,
          resource: req.path,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
      next();
    }
  ],

  /**
   * Emergency access middleware (break-glass)
   */
  emergency: [
    securityMiddleware.securityHeaders(),
    securityMiddleware.corsConfiguration(),
    securityMiddleware.requestValidation(),
    authMiddleware.authenticate(),
    // Emergency access logging
    (req, res, next) => {
      console.log('EMERGENCY_ACCESS:', {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        userRole: req.user?.role,
        action: req.method,
        resource: req.path,
        ip: req.ip,
        justification: req.headers['x-emergency-justification']
      });
      next();
    }
  ]
};

module.exports = {
  // Individual middleware instances
  auth: authMiddleware,
  session: sessionManager,
  security: securityMiddleware,
  rateLimiting: rateLimitingMiddleware,
  advancedSecurity: advancedSecurityMiddleware,
  errorHandling: errorHandlingMiddleware,
  apiVersioning: apiVersioningMiddleware,
  dataValidation: dataValidationMiddleware,
  dataSanitizers: dataSanitizers,
  formValidators: formValidators,
  identityProvider: identityProvider,
  requestLogging: RequestLoggingMiddleware,
  performanceMonitoring: PerformanceMonitoringMiddleware,
  comprehensive: ComprehensiveMiddleware,

  // Pre-configured middleware stacks
  presets: middlewarePresets,
  roles: rolePresets,
  hubs: hubConfigurations,
  healthcare: healthcareMiddleware,

  // Utility functions
  utils,

  // Direct access to individual middleware functions
  authenticate: authMiddleware.authenticate,
  authorize: authMiddleware.authorize,
  authorizePatientAccess: authMiddleware.authorizePatientAccess,
  rateLimitByRole: authMiddleware.rateLimitByRole,
  
  validateSession: sessionManager.validateSession.bind(sessionManager),
  createSession: sessionManager.createSession.bind(sessionManager),
  destroySession: sessionManager.destroySession.bind(sessionManager),
  
  securityHeaders: securityMiddleware.securityHeaders.bind(securityMiddleware),
  cors: securityMiddleware.corsConfiguration.bind(securityMiddleware),
  rateLimiting: securityMiddleware.rateLimiting.bind(securityMiddleware),
  requestValidation: securityMiddleware.requestValidation.bind(securityMiddleware),
  inputSanitization: securityMiddleware.inputSanitization.bind(securityMiddleware),
  sqlInjectionProtection: securityMiddleware.sqlInjectionProtection.bind(securityMiddleware),
  xssProtection: securityMiddleware.xssProtection.bind(securityMiddleware),
  fileUploadSecurity: securityMiddleware.fileUploadSecurity.bind(securityMiddleware),

  // Advanced security middleware functions
  enhancedHelmet: advancedSecurityMiddleware.enhancedHelmet.bind(advancedSecurityMiddleware),
  inputValidation: advancedSecurityMiddleware.inputValidation.bind(advancedSecurityMiddleware),
  csrfProtection: advancedSecurityMiddleware.csrfProtection.bind(advancedSecurityMiddleware),
  generateCSRFToken: advancedSecurityMiddleware.generateCSRFToken.bind(advancedSecurityMiddleware),
  // ipReputation: advancedSecurityMiddleware.ipReputation.bind(advancedSecurityMiddleware), // Commented for local development
  // sessionSecurity: advancedSecurityMiddleware.sessionSecurity.bind(advancedSecurityMiddleware), // Commented for local development
  healthcareAccessControl: advancedSecurityMiddleware.healthcareAccessControl.bind(advancedSecurityMiddleware),
  requestIntegrity: advancedSecurityMiddleware.requestIntegrity.bind(advancedSecurityMiddleware),

  // Rate limiting middleware functions
  authRateLimit: rateLimitingMiddleware.authRateLimit.bind(rateLimitingMiddleware),
  apiRateLimit: rateLimitingMiddleware.apiRateLimit.bind(rateLimitingMiddleware),
  patientDataRateLimit: rateLimitingMiddleware.patientDataRateLimit.bind(rateLimitingMiddleware),
  formSubmissionRateLimit: rateLimitingMiddleware.formSubmissionRateLimit.bind(rateLimitingMiddleware),
  searchRateLimit: rateLimitingMiddleware.searchRateLimit.bind(rateLimitingMiddleware),
  uploadRateLimit: rateLimitingMiddleware.uploadRateLimit.bind(rateLimitingMiddleware),
  publicRateLimit: rateLimitingMiddleware.publicRateLimit.bind(rateLimitingMiddleware),
  customRateLimit: rateLimitingMiddleware.customRateLimit.bind(rateLimitingMiddleware),
  adaptiveRateLimit: rateLimitingMiddleware.adaptiveRateLimit.bind(rateLimitingMiddleware),
  ddosProtection: rateLimitingMiddleware.ddosProtection.bind(rateLimitingMiddleware),
  whitelist: rateLimitingMiddleware.whitelist.bind(rateLimitingMiddleware),
  emergencyBypass: rateLimitingMiddleware.emergencyBypass.bind(rateLimitingMiddleware),

  // Error handling middleware functions
  handleError: errorHandlingMiddleware.handleError.bind(errorHandlingMiddleware),
  notFoundHandler: errorHandlingMiddleware.notFoundHandler.bind(errorHandlingMiddleware),
  asyncHandler: errorHandlingMiddleware.asyncHandler.bind(errorHandlingMiddleware),
  validationErrorHandler: errorHandlingMiddleware.validationErrorHandler.bind(errorHandlingMiddleware),
  timeoutHandler: errorHandlingMiddleware.timeoutHandler.bind(errorHandlingMiddleware),
  createError: errorHandlingMiddleware.createError.bind(errorHandlingMiddleware),

  // API versioning middleware functions
  versionMiddleware: apiVersioningMiddleware.versionMiddleware.bind(apiVersioningMiddleware),
  requireVersion: apiVersioningMiddleware.requireVersion.bind(apiVersioningMiddleware),
  requireFeature: apiVersioningMiddleware.requireFeature.bind(apiVersioningMiddleware),
  checkCompatibility: apiVersioningMiddleware.checkCompatibility.bind(apiVersioningMiddleware),
  transformResponse: apiVersioningMiddleware.transformResponse.bind(apiVersioningMiddleware),
  negotiateVersion: apiVersioningMiddleware.negotiateVersion.bind(apiVersioningMiddleware),
  versionDocumentation: apiVersioningMiddleware.versionDocumentation.bind(apiVersioningMiddleware),
  healthcareComplianceVersioning: apiVersioningMiddleware.healthcareComplianceVersioning.bind(apiVersioningMiddleware),

  // Data validation and sanitization middleware functions
  validatePatient: dataValidationMiddleware.validatePatient.bind(dataValidationMiddleware),
  validateAssessment: dataValidationMiddleware.validateAssessment.bind(dataValidationMiddleware),
  validateForm: dataValidationMiddleware.validateForm.bind(dataValidationMiddleware),
  validate: dataValidationMiddleware.validate.bind(dataValidationMiddleware),
  validateParams: dataValidationMiddleware.validateParams.bind(dataValidationMiddleware),
  validateQuery: dataValidationMiddleware.validateQuery.bind(dataValidationMiddleware),
  sanitizeData: dataSanitizers.sanitizeMiddleware.bind(dataSanitizers),
  validateDynamicForm: formValidators.validateDynamicForm.bind(formValidators)
};