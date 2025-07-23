/**
 * Document Processing Routes for Resources Hub
 * 
 * Handles automatic text processing, PDF generation, and branding
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, requireRole } = require('../../shared/middleware');
const PersonalizationService = require('../../resources/services/PersonalizationService');
const StorageQuotaService = require('../services/StorageQuotaService');
const FileStorageService = require('../services/FileStorageService');
const prisma = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.'));
    }
  }
});

// Initialize services
const personalizationService = new PersonalizationService();
const storageQuotaService = new StorageQuotaService();
const fileStorageService = new FileStorageService();

/**
 * Process text and generate PDF
 * POST /api/resources/process-text
 */
router.post('/process-text', authenticateToken, async (req, res) => {
  try {
    const { text, template, variables, brandingOptions } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    // Process text and generate PDF
    const result = await personalizationService.processTextAutomatically(text, {
      template: template || 'default',
      formatting: true,
      variables: variables || {},
      brandingOptions: brandingOptions || {}
    });

    // Check storage quota before saving
    const quotaCheck = await storageQuotaService.validateFileUpload(userId, {
      size: result.pdfBuffer.length,
      mimetype: 'application/pdf'
    });

    if (!quotaCheck.valid) {
      return res.status(400).json({
        success: false,
        error: quotaCheck.error
      });
    }

    // Save the generated PDF
    const fileMetadata = await fileStorageService.uploadFile({
      buffer: result.pdfBuffer,
      originalname: `processed_${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      size: result.pdfBuffer.length
    }, {
      resourceType: 'generated_documents',
      userId: userId,
      template: template
    });

    // Update storage usage
    await storageQuotaService.updateStorageUsage(userId, result.pdfBuffer.length, 'add');

    // Create resource record in database
    const resource = await prisma.resource.create({
      data: {
        title: `Documento Procesado - ${new Date().toLocaleDateString('es-MX')}`,
        type: 'generated_document',
        filePath: fileMetadata.filePath,
        fileSize: fileMetadata.fileSize,
        mimeType: 'application/pdf',
        metadata: {
          template: template,
          wordCount: result.wordCount,
          estimatedPages: result.estimatedPages,
          variables: Object.keys(variables || {})
        },
        createdById: userId,
        lastAccessedAt: new Date()
      }
    });

    logger.info('Text processed and PDF generated', {
      userId,
      resourceId: resource.id,
      template,
      wordCount: result.wordCount
    });

    res.json({
      success: true,
      data: {
        resourceId: resource.id,
        preview: result.preview,
        wordCount: result.wordCount,
        estimatedPages: result.estimatedPages,
        fileSize: fileMetadata.fileSize,
        downloadUrl: `/api/resources/download/${resource.id}`
      }
    });

  } catch (error) {
    logger.error('Text processing failed', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to process text'
    });
  }
});

/**
 * Add branding to existing PDF
 * POST /api/resources/add-branding
 */
router.post('/add-branding', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    const { clinicSettings } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required'
      });
    }

    // Parse clinic settings if provided as string
    const settings = typeof clinicSettings === 'string' 
      ? JSON.parse(clinicSettings) 
      : clinicSettings || {};

    // Add branding to PDF
    const brandedPdfBuffer = await personalizationService.addBrandingToPDF(
      file.buffer,
      settings
    );

    // Check storage quota
    const quotaCheck = await storageQuotaService.validateFileUpload(userId, {
      size: brandedPdfBuffer.length,
      mimetype: 'application/pdf'
    });

    if (!quotaCheck.valid) {
      return res.status(400).json({
        success: false,
        error: quotaCheck.error
      });
    }

    // Save branded PDF
    const fileMetadata = await fileStorageService.uploadFile({
      buffer: brandedPdfBuffer,
      originalname: `branded_${file.originalname}`,
      mimetype: 'application/pdf',
      size: brandedPdfBuffer.length
    }, {
      resourceType: 'branded_documents',
      userId: userId,
      original: file.originalname
    });

    // Update storage usage
    await storageQuotaService.updateStorageUsage(userId, brandedPdfBuffer.length, 'add');

    // Create resource record
    const resource = await prisma.resource.create({
      data: {
        title: `${file.originalname} - Con Marca`,
        type: 'branded_document',
        filePath: fileMetadata.filePath,
        fileSize: fileMetadata.fileSize,
        mimeType: 'application/pdf',
        metadata: {
          originalFile: file.originalname,
          brandingApplied: true,
          clinicName: settings.clinicName
        },
        createdById: userId,
        lastAccessedAt: new Date()
      }
    });

    logger.info('Branding added to PDF', {
      userId,
      resourceId: resource.id,
      originalFile: file.originalname
    });

    res.json({
      success: true,
      data: {
        resourceId: resource.id,
        fileSize: fileMetadata.fileSize,
        downloadUrl: `/api/resources/download/${resource.id}`
      }
    });

  } catch (error) {
    logger.error('Branding addition failed', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to add branding to PDF'
    });
  }
});

/**
 * Send resource to patient
 * POST /api/resources/send-to-patient
 */
router.post('/send-to-patient', authenticateToken, async (req, res) => {
  try {
    const { resourceId, patientId, sendMethod, message } = req.body;
    const userId = req.user.id;

    // Validate resource exists and belongs to user
    const resource = await prisma.resource.findFirst({
      where: {
        id: parseInt(resourceId),
        createdById: userId
      }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Create distribution record
    const distribution = await prisma.resourcePatientDistribution.create({
      data: {
        resourceId: parseInt(resourceId),
        patientId: parseInt(patientId),
        sentVia: sendMethod || 'expedix',
        sentDate: new Date(),
        message: message || null,
        sentById: userId
      }
    });

    // Update resource last accessed date
    await prisma.resource.update({
      where: { id: parseInt(resourceId) },
      data: { lastAccessedAt: new Date() }
    });

    // If sending via Expedix, create a document record
    if (sendMethod === 'expedix') {
      await prisma.patientDocument.create({
        data: {
          patientId: parseInt(patientId),
          title: resource.title,
          type: 'educational_resource',
          filePath: resource.filePath,
          mimeType: resource.mimeType,
          metadata: {
            resourceId: resource.id,
            distributionId: distribution.id,
            sentBy: req.user.name || req.user.email
          },
          uploadedById: userId
        }
      });
    }

    logger.info('Resource sent to patient', {
      userId,
      resourceId,
      patientId,
      sendMethod,
      distributionId: distribution.id
    });

    res.json({
      success: true,
      data: {
        distributionId: distribution.id,
        sentDate: distribution.sentDate,
        patientName: `${patient.firstName} ${patient.lastName}`
      }
    });

  } catch (error) {
    logger.error('Failed to send resource to patient', {
      error: error.message,
      userId: req.user?.id,
      resourceId: req.body.resourceId,
      patientId: req.body.patientId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to send resource to patient'
    });
  }
});

/**
 * Get document templates
 * GET /api/resources/templates
 */
router.get('/templates', authenticateToken, (req, res) => {
  const templates = [
    {
      id: 'default',
      name: 'Documento Estándar',
      description: 'Formato básico para documentos generales',
      icon: 'DocumentIcon'
    },
    {
      id: 'educational',
      name: 'Material Educativo',
      description: 'Para recursos psicoeducativos y folletos informativos',
      icon: 'AcademicCapIcon'
    },
    {
      id: 'worksheet',
      name: 'Hoja de Trabajo',
      description: 'Para ejercicios y actividades terapéuticas',
      icon: 'ClipboardDocumentListIcon'
    },
    {
      id: 'instructions',
      name: 'Instrucciones',
      description: 'Para indicaciones y pautas de tratamiento',
      icon: 'ListBulletIcon'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
});

/**
 * Preview text processing
 * POST /api/resources/preview
 */
router.post('/preview', authenticateToken, async (req, res) => {
  try {
    const { text, template, variables } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for preview'
      });
    }

    const preview = await personalizationService.generatePreview(text, variables || {});

    res.json({
      success: true,
      data: preview
    });

  } catch (error) {
    logger.error('Preview generation failed', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview'
    });
  }
});

/**
 * Get patient list for sending resources
 * GET /api/resources/patients
 */
router.get('/patients', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    // Get patients (in a real app, this would be filtered by clinic/professional)
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 20,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: patients.map(patient => ({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email
      }))
    });

  } catch (error) {
    logger.error('Failed to get patient list', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient list'
    });
  }
});

module.exports = router;