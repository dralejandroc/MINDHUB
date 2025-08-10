/**
 * Public Scales API Routes (No authentication required for development)
 * Endpoints para el catálogo de escalas sin autenticación
 * DATABASE-FIRST APPROACH con Prisma ORM
 */

const express = require('express');
const { PrismaClient } = require('../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/clinimetrix/scales
 * Obtener todas las escalas disponibles con filtros
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, tags, favoritesOnly } = req.query;

    // Construir condiciones where para Prisma
    const where = {
      isActive: true
    };

    // Aplicar filtros
    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { abbreviation: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Ejecutar query con Prisma
    const scales = await prisma.scale.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Procesar escalas (agregar campos dinámicos y normalizar nombres)
    const processedScales = scales.map(scale => ({
      ...scale,
      total_items: scale.totalItems, // Normalizar camelCase a snake_case para frontend
      estimated_duration_minutes: scale.estimatedDurationMinutes, // Normalizar camelCase a snake_case para frontend
      administration_mode: scale.administrationMode, // Normalizar camelCase a snake_case para frontend
      target_population: scale.targetPopulation, // Normalizar camelCase a snake_case para frontend
      tags: scale.tags || [], // Usar tags del modelo si existen
      is_favorite: false // TODO: Implementar favoritos por usuario
    }));

    res.json(processedScales);
  } catch (error) {
    console.error('Error fetching scales:', error);
    res.status(500).json({ 
      error: 'Error al obtener las escalas',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/categories
 * Obtener categorías únicas de escalas
 */
router.get('/categories', async (req, res) => {
  try {
    const scales = await prisma.scale.findMany({
      where: {
        isActive: true,
        category: { not: null }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });
    
    const categories = scales.map(scale => scale.category).sort();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Error al obtener las categorías',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/tags
 * Obtener todos los tags únicos
 */
router.get('/tags', async (req, res) => {
  try {
    // TODO: Implementar cuando se agregue el campo tags al schema
    // Por ahora retornar lista vacía
    res.json([]);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ 
      error: 'Error al obtener los tags',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/favorites
 * Obtener escalas favoritas del usuario
 */
router.get('/favorites', async (req, res) => {
  try {
    // TODO: Implementar cuando se agregue el sistema de usuarios y favoritos
    res.json([]);
  } catch (error) {
    console.error('Error fetching favorite scales:', error);
    res.status(500).json({ 
      error: 'Error al obtener las escalas favoritas',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id
 * Obtener detalle completo de una escala incluyendo items, opciones y documentación
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener escala con todas sus relaciones incluyendo responseGroups
    const scale = await prisma.scale.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
          include: {
            scale_item_specific_options: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        responseOptions: {
          orderBy: { displayOrder: 'asc' }
        },
        subscales: {
          orderBy: { id: 'asc' }
        },
        interpretationRules: {
          orderBy: { minScore: 'asc' }
        },
        scale_documentation: true
      }
    });

    if (!scale) {
      return res.status(404).json({ 
        error: 'Escala no encontrada' 
      });
    }

    // Obtener opciones de respuesta agrupadas si existen
    const responseGroupsOptions = {};
    // Simplificado - usar solo responseOptions globales por ahora

    // Procesar items con sus opciones específicas y normalizar campos
    const itemsWithOptions = scale.items.map(item => {
      // Normalizar campos snake_case a camelCase
      const normalizedItem = {
        ...item,
        text: item.itemText,                // itemText → text
        number: item.itemNumber,            // itemNumber → number
        helpText: item.help_text,           // snake_case → camelCase
        questionType: item.question_type,   // snake_case → camelCase
        alertTrigger: item.alert_trigger,   // snake_case → camelCase
        alertCondition: item.alert_condition // snake_case → camelCase
      };

      // Si el ítem tiene opciones específicas, usarlas
      if (item.scale_item_specific_options && item.scale_item_specific_options.length > 0) {
        console.log(`🔍 Item ${item.id}: Found ${item.scale_item_specific_options.length} specific options`);
        
        return {
          ...normalizedItem,
          specificOptions: item.scale_item_specific_options
        };
      }

      // Si el ítem pertenece a un grupo de respuestas, usar opciones globales por ahora
      // TODO: Restaurar lógica de responseGroups cuando se arregle el schema

      // Si no tiene opciones específicas, usar las opciones globales de la escala
      return {
        ...normalizedItem,
        specificOptions: null
      };
    });

    // Normalizar interpretation rules
    const normalizedInterpretationRules = scale.interpretationRules ? 
      scale.interpretationRules.map(rule => ({
        id: rule.id,
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        severityLevel: rule.severityLevel,
        label: rule.interpretationLabel,  // Mapear interpretationLabel a label
        color: rule.colorCode,            // Mapear colorCode a color
        description: rule.description,
        recommendations: rule.recommendations
      })) : [];

    // Normalizar subscales
    const normalizedSubscales = scale.subscales ? 
      scale.subscales.map(subscale => ({
        id: subscale.id,
        name: subscale.subscaleName,        // Mapear subscaleName a name
        items: subscale.items,
        min_score: subscale.minScore,       // Mapear minScore a min_score
        max_score: subscale.maxScore,       // Mapear maxScore a max_score
        description: subscale.description,
        referencias_bibliograficas: subscale.references || '',
        indice_cronbach: subscale.cronbachAlpha || 0
      })) : [];

    // Construir respuesta final
    const response = {
      ...scale,
      items: itemsWithOptions,
      interpretationRules: normalizedInterpretationRules,
      subscales: normalizedSubscales,
      documentation: scale.scale_documentation || null
    };

    console.log('🎯 Sending response with interpretationRules:', normalizedInterpretationRules.length);
    console.log('🎯 Sending response with subscales:', normalizedSubscales.length);

    res.json(response);
  } catch (error) {
    console.error('Error fetching scale detail:', error);
    res.status(500).json({ 
      error: 'Error al obtener el detalle de la escala',
      message: error.message 
    });
  }
});

/**
 * POST /api/clinimetrix/scales/:id/toggle-favorite
 * Marcar/desmarcar escala como favorita
 */
router.post('/:id/toggle-favorite', async (req, res) => {
  try {
    const { id: scaleId } = req.params;
    // TODO: Implementar cuando se tenga sistema de usuarios
    
    res.json({ 
      is_favorite: false,
      message: 'Funcionalidad de favoritos pendiente de implementación' 
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ 
      error: 'Error al actualizar favorito',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/stats/usage
 * Obtener estadísticas de uso de escalas
 */
router.get('/stats/usage', async (req, res) => {
  try {
    // Obtener estadísticas básicas
    const [totalScales, totalAssessments] = await Promise.all([
      prisma.scale.count({ where: { isActive: true } }),
      prisma.scaleAdministration.count()
    ]);

    // Obtener escalas más utilizadas
    const scaleUsage = await prisma.scaleAdministration.groupBy({
      by: ['scaleId'],
      _count: {
        scaleId: true
      },
      orderBy: {
        _count: {
          scaleId: 'desc'
        }
      },
      take: 10
    });

    // Obtener nombres de las escalas más utilizadas
    const mostUsedScales = await Promise.all(
      scaleUsage.map(async (usage) => {
        const scale = await prisma.scale.findUnique({
          where: { id: usage.scaleId },
          select: { name: true, abbreviation: true }
        });
        
        const percentage = totalAssessments > 0 
          ? Math.round((usage._count.scaleId / totalAssessments) * 100)
          : 0;

        return {
          name: scale?.name || 'Escala no encontrada',
          count: usage._count.scaleId,
          percentage: percentage
        };
      })
    );

    // Obtener evaluaciones por categoría
    const assessmentsByCategory = await prisma.scaleAdministration.groupBy({
      by: ['scaleId'],
      _count: {
        scaleId: true
      }
    });

    const categoryStats = {};
    for (const assessment of assessmentsByCategory) {
      const scale = await prisma.scale.findUnique({
        where: { id: assessment.scaleId },
        select: { category: true }
      });
      
      if (scale?.category) {
        categoryStats[scale.category] = (categoryStats[scale.category] || 0) + assessment._count.scaleId;
      }
    }

    // Obtener actividad reciente (últimas 10 evaluaciones)
    const recentActivity = await prisma.scaleAdministration.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        scale: {
          select: { name: true, abbreviation: true }
        }
      }
    });

    const formattedRecentActivity = recentActivity.map(activity => ({
      id: activity.id,
      scale_name: activity.scale?.name || 'Escala no encontrada',
      scale_abbreviation: activity.scale?.abbreviation || '',
      created_at: activity.createdAt,
      status: activity.status || 'completed'
    }));

    const stats = {
      total_scales: totalScales,
      total_assessments: totalAssessments,
      total_reports: totalAssessments, // Por ahora igual a total_assessments
      most_used_scales: mostUsedScales,
      assessments_by_category: categoryStats,
      recent_activity: formattedRecentActivity
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de uso',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/stats/overview
 * Obtener estadísticas generales del catálogo
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalScales, categoryCounts] = await Promise.all([
      prisma.scale.count({ where: { isActive: true } }),
      prisma.scale.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true
      })
    ]);

    const stats = {
      total_scales: totalScales,
      categories: categoryCounts.reduce((acc, curr) => {
        acc[curr.category] = curr._count;
        return acc;
      }, {}),
      last_updated: new Date()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      message: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/public/patient-assessments/:patientId
 * Get all assessments for a specific patient - PUBLIC endpoint for development
 */
router.get('/patient-assessments/:patientId', async (req, res) => {
  console.log('Patient assessments endpoint called for patient:', req.params.patientId);
  try {
    const { patientId } = req.params;
    const { scaleId } = req.query;

    // Build where clause
    const whereClause = {
      patientId: patientId
    };
    
    if (scaleId) {
      whereClause.scaleId = scaleId;
    }

    // Get assessments for the patient
    const assessments = await prisma.scaleAdministration.findMany({
      where: whereClause,
      include: {
        scale: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            category: true
          }
        },
        subscaleScores: {
          select: {
            id: true,
            subscaleId: true,
            subscaleName: true,
            score: true,
            severity: true,
            interpretation: true
          }
        }
      },
      orderBy: {
        administrationDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: assessments,
      total: assessments.length
    });

  } catch (error) {
    console.error('Error fetching patient assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient assessments',
      message: error.message
    });
  }
});

// Cerrar conexión Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router;