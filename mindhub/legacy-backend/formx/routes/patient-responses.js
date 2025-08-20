/**
 * Patient Form Responses API for FormX Hub
 * 
 * Handles form submissions from patients, validates responses,
 * and integrates with patient medical records
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const crypto = require('crypto');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');

const router = express.Router();

/**
 * POST /api/formx/submissions
 * Submit form responses from patient
 */
router.post('/', [
  body('formId').isString(),
  body('token').isString().isLength({ min: 32, max: 128 }),
  body('responses').isObject(),
  body('signature').optional().isString(),
  body('submittedAt').isString(),
  body('completionTime').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { formId, token, responses, signature, submittedAt, completionTime } = req.body;

    // Verify token and get assignment
    let assignment = null;
    
    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, form_id, patient_id, token, assigned_by, assigned_at, expires_at, status, message
            FROM form_assignments 
            WHERE token = ${token} AND form_id = ${formId}
          `;
        },
        'verifyToken'
      );
      
      if (results && results.length > 0) {
        assignment = results[0];
      }
    } catch (error) {
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const assignmentsDir = path.join(__dirname, '../../data/assignments');
        const files = await fs.readdir(assignmentsDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const assignmentData = JSON.parse(await fs.readFile(path.join(assignmentsDir, file), 'utf8'));
            if (assignmentData.token === token && assignmentData.formId === formId) {
              assignment = assignmentData;
              break;
            }
          }
        }
      } catch (fsError) {
        // No assignments found
      }
    }

    if (!assignment) {
      return res.status(404).json({
        error: 'Invalid token or form not found'
      });
    }

    // Check if token has expired
    const expiresAt = assignment.expiresAt || assignment.expires_at;
    if (new Date() > new Date(expiresAt)) {
      return res.status(410).json({
        error: 'Form has expired'
      });
    }

    // Check if already completed
    if (assignment.status === 'completed') {
      return res.status(409).json({
        error: 'Form has already been completed'
      });
    }

    // Get form structure for validation
    let form = null;
    
    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, title, description, structure, settings, created_by, created_at, is_active, version
            FROM forms 
            WHERE id = ${formId} AND is_active = 1
          `;
        },
        'getFormForValidation'
      );
      
      if (results && results.length > 0) {
        form = results[0];
        form.sections = JSON.parse(form.structure).sections;
        form.settings = JSON.parse(form.settings);
      }
    } catch (error) {
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const formFile = path.join(__dirname, '../../data/forms', `${formId}.json`);
        const formData = await fs.readFile(formFile, 'utf8');
        form = JSON.parse(formData);
      } catch (fsError) {
        return res.status(404).json({
          error: 'Form not found'
        });
      }
    }

    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }

    // Validate responses against form structure
    const validationErrors = [];
    const allFields = [];
    
    // Collect all fields from all sections
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        allFields.push(field);
      });
    });

    // Validate each field
    allFields.forEach(field => {
      const response = responses[field.id];
      
      // Check required fields
      if (field.required && (!response || response === '' || (Array.isArray(response) && response.length === 0))) {
        validationErrors.push({
          fieldId: field.id,
          fieldLabel: field.label,
          error: 'Este campo es requerido'
        });
      }

      // Validate field types and constraints
      if (response && response !== '') {
        switch (field.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response)) {
              validationErrors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                error: 'Formato de email inválido'
              });
            }
            break;
            
          case 'phone':
            if (!/^[\+]?[1-9][\d]{0,15}$/.test(response.replace(/\s/g, ''))) {
              validationErrors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                error: 'Formato de teléfono inválido'
              });
            }
            break;
            
          case 'date':
            if (!/^\d{4}-\d{2}-\d{2}$/.test(response)) {
              validationErrors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                error: 'Formato de fecha inválido'
              });
            }
            break;
            
          case 'scale':
            const scaleValue = parseInt(response);
            const min = field.validation?.min || 1;
            const max = field.validation?.max || 10;
            
            if (isNaN(scaleValue) || scaleValue < min || scaleValue > max) {
              validationErrors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                error: `Valor debe estar entre ${min} y ${max}`
              });
            }
            break;
        }

        // Check field-specific validation rules
        if (field.validation) {
          const { min, max, pattern, message } = field.validation;
          
          if (min && response.length < min) {
            validationErrors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              error: message || `Mínimo ${min} caracteres`
            });
          }
          
          if (max && response.length > max) {
            validationErrors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              error: message || `Máximo ${max} caracteres`
            });
          }
          
          if (pattern && !new RegExp(pattern).test(response)) {
            validationErrors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              error: message || 'Formato inválido'
            });
          }
        }
      }
    });

    // Check signature requirement
    if (form.settings.requireSignature && !signature) {
      validationErrors.push({
        fieldId: 'signature',
        fieldLabel: 'Firma',
        error: 'La firma es requerida'
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Create submission record
    const submissionId = `submission_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
    const patientId = assignment.patientId || assignment.patient_id;
    
    const submission = {
      id: submissionId,
      formId: formId,
      assignmentId: assignment.id,
      patientId: patientId,
      responses: responses,
      signature: signature,
      submittedAt: submittedAt,
      completionTime: completionTime || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || null,
      validated: true,
      validatedAt: new Date().toISOString()
    };

    // Store submission and update assignment status
    try {
      await executeTransaction(async (prisma) => {
        // Insert submission
        await prisma.$executeRaw`
          INSERT INTO form_submissions (id, form_id, assignment_id, patient_id, responses, signature, submitted_at, completion_time, ip_address, user_agent, validated, validated_at)
          VALUES (${submission.id}, ${submission.formId}, ${submission.assignmentId}, ${submission.patientId}, ${JSON.stringify(submission.responses)}, ${submission.signature}, ${submission.submittedAt}, ${submission.completionTime}, ${submission.ipAddress}, ${submission.userAgent}, 1, ${submission.validatedAt})
        `;

        // Update assignment status
        await prisma.$executeRaw`
          UPDATE form_assignments 
          SET status = 'completed', completed_at = NOW()
          WHERE id = ${assignment.id}
        `;

        // Create patient record entry
        await prisma.$executeRaw`
          INSERT INTO patient_form_responses (id, patient_id, form_id, submission_id, form_title, submitted_at, created_at)
          VALUES (${crypto.randomUUID()}, ${patientId}, ${formId}, ${submission.id}, ${form.title}, ${submission.submittedAt}, NOW())
        `;
      });
    } catch (error) {
      console.log('Database transaction failed, using file system backup');
      
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      // Store submission
      const submissionsDir = path.join(__dirname, '../../data/submissions');
      await fs.mkdir(submissionsDir, { recursive: true });
      
      const submissionFile = path.join(submissionsDir, `${submission.id}.json`);
      await fs.writeFile(submissionFile, JSON.stringify(submission, null, 2));

      // Update assignment
      const assignmentsDir = path.join(__dirname, '../../data/assignments');
      const assignmentFile = path.join(assignmentsDir, `${assignment.id}.json`);
      
      try {
        const assignmentData = JSON.parse(await fs.readFile(assignmentFile, 'utf8'));
        assignmentData.status = 'completed';
        assignmentData.completedAt = new Date().toISOString();
        assignmentData.submissionId = submission.id;
        
        await fs.writeFile(assignmentFile, JSON.stringify(assignmentData, null, 2));
      } catch (assignmentError) {
        console.error('Failed to update assignment:', assignmentError);
      }

      // Store patient record
      const patientResponsesDir = path.join(__dirname, '../../data/patient-responses');
      await fs.mkdir(patientResponsesDir, { recursive: true });
      
      const patientResponseFile = path.join(patientResponsesDir, `${patientId}_${submission.id}.json`);
      await fs.writeFile(patientResponseFile, JSON.stringify({
        id: crypto.randomUUID(),
        patientId: patientId,
        formId: formId,
        submissionId: submission.id,
        formTitle: form.title,
        submittedAt: submission.submittedAt,
        responses: submission.responses,
        signature: submission.signature,
        createdAt: new Date().toISOString()
      }, null, 2));
    }

    // Try to integrate with patient expedient
    try {
      await integrateWithPatientRecord(patientId, formId, form.title, responses, signature);
    } catch (integrationError) {
      console.error('Failed to integrate with patient record:', integrationError);
      // Don't fail the submission if integration fails
    }

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      error: 'Failed to submit form',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/submissions/:id
 * Get specific submission
 */
router.get('/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    let submission = null;

    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT fs.*, fa.patient_id, p.first_name, p.last_name, f.title as form_title
            FROM form_submissions fs
            LEFT JOIN form_assignments fa ON fs.assignment_id = fa.id
            LEFT JOIN patients p ON fa.patient_id = p.id
            LEFT JOIN forms f ON fs.form_id = f.id
            WHERE fs.id = ${id}
          `;
        },
        'getSubmission'
      );
      
      if (results && results.length > 0) {
        submission = results[0];
        submission.responses = JSON.parse(submission.responses);
      }
    } catch (error) {
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const submissionFile = path.join(__dirname, '../../data/submissions', `${id}.json`);
        const submissionData = await fs.readFile(submissionFile, 'utf8');
        submission = JSON.parse(submissionData);
      } catch (fsError) {
        // Submission not found
      }
    }

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      error: 'Failed to fetch submission',
      details: error.message
    });
  }
});

/**
 * GET /api/formx/submissions/patient/:patientId
 * Get all submissions for a patient
 */
router.get('/patient/:patientId', [
  param('patientId').isString(),
  query('formId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { patientId } = req.params;
    const { formId, limit = 50 } = req.query;

    let submissions = [];

    try {
      let query = `
        SELECT fs.*, f.title as form_title, f.description as form_description, fa.assigned_at
        FROM form_submissions fs
        LEFT JOIN forms f ON fs.form_id = f.id
        LEFT JOIN form_assignments fa ON fs.assignment_id = fa.id
        WHERE fs.patient_id = ?
      `;
      
      const params = [patientId];
      
      if (formId) {
        query += ' AND fs.form_id = ?';
        params.push(formId);
      }
      
      query += ' ORDER BY fs.submitted_at DESC LIMIT ?';
      params.push(parseInt(limit));

      submissions = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRawUnsafe(query, ...params);
        },
        'getPatientSubmissions'
      );

      // Parse responses JSON
      submissions = submissions.map(submission => ({
        ...submission,
        responses: JSON.parse(submission.responses || '{}')
      }));

    } catch (error) {
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const patientResponsesDir = path.join(__dirname, '../../data/patient-responses');
        const files = await fs.readdir(patientResponsesDir);
        
        for (const file of files) {
          if (file.startsWith(`${patientId}_`) && file.endsWith('.json')) {
            const responseData = JSON.parse(await fs.readFile(path.join(patientResponsesDir, file), 'utf8'));
            if (!formId || responseData.formId === formId) {
              submissions.push(responseData);
            }
          }
        }
        
        // Sort by submitted date and limit
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        submissions = submissions.slice(0, parseInt(limit));
        
      } catch (fsError) {
        // No submissions found
      }
    }

    res.json({
      success: true,
      data: submissions,
      total: submissions.length
    });

  } catch (error) {
    console.error('Error fetching patient submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch patient submissions',
      details: error.message
    });
  }
});

/**
 * Integration with patient medical record
 */
async function integrateWithPatientRecord(patientId, formId, formTitle, responses, signature) {
  try {
    // Create a medical record entry from form responses
    const medicalEntry = {
      patientId: patientId,
      type: 'form_response',
      title: formTitle,
      content: formatResponsesForMedicalRecord(responses),
      signature: signature,
      createdAt: new Date().toISOString(),
      source: 'formx',
      sourceId: formId
    };

    // Try to insert into patient medical history
    try {
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO patient_medical_history (id, patient_id, type, title, content, signature, created_at, source, source_id)
            VALUES (${crypto.randomUUID()}, ${medicalEntry.patientId}, ${medicalEntry.type}, ${medicalEntry.title}, ${medicalEntry.content}, ${medicalEntry.signature}, ${medicalEntry.createdAt}, ${medicalEntry.source}, ${medicalEntry.sourceId})
          `;
        },
        'addToMedicalHistory'
      );
    } catch (error) {
      // If medical history table doesn't exist, store separately
      const fs = require('fs').promises;
      const path = require('path');
      
      const medicalHistoryDir = path.join(__dirname, '../../data/medical-history');
      await fs.mkdir(medicalHistoryDir, { recursive: true });
      
      const historyFile = path.join(medicalHistoryDir, `${patientId}_${Date.now()}.json`);
      await fs.writeFile(historyFile, JSON.stringify(medicalEntry, null, 2));
    }

  } catch (error) {
    console.error('Error integrating with patient record:', error);
    throw error;
  }
}

/**
 * Format form responses for medical record
 */
function formatResponsesForMedicalRecord(responses) {
  let formatted = '';
  
  Object.entries(responses).forEach(([fieldId, response]) => {
    if (response && response !== '') {
      // Try to format field names nicely
      const fieldName = fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (Array.isArray(response)) {
        formatted += `${fieldName}: ${response.join(', ')}\n`;
      } else {
        formatted += `${fieldName}: ${response}\n`;
      }
    }
  });
  
  return formatted;
}

module.exports = router;