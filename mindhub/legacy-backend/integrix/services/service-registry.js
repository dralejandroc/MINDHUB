/**
 * Service Registry for Integrix API Gateway
 * 
 * Manages service registration, discovery, health checks, and routing
 * Provides a centralized registry for all MindHub microservices
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { logger } = require('../../shared/config/storage');

class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.healthStatus = new Map();
    this.serviceMetrics = new Map();
    this.routingRules = new Map();
    this.serviceVersions = new Map();
  }

  /**
   * Register a new service in the registry
   * @param {string} serviceName - Unique service identifier
   * @param {object} config - Service configuration
   * @returns {string} Service registration ID
   */
  registerService(serviceName, config) {
    const registrationId = this.generateServiceId(serviceName);
    
    const serviceDefinition = {
      id: registrationId,
      name: serviceName,
      displayName: config.displayName || serviceName,
      description: config.description || '',
      version: config.version || '1.0.0',
      baseUrl: config.baseUrl || `/api/${serviceName}`,
      
      // Service metadata
      metadata: {
        domain: config.domain || 'default',
        owner: config.owner || 'mindhub-team',
        tags: config.tags || [],
        features: config.features || [],
        dependencies: config.dependencies || []
      },
      
      // Service endpoints
      endpoints: config.endpoints || [],
      
      // Health check configuration
      healthCheck: {
        enabled: config.healthCheck?.enabled !== false,
        endpoint: config.healthCheck?.endpoint || '/health',
        interval: config.healthCheck?.interval || 30000,
        timeout: config.healthCheck?.timeout || 5000,
        retries: config.healthCheck?.retries || 3,
        handler: config.healthCheck?.handler || null
      },
      
      // Routing configuration
      routing: {
        loadBalancer: config.routing?.loadBalancer || 'round-robin',
        instances: config.routing?.instances || [],
        weight: config.routing?.weight || 1,
        priority: config.routing?.priority || 0
      },
      
      // Service capabilities
      capabilities: {
        authentication: config.capabilities?.authentication || true,
        authorization: config.capabilities?.authorization || true,
        rateLimit: config.capabilities?.rateLimit || true,
        caching: config.capabilities?.caching || false,
        compression: config.capabilities?.compression || true
      },
      
      // Service state
      state: {
        status: 'registering',
        registeredAt: new Date(),
        lastUpdated: new Date(),
        lastHealthCheck: null,
        isHealthy: true,
        consecutiveFailures: 0
      },
      
      // Express router or middleware
      router: config.router || null,
      middleware: config.middleware || []
    };
    
    // Store service definition
    this.services.set(serviceName, serviceDefinition);
    
    // Initialize service metrics
    this.serviceMetrics.set(serviceName, {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        latency: []
      },
      health: {
        uptime: 0,
        downtime: 0,
        lastDowntime: null
      }
    });
    
    // Set initial health status
    this.healthStatus.set(serviceName, {
      status: 'unknown',
      lastCheck: null,
      details: {}
    });
    
    // Store service version history
    if (!this.serviceVersions.has(serviceName)) {
      this.serviceVersions.set(serviceName, []);
    }
    this.serviceVersions.get(serviceName).push({
      version: serviceDefinition.version,
      registeredAt: new Date(),
      registrationId
    });
    
    // Emit registration event
    this.emit('service:registered', {
      service: serviceName,
      registrationId,
      definition: serviceDefinition
    });
    
    // Update service status to active
    serviceDefinition.state.status = 'active';
    
    logger.info(`Service registered: ${serviceName}`, {
      registrationId,
      version: serviceDefinition.version,
      baseUrl: serviceDefinition.baseUrl
    });
    
    return registrationId;
  }
  
  /**
   * Deregister a service
   * @param {string} serviceName - Service to deregister
   * @returns {boolean} Success status
   */
  deregisterService(serviceName) {
    if (!this.services.has(serviceName)) {
      return false;
    }
    
    const service = this.services.get(serviceName);
    
    // Update status before removal
    service.state.status = 'deregistering';
    
    // Emit deregistration event
    this.emit('service:deregistering', {
      service: serviceName,
      definition: service
    });
    
    // Clean up all related data
    this.services.delete(serviceName);
    this.healthStatus.delete(serviceName);
    this.serviceMetrics.delete(serviceName);
    this.routingRules.delete(serviceName);
    
    logger.info(`Service deregistered: ${serviceName}`);
    
    this.emit('service:deregistered', { service: serviceName });
    
    return true;
  }
  
  /**
   * Get service by name
   * @param {string} serviceName - Service name
   * @returns {object|null} Service definition
   */
  getService(serviceName) {
    return this.services.get(serviceName) || null;
  }
  
  /**
   * Get all registered services
   * @param {object} filters - Optional filters
   * @returns {Array} List of services
   */
  getAllServices(filters = {}) {
    let services = Array.from(this.services.values());
    
    // Apply filters
    if (filters.status) {
      services = services.filter(s => s.state.status === filters.status);
    }
    
    if (filters.domain) {
      services = services.filter(s => s.metadata.domain === filters.domain);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      services = services.filter(s => 
        filters.tags.some(tag => s.metadata.tags.includes(tag))
      );
    }
    
    if (filters.healthy !== undefined) {
      services = services.filter(s => s.state.isHealthy === filters.healthy);
    }
    
    return services;
  }
  
  /**
   * Discover services by capability
   * @param {string} capability - Required capability
   * @returns {Array} Services with the capability
   */
  discoverByCapability(capability) {
    return this.getAllServices().filter(service => 
      service.capabilities[capability] === true
    );
  }
  
  /**
   * Discover services by feature
   * @param {string} feature - Required feature
   * @returns {Array} Services with the feature
   */
  discoverByFeature(feature) {
    return this.getAllServices().filter(service => 
      service.metadata.features.includes(feature)
    );
  }
  
  /**
   * Get service dependencies
   * @param {string} serviceName - Service name
   * @returns {Array} List of dependencies
   */
  getServiceDependencies(serviceName) {
    const service = this.getService(serviceName);
    if (!service) return [];
    
    return service.metadata.dependencies.map(dep => ({
      name: dep,
      service: this.getService(dep),
      available: this.services.has(dep)
    }));
  }
  
  /**
   * Check if all service dependencies are available
   * @param {string} serviceName - Service name
   * @returns {boolean} All dependencies available
   */
  areDependenciesAvailable(serviceName) {
    const dependencies = this.getServiceDependencies(serviceName);
    return dependencies.every(dep => dep.available && dep.service?.state.isHealthy);
  }
  
  /**
   * Update service status
   * @param {string} serviceName - Service name
   * @param {string} status - New status
   * @param {object} details - Optional status details
   */
  updateServiceStatus(serviceName, status, details = {}) {
    const service = this.getService(serviceName);
    if (!service) return;
    
    const previousStatus = service.state.status;
    service.state.status = status;
    service.state.lastUpdated = new Date();
    
    if (details) {
      Object.assign(service.state, details);
    }
    
    this.emit('service:status-changed', {
      service: serviceName,
      previousStatus,
      newStatus: status,
      details
    });
    
    logger.info(`Service status updated: ${serviceName}`, {
      previousStatus,
      newStatus: status
    });
  }
  
  /**
   * Update service health status
   * @param {string} serviceName - Service name
   * @param {boolean} isHealthy - Health status
   * @param {object} details - Health check details
   */
  updateHealthStatus(serviceName, isHealthy, details = {}) {
    const service = this.getService(serviceName);
    if (!service) return;
    
    const previousHealth = service.state.isHealthy;
    service.state.isHealthy = isHealthy;
    service.state.lastHealthCheck = new Date();
    
    if (!isHealthy) {
      service.state.consecutiveFailures++;
    } else {
      service.state.consecutiveFailures = 0;
    }
    
    this.healthStatus.set(serviceName, {
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      details,
      consecutiveFailures: service.state.consecutiveFailures
    });
    
    // Update metrics
    const metrics = this.serviceMetrics.get(serviceName);
    if (metrics) {
      if (!isHealthy && previousHealth) {
        metrics.health.lastDowntime = new Date();
      }
    }
    
    this.emit('service:health-changed', {
      service: serviceName,
      previousHealth,
      currentHealth: isHealthy,
      details
    });
  }
  
  /**
   * Get service routing rules
   * @param {string} serviceName - Service name
   * @returns {object} Routing rules
   */
  getRoutingRules(serviceName) {
    const service = this.getService(serviceName);
    if (!service) return null;
    
    return {
      baseUrl: service.baseUrl,
      loadBalancer: service.routing.loadBalancer,
      instances: service.routing.instances,
      weight: service.routing.weight,
      priority: service.routing.priority,
      endpoints: service.endpoints
    };
  }
  
  /**
   * Add service instance for load balancing
   * @param {string} serviceName - Service name
   * @param {object} instance - Instance configuration
   */
  addServiceInstance(serviceName, instance) {
    const service = this.getService(serviceName);
    if (!service) return;
    
    service.routing.instances.push({
      id: crypto.randomUUID(),
      url: instance.url,
      weight: instance.weight || 1,
      healthy: true,
      addedAt: new Date()
    });
    
    this.emit('service:instance-added', {
      service: serviceName,
      instance
    });
  }
  
  /**
   * Remove service instance
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   */
  removeServiceInstance(serviceName, instanceId) {
    const service = this.getService(serviceName);
    if (!service) return;
    
    service.routing.instances = service.routing.instances.filter(
      inst => inst.id !== instanceId
    );
    
    this.emit('service:instance-removed', {
      service: serviceName,
      instanceId
    });
  }
  
  /**
   * Get service metrics
   * @param {string} serviceName - Service name
   * @returns {object} Service metrics
   */
  getServiceMetrics(serviceName) {
    return this.serviceMetrics.get(serviceName) || null;
  }
  
  /**
   * Record service request
   * @param {string} serviceName - Service name
   * @param {object} requestData - Request data
   */
  recordRequest(serviceName, requestData) {
    const metrics = this.serviceMetrics.get(serviceName);
    if (!metrics) return;
    
    metrics.requests.total++;
    
    if (requestData.success) {
      metrics.requests.success++;
    } else {
      metrics.requests.error++;
    }
    
    if (requestData.latency) {
      metrics.requests.latency.push(requestData.latency);
      // Keep only last 1000 latency measurements
      if (metrics.requests.latency.length > 1000) {
        metrics.requests.latency.shift();
      }
    }
  }
  
  /**
   * Get service by endpoint
   * @param {string} endpoint - Request endpoint
   * @returns {object|null} Matching service
   */
  getServiceByEndpoint(endpoint) {
    for (const [serviceName, service] of this.services) {
      // Check if endpoint starts with service base URL
      if (endpoint.startsWith(service.baseUrl)) {
        return service;
      }
      
      // Check specific endpoint patterns
      for (const ep of service.endpoints) {
        if (this.matchEndpointPattern(endpoint, ep.pattern)) {
          return service;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Match endpoint against pattern
   * @param {string} endpoint - Request endpoint
   * @param {string} pattern - Endpoint pattern
   * @returns {boolean} Match result
   */
  matchEndpointPattern(endpoint, pattern) {
    // Convert pattern to regex (e.g., /api/patients/{id} -> /api/patients/[^/]+)
    const regexPattern = pattern.replace(/{[^}]+}/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }
  
  /**
   * Generate unique service ID
   * @param {string} serviceName - Service name
   * @returns {string} Service ID
   */
  generateServiceId(serviceName) {
    return `${serviceName}-${crypto.randomUUID().substring(0, 8)}`;
  }
  
  /**
   * Export registry state
   * @returns {object} Registry state
   */
  exportState() {
    const state = {
      services: {},
      health: {},
      metrics: {},
      versions: {}
    };
    
    for (const [name, service] of this.services) {
      state.services[name] = {
        ...service,
        router: undefined, // Don't serialize Express router
        middleware: undefined // Don't serialize middleware functions
      };
    }
    
    for (const [name, health] of this.healthStatus) {
      state.health[name] = health;
    }
    
    for (const [name, metrics] of this.serviceMetrics) {
      state.metrics[name] = metrics;
    }
    
    for (const [name, versions] of this.serviceVersions) {
      state.versions[name] = versions;
    }
    
    return state;
  }
}

// Create singleton instance
const serviceRegistry = new ServiceRegistry();

module.exports = serviceRegistry;