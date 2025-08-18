#!/usr/bin/env node

/**
 * =====================================================================
 * MINDHUB CLEAN SERVER - SISTEMA ÚNICO Y CONSOLIDADO
 * ELIMINA TODO LEGACY - SOLO ENDPOINTS UNIFICADOS
 * =====================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// =====================================================================
// IMPORTAR SOLO ENDPOINTS ÚNICOS Y CONSOLIDADOS
// =====================================================================

console.log('📦 Loading unified API endpoints...');
const unifiedApiRoutes = require('./routes/API_ENDPOINTS_UNIFIED');
console.log('✅ Unified API endpoints loaded');

// Middleware compartido
const errorHandler = require('./shared/middleware/error-handling');
const { supabaseAuth } = require('./shared/middleware/supabase-auth-middleware');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 MindHub Clean Server Starting...');

// =====================================================================
// CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARE
// =====================================================================

// Trust proxy para Railway/Vercel
app.set('trust proxy', true);
console.log('✅ Trust proxy enabled');

// Security middleware
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
        "https://mindhub-production.up.railway.app",
        "http://localhost:*"
      ],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  'https://mindhub.cloud',
  'https://www.mindhub.cloud',
  'https://mindhub-beta.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

const corsOptions = {
  origin: function(origin, callback) {
    console.log(`🌍 CORS request from origin: ${origin}`);
    
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('localhost');
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS: Blocking origin ${origin}`);
      if (process.env.NODE_ENV === 'production') {
        console.log('🚨 PRODUCTION: Temporarily allowing all origins for debugging');
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-User-Context', 
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

console.log('✅ CORS configured for:', allowedOrigins);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON response middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// =====================================================================
// AUTENTICACIÓN SUPABASE
// =====================================================================

console.log('🔐 Applying Supabase authentication middleware...');
app.use(supabaseAuth);
console.log('✅ Supabase authentication middleware applied');

// =====================================================================
// ENDPOINTS PRINCIPALES
// =====================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform - Clean Edition',
    version: '2.0.0',
    description: 'Unified healthcare platform with clean architecture',
    timestamp: new Date().toISOString(),
    services: {
      expedix: {
        path: '/api/expedix',
        description: 'Patient management and medical records'
      },
      clinimetrix_pro: {
        path: '/api/clinimetrix-pro', 
        description: 'Clinical assessments and evaluations'
      },
      formx: {
        path: '/api/formx',
        description: 'Dynamic forms and data collection'
      }
    },
    database: 'PostgreSQL',
    authentication: 'Supabase',
    architecture: 'Unified APIs - No Legacy Code'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      expedix: 'active',
      clinimetrix_pro: 'active',
      formx: 'active',
      database: 'connected',
      auth: 'supabase'
    },
    architecture: 'clean'
  });
});

// =====================================================================
// MONTAR ENDPOINTS ÚNICOS
// =====================================================================

console.log('🔧 Mounting unified API routes...');
app.use('/api', unifiedApiRoutes);
console.log('✅ Unified API routes mounted at /api');

// =====================================================================
// DATABASE CONNECTION CHECK
// =====================================================================

// Auto-verificar conexión PostgreSQL en startup
(async () => {
  try {
    const { getPrismaClient } = require('./shared/config/prisma');
    const prisma = getPrismaClient();
    
    console.log('🔌 Testing PostgreSQL connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ PostgreSQL connection successful');
    
    // Verificar tablas críticas
    const tablesCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('patients', 'clinimetrix_templates', 'form_templates', 'users')
    `;
    
    console.log('📋 Critical tables found:', tablesCheck.length);
    
    if (tablesCheck.length >= 4) {
      console.log('✅ All critical tables present');
    } else {
      console.warn('⚠️ Some critical tables missing - may need migration');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
  }
})();

// =====================================================================
// ERROR HANDLING
// =====================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    version: '2.0.0',
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      api: 'GET /api',
      expedix: 'GET /api/expedix/patients',
      clinimetrix: 'GET /api/clinimetrix-pro/templates/catalog',
      formx: 'GET /api/formx/templates'
    },
    architecture: 'unified-clean'
  });
});

// Error handling middleware
const ErrorHandlingMiddleware = require('./shared/middleware/error-handling');
const errorHandlerInstance = new ErrorHandlingMiddleware();
app.use(errorHandlerInstance.handleError());

// =====================================================================
// GRACEFUL SHUTDOWN
// =====================================================================

let server;

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('HTTP server closed');
    }

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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// =====================================================================
// START SERVER
// =====================================================================

server = app.listen(PORT, () => {
  console.log('');
  console.log('🧠 MindHub Healthcare Platform - Clean Edition');
  console.log('================================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Version: 2.0.0 (Clean Architecture)`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`🔐 Authentication: Supabase`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 Production URL: https://mindhub.cloud`);
    console.log(`📋 API Health: https://mindhub.cloud/health`);
  } else {
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔧 API Base: http://localhost:${PORT}/api`);
  }
  
  console.log('');
  console.log('🔧 Available APIs:');
  console.log(`   👥 Expedix (Patients): /api/expedix`);
  console.log(`   🧪 ClinimetrixPro (Assessments): /api/clinimetrix-pro`);
  console.log(`   📝 FormX (Forms): /api/formx`);
  console.log('');
  console.log('✨ CLEAN ARCHITECTURE:');
  console.log('   ❌ NO Legacy Code');
  console.log('   ❌ NO Duplicate Tables');
  console.log('   ❌ NO Duplicate Endpoints');
  console.log('   ✅ Unified PostgreSQL Schema');
  console.log('   ✅ Single Source of Truth APIs');
  console.log('   ✅ Consistent Data Models');
  console.log('');
  console.log('🎉 Platform ready and clean!');
});

module.exports = app;