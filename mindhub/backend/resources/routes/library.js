/**
 * Educational Resources API Routes for Resources Hub
 * 
 * Comprehensive resource management endpoints for psychoeducational content,
 * treatment plans, multimedia materials, and content distribution
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const ResourceController = require('../controllers/resource-controller');
const ContentController = require('../controllers/content-controller');
const AuditLogger = require('../../shared/utils/audit-logger');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

// Initialize controllers and utilities
const resourceController = new ResourceController();
const contentController = new ContentController();
const auditLogger = new AuditLogger();

/**
 * GET /api/v1/resources/content
 * List educational resources with filtering and search
 */
router.get('/',
  ...middleware.utils.forHub('resources'),
  [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['depression', 'anxiety', 'bipolar', 'trauma', 'addiction', 'eating_disorders', 'personality_disorders', 'psychosis', 'relationships', 'parenting', 'grief', 'stress_management']),
  query('type').optional().isIn(['educational_handouts', 'worksheets', 'audio_materials', 'video_content', 'interactive_tools', 'assessment_guides', 'treatment_protocols', 'self_help_guides']),
  query('language').optional().isIn(['es', 'en']),
  query('search').optional().trim()
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
      type,
      language,
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {
      isActive: true,
      ...(category && { category }),
      ...(type && { resourceType: type }),
      ...(language && { language }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ]
      })
    };

    const [resources, totalCount] = await executeTransaction([
      (prisma) => prisma.resource.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              distributions: true,
              downloads: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      (prisma) => prisma.resource.count({ where })
    ], 'getResources');

    // Log access for compliance
    logger.info('Resource library accessed', {
      userId: req.user?.id,
      resourceCount: resources.length,
      filters: { category, type, language, search: !!search },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get resources', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve resources', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/resources/content/:id
 * Get specific resource details
 */
router.get('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:resources']),
  [
  param('id').isUUID().withMessage('Invalid resource ID format')
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
    
    const resource = await executeQuery(
      (prisma) => prisma.resource.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          versions: {
            orderBy: { versionNumber: 'desc' }
          },
          _count: {
            select: {
              distributions: true,
              downloads: true
            }
          }
        }
      }),
      `getResource(${id})`
    );

    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    // Log access for compliance
    logger.info('Resource details accessed', {
      resourceId: id,
      resourceTitle: resource.title,
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: resource
    });

  } catch (error) {
    logger.error('Failed to get resource', { 
      error: error.message,
      resourceId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve resource', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/resources/content/category/:category
 * Get resources by category
 */
router.get('/category/:category',
  ...middleware.utils.forHub('resources'),
  [
  param('category').isIn(['depression', 'anxiety', 'bipolar', 'trauma', 'addiction', 'eating_disorders', 'personality_disorders', 'psychosis', 'relationships', 'parenting', 'grief', 'stress_management'])
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
    
    const resources = await executeQuery(
      (prisma) => prisma.resource.findMany({
        where: { 
          category,
          isActive: true 
        },
        select: {
          id: true,
          title: true,
          description: true,
          resourceType: true,
          language: true,
          tags: true,
          difficulty: true,
          estimatedDuration: true,
          _count: {
            select: {
              distributions: true
            }
          }
        },
        orderBy: { title: 'asc' }
      }),
      `getResourcesByCategory(${category})`
    );

    res.json({
      success: true,
      data: resources,
      category,
      count: resources.length
    });

  } catch (error) {
    logger.error('Failed to get resources by category', { 
      error: error.message,
      category: req.params.category,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve resources by category', 
      details: error.message 
    });
  }
});

/**
 * POST /api/v1/resources/content/search
 * Advanced search for educational resources
 */
router.post('/search',
  ...middleware.utils.forHub('resources'),
  [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('categories').optional(),
  query('types').optional(),
  query('languages').optional(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { q: searchQuery, categories, types, languages, difficulty, limit = 20 } = req.query;

    // Parse array parameters
    const categoryFilter = categories ? categories.split(',') : [];
    const typeFilter = types ? types.split(',') : [];
    const languageFilter = languages ? languages.split(',') : [];

    const where = {
      isActive: true,
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { hasSome: [searchQuery] } },
        { content: { contains: searchQuery, mode: 'insensitive' } }
      ],
      ...(categoryFilter.length > 0 && { category: { in: categoryFilter } }),
      ...(typeFilter.length > 0 && { resourceType: { in: typeFilter } }),
      ...(languageFilter.length > 0 && { language: { in: languageFilter } }),
      ...(difficulty && { difficulty })
    };

    const results = await executeQuery(
      (prisma) => prisma.resource.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              distributions: true,
              downloads: true
            }
          }
        },
        take: parseInt(limit),
        orderBy: [
          { _relevance: { fields: ['title', 'description'], search: searchQuery, sort: 'desc' } },
          { createdAt: 'desc' }
        ]
      }),
      'searchResources'
    );

    // Log search for compliance
    logger.info('Resource search performed', {
      searchQuery,
      resultCount: results.length,
      filters: { categories, types, languages, difficulty },
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: results,
      searchQuery,
      resultCount: results.length,
      filters: {
        categories: categoryFilter,
        types: typeFilter,
        languages: languageFilter,
        difficulty
      }
    });

  } catch (error) {
    logger.error('Failed to search resources', { 
      error: error.message,
      searchQuery: req.query.q,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to search resources', 
      details: error.message 
    });
  }
});

/**
 * GET /api/v1/resources/analytics/overview
 * Get resource library analytics and statistics
 */
router.get('/analytics/overview',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['read:resources']),
  [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const [
      totalResources,
      resourcesByCategory,
      resourcesByType,
      resourcesByLanguage,
      topDownloaded,
      recentlyAdded
    ] = await executeTransaction([
      // Total resources
      (prisma) => prisma.resource.count({
        where: { isActive: true, ...dateFilter }
      }),
      
      // Resources by category
      (prisma) => prisma.resource.groupBy({
        by: ['category'],
        where: { isActive: true, ...dateFilter },
        _count: { category: true }
      }),
      
      // Resources by type
      (prisma) => prisma.resource.groupBy({
        by: ['resourceType'],
        where: { isActive: true, ...dateFilter },
        _count: { resourceType: true }
      }),
      
      // Resources by language
      (prisma) => prisma.resource.groupBy({
        by: ['language'],
        where: { isActive: true, ...dateFilter },
        _count: { language: true }
      }),
      
      // Most downloaded
      (prisma) => prisma.resource.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { downloads: true }
          }
        },
        orderBy: {
          downloads: { _count: 'desc' }
        },
        take: 10
      }),
      
      // Recently added
      (prisma) => prisma.resource.findMany({
        where: { isActive: true, ...dateFilter },
        select: {
          id: true,
          title: true,
          category: true,
          resourceType: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ], 'getResourceStats');

    res.json({
      success: true,
      data: {
        overview: {
          totalResources,
          categoriesCount: resourcesByCategory.length,
          typesCount: resourcesByType.length,
          languagesCount: resourcesByLanguage.length
        },
        distribution: {
          byCategory: resourcesByCategory.reduce((acc, item) => {
            acc[item.category] = item._count.category;
            return acc;
          }, {}),
          byType: resourcesByType.reduce((acc, item) => {
            acc[item.resourceType] = item._count.resourceType;
            return acc;
          }, {}),
          byLanguage: resourcesByLanguage.reduce((acc, item) => {
            acc[item.language] = item._count.language;
            return acc;
          }, {})
        },
        topDownloaded,
        recentlyAdded
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get resource stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve resource statistics', 
      details: error.message 
    });
  }
});

module.exports = router;