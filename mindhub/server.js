const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mindhub-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.auth0.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: process.env.AUTH0_SESSION_COOKIE_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.AUTH0_SESSION_COOKIE_LIFETIME) || 604800000 // 7 days
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`, {
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Request validation middleware
app.use((req, res, next) => {
  // Validate JSON payload size for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      return res.status(413).json({
        error: 'Payload too large',
        message: 'Request payload exceeds maximum allowed size',
        maxSize: '10MB'
      });
    }
  }
  
  // Validate Content-Type for API requests with body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.path.startsWith('/api/')) {
    const contentType = req.get('Content-Type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json or multipart/form-data',
        received: contentType
      });
    }
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mindhub-api',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'MindHub API',
    status: 'operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hubs: {
      expedix: {
        name: 'Patient Management System',
        status: 'active',
        endpoints: ['/patients', '/medical-history', '/consultations']
      },
      clinimetrix: {
        name: 'Clinical Assessment System',
        status: 'active', 
        endpoints: ['/scales', '/assessments', '/administration']
      },
      formx: {
        name: 'Form Builder System',
        status: 'active',
        endpoints: ['/forms', '/templates', '/submissions']
      },
      resources: {
        name: 'Psychoeducational Library',
        status: 'active',
        endpoints: ['/library', '/distribution', '/management']
      }
    },
    security: {
      authentication: 'JWT-based',
      authorization: 'Role and Permission-based',
      compliance: 'NOM-024-SSA3-2010',
      encryption: 'End-to-end'
    },
    timestamp: new Date().toISOString()
  });
});

// Import middleware and routes
const { createFileServer } = require('./backend/shared/middleware/fileserver');
const { config: storageConfig } = require('./backend/shared/config/storage');
const hubGateway = require('./backend/shared/services/hub-gateway');
const hubAuth = require('./backend/shared/middleware/hub-auth');

// Auth routes
const authRoutes = require('./backend/shared/routes/auth');
app.use('/api/auth', authRoutes);

// Storage routes
const storageRoutes = require('./backend/shared/routes/storage');
app.use('/api/storage', storageRoutes);

// Dashboard routes
const dashboardRoutes = require('./backend/shared/routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// Secure file server for uploads (only in development - production uses CDN)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', createFileServer(storageConfig.local.uploadDir));
}

// Add authentication middleware for API routes
app.use('/api', hubAuth.authenticate());

// Hub Gateway - Service discovery and health monitoring
app.use('/api/gateway', hubGateway.getRouter());

// Hub-specific routes with gateway registration
// Expedix Hub - Patient Management System
const expedixRoutes = require('./backend/expedix/index');
hubGateway.registerService('expedix', {
  router: expedixRoutes,
  description: 'Patient Management System',
  features: [
    'Patient Demographics Management',
    'Medical History Tracking',
    'Clinical Consultations (SOAP Notes)',
    'Prescription Management',
    'Healthcare Compliance (NOM-024)'
  ],
  healthCheck: async () => {
    try {
      const mysql = require('./backend/shared/config/mysql');
      return await mysql.healthCheck();
    } catch (error) {
      return false;
    }
  }
});
app.use('/api/expedix', hubAuth.requireHubAccess('expedix'), expedixRoutes);

// Clinimetrix Hub - Clinical Assessment System (temporarily disabled)
// const clinimetrixRoutes = require('./backend/clinimetrix/index');
// hubGateway.registerService('clinimetrix', {
//   router: clinimetrixRoutes,
//   description: 'Clinical Assessment System',
//   features: ['50+ Clinical Scales', 'Automated Scoring', 'Secure Tokenized Links']
// });
// app.use('/api/clinimetrix', hubAuth.requireHubAccess('clinimetrix'), clinimetrixRoutes);

// Formx Hub - Form Builder System (temporarily disabled)
// const formxRoutes = require('./backend/formx/index');
// hubGateway.registerService('formx', {
//   router: formxRoutes,
//   description: 'Form Builder System',
//   features: ['Drag-and-drop Editor', 'PDF Import', 'JotForm Compatibility']
// });
// app.use('/api/formx', hubAuth.requireHubAccess('formx'), formxRoutes);

// Resources Hub - Psychoeducational Library (temporarily disabled)
// const resourcesRoutes = require('./backend/resources/index');
// hubGateway.registerService('resources', {
//   router: resourcesRoutes,
//   description: 'Psychoeducational Library',
//   features: ['Categorized Catalog', 'Secure Downloads', 'Version Control']
// });
// app.use('/api/resources', hubAuth.requireHubAccess('resources'), resourcesRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error with full context
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.details || err.message
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (err.name === 'ForbiddenError' || err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'Uploaded file exceeds size limit',
      maxSize: '10MB'
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Database constraint errors
  if (err.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      field: err.meta?.target?.[0] || 'unknown'
    });
  }

  if (err.code === 'P2025') { // Prisma record not found
    return res.status(404).json({
      error: 'Not Found',
      message: 'Requested resource was not found'
    });
  }

  // Generic error response
  const statusCode = err.status || err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
      message: statusCode >= 500 ? 'Something went wrong on our end' : err.message || 'Request could not be processed',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(statusCode).json({
      error: 'Server Error',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 - Resource not found', {
    path: req.path,
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: req.path.startsWith('/api/') ? {
      expedix: '/api/expedix',
      clinimetrix: '/api/clinimetrix',
      formx: '/api/formx',
      resources: '/api/resources'
    } : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`MindHub server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Available Hubs: Clinimetrix, Expedix, Formx, Resources');
  
  // Start hub health monitoring
  hubGateway.startHealthMonitoring(30000); // Check every 30 seconds
  logger.info('Hub gateway health monitoring started');
});

module.exports = app;