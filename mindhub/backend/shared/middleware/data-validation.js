/**
 * Data Validation and Sanitization Middleware for MindHub Healthcare Platform
 * 
 * Comprehensive validation with healthcare-specific rules, PHI protection,
 * and compliance with NOM-024-SSA3-2010 standards
 */

const Joi = require('joi');
const validator = require('validator');
const { body, param, query, validationResult } = require('express-validator');
const auditLogger = require('../utils/audit-logger');

class DataValidationMiddleware {
  constructor() {
    this.healthcareValidators = this.initializeHealthcareValidators();
    this.sanitizers = this.initializeSanitizers();
    this.complianceRules = this.initializeComplianceRules();
  }

  /**
   * Initialize healthcare-specific validators
   */
  initializeHealthcareValidators() {
    return {
      // Patient validators
      patientName: Joi.string()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/)
        .messages({
          'string.pattern.base': 'Name must contain only letters, spaces, hyphens, and apostrophes',
          'string.min': 'Name must be at least 1 character long',
          'string.max': 'Name must not exceed 100 characters'
        }),

      medicalRecordNumber: Joi.string()
        .pattern(/^MRN-\d{4}-\d{3,6}$/)
        .messages({
          'string.pattern.base': 'Medical record number must follow format MRN-YYYY-XXXXXX'
        }),

      dateOfBirth: Joi.date()
        .max('now')
        .min('1900-01-01')
        .messages({
          'date.max': 'Date of birth cannot be in the future',
          'date.min': 'Date of birth must be after 1900'
        }),

      gender: Joi.string()
        .valid('male', 'female', 'other', 'prefer_not_to_say')
        .messages({
          'any.only': 'Gender must be one of: male, female, other, prefer_not_to_say'
        }),

      mexicanPhone: Joi.string()
        .pattern(/^\+52-\d{2}-\d{4}-\d{4}$/)
        .messages({
          'string.pattern.base': 'Phone number must follow Mexican format +52-XX-XXXX-XXXX'
        }),

      mexicanZipCode: Joi.string()
        .pattern(/^\d{5}$/)
        .messages({
          'string.pattern.base': 'ZIP code must be 5 digits'
        }),

      // Clinical assessment validators
      assessmentScore: Joi.number()
        .integer()
        .min(0)
        .max(100)
        .messages({
          'number.min': 'Assessment score must be at least 0',
          'number.max': 'Assessment score must not exceed 100'
        }),

      scaleType: Joi.string()
        .valid('depression', 'anxiety', 'cognitive', 'personality', 'substance_use', 'eating_disorder')
        .messages({
          'any.only': 'Scale type must be a valid clinical assessment type'
        }),

      administrationType: Joi.string()
        .valid('self_administered', 'hetero_administered', 'remote_tokenized')
        .messages({
          'any.only': 'Administration type must be one of: self_administered, hetero_administered, remote_tokenized'
        }),

      // Form validators
      formCategory: Joi.string()
        .valid('intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment')
        .messages({
          'any.only': 'Form category must be a valid healthcare form type'
        }),

      fieldType: Joi.string()
        .valid('text', 'email', 'phone', 'number', 'date', 'select', 'multiselect', 'radio', 'checkbox', 'textarea', 'file')
        .messages({
          'any.only': 'Field type must be a valid form field type'
        }),

      // User and role validators
      userRole: Joi.string()
        .valid('admin', 'psychiatrist', 'psychologist', 'nurse', 'patient')
        .messages({
          'any.only': 'User role must be one of: admin, psychiatrist, psychologist, nurse, patient'
        }),

      // UUID validator
      uuid: Joi.string()
        .uuid({ version: 'uuidv4' })
        .messages({
          'string.guid': 'Must be a valid UUID'
        }),

      // Healthcare-specific text validator
      clinicalNotes: Joi.string()
        .max(2000)
        .pattern(/^[^<>{}]*$/)
        .messages({
          'string.max': 'Clinical notes must not exceed 2000 characters',
          'string.pattern.base': 'Clinical notes cannot contain HTML tags or special characters'
        })
    };
  }

  /**
   * Initialize data sanitizers
   */
  initializeSanitizers() {
    return {
      // Basic sanitization
      sanitizeString: (value) => {
        if (typeof value !== 'string') return value;
        return validator.escape(validator.trim(value));
      },

      // Healthcare name sanitization (preserve accents)
      sanitizeName: (value) => {
        if (typeof value !== 'string') return value;
        return validator.trim(value)
          .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, '')
          .replace(/\s+/g, ' ');
      },

      // Phone number sanitization
      sanitizePhone: (value) => {
        if (typeof value !== 'string') return value;
        return value.replace(/[^\d+\-]/g, '');
      },

      // Email sanitization
      sanitizeEmail: (value) => {
        if (typeof value !== 'string') return value;
        return validator.normalizeEmail(value, {
          gmail_remove_dots: false,
          gmail_remove_subaddress: false,
          outlookdotcom_remove_subaddress: false,
          yahoo_remove_subaddress: false,
          icloud_remove_subaddress: false
        });
      },

      // Clinical notes sanitization
      sanitizeClinicalNotes: (value) => {
        if (typeof value !== 'string') return value;
        return validator.escape(validator.trim(value))
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/[{}]/g, ''); // Remove curly braces
      },

      // Recursive object sanitization
      sanitizeObject: (obj, excludeFields = []) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
          if (excludeFields.includes(key)) {
            sanitized[key] = value;
            continue;
          }

          if (typeof value === 'string') {
            sanitized[key] = this.sanitizers.sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = this.sanitizers.sanitizeObject(value, excludeFields);
          } else {
            sanitized[key] = value;
          }
        }
        
        return sanitized;
      }
    };
  }

  /**
   * Initialize compliance rules
   */
  initializeComplianceRules() {
    return {
      // PHI field detection
      phiFields: [
        'firstName', 'lastName', 'fullName', 'name',
        'email', 'phone', 'address', 'dateOfBirth',
        'medicalRecordNumber', 'ssn', 'nationalId',
        'emergencyContact', 'contactInfo'
      ],

      // Clinical data fields
      clinicalFields: [
        'assessmentResults', 'clinicalNotes', 'diagnosis',
        'treatment', 'medication', 'symptoms', 'responses'
      ],

      // Required audit fields for PHI access
      auditRequiredFields: [
        'userId', 'userRole', 'accessPurpose', 'patientId'
      ],

      // Maximum lengths for different field types
      maxLengths: {
        name: 100,
        email: 255,
        phone: 20,
        notes: 2000,
        description: 1000,
        title: 200
      }
    };
  }

  /**
   * Create patient validation schema
   */
  createPatientValidationSchema() {
    return {
      firstName: this.healthcareValidators.patientName.required(),
      lastName: this.healthcareValidators.patientName.required(),
      dateOfBirth: this.healthcareValidators.dateOfBirth.required(),
      gender: this.healthcareValidators.gender.optional(),
      'contactInfo.email': Joi.string().email().optional(),
      'contactInfo.phone': this.healthcareValidators.mexicanPhone.optional(),
      'contactInfo.address.street': Joi.string().max(200).optional(),
      'contactInfo.address.city': Joi.string().max(100).optional(),
      'contactInfo.address.state': Joi.string().max(100).optional(),
      'contactInfo.address.zipCode': this.healthcareValidators.mexicanZipCode.optional(),
      'contactInfo.address.country': Joi.string().default('Mexico').optional(),
      'emergencyContact.name': this.healthcareValidators.patientName.optional(),
      'emergencyContact.phone': this.healthcareValidators.mexicanPhone.optional(),
      'emergencyContact.relationship': Joi.string().max(50).optional()
    };
  }

  /**
   * Create assessment validation schema
   */
  createAssessmentValidationSchema() {
    return {
      patientId: this.healthcareValidators.uuid.required(),
      scaleId: this.healthcareValidators.uuid.required(),
      administrationType: this.healthcareValidators.administrationType.required(),
      responses: Joi.array().items(
        Joi.object({
          itemId: this.healthcareValidators.uuid.required(),
          value: Joi.alternatives().try(
            Joi.string().max(500),
            Joi.number(),
            Joi.boolean()
          ).required(),
          text: Joi.string().max(1000).optional()
        })
      ).min(1).required(),
      notes: this.healthcareValidators.clinicalNotes.optional(),
      administrationDate: Joi.date().default(Date.now)
    };
  }

  /**
   * Create form validation schema
   */
  createFormValidationSchema() {
    return {
      title: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(1000).optional(),
      category: this.healthcareValidators.formCategory.required(),
      fields: Joi.array().items(
        Joi.object({
          type: this.healthcareValidators.fieldType.required(),
          label: Joi.string().min(1).max(200).required(),
          placeholder: Joi.string().max(200).optional(),
          required: Joi.boolean().default(false),
          order: Joi.number().integer().min(1).required(),
          validation: Joi.object({
            minLength: Joi.number().integer().min(0).optional(),
            maxLength: Joi.number().integer().min(1).optional(),
            pattern: Joi.string().optional(),
            min: Joi.number().optional(),
            max: Joi.number().optional()
          }).optional(),
          options: Joi.array().items(
            Joi.object({
              value: Joi.string().required(),
              label: Joi.string().required()
            })
          ).optional()
        })
      ).min(1).required(),
      isActive: Joi.boolean().default(true)
    };
  }

  /**
   * Validate request data with healthcare-specific rules
   */
  async validateData(schema, data, options = {}) {
    try {
      // Sanitize data first
      const sanitizedData = this.sanitizers.sanitizeObject(data, options.excludeFromSanitization || []);
      
      // Apply Joi validation
      const { error, value } = schema.validate(sanitizedData, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
        ...options.joiOptions
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          code: detail.type,
          value: detail.context?.value
        }));

        // Log validation failures for audit
        await auditLogger.logSecurityEvent('VALIDATION_FAILURE', {
          errors: validationErrors,
          originalData: this.maskSensitiveData(data),
          timestamp: new Date().toISOString()
        });

        return {
          isValid: false,
          errors: validationErrors,
          data: null
        };
      }

      // Check for PHI data and log access
      const phiFields = this.detectPHIFields(value);
      if (phiFields.length > 0) {
        await auditLogger.logDataAccess('PHI_VALIDATION', {
          phiFields,
          userId: options.userId,
          userRole: options.userRole,
          timestamp: new Date().toISOString()
        });
      }

      return {
        isValid: true,
        errors: null,
        data: value,
        phiFields
      };
    } catch (error) {
      await auditLogger.logError('VALIDATION_ERROR', {
        error: error.message,
        stack: error.stack,
        data: this.maskSensitiveData(data)
      });

      throw new Error('Validation processing failed');
    }
  }

  /**
   * Express middleware for patient validation
   */
  validatePatient() {
    return async (req, res, next) => {
      try {
        const schema = Joi.object(this.createPatientValidationSchema());
        const result = await this.validateData(schema, req.body, {
          userId: req.user?.id,
          userRole: req.user?.role
        });

        if (!result.isValid) {
          return res.status(422).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Patient data validation failed',
              details: result.errors,
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.validatedData = result.data;
        req.phiFields = result.phiFields;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Express middleware for assessment validation
   */
  validateAssessment() {
    return async (req, res, next) => {
      try {
        const schema = Joi.object(this.createAssessmentValidationSchema());
        const result = await this.validateData(schema, req.body, {
          userId: req.user?.id,
          userRole: req.user?.role
        });

        if (!result.isValid) {
          return res.status(422).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Assessment data validation failed',
              details: result.errors,
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.validatedData = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Express middleware for form validation
   */
  validateForm() {
    return async (req, res, next) => {
      try {
        const schema = Joi.object(this.createFormValidationSchema());
        const result = await this.validateData(schema, req.body, {
          userId: req.user?.id,
          userRole: req.user?.role
        });

        if (!result.isValid) {
          return res.status(422).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Form data validation failed',
              details: result.errors,
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.validatedData = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Generic validation middleware
   */
  validate(schemaOrRules) {
    return async (req, res, next) => {
      try {
        let schema;
        
        if (typeof schemaOrRules === 'function') {
          schema = schemaOrRules(req);
        } else {
          schema = Joi.object(schemaOrRules);
        }

        const result = await this.validateData(schema, req.body, {
          userId: req.user?.id,
          userRole: req.user?.role
        });

        if (!result.isValid) {
          return res.status(422).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Data validation failed',
              details: result.errors,
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.validatedData = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Parameter validation middleware
   */
  validateParams(rules) {
    const validations = [];
    
    for (const [param, rule] of Object.entries(rules)) {
      if (rule.type === 'uuid') {
        validations.push(
          param('param').isUUID(4).withMessage(`${param} must be a valid UUID`)
        );
      } else if (rule.type === 'int') {
        validations.push(
          param('param').isInt(rule.options || {}).withMessage(`${param} must be a valid integer`)
        );
      } else if (rule.type === 'string') {
        validations.push(
          param('param').isLength(rule.options || {}).withMessage(`${param} length validation failed`)
        );
      }
    }

    return [...validations, this.handleValidationErrors()];
  }

  /**
   * Query parameter validation middleware
   */
  validateQuery(rules) {
    const validations = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.type === 'int') {
        validations.push(
          query(field).optional().isInt(rule.options || {}).withMessage(`${field} must be a valid integer`)
        );
      } else if (rule.type === 'string') {
        validations.push(
          query(field).optional().isLength(rule.options || {}).withMessage(`${field} length validation failed`)
        );
      } else if (rule.type === 'email') {
        validations.push(
          query(field).optional().isEmail().withMessage(`${field} must be a valid email`)
        );
      }
    }

    return [...validations, this.handleValidationErrors()];
  }

  /**
   * Handle express-validator errors
   */
  handleValidationErrors() {
    return (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          code: 'INVALID_VALUE',
          value: error.value
        }));

        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: validationErrors,
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }
      
      next();
    };
  }

  /**
   * Detect PHI fields in data
   */
  detectPHIFields(data, path = '') {
    const phiFields = [];
    
    if (!data || typeof data !== 'object') return phiFields;
    
    for (const [key, value] of Object.entries(data)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (this.complianceRules.phiFields.includes(key)) {
        phiFields.push(currentPath);
      }
      
      if (typeof value === 'object' && value !== null) {
        phiFields.push(...this.detectPHIFields(value, currentPath));
      }
    }
    
    return phiFields;
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const masked = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.complianceRules.phiFields.includes(key)) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }
}

module.exports = new DataValidationMiddleware();