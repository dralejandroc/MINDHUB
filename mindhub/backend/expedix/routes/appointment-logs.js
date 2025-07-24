const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('../../generated/prisma');
const AppointmentLogService = require('../services/AppointmentLogService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/expedix/appointment-logs/patient/:patientId
 * Get appointment logs for a specific patient
 */
router.get('/patient/:patientId', [
  param('patientId').notEmpty().withMessage('Patient ID is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await AppointmentLogService.getPatientAppointmentLogs(patientId, parseInt(limit));

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Error getting appointment logs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/expedix/appointment-logs/patient/:patientId/stats
 * Get appointment change statistics for a patient
 */
router.get('/patient/:patientId/stats', [
  param('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { patientId } = req.params;

    const stats = await AppointmentLogService.getPatientAppointmentStats(patientId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting appointment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/expedix/appointment-logs/patient/:patientId/alerts
 * Get active alerts for a patient
 */
router.get('/patient/:patientId/alerts', [
  param('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { patientId } = req.params;

    const alerts = await prisma.$queryRaw`
      SELECT * FROM patient_alerts 
      WHERE patient_id = ${patientId} AND is_active = true 
      ORDER BY created_at DESC
    `;

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error getting patient alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/expedix/appointment-logs/log-action
 * Log an appointment action (used internally by other services)
 */
router.post('/log-action', async (req, res) => {
  try {
    const logEntry = await AppointmentLogService.logAppointmentAction(req.body);

    res.json({
      success: true,
      data: logEntry
    });

  } catch (error) {
    console.error('Error logging appointment action:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;