/**
 * Base API Controller for Integrix
 * 
 * Provides common functionality for all API controllers including:
 * - Standard response formatting
 * - Error handling
 * - Pagination
 * - Filtering and sorting
 * - Request validation
 */

const { logger } = require('../../shared/config/storage');

class BaseController {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = logger;
  }
  
  /**
   * Send successful response
   * @param {object} res - Express response object
   * @param {*} data - Response data
   * @param {object} meta - Optional metadata
   * @param {number} statusCode - HTTP status code
   */
  sendSuccess(res, data, meta = {}, statusCode = 200) {
    const response = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        service: this.serviceName,
        ...meta
      }
    };
    
    res.status(statusCode).json(response);
  }
  
  /**
   * Send error response
   * @param {object} res - Express response object
   * @param {Error|string} error - Error object or message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   */
  sendError(res, error, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error
    this.logger.error(`${this.serviceName} Error:`, {
      errorCode,
      message: errorMessage,
      stack: errorStack,
      requestId: res.locals.requestId,
      path: res.req?.path,
      method: res.req?.method
    });
    
    const response = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        service: this.serviceName
      }
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && errorStack) {
      response.error.stack = errorStack;
    }
    
    res.status(statusCode).json(response);
  }
  
  /**
   * Send paginated response
   * @param {object} res - Express response object
   * @param {Array} items - Array of items
   * @param {object} pagination - Pagination info
   */
  sendPaginated(res, items, pagination) {
    const meta = {
      pagination: {
        page: pagination.page || 1,
        pageSize: pagination.pageSize || items.length,
        totalItems: pagination.totalItems || items.length,
        totalPages: Math.ceil((pagination.totalItems || items.length) / (pagination.pageSize || items.length)),
        hasNext: pagination.hasNext || false,
        hasPrevious: pagination.hasPrevious || false
      }
    };
    
    this.sendSuccess(res, items, meta);
  }
  
  /**
   * Parse pagination parameters from request
   * @param {object} req - Express request object
   * @returns {object} Pagination parameters
   */
  parsePagination(req) {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100); // Max 100 items
    const offset = (page - 1) * pageSize;
    
    return {
      page,
      pageSize,
      offset,
      limit: pageSize
    };
  }
  
  /**
   * Parse sorting parameters from request
   * @param {object} req - Express request object
   * @param {Array} allowedFields - Allowed sort fields
   * @returns {object} Sort parameters
   */
  parseSorting(req, allowedFields = []) {
    const sortParam = req.query.sort || '';
    const sortFields = sortParam.split(',').filter(Boolean);
    
    const sorting = [];
    
    for (const field of sortFields) {
      const isDescending = field.startsWith('-');
      const fieldName = isDescending ? field.substring(1) : field;
      
      // Validate field is allowed
      if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
        continue;
      }
      
      sorting.push({
        field: fieldName,
        direction: isDescending ? 'DESC' : 'ASC'
      });
    }
    
    return sorting;
  }
  
  /**
   * Parse filtering parameters from request
   * @param {object} req - Express request object
   * @param {Array} allowedFields - Allowed filter fields
   * @returns {object} Filter parameters
   */
  parseFilters(req, allowedFields = []) {
    const filters = {};
    
    // Parse filter[field]=value format
    for (const key in req.query) {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const field = key.slice(7, -1); // Extract field name
        
        // Validate field is allowed
        if (allowedFields.length > 0 && !allowedFields.includes(field)) {
          continue;
        }
        
        filters[field] = req.query[key];
      }
    }
    
    // Also support simple field=value format
    for (const field of allowedFields) {
      if (req.query[field] && !filters[field]) {
        filters[field] = req.query[field];
      }
    }
    
    return filters;
  }
  
  /**
   * Parse include/expand parameters for related data
   * @param {object} req - Express request object
   * @param {Array} allowedIncludes - Allowed include fields
   * @returns {Array} Include fields
   */
  parseIncludes(req, allowedIncludes = []) {
    const includeParam = req.query.include || req.query.expand || '';
    const includes = includeParam.split(',').filter(Boolean);
    
    // Validate includes
    if (allowedIncludes.length > 0) {
      return includes.filter(inc => allowedIncludes.includes(inc));
    }
    
    return includes;
  }
  
  /**
   * Parse field selection parameters
   * @param {object} req - Express request object
   * @param {string} resourceType - Resource type
   * @returns {Array} Selected fields
   */
  parseFields(req, resourceType) {
    const fieldParam = req.query[`fields[${resourceType}]`] || req.query.fields || '';
    return fieldParam.split(',').filter(Boolean);
  }
  
  /**
   * Validate required fields in request body
   * @param {object} body - Request body
   * @param {Array} requiredFields - Required field names
   * @throws {Error} If validation fails
   */
  validateRequired(body, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
  
  /**
   * Validate data types
   * @param {object} body - Request body
   * @param {object} schema - Field type schema
   * @throws {Error} If validation fails
   */
  validateTypes(body, schema) {
    const errors = [];
    
    for (const [field, type] of Object.entries(schema)) {
      const value = body[field];
      if (value === undefined || value === null) continue;
      
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string`);
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`${field} must be a number`);
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push(`${field} must be a boolean`);
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${field} must be an array`);
          }
          break;
          
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`${field} must be an object`);
          }
          break;
          
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors.push(`${field} must be a valid date`);
          }
          break;
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field} must be a valid email`);
          }
          break;
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join('; ')}`);
    }
  }
  
  /**
   * Sanitize input data
   * @param {object} data - Input data
   * @param {Array} allowedFields - Allowed fields
   * @returns {object} Sanitized data
   */
  sanitizeInput(data, allowedFields) {
    const sanitized = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Basic sanitization
        if (typeof data[field] === 'string') {
          sanitized[field] = data[field].trim();
        } else {
          sanitized[field] = data[field];
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Handle async route
   * @param {Function} fn - Async function
   * @returns {Function} Express middleware
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  
  /**
   * Check user authorization for resource
   * @param {object} user - User object from auth
   * @param {string} resource - Resource type
   * @param {string} action - Action type
   * @returns {boolean} Authorization result
   */
  checkAuthorization(user, resource, action) {
    // This is a simplified authorization check
    // In production, this would integrate with a proper RBAC system
    
    const permissions = {
      admin: ['*'],
      psychiatrist: ['read', 'write', 'delete'],
      psychologist: ['read', 'write'],
      nurse: ['read'],
      patient: ['read:own']
    };
    
    const userRole = user.role || 'patient';
    const allowedActions = permissions[userRole] || [];
    
    return allowedActions.includes('*') || 
           allowedActions.includes(action) ||
           (action === 'read' && allowedActions.includes('read:own'));
  }
  
  /**
   * Get client IP address
   * @param {object} req - Express request
   * @returns {string} IP address
   */
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket?.remoteAddress ||
           'unknown';
  }
  
  /**
   * Log API access
   * @param {object} req - Express request
   * @param {object} res - Express response
   * @param {object} details - Additional details
   */
  logAccess(req, res, details = {}) {
    this.logger.info('API Access', {
      service: this.serviceName,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestId: res.locals.requestId,
      userId: req.user?.id,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      duration: Date.now() - req.startTime,
      ...details
    });
  }
}

module.exports = BaseController;