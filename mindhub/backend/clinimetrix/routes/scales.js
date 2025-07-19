/**
 * Clinimetrix Scales Routes - Universal System
 * Database-First Architecture para Escalas Clínicas
 * 
 * Usa el sistema universal de escalas alimentado por seeds SQL
 * Este archivo reemplaza la implementación anterior no-universal
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Importar servicios universales
const UniversalScaleService = require('../../services/UniversalScaleService');
const ScaleRepository = require('../../repositories/ScaleRepository');

const scaleService = new UniversalScaleService();
const scaleRepository = new ScaleRepository();

/**
 * GET /api/clinimetrix/scales
 * Obtener todas las escalas disponibles (sistema universal)
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['depression', 'anxiety', 'cognitive', 'personality', 'psychosis', 'substance_use', 'autism', 'general']),
  query('administration_mode').optional().isIn(['self_administered', 'clinician_administered', 'both']),
  query('is_active').optional().isBoolean(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      category,
      administration_mode,
      is_active = 'true',
      search
    } = req.query;

    console.log('🧪 Clinimetrix: Obteniendo escalas universales...');

    // Obtener todas las escalas del sistema universal
    let scales = await scaleService.getAllScales();
    
    // Aplicar filtros
    if (category && category !== 'all') {
      scales = scales.filter(scale => scale.category === category);
    }
    
    if (administration_mode && administration_mode !== 'all') {
      scales = scales.filter(scale => 
        scale.administration_mode === administration_mode || 
        scale.administration_mode === 'both'
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      scales = scales.filter(scale =>
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation.toLowerCase().includes(searchLower) ||
        (scale.description && scale.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (is_active === 'true') {
      scales = scales.filter(scale => scale.is_active !== false);
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
      version: scale.version,
      category: scale.category,
      subcategory: scale.subcategory,
      description: scale.description,
      author: scale.author,
      publication_year: scale.publication_year,
      estimated_duration_minutes: scale.estimated_duration_minutes,
      administration_mode: scale.administration_mode,
      target_population: scale.target_population,
      total_items: scale.total_items,
      scoring_method: scale.scoring_method,
      score_range_min: scale.score_range_min,
      score_range_max: scale.score_range_max,
      instructions_professional: scale.instructions_professional,
      instructions_patient: scale.instructions_patient,
      is_active: scale.is_active,
      created_at: scale.created_at,
      updated_at: scale.updated_at,
      
      // Campos adicionales para compatibilidad con frontend existente
      administrationMode: scale.administration_mode,
      targetPopulation: scale.target_population,
      estimatedDurationMinutes: scale.estimated_duration_minutes,
      totalItems: scale.total_items,
      scoringMethod: scale.scoring_method,
      scoreRangeMin: scale.score_range_min,
      scoreRangeMax: scale.score_range_max,
      isActive: scale.is_active,
      
      // Información de items y conteos
      _count: {
        scaleAdministrations: 0 // TODO: Implementar conteo real desde assessments
      },
      scaleItems: scale.items?.map((item, index) => ({
        id: item.id,
        itemNumber: item.item_number,
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
      error: 'Failed to retrieve scales', 
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id
 * Obtener detalles completos de una escala específica
 */
router.get('/:id', [
  param('id').isString().withMessage('Invalid scale ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    
    console.log(`🧪 Clinimetrix: Obteniendo escala ${id}...`);
    
    const scale = await scaleService.getScaleById(id);
    
    if (!scale) {
      return res.status(404).json({
        error: 'Scale not found',
        scaleId: id,
        system: 'universal'
      });
    }
    
    // Transformar al formato esperado por el frontend
    const transformedScale = {
      // Campos principales de la tabla scales
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      version: scale.version,
      category: scale.category,
      subcategory: scale.subcategory,
      description: scale.description,
      author: scale.author,
      publication_year: scale.publication_year,
      estimated_duration_minutes: scale.estimated_duration_minutes,
      administration_mode: scale.administration_mode,
      target_population: scale.target_population,
      total_items: scale.total_items,
      scoring_method: scale.scoring_method,
      score_range_min: scale.score_range_min,
      score_range_max: scale.score_range_max,
      instructions_professional: scale.instructions_professional,
      instructions_patient: scale.instructions_patient,
      is_active: scale.is_active,
      created_at: scale.created_at,
      updated_at: scale.updated_at,
      
      // Campos adicionales para compatibilidad
      administrationMode: scale.administration_mode,
      targetPopulation: scale.target_population,
      estimatedDurationMinutes: scale.estimated_duration_minutes,
      totalItems: scale.total_items,
      scoringMethod: scale.scoring_method,
      scoreRangeMin: scale.score_range_min,
      scoreRangeMax: scale.score_range_max,
      isActive: scale.is_active,
      
      // Datos relacionados del sistema universal
      scaleItems: scale.items?.map(item => ({
        id: item.id,
        scale_id: item.scale_id,
        item_number: item.item_number,
        item_text: item.item_text,
        item_code: item.item_code,
        subscale: item.subscale,
        reverse_scored: item.reverse_scored,
        is_active: item.is_active,
        created_at: item.created_at,
        
        // Campos adicionales para compatibilidad
        scaleId: item.scale_id,
        itemNumber: item.item_number,
        itemCode: item.item_code,
        questionText: item.item_text,
        reverseScored: item.reverse_scored,
        isActive: item.is_active,
        createdAt: item.created_at,
        displayOrder: item.item_number
      })) || [],
      
      responseOptions: scale.responseOptions?.map(option => ({
        id: option.id,
        scale_id: option.scale_id,
        option_value: option.option_value,
        option_label: option.option_label,
        score_value: option.score_value,
        display_order: option.display_order,
        is_active: option.is_active,
        created_at: option.created_at,
        
        // Campos adicionales para compatibilidad
        scaleId: option.scale_id,
        value: option.option_value,
        label: option.option_label,
        score: option.score_value,
        displayOrder: option.display_order,
        isActive: option.is_active,
        createdAt: option.created_at
      })) || [],
      
      interpretationRules: scale.interpretationRules?.map(rule => ({
        id: rule.id,
        scale_id: rule.scale_id,
        min_score: rule.min_score,
        max_score: rule.max_score,
        severity_level: rule.severity_level,
        interpretation_label: rule.interpretation_label,
        color_code: rule.color_code,
        description: rule.description,
        recommendations: rule.recommendations,
        is_active: rule.is_active,
        created_at: rule.created_at,
        
        // Campos adicionales para compatibilidad
        scaleId: rule.scale_id,
        minScore: rule.min_score,
        maxScore: rule.max_score,
        severityLevel: rule.severity_level,
        interpretation: rule.interpretation_label,
        colorCode: rule.color_code,
        isActive: rule.is_active,
        createdAt: rule.created_at
      })) || [],
      
      subscales: scale.subscales?.map(subscale => ({
        id: subscale.id,
        scale_id: subscale.scale_id,
        subscale_name: subscale.subscale_name,
        subscale_code: subscale.subscale_code,
        min_score: subscale.min_score,
        max_score: subscale.max_score,
        description: subscale.description,
        is_active: subscale.is_active,
        created_at: subscale.created_at,
        
        // Campos adicionales para compatibilidad
        scaleId: subscale.scale_id,
        name: subscale.subscale_name,
        code: subscale.subscale_code,
        minScore: subscale.min_score,
        maxScore: subscale.max_score,
        isActive: subscale.is_active,
        createdAt: subscale.created_at
      })) || [],
      
      // Conteos para compatibilidad
      _count: {
        administrations: 0 // TODO: Implementar conteo real desde assessments
      },
      
      // Metadatos del sistema
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
      error: 'Failed to retrieve scale',
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/category/:category
 * Obtener escalas por categoría
 */
router.get('/category/:category', [
  param('category').isIn(['depression', 'anxiety', 'cognitive', 'personality', 'psychosis', 'substance_use', 'autism', 'general'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { category } = req.params;
    
    console.log(`🧪 Clinimetrix: Obteniendo escalas por categoría: ${category}...`);
    
    const scales = await scaleService.getAllScales();
    const categoryScales = scales.filter(scale => 
      scale.category === category && scale.is_active !== false
    );
    
    const transformedScales = categoryScales.map(scale => ({
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      description: scale.description,
      administration_mode: scale.administration_mode,
      estimated_duration_minutes: scale.estimated_duration_minutes,
      target_population: scale.target_population,
      total_items: scale.total_items,
      
      // Campos adicionales para compatibilidad
      administrationMode: scale.administration_mode,
      administrationType: scale.administration_mode, // alias
      estimatedDuration: scale.estimated_duration_minutes,
      targetPopulation: scale.target_population,
      
      _count: {
        administrations: 0 // TODO: Implementar conteo real
      },
      
      system: 'universal'
    }));

    console.log(`✅ Clinimetrix: ${transformedScales.length} escalas encontradas para categoría ${category}`);

    res.json({
      success: true,
      data: transformedScales,
      category,
      count: transformedScales.length,
      system: 'universal'
    });

  } catch (error) {
    console.error('❌ Clinimetrix: Error obteniendo escalas por categoría:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve scales by category', 
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id/interpretation/:score
 * Obtener interpretación para un puntaje específico
 */
router.get('/:id/interpretation/:score', [
  param('id').isString().withMessage('Invalid scale ID format'),
  param('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id, score } = req.params;
    const scoreValue = parseInt(score);
    
    console.log(`🧪 Clinimetrix: Obteniendo interpretación para escala ${id}, puntaje ${scoreValue}...`);
    
    const scale = await scaleService.getScaleById(id);
    
    if (!scale) {
      return res.status(404).json({
        error: 'Scale not found',
        scaleId: id,
        system: 'universal'
      });
    }
    
    // Buscar la regla de interpretación apropiada
    const interpretation = scale.interpretationRules?.find(rule => 
      scoreValue >= rule.min_score && scoreValue <= rule.max_score
    );
    
    if (!interpretation) {
      return res.status(404).json({ 
        error: 'No interpretation found for this score',
        scaleId: id,
        score: scoreValue,
        system: 'universal'
      });
    }

    console.log(`✅ Clinimetrix: Interpretación encontrada: ${interpretation.severity_level}`);

    res.json({
      success: true,
      data: {
        score: scoreValue,
        interpretation: interpretation.interpretation_label,
        severity: interpretation.severity_level,
        description: interpretation.description,
        recommendations: interpretation.recommendations,
        color: interpretation.color_code,
        scale: {
          id: scale.id,
          name: scale.name,
          abbreviation: scale.abbreviation
        }
      },
      system: 'universal'
    });

  } catch (error) {
    console.error('❌ Clinimetrix: Error obteniendo interpretación:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve interpretation', 
      details: error.message,
      system: 'universal'
    });
  }
});

/**
 * GET /api/clinimetrix/scales/stats/usage
 * Obtener estadísticas de uso de escalas
 */
router.get('/stats/usage', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('category').optional().isIn(['depression', 'anxiety', 'cognitive', 'personality', 'psychosis', 'substance_use', 'autism', 'general'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate, category } = req.query;
    
    console.log('🧪 Clinimetrix: Obteniendo estadísticas de uso...');
    
    const scales = await scaleService.getAllScales();
    let filteredScales = scales;
    
    if (category) {
      filteredScales = scales.filter(scale => scale.category === category);
    }
    
    // TODO: Implementar estadísticas reales desde la tabla assessments
    // Por ahora, devolver estadísticas básicas del sistema
    
    const stats = {
      totalAdministrations: 0, // TODO: Contar desde assessments
      topScales: filteredScales.slice(0, 10).map(scale => ({
        scaleId: scale.id,
        _count: { scaleId: 0 }, // TODO: Contar administraciones reales
        scale: {
          name: scale.name,
          abbreviation: scale.abbreviation,
          category: scale.category
        }
      })),
      categoryBreakdown: [...new Set(filteredScales.map(s => s.category))].map(cat => ({
        category: cat,
        _count: { scaleId: filteredScales.filter(s => s.category === cat).length }
      }))
    };

    console.log('✅ Clinimetrix: Estadísticas generadas');

    res.json({
      success: true,
      data: stats,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      },
      system: 'universal'
    });

  } catch (error) {
    console.error('❌ Clinimetrix: Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve usage statistics', 
      details: error.message,
      system: 'universal'
    });
  }
});

module.exports = router;