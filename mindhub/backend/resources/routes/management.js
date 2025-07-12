/**
 * Resources Management Routes
 * 
 * Manages resource creation, editing, and administration.
 * Handles file uploads, versioning, and content management.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * POST /api/resources/management/upload
 * Upload new resource
 */
router.post('/upload', [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('category').isIn(['depression', 'anxiety', 'bipolar', 'trauma', 'addiction', 'eating_disorders', 'personality_disorders', 'psychosis', 'relationships', 'parenting', 'grief', 'stress_management']).withMessage('Invalid category'),
  body('resourceType').isIn(['educational_handouts', 'worksheets', 'audio_materials', 'video_content', 'interactive_tools', 'assessment_guides', 'treatment_protocols', 'self_help_guides']).withMessage('Invalid resource type'),
  body('language').isIn(['es', 'en']).withMessage('Invalid language'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('fileUrl').isURL().withMessage('Valid file URL is required'),
  body('fileSize').optional().isInt({ min: 1 }).withMessage('File size must be a positive integer'),
  body('mimeType').optional().trim().isLength({ min: 1 }).withMessage('MIME type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const resourceData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Create resource
    const resource = await executeQuery(
      (prisma) => prisma.resource.create({
        data: {
          title: resourceData.title,
          description: resourceData.description,
          category: resourceData.category,
          resourceType: resourceData.resourceType,
          language: resourceData.language,
          difficulty: resourceData.difficulty || 'intermediate',
          tags: resourceData.tags || [],
          fileUrl: resourceData.fileUrl,
          fileSize: resourceData.fileSize,
          mimeType: resourceData.mimeType,
          isActive: true,
          createdBy: userId,
          currentVersion: 1,
          versions: {
            create: {
              versionNumber: 1,
              fileUrl: resourceData.fileUrl,
              fileSize: resourceData.fileSize,
              mimeType: resourceData.mimeType,
              changeNotes: 'Initial version',
              createdBy: userId
            }
          }
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          versions: {
            orderBy: { versionNumber: 'desc' }
          }
        }
      }),
      'createResource'
    );

    // Log creation for compliance
    logger.info('Resource created', {
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      resourceType: resource.resourceType,
      language: resource.language,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource
    });

  } catch (error) {
    logger.error('Failed to create resource', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create resource', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/resources/management/:id
 * Update existing resource
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid resource ID format'),
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('category').optional().isIn(['depression', 'anxiety', 'bipolar', 'trauma', 'addiction', 'eating_disorders', 'personality_disorders', 'psychosis', 'relationships', 'parenting', 'grief', 'stress_management']).withMessage('Invalid category'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    // Check if resource exists
    const existingResource = await executeQuery(
      (prisma) => prisma.resource.findUnique({
        where: { id },
        select: { id: true, title: true }
      }),
      `checkResource(${id})`
    );

    if (!existingResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Update resource
    const resource = await executeQuery(
      (prisma) => prisma.resource.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      }),
      `updateResource(${id})`
    );

    // Log update for compliance
    logger.info('Resource updated', {
      resourceId: id,
      resourceTitle: existingResource.title,
      updatedBy: userId,
      changes: Object.keys(updateData),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resource
    });

  } catch (error) {
    logger.error('Failed to update resource', { 
      error: error.message,
      resourceId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update resource', 
      details: error.message 
    });
  }
});

/**
 * POST /api/resources/management/:id/version
 * Create new version of resource
 */
router.post('/:id/version', [
  param('id').isUUID().withMessage('Invalid resource ID format'),
  body('fileUrl').isURL().withMessage('Valid file URL is required'),
  body('fileSize').optional().isInt({ min: 1 }).withMessage('File size must be a positive integer'),
  body('mimeType').optional().trim().isLength({ min: 1 }).withMessage('MIME type is required'),
  body('changeNotes').trim().isLength({ min: 5, max: 500 }).withMessage('Change notes must be between 5 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const versionData = req.body;
    const userId = req.user?.id;

    // Get current resource and version
    const resource = await executeQuery(
      (prisma) => prisma.resource.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      }),
      `getResourceForVersioning(${id})`
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const nextVersion = resource.currentVersion + 1;

    // Create new version and update resource
    const [newVersion] = await executeTransaction([
      (prisma) => prisma.resourceVersion.create({
        data: {
          resourceId: id,
          versionNumber: nextVersion,
          fileUrl: versionData.fileUrl,
          fileSize: versionData.fileSize,
          mimeType: versionData.mimeType,
          changeNotes: versionData.changeNotes,
          createdBy: userId
        }
      }),
      (prisma) => prisma.resource.update({
        where: { id },
        data: {
          currentVersion: nextVersion,
          fileUrl: versionData.fileUrl,
          fileSize: versionData.fileSize,
          mimeType: versionData.mimeType,
          updatedAt: new Date()
        }
      })
    ], 'createResourceVersion');

    // Log version creation
    logger.info('Resource version created', {
      resourceId: id,
      versionNumber: nextVersion,
      changeNotes: versionData.changeNotes,
      createdBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Resource version created successfully',
      data: newVersion
    });

  } catch (error) {
    logger.error('Failed to create resource version', { 
      error: error.message,
      resourceId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to create resource version', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/resources/management/:id
 * Soft delete resource (set isActive to false)
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid resource ID format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    // Check if resource exists
    const existingResource = await executeQuery(
      (prisma) => prisma.resource.findUnique({
        where: { id },
        select: { id: true, title: true, isActive: true }
      }),
      `checkResource(${id})`
    );

    if (!existingResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (!existingResource.isActive) {
      return res.status(400).json({ error: 'Resource is already inactive' });
    }

    // Soft delete (set isActive to false)
    await executeQuery(
      (prisma) => prisma.resource.update({
        where: { id },
        data: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: userId
        }
      }),
      `deactivateResource(${id})`
    );

    // Log deletion for compliance
    logger.warn('Resource deactivated', {
      resourceId: id,
      resourceTitle: existingResource.title,
      deactivatedBy: userId,
      reason,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Resource deactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to deactivate resource', { 
      error: error.message,
      resourceId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to deactivate resource', 
      details: error.message 
    });
  }
});

module.exports = router;