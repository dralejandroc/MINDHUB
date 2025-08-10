/**
 * Remote Assessments API Routes
 * 
 * Endpoints para el sistema de evaluaciones remotas de escalas clínicas
 * Permite enviar escalas a pacientes vía enlaces tokenizados seguros
 */

const express = require('express');
const crypto = require('crypto');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('../../generated/prisma');
const AssessmentScoringService = require('../services/assessment-scoring-service');
const { logger } = require('../../shared/config/storage');
const { createSystemUser } = require('../../create-system-user');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Genera un token seguro único para la evaluación remota
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Detecta el tipo de dispositivo basado en el User-Agent
 */
function detectDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
    return 'desktop';
  }
  return 'unknown';
}

/**
 * Registra el acceso a una evaluación remota
 */
async function logAccess(remoteAssessmentId, req, action = 'view') {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDeviceType(userAgent);
    
    await prisma.remoteAssessmentAccessLog.create({
      data: {
        remoteAssessmentId,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent,
        deviceType,
        action,
        metadata: {
          headers: {
            'accept-language': req.headers['accept-language'],
            'referer': req.headers['referer']
          }
        }
      }
    });
  } catch (error) {
    console.error('Error registrando acceso:', error);
  }
}

/**
 * POST /api/clinimetrix/remote-assessments/create
 * Crear una nueva evaluación remota y generar enlace tokenizado
 */
router.post('/create', [
  body('patientId')
    .notEmpty()
    .withMessage('ID del paciente es requerido'),
  
  body('scaleId')
    .notEmpty()
    .withMessage('ID de la escala es requerido'),
  
  body('administratorId')
    .notEmpty()
    .withMessage('ID del administrador es requerido'),
  
  body('expirationDays')
    .isInt({ min: 1, max: 30 })
    .withMessage('Los días de expiración deben ser entre 1 y 30'),
  
  body('customMessage')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El mensaje personalizado no puede exceder 1000 caracteres'),
  
  body('patientEmail')
    .optional()
    .isEmail()
    .withMessage('Email del paciente debe ser válido'),
  
  body('patientPhone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Teléfono del paciente debe tener entre 10 y 15 dígitos'),
  
  body('deliveryMethod')
    .optional()
    .isIn(['email', 'sms', 'whatsapp', 'copy_link'])
    .withMessage('Método de entrega inválido'),
  
  body('reminderEnabled')
    .optional()
    .isBoolean()
    .withMessage('Recordatorio debe ser booleano')
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
      expirationDays,
      customMessage,
      patientEmail,
      patientPhone,
      deliveryMethod = 'copy_link',
      reminderEnabled = true,
      privacyNoticeId
    } = req.body;

    console.log(`🚀 Creando evaluación remota: Paciente ${patientId}, Escala ${scaleId}`);

    // Validar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
      });
    }

    // Validar que la escala existe
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      select: { 
        id: true, 
        name: true, 
        abbreviation: true, 
        totalItems: true,
        estimatedDurationMinutes: true 
      }
    });

    if (!scale) {
      return res.status(404).json({
        success: false,
        error: 'Escala no encontrada'
      });
    }

    // Validar que el administrador existe
    const administrator = await prisma.user.findUnique({
      where: { id: administratorId },
      select: { id: true, name: true, email: true }
    });

    if (!administrator) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }

    // Generar token único
    let token;
    let tokenExists = true;
    let attempts = 0;
    
    while (tokenExists && attempts < 5) {
      token = generateSecureToken();
      const existing = await prisma.remoteAssessment.findUnique({
        where: { token }
      });
      tokenExists = !!existing;
      attempts++;
    }

    if (tokenExists) {
      return res.status(500).json({
        success: false,
        error: 'Error generando token único'
      });
    }

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Crear la evaluación remota
    const remoteAssessment = await prisma.remoteAssessment.create({
      data: {
        token,
        scaleId,
        patientId,
        administratorId,
        expiresAt,
        customMessage: customMessage || null,
        patientEmail: patientEmail || patient.email,
        patientPhone: patientPhone || patient.phone,
        deliveryMethod,
        expirationDays,
        reminderEnabled,
        privacyNoticeId: privacyNoticeId || null,
        createdBy: administratorId,
        status: 'pending'
      }
    });

    console.log(`✅ Evaluación remota creada: ${remoteAssessment.id}`);

    // Construir URL del enlace
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const assessmentUrl = `${baseUrl}/assessment/remote/${token}`;

    // Registrar auditoría
    logger.info('Remote assessment created', {
      remoteAssessmentId: remoteAssessment.id,
      patientId,
      scaleId,
      scaleName: scale.name,
      administratorId,
      adminName: administrator.name,
      expiresAt,
      deliveryMethod,
      timestamp: new Date()
    });

    // Preparar respuesta
    const response = {
      success: true,
      message: 'Evaluación remota creada exitosamente',
      data: {
        id: remoteAssessment.id,
        token,
        assessmentUrl,
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          phone: patient.phone
        },
        scale: {
          id: scale.id,
          name: scale.name,
          abbreviation: scale.abbreviation,
          totalItems: scale.totalItems,
          estimatedDuration: scale.estimatedDurationMinutes
        },
        administrator: {
          id: administrator.id,
          name: administrator.name,
          email: administrator.email
        },
        settings: {
          expiresAt,
          expirationDays,
          deliveryMethod,
          reminderEnabled,
          customMessage: customMessage || null
        },
        status: 'pending',
        createdAt: remoteAssessment.createdAt
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error creando evaluación remota:', error);
    
    logger.error('Remote assessment creation failed', { 
      error: error.message,
      patientId: req.body.patientId,
      scaleId: req.body.scaleId,
      administratorId: req.body.administratorId,
      timestamp: new Date()
    });

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear evaluación remota',
      message: error.message,
      code: 'REMOTE_ASSESSMENT_CREATION_ERROR'
    });
  }
});

/**
 * GET /api/clinimetrix/remote-assessments/:token
 * Validar token y obtener información de la escala para aplicación remota
 */
router.get('/:token', [
  param('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token debe tener exactamente 64 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Token inválido', 
        details: errors.array() 
      });
    }

    const { token } = req.params;

    console.log(`🔍 Validando token de evaluación remota: ${token.substring(0, 8)}...`);

    // Buscar la evaluación remota
    const remoteAssessment = await prisma.remoteAssessment.findUnique({
      where: { token },
      include: {
        scale: {
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
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        administrator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        progress: true
      }
    });

    if (!remoteAssessment) {
      await logAccess(null, req, 'view');
      return res.status(404).json({
        success: false,
        error: 'Evaluación remota no encontrada',
        code: 'REMOTE_ASSESSMENT_NOT_FOUND'
      });
    }

    // Registrar acceso
    await logAccess(remoteAssessment.id, req, 'view');

    // Verificar si ha expirado
    if (new Date() > remoteAssessment.expiresAt) {
      await prisma.remoteAssessment.update({
        where: { id: remoteAssessment.id },
        data: { status: 'expired' }
      });

      await logAccess(remoteAssessment.id, req, 'expire');

      return res.status(410).json({
        success: false,
        error: 'Esta evaluación ha expirado',
        code: 'REMOTE_ASSESSMENT_EXPIRED',
        data: {
          expiresAt: remoteAssessment.expiresAt
        }
      });
    }

    // Verificar si ya fue completada
    if (remoteAssessment.status === 'completed') {
      return res.status(409).json({
        success: false,
        error: 'Esta evaluación ya fue completada',
        code: 'REMOTE_ASSESSMENT_COMPLETED',
        data: {
          completedAt: remoteAssessment.completedAt
        }
      });
    }

    // Actualizar primer acceso si es necesario
    if (!remoteAssessment.accessedAt) {
      await prisma.remoteAssessment.update({
        where: { id: remoteAssessment.id },
        data: { 
          accessedAt: new Date(),
          status: 'accessed'
        }
      });
    }

    // Procesar items de la escala igual que en scales-public.js
    const itemsWithOptions = remoteAssessment.scale.items.map(item => {
      const normalizedItem = {
        ...item,
        text: item.itemText,
        number: item.itemNumber,
        helpText: item.help_text,
        questionType: item.question_type,
        alertTrigger: item.alert_trigger,
        alertCondition: item.alert_condition
      };

      if (item.scale_item_specific_options && item.scale_item_specific_options.length > 0) {
        return {
          ...normalizedItem,
          specificOptions: item.scale_item_specific_options
        };
      }

      return {
        ...normalizedItem,
        specificOptions: null
      };
    });

    // Normalizar interpretation rules
    const normalizedInterpretationRules = remoteAssessment.scale.interpretationRules ? 
      remoteAssessment.scale.interpretationRules.map(rule => ({
        id: rule.id,
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        severityLevel: rule.severityLevel,
        label: rule.interpretationLabel,
        color: rule.colorCode,
        description: rule.description,
        recommendations: rule.recommendations
      })) : [];

    // Normalizar subscales
    const normalizedSubscales = remoteAssessment.scale.subscales ? 
      remoteAssessment.scale.subscales.map(subscale => ({
        id: subscale.id,
        name: subscale.subscaleName,
        items: subscale.items,
        min_score: subscale.minScore,
        max_score: subscale.maxScore,
        description: subscale.description,
        referencias_bibliograficas: subscale.references || '',
        indice_cronbach: subscale.cronbachAlpha || 0
      })) : [];

    // Preparar respuesta
    const response = {
      success: true,
      data: {
        id: remoteAssessment.id,
        token,
        status: remoteAssessment.status,
        patient: {
          firstName: remoteAssessment.patient.firstName,
          lastName: remoteAssessment.patient.lastName
        },
        administrator: {
          name: remoteAssessment.administrator.name
        },
        customMessage: remoteAssessment.customMessage,
        scale: {
          ...remoteAssessment.scale,
          items: itemsWithOptions,
          interpretationRules: normalizedInterpretationRules,
          subscales: normalizedSubscales,
          documentation: remoteAssessment.scale.scale_documentation?.[0] || null
        },
        progress: remoteAssessment.progress ? {
          currentItemIndex: remoteAssessment.progress.currentItemIndex,
          percentageComplete: parseFloat(remoteAssessment.progress.percentageComplete),
          responses: remoteAssessment.progress.responses
        } : null,
        expiresAt: remoteAssessment.expiresAt,
        createdAt: remoteAssessment.createdAt
      }
    };

    console.log(`✅ Token validado exitosamente para evaluación: ${remoteAssessment.id}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error validando token:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al validar token',
      message: error.message,
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
});

/**
 * POST /api/clinimetrix/remote-assessments/:token/save-progress
 * Guardar progreso parcial de la evaluación remota
 */
router.post('/:token/save-progress', [
  param('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token debe tener exactamente 64 caracteres'),
  
  body('responses')
    .isArray()
    .withMessage('Las respuestas deben ser un array'),
  
  body('currentItemIndex')
    .isInt({ min: 0 })
    .withMessage('Índice del item actual debe ser un número positivo'),
  
  body('percentageComplete')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Porcentaje completado debe ser entre 0 y 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { token } = req.params;
    const { responses, currentItemIndex, percentageComplete } = req.body;

    console.log(`💾 Guardando progreso para token: ${token.substring(0, 8)}...`);

    // Buscar la evaluación remota
    const remoteAssessment = await prisma.remoteAssessment.findUnique({
      where: { token },
      include: {
        scale: {
          select: { totalItems: true }
        }
      }
    });

    if (!remoteAssessment) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación remota no encontrada'
      });
    }

    // Verificar que no haya expirado
    if (new Date() > remoteAssessment.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'Esta evaluación ha expirado'
      });
    }

    // Actualizar o crear progreso
    const progressData = {
      responses: responses,
      currentItemIndex,
      totalItems: remoteAssessment.scale.totalItems,
      percentageComplete: Math.round(percentageComplete * 100) / 100
    };

    await prisma.remoteAssessmentProgress.upsert({
      where: { remoteAssessmentId: remoteAssessment.id },
      update: progressData,
      create: {
        remoteAssessmentId: remoteAssessment.id,
        ...progressData
      }
    });

    // Actualizar estado de la evaluación
    await prisma.remoteAssessment.update({
      where: { id: remoteAssessment.id },
      data: { 
        status: responses.length > 0 ? 'in_progress' : 'accessed'
      }
    });

    // Registrar acceso
    await logAccess(remoteAssessment.id, req, 'save_progress');

    console.log(`✅ Progreso guardado: ${responses.length} respuestas, ${percentageComplete}% completado`);

    res.json({
      success: true,
      message: 'Progreso guardado exitosamente',
      data: {
        responsesSaved: responses.length,
        percentageComplete,
        currentItemIndex
      }
    });

  } catch (error) {
    console.error('❌ Error guardando progreso:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al guardar progreso',
      message: error.message
    });
  }
});

/**
 * POST /api/clinimetrix/remote-assessments/:token/complete
 * Completar evaluación remota y procesar resultados
 */
router.post('/:token/complete', [
  param('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token debe tener exactamente 64 caracteres'),
  
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Las respuestas deben ser un array no vacío'),
  
  body('responses.*.itemId')
    .notEmpty()
    .withMessage('ID del item es requerido'),
  
  body('responses.*.value')
    .notEmpty()
    .withMessage('Valor de respuesta es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { token } = req.params;
    const { responses } = req.body;

    console.log(`🎯 Completando evaluación remota: ${token.substring(0, 8)}...`);

    // Buscar la evaluación remota
    const remoteAssessment = await prisma.remoteAssessment.findUnique({
      where: { token },
      include: {
        scale: {
          select: { 
            id: true, 
            name: true, 
            totalItems: true 
          }
        }
      }
    });

    if (!remoteAssessment) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación remota no encontrada'
      });
    }

    // Verificar que no haya expirado
    if (new Date() > remoteAssessment.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'Esta evaluación ha expirado'
      });
    }

    // Verificar que no esté ya completada
    if (remoteAssessment.status === 'completed') {
      return res.status(409).json({
        success: false,
        error: 'Esta evaluación ya fue completada'
      });
    }

    console.log(`📝 Procesando ${responses.length} respuestas`);

    // Crear administración usando el servicio de scoring existente
    const administration = await prisma.scaleAdministration.create({
      data: {
        patientId: remoteAssessment.patientId,
        scaleId: remoteAssessment.scaleId,
        administratorId: remoteAssessment.administratorId,
        administrationType: 'remote',
        status: 'in_progress',
        startedAt: remoteAssessment.accessedAt || new Date(),
        notes: `Evaluación remota completada via token ${token.substring(0, 8)}...`
      }
    });

    console.log(`✅ Administración creada: ${administration.id}`);

    // Procesar con el servicio de scoring
    const scoringService = new AssessmentScoringService();
    
    try {
      const result = await scoringService.processAndSaveAssessment(
        administration.id,
        responses,
        remoteAssessment.patientId,
        remoteAssessment.scaleId,
        remoteAssessment.administratorId
      );

      // Marcar la evaluación remota como completada
      await prisma.remoteAssessment.update({
        where: { id: remoteAssessment.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Limpiar progreso temporal
      await prisma.remoteAssessmentProgress.deleteMany({
        where: { remoteAssessmentId: remoteAssessment.id }
      });

      // Registrar acceso
      await logAccess(remoteAssessment.id, req, 'complete');

      console.log(`🎯 Evaluación remota completada exitosamente: ${remoteAssessment.id}`);

      // Preparar respuesta
      const response = {
        success: true,
        message: 'Evaluación completada exitosamente. Gracias por su tiempo.',
        data: {
          administrationId: administration.id,
          remoteAssessmentId: remoteAssessment.id,
          completedAt: result.completedAt,
          scale: {
            name: remoteAssessment.scale.name,
            totalItems: remoteAssessment.scale.totalItems
          },
          totalScore: {
            raw: result.totalScore.raw,
            max: result.totalScore.max,
            interpretation: result.interpretation
          },
          subscaleScores: result.subscaleScores?.map(sub => ({
            name: sub.subscaleName,
            score: sub.rawScore,
            maxScore: sub.maxScore
          })) || [],
          summary: {
            totalResponses: responses.length,
            validResponses: result.totalScore.validResponses,
            severity: result.interpretation.severity
          }
        }
      };

      // Log para auditoría
      logger.info('Remote assessment completed', {
        remoteAssessmentId: remoteAssessment.id,
        administrationId: administration.id,
        patientId: remoteAssessment.patientId,
        scaleId: remoteAssessment.scaleId,
        scaleName: result.scale.name,
        totalScore: result.totalScore.raw,
        severity: result.interpretation.severity,
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
          notes: `Error en procesamiento remoto: ${scoringError.message}`
        }
      });

      throw scoringError;
    } finally {
      await scoringService.disconnect();
    }

  } catch (error) {
    console.error('❌ Error completando evaluación remota:', error);
    
    logger.error('Remote assessment completion failed', { 
      token: req.params.token.substring(0, 8) + '...',
      error: error.message,
      timestamp: new Date()
    });

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al completar evaluación',
      message: error.message,
      code: 'REMOTE_ASSESSMENT_COMPLETION_ERROR'
    });
  }
});

/**
 * GET /api/clinimetrix/remote-assessments/administrator/:administratorId
 * Obtener evaluaciones remotas creadas por un administrador
 */
router.get('/administrator/:administratorId', [
  param('administratorId')
    .notEmpty()
    .withMessage('ID del administrador es requerido'),
  
  query('status')
    .optional()
    .isIn(['pending', 'accessed', 'in_progress', 'completed', 'expired'])
    .withMessage('Estado inválido'),
  
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

    const { administratorId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    console.log(`📋 Obteniendo evaluaciones remotas del administrador: ${administratorId}`);

    const where = {
      OR: [
        { administratorId },
        { createdBy: administratorId }
      ]
    };

    if (status) {
      where.status = status;
    }

    const [remoteAssessments, total] = await Promise.all([
      prisma.remoteAssessment.findMany({
        where,
        include: {
          scale: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              totalItems: true,
              estimatedDurationMinutes: true
            }
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          accessLogs: {
            select: {
              accessedAt: true,
              action: true,
              deviceType: true
            },
            orderBy: { accessedAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.remoteAssessment.count({ where })
    ]);

    const formattedAssessments = remoteAssessments.map(assessment => ({
      id: assessment.id,
      token: assessment.token,
      status: assessment.status,
      patient: {
        id: assessment.patient.id,
        name: `${assessment.patient.firstName} ${assessment.patient.lastName}`,
        email: assessment.patient.email,
        phone: assessment.patient.phone
      },
      scale: assessment.scale,
      customMessage: assessment.customMessage,
      deliveryMethod: assessment.deliveryMethod,
      expirationDays: assessment.expirationDays,
      reminderEnabled: assessment.reminderEnabled,
      reminderCount: assessment.reminderCount,
      createdAt: assessment.createdAt,
      expiresAt: assessment.expiresAt,
      accessedAt: assessment.accessedAt,
      completedAt: assessment.completedAt,
      lastAccess: assessment.accessLogs[0] || null,
      assessmentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/assessment/remote/${assessment.token}`
    }));

    const response = {
      success: true,
      data: {
        assessments: formattedAssessments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        summary: {
          pending: formattedAssessments.filter(a => a.status === 'pending').length,
          accessed: formattedAssessments.filter(a => a.status === 'accessed').length,
          in_progress: formattedAssessments.filter(a => a.status === 'in_progress').length,
          completed: formattedAssessments.filter(a => a.status === 'completed').length,
          expired: formattedAssessments.filter(a => a.status === 'expired').length
        }
      }
    };

    console.log(`✅ ${formattedAssessments.length} evaluaciones remotas obtenidas`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo evaluaciones remotas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener evaluaciones remotas',
      message: error.message
    });
  }
});

/**
 * GET /api/clinimetrix/remote-assessments/message-templates
 * Obtener plantillas de mensaje predefinidas
 */
router.get('/message-templates', async (req, res) => {
  try {
    const { category } = req.query;

    const where = { isActive: true };
    if (category) {
      where.category = category;
    }

    const templates = await prisma.remoteAssessmentMessageTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Error obteniendo plantillas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo plantillas de mensaje',
      message: error.message
    });
  }
});

// Cerrar conexión Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router;