/**
 * Routes para importación masiva de pacientes
 * /api/v1/expedix/import/*
 * Solo disponible para usuarios Premium y Clínicas
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImportService = require('../services/ImportService');
const { authenticate } = require('../../shared/middleware');

const importService = new ImportService();

// Configurar multer para manejo de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../temp/imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const userId = req.user?.id || 'unknown';
    const extension = path.extname(file.originalname);
    cb(null, `import-${userId}-${timestamp}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls) y CSV'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
});

/**
 * GET /api/v1/expedix/import/template/:type
 * Generar y descargar plantilla de Excel para importación
 * Tipos: basic, complete, clinic
 */
router.get('/template/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    
    if (!['basic', 'complete', 'clinic'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de plantilla inválido. Use: basic, complete, o clinic'
      });
    }
    
    // Verificar permisos del usuario
    try {
      await importService.checkUserPermissions(userId);
    } catch (permissionError) {
      return res.status(403).json({
        success: false,
        message: permissionError.message
      });
    }
    
    const templatePath = await importService.generateImportTemplate(type);
    const fileName = path.basename(templatePath);
    
    // Establecer headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Enviar archivo y eliminar después
    res.sendFile(templatePath, (err) => {
      if (!err) {
        // Eliminar archivo temporal después de 5 segundos
        setTimeout(() => {
          try {
            fs.unlinkSync(templatePath);
          } catch (cleanupError) {
            console.error('Error cleaning up template file:', cleanupError);
          }
        }, 5000);
      }
    });
    
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/import/preview
 * Vista previa de importación (sin guardar en base de datos)
 */
router.post('/preview', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }
    
    // Procesar archivo en modo preview (dry run)
    const results = await importService.processImportFile(file.path, userId, { dryRun: true });
    
    // Limpiar archivo temporal
    setTimeout(() => {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }, 1000);
    
    res.json({
      success: true,
      message: 'Vista previa generada exitosamente',
      data: {
        total: results.total,
        processed: results.processed,
        errorsCount: results.errors.length,
        warningsCount: results.warnings.length,
        errors: results.errors,
        warnings: results.warnings,
        samplePatients: results.patients.slice(0, 5) // Solo primeros 5 para preview
      }
    });
    
  } catch (error) {
    console.error('Error processing preview:', error);
    
    // Limpiar archivo si existe
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/import/execute
 * Ejecutar importación real (guardar en base de datos)
 */
router.post('/execute', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }
    
    // Procesar archivo y guardar en base de datos
    const results = await importService.processImportFile(file.path, userId, { dryRun: false });
    
    // Limpiar archivo temporal
    setTimeout(() => {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }, 1000);
    
    if (results.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Se encontraron errores en el archivo',
        data: {
          total: results.total,
          processed: results.processed,
          errorsCount: results.errors.length,
          warningsCount: results.warnings.length,
          errors: results.errors,
          warnings: results.warnings
        }
      });
    }
    
    res.json({
      success: true,
      message: `Importación completada exitosamente. ${results.processed} pacientes importados.`,
      data: {
        total: results.total,
        processed: results.processed,
        errorsCount: results.errors.length,
        warningsCount: results.warnings.length,
        warnings: results.warnings
      }
    });
    
  } catch (error) {
    console.error('Error executing import:', error);
    
    // Limpiar archivo si existe
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al importar los pacientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/expedix/import/limits
 * Obtener límites de importación según el tipo de cuenta
 */
router.get('/limits', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar permisos y obtener límites
    try {
      await importService.checkUserPermissions(userId);
      
      // TODO: Obtener límites reales según el tipo de cuenta
      const limits = {
        maxPatientsPerImport: 500,
        maxFileSize: '10MB',
        allowedFormats: ['Excel (.xlsx)', 'Excel Legacy (.xls)', 'CSV'],
        featuresAvailable: [
          'Vista previa antes de importar',
          'Validación automática de datos',
          'Plantillas predefinidas',
          'Importación masiva',
          'Reportes de errores detallados'
        ],
        templateTypes: [
          {
            type: 'basic',
            name: 'Básica',
            description: 'Campos esenciales para comenzar',
            maxPatients: 100
          },
          {
            type: 'complete',
            name: 'Completa', 
            description: 'Todos los campos disponibles',
            maxPatients: 500
          },
          {
            type: 'clinic',
            name: 'Clínica',
            description: 'Campos adicionales para clínicas',
            maxPatients: 1000
          }
        ]
      };
      
      res.json({
        success: true,
        data: limits
      });
      
    } catch (permissionError) {
      res.status(403).json({
        success: false,
        message: permissionError.message,
        upgradeInfo: {
          required: 'Premium o Clínica',
          benefits: [
            'Importación masiva de hasta 1000 pacientes',
            'Plantillas predefinidas',
            'Validación automática',
            'Soporte técnico prioritario'
          ]
        }
      });
    }
    
  } catch (error) {
    console.error('Error getting import limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener límites de importación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/expedix/import/history
 * Obtener historial de importaciones del usuario
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // TODO: Implementar tabla de historial de importaciones
    // Por ahora, devolver datos simulados
    const history = [
      {
        id: '1',
        date: new Date().toISOString(),
        fileName: 'pacientes-enero-2025.xlsx',
        status: 'completed',
        totalRecords: 150,
        processedRecords: 148,
        errors: 2,
        warnings: 5,
        processingTime: '2.3s'
      }
    ];
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Error getting import history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de importaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/import/cleanup
 * Limpiar archivos temporales (solo para administradores)
 */
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    // TODO: Verificar permisos de administrador
    
    const { olderThanHours = 2 } = req.body;
    
    await importService.cleanupTempFiles(olderThanHours);
    
    res.json({
      success: true,
      message: 'Limpieza de archivos temporales completada'
    });
    
  } catch (error) {
    console.error('Error cleaning up import files:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la limpieza de archivos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Solo se permite un archivo a la vez'
      });
    }
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;