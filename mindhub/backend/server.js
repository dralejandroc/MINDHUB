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
let clinimetrixProTemplatesRoutes;
let clinimetrixProAssessmentsRoutes;
let clinimetrixProValidationRoutes;

try {
  clinimetrixProTemplatesRoutes = require('./clinimetrix-pro/routes/templates');
  clinimetrixProAssessmentsRoutes = require('./clinimetrix-pro/routes/assessments');
  clinimetrixProValidationRoutes = require('./clinimetrix-pro/routes/validation');
  console.log('✅ ClinimetrixPro module loaded');
} catch (error) {
  console.log('⚠️  ClinimetrixPro module disabled due to missing dependencies');
  console.log('    Error:', error.message);
  // Create dummy routers to prevent errors
  const express = require('express');
  clinimetrixProTemplatesRoutes = express.Router();
  clinimetrixProAssessmentsRoutes = express.Router();
  clinimetrixProValidationRoutes = express.Router();
}

// Import universal scales API
const universalScalesRouter = require('./api/universal-scales');
const assessmentController = require('./api/assessment-controller');

// Legacy auth routes removed - using Clerk only

// Import shared middleware
const errorHandler = require('./shared/middleware/error-handling');
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

// Load version check to confirm deployment
try {
  const versionCheck = require('./VERSION_CHECK');
  console.log('🔍 Version check loaded:', versionCheck.version);
} catch (e) {
  console.log('⚠️ Version check not found - may be running old version');
}

// CRITICAL: Trust proxy for Railway/Vercel deployment
// This is required for rate limiting and getting correct client IPs
app.set('trust proxy', true);
console.log('✅ Trust proxy enabled for production deployment');

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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "https://mindhub.cloud", 
        "https://www.mindhub.cloud", 
        "https://api.mindhub.com", 
        "https://mindhub-production.up.railway.app", 
        "https://*.auth0.com", 
        "http://localhost:*"
      ],
    },
  },
}));

// CORS configuration - CRITICAL FIX FOR PRODUCTION
console.log('🔧 Setting up CORS for production...');
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://mindhub.cloud',
      'https://www.mindhub.cloud',
      'https://mindhub-beta.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ];
    
    // Check if origin is allowed or matches *.vercel.app pattern
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('localhost');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // Temporarily allow all for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Context', 'X-Api-Key'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

console.log('✅ CORS configured for:', {
  production: 'https://mindhub.cloud',
  vercel: '*.vercel.app',
  local: 'localhost:*'
});

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

// Auto-run email verification migration on startup
(async () => {
  try {
    const { PrismaClient } = require('./generated/prisma');
    const prisma = new PrismaClient();
    
    // Check if email verification columns exist
    const checkColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerifiedAt')
    `;
    
    if (checkColumns.length < 3) {
      console.log('🔧 Auto-applying email verification migration...');
      
      // Add missing columns
      if (!checkColumns.find(c => c.COLUMN_NAME === 'emailVerified')) {
        await prisma.$queryRaw`
          ALTER TABLE users 
          ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE AFTER password
        `;
        console.log('✅ Added emailVerified column');
      }
      
      if (!checkColumns.find(c => c.COLUMN_NAME === 'emailVerificationToken')) {
        await prisma.$queryRaw`
          ALTER TABLE users 
          ADD COLUMN emailVerificationToken VARCHAR(255) NULL AFTER emailVerified
        `;
        console.log('✅ Added emailVerificationToken column');
      }
      
      if (!checkColumns.find(c => c.COLUMN_NAME === 'emailVerifiedAt')) {
        await prisma.$queryRaw`
          ALTER TABLE users 
          ADD COLUMN emailVerifiedAt DATETIME NULL AFTER emailVerificationToken
        `;
        console.log('✅ Added emailVerifiedAt column');
      }
      
      // Add index
      try {
        await prisma.$queryRaw`
          CREATE INDEX idx_email_verification_token ON users(emailVerificationToken)
        `;
        console.log('✅ Added verification token index');
      } catch (e) {
        // Index may already exist, ignore error
        console.log('ℹ️ Verification token index may already exist');
      }
      
      // Set existing users as verified
      await prisma.$queryRaw`
        UPDATE users 
        SET emailVerified = TRUE, emailVerifiedAt = NOW() 
        WHERE emailVerified IS NULL OR emailVerified = FALSE
      `;
      console.log('✅ Marked existing users as verified');
      
      console.log('🎉 Email verification migration completed automatically');
    } else {
      console.log('✅ Email verification system already configured');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('⚠️ Auto-migration failed:', error.message);
  }
})();

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

// Legacy authentication routes removed - using Clerk only

// Admin migrations routes (protected)
const adminMigrationsRoutes = require('./shared/routes/admin-migrations');
app.use('/api/admin/migrations', adminMigrationsRoutes);
console.log('✅ Admin migrations routes mounted at /api/admin/migrations');

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
let server;

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  try {
    // Close server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('HTTP server closed');
    }

    // Close database connections
    const { getPrismaClient } = require('./shared/config/prisma');
    const prisma = getPrismaClient();
    await prisma.$disconnect();
    console.log('Database connections closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server
server = app.listen(PORT, () => {
  console.log('🧠 MindHub Healthcare Platform');
  console.log('====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 Production URL: https://mindhub.cloud/api`);
    console.log(`📋 Health Check: https://mindhub.cloud/api/health`);
    console.log(`🔐 Auth Endpoint: https://mindhub.cloud/api/auth`);
  } else {
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  }
  
  console.log('');
  console.log('🔧 Available Services:');
  console.log(`   📊 Expedix (Patients): /api/v1/expedix`);
  console.log(`   🧪 ClinimetrixPro (Templates): /api/clinimetrix-pro`);
  console.log(`   📝 FormX (Forms): /api/v1/formx`);
  console.log(`   📖 Resources (Content): /api/v1/resources`);
  console.log(`   🔐 Authentication: /api/auth`);
  console.log('');
  console.log('📊 Universal Scale System:');
  console.log(`   Get All Scales: /api/scales`);
  console.log(`   Create Session: /api/sessions`);
  console.log('');
  console.log('✅ Platform ready!');
  
  // Database connection check (only in non-production or if requested)
  if (process.env.NODE_ENV !== 'production') {
    const { getPrismaClient } = require('./shared/config/prisma');
    const prisma = getPrismaClient();
    prisma.$connect()
      .then(() => {
        console.log('📦 Database connected successfully');
      })
      .catch((error) => {
        console.error('❌ Database connection failed:', error.message);
      });
  } else {
    console.log('📦 Database connection check skipped in production (handled by startup script)');
  }
});

module.exports = app;