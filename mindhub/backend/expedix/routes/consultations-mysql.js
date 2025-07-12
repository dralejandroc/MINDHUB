/**
 * Expedix Consultation Management Routes - MySQL Implementation
 * 
 * CRUD operations for consultations and prescriptions with MySQL backend.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const mysql = require('../../shared/config/mysql');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * Validation middleware for consultation data
 */
const validateConsultation = [
  body('patient_id')
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('chief_complaint')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Chief complaint must be between 5 and 500 characters'),
  
  body('current_illness')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Current illness must be max 2000 characters'),
    
  body('diagnosis_code')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Diagnosis code must be max 10 characters'),
    
  body('diagnosis_text')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Diagnosis text must be max 500 characters'),
    
  body('treatment_plan')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Treatment plan must be max 2000 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must be max 2000 characters'),

  body('vital_signs.blood_pressure_systolic')
    .optional()
    .isInt({ min: 60, max: 300 })
    .withMessage('Invalid systolic blood pressure'),
    
  body('vital_signs.blood_pressure_diastolic')
    .optional()
    .isInt({ min: 30, max: 200 })
    .withMessage('Invalid diastolic blood pressure'),
    
  body('vital_signs.heart_rate')
    .optional()
    .isInt({ min: 30, max: 220 })
    .withMessage('Invalid heart rate'),
    
  body('vital_signs.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('Invalid temperature'),
    
  body('vital_signs.weight')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Invalid weight'),
    
  body('vital_signs.height')
    .optional()
    .isFloat({ min: 30, max: 250 })
    .withMessage('Invalid height')
];

/**
 * GET /api/expedix/consultations
 * Get all consultations with pagination
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patient_id').optional().isUUID().withMessage('Invalid patient ID')
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
      patient_id
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '1=1';
    let params = [];
    
    if (patient_id) {
      whereClause += ` AND c.patient_id = ?`;
      params.push(patient_id);
    }

    const consultationsQuery = `
      SELECT 
        c.*,
        p.first_name,
        p.paternal_last_name,
        p.maternal_last_name,
        u.name as professional_name,
        vs.blood_pressure_systolic,
        vs.blood_pressure_diastolic,
        vs.heart_rate,
        vs.temperature,
        vs.weight,
        vs.height
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN users u ON c.professional_id = u.id
      LEFT JOIN vital_signs vs ON c.id = vs.consultation_id
      WHERE ${whereClause}
      ORDER BY c.consultation_date DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM consultations c
      WHERE ${whereClause}
    `;

    const [consultationsResult, countResult] = await Promise.all([
      mysql.query(consultationsQuery, [...params, parseInt(limit), offset]),
      mysql.query(countQuery, params)
    ]);

    const consultations = consultationsResult.rows;
    const totalCount = countResult.rows[0].total;

    res.json({
      success: true,
      data: consultations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Failed to get consultations:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve consultations', 
      details: error.message 
    });
  }
});

/**
 * GET /api/expedix/consultations/:id
 * Get specific consultation with full details
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid consultation ID format')
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
    
    const consultationQuery = `
      SELECT 
        c.*,
        p.first_name,
        p.paternal_last_name,
        p.maternal_last_name,
        p.birth_date,
        u.name as professional_name,
        vs.blood_pressure_systolic,
        vs.blood_pressure_diastolic,
        vs.heart_rate,
        vs.temperature,
        vs.weight,
        vs.height
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN users u ON c.professional_id = u.id
      LEFT JOIN vital_signs vs ON c.id = vs.consultation_id
      WHERE c.id = ?
    `;
    
    const prescriptionsQuery = `
      SELECT *
      FROM prescriptions
      WHERE consultation_id = ?
      ORDER BY created_at DESC
    `;

    const [consultationResult, prescriptionsResult] = await Promise.all([
      mysql.query(consultationQuery, [id]),
      mysql.query(prescriptionsQuery, [id])
    ]);

    const consultation = consultationResult.rows[0];
    
    if (!consultation) {
      return res.status(404).json({ 
        error: 'Consultation not found' 
      });
    }

    consultation.prescriptions = prescriptionsResult.rows;

    res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    console.error('Failed to get consultation:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve consultation', 
      details: error.message 
    });
  }
});

/**
 * POST /api/expedix/consultations
 * Create new consultation with vital signs and prescriptions
 */
router.post('/', validateConsultation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const consultationData = req.body;
    const consultationId = uuidv4();
    
    // Get demo professional ID
    const professionalId = await getDemoProfessionalId();

    try {
      // Insert consultation
      const insertConsultationQuery = `
        INSERT INTO consultations (
          id, patient_id, professional_id, chief_complaint, 
          current_illness, diagnosis_code, diagnosis_text, treatment_plan, notes,
          consultation_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await mysql.query(insertConsultationQuery, [
        consultationId,
        consultationData.patient_id,
        professionalId,
        consultationData.chief_complaint,
        consultationData.current_illness || null,
        consultationData.diagnosis_code || null,
        consultationData.diagnosis_text || null,
        consultationData.treatment_plan || null,
        consultationData.notes || null,
        new Date(),
        'completed'
      ]);

      // Insert vital signs if provided
      if (consultationData.vital_signs) {
        const vitalSignsId = uuidv4();
        const insertVitalSignsQuery = `
          INSERT INTO vital_signs (
            id, consultation_id, blood_pressure_systolic, blood_pressure_diastolic,
            heart_rate, temperature, weight, height
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await mysql.query(insertVitalSignsQuery, [
          vitalSignsId,
          consultationId,
          consultationData.vital_signs.blood_pressure_systolic || null,
          consultationData.vital_signs.blood_pressure_diastolic || null,
          consultationData.vital_signs.heart_rate || null,
          consultationData.vital_signs.temperature || null,
          consultationData.vital_signs.weight || null,
          consultationData.vital_signs.height || null
        ]);
      }

      // Insert prescriptions if provided
      if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
        for (const prescription of consultationData.prescriptions) {
          const prescriptionId = uuidv4();
          const insertPrescriptionQuery = `
            INSERT INTO prescriptions (
              id, consultation_id, patient_id, professional_id,
              medication_name, dosage, frequency, duration,
              instructions, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `;

          await mysql.query(insertPrescriptionQuery, [
            prescriptionId,
            consultationId,
            consultationData.patient_id,
            professionalId,
            prescription.medication_name,
            prescription.dosage,
            prescription.frequency,
            prescription.duration,
            prescription.instructions || null
          ]);
        }
      }


      // Get created consultation with details
      const getConsultationQuery = `
        SELECT 
          c.*,
          p.first_name,
          p.paternal_last_name,
          p.maternal_last_name,
          u.name as professional_name
        FROM consultations c
        LEFT JOIN patients p ON c.patient_id = p.id
        LEFT JOIN users u ON c.professional_id = u.id
        WHERE c.id = ?
      `;

      const consultationResult = await mysql.query(getConsultationQuery, [consultationId]);
      const consultation = consultationResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Consultation created successfully',
        data: consultation
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Failed to create consultation:', error);
    res.status(500).json({ 
      error: 'Failed to create consultation', 
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