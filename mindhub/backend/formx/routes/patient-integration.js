/**
 * Patient Integration API Routes for Formx Hub
 * 
 * Integration between forms and patient records from Expedix hub,
 * enabling patient-specific form workflows and clinical documentation
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * GET /api/v1/formx/patients/:patientId/forms
 * Get all forms assigned to a specific patient
 */
router.get('/:patientId/forms',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('status').optional().isIn(['assigned', 'in_progress', 'completed', 'overdue']),
    query('category').optional().isString(),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
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
      const { status, category, priority } = req.query;
      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
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

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          message: 'The specified patient was not found'
        });
      }

      // Build where clause for patient forms
      const whereClause = { patientId: patientId };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (priority) {
        whereClause.priority = priority;
      }

      // Get patient form assignments
      const patientForms = await executeQuery(
        (prisma) => prisma.patientForm.findMany({
          where: whereClause,
          include: {
            form: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                estimatedDuration: true,
                currentVersion: {
                  select: {
                    versionNumber: true,
                    formSchema: true
                  }
                }
              }
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            submission: {
              select: {
                id: true,
                isCompleted: true,
                completionPercentage: true,
                submittedAt: true,
                completionTimeMinutes: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { assignedAt: 'desc' }
          ]
        }),
        `getPatientForms(${patientId})`
      );

      // Filter by category if specified
      let filteredForms = patientForms;
      if (category) {
        filteredForms = patientForms.filter(pf => 
          pf.form.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Calculate status for each form
      const formsWithStatus = filteredForms.map(patientForm => {
        let calculatedStatus = patientForm.status;
        
        // Check if overdue
        if (patientForm.dueDate && new Date() > patientForm.dueDate && !patientForm.submission?.isCompleted) {
          calculatedStatus = 'overdue';
        }
        
        // Check if in progress
        if (patientForm.submission && !patientForm.submission.isCompleted) {
          calculatedStatus = 'in_progress';
        }
        
        // Check if completed
        if (patientForm.submission?.isCompleted) {
          calculatedStatus = 'completed';
        }

        return {
          ...patientForm,
          calculatedStatus: calculatedStatus,
          isOverdue: patientForm.dueDate && new Date() > patientForm.dueDate && !patientForm.submission?.isCompleted
        };
      });

      // Log patient forms access
      await auditLogger.logDataAccess(
        userId,
        'patient_forms',
        patientId,
        'view',
        {
          patientId: patientId,
          formCount: formsWithStatus.length,
          medicalRecordNumber: patient.medicalRecordNumber
        }
      );

      res.json({
        success: true,
        data: {
          patient: patient,
          forms: formsWithStatus,
          summary: {
            total: formsWithStatus.length,
            assigned: formsWithStatus.filter(f => f.calculatedStatus === 'assigned').length,
            inProgress: formsWithStatus.filter(f => f.calculatedStatus === 'in_progress').length,
            completed: formsWithStatus.filter(f => f.calculatedStatus === 'completed').length,
            overdue: formsWithStatus.filter(f => f.isOverdue).length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient forms', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Patient forms retrieval failed',
        message: 'An error occurred while retrieving patient forms'
      });
    }
  }
);

/**
 * POST /api/v1/formx/patients/:patientId/forms/:formId/assign
 * Assign a form to a patient
 */
router.post('/:patientId/forms/:formId/assign',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('formId').isUUID().withMessage('Invalid form ID format'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601(),
    body('instructions').optional().isString().isLength({ max: 1000 }),
    body('sendNotification').optional().isBoolean(),
    body('clinicalContext').optional().isObject()
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

      const { patientId, formId } = req.params;
      const {
        priority = 'medium',
        dueDate,
        instructions,
        sendNotification = false,
        clinicalContext = {}
      } = req.body;

      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
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

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          message: 'The specified patient was not found'
        });
      }

      // Verify form exists
      const form = await executeQuery(
        (prisma) => prisma.form.findUnique({
          where: { id: formId },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isActive: true,
            estimatedDuration: true
          }
        }),
        `verifyForm(${formId})`
      );

      if (!form) {
        return res.status(404).json({
          error: 'Form not found',
          message: 'The specified form was not found'
        });
      }

      if (!form.isActive) {
        return res.status(400).json({
          error: 'Form inactive',
          message: 'Cannot assign an inactive form'
        });
      }

      // Check if form is already assigned
      const existingAssignment = await executeQuery(
        (prisma) => prisma.patientForm.findFirst({
          where: {
            patientId: patientId,
            formId: formId,
            status: {
              in: ['assigned', 'in_progress']
            }
          }
        }),
        'checkExistingAssignment'
      );

      if (existingAssignment) {
        return res.status(400).json({
          error: 'Form already assigned',
          message: 'This form is already assigned to the patient'
        });
      }

      // Create assignment
      const assignment = await executeQuery(
        (prisma) => prisma.patientForm.create({
          data: {
            id: uuidv4(),
            patientId: patientId,
            formId: formId,
            assignedBy: userId,
            priority: priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            instructions: instructions,
            clinicalContext: clinicalContext,
            status: 'assigned',
            assignedAt: new Date()
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            form: {
              select: {
                name: true,
                description: true,
                category: true
              }
            },
            assignedBy: {
              select: {
                name: true,
                role: true
              }
            }
          }
        }),
        'createPatientFormAssignment'
      );

      // Send notification if requested
      if (sendNotification && patient.email) {
        // TODO: Implement email notification service
        logger.info('Form assignment notification requested', {
          patientId: patientId,
          formId: formId,
          patientEmail: patient.email
        });
      }

      // Log assignment
      await auditLogger.logDataModification(
        userId,
        'PATIENT_FORM_ASSIGN',
        {
          patientId: patientId,
          formId: formId,
          formName: form.name,
          priority: priority,
          dueDate: dueDate,
          medicalRecordNumber: patient.medicalRecordNumber,
          clinicalContext: clinicalContext
        }
      );

      res.status(201).json({
        success: true,
        message: 'Form assigned to patient successfully',
        data: assignment
      });

    } catch (error) {
      logger.error('Failed to assign form to patient', {
        error: error.message,
        patientId: req.params.patientId,
        formId: req.params.formId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Form assignment failed',
        message: 'An error occurred while assigning the form to the patient'
      });
    }
  }
);

/**
 * POST /api/v1/formx/patients/:patientId/forms/:formId/submit
 * Submit a form on behalf of a patient or allow patient self-submission
 */
router.post('/:patientId/forms/:formId/submit',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['write:forms']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('formId').isUUID().withMessage('Invalid form ID format'),
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.fieldId').isString().withMessage('Field ID is required'),
    body('responses.*.value').exists().withMessage('Response value is required'),
    body('isPartialSubmission').optional().isBoolean(),
    body('completionTimeMinutes').optional().isInt({ min: 1 }),
    body('submissionNotes').optional().isString().isLength({ max: 1000 })
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

      const { patientId, formId } = req.params;
      const {
        responses,
        isPartialSubmission = false,
        completionTimeMinutes,
        submissionNotes
      } = req.body;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patients can only submit their own forms'
        });
      }

      // Get form assignment
      const assignment = await executeQuery(
        (prisma) => prisma.patientForm.findFirst({
          where: {
            patientId: patientId,
            formId: formId
          },
          include: {
            form: {
              include: {
                currentVersion: {
                  select: {
                    formSchema: true,
                    validationRules: true
                  }
                }
              }
            },
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        'getFormAssignment'
      );

      if (!assignment) {
        return res.status(404).json({
          error: 'Form assignment not found',
          message: 'This form is not assigned to the patient'
        });
      }

      // Validate responses against form schema
      const formSchema = assignment.form.currentVersion?.formSchema;
      if (formSchema && !isPartialSubmission) {
        const validation = validateFormResponses(responses, formSchema);
        if (!validation.isValid) {
          return res.status(400).json({
            error: 'Invalid form responses',
            details: validation.errors
          });
        }
      }

      // Create or update submission
      const submission = await executeTransaction([
        async (prisma) => {
          // Check if submission already exists
          const existingSubmission = await prisma.formSubmission.findFirst({
            where: {
              formId: formId,
              patientId: patientId,
              assignmentId: assignment.id
            }
          });

          if (existingSubmission) {
            // Update existing submission
            return await prisma.formSubmission.update({
              where: { id: existingSubmission.id },
              data: {
                responses: responses,
                isCompleted: !isPartialSubmission,
                completionPercentage: isPartialSubmission ? 
                  calculateCompletionPercentage(responses, formSchema) : 100,
                completionTimeMinutes: completionTimeMinutes,
                submissionNotes: submissionNotes,
                submittedAt: new Date(),
                submittedBy: userId,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new submission
            return await prisma.formSubmission.create({
              data: {
                id: uuidv4(),
                formId: formId,
                patientId: patientId,
                assignmentId: assignment.id,
                versionId: assignment.form.currentVersionId,
                responses: responses,
                isCompleted: !isPartialSubmission,
                completionPercentage: isPartialSubmission ? 
                  calculateCompletionPercentage(responses, formSchema) : 100,
                completionTimeMinutes: completionTimeMinutes,
                submissionNotes: submissionNotes,
                submittedAt: new Date(),
                submittedBy: userId,
                createdAt: new Date()
              }
            });
          }
        }
      ], 'submitPatientForm');

      // Update assignment status
      if (!isPartialSubmission) {
        await executeQuery(
          (prisma) => prisma.patientForm.update({
            where: { id: assignment.id },
            data: { 
              status: 'completed',
              completedAt: new Date()
            }
          }),
          'updateAssignmentStatus'
        );
      }

      // Log submission
      await auditLogger.logDataModification(
        userId,
        'PATIENT_FORM_SUBMIT',
        {
          patientId: patientId,
          formId: formId,
          formName: assignment.form.name,
          isPartialSubmission: isPartialSubmission,
          responseCount: responses.length,
          medicalRecordNumber: assignment.patient.medicalRecordNumber,
          submittedBy: userRole
        }
      );

      res.status(201).json({
        success: true,
        message: isPartialSubmission ? 'Partial form submission saved' : 'Form submitted successfully',
        data: {
          submission: submission,
          assignment: {
            id: assignment.id,
            status: isPartialSubmission ? 'in_progress' : 'completed'
          }
        }
      });

    } catch (error) {
      logger.error('Failed to submit patient form', {
        error: error.message,
        patientId: req.params.patientId,
        formId: req.params.formId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Form submission failed',
        message: 'An error occurred while submitting the form'
      });
    }
  }
);

/**
 * GET /api/v1/formx/patients/:patientId/forms/:formId/submission
 * Get form submission details for a patient
 */
router.get('/:patientId/forms/:formId/submission',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:forms']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('formId').isUUID().withMessage('Invalid form ID format')
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

      const { patientId, formId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patients can only view their own form submissions'
        });
      }

      // Get form submission
      const submission = await executeQuery(
        (prisma) => prisma.formSubmission.findFirst({
          where: {
            formId: formId,
            patientId: patientId
          },
          include: {
            form: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true
              }
            },
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            submittedByUser: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            assignment: {
              select: {
                id: true,
                priority: true,
                dueDate: true,
                instructions: true,
                clinicalContext: true
              }
            }
          }
        }),
        'getPatientFormSubmission'
      );

      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'No submission found for this form and patient'
        });
      }

      // Log submission access
      await auditLogger.logDataAccess(
        userId,
        'patient_form_submission',
        submission.id,
        'view',
        {
          patientId: patientId,
          formId: formId,
          formName: submission.form.name,
          medicalRecordNumber: submission.patient.medicalRecordNumber
        }
      );

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      logger.error('Failed to get patient form submission', {
        error: error.message,
        patientId: req.params.patientId,
        formId: req.params.formId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Submission retrieval failed',
        message: 'An error occurred while retrieving the form submission'
      });
    }
  }
);

/**
 * Helper functions
 */

function validateFormResponses(responses, formSchema) {
  const errors = [];
  
  if (!formSchema || !formSchema.fields) {
    return { isValid: true, errors: [] };
  }

  const requiredFields = formSchema.fields.filter(field => field.required);
  
  for (const requiredField of requiredFields) {
    const response = responses.find(r => r.fieldId === requiredField.id);
    if (!response || response.value === null || response.value === undefined || response.value === '') {
      errors.push({
        fieldId: requiredField.id,
        fieldName: requiredField.name,
        error: 'Required field is missing'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function calculateCompletionPercentage(responses, formSchema) {
  if (!formSchema || !formSchema.fields) {
    return 0;
  }

  const totalFields = formSchema.fields.length;
  const completedFields = responses.filter(r => 
    r.value !== null && r.value !== undefined && r.value !== ''
  ).length;

  return Math.round((completedFields / totalFields) * 100);
}

module.exports = router;