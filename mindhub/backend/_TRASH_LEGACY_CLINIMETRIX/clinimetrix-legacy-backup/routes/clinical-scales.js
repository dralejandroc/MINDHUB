/**
 * Clinical Scales API Routes for Clinimetrix Hub
 * 
 * Clinical perspective on scale management with role-based access
 * and healthcare workflow integration
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

// Import scale repository
const ScaleRepository = require('../../repositories/ScaleRepository');
const scaleRepository = new ScaleRepository();

/**
 * GET /api/clinimetrix/scales
 * Get available clinical scales with filtering
 */
router.get('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    query('category').optional().isString(),
    query('subcategory').optional().isString(),
    query('administrationMode').optional().isIn(['self_administered', 'clinician_administered', 'both']),
    query('targetPopulation').optional().isString(),
    query('search').optional().isString()
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

      const { category, subcategory, administrationMode, targetPopulation, search } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get all active scales
      let scales = await scaleRepository.getAllActiveScales();

      // Apply filters
      if (category) {
        scales = scales.filter(scale => 
          scale.category && scale.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      if (subcategory) {
        scales = scales.filter(scale => 
          scale.subcategory && scale.subcategory.toLowerCase().includes(subcategory.toLowerCase())
        );
      }

      if (administrationMode) {
        scales = scales.filter(scale => 
          scale.administrationMode === administrationMode || scale.administrationMode === 'both'
        );
      }

      if (targetPopulation) {
        scales = scales.filter(scale => 
          scale.targetPopulation && scale.targetPopulation.toLowerCase().includes(targetPopulation.toLowerCase())
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        scales = scales.filter(scale => 
          scale.name.toLowerCase().includes(searchLower) ||
          scale.abbreviation.toLowerCase().includes(searchLower) ||
          (scale.description && scale.description.toLowerCase().includes(searchLower))
        );
      }

      // Add clinical metadata for each scale
      const scalesWithMetadata = await Promise.all(
        scales.map(async (scale) => {
          // Get usage statistics
          const usageStats = await executeQuery(
            (prisma) => prisma.scaleAdministration.groupBy({
              by: ['status'],
              where: {
                scaleId: scale.id,
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              },
              _count: {
                status: true
              }
            }),
            `getScaleUsageStats(${scale.id})`
          );

          // Calculate completion rate
          const completed = usageStats.find(s => s.status === 'completed')?._count.status || 0;
          const total = usageStats.reduce((sum, s) => sum + s._count.status, 0);
          const completionRate = total > 0 ? (completed / total) * 100 : 0;

          return {
            ...scale,
            clinical: {
              usageStats: usageStats,
              completionRate: Math.round(completionRate),
              totalAdministrations: total,
              recentCompletions: completed,
              averageCompletionTime: scale.estimatedDurationMinutes || null,
              recommendedFor: getScaleRecommendations(scale, userRole)
            }
          };
        })
      );

      // Sort by relevance for clinical use
      scalesWithMetadata.sort((a, b) => {
        // Prioritize scales with higher completion rates and recent usage
        const scoreA = a.clinical.completionRate + a.clinical.totalAdministrations;
        const scoreB = b.clinical.completionRate + b.clinical.totalAdministrations;
        return scoreB - scoreA;
      });

      // Log scales access
      await auditLogger.logDataAccess(
        userId,
        'clinical_scales',
        'list',
        'view',
        {
          filters: req.query,
          resultCount: scalesWithMetadata.length,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: scalesWithMetadata,
        count: scalesWithMetadata.length,
        filters: req.query
      });

    } catch (error) {
      logger.error('Failed to get clinical scales', {
        error: error.message,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Scales retrieval failed',
        message: 'An error occurred while retrieving clinical scales'
      });
    }
  }
);

/**
 * GET /api/clinimetrix/scales/:id
 * Get detailed scale information for clinical use
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  [
    param('id').isString().isLength({ min: 1 }).withMessage('Scale ID is required')
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
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Get scale details
      const scale = await scaleRepository.getScaleById(id);
      if (!scale) {
        return res.status(404).json({
          error: 'Scale not found',
          message: 'The specified clinical scale was not found'
        });
      }

      // Get scale items
      const items = await scaleRepository.getScaleItems(id);

      // Get recent assessments for this scale
      const recentAssessments = await executeQuery(
        (prisma) => prisma.scaleAdministration.findMany({
          where: {
            scaleId: id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            administrator: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }),
        `getRecentScaleAssessments(${id})`
      );

      // Get scoring information
      const scoringInfo = await scaleRepository.getScoringRules(id);

      // Calculate statistics
      const stats = await executeQuery(
        (prisma) => prisma.scaleAdministration.aggregate({
          where: {
            scaleId: id,
            status: 'completed'
          },
          _count: {
            id: true
          },
          _avg: {
            completionPercentage: true
          }
        }),
        `getScaleStats(${id})`
      );

      // Log scale access
      await auditLogger.logDataAccess(
        userId,
        'clinical_scale',
        id,
        'view',
        {
          scaleId: id,
          scaleName: scale.name,
          userRole: userRole
        }
      );

      res.json({
        success: true,
        data: {
          scale: scale,
          items: items,
          scoring: scoringInfo,
          statistics: {
            totalCompletions: stats._count.id,
            averageCompletion: Math.round(stats._avg.completionPercentage || 0),
            recentUsage: recentAssessments.length
          },
          recentAssessments: recentAssessments,
          clinical: {
            recommendedFor: getScaleRecommendations(scale, userRole),
            administrationGuidelines: getAdministrationGuidelines(scale),
            interpretationNotes: getInterpretationNotes(scale)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get clinical scale details', {
        error: error.message,
        scaleId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Scale retrieval failed',
        message: 'An error occurred while retrieving scale details'
      });
    }
  }
);

/**
 * GET /api/clinimetrix/scales/categories
 * Get available scale categories for filtering
 */
router.get('/categories',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:clinical_assessments']),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      // Get all categories and subcategories
      const categories = await executeQuery(
        (prisma) => prisma.$queryRaw`
          SELECT DISTINCT 
            category,
            subcategory,
            COUNT(*) as scale_count
          FROM scales 
          WHERE is_active = 1 
          GROUP BY category, subcategory
          ORDER BY category ASC, subcategory ASC
        `,
        'getScaleCategories'
      );

      // Group by category
      const groupedCategories = categories.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            category: item.category,
            subcategories: [],
            totalScales: 0
          };
        }
        
        acc[item.category].subcategories.push({
          subcategory: item.subcategory,
          scaleCount: Number(item.scale_count)
        });
        
        acc[item.category].totalScales += Number(item.scale_count);
        
        return acc;
      }, {});

      // Log categories access
      await auditLogger.logDataAccess(
        userId,
        'scale_categories',
        'list',
        'view',
        {
          categoryCount: Object.keys(groupedCategories).length
        }
      );

      res.json({
        success: true,
        data: Object.values(groupedCategories)
      });

    } catch (error) {
      logger.error('Failed to get scale categories', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Categories retrieval failed',
        message: 'An error occurred while retrieving scale categories'
      });
    }
  }
);

/**
 * Helper function to get scale recommendations based on user role
 */
function getScaleRecommendations(scale, userRole) {
  const recommendations = [];
  
  if (userRole === 'psychiatrist') {
    if (scale.category === 'Depression') {
      recommendations.push('Ideal for screening depression severity');
    }
    if (scale.category === 'Anxiety') {
      recommendations.push('Effective for anxiety disorder assessment');
    }
    if (scale.administrationMode === 'self_administered') {
      recommendations.push('Can be completed by patient independently');
    }
  } else if (userRole === 'psychologist') {
    if (scale.category === 'Cognitive') {
      recommendations.push('Useful for cognitive assessment');
    }
    if (scale.targetPopulation === 'adolescents') {
      recommendations.push('Validated for adolescent population');
    }
  } else if (userRole === 'nurse') {
    if (scale.estimatedDurationMinutes <= 10) {
      recommendations.push('Quick assessment suitable for nursing workflow');
    }
  }

  return recommendations;
}

/**
 * Helper function to get administration guidelines
 */
function getAdministrationGuidelines(scale) {
  const guidelines = [];
  
  if (scale.administrationMode === 'self_administered') {
    guidelines.push('Ensure patient understands instructions before starting');
    guidelines.push('Provide quiet, private environment for completion');
  } else if (scale.administrationMode === 'clinician_administered') {
    guidelines.push('Read questions exactly as written');
    guidelines.push('Allow patient time to consider responses');
  }

  if (scale.estimatedDurationMinutes) {
    guidelines.push(`Estimated completion time: ${scale.estimatedDurationMinutes} minutes`);
  }

  return guidelines;
}

/**
 * Helper function to get interpretation notes
 */
function getInterpretationNotes(scale) {
  const notes = [];
  
  if (scale.scoringMethod === 'sum') {
    notes.push('Total score calculated as sum of all item responses');
  }
  
  if (scale.scoreRangeMin !== null && scale.scoreRangeMax !== null) {
    notes.push(`Score range: ${scale.scoreRangeMin} - ${scale.scoreRangeMax}`);
  }

  notes.push('Interpret results in context of clinical presentation');
  notes.push('Consider cultural and demographic factors');

  return notes;
}

module.exports = router;