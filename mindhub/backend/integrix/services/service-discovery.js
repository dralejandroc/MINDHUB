/**
 * Service Discovery Module for Integrix API Gateway
 * 
 * Provides service discovery capabilities including:
 * - Service lookup by various criteria
 * - Load balancing strategies
 * - Circuit breaker pattern
 * - Service health monitoring
 */

const EventEmitter = require('events');
const serviceRegistry = require('./service-registry');
const { logger } = require('../../shared/config/storage');

class ServiceDiscovery extends EventEmitter {
  constructor() {
    super();
    this.loadBalancers = new Map();
    this.circuitBreakers = new Map();
    this.healthMonitors = new Map();
    
    // Subscribe to registry events
    this.setupRegistryListeners();
  }
  
  /**
   * Setup listeners for service registry events
   */
  setupRegistryListeners() {
    serviceRegistry.on('service:registered', ({ service, definition }) => {
      this.initializeServiceDiscovery(service, definition);
    });
    
    serviceRegistry.on('service:deregistered', ({ service }) => {
      this.cleanupServiceDiscovery(service);
    });
    
    serviceRegistry.on('service:health-changed', ({ service, currentHealth }) => {
      this.handleHealthChange(service, currentHealth);
    });
  }
  
  /**
   * Initialize discovery mechanisms for a service
   * @param {string} serviceName - Service name
   * @param {object} definition - Service definition
   */
  initializeServiceDiscovery(serviceName, definition) {
    // Initialize load balancer
    this.loadBalancers.set(serviceName, {
      strategy: definition.routing.loadBalancer,
      currentIndex: 0,
      instances: definition.routing.instances || []
    });
    
    // Initialize circuit breaker
    this.circuitBreakers.set(serviceName, {
      state: 'closed', // closed, open, half-open
      failures: 0,
      successCount: 0,
      lastFailure: null,
      nextAttempt: null,
      config: {
        threshold: 5, // failures before opening
        timeout: 60000, // 1 minute timeout
        successThreshold: 2 // successes to close from half-open
      }
    });
    
    // Start health monitoring if enabled
    if (definition.healthCheck.enabled) {
      this.startHealthMonitoring(serviceName, definition);
    }
  }
  
  /**
   * Cleanup discovery mechanisms for a service
   * @param {string} serviceName - Service name
   */
  cleanupServiceDiscovery(serviceName) {
    // Stop health monitoring
    const monitor = this.healthMonitors.get(serviceName);
    if (monitor) {
      clearInterval(monitor.intervalId);
      this.healthMonitors.delete(serviceName);
    }
    
    // Clean up other resources
    this.loadBalancers.delete(serviceName);
    this.circuitBreakers.delete(serviceName);
  }
  
  /**
   * Discover a service by name
   * @param {string} serviceName - Service name
   * @returns {object|null} Service instance or null
   */
  async discoverService(serviceName) {
    const service = serviceRegistry.getService(serviceName);
    if (!service) {
      logger.warn(`Service not found: ${serviceName}`);
      return null;
    }
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker && circuitBreaker.state === 'open') {
      if (Date.now() < circuitBreaker.nextAttempt) {
        throw new Error(`Circuit breaker open for service: ${serviceName}`);
      }
      // Try half-open state
      circuitBreaker.state = 'half-open';
    }
    
    // Check if service is healthy
    if (!service.state.isHealthy) {
      logger.warn(`Service unhealthy: ${serviceName}`);
      return null;
    }
    
    // Get instance using load balancer
    const instance = this.getServiceInstance(serviceName);
    if (!instance) {
      logger.warn(`No available instances for service: ${serviceName}`);
      return null;
    }
    
    return {
      service,
      instance,
      baseUrl: instance.url || service.baseUrl,
      capabilities: service.capabilities,
      metadata: service.metadata
    };
  }
  
  /**
   * Discover services by capability
   * @param {string} capability - Required capability
   * @returns {Array} Available services
   */
  async discoverByCapability(capability) {
    const services = serviceRegistry.discoverByCapability(capability);
    const available = [];
    
    for (const service of services) {
      try {
        const discovered = await this.discoverService(service.name);
        if (discovered) {
          available.push(discovered);
        }
      } catch (error) {
        logger.error(`Error discovering service ${service.name}:`, error);
      }
    }
    
    return available;
  }
  
  /**
   * Discover services by feature
   * @param {string} feature - Required feature
   * @returns {Array} Available services
   */
  async discoverByFeature(feature) {
    const services = serviceRegistry.discoverByFeature(feature);
    const available = [];
    
    for (const service of services) {
      try {
        const discovered = await this.discoverService(service.name);
        if (discovered) {
          available.push(discovered);
        }
      } catch (error) {
        logger.error(`Error discovering service ${service.name}:`, error);
      }
    }
    
    return available;
  }
  
  /**
   * Get service instance using load balancing
   * @param {string} serviceName - Service name
   * @returns {object|null} Service instance
   */
  getServiceInstance(serviceName) {
    const loadBalancer = this.loadBalancers.get(serviceName);
    if (!loadBalancer || loadBalancer.instances.length === 0) {
      // Return default service info if no instances configured
      const service = serviceRegistry.getService(serviceName);
      return service ? { url: service.baseUrl } : null;
    }
    
    const strategy = loadBalancer.strategy;
    let instance = null;
    
    switch (strategy) {
      case 'round-robin':
        instance = this.roundRobinSelect(loadBalancer);
        break;
        
      case 'random':
        instance = this.randomSelect(loadBalancer);
        break;
        
      case 'weighted':
        instance = this.weightedSelect(loadBalancer);
        break;
        
      case 'least-connections':
        instance = this.leastConnectionsSelect(loadBalancer);
        break;
        
      default:
        instance = this.roundRobinSelect(loadBalancer);
    }
    
    return instance;
  }
  
  /**
   * Round-robin load balancing
   * @param {object} loadBalancer - Load balancer state
   * @returns {object} Selected instance
   */
  roundRobinSelect(loadBalancer) {
    const healthyInstances = loadBalancer.instances.filter(i => i.healthy !== false);
    if (healthyInstances.length === 0) return null;
    
    const instance = healthyInstances[loadBalancer.currentIndex % healthyInstances.length];
    loadBalancer.currentIndex = (loadBalancer.currentIndex + 1) % healthyInstances.length;
    
    return instance;
  }
  
  /**
   * Random load balancing
   * @param {object} loadBalancer - Load balancer state
   * @returns {object} Selected instance
   */
  randomSelect(loadBalancer) {
    const healthyInstances = loadBalancer.instances.filter(i => i.healthy !== false);
    if (healthyInstances.length === 0) return null;
    
    const index = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[index];
  }
  
  /**
   * Weighted load balancing
   * @param {object} loadBalancer - Load balancer state
   * @returns {object} Selected instance
   */
  weightedSelect(loadBalancer) {
    const healthyInstances = loadBalancer.instances.filter(i => i.healthy !== false);
    if (healthyInstances.length === 0) return null;
    
    const totalWeight = healthyInstances.reduce((sum, i) => sum + (i.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of healthyInstances) {
      random -= (instance.weight || 1);
      if (random <= 0) {
        return instance;
      }
    }
    
    return healthyInstances[0];
  }
  
  /**
   * Least connections load balancing
   * @param {object} loadBalancer - Load balancer state
   * @returns {object} Selected instance
   */
  leastConnectionsSelect(loadBalancer) {
    const healthyInstances = loadBalancer.instances.filter(i => i.healthy !== false);
    if (healthyInstances.length === 0) return null;
    
    // Sort by active connections (if tracked)
    return healthyInstances.reduce((least, current) => {
      const leastConnections = least.activeConnections || 0;
      const currentConnections = current.activeConnections || 0;
      return currentConnections < leastConnections ? current : least;
    });
  }
  
  /**
   * Record successful service call
   * @param {string} serviceName - Service name
   */
  recordSuccess(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return;
    
    if (circuitBreaker.state === 'half-open') {
      circuitBreaker.successCount++;
      
      if (circuitBreaker.successCount >= circuitBreaker.config.successThreshold) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failures = 0;
        circuitBreaker.successCount = 0;
        logger.info(`Circuit breaker closed for service: ${serviceName}`);
      }
    } else if (circuitBreaker.state === 'closed') {
      circuitBreaker.failures = 0;
    }
    
    // Record metrics
    serviceRegistry.recordRequest(serviceName, { success: true });
  }
  
  /**
   * Record failed service call
   * @param {string} serviceName - Service name
   * @param {Error} error - Error details
   */
  recordFailure(serviceName, error) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return;
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date();
    
    if (circuitBreaker.state === 'half-open') {
      // Immediately open on failure in half-open state
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttempt = Date.now() + circuitBreaker.config.timeout;
      circuitBreaker.successCount = 0;
      logger.warn(`Circuit breaker opened for service: ${serviceName} (half-open failure)`);
    } else if (circuitBreaker.state === 'closed' && 
               circuitBreaker.failures >= circuitBreaker.config.threshold) {
      // Open circuit breaker
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttempt = Date.now() + circuitBreaker.config.timeout;
      logger.warn(`Circuit breaker opened for service: ${serviceName} (threshold reached)`);
      
      this.emit('circuit-breaker:opened', {
        service: serviceName,
        failures: circuitBreaker.failures
      });
    }
    
    // Record metrics
    serviceRegistry.recordRequest(serviceName, { 
      success: false, 
      error: error.message 
    });
  }
  
  /**
   * Start health monitoring for a service
   * @param {string} serviceName - Service name
   * @param {object} definition - Service definition
   */
  startHealthMonitoring(serviceName, definition) {
    const monitor = {
      intervalId: null,
      lastCheck: null,
      consecutiveFailures: 0
    };
    
    const checkHealth = async () => {
      try {
        const healthCheck = definition.healthCheck;
        let isHealthy = true;
        let details = {};
        
        if (healthCheck.handler) {
          // Use custom health check handler
          const result = await healthCheck.handler();
          isHealthy = result.healthy;
          details = result.details || {};
        } else {
          // Default HTTP health check
          // This would be implemented with actual HTTP calls
          // For now, we'll simulate it
          isHealthy = Math.random() > 0.1; // 90% healthy
          details = { checked: 'http', endpoint: healthCheck.endpoint };
        }
        
        serviceRegistry.updateHealthStatus(serviceName, isHealthy, details);
        monitor.lastCheck = new Date();
        
        if (isHealthy) {
          monitor.consecutiveFailures = 0;
        } else {
          monitor.consecutiveFailures++;
        }
        
      } catch (error) {
        logger.error(`Health check failed for ${serviceName}:`, error);
        monitor.consecutiveFailures++;
        serviceRegistry.updateHealthStatus(serviceName, false, { 
          error: error.message 
        });
      }
    };
    
    // Initial health check
    checkHealth();
    
    // Schedule periodic health checks
    monitor.intervalId = setInterval(checkHealth, definition.healthCheck.interval);
    
    this.healthMonitors.set(serviceName, monitor);
    
    logger.info(`Health monitoring started for service: ${serviceName}`, {
      interval: definition.healthCheck.interval
    });
  }
  
  /**
   * Handle health status changes
   * @param {string} serviceName - Service name
   * @param {boolean} isHealthy - Current health status
   */
  handleHealthChange(serviceName, isHealthy) {
    const loadBalancer = this.loadBalancers.get(serviceName);
    if (!loadBalancer) return;
    
    // Update instance health status if needed
    // This would be enhanced with actual instance health tracking
    
    this.emit('service:health-updated', {
      service: serviceName,
      healthy: isHealthy
    });
  }
  
  /**
   * Get discovery status for all services
   * @returns {object} Discovery status
   */
  getDiscoveryStatus() {
    const status = {};
    
    for (const [serviceName, service] of serviceRegistry.services) {
      const circuitBreaker = this.circuitBreakers.get(serviceName);
      const loadBalancer = this.loadBalancers.get(serviceName);
      const healthMonitor = this.healthMonitors.get(serviceName);
      
      status[serviceName] = {
        registered: true,
        healthy: service.state.isHealthy,
        circuitBreaker: circuitBreaker ? {
          state: circuitBreaker.state,
          failures: circuitBreaker.failures
        } : null,
        instances: loadBalancer ? loadBalancer.instances.length : 0,
        healthMonitoring: healthMonitor ? {
          enabled: true,
          lastCheck: healthMonitor.lastCheck,
          consecutiveFailures: healthMonitor.consecutiveFailures
        } : { enabled: false }
      };
    }
    
    return status;
  }
}

// Create singleton instance
const serviceDiscovery = new ServiceDiscovery();

module.exports = serviceDiscovery;