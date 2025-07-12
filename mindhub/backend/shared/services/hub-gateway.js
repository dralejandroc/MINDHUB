/**
 * Hub Gateway Service
 * 
 * Central gateway for routing requests between different hubs
 * Provides service discovery and load balancing capabilities
 */

const express = require('express');
const { logger } = require('../config/storage');

class HubGateway {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.router = express.Router();
    this.setupRoutes();
  }

  /**
   * Register a hub service
   * @param {string} hubName - Name of the hub (e.g., 'expedix', 'clinimetrix')
   * @param {object} service - Service configuration
   */
  registerService(hubName, service) {
    this.services.set(hubName, {
      name: hubName,
      baseUrl: service.baseUrl || `/api/${hubName}`,
      router: service.router,
      healthCheck: service.healthCheck || (() => Promise.resolve(true)),
      status: 'active',
      registeredAt: new Date(),
      ...service
    });

    logger.info(`Hub service registered: ${hubName}`, {
      baseUrl: service.baseUrl || `/api/${hubName}`,
      features: service.features || []
    });
  }

  /**
   * Get service information
   * @param {string} hubName - Name of the hub
   * @returns {object} Service information
   */
  getService(hubName) {
    return this.services.get(hubName);
  }

  /**
   * Get all registered services
   * @returns {Array} List of all services
   */
  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Check health of a specific service
   * @param {string} hubName - Name of the hub
   * @returns {Promise<boolean>} Health status
   */
  async checkServiceHealth(hubName) {
    const service = this.services.get(hubName);
    if (!service) {
      return false;
    }

    try {
      const isHealthy = await service.healthCheck();
      this.healthChecks.set(hubName, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : (this.healthChecks.get(hubName)?.consecutiveFailures || 0) + 1
      });
      return isHealthy;
    } catch (error) {
      logger.error(`Health check failed for ${hubName}`, { error: error.message });
      this.healthChecks.set(hubName, {
        status: 'unhealthy',
        lastCheck: new Date(),
        consecutiveFailures: (this.healthChecks.get(hubName)?.consecutiveFailures || 0) + 1,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check health of all services
   * @returns {Promise<object>} Health status of all services
   */
  async checkAllServicesHealth() {
    const healthResults = {};
    
    for (const [hubName] of this.services) {
      healthResults[hubName] = await this.checkServiceHealth(hubName);
    }
    
    return healthResults;
  }

  /**
   * Setup gateway routes
   */
  setupRoutes() {
    // Gateway health check
    this.router.get('/health', async (req, res) => {
      const serviceHealth = await this.checkAllServicesHealth();
      const overallHealth = Object.values(serviceHealth).every(health => health);
      
      res.status(overallHealth ? 200 : 503).json({
        status: overallHealth ? 'healthy' : 'degraded',
        services: serviceHealth,
        timestamp: new Date().toISOString(),
        gateway: 'hub-gateway'
      });
    });

    // Service discovery endpoint
    this.router.get('/services', (req, res) => {
      const services = this.getAllServices().map(service => ({
        name: service.name,
        baseUrl: service.baseUrl,
        status: service.status,
        features: service.features || [],
        description: service.description || '',
        registeredAt: service.registeredAt,
        health: this.healthChecks.get(service.name)
      }));

      res.json({
        gateway: 'MindHub API Gateway',
        services,
        totalServices: services.length,
        timestamp: new Date().toISOString()
      });
    });

    // Service status endpoint
    this.router.get('/services/:hubName/status', async (req, res) => {
      const { hubName } = req.params;
      const service = this.getService(hubName);
      
      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          hubName,
          availableServices: Array.from(this.services.keys())
        });
      }

      const isHealthy = await this.checkServiceHealth(hubName);
      const healthInfo = this.healthChecks.get(hubName);

      res.json({
        service: service.name,
        status: service.status,
        health: isHealthy ? 'healthy' : 'unhealthy',
        healthInfo,
        features: service.features || [],
        baseUrl: service.baseUrl,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get the router for mounting in Express app
   * @returns {Router} Express router
   */
  getRouter() {
    return this.router;
  }

  /**
   * Middleware for service routing
   * @param {string} hubName - Name of the hub to route to
   * @returns {Function} Express middleware
   */
  createServiceMiddleware(hubName) {
    return (req, res, next) => {
      const service = this.getService(hubName);
      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          hubName,
          message: `Hub '${hubName}' is not registered in the gateway`,
          availableServices: Array.from(this.services.keys())
        });
      }

      if (service.status !== 'active') {
        return res.status(503).json({
          error: 'Service unavailable',
          hubName,
          status: service.status,
          message: `Hub '${hubName}' is currently ${service.status}`
        });
      }

      // Add service info to request for downstream middleware
      req.hubService = service;
      next();
    };
  }

  /**
   * Start periodic health checks
   * @param {number} intervalMs - Interval in milliseconds (default: 30 seconds)
   */
  startHealthMonitoring(intervalMs = 30000) {
    setInterval(async () => {
      try {
        await this.checkAllServicesHealth();
        logger.debug('Periodic health check completed');
      } catch (error) {
        logger.error('Error during periodic health check', { error: error.message });
      }
    }, intervalMs);

    logger.info('Hub health monitoring started', { intervalMs });
  }
}

// Create singleton instance
const hubGateway = new HubGateway();

module.exports = hubGateway;