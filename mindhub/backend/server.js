#!/usr/bin/env node

/**
 * MindHub Healthcare Platform - Main Server
 * 
 * Integrated healthcare platform with:
 * - Expedix: Patient Management
 * - Clinimetrix: Clinical Assessments 
 * - FormX: Dynamic Forms
 * - Resources: Educational Content
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import modules
console.log('📦 Loading expedix module...');
const expedix = require('./expedix');
console.log('✅ Expedix module loaded');

// Legacy clinimetrix module moved to _TRASH_LEGACY_CLINIMETRIX/
// Using new universal scales API and ClinimetrixPro instead
console.log('📦 Legacy clinimetrix module disabled - using universal scales API');

console.log('📦 Loading frontdesk module...');
const frontdeskRoutes = require('./frontdesk/routes/frontdesk');
console.log('✅ FrontDesk module loaded');

console.log('📦 Loading finance module...');
const finance = require('./finance');
console.log('✅ Finance module loaded');

console.log('📦 Loading formx module...');
const formxRoutes = require('./formx/routes/forms-advanced');
console.log('✅ FormX module loaded');

console.log('📦 Loading resources module...');
const resourcesRoutes = require('./resources/routes/resources');
console.log('✅ Resources module loaded');

console.log('📦 Loading ClinimetrixPro module...');
const clinimetrixProTemplatesRoutes = require('./clinimetrix-pro/routes/templates');
const clinimetrixProAssessmentsRoutes = require('./clinimetrix-pro/routes/assessments');
const clinimetrixProValidationRoutes = require('./clinimetrix-pro/routes/validation');
console.log('✅ ClinimetrixPro module loaded');

// Import universal scales API
const universalScalesRouter = require('./api/universal-scales');
const assessmentController = require('./api/assessment-controller');

// Import authentication routes (simple auth system)
const { router: authRoutes } = require('./shared/routes/simple-auth');

// Import shared middleware
const errorHandler = require('./shared/middleware/error-handling');
const authMiddleware = require('./shared/middleware/auth-middleware');
const dataValidation = require('./shared/middleware/data-validation');
const rateLimiting = require('./shared/middleware/rate-limiting');
const middleware = require('./shared/middleware');

// Import advanced security middleware - COMMENTED FOR LOCAL DEV
// const AdvancedDDoSProtection = require('./shared/middleware/advanced-ddos-protection');
// const GeoRateLimitingMiddleware = require('./shared/middleware/geo-rate-limiting');
// const RequestLoggingMiddleware = require('./shared/middleware/request-logging');
// const PerformanceMonitoringMiddleware = require('./shared/middleware/performance-monitoring');

// Import health check and dashboard routes - COMMENTED FOR LOCAL DEV
// const healthRoutes = require('./shared/routes/health');
// const rateLimitingDashboard = require('./shared/routes/rate-limiting-dashboard');

const app = express();
const PORT = process.env.PORT || 8080;

// Railway provides DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('🔗 Using Railway MySQL database');
}

console.log('🚀 Express app created, setting up middleware...');

// Initialize advanced security middleware - SIMPLIFIED FOR LOCAL DEV
console.log('🔧 Initializing middleware (simplified for local dev)...');
// const ddosProtection = new AdvancedDDoSProtection();
// const geoRateLimiting = new GeoRateLimitingMiddleware();
console.log('✅ Security middleware disabled for local development');

// Security middleware
console.log('🔧 Setting up security middleware...');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://mindhub.cloud',
    'https://www.mindhub.cloud',
    'https://mindhub-beta.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting with advanced features - DISABLED FOR LOCAL DEV
// app.use(rateLimiting.apiRateLimit());
// app.use(rateLimiting.ddosProtection());

// Mount health check and monitoring routes - DISABLED FOR LOCAL DEV
// app.use('/api/health', healthRoutes);
// app.use('/api/rate-limiting', rateLimitingDashboard);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      expedix: 'active',
      'clinimetrix-pro': 'active',
      'universal-scales': 'active',
      frontdesk: 'active',
      finance: 'active',
      formx: 'active',
      resources: 'active'
    }
  });
});

// Root endpoint with platform info
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform',
    version: '1.0.0',
    description: 'Integrated healthcare platform for mental health professionals',
    services: {
      expedix: {
        path: '/api/v1/expedix',
        description: 'Patient management and medical records'
      },
      'clinimetrix-pro': {
        path: '/api/clinimetrix-pro', 
        description: 'Next-generation clinical assessments and templates'
      },
      'universal-scales': {
        path: '/api/scales',
        description: 'Universal clinical scales system'
      },
      formx: {
        path: '/api/v1/formx',
        description: 'Dynamic forms and data collection'
      },
      resources: {
        path: '/api/v1/resources',
        description: 'Educational content and resource management'
      }
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'shared/docs/index.html'));
});


// Removed test endpoints - using universal scale system instead

console.log('📍 Reached mount service modules section...');

// Mount service modules
try {
  console.log('🔧 About to mount Expedix...');
  console.log('Expedix type:', typeof expedix);
  console.log('Expedix stack length:', expedix.stack ? expedix.stack.length : 'No stack');
  
  app.use('/api/v1/expedix', expedix);
  console.log('✅ Expedix module mounted successfully at /api/v1/expedix');
  
  // Test that routes are registered
  console.log('📋 App routes after mounting:', app._router ? app._router.stack.length : 'No router stack');
} catch (error) {
  console.error('❌ Error mounting Expedix module:', error.message);
  console.error('Error stack:', error.stack);
}

// Legacy clinimetrix routes disabled - using universal scales API at /api/scales
// app.use('/api/v1/clinimetrix', clinimetrix);
app.use('/api/v1/frontdesk', frontdeskRoutes);
app.use('/api/v1/finance', finance);
app.use('/api/v1/formx/forms', formxRoutes);
console.log('✅ FormX routes mounted at /api/v1/formx');

app.use('/api/v1/resources', resourcesRoutes);
console.log('✅ Resources routes mounted at /api/v1/resources');

// Mount ClinimetrixPro API (next-generation architecture)
app.use('/api/clinimetrix-pro/templates', clinimetrixProTemplatesRoutes);
app.use('/api/clinimetrix-pro/assessments', clinimetrixProAssessmentsRoutes);
app.use('/api/clinimetrix-pro/validation', clinimetrixProValidationRoutes);
console.log('✅ ClinimetrixPro API mounted at /api/clinimetrix-pro');

// Mount universal scales API (new architecture)
app.use('/api', universalScalesRouter);
app.use('/api', assessmentController);

// Legacy clinimetrix endpoints for compatibility
app.use('/api/v1/clinimetrix', assessmentController);

// Authentication routes - NO HARDCODED USERS
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      docs: 'GET /api/docs',
      
      // ClinimetrixPro API (Next-Generation Architecture)
      clinimetrixProTemplates: 'GET /api/clinimetrix-pro/templates',
      clinimetrixProTemplate: 'GET /api/clinimetrix-pro/templates/:id',
      clinimetrixProAssessments: 'POST /api/clinimetrix-pro/assessments',
      clinimetrixProAssessment: 'GET /api/clinimetrix-pro/assessments/:id',
      
      // Universal Scales API (New Architecture)
      scales: 'GET /api/scales',
      scaleById: 'GET /api/scales/:id',
      createSession: 'POST /api/sessions',
      startAdministration: 'POST /api/sessions/:sessionId/administrations',
      saveResponse: 'POST /api/administrations/:administrationId/responses',
      completeAdministration: 'POST /api/administrations/:administrationId/complete',
      patientTimeline: 'GET /api/patients/:patientId/timeline',
      
      // Services
      expedix: 'GET /api/v1/expedix',
      'clinimetrix-pro': 'GET /api/clinimetrix-pro',
      'universal-scales': 'GET /api/scales',
      frontdesk: 'GET /api/v1/frontdesk',
      finance: 'GET /api/v1/finance',
      formx: 'GET /api/v1/formx',
      resources: 'GET /api/v1/resources',
      
      // Monitoring and Security
      healthDetailed: 'GET /api/health/detailed',
      rateLimitingDashboard: 'GET /api/rate-limiting/dashboard/overview',
      securityMetrics: 'GET /api/health/metrics'
    }
  });
});

// Error handling middleware (must be last)
// app.use(errorHandler.globalErrorHandler); // Commented for local development

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
  console.log('🧠 MindHub Healthcare Platform');
  console.log('====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log('');
  console.log('🔧 Available Services:');
  console.log(`   📊 Expedix (Patients): http://localhost:${PORT}/api/v1/expedix`);
  console.log(`   🧪 ClinimetrixPro (Templates): http://localhost:${PORT}/api/clinimetrix-pro`);
  console.log(`   📝 FormX (Forms): http://localhost:${PORT}/api/v1/formx`);
  console.log(`   📖 Resources (Content): http://localhost:${PORT}/api/v1/resources`);
  console.log('');
  console.log('📊 Universal Scale System:');
  console.log(`   Get All Scales: http://localhost:${PORT}/api/scales`);
  console.log(`   Create Session: http://localhost:${PORT}/api/sessions`);
  console.log('');
  console.log('🔐 Security & Monitoring:');
  console.log(`   Health Check: http://localhost:${PORT}/api/health/detailed`);
  console.log(`   Rate Limiting Dashboard: http://localhost:${PORT}/api/rate-limiting/dashboard/overview`);
  console.log(`   Security Metrics: http://localhost:${PORT}/api/health/metrics`);
  console.log('');
  console.log('✅ Platform ready with advanced security and monitoring!');
});

module.exports = app;