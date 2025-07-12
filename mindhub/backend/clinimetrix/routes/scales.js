/**
 * Clinimetrix Scales Routes
 * 
 * Manages clinical assessment scales and their configurations.
 * Supports scale metadata, validation rules, and scoring algorithms.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * GET /api/clinimetrix/scales
 * Get all available scales with filtering and pagination
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['depression', 'anxiety', 'mania', 'psychosis', 'cognitive', 'personality', 'substance']),
  query('administrationType').optional().isIn(['self_administered', 'hetero_administered', 'both']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      category,
      administrationType,
      isActive = true 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {
      isActive: isActive === 'true',
      ...(category && { category }),
      ...(administrationType && { 
        administrationType: administrationType === 'both' 
          ? { in: ['self_administered', 'hetero_administered'] }
          : administrationType 
      })
    };

    const [scales, totalCount] = await executeTransaction([
      (prisma) => prisma.scale.findMany({
        where,
        include: {
          _count: {
            select: {
              administrations: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      (prisma) => prisma.scale.count({ where })
    ], 'getScales');

    // Log access for compliance
    logger.info('Scales list accessed', {
      userId: req.user?.id,
      scaleCount: scales.length,
      filters: { category, administrationType },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: scales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get scales', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve scales', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id
 * Get specific scale with full configuration
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid scale ID format')
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
    
    const scale = await executeQuery(
      (prisma) => prisma.scale.findUnique({
        where: { id },
        include: {
          scaleItems: {
            orderBy: { itemOrder: 'asc' }
          },
          scoringRules: true,
          interpretationRules: {
            orderBy: { minScore: 'asc' }
          },
          _count: {
            select: {
              administrations: true
            }
          }
        }
      }),
      `getScale(${id})`
    );

    if (!scale) {
      return res.status(404).json({ 
        error: 'Scale not found' 
      });
    }

    // Log access for compliance
    logger.info('Scale details accessed', {
      scaleId: id,
      scaleName: scale.name,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: scale
    });

  } catch (error) {
    logger.error('Failed to get scale', { 
      error: error.message,
      scaleId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve scale', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/category/:category
 * Get scales by category
 */
router.get('/category/:category', [
  param('category').isIn(['depression', 'anxiety', 'mania', 'psychosis', 'cognitive', 'personality', 'substance'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { category } = req.params;
    
    const scales = await executeQuery(
      (prisma) => prisma.scale.findMany({
        where: { 
          category,
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          abbreviation: true,
          description: true,
          administrationType: true,
          estimatedDuration: true,
          targetPopulation: true,
          _count: {
            select: {
              administrations: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      `getScalesByCategory(${category})`
    );

    res.json({
      success: true,
      data: scales,
      category,
      count: scales.length
    });

  } catch (error) {
    logger.error('Failed to get scales by category', { 
      error: error.message,
      category: req.params.category,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve scales by category', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/:id/interpretation/:score
 * Get interpretation for a specific score
 */
router.get('/:id/interpretation/:score', [
  param('id').isUUID().withMessage('Invalid scale ID format'),
  param('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id, score } = req.params;
    const scoreValue = parseInt(score);
    
    const interpretation = await executeQuery(
      (prisma) => prisma.interpretationRule.findFirst({
        where: {
          scaleId: id,
          minScore: { lte: scoreValue },
          maxScore: { gte: scoreValue }
        },
        include: {
          scale: {
            select: { name: true, abbreviation: true }
          }
        }
      }),
      `getInterpretation(${id}, ${scoreValue})`
    );

    if (!interpretation) {
      return res.status(404).json({ 
        error: 'No interpretation found for this score',
        scaleId: id,
        score: scoreValue
      });
    }

    res.json({
      success: true,
      data: {
        score: scoreValue,
        interpretation: interpretation.interpretation,
        severity: interpretation.severity,
        recommendations: interpretation.recommendations,
        scale: interpretation.scale
      }
    });

  } catch (error) {
    logger.error('Failed to get interpretation', { 
      error: error.message,
      scaleId: req.params.id,
      score: req.params.score,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve interpretation', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/scales/stats/usage
 * Get scale usage statistics
 */
router.get('/stats/usage', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('category').optional().isIn(['depression', 'anxiety', 'mania', 'psychosis', 'cognitive', 'personality', 'substance'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate, category } = req.query;
    
    const dateFilter = startDate && endDate ? {
      administrationDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const [
      totalAdministrations,
      scaleUsage,
      categoryStats
    ] = await executeTransaction([
      // Total administrations
      (prisma) => prisma.scaleAdministration.count({
        where: {
          ...dateFilter,
          ...(category && {
            scale: { category }
          })
        }
      }),
      
      // Usage by scale
      (prisma) => prisma.scaleAdministration.groupBy({
        by: ['scaleId'],
        where: {
          ...dateFilter,
          ...(category && {
            scale: { category }
          })
        },
        _count: { scaleId: true },
        orderBy: { _count: { scaleId: 'desc' } },
        take: 10
      }),
      
      // Usage by category
      (prisma) => prisma.scaleAdministration.groupBy({
        by: ['scale'],
        where: dateFilter,
        _count: { scaleId: true }
      })
    ], 'getScaleUsageStats');

    // Get scale names for usage stats
    const scaleIds = scaleUsage.map(item => item.scaleId);
    const scaleDetails = await executeQuery(
      (prisma) => prisma.scale.findMany({
        where: { id: { in: scaleIds } },
        select: { id: true, name: true, abbreviation: true, category: true }
      }),
      'getScaleDetails'
    );

    const usageWithNames = scaleUsage.map(item => {
      const scale = scaleDetails.find(s => s.id === item.scaleId);
      return {
        ...item,
        scale: scale || { name: 'Unknown', abbreviation: 'UNK' }
      };
    });

    res.json({
      success: true,
      data: {
        totalAdministrations,
        topScales: usageWithNames,
        categoryBreakdown: categoryStats
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get scale usage stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve usage statistics', 
      details: error.message 
    });
  }
});

module.exports = router;