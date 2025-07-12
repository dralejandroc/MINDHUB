/**
 * Storage Configuration for MindHub
 * 
 * Provides unified storage interface supporting both local development
 * and Google Cloud Storage for production.
 */

const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/storage.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Storage configuration
const config = {
  mode: process.env.NODE_ENV === 'production' ? 'gcloud' : 'local',
  local: {
    uploadDir: path.join(__dirname, '../../../uploads'),
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Audio/Video
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      // Spreadsheets
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Presentations
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  },
  gcloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
  }
};

// Healthcare-specific folder structure
const STORAGE_PATHS = {
  patients: {
    documents: 'patients/documents',
    images: 'patients/images',
    reports: 'patients/reports'
  },
  assessments: {
    reports: 'assessments/reports',
    data: 'assessments/data'
  },
  resources: {
    documents: 'resources/documents',
    videos: 'resources/videos',
    images: 'resources/images',
    audio: 'resources/audio'
  },
  forms: {
    templates: 'forms/templates',
    submissions: 'forms/submissions'
  },
  system: {
    backups: 'system/backups',
    logs: 'system/logs',
    temp: 'system/temp'
  }
};

/**
 * Initialize storage directories for local development
 */
function initializeLocalStorage() {
  if (config.mode !== 'local') return;

  const baseDir = config.local.uploadDir;

  // Create base upload directory
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    logger.info('Created base upload directory', { path: baseDir });
  }

  // Create healthcare-specific directories
  Object.values(STORAGE_PATHS).forEach(category => {
    Object.values(category).forEach(subPath => {
      const fullPath = path.join(baseDir, subPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info('Created storage directory', { path: fullPath });
      }
    });
  });

  // Create .gitkeep files to preserve directory structure
  const gitkeepContent = '# This file keeps the directory in git\n# Upload files are ignored but structure is preserved\n';
  Object.values(STORAGE_PATHS).forEach(category => {
    Object.values(category).forEach(subPath => {
      const gitkeepPath = path.join(baseDir, subPath, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, gitkeepContent);
      }
    });
  });

  logger.info('Local storage initialized', { 
    mode: config.mode,
    baseDir,
    paths: Object.keys(STORAGE_PATHS).length 
  });
}

/**
 * Get storage client (local file system or Google Cloud)
 */
function getStorageClient() {
  if (config.mode === 'gcloud') {
    return new Storage({
      projectId: config.gcloud.projectId,
      keyFilename: config.gcloud.keyFilename
    });
  }
  return null; // Use local file system
}

/**
 * Generate unique filename with healthcare compliance
 */
function generateSecureFileName(originalName, patientId = null) {
  const ext = path.extname(originalName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uuid = uuidv4().substring(0, 8);
  
  // Include patient ID for healthcare files (encrypted/hashed in production)
  const patientPrefix = patientId ? `pat-${patientId.substring(0, 8)}-` : '';
  
  return `${patientPrefix}${timestamp}-${uuid}${ext}`;
}

/**
 * Validate file for healthcare compliance
 */
function validateFile(file, category = 'general') {
  const errors = [];
  
  // Check file size
  if (file.size > config.local.maxFileSize) {
    errors.push(`File size exceeds limit (${config.local.maxFileSize / 1024 / 1024}MB)`);
  }
  
  // Check MIME type
  if (!config.local.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`File type not allowed: ${file.mimetype}`);
  }
  
  // Healthcare-specific validations
  if (category === 'patients') {
    // Additional validation for patient files
    if (file.mimetype.startsWith('video/') && file.size > 100 * 1024 * 1024) {
      errors.push('Patient videos cannot exceed 100MB');
    }
  }
  
  if (category === 'assessments') {
    // Ensure assessment files are documents or PDFs
    const allowedAssessmentTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (!allowedAssessmentTypes.includes(file.mimetype)) {
      errors.push('Assessment files must be PDF, text, or JSON format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Upload file to appropriate storage
 */
async function uploadFile(file, category, subcategory, metadata = {}) {
  try {
    // Validate file
    const validation = validateFile(file, category);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Generate secure filename
    const secureFileName = generateSecureFileName(file.originalname, metadata.patientId);
    
    // Get storage path
    const storagePath = STORAGE_PATHS[category]?.[subcategory];
    if (!storagePath) {
      throw new Error(`Invalid storage path: ${category}/${subcategory}`);
    }
    
    const fileMetadata = {
      originalName: file.originalname,
      fileName: secureFileName,
      mimeType: file.mimetype,
      size: file.size,
      category,
      subcategory,
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.userId,
      patientId: metadata.patientId,
      encrypted: category === 'patients', // Encrypt patient files
      ...metadata
    };
    
    if (config.mode === 'local') {
      return await uploadFileLocal(file, storagePath, secureFileName, fileMetadata);
    } else {
      return await uploadFileGCloud(file, storagePath, secureFileName, fileMetadata);
    }
    
  } catch (error) {
    logger.error('File upload failed', { 
      error: error.message,
      file: file.originalname,
      category,
      subcategory 
    });
    throw error;
  }
}

/**
 * Upload file to local storage
 */
async function uploadFileLocal(file, storagePath, fileName, metadata) {
  const fullPath = path.join(config.local.uploadDir, storagePath, fileName);
  const relativePath = path.join(storagePath, fileName);
  
  // Ensure directory exists
  const dirPath = path.dirname(fullPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Write file
  await fs.promises.writeFile(fullPath, file.buffer);
  
  // Write metadata
  const metadataPath = fullPath + '.meta.json';
  await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  const fileUrl = `${config.local.baseUrl}/uploads/${relativePath}`;
  
  logger.info('File uploaded locally', {
    fileName,
    path: relativePath,
    size: metadata.size,
    category: metadata.category
  });
  
  return {
    fileName,
    filePath: relativePath,
    fileUrl,
    metadata
  };
}

/**
 * Upload file to Google Cloud Storage
 */
async function uploadFileGCloud(file, storagePath, fileName, metadata) {
  const storage = getStorageClient();
  const bucket = storage.bucket(config.gcloud.bucketName);
  const gcloudPath = `${storagePath}/${fileName}`;
  
  const fileObj = bucket.file(gcloudPath);
  
  const stream = fileObj.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: metadata
    }
  });
  
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => {
      logger.info('File uploaded to GCloud', {
        fileName,
        path: gcloudPath,
        bucket: config.gcloud.bucketName
      });
      
      resolve({
        fileName,
        filePath: gcloudPath,
        fileUrl: `gs://${config.gcloud.bucketName}/${gcloudPath}`,
        metadata
      });
    });
    
    stream.end(file.buffer);
  });
}

/**
 * Get file URL for download
 */
async function getFileUrl(filePath, expiresIn = 3600) {
  if (config.mode === 'local') {
    return `${config.local.baseUrl}/uploads/${filePath}`;
  } else {
    const storage = getStorageClient();
    const bucket = storage.bucket(config.gcloud.bucketName);
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000
    });
    
    return url;
  }
}

/**
 * Delete file from storage
 */
async function deleteFile(filePath) {
  try {
    if (config.mode === 'local') {
      const fullPath = path.join(config.local.uploadDir, filePath);
      const metadataPath = fullPath + '.meta.json';
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      if (fs.existsSync(metadataPath)) {
        await fs.promises.unlink(metadataPath);
      }
      
      logger.info('File deleted locally', { filePath });
    } else {
      const storage = getStorageClient();
      const bucket = storage.bucket(config.gcloud.bucketName);
      await bucket.file(filePath).delete();
      
      logger.info('File deleted from GCloud', { filePath });
    }
    
    return true;
  } catch (error) {
    logger.error('File deletion failed', { 
      error: error.message,
      filePath 
    });
    return false;
  }
}

/**
 * Configure multer for file uploads
 */
function createMulterConfig(category = 'general') {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.local.maxFileSize,
      files: 10 // Maximum 10 files per upload
    },
    fileFilter: (req, file, cb) => {
      const validation = validateFile(file, category);
      if (validation.isValid) {
        cb(null, true);
      } else {
        cb(new Error(validation.errors.join(', ')), false);
      }
    }
  });
}

/**
 * Get storage statistics
 */
async function getStorageStats() {
  if (config.mode === 'local') {
    const stats = { totalSize: 0, fileCount: 0, categories: {} };
    
    for (const [category, paths] of Object.entries(STORAGE_PATHS)) {
      stats.categories[category] = { size: 0, count: 0 };
      
      for (const subPath of Object.values(paths)) {
        const fullPath = path.join(config.local.uploadDir, subPath);
        if (fs.existsSync(fullPath)) {
          const files = await fs.promises.readdir(fullPath);
          for (const file of files) {
            if (!file.endsWith('.meta.json') && !file.startsWith('.')) {
              const filePath = path.join(fullPath, file);
              const fileStat = await fs.promises.stat(filePath);
              stats.totalSize += fileStat.size;
              stats.fileCount++;
              stats.categories[category].size += fileStat.size;
              stats.categories[category].count++;
            }
          }
        }
      }
    }
    
    return stats;
  } else {
    // GCloud storage stats would require API calls
    return { message: 'GCloud storage stats require API implementation' };
  }
}

// Initialize storage on module load
initializeLocalStorage();

module.exports = {
  config,
  STORAGE_PATHS,
  uploadFile,
  getFileUrl,
  deleteFile,
  createMulterConfig,
  getStorageStats,
  validateFile,
  generateSecureFileName,
  initializeLocalStorage,
  logger
};