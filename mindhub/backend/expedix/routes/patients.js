/**
 * Patient Management API Routes for Expedix Hub
 * 
 * Comprehensive patient data management endpoints with healthcare compliance
 * and role-based access control implementing NOM-024-SSA3-2010 requirements
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const PatientController = require('../controllers/patient-controller');
const AuditLogger = require('../../shared/utils/audit-logger');
const { getPrismaClient, executeQuery, executeTransaction, schemas } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

// Initialize controllers and utilities
const patientController = new PatientController();
const auditLogger = new AuditLogger();

/**
 * Validation middleware for patient data
 */
const validatePatient = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date of birth format'),
  
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Invalid Mexican phone number'),
  
  body('curp')
    .optional()
    .matches(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/)
    .withMessage('Invalid CURP format'),
  
  body('emergencyContactPhone')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Invalid emergency contact phone'),
  
  body('consentToTreatment')
    .isBoolean()
    .withMessage('Consent to treatment must be boolean'),
  
  body('consentToDataProcessing')
    .isBoolean()
    .withMessage('Consent to data processing must be boolean')
];

/**
 * GET /api/v1/expedix/patients
 * List patients with filtering, pagination, and search
 */
router.get('/',
  ...middleware.utils.forHub('expedix'),
  [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().escape(),
  query('category').optional().isIn(['general', 'priority', 'chronic']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      search, 
      category,
      isActive = true 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {
      isActive: isActive === 'true',
      ...(category && { patientCategory: category })
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [patients, totalCount] = await executeTransaction([
      (prisma) => prisma.patient.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              consultations: true,
              prescriptions: true,
              medicalHistory: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      (prisma) => prisma.patient.count({ where })
    ], 'getPatients');

    // Log access for compliance
    logger.info('Patient list accessed', {
      userId: req.user?.id,
      patientCount: patients.length,
      filters: { category, search: !!search },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get patients', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve patients', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/expedix/patients/:id
 * Get specific patient details with access control
 */
router.get('/:id',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
  param('id').isUUID().withMessage('Invalid patient ID format')
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
    
    const patient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          medicalHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          consultations: {
            orderBy: { consultationDate: 'desc' },
            take: 10,
            include: {
              creator: {
                select: { id: true, name: true }
              }
            }
          },
          prescriptions: {
            where: { status: 'active' },
            include: {
              medication: {
                select: { 
                  genericName: true, 
                  brandNames: true,
                  therapeuticClass: true 
                }
              },
              prescriber: {
                select: { id: true, name: true }
              }
            }
          },
          scaleAdministrations: {
            orderBy: { administrationDate: 'desc' },
            take: 5,
            include: {
              scale: {
                select: { 
                  name: true, 
                  abbreviation: true, 
                  category: true 
                }
              }
            }
          }
        }
      }),
      `getPatient(${id})`
    );

    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient not found' 
      });
    }

    // Log access for compliance
    logger.info('Patient details accessed', {
      patientId: id,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    logger.error('Failed to get patient', { 
      error: error.message,
      patientId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve patient', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/expedix/patients
 * Create a new patient record
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  validatePatient,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const patientData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Generate unique medical record number
    const medicalRecordNumber = await generateMedicalRecordNumber();

    const patient = await executeQuery(
      (prisma) => prisma.patient.create({
        data: {
          ...patientData,
          medicalRecordNumber,
          createdBy: userId
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      'createPatient'
    );

    // Log creation for compliance
    logger.info('Patient created', {
      patientId: patient.id,
      medicalRecordNumber: patient.medicalRecordNumber,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });

  } catch (error) {
    logger.error('Failed to create patient', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create patient', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/v1/expedix/patients/:id
 * Update complete patient record
 */
router.put('/:id',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
  param('id').isUUID().withMessage('Invalid patient ID format'),
  ...validatePatient
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

    // Check if patient exists
    const existingPatient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id },
        select: { id: true, medicalRecordNumber: true }
      }),
      `checkPatient(${id})`
    );

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = await executeQuery(
      (prisma) => prisma.patient.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      `updatePatient(${id})`
    );

    // Log update for compliance
    logger.info('Patient updated', {
      patientId: id,
      medicalRecordNumber: existingPatient.medicalRecordNumber,
      updatedBy: userId,
      changes: Object.keys(updateData),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });

  } catch (error) {
    logger.error('Failed to update patient', { 
      error: error.message,
      patientId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update patient', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/v1/expedix/patients/:id
 * Soft delete patient record (archive)
 */
router.delete('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'admin'], ['delete:patient_data']),
  [
  param('id').isUUID().withMessage('Invalid patient ID format'),
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

    // Check if patient exists
    const existingPatient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id },
        select: { id: true, medicalRecordNumber: true, isActive: true }
      }),
      `checkPatient(${id})`
    );

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!existingPatient.isActive) {
      return res.status(400).json({ error: 'Patient is already inactive' });
    }

    // Soft delete (set isActive to false)
    await executeQuery(
      (prisma) => prisma.patient.update({
        where: { id },
        data: { isActive: false }
      }),
      `deactivatePatient(${id})`
    );

    // Log deletion for compliance
    logger.warn('Patient deactivated', {
      patientId: id,
      medicalRecordNumber: existingPatient.medicalRecordNumber,
      deactivatedBy: userId,
      reason,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to deactivate patient', { 
      error: error.message,
      patientId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to deactivate patient', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/expedix/patients/:id/summary
 * Get patient summary with key metrics
 */
router.get('/:id/summary',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
  param('id').isUUID().withMessage('Invalid patient ID format')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id },
        select: {
          id: true,
          medicalRecordNumber: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          patientCategory: true,
          createdAt: true,
          _count: {
            select: {
              consultations: true,
              prescriptions: { where: { status: 'active' } },
              medicalHistory: true,
              scaleAdministrations: true
            }
          }
        }
      }),
      `getPatientSummary(${id})`
    );

    if (!summary) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Calculate age
    const age = new Date().getFullYear() - new Date(summary.dateOfBirth).getFullYear();
    
    res.json({
      success: true,
      data: {
        ...summary,
        age,
        fullName: `${summary.firstName} ${summary.lastName}`
      }
    });

  } catch (error) {
    logger.error('Failed to get patient summary', { 
      error: error.message,
      patientId: req.params.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve patient summary', 
      details: error.message 
    });
  }
});

/**
 * Helper function to generate unique medical record number
 */
async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear();
  const prefix = 'EXP';
  
  // Get the count of patients created this year
  const prisma = getPrismaClient();
  const count = await prisma.patient.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

module.exports = router;