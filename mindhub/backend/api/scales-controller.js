/**
 * CONTROLADOR UNIVERSAL DE ESCALAS
 * Endpoints para gestión de escalas clinimétricas
 */

const express = require('express');
const ScaleRepository = require('../repositories/ScaleRepository');
const UniversalScaleService = require('../services/UniversalScaleService');
const ScaleValidationService = require('../services/ScaleValidationService');
const ScaleExportService = require('../services/ScaleExportService');

const router = express.Router();

// Inicializar servicios
const scaleRepository = new ScaleRepository();
const scaleService = new UniversalScaleService();
const validationService = new ScaleValidationService();
const exportService = new ScaleExportService();

// =====================================================================
// ENDPOINTS DE ESCALAS
// =====================================================================

/**
 * GET /api/scales
 * Obtener todas las escalas disponibles
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, isActive = true } = req.query;
    
    let scales;
    
    // Usar directamente el ScaleRepository (conectado a seeds) en lugar del UniversalScaleService
    scales = await scaleRepository.getAllActiveScales();
    
    // Aplicar filtros si se especifican
    if (category && category !== 'all') {
      scales = scales.filter(scale => scale.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      scales = scales.filter(scale =>
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation.toLowerCase().includes(searchLower) ||
        (scale.description && scale.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por estado activo si se especifica
    if (isActive === 'true') {
      scales = scales.filter(scale => scale.isActive);
    }
    
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
    const categories = await scaleService.getCategories();
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
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
 * Obtener estadísticas de uso de escalas
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await scaleService.getScaleUsageStats();
    
    res.json({
      success: true,
      data: stats,
      count: stats.length
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
    
    // Obtener escala completa usando ScaleRepository (conectado a seeds)
    const scale = await scaleRepository.getScaleById(scaleId);
    
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    // Validar completitud de la escala
    const validation = await scaleService.validateScaleCompleteness(scaleId);
    
    if (!validation.isValid) {
      console.warn(`Scale ${scaleId} has validation issues:`, validation.errors);
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

/**
 * GET /api/scales/:id/metadata
 * Obtener solo metadatos de una escala (sin items completos)
 */
router.get('/:id/metadata', async (req, res) => {
  try {
    const scaleId = req.params.id;
    
    const metadata = await scaleService.getScaleMetadata(scaleId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: metadata
    });
    
  } catch (error) {
    console.error('Error fetching scale metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener metadatos',
      details: error.message
    });
  }
});

/**
 * POST /api/scales/:id/validate
 * Validar completitud y consistencia de una escala
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const scaleId = req.params.id;
    
    const validation = await scaleService.validateScaleCompleteness(scaleId);
    
    res.json({
      success: true,
      data: validation
    });
    
  } catch (error) {
    console.error('Error validating scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al validar escala',
      details: error.message
    });
  }
});

/**
 * POST /api/scales/:id/process
 * Procesar respuestas y calcular resultados de evaluación
 */
router.post('/:id/process', async (req, res) => {
  try {
    const scaleId = req.params.id;
    const { responses } = req.body;
    
    // Validar datos de entrada
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Respuestas son requeridas y deben ser un array'
      });
    }
    
    // Procesar evaluación
    const results = await scaleService.processAssessment(scaleId, responses);
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error processing assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar evaluación',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/:id/export
 * Exportar escala en diferentes formatos
 */
router.get('/:id/export', async (req, res) => {
  try {
    const scaleId = req.params.id;
    const { format = 'json' } = req.query;
    
    const scale = await scaleRepository.getScaleById(scaleId);
    
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    let exportData;
    let contentType;
    let filename;
    
    switch (format) {
      case 'json':
        exportData = exportService.exportScaleToJson(scale);
        contentType = 'application/json';
        filename = `${scaleId}-export.json`;
        break;
        
      case 'csv':
        exportData = exportService.exportScaleToCSV(scale);
        contentType = 'text/csv';
        filename = `${scaleId}-export.csv`;
        break;
        
      case 'sql':
        exportData = exportService.exportScaleToSQLSeed(scale);
        contentType = 'text/plain';
        filename = `${scaleId}-seed.sql`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Formato de exportación no soportado'
        });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    if (format === 'json') {
      res.json(exportData);
    } else {
      res.send(exportData);
    }
    
  } catch (error) {
    console.error('Error exporting scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al exportar escala',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/recommended
 * Obtener escalas recomendadas basadas en contexto
 */
router.get('/recommended', async (req, res) => {
  try {
    const { targetPopulation, category, age, diagnosis } = req.query;
    
    const context = {
      targetPopulation,
      category,
      age: age ? parseInt(age) : undefined,
      diagnosis
    };
    
    const recommended = await scaleService.getRecommendedScales(context);
    
    res.json({
      success: true,
      data: recommended,
      count: recommended.length
    });
    
  } catch (error) {
    console.error('Error fetching recommended scales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener escalas recomendadas',
      details: error.message
    });
  }
});

/**
 * POST /api/scales
 * Crear nueva escala (admin)
 */
router.post('/', async (req, res) => {
  try {
    const scaleData = req.body;
    
    // Validar datos de entrada
    const validation = validationService.validateScaleImportFormat({ scale: scaleData });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Datos de escala inválidos',
        details: validation.errors
      });
    }
    
    // Crear escala
    const scale = await scaleService.createScale(scaleData);
    
    res.status(201).json({
      success: true,
      data: scale,
      message: 'Escala creada exitosamente'
    });
    
  } catch (error) {
    console.error('Error creating scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear escala',
      details: error.message
    });
  }
});

/**
 * PUT /api/scales/:id
 * Actualizar escala existente (admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const scaleId = req.params.id;
    const scaleData = req.body;
    
    // Actualizar escala
    const scale = await scaleService.updateScale(scaleId, scaleData);
    
    res.json({
      success: true,
      data: scale,
      message: 'Escala actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error updating scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar escala',
      details: error.message
    });
  }
});

/**
 * DELETE /api/scales/:id
 * Desactivar escala (admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const scaleId = req.params.id;
    
    // Desactivar escala (soft delete)
    await scaleService.deactivateScale(scaleId);
    
    res.json({
      success: true,
      message: 'Escala desactivada exitosamente'
    });
    
  } catch (error) {
    console.error('Error deactivating scale:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al desactivar escala',
      details: error.message
    });
  }
});

module.exports = router;