#!/usr/bin/env node

/**
 * MindHub Healthcare Platform - Development Server
 * Simplified version for local development without complex middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import modules
const expedix = require('./expedix');
const clinimetrix = require('./clinimetrix');
const formx = require('./formx');
const resources = require('./resources');

// Import universal API controllers
const scalesController = require('./api/scales-controller');
const assessmentController = require('./api/assessment-controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-dev',
    services: {
      expedix: 'active',
      clinimetrix: 'active', 
      formx: 'active',
      resources: 'active'
    }
  });
});

// Root endpoint with platform info
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform (Development)',
    version: '1.0.0-dev',
    description: 'Integrated healthcare platform for mental health professionals',
    services: {
      expedix: {
        path: '/api/expedix',
        description: 'Patient management and medical records'
      },
      clinimetrix: {
        path: '/api/clinimetrix', 
        description: 'Clinical assessments and psychometric scales'
      },
      formx: {
        path: '/api/formx',
        description: 'Dynamic forms and data collection'
      },
      resources: {
        path: '/api/resources',
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

// Test endpoint for AQ-Adolescent scale
app.get('/api/test/aq-adolescent', (req, res) => {
  try {
    const AQAdolescentScale = require('./shared/scales/aq-adolescent-scale');
    const scale = new AQAdolescentScale();
    
    res.json({
      success: true,
      scale: {
        id: scale.scaleInfo.id,
        name: scale.scaleInfo.name,
        targetPopulation: scale.scaleInfo.targetPopulation,
        totalItems: scale.items.length,
        subscales: Object.keys(scale.subscales).map(key => ({
          key,
          name: scale.subscales[key].name,
          description: scale.subscales[key].description,
          itemCount: scale.subscales[key].items.length
        })),
        responseOptions: scale.responseOptions,
        culturalWarnings: scale.scaleInfo.clinicalWarnings,
        validationStatus: scale.scaleInfo.validationStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error loading AQ-Adolescent scale',
      details: error.message
    });
  }
});

// Mount service modules (without complex middleware)
app.use('/api/expedix', expedix);
app.use('/api/clinimetrix', clinimetrix);
app.use('/api/formx', formx);
app.use('/api/resources', resources);

// Mount universal API endpoints
app.use('/api/scales', scalesController);
app.use('/api/assessments', assessmentController);
app.use('/api', assessmentController); // For session endpoints

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      docs: 'GET /api/docs',
      expedix: 'GET /api/expedix',
      clinimetrix: 'GET /api/clinimetrix',
      formx: 'GET /api/formx',
      resources: 'GET /api/resources',
      testScale: 'GET /api/test/aq-adolescent'
    }
  });
});

// Basic error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: error.stack 
    })
  });
});

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
  console.log('🧠 MindHub Healthcare Platform (Development Mode)');
  console.log('================================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log('');
  console.log('🔧 Available Services:');
  console.log(`   📊 Expedix (Patients): http://localhost:${PORT}/api/expedix`);
  console.log(`   🧪 Clinimetrix (Assessments): http://localhost:${PORT}/api/clinimetrix`);
  console.log(`   📝 FormX (Forms): http://localhost:${PORT}/api/formx`);
  console.log(`   📖 Resources (Content): http://localhost:${PORT}/api/resources`);
  console.log('');
  console.log('🧪 Test Endpoints:');
  console.log(`   AQ-Adolescent Scale Info: http://localhost:${PORT}/api/test/aq-adolescent`);
  console.log('');
  console.log('🔷 Universal Scale System:');
  console.log(`   List all scales: http://localhost:${PORT}/api/scales`);
  console.log(`   Get scale by ID: http://localhost:${PORT}/api/scales/{id}`);
  console.log(`   Process assessment: http://localhost:${PORT}/api/scales/{id}/process`);
  console.log(`   Create session: http://localhost:${PORT}/api/sessions`);
  console.log('');
  console.log('✅ Development server ready!');
});

module.exports = app;