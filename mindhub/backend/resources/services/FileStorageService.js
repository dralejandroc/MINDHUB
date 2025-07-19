/**
 * File Storage Service for Resources Hub
 * 
 * Handles file upload, download, and management for educational resources
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../shared/config/storage');

class FileStorageService {
  constructor() {
    this.baseUploadPath = process.env.UPLOAD_BASE_PATH || '/Users/alekscon/taskmaster-ai/mindhub/uploads';
    this.resourcesPath = path.join(this.baseUploadPath, 'resources');
    this.allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/avi',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/html'
    ];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    
    this.initializeStorageDirectories();
  }

  /**
   * Initialize storage directories
   */
  async initializeStorageDirectories() {
    try {
      await fs.mkdir(this.resourcesPath, { recursive: true });
      
      // Create subdirectories for different resource types
      const subdirs = [
        'educational_handouts',
        'worksheets',
        'audio_materials',
        'video_content',
        'interactive_tools',
        'assessment_guides',
        'treatment_protocols',
        'self_help_guides'
      ];

      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.resourcesPath, subdir), { recursive: true });
      }

      logger.info('File storage directories initialized', {
        baseUploadPath: this.baseUploadPath,
        resourcesPath: this.resourcesPath
      });
    } catch (error) {
      logger.error('Failed to initialize storage directories', {
        error: error.message,
        baseUploadPath: this.baseUploadPath
      });
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(file, metadata = {}) {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueId = uuidv4();
      const filename = `${uniqueId}${fileExtension}`;
      
      // Determine subdirectory based on resource type
      const subdir = metadata.resourceType || 'educational_handouts';
      const filePath = path.join(this.resourcesPath, subdir, filename);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate file hash for integrity checking
      const fileHash = await this.generateFileHash(filePath);

      // Create file metadata
      const fileMetadata = {
        id: uniqueId,
        originalName: file.originalname,
        filename: filename,
        filePath: filePath,
        relativePath: path.relative(this.baseUploadPath, filePath),
        fileSize: file.size,
        mimeType: file.mimetype,
        fileHash: fileHash,
        uploadedAt: new Date().toISOString(),
        metadata: metadata
      };

      logger.info('File uploaded successfully', {
        fileId: uniqueId,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      });

      return fileMetadata;
    } catch (error) {
      logger.error('File upload failed', {
        error: error.message,
        originalName: file?.originalname,
        fileSize: file?.size
      });
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileId, filename) {
    try {
      // Find file by searching in subdirectories
      const filePath = await this.findFileById(fileId, filename);
      
      if (!filePath) {
        throw new Error('File not found');
      }

      // Check if file exists
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('File not found');
      }

      // Read file
      const fileBuffer = await fs.readFile(filePath);

      // Get file metadata
      const fileMetadata = {
        filename: path.basename(filePath),
        fileSize: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(filePath)),
        lastModified: stats.mtime
      };

      logger.info('File downloaded successfully', {
        fileId,
        filename,
        fileSize: stats.size
      });

      return {
        buffer: fileBuffer,
        metadata: fileMetadata
      };
    } catch (error) {
      logger.error('File download failed', {
        error: error.message,
        fileId,
        filename
      });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId, filename) {
    try {
      const filePath = await this.findFileById(fileId, filename);
      
      if (!filePath) {
        throw new Error('File not found');
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info('File deleted successfully', {
        fileId,
        filename
      });

      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      logger.error('File deletion failed', {
        error: error.message,
        fileId,
        filename
      });
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileId, filename) {
    try {
      const filePath = await this.findFileById(fileId, filename);
      
      if (!filePath) {
        throw new Error('File not found');
      }

      const stats = await fs.stat(filePath);
      const fileHash = await this.generateFileHash(filePath);

      return {
        id: fileId,
        filename: path.basename(filePath),
        filePath: filePath,
        relativePath: path.relative(this.baseUploadPath, filePath),
        fileSize: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(filePath)),
        fileHash: fileHash,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        exists: true
      };
    } catch (error) {
      logger.error('Failed to get file info', {
        error: error.message,
        fileId,
        filename
      });
      throw error;
    }
  }

  /**
   * Create file version
   */
  async createFileVersion(originalFileId, newFile, versionNumber, metadata = {}) {
    try {
      // Upload new version
      const newFileMetadata = await this.uploadFile(newFile, {
        ...metadata,
        isVersion: true,
        originalFileId: originalFileId,
        versionNumber: versionNumber
      });

      // Keep original file for version history
      logger.info('File version created successfully', {
        originalFileId,
        newFileId: newFileMetadata.id,
        versionNumber
      });

      return newFileMetadata;
    } catch (error) {
      logger.error('Failed to create file version', {
        error: error.message,
        originalFileId,
        versionNumber
      });
      throw error;
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer) {
      throw new Error('Invalid file buffer');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    // Check for malicious file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error('File type is not allowed for security reasons');
    }

    return true;
  }

  /**
   * Generate file hash for integrity checking
   */
  async generateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      logger.error('Failed to generate file hash', {
        error: error.message,
        filePath
      });
      throw error;
    }
  }

  /**
   * Find file by ID in subdirectories
   */
  async findFileById(fileId, filename) {
    try {
      const subdirs = await fs.readdir(this.resourcesPath);
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.resourcesPath, subdir);
        const stats = await fs.stat(subdirPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(subdirPath);
          
          for (const file of files) {
            if (file.startsWith(fileId) || file === filename) {
              return path.join(subdirPath, file);
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find file by ID', {
        error: error.message,
        fileId,
        filename
      });
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.html': 'text/html'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        typeBreakdown: {},
        subdirectoryStats: {}
      };

      const subdirs = await fs.readdir(this.resourcesPath);
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.resourcesPath, subdir);
        const subdirStats = await fs.stat(subdirPath);
        
        if (subdirStats.isDirectory()) {
          const files = await fs.readdir(subdirPath);
          let subdirSize = 0;
          
          for (const file of files) {
            const filePath = path.join(subdirPath, file);
            const fileStats = await fs.stat(filePath);
            
            if (fileStats.isFile()) {
              stats.totalFiles++;
              stats.totalSize += fileStats.size;
              subdirSize += fileStats.size;
              
              const extension = path.extname(file);
              stats.typeBreakdown[extension] = (stats.typeBreakdown[extension] || 0) + 1;
            }
          }
          
          stats.subdirectoryStats[subdir] = {
            fileCount: files.length,
            totalSize: subdirSize
          };
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const tempPath = path.join(this.baseUploadPath, 'temp');
      
      try {
        const files = await fs.readdir(tempPath);
        let cleanedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(tempPath, file);
          const stats = await fs.stat(filePath);
          
          if (Date.now() - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        }
        
        logger.info('Temporary files cleaned up', {
          cleanedCount,
          maxAge: maxAge / (60 * 60 * 1000) + ' hours'
        });
        
        return { cleanedCount };
      } catch (error) {
        // Temp directory doesn't exist, which is fine
        return { cleanedCount: 0 };
      }
    } catch (error) {
      logger.error('Failed to clean up temporary files', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = FileStorageService;