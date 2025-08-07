/**
 * Integrix API Gateway - Main Entry Point
 * 
 * Complete API gateway implementation with:
 * - Service registry and discovery
 * - Dynamic routing
 * - Health monitoring
 * - Load balancing
 * - Circuit breakers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import Integrix components
const serviceRegistry = require('./services/service-registry');
const serviceDiscovery = require('./services/service-discovery');
const routingRules = require('./config/routing-rules');
const gatewayRoutes = require('./routes/gateway');
const hubLinksRoutes = require('./routes/hub-links');
const RoutingMiddleware = require('./middleware/routing-middleware');

// Import existing services
const expedix = require('../expedix');
const clinimetrix = require('../clinimetrix');
const formx = require('../formx');
const resources = require('../resources');
const universalScalesRouter = require('../api/universal-scales');
const assessmentController = require('../api/assessment-controller');

const { logger } = require('../shared/config/storage');

class IntegrixGateway {
  constructor() {
    this.app = express();
    this.port = process.env.INTEGRIX_PORT || 3003;
    this.isInitialized = false;
    
    this.setupMiddleware();
    this.registerServices();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://mindhub.cloud", "https://www.mindhub.cloud", "https://api.mindhub.com", "https://mindhub-production.up.railway.app", "https://*.auth0.com", "http://localhost:*"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'https://mindhub.health',
        'https://api.mindhub.health'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Version',
        'X-API-Client',
        'X-Request-ID',
        'X-Correlation-ID'
      ]
    }));
    
    // General middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = require('crypto').randomUUID();
      req.timestamp = new Date().toISOString();
      res.locals.requestId = req.requestId;
      next();
    });
    
    // API versioning middleware
    this.app.use('/api/v1', (req, res, next) => {
      req.apiVersion = 'v1';
      res.set('X-API-Version', 'v1');
      next();
    });
    
    this.app.use('/api/v2', (req, res, next) => {
      req.apiVersion = 'v2';
      res.set('X-API-Version', 'v2');
      next();
    });
  }
  
  /**
   * Register all MindHub services with the registry
   */
  registerServices() {
    logger.info('Registering MindHub services...');
    
    // Register Expedix - Patient Management
    serviceRegistry.registerService('expedix', {
      displayName: 'Expedix Patient Management',
      description: 'Comprehensive patient management and medical records system',
      version: '1.0.0',
      baseUrl: '/api/v1/expedix',
      domain: 'patient-management',
      owner: 'expedix-team',
      tags: ['critical', 'core', 'patient-data'],
      features: [
        'patient-demographics',
        'medical-history',
        'consultations',
        'emergency-contacts',
        'appointment-scheduling'
      ],
      dependencies: [],
      router: expedix,
      
      // Endpoint definitions
      endpoints: routingRules.getHubRouting('expedix')?.endpoints || [],
      
      // Health check configuration
      healthCheck: {
        enabled: true,
        endpoint: '/api/v1/expedix/health',
        interval: 30000,
        timeout: 5000,
        handler: async () => {
          // Custom health check logic
          return { healthy: true, details: { status: 'operational' } };
        }
      },
      
      // Routing configuration
      routing: {
        loadBalancer: 'round-robin',
        instances: [],
        weight: 1,
        priority: 1
      },
      
      // Service capabilities
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: false,
        compression: true
      }
    });
    
    // Register Clinimetrix - Clinical Assessments
    serviceRegistry.registerService('clinimetrix', {
      displayName: 'Clinimetrix Assessment Platform',
      description: 'Clinical assessments, psychometric scales, and scoring system',
      version: '1.0.0',
      baseUrl: '/api/v1/clinimetrix',
      domain: 'clinical-assessments',
      owner: 'clinimetrix-team',
      tags: ['critical', 'core', 'assessments'],
      features: [
        'psychometric-scales',
        'assessment-administration',
        'automatic-scoring',
        'clinical-interpretation',
        'progress-tracking'
      ],
      dependencies: ['expedix'],
      router: clinimetrix,
      endpoints: routingRules.getHubRouting('clinimetrix')?.endpoints || [],
      
      healthCheck: {
        enabled: true,
        endpoint: '/api/v1/clinimetrix/health',
        interval: 30000,
        handler: async () => {
          return { healthy: true, details: { status: 'operational' } };
        }
      },
      
      routing: {
        loadBalancer: 'round-robin',
        weight: 1,
        priority: 1
      },
      
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: true,
        compression: true
      }
    });
    
    // Register FormX - Dynamic Forms
    serviceRegistry.registerService('formx', {
      displayName: 'FormX Dynamic Forms',
      description: 'Dynamic form builder, templates, and submission management',
      version: '1.0.0',
      baseUrl: '/api/v1/formx',
      domain: 'form-management',
      owner: 'formx-team',
      tags: ['core', 'forms'],
      features: [
        'dynamic-form-builder',
        'conditional-logic',
        'file-uploads',
        'form-analytics'
      ],
      dependencies: ['expedix'],
      router: formx,
      endpoints: routingRules.getHubRouting('formx')?.endpoints || [],
      
      healthCheck: {
        enabled: true,
        endpoint: '/api/v1/formx/health',
        interval: 30000
      },
      
      routing: {
        loadBalancer: 'round-robin',
        weight: 1,
        priority: 2
      },
      
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: false,
        compression: true
      }
    });
    
    // Register Resources - Content Management
    serviceRegistry.registerService('resources', {
      displayName: 'Resources Library',
      description: 'Educational content, treatment plans, and resource management',
      version: '1.0.0',
      baseUrl: '/api/v1/resources',
      domain: 'content-management',
      owner: 'resources-team',
      tags: ['content', 'educational'],
      features: [
        'content-library',
        'treatment-plans',
        'educational-materials',
        'multimedia-support'
      ],
      dependencies: ['expedix'],
      router: resources,
      endpoints: routingRules.getHubRouting('resources')?.endpoints || [],
      
      healthCheck: {
        enabled: true,
        endpoint: '/api/v1/resources/health',
        interval: 45000
      },
      
      routing: {
        loadBalancer: 'round-robin',
        weight: 1,
        priority: 3
      },
      
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: true,
        compression: true
      }
    });
    
    // Register Universal Scales System
    serviceRegistry.registerService('universal-scales', {
      displayName: 'Universal Scales System',
      description: 'Unified scale system for all clinical assessments',
      version: '1.0.0',
      baseUrl: '/api',
      domain: 'clinical-assessments',
      owner: 'clinimetrix-team',
      tags: ['core', 'scales', 'unified'],
      features: [
        'unified-scale-system',
        'session-management',
        'response-tracking',
        'automatic-scoring'
      ],
      dependencies: ['clinimetrix'],
      router: universalScalesRouter,
      endpoints: routingRules.getHubRouting('universal-scales')?.endpoints || [],
      
      healthCheck: {
        enabled: true,
        interval: 30000
      },
      
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: true,
        compression: true
      }
    });
    
    // Register Assessment Controller
    serviceRegistry.registerService('assessments', {
      displayName: 'Assessment Controller',
      description: 'Assessment management and control service',
      version: '1.0.0',
      baseUrl: '/api/assessments',
      domain: 'clinical-assessments',
      owner: 'clinimetrix-team',
      tags: ['assessments', 'controller'],
      features: [
        'assessment-management',
        'administration-control',
        'results-processing'
      ],
      dependencies: ['clinimetrix', 'universal-scales'],
      router: assessmentController,
      
      healthCheck: {
        enabled: true,
        interval: 30000
      },
      
      capabilities: {
        authentication: true,
        authorization: true,
        rateLimit: true,
        caching: false,
        compression: true
      }
    });
    
    logger.info('All MindHub services registered successfully');
  }
  
  /**
   * Setup API routes
   */
  setupRoutes() {
    // Gateway root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'MindHub Integrix API Gateway',
        version: '1.0.0',
        description: 'Central API gateway for MindHub healthcare platform',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        
        endpoints: {
          gateway: '/api/gateway',
          health: '/api/gateway/health',
          services: '/api/gateway/services',
          hubLinks: '/api/hub-links',
          documentation: '/api/docs'
        },
        
        services: serviceRegistry.getAllServices().map(s => ({
          name: s.name,
          displayName: s.displayName,
          baseUrl: s.baseUrl,
          status: s.state.status,
          healthy: s.state.isHealthy
        }))
      });
    });
    
    // Mount gateway routes
    this.app.use('/api/gateway', gatewayRoutes);
    
    // Mount hub links routes for inter-hub communication
    this.app.use('/api/hub-links', hubLinksRoutes);
    
    // Mount service routes with middleware
    this.app.use('/api/v1/expedix', 
      RoutingMiddleware.routeRequest(),
      RoutingMiddleware.checkServiceHealth(),
      expedix
    );
    
    this.app.use('/api/v1/clinimetrix',
      RoutingMiddleware.routeRequest(),
      RoutingMiddleware.checkServiceHealth(),
      clinimetrix
    );
    
    this.app.use('/api/v1/formx',
      RoutingMiddleware.routeRequest(),
      RoutingMiddleware.checkServiceHealth(),
      formx
    );
    
    this.app.use('/api/v1/resources',
      RoutingMiddleware.routeRequest(),
      RoutingMiddleware.checkServiceHealth(),
      resources
    );
    
    // Mount universal systems
    this.app.use('/api', universalScalesRouter);
    this.app.use('/api', assessmentController);
    
    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        api: 'MindHub Integrix API Gateway',
        version: '1.0.0',
        documentation: {
          services: serviceRegistry.getAllServices().map(s => ({
            name: s.name,
            endpoints: s.endpoints
          })),
          routing: routingRules.getAllRouting()
        }
      });
    });
    
    // 404 handler for unknown endpoints
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Cannot ${req.method} ${req.originalUrl}`,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        },
        availableEndpoints: {
          gateway: '/api/gateway',
          health: '/api/gateway/health',
          services: '/api/gateway/services',
          hubLinks: '/api/hub-links',
          expedix: '/api/v1/expedix',
          clinimetrix: '/api/v1/clinimetrix',
          formx: '/api/v1/formx',
          resources: '/api/v1/resources',
          scales: '/api/scales',
          assessments: '/api/assessments'
        }
      });
    });
  }
  
  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: isDevelopment ? err.message : 'An internal error occurred',
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
          ...(isDevelopment && { stack: err.stack })
        }
      });
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      this.shutdown();
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      this.shutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown();
    });
  }
  
  /**
   * Start the gateway server
   */
  async start() {
    try {
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start the server
      const server = this.app.listen(this.port, () => {
        this.isInitialized = true;
        
        console.log('');
        console.log('🏗️  MindHub Integrix API Gateway');
        console.log('=====================================');
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📍 Gateway URL: http://localhost:${this.port}`);
        console.log(`🔍 Health Check: http://localhost:${this.port}/api/gateway/health`);
        console.log(`📊 Metrics: http://localhost:${this.port}/api/gateway/metrics`);
        console.log(`🌐 Services: http://localhost:${this.port}/api/gateway/services`);
        console.log(`📚 API Docs: http://localhost:${this.port}/api/docs`);
        console.log('');
        console.log('🔧 Registered Services:');
        
        const services = serviceRegistry.getAllServices();
        services.forEach(service => {
          console.log(`   ${service.displayName}: ${service.baseUrl} (${service.state.status})`);
        });
        
        console.log('');
        console.log('🏗️  Gateway Features:');
        console.log('   ✅ Service Registry & Discovery');
        console.log('   ✅ Dynamic Routing');
        console.log('   ✅ Health Monitoring');
        console.log('   ✅ Load Balancing');
        console.log('   ✅ Circuit Breakers');
        console.log('   ✅ Rate Limiting');
        console.log('   ✅ Request Correlation');
        console.log('   ✅ Inter-Hub Communication');
        console.log('   ✅ Tokenized Hub Links');
        console.log('   ✅ Comprehensive Logging');
        console.log('');
        console.log('✅ Integrix API Gateway ready for healthcare operations!');
      });
      
      this.server = server;
      
    } catch (error) {
      logger.error('Failed to start Integrix Gateway:', error);
      process.exit(1);
    }
  }
  
  /**
   * Start health monitoring for all services
   */
  startHealthMonitoring() {
    // Start periodic health checks every 30 seconds
    setInterval(async () => {
      const services = serviceRegistry.getAllServices();
      for (const service of services) {
        if (service.healthCheck.enabled) {
          try {
            const isHealthy = await this.checkServiceHealth(service);
            serviceRegistry.updateHealthStatus(service.name, isHealthy);
          } catch (error) {
            logger.error(`Health check failed for ${service.name}:`, error);
            serviceRegistry.updateHealthStatus(service.name, false, {
              error: error.message
            });
          }
        }
      }
    }, 30000);
    
    logger.info('Health monitoring started for all services');
  }
  
  /**
   * Check health of a specific service
   */
  async checkServiceHealth(service) {
    if (service.healthCheck.handler) {
      const result = await service.healthCheck.handler();
      return result.healthy;
    }
    
    // Default check - service is healthy if status is active
    return service.state.status === 'active';
  }
  
  /**
   * Shutdown the gateway gracefully
   */
  async shutdown() {
    logger.info('Shutting down Integrix Gateway...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('Integrix Gateway shut down successfully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Create and export gateway instance
const gateway = new IntegrixGateway();

// Start gateway if this file is run directly
if (require.main === module) {
  gateway.start().catch(error => {
    console.error('Failed to start gateway:', error);
    process.exit(1);
  });
}

module.exports = gateway;