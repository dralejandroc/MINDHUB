/**
 * MindHub Admin Routes - STRICTLY RESTRICTED ACCESS
 * 
 * SECURITY NOTICE: This module is ONLY accessible to org:admin users
 * Returns 404 for any non-admin access to hide existence of admin functionality
 * 
 * PRIVACY COMPLIANCE: NO sensitive patient data is ever exposed through these routes
 */

const express = require('express');
const analyticsRoutes = require('./routes/analytics');
const systemRoutes = require('./routes/system');

const router = express.Router();

/**
 * Global admin check - Hide admin functionality from non-admin users
 */
router.use('*', (req, res, next) => {
  // If user is not admin, pretend this doesn't exist
  if (!req.user || req.user.role !== 'org:admin') {
    return res.status(404).json({ error: 'Not Found' });
  }
  
  // Log all admin access for security auditing
  console.log(`🔐 Admin access: ${req.user.email} -> ${req.method} ${req.originalUrl}`);
  next();
});

// Mount admin routes
router.use('/analytics', analyticsRoutes);
router.use('/system', systemRoutes);

/**
 * Admin dashboard info endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MindHub Admin Panel',
    user: {
      email: req.user.email,
      role: req.user.role,
      name: req.user.name
    },
    availableEndpoints: [
      'GET /analytics/platform-stats',
      'GET /analytics/users-overview', 
      'GET /analytics/usage-patterns',
      'GET /analytics/finance-metrics',
      'GET /system/health',
      'GET /system/status',
      'GET /system/logs'
    ],
    securityNotice: 'All data is aggregated and anonymized. No sensitive patient information is accessible.'
  });
});

module.exports = router;