/**
 * Form Validation Middleware for Formx Hub
 * 
 * Comprehensive form validation with dynamic field validation,
 * conditional logic validation, and healthcare-specific form rules
 */

const { body, param, query } = require('express-validator');

/**
 * Validation rules for form creation and updates
 */
const validateForm = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .escape(),

  body('category')
    .isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment'])
    .withMessage('Invalid form category'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.thankYouMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thank you message must not exceed 500 characters'),

  body('settings.allowMultipleSubmissions')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple submissions must be boolean'),

  body('settings.requireAuthentication')
    .optional()
    .isBoolean()
    .withMessage('Require authentication must be boolean'),

  body('settings.collectSignature')
    .optional()
    .isBoolean()
    .withMessage('Collect signature must be boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('IsActive must be boolean'),

  body('fields')
    .isArray({ min: 1 })
    .withMessage('Fields must be a non-empty array'),

  body('fields.*.type')
    .isIn([
      'text',
      'textarea',
      'email',
      'phone',
      'number',
      'date',
      'time',
      'datetime',
      'select',
      'multiselect',
      'radio',
      'checkbox',
      'file',
      'signature',
      'scale',
      'matrix',
      'section_header',
      'info_text',
      'consent'
    ])
    .withMessage('Invalid field type'),

  body('fields.*.label')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Field label must be between 1 and 200 characters'),

  body('fields.*.placeholder')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Placeholder must not exceed 200 characters'),

  body('fields.*.helpText')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Help text must not exceed 500 characters'),

  body('fields.*.required')
    .optional()
    .isBoolean()
    .withMessage('Required must be boolean'),

  body('fields.*.order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),

  body('fields.*.validation')
    .optional()
    .isObject()
    .withMessage('Validation must be an object'),

  body('fields.*.validation.minLength')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min length must be a non-negative integer'),

  body('fields.*.validation.maxLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max length must be a positive integer'),

  body('fields.*.validation.min')
    .optional()
    .isNumeric()
    .withMessage('Min must be a number'),

  body('fields.*.validation.max')
    .optional()
    .isNumeric()
    .withMessage('Max must be a number'),

  body('fields.*.validation.pattern')
    .optional()
    .isString()
    .withMessage('Pattern must be a string'),

  body('fields.*.options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),

  body('fields.*.options.*.label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Option label must be between 1 and 200 characters'),

  body('fields.*.options.*.value')
    .optional()
    .isString()
    .withMessage('Option value must be a string'),

  body('fields.*.conditionalLogic')
    .optional()
    .isObject()
    .withMessage('Conditional logic must be an object'),

  body('fields.*.conditionalLogic.showIf')
    .optional()
    .isObject()
    .withMessage('ShowIf must be an object'),

  body('fields.*.conditionalLogic.hideIf')
    .optional()
    .isObject()
    .withMessage('HideIf must be an object'),

  body('fields.*.conditionalLogic.requiredIf')
    .optional()
    .isObject()
    .withMessage('RequiredIf must be an object')
];

/**
 * Validation rules for form submission
 */
const validateFormSubmission = [
  param('id')
    .isUUID()
    .withMessage('Invalid form ID format'),

  body('responses')
    .isObject()
    .withMessage('Responses must be an object'),

  body('submitterName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Submitter name must be between 2 and 100 characters')
    .escape(),

  body('submitterEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('signature')
    .optional()
    .isString()
    .withMessage('Signature must be a string')
];

/**
 * Validation rules for form search
 */
const validateFormSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .escape(),

  query('category')
    .optional()
    .isIn(['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment'])
    .withMessage('Invalid category'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('IsActive must be boolean'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation rules for form duplication
 */
const validateFormDuplication = [
  param('id')
    .isUUID()
    .withMessage('Invalid form ID format'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape()
];

/**
 * Custom validation function for field dependencies
 */
const validateFieldDependencies = (req, res, next) => {
  const { fields } = req.body;
  
  if (!fields || !Array.isArray(fields)) {
    return next();
  }

  const errors = [];
  const fieldIds = new Set();

  // Check for duplicate field IDs and validate dependencies
  fields.forEach((field, index) => {
    const fieldId = field.id || `field_${index}`;
    
    if (fieldIds.has(fieldId)) {
      errors.push({
        type: 'field',
        msg: `Duplicate field ID: ${fieldId}`,
        path: `fields[${index}].id`,
        location: 'body'
      });
    }
    fieldIds.add(fieldId);

    // Validate conditional logic references
    if (field.conditionalLogic) {
      ['showIf', 'hideIf', 'requiredIf'].forEach(condition => {
        if (field.conditionalLogic[condition]) {
          const referencedFieldId = field.conditionalLogic[condition].fieldId;
          if (referencedFieldId && !fieldIds.has(referencedFieldId)) {
            errors.push({
              type: 'field',
              msg: `Conditional logic references non-existent field: ${referencedFieldId}`,
              path: `fields[${index}].conditionalLogic.${condition}.fieldId`,
              location: 'body'
            });
          }
        }
      });
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Field validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Healthcare-specific form validation
 */
const validateHealthcareForm = (req, res, next) => {
  const { category, fields } = req.body;
  const errors = [];

  // Healthcare category specific validations
  if (category === 'screening' || category === 'assessment') {
    // Must have at least one scale or assessment field
    const hasAssessmentField = fields.some(field => 
      ['scale', 'matrix', 'radio'].includes(field.type)
    );
    
    if (!hasAssessmentField) {
      errors.push({
        type: 'field',
        msg: 'Screening and assessment forms must contain at least one assessment field (scale, matrix, or radio)',
        path: 'fields',
        location: 'body'
      });
    }
  }

  if (category === 'consent') {
    // Must have consent checkbox
    const hasConsentField = fields.some(field => field.type === 'consent');
    
    if (!hasConsentField) {
      errors.push({
        type: 'field',
        msg: 'Consent forms must contain at least one consent field',
        path: 'fields',
        location: 'body'
      });
    }
  }

  // Validate sensitive field handling
  fields.forEach((field, index) => {
    if (field.type === 'file') {
      // File upload fields should have size and type restrictions
      if (!field.validation || !field.validation.allowedTypes) {
        errors.push({
          type: 'field',
          msg: 'File upload fields must specify allowed file types',
          path: `fields[${index}].validation.allowedTypes`,
          location: 'body'
        });
      }
    }

    if (field.type === 'signature') {
      // Signature fields should be marked as required for legal forms
      if (category === 'consent' && !field.required) {
        errors.push({
          type: 'field',
          msg: 'Signature fields in consent forms must be required',
          path: `fields[${index}].required`,
          location: 'body'
        });
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Healthcare form validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Validate form submission data against form definition
 */
const validateSubmissionData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;

    // This would typically fetch the form definition from database
    // For now, we'll do basic validation
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        error: 'Invalid responses format',
        message: 'Responses must be an object'
      });
    }

    // Validate that all response values are not empty for required fields
    const emptyResponses = Object.entries(responses).filter(([key, value]) => {
      return value === null || value === undefined || value === '';
    });

    if (emptyResponses.length > 0) {
      // This is basic validation - in real implementation, check against form definition
      console.log('Empty responses detected:', emptyResponses);
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Submission validation failed',
      details: error.message
    });
  }
};

module.exports = {
  validateForm,
  validateFormSubmission,
  validateFormSearch,
  validateFormDuplication,
  validateFieldDependencies,
  validateHealthcareForm,
  validateSubmissionData
};