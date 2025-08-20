/**
 * Form Validation Utilities for MindHub Healthcare Platform
 * 
 * Specialized validators for healthcare forms with dynamic validation rules,
 * conditional logic, and clinical data compliance
 */

const Joi = require('joi');
const validator = require('validator');

class FormValidators {
  constructor() {
    this.healthcareFieldTypes = this.initializeHealthcareFieldTypes();
    this.validationRules = this.initializeValidationRules();
    this.conditionalLogic = this.initializeConditionalLogic();
  }

  /**
   * Initialize healthcare-specific field types
   */
  initializeHealthcareFieldTypes() {
    return {
      // Basic field types
      text: {
        baseSchema: Joi.string(),
        sanitizer: (value) => validator.escape(validator.trim(value)),
        defaultValidation: { minLength: 0, maxLength: 500 }
      },

      email: {
        baseSchema: Joi.string().email(),
        sanitizer: (value) => validator.normalizeEmail(value),
        defaultValidation: { maxLength: 255 }
      },

      phone: {
        baseSchema: Joi.string().pattern(/^\+52-\d{2}-\d{4}-\d{4}$/),
        sanitizer: (value) => value.replace(/[^\d+\-]/g, ''),
        defaultValidation: { format: 'mexican_mobile' }
      },

      number: {
        baseSchema: Joi.number(),
        sanitizer: (value) => parseFloat(value),
        defaultValidation: { min: 0, max: 999999 }
      },

      integer: {
        baseSchema: Joi.number().integer(),
        sanitizer: (value) => parseInt(value, 10),
        defaultValidation: { min: 0, max: 999999 }
      },

      date: {
        baseSchema: Joi.date(),
        sanitizer: (value) => new Date(value),
        defaultValidation: { minDate: '1900-01-01', maxDate: 'now' }
      },

      // Healthcare-specific field types
      patientName: {
        baseSchema: Joi.string().pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/),
        sanitizer: (value) => validator.trim(value).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, ''),
        defaultValidation: { minLength: 1, maxLength: 100 }
      },

      medicalId: {
        baseSchema: Joi.string().pattern(/^[A-Z0-9\-]+$/),
        sanitizer: (value) => value.toUpperCase().trim(),
        defaultValidation: { minLength: 5, maxLength: 20 }
      },

      bloodPressure: {
        baseSchema: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/),
        sanitizer: (value) => value.replace(/[^\d\/]/g, ''),
        defaultValidation: { format: 'systolic/diastolic' }
      },

      weight: {
        baseSchema: Joi.number().min(1).max(500),
        sanitizer: (value) => parseFloat(value),
        defaultValidation: { min: 1, max: 500, unit: 'kg' }
      },

      height: {
        baseSchema: Joi.number().min(30).max(250),
        sanitizer: (value) => parseFloat(value),
        defaultValidation: { min: 30, max: 250, unit: 'cm' }
      },

      medication: {
        baseSchema: Joi.string().max(200),
        sanitizer: (value) => validator.escape(validator.trim(value)),
        defaultValidation: { maxLength: 200, allowedChars: 'alphanumeric_space_dash' }
      },

      symptomSeverity: {
        baseSchema: Joi.number().integer().min(1).max(10),
        sanitizer: (value) => parseInt(value, 10),
        defaultValidation: { min: 1, max: 10, scale: 'severity_1_to_10' }
      },

      likertScale: {
        baseSchema: Joi.number().integer().min(1).max(5),
        sanitizer: (value) => parseInt(value, 10),
        defaultValidation: { min: 1, max: 5, scale: 'strongly_disagree_to_strongly_agree' }
      },

      clinicalNotes: {
        baseSchema: Joi.string().max(2000),
        sanitizer: (value) => validator.escape(validator.trim(value)).replace(/<[^>]*>/g, ''),
        defaultValidation: { maxLength: 2000, noHTML: true }
      },

      select: {
        baseSchema: Joi.string(),
        sanitizer: (value) => validator.trim(value),
        defaultValidation: { requireOptions: true }
      },

      multiselect: {
        baseSchema: Joi.array().items(Joi.string()),
        sanitizer: (value) => Array.isArray(value) ? value.map(v => validator.trim(v)) : [validator.trim(value)],
        defaultValidation: { minItems: 0, maxItems: 10 }
      },

      radio: {
        baseSchema: Joi.string(),
        sanitizer: (value) => validator.trim(value),
        defaultValidation: { requireOptions: true }
      },

      checkbox: {
        baseSchema: Joi.boolean(),
        sanitizer: (value) => Boolean(value),
        defaultValidation: {}
      },

      textarea: {
        baseSchema: Joi.string(),
        sanitizer: (value) => validator.escape(validator.trim(value)),
        defaultValidation: { minLength: 0, maxLength: 1000 }
      },

      file: {
        baseSchema: Joi.object({
          filename: Joi.string().required(),
          mimetype: Joi.string().required(),
          size: Joi.number().required()
        }),
        sanitizer: (value) => value,
        defaultValidation: { maxSize: '10MB', allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'] }
      }
    };
  }

  /**
   * Initialize validation rules
   */
  initializeValidationRules() {
    return {
      // Common validation patterns
      patterns: {
        mexicanPhone: /^\+52-\d{2}-\d{4}-\d{4}$/,
        mexicanZip: /^\d{5}$/,
        bloodPressure: /^\d{2,3}\/\d{2,3}$/,
        medicalId: /^[A-Z0-9\-]+$/,
        patientName: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },

      // Healthcare-specific ranges
      ranges: {
        age: { min: 0, max: 120 },
        weight: { min: 1, max: 500 },
        height: { min: 30, max: 250 },
        heartRate: { min: 30, max: 250 },
        bodyTemp: { min: 30, max: 45 },
        bloodSugar: { min: 20, max: 600 },
        severity: { min: 1, max: 10 },
        likert: { min: 1, max: 5 }
      },

      // Required field combinations
      requiredCombinations: {
        patientBasic: ['firstName', 'lastName', 'dateOfBirth'],
        emergencyContact: ['name', 'phone', 'relationship'],
        assessment: ['patientId', 'scaleId', 'responses'],
        clinicalNote: ['patientId', 'content', 'authorId']
      }
    };
  }

  /**
   * Initialize conditional logic rules
   */
  initializeConditionalLogic() {
    return {
      // Show/hide logic
      showIf: {
        equals: (fieldValue, targetValue) => fieldValue === targetValue,
        notEquals: (fieldValue, targetValue) => fieldValue !== targetValue,
        contains: (fieldValue, targetValue) => 
          Array.isArray(fieldValue) ? fieldValue.includes(targetValue) : false,
        greaterThan: (fieldValue, targetValue) => parseFloat(fieldValue) > parseFloat(targetValue),
        lessThan: (fieldValue, targetValue) => parseFloat(fieldValue) < parseFloat(targetValue),
        range: (fieldValue, min, max) => {
          const num = parseFloat(fieldValue);
          return num >= parseFloat(min) && num <= parseFloat(max);
        }
      },

      // Required logic
      requiredIf: {
        hasValue: (fieldValue) => fieldValue && fieldValue.toString().trim() !== '',
        isEmpty: (fieldValue) => !fieldValue || fieldValue.toString().trim() === '',
        custom: (fieldValue, condition) => condition(fieldValue)
      }
    };
  }

  /**
   * Create dynamic validation schema from form definition
   */
  createFormValidationSchema(formDefinition) {
    const schema = {};
    
    for (const field of formDefinition.fields) {
      const fieldType = this.healthcareFieldTypes[field.type];
      
      if (!fieldType) {
        throw new Error(`Unsupported field type: ${field.type}`);
      }

      let fieldSchema = fieldType.baseSchema;

      // Apply field-specific validation rules
      if (field.validation) {
        fieldSchema = this.applyValidationRules(fieldSchema, field.validation, field.type);
      }

      // Apply default validation for field type
      fieldSchema = this.applyValidationRules(fieldSchema, fieldType.defaultValidation, field.type);

      // Handle required fields
      if (field.required) {
        fieldSchema = fieldSchema.required();
      } else {
        fieldSchema = fieldSchema.optional();
      }

      // Handle select/radio options
      if (field.options && ['select', 'radio', 'multiselect'].includes(field.type)) {
        const validValues = field.options.map(opt => opt.value);
        
        if (field.type === 'multiselect') {
          fieldSchema = fieldSchema.items(Joi.string().valid(...validValues));
        } else {
          fieldSchema = fieldSchema.valid(...validValues);
        }
      }

      schema[field.name] = fieldSchema;
    }

    return Joi.object(schema);
  }

  /**
   * Apply validation rules to schema
   */
  applyValidationRules(schema, rules, fieldType) {
    if (!rules) return schema;

    // String length validation
    if (rules.minLength !== undefined) {
      schema = schema.min(rules.minLength);
    }
    if (rules.maxLength !== undefined) {
      schema = schema.max(rules.maxLength);
    }

    // Number range validation
    if (rules.min !== undefined && schema._type === 'number') {
      schema = schema.min(rules.min);
    }
    if (rules.max !== undefined && schema._type === 'number') {
      schema = schema.max(rules.max);
    }

    // Date range validation
    if (rules.minDate && schema._type === 'date') {
      schema = schema.min(rules.minDate === 'now' ? 'now' : new Date(rules.minDate));
    }
    if (rules.maxDate && schema._type === 'date') {
      schema = schema.max(rules.maxDate === 'now' ? 'now' : new Date(rules.maxDate));
    }

    // Pattern validation
    if (rules.pattern) {
      schema = schema.pattern(new RegExp(rules.pattern));
    }

    // Custom healthcare validations
    if (rules.format) {
      const pattern = this.validationRules.patterns[rules.format];
      if (pattern) {
        schema = schema.pattern(pattern);
      }
    }

    // Array validation
    if (rules.minItems !== undefined && schema._type === 'array') {
      schema = schema.min(rules.minItems);
    }
    if (rules.maxItems !== undefined && schema._type === 'array') {
      schema = schema.max(rules.maxItems);
    }

    return schema;
  }

  /**
   * Validate form submission
   */
  async validateFormSubmission(formDefinition, submissionData, options = {}) {
    try {
      // Create validation schema
      const schema = this.createFormValidationSchema(formDefinition);
      
      // Sanitize data
      const sanitizedData = this.sanitizeFormData(formDefinition, submissionData);
      
      // Apply conditional logic
      const processedData = this.applyConditionalLogic(formDefinition, sanitizedData);
      
      // Validate with schema
      const { error, value } = schema.validate(processedData, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          code: detail.type,
          value: detail.context?.value
        }));

        return {
          isValid: false,
          errors: validationErrors,
          data: null
        };
      }

      // Check healthcare-specific validations
      const healthcareValidation = this.validateHealthcareSpecificRules(formDefinition, value);
      
      if (!healthcareValidation.isValid) {
        return healthcareValidation;
      }

      return {
        isValid: true,
        errors: null,
        data: value,
        metadata: {
          formId: formDefinition.id,
          submissionTime: new Date().toISOString(),
          fieldCount: formDefinition.fields.length,
          dataClassification: this.classifyFormData(formDefinition, value)
        }
      };
    } catch (error) {
      throw new Error(`Form validation failed: ${error.message}`);
    }
  }

  /**
   * Sanitize form data based on field types
   */
  sanitizeFormData(formDefinition, data) {
    const sanitized = {};
    
    for (const field of formDefinition.fields) {
      const fieldType = this.healthcareFieldTypes[field.type];
      const value = data[field.name];
      
      if (value !== undefined && value !== null && fieldType?.sanitizer) {
        try {
          sanitized[field.name] = fieldType.sanitizer(value);
        } catch (error) {
          // If sanitization fails, use original value
          sanitized[field.name] = value;
        }
      } else {
        sanitized[field.name] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Apply conditional logic to form data
   */
  applyConditionalLogic(formDefinition, data) {
    const processed = { ...data };
    
    for (const field of formDefinition.fields) {
      // Skip fields that don't have conditional logic
      if (!field.conditionalLogic) continue;
      
      const { showIf, requiredIf } = field.conditionalLogic;
      
      // Check show/hide conditions
      if (showIf) {
        const shouldShow = this.evaluateCondition(showIf, data);
        if (!shouldShow) {
          delete processed[field.name];
        }
      }
      
      // Check required conditions
      if (requiredIf) {
        const shouldBeRequired = this.evaluateCondition(requiredIf, data);
        if (shouldBeRequired && (!processed[field.name] || processed[field.name].toString().trim() === '')) {
          // Field should be required but is empty - will be caught by validation
        }
      }
    }
    
    return processed;
  }

  /**
   * Evaluate conditional logic condition
   */
  evaluateCondition(condition, data) {
    const { field, operator, value } = condition;
    const fieldValue = data[field];
    
    const logicFunction = this.conditionalLogic.showIf[operator];
    if (!logicFunction) {
      return true; // Default to showing field if operator not found
    }
    
    return logicFunction(fieldValue, value);
  }

  /**
   * Validate healthcare-specific rules
   */
  validateHealthcareSpecificRules(formDefinition, data) {
    const errors = [];
    
    // Check required field combinations
    for (const field of formDefinition.fields) {
      if (field.healthcareRules) {
        const rules = field.healthcareRules;
        
        // Age validation for minors
        if (rules.requireGuardianConsent && data.dateOfBirth) {
          const age = this.calculateAge(new Date(data.dateOfBirth));
          if (age < 18 && !data.guardianConsent) {
            errors.push({
              field: 'guardianConsent',
              message: 'Guardian consent is required for patients under 18',
              code: 'MINOR_CONSENT_REQUIRED'
            });
          }
        }
        
        // Emergency contact validation
        if (rules.requireEmergencyContact && (!data.emergencyContactName || !data.emergencyContactPhone)) {
          errors.push({
            field: 'emergencyContact',
            message: 'Emergency contact information is required',
            code: 'EMERGENCY_CONTACT_REQUIRED'
          });
        }
        
        // Medical ID validation
        if (rules.validateMedicalId && data.medicalId) {
          if (!this.validateMedicalId(data.medicalId)) {
            errors.push({
              field: 'medicalId',
              message: 'Invalid medical ID format',
              code: 'INVALID_MEDICAL_ID'
            });
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        data: null
      };
    }
    
    return {
      isValid: true,
      errors: null,
      data
    };
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate medical ID format
   */
  validateMedicalId(medicalId) {
    // Basic medical ID validation - can be extended based on specific requirements
    return /^[A-Z0-9\-]{5,20}$/.test(medicalId);
  }

  /**
   * Classify form data for compliance
   */
  classifyFormData(formDefinition, data) {
    const phiFields = [];
    const clinicalFields = [];
    const administrativeFields = [];
    
    for (const field of formDefinition.fields) {
      const fieldName = field.name;
      
      // Check if field contains PHI
      if (this.isPHIField(fieldName, field.type)) {
        phiFields.push(fieldName);
      }
      // Check if field contains clinical data
      else if (this.isClinicalField(fieldName, field.type)) {
        clinicalFields.push(fieldName);
      }
      // Everything else is administrative
      else {
        administrativeFields.push(fieldName);
      }
    }
    
    return {
      phi: phiFields,
      clinical: clinicalFields,
      administrative: administrativeFields,
      overallClassification: phiFields.length > 0 ? 'PHI' : 
                           clinicalFields.length > 0 ? 'Clinical' : 'Administrative'
    };
  }

  /**
   * Check if field contains PHI data
   */
  isPHIField(fieldName, fieldType) {
    const phiFieldNames = [
      'firstName', 'lastName', 'fullName', 'name',
      'email', 'phone', 'address', 'dateOfBirth',
      'medicalRecordNumber', 'socialSecurity', 'nationalId'
    ];
    
    const phiFieldTypes = ['patientName', 'email', 'phone', 'medicalId'];
    
    return phiFieldNames.some(phi => fieldName.toLowerCase().includes(phi.toLowerCase())) ||
           phiFieldTypes.includes(fieldType);
  }

  /**
   * Check if field contains clinical data
   */
  isClinicalField(fieldName, fieldType) {
    const clinicalFieldNames = [
      'symptoms', 'diagnosis', 'treatment', 'medication',
      'assessment', 'clinical', 'medical', 'health'
    ];
    
    const clinicalFieldTypes = [
      'clinicalNotes', 'medication', 'symptomSeverity', 
      'likertScale', 'bloodPressure', 'weight', 'height'
    ];
    
    return clinicalFieldNames.some(clinical => fieldName.toLowerCase().includes(clinical.toLowerCase())) ||
           clinicalFieldTypes.includes(fieldType);
  }

  /**
   * Express middleware for dynamic form validation
   */
  validateDynamicForm(formDefinition) {
    return async (req, res, next) => {
      try {
        const result = await this.validateFormSubmission(formDefinition, req.body, {
          userId: req.user?.id,
          userRole: req.user?.role
        });

        if (!result.isValid) {
          return res.status(422).json({
            error: {
              code: 'FORM_VALIDATION_ERROR',
              message: 'Form submission validation failed',
              details: result.errors,
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.validatedFormData = result.data;
        req.formMetadata = result.metadata;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = new FormValidators();