/**
 * Storage Management Routes for Resources Hub
 * 
 * Handles storage quota management, cleanup operations, and usage statistics
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../shared/middleware');
const StorageQuotaService = require('../services/StorageQuotaService');
const prisma = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');

// Initialize service
const storageQuotaService = new StorageQuotaService();

/**
 * Get current user's storage quota
 * GET /api/resources/storage/quota
 */
router.get('/quota', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const quota = await storageQuotaService.getUserQuota(userId);

    res.json({
      success: true,
      data: quota
    });

  } catch (error) {
    logger.error('Failed to get storage quota', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve storage quota'
    });
  }
});

/**
 * Get storage statistics
 * GET /api/resources/storage/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await storageQuotaService.getStorageStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get storage statistics', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve storage statistics'
    });
  }
});

/**
 * Preview cleanup operation (dry run)
 * GET /api/resources/storage/cleanup/preview
 */
router.get('/cleanup/preview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { maxAgeDays = 90 } = req.query;

    const maxAge = parseInt(maxAgeDays) * 24 * 60 * 60 * 1000;
    
    const preview = await storageQuotaService.cleanupUserStorage(userId, {
      dryRun: true,
      maxAge: maxAge,
      includeTemp: true
    });

    res.json({
      success: true,
      data: preview
    });

  } catch (error) {
    logger.error('Failed to preview cleanup', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to preview cleanup operation'
    });
  }
});

/**
 * Execute cleanup operation
 * POST /api/resources/storage/cleanup
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { maxAgeDays = 90, confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Please confirm the cleanup operation'
      });
    }

    const maxAge = parseInt(maxAgeDays) * 24 * 60 * 60 * 1000;
    
    const result = await storageQuotaService.cleanupUserStorage(userId, {
      dryRun: false,
      maxAge: maxAge,
      includeTemp: true
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Cleanup operation failed', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Cleanup operation failed'
    });
  }
});

/**
 * Update storage plan (admin only)
 * PUT /api/resources/storage/plan
 */
router.put('/plan', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId, planType } = req.body;

    if (!userId || !planType) {
      return res.status(400).json({
        success: false,
        error: 'User ID and plan type are required'
      });
    }

    const updatedQuota = await storageQuotaService.updateStoragePlan(userId, planType);

    res.json({
      success: true,
      data: {
        userId: updatedQuota.userId,
        planType: updatedQuota.planType,
        maxStorage: updatedQuota.maxStorageBytes,
        formattedMaxStorage: storageQuotaService.formatBytes(updatedQuota.maxStorageBytes)
      }
    });

  } catch (error) {
    logger.error('Failed to update storage plan', {
      error: error.message,
      adminId: req.user?.id,
      targetUserId: req.body.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update storage plan'
    });
  }
});

/**
 * Get file size limits
 * GET /api/resources/storage/limits
 */
router.get('/limits', authenticateToken, (req, res) => {
  const limits = {
    pdf: storageQuotaService.getFileSizeLimit('application/pdf'),
    image: storageQuotaService.getFileSizeLimit('image/jpeg'),
    video: storageQuotaService.getFileSizeLimit('video/mp4'),
    audio: storageQuotaService.getFileSizeLimit('audio/mpeg'),
    document: storageQuotaService.getFileSizeLimit('application/msword'),
    default: storageQuotaService.getFileSizeLimit('application/octet-stream')
  };

  const formattedLimits = Object.entries(limits).reduce((acc, [key, value]) => {
    acc[key] = {
      bytes: value,
      formatted: storageQuotaService.formatBytes(value)
    };
    return acc;
  }, {});

  res.json({
    success: true,
    data: formattedLimits
  });
});

/**
 * Check storage availability for file upload
 * POST /api/resources/storage/check
 */
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileSize, mimeType } = req.body;

    if (!fileSize) {
      return res.status(400).json({
        success: false,
        error: 'File size is required'
      });
    }

    // Validate against file type limit
    const fileSizeLimit = storageQuotaService.getFileSizeLimit(mimeType || 'application/octet-stream');
    if (fileSize > fileSizeLimit) {
      return res.json({
        success: true,
        data: {
          canUpload: false,
          reason: 'file_size_limit',
          message: `File exceeds the ${storageQuotaService.formatBytes(fileSizeLimit)} limit for this file type`
        }
      });
    }

    // Check storage quota
    const storageCheck = await storageQuotaService.checkStorageAvailable(userId, fileSize);

    res.json({
      success: true,
      data: {
        canUpload: storageCheck.hasSpace,
        reason: storageCheck.hasSpace ? null : 'storage_quota',
        message: storageCheck.message,
        availableSpace: storageCheck.availableSpace,
        formattedAvailableSpace: storageQuotaService.formatBytes(storageCheck.availableSpace)
      }
    });

  } catch (error) {
    logger.error('Failed to check storage availability', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to check storage availability'
    });
  }
});

/**
 * Get storage recommendations
 * GET /api/resources/storage/recommendations
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await storageQuotaService.getStorageStats(userId);

    res.json({
      success: true,
      data: {
        recommendations: stats.recommendations,
        currentUsage: {
          percentage: stats.quota.percentageUsed,
          formatted: stats.quota.formattedUsed
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get storage recommendations', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get storage recommendations'
    });
  }
});

module.exports = router;