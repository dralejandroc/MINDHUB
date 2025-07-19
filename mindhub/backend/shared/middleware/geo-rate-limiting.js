/**
 * Geographic Rate Limiting Middleware
 * 
 * Implements location-based rate limiting and access control
 * for international healthcare compliance
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logging');
const { getCurrentContext } = require('../config/request-context');
const AuditLogger = require('../utils/audit-logger');

class GeoRateLimitingMiddleware {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Geographic rate limiting configurations
    this.geoConfigs = {
      // Mexico - Primary service area
      MX: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Higher limits for primary region
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED_MX',
            message: 'Límite de velocidad excedido para México',
            type: 'geo_rate_limit_mx'
          }
        },
        healthcareCompliance: 'NOM-024-SSA3-2010',
        dataRetention: '7 years',
        auditLevel: 'high'
      },
      
      // United States - Secondary service area
      US: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // Reduced limits for secondary region
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED_US',
            message: 'Rate limit exceeded for United States',
            type: 'geo_rate_limit_us'
          }
        },
        healthcareCompliance: 'HIPAA',
        dataRetention: '7 years',
        auditLevel: 'high'
      },
      
      // Canada - Secondary service area
      CA: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // Reduced limits for secondary region
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED_CA',
            message: 'Rate limit exceeded for Canada',
            type: 'geo_rate_limit_ca'
          }
        },
        healthcareCompliance: 'PIPEDA',
        dataRetention: '7 years',
        auditLevel: 'high'
      },
      
      // European Union - Restricted access
      EU: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Very limited access
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED_EU',
            message: 'Rate limit exceeded for European Union',
            type: 'geo_rate_limit_eu'
          }
        },
        healthcareCompliance: 'GDPR',
        dataRetention: '2 years',
        auditLevel: 'maximum',
        requiresConsent: true
      },
      
      // Default for other countries
      DEFAULT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // Very limited access
        message: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED_INTL',
            message: 'Rate limit exceeded for international access',
            type: 'geo_rate_limit_intl'
          }
        },
        healthcareCompliance: 'GENERAL',
        dataRetention: '1 year',
        auditLevel: 'medium',
        requiresJustification: true
      }
    };
    
    // Blocked countries (healthcare data cannot be accessed from these locations)
    this.blockedCountries = [
      'CN', 'RU', 'IR', 'KP', 'SY' // Example blocked countries
    ];
    
    // Special healthcare regions with enhanced restrictions
    this.healthcareRegions = {
      'MX': {
        states: ['CDMX', 'JAL', 'NL', 'YUC'], // Mexico City, Jalisco, Nuevo León, Yucatán
        additionalRestrictions: {
          patientDataAccess: {
            max: 200,
            windowMs: 5 * 60 * 1000 // 5 minutes
          },
          bulkDataAccess: {
            max: 5,
            windowMs: 60 * 60 * 1000 // 1 hour
          }
        }
      },
      'US': {
        states: ['CA', 'TX', 'NY', 'FL'], // California, Texas, New York, Florida
        additionalRestrictions: {
          patientDataAccess: {
            max: 100,
            windowMs: 5 * 60 * 1000 // 5 minutes
          },
          bulkDataAccess: {
            max: 3,
            windowMs: 60 * 60 * 1000 // 1 hour
          }
        }
      }
    };
    
    // IP geolocation cache
    this.geoCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize cleanup
    this.initializeCleanup();
  }

  /**
   * Create geographic rate limiter
   */
  createGeoRateLimiter(options = {}) {
    return async (req, res, next) => {
      try {
        const clientIP = req.ip;
        const context = getCurrentContext();
        
        // Get geographic information
        const geoInfo = await this.getGeoInfo(clientIP);
        
        // Check if country is blocked
        if (this.blockedCountries.includes(geoInfo.country)) {
          await this.handleBlockedCountry(req, res, geoInfo);
          return;
        }
        
        // Get appropriate rate limit configuration
        const config = this.getGeoConfig(geoInfo.country);
        
        // Apply geographic rate limiting
        const geoRateLimiter = this.createRateLimiter(config, geoInfo);
        
        // Store geographic info in request
        req.geoInfo = geoInfo;
        req.geoConfig = config;
        
        // Apply rate limiting
        geoRateLimiter(req, res, next);
        
      } catch (error) {
        logger.error('Geographic rate limiting error', {
          error: error.message,
          ip: req.ip,
          path: req.path
        });
        
        // Fail open with default rate limiting
        const defaultConfig = this.geoConfigs.DEFAULT;
        const defaultRateLimiter = this.createRateLimiter(defaultConfig, { country: 'UNKNOWN' });
        defaultRateLimiter(req, res, next);
      }
    };
  }

  /**
   * Healthcare-specific geographic rate limiting
   */
  createHealthcareGeoRateLimiter(options = {}) {
    return async (req, res, next) => {
      try {
        const clientIP = req.ip;
        const geoInfo = await this.getGeoInfo(clientIP);
        
        // Enhanced restrictions for healthcare endpoints
        if (this.isHealthcareEndpoint(req)) {
          const healthcareConfig = this.getHealthcareConfig(geoInfo);
          
          // Apply healthcare-specific rate limiting
          const healthcareRateLimiter = this.createRateLimiter(healthcareConfig, geoInfo);
          
          // Log healthcare access
          await this.logHealthcareAccess(req, geoInfo);
          
          healthcareRateLimiter(req, res, next);
        } else {
          // Use regular geographic rate limiting
          const geoRateLimiter = this.createGeoRateLimiter(options);
          geoRateLimiter(req, res, next);
        }
        
      } catch (error) {
        logger.error('Healthcare geographic rate limiting error', {
          error: error.message,
          ip: req.ip,
          path: req.path
        });
        
        // Fail secure for healthcare endpoints
        if (this.isHealthcareEndpoint(req)) {
          res.status(503).json({
            error: {
              code: 'HEALTHCARE_GEO_SERVICE_UNAVAILABLE',
              message: 'Healthcare geographic services temporarily unavailable',
              type: 'geo_service_error'
            }
          });
        } else {
          next();
        }
      }
    };
  }

  /**
   * Get geographic information for IP
   */
  async getGeoInfo(ip) {
    // Check cache first
    const cacheKey = ip;
    if (this.geoCache.has(cacheKey)) {
      const cached = this.geoCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }
    
    try {
      // For development, return mock data
      // In production, integrate with MaxMind GeoIP2 or similar service
      const geoInfo = await this.mockGeoLookup(ip);
      
      // Cache the result
      this.geoCache.set(cacheKey, {
        data: geoInfo,
        timestamp: Date.now()
      });
      
      return geoInfo;
      
    } catch (error) {
      logger.error('Geo lookup failed', { error: error.message, ip });
      
      // Return default info
      return {
        country: 'UNKNOWN',
        region: 'UNKNOWN',
        city: 'UNKNOWN',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        isp: 'UNKNOWN'
      };
    }
  }

  /**
   * Mock geo lookup for development
   */
  async mockGeoLookup(ip) {
    // Simulate different countries for testing
    const mockCountries = ['MX', 'US', 'CA', 'DE', 'FR', 'CN'];
    const randomCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];
    
    return {
      country: randomCountry,
      region: randomCountry === 'MX' ? 'CDMX' : 'UNKNOWN',
      city: randomCountry === 'MX' ? 'Mexico City' : 'UNKNOWN',
      latitude: randomCountry === 'MX' ? 19.4326 : 0,
      longitude: randomCountry === 'MX' ? -99.1332 : 0,
      timezone: randomCountry === 'MX' ? 'America/Mexico_City' : 'UTC',
      isp: 'Test ISP'
    };
  }

  /**
   * Get geographic configuration
   */
  getGeoConfig(country) {
    return this.geoConfigs[country] || this.geoConfigs.DEFAULT;
  }

  /**
   * Get healthcare-specific configuration
   */
  getHealthcareConfig(geoInfo) {
    const baseConfig = this.getGeoConfig(geoInfo.country);
    
    // Apply healthcare-specific restrictions
    const healthcareConfig = {
      ...baseConfig,
      max: Math.floor(baseConfig.max * 0.5), // Reduce limits for healthcare
      windowMs: Math.floor(baseConfig.windowMs * 0.5), // Shorter windows
      message: {
        error: {
          code: 'HEALTHCARE_GEO_RATE_LIMIT_EXCEEDED',
          message: `Healthcare rate limit exceeded for ${geoInfo.country}`,
          type: 'healthcare_geo_rate_limit',
          compliance: baseConfig.healthcareCompliance
        }
      }
    };
    
    // Apply region-specific restrictions
    if (this.healthcareRegions[geoInfo.country]) {
      const regionConfig = this.healthcareRegions[geoInfo.country];
      if (regionConfig.additionalRestrictions) {
        healthcareConfig.max = Math.min(
          healthcareConfig.max,
          regionConfig.additionalRestrictions.patientDataAccess.max
        );
        healthcareConfig.windowMs = Math.min(
          healthcareConfig.windowMs,
          regionConfig.additionalRestrictions.patientDataAccess.windowMs
        );
      }
    }
    
    return healthcareConfig;
  }

  /**
   * Create rate limiter with geographic configuration
   */
  createRateLimiter(config, geoInfo) {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: config.message,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return `geo:${geoInfo.country}:${req.ip}`;
      },
      handler: async (req, res) => {
        await this.handleGeoRateLimitExceeded(req, res, config, geoInfo);
      }
    });
  }

  /**
   * Handle blocked country access
   */
  async handleBlockedCountry(req, res, geoInfo) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'BLOCKED_COUNTRY_ACCESS',
      {
        ip: req.ip,
        country: geoInfo.country,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }
    );
    
    logger.warn('Blocked country access attempt', {
      ip: req.ip,
      country: geoInfo.country,
      path: req.path
    });
    
    res.status(403).json({
      error: {
        code: 'COUNTRY_BLOCKED',
        message: 'Access from this country is not permitted',
        type: 'geo_restriction',
        country: geoInfo.country
      }
    });
  }

  /**
   * Handle geographic rate limit exceeded
   */
  async handleGeoRateLimitExceeded(req, res, config, geoInfo) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'GEO_RATE_LIMIT_EXCEEDED',
      {
        ip: req.ip,
        country: geoInfo.country,
        path: req.path,
        method: req.method,
        rateLimitConfig: config,
        userAgent: req.headers['user-agent']
      }
    );
    
    logger.warn('Geographic rate limit exceeded', {
      ip: req.ip,
      country: geoInfo.country,
      path: req.path,
      config: config
    });
    
    res.status(429).json(config.message);
  }

  /**
   * Log healthcare access
   */
  async logHealthcareAccess(req, geoInfo) {
    await this.auditLogger.logDataAccess(
      req.user?.id || 'anonymous',
      'healthcare_geo_access',
      req.path,
      'access',
      {
        ip: req.ip,
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city,
        compliance: this.getGeoConfig(geoInfo.country).healthcareCompliance,
        path: req.path,
        method: req.method
      }
    );
  }

  /**
   * Check if endpoint is healthcare-related
   */
  isHealthcareEndpoint(req) {
    const healthcarePatterns = [
      '/patients/',
      '/medical-records/',
      '/assessments/',
      '/prescriptions/',
      '/clinical-notes/',
      '/diagnoses/',
      '/treatments/'
    ];
    
    return healthcarePatterns.some(pattern => req.path.includes(pattern));
  }

  /**
   * Create compliance-specific rate limiter
   */
  createComplianceRateLimiter(complianceType, options = {}) {
    return (req, res, next) => {
      const geoInfo = req.geoInfo || { country: 'UNKNOWN' };
      const config = this.getGeoConfig(geoInfo.country);
      
      // Apply compliance-specific restrictions
      let complianceConfig;
      switch (complianceType) {
        case 'HIPAA':
          complianceConfig = {
            ...config,
            max: Math.floor(config.max * 0.7),
            auditLevel: 'high',
            requiresJustification: true
          };
          break;
        case 'GDPR':
          complianceConfig = {
            ...config,
            max: Math.floor(config.max * 0.5),
            auditLevel: 'maximum',
            requiresConsent: true,
            dataRetention: '2 years'
          };
          break;
        case 'NOM-024':
          complianceConfig = {
            ...config,
            max: Math.floor(config.max * 0.8),
            auditLevel: 'high',
            professionalValidation: true
          };
          break;
        default:
          complianceConfig = config;
      }
      
      const complianceRateLimiter = this.createRateLimiter(complianceConfig, geoInfo);
      complianceRateLimiter(req, res, next);
    };
  }

  /**
   * Create emergency bypass for healthcare emergencies
   */
  createEmergencyBypass() {
    return (req, res, next) => {
      const emergencyHeader = req.headers['x-healthcare-emergency'];
      const emergencyCode = req.headers['x-emergency-code'];
      const emergencyJustification = req.headers['x-emergency-justification'];
      
      if (emergencyHeader === 'true' && emergencyCode && emergencyJustification) {
        // Validate emergency code
        const validEmergencyCodes = process.env.HEALTHCARE_EMERGENCY_CODES?.split(',') || [];
        
        if (validEmergencyCodes.includes(emergencyCode)) {
          // Log emergency bypass
          this.auditLogger.logSecurityIncident(
            req.user?.id || 'anonymous',
            'HEALTHCARE_EMERGENCY_BYPASS',
            {
              ip: req.ip,
              country: req.geoInfo?.country,
              emergencyCode,
              justification: emergencyJustification,
              path: req.path
            }
          );
          
          logger.warn('Healthcare emergency bypass activated', {
            ip: req.ip,
            country: req.geoInfo?.country,
            justification: emergencyJustification
          });
          
          // Skip rate limiting for emergency access
          req.isEmergencyBypass = true;
          return next();
        }
      }
      
      next();
    };
  }

  /**
   * Initialize cleanup intervals
   */
  initializeCleanup() {
    // Clean up geo cache every hour
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.geoCache) {
        if (now - value.timestamp > this.cacheExpiry) {
          this.geoCache.delete(key);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get geographic statistics
   */
  getGeoStats() {
    const stats = {
      totalCachedIPs: this.geoCache.size,
      countriesTracked: new Set(),
      complianceRegions: Object.keys(this.geoConfigs).length,
      blockedCountries: this.blockedCountries.length
    };
    
    // Count countries in cache
    for (const [key, value] of this.geoCache) {
      stats.countriesTracked.add(value.data.country);
    }
    
    stats.countriesTracked = stats.countriesTracked.size;
    
    return stats;
  }
}

module.exports = GeoRateLimitingMiddleware;