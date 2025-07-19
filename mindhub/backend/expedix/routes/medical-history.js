/**
 * Medical History API Routes for Expedix Hub
 * 
 * Comprehensive medical history management with healthcare compliance
 * and privacy protection implementing NOM-024-SSA3-2010 requirements
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Medical history entry types
 */
const ENTRY_TYPES = [
  'diagnosis',
  'treatment',
  'surgery',
  'allergy',
  'medication',
  'immunization',
  'family_history',
  'social_history',
  'hospitalization',
  'laboratory_result',
  'imaging_result',
  'consultation_note',
  'progress_note',
  'other'
];

/**
 * Validation middleware for medical history entries
 */
const validateMedicalHistoryEntry = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('entryType')
    .isIn(ENTRY_TYPES)
    .withMessage(`Entry type must be one of: ${ENTRY_TYPES.join(', ')}`),
  
  body('entryDate')
    .isISO8601()
    .withMessage('Invalid entry date format'),
  
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  
  body('icdCode')
    .optional()
    .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
    .withMessage('Invalid ICD-10 code format'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  
  body('isConfidential')
    .optional()
    .isBoolean()
    .withMessage('isConfidential must be boolean')
];

/**
 * GET /api/v1/expedix/medical-history/:patientId
 * Get medical history for a patient with filtering and pagination
 */
router.get('/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:medical_history']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('entryType').optional().isIn(ENTRY_TYPES),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patientId } = req.params;
      const { 
        entryType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        search
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {
        patientId,
        isActive: true
      };

      if (entryType) {
        where.entryType = entryType;
      }

      if (dateFrom || dateTo) {
        where.entryDate = {};
        if (dateFrom) where.entryDate.gte = new Date(dateFrom);
        if (dateTo) where.entryDate.lte = new Date(dateTo);
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Apply role-based filtering
      if (req.user?.role === 'patient') {
        // Patients cannot see confidential entries
        where.isConfidential = false;
      }

      const [entries, totalCount] = await executeTransaction([
        (prisma) => prisma.medicalHistory.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, role: true }
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                uploadDate: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { entryDate: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        (prisma) => prisma.medicalHistory.count({ where })
      ], 'getMedicalHistory');

      // Apply data masking for sensitive information
      const maskedEntries = entries.map(entry => {
        if (req.user?.role === 'nurse' && entry.isConfidential) {
          return {
            ...entry,
            description: '[Confidential - Access Restricted]',
            notes: '[Confidential - Access Restricted]'
          };
        }
        return entry;
      });

      // Log access for compliance
      logger.info('Medical history accessed', {
        patientId,
        userId: req.user?.id,
        entryCount: entries.length,
        filters: { entryType, dateFrom, dateTo, search: !!search }
      });

      res.json({
        success: true,
        data: maskedEntries,
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
  }
);

/**
 * GET /api/v1/expedix/medical-history/:patientId/summary
 * Get medical history summary with key information
 */
router.get('/:patientId/summary',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:medical_history']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;

      // Get summary data
      const summary = await executeQuery(
        async (prisma) => {
          const [
            diagnoses,
            medications,
            allergies,
            surgeries,
            chronics
          ] = await Promise.all([
            // Active diagnoses
            prisma.medicalHistory.findMany({
              where: {
                patientId,
                entryType: 'diagnosis',
                isActive: true,
                isCurrent: true
              },
              select: {
                id: true,
                title: true,
                icdCode: true,
                entryDate: true,
                severity: true
              },
              orderBy: { entryDate: 'desc' },
              take: 10
            }),
            
            // Current medications
            prisma.medicalHistory.findMany({
              where: {
                patientId,
                entryType: 'medication',
                isActive: true,
                isCurrent: true
              },
              select: {
                id: true,
                title: true,
                description: true,
                entryDate: true
              },
              orderBy: { entryDate: 'desc' }
            }),
            
            // Allergies
            prisma.medicalHistory.findMany({
              where: {
                patientId,
                entryType: 'allergy',
                isActive: true
              },
              select: {
                id: true,
                title: true,
                severity: true,
                description: true
              }
            }),
            
            // Surgeries
            prisma.medicalHistory.findMany({
              where: {
                patientId,
                entryType: 'surgery',
                isActive: true
              },
              select: {
                id: true,
                title: true,
                entryDate: true,
                description: true
              },
              orderBy: { entryDate: 'desc' }
            }),
            
            // Chronic conditions
            prisma.medicalHistory.findMany({
              where: {
                patientId,
                entryType: 'diagnosis',
                isActive: true,
                isChronic: true
              },
              select: {
                id: true,
                title: true,
                icdCode: true,
                entryDate: true
              }
            })
          ]);

          return {
            diagnoses,
            medications,
            allergies,
            surgeries,
            chronicConditions: chronics
          };
        },
        `getMedicalHistorySummary(${patientId})`
      );

      res.json({
        success: true,
        data: summary,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get medical history summary', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to retrieve medical history summary', 
        details: error.message 
      });
    }
  }
);

/**
 * POST /api/v1/expedix/medical-history
 * Create a new medical history entry
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:medical_history']),
  validateMedicalHistoryEntry,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const entryData = req.body;
      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: entryData.patientId },
          select: { id: true, medicalRecordNumber: true }
        }),
        `verifyPatient(${entryData.patientId})`
      );

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Create medical history entry
      const entry = await executeTransaction([
        async (prisma) => {
          const newEntry = await prisma.medicalHistory.create({
            data: {
              ...entryData,
              createdBy: userId,
              isActive: true,
              isCurrent: entryData.isCurrent || false,
              isChronic: entryData.isChronic || false,
              metadata: {
                source: 'manual_entry',
                enteredBy: req.user?.name,
                entryMethod: 'web_interface'
              }
            },
            include: {
              creator: {
                select: { id: true, name: true, role: true }
              }
            }
          });

          // Handle attachments if provided
          if (entryData.attachments && entryData.attachments.length > 0) {
            await prisma.medicalHistoryAttachment.createMany({
              data: entryData.attachments.map(att => ({
                medicalHistoryId: newEntry.id,
                ...att
              }))
            });
          }

          // Update related entries if this is a follow-up
          if (entryData.relatedEntryId) {
            await prisma.medicalHistory.update({
              where: { id: entryData.relatedEntryId },
              data: {
                isCurrent: false,
                followUpEntryId: newEntry.id
              }
            });
          }

          return newEntry;
        }
      ], 'createMedicalHistoryEntry');

      // Log creation for compliance
      await auditLogger.logDataModification(
        userId,
        'MEDICAL_HISTORY_CREATE',
        {
          patientId: entryData.patientId,
          medicalRecordNumber: patient.medicalRecordNumber,
          entryType: entryData.entryType,
          entryId: entry.id
        }
      );

      res.status(201).json({
        success: true,
        message: 'Medical history entry created successfully',
        data: entry
      });

    } catch (error) {
      logger.error('Failed to create medical history entry', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to create medical history entry', 
        details: error.message 
      });
    }
  }
);

/**
 * PUT /api/v1/expedix/medical-history/:id
 * Update medical history entry
 */
router.put('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:medical_history']),
  [
    param('id').isUUID().withMessage('Invalid entry ID format'),
    ...validateMedicalHistoryEntry
  ],
  async (req, res) => {
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

      // Get current entry
      const currentEntry = await executeQuery(
        (prisma) => prisma.medicalHistory.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            createdBy: true,
            entryType: true
          }
        }),
        `getCurrentEntry(${id})`
      );

      if (!currentEntry) {
        return res.status(404).json({ error: 'Medical history entry not found' });
      }

      // Check if user can edit (creator or admin)
      if (currentEntry.createdBy !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'You can only edit your own entries' });
      }

      // Update entry
      const updatedEntry = await executeQuery(
        (prisma) => prisma.medicalHistory.update({
          where: { id },
          data: {
            ...updateData,
            updatedAt: new Date(),
            metadata: {
              ...currentEntry.metadata,
              lastModifiedBy: req.user?.name,
              lastModifiedAt: new Date().toISOString()
            }
          },
          include: {
            creator: {
              select: { id: true, name: true, role: true }
            },
            attachments: true
          }
        }),
        `updateMedicalHistoryEntry(${id})`
      );

      // Log update for compliance
      await auditLogger.logDataModification(
        userId,
        'MEDICAL_HISTORY_UPDATE',
        {
          entryId: id,
          patientId: currentEntry.patientId,
          entryType: currentEntry.entryType,
          changes: Object.keys(updateData)
        }
      );

      res.json({
        success: true,
        message: 'Medical history entry updated successfully',
        data: updatedEntry
      });

    } catch (error) {
      logger.error('Failed to update medical history entry', {
        error: error.message,
        entryId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to update medical history entry', 
        details: error.message 
      });
    }
  }
);

/**
 * DELETE /api/v1/expedix/medical-history/:id
 * Soft delete medical history entry
 */
router.delete('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'admin'], ['delete:medical_history']),
  [
    param('id').isUUID().withMessage('Invalid entry ID format'),
    body('reason').notEmpty().withMessage('Deletion reason is required')
  ],
  async (req, res) => {
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

      // Get entry details
      const entry = await executeQuery(
        (prisma) => prisma.medicalHistory.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            entryType: true,
            title: true,
            isActive: true
          }
        }),
        `getEntry(${id})`
      );

      if (!entry) {
        return res.status(404).json({ error: 'Medical history entry not found' });
      }

      if (!entry.isActive) {
        return res.status(400).json({ error: 'Entry is already deactivated' });
      }

      // Soft delete
      await executeQuery(
        (prisma) => prisma.medicalHistory.update({
          where: { id },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: userId,
            deactivationReason: reason
          }
        }),
        `deactivateMedicalHistoryEntry(${id})`
      );

      // Log deletion for compliance
      await auditLogger.logDataModification(
        userId,
        'MEDICAL_HISTORY_DELETE',
        {
          entryId: id,
          patientId: entry.patientId,
          entryType: entry.entryType,
          title: entry.title,
          reason
        }
      );

      res.json({
        success: true,
        message: 'Medical history entry deactivated successfully'
      });

    } catch (error) {
      logger.error('Failed to deactivate medical history entry', {
        error: error.message,
        entryId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to deactivate medical history entry', 
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/v1/expedix/medical-history/:patientId/timeline
 * Get timeline view of medical history
 */
router.get('/:patientId/timeline',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:medical_history']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { months = 12 } = req.query;

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months));

      const timeline = await executeQuery(
        (prisma) => prisma.medicalHistory.findMany({
          where: {
            patientId,
            isActive: true,
            entryDate: {
              gte: startDate
            }
          },
          select: {
            id: true,
            entryType: true,
            title: true,
            entryDate: true,
            severity: true,
            isCurrent: true,
            creator: {
              select: { name: true, role: true }
            }
          },
          orderBy: { entryDate: 'desc' }
        }),
        `getMedicalHistoryTimeline(${patientId})`
      );

      // Group by month
      const groupedTimeline = timeline.reduce((acc, entry) => {
        const monthKey = new Date(entry.entryDate).toISOString().slice(0, 7);
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(entry);
        return acc;
      }, {});

      res.json({
        success: true,
        data: groupedTimeline,
        period: {
          from: startDate.toISOString(),
          to: new Date().toISOString(),
          months: parseInt(months)
        }
      });

    } catch (error) {
      logger.error('Failed to get medical history timeline', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to retrieve medical history timeline', 
        details: error.message 
      });
    }
  }
);

module.exports = router;