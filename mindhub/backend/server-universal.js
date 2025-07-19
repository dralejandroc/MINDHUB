#!/usr/bin/env node

/**
 * SERVIDOR DE PRUEBAS PARA SISTEMA UNIVERSAL DE ESCALAS
 * Servidor mínimo para probar los endpoints universales
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import universal API controllers
const scalesController = require('./api/scales-controller');
const assessmentController = require('./api/assessment-controller');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-universal',
    system: 'Universal Scale System'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Universal Scale System',
    version: '1.0.0',
    description: 'Sistema universal de escalas clinimétricas',
    endpoints: {
      scales: {
        list: 'GET /api/scales',
        get: 'GET /api/scales/:id',
        process: 'POST /api/scales/:id/process',
        validate: 'POST /api/scales/:id/validate',
        export: 'GET /api/scales/:id/export'
      },
      sessions: {
        create: 'POST /api/sessions',
        startAdministration: 'POST /api/sessions/:sessionId/administrations'
      },
      administrations: {
        saveResponse: 'POST /api/administrations/:administrationId/responses',
        complete: 'POST /api/administrations/:administrationId/complete'
      },
      assessments: {
        save: 'POST /api/assessments',
        get: 'GET /api/assessments/:id',
        search: 'GET /api/assessments',
        byPatient: 'GET /api/patients/:patientId/assessments',
        byScale: 'GET /api/scales/:scaleId/assessments',
        stats: 'GET /api/assessments/stats',
        export: 'GET /api/assessments/export'
      }
    }
  });
});

// Test endpoint para verificar base de datos
app.get('/api/test/db-stats', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'mindhub.db');
    const db = new sqlite3.Database(dbPath);
    
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM scales) as scales,
          (SELECT COUNT(*) FROM scale_items) as items,
          (SELECT COUNT(*) FROM scale_response_options) as response_options,
          (SELECT COUNT(*) FROM scale_interpretation_rules) as interpretation_rules,
          (SELECT COUNT(*) FROM assessments) as assessments
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      database: 'SQLite',
      stats: stats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mount universal API endpoints
app.use('/api/scales', scalesController);
app.use('/api/assessments', assessmentController);
app.use('/api', assessmentController);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🧠 MindHub Universal Scale System');
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log('');
  console.log('🔧 Endpoints disponibles:');
  console.log(`   📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`   📊 DB Stats: http://localhost:${PORT}/api/test/db-stats`);
  console.log('');
  console.log('📊 Escalas:');
  console.log(`   Listar todas: http://localhost:${PORT}/api/scales`);
  console.log(`   PHQ-9: http://localhost:${PORT}/api/scales/phq9`);
  console.log(`   GADI: http://localhost:${PORT}/api/scales/gadi`);
  console.log(`   AQ-Adolescent: http://localhost:${PORT}/api/scales/aq-adolescent`);
  console.log(`   PAS: http://localhost:${PORT}/api/scales/pas`);
  console.log('');
  console.log('🧪 Prueba rápida:');
  console.log(`   curl http://localhost:${PORT}/api/scales`);
  console.log('');
  console.log('✅ Servidor listo para pruebas!');
  console.log('');
});