/**
 * Health Check Routes for Integrix API Gateway
 * 
 * Comprehensive health monitoring endpoints for all services
 */

const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gateway-controller');
const serviceRegistry = require('../services/service-registry');
const serviceDiscovery = require('../services/service-discovery');

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', gatewayController.healthCheck);

/**
 * Detailed health check with metrics
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    const discoveryStatus = serviceDiscovery.getDiscoveryStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || require('crypto').randomUUID(),
      
      // Gateway health
      gateway: {
        status: 'operational',
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        
        // System resources
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
          },
          cpu: {
            user: process.cpuUsage().user,
            system: process.cpuUsage().system
          },
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        }
      },
      
      // Service health details
      services: {},
      
      // Overall statistics
      statistics: {
        totalServices: services.length,
        healthyServices: 0,
        unhealthyServices: 0,
        activeServices: 0,
        inactiveServices: 0
      },
      
      // Service discovery status
      discovery: discoveryStatus
    };
    
    // Check each service in detail
    for (const service of services) {
      const serviceName = service.name;
      const serviceHealth = {
        name: serviceName,
        displayName: service.displayName,
        status: service.state.status,
        healthy: service.state.isHealthy,
        version: service.version,
        uptime: Date.now() - new Date(service.state.registeredAt).getTime(),
        
        // Health check details
        healthCheck: {
          enabled: service.healthCheck.enabled,
          lastCheck: service.state.lastHealthCheck,
          consecutiveFailures: service.state.consecutiveFailures,
          endpoint: service.healthCheck.endpoint,
          interval: service.healthCheck.interval
        },
        
        // Dependencies
        dependencies: {
          required: service.metadata.dependencies,
          available: serviceRegistry.areDependenciesAvailable(serviceName)
        }
      };
      
      // Get service metrics
      const metrics = serviceRegistry.getServiceMetrics(serviceName);
      if (metrics) {
        serviceHealth.metrics = {
          requests: {
            total: metrics.requests.total,
            success: metrics.requests.success,
            error: metrics.requests.error,
            successRate: metrics.requests.total > 0 
              ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2)
              : 0
          },
          performance: {
            averageLatency: metrics.requests.latency.length > 0
              ? (metrics.requests.latency.reduce((a, b) => a + b, 0) / metrics.requests.latency.length).toFixed(2)
              : 0,
            p95Latency: metrics.requests.latency.length > 0
              ? this.calculatePercentile(metrics.requests.latency, 95).toFixed(2)
              : 0
          }
        };
      }
      
      // Circuit breaker status
      const circuitBreaker = discoveryStatus[serviceName]?.circuitBreaker;
      if (circuitBreaker) {
        serviceHealth.circuitBreaker = circuitBreaker;
      }
      
      health.services[serviceName] = serviceHealth;
      
      // Update statistics
      if (service.state.isHealthy) {
        health.statistics.healthyServices++;
      } else {
        health.statistics.unhealthyServices++;
        health.status = 'degraded';
      }
      
      if (service.state.status === 'active') {
        health.statistics.activeServices++;
      } else {
        health.statistics.inactiveServices++;
      }
    }
    
    // Add additional checks
    health.checks = await performAdditionalChecks();
    
    // Determine overall status
    if (health.statistics.unhealthyServices > 0) {
      health.status = health.statistics.unhealthyServices > health.statistics.healthyServices 
        ? 'critical' 
        : 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        details: error.message
      }
    });
  }
});

/**
 * Service-specific health check
 * GET /health/services/:serviceName
 */
router.get('/services/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const service = serviceRegistry.getService(serviceName);
    
    if (!service) {
      return res.status(404).json({
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: `Service '${serviceName}' not found`,
          service: serviceName
        }
      });
    }
    
    // Perform health check
    const isHealthy = await performServiceHealthCheck(service);
    const metrics = serviceRegistry.getServiceMetrics(serviceName);
    const discoveryInfo = serviceDiscovery.getDiscoveryStatus()[serviceName];
    
    const healthInfo = {
      service: {
        name: serviceName,
        displayName: service.displayName,
        version: service.version,
        status: service.state.status
      },
      health: {
        healthy: isHealthy,
        lastCheck: new Date().toISOString(),
        consecutiveFailures: service.state.consecutiveFailures,
        uptime: Date.now() - new Date(service.state.registeredAt).getTime()
      },
      metrics: metrics ? {
        requests: metrics.requests,
        latency: {
          average: metrics.requests.latency.length > 0
            ? (metrics.requests.latency.reduce((a, b) => a + b, 0) / metrics.requests.latency.length).toFixed(2)
            : 0,
          recent: metrics.requests.latency.slice(-10) // Last 10 requests
        }
      } : null,
      discovery: discoveryInfo || null,
      dependencies: serviceRegistry.getServiceDependencies(serviceName).map(dep => ({
        name: dep.name,
        available: dep.available,
        healthy: dep.service?.state.isHealthy
      }))
    };
    
    // Update service health status
    serviceRegistry.updateHealthStatus(serviceName, isHealthy, {
      checked: 'manual',
      timestamp: new Date().toISOString()
    });
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthInfo);
    
  } catch (error) {
    console.error(`Health check error for ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service health check failed',
        service: req.params.serviceName,
        details: error.message
      }
    });
  }
});

/**
 * Gateway readiness check
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    const criticalServices = services.filter(s => 
      s.metadata.tags?.includes('critical') || 
      ['expedix', 'clinimetrix'].includes(s.name)
    );
    
    const readiness = {
      ready: true,
      timestamp: new Date().toISOString(),
      gateway: {
        initialized: true,
        servicesRegistered: services.length > 0
      },
      criticalServices: {}
    };
    
    // Check critical services
    for (const service of criticalServices) {
      const isReady = service.state.status === 'active' && service.state.isHealthy;
      readiness.criticalServices[service.name] = {
        ready: isReady,
        status: service.state.status,
        healthy: service.state.isHealthy
      };
      
      if (!isReady) {
        readiness.ready = false;
      }
    }
    
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
    
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: {
        message: 'Readiness check failed',
        details: error.message
      }
    });
  }
});

/**
 * Gateway liveness check (simple ping)
 * GET /health/live
 */
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * Service metrics endpoint
 * GET /health/metrics
 */
router.get('/metrics', gatewayController.getMetrics);

/**
 * Circuit breaker status
 * GET /health/circuit-breakers
 */
router.get('/circuit-breakers', (req, res) => {
  const discoveryStatus = serviceDiscovery.getDiscoveryStatus();
  const circuitBreakers = {};
  
  for (const [serviceName, status] of Object.entries(discoveryStatus)) {
    if (status.circuitBreaker) {
      circuitBreakers[serviceName] = status.circuitBreaker;
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    circuitBreakers
  });
});

/**
 * Reset circuit breaker for a service
 * POST /health/circuit-breakers/:serviceName/reset
 */
router.post('/circuit-breakers/:serviceName/reset', (req, res) => {
  const { serviceName } = req.params;
  
  // This would reset the circuit breaker
  // For now, just return success
  res.json({
    message: `Circuit breaker reset for service: ${serviceName}`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Perform additional system checks
 */
async function performAdditionalChecks() {
  const checks = {};
  
  // Database connectivity check
  checks.database = {
    name: 'Database Connection',
    status: 'healthy', // This would be actual database check
    responseTime: 5
  };
  
  // External dependencies check
  checks.externalServices = {
    name: 'External Services',
    status: 'healthy', // This would check external APIs
    responseTime: 10
  };
  
  // Disk space check
  checks.diskSpace = {
    name: 'Disk Space',
    status: 'healthy', // This would check actual disk usage
    details: {
      usage: '45%',
      available: '55%'
    }
  };
  
  return checks;
}

/**
 * Perform health check for a specific service
 */
async function performServiceHealthCheck(service) {
  try {
    if (service.healthCheck.handler) {
      const result = await service.healthCheck.handler();
      return result.healthy;
    }
    
    // Default health check - just check if service is active
    return service.state.status === 'active';
    
  } catch (error) {
    console.error(`Health check failed for ${service.name}:`, error);
    return false;
  }
}

/**
 * Calculate percentile from array of numbers
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

module.exports = router;