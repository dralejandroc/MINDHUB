/**
 * Form Analytics API Routes for Formx Hub
 * 
 * Advanced analytics for form performance, completion rates, field analysis,
 * and user engagement metrics for healthcare compliance and optimization
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * GET /api/formx/analytics/forms/:id/metrics
 * Get comprehensive metrics for a specific form
 */
router.get('/forms/:id/metrics',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('id').isUUID().withMessage('Invalid form ID format'),
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y', 'all']),
    query('includeFieldMetrics').optional().isBoolean()
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
      const { timeframe = '30d', includeFieldMetrics = false } = req.query;
      const userId = req.user?.id;

      // Calculate date range
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        'all': new Date(0)
      };

      const fromDate = dateRanges[timeframe];

      // Get form information
      const form = await executeQuery(
        (prisma) => prisma.form.findUnique({
          where: { id },
          include: {
            currentVersion: {
              select: {
                formSchema: true,
                versionNumber: true
              }
            }
          }
        }),
        `getFormForAnalytics(${id})`
      );

      if (!form) {
        return res.status(404).json({
          error: 'Form not found',
          message: 'The specified form was not found'
        });
      }

      // Get submission metrics
      const submissionMetrics = await getSubmissionMetrics(id, fromDate);

      // Get completion metrics
      const completionMetrics = await getCompletionMetrics(id, fromDate);

      // Get timing metrics
      const timingMetrics = await getTimingMetrics(id, fromDate);

      // Get field metrics if requested
      let fieldMetrics = null;
      if (includeFieldMetrics) {
        fieldMetrics = await getFieldMetrics(id, fromDate, form.currentVersion?.formSchema);
      }

      // Get user engagement metrics
      const engagementMetrics = await getEngagementMetrics(id, fromDate);

      // Log analytics access
      await auditLogger.logDataAccess(
        userId,
        'form_analytics',
        id,
        'view',
        {
          formId: id,
          timeframe: timeframe,
          includeFieldMetrics: includeFieldMetrics
        }
      );

      res.json({
        success: true,
        data: {
          form: {
            id: form.id,
            name: form.name,
            description: form.description,
            category: form.category,
            currentVersion: form.currentVersion?.versionNumber
          },
          timeframe: timeframe,
          metrics: {
            submissions: submissionMetrics,
            completion: completionMetrics,
            timing: timingMetrics,
            engagement: engagementMetrics,
            fields: fieldMetrics
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get form analytics', {
        error: error.message,
        formId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Analytics retrieval failed',
        message: 'An error occurred while retrieving form analytics'
      });
    }
  }
);

/**
 * GET /api/formx/analytics/dashboard
 * Get dashboard overview of all forms
 */
router.get('/dashboard',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']),
    query('category').optional().isString(),
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

      const { timeframe = '30d', category, limit = 20 } = req.query;
      const userId = req.user?.id;

      // Calculate date range
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      };

      const fromDate = dateRanges[timeframe];

      // Build form where clause
      const formWhereClause = { isActive: true };
      if (category) {
        formWhereClause.category = category;
      }

      // Get overall statistics
      const overallStats = await executeQuery(
        (prisma) => prisma.form.aggregate({
          where: formWhereClause,
          _count: {
            id: true
          }
        }),
        'getOverallFormStats'
      );

      // Get submission statistics
      const submissionStats = await executeQuery(
        (prisma) => prisma.formSubmission.aggregate({
          where: {
            createdAt: {
              gte: fromDate
            }
          },
          _count: {
            id: true
          }
        }),
        'getOverallSubmissionStats'
      );

      // Get top performing forms
      const topForms = await executeQuery(
        (prisma) => prisma.$queryRaw`
          SELECT 
            f.id,
            f.name,
            f.category,
            COUNT(fs.id) as submission_count,
            AVG(CASE WHEN fs.is_completed = 1 THEN 1 ELSE 0 END) as completion_rate,
            AVG(fs.completion_time_minutes) as avg_completion_time
          FROM forms f
          LEFT JOIN form_submissions fs ON f.id = fs.form_id 
            AND fs.created_at >= ${fromDate}
          WHERE f.is_active = 1
          ${category ? `AND f.category = ${category}` : ''}
          GROUP BY f.id, f.name, f.category
          ORDER BY submission_count DESC, completion_rate DESC
          LIMIT ${parseInt(limit)}
        `,
        'getTopPerformingForms'
      );

      // Get completion trends
      const completionTrends = await executeQuery(
        (prisma) => prisma.$queryRaw`
          SELECT 
            DATE(fs.created_at) as date,
            COUNT(fs.id) as total_submissions,
            SUM(CASE WHEN fs.is_completed = 1 THEN 1 ELSE 0 END) as completed_submissions
          FROM form_submissions fs
          WHERE fs.created_at >= ${fromDate}
          GROUP BY DATE(fs.created_at)
          ORDER BY date ASC
        `,
        'getCompletionTrends'
      );

      // Get category breakdown
      const categoryBreakdown = await executeQuery(
        (prisma) => prisma.form.groupBy({
          by: ['category'],
          where: formWhereClause,
          _count: {
            category: true
          }
        }),
        'getCategoryBreakdown'
      );

      // Log dashboard access
      await auditLogger.logDataAccess(
        userId,
        'form_analytics_dashboard',
        'all',
        'view',
        {
          timeframe: timeframe,
          category: category,
          limit: limit
        }
      );

      res.json({
        success: true,
        data: {
          timeframe: timeframe,
          overview: {
            totalForms: overallStats._count.id,
            totalSubmissions: submissionStats._count.id,
            categories: categoryBreakdown.length
          },
          topForms: topForms.map(form => ({
            id: form.id,
            name: form.name,
            category: form.category,
            submissionCount: Number(form.submission_count),
            completionRate: Number(form.completion_rate) * 100,
            avgCompletionTime: Number(form.avg_completion_time)
          })),
          trends: completionTrends.map(trend => ({
            date: trend.date,
            totalSubmissions: Number(trend.total_submissions),
            completedSubmissions: Number(trend.completed_submissions),
            completionRate: Number(trend.total_submissions) > 0 ? 
              (Number(trend.completed_submissions) / Number(trend.total_submissions)) * 100 : 0
          })),
          categories: categoryBreakdown.map(cat => ({
            category: cat.category,
            formCount: cat._count.category
          }))
        }
      });

    } catch (error) {
      logger.error('Failed to get analytics dashboard', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Dashboard retrieval failed',
        message: 'An error occurred while retrieving analytics dashboard'
      });
    }
  }
);

/**
 * GET /api/formx/analytics/patient-engagement/:patientId
 * Get patient-specific form engagement analytics
 */
router.get('/patient-engagement/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y', 'all'])
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

      const { patientId } = req.params;
      const { timeframe = '30d' } = req.query;
      const userId = req.user?.id;

      // Calculate date range
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        'all': new Date(0)
      };

      const fromDate = dateRanges[timeframe];

      // Get patient submissions
      const patientSubmissions = await executeQuery(
        (prisma) => prisma.formSubmission.findMany({
          where: {
            patientId: patientId,
            createdAt: {
              gte: fromDate
            }
          },
          include: {
            form: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        `getPatientSubmissions(${patientId})`
      );

      // Calculate engagement metrics
      const engagementMetrics = calculatePatientEngagement(patientSubmissions);

      // Get completion patterns
      const completionPatterns = analyzeCompletionPatterns(patientSubmissions);

      // Get form preferences
      const formPreferences = analyzeFormPreferences(patientSubmissions);

      // Log patient engagement access
      await auditLogger.logDataAccess(
        userId,
        'patient_form_engagement',
        patientId,
        'view',
        {
          patientId: patientId,
          timeframe: timeframe,
          submissionCount: patientSubmissions.length
        }
      );

      res.json({
        success: true,
        data: {
          patientId: patientId,
          timeframe: timeframe,
          engagement: engagementMetrics,
          patterns: completionPatterns,
          preferences: formPreferences,
          recentSubmissions: patientSubmissions.slice(0, 10)
        }
      });

    } catch (error) {
      logger.error('Failed to get patient engagement analytics', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Patient engagement retrieval failed',
        message: 'An error occurred while retrieving patient engagement analytics'
      });
    }
  }
);

/**
 * Helper functions for analytics calculations
 */

async function getSubmissionMetrics(formId, fromDate) {
  const metrics = await executeQuery(
    (prisma) => prisma.formSubmission.aggregate({
      where: {
        formId: formId,
        createdAt: {
          gte: fromDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        completionTimeMinutes: true
      }
    }),
    'getSubmissionMetrics'
  );

  return {
    totalSubmissions: metrics._count.id,
    avgCompletionTime: Math.round(metrics._avg.completionTimeMinutes || 0)
  };
}

async function getCompletionMetrics(formId, fromDate) {
  const completionStats = await executeQuery(
    (prisma) => prisma.formSubmission.groupBy({
      by: ['isCompleted'],
      where: {
        formId: formId,
        createdAt: {
          gte: fromDate
        }
      },
      _count: {
        isCompleted: true
      }
    }),
    'getCompletionMetrics'
  );

  const completed = completionStats.find(s => s.isCompleted === true)?._count.isCompleted || 0;
  const total = completionStats.reduce((sum, s) => sum + s._count.isCompleted, 0);

  return {
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completedSubmissions: completed,
    totalSubmissions: total
  };
}

async function getTimingMetrics(formId, fromDate) {
  const timingStats = await executeQuery(
    (prisma) => prisma.$queryRaw`
      SELECT 
        AVG(completion_time_minutes) as avg_time,
        MIN(completion_time_minutes) as min_time,
        MAX(completion_time_minutes) as max_time,
        COUNT(*) as total_count
      FROM form_submissions 
      WHERE form_id = ${formId} 
        AND created_at >= ${fromDate}
        AND completion_time_minutes IS NOT NULL
    `,
    'getTimingMetrics'
  );

  const stats = timingStats[0] || {};

  return {
    avgCompletionTime: Math.round(Number(stats.avg_time) || 0),
    minCompletionTime: Math.round(Number(stats.min_time) || 0),
    maxCompletionTime: Math.round(Number(stats.max_time) || 0),
    totalTimed: Number(stats.total_count) || 0
  };
}

async function getFieldMetrics(formId, fromDate, formSchema) {
  if (!formSchema || !formSchema.fields) {
    return null;
  }

  // This would require a more complex analysis of field-level data
  // For now, returning a placeholder structure
  return {
    totalFields: formSchema.fields.length,
    fieldAnalysis: formSchema.fields.map(field => ({
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      completionRate: 95, // Placeholder
      avgResponseTime: 30, // Placeholder
      mostCommonValue: null // Placeholder
    }))
  };
}

async function getEngagementMetrics(formId, fromDate) {
  const engagementStats = await executeQuery(
    (prisma) => prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(*) as total_submissions,
        AVG(completion_time_minutes) as avg_engagement_time
      FROM form_submissions 
      WHERE form_id = ${formId} 
        AND created_at >= ${fromDate}
    `,
    'getEngagementMetrics'
  );

  const stats = engagementStats[0] || {};

  return {
    uniquePatients: Number(stats.unique_patients) || 0,
    totalSubmissions: Number(stats.total_submissions) || 0,
    avgEngagementTime: Math.round(Number(stats.avg_engagement_time) || 0)
  };
}

function calculatePatientEngagement(submissions) {
  const completed = submissions.filter(s => s.isCompleted).length;
  const total = submissions.length;

  return {
    totalSubmissions: total,
    completedSubmissions: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgCompletionTime: submissions.reduce((sum, s) => sum + (s.completionTimeMinutes || 0), 0) / (total || 1)
  };
}

function analyzeCompletionPatterns(submissions) {
  // Group by day of week
  const dayPatterns = submissions.reduce((acc, submission) => {
    const day = new Date(submission.createdAt).getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    if (!acc[dayName]) acc[dayName] = 0;
    acc[dayName]++;
    return acc;
  }, {});

  // Group by hour of day
  const hourPatterns = submissions.reduce((acc, submission) => {
    const hour = new Date(submission.createdAt).getHours();
    if (!acc[hour]) acc[hour] = 0;
    acc[hour]++;
    return acc;
  }, {});

  return {
    dayOfWeek: dayPatterns,
    hourOfDay: hourPatterns
  };
}

function analyzeFormPreferences(submissions) {
  const categoryPreferences = submissions.reduce((acc, submission) => {
    const category = submission.form.category;
    if (!acc[category]) acc[category] = 0;
    acc[category]++;
    return acc;
  }, {});

  return {
    categories: categoryPreferences
  };
}

module.exports = router;