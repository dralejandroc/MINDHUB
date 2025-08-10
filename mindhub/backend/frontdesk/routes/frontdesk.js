/**
 * FrontDesk API Routes
 * Rutas específicas para el sistema de recepción/secretarias
 */

const express = require('express');
const router = express.Router();
// Authentication handled by Clerk - middleware temporarily disabled for development
// const { authenticate } = require('../../shared/middleware');
const FrontDeskService = require('../services/FrontDeskService');

const frontDeskService = new FrontDeskService();

// ============ ESTADÍSTICAS ============

/**
 * GET /api/v1/frontdesk/stats/today
 * Obtener estadísticas del día actual
 */
router.get('/stats/today', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const stats = await frontDeskService.getTodayStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del día',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/appointments/today
 * Obtener citas del día actual
 */
router.get('/appointments/today', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const appointments = await frontDeskService.getTodayAppointments(userId);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error getting today appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas del día',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/tasks/pending
 * Obtener tareas pendientes
 */
router.get('/tasks/pending', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const tasks = await frontDeskService.getPendingTasks(userId);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting pending tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas pendientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ PAGOS ============

/**
 * GET /api/v1/frontdesk/payments/pending/:patientId
 * Obtener pagos pendientes de un paciente
 */
router.get('/payments/pending/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const pendingPayments = await frontDeskService.getPendingPayments(patientId, userId);

    res.json({
      success: true,
      data: pendingPayments
    });
  } catch (error) {
    console.error('Error getting pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos pendientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/frontdesk/payments/process
 * Procesar un nuevo pago
 */
router.post('/payments/process', [
  // Validation middleware
  require('express-validator').body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  require('express-validator').body('paymentMethod')
    .isIn(['cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check'])
    .withMessage('Invalid payment method'),
  require('express-validator').body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID'),
  require('express-validator').body('concept')
    .optional()
    .isString()
    .withMessage('Concept must be a string'),
  require('express-validator').body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
], async (req, res) => {
  try {
    // Check validation results
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const paymentData = req.body;

    const payment = await frontDeskService.processPayment({
      ...paymentData,
      processedBy: userId
    });

    res.json({
      success: true,
      data: payment,
      message: 'Pago registrado exitosamente'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/frontdesk/payments/pay-pending/:pendingId
 * Pagar un monto pendiente específico
 */
router.post('/payments/pay-pending/:pendingId', [
  // Validation middleware
  require('express-validator').param('pendingId')
    .isUUID()
    .withMessage('Invalid pending payment ID'),
  require('express-validator').body('paymentMethod')
    .isIn(['cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check'])
    .withMessage('Invalid payment method'),
  require('express-validator').body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
], async (req, res) => {
  try {
    // Check validation results
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { pendingId } = req.params;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const { paymentMethod, notes } = req.body;

    const payment = await frontDeskService.payPendingAmount(pendingId, {
      paymentMethod,
      notes,
      processedBy: userId
    });

    res.json({
      success: true,
      data: payment,
      message: 'Pago pendiente registrado exitosamente'
    });
  } catch (error) {
    console.error('Error paying pending amount:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago pendiente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ CITAS ============

/**
 * GET /api/v1/frontdesk/appointments/slots/:date
 * Obtener horarios disponibles para una fecha
 */
router.get('/appointments/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const slots = await frontDeskService.getAvailableSlots(date, userId);

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/frontdesk/appointments/schedule
 * Agendar una nueva cita
 */
router.post('/appointments/schedule', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const appointmentData = req.body;

    const appointment = await frontDeskService.scheduleAppointment({
      ...appointmentData,
      scheduledBy: userId
    });

    res.json({
      success: true,
      data: appointment,
      message: 'Cita agendada exitosamente'
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agendar la cita',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/frontdesk/appointments/:id/status
 * Actualizar estado de una cita
 */
router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';

    const appointment = await frontDeskService.updateAppointmentStatus(id, status, notes, userId);

    res.json({
      success: true,
      data: appointment,
      message: 'Estado de cita actualizado'
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de cita',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ BEHAVIORAL TRACKING ============

/**
 * POST /api/v1/frontdesk/appointments/:id/behavioral-event
 * Registrar evento conductual del paciente (retraso, no-show, etc.)
 */
router.post('/appointments/:id/behavioral-event', [
  require('express-validator').param('id')
    .notEmpty()
    .withMessage('Appointment ID is required'),
  require('express-validator').body('eventType')
    .isIn(['late_arrival', 'no_show', 'cancelled_last_minute', 'early_arrival', 'communication_issue', 'payment_delay'])
    .withMessage('Invalid event type'),
  require('express-validator').body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  require('express-validator').body('delayMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Delay minutes must be a positive integer')
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { eventType, description, delayMinutes } = req.body;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';

    const behavioralEvent = await frontDeskService.recordBehavioralEvent({
      appointmentId: id,
      eventType,
      description,
      delayMinutes,
      recordedBy: userId
    });

    res.json({
      success: true,
      data: behavioralEvent,
      message: 'Evento conductual registrado'
    });
  } catch (error) {
    console.error('Error recording behavioral event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar evento conductual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/patients/:patientId/behavioral-history
 * Obtener historial conductual de un paciente
 */
router.get('/patients/:patientId/behavioral-history', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user?.id || 'development-user';

    const behavioralHistory = await frontDeskService.getPatientBehavioralHistory(patientId, {
      limit: parseInt(limit),
      requestedBy: userId
    });

    res.json({
      success: true,
      data: behavioralHistory
    });
  } catch (error) {
    console.error('Error getting patient behavioral history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial conductual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/frontdesk/communications/log
 * Registrar comunicación entre sesiones (llamadas, WhatsApp, etc.)
 */
router.post('/communications/log', [
  require('express-validator').body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required'),
  require('express-validator').body('communicationType')
    .isIn(['phone_call', 'whatsapp', 'email', 'in_person'])
    .withMessage('Invalid communication type'),
  require('express-validator').body('direction')
    .isIn(['incoming', 'outgoing'])
    .withMessage('Direction must be incoming or outgoing'),
  require('express-validator').body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
  require('express-validator').body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer (seconds)')
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { patientId, communicationType, direction, content, duration } = req.body;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';

    const communication = await frontDeskService.logCommunication({
      patientId,
      communicationType,
      direction,
      content,
      duration,
      recordedBy: userId
    });

    res.json({
      success: true,
      data: communication,
      message: 'Comunicación registrada'
    });
  } catch (error) {
    console.error('Error logging communication:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar comunicación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ RECURSOS ============

/**
 * POST /api/v1/frontdesk/resources/send
 * Enviar recursos a un paciente
 */
router.post('/resources/send', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const sendingData = req.body;

    const result = await frontDeskService.sendResourcesToPatient({
      ...sendingData,
      sentBy: userId
    });

    res.json({
      success: true,
      data: result,
      message: 'Recursos enviados exitosamente'
    });
  } catch (error) {
    console.error('Error sending resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar recursos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/resources/history
 * Obtener historial de recursos enviados
 */
router.get('/resources/history', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const { page = 1, limit = 20 } = req.query;

    const history = await frontDeskService.getResourceHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting resource history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de recursos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ NOTIFICACIONES Y RECORDATORIOS ============

/**
 * POST /api/v1/frontdesk/reminders/appointment
 * Enviar recordatorio de cita
 */
router.post('/reminders/appointment', async (req, res) => {
  try {
    const { appointmentId, method, customMessage } = req.body;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';

    const result = await frontDeskService.sendAppointmentReminder(appointmentId, {
      method,
      customMessage,
      sentBy: userId
    });

    res.json({
      success: true,
      data: result,
      message: 'Recordatorio enviado exitosamente'
    });
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar recordatorio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/notifications/pending
 * Obtener notificaciones pendientes de enviar
 */
router.get('/notifications/pending', async (req, res) => {
  try {
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const notifications = await frontDeskService.getPendingNotifications(userId);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones pendientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ REPORTES RÁPIDOS ============

/**
 * GET /api/v1/frontdesk/reports/daily
 * Reporte diario para recepción
 */
router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';
    const reportDate = date || new Date().toISOString().split('T')[0];

    const report = await frontDeskService.getDailyReport(userId, reportDate);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte diario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/frontdesk/reports/payments
 * Reporte de pagos del día
 */
router.get('/reports/payments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // For development - using placeholder user ID since auth is disabled
    const userId = 'dev-user';

    const report = await frontDeskService.getPaymentsReport(userId, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating payments report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de pagos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Manejo de errores específico para FrontDesk
router.use((error, req, res, next) => {
  console.error('FrontDesk API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  if (error.message.includes('not found') || error.message.includes('No encontrado')) {
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado',
      error: error.message
    });
  }

  if (error.message.includes('Permission denied') || error.message.includes('No autorizado')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción',
      error: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;