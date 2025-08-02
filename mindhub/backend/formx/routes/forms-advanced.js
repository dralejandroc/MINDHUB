/**
 * Advanced Forms Management API for FormX Hub
 * 
 * Complete form management with tokenization, patient assignment,
 * dynamic forms, templates, and integration with patient records
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const crypto = require('crypto');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');

const router = express.Router();

// Utility functions
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateFormId = () => {
  return `form_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
};

/**
 * POST /api/v1/formx/forms
 * Create a new dynamic form
 */
router.post('/', [
  body('title').isString().isLength({ min: 3, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('sections').isArray().withMessage('Sections must be an array'),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const formId = generateFormId();
    const userId = req.user?.id || 'system';
    
    const formData = {
      id: formId,
      title: req.body.title,
      description: req.body.description || '',
      sections: req.body.sections || [],
      settings: req.body.settings || {},
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      version: 1
    };

    // Store in database (using MySQL with JSON fields)
    await executeQuery(
      async (prisma) => {
        return await prisma.$executeRaw`
          INSERT INTO forms (id, title, description, structure, settings, created_by, created_at, updated_at, is_active, version, usage_count)
          VALUES (${formId}, ${formData.title}, ${formData.description}, ${JSON.stringify({
            sections: formData.sections
          })}, ${JSON.stringify(formData.settings)}, ${userId}, NOW(), NOW(), 1, 1, 0)
        `;
      },
      'createForm'
    );

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: formData
    });

  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({
      error: 'Failed to create form',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/formx/forms
 * List all forms with filtering
 */
router.get('/', [
  query('category').optional().isString(),
  query('active').optional().isBoolean(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    // For now, return empty array to fix frontend connection
    // TODO: Implement proper forms query when database schema is fixed
    res.json({
      success: true,
      data: [],
      categories: [],
      total: 0
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve forms', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/formx/forms/:id
 * Get specific form by ID - only match if id looks like an actual form ID
 */
router.get('/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    let form = null;

    // Try database first
    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, title, description, structure, settings, created_by, created_at, is_active, version
            FROM forms 
            WHERE id = ${id} AND is_active = 1
          `;
        },
        'getForm'
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
        const formFile = path.join(__dirname, '../../data/forms', `${id}.json`);
        const formData = await fs.readFile(formFile, 'utf8');
        form = JSON.parse(formData);
      } catch (fsError) {
        // Form not found
      }
    }

    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      error: 'Failed to fetch form',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/formx/forms/:id/assign
 * Assign form to a patient with token
 */
router.post('/:id/assign', [
  param('id').isString(),
  body('patientId').isString(),
  body('expiresInHours').optional().isInt({ min: 1, max: 168 }), // Max 7 days
  body('message').optional().isString()
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
    const { patientId, expiresInHours = 72, message } = req.body;
    const assignedBy = req.user?.id || 'system';

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const assignment = {
      id: `assignment_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
      formId: id,
      patientId: patientId,
      token: token,
      assignedBy: assignedBy,
      assignedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending',
      message: message || 'Por favor complete este formulario antes de su próxima consulta.',
      remindersSent: 0,
      maxReminders: 3
    };

    // Store assignment
    try {
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO form_assignments (id, form_id, patient_id, token, assigned_by, assigned_at, expires_at, status, message, reminders_sent, max_reminders)
            VALUES (${assignment.id}, ${assignment.formId}, ${assignment.patientId}, ${assignment.token}, ${assignment.assignedBy}, ${assignment.assignedAt}, ${assignment.expiresAt}, ${assignment.status}, ${assignment.message}, ${assignment.remindersSent}, ${assignment.maxReminders})
          `;
        },
        'assignForm'
      );
    } catch (error) {
      // Fallback to file system
      const fs = require('fs').promises;
      const path = require('path');
      
      const assignmentsDir = path.join(__dirname, '../../data/assignments');
      await fs.mkdir(assignmentsDir, { recursive: true });
      
      const assignmentFile = path.join(assignmentsDir, `${assignment.id}.json`);
      await fs.writeFile(assignmentFile, JSON.stringify(assignment, null, 2));
    }

    // Generate form URL for patient
    const formUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/forms/${token}`;

    res.status(201).json({
      success: true,
      message: 'Form assigned to patient successfully',
      data: {
        assignmentId: assignment.id,
        token: assignment.token,
        formUrl: formUrl,
        expiresAt: assignment.expiresAt,
        patientId: assignment.patientId
      }
    });

  } catch (error) {
    console.error('Error assigning form:', error);
    res.status(500).json({
      error: 'Failed to assign form',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/formx/forms/token/:token
 * Get form by patient token (for patient access)
 */
router.get('/token/:token', [
  param('token').isString().isLength({ min: 32, max: 128 })
], async (req, res) => {
  try {
    const { token } = req.params;

    let assignment = null;

    // Try to get assignment from database
    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, form_id, patient_id, token, assigned_by, assigned_at, expires_at, status, message
            FROM form_assignments 
            WHERE token = ${token}
          `;
        },
        'getAssignmentByToken'
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
            if (assignmentData.token === token) {
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
        error: 'Form not found or token invalid'
      });
    }

    // Check if token has expired
    if (new Date() > new Date(assignment.expiresAt || assignment.expires_at)) {
      return res.status(410).json({
        error: 'Form has expired'
      });
    }

    // Check if already completed
    if (assignment.status === 'completed') {
      return res.status(200).json({
        success: true,
        data: {
          status: 'completed',
          message: 'Este formulario ya ha sido completado.'
        }
      });
    }

    // Get the actual form
    const formId = assignment.formId || assignment.form_id;
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
        'getFormForToken'
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

    // Add assignment info to form
    form.token = token;
    form.patientId = assignment.patientId || assignment.patient_id;
    form.assignedBy = assignment.assignedBy || assignment.assigned_by;
    form.expiresAt = assignment.expiresAt || assignment.expires_at;
    form.message = assignment.message;

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    console.error('Error fetching form by token:', error);
    res.status(500).json({
      error: 'Failed to fetch form',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/formx/forms/:id/assignments
 * Get all assignments for a form
 */
router.get('/:id/assignments', [
  param('id').isString(),
  query('status').optional().isIn(['pending', 'completed', 'expired'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let assignments = [];

    try {
      let query = `
        SELECT fa.id, fa.form_id, fa.patient_id, fa.token, fa.assigned_by, fa.assigned_at, fa.expires_at, fa.status, fa.message, fa.reminders_sent,
               p.first_name, p.last_name, p.email, p.cell_phone
        FROM form_assignments fa
        LEFT JOIN patients p ON fa.patient_id = p.id
        WHERE fa.form_id = ?
      `;
      
      const params = [id];
      
      if (status) {
        query += ' AND fa.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY fa.assigned_at DESC';

      assignments = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRawUnsafe(query, ...params);
        },
        'getFormAssignments'
      );
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
            if (assignmentData.formId === id) {
              if (!status || assignmentData.status === status) {
                assignments.push(assignmentData);
              }
            }
          }
        }
      } catch (fsError) {
        // No assignments found
      }
    }

    res.json({
      success: true,
      data: assignments,
      total: assignments.length
    });

  } catch (error) {
    console.error('Error fetching form assignments:', error);
    res.status(500).json({
      error: 'Failed to fetch assignments',
      details: error.message
    });
  }
});

/**
 * PUT /api/v1/formx/forms/:id
 * Update an existing form
 */
router.put('/:id', [
  param('id').isString(),
  body('title').optional().isString().isLength({ min: 3, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('sections').optional().isArray(),
  body('settings').optional().isObject()
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
    const userId = req.user?.id || 'system';
    const updates = {};
    
    if (req.body.title) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.sections) updates.structure = JSON.stringify({ sections: req.body.sections });
    if (req.body.settings) updates.settings = JSON.stringify(req.body.settings);
    
    updates.updated_at = new Date().toISOString();

    // Update in database
    try {
      await executeQuery(
        async (prisma) => {
          const setParts = [];
          const values = [];
          
          Object.keys(updates).forEach(key => {
            if (key === 'updated_at') {
              setParts.push(`${key} = NOW()`);
            } else {
              setParts.push(`${key} = ?`);
              values.push(updates[key]);
            }
          });
          
          values.push(id);
          
          return await prisma.$executeRawUnsafe(
            `UPDATE forms SET ${setParts.join(', ')} WHERE id = ?`,
            ...values
          );
        },
        'updateForm'
      );
      
      // Get updated form
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, title, description, structure, settings, created_by, created_at, updated_at, is_active, version
            FROM forms 
            WHERE id = ${id}
          `;
        },
        'getUpdatedForm'
      );
      
      if (results && results.length > 0) {
        const form = results[0];
        form.sections = JSON.parse(form.structure).sections;
        form.settings = JSON.parse(form.settings);
        
        res.json({
          success: true,
          message: 'Form updated successfully',
          data: form
        });
      } else {
        throw new Error('Form not found after update');
      }
      
    } catch (error) {
      console.error('Database update failed:', error);
      return res.status(500).json({
        error: 'Failed to update form in database',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({
      error: 'Failed to update form',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/formx/forms/:id/duplicate
 * Duplicate an existing form
 */
router.post('/:id/duplicate', [
  param('id').isString(),
  body('title').optional().isString().isLength({ min: 3, max: 200 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    // Get original form
    const results = await executeQuery(
      async (prisma) => {
        return await prisma.$queryRaw`
          SELECT id, title, description, structure, settings, category
          FROM forms 
          WHERE id = ${id} AND is_active = 1
        `;
      },
      'getFormToDuplicate'
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }

    const originalForm = results[0];
    const newFormId = generateFormId();
    const newTitle = req.body.title || `${originalForm.title} (Copia)`;

    // Create duplicate form
    await executeQuery(
      async (prisma) => {
        return await prisma.$executeRaw`
          INSERT INTO forms (id, title, description, structure, settings, category, created_by, created_at, updated_at, is_active, version)
          VALUES (${newFormId}, ${newTitle}, ${originalForm.description}, ${originalForm.structure}, ${originalForm.settings}, ${originalForm.category}, ${userId}, NOW(), NOW(), 1, 1)
        `;
      },
      'duplicateForm'
    );

    // Get the new form
    const newFormResults = await executeQuery(
      async (prisma) => {
        return await prisma.$queryRaw`
          SELECT id, title, description, structure, settings, created_by, created_at, updated_at, is_active, version
          FROM forms 
          WHERE id = ${newFormId}
        `;
      },
      'getNewDuplicatedForm'
    );

    const newForm = newFormResults[0];
    newForm.sections = JSON.parse(newForm.structure).sections;
    newForm.settings = JSON.parse(newForm.settings);

    res.status(201).json({
      success: true,
      message: 'Form duplicated successfully',
      data: newForm
    });

  } catch (error) {
    console.error('Error duplicating form:', error);
    res.status(500).json({
      error: 'Failed to duplicate form',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/formx/forms/:id/analytics
 * Get analytics for a specific form
 */
router.get('/:id/analytics', [
  param('id').isString(),
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const period = req.query.period || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d': startDate.setDate(endDate.getDate() - 7); break;
      case '30d': startDate.setDate(endDate.getDate() - 30); break;
      case '90d': startDate.setDate(endDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
    }

    // Get analytics data
    const analytics = await executeQuery(
      async (prisma) => {
        return await prisma.$queryRaw`
          SELECT 
            COUNT(fa.id) as total_assignments,
            COUNT(CASE WHEN fa.status = 'completed' THEN 1 END) as completed_assignments,
            COUNT(CASE WHEN fa.status = 'pending' THEN 1 END) as pending_assignments,
            COUNT(CASE WHEN fa.status = 'expired' THEN 1 END) as expired_assignments,
            AVG(fs.submission_time_seconds) as avg_completion_time,
            AVG(fs.completion_percentage) as avg_completion_percentage
          FROM form_assignments fa
          LEFT JOIN form_submissions fs ON fa.id = fs.assignment_id
          WHERE fa.form_id = ${id} 
            AND fa.assigned_at >= ${startDate.toISOString()}
            AND fa.assigned_at <= ${endDate.toISOString()}
        `;
      },
      'getFormAnalytics'
    );

    const stats = analytics[0] || {};
    const completionRate = stats.total_assignments > 0 
      ? (stats.completed_assignments / stats.total_assignments * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        period: period,
        totalAssignments: parseInt(stats.total_assignments) || 0,
        completedAssignments: parseInt(stats.completed_assignments) || 0,
        pendingAssignments: parseInt(stats.pending_assignments) || 0,
        expiredAssignments: parseInt(stats.expired_assignments) || 0,
        completionRate: parseFloat(completionRate),
        avgCompletionTime: Math.round(stats.avg_completion_time) || 0,
        avgCompletionPercentage: Math.round(stats.avg_completion_percentage) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching form analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/formx/assignments/bulk
 * Bulk assign form to multiple patients
 */
router.post('/assignments/bulk', [
  body('formId').isString(),
  body('patientIds').isArray().notEmpty(),
  body('expiresInHours').optional().isInt({ min: 1, max: 168 }),
  body('message').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { formId, patientIds, expiresInHours = 72, message } = req.body;
    const assignedBy = req.user?.id || 'system';
    const assignments = [];

    for (const patientId of patientIds) {
      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const assignment = {
        id: `assignment_${Date.now()}_${crypto.randomUUID().split('-')[0]}_${patientId}`,
        formId: formId,
        patientId: patientId,
        token: token,
        assignedBy: assignedBy,
        assignedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'pending',
        message: message || 'Por favor complete este formulario antes de su próxima consulta.',
        remindersSent: 0,
        maxReminders: 3
      };

      // Store assignment
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO form_assignments (id, form_id, patient_id, token, assigned_by, assigned_at, expires_at, status, message, reminders_sent, max_reminders)
            VALUES (${assignment.id}, ${assignment.formId}, ${assignment.patientId}, ${assignment.token}, ${assignment.assignedBy}, ${assignment.assignedAt}, ${assignment.expiresAt}, ${assignment.status}, ${assignment.message}, ${assignment.remindersSent}, ${assignment.maxReminders})
          `;
        },
        'bulkAssignForm'
      );

      assignment.formUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/forms/${assignment.token}`;
      assignments.push(assignment);
    }

    res.status(201).json({
      success: true,
      message: `Form assigned to ${patientIds.length} patients successfully`,
      data: assignments
    });

  } catch (error) {
    console.error('Error bulk assigning form:', error);
    res.status(500).json({
      error: 'Failed to bulk assign form',
      details: error.message
    });
  }
});

/**
 * DELETE /api/v1/formx/forms/:id
 * Soft delete a form
 */
router.delete('/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const { id } = req.params;

    // Try database first
    try {
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            UPDATE forms 
            SET is_active = 0, updated_at = NOW()
            WHERE id = ${id}
          `;
        },
        'deleteForm'
      );
    } catch (error) {
      // Fallback to file system (mark as deleted)
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const formFile = path.join(__dirname, '../../data/forms', `${id}.json`);
        const formData = JSON.parse(await fs.readFile(formFile, 'utf8'));
        formData.isActive = false;
        formData.deletedAt = new Date().toISOString();
        
        await fs.writeFile(formFile, JSON.stringify(formData, null, 2));
      } catch (fsError) {
        return res.status(404).json({
          error: 'Form not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({
      error: 'Failed to delete form',
      details: error.message
    });
  }
});

module.exports = router;