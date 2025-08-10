/**
 * Expedix Consultations Routes
 * 
 * Manages medical consultations with SOAP note structure.
 * Implements healthcare compliance for clinical documentation.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * Validation middleware for consultations
 */
const validateConsultation = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('consultationDate')
    .isISO8601()
    .withMessage('Invalid consultation date format'),
  
  body('consultationType')
    .isIn(['initial', 'follow_up', 'emergency', 'telephone', 'video_call'])
    .withMessage('Invalid consultation type'),
  
  body('subjectiveNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Subjective notes must not exceed 2000 characters'),
  
  body('objectiveNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Objective notes must not exceed 2000 characters'),
  
  body('assessment')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Assessment must not exceed 1500 characters'),
  
  body('plan')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Plan must not exceed 1500 characters'),
  
  body('primaryDiagnosisCode')
    .optional()
    .matches(/^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/)
    .withMessage('Invalid ICD-10 diagnosis code format'),
  
  body('primaryDiagnosisDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Primary diagnosis description must not exceed 200 characters'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  
  body('nextAppointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid next appointment date format')
];

/**
 * GET /api/expedix/consultations
 * Get recent consultations for dashboard (simplified for demo)
 */
router.get('/', async (req, res) => {
  try {
    // For now, return empty array to fix frontend connection
    // TODO: Implement proper consultations query when database schema is fixed
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve consultations', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/consultations/patient/:patientId
 * Get all consultations for a patient
 */
router.get('/patient/:patientId', [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('type').optional().isIn(['initial', 'follow_up', 'emergency', 'telephone', 'video_call'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { patientId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patients.findUnique({
        where: { id: patientId },
        select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true }
      }),
      `checkPatient(${patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const where = {
      patientId,
      ...(type && { consultationType: type })
    };

    const [consultations, totalCount] = await executeTransaction([
      (prisma) => prisma.consultation.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, specialty: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { consultationDate: 'desc' }
      }),
      (prisma) => prisma.consultation.count({ where })
    ], 'getPatientConsultations');

    // Log access for compliance
    logger.info('Patient consultations accessed', {
      patientId,
      consultationCount: consultations.length,
      consultationType: type,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: consultations,
      patient: {
        id: patient.id,
        medicalRecordNumber: patient.medicalRecordNumber,
        fullName: `${patient.firstName} ${patient.lastName}`
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get patient consultations', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve consultations', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/consultations/:id
 * Get specific consultation details
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid consultation ID format')
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
    
    const consultation = await executeQuery(
      (prisma) => prisma.consultation.findUnique({
        where: { id },
        include: {
          creator: {
            select: { 
              id: true, 
              name: true, 
              email: true, 
              specialty: true,
              licenseNumber: true 
            }
          },
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true,
              dateOfBirth: true,
              gender: true
            }
          }
        }
      }),
      `getConsultation(${id})`
    );

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Log access for compliance
    logger.info('Consultation accessed', {
      consultationId: id,
      patientId: consultation.patientId,
      consultationType: consultation.consultationType,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    logger.error('Failed to get consultation', { 
      error: error.message,
      consultationId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve consultation', 
      details: error.message 
    });
  }
});

/**
 * POST /api/expedix/consultations
 * Create new consultation
 */
router.post('/', validateConsultation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const consultationData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patients.findUnique({
        where: { id: consultationData.patientId },
        select: { id: true, medicalRecordNumber: true }
      }),
      `checkPatient(${consultationData.patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Parse secondary diagnoses if provided as string
    if (typeof consultationData.secondaryDiagnosisCodes === 'string') {
      consultationData.secondaryDiagnosisCodes = 
        consultationData.secondaryDiagnosisCodes.split(',').map(code => code.trim());
    }
    if (typeof consultationData.secondaryDiagnosisDescriptions === 'string') {
      consultationData.secondaryDiagnosisDescriptions = 
        consultationData.secondaryDiagnosisDescriptions.split(',').map(desc => desc.trim());
    }

    const consultation = await executeQuery(
      (prisma) => prisma.consultation.create({
        data: {
          ...consultationData,
          createdBy: userId
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true, specialty: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      'createConsultation'
    );

    // Log creation for compliance
    logger.info('Consultation created', {
      consultationId: consultation.id,
      patientId: consultation.patientId,
      consultationType: consultation.consultationType,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Consultation created successfully',
      data: consultation
    });

  } catch (error) {
    logger.error('Failed to create consultation', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create consultation', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/expedix/consultations/:id
 * Update existing consultation
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid consultation ID format'),
  ...validateConsultation.filter(rule => 
    !rule.builder.fields.includes('patientId') // Don't allow changing patient ID
  )
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
    const updateData = req.body;
    const userId = req.user?.id;

    // Remove patientId from update data to prevent changes
    delete updateData.patientId;

    // Parse secondary diagnoses if provided as string
    if (typeof updateData.secondaryDiagnosisCodes === 'string') {
      updateData.secondaryDiagnosisCodes = 
        updateData.secondaryDiagnosisCodes.split(',').map(code => code.trim());
    }
    if (typeof updateData.secondaryDiagnosisDescriptions === 'string') {
      updateData.secondaryDiagnosisDescriptions = 
        updateData.secondaryDiagnosisDescriptions.split(',').map(desc => desc.trim());
    }

    // Check if consultation exists
    const existingConsultation = await executeQuery(
      (prisma) => prisma.consultation.findUnique({
        where: { id },
        select: { id: true, patientId: true, consultationType: true }
      }),
      `checkConsultation(${id})`
    );

    if (!existingConsultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const consultation = await executeQuery(
      (prisma) => prisma.consultation.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: { id: true, name: true, email: true, specialty: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      `updateConsultation(${id})`
    );

    // Log update for compliance
    logger.info('Consultation updated', {
      consultationId: id,
      patientId: existingConsultation.patientId,
      updatedBy: userId,
      changes: Object.keys(updateData),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Consultation updated successfully',
      data: consultation
    });

  } catch (error) {
    logger.error('Failed to update consultation', { 
      error: error.message,
      consultationId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update consultation', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/expedix/consultations/:id
 * Delete consultation (with compliance logging)
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid consultation ID format'),
  body('reason').notEmpty().withMessage('Deletion reason is required')
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
    const { reason } = req.body;
    const userId = req.user?.id;

    // Check if consultation exists
    const existingConsultation = await executeQuery(
      (prisma) => prisma.consultation.findUnique({
        where: { id },
        select: { 
          id: true, 
          patientId: true,
          consultationType: true,
          consultationDate: true,
          createdAt: true
        }
      }),
      `checkConsultation(${id})`
    );

    if (!existingConsultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Delete the record
    await executeQuery(
      (prisma) => prisma.consultation.delete({
        where: { id }
      }),
      `deleteConsultation(${id})`
    );

    // Log deletion for compliance
    logger.warn('Consultation deleted', {
      consultationId: id,
      patientId: existingConsultation.patientId,
      consultationType: existingConsultation.consultationType,
      consultationDate: existingConsultation.consultationDate,
      deletedBy: userId,
      reason,
      originalCreatedAt: existingConsultation.createdAt,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Consultation deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete consultation', { 
      error: error.message,
      consultationId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to delete consultation', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/consultations/patient/:patientId/latest
 * Get the most recent consultation for a patient
 */
router.get('/patient/:patientId/latest', [
  param('patientId').isUUID().withMessage('Invalid patient ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { patientId } = req.params;

    const latestConsultation = await executeQuery(
      (prisma) => prisma.consultation.findFirst({
        where: { patientId },
        include: {
          creator: {
            select: { id: true, name: true, specialty: true }
          },
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        orderBy: { consultationDate: 'desc' }
      }),
      `getLatestConsultation(${patientId})`
    );

    if (!latestConsultation) {
      return res.status(404).json({ 
        error: 'No consultations found for this patient' 
      });
    }

    res.json({
      success: true,
      data: latestConsultation
    });

  } catch (error) {
    logger.error('Failed to get latest consultation', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve latest consultation', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/consultations/stats/summary
 * Get consultation statistics summary
 */
router.get('/stats/summary', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('providerId').optional().isUUID().withMessage('Invalid provider ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate, providerId } = req.query;
    
    const where = {
      ...(startDate && endDate && {
        consultationDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(providerId && { createdBy: providerId })
    };

    const [
      totalConsultations,
      consultationsByType,
      averageDuration,
      recentConsultations
    ] = await executeTransaction([
      // Total consultations
      (prisma) => prisma.consultation.count({ where }),
      
      // Consultations by type
      (prisma) => prisma.consultation.groupBy({
        by: ['consultationType'],
        where,
        _count: { consultationType: true }
      }),
      
      // Average duration
      (prisma) => prisma.consultation.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true }
      }),
      
      // Recent consultations (last 10)
      (prisma) => prisma.consultation.findMany({
        where,
        include: {
          patient: {
            select: { firstName: true, lastName: true, medicalRecordNumber: true }
          },
          creator: {
            select: { name: true }
          }
        },
        take: 10,
        orderBy: { consultationDate: 'desc' }
      })
    ], 'getConsultationStats');

    res.json({
      success: true,
      data: {
        totalConsultations,
        consultationsByType: consultationsByType.reduce((acc, item) => {
          acc[item.consultationType] = item._count.consultationType;
          return acc;
        }, {}),
        averageDuration: Math.round(averageDuration._avg.duration || 0),
        recentConsultations
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get consultation stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve consultation statistics', 
      details: error.message 
    });
  }
});

module.exports = router;