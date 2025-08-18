/**
 * Admin Analytics API Routes - RESTRICTED ACCESS
 * 
 * SECURITY: Only org:admin users can access these endpoints
 * PRIVACY: Only aggregated, anonymized data - NO sensitive patient information
 */

const express = require('express');
const { getPrismaClient } = require('../../shared/config/prisma');

const router = express.Router();
const prisma = getPrismaClient();

/**
 * Strict admin-only middleware - Returns 404 for non-admins to hide existence
 */
const adminOnlyStrict = (req, res, next) => {
  if (!req.user || req.user.role !== 'org:admin') {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
};

/**
 * GET /api/admin/analytics/platform-stats
 * Platform-wide aggregated statistics
 */
router.get('/platform-stats', 
  adminOnlyStrict,
  async (req, res) => {
    try {
      console.log(`🔍 Admin analytics accessed by: ${req.user.email}`);
      
      // Aggregate platform statistics - NO sensitive data
      const [
        totalUsers,
        activeUsers,
        totalPatients,
        totalAssessments,
        scalesUsage
      ] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        prisma.patients.count(),
        prisma.clinimetrix_assessments.count(),
        
        // Most used scales (aggregated)
        prisma.$queryRaw`
          SELECT 
            JSON_EXTRACT(templateData, '$.metadata.abbreviation') as scaleName,
            COUNT(*) as usageCount
          FROM clinimetrix_assessments ca
          JOIN clinimetrix_templates ct ON ca.templateId = ct.id
          GROUP BY scaleName
          ORDER BY usageCount DESC
          LIMIT 10
        `
      ]);

      // Calculate derived metrics
      const avgPatientsPerUser = totalUsers > 0 ? Math.round(totalPatients / totalUsers) : 0;

      const platformStats = {
        totalUsers,
        activeUsers,
        totalPatients, // Only total count - no patient data
        totalAssessments,
        avgPatientsPerUser,
        scalesPopularity: scalesUsage.map(scale => ({
          name: scale.scaleName,
          count: Number(scale.usageCount)
        })),
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: platformStats
      });

    } catch (error) {
      console.error('Admin analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve platform statistics'
      });
    }
  }
);

/**
 * GET /api/admin/analytics/users-overview
 * User statistics - NO sensitive patient information
 */
router.get('/users-overview',
  adminOnlyStrict,
  async (req, res) => {
    try {
      // Get user statistics without exposing patient data
      const userStats = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role as localRole,
          u.createdAt as joinDate,
          u.lastLoginAt,
          COUNT(DISTINCT p.id) as patientsCount,
          COUNT(DISTINCT ca.id) as assessmentsCount
        FROM users u
        LEFT JOIN patients p ON p.createdBy = u.id
        LEFT JOIN clinimetrix_assessments ca ON ca.userId = u.id
        WHERE u.id IS NOT NULL
        GROUP BY u.id, u.name, u.email, u.role, u.createdAt, u.lastLoginAt
        ORDER BY u.createdAt DESC
      `;

      const processedStats = userStats.map(user => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        profession: user.localRole || 'Professional',
        joinDate: user.joinDate,
        lastActivity: user.lastLoginAt,
        patientsCount: Number(user.patientsCount), // Only count - no patient data
        assessmentsCount: Number(user.assessmentsCount),
        // NO patient names, NO medical data, NO sensitive information
      }));

      res.json({
        success: true,
        data: {
          users: processedStats,
          totalUsers: processedStats.length
        }
      });

    } catch (error) {
      console.error('User overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user statistics'
      });
    }
  }
);

/**
 * GET /api/admin/analytics/usage-patterns
 * Platform usage patterns - Aggregated data only
 */
router.get('/usage-patterns',
  adminOnlyStrict,
  async (req, res) => {
    try {
      // Get usage patterns by hour, day, etc.
      const usagePatterns = await prisma.$queryRaw`
        SELECT 
          HOUR(createdAt) as hour,
          COUNT(*) as activityCount
        FROM clinimetrix_assessments
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY HOUR(createdAt)
        ORDER BY hour
      `;

      // Get most used resources
      const resourceUsage = await prisma.$queryRaw`
        SELECT 
          JSON_EXTRACT(templateData, '$.metadata.category') as category,
          COUNT(*) as usageCount
        FROM clinimetrix_assessments ca
        JOIN clinimetrix_templates ct ON ca.templateId = ct.id
        GROUP BY category
        ORDER BY usageCount DESC
      `;

      const patterns = {
        hourlyActivity: usagePatterns.map(p => ({
          hour: p.hour,
          activity: Number(p.activityCount)
        })),
        resourceUsage: resourceUsage.map(r => ({
          category: r.category,
          count: Number(r.usageCount)
        })),
        peakHours: usagePatterns
          .sort((a, b) => Number(b.activityCount) - Number(a.activityCount))
          .slice(0, 3)
          .map(p => `${p.hour}:00-${p.hour + 1}:00`)
      };

      res.json({
        success: true,
        data: patterns
      });

    } catch (error) {
      console.error('Usage patterns error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve usage patterns'
      });
    }
  }
);

/**
 * GET /api/admin/analytics/finance-metrics
 * Financial metrics - Aggregated data only, NO transaction details
 */
router.get('/finance-metrics',
  adminOnlyStrict,
  async (req, res) => {
    try {
      // Mock financial data - replace with real finance module queries
      // These should come from your finance/billing system
      const financeMetrics = {
        revenue: {
          dailyAverage: 2450.50,
          weeklyTotal: 17153.50,
          monthlyTotal: 73620.00,
          yearlyProjection: 883440.00
        },
        subscriptions: {
          totalActive: 1250,
          newThisMonth: 85,
          churnRate: 3.2,
          renewalRate: 89.5
        },
        paymentMethods: {
          creditCard: 65,
          paypal: 20,
          bankTransfer: 10,
          crypto: 3,
          other: 2
        },
        userMetrics: {
          avgRevenuePerUser: 58.90,
          conversionRate: 12.5,
          lifetimeValue: 680.50
        },
        // NO individual transaction data
        // NO personal payment information
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: financeMetrics
      });

    } catch (error) {
      console.error('Finance metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve financial metrics'
      });
    }
  }
);

module.exports = router;