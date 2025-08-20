/**
 * Routing Middleware for Integrix API Gateway
 * 
 * Handles request routing, service discovery, and load balancing
 */

const serviceRegistry = require('../services/service-registry');
const serviceDiscovery = require('../services/service-discovery');
const routingRules = require('../config/routing-rules');
const { logger } = require('../../shared/config/storage');

class RoutingMiddleware {
  /**
   * Main routing middleware
   */
  static routeRequest() {
    return async (req, res, next) => {
      try {
        // Add request ID if not present
        if (!req.requestId) {
          req.requestId = require('crypto').randomUUID();
          res.locals.requestId = req.requestId;
        }
        
        // Extract service name from path
        const pathParts = req.path.split('/').filter(Boolean);
        let serviceName = null;
        
        // Check if it's a versioned API path
        if (pathParts[0] === 'api' && pathParts[1]?.startsWith('v')) {
          serviceName = pathParts[2];
        } else if (pathParts[0] === 'api') {
          serviceName = pathParts[1];
        }
        
        if (!serviceName) {
          return next(); // Let other middleware handle
        }
        
        // Check routing rules
        const endpointConfig = routingRules.getEndpointConfig(req.path);
        if (endpointConfig) {
          req.endpointConfig = endpointConfig;
          serviceName = endpointConfig.hub;
        }
        
        // Discover service
        try {
          const serviceInfo = await serviceDiscovery.discoverService(serviceName);
          if (!serviceInfo) {
            return res.status(503).json({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: `Service '${serviceName}' is not available`,
                service: serviceName,
                requestId: req.requestId
              }
            });
          }
          
          // Add service info to request
          req.serviceInfo = serviceInfo;
          req.serviceName = serviceName;
          
          // Record successful discovery
          serviceDiscovery.recordSuccess(serviceName);
          
          next();
        } catch (error) {
          // Handle circuit breaker errors
          if (error.message.includes('Circuit breaker open')) {
            return res.status(503).json({
              error: {
                code: 'SERVICE_CIRCUIT_OPEN',
                message: `Service '${serviceName}' is temporarily unavailable`,
                service: serviceName,
                requestId: req.requestId
              }
            });
          }
          
          // Record failure
          serviceDiscovery.recordFailure(serviceName, error);
          
          throw error;
        }
        
      } catch (error) {
        logger.error('Routing middleware error:', error);
        return res.status(500).json({
          error: {
            code: 'ROUTING_ERROR',
            message: 'Failed to route request',
            requestId: req.requestId
          }
        });
      }
    };
  }
  
  /**
   * Service authorization middleware
   */
  static authorizeService() {
    return (req, res, next) => {
      if (!req.endpointConfig) {
        return next();
      }
      
      const { authentication, authorization } = req.endpointConfig;
      
      // Check if authentication is required
      if (authentication && !req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            requestId: req.requestId
          }
        });
      }
      
      // Check authorization
      if (authorization && req.user) {
        const userRole = req.user.role || 'patient';
        if (!authorization.includes(userRole) && !authorization.includes('*')) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
              required: authorization,
              userRole,
              requestId: req.requestId
            }
          });
        }
      }
      
      next();
    };
  }
  
  /**
   * Rate limiting middleware based on endpoint config
   */
  static applyRateLimit() {
    const rateLimiters = new Map();
    
    return (req, res, next) => {
      if (!req.endpointConfig?.rateLimit) {
        return next();
      }
      
      const { window, max } = req.endpointConfig.rateLimit;
      const key = `${req.path}:${window}:${max}`;
      
      // Get or create rate limiter for this endpoint
      if (!rateLimiters.has(key)) {
        const rateLimit = require('express-rate-limit');
        const limiter = rateLimit({
          windowMs: this.parseTimeWindow(window),
          max: max,
          message: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
              retryAfter: window,
              requestId: req.requestId
            }
          },
          standardHeaders: true,
          legacyHeaders: false
        });
        
        rateLimiters.set(key, limiter);
      }
      
      const limiter = rateLimiters.get(key);
      limiter(req, res, next);
    };
  }
  
  /**
   * Parse time window string to milliseconds
   * @param {string} window - Time window (e.g., '15m', '1h')
   * @returns {number} Milliseconds
   */
  static parseTimeWindow(window) {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // Default 15 minutes
    
    const [, value, unit] = match;
    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000
    };
    
    return parseInt(value) * (multipliers[unit] || 60000);
  }
  
  /**
   * Request validation middleware
   */
  static validateRequest() {
    return (req, res, next) => {
      if (!req.endpointConfig) {
        return next();
      }
      
      const { methods } = req.endpointConfig;
      
      // Validate HTTP method
      if (methods && !methods.includes(req.method)) {
        return res.status(405).json({
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${req.method} not allowed for this endpoint`,
            allowedMethods: methods,
            requestId: req.requestId
          }
        });
      }
      
      next();
    };
  }
  
  /**
   * Cross-hub request correlation
   */
  static correlateRequests() {
    return (req, res, next) => {
      // Add correlation headers
      res.set('X-Request-ID', req.requestId);
      res.set('X-Service', req.serviceName || 'gateway');
      
      // Add correlation to outgoing requests
      if (req.headers['x-correlation-id']) {
        req.correlationId = req.headers['x-correlation-id'];
      } else {
        req.correlationId = req.requestId;
      }
      
      res.set('X-Correlation-ID', req.correlationId);
      
      next();
    };
  }
  
  /**
   * Service health check middleware
   */
  static checkServiceHealth() {
    return async (req, res, next) => {
      if (!req.serviceInfo) {
        return next();
      }
      
      const service = serviceRegistry.getService(req.serviceName);
      if (!service || !service.state.isHealthy) {
        logger.warn(`Unhealthy service accessed: ${req.serviceName}`);
        
        // Allow request but add warning header
        res.set('X-Service-Health', 'degraded');
      }
      
      next();
    };
  }
  
  /**
   * Request logging middleware
   */
  static logRequests() {
    return (req, res, next) => {
      const startTime = Date.now();
      req.startTime = startTime;
      
      // Log request
      logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        service: req.serviceName,
        requestId: req.requestId,
        correlationId: req.correlationId,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Log response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.info('Request completed', {
          method: req.method,
          path: req.path,
          service: req.serviceName,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          requestId: req.requestId,
          correlationId: req.correlationId
        });
        
        // Record metrics
        if (req.serviceName) {
          serviceRegistry.recordRequest(req.serviceName, {
            success: res.statusCode < 400,
            latency: duration
          });
        }
      });
      
      next();
    };
  }
  
  /**
   * Error handling middleware
   */
  static handleErrors() {
    return (err, req, res, next) => {
      logger.error('Request error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });
      
      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: isDevelopment ? err.message : 'An error occurred',
          requestId: req.requestId,
          ...(isDevelopment && { stack: err.stack })
        }
      });
    };
  }
}

module.exports = RoutingMiddleware;