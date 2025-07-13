/**
 * Versioned API Router for MindHub Healthcare Platform
 * 
 * Central routing configuration with version-specific route handling,
 * backward compatibility, and healthcare-specific routing patterns
 */

const express = require('express');
const APIVersioningMiddleware = require('../middleware/api-versioning');
const middleware = require('../middleware');

class VersionedAPIRouter {
  constructor() {
    this.router = express.Router();
    this.versioningMiddleware = new APIVersioningMiddleware();
    
    // Version-specific routers
    this.versionRouters = {
      v1: express.Router(),
      v2: express.Router()
    };

    this.setupVersionedRoutes();
  }

  /**
   * Setup version-specific routes
   */
  setupVersionedRoutes() {
    // Apply global versioning middleware
    this.router.use(this.versioningMiddleware.versionMiddleware());
    this.router.use(this.versioningMiddleware.negotiateVersion());
    this.router.use(this.versioningMiddleware.checkCompatibility());
    this.router.use(this.versioningMiddleware.healthcareComplianceVersioning());

    // Version documentation endpoint
    this.router.use(this.versioningMiddleware.versionDocumentation());

    // Setup v1 routes
    this.setupV1Routes();

    // Setup v2 routes
    this.setupV2Routes();

    // Mount version-specific routers
    this.router.use('/v1', this.versionRouters.v1);
    this.router.use('/v2', this.versionRouters.v2);

    // Default version routing (without version prefix)
    this.router.use('/', this.createDefaultVersionRouter());
  }

  /**
   * Setup API v1 routes (legacy/stable)
   */
  setupV1Routes() {
    const v1Router = this.versionRouters.v1;

    // Apply v1-specific middleware
    v1Router.use(this.versioningMiddleware.requireVersion('v1'));
    v1Router.use(this.versioningMiddleware.transformResponse());

    // Expedix Hub - Patient Management (v1)
    v1Router.use('/expedix/patients', 
      ...middleware.presets.patientData,
      this.loadRoutes('../../../expedix/routes/patients-v1')
    );

    // Clinimetrix Hub - Clinical Assessments (v1)
    v1Router.use('/clinimetrix/assessments',
      ...middleware.utils.forHub('clinimetrix'),
      this.loadRoutes('../../../clinimetrix/routes/assessments-v1')
    );

    // Formx Hub - Forms Management (v1)
    v1Router.use('/formx/forms',
      ...middleware.utils.forHub('formx'),
      this.loadRoutes('../../../formx/routes/forms-v1')
    );

    // Resources Hub - Educational Content (v1)
    v1Router.use('/resources/content',
      ...middleware.utils.forHub('resources'),
      this.loadRoutes('../../../resources/routes/library-v1')
    );

    // Authentication endpoints (v1)
    v1Router.use('/auth',
      ...middleware.presets.auth,
      this.loadRoutes('../../../auth/routes/auth-v1')
    );

    // User management (v1)
    v1Router.use('/users',
      ...middleware.presets.protected,
      this.loadRoutes('../../../users/routes/users-v1')
    );
  }

  /**
   * Setup API v2 routes (enhanced)
   */
  setupV2Routes() {
    const v2Router = this.versionRouters.v2;

    // Apply v2-specific middleware
    v2Router.use(this.versioningMiddleware.requireVersion('v2'));
    v2Router.use(this.versioningMiddleware.transformResponse());

    // Enhanced Expedix Hub - Advanced Patient Management (v2)
    v2Router.use('/expedix/patients', 
      ...middleware.presets.patientData,
      this.versioningMiddleware.requireFeature('enhanced_security'),
      this.loadRoutes('../../../expedix/routes/patients')
    );

    // Enhanced Clinimetrix Hub - Advanced Assessments (v2)
    v2Router.use('/clinimetrix/assessments',
      ...middleware.utils.forHub('clinimetrix'),
      this.versioningMiddleware.requireFeature('advanced_analytics'),
      this.loadRoutes('../../../clinimetrix/routes/assessments')
    );

    // Enhanced Formx Hub - Dynamic Forms (v2)
    v2Router.use('/formx/forms',
      ...middleware.utils.forHub('formx'),
      this.loadRoutes('../../../formx/routes/forms')
    );

    // Enhanced Resources Hub - Smart Content (v2)
    v2Router.use('/resources/content',
      ...middleware.utils.forHub('resources'),
      this.loadRoutes('../../../resources/routes/library')
    );

    // Enhanced Authentication with MFA (v2)
    v2Router.use('/auth',
      ...middleware.presets.auth,
      this.versioningMiddleware.requireFeature('multi_factor_authentication'),
      this.loadRoutes('../../../auth/routes/auth-v2')
    );

    // Telemedicine endpoints (v2 only)
    v2Router.use('/telemedicine',
      ...middleware.presets.protected,
      this.versioningMiddleware.requireFeature('telemedicine'),
      this.loadRoutes('../../../telemedicine/routes/sessions')
    );

    // AI Insights endpoints (v2 only)
    v2Router.use('/ai-insights',
      ...middleware.presets.protected,
      this.versioningMiddleware.requireFeature('ai_recommendations'),
      this.loadRoutes('../../../ai-insights/routes/recommendations')
    );

    // Real-time notifications (v2 only)
    v2Router.use('/notifications',
      ...middleware.presets.protected,
      this.versioningMiddleware.requireFeature('real_time_notifications'),
      this.loadRoutes('../../../notifications/routes/realtime')
    );

    // Analytics and reporting (v2 only)
    v2Router.use('/analytics',
      ...middleware.utils.forRoles(['admin', 'psychiatrist'], ['read:analytics']),
      this.versioningMiddleware.requireFeature('advanced_analytics'),
      this.loadRoutes('../../../analytics/routes/reports')
    );
  }

  /**
   * Create default version router (routes to latest stable)
   */
  createDefaultVersionRouter() {
    const defaultRouter = express.Router();
    const latestVersion = this.versioningMiddleware.getLatestStableVersion();

    // Redirect to versioned endpoints
    defaultRouter.use((req, res, next) => {
      // If no version specified, use latest stable
      if (!req.apiVersion) {
        req.apiVersion = latestVersion;
      }

      // Rewrite URL to include version
      const originalUrl = req.originalUrl;
      const versionedUrl = originalUrl.replace('/api/', `/api/${latestVersion}/`);
      
      // Set version headers
      res.set('X-API-Version', latestVersion);
      res.set('X-API-Version-Default', 'true');

      // Forward to versioned router
      req.url = req.url.replace('/api/', `/api/${latestVersion}/`);
      next();
    });

    return defaultRouter;
  }

  /**
   * Load route modules safely
   */
  loadRoutes(routePath) {
    try {
      return require(routePath);
    } catch (error) {
      console.warn(`Route not found: ${routePath}, using fallback`);
      // Return a fallback router that explains the endpoint is not available
      const fallbackRouter = express.Router();
      fallbackRouter.use((req, res) => {
        res.status(404).json({
          error: {
            code: 'ENDPOINT_NOT_AVAILABLE',
            message: `This endpoint is not available in the current API version`,
            version: req.apiVersion,
            availableEndpoints: '/api/versions'
          }
        });
      });
      return fallbackRouter;
    }
  }

  /**
   * Health check endpoint with version info
   */
  setupHealthCheck() {
    this.router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: req.apiVersion || 'unknown',
        supportedVersions: Object.keys(this.versioningMiddleware.supportedVersions),
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }

  /**
   * API capabilities endpoint
   */
  setupCapabilities() {
    this.router.get('/capabilities', (req, res) => {
      const version = req.apiVersion || this.versioningMiddleware.getLatestStableVersion();
      const versionInfo = this.versioningMiddleware.supportedVersions[version];
      const featureFlags = this.versioningMiddleware.featureFlags[version];

      res.json({
        version,
        status: versionInfo?.status,
        features: versionInfo?.features || [],
        featureFlags,
        capabilities: {
          authentication: featureFlags?.multi_factor_authentication ? 'enhanced' : 'basic',
          realTime: featureFlags?.real_time_notifications || false,
          analytics: featureFlags?.advanced_analytics || false,
          telemedicine: featureFlags?.telemedicine || false,
          aiInsights: featureFlags?.ai_recommendations || false
        }
      });
    });
  }

  /**
   * Migration guide endpoint
   */
  setupMigrationGuide() {
    this.router.get('/migration-guide', (req, res) => {
      const fromVersion = req.query.from || 'v1';
      const toVersion = req.query.to || 'v2';

      const migrationGuide = {
        from: fromVersion,
        to: toVersion,
        breakingChanges: this.getMigrationBreakingChanges(fromVersion, toVersion),
        steps: this.getMigrationSteps(fromVersion, toVersion),
        timeline: this.getMigrationTimeline(fromVersion, toVersion),
        support: {
          documentation: '/docs/api-migration',
          contact: 'api-support@mindhub.health',
          migrationAssistance: true
        }
      };

      res.json(migrationGuide);
    });
  }

  /**
   * Get breaking changes between versions
   */
  getMigrationBreakingChanges(fromVersion, toVersion) {
    const compatibility = this.versioningMiddleware.compatibility[toVersion];
    return compatibility?.breakingChanges || [];
  }

  /**
   * Get migration steps
   */
  getMigrationSteps(fromVersion, toVersion) {
    if (fromVersion === 'v1' && toVersion === 'v2') {
      return [
        {
          step: 1,
          title: 'Update authentication headers',
          description: 'Add X-API-Version: v2 header to all requests',
          required: true
        },
        {
          step: 2,
          title: 'Handle enhanced response format',
          description: 'Update client code to handle new response structure with metadata',
          required: true
        },
        {
          step: 3,
          title: 'Implement MFA if using authentication',
          description: 'Update authentication flow to support multi-factor authentication',
          required: false
        },
        {
          step: 4,
          title: 'Test with new features',
          description: 'Test real-time notifications and AI insights if applicable',
          required: false
        }
      ];
    }

    return [];
  }

  /**
   * Get migration timeline
   */
  getMigrationTimeline(fromVersion, toVersion) {
    return {
      planning: '1-2 weeks',
      development: '2-4 weeks',
      testing: '1-2 weeks',
      deployment: '1 week',
      total: '5-9 weeks',
      support: '12 months after migration'
    };
  }

  /**
   * Get the configured router
   */
  getRouter() {
    // Setup additional endpoints
    this.setupHealthCheck();
    this.setupCapabilities();
    this.setupMigrationGuide();

    return this.router;
  }
}

module.exports = VersionedAPIRouter;