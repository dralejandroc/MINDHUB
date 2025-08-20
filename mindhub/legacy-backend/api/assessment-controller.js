/**
 * CONTROLADOR UNIVERSAL DE EVALUACIONES
 * Endpoints para gestión de evaluaciones y sesiones
 */

const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

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
    
    // Verificar que la escala exists
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      select: { id: true, totalItems: true, name: true }
    });
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
 * Completar administración (versión simplificada)
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
    
    // Verificar que la escala existe
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      select: { id: true, totalItems: true, name: true }
    });
    
    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }
    
    // Cálculo básico de resultados (sin servicios complejos)
    const validResponses = responses.filter(r => r.responseValue !== undefined && r.responseValue !== null).length;
    const completionPercentage = (validResponses / scale.totalItems) * 100;
    
    const results = {
      totalScore: validResponses, // Simplificado por ahora
      completionPercentage,
      validResponses,
      calculatedAt: new Date().toISOString()
    };
    
    // Crear datos de administración completada
    const completedAdministration = {
      administrationId,
      status: 'completed',
      results: results,
      completedAt: new Date().toISOString()
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
// ENDPOINTS SIMPLIFICADOS USANDO PRISMA
// =====================================================================

/**
 * GET /api/patients/:patientId/assessments
 * Obtener evaluaciones de un paciente específico
 */
router.get('/patients/:patientId/assessments', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const assessments = await prisma.scaleAdministration.findMany({
      where: { patientId },
      include: {
        scale: {
          select: { id: true, name: true, abbreviation: true }
        }
      },
      orderBy: { administrationDate: 'desc' }
    });
    
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
 * GET /api/patient-assessments/:patientId
 * Alias para compatibilidad con frontend legacy
 */
router.get('/patient-assessments/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const assessments = await prisma.scaleAdministration.findMany({
      where: { patientId },
      include: {
        scale: {
          select: { id: true, name: true, abbreviation: true }
        }
      },
      orderBy: { administrationDate: 'desc' }
    });
    
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

module.exports = router;