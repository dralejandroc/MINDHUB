/**
 * Main Gateway Routes for Integrix API
 * 
 * Central routing configuration that includes all gateway functionality
 */

const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gateway-controller');
const healthRoutes = require('./health');
const RoutingMiddleware = require('../middleware/routing-middleware');

// Apply common middleware
router.use(RoutingMiddleware.logRequests());
router.use(RoutingMiddleware.correlateRequests());

/**
 * Gateway Information and Status
 */

// Gateway root - service discovery and capabilities
router.get('/', gatewayController.getGatewayInfo);

// Service discovery endpoints
router.get('/services', gatewayController.discoverServices);
router.get('/registry', gatewayController.getServiceRegistry);
router.get('/services/:serviceName', gatewayController.getServiceDetails);

// Service management
router.patch('/services/:serviceName/status', gatewayController.updateServiceStatus);

// Routing configuration
router.get('/routing', gatewayController.getRoutingRules);
router.get('/routing/:serviceName', gatewayController.getServiceRouting);

/**
 * Health and Monitoring
 */
router.use('/health', healthRoutes);

/**
 * Cross-Hub Integration Endpoints
 */

// Patient data aggregation
router.get('/patients/:patientId/overview', 
  RoutingMiddleware.checkServiceHealth(),
  gatewayController.getPatientOverview
);

// Workflow management
router.post('/workflows/trigger',
  RoutingMiddleware.validateRequest(),
  gatewayController.triggerWorkflow
);

/**
 * Service Proxy Routes
 * These routes proxy requests to the appropriate microservices
 */

// Expedix routes proxy
router.use('/proxy/expedix/*', 
  RoutingMiddleware.routeRequest(),
  RoutingMiddleware.authorizeService(),
  RoutingMiddleware.applyRateLimit(),
  (req, res, next) => {
    // This would proxy the request to Expedix service
    // For now, just return service info
    if (req.serviceInfo) {
      res.json({
        message: 'Request would be proxied to Expedix service',
        service: req.serviceInfo.service.name,
        originalPath: req.originalUrl,
        proxyPath: req.path.replace('/proxy/expedix', ''),
        method: req.method
      });
    } else {
      res.status(503).json({ error: 'Service not available' });
    }
  }
);

// Clinimetrix routes proxy
router.use('/proxy/clinimetrix/*',
  RoutingMiddleware.routeRequest(),
  RoutingMiddleware.authorizeService(),
  RoutingMiddleware.applyRateLimit(),
  (req, res, next) => {
    // This would proxy the request to Clinimetrix service
    if (req.serviceInfo) {
      res.json({
        message: 'Request would be proxied to Clinimetrix service',
        service: req.serviceInfo.service.name,
        originalPath: req.originalUrl,
        proxyPath: req.path.replace('/proxy/clinimetrix', ''),
        method: req.method
      });
    } else {
      res.status(503).json({ error: 'Service not available' });
    }
  }
);

// FormX routes proxy
router.use('/proxy/formx/*',
  RoutingMiddleware.routeRequest(),
  RoutingMiddleware.authorizeService(),
  RoutingMiddleware.applyRateLimit(),
  (req, res, next) => {
    // This would proxy the request to FormX service
    if (req.serviceInfo) {
      res.json({
        message: 'Request would be proxied to FormX service',
        service: req.serviceInfo.service.name,
        originalPath: req.originalUrl,
        proxyPath: req.path.replace('/proxy/formx', ''),
        method: req.method
      });
    } else {
      res.status(503).json({ error: 'Service not available' });
    }
  }
);

// Resources routes proxy
router.use('/proxy/resources/*',
  RoutingMiddleware.routeRequest(),
  RoutingMiddleware.authorizeService(),
  RoutingMiddleware.applyRateLimit(),
  (req, res, next) => {
    // This would proxy the request to Resources service
    if (req.serviceInfo) {
      res.json({
        message: 'Request would be proxied to Resources service',
        service: req.serviceInfo.service.name,
        originalPath: req.originalUrl,
        proxyPath: req.path.replace('/proxy/resources', ''),
        method: req.method
      });
    } else {
      res.status(503).json({ error: 'Service not available' });
    }
  }
);

/**
 * Development and Testing Endpoints
 */
if (process.env.NODE_ENV === 'development') {
  // Test service registration
  router.post('/dev/register-service', (req, res) => {
    const serviceRegistry = require('../services/service-registry');
    const { serviceName, config } = req.body;
    
    try {
      const registrationId = serviceRegistry.registerService(serviceName, config);
      res.json({
        message: 'Service registered successfully',
        serviceName,
        registrationId
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to register service',
        details: error.message
      });
    }
  });
  
  // Test service discovery
  router.get('/dev/discover/:serviceName', async (req, res) => {
    const serviceDiscovery = require('../services/service-discovery');
    const { serviceName } = req.params;
    
    try {
      const serviceInfo = await serviceDiscovery.discoverService(serviceName);
      res.json(serviceInfo);
    } catch (error) {
      res.status(404).json({
        error: 'Service discovery failed',
        details: error.message
      });
    }
  });
  
  // Simulate service failure
  router.post('/dev/services/:serviceName/fail', (req, res) => {
    const serviceRegistry = require('../services/service-registry');
    const { serviceName } = req.params;
    
    serviceRegistry.updateHealthStatus(serviceName, false, {
      simulated: true,
      reason: 'Simulated failure for testing'
    });
    
    res.json({
      message: `Simulated failure for service: ${serviceName}`
    });
  });
  
  // Reset service health
  router.post('/dev/services/:serviceName/recover', (req, res) => {
    const serviceRegistry = require('../services/service-registry');
    const { serviceName } = req.params;
    
    serviceRegistry.updateHealthStatus(serviceName, true, {
      simulated: true,
      reason: 'Simulated recovery for testing'
    });
    
    res.json({
      message: `Simulated recovery for service: ${serviceName}`
    });
  });
}

// Error handling middleware
router.use(RoutingMiddleware.handleErrors());

module.exports = router;