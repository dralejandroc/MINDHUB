/**
 * Patient Registration Integration for Expedix Hub
 * 
 * Receives and processes patient registration data from FormX hub
 * and creates comprehensive patient records based on EXPEDIENTE ELEONOR analysis
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * CURP Validation Helper
 */
function validateCURP(curp) {
  if (!curp || curp.length !== 18) return false;
  const pattern = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}[0-1]{1}[0-9]{1}[0-3]{1}[0-9]{1}[HM]{1}[A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]{1}[0-9]{1}$/;
  return pattern.test(curp);
}

/**
 * Age calculation helper
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

/**
 * Medical record number generator
 */
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

/**
 * POST /api/v1/expedix/patients/complete-registration
 * Process complete patient registration from FormX
 */
router.post('/complete-registration',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('registrationData').isObject().withMessage('Registration data must be an object'),
    body('source').equals('formx_registration').withMessage('Invalid source'),
    body('submittedBy').isUUID().withMessage('Invalid submitter ID')
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

      const { patientId, registrationData, submittedBy } = req.body;
      const { basicInfo, medicalHistory, familyHistory, emergencyContact, consents } = registrationData;

      // Validate required basic information
      if (!basicInfo.firstName || !basicInfo.paternalLastName || !basicInfo.dateOfBirth || !basicInfo.gender) {
        return res.status(400).json({
          success: false,
          error: 'Missing required basic information',
          message: 'First name, paternal last name, date of birth, and gender are required'
        });
      }

      // Validate CURP if provided
      if (basicInfo.curp && !validateCURP(basicInfo.curp)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CURP format',
          message: 'The provided CURP is not valid'
        });
      }

      // Check if patient already exists
      const existingPatient = await executeQuery(
        (prisma) => prisma.patient.findFirst({
          where: {
            OR: [
              { id: patientId },
              ...(basicInfo.curp ? [{ curp: basicInfo.curp }] : []),
              ...(basicInfo.email ? [{ email: basicInfo.email }] : [])
            ]
          }
        }),
        'checkExistingPatient'
      );

      let patient;
      const age = calculateAge(new Date(basicInfo.dateOfBirth));

      if (existingPatient && existingPatient.id === patientId) {
        // Update existing patient
        patient = await executeQuery(
          (prisma) => prisma.patient.update({
            where: { id: patientId },
            data: {
              firstName: basicInfo.firstName,
              lastName: basicInfo.paternalLastName,
              maternalLastName: basicInfo.maternalLastName || null,
              dateOfBirth: new Date(basicInfo.dateOfBirth),
              age: age,
              gender: basicInfo.gender.toLowerCase(),
              curp: basicInfo.curp || null,
              email: basicInfo.email || null,
              phone: basicInfo.phone || null,
              patientCategory: age < 18 ? 'pediatric' : 'adult',
              emergencyContact: emergencyContact ? JSON.stringify({
                name: emergencyContact.emergencyContactName,
                relationship: emergencyContact.emergencyContactRelationship,
                phone: emergencyContact.emergencyContactPhone,
                email: emergencyContact.emergencyContactEmail
              }) : null,
              consentToTreatment: consents.treatmentConsent || false,
              consentToDataProcessing: consents.dataProcessingConsent || false,
              consentToCommunication: consents.communicationConsent || false,
              consentToEmergencyTreatment: consents.emergencyTreatmentConsent || false,
              isRegistrationComplete: true,
              registrationCompletedAt: new Date(),
              updatedAt: new Date()
            },
            include: {
              creator: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          'updatePatientRegistration'
        );
      } else if (existingPatient) {
        return res.status(409).json({
          success: false,
          error: 'Patient already exists',
          message: 'A patient with this CURP or email already exists'
        });
      } else {
        // Create new patient
        const medicalRecordNumber = await generateMedicalRecordNumber();

        patient = await executeQuery(
          (prisma) => prisma.patient.create({
            data: {
              id: patientId,
              firstName: basicInfo.firstName,
              lastName: basicInfo.paternalLastName,
              maternalLastName: basicInfo.maternalLastName || null,
              dateOfBirth: new Date(basicInfo.dateOfBirth),
              age: age,
              gender: basicInfo.gender.toLowerCase(),
              curp: basicInfo.curp || null,
              email: basicInfo.email || null,
              phone: basicInfo.phone || null,
              medicalRecordNumber: medicalRecordNumber,
              patientCategory: age < 18 ? 'pediatric' : 'adult',
              emergencyContact: emergencyContact ? JSON.stringify({
                name: emergencyContact.emergencyContactName,
                relationship: emergencyContact.emergencyContactRelationship,
                phone: emergencyContact.emergencyContactPhone,
                email: emergencyContact.emergencyContactEmail
              }) : null,
              consentToTreatment: consents.treatmentConsent || false,
              consentToDataProcessing: consents.dataProcessingConsent || false,
              consentToCommunication: consents.communicationConsent || false,
              consentToEmergencyTreatment: consents.emergencyTreatmentConsent || false,
              isRegistrationComplete: true,
              registrationCompletedAt: new Date(),
              createdBy: submittedBy
            },
            include: {
              creator: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          'createPatientFromRegistration'
        );
      }

      // Process medical history if provided
      let medicalHistoryRecord = null;
      if (medicalHistory && Object.keys(medicalHistory).length > 0) {
        medicalHistoryRecord = await executeQuery(
          (prisma) => prisma.medicalHistory.upsert({
            where: { patientId: patient.id },
            update: {
              hasAllergies: medicalHistory.allergies || false,
              allergiesDetails: medicalHistory.allergiesDetails || null,
              hasChronicConditions: Array.isArray(medicalHistory.chronicConditions) && medicalHistory.chronicConditions.length > 0,
              chronicConditionsDetails: Array.isArray(medicalHistory.chronicConditions) ? 
                JSON.stringify(medicalHistory.chronicConditions) : null,
              hasCurrentMedications: medicalHistory.currentMedications || false,
              currentMedicationsDetails: medicalHistory.medicationsDetails || null,
              hasPreviousSurgeries: medicalHistory.previousSurgeries || false,
              surgeriesDetails: medicalHistory.surgeriesDetails || null,
              hasHospitalizations: medicalHistory.hospitalizations || false,
              hospitalizationsDetails: medicalHistory.hospitalizationsDetails || null,
              updatedBy: submittedBy,
              updatedAt: new Date()
            },
            create: {
              patientId: patient.id,
              hasAllergies: medicalHistory.allergies || false,
              allergiesDetails: medicalHistory.allergiesDetails || null,
              hasChronicConditions: Array.isArray(medicalHistory.chronicConditions) && medicalHistory.chronicConditions.length > 0,
              chronicConditionsDetails: Array.isArray(medicalHistory.chronicConditions) ? 
                JSON.stringify(medicalHistory.chronicConditions) : null,
              hasCurrentMedications: medicalHistory.currentMedications || false,
              currentMedicationsDetails: medicalHistory.medicationsDetails || null,
              hasPreviousSurgeries: medicalHistory.previousSurgeries || false,
              surgeriesDetails: medicalHistory.surgeriesDetails || null,
              hasHospitalizations: medicalHistory.hospitalizations || false,
              hospitalizationsDetails: medicalHistory.hospitalizationsDetails || null,
              createdBy: submittedBy
            }
          }),
          'upsertMedicalHistory'
        );
      }

      // Process family history if provided
      let familyHistoryRecord = null;
      if (familyHistory && Object.keys(familyHistory).length > 0) {
        familyHistoryRecord = await executeQuery(
          (prisma) => prisma.familyHistory.upsert({
            where: { patientId: patient.id },
            update: {
              diabetes: familyHistory.diabetes || false,
              hypertension: familyHistory.hypertension || false,
              cancer: familyHistory.cancer || false,
              cancerDetails: familyHistory.cancerDetails || null,
              mentalHealth: familyHistory.mentalHealth || false,
              mentalHealthDetails: familyHistory.mentalHealthDetails || null,
              heartDisease: familyHistory.heartDisease || false,
              strokeDementia: familyHistory.strokeDementia || false,
              updatedBy: submittedBy,
              updatedAt: new Date()
            },
            create: {
              patientId: patient.id,
              diabetes: familyHistory.diabetes || false,
              hypertension: familyHistory.hypertension || false,
              cancer: familyHistory.cancer || false,
              cancerDetails: familyHistory.cancerDetails || null,
              mentalHealth: familyHistory.mentalHealth || false,
              mentalHealthDetails: familyHistory.mentalHealthDetails || null,
              heartDisease: familyHistory.heartDisease || false,
              strokeDementia: familyHistory.strokeDementia || false,
              createdBy: submittedBy
            }
          }),
          'upsertFamilyHistory'
        );
      }

      // Log comprehensive registration
      logger.info('Complete patient registration processed', {
        patientId: patient.id,
        medicalRecordNumber: patient.medicalRecordNumber,
        source: 'formx_registration',
        hasBasicInfo: !!basicInfo,
        hasMedicalHistory: !!medicalHistoryRecord,
        hasFamilyHistory: !!familyHistoryRecord,
        hasEmergencyContact: !!emergencyContact,
        hasConsents: !!consents,
        consents: {
          treatment: patient.consentToTreatment,
          dataProcessing: patient.consentToDataProcessing,
          communication: patient.consentToCommunication,
          emergency: patient.consentToEmergencyTreatment
        },
        processedBy: submittedBy,
        ipAddress: req.ip
      });

      // Audit log for compliance
      await auditLogger.logDataModification(
        submittedBy,
        'COMPLETE_PATIENT_REGISTRATION',
        {
          patientId: patient.id,
          medicalRecordNumber: patient.medicalRecordNumber,
          source: 'formx_integration',
          dataTypes: ['basic_info', 'medical_history', 'family_history', 'emergency_contact', 'consents'],
          consentStatus: {
            treatment: patient.consentToTreatment,
            dataProcessing: patient.consentToDataProcessing,
            communication: patient.consentToCommunication,
            emergency: patient.consentToEmergencyTreatment
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Patient registration completed successfully',
        data: {
          patient: patient,
          medicalHistory: medicalHistoryRecord,
          familyHistory: familyHistoryRecord,
          registrationComplete: true,
          expedixIntegration: true
        }
      });

    } catch (error) {
      logger.error('Failed to process complete patient registration', {
        error: error.message,
        stack: error.stack,
        patientId: req.body.patientId,
        submittedBy: req.body.submittedBy
      });

      res.status(500).json({
        success: false,
        error: 'Failed to process registration',
        message: 'An error occurred while processing patient registration'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/patients/:id/registration-status
 * Get comprehensive registration status for a patient
 */
router.get('/:id/registration-status',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id },
          include: {
            medicalHistory: true,
            familyHistory: true,
            _count: {
              select: {
                consultations: true,
                prescriptions: { where: { status: 'active' } },
                scaleAdministrations: true
              }
            }
          }
        }),
        `getPatientRegistrationStatus(${id})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Calculate registration completeness
      const registrationStatus = {
        isComplete: patient.isRegistrationComplete || false,
        completedAt: patient.registrationCompletedAt,
        basicInfo: {
          completed: !!(patient.firstName && patient.lastName && patient.dateOfBirth && patient.gender),
          fields: {
            firstName: !!patient.firstName,
            lastName: !!patient.lastName,
            dateOfBirth: !!patient.dateOfBirth,
            gender: !!patient.gender,
            curp: !!patient.curp,
            email: !!patient.email,
            phone: !!patient.phone
          }
        },
        medicalHistory: {
          completed: !!patient.medicalHistory,
          hasAllergies: patient.medicalHistory?.hasAllergies || false,
          hasChronicConditions: patient.medicalHistory?.hasChronicConditions || false,
          hasCurrentMedications: patient.medicalHistory?.hasCurrentMedications || false,
          hasPreviousSurgeries: patient.medicalHistory?.hasPreviousSurgeries || false
        },
        familyHistory: {
          completed: !!patient.familyHistory,
          diabetes: patient.familyHistory?.diabetes || false,
          hypertension: patient.familyHistory?.hypertension || false,
          cancer: patient.familyHistory?.cancer || false,
          mentalHealth: patient.familyHistory?.mentalHealth || false
        },
        emergencyContact: {
          completed: !!patient.emergencyContact,
          hasContact: !!patient.emergencyContact
        },
        consents: {
          completed: patient.consentToTreatment && patient.consentToDataProcessing,
          treatment: patient.consentToTreatment,
          dataProcessing: patient.consentToDataProcessing,
          communication: patient.consentToCommunication,
          emergency: patient.consentToEmergencyTreatment
        },
        clinicalData: {
          consultations: patient._count.consultations,
          activePrescriptions: patient._count.prescriptions,
          completedAssessments: patient._count.scaleAdministrations
        }
      };

      // Calculate overall completion percentage
      const sections = ['basicInfo', 'medicalHistory', 'familyHistory', 'emergencyContact', 'consents'];
      const completedSections = sections.filter(section => registrationStatus[section].completed).length;
      const overallCompletion = Math.round((completedSections / sections.length) * 100);

      res.json({
        success: true,
        data: {
          patient: {
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            medicalRecordNumber: patient.medicalRecordNumber,
            age: patient.age
          },
          registrationStatus: registrationStatus,
          overallCompletion: overallCompletion,
          isReadyForTreatment: overallCompletion >= 80 && registrationStatus.consents.completed
        }
      });

    } catch (error) {
      logger.error('Failed to get patient registration status', {
        error: error.message,
        patientId: req.params.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve registration status',
        message: 'An error occurred while retrieving patient registration status'
      });
    }
  }
);

/**
 * PUT /api/v1/expedix/patients/:id/update-registration
 * Update specific sections of patient registration
 */
router.put('/:id/update-registration',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    body('section').isIn(['basicInfo', 'medicalHistory', 'familyHistory', 'emergencyContact', 'consents']),
    body('data').isObject().withMessage('Data must be an object')
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
      const { section, data } = req.body;
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
          error: 'Patient not found'
        });
      }

      let updateResult = null;

      switch (section) {
        case 'basicInfo':
          updateResult = await executeQuery(
            (prisma) => prisma.patient.update({
              where: { id },
              data: {
                ...data,
                updatedAt: new Date()
              }
            }),
            'updatePatientBasicInfo'
          );
          break;

        case 'medicalHistory':
          updateResult = await executeQuery(
            (prisma) => prisma.medicalHistory.upsert({
              where: { patientId: id },
              update: {
                ...data,
                updatedBy: userId,
                updatedAt: new Date()
              },
              create: {
                patientId: id,
                ...data,
                createdBy: userId
              }
            }),
            'updatePatientMedicalHistory'
          );
          break;

        case 'familyHistory':
          updateResult = await executeQuery(
            (prisma) => prisma.familyHistory.upsert({
              where: { patientId: id },
              update: {
                ...data,
                updatedBy: userId,
                updatedAt: new Date()
              },
              create: {
                patientId: id,
                ...data,
                createdBy: userId
              }
            }),
            'updatePatientFamilyHistory'
          );
          break;

        case 'emergencyContact':
          updateResult = await executeQuery(
            (prisma) => prisma.patient.update({
              where: { id },
              data: {
                emergencyContact: JSON.stringify(data),
                updatedAt: new Date()
              }
            }),
            'updatePatientEmergencyContact'
          );
          break;

        case 'consents':
          updateResult = await executeQuery(
            (prisma) => prisma.patient.update({
              where: { id },
              data: {
                ...data,
                updatedAt: new Date()
              }
            }),
            'updatePatientConsents'
          );
          break;
      }

      // Log update
      logger.info('Patient registration section updated', {
        patientId: id,
        medicalRecordNumber: patient.medicalRecordNumber,
        section: section,
        updatedBy: userId,
        dataKeys: Object.keys(data)
      });

      res.json({
        success: true,
        message: `Patient ${section} updated successfully`,
        data: updateResult
      });

    } catch (error) {
      logger.error('Failed to update patient registration section', {
        error: error.message,
        patientId: req.params.id,
        section: req.body.section,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update registration',
        message: 'An error occurred while updating patient registration'
      });
    }
  }
);

module.exports = router;