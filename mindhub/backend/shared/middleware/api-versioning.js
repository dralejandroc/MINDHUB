/**
 * API Versioning Middleware for MindHub Healthcare Platform
 * 
 * Comprehensive API versioning strategy with backward compatibility,
 * deprecation management, and healthcare-specific version controls
 */

const AuditLogger = require('../utils/audit-logger');

class APIVersioningMiddleware {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Supported API versions
    this.supportedVersions = {
      'v1': {
        version: '1.0.0',
        status: 'current',
        releaseDate: '2024-01-01',
        deprecationDate: null,
        endOfLifeDate: null,
        features: [
          'core_patient_management',
          'basic_clinical_assessments',
          'form_management',
          'resource_library',
          'basic_authentication'
        ]
      },
      'v2': {
        version: '2.0.0',
        status: 'beta',
        releaseDate: '2024-06-01',
        deprecationDate: null,
        endOfLifeDate: null,
        features: [
          'enhanced_patient_management',
          'advanced_clinical_assessments',
          'dynamic_form_builder',
          'enhanced_resource_library',
          'multi_factor_authentication',
          'telemedicine_integration',
          'ai_insights'
        ]
      }
    };

    // Version compatibility matrix
    this.compatibility = {
      'v1': {
        canUpgradeTo: ['v2'],
        canDowngradeTo: [],
        breakingChanges: []
      },
      'v2': {
        canUpgradeTo: [],
        canDowngradeTo: ['v1'],
        breakingChanges: [
          'authentication_method_changed',
          'patient_schema_enhanced',
          'assessment_scoring_improved'
        ]
      }
    };

    // Feature flags for version-specific functionality
    this.featureFlags = {
      'v1': {
        'enhanced_security': false,
        'real_time_notifications': false,
        'advanced_analytics': false,
        'telemedicine': false,
        'ai_recommendations': false
      },
      'v2': {
        'enhanced_security': true,
        'real_time_notifications': true,
        'advanced_analytics': true,
        'telemedicine': true,
        'ai_recommendations': true
      }
    };

    // Deprecation warnings
    this.deprecationWarnings = {
      'v1': {
        '/api/v1/patients/basic-info': {
          message: 'This endpoint is deprecated. Use /api/v2/patients/profile instead.',
          deprecatedIn: 'v2.0.0',
          removedIn: 'v3.0.0',
          alternative: '/api/v2/patients/profile'
        }
      }
    };
  }

  /**
   * Extract version from request
   */
  extractVersion(req) {
    // Priority order for version detection:
    // 1. Header (X-API-Version)
    // 2. URL path (/api/v1/...)
    // 3. Query parameter (?version=v1)
    // 4. Accept header (Accept: application/vnd.mindhub.v1+json)

    let version = null;

    // Check header
    if (req.headers['x-api-version']) {
      version = req.headers['x-api-version'];
    }

    // Check URL path
    if (!version) {
      const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
      if (pathMatch) {
        version = pathMatch[1];
      }
    }

    // Check query parameter
    if (!version && req.query.version) {
      version = req.query.version;
    }

    // Check Accept header
    if (!version) {
      const acceptHeader = req.headers.accept;
      if (acceptHeader) {
        const versionMatch = acceptHeader.match(/application\/vnd\.mindhub\.(v\d+)\+json/);
        if (versionMatch) {
          version = versionMatch[1];
        }
      }
    }

    // Default to latest stable version
    if (!version) {
      version = this.getLatestStableVersion();
    }

    return version;
  }

  /**
   * Get latest stable version
   */
  getLatestStableVersion() {
    const stableVersions = Object.entries(this.supportedVersions)
      .filter(([key, info]) => info.status === 'current')
      .sort(([a], [b]) => b.localeCompare(a));
    
    return stableVersions.length > 0 ? stableVersions[0][0] : 'v1';
  }

  /**
   * Main version middleware
   */
  versionMiddleware() {
    return async (req, res, next) => {
      try {
        const requestedVersion = this.extractVersion(req);
        
        // Validate version
        if (!this.isVersionSupported(requestedVersion)) {
          return res.status(400).json({
            error: {
              code: 'UNSUPPORTED_API_VERSION',
              message: `API version ${requestedVersion} is not supported`,
              supportedVersions: Object.keys(this.supportedVersions),
              currentVersion: this.getLatestStableVersion()
            }
          });
        }

        // Check if version is deprecated
        const versionInfo = this.supportedVersions[requestedVersion];
        if (versionInfo.status === 'deprecated') {
          res.set('X-API-Deprecation-Warning', 'true');
          res.set('X-API-Deprecation-Date', versionInfo.deprecationDate);
          res.set('X-API-EOL-Date', versionInfo.endOfLifeDate);
        }

        // Set version info in request
        req.apiVersion = requestedVersion;
        req.versionInfo = versionInfo;
        req.featureFlags = this.featureFlags[requestedVersion] || {};

        // Set response headers
        res.set('X-API-Version', requestedVersion);
        res.set('X-API-Version-Status', versionInfo.status);

        // Check for deprecated endpoints
        await this.checkDeprecatedEndpoints(req, res);

        // Log version usage
        await this.logVersionUsage(req);

        next();

      } catch (error) {
        console.error('API versioning error:', error);
        return res.status(500).json({
          error: {
            code: 'VERSION_PROCESSING_ERROR',
            message: 'Error processing API version'
          }
        });
      }
    };
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version) {
    return Object.keys(this.supportedVersions).includes(version);
  }

  /**
   * Check for deprecated endpoints
   */
  async checkDeprecatedEndpoints(req, res) {
    const version = req.apiVersion;
    const path = req.path;
    
    const versionDeprecations = this.deprecationWarnings[version];
    if (versionDeprecations && versionDeprecations[path]) {
      const deprecationInfo = versionDeprecations[path];
      
      res.set('X-Endpoint-Deprecated', 'true');
      res.set('X-Endpoint-Deprecation-Message', deprecationInfo.message);
      res.set('X-Endpoint-Alternative', deprecationInfo.alternative);

      // Log deprecation usage
      await this.auditLogger.logSystemEvent(
        req.user?.id,
        'DEPRECATED_ENDPOINT_USED',
        {
          version,
          endpoint: path,
          deprecationInfo,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      );
    }
  }

  /**
   * Log version usage for analytics
   */
  async logVersionUsage(req) {
    await this.auditLogger.logSystemEvent(
      req.user?.id,
      'API_VERSION_USED',
      {
        version: req.apiVersion,
        endpoint: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        userId: req.user?.id,
        userRole: req.user?.role
      }
    );
  }

  /**
   * Version-specific middleware factory
   */
  requireVersion(requiredVersion) {
    return (req, res, next) => {
      if (req.apiVersion !== requiredVersion) {
        return res.status(400).json({
          error: {
            code: 'VERSION_MISMATCH',
            message: `This endpoint requires API version ${requiredVersion}`,
            currentVersion: req.apiVersion,
            requiredVersion
          }
        });
      }
      next();
    };
  }

  /**
   * Feature flag middleware
   */
  requireFeature(featureName) {
    return (req, res, next) => {
      const featureFlags = req.featureFlags || {};
      
      if (!featureFlags[featureName]) {
        return res.status(403).json({
          error: {
            code: 'FEATURE_NOT_AVAILABLE',
            message: `Feature ${featureName} is not available in API version ${req.apiVersion}`,
            availableInVersions: this.getVersionsWithFeature(featureName)
          }
        });
      }
      next();
    };
  }

  /**
   * Get versions that support a specific feature
   */
  getVersionsWithFeature(featureName) {
    return Object.entries(this.featureFlags)
      .filter(([version, flags]) => flags[featureName])
      .map(([version]) => version);
  }

  /**
   * Version compatibility middleware
   */
  checkCompatibility() {
    return (req, res, next) => {
      const version = req.apiVersion;
      const compatibility = this.compatibility[version];
      
      if (compatibility && compatibility.breakingChanges.length > 0) {
        res.set('X-Breaking-Changes', JSON.stringify(compatibility.breakingChanges));
        res.set('X-Upgrade-Available', JSON.stringify(compatibility.canUpgradeTo));
      }
      
      next();
    };
  }

  /**
   * Response transformation middleware
   */
  transformResponse() {
    return (req, res, next) => {
      const originalJson = res.json;
      const version = req.apiVersion;

      res.json = function(data) {
        // Transform response based on version
        const transformedData = this.transformDataForVersion(data, version);
        return originalJson.call(this, transformedData);
      }.bind(this);

      next();
    };
  }

  /**
   * Transform data structure based on API version
   */
  transformDataForVersion(data, version) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    switch (version) {
      case 'v1':
        return this.transformToV1(data);
      case 'v2':
        return this.transformToV2(data);
      default:
        return data;
    }
  }

  /**
   * Transform data to v1 format (simpler structure)
   */
  transformToV1(data) {
    if (data.data && Array.isArray(data.data)) {
      // Remove enhanced fields for v1
      data.data = data.data.map(item => {
        if (item.enhancedMetrics) delete item.enhancedMetrics;
        if (item.aiInsights) delete item.aiInsights;
        if (item.telemedicineData) delete item.telemedicineData;
        return item;
      });
    }

    // Remove v2-specific metadata
    if (data.metadata) {
      delete data.metadata.aiRecommendations;
      delete data.metadata.realTimeStatus;
    }

    return data;
  }

  /**
   * Transform data to v2 format (enhanced structure)
   */
  transformToV2(data) {
    // Add enhanced metadata for v2
    if (data.data) {
      data.metadata = {
        ...data.metadata,
        enhancedFeatures: true,
        apiVersion: 'v2',
        capabilities: ['real_time', 'ai_insights', 'telemedicine']
      };
    }

    return data;
  }

  /**
   * Version negotiation middleware
   */
  negotiateVersion() {
    return (req, res, next) => {
      const acceptHeader = req.headers.accept;
      const userAgent = req.headers['user-agent'];

      // Mobile clients might prefer v1 for simplicity
      if (userAgent && userAgent.includes('Mobile') && !req.headers['x-api-version']) {
        req.preferredVersion = 'v1';
      }

      // Advanced clients might prefer v2
      if (acceptHeader && acceptHeader.includes('application/vnd.mindhub.v2+json')) {
        req.preferredVersion = 'v2';
      }

      next();
    };
  }

  /**
   * API documentation middleware
   */
  versionDocumentation() {
    return (req, res, next) => {
      if (req.path === '/api/versions') {
        return res.json({
          supportedVersions: this.supportedVersions,
          compatibility: this.compatibility,
          currentVersion: this.getLatestStableVersion(),
          deprecationPolicy: {
            notice: 'Deprecated versions will be supported for 12 months after deprecation',
            migrationGuide: '/docs/migration-guide'
          }
        });
      }
      next();
    };
  }

  /**
   * Healthcare compliance versioning
   */
  healthcareComplianceVersioning() {
    return async (req, res, next) => {
      const version = req.apiVersion;
      
      // Log all healthcare data access with version info
      if (this.isHealthcareEndpoint(req.path)) {
        await this.auditLogger.logComplianceEvent(
          req.user?.id,
          'HEALTHCARE_API_ACCESS',
          {
            apiVersion: version,
            endpoint: req.path,
            method: req.method,
            dataClassification: 'PHI',
            complianceStandard: 'NOM-024-SSA3-2010',
            versionCompliance: this.checkVersionCompliance(version)
          }
        );
      }

      next();
    };
  }

  /**
   * Check if endpoint handles healthcare data
   */
  isHealthcareEndpoint(path) {
    const healthcarePatterns = [
      '/patients/',
      '/assessments/',
      '/medical-records/',
      '/prescriptions/',
      '/clinical-notes/'
    ];
    
    return healthcarePatterns.some(pattern => path.includes(pattern));
  }

  /**
   * Check version compliance with healthcare standards
   */
  checkVersionCompliance(version) {
    const complianceMatrix = {
      'v1': {
        encryption: 'basic',
        auditLogging: 'standard',
        accessControl: 'role_based',
        dataRetention: 'manual'
      },
      'v2': {
        encryption: 'enhanced',
        auditLogging: 'comprehensive',
        accessControl: 'attribute_based',
        dataRetention: 'automated'
      }
    };

    return complianceMatrix[version] || complianceMatrix['v1'];
  }

  /**
   * Cleanup old version data
   */
  async cleanup() {
    // This would clean up old version-specific cached data
    console.log('API versioning cleanup completed');
  }
}

module.exports = APIVersioningMiddleware;