/**
 * Enhanced Patient Registration API Routes for Expedix Hub
 * 
 * Comprehensive patient registration with medical history forms,
 * CURP validation, and healthcare compliance following Mexican healthcare standards
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const AuditLogger = require('../../shared/utils/audit-logger');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * CURP Validation Helper
 * Validates Mexican CURP (Clave Única de Registro de Población)
 */
function validateCURP(curp) {
  if (!curp || curp.length !== 18) return false;
  
  const pattern = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}[0-1]{1}[0-9]{1}[0-3]{1}[0-9]{1}[HM]{1}[A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]{1}[0-9]{1}$/;
  return pattern.test(curp);
}

/**
 * Comprehensive patient registration validation
 */
const validateCompletePatientRegistration = [
  // Basic demographic information
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  
  body('paternalLastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido paterno debe tener entre 2 y 50 caracteres'),
  
  body('maternalLastName')
    .optional()
    .trim()
    .isLength({ min: 0, max: 50 })
    .withMessage('Apellido materno no debe exceder 50 caracteres'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Formato de fecha de nacimiento inválido'),
  
  body('gender')
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Género debe ser MALE, FEMALE u OTHER'),
  
  body('curp')
    .optional()
    .custom(value => {
      if (value && !validateCURP(value)) {
        throw new Error('CURP inválido');
      }
      return true;
    }),
  
  // Contact information
  body('email')
    .optional()
    .isEmail()
    .withMessage('Formato de email inválido'),
  
  body('phone')
    .optional()
    .matches(/^\+52-\d{2}-\d{4}-\d{4}$/)
    .withMessage('Teléfono debe tener formato +52-XX-XXXX-XXXX'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 255 }),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  body('address.postalCode')
    .optional()
    .matches(/^\d{5}$/)
    .withMessage('Código postal debe ser de 5 dígitos'),
  
  // Emergency contact
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  body('emergencyContact.relationship')
    .optional()
    .isIn(['parent', 'spouse', 'sibling', 'child', 'friend', 'other']),
  
  body('emergencyContact.phone')
    .optional()
    .matches(/^\+52-\d{2}-\d{4}-\d{4}$/),
  
  // Medical history flags
  body('medicalHistory.allergies')
    .optional()
    .isBoolean(),
  
  body('medicalHistory.chronicConditions')
    .optional()
    .isBoolean(),
  
  body('medicalHistory.currentMedications')
    .optional()
    .isBoolean(),
  
  body('medicalHistory.previousSurgeries')
    .optional()
    .isBoolean(),
  
  body('medicalHistory.familyHistory')
    .optional()
    .isBoolean(),
  
  // Consent flags
  body('consents.treatmentConsent')
    .isBoolean()
    .withMessage('Consentimiento de tratamiento es requerido'),
  
  body('consents.dataProcessingConsent')
    .isBoolean()
    .withMessage('Consentimiento de procesamiento de datos es requerido'),
  
  body('consents.communicationConsent')
    .optional()
    .isBoolean(),
];

/**
 * POST /api/v1/expedix/registration/patient
 * Complete patient registration with medical history
 */
router.post('/patient',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  validateCompletePatientRegistration,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Errores de validación',
          details: errors.array()
        });
      }

      const {
        firstName,
        paternalLastName,
        maternalLastName,
        dateOfBirth,
        gender,
        curp,
        email,
        phone,
        address,
        emergencyContact,
        medicalHistory,
        consents
      } = req.body;

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Autenticación requerida' });
      }

      // Check if patient already exists by CURP or email
      if (curp || email) {
        const existingPatient = await executeQuery(
          (prisma) => prisma.patient.findFirst({
            where: {
              OR: [
                ...(curp ? [{ curp }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          }),
          'checkExistingPatient'
        );

        if (existingPatient) {
          return res.status(409).json({
            success: false,
            error: 'Paciente ya existe',
            message: curp && existingPatient.curp === curp 
              ? 'Ya existe un paciente con este CURP'
              : 'Ya existe un paciente con este email'
          });
        }
      }

      // Generate unique medical record number
      const medicalRecordNumber = await generateMedicalRecordNumber();

      // Calculate age
      const age = calculateAge(new Date(dateOfBirth));

      // Create patient with complete registration data
      const patient = await executeTransaction([
        // Create patient
        (prisma) => prisma.patient.create({
          data: {
            firstName,
            lastName: paternalLastName,
            maternalLastName,
            dateOfBirth: new Date(dateOfBirth),
            age,
            gender: gender.toLowerCase(),
            curp,
            email,
            phone,
            medicalRecordNumber,
            patientCategory: age < 18 ? 'pediatric' : 'adult',
            address: address ? JSON.stringify(address) : null,
            emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
            consentToTreatment: consents.treatmentConsent,
            consentToDataProcessing: consents.dataProcessingConsent,
            consentToCommunication: consents.communicationConsent || false,
            createdBy: userId
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        // Create medical history record if any flags are true
        (prisma, results) => {
          const patientId = results[0].id;
          
          if (Object.values(medicalHistory || {}).some(flag => flag === true)) {
            return prisma.medicalHistory.create({
              data: {
                patientId,
                hasAllergies: medicalHistory.allergies || false,
                hasChronicConditions: medicalHistory.chronicConditions || false,
                hasCurrentMedications: medicalHistory.currentMedications || false,
                hasPreviousSurgeries: medicalHistory.previousSurgeries || false,
                hasFamilyHistory: medicalHistory.familyHistory || false,
                createdBy: userId
              }
            });
          }
          return null;
        }
      ], 'completePatientRegistration');

      // Log registration for compliance
      logger.info('Complete patient registration', {
        patientId: patient[0].id,
        medicalRecordNumber: patient[0].medicalRecordNumber,
        registeredBy: userId,
        hasConsents: {
          treatment: consents.treatmentConsent,
          dataProcessing: consents.dataProcessingConsent,
          communication: consents.communicationConsent
        },
        hasMedicalHistory: !!patient[1],
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Paciente registrado exitosamente',
        data: {
          patient: patient[0],
          medicalHistory: patient[1]
        }
      });

    } catch (error) {
      logger.error('Failed to register patient', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Error al registrar paciente',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/v1/expedix/registration/patient/:id/medical-history
 * Add detailed medical history forms
 */
router.post('/:id/medical-history',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    param('id').isUUID().withMessage('ID de paciente inválido'),
    body('familyHistory').optional().isArray(),
    body('personalHistory').optional().isArray(),
    body('currentTreatments').optional().isArray(),
    body('allergies').optional().isArray(),
    body('surgeries').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Errores de validación',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const {
        familyHistory,
        personalHistory,
        currentTreatments,
        allergies,
        surgeries
      } = req.body;

      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id },
          select: { id: true, medicalRecordNumber: true }
        }),
        `checkPatient(${id})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Paciente no encontrado'
        });
      }

      // Create detailed medical history
      const detailedHistory = await executeQuery(
        (prisma) => prisma.medicalHistoryDetail.create({
          data: {
            patientId: id,
            familyHistory: familyHistory ? JSON.stringify(familyHistory) : null,
            personalHistory: personalHistory ? JSON.stringify(personalHistory) : null,
            currentTreatments: currentTreatments ? JSON.stringify(currentTreatments) : null,
            allergies: allergies ? JSON.stringify(allergies) : null,
            surgeries: surgeries ? JSON.stringify(surgeries) : null,
            createdBy: userId
          }
        }),
        'createDetailedMedicalHistory'
      );

      // Log medical history addition
      logger.info('Detailed medical history added', {
        patientId: id,
        medicalRecordNumber: patient.medicalRecordNumber,
        addedBy: userId,
        sections: {
          familyHistory: !!familyHistory,
          personalHistory: !!personalHistory,
          currentTreatments: !!currentTreatments,
          allergies: !!allergies,
          surgeries: !!surgeries
        }
      });

      res.status(201).json({
        success: true,
        message: 'Historia médica detallada agregada exitosamente',
        data: detailedHistory
      });

    } catch (error) {
      logger.error('Failed to add detailed medical history', {
        error: error.message,
        patientId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Error al agregar historia médica',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/v1/expedix/registration/patient/:id/forms
 * Get available registration forms for patient
 */
router.get('/:id/forms',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_data']),
  [
    param('id').isUUID().withMessage('ID de paciente inválido')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get patient with current form completion status
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id },
          include: {
            medicalHistory: true,
            medicalHistoryDetail: true,
            _count: {
              select: {
                scaleAdministrations: true,
                consultations: true
              }
            }
          }
        }),
        `getPatientFormsStatus(${id})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Paciente no encontrado'
        });
      }

      // Calculate form completion status
      const formsStatus = {
        basicRegistration: {
          completed: true,
          percentage: 100,
          requiredFields: ['firstName', 'lastName', 'dateOfBirth', 'gender']
        },
        medicalHistory: {
          completed: !!patient.medicalHistory,
          percentage: patient.medicalHistory ? 100 : 0,
          requiredFields: ['allergies', 'chronicConditions', 'currentMedications']
        },
        detailedMedicalHistory: {
          completed: !!patient.medicalHistoryDetail,
          percentage: patient.medicalHistoryDetail ? 100 : 0,
          requiredFields: ['familyHistory', 'personalHistory']
        },
        consentForms: {
          completed: patient.consentToTreatment && patient.consentToDataProcessing,
          percentage: (patient.consentToTreatment ? 50 : 0) + (patient.consentToDataProcessing ? 50 : 0),
          requiredFields: ['treatmentConsent', 'dataProcessingConsent']
        }
      };

      // Calculate overall completion
      const totalPercentage = Object.values(formsStatus)
        .reduce((sum, form) => sum + form.percentage, 0) / Object.keys(formsStatus).length;

      res.json({
        success: true,
        data: {
          patient: {
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            medicalRecordNumber: patient.medicalRecordNumber
          },
          formsStatus,
          overallCompletion: Math.round(totalPercentage)
        }
      });

    } catch (error) {
      logger.error('Failed to get patient forms status', {
        error: error.message,
        patientId: req.params.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Error al obtener estado de formularios',
        details: error.message
      });
    }
  }
);

/**
 * Helper functions
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear();
  const prefix = 'EXP';
  
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