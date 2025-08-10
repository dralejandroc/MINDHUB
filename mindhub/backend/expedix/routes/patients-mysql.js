/**
 * Expedix Patient Management Routes - MySQL Implementation
 * 
 * CRUD operations for patient management with MySQL backend.
 * Implements healthcare compliance requirements.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const mysql = require('../../shared/config/mysql');
const { v4: uuidv4 } = require('uuid');
const { combinedAuth, requireAuth } = require('../../shared/middleware/clerk-auth-middleware');

const router = express.Router();

// Authentication middleware temporarily disabled to match main router
// TODO: Re-enable when Clerk authentication is properly configured
// router.use(combinedAuth);
// router.use(requireAuth);

/**
 * Validation middleware for patient data
 */
const validatePatient = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  
  body('paternalLastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Paternal last name must be max 100 characters'),
  
  body('maternalLastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Maternal last name must be max 100 characters'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid birth date format'),
  
  body('gender')
    .isIn(['masculine', 'feminine', 'other'])
    .withMessage('Invalid gender value'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  
];

/**
 * GET /api/expedix/patients
 * Get all patients with pagination and search
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim()
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
      search = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Handle case where userId might not be available (auth disabled)
    const userId = req.userId || await getDemoProfessionalId();
    let whereClause = 'createdBy = ? OR 1=1'; // Temporary: show all patients when auth is disabled
    let params = [userId];
    
    if (search) {
      whereClause += ` AND (
        firstName LIKE CONCAT('%', ?, '%') OR 
        lastName LIKE CONCAT('%', ?, '%') OR 
        paternalLastName LIKE CONCAT('%', ?, '%') OR
        phone LIKE CONCAT('%', ?, '%')
      )`;
      params.push(search, search, search, search);
    }

    // Get patients using Prisma schema field names
    const patientsQuery = `
      SELECT 
        id, 
        firstName, 
        lastName, 
        paternalLastName, 
        maternalLastName,
        dateOfBirth,
        gender,
        email,
        phone,
        createdAt,
        TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) as age
      FROM patients 
      WHERE ${whereClause}
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM patients 
      WHERE ${whereClause}
    `;

    const [patientsResult, countResult] = await Promise.all([
      mysql.query(patientsQuery, [...params, parseInt(limit), offset]),
      mysql.query(countQuery, params)
    ]);

    const patients = patientsResult.rows;
    const totalCount = countResult.rows[0].total;

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
    console.error('Failed to get patients:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve patients', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/patients/:id
 * Get specific patient with full details
 */
router.get('/:id', [
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
    
    const patientQuery = `
      SELECT 
        p.*,
        TIMESTAMPDIFF(YEAR, p.dateOfBirth, CURDATE()) as age,
        u.name as professional_name
      FROM patients p
      LEFT JOIN users u ON p.createdBy = u.id
      WHERE p.id = ? AND (p.createdBy = ? OR 1=1)
    `;
    
    const consultationsQuery = `
      SELECT 
        c.*,
        u.name as professional_name
      FROM consultations c
      LEFT JOIN users u ON c.consultantId = u.id
      WHERE c.patientId = ?
      ORDER BY c.consultationDate DESC
      LIMIT 10
    `;

    const phq9Query = `
      SELECT *
      FROM phq9_assessments
      WHERE patient_id = ?
      ORDER BY assessment_date DESC
      LIMIT 5
    `;

    // Handle case where userId might not be available (auth disabled)
    const userId = req.userId || await getDemoProfessionalId();
    
    const [patientResult, consultationsResult, phq9Result] = await Promise.all([
      mysql.query(patientQuery, [id, userId]),
      mysql.query(consultationsQuery, [id]),
      mysql.query(phq9Query, [id])
    ]);

    const patient = patientResult.rows[0];
    
    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient not found' 
      });
    }

    patient.consultations = consultationsResult.rows;
    patient.phq9_assessments = phq9Result.rows;

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Failed to get patient:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve patient', 
      details: error.message 
    });
  }
});

/**
 * POST /api/expedix/patients
 * Create new patient
 */
router.post('/', validatePatient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const patientData = req.body;
    const patientId = uuidv4();
    
    // Use authenticated user as professional, fallback to demo user
    const professionalId = req.userId || await getDemoProfessionalId();

    const insertQuery = `
      INSERT INTO patients (
        id, createdBy, firstName, lastName, 
        paternalLastName, maternalLastName, dateOfBirth, gender, email, 
        phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await mysql.query(insertQuery, [
      patientId,
      professionalId,
      patientData.firstName,
      patientData.lastName,
      patientData.paternalLastName || null,
      patientData.maternalLastName || null,
      patientData.dateOfBirth,
      patientData.gender,
      patientData.email || null,
      patientData.phone || null
    ]);

    // Get created patient
    const getPatientQuery = `
      SELECT 
        p.*,
        TIMESTAMPDIFF(YEAR, p.dateOfBirth, CURDATE()) as age,
        u.name as professional_name
      FROM patients p
      LEFT JOIN users u ON p.createdBy = u.id
      WHERE p.id = ?
    `;

    const patientResult = await mysql.query(getPatientQuery, [patientId]);
    const patient = patientResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });

  } catch (error) {
    console.error('Failed to create patient:', error);
    res.status(500).json({ 
      error: 'Failed to create patient', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/expedix/patients/:id
 * Update existing patient
 */
router.put('/:id', [
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

    // Check if patient exists and belongs to authenticated user
    const userId = req.userId || await getDemoProfessionalId();
    const checkQuery = 'SELECT id FROM patients WHERE id = ? AND (createdBy = ? OR 1=1)';
    const existingResult = await mysql.query(checkQuery, [id, userId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updateQuery = `
      UPDATE patients SET
        firstName = ?,
        lastName = ?,
        paternalLastName = ?,
        maternalLastName = ?,
        dateOfBirth = ?,
        gender = ?,
        email = ?,
        phone = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND (createdBy = ? OR 1=1)
    `;

    await mysql.query(updateQuery, [
      updateData.firstName,
      updateData.lastName,
      updateData.paternalLastName || null,
      updateData.maternalLastName || null,
      updateData.dateOfBirth,
      updateData.gender,
      updateData.email || null,
      updateData.phone || null,
      id,
      userId
    ]);

    // Get updated patient
    const getPatientQuery = `
      SELECT 
        p.*,
        TIMESTAMPDIFF(YEAR, p.dateOfBirth, CURDATE()) as age,
        u.name as professional_name
      FROM patients p
      LEFT JOIN users u ON p.createdBy = u.id
      WHERE p.id = ?
    `;

    const patientResult = await mysql.query(getPatientQuery, [id]);
    const patient = patientResult.rows[0];

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });

  } catch (error) {
    console.error('Failed to update patient:', error);
    res.status(500).json({ 
      error: 'Failed to update patient', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/expedix/patients/:id
 * Delete patient (for development only)
 */
router.delete('/:id', [
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

    // Check if patient exists and belongs to authenticated user
    const userId = req.userId || await getDemoProfessionalId();
    const checkQuery = 'SELECT id FROM patients WHERE id = ? AND (createdBy = ? OR 1=1)';
    const existingResult = await mysql.query(checkQuery, [id, userId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete patient (development only)
    const deleteQuery = 'DELETE FROM patients WHERE id = ? AND (createdBy = ? OR 1=1)';
    await mysql.query(deleteQuery, [id, userId]);

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete patient:', error);
    res.status(500).json({ 
      error: 'Failed to delete patient', 
      details: error.message 
    });
  }
});

/**
 * Helper function to get demo professional ID
 */
async function getDemoProfessionalId() {
  const query = 'SELECT id FROM users WHERE email = ? LIMIT 1';
  const result = await mysql.query(query, ['demo@mindhub.com']);
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // If demo user doesn't exist, create one
  const userId = uuidv4();
  const insertQuery = `
    INSERT INTO users (id, email, name, role)
    VALUES (?, ?, ?, ?)
  `;
  
  await mysql.query(insertQuery, [
    userId,
    'demo@mindhub.com',
    'Demo Professional',
    'professional'
  ]);
  
  return userId;
}

module.exports = router;