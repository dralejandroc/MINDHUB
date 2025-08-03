/**
 * ESCALAS UNIVERSALES - NUEVA ARQUITECTURA
 * Integra el sistema universal con la ruta existente de Clinimetrix
 */

const express = require('express');
const router = express.Router();

// Import universal services
const UniversalScaleService = require('../../services/UniversalScaleService');
const ScaleRepository = require('../../repositories/ScaleRepository');

const scaleService = new UniversalScaleService();
const scaleRepository = new ScaleRepository();

/**
 * GET /api/clinimetrix/scales
 * Lista todas las escalas disponibles (sistema universal)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category,
      search,
      isActive = 'true' 
    } = req.query;

    console.log('🧪 Clinimetrix: Obteniendo escalas universales...');

    // Obtener todas las escalas del sistema universal
    let scales = await scaleService.getAllScales();
    
    // Aplicar filtros
    if (category && category !== 'all') {
      scales = scales.filter(scale => scale.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      scales = scales.filter(scale =>
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation.toLowerCase().includes(searchLower) ||
        scale.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (isActive === 'true') {
      scales = scales.filter(scale => scale.isActive);
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = scales.length;
    const paginatedScales = scales.slice(skip, skip + parseInt(limit));

    // Transformar al formato esperado por el frontend
    const transformedScales = paginatedScales.map(scale => ({
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      description: scale.description,
      category: scale.category,
      subcategory: scale.subcategory,
      administrationMode: scale.administrationMode,
      targetPopulation: scale.targetPopulation,
      totalItems: scale.totalItems,
      estimatedDurationMinutes: scale.estimatedDurationMinutes,
      isActive: scale.isActive,
      scoreRange: scale.scoreRange,
      
      // Información adicional para compatibilidad
      _count: {
        scaleAdministrations: 0 // TODO: Implementar conteo real
      },
      scaleItems: scale.items?.map((item, index) => ({
        id: item.id,
        itemNumber: item.number,
        displayOrder: index + 1
      })) || [],
      
      // Metadatos del sistema universal
      system: 'universal',
      hasInterpretationRules: scale.interpretationRules?.length > 0,
      hasSubscales: scale.subscales?.length > 0,
      responseOptionsCount: scale.responseOptions?.length || 0
    }));

    console.log(`✅ Clinimetrix: ${transformedScales.length} escalas encontradas`);

    res.json({
      success: true,
      data: transformedScales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      },
      system: 'universal',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clinimetrix: Error obteniendo escalas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo escalas universales', 
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id
 * Obtener detalles completos de una escala
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🧪 Clinimetrix: Obteniendo escala ${id}...`);
    
    const scale = await scaleService.getScaleById(id);
    
    if (!scale) {
      return res.status(404).json({
        error: 'Escala no encontrada',
        scaleId: id,
        system: 'universal'
      });
    }
    
    // Transformar al formato esperado
    const transformedScale = {
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      description: scale.description,
      category: scale.category,
      subcategory: scale.subcategory,
      administrationMode: scale.administrationMode,
      targetPopulation: scale.targetPopulation,
      totalItems: scale.totalItems,
      estimatedDurationMinutes: scale.estimatedDurationMinutes,
      isActive: scale.isActive,
      scoreRange: scale.scoreRange,
      scoringMethod: scale.scoringMethod,
      
      // Detalles completos
      items: scale.items,
      responseOptions: scale.responseOptions,
      interpretationRules: scale.interpretationRules,
      subscales: scale.subscales,
      instructions: scale.instructions,
      
      // Metadatos
      system: 'universal',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Clinimetrix: Escala ${id} obtenida exitosamente`);
    
    res.json({
      success: true,
      data: transformedScale,
      system: 'universal'
    });
    
  } catch (error) {
    console.error(`❌ Clinimetrix: Error obteniendo escala ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error obteniendo detalles de la escala',
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * POST /api/clinimetrix/scales/:id/assessment
 * Crear nueva evaluación con una escala
 */
router.post('/:id/assessment', async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, clinicianId, sessionType = 'screening' } = req.body;
    
    console.log(`🧪 Clinimetrix: Iniciando evaluación para escala ${id}...`);
    
    // Verificar que la escala existe
    const scale = await scaleService.getScaleById(id);
    if (!scale) {
      return res.status(404).json({
        error: 'Escala no encontrada',
        scaleId: id,
        system: 'universal'
      });
    }
    
    // Crear sesión de evaluación
    const sessionData = {
      scaleId: id,
      patientId: patientId || 'anonymous',
      clinicianId,
      sessionType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    console.log(`✅ Clinimetrix: Evaluación iniciada para ${scale.name}`);
    
    res.json({
      success: true,
      data: {
        sessionId: `session-${Date.now()}`,
        scale: {
          id: scale.id,
          name: scale.name,
          totalItems: scale.totalItems,
          estimatedDurationMinutes: scale.estimatedDurationMinutes
        },
        session: sessionData,
        nextStep: `/api/clinimetrix/scales/${id}/items`
      },
      system: 'universal'
    });
    
  } catch (error) {
    console.error(`❌ Clinimetrix: Error iniciando evaluación:`, error);
    res.status(500).json({
      error: 'Error iniciando evaluación',
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id/items
 * Obtener items de una escala para evaluación
 */
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🧪 Clinimetrix: Obteniendo items para escala ${id}...`);
    
    const scale = await scaleService.getScaleById(id);
    
    if (!scale) {
      return res.status(404).json({
        error: 'Escala no encontrada',
        scaleId: id,
        system: 'universal'
      });
    }
    
    // Preparar items para evaluación
    const assessmentItems = {
      scaleId: scale.id,
      scaleName: scale.name,
      totalItems: scale.totalItems,
      items: scale.items,
      responseOptions: scale.responseOptions,
      instructions: scale.instructions,
      administrationMode: scale.administrationMode,
      system: 'universal'
    };
    
    console.log(`✅ Clinimetrix: ${scale.items.length} items obtenidos para ${scale.name}`);
    
    res.json({
      success: true,
      data: assessmentItems,
      system: 'universal'
    });
    
  } catch (error) {
    console.error(`❌ Clinimetrix: Error obteniendo items:`, error);
    res.status(500).json({
      error: 'Error obteniendo items de la escala',
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * POST /api/clinimetrix/scales/:id/process
 * Procesar respuestas de evaluación
 */
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, patientId, sessionId } = req.body;
    
    console.log(`🧪 Clinimetrix: Procesando evaluación para escala ${id}...`);
    
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        error: 'Respuestas son requeridas y deben ser un array',
        system: 'universal'
      });
    }
    
    // Procesar evaluación usando el servicio universal
    const results = await scaleService.processAssessment(id, responses);
    
    console.log(`✅ Clinimetrix: Evaluación procesada - Puntuación: ${results.totalScore}`);
    
    res.json({
      success: true,
      data: {
        scaleId: id,
        sessionId,
        patientId,
        results: results,
        processedAt: new Date().toISOString()
      },
      system: 'universal'
    });
    
  } catch (error) {
    console.error(`❌ Clinimetrix: Error procesando evaluación:`, error);
    res.status(500).json({
      error: 'Error procesando evaluación',
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/stats
 * Estadísticas del sistema de escalas
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('🧪 Clinimetrix: Obteniendo estadísticas del sistema...');
    
    const scales = await scaleService.getAllScales();
    const categories = [...new Set(scales.map(s => s.category))];
    
    const stats = {
      totalScales: scales.length,
      activeScales: scales.filter(s => s.isActive).length,
      categories: categories.length,
      categoryBreakdown: categories.map(cat => ({
        category: cat,
        count: scales.filter(s => s.category === cat).length
      })),
      totalItems: scales.reduce((sum, s) => sum + s.totalItems, 0),
      averageItemsPerScale: Math.round(scales.reduce((sum, s) => sum + s.totalItems, 0) / scales.length),
      administrationModes: {
        self_administered: scales.filter(s => s.administrationMode === 'self_administered').length,
        clinician_administered: scales.filter(s => s.administrationMode === 'clinician_administered').length,
        both: scales.filter(s => s.administrationMode === 'both').length
      },
      system: 'universal',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Clinimetrix: Estadísticas generadas - ${stats.totalScales} escalas`);
    
    res.json({
      success: true,
      data: stats,
      system: 'universal'
    });
    
  } catch (error) {
    console.error('❌ Clinimetrix: Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message,
      system: 'universal'
    });
  }
});

module.exports = router;