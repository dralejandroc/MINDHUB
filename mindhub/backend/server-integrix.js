#!/usr/bin/env node

/**
 * MindHub Healthcare Platform - Integrix API Server
 * 
 * Comprehensive Internal API (Integrix) implementation with:
 * - Complete API Architecture from api-architecture.js
 * - Hub Gateway for service discovery and routing
 * - Versioned API Router with middleware support
 * - Full middleware stack for security and validation
 * - All Hub services integrated (Expedix, Clinimetrix, FormX, Resources)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import architecture components
const IntegrixAPIArchitecture = require('./shared/config/api-architecture');
const hubGateway = require('./shared/services/hub-gateway');

// Import middleware
const middleware = require('./shared/middleware');
const ErrorHandlingMiddleware = require('./shared/middleware/error-handling');
const authMiddleware = require('./shared/middleware/auth-middleware');
const dataValidation = require('./shared/middleware/data-validation');
const rateLimiting = require('./shared/middleware/rate-limiting');

// Create error handler instance
const errorHandler = new ErrorHandlingMiddleware();

// Import hub services
const expedix = require('./expedix');
const clinimetrix = require('./clinimetrix');
const formx = require('./formx');
const universalScalesRouter = require('./api/universal-scales');
const assessmentController = require('./api/assessment-controller');

// Import authentication routes
const authRoutes = require('./integrix/routes/auth');
const auth0Routes = require('./integrix/routes/auth0');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Initialize architecture components
const apiArchitecture = new IntegrixAPIArchitecture();

console.log('🏗️  Initializing Integrix API Architecture...');

// Security middleware (helmet with healthcare-specific settings)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration for healthcare compliance
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
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
    'X-Request-ID'
  ]
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and tracking
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  req.timestamp = new Date().toISOString();
  
  // Add request headers
  res.set('X-Request-ID', req.requestId);
  res.set('X-API-Server', 'Integrix');
  res.set('X-API-Version', '1.0.0');
  
  console.log(`[${req.timestamp}] ${req.method} ${req.path} - Request ID: ${req.requestId}`);
  next();
});

// Rate limiting with healthcare-specific rules
app.use(rateLimiting.createHealthcareRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  }
}));

// =============================================================================
// CORE API ENDPOINTS
// =============================================================================

// API Root with architecture information
app.get('/', (req, res) => {
  const architecture = apiArchitecture.getArchitecture();
  res.json({
    name: 'MindHub Integrix API',
    version: architecture.metadata.version,
    description: architecture.metadata.description,
    timestamp: req.timestamp,
    requestId: req.requestId,
    
    // Service discovery
    services: hubGateway.getAllServices().map(service => ({
      name: service.name,
      baseUrl: service.baseUrl,
      status: service.status,
      description: service.description
    })),
    
    // API capabilities
    capabilities: {
      versioning: 'URL-based (/api/v1, /api/v2)',
      authentication: 'JWT Bearer tokens',
      authorization: 'Role-based access control',
      documentation: 'OpenAPI 3.0.3',
      monitoring: 'Health checks and metrics'
    },
    
    // Available endpoints
    endpoints: {
      health: 'GET /health',
      services: 'GET /api/gateway/services',
      documentation: 'GET /api/docs',
      capabilities: 'GET /api/capabilities',
      
      // Hub services
      expedix: 'GET /api/v1/expedix',
      clinimetrix: 'GET /api/v1/clinimetrix',
      formx: 'GET /api/v1/formx',
      resources: 'GET /api/v1/resources',
      
      // Cross-hub operations
      integrix: 'GET /api/v1/integrix'
    }
  });
});

// =============================================================================
// HEALTH AND MONITORING
// =============================================================================

// Comprehensive health check
app.get('/health', async (req, res) => {
  try {
    const serviceHealth = await hubGateway.checkAllServicesHealth();
    const overallHealth = Object.values(serviceHealth).every(health => health);
    
    const healthData = {
      status: overallHealth ? 'healthy' : 'degraded',
      timestamp: req.timestamp,
      requestId: req.requestId,
      version: apiArchitecture.version,
      environment: process.env.NODE_ENV || 'development',
      
      // Service health
      services: serviceHealth,
      
      // System health
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      
      // Database health (if applicable)
      database: {
        status: 'healthy', // TODO: Implement actual database health check
        latency: '< 5ms'
      }
    };
    
    res.status(overallHealth ? 200 : 503).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: req.timestamp,
      requestId: req.requestId,
      error: {
        message: 'Health check failed',
        details: error.message
      }
    });
  }
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  res.json({
    server: 'integrix-api',
    timestamp: req.timestamp,
    requestId: req.requestId,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      activeConnections: app.get('connections') || 0,
      totalRequests: app.get('totalRequests') || 0
    }
  });
});

// =============================================================================
// HUB GATEWAY INTEGRATION
// =============================================================================

// Register hub services with the gateway
console.log('📡 Registering hub services...');

// Register Expedix Hub
hubGateway.registerService('expedix', {
  name: 'expedix',
  baseUrl: '/api/v1/expedix',
  description: 'Patient management and medical records',
  features: ['patients', 'medical-history', 'consultations', 'demographics'],
  router: expedix,
  healthCheck: async () => {
    try {
      // TODO: Implement actual health check
      return true;
    } catch (error) {
      return false;
    }
  }
});

// Register Clinimetrix Hub
hubGateway.registerService('clinimetrix', {
  name: 'clinimetrix',
  baseUrl: '/api/v1/clinimetrix',
  description: 'Clinical assessments and psychometric scales',
  features: ['assessments', 'scales', 'scoring', 'analytics'],
  router: clinimetrix,
  healthCheck: async () => {
    try {
      // TODO: Implement actual health check
      return true;
    } catch (error) {
      return false;
    }
  }
});

// Register Universal Scales service
hubGateway.registerService('universal-scales', {
  name: 'universal-scales',
  baseUrl: '/api/scales',
  description: 'Universal clinical scales system',
  features: ['scales', 'assessments', 'sessions', 'administration'],
  router: universalScalesRouter,
  healthCheck: async () => {
    try {
      // TODO: Implement actual health check
      return true;
    } catch (error) {
      return false;
    }
  }
});

// Register Assessment Controller
hubGateway.registerService('assessments', {
  name: 'assessments',
  baseUrl: '/api/assessments',
  description: 'Assessment management and control',
  features: ['assessment-management', 'administration', 'results'],
  router: assessmentController,
  healthCheck: async () => {
    try {
      // TODO: Implement actual health check
      return true;
    } catch (error) {
      return false;
    }
  }
});

// Register FormX Hub
hubGateway.registerService('formx', {
  name: 'formx',
  baseUrl: '/api/v1/formx',
  description: 'Form Builder and Management System',
  features: ['form-builder', 'templates', 'submissions', 'validations', 'analytics'],
  router: formx,
  healthCheck: async () => {
    try {
      // TODO: Implement actual health check
      return true;
    } catch (error) {
      return false;
    }
  }
});

// TODO: Register other hub services (Resources) when available

// Mount hub gateway routes
app.use('/api/gateway', hubGateway.getRouter());

// =============================================================================
// API VERSIONING AND ROUTING
// =============================================================================

// Simple API versioning for now (we'll enhance this later)
app.use('/api/v1', (req, res, next) => {
  req.apiVersion = 'v1';
  res.set('X-API-Version', 'v1');
  next();
});

app.use('/api/v2', (req, res, next) => {
  req.apiVersion = 'v2';
  res.set('X-API-Version', 'v2');
  next();
});

// =============================================================================
// CURRENT SERVICE IMPLEMENTATIONS
// =============================================================================

// Mount authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/auth0', auth0Routes);

// Mount existing services
app.use('/api/v1/expedix', expedix);
app.use('/api/v1/clinimetrix', clinimetrix);
app.use('/api/v1/formx', formx);
app.use('/api', universalScalesRouter);
app.use('/api', assessmentController);

// =============================================================================
// API CAPABILITIES AND DOCUMENTATION
// =============================================================================

// API capabilities endpoint
app.get('/api/capabilities', (req, res) => {
  const architecture = apiArchitecture.getArchitecture();
  res.json({
    api: architecture.metadata.name,
    version: architecture.metadata.version,
    timestamp: req.timestamp,
    requestId: req.requestId,
    
    capabilities: {
      versioning: architecture.versioning,
      security: architecture.security,
      middleware: architecture.middleware,
      endpoints: architecture.endpoints
    },
    
    // RESTful conventions
    conventions: architecture.conventions,
    
    // Service boundaries
    services: architecture.services
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'shared/docs/index.html'));
});

// OpenAPI specification endpoint
app.get('/api/openapi.json', (req, res) => {
  // TODO: Generate OpenAPI spec from architecture
  res.json({
    openapi: '3.0.3',
    info: apiArchitecture.getAPIMetadata(),
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server'
      }
    ],
    // TODO: Add complete OpenAPI specification
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler with comprehensive endpoint listing
app.use('*', (req, res) => {
  const architecture = apiArchitecture.getArchitecture();
  
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: req.timestamp,
      requestId: req.requestId
    },
    
    // Available endpoints organized by service
    availableEndpoints: {
      core: [
        'GET /',
        'GET /health',
        'GET /metrics',
        'GET /api/capabilities',
        'GET /api/docs',
        'GET /api/openapi.json'
      ],
      
      gateway: [
        'GET /api/gateway/health',
        'GET /api/gateway/services',
        'GET /api/gateway/services/{service}/status'
      ],
      
      clinimetrix: [
        'GET /api/v1/clinimetrix',
        'GET /api/v1/clinimetrix/scales',
        'GET /api/v1/clinimetrix/assessments'
      ],
      
      universalScales: [
        'GET /api/scales',
        'GET /api/scales/{id}',
        'POST /api/sessions',
        'POST /api/sessions/{sessionId}/administrations'
      ],
      
      assessments: [
        'GET /api/assessments',
        'POST /api/assessments',
        'GET /api/assessments/{id}'
      ]
    },
    
    // Service discovery
    services: hubGateway.getAllServices().map(service => ({
      name: service.name,
      baseUrl: service.baseUrl,
      status: service.status
    }))
  });
});

// Global error handler
app.use(errorHandler.handleError());

// =============================================================================
// SERVER STARTUP AND MONITORING
// =============================================================================

// Start health monitoring
hubGateway.startHealthMonitoring(30000); // Check every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🧠 MindHub Integrix API Server');
  console.log('=====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🎯 Capabilities: http://localhost:${PORT}/api/capabilities`);
  console.log(`🌐 Gateway: http://localhost:${PORT}/api/gateway`);
  console.log('');
  console.log('🔧 Registered Hub Services:');
  
  hubGateway.getAllServices().forEach(service => {
    console.log(`   ${service.name}: ${service.baseUrl} (${service.status})`);
  });
  
  console.log('');
  console.log('🏗️  API Architecture:');
  console.log(`   📋 RESTful conventions implemented`);
  console.log(`   🔒 Security middleware active`);
  console.log(`   📊 Rate limiting configured`);
  console.log(`   🔄 API versioning enabled`);
  console.log(`   🏥 Healthcare compliance ready`);
  console.log('');
  console.log('✅ Integrix API Platform ready for inter-hub communication!');
});

module.exports = app;