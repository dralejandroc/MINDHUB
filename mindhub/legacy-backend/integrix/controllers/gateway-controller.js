/**
 * API Gateway Controller for Integrix
 * 
 * Main controller for the API gateway that handles:
 * - Service routing
 * - Request forwarding
 * - Response aggregation
 * - Error handling
 */

const BaseController = require('./base-controller');
const serviceRegistry = require('../services/service-registry');
const serviceDiscovery = require('../services/service-discovery');
const routingRules = require('../config/routing-rules');
const { logger } = require('../../shared/config/storage');

class GatewayController extends BaseController {
  constructor() {
    super('integrix-gateway');
  }
  
  /**
   * Get gateway status and information
   */
  getGatewayInfo = this.asyncHandler(async (req, res) => {
    const services = serviceRegistry.getAllServices();
    const discoveryStatus = serviceDiscovery.getDiscoveryStatus();
    
    const info = {
      gateway: {
        name: 'MindHub Integrix API Gateway',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      services: {
        total: services.length,
        active: services.filter(s => s.state.status === 'active').length,
        healthy: services.filter(s => s.state.isHealthy).length,
        list: services.map(s => ({
          name: s.name,
          displayName: s.displayName,
          version: s.version,
          status: s.state.status,
          healthy: s.state.isHealthy,
          baseUrl: s.baseUrl,
          features: s.metadata.features
        }))
      },
      discovery: discoveryStatus,
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimiting: true,
        loadBalancing: true,
        circuitBreaker: true,
        healthChecks: true,
        monitoring: true
      }
    };
    
    this.sendSuccess(res, info);
  });
  
  /**
   * Service discovery endpoint
   */
  discoverServices = this.asyncHandler(async (req, res) => {
    const { capability, feature, healthy } = req.query;
    let services = [];
    
    if (capability) {
      services = await serviceDiscovery.discoverByCapability(capability);
    } else if (feature) {
      services = await serviceDiscovery.discoverByFeature(feature);
    } else {
      const filters = {};
      if (healthy !== undefined) {
        filters.healthy = healthy === 'true';
      }
      
      const allServices = serviceRegistry.getAllServices(filters);
      for (const service of allServices) {
        try {
          const discovered = await serviceDiscovery.discoverService(service.name);
          if (discovered) {
            services.push(discovered);
          }
        } catch (error) {
          // Service unavailable, skip
        }
      }
    }
    
    this.sendSuccess(res, services);
  });
  
  /**
   * Get service registry information
   */
  getServiceRegistry = this.asyncHandler(async (req, res) => {
    const services = serviceRegistry.getAllServices();
    const registry = services.map(service => ({
      id: service.id,
      name: service.name,
      displayName: service.displayName,
      description: service.description,
      version: service.version,
      baseUrl: service.baseUrl,
      domain: service.metadata.domain,
      features: service.metadata.features,
      dependencies: service.metadata.dependencies,
      status: service.state.status,
      healthy: service.state.isHealthy,
      registeredAt: service.state.registeredAt,
      lastHealthCheck: service.state.lastHealthCheck
    }));
    
    this.sendSuccess(res, registry);
  });
  
  /**
   * Get specific service details
   */
  getServiceDetails = this.asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const service = serviceRegistry.getService(serviceName);
    
    if (!service) {
      return this.sendError(res, 'Service not found', 404, 'SERVICE_NOT_FOUND');
    }
    
    const metrics = serviceRegistry.getServiceMetrics(serviceName);
    const dependencies = serviceRegistry.getServiceDependencies(serviceName);
    const routing = serviceRegistry.getRoutingRules(serviceName);
    
    const details = {
      service: {
        id: service.id,
        name: service.name,
        displayName: service.displayName,
        description: service.description,
        version: service.version,
        baseUrl: service.baseUrl
      },
      metadata: service.metadata,
      state: service.state,
      capabilities: service.capabilities,
      endpoints: service.endpoints,
      healthCheck: {
        enabled: service.healthCheck.enabled,
        endpoint: service.healthCheck.endpoint,
        interval: service.healthCheck.interval
      },
      routing,
      dependencies: dependencies.map(dep => ({
        name: dep.name,
        available: dep.available,
        healthy: dep.service?.state.isHealthy
      })),
      metrics: metrics ? {
        requests: {
          total: metrics.requests.total,
          success: metrics.requests.success,
          error: metrics.requests.error,
          successRate: metrics.requests.total > 0 
            ? (metrics.requests.success / metrics.requests.total * 100).toFixed(2) + '%'
            : 'N/A',
          averageLatency: metrics.requests.latency.length > 0
            ? (metrics.requests.latency.reduce((a, b) => a + b, 0) / metrics.requests.latency.length).toFixed(2) + 'ms'
            : 'N/A'
        },
        health: metrics.health
      } : null
    };
    
    this.sendSuccess(res, details);
  });
  
  /**
   * Update service status
   */
  updateServiceStatus = this.asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { status, details } = req.body;
    
    if (!serviceRegistry.getService(serviceName)) {
      return this.sendError(res, 'Service not found', 404, 'SERVICE_NOT_FOUND');
    }
    
    const validStatuses = ['active', 'inactive', 'maintenance', 'degraded'];
    if (!validStatuses.includes(status)) {
      return this.sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_STATUS');
    }
    
    serviceRegistry.updateServiceStatus(serviceName, status, details);
    
    this.sendSuccess(res, { 
      message: 'Service status updated',
      service: serviceName,
      newStatus: status
    });
  });
  
  /**
   * Get all routing rules
   */
  getRoutingRules = this.asyncHandler(async (req, res) => {
    const allRouting = routingRules.getAllRouting();
    this.sendSuccess(res, allRouting);
  });
  
  /**
   * Get routing rules for specific service
   */
  getServiceRouting = this.asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const routing = routingRules.getHubRouting(serviceName);
    
    if (!routing) {
      return this.sendError(res, 'Routing rules not found for service', 404, 'ROUTING_NOT_FOUND');
    }
    
    this.sendSuccess(res, routing);
  });
  
  /**
   * Health check endpoint
   */
  healthCheck = this.asyncHandler(async (req, res) => {
    const { detailed } = req.query;
    const services = serviceRegistry.getAllServices();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      gateway: {
        operational: true,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {}
    };
    
    // Check each service health
    for (const service of services) {
      const isHealthy = service.state.isHealthy;
      const lastCheck = service.state.lastHealthCheck;
      
      health.services[service.name] = {
        healthy: isHealthy,
        status: service.state.status,
        lastCheck: lastCheck
      };
      
      if (!isHealthy) {
        health.status = 'degraded';
      }
      
      if (detailed === 'true') {
        const metrics = serviceRegistry.getServiceMetrics(service.name);
        if (metrics) {
          health.services[service.name].metrics = {
            requests: metrics.requests.total,
            successRate: metrics.requests.total > 0 
              ? (metrics.requests.success / metrics.requests.total * 100).toFixed(2) + '%'
              : 'N/A'
          };
        }
      }
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    this.sendSuccess(res, health, {}, statusCode);
  });
  
  /**
   * Metrics endpoint
   */
  getMetrics = this.asyncHandler(async (req, res) => {
    const services = serviceRegistry.getAllServices();
    const metrics = {
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString()
      },
      services: {}
    };
    
    for (const service of services) {
      const serviceMetrics = serviceRegistry.getServiceMetrics(service.name);
      if (serviceMetrics) {
        metrics.services[service.name] = {
          requests: serviceMetrics.requests,
          health: {
            status: service.state.isHealthy ? 'healthy' : 'unhealthy',
            uptime: serviceMetrics.health.uptime,
            lastDowntime: serviceMetrics.health.lastDowntime
          }
        };
      }
    }
    
    this.sendSuccess(res, metrics);
  });
  
  /**
   * Cross-hub patient overview
   */
  getPatientOverview = this.asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    
    // This is a placeholder for cross-hub data aggregation
    // In production, this would query multiple services and aggregate data
    
    const overview = {
      patient: {
        id: patientId,
        demographics: null, // Would come from Expedix
        assessments: [], // Would come from Clinimetrix
        forms: [], // Would come from FormX
        resources: [] // Would come from Resources
      },
      summary: {
        totalAssessments: 0,
        recentActivity: [],
        upcomingAppointments: [],
        assignedResources: 0
      }
    };
    
    // Simulate service calls
    try {
      // Get patient demographics from Expedix
      const expedixService = await serviceDiscovery.discoverService('expedix');
      if (expedixService) {
        // Would make actual HTTP call to Expedix service
        overview.patient.demographics = {
          source: 'expedix',
          data: { id: patientId, name: 'John Doe' } // Placeholder
        };
      }
      
      // Get assessments from Clinimetrix
      const clinimetrixService = await serviceDiscovery.discoverService('clinimetrix');
      if (clinimetrixService) {
        // Would make actual HTTP call to Clinimetrix service
        overview.patient.assessments = [
          { id: 1, scale: 'PHQ-9', date: '2024-01-15', score: 12 }
        ]; // Placeholder
        overview.summary.totalAssessments = 1;
      }
      
    } catch (error) {
      logger.error('Error aggregating patient data:', error);
    }
    
    this.sendSuccess(res, overview);
  });
  
  /**
   * Trigger cross-hub workflow
   */
  triggerWorkflow = this.asyncHandler(async (req, res) => {
    const { workflowId, params } = req.body;
    
    // Validate workflow exists
    const validWorkflows = ['patient-onboarding', 'assessment-battery', 'treatment-plan'];
    if (!validWorkflows.includes(workflowId)) {
      return this.sendError(res, 'Invalid workflow ID', 400, 'INVALID_WORKFLOW');
    }
    
    // This would trigger actual workflow orchestration
    const workflow = {
      id: `wf-${Date.now()}`,
      workflowId,
      status: 'initiated',
      params,
      steps: [],
      initiatedAt: new Date().toISOString()
    };
    
    this.sendSuccess(res, workflow, {}, 202);
  });
}

module.exports = new GatewayController();