/**
 * MindHub Admin Routes - STRICTLY RESTRICTED ACCESS
 * 
 * SECURITY NOTICE: This module is ONLY accessible to org:admin users
 * Returns 404 for any non-admin access to hide existence of admin functionality
 * 
 * PRIVACY COMPLIANCE: NO sensitive patient data is ever exposed through these routes
 */

const express = require('express');
const { clerkRequiredAuth } = require('../shared/middleware/clerk-auth-middleware');
const analyticsRoutes = require('./routes/analytics');
const systemRoutes = require('./routes/system');

const router = express.Router();

/**
 * Apply Clerk Required Auth to ALL admin routes
 * This ensures proper token validation before role checking
 */
router.use('*', clerkRequiredAuth);

/**
 * Global admin check - Hide admin functionality from non-admin users
 */
router.use('*', (req, res, next) => {
  // If user is not admin, pretend this doesn't exist
  // Accept both 'admin' and 'org:admin' for compatibility
  const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'org:admin');
  
  if (!isAdmin) {
    console.log(`❌ Admin access denied: User ${req.user?.email || 'unknown'} with role "${req.user?.role || 'none'}" tried to access admin panel`);
    return res.status(404).json({ error: 'Not Found' });
  }
  
  // Log all admin access for security auditing
  console.log(`🔐 Admin access: ${req.user.email} (role: ${req.user.role}) -> ${req.method} ${req.originalUrl}`);
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
    timestamp: new Date().toISOString(),
    user: {
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
      isAdmin: req.user.isAdmin,
      clerkUserId: req.user.clerkUserId
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

/**
 * Simple test endpoint to verify admin authentication
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '🔐 Admin authentication working!',
    user: req.user.email,
    role: req.user.role,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;