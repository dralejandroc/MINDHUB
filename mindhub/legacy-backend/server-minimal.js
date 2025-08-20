#!/usr/bin/env node

/**
 * SERVIDOR MINIMALISTA PARA MINDHUB
 * Servidor simplificado para probar la funcionalidad básica
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import universal scales API
const scalesController = require('./api/scales-controller');
const assessmentController = require('./api/assessment-controller');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware básico
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      clinimetrix: '/api/clinimetrix',
      scales: '/api/scales',
      sessions: '/api/sessions',
      assessments: '/api/assessments'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected'
  });
});

// Clinimetrix hub
app.get('/api/clinimetrix', (req, res) => {
  res.json({
    hub: 'Clinimetrix',
    description: 'Clinical Assessment System',
    version: '1.0.0',
    system: 'universal',
    endpoints: {
      scales: '/api/clinimetrix/scales',
      health: '/api/clinimetrix/health'
    }
  });
});

// Clinimetrix health
app.get('/api/clinimetrix/health', (req, res) => {
  res.json({
    status: 'healthy',
    hub: 'Clinimetrix',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      universal_scales: 'active',
      scoring_engine: 'active'
    }
  });
});

// Clinimetrix scales - integrar con sistema universal
app.get('/api/clinimetrix/scales', async (req, res) => {
  try {
    const UniversalScaleService = require('./services/UniversalScaleService');
    const scaleService = new UniversalScaleService();
    
    const scales = await scaleService.getAllScales();
    
    res.json({
      success: true,
      data: scales.map(scale => ({
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        description: scale.description,
        category: scale.category,
        totalItems: scale.totalItems,
        estimatedDurationMinutes: scale.estimatedDurationMinutes,
        isActive: scale.isActive,
        system: 'universal'
      })),
      count: scales.length,
      system: 'universal'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      system: 'universal'
    });
  }
});

// Clinimetrix scale details
app.get('/api/clinimetrix/scales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const UniversalScaleService = require('./services/UniversalScaleService');
    const scaleService = new UniversalScaleService();
    
    const scale = await scaleService.getScaleById(id);
    
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Scale not found',
        system: 'universal'
      });
    }
    
    res.json({
      success: true,
      data: scale,
      system: 'universal'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      system: 'universal'
    });
  }
});

// Mount universal API directly
app.use('/api/scales', scalesController);
app.use('/api/sessions', assessmentController);
app.use('/api/assessments', assessmentController);
app.use('/api/administrations', assessmentController);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: {
      root: '/',
      health: '/health',
      clinimetrix: '/api/clinimetrix',
      scales: '/api/scales'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🧠 MindHub Healthcare Platform');
  console.log('====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔧 Available Services:');
  console.log(`   🧪 Clinimetrix: http://localhost:${PORT}/api/clinimetrix`);
  console.log(`   📊 Scales: http://localhost:${PORT}/api/clinimetrix/scales`);
  console.log(`   🔗 Universal API: http://localhost:${PORT}/api/scales`);
  console.log('');
  console.log('✅ Platform ready for testing!');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;