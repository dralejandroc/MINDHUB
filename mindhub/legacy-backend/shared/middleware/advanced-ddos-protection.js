/**
 * Advanced DDoS Protection with Machine Learning Detection
 * 
 * Implements sophisticated DDoS protection using pattern recognition,
 * anomaly detection, and behavioral analysis for healthcare APIs
 */

const { EventEmitter } = require('events');
const { logger } = require('../config/logging');
const { getCurrentContext } = require('../config/request-context');
const AuditLogger = require('../utils/audit-logger');

class AdvancedDDoSProtection extends EventEmitter {
  constructor() {
    super();
    this.auditLogger = new AuditLogger();
    
    // Traffic pattern analysis
    this.trafficPatterns = new Map();
    this.suspiciousIPs = new Map();
    this.blockedIPs = new Map();
    
    // Behavioral analysis data
    this.behaviorProfiles = new Map();
    this.anomalyDetector = new AnomalyDetector();
    
    // Threat intelligence
    this.threatIntelligence = new ThreatIntelligence();
    
    // Configuration
    this.config = {
      // Basic thresholds
      rapidRequestThreshold: 100, // requests per minute
      suspiciousPatternThreshold: 50, // suspicious patterns per hour
      
      // Advanced detection
      behaviorAnalysisWindow: 15 * 60 * 1000, // 15 minutes
      anomalyDetectionWindow: 5 * 60 * 1000, // 5 minutes
      
      // Machine learning parameters
      trainingDataSize: 1000,
      anomalyThreshold: 0.8,
      
      // Geographic restrictions
      allowedCountries: ['MX', 'US', 'CA'], // Mexico, USA, Canada
      
      // Healthcare-specific thresholds
      patientDataAccessThreshold: 20, // per 5 minutes
      bulkDataAccessThreshold: 5, // per hour
      
      // Blocking durations
      temporaryBlockDuration: 30 * 60 * 1000, // 30 minutes
      permanentBlockDuration: 24 * 60 * 60 * 1000, // 24 hours
      
      // Emergency bypass
      emergencyBypassEnabled: true,
      emergencyAccessCodes: process.env.EMERGENCY_CODES?.split(',') || []
    };
    
    // Initialize cleanup intervals
    this.initializeCleanupIntervals();
  }

  /**
   * Main DDoS protection middleware
   */
  protect(options = {}) {
    const config = { ...this.config, ...options };
    
    return async (req, res, next) => {
      try {
        const clientIP = req.ip;
        const userAgent = req.headers['user-agent'];
        const context = getCurrentContext();
        
        // 1. Check if IP is permanently blocked
        if (this.isIPBlocked(clientIP)) {
          await this.handleBlockedIP(req, res);
          return;
        }
        
        // 2. Emergency bypass check
        if (config.emergencyBypassEnabled && this.isEmergencyAccess(req)) {
          await this.handleEmergencyAccess(req, res, next);
          return;
        }
        
        // 3. Whitelist check
        if (this.isWhitelisted(clientIP)) {
          return next();
        }
        
        // 4. Geographic restriction check
        if (config.allowedCountries.length > 0) {
          const countryCode = await this.getCountryCode(clientIP);
          if (countryCode && !config.allowedCountries.includes(countryCode)) {
            await this.handleGeographicRestriction(req, res, countryCode);
            return;
          }
        }
        
        // 5. Threat intelligence check
        const threatLevel = await this.threatIntelligence.checkIP(clientIP);
        if (threatLevel === 'HIGH') {
          await this.handleThreatIntelligence(req, res, threatLevel);
          return;
        }
        
        // 6. Behavioral analysis
        const behaviorScore = await this.analyzeBehavior(req, clientIP, userAgent);
        if (behaviorScore > config.anomalyThreshold) {
          await this.handleAnomalousBehavior(req, res, behaviorScore);
          return;
        }
        
        // 7. Pattern recognition
        const patternScore = await this.analyzeTrafficPattern(req, clientIP);
        if (patternScore > config.suspiciousPatternThreshold) {
          await this.handleSuspiciousPattern(req, res, patternScore);
          return;
        }
        
        // 8. Healthcare-specific checks
        if (this.isHealthcareEndpoint(req)) {
          const healthcareRisk = await this.analyzeHealthcareAccess(req, clientIP);
          if (healthcareRisk > 0.7) {
            await this.handleHealthcareRisk(req, res, healthcareRisk);
            return;
          }
        }
        
        // 9. Update tracking data
        await this.updateTrafficData(req, clientIP, userAgent);
        
        // 10. Continue with request
        next();
        
      } catch (error) {
        logger.error('DDoS protection error', {
          error: error.message,
          ip: req.ip,
          path: req.path
        });
        
        // Fail open - continue with request on error
        next();
      }
    };
  }

  /**
   * Analyze behavioral patterns using machine learning
   */
  async analyzeBehavior(req, clientIP, userAgent) {
    try {
      const now = Date.now();
      const behaviorKey = `${clientIP}:${userAgent}`;
      
      // Get or create behavior profile
      if (!this.behaviorProfiles.has(behaviorKey)) {
        this.behaviorProfiles.set(behaviorKey, {
          requests: [],
          patterns: [],
          firstSeen: now,
          lastSeen: now,
          totalRequests: 0,
          uniqueEndpoints: new Set(),
          requestIntervals: [],
          userAgentChanges: 0
        });
      }
      
      const profile = this.behaviorProfiles.get(behaviorKey);
      
      // Update profile
      profile.lastSeen = now;
      profile.totalRequests++;
      profile.uniqueEndpoints.add(req.path);
      
      // Add request to history
      profile.requests.push({
        timestamp: now,
        path: req.path,
        method: req.method,
        size: req.headers['content-length'] || 0,
        userAgent: userAgent
      });
      
      // Keep only recent requests
      const windowStart = now - this.config.behaviorAnalysisWindow;
      profile.requests = profile.requests.filter(r => r.timestamp > windowStart);
      
      // Calculate behavioral metrics
      const metrics = this.calculateBehaviorMetrics(profile);
      
      // Use anomaly detector to score behavior
      const anomalyScore = this.anomalyDetector.detectAnomaly(metrics);
      
      return anomalyScore;
      
    } catch (error) {
      logger.error('Behavior analysis error', { error: error.message, clientIP });
      return 0;
    }
  }

  /**
   * Calculate behavioral metrics for machine learning
   */
  calculateBehaviorMetrics(profile) {
    const now = Date.now();
    const recentRequests = profile.requests.filter(
      r => now - r.timestamp < this.config.behaviorAnalysisWindow
    );
    
    if (recentRequests.length === 0) return { score: 0 };
    
    // Calculate request frequency
    const requestFrequency = recentRequests.length / (this.config.behaviorAnalysisWindow / 60000);
    
    // Calculate request interval variance
    const intervals = [];
    for (let i = 1; i < recentRequests.length; i++) {
      intervals.push(recentRequests[i].timestamp - recentRequests[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Calculate endpoint diversity
    const uniqueEndpoints = new Set(recentRequests.map(r => r.path));
    const endpointDiversity = uniqueEndpoints.size / recentRequests.length;
    
    // Calculate payload size variance
    const payloadSizes = recentRequests.map(r => parseInt(r.size) || 0);
    const avgPayloadSize = payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length;
    const payloadVariance = payloadSizes.reduce((sum, size) => 
      sum + Math.pow(size - avgPayloadSize, 2), 0) / payloadSizes.length;
    
    // Calculate suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(recentRequests);
    
    return {
      requestFrequency,
      intervalVariance,
      endpointDiversity,
      payloadVariance,
      suspiciousPatterns,
      totalRequests: recentRequests.length,
      uniqueEndpoints: uniqueEndpoints.size,
      timeSpan: Math.max(...recentRequests.map(r => r.timestamp)) - Math.min(...recentRequests.map(r => r.timestamp))
    };
  }

  /**
   * Detect suspicious patterns in request sequences
   */
  detectSuspiciousPatterns(requests) {
    let suspiciousScore = 0;
    
    // Pattern 1: Too many requests in short time
    const rapidRequests = requests.filter(r => 
      Date.now() - r.timestamp < 60000 // Last minute
    );
    if (rapidRequests.length > 60) {
      suspiciousScore += 0.3;
    }
    
    // Pattern 2: Identical request intervals (bot behavior)
    const intervals = [];
    for (let i = 1; i < requests.length; i++) {
      intervals.push(requests[i].timestamp - requests[i-1].timestamp);
    }
    
    const uniqueIntervals = new Set(intervals);
    if (intervals.length > 5 && uniqueIntervals.size < 3) {
      suspiciousScore += 0.2;
    }
    
    // Pattern 3: Sequential endpoint access
    const endpoints = requests.map(r => r.path);
    let sequentialAccess = 0;
    for (let i = 1; i < endpoints.length; i++) {
      if (endpoints[i] === endpoints[i-1]) {
        sequentialAccess++;
      }
    }
    
    if (sequentialAccess > endpoints.length * 0.8) {
      suspiciousScore += 0.2;
    }
    
    // Pattern 4: Unusual payload sizes
    const payloadSizes = requests.map(r => parseInt(r.size) || 0);
    const avgSize = payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length;
    const largePayloads = payloadSizes.filter(size => size > avgSize * 10);
    
    if (largePayloads.length > payloadSizes.length * 0.1) {
      suspiciousScore += 0.15;
    }
    
    // Pattern 5: Healthcare-specific suspicious patterns
    const healthcareEndpoints = requests.filter(r => 
      r.path.includes('/patients/') || 
      r.path.includes('/medical-records/') ||
      r.path.includes('/assessments/')
    );
    
    if (healthcareEndpoints.length > requests.length * 0.5) {
      suspiciousScore += 0.15;
    }
    
    return Math.min(suspiciousScore, 1.0);
  }

  /**
   * Analyze traffic patterns for anomalies
   */
  async analyzeTrafficPattern(req, clientIP) {
    const now = Date.now();
    const patternKey = clientIP;
    
    if (!this.trafficPatterns.has(patternKey)) {
      this.trafficPatterns.set(patternKey, {
        requests: [],
        methods: new Map(),
        endpoints: new Map(),
        statusCodes: new Map(),
        firstSeen: now
      });
    }
    
    const pattern = this.trafficPatterns.get(patternKey);
    
    // Add current request
    pattern.requests.push({
      timestamp: now,
      method: req.method,
      path: req.path,
      size: req.headers['content-length'] || 0
    });
    
    // Update method counts
    pattern.methods.set(req.method, (pattern.methods.get(req.method) || 0) + 1);
    
    // Update endpoint counts
    pattern.endpoints.set(req.path, (pattern.endpoints.get(req.path) || 0) + 1);
    
    // Clean old data
    const windowStart = now - this.config.anomalyDetectionWindow;
    pattern.requests = pattern.requests.filter(r => r.timestamp > windowStart);
    
    // Calculate pattern score
    const patternScore = this.calculatePatternScore(pattern);
    
    return patternScore;
  }

  /**
   * Calculate pattern anomaly score
   */
  calculatePatternScore(pattern) {
    let score = 0;
    
    // High frequency requests
    const requestsPerMinute = pattern.requests.length / (this.config.anomalyDetectionWindow / 60000);
    if (requestsPerMinute > 100) score += 30;
    else if (requestsPerMinute > 50) score += 20;
    else if (requestsPerMinute > 20) score += 10;
    
    // Method diversity (suspicious if too uniform)
    const methodDiversity = pattern.methods.size / pattern.requests.length;
    if (methodDiversity < 0.1) score += 15;
    
    // Endpoint concentration (suspicious if too focused)
    const topEndpointCount = Math.max(...pattern.endpoints.values());
    const endpointConcentration = topEndpointCount / pattern.requests.length;
    if (endpointConcentration > 0.8) score += 20;
    
    // Unusual request sizes
    const avgSize = pattern.requests.reduce((sum, r) => sum + parseInt(r.size), 0) / pattern.requests.length;
    const largeRequests = pattern.requests.filter(r => parseInt(r.size) > avgSize * 5);
    if (largeRequests.length > pattern.requests.length * 0.2) score += 15;
    
    return score;
  }

  /**
   * Analyze healthcare-specific access patterns
   */
  async analyzeHealthcareAccess(req, clientIP) {
    const now = Date.now();
    const healthcareKey = `healthcare:${clientIP}`;
    
    if (!this.behaviorProfiles.has(healthcareKey)) {
      this.behaviorProfiles.set(healthcareKey, {
        patientAccess: new Map(),
        bulkAccess: 0,
        sensitiveEndpoints: 0,
        lastAccess: now
      });
    }
    
    const profile = this.behaviorProfiles.get(healthcareKey);
    
    // Track patient data access
    if (req.params.patientId) {
      const patientAccess = profile.patientAccess.get(req.params.patientId) || 0;
      profile.patientAccess.set(req.params.patientId, patientAccess + 1);
    }
    
    // Track bulk access patterns
    if (req.path.includes('/bulk') || req.path.includes('/export')) {
      profile.bulkAccess++;
    }
    
    // Track sensitive endpoint access
    if (this.isSensitiveEndpoint(req.path)) {
      profile.sensitiveEndpoints++;
    }
    
    // Calculate healthcare risk score
    let riskScore = 0;
    
    // Multiple patient access
    if (profile.patientAccess.size > 10) riskScore += 0.3;
    
    // Bulk access
    if (profile.bulkAccess > 3) riskScore += 0.4;
    
    // Sensitive endpoint access
    if (profile.sensitiveEndpoints > 20) riskScore += 0.3;
    
    return Math.min(riskScore, 1.0);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    if (!this.blockedIPs.has(ip)) return false;
    
    const blockInfo = this.blockedIPs.get(ip);
    const now = Date.now();
    
    if (now > blockInfo.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Check if request is emergency access
   */
  isEmergencyAccess(req) {
    const emergencyHeader = req.headers['x-emergency-access'];
    const emergencyCode = req.headers['x-emergency-code'];
    
    return emergencyHeader === 'true' && 
           this.config.emergencyAccessCodes.includes(emergencyCode);
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelisted(ip) {
    const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
    return whitelistedIPs.includes(ip);
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
      '/clinical-notes/'
    ];
    
    return healthcarePatterns.some(pattern => req.path.includes(pattern));
  }

  /**
   * Check if endpoint is sensitive
   */
  isSensitiveEndpoint(path) {
    const sensitivePatterns = [
      '/admin/',
      '/bulk/',
      '/export/',
      '/reports/',
      '/audit/'
    ];
    
    return sensitivePatterns.some(pattern => path.includes(pattern));
  }

  /**
   * Get country code from IP
   */
  async getCountryCode(ip) {
    // In production, use a geo-IP service
    // For now, return null to skip geo-restrictions
    return null;
  }

  /**
   * Handle various threat scenarios
   */
  async handleBlockedIP(req, res) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'BLOCKED_IP_ACCESS_ATTEMPT',
      {
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent']
      }
    );
    
    res.status(403).json({
      error: {
        code: 'IP_BLOCKED',
        message: 'Access denied from this IP address',
        type: 'security_block'
      }
    });
  }

  async handleEmergencyAccess(req, res, next) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'EMERGENCY_ACCESS_GRANTED',
      {
        ip: req.ip,
        path: req.path,
        emergencyCode: req.headers['x-emergency-code']
      }
    );
    
    logger.warn('Emergency access granted', {
      ip: req.ip,
      path: req.path,
      user: req.user?.id
    });
    
    next();
  }

  async handleGeographicRestriction(req, res, countryCode) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'GEOGRAPHIC_RESTRICTION_VIOLATION',
      {
        ip: req.ip,
        countryCode,
        path: req.path
      }
    );
    
    res.status(403).json({
      error: {
        code: 'GEOGRAPHIC_RESTRICTION',
        message: 'Access not allowed from this geographic location',
        type: 'geo_restriction'
      }
    });
  }

  async handleThreatIntelligence(req, res, threatLevel) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'THREAT_INTELLIGENCE_BLOCK',
      {
        ip: req.ip,
        threatLevel,
        path: req.path
      }
    );
    
    res.status(403).json({
      error: {
        code: 'THREAT_DETECTED',
        message: 'IP address flagged by threat intelligence',
        type: 'threat_intelligence'
      }
    });
  }

  async handleAnomalousBehavior(req, res, behaviorScore) {
    const blockDuration = behaviorScore > 0.9 ? 
      this.config.permanentBlockDuration : 
      this.config.temporaryBlockDuration;
    
    this.blockedIPs.set(req.ip, {
      reason: 'anomalous_behavior',
      score: behaviorScore,
      blockedAt: Date.now(),
      expiresAt: Date.now() + blockDuration
    });
    
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'ANOMALOUS_BEHAVIOR_DETECTED',
      {
        ip: req.ip,
        behaviorScore,
        blockDuration,
        path: req.path
      }
    );
    
    res.status(429).json({
      error: {
        code: 'ANOMALOUS_BEHAVIOR',
        message: 'Suspicious behavior detected, access temporarily restricted',
        type: 'behavior_analysis'
      }
    });
  }

  async handleSuspiciousPattern(req, res, patternScore) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'SUSPICIOUS_PATTERN_DETECTED',
      {
        ip: req.ip,
        patternScore,
        path: req.path
      }
    );
    
    res.status(429).json({
      error: {
        code: 'SUSPICIOUS_PATTERN',
        message: 'Suspicious traffic pattern detected',
        type: 'pattern_analysis'
      }
    });
  }

  async handleHealthcareRisk(req, res, riskScore) {
    await this.auditLogger.logSecurityIncident(
      req.user?.id || 'anonymous',
      'HEALTHCARE_RISK_DETECTED',
      {
        ip: req.ip,
        riskScore,
        path: req.path
      }
    );
    
    res.status(429).json({
      error: {
        code: 'HEALTHCARE_RISK',
        message: 'Healthcare data access risk detected',
        type: 'healthcare_protection'
      }
    });
  }

  /**
   * Update traffic tracking data
   */
  async updateTrafficData(req, clientIP, userAgent) {
    const now = Date.now();
    
    // Update traffic patterns
    const patternKey = clientIP;
    if (this.trafficPatterns.has(patternKey)) {
      const pattern = this.trafficPatterns.get(patternKey);
      pattern.requests.push({
        timestamp: now,
        method: req.method,
        path: req.path,
        statusCode: null // Will be updated in response
      });
    }
    
    // Update behavior profiles
    const behaviorKey = `${clientIP}:${userAgent}`;
    if (this.behaviorProfiles.has(behaviorKey)) {
      const profile = this.behaviorProfiles.get(behaviorKey);
      profile.lastSeen = now;
      profile.totalRequests++;
    }
  }

  /**
   * Initialize cleanup intervals
   */
  initializeCleanupIntervals() {
    // Clean up old traffic patterns every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      for (const [key, pattern] of this.trafficPatterns) {
        if (now - pattern.firstSeen > maxAge) {
          this.trafficPatterns.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    
    // Clean up old behavior profiles every 10 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      
      for (const [key, profile] of this.behaviorProfiles) {
        if (now - profile.lastSeen > maxAge) {
          this.behaviorProfiles.delete(key);
        }
      }
    }, 10 * 60 * 1000);
    
    // Clean up expired blocked IPs every minute
    setInterval(() => {
      const now = Date.now();
      
      for (const [ip, blockInfo] of this.blockedIPs) {
        if (now > blockInfo.expiresAt) {
          this.blockedIPs.delete(ip);
        }
      }
    }, 60 * 1000);
  }
}

/**
 * Simple anomaly detector using statistical methods
 */
class AnomalyDetector {
  constructor() {
    this.trainingData = [];
    this.threshold = 0.8;
  }

  /**
   * Detect anomaly in behavioral metrics
   */
  detectAnomaly(metrics) {
    // Simple anomaly detection using z-score
    const features = [
      metrics.requestFrequency || 0,
      metrics.intervalVariance || 0,
      metrics.endpointDiversity || 0,
      metrics.suspiciousPatterns || 0
    ];
    
    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Calculate anomaly score
    const anomalyScore = this.calculateAnomalyScore(normalizedFeatures);
    
    return anomalyScore;
  }

  normalizeFeatures(features) {
    // Simple min-max normalization
    const maxValues = [200, 10000, 1, 1]; // Expected max values
    
    return features.map((feature, index) => {
      return Math.min(feature / maxValues[index], 1);
    });
  }

  calculateAnomalyScore(features) {
    // Simple distance-based anomaly detection
    const baseline = [0.1, 0.1, 0.5, 0.1]; // Normal behavior baseline
    
    let distance = 0;
    for (let i = 0; i < features.length; i++) {
      distance += Math.pow(features[i] - baseline[i], 2);
    }
    
    const anomalyScore = Math.sqrt(distance) / features.length;
    
    return Math.min(anomalyScore, 1.0);
  }
}

/**
 * Threat intelligence service
 */
class ThreatIntelligence {
  constructor() {
    this.knownThreats = new Set();
    this.threatCache = new Map();
  }

  async checkIP(ip) {
    // Check cache first
    if (this.threatCache.has(ip)) {
      return this.threatCache.get(ip);
    }
    
    // Check known threats
    if (this.knownThreats.has(ip)) {
      this.threatCache.set(ip, 'HIGH');
      return 'HIGH';
    }
    
    // In production, integrate with threat intelligence APIs
    // For now, return LOW for all IPs
    this.threatCache.set(ip, 'LOW');
    return 'LOW';
  }

  addThreat(ip, threatLevel = 'HIGH') {
    this.knownThreats.add(ip);
    this.threatCache.set(ip, threatLevel);
  }

  removeThreat(ip) {
    this.knownThreats.delete(ip);
    this.threatCache.delete(ip);
  }
}

module.exports = AdvancedDDoSProtection;