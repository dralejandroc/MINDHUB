/**
 * Real-time Rate Limiting Dashboard
 * 
 * Provides monitoring and management endpoints for rate limiting,
 * security events, and DDoS protection
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../middleware');
const { logger } = require('../config/logging');
const AuditLogger = require('../utils/audit-logger');
const { getCurrentMetrics } = require('../middleware/performance-monitoring');

const router = express.Router();
const auditLogger = new AuditLogger();

// In-memory storage for demo (use Redis in production)
const rateLimitStats = {
  violations: new Map(),
  blockedIPs: new Map(),
  suspiciousActivity: new Map(),
  emergencyAccess: new Map(),
  geographicBlocks: new Map(),
  apiUsage: new Map()
};

/**
 * GET /api/rate-limiting/dashboard/overview
 * Get rate limiting overview metrics
 */
router.get('/dashboard/overview',
  ...middleware.utils.forRoles(['admin'], ['read:system_metrics']),
  async (req, res) => {
    try {
      const now = Date.now();
      const last24h = now - (24 * 60 * 60 * 1000);
      const lastHour = now - (60 * 60 * 1000);
      
      // Get performance metrics
      const performanceMetrics = getCurrentMetrics();
      
      // Calculate rate limiting metrics
      const overview = {
        timestamp: new Date().toISOString(),
        
        // Request metrics
        requests: {
          total: performanceMetrics.requests.total || 0,
          last24h: getRequestsInTimeframe(last24h),
          lastHour: getRequestsInTimeframe(lastHour),
          averageResponseTime: performanceMetrics.requests.averageTime || 0,
          slowRequests: performanceMetrics.requests.slowRequests || 0
        },
        
        // Rate limiting violations
        violations: {
          total: Array.from(rateLimitStats.violations.values()).reduce((sum, v) => sum + v.count, 0),
          last24h: getViolationsInTimeframe(last24h),
          lastHour: getViolationsInTimeframe(lastHour),
          byType: getViolationsByType(),
          topViolatingIPs: getTopViolatingIPs(10)
        },
        
        // Security events
        security: {
          blockedIPs: rateLimitStats.blockedIPs.size,
          suspiciousActivity: rateLimitStats.suspiciousActivity.size,
          emergencyAccess: rateLimitStats.emergencyAccess.size,
          geographicBlocks: rateLimitStats.geographicBlocks.size,
          threatLevel: calculateOverallThreatLevel()
        },
        
        // API usage patterns
        apiUsage: {
          endpoints: getTopEndpoints(10),
          methods: getMethodDistribution(),
          userAgents: getTopUserAgents(10),
          responseStatuses: getResponseStatusDistribution()
        },
        
        // System health
        systemHealth: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime(),
          status: performanceMetrics.health?.status || 'unknown'
        }
      };
      
      res.json({
        success: true,
        data: overview
      });
      
    } catch (error) {
      logger.error('Failed to get rate limiting overview', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve rate limiting overview',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/rate-limiting/dashboard/violations
 * Get detailed rate limiting violations
 */
router.get('/dashboard/violations',
  ...middleware.utils.forRoles(['admin'], ['read:system_metrics']),
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('ip').optional().isIP().withMessage('Invalid IP address'),
    query('type').optional().isIn(['auth', 'api', 'patient_data', 'form_submission', 'search', 'upload', 'public']),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const {
        startDate,
        endDate,
        ip,
        type,
        limit = 100,
        offset = 0
      } = req.query;
      
      // Filter violations based on query parameters
      let violations = Array.from(rateLimitStats.violations.entries()).map(([key, data]) => ({
        id: key,
        ...data
      }));
      
      // Apply filters
      if (startDate) {
        const start = new Date(startDate).getTime();
        violations = violations.filter(v => v.timestamp >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate).getTime();
        violations = violations.filter(v => v.timestamp <= end);
      }
      
      if (ip) {
        violations = violations.filter(v => v.ip === ip);
      }
      
      if (type) {
        violations = violations.filter(v => v.type === type);
      }
      
      // Sort by timestamp (newest first)
      violations.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply pagination
      const totalCount = violations.length;
      const paginatedViolations = violations.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        data: {
          violations: paginatedViolations,
          pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to get rate limiting violations', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve rate limiting violations',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/rate-limiting/dashboard/blocked-ips
 * Get currently blocked IP addresses
 */
router.get('/dashboard/blocked-ips',
  ...middleware.utils.forRoles(['admin'], ['read:system_metrics']),
  async (req, res) => {
    try {
      const blockedIPs = Array.from(rateLimitStats.blockedIPs.entries()).map(([ip, data]) => ({
        ip,
        ...data,
        timeRemaining: Math.max(0, data.expiresAt - Date.now())
      }));
      
      // Sort by block time (newest first)
      blockedIPs.sort((a, b) => b.blockedAt - a.blockedAt);
      
      res.json({
        success: true,
        data: {
          blockedIPs,
          totalCount: blockedIPs.length,
          activeBlocks: blockedIPs.filter(ip => ip.timeRemaining > 0).length
        }
      });
      
    } catch (error) {
      logger.error('Failed to get blocked IPs', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve blocked IPs',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/rate-limiting/dashboard/block-ip
 * Manually block an IP address
 */
router.post('/dashboard/block-ip',
  ...middleware.utils.forRoles(['admin'], ['write:system_config']),
  [
    body('ip').isIP().withMessage('Valid IP address is required'),
    body('reason').isString().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer (minutes)'),
    body('permanent').optional().isBoolean().withMessage('Permanent must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { ip, reason, duration = 60, permanent = false } = req.body;
      const userId = req.user.id;
      
      // Calculate expiration time
      const now = Date.now();
      const expiresAt = permanent ? now + (365 * 24 * 60 * 60 * 1000) : now + (duration * 60 * 1000);
      
      // Add to blocked IPs
      rateLimitStats.blockedIPs.set(ip, {
        reason,
        blockedAt: now,
        expiresAt,
        blockedBy: userId,
        permanent,
        manual: true
      });
      
      // Log the manual block
      await auditLogger.logSecurityIncident(
        userId,
        'MANUAL_IP_BLOCK',
        {
          ip,
          reason,
          duration,
          permanent,
          adminAction: true
        }
      );
      
      logger.warn('IP manually blocked', {
        ip,
        reason,
        duration,
        permanent,
        userId
      });
      
      res.json({
        success: true,
        message: 'IP address blocked successfully',
        data: {
          ip,
          reason,
          blockedAt: now,
          expiresAt,
          permanent
        }
      });
      
    } catch (error) {
      logger.error('Failed to block IP', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to block IP address',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/rate-limiting/dashboard/unblock-ip/:ip
 * Unblock an IP address
 */
router.delete('/dashboard/unblock-ip/:ip',
  ...middleware.utils.forRoles(['admin'], ['write:system_config']),
  [
    param('ip').isIP().withMessage('Valid IP address is required'),
    body('reason').optional().isString().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { ip } = req.params;
      const { reason = 'Manual unblock by admin' } = req.body;
      const userId = req.user.id;
      
      // Check if IP is blocked
      if (!rateLimitStats.blockedIPs.has(ip)) {
        return res.status(404).json({
          success: false,
          error: 'IP address is not currently blocked'
        });
      }
      
      // Remove from blocked IPs
      const blockInfo = rateLimitStats.blockedIPs.get(ip);
      rateLimitStats.blockedIPs.delete(ip);
      
      // Log the unblock
      await auditLogger.logSecurityIncident(
        userId,
        'MANUAL_IP_UNBLOCK',
        {
          ip,
          reason,
          previousBlock: blockInfo,
          adminAction: true
        }
      );
      
      logger.info('IP manually unblocked', {
        ip,
        reason,
        userId,
        previousBlock: blockInfo
      });
      
      res.json({
        success: true,
        message: 'IP address unblocked successfully',
        data: {
          ip,
          reason,
          unblockedAt: Date.now(),
          previousBlock: blockInfo
        }
      });
      
    } catch (error) {
      logger.error('Failed to unblock IP', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to unblock IP address',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/rate-limiting/dashboard/suspicious-activity
 * Get suspicious activity reports
 */
router.get('/dashboard/suspicious-activity',
  ...middleware.utils.forRoles(['admin'], ['read:system_metrics']),
  async (req, res) => {
    try {
      const suspiciousActivity = Array.from(rateLimitStats.suspiciousActivity.entries()).map(([key, data]) => ({
        id: key,
        ...data
      }));
      
      // Sort by timestamp (newest first)
      suspiciousActivity.sort((a, b) => b.timestamp - a.timestamp);
      
      res.json({
        success: true,
        data: {
          suspiciousActivity,
          totalCount: suspiciousActivity.length,
          highRiskCount: suspiciousActivity.filter(a => a.riskLevel === 'HIGH').length,
          mediumRiskCount: suspiciousActivity.filter(a => a.riskLevel === 'MEDIUM').length
        }
      });
      
    } catch (error) {
      logger.error('Failed to get suspicious activity', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve suspicious activity',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/rate-limiting/dashboard/real-time-feed
 * Get real-time security events feed
 */
router.get('/dashboard/real-time-feed',
  ...middleware.utils.forRoles(['admin'], ['read:system_metrics']),
  async (req, res) => {
    try {
      // Set headers for Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      // Send initial data
      const initialData = {
        type: 'initial',
        timestamp: new Date().toISOString(),
        data: {
          violations: rateLimitStats.violations.size,
          blockedIPs: rateLimitStats.blockedIPs.size,
          suspiciousActivity: rateLimitStats.suspiciousActivity.size
        }
      };
      
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);
      
      // Set up periodic updates
      const updateInterval = setInterval(() => {
        const updateData = {
          type: 'update',
          timestamp: new Date().toISOString(),
          data: {
            violations: rateLimitStats.violations.size,
            blockedIPs: rateLimitStats.blockedIPs.size,
            suspiciousActivity: rateLimitStats.suspiciousActivity.size,
            systemHealth: {
              memoryUsage: process.memoryUsage().heapUsed,
              cpuUsage: process.cpuUsage().user + process.cpuUsage().system,
              uptime: process.uptime()
            }
          }
        };
        
        res.write(`data: ${JSON.stringify(updateData)}\n\n`);
      }, 5000); // Update every 5 seconds
      
      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(updateInterval);
      });
      
    } catch (error) {
      logger.error('Failed to establish real-time feed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to establish real-time feed',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/rate-limiting/dashboard/config
 * Update rate limiting configuration
 */
router.put('/dashboard/config',
  ...middleware.utils.forRoles(['admin'], ['write:system_config']),
  [
    body('type').isIn(['auth', 'api', 'patient_data', 'form_submission', 'search', 'upload', 'public']).withMessage('Invalid rate limit type'),
    body('windowMs').isInt({ min: 1000 }).withMessage('Window must be at least 1000ms'),
    body('max').isInt({ min: 1 }).withMessage('Max requests must be at least 1'),
    body('enabled').optional().isBoolean().withMessage('Enabled must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { type, windowMs, max, enabled = true } = req.body;
      const userId = req.user.id;
      
      // Update configuration (in production, this would update persistent config)
      const configUpdate = {
        type,
        windowMs,
        max,
        enabled,
        updatedAt: Date.now(),
        updatedBy: userId
      };
      
      // Log configuration change
      await auditLogger.logDataModification(
        userId,
        'RATE_LIMIT_CONFIG_UPDATE',
        {
          configType: type,
          changes: configUpdate,
          adminAction: true
        }
      );
      
      logger.info('Rate limiting configuration updated', {
        configUpdate,
        userId
      });
      
      res.json({
        success: true,
        message: 'Rate limiting configuration updated successfully',
        data: configUpdate
      });
      
    } catch (error) {
      logger.error('Failed to update rate limiting config', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to update rate limiting configuration',
        details: error.message
      });
    }
  }
);

// Helper functions
function getRequestsInTimeframe(startTime) {
  // This would integrate with actual request tracking
  return Math.floor(Math.random() * 10000); // Mock data
}

function getViolationsInTimeframe(startTime) {
  let count = 0;
  for (const [key, data] of rateLimitStats.violations) {
    if (data.timestamp >= startTime) {
      count += data.count;
    }
  }
  return count;
}

function getViolationsByType() {
  const typeStats = {};
  for (const [key, data] of rateLimitStats.violations) {
    typeStats[data.type] = (typeStats[data.type] || 0) + data.count;
  }
  return typeStats;
}

function getTopViolatingIPs(limit) {
  const ipStats = {};
  for (const [key, data] of rateLimitStats.violations) {
    ipStats[data.ip] = (ipStats[data.ip] || 0) + data.count;
  }
  
  return Object.entries(ipStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([ip, count]) => ({ ip, count }));
}

function getTopEndpoints(limit) {
  // Mock data - in production, this would come from actual request tracking
  return [
    { endpoint: '/api/v1/patients', count: 1500 },
    { endpoint: '/api/v1/assessments', count: 1200 },
    { endpoint: '/api/v1/forms', count: 800 },
    { endpoint: '/api/v1/resources', count: 600 }
  ].slice(0, limit);
}

function getMethodDistribution() {
  return {
    GET: 65,
    POST: 25,
    PUT: 7,
    DELETE: 3
  };
}

function getTopUserAgents(limit) {
  return [
    { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', count: 500 },
    { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', count: 300 },
    { userAgent: 'PostmanRuntime/7.32.3', count: 200 }
  ].slice(0, limit);
}

function getResponseStatusDistribution() {
  return {
    200: 85,
    404: 8,
    429: 4,
    500: 2,
    401: 1
  };
}

function calculateOverallThreatLevel() {
  const blockedCount = rateLimitStats.blockedIPs.size;
  const suspiciousCount = rateLimitStats.suspiciousActivity.size;
  
  if (blockedCount > 50 || suspiciousCount > 100) return 'HIGH';
  if (blockedCount > 20 || suspiciousCount > 50) return 'MEDIUM';
  return 'LOW';
}

module.exports = router;