/**
 * Storage API Routes
 * 
 * Handles file upload, download, and management for MindHub.
 * Supports healthcare-compliant file handling with audit logging.
 */

const express = require('express');
const { 
  uploadFile, 
  getFileUrl, 
  deleteFile, 
  createMulterConfig, 
  getStorageStats,
  validateFile,
  STORAGE_PATHS,
  logger 
} = require('../config/storage');

const router = express.Router();

/**
 * Upload files for patients
 * POST /api/storage/patients/upload
 */
router.post('/patients/upload', (req, res) => {
  const upload = createMulterConfig('patients').array('files', 10);
  
  upload(req, res, async (err) => {
    if (err) {
      logger.error('Patient file upload error', { error: err.message });
      return res.status(400).json({ 
        error: 'Upload failed', 
        details: err.message 
      });
    }
    
    try {
      const { patientId, subcategory = 'documents', userId } = req.body;
      
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      
      if (!STORAGE_PATHS.patients[subcategory]) {
        return res.status(400).json({ 
          error: 'Invalid subcategory',
          available: Object.keys(STORAGE_PATHS.patients)
        });
      }
      
      const uploadResults = [];
      
      for (const file of req.files) {
        const result = await uploadFile(file, 'patients', subcategory, {
          patientId,
          userId: userId || req.user?.id,
          uploadSource: 'web_interface',
          hipaaCompliant: true
        });
        uploadResults.push(result);
      }
      
      // Log for HIPAA/NOM-024 compliance
      logger.info('Patient files uploaded', {
        patientId,
        fileCount: uploadResults.length,
        subcategory,
        uploadedBy: userId || req.user?.id,
        files: uploadResults.map(r => ({ 
          fileName: r.fileName, 
          size: r.metadata.size 
        }))
      });
      
      res.json({
        success: true,
        message: `${uploadResults.length} file(s) uploaded successfully`,
        files: uploadResults
      });
      
    } catch (error) {
      logger.error('Patient file upload processing failed', { 
        error: error.message,
        patientId: req.body.patientId 
      });
      res.status(500).json({ 
        error: 'Upload processing failed', 
        details: error.message 
      });
    }
  });
});

/**
 * Upload assessment files
 * POST /api/storage/assessments/upload
 */
router.post('/assessments/upload', (req, res) => {
  const upload = createMulterConfig('assessments').array('files', 5);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        error: 'Upload failed', 
        details: err.message 
      });
    }
    
    try {
      const { assessmentId, subcategory = 'reports', userId } = req.body;
      
      if (!assessmentId) {
        return res.status(400).json({ error: 'Assessment ID is required' });
      }
      
      const uploadResults = [];
      
      for (const file of req.files) {
        const result = await uploadFile(file, 'assessments', subcategory, {
          assessmentId,
          userId: userId || req.user?.id,
          clinicalData: true
        });
        uploadResults.push(result);
      }
      
      res.json({
        success: true,
        message: `${uploadResults.length} assessment file(s) uploaded`,
        files: uploadResults
      });
      
    } catch (error) {
      logger.error('Assessment file upload failed', { 
        error: error.message,
        assessmentId: req.body.assessmentId 
      });
      res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message 
      });
    }
  });
});

/**
 * Upload educational resources
 * POST /api/storage/resources/upload
 */
router.post('/resources/upload', (req, res) => {
  const upload = createMulterConfig('resources').array('files', 10);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        error: 'Upload failed', 
        details: err.message 
      });
    }
    
    try {
      const { resourceId, subcategory = 'documents', userId, isPublic = false } = req.body;
      
      const uploadResults = [];
      
      for (const file of req.files) {
        const result = await uploadFile(file, 'resources', subcategory, {
          resourceId,
          userId: userId || req.user?.id,
          isPublic: isPublic === 'true',
          educationalContent: true
        });
        uploadResults.push(result);
      }
      
      res.json({
        success: true,
        message: `${uploadResults.length} resource file(s) uploaded`,
        files: uploadResults
      });
      
    } catch (error) {
      logger.error('Resource file upload failed', { 
        error: error.message,
        resourceId: req.body.resourceId 
      });
      res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message 
      });
    }
  });
});

/**
 * Upload form files
 * POST /api/storage/forms/upload
 */
router.post('/forms/upload', (req, res) => {
  const upload = createMulterConfig('forms').array('files', 5);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        error: 'Upload failed', 
        details: err.message 
      });
    }
    
    try {
      const { formId, subcategory = 'templates', userId } = req.body;
      
      const uploadResults = [];
      
      for (const file of req.files) {
        const result = await uploadFile(file, 'forms', subcategory, {
          formId,
          userId: userId || req.user?.id
        });
        uploadResults.push(result);
      }
      
      res.json({
        success: true,
        message: `${uploadResults.length} form file(s) uploaded`,
        files: uploadResults
      });
      
    } catch (error) {
      logger.error('Form file upload failed', { 
        error: error.message,
        formId: req.body.formId 
      });
      res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message 
      });
    }
  });
});

/**
 * Get file download URL
 * GET /api/storage/download/:category/:subcategory/:fileName
 */
router.get('/download/:category/:subcategory/:fileName', async (req, res) => {
  try {
    const { category, subcategory, fileName } = req.params;
    const { expires = 3600 } = req.query;
    
    // Validate category and subcategory
    if (!STORAGE_PATHS[category] || !STORAGE_PATHS[category][subcategory]) {
      return res.status(404).json({ error: 'File path not found' });
    }
    
    const filePath = `${STORAGE_PATHS[category][subcategory]}/${fileName}`;
    const fileUrl = await getFileUrl(filePath, parseInt(expires));
    
    // Log access for healthcare compliance
    logger.info('File access requested', {
      filePath,
      category,
      subcategory,
      requestedBy: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      fileUrl,
      fileName,
      expiresIn: parseInt(expires)
    });
    
  } catch (error) {
    logger.error('File download URL generation failed', { 
      error: error.message,
      params: req.params 
    });
    res.status(500).json({ 
      error: 'Download URL generation failed', 
      details: error.message 
    });
  }
});

/**
 * Delete file
 * DELETE /api/storage/:category/:subcategory/:fileName
 */
router.delete('/:category/:subcategory/:fileName', async (req, res) => {
  try {
    const { category, subcategory, fileName } = req.params;
    const { reason } = req.body;
    
    // Validate category and subcategory
    if (!STORAGE_PATHS[category] || !STORAGE_PATHS[category][subcategory]) {
      return res.status(404).json({ error: 'File path not found' });
    }
    
    const filePath = `${STORAGE_PATHS[category][subcategory]}/${fileName}`;
    const success = await deleteFile(filePath);
    
    if (success) {
      // Log deletion for healthcare compliance
      logger.info('File deleted', {
        filePath,
        category,
        subcategory,
        deletedBy: req.user?.id,
        reason: reason || 'Not specified',
        ipAddress: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'File deleted successfully',
        fileName
      });
    } else {
      res.status(500).json({
        error: 'File deletion failed',
        fileName
      });
    }
    
  } catch (error) {
    logger.error('File deletion failed', { 
      error: error.message,
      params: req.params 
    });
    res.status(500).json({ 
      error: 'Deletion failed', 
      details: error.message 
    });
  }
});

/**
 * Get storage statistics
 * GET /api/storage/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStorageStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Storage stats retrieval failed', { error: error.message });
    res.status(500).json({ 
      error: 'Stats retrieval failed', 
      details: error.message 
    });
  }
});

/**
 * Validate file before upload
 * POST /api/storage/validate
 */
router.post('/validate', (req, res) => {
  const upload = createMulterConfig().single('file');
  
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        valid: false,
        errors: [err.message]
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        valid: false,
        errors: ['No file provided']
      });
    }
    
    const { category = 'general' } = req.body;
    const validation = validateFile(req.file, category);
    
    res.json({
      valid: validation.isValid,
      errors: validation.errors,
      file: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });
  });
});

/**
 * Get available storage paths
 * GET /api/storage/paths
 */
router.get('/paths', (req, res) => {
  res.json({
    success: true,
    paths: STORAGE_PATHS,
    categories: Object.keys(STORAGE_PATHS),
    description: {
      patients: 'Patient medical documents, images, and reports',
      assessments: 'Clinical assessment reports and data files',
      resources: 'Educational materials and multimedia content',
      forms: 'Form templates and submission data',
      system: 'System backups, logs, and temporary files'
    }
  });
});

/**
 * Health check for storage system
 * GET /api/storage/health
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await getStorageStats();
    
    res.json({
      status: 'healthy',
      mode: require('../config/storage').config.mode,
      stats: {
        totalFiles: stats.fileCount || 0,
        totalSize: stats.totalSize || 0,
        categories: Object.keys(stats.categories || {}).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;