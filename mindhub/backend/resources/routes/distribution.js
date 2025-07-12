/**
 * Resources Distribution Routes
 * 
 * Manages resource distribution to patients and providers.
 * Handles secure sharing, access control, and delivery tracking.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');

const router = express.Router();

/**
 * POST /api/resources/distribution/assign
 * Assign resource to patient
 */
router.post('/assign', [
  body('resourceId').isUUID().withMessage('Invalid resource ID format'),
  body('patientId').isUUID().withMessage('Invalid patient ID format'),
  body('deliveryMethod').isIn(['email', 'patient_portal', 'in_person', 'print']).withMessage('Invalid delivery method'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const assignmentData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify resource and patient exist
    const [resource, patient] = await executeTransaction([
      (prisma) => prisma.resource.findUnique({
        where: { id: assignmentData.resourceId },
        select: { id: true, title: true, category: true, fileUrl: true }
      }),
      (prisma) => prisma.patient.findUnique({
        where: { id: assignmentData.patientId },
        select: { id: true, firstName: true, lastName: true, email: true }
      })
    ], 'verifyResourceAssignment');

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create resource distribution record
    const distribution = await executeQuery(
      (prisma) => prisma.resourceDistribution.create({
        data: {
          resourceId: assignmentData.resourceId,
          patientId: assignmentData.patientId,
          assignedBy: userId,
          deliveryMethod: assignmentData.deliveryMethod,
          notes: assignmentData.notes,
          scheduledFor: assignmentData.scheduledFor ? new Date(assignmentData.scheduledFor) : new Date(),
          status: 'assigned'
        },
        include: {
          resource: {
            select: { title: true, category: true, resourceType: true }
          },
          patient: {
            select: { firstName: true, lastName: true, email: true }
          },
          assignedByUser: {
            select: { name: true, email: true }
          }
        }
      }),
      'createResourceDistribution'
    );

    // Log assignment for compliance
    logger.info('Resource assigned to patient', {
      distributionId: distribution.id,
      resourceId: assignmentData.resourceId,
      resourceTitle: resource.title,
      patientId: assignmentData.patientId,
      deliveryMethod: assignmentData.deliveryMethod,
      assignedBy: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Resource assigned successfully',
      data: distribution
    });

  } catch (error) {
    logger.error('Failed to assign resource', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to assign resource', 
      details: error.message 
    });
  }
});

/**
 * GET /api/resources/distribution/patient/:patientId
 * Get all resource distributions for a patient
 */
router.get('/patient/:patientId', [
  param('patientId').isUUID().withMessage('Invalid patient ID format'),
  query('status').optional().isIn(['assigned', 'delivered', 'viewed', 'downloaded', 'completed']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
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

    const { patientId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify patient exists
    const patient = await executeQuery(
      (prisma) => prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true }
      }),
      `checkPatient(${patientId})`
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const where = {
      patientId,
      ...(status && { status })
    };

    const [distributions, totalCount] = await executeTransaction([
      (prisma) => prisma.resourceDistribution.findMany({
        where,
        include: {
          resource: {
            select: { 
              id: true,
              title: true, 
              category: true, 
              resourceType: true,
              description: true 
            }
          },
          assignedByUser: {
            select: { name: true, email: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { assignedAt: 'desc' }
      }),
      (prisma) => prisma.resourceDistribution.count({ where })
    ], 'getPatientDistributions');

    res.json({
      success: true,
      data: distributions,
      patient: {
        id: patient.id,
        fullName: `${patient.firstName} ${patient.lastName}`,
        medicalRecordNumber: patient.medicalRecordNumber
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Failed to get patient distributions', { 
      error: error.message,
      patientId: req.params.patientId,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve patient distributions', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/resources/distribution/:id/status
 * Update distribution status
 */
router.put('/:id/status', [
  param('id').isUUID().withMessage('Invalid distribution ID format'),
  body('status').isIn(['assigned', 'delivered', 'viewed', 'downloaded', 'completed']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
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
    const { status, notes } = req.body;
    const userId = req.user?.id;

    // Check if distribution exists
    const existingDistribution = await executeQuery(
      (prisma) => prisma.resourceDistribution.findUnique({
        where: { id },
        select: { id: true, status: true, patientId: true, resourceId: true }
      }),
      `checkDistribution(${id})`
    );

    if (!existingDistribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Update distribution status
    const distribution = await executeQuery(
      (prisma) => prisma.resourceDistribution.update({
        where: { id },
        data: {
          status,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: userId,
          notes: notes || existingDistribution.notes
        },
        include: {
          resource: {
            select: { title: true, category: true }
          },
          patient: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      `updateDistributionStatus(${id})`
    );

    // Log status update
    logger.info('Distribution status updated', {
      distributionId: id,
      oldStatus: existingDistribution.status,
      newStatus: status,
      patientId: existingDistribution.patientId,
      resourceId: existingDistribution.resourceId,
      updatedBy: userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Distribution status updated successfully',
      data: distribution
    });

  } catch (error) {
    logger.error('Failed to update distribution status', { 
      error: error.message,
      distributionId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to update distribution status', 
      details: error.message 
    });
  }
});

/**
 * GET /api/resources/distribution/stats/summary
 * Get distribution statistics
 */
router.get('/stats/summary', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('providerId').optional().isUUID().withMessage('Invalid provider ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { startDate, endDate, providerId } = req.query;
    
    const dateFilter = startDate && endDate ? {
      assignedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const where = {
      ...dateFilter,
      ...(providerId && { assignedBy: providerId })
    };

    const [
      totalDistributions,
      distributionsByStatus,
      distributionsByMethod,
      topResources,
      recentActivity
    ] = await executeTransaction([
      // Total distributions
      (prisma) => prisma.resourceDistribution.count({ where }),
      
      // Distributions by status
      (prisma) => prisma.resourceDistribution.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      
      // Distributions by delivery method
      (prisma) => prisma.resourceDistribution.groupBy({
        by: ['deliveryMethod'],
        where,
        _count: { deliveryMethod: true }
      }),
      
      // Most distributed resources
      (prisma) => prisma.resourceDistribution.groupBy({
        by: ['resourceId'],
        where,
        _count: { resourceId: true },
        orderBy: { _count: { resourceId: 'desc' } },
        take: 10
      }),
      
      // Recent activity
      (prisma) => prisma.resourceDistribution.findMany({
        where,
        include: {
          resource: {
            select: { title: true, category: true }
          },
          patient: {
            select: { firstName: true, lastName: true }
          },
          assignedByUser: {
            select: { name: true }
          }
        },
        orderBy: { assignedAt: 'desc' },
        take: 10
      })
    ], 'getDistributionStats');

    res.json({
      success: true,
      data: {
        overview: {
          totalDistributions
        },
        distributionsByStatus: distributionsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        distributionsByMethod: distributionsByMethod.reduce((acc, item) => {
          acc[item.deliveryMethod] = item._count.deliveryMethod;
          return acc;
        }, {}),
        topResources,
        recentActivity
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    logger.error('Failed to get distribution stats', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Failed to retrieve distribution statistics', 
      details: error.message 
    });
  }
});

module.exports = router;