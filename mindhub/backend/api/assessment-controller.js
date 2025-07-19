/**
 * CONTROLADOR UNIVERSAL DE EVALUACIONES
 * Endpoints para gestión de evaluaciones y sesiones
 */

const express = require('express');
const AssessmentRepository = require('../repositories/AssessmentRepository');
const ScaleRepository = require('../repositories/ScaleRepository');
const UniversalScaleService = require('../services/UniversalScaleService');
const ScaleCalculatorService = require('../services/ScaleCalculatorService');
const ScaleValidationService = require('../services/ScaleValidationService');
const ScaleExportService = require('../services/ScaleExportService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Inicializar servicios
const assessmentRepository = new AssessmentRepository();
const scaleRepository = new ScaleRepository();
const scaleService = new UniversalScaleService();
const calculatorService = new ScaleCalculatorService();
const validationService = new ScaleValidationService();
const exportService = new ScaleExportService();

// =====================================================================
// ENDPOINTS DE SESIONES
// =====================================================================

/**
 * POST /api/sessions
 * Crear nueva sesión de evaluación
 */
router.post('/sessions', async (req, res) => {
  try {
    const {
      patientId,
      clinicianId,
      sessionType = 'screening',
      sessionContext = {},
      administrationMode = 'presencial-mismo',
      scheduledAt = null
    } = req.body;
    
    // Validar datos requeridos
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId es requerido'
      });
    }
    
    // Crear sesión
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      patientId,
      clinicianId,
      sessionType,
      sessionContext,
      administrationMode,
      scheduledAt,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Sesión creada exitosamente'
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear sesión',
      details: error.message
    });
  }
});

/**
 * POST /api/sessions/:sessionId/administrations
 * Iniciar administración de una escala específica
 */
router.post('/sessions/:sessionId/administrations', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { scaleId } = req.body;
    
    // Validar datos requeridos
    if (!scaleId) {
      return res.status(400).json({
        success: false,
        error: 'scaleId es requerido'
      });
    }
    
    // Verificar que la escala existe
    const scale = await scaleRepository.getScaleById(scaleId);
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    // Crear administración
    const administrationId = uuidv4();
    const administration = {
      id: administrationId,
      sessionId,
      scaleId,
      status: 'in_progress',
      totalItems: scale.totalItems,
      currentItemIndex: 0,
      completionPercentage: 0,
      startedAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: administration,
      message: 'Administración iniciada exitosamente'
    });
    
  } catch (error) {
    console.error('Error starting administration:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al iniciar administración',
      details: error.message
    });
  }
});

/**
 * POST /api/administrations/:administrationId/responses
 * Guardar respuesta a un ítem específico
 */
router.post('/administrations/:administrationId/responses', async (req, res) => {
  try {
    const { administrationId } = req.params;
    const {
      itemId,
      itemNumber,
      responseValue,
      responseLabel,
      scoreValue,
      responseTimeMs = null,
      wasSkipped = false
    } = req.body;
    
    // Validar datos requeridos
    if (!itemId || responseValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'itemId y responseValue son requeridos'
      });
    }
    
    // Crear respuesta
    const responseId = uuidv4();
    const response = {
      id: responseId,
      administrationId,
      itemId,
      itemNumber,
      responseValue,
      responseLabel,
      scoreValue,
      responseTimeMs,
      wasSkipped,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: response,
      message: 'Respuesta guardada exitosamente'
    });
    
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al guardar respuesta',
      details: error.message
    });
  }
});

/**
 * POST /api/administrations/:administrationId/complete
 * Completar administración y calcular resultados
 */
router.post('/administrations/:administrationId/complete', async (req, res) => {
  try {
    const { administrationId } = req.params;
    const { responses = [], scaleId } = req.body;
    
    // Validar datos requeridos
    if (!scaleId) {
      return res.status(400).json({
        success: false,
        error: 'scaleId es requerido para calcular resultados'
      });
    }
    
    // Obtener escala completa
    const scale = await scaleRepository.getScaleById(scaleId);
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    // Validar respuestas
    const validation = validationService.validateResponses(scale, responses);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Respuestas inválidas',
        details: validation.errors
      });
    }
    
    // Calcular resultados
    const scores = calculatorService.calculateScores(scale, responses);
    const interpretation = calculatorService.interpretScore(scale, scores.totalScore);
    const alerts = calculatorService.detectAlerts(scale, responses);
    const consistency = calculatorService.checkResponseConsistency(scale, responses);
    
    const results = {
      totalScore: scores.totalScore,
      subscaleScores: scores.subscaleScores,
      interpretation: interpretation,
      alerts: alerts,
      consistency: consistency,
      completionPercentage: (scores.validResponses / scale.totalItems) * 100,
      validResponses: scores.validResponses,
      calculatedAt: new Date().toISOString()
    };
    
    // Crear datos de administración completada
    const completedAdministration = {
      administrationId,
      status: 'completed',
      results: results,
      completedAt: new Date().toISOString(),
      actualDurationSeconds: null // Se puede calcular si se tiene startedAt
    };
    
    res.json({
      success: true,
      data: completedAdministration,
      message: 'Administración completada exitosamente'
    });
    
  } catch (error) {
    console.error('Error completing administration:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al completar administración',
      details: error.message
    });
  }
});

// =====================================================================
// ENDPOINTS DE EVALUACIONES PERSISTENTES
// =====================================================================

/**
 * POST /api/assessments
 * Guardar evaluación completa en base de datos
 */
router.post('/assessments', async (req, res) => {
  try {
    const assessmentData = req.body;
    
    // Validar datos de evaluación
    const validation = validationService.validateAssessmentData(assessmentData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Datos de evaluación inválidos',
        details: validation.errors
      });
    }
    
    // Generar ID si no está presente
    if (!assessmentData.id) {
      assessmentData.id = uuidv4();
    }
    
    // Guardar evaluación
    const assessment = await assessmentRepository.saveAssessment(assessmentData);
    
    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Evaluación guardada exitosamente'
    });
    
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al guardar evaluación',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments/:id
 * Obtener evaluación por ID
 */
router.get('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const assessment = await assessmentRepository.getAssessmentById(id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: assessment
    });
    
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener evaluación',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments
 * Buscar evaluaciones con filtros
 */
router.get('/assessments', async (req, res) => {
  try {
    const {
      scaleId,
      patientName,
      dateFrom,
      dateTo,
      administrationMode,
      limit = 50
    } = req.query;
    
    const criteria = {
      scaleId,
      patientName,
      dateFrom,
      dateTo,
      administrationMode,
      limit: parseInt(limit)
    };
    
    const assessments = await assessmentRepository.searchAssessments(criteria);
    
    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
    
  } catch (error) {
    console.error('Error searching assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al buscar evaluaciones',
      details: error.message
    });
  }
});

/**
 * GET /api/patients/:patientId/assessments
 * Obtener evaluaciones de un paciente específico
 */
router.get('/patients/:patientId/assessments', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const assessments = await assessmentRepository.getAssessmentsByPatient(patientId);
    
    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
    
  } catch (error) {
    console.error('Error fetching patient assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener evaluaciones del paciente',
      details: error.message
    });
  }
});

/**
 * GET /api/scales/:scaleId/assessments
 * Obtener evaluaciones de una escala específica
 */
router.get('/scales/:scaleId/assessments', async (req, res) => {
  try {
    const { scaleId } = req.params;
    const { limit = 100 } = req.query;
    
    const assessments = await assessmentRepository.getAssessmentsByScale(scaleId, parseInt(limit));
    
    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
    
  } catch (error) {
    console.error('Error fetching scale assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener evaluaciones de la escala',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments/stats
 * Obtener estadísticas de evaluaciones
 */
router.get('/assessments/stats', async (req, res) => {
  try {
    const { scaleId } = req.query;
    
    const stats = await assessmentRepository.getAssessmentStats(scaleId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching assessment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener estadísticas',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments/export
 * Exportar evaluaciones a diferentes formatos
 */
router.get('/assessments/export', async (req, res) => {
  try {
    const { format = 'csv', ...criteria } = req.query;
    
    // Buscar evaluaciones con criterios
    const assessments = await assessmentRepository.searchAssessments(criteria);
    
    let exportData;
    let contentType;
    let filename;
    
    switch (format) {
      case 'csv':
        exportData = exportService.exportAssessmentsToCSV(assessments);
        contentType = 'text/csv';
        filename = `assessments_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'detailed':
        exportData = exportService.exportDetailedAssessmentsToCSV(assessments);
        contentType = 'text/csv';
        filename = `assessments_detailed_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'json':
        exportData = { assessments };
        contentType = 'application/json';
        filename = `assessments_${new Date().toISOString().split('T')[0]}.json`;
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
      res.send(exportService.convertToCSVString(exportData));
    }
    
  } catch (error) {
    console.error('Error exporting assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al exportar evaluaciones',
      details: error.message
    });
  }
});

/**
 * DELETE /api/assessments/:id
 * Eliminar evaluación
 */
router.delete('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await assessmentRepository.deleteAssessment(id);
    
    res.json({
      success: true,
      message: 'Evaluación eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al eliminar evaluación',
      details: error.message
    });
  }
});

module.exports = router;