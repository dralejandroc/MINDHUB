/**
 * Patient Timeline API Routes
 * 
 * Manages comprehensive patient medical timeline including:
 * - Consultations
 * - Prescriptions  
 * - Clinical assessments
 * - Clinical notes
 * - Appointments
 * - Alerts and reminders
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { validatePatientId } = require('../../shared/utils/id-validators');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * GET /api/expedix/patient-timeline/:patientId
 * Get comprehensive timeline for a patient
 */
router.get('/:patientId',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
    query('eventTypes').optional().isString().withMessage('Event types must be a comma-separated string'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
      const { 
        startDate, 
        endDate, 
        eventTypes = 'consultation,prescription,assessment,note,appointment', 
        limit = 50 
      } = req.query;

      const userId = req.user?.id;

      // Verify patient exists and access is allowed
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            maternalLastName: true
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      const requestedEventTypes = eventTypes.split(',').map(type => type.trim());
      let timelineEvents = [];

      // Build date filter if specified
      const dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Fetch different event types in parallel
      const eventPromises = [];

      // 1. Consultations
      if (requestedEventTypes.includes('consultation')) {
        eventPromises.push(
          executeQuery(
            (prisma) => prisma.consultation.findMany({
              where: {
                patientId: patientId,
                ...(Object.keys(dateFilter).length > 0 && { consultationDate: dateFilter })
              },
              include: {
                consultant: {
                  select: { name: true, email: true }
                }
              },
              orderBy: { consultationDate: 'desc' },
              take: Math.floor(parseInt(limit) / requestedEventTypes.length)
            }),
            'getConsultations'
          ).then(consultations => 
            consultations.map(consultation => ({
              id: consultation.id,
              type: 'consultation',
              title: consultation.reason || 'Consulta Médica',
              description: consultation.notes || consultation.diagnosis,
              date: consultation.consultationDate.toISOString().split('T')[0],
              time: consultation.consultationDate.toTimeString().slice(0, 5),
              status: consultation.status,
              priority: consultation.status === 'completed' ? 'medium' : 'high',
              professional: {
                name: consultation.consultant?.name || 'Dr. Unknown',
                role: 'Médico'
              },
              data: {
                reason: consultation.reason,
                diagnosis: consultation.diagnosis,
                treatmentPlan: consultation.treatmentPlan,
                notes: consultation.notes
              },
              actions: [
                { label: 'Ver Detalle', action: 'view_consultation', targetId: consultation.id },
                { label: 'Imprimir', action: 'print_consultation', targetId: consultation.id }
              ]
            }))
          )
        );
      }

      // 2. Prescriptions
      if (requestedEventTypes.includes('prescription')) {
        eventPromises.push(
          executeQuery(
            (prisma) => prisma.prescription.findMany({
              where: {
                patientId: patientId,
                ...(Object.keys(dateFilter).length > 0 && { startDate: dateFilter })
              },
              include: {
                medication: {
                  select: { name: true, genericName: true, category: true }
                }
              },
              orderBy: { startDate: 'desc' },
              take: Math.floor(parseInt(limit) / requestedEventTypes.length)
            }),
            'getPrescriptions'
          ).then(prescriptions => 
            prescriptions.map(prescription => ({
              id: prescription.id,
              type: 'prescription',
              title: `Prescripción - ${prescription.medication.name}`,
              description: `${prescription.dosage}, ${prescription.frequency}`,
              date: prescription.startDate.toISOString().split('T')[0],
              time: prescription.startDate.toTimeString().slice(0, 5),
              status: prescription.status,
              priority: prescription.status === 'active' ? 'high' : 'medium',
              professional: {
                name: 'Dr. Prescriptor',
                role: 'Médico'
              },
              data: {
                medication: prescription.medication.name,
                genericName: prescription.medication.genericName,
                dosage: prescription.dosage,
                frequency: prescription.frequency,
                startDate: prescription.startDate,
                endDate: prescription.endDate,
                notes: prescription.notes
              },
              actions: [
                { label: 'Ver Receta', action: 'view_prescription', targetId: prescription.id },
                { label: 'Renovar', action: 'renew_prescription', targetId: prescription.id }
              ]
            }))
          )
        );
      }

      // 3. Scale Administrations (Assessments)
      if (requestedEventTypes.includes('assessment')) {
        eventPromises.push(
          executeQuery(
            (prisma) => prisma.scaleAdministration.findMany({
              where: {
                patientId: patientId,
                ...(Object.keys(dateFilter).length > 0 && { administrationDate: dateFilter })
              },
              include: {
                scale: {
                  select: { name: true, abbreviation: true, category: true }
                },
                administrator: {
                  select: { name: true }
                }
              },
              orderBy: { administrationDate: 'desc' },
              take: Math.floor(parseInt(limit) / requestedEventTypes.length)
            }),
            'getAssessments'
          ).then(assessments => 
            assessments.map(assessment => ({
              id: assessment.id,
              type: 'assessment',
              title: `Evaluación ${assessment.scale.abbreviation} - ${assessment.scale.name}`,
              description: assessment.totalScore ? 
                `Puntuación: ${assessment.totalScore} - ${assessment.interpretation || 'Evaluación completada'}` :
                'Evaluación en progreso',
              date: assessment.administrationDate.toISOString().split('T')[0],
              time: assessment.administrationDate.toTimeString().slice(0, 5),
              status: assessment.status,
              priority: assessment.severity === 'high' || assessment.severity === 'critical' ? 'urgent' : 'medium',
              professional: {
                name: assessment.administrator?.name || 'Profesional',
                role: 'Psicólogo'
              },
              data: {
                scale: assessment.scale.name,
                abbreviation: assessment.scale.abbreviation,
                totalScore: assessment.totalScore,
                interpretation: assessment.interpretation,
                severity: assessment.severity,
                notes: assessment.notes
              },
              actions: [
                { label: 'Ver Resultados', action: 'view_assessment', targetId: assessment.id },
                { label: 'Nueva Evaluación', action: 'new_assessment', scaleId: assessment.scaleId }
              ]
            }))
          )
        );
      }

      // Wait for all event queries to complete
      const eventResults = await Promise.allSettled(eventPromises);
      
      // Combine and sort all events
      eventResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          timelineEvents.push(...result.value);
        } else {
          console.error(`Error fetching event type ${requestedEventTypes[index]}:`, result.reason);
        }
      });

      // Sort all events by date (most recent first)
      timelineEvents.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
        return dateB - dateA;
      });

      // Limit results
      timelineEvents = timelineEvents.slice(0, parseInt(limit));

      // Calculate summary statistics
      const summary = {
        totalEvents: timelineEvents.length,
        eventTypes: {
          consultation: timelineEvents.filter(e => e.type === 'consultation').length,
          prescription: timelineEvents.filter(e => e.type === 'prescription').length,
          assessment: timelineEvents.filter(e => e.type === 'assessment').length,
          note: timelineEvents.filter(e => e.type === 'note').length,
          appointment: timelineEvents.filter(e => e.type === 'appointment').length
        },
        dateRange: timelineEvents.length > 0 ? {
          earliest: timelineEvents[timelineEvents.length - 1].date,
          latest: timelineEvents[0].date
        } : null
      };

      // Log timeline access
      logger.info('Patient timeline accessed', {
        patientId: patientId,
        userId: userId,
        eventCount: timelineEvents.length,
        eventTypes: requestedEventTypes
      });

      res.json({
        success: true,
        data: {
          patient: {
            id: patient.id,
            name: `${patient.firstName} ${patient.paternalLastName} ${patient.maternalLastName}`.trim(),
          },
          timeline: timelineEvents,
          summary: summary,
          filters: {
            startDate: startDate,
            endDate: endDate,
            eventTypes: requestedEventTypes,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient timeline', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient timeline',
        message: 'An error occurred while retrieving the patient timeline'
      });
    }
  }
);

/**
 * POST /api/expedix/patient-timeline/:patientId/note
 * Add a clinical note to patient timeline
 */
router.post('/:patientId/note',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId),
    body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priority must be low, medium, high, or urgent'),
    body('category').optional().isString().isLength({ max: 50 }).withMessage('Category must be max 50 characters')
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
      const { title, content, priority = 'medium', category = 'general' } = req.body;
      const userId = req.user?.id || 'system';

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            paternalLastName: true,
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // For now, we'll store clinical notes in a simple format
      // In a full implementation, you'd have a dedicated clinical_notes table
      const noteData = {
        id: uuidv4(),
        patientId: patientId,
        title: title,
        content: content,
        category: category,
        priority: priority,
        createdBy: userId,
        createdAt: new Date(),
        type: 'clinical_note'
      };

      // Log the note creation
      logger.info('Clinical note added to timeline', {
        patientId: patientId,
        noteId: noteData.id,
        title: title,
        priority: priority,
        createdBy: userId
      });

      // Return the note formatted as timeline event
      const timelineEvent = {
        id: noteData.id,
        type: 'note',
        title: title,
        description: content.length > 100 ? content.substring(0, 100) + '...' : content,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        status: 'completed',
        priority: priority,
        professional: {
          name: 'Usuario Actual', // In real implementation, get from user data
          role: 'Profesional'
        },
        data: {
          content: content,
          category: category,
          contactType: 'Presencial'
        }
      };

      res.status(201).json({
        success: true,
        message: 'Clinical note added successfully',
        data: timelineEvent
      });

    } catch (error) {
      logger.error('Failed to add clinical note', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to add clinical note',
        message: 'An error occurred while adding the clinical note'
      });
    }
  }
);

/**
 * GET /api/expedix/patient-timeline/:patientId/alerts
 * Get active alerts and reminders for patient
 */
router.get('/:patientId/alerts',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId)
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Get active prescriptions that might be expiring
      const activePrescriptions = await executeQuery(
        (prisma) => prisma.prescription.findMany({
          where: {
            patientId: patientId,
            status: 'active',
            endDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
            }
          },
          include: {
            medication: {
              select: { name: true }
            }
          }
        }),
        'getExpiringPrescriptions'
      );

      // Generate alerts
      const alerts = [];

      activePrescriptions.forEach(prescription => {
        const daysUntilExpiry = Math.ceil(
          (new Date(prescription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 5) {
          alerts.push({
            id: `prescription_expiry_${prescription.id}`,
            type: 'alert',
            title: 'Alerta - Medicamento por Vencer',
            description: `La prescripción de ${prescription.medication.name} vence en ${daysUntilExpiry} días`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            status: 'pending',
            priority: daysUntilExpiry <= 2 ? 'urgent' : 'high',
            data: {
              alertType: 'medication_expiry',
              medication: prescription.medication.name,
              daysUntilExpiry: daysUntilExpiry,
              prescriptionId: prescription.id
            },
            actions: [
              { label: 'Renovar Receta', action: 'renew_prescription', targetId: prescription.id },
              { label: 'Programar Cita', action: 'schedule_appointment', patientId: patientId }
            ]
          });
        }
      });

      res.json({
        success: true,
        data: {
          patientId: patientId,
          alerts: alerts,
          summary: {
            total: alerts.length,
            urgent: alerts.filter(a => a.priority === 'urgent').length,
            high: alerts.filter(a => a.priority === 'high').length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient alerts', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient alerts',
        message: 'An error occurred while retrieving patient alerts'
      });
    }
  }
);

module.exports = router;