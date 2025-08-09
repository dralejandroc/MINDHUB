/**
 * ClinimetrixPro Assessments Routes
 * Handles assessment creation, management, and completion
 */

const express = require('express');
const { getPrismaClient } = require('../../shared/config/prisma');
const ScoringEngine = require('../services/ScoringEngine');
// const { combinedAuth, requireAuth } = require('../../shared/middleware/clerk-auth-middleware');

const router = express.Router();
const prisma = getPrismaClient();
const scoringEngine = new ScoringEngine();

// Apply Clerk authentication middleware to all routes
// TEMPORARILY DISABLED FOR TESTING
// router.use(combinedAuth);
// router.use(requireAuth);

// Create new assessment
router.post('/new', async (req, res) => {
  try {
    const {
      templateId,
      patientId,
      administratorId,
      mode = 'professional' // Will store in metadata instead
    } = req.body;

    // Verify template exists in registry (using templateId)
    const registryEntry = await prisma.clinimetrix_registry.findFirst({
      where: { templateId: templateId, isActive: true }
    });

    if (!registryEntry) {
      return res.status(404).json({ error: 'Template not found in registry' });
    }

    // Generate unique ID
    const assessmentId = `assessment_${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create assessment with simplified data - no foreign key constraints to avoid issues
    const assessment = await prisma.clinimetrix_assessments.create({
      data: {
        id: assessmentId,
        templateId,
        patientId: patientId || null,
        administratorId: administratorId || 'test-admin',
        status: 'pending',
        responses: {},
        metadata: { 
          mode, 
          templateName: registryEntry.name,
          templateAbbreviation: registryEntry.abbreviation
        }
      }
    });

    console.log('✅ Assessment created successfully:', assessment.id);
    res.json(assessment);
  } catch (error) {
    console.error('❌ Error creating assessment:', error);
    res.status(500).json({ 
      error: 'Error creating assessment',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get assessment by ID
router.get('/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    const assessment = await prisma.clinimetrix_assessments.findFirst({
      where: { 
        id: assessmentId,
        administratorId: req.userId
      },
      include: {
        template: true
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error getting assessment:', error);
    res.status(500).json({ error: 'Error retrieving assessment' });
  }
});

// Update assessment responses
router.put('/:assessmentId/responses', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { responses, currentStep } = req.body;

    // First verify ownership
    const existingAssessment = await prisma.clinimetrix_assessments.findFirst({
      where: {
        id: assessmentId,
        administratorId: req.userId
      }
    });

    if (!existingAssessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = await prisma.clinimetrix_assessments.update({
      where: { id: assessmentId },
      data: {
        responses,
        currentStep,
        updatedAt: new Date()
      }
    });

    res.json(assessment);
  } catch (error) {
    console.error('Error updating responses:', error);
    res.status(500).json({ error: 'Error updating responses' });
  }
});

// Complete assessment with automatic scoring
router.post('/:assessmentId/complete', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { responses, demographics } = req.body;

    // Get assessment and verify ownership
    const assessment = await prisma.clinimetrix_assessments.findFirst({
      where: { 
        id: assessmentId,
        administratorId: req.userId
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get template data separately to avoid foreign key issues
    const template = await prisma.clinimetrix_templates.findFirst({
      where: { id: assessment.templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = template.templateData;

    // Calculate results using scoring engine
    console.log('🔥 Starting scoring calculation...', {
      templateId: templateData.metadata.id,
      responseCount: Object.keys(responses).length
    });

    const scoringResults = await scoringEngine.calculateResults(
      templateData, 
      responses, 
      { demographics }
    );

    console.log('✅ Scoring completed successfully', {
      totalScore: scoringResults.totalScore,
      severity: scoringResults.severityLevel,
      validityScore: scoringResults.validityIndicators.overallValidityScore
    });

    // Update assessment with complete results - using only available schema fields
    const updatedAssessment = await prisma.clinimetrix_assessments.update({
      where: { id: assessmentId },
      data: {
        responses: responses,
        scores: scoringResults,
        interpretation: scoringResults.interpretation,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          ...assessment.metadata,
          totalScore: scoringResults.totalScore,
          severityLevel: scoringResults.severityLevel,
          subscaleScores: scoringResults.subscaleScores,
          validityIndicators: scoringResults.validityIndicators,
          completionTimeSeconds: scoringResults.completionTime?.totalTimeMs ? 
            Math.round(scoringResults.completionTime.totalTimeMs / 1000) : null
        }
      }
    });

    // Return complete results
    res.json({
      success: true,
      assessment: updatedAssessment,
      results: scoringResults
    });

  } catch (error) {
    console.error('❌ Error completing assessment:', error);
    res.status(500).json({ 
      error: 'Error completing assessment', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Calculate scores for current responses (real-time scoring)
router.post('/calculate-scores', async (req, res) => {
  try {
    const { templateId, responses, demographics } = req.body;

    // Get template
    const template = await prisma.clinimetrix_templates.findUnique({
      where: { id: templateId, isActive: true }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get template data (already parsed by Prisma)
    const templateData = template.templateData;

    // Calculate results using scoring engine
    const scoringResults = await scoringEngine.calculateResults(
      templateData, 
      responses, 
      { demographics }
    );

    res.json({
      success: true,
      results: scoringResults
    });

  } catch (error) {
    console.error('❌ Error calculating scores:', error);
    res.status(500).json({ 
      error: 'Error calculating scores', 
      message: error.message 
    });
  }
});

// Get recent assessments
router.get('/recent/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const assessments = await prisma.clinimetrix_assessments.findMany({
      where: {
        administratorId: req.userId
      },
      take: limit,
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

    res.json(assessments);
  } catch (error) {
    console.error('Error getting recent assessments:', error);
    res.status(500).json({ error: 'Error retrieving recent assessments' });
  }
});

// Get assessments by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const assessments = await prisma.clinimetrix_assessments.findMany({
      where: { 
        patientId,
        administratorId: req.userId
      },
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

    res.json(assessments);
  } catch (error) {
    console.error('Error getting patient assessments:', error);
    res.status(500).json({ error: 'Error retrieving patient assessments' });
  }
});

// Delete assessment
router.delete('/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    // Verify ownership before deletion
    const assessment = await prisma.clinimetrix_assessments.findFirst({
      where: {
        id: assessmentId,
        administratorId: req.userId
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    await prisma.clinimetrix_assessments.delete({
      where: { id: assessmentId }
    });

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Error deleting assessment' });
  }
});

module.exports = router;