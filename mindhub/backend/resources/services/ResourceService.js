/**
 * Resource Management Service
 * Handles file uploads, processing, thumbnails, and organization
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');

class ResourceService {
  constructor() {
    this.storageBase = path.join(__dirname, '../../../storage/resources');
    this.thumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };
  }

  /**
   * Upload and process a new resource
   */
  async uploadResource(file, metadata, userId) {
    try {
      // Calculate file hash for duplicate detection
      const fileBuffer = await fs.readFile(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check for duplicates
      const existing = await this.checkDuplicate(hash);
      if (existing) {
        await fs.unlink(file.path); // Clean up uploaded file
        return {
          success: false,
          error: 'Este archivo ya existe en el sistema',
          existingId: existing.id
        };
      }

      // Determine file type and storage path
      const fileType = this.getFileType(file.mimetype);
      const fileId = `${Date.now()}_${crypto.randomUUID()}`;
      const fileExt = path.extname(file.originalname);
      const filename = `${fileId}${fileExt}`;
      
      // Create storage paths
      const storagePath = path.join(this.storageBase, 'originals', fileType, filename);
      await fs.mkdir(path.dirname(storagePath), { recursive: true });

      // Move file to permanent storage
      await fs.rename(file.path, storagePath);

      // Generate thumbnails
      const thumbnailPath = await this.generateThumbnail(storagePath, fileId, file.mimetype);

      // Extract text content for search
      const textContent = await this.extractTextContent(storagePath, file.mimetype);

      // Create database record - simplified for current schema
      const resource = {
        id: fileId,
        title: metadata.title || file.originalname,
        description: metadata.description || '',
        filename: filename,
        original_filename: file.originalname,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.mimetype,
        category_id: metadata.categoryId || null,
        library_type: metadata.libraryType || 'private',
        upload_by: userId
      };

      // Save to database - using simplified schema
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO resources (
              id, title, description, filename, original_filename,
              file_type, file_size, mime_type, category_id, library_type,
              upload_by, send_count
            ) VALUES (
              ${resource.id}, ${resource.title}, ${resource.description},
              ${resource.filename}, ${resource.original_filename},
              ${resource.file_type}, ${resource.file_size}, ${resource.mime_type},
              ${resource.category_id}, ${resource.library_type}, ${resource.upload_by}, 0
            )
          `;
        },
        'uploadResource'
      );

      return {
        success: true,
        resource: resource
      };

    } catch (error) {
      console.error('Error uploading resource:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnails for different file types
   */
  async generateThumbnail(filePath, fileId, mimeType) {
    try {
      const thumbnailBase = path.join(this.storageBase, 'thumbnails');
      let thumbnailPath = null;

      if (mimeType.startsWith('image/')) {
        // Process images
        for (const [size, dimensions] of Object.entries(this.thumbnailSizes)) {
          const outputPath = path.join(thumbnailBase, size, `${fileId}.jpg`);
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          
          await sharp(filePath)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
          
          if (size === 'medium') {
            thumbnailPath = `thumbnails/medium/${fileId}.jpg`;
          }
        }
      } else if (mimeType === 'application/pdf') {
        // Process PDFs - extract first page as image
        // Note: This requires pdf2pic or similar library
        // For now, we'll use a placeholder
        thumbnailPath = await this.generatePDFThumbnail(filePath, fileId);
      } else {
        // Generate generic icon based on file type
        thumbnailPath = await this.generateGenericThumbnail(mimeType, fileId);
      }

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Extract text content for search indexing
   */
  async extractTextContent(filePath, mimeType) {
    try {
      let content = '';

      if (mimeType === 'application/pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        content = data.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
      } else if (mimeType.startsWith('text/')) {
        content = await fs.readFile(filePath, 'utf8');
      }

      // Limit content length for database
      return content.substring(0, 50000);
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  /**
   * Check for duplicate files by hash
   */
  async checkDuplicate(hash) {
    try {
      const results = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRaw`
            SELECT id, title FROM resources WHERE content_hash = ${hash}
          `;
        },
        'checkDuplicate'
      );
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return null;
    }
  }

  /**
   * Get file type category from mimetype
   */
  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType === 'application/pdf') return 'pdfs';
    return 'documents';
  }

  /**
   * Get file dimensions for images
   */
  async getFileDimensions(filePath, mimeType) {
    if (!mimeType.startsWith('image/')) return null;
    
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get page count for PDFs
   */
  async getPageCount(filePath, mimeType) {
    if (mimeType !== 'application/pdf') return null;
    
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.numpages;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate PDF thumbnail (placeholder for now)
   */
  async generatePDFThumbnail(filePath, fileId) {
    // This would use pdf2pic or similar
    // For now, return a placeholder path
    return 'thumbnails/pdf-placeholder.jpg';
  }

  /**
   * Generate generic thumbnail for non-image files
   */
  async generateGenericThumbnail(mimeType, fileId) {
    // This would generate an icon based on file type
    // For now, return a placeholder
    return 'thumbnails/document-placeholder.jpg';
  }

  /**
   * Search resources with filters
   */
  async searchResources(query, filters, userId) {
    try {
      let whereClause = 'WHERE r.is_active = 1';
      const params = [];

      // Library type filter - simplified for current schema
      if (filters.libraryType === 'public') {
        whereClause += ' AND r.library_type = "public"';
      } else if (filters.libraryType === 'private') {
        whereClause += ' AND r.library_type = "private" AND r.upload_by = ?';
        params.push(userId);
      } else {
        // Show both public and user's private resources
        whereClause += ' AND (r.library_type = "public" OR (r.library_type = "private" AND r.upload_by = ?))';
        params.push(userId);
      }

      // Category filter
      if (filters.categoryId) {
        whereClause += ' AND r.category_id = ?';
        params.push(filters.categoryId);
      }

      // File type filter
      if (filters.fileType) {
        whereClause += ' AND r.file_type = ?';
        params.push(filters.fileType);
      }

      // Text search - simplified without FULLTEXT index
      if (query) {
        whereClause += ' AND (r.title LIKE ? OR r.description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      // Date filter
      if (filters.dateFrom) {
        whereClause += ' AND r.created_at >= ?';
        params.push(filters.dateFrom);
      }

      const sql = `
        SELECT 
          r.id, r.title, r.description, r.filename, r.file_type,
          r.file_size, r.mime_type, r.library_type, r.send_count,
          r.created_at, r.updated_at,
          c.name as category_name
        FROM resources r
        LEFT JOIN resource_categories c ON r.category_id = c.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(filters.limit || 50);
      params.push(filters.offset || 0);

      const resources = await executeQuery(
        async (prisma) => {
          return await prisma.$queryRawUnsafe(sql, ...params);
        },
        'searchResources'
      );

      return resources.map(r => ({
        ...r,
        thumbnail_url: `/api/v1/resources/thumbnail/${r.id}`,
        download_url: `/api/v1/resources/download/${r.id}`
      }));

    } catch (error) {
      console.error('Error searching resources:', error);
      throw error;
    }
  }

  /**
   * Send resource to patient
   */
  async sendResourceToPatient(resourceId, patientId, sendOptions, userId) {
    try {
      const sendId = crypto.randomUUID();

      // Get resource details
      const resource = await this.getResourceById(resourceId, userId);
      if (!resource) {
        throw new Error('Recurso no encontrado');
      }

      // Apply watermark if requested
      let processedFilePath = null;
      if (sendOptions.applyWatermark) {
        processedFilePath = await this.applyWatermark(
          resource.id, 
          resource.filename,
          resource.mime_type,
          sendOptions.watermarkTemplateId,
          userId
        );
      }

      // Create send record - simplified schema
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            INSERT INTO resource_sends (
              id, resource_id, patient_id, sent_by, send_method, notes
            ) VALUES (
              ${sendId}, ${resourceId}, ${patientId}, ${userId},
              ${sendOptions.method || 'download'}, ${sendOptions.notes || null}
            )
          `;
        },
        'sendResource'
      );
      
      // Update resource send count
      await executeQuery(
        async (prisma) => {
          return await prisma.$executeRaw`
            UPDATE resources SET send_count = send_count + 1 WHERE id = ${resourceId}
          `;
        },
        'updateSendCount'
      );

      // If sending by email, queue email job
      if (sendOptions.method === 'email') {
        // Queue email sending job
        await this.queueResourceEmail(sendId, resource, patientId, sendOptions);
      }

      return {
        success: true,
        sendId: sendId,
        downloadUrl: processedFilePath ? 
          `/api/v1/resources/download/${sendId}` : 
          `/api/v1/resources/download/${resourceId}`
      };

    } catch (error) {
      console.error('Error sending resource:', error);
      throw error;
    }
  }

  /**
   * Apply watermark to resource
   */
  async applyWatermark(resourceId, filename, mimeType, watermarkTemplateId, userId) {
    // Implementation would depend on file type
    // For now, return original path
    const processedPath = path.join(this.storageBase, 'processed', `${resourceId}_watermarked.pdf`);
    
    // TODO: Implement actual watermarking logic
    // - For PDFs: Use pdf-lib to add watermark
    // - For images: Use sharp to overlay watermark
    // - For documents: Convert to PDF first, then watermark
    
    return processedPath;
  }

  /**
   * Get resource by ID
   */
  async getResourceById(resourceId, userId) {
    const results = await executeQuery(
      async (prisma) => {
        return await prisma.$queryRaw`
          SELECT r.*, c.name as category_name FROM resources r
          LEFT JOIN resource_categories c ON r.category_id = c.id
          WHERE r.id = ${resourceId} 
          AND (r.library_type = 'public' OR r.upload_by = ${userId})
        `;
      },
      'getResource'
    );
    
    if (results.length === 0) return null;
    
    const resource = results[0];
    return {
      ...resource,
      thumbnail_url: `/api/v1/resources/thumbnail/${resource.id}`,
      download_url: `/api/v1/resources/download/${resource.id}`
    };
  }

  /**
   * Queue email for sending
   */
  async queueResourceEmail(sendId, resource, patientId, sendOptions) {
    // This would integrate with an email queue system
    console.log('Queueing email for send:', sendId);
  }
}

module.exports = ResourceService;