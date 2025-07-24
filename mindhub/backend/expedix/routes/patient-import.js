/**
 * Patient Import API Routes for Expedix Hub
 * 
 * Comprehensive patient bulk import system with:
 * - CSV/Excel file upload
 * - Data validation and preview
 * - Duplicate detection
 * - Batch processing
 * - Template generation
 */

const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { body, param, query, validationResult } = require('express-validator');

const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

// Import utilities
const { 
  generateHeaders, 
  generateCSVTemplate, 
  generateExampleData, 
  generateDocumentation 
} = require('../../shared/utils/patient-import-template');

const { 
  validateImportData, 
  calculateCompleteness 
} = require('../../shared/utils/patient-import-validator');

const { generateReadablePatientId } = require('../../shared/utils/patient-id-generator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `import_${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV and Excel files
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV (.csv) y Excel (.xlsx, .xls)'), false);
    }
  }
});

/**
 * GET /api/v1/expedix/patient-import/template
 * Download CSV template for patient import
 */
router.get('/template', 
  ...middleware.utils.forHub('expedix'),
  [
    query('format').optional().isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
    query('includeExamples').optional().isBoolean().withMessage('includeExamples must be boolean'),
    query('includeClinic').optional().isBoolean().withMessage('includeClinic must be boolean')
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
        format = 'csv', 
        includeExamples = 'true', 
        includeClinic = 'true' 
      } = req.query;

      const includeExamplesBool = includeExamples === 'true';
      const includeClinicBool = includeClinic === 'true';

      if (format === 'csv') {
        // Generate CSV template
        const csvContent = generateCSVTemplate(includeClinicBool, includeExamplesBool);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_pacientes_mindhub.csv"');
        res.send('\ufeff' + csvContent); // Add BOM for UTF-8 recognition
        
      } else if (format === 'excel') {
        // Generate Excel template
        const headers = generateHeaders(includeClinicBool);
        const workbook = xlsx.utils.book_new();
        
        // Create headers worksheet
        const headersData = [
          headers.map(h => h.label), // Row 1: Labels
          headers.map(h => h.field), // Row 2: Field names
          headers.map(h => h.validation) // Row 3: Validation rules
        ];
        
        if (includeExamplesBool) {
          const examples = generateExampleData(5, includeClinicBool);
          examples.forEach(example => {
            const row = headers.map(h => example[h.field] || '');
            headersData.push(row);
          });
        }
        
        const worksheet = xlsx.utils.aoa_to_sheet(headersData);
        
        // Set column widths
        worksheet['!cols'] = headers.map(() => ({ width: 20 }));
        
        // Style header rows
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        for (let row = 0; row < 3; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
            if (worksheet[cellAddress]) {
              worksheet[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: row === 0 ? "366092" : "D9E2F3" } }
              };
            }
          }
        }
        
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Pacientes');
        
        // Create documentation worksheet
        const docContent = generateDocumentation();
        const docLines = docContent.split('\n').map(line => [line]);
        const docWorksheet = xlsx.utils.aoa_to_sheet(docLines);
        docWorksheet['!cols'] = [{ width: 80 }];
        
        xlsx.utils.book_append_sheet(workbook, docWorksheet, 'Instrucciones');
        
        // Generate Excel buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_pacientes_mindhub.xlsx"');
        res.send(buffer);
      }

      // Log template download
      logger.info('Patient import template downloaded', {
        userId: req.user?.id,
        format: format,
        includeExamples: includeExamplesBool,
        includeClinic: includeClinicBool,
        ipAddress: req.ip
      });

    } catch (error) {
      logger.error('Failed to generate import template', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate template',
        message: 'An error occurred while generating the import template'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/patient-import/validate
 * Upload and validate patient import file
 */
router.post('/validate',
  ...middleware.utils.forHub('expedix'),
  upload.single('importFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a CSV or Excel file to upload'
        });
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      let rawData = [];

      try {
        if (fileExtension === '.csv') {
          // Parse CSV file
          rawData = await parseCSVFile(filePath);
        } else if (['.xlsx', '.xls'].includes(fileExtension)) {
          // Parse Excel file
          rawData = await parseExcelFile(filePath);
        } else {
          throw new Error('Unsupported file format');
        }

        // Validate the parsed data
        const validationResult = await validateImportData(rawData);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Log validation attempt
        logger.info('Patient import validation completed', {
          userId: req.user?.id,
          fileName: req.file.originalname,
          totalRows: validationResult.summary.totalRows,
          validRows: validationResult.summary.validRows,
          invalidRows: validationResult.summary.invalidRows,
          duplicates: validationResult.summary.duplicates,
          ipAddress: req.ip
        });

        res.json({
          success: true,
          message: 'File validation completed',
          data: {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            validationResult: validationResult
          }
        });

      } catch (parseError) {
        // Clean up uploaded file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw parseError;
      }

    } catch (error) {
      logger.error('Failed to validate import file', {
        error: error.message,
        fileName: req.file?.originalname,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate import file',
        message: error.message || 'An error occurred while processing the import file'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/patient-import/process
 * Process validated data and create patients
 */
router.post('/process',
  ...middleware.utils.forHub('expedix'),
  [
    body('validatedData').isArray().withMessage('Validated data must be an array'),
    body('options.skipDuplicates').optional().isBoolean().withMessage('skipDuplicates must be boolean'),
    body('options.updateExisting').optional().isBoolean().withMessage('updateExisting must be boolean')
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

      const { validatedData, options = {} } = req.body;
      const userId = req.user?.id;

      if (!validatedData || validatedData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No validated data provided',
          message: 'Please validate your import data first'
        });
      }

      const processResult = {
        success: true,
        summary: {
          totalRows: validatedData.length,
          processed: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          failed: 0
        },
        results: [],
        errors: []
      };

      // Process patients in batches
      const batchSize = 10;
      for (let i = 0; i < validatedData.length; i += batchSize) {
        const batch = validatedData.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            const patientData = item.cleanedData;
            processResult.summary.processed++;

            // Check for existing patient
            const existingPatient = await executeQuery(
              (prisma) => prisma.patient.findFirst({
                where: {
                  firstName: patientData.first_name,
                  paternalLastName: patientData.paternal_last_name,
                  dateOfBirth: new Date(patientData.birth_date)
                }
              }),
              'checkExistingPatient'
            );

            if (existingPatient) {
              if (options.updateExisting) {
                // Update existing patient
                const updatedPatient = await executeQuery(
                  (prisma) => prisma.patient.update({
                    where: { id: existingPatient.id },
                    data: {
                      firstName: patientData.first_name,
                      lastName: patientData.paternal_last_name,
                      paternalLastName: patientData.paternal_last_name,
                      maternalLastName: patientData.maternal_last_name,
                      email: patientData.email,
                      phone: patientData.cell_phone,
                      address: patientData.address,
                      city: patientData.city,
                      state: patientData.state,
                      postalCode: patientData.postal_code,
                      curp: patientData.curp,
                      rfc: patientData.rfc,
                      bloodType: patientData.blood_type,
                      allergies: patientData.allergies,
                      emergencyContactName: patientData.emergency_contact_name,
                      emergencyContactPhone: patientData.emergency_contact_phone,
                      clinicId: patientData.clinic_id
                    }
                  }),
                  'updatePatient'
                );

                processResult.summary.updated++;
                processResult.results.push({
                  rowIndex: item.rowIndex,
                  action: 'updated',
                  patientId: updatedPatient.id,
                  message: 'Patient updated successfully'
                });

              } else if (options.skipDuplicates) {
                processResult.summary.skipped++;
                processResult.results.push({
                  rowIndex: item.rowIndex,
                  action: 'skipped',
                  patientId: existingPatient.id,
                  message: 'Patient already exists, skipped'
                });
              } else {
                processResult.summary.failed++;
                processResult.errors.push({
                  rowIndex: item.rowIndex,
                  error: 'Duplicate patient found',
                  message: `Patient ${patientData.first_name} ${patientData.paternal_last_name} already exists`
                });
              }
            } else {
              // Create new patient
              const readablePatientId = await generateReadablePatientId({
                firstName: patientData.first_name,
                paternalLastName: patientData.paternal_last_name,
                dateOfBirth: patientData.birth_date,
                clinicId: patientData.clinic_id
              });

              const newPatient = await executeQuery(
                (prisma) => prisma.patient.create({
                  data: {
                    id: readablePatientId,
                    firstName: patientData.first_name,
                    lastName: patientData.paternal_last_name,
                    paternalLastName: patientData.paternal_last_name,
                    maternalLastName: patientData.maternal_last_name,
                    dateOfBirth: new Date(patientData.birth_date),
                    gender: patientData.gender,
                    email: patientData.email,
                    phone: patientData.cell_phone,
                    address: patientData.address,
                    city: patientData.city,
                    state: patientData.state,
                    postalCode: patientData.postal_code,
                    curp: patientData.curp,
                    rfc: patientData.rfc,
                    bloodType: patientData.blood_type,
                    allergies: patientData.allergies,
                    emergencyContactName: patientData.emergency_contact_name,
                    emergencyContactPhone: patientData.emergency_contact_phone,
                    clinicId: patientData.clinic_id,
                    ...(userId && { createdBy: userId })
                  }
                }),
                'createPatient'
              );

              processResult.summary.created++;
              processResult.results.push({
                rowIndex: item.rowIndex,
                action: 'created',
                patientId: newPatient.id,
                message: 'Patient created successfully'
              });
            }

          } catch (itemError) {
            processResult.summary.failed++;
            processResult.errors.push({
              rowIndex: item.rowIndex,
              error: itemError.message,
              message: 'Failed to process patient data'
            });
          }
        }
      }

      // Determine overall success
      processResult.success = processResult.summary.failed === 0;

      // Log import completion
      logger.info('Patient bulk import completed', {
        userId: userId,
        summary: processResult.summary,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Import processing completed',
        data: processResult
      });

    } catch (error) {
      logger.error('Failed to process patient import', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to process import',
        message: 'An error occurred while processing the import'
      });
    }
  }
);

/**
 * Helper function to parse CSV files
 * @param {string} filePath - Path to CSV file 
 * @returns {Promise<Array>} Parsed data array
 */
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = fs.createReadStream(filePath);
    
    stream
      .pipe(csvParser({
        skipEmptyLines: true,
        skipLinesWithError: false
      }))
      .on('data', (data) => {
        // Skip comment lines that start with #
        if (!Object.values(data).some(value => String(value).startsWith('#'))) {
          results.push(data);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

/**
 * Helper function to parse Excel files
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Parsed data array
 */
function parseExcelFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON, skipping header rows
      const jsonData = xlsx.utils.sheet_to_json(worksheet, {
        header: 1, // Use array of arrays
        skipHeader: false
      });

      // Find the header row (should contain field names)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && row.includes('first_name')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('No valid header row found. Expected field names like "first_name".');
      }

      const headers = jsonData[headerRowIndex];
      const dataRows = jsonData.slice(headerRowIndex + 1);

      // Convert to objects
      const results = dataRows
        .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
              obj[header] = row[index];
            }
          });
          return obj;
        });

      resolve(results);
    } catch (error) {
      reject(new Error(`Excel parsing error: ${error.message}`));
    }
  });
}

module.exports = router;