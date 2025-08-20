/**
 * CONTROLADOR UNIVERSAL DE ESCALAS
 * Endpoints para gestión de escalas clinimétricas
 */

const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// ENDPOINTS DE ESCALAS
// =====================================================================

/**
 * GET /api/scales
 * Obtener todas las escalas disponibles
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, isActive = 'true' } = req.query;
    
    // Construir filtros para Prisma
    const where = {
      isActive: isActive === 'true'
    };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { abbreviation: { contains: searchLower, mode: 'insensitive' } },
        { description: { contains: searchLower, mode: 'insensitive' } }
      ];
    }
    
    const scales = await prisma.scale.findMany({
      where,
      select: {
        id: true,
        name: true,
        abbreviation: true,
        version: true,
        category: true,
        subcategory: true,
        description: true,
        author: true,
        publicationYear: true,
        estimatedDurationMinutes: true,
        administrationMode: true,
        targetPopulation: true,
        totalItems: true,
        scoringMethod: true,
        scoreRangeMin: true,
        scoreRangeMax: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: scales,
      count: scales.length
    });
    
  } catch (error) {
    console.error('Error fetching scales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener escalas',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/categories
 * Obtener todas las categorías disponibles
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.scale.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });
    
    const categoryList = categories.map(c => c.category).filter(Boolean);
    
    res.json({
      success: true,
      data: categoryList,
      count: categoryList.length
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener categorías',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/stats
 * Obtener estadísticas básicas de escalas
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalScales, activeScales, categories] = await Promise.all([
      prisma.scale.count(),
      prisma.scale.count({ where: { isActive: true } }),
      prisma.scale.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { category: true }
      })
    ]);
    
    const byCategory = categories.reduce((acc, cat) => {
      acc[cat.category] = cat._count.category;
      return acc;
    }, {});
    
    const avgItems = await prisma.scale.aggregate({
      where: { isActive: true },
      _avg: { totalItems: true }
    });
    
    const stats = {
      totalScales,
      activeScales,
      categoriesCount: categories.length,
      averageItems: Math.round(avgItems._avg.totalItems || 0),
      byCategory
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching scale stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener estadísticas',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/:id
 * Obtener definición completa de una escala específica
 */
router.get('/:id', async (req, res) => {
  try {
    const scaleId = req.params.id;
    
    // Validar que el ID esté presente
    if (!scaleId) {
      return res.status(400).json({
        success: false,
        error: 'ID de escala es requerido'
      });
    }
    
    // Obtener escala completa con todas sus relaciones
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      include: {
        items: {
          include: {
            scale_item_specific_options: true
          },
          orderBy: { itemNumber: 'asc' }
        },
        responseOptions: {
          orderBy: { displayOrder: 'asc' }
        },
        subscales: true,
        interpretationRules: {
          orderBy: { minScore: 'asc' }
        },
        scale_documentation: true
      }
    });
    
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    // Validación básica
    const validation = {
      isValid: scale && scale.items && scale.items.length > 0,
      errors: [],
      warnings: []
    };
    
    if (!validation.isValid) {
      console.warn(`Scale ${scaleId} has validation issues`);
    }
    
    res.json({
      success: true,
      data: scale,
      validation: validation
    });
    
  } catch (error) {
    console.error('Error fetching scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener la escala',
      details: error.message
    });
  }
});

// Solo mantenemos los endpoints esenciales funcionando con Prisma
// Los endpoints complejos que requerían servicios específicos se eliminan por ahora

module.exports = router;