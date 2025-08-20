#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MindHub Universal Scale System',
    version: '1.0.0',
    description: 'Sistema universal de escalas clinimétricas',
    endpoints: {
      health: '/health',
      scales: '/api/scales',
      dbStats: '/api/test/db-stats'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Universal Scale System'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Sistema universal funcionando',
    timestamp: new Date().toISOString()
  });
});

// Database stats
app.get('/api/test/db-stats', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, 'mindhub.db');
    const db = new sqlite3.Database(dbPath);
    
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM scales) as scales,
          (SELECT COUNT(*) FROM scale_items) as items,
          (SELECT COUNT(*) FROM scale_response_options) as response_options,
          (SELECT COUNT(*) FROM scale_interpretation_rules) as interpretation_rules
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    db.close();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple scales endpoint
app.get('/api/scales', async (req, res) => {
  try {
    const ScaleRepository = require('./repositories/ScaleRepository');
    const scaleRepository = new ScaleRepository();
    const scales = await scaleRepository.getAllActiveScales();
    
    res.json({
      success: true,
      count: scales.length,
      data: scales
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`📊 DB Stats: http://localhost:${PORT}/api/test/db-stats`);
  console.log(`🔧 Scales: http://localhost:${PORT}/api/scales`);
});