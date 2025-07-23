/**
 * Appointment Management System for Expedix Hub
 * 
 * Comprehensive appointment scheduling and confirmation system
 * with comprehensive appointment management and patient confirmation workflows
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Appointment status types
 */
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  COMPLETED: 'completed',
  RESCHEDULED: 'rescheduled'
};

/**
 * Appointment types for comprehensive medical practice management
 */
const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow_up',
  EMERGENCY: 'emergency',
  THERAPY: 'therapy',
  EVALUATION: 'evaluation',
  MEDICATION_REVIEW: 'medication_review'
};

/**
 * GET /api/v1/expedix/appointments/patient/:patientId
 * Get appointments for a specific patient
 */
router.get('/patient/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:appointments']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('status').optional().isIn(Object.values(APPOINTMENT_STATUS)),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('includeHistory').optional().isBoolean()
  ],
  async (req, res) => {
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
      const { status, from, to, includeHistory = true } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only view their own appointments'
        });
      }

      // Build where clause
      const whereClause = { patientId };
      
      if (status) {
        whereClause.status = status;
      }

      if (from || to) {
        whereClause.appointmentDate = {};
        if (from) whereClause.appointmentDate.gte = new Date(from);
        if (to) whereClause.appointmentDate.lte = new Date(to);
      }

      const appointments = await executeQuery(
        (prisma) => prisma.appointment.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true,
                phone: true,
                email: true
              }
            },
            provider: {
              select: {
                id: true,
                name: true,
                specialization: true,
                license: true
              }
            },
            ...(includeHistory && {
              appointmentHistory: {
                orderBy: { createdAt: 'desc' },
                include: {
                  modifiedBy: {
                    select: { name: true, role: true }
                  }
                }
              }
            }),
            confirmations: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: [
            { appointmentDate: 'asc' }
          ]
        }),
        `getPatientAppointments(${patientId})`
      );

      // Calculate appointment statistics
      const stats = {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === APPOINTMENT_STATUS.SCHEDULED).length,
        confirmed: appointments.filter(a => a.status === APPOINTMENT_STATUS.CONFIRMED).length,
        completed: appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length,
        upcoming: appointments.filter(a => 
          new Date(a.appointmentDate) > new Date() && 
          [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(a.status)
        ).length
      };

      res.json({
        success: true,
        data: {
          appointments: appointments,
          statistics: stats
        }
      });

    } catch (error) {
      logger.error('Failed to get patient appointments', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve appointments',
        message: 'An error occurred while retrieving patient appointments'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/appointments/schedule
 * Schedule a new appointment
 */
router.post('/schedule',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:appointments']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('providerId').isUUID().withMessage('Invalid provider ID format'),
    body('appointmentDate').isISO8601().withMessage('Invalid appointment date format'),
    body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
    body('appointmentType').isIn(Object.values(APPOINTMENT_TYPES)).withMessage('Invalid appointment type'),
    body('reason').isString().notEmpty().withMessage('Appointment reason is required'),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('sendConfirmation').optional().isBoolean(),
    body('requiresPreparation').optional().isBoolean(),
    body('preparationInstructions').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        patientId,
        providerId,
        appointmentDate,
        duration,
        appointmentType,
        reason,
        notes,
        sendConfirmation = true,
        requiresPreparation = false,
        preparationInstructions
      } = req.body;

      const userId = req.user?.id;

      // Verify patient and provider exist
      const [patient, provider] = await executeTransaction([
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            phone: true,
            email: true
          }
        }),
        (prisma) => prisma.user.findUnique({
          where: { id: providerId },
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true
          }
        })
      ], 'verifyPatientAndProvider');

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found'
        });
      }

      // Check for scheduling conflicts
      const conflictingAppointment = await checkSchedulingConflicts(
        providerId, 
        appointmentDate, 
        duration
      );

      if (conflictingAppointment) {
        return res.status(409).json({
          success: false,
          error: 'Scheduling conflict',
          message: 'Provider already has an appointment at this time',
          conflictingAppointment: conflictingAppointment
        });
      }

      // Generate appointment number
      const appointmentNumber = await generateAppointmentNumber();

      // Create appointment with history tracking
      const [appointment, historyEntry] = await executeTransaction([
        (prisma) => prisma.appointment.create({
          data: {
            id: uuidv4(),
            appointmentNumber: appointmentNumber,
            patientId: patientId,
            providerId: providerId,
            appointmentDate: new Date(appointmentDate),
            duration: duration,
            appointmentType: appointmentType,
            reason: reason,
            notes: notes,
            status: APPOINTMENT_STATUS.SCHEDULED,
            requiresPreparation: requiresPreparation,
            preparationInstructions: preparationInstructions,
            scheduledBy: userId,
            createdAt: new Date()
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true,
                phone: true,
                email: true
              }
            },
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }),
        (prisma, results) => {
          const appointmentId = results[0].id;
          return prisma.appointmentHistory.create({
            data: {
              id: uuidv4(),
              appointmentId: appointmentId,
              action: 'SCHEDULED',
              changes: {
                status: APPOINTMENT_STATUS.SCHEDULED,
                appointmentDate: appointmentDate,
                duration: duration,
                appointmentType: appointmentType
              },
              reason: `Cita agendada: ${reason}`,
              modifiedBy: userId,
              createdAt: new Date()
            }
          });
        }
      ], 'scheduleAppointment');

      // Send confirmation if requested
      if (sendConfirmation && patient.email) {
        await sendAppointmentConfirmation(appointment, 'scheduled');
      }

      // Log appointment scheduling
      logger.info('Appointment scheduled', {
        appointmentId: appointment.id,
        appointmentNumber: appointmentNumber,
        patientId: patientId,
        providerId: providerId,
        appointmentDate: appointmentDate,
        scheduledBy: userId,
        medicalRecordNumber: patient.medicalRecordNumber
      });

      // Audit log
      await auditLogger.logDataModification(
        userId,
        'APPOINTMENT_SCHEDULE',
        {
          appointmentId: appointment.id,
          patientId: patientId,
          providerId: providerId,
          appointmentDate: appointmentDate,
          appointmentType: appointmentType
        }
      );

      res.status(201).json({
        success: true,
        message: 'Appointment scheduled successfully',
        data: {
          appointment: appointment,
          history: historyEntry,
          confirmationSent: sendConfirmation && !!patient.email
        }
      });

    } catch (error) {
      logger.error('Failed to schedule appointment', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to schedule appointment',
        message: 'An error occurred while scheduling the appointment'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/appointments/:id/confirm
 * Confirm appointment (can be done by patient or staff)
 */
router.post('/:id/confirm',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['write:appointments']),
  [
    param('id').isUUID().withMessage('Invalid appointment ID format'),
    body('confirmationType').isIn(['patient', 'staff', 'automatic']).withMessage('Invalid confirmation type'),
    body('confirmationMethod').optional().isIn(['phone', 'email', 'sms', 'in_person']),
    body('notes').optional().isString().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { 
        confirmationType, 
        confirmationMethod = 'email', 
        notes 
      } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get existing appointment
      const appointment = await executeQuery(
        (prisma) => prisma.appointment.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true,
                email: true,
                phone: true
              }
            },
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }),
        `getAppointmentForConfirmation(${id})`
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      // Verify patient access for patient confirmations
      if (confirmationType === 'patient' && userRole === 'patient' && userId !== appointment.patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only confirm their own appointments'
        });
      }

      // Check if appointment can be confirmed
      if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
        return res.status(400).json({
          success: false,
          error: 'Cannot confirm cancelled appointment'
        });
      }

      if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
        return res.status(400).json({
          success: false,
          error: 'Cannot confirm completed appointment'
        });
      }

      // Update appointment and create confirmation record
      const [updatedAppointment, confirmation, historyEntry] = await executeTransaction([
        (prisma) => prisma.appointment.update({
          where: { id },
          data: {
            status: APPOINTMENT_STATUS.CONFIRMED,
            confirmedAt: new Date(),
            confirmedBy: userId,
            updatedAt: new Date()
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }),
        (prisma) => prisma.appointmentConfirmation.create({
          data: {
            id: uuidv4(),
            appointmentId: id,
            confirmationType: confirmationType,
            confirmationMethod: confirmationMethod,
            confirmedBy: userId,
            notes: notes,
            confirmedAt: new Date()
          }
        }),
        (prisma) => prisma.appointmentHistory.create({
          data: {
            id: uuidv4(),
            appointmentId: id,
            action: 'CONFIRMED',
            changes: {
              status: APPOINTMENT_STATUS.CONFIRMED,
              confirmationType: confirmationType,
              confirmationMethod: confirmationMethod
            },
            reason: `Cita confirmada por ${confirmationType}`,
            modifiedBy: userId,
            createdAt: new Date()
          }
        })
      ], 'confirmAppointment');

      // Send confirmation notification
      await sendAppointmentConfirmation(updatedAppointment, 'confirmed');

      // Log appointment confirmation
      logger.info('Appointment confirmed', {
        appointmentId: id,
        appointmentNumber: appointment.appointmentNumber,
        confirmationType: confirmationType,
        confirmationMethod: confirmationMethod,
        confirmedBy: userId,
        medicalRecordNumber: appointment.patient.medicalRecordNumber
      });

      res.json({
        success: true,
        message: 'Appointment confirmed successfully',
        data: {
          appointment: updatedAppointment,
          confirmation: confirmation,
          history: historyEntry
        }
      });

    } catch (error) {
      logger.error('Failed to confirm appointment', {
        error: error.message,
        appointmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to confirm appointment',
        message: 'An error occurred while confirming the appointment'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/appointments/:id/cancel
 * Cancel appointment with reason tracking
 */
router.post('/:id/cancel',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['write:appointments']),
  [
    param('id').isUUID().withMessage('Invalid appointment ID format'),
    body('reason').isString().notEmpty().withMessage('Cancellation reason is required'),
    body('cancelledBy').isIn(['patient', 'provider', 'admin']).withMessage('Invalid cancellation source'),
    body('rescheduleRequested').optional().isBoolean(),
    body('notifyPatient').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { 
        reason, 
        cancelledBy, 
        rescheduleRequested = false,
        notifyPatient = true 
      } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get existing appointment
      const appointment = await executeQuery(
        (prisma) => prisma.appointment.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true,
                email: true,
                phone: true
              }
            },
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }),
        `getAppointmentForCancellation(${id})`
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      // Verify access for patient cancellations
      if (cancelledBy === 'patient' && userRole === 'patient' && userId !== appointment.patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only cancel their own appointments'
        });
      }

      // Check if appointment can be cancelled
      if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel completed appointment'
        });
      }

      if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
        return res.status(400).json({
          success: false,
          error: 'Appointment is already cancelled'
        });
      }

      // Update appointment and create history entry
      const [updatedAppointment, historyEntry] = await executeTransaction([
        (prisma) => prisma.appointment.update({
          where: { id },
          data: {
            status: APPOINTMENT_STATUS.CANCELLED,
            cancellationReason: reason,
            cancelledBy: userId,
            cancelledAt: new Date(),
            rescheduleRequested: rescheduleRequested,
            updatedAt: new Date()
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }),
        (prisma) => prisma.appointmentHistory.create({
          data: {
            id: uuidv4(),
            appointmentId: id,
            action: 'CANCELLED',
            changes: {
              status: APPOINTMENT_STATUS.CANCELLED,
              cancellationReason: reason,
              cancelledBy: cancelledBy,
              rescheduleRequested: rescheduleRequested
            },
            reason: `Cita cancelada por ${cancelledBy}: ${reason}`,
            modifiedBy: userId,
            createdAt: new Date()
          }
        })
      ], 'cancelAppointment');

      // Send cancellation notification
      if (notifyPatient && appointment.patient.email) {
        await sendAppointmentConfirmation(updatedAppointment, 'cancelled');
      }

      // Log appointment cancellation
      logger.info('Appointment cancelled', {
        appointmentId: id,
        appointmentNumber: appointment.appointmentNumber,
        cancelledBy: cancelledBy,
        reason: reason,
        rescheduleRequested: rescheduleRequested,
        cancelledByUserId: userId,
        medicalRecordNumber: appointment.patient.medicalRecordNumber
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: {
          appointment: updatedAppointment,
          history: historyEntry,
          rescheduleRequested: rescheduleRequested
        }
      });

    } catch (error) {
      logger.error('Failed to cancel appointment', {
        error: error.message,
        appointmentId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment',
        message: 'An error occurred while cancelling the appointment'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/appointments/provider/:providerId/schedule
 * Get provider's schedule for appointment booking
 */
router.get('/provider/:providerId/schedule',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:appointments']),
  [
    param('providerId').isUUID().withMessage('Invalid provider ID format'),
    query('date').isISO8601().withMessage('Invalid date format'),
    query('duration').optional().isInt({ min: 15, max: 480 })
  ],
  async (req, res) => {
    try {
      const { providerId } = req.params;
      const { date, duration = 60 } = req.query;

      const availableSlots = await getProviderAvailability(
        providerId, 
        new Date(date), 
        parseInt(duration)
      );

      res.json({
        success: true,
        data: {
          providerId: providerId,
          date: date,
          duration: parseInt(duration),
          availableSlots: availableSlots
        }
      });

    } catch (error) {
      logger.error('Failed to get provider schedule', {
        error: error.message,
        providerId: req.params.providerId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve provider schedule',
        message: 'An error occurred while retrieving provider availability'
      });
    }
  }
);

/**
 * Helper functions
 */

async function generateAppointmentNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `APT-${year}${month}`;
  
  const prisma = getPrismaClient();
  const count = await prisma.appointment.count({
    where: {
      appointmentNumber: {
        startsWith: prefix
      }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
}

async function checkSchedulingConflicts(providerId, appointmentDate, duration) {
  const startTime = new Date(appointmentDate);
  const endTime = new Date(startTime.getTime() + (duration * 60000)); // duration in minutes

  const prisma = getPrismaClient();
  
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      providerId: providerId,
      status: {
        in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED]
      },
      OR: [
        {
          appointmentDate: {
            gte: startTime,
            lt: endTime
          }
        },
        {
          AND: [
            { appointmentDate: { lte: startTime } },
            {
              appointmentDate: {
                gte: new Date(startTime.getTime() - (60000 * 240)) // Check 4 hours before
              }
            }
          ]
        }
      ]
    },
    select: {
      appointmentNumber: true,
      appointmentDate: true,
      duration: true
    }
  });

  return conflictingAppointment;
}

async function getProviderAvailability(providerId, date, duration) {
  // This would typically integrate with a scheduling system
  // For now, we'll return basic availability slots
  
  const slots = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM
  const slotDuration = duration;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Check if slot is available (no conflicting appointments)
      const conflict = await checkSchedulingConflicts(providerId, slotTime, duration);
      
      if (!conflict) {
        slots.push({
          time: slotTime.toISOString(),
          available: true,
          duration: duration
        });
      }
    }
  }

  return slots;
}

async function sendAppointmentConfirmation(appointment, type) {
  // This would integrate with an email/SMS service
  // For now, we'll just log the notification
  
  logger.info('Appointment notification sent', {
    appointmentId: appointment.id,
    type: type,
    patientEmail: appointment.patient.email,
    patientPhone: appointment.patient.phone
  });

  // TODO: Implement actual email/SMS sending
  return true;
}

module.exports = router;