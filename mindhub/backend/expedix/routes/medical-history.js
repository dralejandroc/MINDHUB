/**
 * Expedix Medical History Routes
 * 
 * Manages patient medical history with healthcare compliance.
 * Implements secure handling of sensitive medical information.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * Validation middleware for medical history
 */
const validateMedicalHistory = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('chiefComplaint')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Chief complaint must be between 10 and 1000 characters'),
  
  body('historyOfPresentIllness')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('History of present illness must not exceed 2000 characters'),
  
  body('psychiatricHistory')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Psychiatric history must not exceed 2000 characters'),
  
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Medical history must not exceed 2000 characters'),
  
  body('familyHistory')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Family history must not exceed 1500 characters'),
  
  body('socialHistory')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Social history must not exceed 1500 characters'),
  
  body('substanceUseHistory')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Substance use history must not exceed 1000 characters'),
  
  body('allergies')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Allergies must not exceed 500 characters'),
  
  body('currentMedications')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Current medications must not exceed 1000 characters')
];

/**
 * GET /api/expedix/medical-history/patient/:patientId
 * Get all medical history entries for a patient
 */
router.get('/patient/:patientId', [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true }
      }),
      `checkPatient(${patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [medicalHistory, totalCount] = await executeTransaction([
      (prisma) => prisma.medicalHistory.findMany({
        where: { patientId },
        include: {
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
        orderBy: { createdAt: 'desc' }
      }),
      (prisma) => prisma.medicalHistory.count({
        where: { patientId }
      })
    ], 'getPatientMedicalHistory');

    // Log access for compliance
    logger.info('Medical history accessed', {
      patientId,
      recordCount: medicalHistory.length,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: medicalHistory,
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
    logger.error('Failed to get medical history', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve medical history', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/medical-history/:id
 * Get specific medical history entry
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid medical history ID format')
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
    
    const medicalHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.findUnique({
        where: { id },
        include: {
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      `getMedicalHistory(${id})`
    );

    if (!medicalHistory) {
      return res.status(404).json({ error: 'Medical history not found' });
    }

    // Log access for compliance
    logger.info('Medical history entry accessed', {
      medicalHistoryId: id,
      patientId: medicalHistory.patientId,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: medicalHistory
    });

  } catch (error) {
    logger.error('Failed to get medical history entry', { 
      error: error.message,
      medicalHistoryId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve medical history entry', 
      details: error.message 
    });
  }
});

/**
 * POST /api/expedix/medical-history
 * Create new medical history entry
 */
router.post('/', validateMedicalHistory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const medicalHistoryData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id: medicalHistoryData.patientId },
        select: { id: true, medicalRecordNumber: true }
      }),
      `checkPatient(${medicalHistoryData.patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const medicalHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.create({
        data: {
          ...medicalHistoryData,
          createdBy: userId
        },
        include: {
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      'createMedicalHistory'
    );

    // Log creation for compliance
    logger.info('Medical history created', {
      medicalHistoryId: medicalHistory.id,
      patientId: medicalHistory.patientId,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Medical history created successfully',
      data: medicalHistory
    });

  } catch (error) {
    logger.error('Failed to create medical history', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create medical history', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/expedix/medical-history/:id
 * Update existing medical history entry
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid medical history ID format'),
  ...validateMedicalHistory.filter(rule => 
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

    // Check if medical history exists
    const existingHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.findUnique({
        where: { id },
        select: { id: true, patientId: true }
      }),
      `checkMedicalHistory(${id})`
    );

    if (!existingHistory) {
      return res.status(404).json({ error: 'Medical history not found' });
    }

    const medicalHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        }
      }),
      `updateMedicalHistory(${id})`
    );

    // Log update for compliance
    logger.info('Medical history updated', {
      medicalHistoryId: id,
      patientId: existingHistory.patientId,
      updatedBy: userId,
      changes: Object.keys(updateData),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Medical history updated successfully',
      data: medicalHistory
    });

  } catch (error) {
    logger.error('Failed to update medical history', { 
      error: error.message,
      medicalHistoryId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update medical history', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/expedix/medical-history/:id
 * Delete medical history entry (with compliance logging)
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid medical history ID format'),
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

    // Check if medical history exists
    const existingHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.findUnique({
        where: { id },
        select: { 
          id: true, 
          patientId: true,
          chiefComplaint: true,
          createdAt: true
        }
      }),
      `checkMedicalHistory(${id})`
    );

    if (!existingHistory) {
      return res.status(404).json({ error: 'Medical history not found' });
    }

    // Delete the record
    await executeQuery(
      (prisma) => prisma.medicalHistory.delete({
        where: { id }
      }),
      `deleteMedicalHistory(${id})`
    );

    // Log deletion for compliance
    logger.warn('Medical history deleted', {
      medicalHistoryId: id,
      patientId: existingHistory.patientId,
      deletedBy: userId,
      reason,
      originalCreatedAt: existingHistory.createdAt,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Medical history deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete medical history', { 
      error: error.message,
      medicalHistoryId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to delete medical history', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/medical-history/patient/:patientId/latest
 * Get the most recent medical history entry for a patient
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

    const latestHistory = await executeQuery(
      (prisma) => prisma.medicalHistory.findFirst({
        where: { patientId },
        include: {
          patient: {
            select: { 
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      `getLatestMedicalHistory(${patientId})`
    );

    if (!latestHistory) {
      return res.status(404).json({ 
        error: 'No medical history found for this patient' 
      });
    }

    res.json({
      success: true,
      data: latestHistory
    });

  } catch (error) {
    logger.error('Failed to get latest medical history', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve latest medical history', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/medical-history/search
 * Search medical histories by keywords (with proper access control)
 */
router.get('/search', [
  query('q').trim().isLength({ min: 3 }).withMessage('Search query must be at least 3 characters'),
  query('patientId').optional().isUUID().withMessage('Invalid patient ID format'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { q: searchQuery, patientId, limit = 20 } = req.query;

    const where = {
      OR: [
        { chiefComplaint: { contains: searchQuery, mode: 'insensitive' } },
        { historyOfPresentIllness: { contains: searchQuery, mode: 'insensitive' } },
        { psychiatricHistory: { contains: searchQuery, mode: 'insensitive' } }
      ],
      ...(patientId && { patientId })
    };

    const results = await executeQuery(
      (prisma) => prisma.medicalHistory.findMany({
        where,
        include: {
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      'searchMedicalHistory'
    );

    // Log search for compliance
    logger.info('Medical history search performed', {
      searchQuery,
      resultCount: results.length,
      patientId,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: results,
      searchQuery,
      resultCount: results.length
    });

  } catch (error) {
    logger.error('Failed to search medical history', { 
      error: error.message,
      searchQuery: req.query.q,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to search medical history', 
      details: error.message 
    });
  }
});

module.exports = router;