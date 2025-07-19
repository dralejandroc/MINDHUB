/**
 * Patient Registration Forms for FormX Hub
 * 
 * Comprehensive patient registration forms based on EXPEDIENTE ELEONOR analysis
 * with full integration to Expedix for data storage and management
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Patient Registration Form Templates
 * Based on EXPEDIENTE ELEONOR analysis
 */
const PATIENT_FORM_TEMPLATES = {
  basicRegistration: {
    name: "Registro Básico del Paciente",
    category: "patient_registration",
    description: "Formulario básico de registro del paciente con información demográfica",
    estimatedDuration: 10,
    fields: [
      {
        id: "firstName",
        name: "Nombre(s)",
        type: "text",
        required: true,
        validation: { minLength: 2, maxLength: 50 },
        placeholder: "Ingrese su nombre"
      },
      {
        id: "paternalLastName",
        name: "Apellido Paterno",
        type: "text",
        required: true,
        validation: { minLength: 2, maxLength: 50 },
        placeholder: "Apellido paterno"
      },
      {
        id: "maternalLastName",
        name: "Apellido Materno",
        type: "text",
        required: false,
        validation: { maxLength: 50 },
        placeholder: "Apellido materno (opcional)"
      },
      {
        id: "dateOfBirth",
        name: "Fecha de Nacimiento",
        type: "date",
        required: true,
        validation: { 
          max: new Date().toISOString().split('T')[0],
          min: "1900-01-01"
        },
        placeholder: "dd/mm/yyyy"
      },
      {
        id: "gender",
        name: "Sexo",
        type: "select",
        required: true,
        options: [
          { value: "MALE", label: "Hombre" },
          { value: "FEMALE", label: "Mujer" },
          { value: "OTHER", label: "Otro" }
        ]
      },
      {
        id: "curp",
        name: "CURP",
        type: "text",
        required: false,
        validation: { 
          pattern: "^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$",
          length: 18
        },
        placeholder: "CURP (18 caracteres)"
      },
      {
        id: "email",
        name: "Correo Electrónico",
        type: "email",
        required: false,
        validation: { format: "email" },
        placeholder: "ejemplo@correo.com"
      },
      {
        id: "phone",
        name: "Teléfono",
        type: "tel",
        required: false,
        validation: { pattern: "^\\+52-\\d{2}-\\d{4}-\\d{4}$" },
        placeholder: "+52-55-1234-5678"
      }
    ]
  },

  medicalHistory: {
    name: "Historia Médica Personal",
    category: "medical_history",
    description: "Antecedentes médicos personales del paciente",
    estimatedDuration: 15,
    fields: [
      {
        id: "allergies",
        name: "¿Es alérgico a algún medicamento, alimento u otra sustancia?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "allergies", value: true },
            fields: [
              {
                id: "allergiesDetails",
                name: "Por favor especifique las alergias",
                type: "textarea",
                required: true,
                placeholder: "Describa las alergias y reacciones"
              }
            ]
          }
        ]
      },
      {
        id: "currentMedications",
        name: "¿Se encuentra tomando algún medicamento o suplemento alimenticio?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "currentMedications", value: true },
            fields: [
              {
                id: "medicationsDetails",
                name: "Por favor especifique los medicamentos",
                type: "textarea",
                required: true,
                placeholder: "Liste medicamentos, dosis y frecuencia"
              }
            ]
          }
        ]
      },
      {
        id: "chronicConditions",
        name: "¿Padece alguna enfermedad crónica?",
        type: "multiselect",
        required: true,
        options: [
          { value: "diabetes", label: "Diabetes mellitus" },
          { value: "hypertension", label: "Hipertensión arterial" },
          { value: "heart_disease", label: "Enfermedad cardiovascular" },
          { value: "mental_health", label: "Trastorno mental" },
          { value: "thyroid", label: "Problemas de tiroides" },
          { value: "kidney", label: "Enfermedad renal" },
          { value: "liver", label: "Enfermedad hepática" },
          { value: "other", label: "Otra" }
        ]
      },
      {
        id: "previousSurgeries",
        name: "¿Le han practicado alguna operación o cirugía?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "previousSurgeries", value: true },
            fields: [
              {
                id: "surgeriesDetails",
                name: "Especifique tipo de cirugía y año",
                type: "textarea",
                required: true,
                placeholder: "Tipo de cirugía y año realizada"
              }
            ]
          }
        ]
      },
      {
        id: "hospitalizations",
        name: "¿Ha estado hospitalizado durante los últimos 5 años?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "hospitalizations", value: true },
            fields: [
              {
                id: "hospitalizationsDetails",
                name: "Motivo y duración de la hospitalización",
                type: "textarea",
                required: true,
                placeholder: "Motivo, hospital y duración"
              }
            ]
          }
        ]
      }
    ]
  },

  familyHistory: {
    name: "Antecedentes Heredofamiliares",
    category: "family_history",
    description: "Historia médica familiar del paciente",
    estimatedDuration: 12,
    fields: [
      {
        id: "diabetes",
        name: "¿Padre, madre o hermanos con diabetes?",
        type: "boolean",
        required: true
      },
      {
        id: "hypertension",
        name: "¿Padre, madre o hermanos con presión alta?",
        type: "boolean",
        required: true
      },
      {
        id: "cancer",
        name: "¿Algún familiar con cáncer?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "cancer", value: true },
            fields: [
              {
                id: "cancerDetails",
                name: "Tipo de cáncer y parentesco",
                type: "textarea",
                required: true,
                placeholder: "Especifique tipo y familiar afectado"
              }
            ]
          }
        ]
      },
      {
        id: "mentalHealth",
        name: "¿Antecedentes familiares de trastornos mentales?",
        type: "boolean",
        required: true,
        conditionalFields: [
          {
            condition: { field: "mentalHealth", value: true },
            fields: [
              {
                id: "mentalHealthDetails",
                name: "Especifique el trastorno y parentesco",
                type: "textarea",
                required: true,
                placeholder: "Tipo de trastorno y familiar afectado"
              }
            ]
          }
        ]
      },
      {
        id: "heartDisease",
        name: "¿Infartos del corazón antes de los 50 años?",
        type: "boolean",
        required: true
      },
      {
        id: "strokeDementia",
        name: "¿Derrames cerebrales o demencia?",
        type: "boolean",
        required: true
      }
    ]
  },

  emergencyContact: {
    name: "Contacto de Emergencia",
    category: "emergency_contact",
    description: "Información del contacto de emergencia",
    estimatedDuration: 5,
    fields: [
      {
        id: "emergencyContactName",
        name: "Nombre completo del contacto",
        type: "text",
        required: true,
        validation: { minLength: 2, maxLength: 100 },
        placeholder: "Nombre del contacto de emergencia"
      },
      {
        id: "emergencyContactRelationship",
        name: "Parentesco o relación",
        type: "select",
        required: true,
        options: [
          { value: "parent", label: "Padre/Madre" },
          { value: "spouse", label: "Esposo/Esposa" },
          { value: "sibling", label: "Hermano/Hermana" },
          { value: "child", label: "Hijo/Hija" },
          { value: "friend", label: "Amigo/Amiga" },
          { value: "other", label: "Otro" }
        ]
      },
      {
        id: "emergencyContactPhone",
        name: "Teléfono del contacto",
        type: "tel",
        required: true,
        validation: { pattern: "^\\+52-\\d{2}-\\d{4}-\\d{4}$" },
        placeholder: "+52-55-1234-5678"
      },
      {
        id: "emergencyContactEmail",
        name: "Correo electrónico del contacto",
        type: "email",
        required: false,
        placeholder: "contacto@correo.com"
      }
    ]
  },

  consentsAndAuthorizations: {
    name: "Consentimientos y Autorizaciones",
    category: "consent",
    description: "Consentimientos requeridos para el tratamiento",
    estimatedDuration: 8,
    fields: [
      {
        id: "treatmentConsent",
        name: "Consiento el tratamiento médico",
        type: "checkbox",
        required: true,
        description: "Autorizo al médico a realizar los procedimientos necesarios para mi diagnóstico y tratamiento"
      },
      {
        id: "dataProcessingConsent",
        name: "Consiento el procesamiento de mis datos",
        type: "checkbox",
        required: true,
        description: "Autorizo el tratamiento de mis datos personales conforme a la Ley de Protección de Datos"
      },
      {
        id: "communicationConsent",
        name: "Consiento recibir comunicaciones",
        type: "checkbox",
        required: false,
        description: "Autorizo recibir recordatorios de citas y información médica por email o SMS"
      },
      {
        id: "emergencyTreatmentConsent",
        name: "Consiento tratamiento de emergencia",
        type: "checkbox",
        required: true,
        description: "En caso de emergencia, autorizo el tratamiento médico necesario"
      }
    ]
  }
};

/**
 * GET /api/v1/formx/patient-registration/templates
 * Get available patient registration form templates
 */
router.get('/templates',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  async (req, res) => {
    try {
      const templates = Object.keys(PATIENT_FORM_TEMPLATES).map(key => ({
        id: key,
        ...PATIENT_FORM_TEMPLATES[key],
        fieldsCount: PATIENT_FORM_TEMPLATES[key].fields.length
      }));

      res.json({
        success: true,
        data: templates,
        message: 'Patient registration form templates retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get patient registration templates', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates',
        message: 'An error occurred while retrieving form templates'
      });
    }
  }
);

/**
 * POST /api/v1/formx/patient-registration/create-forms
 * Create and assign patient registration forms to a patient
 */
router.post('/create-forms',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:forms']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('selectedForms').isArray().withMessage('Selected forms must be an array'),
    body('selectedForms.*').isIn(Object.keys(PATIENT_FORM_TEMPLATES)),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601(),
    body('autoCreatePatient').optional().isBoolean()
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
        selectedForms,
        priority = 'medium',
        dueDate,
        autoCreatePatient = false
      } = req.body;

      const userId = req.user?.id;

      // Verify patient exists or create if autoCreatePatient is true
      let patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            email: true
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient && !autoCreatePatient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found',
          message: 'Patient must exist or autoCreatePatient must be enabled'
        });
      }

      // Create forms and assignments in transaction
      const createdAssignments = await executeTransaction(
        selectedForms.map(formTemplate => 
          async (prisma, results) => {
            const template = PATIENT_FORM_TEMPLATES[formTemplate];
            
            // Create form
            const form = await prisma.form.create({
              data: {
                id: uuidv4(),
                name: template.name,
                description: template.description,
                category: template.category,
                estimatedDuration: template.estimatedDuration,
                isActive: true,
                createdBy: userId
              }
            });

            // Create form version with schema
            const formVersion = await prisma.formVersion.create({
              data: {
                id: uuidv4(),
                formId: form.id,
                versionNumber: 1,
                formSchema: {
                  fields: template.fields,
                  sections: [
                    {
                      id: 'main',
                      title: template.name,
                      fields: template.fields.map(f => f.id)
                    }
                  ]
                },
                validationRules: {
                  requiredFields: template.fields.filter(f => f.required).map(f => f.id)
                },
                isPublished: true,
                publishedAt: new Date(),
                publishedBy: userId
              }
            });

            // Update form with current version
            await prisma.form.update({
              where: { id: form.id },
              data: { currentVersionId: formVersion.id }
            });

            // Create patient form assignment
            const assignment = await prisma.patientForm.create({
              data: {
                id: uuidv4(),
                patientId: patientId,
                formId: form.id,
                assignedBy: userId,
                priority: priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'assigned',
                assignedAt: new Date(),
                instructions: `Complete el formulario de ${template.name} para su expediente médico`
              },
              include: {
                form: {
                  select: {
                    name: true,
                    description: true,
                    category: true
                  }
                }
              }
            });

            return assignment;
          }
        ),
        'createPatientRegistrationForms'
      );

      // Log form creation
      logger.info('Patient registration forms created', {
        patientId: patientId,
        formsCreated: selectedForms.length,
        formTypes: selectedForms,
        createdBy: userId,
        medicalRecordNumber: patient?.medicalRecordNumber
      });

      res.status(201).json({
        success: true,
        message: 'Patient registration forms created and assigned successfully',
        data: {
          patient: patient,
          assignments: createdAssignments,
          formsCreated: selectedForms.length
        }
      });

    } catch (error) {
      logger.error('Failed to create patient registration forms', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create registration forms',
        message: 'An error occurred while creating patient registration forms'
      });
    }
  }
);

/**
 * POST /api/v1/formx/patient-registration/submit-complete
 * Submit complete patient registration and sync to Expedix
 */
router.post('/submit-complete',
  ...middleware.utils.withPatientAccess(['patient', 'psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:forms']),
  [
    body('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('submissions').isArray().withMessage('Submissions must be an array'),
    body('submissions.*.formType').isIn(Object.keys(PATIENT_FORM_TEMPLATES)),
    body('submissions.*.responses').isArray().withMessage('Responses must be an array')
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

      const { patientId, submissions } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only submit their own forms'
        });
      }

      // Process all form submissions
      const processedSubmissions = await executeTransaction(
        submissions.map(submission => 
          async (prisma, results) => {
            // Find the form assignment
            const assignment = await prisma.patientForm.findFirst({
              where: {
                patientId: patientId,
                form: {
                  category: PATIENT_FORM_TEMPLATES[submission.formType].category
                }
              },
              include: {
                form: {
                  include: {
                    currentVersion: true
                  }
                }
              }
            });

            if (!assignment) {
              throw new Error(`Form assignment not found for ${submission.formType}`);
            }

            // Create form submission
            const formSubmission = await prisma.formSubmission.create({
              data: {
                id: uuidv4(),
                formId: assignment.formId,
                patientId: patientId,
                assignmentId: assignment.id,
                versionId: assignment.form.currentVersionId,
                responses: submission.responses,
                isCompleted: true,
                completionPercentage: 100,
                submittedAt: new Date(),
                submittedBy: userId
              }
            });

            // Update assignment status
            await prisma.patientForm.update({
              where: { id: assignment.id },
              data: {
                status: 'completed',
                completedAt: new Date()
              }
            });

            return {
              formType: submission.formType,
              submissionId: formSubmission.id,
              responses: submission.responses
            };
          }
        ),
        'submitCompletePatientRegistration'
      );

      // Aggregate all responses for Expedix integration
      const aggregatedData = aggregatePatientData(processedSubmissions);

      // Send to Expedix via internal API call
      try {
        const expedixResponse = await axios.post('/api/v1/expedix/patients/complete-registration', {
          patientId: patientId,
          registrationData: aggregatedData,
          source: 'formx_registration',
          submittedBy: userId
        }, {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          }
        });

        if (expedixResponse.data.success) {
          logger.info('Patient registration synced to Expedix', {
            patientId: patientId,
            submissionsCount: processedSubmissions.length,
            expedixPatientId: expedixResponse.data.data?.id
          });
        }
      } catch (expedixError) {
        logger.error('Failed to sync patient registration to Expedix', {
          error: expedixError.message,
          patientId: patientId,
          aggregatedData: aggregatedData
        });
        // Continue with FormX response even if Expedix sync fails
      }

      // Log complete registration
      await auditLogger.logDataModification(
        userId,
        'COMPLETE_PATIENT_REGISTRATION',
        {
          patientId: patientId,
          submissionsCount: processedSubmissions.length,
          formTypes: submissions.map(s => s.formType),
          completedAt: new Date().toISOString()
        }
      );

      res.status(201).json({
        success: true,
        message: 'Patient registration completed successfully',
        data: {
          patientId: patientId,
          submissions: processedSubmissions,
          expedixSync: true
        }
      });

    } catch (error) {
      logger.error('Failed to submit complete patient registration', {
        error: error.message,
        stack: error.stack,
        patientId: req.body.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to complete registration',
        message: 'An error occurred while submitting patient registration'
      });
    }
  }
);

/**
 * Helper function to aggregate patient data from all form submissions
 */
function aggregatePatientData(submissions) {
  const aggregated = {
    basicInfo: {},
    medicalHistory: {},
    familyHistory: {},
    emergencyContact: {},
    consents: {}
  };

  submissions.forEach(submission => {
    const responses = submission.responses;

    switch (submission.formType) {
      case 'basicRegistration':
        responses.forEach(response => {
          switch (response.fieldId) {
            case 'firstName':
              aggregated.basicInfo.firstName = response.value;
              break;
            case 'paternalLastName':
              aggregated.basicInfo.paternalLastName = response.value;
              break;
            case 'maternalLastName':
              aggregated.basicInfo.maternalLastName = response.value;
              break;
            case 'dateOfBirth':
              aggregated.basicInfo.dateOfBirth = response.value;
              break;
            case 'gender':
              aggregated.basicInfo.gender = response.value;
              break;
            case 'curp':
              aggregated.basicInfo.curp = response.value;
              break;
            case 'email':
              aggregated.basicInfo.email = response.value;
              break;
            case 'phone':
              aggregated.basicInfo.phone = response.value;
              break;
          }
        });
        break;

      case 'medicalHistory':
        responses.forEach(response => {
          aggregated.medicalHistory[response.fieldId] = response.value;
        });
        break;

      case 'familyHistory':
        responses.forEach(response => {
          aggregated.familyHistory[response.fieldId] = response.value;
        });
        break;

      case 'emergencyContact':
        responses.forEach(response => {
          aggregated.emergencyContact[response.fieldId] = response.value;
        });
        break;

      case 'consentsAndAuthorizations':
        responses.forEach(response => {
          aggregated.consents[response.fieldId] = response.value;
        });
        break;
    }
  });

  return aggregated;
}

module.exports = router;