/**
 * ClinimetrixPro Remote Assessments Routes
 * Handles tokenized remote assessment links and administration
 */

const express = require('express');
const { getPrismaClient } = require('../../shared/config/prisma');
const crypto = require('crypto');
// const { supabaseAuth } = require('../../shared/middleware/supabase-auth-middleware');

const router = express.Router();
const prisma = getPrismaClient();

/**
 * POST /api/clinimetrix-pro/remote-assessments/create
 * Create a tokenized remote assessment link
 */
router.post('/create', async (req, res) => {
  try {
    const {
      templateId,
      patientId,
      patientEmail,
      patientName,
      administratorId,
      expiresInHours = 72, // 3 days default
      message = null,
      reminderEnabled = true
    } = req.body;

    // Validate required fields
    if (!templateId || !patientEmail || !patientName || !administratorId) {
      return res.status(400).json({ 
        error: 'templateId, patientEmail, patientName, and administratorId are required' 
      });
    }

    // Verify template exists
    const template = await prisma.clinimetrix_templates.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create remote assessment record
    const remoteAssessment = await prisma.clinimetrix_remote_assessments.create({
      data: {
        id: `remote_${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        token: token,
        templateId: templateId,
        patientId: patientId || null,
        patientEmail: patientEmail,
        patientName: patientName,
        administratorId: administratorId,
        status: 'pending',
        expiresAt: expiresAt,
        message: message,
        reminderEnabled: reminderEnabled,
        metadata: {
          templateName: template.templateData.metadata.name,
          templateAbbreviation: template.templateData.metadata.abbreviation,
          createdAt: new Date().toISOString(),
          expiresInHours: expiresInHours
        }
      }
    });

    // Generate the assessment URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mindhub.cloud';
    const assessmentUrl = `${baseUrl}/evaluacion/${token}`;

    res.json({
      success: true,
      data: {
        id: remoteAssessment.id,
        token: remoteAssessment.token,
        url: assessmentUrl,
        expiresAt: remoteAssessment.expiresAt,
        templateName: template.templateData.metadata.name,
        patientName: patientName,
        patientEmail: patientEmail
      }
    });

  } catch (error) {
    console.error('❌ Error creating remote assessment:', error);
    res.status(500).json({ 
      error: 'Error creating remote assessment',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix-pro/remote-assessments/token/:token
 * Get remote assessment by token (for patient access)
 */
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const remoteAssessment = await prisma.clinimetrix_remote_assessments.findUnique({
      where: { token },
      include: {
        clinimetrix_templates: {
          select: {
            id: true,
            templateData: true
          }
        }
      }
    });

    if (!remoteAssessment) {
      return res.status(404).json({ error: 'Assessment link not found' });
    }

    // Check if expired
    if (new Date() > remoteAssessment.expiresAt) {
      return res.status(410).json({ 
        error: 'Assessment link has expired',
        expiredAt: remoteAssessment.expiresAt
      });
    }

    // Check if already completed
    if (remoteAssessment.status === 'completed') {
      return res.status(409).json({ 
        error: 'Assessment has already been completed',
        completedAt: remoteAssessment.completedAt
      });
    }

    res.json({
      success: true,
      data: {
        id: remoteAssessment.id,
        templateId: remoteAssessment.templateId,
        templateData: remoteAssessment.clinimetrix_templates.templateData,
        patientName: remoteAssessment.patientName,
        message: remoteAssessment.message,
        expiresAt: remoteAssessment.expiresAt,
        metadata: remoteAssessment.metadata
      }
    });

  } catch (error) {
    console.error('❌ Error getting remote assessment:', error);
    res.status(500).json({ 
      error: 'Error retrieving assessment',
      message: error.message 
    });
  }
});

/**
 * POST /api/clinimetrix-pro/remote-assessments/token/:token/start
 * Start a remote assessment (create assessment record)
 */
router.post('/token/:token/start', async (req, res) => {
  try {
    const { token } = req.params;

    const remoteAssessment = await prisma.clinimetrix_remote_assessments.findUnique({
      where: { token }
    });

    if (!remoteAssessment) {
      return res.status(404).json({ error: 'Assessment link not found' });
    }

    if (new Date() > remoteAssessment.expiresAt) {
      return res.status(410).json({ error: 'Assessment link has expired' });
    }

    if (remoteAssessment.status !== 'pending') {
      return res.status(409).json({ error: 'Assessment already started or completed' });
    }

    // Create actual assessment record
    const assessmentId = `assessment_remote_${remoteAssessment.templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const assessment = await prisma.clinimetrix_assessments.create({
      data: {
        id: assessmentId,
        templateId: remoteAssessment.templateId,
        patientId: remoteAssessment.patientId,
        administratorId: remoteAssessment.administratorId,
        status: 'in_progress',
        responses: {},
        metadata: {
          ...remoteAssessment.metadata,
          mode: 'remote',
          remoteAssessmentId: remoteAssessment.id,
          patientEmail: remoteAssessment.patientEmail,
          startedAt: new Date().toISOString()
        }
      }
    });

    // Update remote assessment status
    await prisma.clinimetrix_remote_assessments.update({
      where: { id: remoteAssessment.id },
      data: {
        status: 'in_progress',
        assessmentId: assessment.id,
        startedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        assessmentId: assessment.id,
        remoteAssessmentId: remoteAssessment.id,
        templateId: remoteAssessment.templateId
      }
    });

  } catch (error) {
    console.error('❌ Error starting remote assessment:', error);
    res.status(500).json({ 
      error: 'Error starting assessment',
      message: error.message 
    });
  }
});

/**
 * POST /api/clinimetrix-pro/remote-assessments/token/:token/complete
 * Complete a remote assessment
 */
router.post('/token/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const { responses, demographics } = req.body;

    const remoteAssessment = await prisma.clinimetrix_remote_assessments.findUnique({
      where: { token }
    });

    if (!remoteAssessment) {
      return res.status(404).json({ error: 'Assessment link not found' });
    }

    if (!remoteAssessment.assessmentId) {
      return res.status(400).json({ error: 'Assessment not started' });
    }

    // Get the assessment and complete it (reuse existing completion logic)
    const ScoringEngine = require('../services/ScoringEngine');
    const scoringEngine = new ScoringEngine();

    // Get template
    const template = await prisma.clinimetrix_templates.findUnique({
      where: { id: remoteAssessment.templateId }
    });

    // Calculate results
    const scoringResults = await scoringEngine.calculateResults(
      template.templateData, 
      responses, 
      { demographics }
    );

    // Update assessment
    const updatedAssessment = await prisma.clinimetrix_assessments.update({
      where: { id: remoteAssessment.assessmentId },
      data: {
        responses: responses,
        scores: scoringResults,
        interpretation: scoringResults.interpretation,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          ...remoteAssessment.metadata,
          totalScore: scoringResults.totalScore,
          severityLevel: scoringResults.severityLevel,
          validityIndicators: scoringResults.validityIndicators,
          completedRemotely: true,
          completedAt: new Date().toISOString()
        }
      }
    });

    // Update remote assessment
    await prisma.clinimetrix_remote_assessments.update({
      where: { id: remoteAssessment.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        responses: responses,
        results: scoringResults
      }
    });

    res.json({
      success: true,
      assessment: updatedAssessment,
      results: scoringResults
    });

  } catch (error) {
    console.error('❌ Error completing remote assessment:', error);
    res.status(500).json({ 
      error: 'Error completing assessment',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix-pro/remote-assessments/list
 * Get list of remote assessments for administrator
 */
router.get('/list', async (req, res) => {
  try {
    const { administratorId, status, limit = 20, offset = 0 } = req.query;

    if (!administratorId) {
      return res.status(400).json({ error: 'administratorId is required' });
    }

    const where = {
      administratorId: administratorId
    };

    if (status) {
      where.status = status;
    }

    const remoteAssessments = await prisma.clinimetrix_remote_assessments.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        clinimetrix_templates: {
          select: {
            templateData: true
          }
        }
      }
    });

    const total = await prisma.clinimetrix_remote_assessments.count({ where });

    res.json({
      success: true,
      data: remoteAssessments.map(ra => ({
        id: ra.id,
        templateId: ra.templateId,
        templateName: ra.clinimetrix_templates.templateData.metadata.name,
        patientName: ra.patientName,
        patientEmail: ra.patientEmail,
        status: ra.status,
        createdAt: ra.createdAt,
        expiresAt: ra.expiresAt,
        startedAt: ra.startedAt,
        completedAt: ra.completedAt,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mindhub.cloud'}/evaluacion/${ra.token}`
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + remoteAssessments.length < total
      }
    });

  } catch (error) {
    console.error('❌ Error listing remote assessments:', error);
    res.status(500).json({ 
      error: 'Error retrieving remote assessments',
      message: error.message 
    });
  }
});

module.exports = router;