/**
 * ClinimetrixPro Template Validation Routes
 * Provides endpoints for validating JSON templates before storage
 */

const express = require('express');
const TemplateValidator = require('../../shared/validators/TemplateValidator');

const router = express.Router();
const validator = new TemplateValidator();

// Validate a single template
router.post('/template', async (req, res) => {
  try {
    const { template } = req.body;
    
    if (!template) {
      return res.status(400).json({ 
        error: 'Template data is required',
        isValid: false 
      });
    }

    const validation = validator.validateTemplate(template);
    
    res.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('❌ Error validating template:', error);
    res.status(500).json({ 
      error: 'Validation error',
      message: error.message,
      isValid: false
    });
  }
});

// Validate multiple templates
router.post('/templates/batch', async (req, res) => {
  try {
    const { templates } = req.body;
    
    if (!Array.isArray(templates)) {
      return res.status(400).json({ 
        error: 'Templates must be an array',
        isValid: false 
      });
    }

    const validation = validator.validateTemplates(templates);
    
    res.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('❌ Error validating templates:', error);
    res.status(500).json({ 
      error: 'Batch validation error',
      message: error.message,
      isValid: false
    });
  }
});

// Get validation summary for a template
router.post('/template/summary', async (req, res) => {
  try {
    const { template } = req.body;
    
    if (!template) {
      return res.status(400).json({ 
        error: 'Template data is required' 
      });
    }

    const summary = validator.getValidationSummary(template);
    
    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Error generating validation summary:', error);
    res.status(500).json({ 
      error: 'Summary generation error',
      message: error.message
    });
  }
});

// Validate all templates in database
router.get('/database/all', async (req, res) => {
  try {
    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    const templates = await prisma.clinimetrixTemplate.findMany({
      where: { isActive: true }
    });

    const templateData = templates.map(t => t.templateData);
    const validation = validator.validateTemplates(templateData);

    await prisma.$disconnect();

    res.json({
      success: true,
      validation,
      databaseInfo: {
        totalTemplatesInDB: templates.length,
        validatedTemplates: templateData.length
      }
    });

  } catch (error) {
    console.error('❌ Error validating database templates:', error);
    res.status(500).json({ 
      error: 'Database validation error',
      message: error.message
    });
  }
});

// Health check for validator
router.get('/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      validator: 'TemplateValidator',
      schemaLoaded: !!validator.schema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;