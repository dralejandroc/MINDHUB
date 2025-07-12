/**
 * Clinimetrix Administration Routes
 * 
 * Manages assessment administration workflow and remote assessment handling.
 * Handles tokenized assessments and administration tracking.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * GET /api/clinimetrix/administration/tokens
 * Get all assessment tokens (for administration dashboard)
 */
router.get('/tokens', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'used', 'expired']),
  query('patientId').optional().isUUID().withMessage('Invalid patient ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { page = 1, limit = 20, status, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause based on status
    let where = {};
    if (patientId) {
      where.patientId = patientId;
    }
    
    const now = new Date();
    if (status === 'active') {
      where.isUsed = false;
      where.expiresAt = { gt: now };
    } else if (status === 'used') {
      where.isUsed = true;
    } else if (status === 'expired') {
      where.isUsed = false;
      where.expiresAt = { lte: now };
    }

    const [tokens, totalCount] = await executeTransaction([
      (prisma) => prisma.assessmentToken.findMany({
        where,
        include: {
          patient: {
            select: { 
              id: true,
              medicalRecordNumber: true, 
              firstName: true, 
              lastName: true,
              email: true 
            }
          },
          scale: {
            select: { 
              id: true,
              name: true, 
              abbreviation: true,
              category: true,
              estimatedDuration: true 
            }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          administration: {
            select: { 
              id: true, 
              totalScore: true, 
              administrationDate: true 
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      (prisma) => prisma.assessmentToken.count({ where })
    ], 'getAssessmentTokens');

    // Add status to each token
    const tokensWithStatus = tokens.map(token => ({
      ...token,
      status: token.isUsed ? 'used' : 
              token.expiresAt <= now ? 'expired' : 'active'
    }));

    res.json({
      success: true,
      data: tokensWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get assessment tokens', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve assessment tokens', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/administration/token/:token
 * Get assessment details by token (for remote assessment interface)
 */
router.get('/token/:token', [
  param('token').isLength({ min: 32, max: 128 }).withMessage('Invalid token format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { token } = req.params;
    
    const assessmentToken = await executeQuery(
      (prisma) => prisma.assessmentToken.findUnique({
        where: { token },
        include: {
          patient: {
            select: { 
              id: true,
              firstName: true, 
              lastName: true 
            }
          },
          scale: {
            include: {
              scaleItems: {
                orderBy: { itemOrder: 'asc' }
              }
            }
          }
        }
      }),
      `getAssessmentByToken(${token})`
    );

    if (!assessmentToken) {
      return res.status(404).json({ 
        error: 'Token not found',
        message: 'The assessment token is invalid or does not exist.'
      });
    }

    // Check if token is expired
    if (assessmentToken.expiresAt <= new Date()) {
      return res.status(410).json({ 
        error: 'Token expired',
        message: 'This assessment link has expired. Please contact your healthcare provider for a new link.'
      });
    }

    // Check if token is already used
    if (assessmentToken.isUsed) {
      return res.status(409).json({ 
        error: 'Token already used',
        message: 'This assessment has already been completed.'
      });
    }

    // Log token access
    logger.info('Assessment token accessed', {
      tokenId: assessmentToken.id,
      patientId: assessmentToken.patientId,
      scaleId: assessmentToken.scaleId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        tokenId: assessmentToken.id,
        patient: assessmentToken.patient,
        scale: assessmentToken.scale,
        expiresAt: assessmentToken.expiresAt
      }
    });

  } catch (error) {
    logger.error('Failed to get assessment by token', { 
      error: error.message,
      token: req.params.token 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve assessment', 
      details: error.message 
    });
  }
});

/**
 * POST /api/clinimetrix/administration/token/:token/submit
 * Submit remote assessment responses
 */
router.post('/token/:token/submit', [
  param('token').isLength({ min: 32, max: 128 }).withMessage('Invalid token format'),
  body('responses').isArray({ min: 1 }).withMessage('Responses must be a non-empty array'),
  body('responses.*.itemId').isUUID().withMessage('Invalid item ID format'),
  body('responses.*.value').notEmpty().withMessage('Response value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { token } = req.params;
    const { responses } = req.body;
    
    // Get token details
    const assessmentToken = await executeQuery(
      (prisma) => prisma.assessmentToken.findUnique({
        where: { token },
        include: {
          scale: {
            include: {
              scaleItems: true,
              interpretationRules: {
                orderBy: { minScore: 'asc' }
              }
            }
          }
        }
      }),
      `getTokenForSubmission(${token})`
    );

    if (!assessmentToken) {
      return res.status(404).json({ 
        error: 'Token not found' 
      });
    }

    if (assessmentToken.expiresAt <= new Date()) {
      return res.status(410).json({ 
        error: 'Token expired' 
      });
    }

    if (assessmentToken.isUsed) {
      return res.status(409).json({ 
        error: 'Assessment already completed' 
      });
    }

    // Validate responses
    const scaleItemIds = assessmentToken.scale.scaleItems.map(item => item.id);
    const responseItemIds = responses.map(r => r.itemId);
    const missingItems = scaleItemIds.filter(id => !responseItemIds.includes(id));

    if (missingItems.length > 0) {
      return res.status(400).json({ 
        error: 'Incomplete assessment',
        message: 'All questions must be answered',
        missingItems
      });
    }

    // Calculate total score
    let totalScore = 0;
    for (const response of responses) {
      const item = assessmentToken.scale.scaleItems.find(i => i.id === response.itemId);
      if (item && item.scoreValue !== null) {
        totalScore += parseInt(response.value) * (item.scoreValue || 1);
      }
    }

    // Get interpretation
    const interpretation = assessmentToken.scale.interpretationRules.find(rule =>
      totalScore >= rule.minScore && totalScore <= rule.maxScore
    );

    // Create assessment and mark token as used
    const [assessment] = await executeTransaction([
      (prisma) => prisma.scaleAdministration.create({
        data: {
          patientId: assessmentToken.patientId,
          scaleId: assessmentToken.scaleId,
          administrationType: 'remote_tokenized',
          administrationDate: new Date(),
          administratorId: assessmentToken.createdBy,
          totalScore,
          rawScore: totalScore,
          tokenId: assessmentToken.id,
          responses: {
            create: responses.map(response => ({
              scaleItemId: response.itemId,
              responseValue: response.value,
              responseText: response.text
            }))
          }
        },
        include: {
          scale: {
            select: { name: true, abbreviation: true }
          }
        }
      }),
      (prisma) => prisma.assessmentToken.update({
        where: { id: assessmentToken.id },
        data: { isUsed: true, completedAt: new Date() }
      })
    ], 'submitRemoteAssessment');

    // Log completion
    logger.info('Remote assessment completed', {
      assessmentId: assessment.id,
      tokenId: assessmentToken.id,
      patientId: assessmentToken.patientId,
      scaleId: assessmentToken.scaleId,
      totalScore,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Assessment completed successfully',
      data: {
        assessmentId: assessment.id,
        totalScore,
        interpretation: interpretation ? {
          interpretation: interpretation.interpretation,
          severity: interpretation.severity,
          recommendations: interpretation.recommendations
        } : null,
        scale: assessment.scale
      }
    });

  } catch (error) {
    logger.error('Failed to submit remote assessment', { 
      error: error.message,
      token: req.params.token 
    });
    res.status(500).json({ 
      error: 'Failed to submit assessment', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/clinimetrix/administration/token/:id/revoke
 * Revoke an assessment token
 */
router.put('/token/:id/revoke', [
  param('id').isUUID().withMessage('Invalid token ID format'),
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

    // Check if token exists and is revocable
    const existingToken = await executeQuery(
      (prisma) => prisma.assessmentToken.findUnique({
        where: { id },
        select: { 
          id: true, 
          isUsed: true, 
          patientId: true, 
          scaleId: true,
          expiresAt: true 
        }
      }),
      `checkToken(${id})`
    );

    if (!existingToken) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (existingToken.isUsed) {
      return res.status(400).json({ 
        error: 'Cannot revoke completed assessment token' 
      });
    }

    // Revoke token by setting expiration to now
    await executeQuery(
      (prisma) => prisma.assessmentToken.update({
        where: { id },
        data: { 
          expiresAt: new Date(),
          revokedBy: userId,
          revokedAt: new Date(),
          revocationReason: reason
        }
      }),
      `revokeToken(${id})`
    );

    // Log revocation
    logger.warn('Assessment token revoked', {
      tokenId: id,
      patientId: existingToken.patientId,
      scaleId: existingToken.scaleId,
      revokedBy: userId,
      reason,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Assessment token revoked successfully'
    });

  } catch (error) {
    logger.error('Failed to revoke token', { 
      error: error.message,
      tokenId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to revoke token', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinimetrix/administration/stats/overview
 * Get administration statistics overview
 */
router.get('/stats/overview', [
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

    const now = new Date();

    const [
      totalTokens,
      activeTokens,
      completedAssessments,
      expiredTokens,
      administrationsByType,
      recentActivity
    ] = await executeTransaction([
      // Total tokens created
      (prisma) => prisma.assessmentToken.count({
        where: dateFilter
      }),
      
      // Active tokens
      (prisma) => prisma.assessmentToken.count({
        where: {
          ...dateFilter,
          isUsed: false,
          expiresAt: { gt: now }
        }
      }),
      
      // Completed assessments
      (prisma) => prisma.scaleAdministration.count({
        where: {
          administrationType: 'remote_tokenized',
          ...(startDate && endDate && {
            administrationDate: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          })
        }
      }),
      
      // Expired tokens
      (prisma) => prisma.assessmentToken.count({
        where: {
          ...dateFilter,
          isUsed: false,
          expiresAt: { lte: now }
        }
      }),
      
      // Administrations by type
      (prisma) => prisma.scaleAdministration.groupBy({
        by: ['administrationType'],
        where: startDate && endDate ? {
          administrationDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {},
        _count: { administrationType: true }
      }),
      
      // Recent activity
      (prisma) => prisma.scaleAdministration.findMany({
        where: {
          administrationType: 'remote_tokenized'
        },
        include: {
          patient: {
            select: { firstName: true, lastName: true }
          },
          scale: {
            select: { name: true, abbreviation: true }
          }
        },
        orderBy: { administrationDate: 'desc' },
        take: 10
      })
    ], 'getAdministrationStats');

    const completionRate = totalTokens > 0 ? 
      Math.round((completedAssessments / totalTokens) * 100) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalTokens,
          activeTokens,
          completedAssessments,
          expiredTokens,
          completionRate
        },
        administrationsByType: administrationsByType.reduce((acc, item) => {
          acc[item.administrationType] = item._count.administrationType;
          return acc;
        }, {}),
        recentActivity
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get administration stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve administration statistics', 
      details: error.message 
    });
  }
});

module.exports = router;