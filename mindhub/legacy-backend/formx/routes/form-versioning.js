/**
 * Form Versioning API Routes for Formx Hub
 * 
 * Advanced form versioning system with version history, rollback capabilities,
 * and change tracking for compliance and audit requirements
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * POST /api/formx/forms/:id/versions
 * Create a new version of a form
 */
router.post('/:id/versions',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    body('versionName').isString().isLength({ min: 1, max: 100 }).withMessage('Version name is required'),
    body('changes').isArray().withMessage('Changes must be an array'),
    body('changeDescription').optional().isString().isLength({ max: 500 }),
    body('isMinorChange').optional().isBoolean(),
    body('formSchema').isObject().withMessage('Form schema is required'),
    body('validationRules').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const {
        versionName,
        changes,
        changeDescription,
        isMinorChange = false,
        formSchema,
        validationRules
      } = req.body;

      const userId = req.user?.id;

      // Get current form
      const currentForm = await executeQuery(
        (prisma) => prisma.form.findUnique({
          where: { id },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }),
        `getCurrentForm(${id})`
      );

      if (!currentForm) {
        return res.status(404).json({
          error: 'Form not found',
          message: 'The specified form was not found'
        });
      }

      // Calculate new version number
      const currentVersion = currentForm.versions[0];
      const newVersionNumber = calculateNextVersion(currentVersion?.versionNumber || '1.0.0', isMinorChange);

      // Create new version
      const newVersion = await executeTransaction([
        async (prisma) => {
          // Create version record
          const version = await prisma.formVersion.create({
            data: {
              id: uuidv4(),
              formId: id,
              versionNumber: newVersionNumber,
              versionName: versionName,
              formSchema: formSchema,
              validationRules: validationRules || {},
              changes: changes,
              changeDescription: changeDescription,
              isMinorChange: isMinorChange,
              createdBy: userId,
              isActive: true,
              createdAt: new Date()
            }
          });

          // Deactivate previous version
          if (currentVersion) {
            await prisma.formVersion.update({
              where: { id: currentVersion.id },
              data: { isActive: false }
            });
          }

          // Update form with new version
          await prisma.form.update({
            where: { id },
            data: {
              currentVersionId: version.id,
              currentVersionNumber: newVersionNumber,
              updatedAt: new Date()
            }
          });

          return version;
        }
      ], 'createFormVersion');

      // Log version creation
      await auditLogger.logDataModification(
        userId,
        'FORM_VERSION_CREATE',
        {
          formId: id,
          versionId: newVersion.id,
          versionNumber: newVersionNumber,
          versionName: versionName,
          changes: changes,
          isMinorChange: isMinorChange
        }
      );

      res.status(201).json({
        success: true,
        message: 'Form version created successfully',
        data: {
          version: newVersion,
          formId: id,
          previousVersion: currentVersion?.versionNumber || null
        }
      });

    } catch (error) {
      logger.error('Failed to create form version', {
        error: error.message,
        stack: error.stack,
        formId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Version creation failed',
        message: 'An error occurred while creating the form version'
      });
    }
  }
);

/**
 * GET /api/formx/forms/:id/versions
 * Get version history for a form
 */
router.get('/:id/versions',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    query('includeInactive').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { includeInactive = false, limit = 50 } = req.query;
      const userId = req.user?.id;

      // Build where clause
      const whereClause = { formId: id };
      if (!includeInactive) {
        whereClause.isActive = true;
      }

      // Get versions
      const versions = await executeQuery(
        (prisma) => prisma.formVersion.findMany({
          where: whereClause,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            form: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit)
        }),
        `getFormVersions(${id})`
      );

      // Get version statistics
      const versionStats = await executeQuery(
        (prisma) => prisma.formVersion.groupBy({
          by: ['isActive'],
          where: { formId: id },
          _count: {
            isActive: true
          }
        }),
        'getVersionStats'
      );

      const stats = {
        totalVersions: versions.length,
        activeVersions: versionStats.find(s => s.isActive === true)?._count.isActive || 0,
        inactiveVersions: versionStats.find(s => s.isActive === false)?._count.isActive || 0
      };

      // Log version access
      await auditLogger.logDataAccess(
        userId,
        'form_versions',
        id,
        'view',
        {
          formId: id,
          versionCount: versions.length,
          includeInactive: includeInactive
        }
      );

      res.json({
        success: true,
        data: {
          versions: versions,
          statistics: stats,
          form: versions[0]?.form || null
        }
      });

    } catch (error) {
      logger.error('Failed to get form versions', {
        error: error.message,
        formId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Version retrieval failed',
        message: 'An error occurred while retrieving form versions'
      });
    }
  }
);

/**
 * GET /api/formx/forms/:id/versions/:versionId
 * Get specific version details
 */
router.get('/:id/versions/:versionId',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    param('versionId').isUUID().withMessage('Invalid version ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, versionId } = req.params;
      const userId = req.user?.id;

      // Get version details
      const version = await executeQuery(
        (prisma) => prisma.formVersion.findUnique({
          where: { 
            id: versionId,
            formId: id
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            form: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true
              }
            }
          }
        }),
        `getFormVersion(${versionId})`
      );

      if (!version) {
        return res.status(404).json({
          error: 'Version not found',
          message: 'The specified form version was not found'
        });
      }

      // Get submissions using this version
      const submissionCount = await executeQuery(
        (prisma) => prisma.formSubmission.count({
          where: {
            formId: id,
            versionId: versionId
          }
        }),
        'getVersionSubmissionCount'
      );

      // Log version access
      await auditLogger.logDataAccess(
        userId,
        'form_version',
        versionId,
        'view',
        {
          formId: id,
          versionId: versionId,
          versionNumber: version.versionNumber
        }
      );

      res.json({
        success: true,
        data: {
          version: version,
          usage: {
            submissionCount: submissionCount,
            isCurrentVersion: version.isActive
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get form version', {
        error: error.message,
        formId: req.params.id,
        versionId: req.params.versionId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Version retrieval failed',
        message: 'An error occurred while retrieving the form version'
      });
    }
  }
);

/**
 * POST /api/formx/forms/:id/versions/:versionId/activate
 * Activate a specific version (rollback)
 */
router.post('/:id/versions/:versionId/activate',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    param('versionId').isUUID().withMessage('Invalid version ID format'),
    body('reason').isString().isLength({ min: 1, max: 500 }).withMessage('Reason is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, versionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      // Get version to activate
      const version = await executeQuery(
        (prisma) => prisma.formVersion.findUnique({
          where: { 
            id: versionId,
            formId: id
          }
        }),
        `getVersionToActivate(${versionId})`
      );

      if (!version) {
        return res.status(404).json({
          error: 'Version not found',
          message: 'The specified form version was not found'
        });
      }

      if (version.isActive) {
        return res.status(400).json({
          error: 'Version already active',
          message: 'This version is already the active version'
        });
      }

      // Activate version
      await executeTransaction([
        async (prisma) => {
          // Deactivate all versions
          await prisma.formVersion.updateMany({
            where: { formId: id },
            data: { isActive: false }
          });

          // Activate target version
          await prisma.formVersion.update({
            where: { id: versionId },
            data: { 
              isActive: true,
              reactivatedAt: new Date(),
              reactivatedBy: userId,
              reactivationReason: reason
            }
          });

          // Update form
          await prisma.form.update({
            where: { id },
            data: {
              currentVersionId: versionId,
              currentVersionNumber: version.versionNumber,
              updatedAt: new Date()
            }
          });
        }
      ], 'activateFormVersion');

      // Log version activation
      await auditLogger.logDataModification(
        userId,
        'FORM_VERSION_ACTIVATE',
        {
          formId: id,
          versionId: versionId,
          versionNumber: version.versionNumber,
          reason: reason
        }
      );

      res.json({
        success: true,
        message: 'Form version activated successfully',
        data: {
          formId: id,
          versionId: versionId,
          versionNumber: version.versionNumber,
          reason: reason
        }
      });

    } catch (error) {
      logger.error('Failed to activate form version', {
        error: error.message,
        formId: req.params.id,
        versionId: req.params.versionId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Version activation failed',
        message: 'An error occurred while activating the form version'
      });
    }
  }
);

/**
 * GET /api/formx/forms/:id/versions/compare
 * Compare two form versions
 */
router.get('/:id/versions/compare',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    query('fromVersion').isUUID().withMessage('From version ID is required'),
    query('toVersion').isUUID().withMessage('To version ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { fromVersion, toVersion } = req.query;
      const userId = req.user?.id;

      // Get both versions
      const [fromVersionData, toVersionData] = await Promise.all([
        executeQuery(
          (prisma) => prisma.formVersion.findUnique({
            where: { id: fromVersion, formId: id }
          }),
          'getFromVersion'
        ),
        executeQuery(
          (prisma) => prisma.formVersion.findUnique({
            where: { id: toVersion, formId: id }
          }),
          'getToVersion'
        )
      ]);

      if (!fromVersionData || !toVersionData) {
        return res.status(404).json({
          error: 'Version not found',
          message: 'One or both specified versions were not found'
        });
      }

      // Compare versions
      const comparison = compareFormVersions(fromVersionData, toVersionData);

      // Log comparison access
      await auditLogger.logDataAccess(
        userId,
        'form_version_comparison',
        id,
        'view',
        {
          formId: id,
          fromVersion: fromVersionData.versionNumber,
          toVersion: toVersionData.versionNumber
        }
      );

      res.json({
        success: true,
        data: {
          comparison: comparison,
          fromVersion: {
            id: fromVersionData.id,
            versionNumber: fromVersionData.versionNumber,
            versionName: fromVersionData.versionName,
            createdAt: fromVersionData.createdAt
          },
          toVersion: {
            id: toVersionData.id,
            versionNumber: toVersionData.versionNumber,
            versionName: toVersionData.versionName,
            createdAt: toVersionData.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Failed to compare form versions', {
        error: error.message,
        formId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Version comparison failed',
        message: 'An error occurred while comparing form versions'
      });
    }
  }
);

/**
 * Helper function to calculate next version number
 */
function calculateNextVersion(currentVersion, isMinorChange) {
  const parts = currentVersion.split('.').map(Number);
  
  if (isMinorChange) {
    // Increment patch version (1.0.0 -> 1.0.1)
    parts[2] = (parts[2] || 0) + 1;
  } else {
    // Increment minor version (1.0.0 -> 1.1.0)
    parts[1] = (parts[1] || 0) + 1;
    parts[2] = 0;
  }
  
  return parts.join('.');
}

/**
 * Helper function to compare form versions
 */
function compareFormVersions(fromVersion, toVersion) {
  const changes = {
    fieldsAdded: [],
    fieldsRemoved: [],
    fieldsModified: [],
    validationChanges: [],
    schemaChanges: []
  };

  // Compare form schemas
  const fromSchema = fromVersion.formSchema || {};
  const toSchema = toVersion.formSchema || {};

  // Compare fields
  const fromFields = fromSchema.fields || [];
  const toFields = toSchema.fields || [];

  // Find added fields
  toFields.forEach(field => {
    if (!fromFields.find(f => f.id === field.id)) {
      changes.fieldsAdded.push(field);
    }
  });

  // Find removed fields
  fromFields.forEach(field => {
    if (!toFields.find(f => f.id === field.id)) {
      changes.fieldsRemoved.push(field);
    }
  });

  // Find modified fields
  fromFields.forEach(fromField => {
    const toField = toFields.find(f => f.id === fromField.id);
    if (toField && JSON.stringify(fromField) !== JSON.stringify(toField)) {
      changes.fieldsModified.push({
        from: fromField,
        to: toField
      });
    }
  });

  // Compare validation rules
  const fromValidation = fromVersion.validationRules || {};
  const toValidation = toVersion.validationRules || {};

  if (JSON.stringify(fromValidation) !== JSON.stringify(toValidation)) {
    changes.validationChanges.push({
      from: fromValidation,
      to: toValidation
    });
  }

  return changes;
}

module.exports = router;