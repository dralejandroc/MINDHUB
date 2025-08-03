/**
 * ClinimetrixPro Assessments Routes
 * Handles assessment creation, management, and completion
 */

const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const ScoringEngine = require('../services/ScoringEngine');

const router = express.Router();
const prisma = new PrismaClient();
const scoringEngine = new ScoringEngine();

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
    const registryEntry = await prisma.clinimetrixRegistry.findFirst({
      where: { templateId: templateId, isActive: true }
    });

    if (!registryEntry) {
      return res.status(404).json({ error: 'Template not found in registry' });
    }

    // Create assessment with simplified data - no foreign key constraints to avoid issues
    const assessment = await prisma.clinimetrixAssessment.create({
      data: {
        templateId,
        patientId: patientId || null,
        administratorId: administratorId || 'system',
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
    
    const assessment = await prisma.clinimetrixAssessment.findUnique({
      where: { id: assessmentId },
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

    const assessment = await prisma.clinimetrixAssessment.update({
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

    // Get assessment 
    const assessment = await prisma.clinimetrixAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get template data separately to avoid foreign key issues
    const template = await prisma.clinimetrixTemplate.findFirst({
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
    const updatedAssessment = await prisma.clinimetrixAssessment.update({
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
    const template = await prisma.clinimetrixTemplate.findUnique({
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
    
    const assessments = await prisma.clinimetrixAssessment.findMany({
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
    
    await prisma.clinimetrixAssessment.delete({
      where: { id: assessmentId }
    });

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Error deleting assessment' });
  }
});

module.exports = router;