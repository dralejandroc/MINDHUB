/**
 * Patient Document Management System for Expedix Hub
 * 
 * Secure file upload and document management system with encryption,
 * access control, and comprehensive document versioning
 */

const express = require('express');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const PDFParser = require('pdf-parse');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Document categories and types
 */
const DOCUMENT_CATEGORIES = {
  MEDICAL_RECORDS: {
    name: 'Registros Médicos',
    types: ['medical_history', 'lab_results', 'imaging', 'prescription', 'consultation_notes'],
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  },
  IDENTIFICATION: {
    name: 'Identificación',
    types: ['curp', 'ine', 'passport', 'birth_certificate', 'insurance_card'],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  CONSENT_FORMS: {
    name: 'Formularios de Consentimiento',
    types: ['informed_consent', 'privacy_notice', 'treatment_agreement', 'data_usage'],
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  CLINICAL_ASSESSMENTS: {
    name: 'Evaluaciones Clínicas',
    types: ['psychological_test', 'scale_result', 'assessment_report', 'progress_note'],
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  },
  INSURANCE: {
    name: 'Seguros',
    types: ['insurance_policy', 'claims', 'pre_authorization', 'coverage_letter'],
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  }
};

/**
 * Security levels for document access
 */
const SECURITY_LEVELS = {
  PUBLIC: 1,          // Patient and all healthcare providers
  RESTRICTED: 2,      // Only assigned healthcare providers
  CONFIDENTIAL: 3,    // Only psychiatrists and authorized personnel
  HIGHLY_CONFIDENTIAL: 4  // Only document owner and system admin
};

/**
 * Configure multer for secure file uploads
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { patientId } = req.params;
    const uploadPath = path.join(process.env.SECURE_UPLOAD_PATH || './uploads/patient-documents', patientId);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      logger.error('Failed to create upload directory', { error: error.message, uploadPath });
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const secureFilename = `${fileId}_${Date.now()}${extension}`;
    cb(null, secureFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const { category } = req.body;
  const categoryConfig = DOCUMENT_CATEGORIES[category];
  
  if (!categoryConfig) {
    return cb(new Error('Invalid document category'), false);
  }
  
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  if (!categoryConfig.allowedFormats.includes(extension)) {
    return cb(new Error(`File format .${extension} not allowed for category ${category}`), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB - will be checked per category
    files: 5 // Max 5 files per upload
  }
});

/**
 * POST /api/v1/expedix/patient-documents/:patientId/upload
 * Upload patient documents
 */
router.post('/:patientId/upload',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_documents']),
  upload.array('files', 5),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    body('category').isIn(Object.keys(DOCUMENT_CATEGORIES)).withMessage('Invalid document category'),
    body('documentType').isString().isLength({ min: 1, max: 50 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('securityLevel').optional().isInt({ min: 1, max: 4 }),
    body('tags').optional().isArray(),
    body('isConfidential').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
        }
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { patientId } = req.params;
      const {
        category,
        documentType,
        description,
        securityLevel = SECURITY_LEVELS.RESTRICTED,
        tags = [],
        isConfidential = false
      } = req.body;

      const userId = req.user?.id;
      const uploadedFiles = req.files;

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        // Clean up uploaded files
        await Promise.all(uploadedFiles.map(file => fs.unlink(file.path).catch(() => {})));
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      const categoryConfig = DOCUMENT_CATEGORIES[category];

      // Process and store documents
      const processedDocuments = await executeTransaction(
        uploadedFiles.map(file => async (prisma, results) => {
          // Check file size against category limits
          if (file.size > categoryConfig.maxSize) {
            await fs.unlink(file.path).catch(() => {});
            throw new Error(`File ${file.originalname} exceeds size limit for category ${category}`);
          }

          // Extract file metadata
          const metadata = await extractFileMetadata(file);
          
          // Encrypt file if it's confidential
          let encryptionKey = null;
          if (isConfidential || securityLevel >= SECURITY_LEVELS.CONFIDENTIAL) {
            encryptionKey = await encryptFile(file.path);
          }

          // Generate document hash for integrity verification
          const documentHash = await generateFileHash(file.path);

          // Create document record
          const document = await prisma.patientDocument.create({
            data: {
              id: uuidv4(),
              patientId: patientId,
              originalName: file.originalname,
              fileName: file.filename,
              filePath: file.path,
              fileSize: file.size,
              mimeType: file.mimetype,
              category: category,
              documentType: documentType,
              description: description,
              securityLevel: securityLevel,
              isConfidential: isConfidential,
              documentHash: documentHash,
              encryptionKey: encryptionKey,
              metadata: metadata,
              tags: tags,
              uploadedBy: userId,
              uploadedAt: new Date(),
              isActive: true,
              version: 1
            }
          });

          // Create document access log
          await prisma.documentAccessLog.create({
            data: {
              id: uuidv4(),
              documentId: document.id,
              userId: userId,
              action: 'UPLOAD',
              accessedAt: new Date(),
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }
          });

          return document;
        }),
        'uploadPatientDocuments'
      );

      // Log document upload
      logger.info('Patient documents uploaded', {
        patientId: patientId,
        medicalRecordNumber: patient.medicalRecordNumber,
        documentCount: processedDocuments.length,
        category: category,
        uploadedBy: userId,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
      });

      // Audit log
      await auditLogger.logDataModification(
        userId,
        'PATIENT_DOCUMENTS_UPLOAD',
        {
          patientId: patientId,
          medicalRecordNumber: patient.medicalRecordNumber,
          documents: processedDocuments.map(doc => ({
            documentId: doc.id,
            originalName: doc.originalName,
            category: doc.category,
            documentType: doc.documentType,
            securityLevel: doc.securityLevel
          }))
        }
      );

      res.status(201).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          patient: patient,
          documents: processedDocuments.map(doc => ({
            id: doc.id,
            originalName: doc.originalName,
            category: doc.category,
            documentType: doc.documentType,
            fileSize: doc.fileSize,
            uploadedAt: doc.uploadedAt,
            securityLevel: doc.securityLevel
          }))
        }
      });

    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }

      logger.error('Failed to upload patient documents', {
        error: error.message,
        stack: error.stack,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to upload documents',
        message: 'An error occurred while uploading patient documents'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/patient-documents/:patientId
 * Get all documents for a patient
 */
router.get('/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_documents']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('category').optional().isIn(Object.keys(DOCUMENT_CATEGORIES)),
    query('documentType').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        category,
        documentType,
        page = 1,
        limit = 20
      } = req.query;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Build where clause
      const whereClause = {
        patientId: patientId,
        isActive: true
      };

      if (category) whereClause.category = category;
      if (documentType) whereClause.documentType = documentType;

      // Filter by security level based on user role
      if (userRole === 'patient') {
        // Patients can only see their own non-confidential documents
        whereClause.securityLevel = { lte: SECURITY_LEVELS.RESTRICTED };
        whereClause.isConfidential = false;
        
        // Additional check: patient can only access their own documents
        if (userId !== patientId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'Patients can only access their own documents'
          });
        }
      } else if (userRole === 'nurse') {
        // Nurses have limited access to confidential documents
        whereClause.securityLevel = { lte: SECURITY_LEVELS.CONFIDENTIAL };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [documents, totalCount] = await executeTransaction([
        (prisma) => prisma.patientDocument.findMany({
          where: whereClause,
          include: {
            uploadedByUser: {
              select: {
                name: true,
                role: true
              }
            },
            _count: {
              select: {
                accessLogs: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { uploadedAt: 'desc' }
        }),
        (prisma) => prisma.patientDocument.count({ where: whereClause })
      ], 'getPatientDocuments');

      // Log document access
      logger.info('Patient documents accessed', {
        patientId: patientId,
        accessedBy: userId,
        userRole: userRole,
        documentCount: documents.length,
        filters: { category, documentType }
      });

      // Create access logs for viewed documents
      if (documents.length > 0) {
        await executeQuery(
          (prisma) => prisma.documentAccessLog.createMany({
            data: documents.map(doc => ({
              id: uuidv4(),
              documentId: doc.id,
              userId: userId,
              action: 'VIEW_LIST',
              accessedAt: new Date(),
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }))
          }),
          'logDocumentListAccess'
        );
      }

      res.json({
        success: true,
        data: {
          documents: documents.map(doc => ({
            id: doc.id,
            originalName: doc.originalName,
            category: doc.category,
            documentType: doc.documentType,
            description: doc.description,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            securityLevel: doc.securityLevel,
            isConfidential: doc.isConfidential,
            tags: doc.tags,
            uploadedAt: doc.uploadedAt,
            uploadedBy: doc.uploadedByUser,
            version: doc.version,
            accessCount: doc._count.accessLogs,
            // Don't expose file paths or encryption keys
            metadata: doc.metadata
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          },
          categories: DOCUMENT_CATEGORIES
        }
      });

    } catch (error) {
      logger.error('Failed to get patient documents', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve documents',
        message: 'An error occurred while retrieving patient documents'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/patient-documents/:patientId/document/:documentId/download
 * Download a specific document
 */
router.get('/:patientId/document/:documentId/download',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_documents']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('documentId').isUUID().withMessage('Invalid document ID format')
  ],
  async (req, res) => {
    try {
      const { patientId, documentId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get document with security checks
      const document = await executeQuery(
        (prisma) => prisma.patientDocument.findFirst({
          where: {
            id: documentId,
            patientId: patientId,
            isActive: true
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        `getDocumentForDownload(${documentId})`
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Security level checks
      if (userRole === 'patient') {
        if (userId !== patientId || document.isConfidential || document.securityLevel > SECURITY_LEVELS.RESTRICTED) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'Insufficient permissions to access this document'
          });
        }
      } else if (userRole === 'nurse' && document.securityLevel > SECURITY_LEVELS.CONFIDENTIAL) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Document security level too high for your role'
        });
      }

      // Check if file exists
      try {
        await fs.access(document.filePath);
      } catch (error) {
        logger.error('Document file not found on disk', {
          documentId: documentId,
          filePath: document.filePath
        });
        return res.status(404).json({
          success: false,
          error: 'Document file not found'
        });
      }

      // Decrypt file if necessary
      let fileToSend = document.filePath;
      if (document.encryptionKey) {
        fileToSend = await decryptFile(document.filePath, document.encryptionKey);
      }

      // Log document download
      await executeQuery(
        (prisma) => prisma.documentAccessLog.create({
          data: {
            id: uuidv4(),
            documentId: documentId,
            userId: userId,
            action: 'DOWNLOAD',
            accessedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        }),
        'logDocumentDownload'
      );

      logger.info('Document downloaded', {
        documentId: documentId,
        patientId: patientId,
        downloadedBy: userId,
        userRole: userRole,
        originalName: document.originalName
      });

      // Set appropriate headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.fileSize);

      // Stream file to client
      const fileStream = require('fs').createReadStream(fileToSend);
      fileStream.pipe(res);

      // Clean up temporary decrypted file
      if (fileToSend !== document.filePath) {
        fileStream.on('end', () => {
          fs.unlink(fileToSend).catch(() => {});
        });
      }

    } catch (error) {
      logger.error('Failed to download document', {
        error: error.message,
        documentId: req.params.documentId,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to download document',
        message: 'An error occurred while downloading the document'
      });
    }
  }
);

/**
 * PUT /api/v1/expedix/patient-documents/:patientId/document/:documentId
 * Update document metadata
 */
router.put('/:patientId/document/:documentId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_documents']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('documentId').isUUID().withMessage('Invalid document ID format'),
    body('description').optional().isString().isLength({ max: 500 }),
    body('tags').optional().isArray(),
    body('securityLevel').optional().isInt({ min: 1, max: 4 }),
    body('isConfidential').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { patientId, documentId } = req.params;
      const { description, tags, securityLevel, isConfidential } = req.body;
      const userId = req.user?.id;

      const updatedDocument = await executeQuery(
        (prisma) => prisma.patientDocument.update({
          where: {
            id: documentId,
            patientId: patientId,
            isActive: true
          },
          data: {
            ...(description !== undefined && { description }),
            ...(tags !== undefined && { tags }),
            ...(securityLevel !== undefined && { securityLevel }),
            ...(isConfidential !== undefined && { isConfidential }),
            updatedAt: new Date()
          }
        }),
        `updatePatientDocument(${documentId})`
      );

      // Log document update
      await executeQuery(
        (prisma) => prisma.documentAccessLog.create({
          data: {
            id: uuidv4(),
            documentId: documentId,
            userId: userId,
            action: 'UPDATE',
            accessedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        }),
        'logDocumentUpdate'
      );

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: updatedDocument
      });

    } catch (error) {
      logger.error('Failed to update document', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update document',
        message: 'An error occurred while updating the document'
      });
    }
  }
);

/**
 * DELETE /api/v1/expedix/patient-documents/:patientId/document/:documentId
 * Soft delete a document
 */
router.delete('/:patientId/document/:documentId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'admin'], ['delete:patient_documents']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    param('documentId').isUUID().withMessage('Invalid document ID format'),
    body('reason').optional().isString().isLength({ max: 200 })
  ],
  async (req, res) => {
    try {
      const { patientId, documentId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const deletedDocument = await executeQuery(
        (prisma) => prisma.patientDocument.update({
          where: {
            id: documentId,
            patientId: patientId,
            isActive: true
          },
          data: {
            isActive: false,
            deletedBy: userId,
            deletedAt: new Date(),
            deletionReason: reason
          }
        }),
        `deletePatientDocument(${documentId})`
      );

      // Log document deletion
      await executeQuery(
        (prisma) => prisma.documentAccessLog.create({
          data: {
            id: uuidv4(),
            documentId: documentId,
            userId: userId,
            action: 'DELETE',
            accessedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { reason }
          }
        }),
        'logDocumentDeletion'
      );

      res.json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          documentId: documentId,
          deletedAt: deletedDocument.deletedAt
        }
      });

    } catch (error) {
      logger.error('Failed to delete document', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete document',
        message: 'An error occurred while deleting the document'
      });
    }
  }
);

/**
 * Helper functions
 */

async function extractFileMetadata(file) {
  const metadata = {
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    extension: path.extname(file.originalname).toLowerCase()
  };

  try {
    if (file.mimetype.startsWith('image/')) {
      const imageInfo = await sharp(file.path).metadata();
      metadata.dimensions = {
        width: imageInfo.width,
        height: imageInfo.height
      };
    } else if (file.mimetype === 'application/pdf') {
      const pdfData = await fs.readFile(file.path);
      const pdfInfo = await PDFParser(pdfData);
      metadata.pageCount = pdfInfo.numpages;
      metadata.textContent = pdfInfo.text.substring(0, 1000); // First 1000 chars for search
    }
  } catch (error) {
    logger.warn('Failed to extract file metadata', {
      error: error.message,
      fileName: file.originalname
    });
  }

  return metadata;
}

async function generateFileHash(filePath) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = await fs.readFile(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

async function encryptFile(filePath) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key, iv);
  
  const fileData = await fs.readFile(filePath);
  const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);
  
  // Overwrite original file with encrypted data
  await fs.writeFile(filePath, encrypted);
  
  // Return encryption key (to be stored securely in database)
  return {
    key: key.toString('hex'),
    iv: iv.toString('hex'),
    algorithm: algorithm
  };
}

async function decryptFile(encryptedFilePath, encryptionInfo) {
  const { key, iv, algorithm } = encryptionInfo;
  
  const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  
  const encryptedData = await fs.readFile(encryptedFilePath);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  
  // Create temporary decrypted file
  const tempFilePath = `${encryptedFilePath}.temp`;
  await fs.writeFile(tempFilePath, decrypted);
  
  return tempFilePath;
}

module.exports = router;