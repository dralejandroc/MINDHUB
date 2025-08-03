/**
 * ClinimetrixPro Module - Advanced Clinical Assessment System
 * 
 * Provides comprehensive clinical assessment functionality with:
 * - Dynamic scale rendering from JSON templates
 * - Professional and patient-facing interfaces
 * - Real-time scoring and interpretation
 * - Scientific documentation integration
 */

const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

// Import routes
const templatesRoutes = require('./routes/templates');
const assessmentsRoutes = require('./routes/assessments');

// Mount routes
router.use('/templates', templatesRoutes);
router.use('/assessments', assessmentsRoutes);

// Backward compatibility route for patient-assessments
router.get('/patient-assessments/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const assessments = await prisma.clinimetrixAssessment.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            templateData: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error getting patient assessments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving patient assessments' 
    });
  }
});

// Remote assessments route for token-based evaluations
router.get('/remote-assessments/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // For now, return a basic error since we need to implement the remote assessment system
    res.status(404).json({
      success: false,
      error: 'Esta evaluación no existe o el enlace es inválido'
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error validando token' 
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const templatesCount = await prisma.clinimetrixTemplate.count();
    res.json({
      status: 'healthy',
      service: 'ClinimetrixPro',
      version: '1.0.0',
      templates: templatesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ClinimetrixPro',
      error: error.message
    });
  }
});

module.exports = router;