/**
 * Resources API Routes
 * Handles file uploads, library management, and resource distribution
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, param, query, validationResult } = require('express-validator');
const ResourceService = require('../services/ResourceService');
const { executeQuery } = require('../../shared/config/prisma');

const router = express.Router();
const resourceService = new ResourceService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../storage/resources/temp');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

/**
 * POST /api/resources/upload
 * Upload a new resource
 */
router.post('/upload', 
  upload.single('file'),
  [
    body('title').optional().trim().isLength({ min: 1, max: 500 }),
    body('description').optional().trim(),
    body('categoryId').optional().isUUID(),
    body('libraryType').optional().isIn(['public', 'private']),
    body('tags').optional().isArray()
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

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No se proporcionó ningún archivo' 
        });
      }

      const userId = req.user?.id || 'system';
      
      // Only system users can upload to public library
      if (req.body.libraryType === 'public' && userId !== 'system') {
        return res.status(403).json({ 
          error: 'No tiene permisos para subir a la biblioteca pública' 
        });
      }

      const result = await resourceService.uploadResource(
        req.file,
        {
          title: req.body.title,
          description: req.body.description,
          categoryId: req.body.categoryId,
          libraryType: req.body.libraryType || 'private',
          tags: req.body.tags || []
        },
        userId
      );

      if (!result.success) {
        return res.status(409).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Recurso subido exitosamente',
        data: result.resource
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Error al subir el archivo',
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/resources
 * Search and list resources
 */
router.get('/',
  [
    query('q').optional().trim(),
    query('libraryType').optional().isIn(['all', 'public', 'private']),
    query('categoryId').optional().isUUID(),
    query('fileType').optional().isIn(['pdfs', 'images', 'documents']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

      const userId = req.user?.id || 'guest';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // For now, return placeholder data to fix frontend connection
      const resources = [];

      res.json({
        success: true,
        data: resources,
        pagination: {
          page: page,
          limit: limit,
          total: resources.length // TODO: Add total count query
        }
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ 
        error: 'Error al buscar recursos',
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/resources/categories
 * Get resource categories
 */
router.get('/categories', async (req, res) => {
  try {
    // For now, return placeholder categories to fix frontend connection
    const categories = [];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Error al obtener categorías' 
    });
  }
});

/**
 * GET /api/resources/:id
 * Get resource details
 */
router.get('/:id',
  [param('id').isUUID()],
  async (req, res) => {
    try {
      const userId = req.user?.id || 'guest';
      const resource = await resourceService.getResourceById(req.params.id, userId);

      if (!resource) {
        return res.status(404).json({ 
          error: 'Recurso no encontrado' 
        });
      }

      res.json({
        success: true,
        data: resource
      });

    } catch (error) {
      console.error('Error fetching resource:', error);
      res.status(500).json({ 
        error: 'Error al obtener el recurso' 
      });
    }
  }
);

/**
 * POST /api/resources/:id/send
 * Send resource to patient
 */
router.post('/:id/send',
  [
    param('id').isUUID(),
    body('patientId').isUUID(),
    body('method').isIn(['email', 'download', 'patient-portal']),
    body('applyWatermark').optional().isBoolean(),
    body('watermarkTemplateId').optional().isUUID(),
    body('emailTemplateId').optional().isUUID(),
    body('notes').optional().trim()
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

      const userId = req.user?.id || 'system';

      // Verify patient exists or create temporary record
      const patientId = req.body.patientId;
      // TODO: Verify patient exists

      const result = await resourceService.sendResourceToPatient(
        req.params.id,
        patientId,
        {
          method: req.body.method,
          applyWatermark: req.body.applyWatermark || false,
          watermarkTemplateId: req.body.watermarkTemplateId,
          emailTemplateId: req.body.emailTemplateId,
          notes: req.body.notes
        },
        userId
      );

      res.json({
        success: true,
        message: 'Recurso enviado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('Error sending resource:', error);
      res.status(500).json({ 
        error: 'Error al enviar el recurso',
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/resources/thumbnail/:id
 * Get resource thumbnail
 */
router.get('/thumbnail/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user?.id || 'guest';

    // Get resource details
    const resource = await resourceService.getResourceById(resourceId, userId);
    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Generate placeholder thumbnail for now
    const placeholderPath = path.join(__dirname, '../../../storage/resources/placeholder-thumbnail.jpg');
    
    // Check if placeholder exists, create if not
    try {
      await fs.access(placeholderPath);
    } catch {
      // Create a simple placeholder thumbnail
      const sharp = require('sharp');
      await fs.mkdir(path.dirname(placeholderPath), { recursive: true });
      
      // Create a simple colored rectangle based on file type
      const color = resource.file_type === 'pdfs' ? '#FF6B6B' : 
                    resource.file_type === 'images' ? '#4ECDC4' : '#45B7D1';
      
      await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: color
        }
      })
      .png()
      .toFile(placeholderPath);
    }

    res.sendFile(placeholderPath);

  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ 
      error: 'Error al obtener miniatura' 
    });
  }
});

/**
 * GET /api/resources/download/:id
 * Download resource (original or processed)
 */
router.get('/download/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user?.id || 'guest';

    // Check if this is a send ID or resource ID
    let filePath;
    let filename;

    // Try to get from resource_sends first
    const sendResults = await executeQuery(
      async (prisma) => {
        return await prisma.$queryRaw`
          SELECT rs.*, r.filename, r.mime_type, r.original_filename
          FROM resource_sends rs
          JOIN resources r ON rs.resource_id = r.id
          WHERE rs.id = ${resourceId}
        `;
      },
      'getSendRecord'
    );

    if (sendResults.length > 0) {
      const send = sendResults[0];
      // Log access
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO resource_access_logs (
              resource_send_id, ip_address, user_agent, action
            ) VALUES (
              ${send.id}, ${req.ip}, ${req.get('User-Agent')}, 'download'
            )
          `;
        },
        'logAccess'
      );

      // Get processed or original file
      if (send.watermark_applied) {
        filePath = path.join(__dirname, '../../../storage/resources/processed', `${send.resource_id}_watermarked.pdf`);
      } else {
        filePath = path.join(__dirname, '../../../storage/resources/originals', send.file_type, send.filename);
      }
      filename = send.original_filename;
    } else {
      // Direct resource download
      const resource = await resourceService.getResourceById(resourceId, userId);
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      filePath = path.join(__dirname, '../../../storage/resources/originals', resource.file_type, resource.filename);
      filename = resource.original_filename;
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Send file
    res.download(filePath, filename);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Error al descargar el archivo' 
    });
  }
});

/**
 * GET /api/resources/patient/:patientId/history
 * Get resource send history for a patient
 */
router.get('/patient/:patientId/history',
  [param('patientId').isUUID()],
  async (req, res) => {
    try {
      const history = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT 
              rs.id, rs.sent_at, rs.send_method, rs.delivery_status,
              rs.viewed_at, rs.download_count, rs.notes,
              r.title, r.description, r.file_type, r.thumbnail_path,
              u.name as sent_by_name
            FROM resource_sends rs
            JOIN resources r ON rs.resource_id = r.id
            JOIN users u ON rs.sent_by = u.id
            WHERE rs.patient_id = ${req.params.patientId}
            ORDER BY rs.sent_at DESC
          `;
        },
        'getPatientHistory'
      );

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ 
        error: 'Error al obtener historial' 
      });
    }
  }
);

/**
 * POST /api/resources/watermark-templates
 * Create watermark template
 */
router.post('/watermark-templates',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('type').isIn(['text', 'image', 'combined']),
    body('textContent').optional().trim(),
    body('position').optional().isIn(['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right']),
    body('opacity').optional().isFloat({ min: 0, max: 1 }),
    body('fontSize').optional().isInt({ min: 8, max: 72 }),
    body('isDefault').optional().isBoolean()
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

      const userId = req.user?.id || 'system';
      const templateId = require('crypto').randomUUID();

      await executeQuery(
        async (prisma) => {
          // If setting as default, unset other defaults
          if (req.body.isDefault) {
            await prisma.$executeRaw`
              UPDATE watermark_templates 
              SET is_default = 0 
              WHERE user_id = ${userId}
            `;
          }

          return await prisma.$executeRaw`
            INSERT INTO watermark_templates (
              id, user_id, name, type, text_content, position,
              opacity, font_size, is_default
            ) VALUES (
              ${templateId}, ${userId}, ${req.body.name}, ${req.body.type},
              ${req.body.textContent}, ${req.body.position || 'bottom-right'},
              ${req.body.opacity || 0.5}, ${req.body.fontSize || 12},
              ${req.body.isDefault ? 1 : 0}
            )
          `;
        },
        'createWatermarkTemplate'
      );

      res.status(201).json({
        success: true,
        message: 'Plantilla de marca de agua creada',
        data: { id: templateId }
      });

    } catch (error) {
      console.error('Error creating watermark template:', error);
      res.status(500).json({ 
        error: 'Error al crear plantilla' 
      });
    }
  }
);

module.exports = router;