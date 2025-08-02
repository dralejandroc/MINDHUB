/**
 * Assessment Completion API Routes
 * 
 * Endpoints especializados para completar y procesar evaluaciones de escalas clínicas
 * Maneja el autoguardado de resultados y cálculo de puntajes
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('../../generated/prisma');
const AssessmentScoringService = require('../services/assessment-scoring-service');
const { logger } = require('../../shared/config/storage');
const { createSystemUser } = require('../../create-system-user');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/clinimetrix/assessments/complete
 * Completa una evaluación y calcula automáticamente todos los puntajes
 */
router.post('/complete', [
  body('patientId')
    .notEmpty()
    .withMessage('ID del paciente es requerido'),
  
  body('scaleId')
    .notEmpty()
    .withMessage('ID de la escala es requerido'),
  
  body('administratorId')
    .optional()
    .notEmpty()
    .withMessage('ID del administrador debe ser válido'),
  
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Las respuestas deben ser un array no vacío'),
  
  body('responses.*.itemId')
    .notEmpty()
    .withMessage('ID del item es requerido'),
  
  body('responses.*.value')
    .notEmpty()
    .withMessage('Valor de respuesta es requerido'),
  
  body('administrationType')
    .optional()
    .isIn(['self_administered', 'clinician_administered', 'remote'])
    .withMessage('Tipo de administración inválido'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos de entrada inválidos', 
        details: errors.array() 
      });
    }

    const { 
      patientId, 
      scaleId, 
      administratorId, 
      responses, 
      administrationType = 'clinician_administered',
      notes 
    } = req.body;

    console.log(`🚀 Iniciando procesamiento de evaluación: Paciente ${patientId}, Escala ${scaleId}`);
    console.log(`📝 ${responses.length} respuestas recibidas`);

    // Obtener ID del administrador válido
    let validAdministratorId = administratorId;
    if (!validAdministratorId || validAdministratorId === 'system') {
      validAdministratorId = await createSystemUser();
    }

    // 1. Crear el registro de administración
    const administration = await prisma.scaleAdministration.create({
      data: {
        patientId,
        scaleId,
        administratorId: validAdministratorId,
        administrationType,
        status: 'in_progress',
        startedAt: new Date(),
        notes: notes || null
      }
    });

    console.log(`✅ Administración creada: ${administration.id}`);

    // 2. Procesar la evaluación con el servicio de scoring
    const scoringService = new AssessmentScoringService();
    
    try {
      const result = await scoringService.processAndSaveAssessment(
        administration.id,
        responses,
        patientId,
        scaleId,
        validAdministratorId
      );

      console.log(`🎯 Evaluación completada exitosamente: ${administration.id}`);

      // 3. Preparar respuesta completa
      const response = {
        success: true,
        message: 'Evaluación completada y guardada exitosamente',
        data: {
          administrationId: administration.id,
          patientId,
          scaleId,
          completedAt: result.completedAt,
          totalScore: {
            raw: result.totalScore.raw,
            percentile: result.totalScore.percentile,
            max: result.totalScore.max,
            interpretation: result.interpretation
          },
          subscaleScores: result.subscaleScores.map(sub => ({
            name: sub.subscaleName,
            score: sub.rawScore,
            maxScore: sub.maxScore,
            percentile: sub.percentileScore
          })),
          scale: result.scale,
          summary: {
            totalResponses: responses.length,
            validResponses: result.totalScore.validResponses,
            subscalesCalculated: result.subscaleScores.length,
            severity: result.interpretation.severity
          }
        }
      };

      // Log para auditoría
      logger.info('Assessment completed', {
        administrationId: administration.id,
        patientId,
        scaleId,
        scaleName: result.scale.name,
        totalScore: result.totalScore.raw,
        severity: result.interpretation.severity,
        administratorId: validAdministratorId,
        timestamp: new Date()
      });

      res.json(response);

    } catch (scoringError) {
      console.error('❌ Error en servicio de scoring:', scoringError);
      
      // Marcar la administración como fallida
      await prisma.scaleAdministration.update({
        where: { id: administration.id },
        data: { 
          status: 'failed',
          notes: `Error en procesamiento: ${scoringError.message}`
        }
      });

      throw scoringError;
    } finally {
      await scoringService.disconnect();
    }

  } catch (error) {
    console.error('❌ Error completando evaluación:', error);
    
    logger.error('Assessment completion failed', { 
      error: error.message,
      patientId: req.body.patientId,
      scaleId: req.body.scaleId,
      timestamp: new Date()
    });

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar la evaluación',
      message: error.message,
      code: 'ASSESSMENT_PROCESSING_ERROR'
    });
  }
});

/**
 * GET /api/v1/clinimetrix/assessments/patient/:patientId/scale/:scaleId/history
 * Obtiene el historial temporal de una escala específica para un paciente
 */
router.get('/patient/:patientId/scale/:scaleId/history', [
  param('patientId')
    .notEmpty()
    .withMessage('ID del paciente es requerido'),
  
  param('scaleId')
    .notEmpty()
    .withMessage('ID de la escala es requerido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Parámetros inválidos', 
        details: errors.array() 
      });
    }

    const { patientId, scaleId } = req.params;
    const { limit = 50 } = req.query;

    console.log(`📊 Obteniendo historial: Paciente ${patientId}, Escala ${scaleId}`);

    const scoringService = new AssessmentScoringService();
    
    try {
      const history = await scoringService.getPatientScaleHistory(patientId, scaleId);
      
      // Limitar resultados si se especifica
      const limitedHistory = limit ? history.slice(-parseInt(limit)) : history;

      // Obtener información de la escala
      const scale = await prisma.scale.findUnique({
        where: { id: scaleId },
        select: {
          id: true,
          name: true,
          abbreviation: true,
          category: true
        }
      });

      const response = {
        success: true,
        data: {
          patientId,
          scale,
          totalAssessments: history.length,
          assessments: limitedHistory,
          trends: limitedHistory.length > 1 ? {
            firstScore: limitedHistory[0].totalScore,
            lastScore: limitedHistory[limitedHistory.length - 1].totalScore,
            change: limitedHistory[limitedHistory.length - 1].totalScore - limitedHistory[0].totalScore,
            trend: limitedHistory[limitedHistory.length - 1].totalScore > limitedHistory[0].totalScore ? 'increasing' : 'decreasing'
          } : null
        }
      };

      console.log(`✅ Historial obtenido: ${limitedHistory.length} evaluaciones`);
      res.json(response);

    } finally {
      await scoringService.disconnect();
    }

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener historial',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/clinimetrix/assessments/patient/:patientId/summary
 * Obtiene un resumen de todas las evaluaciones de un paciente
 */
router.get('/patient/:patientId/summary', [
  param('patientId')
    .notEmpty()
    .withMessage('ID del paciente es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Parámetros inválidos', 
        details: errors.array() 
      });
    }

    const { patientId } = req.params;

    console.log(`📋 Obteniendo resumen de evaluaciones para paciente ${patientId}`);

    // Obtener todas las administraciones del paciente
    const administrations = await prisma.scaleAdministration.findMany({
      where: {
        patientId,
        status: 'completed'
      },
      include: {
        scale: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            category: true
          }
        },
        subscaleScores: true
      },
      orderBy: {
        administrationDate: 'desc'
      }
    });

    // Agrupar por escala
    const scaleGroups = {};
    administrations.forEach(admin => {
      const scaleId = admin.scaleId;
      if (!scaleGroups[scaleId]) {
        scaleGroups[scaleId] = {
          scale: admin.scale,
          assessments: [],
          latestScore: null,
          totalAssessments: 0
        };
      }
      scaleGroups[scaleId].assessments.push({
        id: admin.id,
        date: admin.administrationDate,
        totalScore: admin.totalScore,
        severity: admin.severity,
        subscaleCount: admin.subscaleScores.length
      });
      scaleGroups[scaleId].totalAssessments++;
      
      // Actualizar último puntaje si es más reciente
      if (!scaleGroups[scaleId].latestScore || 
          new Date(admin.administrationDate) > new Date(scaleGroups[scaleId].latestScore.date)) {
        scaleGroups[scaleId].latestScore = {
          score: admin.totalScore,
          severity: admin.severity,
          date: admin.administrationDate
        };
      }
    });

    const response = {
      success: true,
      data: {
        patientId,
        totalAssessments: administrations.length,
        uniqueScales: Object.keys(scaleGroups).length,
        scalesSummary: Object.values(scaleGroups),
        recentActivity: administrations.slice(0, 10).map(admin => ({
          id: admin.id,
          scaleName: admin.scale.name,
          date: admin.administrationDate,
          totalScore: admin.totalScore,
          severity: admin.severity
        }))
      }
    };

    console.log(`✅ Resumen obtenido: ${administrations.length} evaluaciones en ${Object.keys(scaleGroups).length} escalas`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener resumen',
      message: error.message
    });
  }
});

// Cerrar conexión Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router;