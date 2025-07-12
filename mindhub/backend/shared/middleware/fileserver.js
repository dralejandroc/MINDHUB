/**
 * Secure File Server Middleware
 * 
 * Serves uploaded files with healthcare compliance and security checks.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { logger } = require('../config/storage');

/**
 * Create secure file server middleware
 * @param {string} uploadDir - Base upload directory
 * @returns {Function} Express middleware
 */
function createFileServer(uploadDir) {
  return (req, res, next) => {
    const requestedPath = req.path.replace('/uploads/', '');
    const fullPath = path.join(uploadDir, requestedPath);
    const metadataPath = fullPath + '.meta.json';
    
    // Security checks
    if (!isPathSafe(requestedPath, uploadDir)) {
      logger.warn('Unsafe file path attempted', { 
        path: requestedPath,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Load and validate metadata
    fs.readFile(metadataPath, 'utf8', (err, metadataContent) => {
      if (err) {
        logger.error('Metadata read failed', { 
          path: requestedPath,
          error: err.message 
        });
        return res.status(500).json({ error: 'File metadata unavailable' });
      }
      
      try {
        const metadata = JSON.parse(metadataContent);
        
        // Healthcare compliance checks
        if (metadata.category === 'patients') {
          // Patient files require authentication
          if (!req.user) {
            return res.status(401).json({ error: 'Authentication required for patient files' });
          }
          
          // Check if user has access to this patient
          if (!hasPatientAccess(req.user, metadata.patientId)) {
            logger.warn('Unauthorized patient file access attempt', {
              userId: req.user.id,
              patientId: metadata.patientId,
              filePath: requestedPath,
              ip: req.ip
            });
            return res.status(403).json({ error: 'Access denied' });
          }
        }
        
        // Log file access for compliance
        logger.info('File accessed', {
          filePath: requestedPath,
          category: metadata.category,
          userId: req.user?.id,
          patientId: metadata.patientId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Set appropriate headers
        res.set({
          'Content-Type': metadata.mimeType,
          'Content-Disposition': `inline; filename="${metadata.originalName}"`,
          'Cache-Control': metadata.category === 'patients' ? 'private, no-cache' : 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        });
        
        // Stream file
        const stream = fs.createReadStream(fullPath);
        stream.pipe(res);
        
        stream.on('error', (streamErr) => {
          logger.error('File streaming error', {
            path: requestedPath,
            error: streamErr.message
          });
          if (!res.headersSent) {
            res.status(500).json({ error: 'File streaming failed' });
          }
        });
        
      } catch (parseErr) {
        logger.error('Metadata parsing failed', {
          path: requestedPath,
          error: parseErr.message
        });
        res.status(500).json({ error: 'Invalid file metadata' });
      }
    });
  };
}

/**
 * Check if file path is safe (prevent directory traversal)
 * @param {string} requestedPath - Requested file path
 * @param {string} baseDir - Base directory
 * @returns {boolean} True if path is safe
 */
function isPathSafe(requestedPath, baseDir) {
  const resolvedPath = path.resolve(baseDir, requestedPath);
  const resolvedBase = path.resolve(baseDir);
  
  // Path must be within base directory
  return resolvedPath.startsWith(resolvedBase);
}

/**
 * Check if user has access to patient files
 * @param {Object} user - User object
 * @param {string} patientId - Patient ID
 * @returns {boolean} True if user has access
 */
function hasPatientAccess(user, patientId) {
  // TODO: Implement proper patient access control
  // This should check:
  // 1. User role and permissions
  // 2. Patient assignment to healthcare provider
  // 3. Active treatment relationship
  // 4. Emergency access protocols
  
  // For now, allow access for authenticated healthcare providers
  const allowedRoles = ['psychiatrist', 'psychologist', 'healthcare_admin'];
  return user && user.roles && user.roles.some(role => allowedRoles.includes(role.name));
}

/**
 * Create download handler for secure file downloads
 * @param {string} uploadDir - Base upload directory
 * @returns {Function} Express route handler
 */
function createDownloadHandler(uploadDir) {
  return (req, res) => {
    const { category, subcategory, fileName } = req.params;
    const filePath = path.join(category, subcategory, fileName);
    const fullPath = path.join(uploadDir, filePath);
    const metadataPath = fullPath + '.meta.json';
    
    // Security and existence checks
    if (!isPathSafe(filePath, uploadDir) || !fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Load metadata
    fs.readFile(metadataPath, 'utf8', (err, metadataContent) => {
      if (err) {
        return res.status(500).json({ error: 'File metadata unavailable' });
      }
      
      try {
        const metadata = JSON.parse(metadataContent);
        
        // Healthcare compliance checks
        if (metadata.category === 'patients' && !hasPatientAccess(req.user, metadata.patientId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Log download for compliance
        logger.info('File downloaded', {
          filePath,
          category: metadata.category,
          userId: req.user?.id,
          patientId: metadata.patientId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          downloadType: 'attachment'
        });
        
        // Force download
        res.set({
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
          'Cache-Control': 'private, no-cache'
        });
        
        const stream = fs.createReadStream(fullPath);
        stream.pipe(res);
        
      } catch (parseErr) {
        res.status(500).json({ error: 'Invalid file metadata' });
      }
    });
  };
}

/**
 * Create thumbnail handler for image files
 * @param {string} uploadDir - Base upload directory
 * @returns {Function} Express route handler
 */
function createThumbnailHandler(uploadDir) {
  return (req, res) => {
    const { category, subcategory, fileName } = req.params;
    const { size = '150x150' } = req.query;
    
    // For now, return the original image
    // TODO: Implement image resizing with sharp or similar library
    const filePath = path.join(category, subcategory, fileName);
    const fullPath = path.join(uploadDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Simple image serving (implement proper thumbnail generation)
    res.sendFile(fullPath, (err) => {
      if (err) {
        res.status(500).json({ error: 'Thumbnail generation failed' });
      }
    });
  };
}

/**
 * Middleware to check file upload permissions
 * @param {string} category - File category
 * @returns {Function} Express middleware
 */
function checkUploadPermissions(category) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check category-specific permissions
    const permissions = {
      patients: ['write:patients'],
      assessments: ['write:assessments'],
      resources: ['write:resources'],
      forms: ['write:forms']
    };
    
    const requiredPermissions = permissions[category] || [];
    const userPermissions = req.user.permissions || [];
    
    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm) || userPermissions.includes('admin:all')
    );
    
    if (!hasPermission) {
      logger.warn('File upload permission denied', {
        userId: req.user.id,
        category,
        requiredPermissions,
        userPermissions
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions for file upload',
        category,
        required: requiredPermissions
      });
    }
    
    next();
  };
}

module.exports = {
  createFileServer,
  createDownloadHandler,
  createThumbnailHandler,
  checkUploadPermissions,
  isPathSafe,
  hasPatientAccess
};