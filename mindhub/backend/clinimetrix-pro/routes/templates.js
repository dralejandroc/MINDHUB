/**
 * ClinimetrixPro Templates Routes
 * Handles template management and catalog operations
 */

const express = require('express');
const { getPrismaClient } = require('../../shared/config/prisma');
// const { combinedAuth, requireAuth } = require('../../shared/middleware/clerk-auth-middleware');

const router = express.Router();
const prisma = getPrismaClient();

// Apply Clerk authentication middleware to all routes
// TEMPORARILY DISABLED FOR TESTING
// router.use(combinedAuth);
// router.use(requireAuth);

// Get all templates catalog (public registry)
router.get('/catalog', async (req, res) => {
  try {
    console.log('📋 Getting ClinimetrixPro catalog...');
    
    const templates = await prisma.clinimetrix_registry.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [
        { isFeatured: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`✅ Found ${templates.length} templates in catalog`);
    
    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    console.error('❌ Error getting catalog:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving catalog', 
      message: error.message 
    });
  }
});

// Get template by ID
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const template = await prisma.clinimetrix_templates.findUnique({
      where: { id: templateId, isActive: true }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template.templateData);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Error retrieving template' });
  }
});

// Get template metadata by ID
router.get('/:templateId/metadata', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const registry = await prisma.clinimetrix_registry.findUnique({
      where: { templateId, isActive: true }
    });

    if (!registry) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(registry);
  } catch (error) {
    console.error('Error getting template metadata:', error);
    res.status(500).json({ error: 'Error retrieving template metadata' });
  }
});

// Search templates
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const templates = await prisma.clinimetrix_registry.findMany({
      where: {
        isActive: true,
        isPublic: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { abbreviation: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({ error: 'Error searching templates' });
  }
});

// Get templates by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const templates = await prisma.clinimetrix_registry.findMany({
      where: {
        isActive: true,
        isPublic: true,
        category: { equals: category }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({ error: 'Error retrieving templates by category' });
  }
});

// Get available categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.clinimetrix_registry.groupBy({
      by: ['category'],
      where: { isActive: true, isPublic: true },
      _count: true
    });

    const result = categories.map(cat => ({
      category: cat.category,
      count: cat._count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Error retrieving categories' });
  }
});

module.exports = router;