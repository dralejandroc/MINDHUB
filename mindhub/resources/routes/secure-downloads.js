/**
 * Secure Downloads API Routes for MindHub Resources Library
 * 
 * Provides secure download endpoints with authentication, token generation,
 * and comprehensive logging for healthcare compliance.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const SecureDownloadService = require('../services/SecureDownloadService');
const authMiddleware = require('../../shared/middleware/auth-middleware');

const router = express.Router();

// Initialize secure download service
const downloadService = new SecureDownloadService({
  jwtSecret: process.env.DOWNLOAD_JWT_SECRET || process.env.JWT_SECRET,
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storageBucket: process.env.STORAGE_BUCKET
});

// Rate limiting for download endpoints
const downloadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many download requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Token generation rate limiting (more restrictive)
const tokenRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 token requests per minute
  message: {
    error: 'Too many token requests',
    message: 'Please wait before requesting another download token'
  }
});

/**
 * @route POST /api/resources/download/token
 * @desc Generate secure download token for a resource
 * @access Private
 */
router.post('/token',
  tokenRateLimit,
  authMiddleware.authenticate,
  [
    body('resourceId')
      .notEmpty()
      .withMessage('Resource ID is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Invalid resource ID format'),
    body('personalizationData')
      .optional()
      .isObject()
      .withMessage('Personalization data must be an object'),
    body('personalizationData.variables')
      .optional()
      .isObject()
      .withMessage('Variables must be an object'),
    body('personalizationData.outputFormat')
      .optional()
      .isIn(['pdf', 'text', 'original'])
      .withMessage('Invalid output format'),
    body('restrictions')
      .optional()
      .isObject()
      .withMessage('Restrictions must be an object')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { resourceId, personalizationData, restrictions } = req.body;
      const userId = req.user.id;

      // Extract request metadata
      const requestMetadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        userId: userId,
        ...restrictions
      };

      // Generate secure download token
      const tokenResult = await downloadService.generateDownloadToken(
        resourceId,
        userId,
        requestMetadata
      );

      res.json({
        success: true,
        message: 'Download token generated successfully',
        data: {
          downloadToken: tokenResult.downloadToken,
          downloadUrl: tokenResult.downloadUrl,
          expiresAt: tokenResult.expiresAt,
          restrictions: {
            maxAttempts: downloadService.config.maxDownloadAttempts,
            validFor: downloadService.config.tokenExpiration
          }
        }
      });

    } catch (error) {
      console.error('Error generating download token:', error);
      
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message.includes('Access denied') 
          ? 'You do not have permission to download this resource'
          : 'Failed to generate download token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/resources/download/:tokenId
 * @desc Download resource using secure token
 * @access Public (but requires valid token)
 */
router.get('/download/:tokenId',
  downloadRateLimit,
  [
    param('tokenId')
      .notEmpty()
      .withMessage('Token ID is required')
      .isLength({ min: 10 })
      .withMessage('Invalid token format')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token format',
          errors: errors.array()
        });
      }

      const { tokenId } = req.params;

      // Extract request metadata
      const requestMetadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        personalizationData: req.query.personalize ? JSON.parse(req.query.personalize) : null
      };

      // Process secure download
      const downloadResult = await downloadService.processSecureDownload(tokenId, requestMetadata);

      // Set response headers for file download
      res.set({
        'Content-Type': downloadResult.contentType,
        'Content-Length': downloadResult.size,
        'Content-Disposition': `attachment; filename="${downloadResult.fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Download-ID': downloadResult.metadata.downloadId
      });

      // Send file data
      res.send(downloadResult.data);

    } catch (error) {
      console.error('Error processing download:', error);
      
      const statusCode = error.message.includes('expired') ? 410 :
                        error.message.includes('exceeded') ? 429 :
                        error.message.includes('denied') ? 403 :
                        error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route POST /api/resources/download/preview
 * @desc Generate preview of personalized content without downloading
 * @access Private
 */
router.post('/preview',
  authMiddleware.authenticate,
  [
    body('resourceId')
      .notEmpty()
      .withMessage('Resource ID is required'),
    body('personalizationData')
      .isObject()
      .withMessage('Personalization data is required'),
    body('personalizationData.variables')
      .isObject()
      .withMessage('Variables object is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { resourceId, personalizationData } = req.body;
      const userId = req.user.id;

      // Validate resource access
      const hasAccess = await downloadService.validateResourceAccess(resourceId, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to resource'
        });
      }

      // Get resource details
      const resource = await downloadService.getResourceDetails(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Generate preview (limited to text content only)
      if (resource.type === 'text' || resource.type === 'template') {
        const PersonalizationService = require('../services/PersonalizationService');
        const personalizationService = new PersonalizationService();
        
        const previewContent = await personalizationService.personalizeText(
          resource.content.rawText,
          personalizationData.variables
        );

        res.json({
          success: true,
          message: 'Preview generated successfully',
          data: {
            resourceTitle: resource.title,
            previewContent: previewContent.substring(0, 1000), // Limit preview to 1000 chars
            fullLength: previewContent.length,
            variables: personalizationData.variables,
            estimatedSize: Buffer.byteLength(previewContent, 'utf8')
          }
        });
      } else {
        res.json({
          success: true,
          message: 'Preview not available for this resource type',
          data: {
            resourceTitle: resource.title,
            resourceType: resource.type,
            originalSize: resource.content.fileSize,
            message: 'Preview is only available for text resources'
          }
        });
      }

    } catch (error) {
      console.error('Error generating preview:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/resources/download/status/:tokenId
 * @desc Check download token status and remaining attempts
 * @access Public (but requires valid token structure)
 */
router.get('/status/:tokenId',
  [
    param('tokenId')
      .notEmpty()
      .withMessage('Token ID is required')
  ],
  async (req, res) => {
    try {
      const { tokenId } = req.params;

      // Check if token exists in active tokens
      const tokenInfo = downloadService.activeTokens.get(tokenId);
      if (!tokenInfo) {
        return res.status(404).json({
          success: false,
          message: 'Token not found or expired'
        });
      }

      // Calculate expiration
      const expirationTime = tokenInfo.createdAt + downloadService.parseExpiration(downloadService.config.tokenExpiration);
      const isExpired = Date.now() > expirationTime;

      res.json({
        success: true,
        message: 'Token status retrieved',
        data: {
          tokenId: tokenId,
          isValid: !isExpired,
          remainingAttempts: Math.max(0, tokenInfo.maxAttempts - tokenInfo.attempts),
          expiresAt: expirationTime,
          expiresIn: Math.max(0, expirationTime - Date.now()),
          createdAt: tokenInfo.createdAt
        }
      });

    } catch (error) {
      console.error('Error checking token status:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check token status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route POST /api/resources/download/bulk-token
 * @desc Generate bulk download tokens for multiple resources
 * @access Private
 */
router.post('/bulk-token',
  tokenRateLimit,
  authMiddleware.authenticate,
  [
    body('resourceIds')
      .isArray({ min: 1, max: 10 })
      .withMessage('Resource IDs must be an array of 1-10 items'),
    body('resourceIds.*')
      .notEmpty()
      .withMessage('Each resource ID must be valid'),
    body('commonPersonalization')
      .optional()
      .isObject()
      .withMessage('Common personalization must be an object')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { resourceIds, commonPersonalization } = req.body;
      const userId = req.user.id;

      const requestMetadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Generate tokens for each resource
      const tokenResults = [];
      const errors = [];

      for (const resourceId of resourceIds) {
        try {
          const tokenResult = await downloadService.generateDownloadToken(
            resourceId,
            userId,
            requestMetadata
          );
          
          tokenResults.push({
            resourceId,
            success: true,
            downloadToken: tokenResult.downloadToken,
            downloadUrl: tokenResult.downloadUrl,
            expiresAt: tokenResult.expiresAt
          });
        } catch (error) {
          errors.push({
            resourceId,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: tokenResults.length > 0,
        message: `Generated ${tokenResults.length} download tokens`,
        data: {
          tokens: tokenResults,
          errors: errors,
          summary: {
            successful: tokenResults.length,
            failed: errors.length,
            total: resourceIds.length
          }
        }
      });

    } catch (error) {
      console.error('Error generating bulk tokens:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate bulk download tokens',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route DELETE /api/resources/download/token/:tokenId
 * @desc Revoke/invalidate a download token
 * @access Private
 */
router.delete('/token/:tokenId',
  authMiddleware.authenticate,
  [
    param('tokenId')
      .notEmpty()
      .withMessage('Token ID is required')
  ],
  async (req, res) => {
    try {
      const { tokenId } = req.params;
      const userId = req.user.id;

      // Check if token exists and belongs to user
      const tokenInfo = downloadService.activeTokens.get(tokenId);
      if (!tokenInfo) {
        return res.status(404).json({
          success: false,
          message: 'Token not found'
        });
      }

      if (tokenInfo.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot revoke token belonging to another user'
        });
      }

      // Remove token
      downloadService.activeTokens.delete(tokenId);

      // Log revocation
      await downloadService.logDownloadActivity({
        eventType: 'token_revoked',
        resourceId: tokenInfo.resourceId,
        userId: userId,
        tokenId: tokenId,
        metadata: {
          revokedBy: 'user',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: 'Download token revoked successfully'
      });

    } catch (error) {
      console.error('Error revoking token:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to revoke download token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Cleanup expired tokens every 15 minutes
setInterval(() => {
  downloadService.cleanupExpiredData();
}, 15 * 60 * 1000);

module.exports = router;