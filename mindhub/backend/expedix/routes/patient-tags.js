/**
 * Patient Tags System for Expedix Hub
 * 
 * Visual classification system for patients with customizable tags
 * for easy identification and organization in the medical record system
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { validatePatientId, validateEntityId } = require('../../shared/utils/id-validators');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Predefined tag categories with colors for visual identification
 */
const DEFAULT_TAG_CATEGORIES = {
  priority: {
    name: "Prioridad",
    tags: [
      { name: "Urgente", color: "#FF4444", textColor: "#FFFFFF", icon: "⚠️" },
      { name: "Alta", color: "#FF8800", textColor: "#FFFFFF", icon: "🔴" },
      { name: "Normal", color: "#4CAF50", textColor: "#FFFFFF", icon: "🟢" },
      { name: "Baja", color: "#2196F3", textColor: "#FFFFFF", icon: "🔵" }
    ]
  },
  condition: {
    name: "Condición",
    tags: [
      { name: "Depresión", color: "#9C27B0", textColor: "#FFFFFF", icon: "🧠" },
      { name: "Ansiedad", color: "#FF9800", textColor: "#FFFFFF", icon: "😰" },
      { name: "Bipolar", color: "#E91E63", textColor: "#FFFFFF", icon: "⚖️" },
      { name: "TDAH", color: "#00BCD4", textColor: "#FFFFFF", icon: "⚡" },
      { name: "Esquizofrenia", color: "#795548", textColor: "#FFFFFF", icon: "🌀" },
      { name: "TOC", color: "#607D8B", textColor: "#FFFFFF", icon: "🔄" }
    ]
  },
  status: {
    name: "Estado",
    tags: [
      { name: "Activo", color: "#4CAF50", textColor: "#FFFFFF", icon: "✅" },
      { name: "Inactivo", color: "#9E9E9E", textColor: "#FFFFFF", icon: "⏸️" },
      { name: "En Tratamiento", color: "#2196F3", textColor: "#FFFFFF", icon: "💊" },
      { name: "Alta Médica", color: "#8BC34A", textColor: "#FFFFFF", icon: "🎯" },
      { name: "Derivado", color: "#FF5722", textColor: "#FFFFFF", icon: "↗️" },
      { name: "No Show", color: "#F44336", textColor: "#FFFFFF", icon: "❌" }
    ]
  },
  age_group: {
    name: "Grupo Etario",
    tags: [
      { name: "Infantil", color: "#FFB74D", textColor: "#000000", icon: "👶" },
      { name: "Adolescente", color: "#81C784", textColor: "#000000", icon: "🧒" },
      { name: "Adulto", color: "#64B5F6", textColor: "#000000", icon: "👤" },
      { name: "Adulto Mayor", color: "#A1887F", textColor: "#FFFFFF", icon: "👴" }
    ]
  },
  risk: {
    name: "Nivel de Riesgo",
    tags: [
      { name: "Bajo Riesgo", color: "#C8E6C9", textColor: "#2E7D32", icon: "🟢" },
      { name: "Riesgo Moderado", color: "#FFF3E0", textColor: "#E65100", icon: "🟡" },
      { name: "Alto Riesgo", color: "#FFCDD2", textColor: "#C62828", icon: "🔴" },
      { name: "Riesgo Crítico", color: "#D32F2F", textColor: "#FFFFFF", icon: "🚨" }
    ]
  },
  insurance: {
    name: "Seguro Médico",
    tags: [
      { name: "IMSS", color: "#1B5E20", textColor: "#FFFFFF", icon: "🏥" },
      { name: "ISSSTE", color: "#0D47A1", textColor: "#FFFFFF", icon: "🏛️" },
      { name: "Seguro Popular", color: "#E65100", textColor: "#FFFFFF", icon: "👥" },
      { name: "Privado", color: "#4A148C", textColor: "#FFFFFF", icon: "💎" },
      { name: "Sin Seguro", color: "#424242", textColor: "#FFFFFF", icon: "❌" }
    ]
  }
};

/**
 * GET /api/expedix/patient-tags/categories
 * Get all available tag categories and predefined tags
 */
router.get('/categories',
  // ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_data']), // Temporarily disabled for development
  async (req, res) => {
    try {
      // Get custom tags from database
      const customTags = await executeQuery(
        (prisma) => prisma.patientTag.findMany({
          where: { isActive: true },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        }),
        'getCustomPatientTags'
      );

      // Group custom tags by category
      const customTagsByCategory = customTags.reduce((acc, tag) => {
        if (!acc[tag.category]) {
          acc[tag.category] = {
            name: tag.category,
            tags: []
          };
        }
        acc[tag.category].tags.push(tag);
        return acc;
      }, {});

      // Combine default and custom tags
      const allCategories = {
        ...DEFAULT_TAG_CATEGORIES,
        ...customTagsByCategory
      };

      res.json({
        success: true,
        data: {
          categories: allCategories,
          defaultCategories: Object.keys(DEFAULT_TAG_CATEGORIES),
          customCategories: Object.keys(customTagsByCategory)
        }
      });

    } catch (error) {
      logger.error('Failed to get tag categories', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tag categories',
        message: 'An error occurred while retrieving tag categories'
      });
    }
  }
);

/**
 * POST /api/expedix/patient-tags/create-custom
 * Create a custom patient tag
 */
router.post('/create-custom',
  // ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:patient_data']), // Temporarily disabled for development
  [
    body('name').isString().isLength({ min: 1, max: 50 }).withMessage('Tag name must be 1-50 characters'),
    body('category').isString().isLength({ min: 1, max: 30 }).withMessage('Category must be 1-30 characters'),
    body('color').matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
    body('textColor').matches(/^#[0-9A-F]{6}$/i).withMessage('Text color must be a valid hex color'),
    body('icon').optional().isString().isLength({ max: 10 }),
    body('description').optional().isString().isLength({ max: 200 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        name,
        category,
        color,
        textColor,
        icon,
        description
      } = req.body;

      const userId = req.user?.id;

      // Check if tag already exists
      const existingTag = await executeQuery(
        (prisma) => prisma.patientTag.findFirst({
          where: {
            name: name,
            category: category,
            isActive: true
          }
        }),
        'checkExistingTag'
      );

      if (existingTag) {
        return res.status(409).json({
          success: false,
          error: 'Tag already exists',
          message: 'A tag with this name already exists in this category'
        });
      }

      // Create custom tag
      const customTag = await executeQuery(
        (prisma) => prisma.patientTag.create({
          data: {
            id: uuidv4(),
            name: name,
            category: category,
            color: color,
            textColor: textColor,
            icon: icon || '🏷️',
            description: description,
            isCustom: true,
            isActive: true,
            createdBy: userId,
            createdAt: new Date()
          }
        }),
        'createCustomPatientTag'
      );

      // Log tag creation
      logger.info('Custom patient tag created', {
        tagId: customTag.id,
        name: name,
        category: category,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Custom tag created successfully',
        data: customTag
      });

    } catch (error) {
      logger.error('Failed to create custom tag', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create custom tag',
        message: 'An error occurred while creating the custom tag'
      });
    }
  }
);

/**
 * PUT /api/expedix/patient-tags/patient/:patientId
 * Add or update tags for a patient
 */
router.put('/patient/:patientId',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId),
    body('tags').isArray().withMessage('Tags must be an array'),
    body('tags.*.tagId').optional().custom(validateEntityId),
    body('tags.*.predefinedTag').optional().isObject(),
    body('tags.*.predefinedTag.name').optional().isString(),
    body('tags.*.predefinedTag.category').optional().isString(),
    body('tags.*.predefinedTag.color').optional().isString(),
    body('reason').optional().isString().isLength({ max: 200 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { patientId } = req.params;
      const { tags, reason } = req.body;
      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
          }
        }),
        `verifyPatient(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Process tags and create patient tag assignments
      const processedTags = await executeTransaction(
        tags.map(tagData => async (prisma, results) => {
          let tagId = tagData.tagId;

          // If it's a predefined tag, create or find it
          if (!tagId && tagData.predefinedTag) {
            const predefinedTag = tagData.predefinedTag;
            
            let existingTag = await prisma.patientTag.findFirst({
              where: {
                name: predefinedTag.name,
                category: predefinedTag.category,
                isActive: true
              }
            });

            if (!existingTag) {
              existingTag = await prisma.patientTag.create({
                data: {
                  id: uuidv4(),
                  name: predefinedTag.name,
                  category: predefinedTag.category,
                  color: predefinedTag.color,
                  textColor: predefinedTag.textColor,
                  icon: predefinedTag.icon || '🏷️',
                  isCustom: false,
                  isActive: true,
                  createdBy: userId,
                  createdAt: new Date()
                }
              });
            }

            tagId = existingTag.id;
          }

          // Create or update patient tag assignment
          const patientTagAssignment = await prisma.patientTagAssignment.upsert({
            where: {
              patientId_tagId: {
                patientId: patientId,
                tagId: tagId
              }
            },
            update: {
              isActive: true,
              assignedBy: userId,
              assignedAt: new Date(),
              reason: reason
            },
            create: {
              id: uuidv4(),
              patientId: patientId,
              tagId: tagId,
              assignedBy: userId,
              assignedAt: new Date(),
              reason: reason,
              isActive: true
            },
            include: {
              tag: true
            }
          });

          return patientTagAssignment;
        }),
        'assignPatientTags'
      );

      // Log tag assignment
      logger.info('Patient tags updated', {
        patientId: patientId,
        medicalRecordNumber: patient.medicalRecordNumber,
        tagCount: processedTags.length,
        assignedBy: userId,
        reason: reason
      });

      // Audit log
      await auditLogger.logDataModification(
        userId,
        'PATIENT_TAGS_UPDATE',
        {
          patientId: patientId,
          medicalRecordNumber: patient.medicalRecordNumber,
          tagsAssigned: processedTags.map(pta => ({
            tagName: pta.tag.name,
            category: pta.tag.category
          })),
          reason: reason
        }
      );

      res.json({
        success: true,
        message: 'Patient tags updated successfully',
        data: {
          patient: patient,
          tagAssignments: processedTags
        }
      });

    } catch (error) {
      logger.error('Failed to update patient tags', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update patient tags',
        message: 'An error occurred while updating patient tags'
      });
    }
  }
);

/**
 * GET /api/expedix/patient-tags/patient/:patientId
 * Get all tags assigned to a patient
 */
router.get('/patient/:patientId',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId)
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only view their own tags'
        });
      }

      // Get patient with tags
      const patientWithTags = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            tagAssignments: {
              where: { isActive: true },
              include: {
                tag: true,
                assignedByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: {
                assignedAt: 'desc'
              }
            }
          }
        }),
        `getPatientWithTags(${patientId})`
      );

      if (!patientWithTags) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Group tags by category
      const tagsByCategory = patientWithTags.tagAssignments.reduce((acc, assignment) => {
        const category = assignment.tag.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          ...assignment.tag,
          assignedAt: assignment.assignedAt,
          assignedBy: assignment.assignedByUser,
          reason: assignment.reason
        });
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          patient: {
            id: patientWithTags.id,
            firstName: patientWithTags.firstName,
            lastName: patientWithTags.lastName,
            medicalRecordNumber: patientWithTags.medicalRecordNumber
          },
          tags: patientWithTags.tagAssignments.map(assignment => assignment.tag),
          tagsByCategory: tagsByCategory,
          totalTags: patientWithTags.tagAssignments.length
        }
      });

    } catch (error) {
      logger.error('Failed to get patient tags', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient tags',
        message: 'An error occurred while retrieving patient tags'
      });
    }
  }
);

/**
 * DELETE /api/expedix/patient-tags/patient/:patientId/tag/:tagId
 * Remove a tag from a patient
 */
router.delete('/patient/:patientId/tag/:tagId',
  // ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']), // Temporarily disabled for development
  [
    param('patientId').custom(validatePatientId),
    param('tagId').custom(validateEntityId),
    body('reason').optional().isString().isLength({ max: 200 })
  ],
  async (req, res) => {
    try {
      const { patientId, tagId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      // Find and deactivate the tag assignment
      const tagAssignment = await executeQuery(
        (prisma) => prisma.patientTagAssignment.findFirst({
          where: {
            patientId: patientId,
            tagId: tagId,
            isActive: true
          },
          include: {
            tag: true,
            patient: {
              select: {
                medicalRecordNumber: true
              }
            }
          }
        }),
        'findPatientTagAssignment'
      );

      if (!tagAssignment) {
        return res.status(404).json({
          success: false,
          error: 'Tag assignment not found',
          message: 'This tag is not assigned to the patient'
        });
      }

      // Deactivate the tag assignment
      const updatedAssignment = await executeQuery(
        (prisma) => prisma.patientTagAssignment.update({
          where: {
            patientId_tagId: {
              patientId: patientId,
              tagId: tagId
            }
          },
          data: {
            isActive: false,
            removedBy: userId,
            removedAt: new Date(),
            removalReason: reason
          }
        }),
        'removePatientTag'
      );

      // Log tag removal
      logger.info('Patient tag removed', {
        patientId: patientId,
        tagId: tagId,
        tagName: tagAssignment.tag.name,
        removedBy: userId,
        reason: reason,
        medicalRecordNumber: tagAssignment.patient.medicalRecordNumber
      });

      res.json({
        success: true,
        message: 'Tag removed from patient successfully',
        data: {
          removedTag: tagAssignment.tag,
          removedAt: updatedAssignment.removedAt
        }
      });

    } catch (error) {
      logger.error('Failed to remove patient tag', {
        error: error.message,
        patientId: req.params.patientId,
        tagId: req.params.tagId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to remove patient tag',
        message: 'An error occurred while removing the patient tag'
      });
    }
  }
);

/**
 * GET /api/expedix/patient-tags/search
 * Search patients by tags
 */
router.get('/search',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:patient_data']),
  [
    query('tags').isArray().withMessage('Tags must be an array'),
    query('operator').optional().isIn(['AND', 'OR']).withMessage('Operator must be AND or OR'),
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const {
        tags,
        operator = 'OR',
        category,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause for tag search
      let whereClause = {};

      if (category) {
        whereClause.tagAssignments = {
          some: {
            isActive: true,
            tag: {
              category: category
            }
          }
        };
      }

      if (tags && tags.length > 0) {
        if (operator === 'AND') {
          // Patient must have ALL specified tags
          whereClause.AND = tags.map(tagName => ({
            tagAssignments: {
              some: {
                isActive: true,
                tag: {
                  name: tagName
                }
              }
            }
          }));
        } else {
          // Patient must have ANY of the specified tags
          whereClause.tagAssignments = {
            some: {
              isActive: true,
              tag: {
                name: {
                  in: tags
                }
              }
            }
          };
        }
      }

      const [patients, totalCount] = await executeTransaction([
        (prisma) => prisma.patient.findMany({
          where: whereClause,
          include: {
            tagAssignments: {
              where: { isActive: true },
              include: {
                tag: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { lastName: 'asc' }
        }),
        (prisma) => prisma.patient.count({ where: whereClause })
      ], 'searchPatientsByTags');

      res.json({
        success: true,
        data: {
          patients: patients,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          },
          searchCriteria: {
            tags: tags,
            operator: operator,
            category: category
          }
        }
      });

    } catch (error) {
      logger.error('Failed to search patients by tags', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search patients',
        message: 'An error occurred while searching patients by tags'
      });
    }
  }
);

module.exports = router;