/**
 * Storage Quota Service for Resources Hub
 * 
 * Manages user storage limits, tracks usage, and handles cleanup operations
 */

const prisma = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const FileStorageService = require('./FileStorageService');

class StorageQuotaService {
  constructor() {
    this.fileStorage = new FileStorageService();
    
    // Storage plans in bytes
    this.storagePlans = {
      basic: 500 * 1024 * 1024,         // 500MB
      professional: 2 * 1024 * 1024 * 1024,  // 2GB
      enterprise: 10 * 1024 * 1024 * 1024,   // 10GB
      unlimited: -1                      // No limit
    };
    
    // File size limits by type
    this.fileSizeLimits = {
      'application/pdf': 50 * 1024 * 1024,      // 50MB for PDFs
      'image/*': 10 * 1024 * 1024,              // 10MB for images
      'video/*': 200 * 1024 * 1024,             // 200MB for videos
      'audio/*': 50 * 1024 * 1024,              // 50MB for audio
      'default': 25 * 1024 * 1024               // 25MB default
    };
    
    // Cleanup policies
    this.cleanupPolicies = {
      tempFileMaxAge: 24 * 60 * 60 * 1000,      // 24 hours for temp files
      unusedFileMaxAge: 90 * 24 * 60 * 60 * 1000, // 90 days for unused files
      cleanupBatchSize: 100                      // Process 100 files per cleanup batch
    };
  }

  /**
   * Get user's storage quota information
   */
  async getUserQuota(userId) {
    try {
      // Get user's storage quota from database
      let userQuota = await prisma.userStorageQuota.findUnique({
        where: { userId: parseInt(userId) }
      });

      // If no quota exists, create default
      if (!userQuota) {
        userQuota = await this.createDefaultQuota(userId);
      }

      // Calculate percentage used
      const percentageUsed = userQuota.maxStorageBytes > 0 
        ? (userQuota.usedStorageBytes / userQuota.maxStorageBytes) * 100 
        : 0;

      return {
        userId: userQuota.userId,
        planType: userQuota.planType,
        maxStorage: userQuota.maxStorageBytes,
        usedStorage: userQuota.usedStorageBytes,
        availableStorage: userQuota.maxStorageBytes - userQuota.usedStorageBytes,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        lastCleanupDate: userQuota.lastCleanupDate,
        isUnlimited: userQuota.maxStorageBytes === -1,
        formattedMax: this.formatBytes(userQuota.maxStorageBytes),
        formattedUsed: this.formatBytes(userQuota.usedStorageBytes),
        formattedAvailable: this.formatBytes(userQuota.maxStorageBytes - userQuota.usedStorageBytes)
      };
    } catch (error) {
      logger.error('Failed to get user quota', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Check if user has sufficient storage space
   */
  async checkStorageAvailable(userId, fileSize) {
    try {
      const quota = await this.getUserQuota(userId);
      
      // Unlimited storage
      if (quota.isUnlimited) {
        return {
          hasSpace: true,
          availableSpace: -1,
          message: 'Unlimited storage available'
        };
      }
      
      // Check if file exceeds available space
      const hasSpace = quota.availableStorage >= fileSize;
      
      return {
        hasSpace,
        availableSpace: quota.availableStorage,
        requiredSpace: fileSize,
        message: hasSpace 
          ? `${this.formatBytes(quota.availableStorage)} available`
          : `Insufficient storage. Need ${this.formatBytes(fileSize)}, have ${this.formatBytes(quota.availableStorage)}`
      };
    } catch (error) {
      logger.error('Failed to check storage availability', {
        error: error.message,
        userId,
        fileSize
      });
      throw error;
    }
  }

  /**
   * Update user's storage usage
   */
  async updateStorageUsage(userId, sizeChange, operation = 'add') {
    try {
      const userQuota = await prisma.userStorageQuota.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!userQuota) {
        throw new Error('User quota not found');
      }

      let newUsedStorage;
      if (operation === 'add') {
        newUsedStorage = userQuota.usedStorageBytes + sizeChange;
      } else if (operation === 'subtract') {
        newUsedStorage = Math.max(0, userQuota.usedStorageBytes - sizeChange);
      } else {
        throw new Error('Invalid operation. Use "add" or "subtract"');
      }

      // Update storage usage
      const updatedQuota = await prisma.userStorageQuota.update({
        where: { userId: parseInt(userId) },
        data: { usedStorageBytes: newUsedStorage }
      });

      logger.info('Storage usage updated', {
        userId,
        operation,
        sizeChange,
        oldUsage: userQuota.usedStorageBytes,
        newUsage: newUsedStorage
      });

      // Check if user is approaching limit
      if (userQuota.maxStorageBytes > 0) {
        const percentageUsed = (newUsedStorage / userQuota.maxStorageBytes) * 100;
        
        if (percentageUsed >= 90) {
          await this.sendStorageWarning(userId, percentageUsed);
        }
      }

      return updatedQuota;
    } catch (error) {
      logger.error('Failed to update storage usage', {
        error: error.message,
        userId,
        sizeChange,
        operation
      });
      throw error;
    }
  }

  /**
   * Get file type limit
   */
  getFileSizeLimit(mimeType) {
    // Check specific mime type
    if (this.fileSizeLimits[mimeType]) {
      return this.fileSizeLimits[mimeType];
    }
    
    // Check wildcard patterns
    for (const [pattern, limit] of Object.entries(this.fileSizeLimits)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(mimeType)) {
          return limit;
        }
      }
    }
    
    // Return default limit
    return this.fileSizeLimits.default;
  }

  /**
   * Validate file upload against quotas
   */
  async validateFileUpload(userId, file) {
    try {
      // Check file type limit
      const fileSizeLimit = this.getFileSizeLimit(file.mimetype);
      if (file.size > fileSizeLimit) {
        return {
          valid: false,
          error: `File size exceeds limit of ${this.formatBytes(fileSizeLimit)} for this file type`
        };
      }
      
      // Check user storage quota
      const storageCheck = await this.checkStorageAvailable(userId, file.size);
      if (!storageCheck.hasSpace) {
        return {
          valid: false,
          error: storageCheck.message
        };
      }
      
      return {
        valid: true,
        message: 'File upload validated successfully'
      };
    } catch (error) {
      logger.error('Failed to validate file upload', {
        error: error.message,
        userId,
        fileName: file.originalname,
        fileSize: file.size
      });
      throw error;
    }
  }

  /**
   * Clean up unused files for a user
   */
  async cleanupUserStorage(userId, options = {}) {
    try {
      const {
        dryRun = false,
        maxAge = this.cleanupPolicies.unusedFileMaxAge,
        includeTemp = true
      } = options;

      logger.info('Starting storage cleanup', {
        userId,
        dryRun,
        maxAge: maxAge / (24 * 60 * 60 * 1000) + ' days'
      });

      // Get all user's resources
      const resources = await prisma.resource.findMany({
        where: {
          createdById: parseInt(userId),
          lastAccessedAt: {
            lt: new Date(Date.now() - maxAge)
          }
        },
        include: {
          distributions: true
        }
      });

      const filesToDelete = [];
      let totalSize = 0;

      // Identify files to delete
      for (const resource of resources) {
        // Skip if file has been distributed recently
        const recentDistribution = resource.distributions.some(
          dist => new Date(dist.sentDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        
        if (!recentDistribution) {
          filesToDelete.push({
            id: resource.id,
            filePath: resource.filePath,
            fileSize: resource.fileSize,
            lastAccessed: resource.lastAccessedAt
          });
          totalSize += resource.fileSize;
        }
      }

      if (dryRun) {
        return {
          dryRun: true,
          filesToDelete: filesToDelete.length,
          totalSizeToFree: totalSize,
          formattedSize: this.formatBytes(totalSize),
          files: filesToDelete.map(f => ({
            id: f.id,
            size: this.formatBytes(f.fileSize),
            lastAccessed: f.lastAccessed
          }))
        };
      }

      // Perform actual cleanup
      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of filesToDelete) {
        try {
          // Delete physical file
          await this.fileStorage.deleteFile(file.id, file.filePath);
          
          // Delete database record
          await prisma.resource.delete({
            where: { id: file.id }
          });
          
          deletedCount++;
          freedSpace += file.fileSize;
        } catch (error) {
          logger.error('Failed to delete file during cleanup', {
            error: error.message,
            fileId: file.id
          });
        }
      }

      // Update user's storage usage
      if (freedSpace > 0) {
        await this.updateStorageUsage(userId, freedSpace, 'subtract');
      }

      // Update last cleanup date
      await prisma.userStorageQuota.update({
        where: { userId: parseInt(userId) },
        data: { lastCleanupDate: new Date() }
      });

      logger.info('Storage cleanup completed', {
        userId,
        deletedCount,
        freedSpace,
        formattedFreedSpace: this.formatBytes(freedSpace)
      });

      return {
        success: true,
        deletedCount,
        freedSpace,
        formattedFreedSpace: this.formatBytes(freedSpace)
      };
    } catch (error) {
      logger.error('Storage cleanup failed', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get storage statistics for a user
   */
  async getStorageStats(userId) {
    try {
      const quota = await this.getUserQuota(userId);
      
      // Get breakdown by resource type
      const resourceStats = await prisma.resource.groupBy({
        by: ['type'],
        where: { createdById: parseInt(userId) },
        _sum: { fileSize: true },
        _count: { id: true }
      });

      // Get recent uploads
      const recentUploads = await prisma.resource.findMany({
        where: { createdById: parseInt(userId) },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          fileSize: true,
          type: true,
          createdAt: true
        }
      });

      // Calculate storage by month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyUploads = await prisma.resource.groupBy({
        by: ['createdAt'],
        where: {
          createdById: parseInt(userId),
          createdAt: { gte: sixMonthsAgo }
        },
        _sum: { fileSize: true },
        _count: { id: true }
      });

      return {
        quota,
        breakdown: resourceStats.map(stat => ({
          type: stat.type,
          count: stat._count.id,
          totalSize: stat._sum.fileSize || 0,
          formattedSize: this.formatBytes(stat._sum.fileSize || 0)
        })),
        recentUploads: recentUploads.map(upload => ({
          ...upload,
          formattedSize: this.formatBytes(upload.fileSize)
        })),
        monthlyTrend: this.processMonthlyData(monthlyUploads),
        recommendations: this.getStorageRecommendations(quota, resourceStats)
      };
    } catch (error) {
      logger.error('Failed to get storage statistics', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Create default quota for new user
   */
  async createDefaultQuota(userId) {
    try {
      return await prisma.userStorageQuota.create({
        data: {
          userId: parseInt(userId),
          planType: 'basic',
          maxStorageBytes: this.storagePlans.basic,
          usedStorageBytes: 0,
          lastCleanupDate: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to create default quota', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Update user's storage plan
   */
  async updateStoragePlan(userId, newPlanType) {
    try {
      if (!this.storagePlans[newPlanType]) {
        throw new Error(`Invalid plan type: ${newPlanType}`);
      }

      const updatedQuota = await prisma.userStorageQuota.update({
        where: { userId: parseInt(userId) },
        data: {
          planType: newPlanType,
          maxStorageBytes: this.storagePlans[newPlanType]
        }
      });

      logger.info('Storage plan updated', {
        userId,
        oldPlan: updatedQuota.planType,
        newPlan: newPlanType,
        newLimit: this.formatBytes(this.storagePlans[newPlanType])
      });

      return updatedQuota;
    } catch (error) {
      logger.error('Failed to update storage plan', {
        error: error.message,
        userId,
        newPlanType
      });
      throw error;
    }
  }

  /**
   * Send storage warning notification
   */
  async sendStorageWarning(userId, percentageUsed) {
    try {
      // In a real implementation, this would send an email or in-app notification
      logger.warn('Storage warning triggered', {
        userId,
        percentageUsed: Math.round(percentageUsed)
      });

      // You could integrate with NotificationService here
      // await notificationService.send({
      //   userId,
      //   type: 'storage_warning',
      //   data: { percentageUsed }
      // });
    } catch (error) {
      logger.error('Failed to send storage warning', {
        error: error.message,
        userId
      });
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === -1) return 'Unlimited';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Process monthly data for trends
   */
  processMonthlyData(monthlyData) {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthData = monthlyData.find(data => 
        data.createdAt.toISOString().startsWith(monthKey)
      );
      
      months.push({
        month: date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
        uploads: monthData?._count.id || 0,
        size: monthData?._sum.fileSize || 0,
        formattedSize: this.formatBytes(monthData?._sum.fileSize || 0)
      });
    }
    
    return months;
  }

  /**
   * Get storage recommendations
   */
  getStorageRecommendations(quota, resourceStats) {
    const recommendations = [];
    
    // Check if approaching limit
    if (quota.percentageUsed > 80 && !quota.isUnlimited) {
      recommendations.push({
        type: 'warning',
        message: 'Estás cerca de alcanzar tu límite de almacenamiento',
        action: 'Considera actualizar tu plan o eliminar archivos antiguos'
      });
    }
    
    // Check for large files
    const largeFileTypes = resourceStats.filter(stat => 
      stat._sum.fileSize > 100 * 1024 * 1024 // 100MB
    );
    
    if (largeFileTypes.length > 0) {
      recommendations.push({
        type: 'tip',
        message: 'Tienes archivos grandes que ocupan mucho espacio',
        action: 'Considera comprimir videos o usar formatos más eficientes'
      });
    }
    
    // Check last cleanup date
    if (quota.lastCleanupDate) {
      const daysSinceCleanup = Math.floor(
        (Date.now() - new Date(quota.lastCleanupDate).getTime()) / (24 * 60 * 60 * 1000)
      );
      
      if (daysSinceCleanup > 30) {
        recommendations.push({
          type: 'suggestion',
          message: 'No has limpiado tu almacenamiento en más de 30 días',
          action: 'Ejecuta una limpieza para liberar espacio de archivos no utilizados'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Compress PDF files to save space
   */
  async compressPDF(pdfBuffer) {
    try {
      // This is a placeholder - in production you'd use a PDF compression library
      // like ghostscript or pdf-lib with compression options
      logger.info('PDF compression requested');
      
      // For now, return original buffer
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF compression failed', {
        error: error.message
      });
      return pdfBuffer;
    }
  }
}

module.exports = StorageQuotaService;