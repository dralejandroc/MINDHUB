/**
 * Secure Download Service for MindHub Resources Library
 * 
 * Handles secure file downloads with authentication, authorization,
 * temporary URLs, and comprehensive audit logging for compliance.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class SecureDownloadService {
  constructor(config = {}) {
    this.config = {
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'secure-download-secret',
      tokenExpiration: config.tokenExpiration || '1h', // Download token validity
      maxDownloadAttempts: config.maxDownloadAttempts || 3,
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: config.rateLimitMax || 10, // Max downloads per minute
      allowedFileTypes: config.allowedFileTypes || [
        'pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif'
      ],
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      storageProvider: config.storageProvider || 'local', // 'local' | 'gcs' | 's3'
      ...config
    };
    
    this.downloadAttempts = new Map(); // Track download attempts
    this.activeTokens = new Map(); // Track active download tokens
    this.rateLimitTracker = new Map(); // Track rate limiting
  }

  /**
   * Generate secure download token for authenticated access
   */
  async generateDownloadToken(resourceId, userId, options = {}) {
    try {
      // Validate resource access permissions
      const hasAccess = await this.validateResourceAccess(resourceId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to resource');
      }

      // Generate unique download token
      const tokenId = uuidv4();
      const downloadToken = jwt.sign(
        {
          tokenId,
          resourceId,
          userId,
          type: 'download',
          maxAttempts: options.maxAttempts || this.config.maxDownloadAttempts,
          restrictions: {
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            expiresAt: Date.now() + this.parseExpiration(this.config.tokenExpiration)
          }
        },
        this.config.jwtSecret,
        { 
          expiresIn: this.config.tokenExpiration,
          issuer: 'mindhub-resources',
          audience: 'resource-download'
        }
      );

      // Store token metadata
      this.activeTokens.set(tokenId, {
        resourceId,
        userId,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: options.maxAttempts || this.config.maxDownloadAttempts,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      // Log token generation
      await this.logDownloadActivity({
        eventType: 'token_generated',
        resourceId,
        userId,
        tokenId,
        metadata: {
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          expiresIn: this.config.tokenExpiration
        }
      });

      return {
        downloadToken,
        tokenId,
        expiresAt: Date.now() + this.parseExpiration(this.config.tokenExpiration),
        downloadUrl: `/api/resources/download/${tokenId}`
      };
    } catch (error) {
      await this.logDownloadActivity({
        eventType: 'token_generation_failed',
        resourceId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process secure download using token
   */
  async processSecureDownload(tokenId, requestMetadata = {}) {
    try {
      // Validate and decode token
      const tokenData = await this.validateDownloadToken(tokenId, requestMetadata);
      
      // Check rate limiting
      await this.checkRateLimit(tokenData.userId);
      
      // Get resource information
      const resource = await this.getResourceDetails(tokenData.resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }

      // Validate file access
      await this.validateFileAccess(resource, tokenData.userId);

      // Update download attempts
      await this.incrementDownloadAttempts(tokenId);

      // Generate personalized content if needed
      let downloadData;
      if (resource.personalization?.enabled && requestMetadata.personalizationData) {
        downloadData = await this.generatePersonalizedContent(
          resource, 
          requestMetadata.personalizationData
        );
      } else {
        downloadData = await this.getOriginalContent(resource);
      }

      // Log successful download
      await this.logDownloadActivity({
        eventType: 'download_success',
        resourceId: tokenData.resourceId,
        userId: tokenData.userId,
        tokenId,
        fileSize: downloadData.size,
        personalized: !!requestMetadata.personalizationData,
        metadata: requestMetadata
      });

      // Update resource usage statistics
      await this.updateResourceStats(tokenData.resourceId, 'download');

      // Record usage in tracking system
      await this.recordResourceUsage({
        resourceId: tokenData.resourceId,
        userId: tokenData.userId,
        method: 'download',
        personalizationData: requestMetadata.personalizationData
      });

      return {
        success: true,
        fileName: this.generateSecureFileName(resource, requestMetadata.personalizationData),
        contentType: resource.content.mimeType,
        data: downloadData.buffer,
        size: downloadData.size,
        metadata: {
          downloadId: uuidv4(),
          resourceTitle: resource.title,
          downloadedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      await this.logDownloadActivity({
        eventType: 'download_failed',
        tokenId,
        error: error.message,
        metadata: requestMetadata
      });
      throw error;
    }
  }

  /**
   * Validate download token and extract data
   */
  async validateDownloadToken(tokenId, requestMetadata) {
    try {
      // Check if token exists in active tokens
      const tokenInfo = this.activeTokens.get(tokenId);
      if (!tokenInfo) {
        throw new Error('Invalid or expired download token');
      }

      // Verify JWT token
      const decoded = jwt.verify(tokenId, this.config.jwtSecret, {
        issuer: 'mindhub-resources',
        audience: 'resource-download'
      });

      // Check token expiration
      if (Date.now() > decoded.restrictions.expiresAt) {
        this.activeTokens.delete(tokenId);
        throw new Error('Download token has expired');
      }

      // Check download attempts
      if (tokenInfo.attempts >= tokenInfo.maxAttempts) {
        this.activeTokens.delete(tokenId);
        throw new Error('Maximum download attempts exceeded');
      }

      // Verify IP address if restricted
      if (tokenInfo.ipAddress && requestMetadata.ipAddress) {
        if (tokenInfo.ipAddress !== requestMetadata.ipAddress) {
          throw new Error('Download request from unauthorized IP address');
        }
      }

      // Verify User Agent if restricted
      if (tokenInfo.userAgent && requestMetadata.userAgent) {
        if (tokenInfo.userAgent !== requestMetadata.userAgent) {
          // Log but don't block (User Agent can change)
          await this.logDownloadActivity({
            eventType: 'user_agent_mismatch',
            tokenId,
            expected: tokenInfo.userAgent,
            actual: requestMetadata.userAgent
          });
        }
      }

      return {
        resourceId: decoded.resourceId,
        userId: decoded.userId,
        tokenId: decoded.tokenId,
        restrictions: decoded.restrictions
      };

    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Validate user access to resource
   */
  async validateResourceAccess(resourceId, userId) {
    try {
      // Get resource from Firestore
      const FirestoreConfig = require('../../shared/config/firestore-resources-config');
      const firestoreConfig = new FirestoreConfig();
      await firestoreConfig.initialize();
      
      const resourceDoc = await firestoreConfig.getDocument('resources', resourceId).get();
      if (!resourceDoc.exists) {
        return false;
      }

      const resource = resourceDoc.data();
      const permissions = resource.permissions;

      // Check if resource is public
      if (permissions.public) {
        return true;
      }

      // Get user information
      const user = await this.getUserInfo(userId);
      if (!user) {
        return false;
      }

      // Check allowed users
      if (permissions.allowedUsers && permissions.allowedUsers.includes(userId)) {
        return true;
      }

      // Check allowed roles
      if (permissions.allowedRoles && permissions.allowedRoles.includes(user.role)) {
        return true;
      }

      // Check clinic restrictions
      if (permissions.restrictedClinics && permissions.restrictedClinics.length > 0) {
        if (!permissions.restrictedClinics.includes(user.clinicId)) {
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error validating resource access:', error);
      return false;
    }
  }

  /**
   * Check rate limiting for user
   */
  async checkRateLimit(userId) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    // Get or create rate limit tracker for user
    if (!this.rateLimitTracker.has(userId)) {
      this.rateLimitTracker.set(userId, []);
    }

    const userRequests = this.rateLimitTracker.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.rateLimitMax) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitTracker.set(userId, recentRequests);
  }

  /**
   * Generate personalized content
   */
  async generatePersonalizedContent(resource, personalizationData) {
    try {
      const PersonalizationService = require('./PersonalizationService');
      const personalizationService = new PersonalizationService();

      let personalizedContent;

      if (resource.type === 'text' || resource.type === 'template') {
        // Personalize text content
        personalizedContent = await personalizationService.personalizeText(
          resource.content.rawText,
          personalizationData.variables
        );

        // Generate PDF if requested
        if (personalizationData.outputFormat === 'pdf') {
          const pdfBuffer = await personalizationService.generatePersonalizedPDF(
            personalizedContent,
            personalizationData.variables,
            personalizationData.brandingOptions
          );
          
          return {
            buffer: pdfBuffer,
            size: pdfBuffer.length,
            mimeType: 'application/pdf'
          };
        } else {
          // Return as text file
          const textBuffer = Buffer.from(personalizedContent, 'utf8');
          return {
            buffer: textBuffer,
            size: textBuffer.length,
            mimeType: 'text/plain'
          };
        }
      } else if (resource.type === 'pdf') {
        // Personalize existing PDF
        const originalBuffer = await this.getFileBuffer(resource.content.filePath);
        const personalizedPdf = await personalizationService.personalizePDF(
          originalBuffer,
          personalizationData.variables,
          personalizationData.brandingOptions
        );

        return {
          buffer: personalizedPdf,
          size: personalizedPdf.length,
          mimeType: 'application/pdf'
        };
      } else {
        // For images and other files, return original
        return await this.getOriginalContent(resource);
      }

    } catch (error) {
      console.error('Error generating personalized content:', error);
      // Fallback to original content
      return await this.getOriginalContent(resource);
    }
  }

  /**
   * Get original content without personalization
   */
  async getOriginalContent(resource) {
    try {
      if (resource.type === 'text' || resource.type === 'template') {
        const textBuffer = Buffer.from(resource.content.rawText, 'utf8');
        return {
          buffer: textBuffer,
          size: textBuffer.length,
          mimeType: 'text/plain'
        };
      } else {
        // For files, get from storage
        const fileBuffer = await this.getFileBuffer(resource.content.filePath);
        return {
          buffer: fileBuffer,
          size: fileBuffer.length,
          mimeType: resource.content.mimeType
        };
      }
    } catch (error) {
      throw new Error(`Failed to retrieve original content: ${error.message}`);
    }
  }

  /**
   * Get file buffer from storage
   */
  async getFileBuffer(filePath) {
    try {
      if (this.config.storageProvider === 'local') {
        const fs = require('fs').promises;
        return await fs.readFile(filePath);
      } else if (this.config.storageProvider === 'gcs') {
        // Google Cloud Storage
        const { Storage } = require('@google-cloud/storage');
        const storage = new Storage();
        const file = storage.bucket(this.config.storageBucket).file(filePath);
        const [buffer] = await file.download();
        return buffer;
      } else if (this.config.storageProvider === 's3') {
        // Amazon S3
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const result = await s3.getObject({
          Bucket: this.config.storageBucket,
          Key: filePath
        }).promise();
        return result.Body;
      } else {
        throw new Error(`Unsupported storage provider: ${this.config.storageProvider}`);
      }
    } catch (error) {
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  }

  /**
   * Generate secure filename for download
   */
  generateSecureFileName(resource, personalizationData) {
    let baseName = resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    if (personalizationData?.variables?.nombrePaciente) {
      const patientName = personalizationData.variables.nombrePaciente
        .replace(/[^a-z0-9]/gi, '_').toLowerCase();
      baseName = `${baseName}_${patientName}`;
    }

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const extension = this.getFileExtension(resource);
    
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Get appropriate file extension
   */
  getFileExtension(resource) {
    if (resource.type === 'text' || resource.type === 'template') {
      return 'txt';
    } else if (resource.type === 'pdf') {
      return 'pdf';
    } else if (resource.content.mimeType) {
      const mimeMap = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
      };
      return mimeMap[resource.content.mimeType] || 'bin';
    }
    return 'bin';
  }

  /**
   * Increment download attempts for token
   */
  async incrementDownloadAttempts(tokenId) {
    const tokenInfo = this.activeTokens.get(tokenId);
    if (tokenInfo) {
      tokenInfo.attempts += 1;
      this.activeTokens.set(tokenId, tokenInfo);
      
      // Remove token if max attempts reached
      if (tokenInfo.attempts >= tokenInfo.maxAttempts) {
        this.activeTokens.delete(tokenId);
      }
    }
  }

  /**
   * Update resource download statistics
   */
  async updateResourceStats(resourceId, actionType) {
    try {
      const FirestoreConfig = require('../../shared/config/firestore-resources-config');
      const firestoreConfig = new FirestoreConfig();
      await firestoreConfig.initialize();
      
      const resourceRef = firestoreConfig.getDocument('resources', resourceId);
      
      const updateData = {};
      if (actionType === 'download') {
        updateData['metadata.downloadCount'] = require('firebase-admin/firestore').FieldValue.increment(1);
        updateData['metadata.lastUsed'] = new Date();
      }
      
      await resourceRef.update(updateData);
    } catch (error) {
      console.error('Error updating resource stats:', error);
    }
  }

  /**
   * Record resource usage for tracking
   */
  async recordResourceUsage(usageData) {
    try {
      const FirestoreConfig = require('../../shared/config/firestore-resources-config');
      const firestoreConfig = new FirestoreConfig();
      await firestoreConfig.initialize();
      
      const usageCollection = firestoreConfig.getCollection('resourceUsage');
      
      await usageCollection.add({
        resourceId: usageData.resourceId,
        userId: usageData.userId,
        method: usageData.method,
        sentAt: new Date(),
        downloadedAt: new Date(),
        status: 'downloaded',
        personalizedContent: usageData.personalizationData || null,
        metadata: {
          downloadedVia: 'secure_download_service',
          userAgent: usageData.userAgent,
          ipAddress: usageData.ipAddress
        }
      });
    } catch (error) {
      console.error('Error recording resource usage:', error);
    }
  }

  /**
   * Log download activity for audit trail
   */
  async logDownloadActivity(activityData) {
    try {
      const FirestoreConfig = require('../../shared/config/firestore-resources-config');
      const firestoreConfig = new FirestoreConfig();
      await firestoreConfig.initialize();
      
      const logsCollection = firestoreConfig.getCollection('accessLogs');
      
      await logsCollection.add({
        eventType: activityData.eventType,
        timestamp: new Date(),
        userId: activityData.userId,
        resourceId: activityData.resourceId,
        details: {
          tokenId: activityData.tokenId,
          success: !activityData.error,
          errorMessage: activityData.error || null,
          metadata: activityData.metadata || {}
        }
      });
    } catch (error) {
      console.error('Error logging download activity:', error);
    }
  }

  /**
   * Clean up expired tokens and rate limit data
   */
  cleanupExpiredData() {
    const now = Date.now();
    
    // Clean up expired tokens
    for (const [tokenId, tokenInfo] of this.activeTokens.entries()) {
      const expirationTime = tokenInfo.createdAt + this.parseExpiration(this.config.tokenExpiration);
      if (now > expirationTime) {
        this.activeTokens.delete(tokenId);
      }
    }
    
    // Clean up old rate limit data
    const windowStart = now - this.config.rateLimitWindow;
    for (const [userId, requests] of this.rateLimitTracker.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      if (recentRequests.length === 0) {
        this.rateLimitTracker.delete(userId);
      } else {
        this.rateLimitTracker.set(userId, recentRequests);
      }
    }
  }

  /**
   * Parse expiration string to milliseconds
   */
  parseExpiration(expiration) {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // Default 1 hour
    
    const [, value, unit] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(value) * multipliers[unit];
  }

  /**
   * Get user information (placeholder - integrate with your user service)
   */
  async getUserInfo(userId) {
    // This should integrate with your user authentication service
    // For now, return a mock user
    return {
      id: userId,
      role: 'psychiatrist', // This should come from your auth system
      clinicId: 'clinic-001' // This should come from your auth system
    };
  }

  /**
   * Get resource details from Firestore
   */
  async getResourceDetails(resourceId) {
    try {
      const FirestoreConfig = require('../../shared/config/firestore-resources-config');
      const firestoreConfig = new FirestoreConfig();
      await firestoreConfig.initialize();
      
      const resourceDoc = await firestoreConfig.getDocument('resources', resourceId).get();
      if (!resourceDoc.exists) {
        return null;
      }
      
      return { id: resourceDoc.id, ...resourceDoc.data() };
    } catch (error) {
      console.error('Error getting resource details:', error);
      return null;
    }
  }

  /**
   * Validate file access permissions
   */
  async validateFileAccess(resource, userId) {
    // Check if resource is active
    if (resource.status !== 'active') {
      throw new Error('Resource is not available for download');
    }

    // Check file size limits
    if (resource.content.fileSize > this.config.maxFileSize) {
      throw new Error('File size exceeds download limit');
    }

    // Check file type restrictions
    const fileExtension = this.getFileExtension(resource);
    if (!this.config.allowedFileTypes.includes(fileExtension)) {
      throw new Error('File type not allowed for download');
    }

    return true;
  }
}

module.exports = SecureDownloadService;