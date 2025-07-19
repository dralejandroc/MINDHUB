/**
 * Advanced Prescription System for Expedix Hub
 * 
 * Comprehensive prescription management with customizable printing,
 * medication history tracking, and mental health treatment continuity
 * based on EXPEDIENTE ELEONOR analysis
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Default print configuration based on EXPEDIENTE ELEONOR analysis
 */
const DEFAULT_PRINT_CONFIG = {
  marginLeft: 2,
  marginTop: 4.2,
  marginRight: 2,
  marginBottom: 2,
  fontSize: {
    header: 12,
    patientInfo: 10,
    medication: 10,
    instructions: 9,
    footer: 8
  },
  logoPosition: 'top-left',
  logoSize: 2.5,
  showPatientAge: true,
  showPatientBirthdate: true,
  showMedicName: true,
  showActualDate: true,
  boldMedicine: true,
  boldPrescription: false,
  boldPatientName: true,
  showNumbers: true,
  treatmentsAtPage: 6,
  customizable: true
};

/**
 * Medication interaction severity levels
 */
const INTERACTION_LEVELS = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
  CONTRAINDICATED: 'contraindicated'
};

/**
 * GET /api/v1/expedix/prescriptions/patient/:patientId
 * Get prescription history for a patient
 */
router.get('/patient/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:prescriptions']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired']),
    query('includeHistory').optional().isBoolean(),
    query('medicationClass').optional().isString()
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
      const { status, includeHistory = true, medicationClass } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only view their own prescriptions'
        });
      }

      // Build where clause
      const whereClause = { patientId };
      if (status) {
        whereClause.status = status;
      }
      if (medicationClass) {
        whereClause.medication = {
          therapeuticClass: {
            contains: medicationClass,
            mode: 'insensitive'
          }
        };
      }

      const prescriptions = await executeQuery(
        (prisma) => prisma.prescription.findMany({
          where: whereClause,
          include: {
            medication: {
              select: {
                id: true,
                genericName: true,
                brandNames: true,
                therapeuticClass: true,
                dosageForm: true,
                strength: true,
                contraindications: true,
                sideEffects: true
              }
            },
            prescriber: {
              select: {
                id: true,
                name: true,
                license: true,
                specialization: true
              }
            },
            patient: {
              select: {
                firstName: true,
                lastName: true,
                age: true,
                medicalRecordNumber: true
              }
            },
            ...(includeHistory && {
              prescriptionHistory: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                  modifiedBy: {
                    select: { name: true }
                  }
                }
              }
            })
          },
          orderBy: [
            { prescribedAt: 'desc' }
          ]
        }),
        `getPatientPrescriptions(${patientId})`
      );

      // Calculate prescription statistics
      const stats = {
        total: prescriptions.length,
        active: prescriptions.filter(p => p.status === 'active').length,
        completed: prescriptions.filter(p => p.status === 'completed').length,
        longTerm: prescriptions.filter(p => p.isLongTermTreatment).length,
        mentalHealth: prescriptions.filter(p => 
          p.medication.therapeuticClass?.toLowerCase().includes('psych') ||
          p.medication.therapeuticClass?.toLowerCase().includes('mental')
        ).length
      };

      // Log prescription access
      logger.info('Patient prescriptions accessed', {
        patientId: patientId,
        accessedBy: userId,
        prescriptionCount: prescriptions.length,
        filters: { status, medicationClass }
      });

      res.json({
        success: true,
        data: {
          prescriptions: prescriptions,
          statistics: stats
        }
      });

    } catch (error) {
      logger.error('Failed to get patient prescriptions', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve prescriptions',
        message: 'An error occurred while retrieving patient prescriptions'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/prescriptions/create
 * Create a new prescription with medication history tracking
 */
router.post('/create',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist'], ['write:prescriptions']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('medicationId').isUUID().withMessage('Invalid medication ID format'),
    body('dosage').isString().notEmpty().withMessage('Dosage is required'),
    body('frequency').isString().notEmpty().withMessage('Frequency is required'),
    body('duration').isString().notEmpty().withMessage('Duration is required'),
    body('instructions').optional().isString().isLength({ max: 1000 }),
    body('isLongTermTreatment').optional().isBoolean(),
    body('basedOnPreviousPrescription').optional().isUUID(),
    body('clinicalIndication').isString().notEmpty().withMessage('Clinical indication is required'),
    body('printConfiguration').optional().isObject()
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
        medicationId,
        dosage,
        frequency,
        duration,
        instructions,
        isLongTermTreatment = false,
        basedOnPreviousPrescription,
        clinicalIndication,
        printConfiguration
      } = req.body;

      const userId = req.user?.id;

      // Verify patient and medication exist
      const [patient, medication] = await executeTransaction([
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            medicalRecordNumber: true,
            currentMedications: true
          }
        }),
        (prisma) => prisma.medication.findUnique({
          where: { id: medicationId },
          select: {
            id: true,
            genericName: true,
            brandNames: true,
            therapeuticClass: true,
            contraindications: true,
            interactions: true,
            dosageForm: true,
            strength: true
          }
        })
      ], 'verifyPatientAndMedication');

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      if (!medication) {
        return res.status(404).json({
          success: false,
          error: 'Medication not found'
        });
      }

      // Check for drug interactions if patient has current medications
      let interactionWarnings = [];
      if (patient.currentMedications) {
        interactionWarnings = await checkDrugInteractions(medicationId, patient.currentMedications);
      }

      // Get previous prescription for continuity if specified
      let previousPrescription = null;
      if (basedOnPreviousPrescription) {
        previousPrescription = await executeQuery(
          (prisma) => prisma.prescription.findUnique({
            where: { id: basedOnPreviousPrescription },
            include: {
              medication: {
                select: { genericName: true, therapeuticClass: true }
              }
            }
          }),
          'getPreviousPrescription'
        );
      }

      // Generate prescription number
      const prescriptionNumber = await generatePrescriptionNumber();

      // Create prescription with history tracking
      const prescription = await executeTransaction([
        // Create main prescription
        (prisma) => prisma.prescription.create({
          data: {
            id: uuidv4(),
            prescriptionNumber: prescriptionNumber,
            patientId: patientId,
            medicationId: medicationId,
            prescribedBy: userId,
            dosage: dosage,
            frequency: frequency,
            duration: duration,
            instructions: instructions,
            clinicalIndication: clinicalIndication,
            isLongTermTreatment: isLongTermTreatment,
            basedOnPrescription: basedOnPreviousPrescription,
            status: 'active',
            prescribedAt: new Date(),
            printConfiguration: printConfiguration || DEFAULT_PRINT_CONFIG,
            interactionWarnings: interactionWarnings.length > 0 ? JSON.stringify(interactionWarnings) : null
          },
          include: {
            medication: true,
            prescriber: {
              select: { name: true, license: true, specialization: true }
            },
            patient: {
              select: { firstName: true, lastName: true, age: true, medicalRecordNumber: true }
            }
          }
        }),
        // Create prescription history entry
        (prisma, results) => {
          const prescriptionId = results[0].id;
          return prisma.prescriptionHistory.create({
            data: {
              id: uuidv4(),
              prescriptionId: prescriptionId,
              action: 'CREATED',
              changes: {
                dosage: dosage,
                frequency: frequency,
                duration: duration,
                clinicalIndication: clinicalIndication,
                basedOnPrevious: basedOnPreviousPrescription || null
              },
              reason: previousPrescription ? 
                `Continuación de tratamiento previo: ${previousPrescription.medication.genericName}` :
                'Nueva prescripción',
              modifiedBy: userId,
              createdAt: new Date()
            }
          });
        }
      ], 'createPrescription');

      // Update patient's current medications list
      await updatePatientCurrentMedications(patientId, medicationId, 'add');

      // Log prescription creation
      logger.info('Prescription created', {
        prescriptionId: prescription[0].id,
        prescriptionNumber: prescriptionNumber,
        patientId: patientId,
        medicationName: medication.genericName,
        prescribedBy: userId,
        isLongTerm: isLongTermTreatment,
        hasInteractions: interactionWarnings.length > 0,
        medicalRecordNumber: patient.medicalRecordNumber
      });

      // Audit log for compliance
      await auditLogger.logDataModification(
        userId,
        'PRESCRIPTION_CREATE',
        {
          prescriptionId: prescription[0].id,
          patientId: patientId,
          medicationId: medicationId,
          medicationName: medication.genericName,
          clinicalIndication: clinicalIndication,
          isLongTermTreatment: isLongTermTreatment
        }
      );

      res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: {
          prescription: prescription[0],
          history: prescription[1],
          interactionWarnings: interactionWarnings
        }
      });

    } catch (error) {
      logger.error('Failed to create prescription', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create prescription',
        message: 'An error occurred while creating the prescription'
      });
    }
  }
);

/**
 * PUT /api/v1/expedix/prescriptions/:id/modify
 * Modify existing prescription with history tracking
 */
router.put('/:id/modify',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist'], ['write:prescriptions']),
  [
    param('id').isUUID().withMessage('Invalid prescription ID format'),
    body('changes').isObject().withMessage('Changes must be an object'),
    body('reason').isString().notEmpty().withMessage('Modification reason is required')
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
      const { changes, reason } = req.body;
      const userId = req.user?.id;

      // Get existing prescription
      const existingPrescription = await executeQuery(
        (prisma) => prisma.prescription.findUnique({
          where: { id },
          include: {
            medication: {
              select: { genericName: true }
            },
            patient: {
              select: { medicalRecordNumber: true }
            }
          }
        }),
        `getExistingPrescription(${id})`
      );

      if (!existingPrescription) {
        return res.status(404).json({
          success: false,
          error: 'Prescription not found'
        });
      }

      // Update prescription and create history entry
      const [updatedPrescription, historyEntry] = await executeTransaction([
        (prisma) => prisma.prescription.update({
          where: { id },
          data: {
            ...changes,
            updatedAt: new Date()
          },
          include: {
            medication: true,
            prescriber: {
              select: { name: true, license: true }
            },
            patient: {
              select: { firstName: true, lastName: true, medicalRecordNumber: true }
            }
          }
        }),
        (prisma) => prisma.prescriptionHistory.create({
          data: {
            id: uuidv4(),
            prescriptionId: id,
            action: 'MODIFIED',
            changes: changes,
            reason: reason,
            modifiedBy: userId,
            createdAt: new Date()
          }
        })
      ], 'modifyPrescription');

      // Log prescription modification
      logger.info('Prescription modified', {
        prescriptionId: id,
        modifiedBy: userId,
        medicationName: existingPrescription.medication.genericName,
        changes: Object.keys(changes),
        reason: reason,
        medicalRecordNumber: existingPrescription.patient.medicalRecordNumber
      });

      res.json({
        success: true,
        message: 'Prescription modified successfully',
        data: {
          prescription: updatedPrescription,
          historyEntry: historyEntry
        }
      });

    } catch (error) {
      logger.error('Failed to modify prescription', {
        error: error.message,
        prescriptionId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to modify prescription',
        message: 'An error occurred while modifying the prescription'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/prescriptions/:id/generate-pdf
 * Generate customizable PDF prescription
 */
router.post('/:id/generate-pdf',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:prescriptions']),
  [
    param('id').isUUID().withMessage('Invalid prescription ID format'),
    body('customPrintConfig').optional().isObject()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { customPrintConfig } = req.body;

      // Get prescription with all related data
      const prescription = await executeQuery(
        (prisma) => prisma.prescription.findUnique({
          where: { id },
          include: {
            medication: true,
            prescriber: {
              include: {
                clinicInfo: true
              }
            },
            patient: true
          }
        }),
        `getPrescriptionForPDF(${id})`
      );

      if (!prescription) {
        return res.status(404).json({
          success: false,
          error: 'Prescription not found'
        });
      }

      // Merge print configuration
      const printConfig = {
        ...DEFAULT_PRINT_CONFIG,
        ...prescription.printConfiguration,
        ...customPrintConfig
      };

      // Generate QR code for prescription verification
      const qrCodeData = `${process.env.APP_URL}/verify-prescription/${prescription.prescriptionNumber}`;
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);

      // Generate PDF
      const pdfBuffer = await generatePrescriptionPDF(prescription, printConfig, qrCodeImage);

      // Log PDF generation
      logger.info('Prescription PDF generated', {
        prescriptionId: id,
        prescriptionNumber: prescription.prescriptionNumber,
        generatedBy: req.user?.id,
        customConfig: !!customPrintConfig
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescripcion_${prescription.prescriptionNumber}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      logger.error('Failed to generate prescription PDF', {
        error: error.message,
        prescriptionId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
        message: 'An error occurred while generating the prescription PDF'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/prescriptions/:id/history
 * Get prescription modification history
 */
router.get('/:id/history',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:prescriptions']),
  [
    param('id').isUUID().withMessage('Invalid prescription ID format')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const history = await executeQuery(
        (prisma) => prisma.prescriptionHistory.findMany({
          where: { prescriptionId: id },
          include: {
            modifiedBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        `getPrescriptionHistory(${id})`
      );

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('Failed to get prescription history', {
        error: error.message,
        prescriptionId: req.params.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve prescription history',
        message: 'An error occurred while retrieving prescription history'
      });
    }
  }
);

/**
 * Helper functions
 */

async function generatePrescriptionNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `RX-${year}${month}`;
  
  const prisma = getPrismaClient();
  const count = await prisma.prescription.count({
    where: {
      prescriptionNumber: {
        startsWith: prefix
      }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
}

async function checkDrugInteractions(newMedicationId, currentMedicationIds) {
  const interactions = [];
  
  // This would typically query a drug interaction database
  // For now, we'll implement a basic check
  const prisma = getPrismaClient();
  
  const newMedication = await prisma.medication.findUnique({
    where: { id: newMedicationId },
    select: { interactions: true, contraindications: true }
  });

  if (newMedication.interactions) {
    // Check against current medications
    for (const currentMedId of currentMedicationIds) {
      const currentMed = await prisma.medication.findUnique({
        where: { id: currentMedId },
        select: { genericName: true, therapeuticClass: true }
      });

      // Simple interaction check based on therapeutic class
      if (newMedication.interactions.some(interaction => 
        interaction.toLowerCase().includes(currentMed.therapeuticClass.toLowerCase())
      )) {
        interactions.push({
          level: INTERACTION_LEVELS.MODERATE,
          medication: currentMed.genericName,
          description: `Possible interaction between medications of the same therapeutic class`
        });
      }
    }
  }

  return interactions;
}

async function updatePatientCurrentMedications(patientId, medicationId, action) {
  const prisma = getPrismaClient();
  
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { currentMedications: true }
  });

  let currentMeds = patient.currentMedications || [];
  
  if (action === 'add' && !currentMeds.includes(medicationId)) {
    currentMeds.push(medicationId);
  } else if (action === 'remove') {
    currentMeds = currentMeds.filter(id => id !== medicationId);
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: { currentMedications: currentMeds }
  });
}

function generatePrescriptionPDF(prescription, printConfig, qrCodeImage) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: {
          top: printConfig.marginTop * 28.35, // Convert cm to points
          bottom: printConfig.marginBottom * 28.35,
          left: printConfig.marginLeft * 28.35,
          right: printConfig.marginRight * 28.35
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header with clinic info
      if (printConfig.showMedicName && prescription.prescriber.clinicInfo) {
        doc.fontSize(printConfig.fontSize.header)
           .font('Helvetica-Bold')
           .text(prescription.prescriber.clinicInfo.name, { align: 'center' });
        
        doc.fontSize(printConfig.fontSize.patientInfo)
           .font('Helvetica')
           .text(prescription.prescriber.clinicInfo.address, { align: 'center' })
           .text(`Tel: ${prescription.prescriber.clinicInfo.phone}`, { align: 'center' });
      }

      doc.moveDown(2);

      // Patient information
      const patientName = `${prescription.patient.firstName} ${prescription.patient.lastName}`;
      doc.fontSize(printConfig.fontSize.patientInfo)
         .font(printConfig.boldPatientName ? 'Helvetica-Bold' : 'Helvetica')
         .text(`Paciente: ${patientName}`);

      if (printConfig.showPatientAge) {
        doc.text(`Edad: ${prescription.patient.age} años`);
      }

      if (printConfig.showPatientBirthdate) {
        doc.text(`Fecha de nacimiento: ${new Date(prescription.patient.dateOfBirth).toLocaleDateString('es-MX')}`);
      }

      doc.text(`Expediente: ${prescription.patient.medicalRecordNumber}`);

      if (printConfig.showActualDate) {
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`);
      }

      doc.moveDown(2);

      // Prescription details
      doc.fontSize(printConfig.fontSize.medication)
         .font(printConfig.boldMedicine ? 'Helvetica-Bold' : 'Helvetica')
         .text('PRESCRIPCIÓN:', { underline: true });

      doc.moveDown(1);

      doc.font('Helvetica')
         .text(`Medicamento: ${prescription.medication.genericName}`)
         .text(`Forma farmacéutica: ${prescription.medication.dosageForm}`)
         .text(`Concentración: ${prescription.medication.strength}`)
         .text(`Dosis: ${prescription.dosage}`)
         .text(`Frecuencia: ${prescription.frequency}`)
         .text(`Duración: ${prescription.duration}`);

      if (prescription.instructions) {
        doc.moveDown(1)
           .fontSize(printConfig.fontSize.instructions)
           .text(`Instrucciones: ${prescription.instructions}`);
      }

      // Clinical indication
      doc.moveDown(1)
         .text(`Indicación clínica: ${prescription.clinicalIndication}`);

      // Long-term treatment indicator
      if (prescription.isLongTermTreatment) {
        doc.moveDown(1)
           .font('Helvetica-Bold')
           .text('TRATAMIENTO DE LARGO PLAZO', { align: 'center' });
      }

      // Prescriber signature area
      doc.moveDown(3);
      doc.fontSize(printConfig.fontSize.footer)
         .font('Helvetica')
         .text('_'.repeat(50))
         .text(`Dr. ${prescription.prescriber.name}`)
         .text(`Cédula: ${prescription.prescriber.license}`)
         .text(`Especialidad: ${prescription.prescriber.specialization}`);

      // QR Code for verification
      if (qrCodeImage) {
        const qrSize = 50;
        doc.image(qrCodeImage, doc.page.width - 80, doc.page.height - 80, {
          width: qrSize,
          height: qrSize
        });
      }

      // Prescription number footer
      doc.fontSize(8)
         .text(`Prescripción No: ${prescription.prescriptionNumber}`, 
               50, 
               doc.page.height - 30);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router;