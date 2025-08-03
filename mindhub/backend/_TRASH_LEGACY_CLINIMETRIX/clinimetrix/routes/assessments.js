/**
 * ClinimetrixPro Assessments Routes
 * Handles assessment creation, management, and completion
 */

const express = require('express');
const { PrismaClient } = require('../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

// Create new assessment
router.post('/new', async (req, res) => {
  try {
    const {
      templateId,
      patientId,
      administratorId,
      mode = 'professional'
    } = req.body;

    // Get template to validate
    const template = await prisma.clinimetrixTemplate.findUnique({
      where: { id: templateId, isActive: true }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create assessment
    const assessment = await prisma.clinimetrixAssessment.create({
      data: {
        templateId,
        patientId,
        administratorId,
        mode,
        status: 'in_progress',
        responses: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Error creating assessment' });
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

// Complete assessment
router.post('/:assessmentId/complete', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { responses, scores, interpretation } = req.body;

    const assessment = await prisma.clinimetrixAssessment.update({
      where: { id: assessmentId },
      data: {
        responses,
        scores,
        interpretation,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json(assessment);
  } catch (error) {
    console.error('Error completing assessment:', error);
    res.status(500).json({ error: 'Error completing assessment' });
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