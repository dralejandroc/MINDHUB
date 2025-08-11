/**
 * Admin System Management Routes - RESTRICTED ACCESS
 * 
 * SECURITY: Only org:admin users can access system management
 * Functions: Health checks, system status, configuration (NO patient data)
 */

const express = require('express');
const { getPrismaClient } = require('../../shared/config/prisma');

const router = express.Router();
const prisma = getPrismaClient();

/**
 * Strict admin-only middleware - Returns 404 for non-admins
 */
const adminOnlyStrict = (req, res, next) => {
  if (!req.user || req.user.role !== 'org:admin') {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
};

/**
 * GET /api/admin/system/health
 * System health check - Technical metrics only
 */
router.get('/health',
  adminOnlyStrict,
  async (req, res) => {
    try {
      console.log(`🔧 System health checked by admin: ${req.user.email}`);

      // Database connectivity test
      const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
      
      // Get system metrics
      const systemHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbTest ? 'operational' : 'error',
          api: 'operational',
          auth: 'operational',
          frontend: 'operational'
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      };

      res.json({
        success: true,
        data: systemHealth
      });

    } catch (error) {
      console.error('System health check error:', error);
      res.status(500).json({
        success: false,
        error: 'System health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/admin/system/status
 * Detailed system status - NO sensitive data
 */
router.get('/status',
  adminOnlyStrict,
  async (req, res) => {
    try {
      // Get system statistics
      const [
        dbStats,
        tableStats
      ] = await Promise.all([
        prisma.$queryRaw`
          SELECT 
            COUNT(*) as connectionCount,
            NOW() as serverTime
        `,
        prisma.$queryRaw`
          SELECT 
            table_name as tableName,
            table_rows as rowCount
          FROM information_schema.tables 
          WHERE table_schema = DATABASE()
          ORDER BY table_rows DESC
        `
      ]);

      const systemStatus = {
        database: {
          status: 'connected',
          serverTime: dbStats[0].serverTime,
          tables: tableStats.map(table => ({
            name: table.tableName,
            rows: Number(table.rowCount) // Only counts, no actual data
          }))
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime()
        },
        lastChecked: new Date().toISOString()
      };

      res.json({
        success: true,
        data: systemStatus
      });

    } catch (error) {
      console.error('System status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system status'
      });
    }
  }
);

/**
 * GET /api/admin/system/logs
 * System logs - Filtered to exclude sensitive data
 */
router.get('/logs',
  adminOnlyStrict,
  async (req, res) => {
    try {
      // Mock system logs - in production, integrate with your logging system
      const systemLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'User authentication successful',
          category: 'auth'
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          level: 'warn',
          message: 'High memory usage detected',
          category: 'system'
        },
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          level: 'info',
          message: 'Database backup completed',
          category: 'database'
        }
        // NO logs with patient data or sensitive information
      ];

      res.json({
        success: true,
        data: {
          logs: systemLogs.slice(0, 100), // Limit to recent logs
          totalLogs: systemLogs.length
        }
      });

    } catch (error) {
      console.error('System logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system logs'
      });
    }
  }
);

module.exports = router;