/**
 * Version Manager Utility for MindHub Healthcare Platform
 * 
 * Centralized version management with deprecation tracking,
 * feature flag management, and version lifecycle automation
 */

const fs = require('fs').promises;
const path = require('path');
const AuditLogger = require('./audit-logger');

class VersionManager {
  constructor() {
    this.auditLogger = new AuditLogger();
    this.configPath = path.join(__dirname, '../config/versions.json');
    this.config = null;
    this.loadConfig();
  }

  /**
   * Load version configuration
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      // Create default config if file doesn't exist
      this.config = this.getDefaultConfig();
      await this.saveConfig();
    }
  }

  /**
   * Get default version configuration
   */
  getDefaultConfig() {
    return {
      currentVersion: 'v1',
      supportedVersions: {
        'v1': {
          version: '1.0.0',
          status: 'current',
          releaseDate: '2024-01-01',
          deprecationDate: null,
          endOfLifeDate: null,
          supportLevel: 'full',
          securityUpdates: true,
          bugFixes: true,
          features: [
            'core_patient_management',
            'basic_clinical_assessments',
            'form_management',
            'resource_library'
          ]
        },
        'v2': {
          version: '2.0.0',
          status: 'beta',
          releaseDate: '2024-06-01',
          deprecationDate: null,
          endOfLifeDate: null,
          supportLevel: 'full',
          securityUpdates: true,
          bugFixes: true,
          features: [
            'enhanced_patient_management',
            'advanced_clinical_assessments',
            'dynamic_form_builder',
            'telemedicine_integration',
            'ai_insights',
            'real_time_notifications'
          ]
        }
      },
      deprecationPolicy: {
        warningPeriod: 180, // days
        supportPeriod: 365, // days after deprecation
        migrationAssistance: true
      },
      featureFlags: {
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
      }
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save version config:', error);
    }
  }

  /**
   * Get version information
   */
  getVersionInfo(version) {
    return this.config?.supportedVersions[version] || null;
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions() {
    return Object.keys(this.config?.supportedVersions || {});
  }

  /**
   * Get current stable version
   */
  getCurrentVersion() {
    return this.config?.currentVersion || 'v1';
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version) {
    return this.getSupportedVersions().includes(version);
  }

  /**
   * Check if version is deprecated
   */
  isVersionDeprecated(version) {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo?.status === 'deprecated';
  }

  /**
   * Get feature flags for version
   */
  getFeatureFlags(version) {
    return this.config?.featureFlags[version] || {};
  }

  /**
   * Check if feature is available in version
   */
  isFeatureAvailable(version, feature) {
    const flags = this.getFeatureFlags(version);
    return flags[feature] === true;
  }

  /**
   * Deprecate a version
   */
  async deprecateVersion(version, reason = '') {
    if (!this.isVersionSupported(version)) {
      throw new Error(`Version ${version} is not supported`);
    }

    const versionInfo = this.getVersionInfo(version);
    const now = new Date();
    const eolDate = new Date(now.getTime() + this.config.deprecationPolicy.supportPeriod * 24 * 60 * 60 * 1000);

    // Update version status
    this.config.supportedVersions[version] = {
      ...versionInfo,
      status: 'deprecated',
      deprecationDate: now.toISOString(),
      endOfLifeDate: eolDate.toISOString(),
      deprecationReason: reason
    };

    await this.saveConfig();

    // Log deprecation
    await this.auditLogger.logSystemEvent(
      'system',
      'VERSION_DEPRECATED',
      {
        version,
        reason,
        deprecationDate: now.toISOString(),
        endOfLifeDate: eolDate.toISOString(),
        affectedUsers: await this.getVersionUsageStats(version)
      }
    );

    return true;
  }

  /**
   * Add new version
   */
  async addVersion(version, versionData) {
    if (this.isVersionSupported(version)) {
      throw new Error(`Version ${version} already exists`);
    }

    this.config.supportedVersions[version] = {
      ...versionData,
      releaseDate: new Date().toISOString()
    };

    await this.saveConfig();

    // Log new version
    await this.auditLogger.logSystemEvent(
      'system',
      'NEW_VERSION_ADDED',
      {
        version,
        versionData,
        releaseDate: versionData.releaseDate
      }
    );

    return true;
  }

  /**
   * Update feature flags for version
   */
  async updateFeatureFlags(version, flags) {
    if (!this.isVersionSupported(version)) {
      throw new Error(`Version ${version} is not supported`);
    }

    const currentFlags = this.getFeatureFlags(version);
    this.config.featureFlags[version] = {
      ...currentFlags,
      ...flags
    };

    await this.saveConfig();

    // Log feature flag update
    await this.auditLogger.logSystemEvent(
      'system',
      'FEATURE_FLAGS_UPDATED',
      {
        version,
        updatedFlags: flags,
        previousFlags: currentFlags
      }
    );

    return true;
  }

  /**
   * Get version usage statistics
   */
  async getVersionUsageStats(version) {
    // This would typically query usage analytics
    // For now, return placeholder data
    return {
      activeUsers: 0,
      requestsPerDay: 0,
      lastUsed: new Date().toISOString()
    };
  }

  /**
   * Get deprecation timeline for version
   */
  getDeprecationTimeline(version) {
    const versionInfo = this.getVersionInfo(version);
    
    if (!versionInfo || !versionInfo.deprecationDate) {
      return null;
    }

    const deprecationDate = new Date(versionInfo.deprecationDate);
    const eolDate = new Date(versionInfo.endOfLifeDate);
    const now = new Date();

    return {
      deprecationDate: versionInfo.deprecationDate,
      endOfLifeDate: versionInfo.endOfLifeDate,
      daysUntilEOL: Math.ceil((eolDate - now) / (1000 * 60 * 60 * 24)),
      isInWarningPeriod: (eolDate - now) <= (this.config.deprecationPolicy.warningPeriod * 24 * 60 * 60 * 1000),
      status: now > eolDate ? 'end_of_life' : versionInfo.status
    };
  }

  /**
   * Get migration recommendations
   */
  getMigrationRecommendations(fromVersion, toVersion = null) {
    if (!toVersion) {
      toVersion = this.getCurrentVersion();
    }

    const fromInfo = this.getVersionInfo(fromVersion);
    const toInfo = this.getVersionInfo(toVersion);

    if (!fromInfo || !toInfo) {
      return null;
    }

    const fromFeatures = new Set(fromInfo.features || []);
    const toFeatures = new Set(toInfo.features || []);

    const addedFeatures = [...toFeatures].filter(f => !fromFeatures.has(f));
    const removedFeatures = [...fromFeatures].filter(f => !toFeatures.has(f));

    return {
      from: fromVersion,
      to: toVersion,
      recommended: fromInfo.status === 'deprecated' || fromInfo.status === 'end_of_life',
      urgency: this.getMigrationUrgency(fromVersion),
      addedFeatures,
      removedFeatures,
      breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
      estimatedEffort: this.estimateMigrationEffort(fromVersion, toVersion),
      resources: {
        documentation: `/docs/migration/${fromVersion}-to-${toVersion}`,
        support: 'api-support@mindhub.health',
        tools: this.getMigrationTools(fromVersion, toVersion)
      }
    };
  }

  /**
   * Get migration urgency level
   */
  getMigrationUrgency(version) {
    const timeline = this.getDeprecationTimeline(version);
    
    if (!timeline) {
      return 'none';
    }

    if (timeline.status === 'end_of_life') {
      return 'critical';
    }

    if (timeline.daysUntilEOL <= 30) {
      return 'high';
    }

    if (timeline.daysUntilEOL <= 90) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get breaking changes between versions
   */
  getBreakingChanges(fromVersion, toVersion) {
    // This would typically be stored in configuration
    const breakingChanges = {
      'v1-v2': [
        {
          type: 'authentication',
          description: 'Enhanced authentication with MFA support',
          impact: 'medium',
          action: 'Update authentication flow'
        },
        {
          type: 'response_format',
          description: 'Enhanced response metadata structure',
          impact: 'low',
          action: 'Update response parsing logic'
        },
        {
          type: 'patient_schema',
          description: 'Enhanced patient data model',
          impact: 'medium',
          action: 'Update patient data handling'
        }
      ]
    };

    return breakingChanges[`${fromVersion}-${toVersion}`] || [];
  }

  /**
   * Estimate migration effort
   */
  estimateMigrationEffort(fromVersion, toVersion) {
    const breakingChanges = this.getBreakingChanges(fromVersion, toVersion);
    const complexity = breakingChanges.reduce((total, change) => {
      switch (change.impact) {
        case 'high': return total + 3;
        case 'medium': return total + 2;
        case 'low': return total + 1;
        default: return total;
      }
    }, 0);

    if (complexity <= 2) return 'low';
    if (complexity <= 5) return 'medium';
    return 'high';
  }

  /**
   * Get migration tools
   */
  getMigrationTools(fromVersion, toVersion) {
    return [
      {
        name: 'Version Compatibility Checker',
        description: 'Check your current implementation for compatibility issues',
        url: `/tools/compatibility-checker?from=${fromVersion}&to=${toVersion}`
      },
      {
        name: 'Migration Assistant',
        description: 'Step-by-step migration guide with code examples',
        url: `/tools/migration-assistant?from=${fromVersion}&to=${toVersion}`
      },
      {
        name: 'Testing Sandbox',
        description: 'Test your application against the new API version',
        url: `/tools/sandbox?version=${toVersion}`
      }
    ];
  }

  /**
   * Generate version report
   */
  async generateVersionReport() {
    const versions = this.getSupportedVersions();
    const report = {
      generatedAt: new Date().toISOString(),
      currentVersion: this.getCurrentVersion(),
      summary: {
        totalVersions: versions.length,
        activeVersions: 0,
        deprecatedVersions: 0,
        betaVersions: 0
      },
      versions: {},
      recommendations: []
    };

    for (const version of versions) {
      const info = this.getVersionInfo(version);
      const timeline = this.getDeprecationTimeline(version);
      const usage = await this.getVersionUsageStats(version);

      report.versions[version] = {
        ...info,
        timeline,
        usage,
        featureFlags: this.getFeatureFlags(version)
      };

      // Update summary
      switch (info.status) {
        case 'current':
          report.summary.activeVersions++;
          break;
        case 'deprecated':
          report.summary.deprecatedVersions++;
          break;
        case 'beta':
          report.summary.betaVersions++;
          break;
      }

      // Add recommendations
      if (info.status === 'deprecated' && timeline?.daysUntilEOL <= 90) {
        report.recommendations.push({
          type: 'migration_urgent',
          version,
          message: `Version ${version} will reach end-of-life in ${timeline.daysUntilEOL} days`,
          action: 'Plan migration immediately'
        });
      }
    }

    return report;
  }
}

module.exports = VersionManager;