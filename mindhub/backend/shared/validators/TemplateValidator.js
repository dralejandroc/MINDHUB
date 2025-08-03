/**
 * ClinimetrixPro Template Validator
 * 
 * Validates JSON templates against the ClinimetrixPro schema
 * to ensure data integrity and consistency.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

class TemplateValidator {
  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false
    });
    
    // Add format support
    addFormats(this.ajv);
    
    // Load and compile schema
    this.loadSchema();
  }

  /**
   * Load the JSON schema from file
   */
  loadSchema() {
    try {
      const schemaPath = path.join(__dirname, 'clinimetrix-template-schema.json');
      const schemaData = fs.readFileSync(schemaPath, 'utf8');
      this.schema = JSON.parse(schemaData);
      this.validate = this.ajv.compile(this.schema);
      
      console.log('✅ ClinimetrixPro template schema loaded successfully');
    } catch (error) {
      console.error('❌ Error loading template schema:', error.message);
      throw new Error('Failed to load template validation schema');
    }
  }

  /**
   * Validate a template against the schema
   * @param {Object} template - Template object to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateTemplate(template) {
    try {
      const isValid = this.validate(template);
      
      const result = {
        isValid,
        errors: [],
        warnings: [],
        summary: {
          totalErrors: 0,
          totalWarnings: 0,
          criticalErrors: 0
        }
      };

      if (!isValid) {
        result.errors = this.formatErrors(this.validate.errors);
        result.summary.totalErrors = result.errors.length;
        result.summary.criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
      }

      // Additional business logic validations
      this.performBusinessValidations(template, result);
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'template',
          message: `Validation error: ${error.message}`,
          severity: 'critical',
          code: 'VALIDATION_ERROR'
        }],
        warnings: [],
        summary: {
          totalErrors: 1,
          totalWarnings: 0,
          criticalErrors: 1
        }
      };
    }
  }

  /**
   * Format AJV validation errors into user-friendly format
   * @param {Array} ajvErrors - AJV validation errors
   * @returns {Array} Formatted errors
   */
  formatErrors(ajvErrors) {
    return ajvErrors.map(error => {
      const field = error.instancePath.replace(/^\//, '').replace(/\//g, '.');
      
      let severity = 'error';
      if (this.isCriticalField(field)) {
        severity = 'critical';
      }

      let message = error.message;
      if (error.keyword === 'required') {
        message = `Missing required field: ${error.params.missingProperty}`;
      } else if (error.keyword === 'pattern') {
        message = `Invalid format for field ${field}: ${error.message}`;
      } else if (error.keyword === 'enum') {
        message = `Invalid value for ${field}. Allowed values: ${error.params.allowedValues?.join(', ')}`;
      }

      return {
        field: field || 'root',
        message,
        value: error.data,
        severity,
        code: error.keyword?.toUpperCase() || 'VALIDATION_ERROR',
        allowedValues: error.params?.allowedValues,
        path: error.instancePath
      };
    });
  }

  /**
   * Perform additional business logic validations
   * @param {Object} template - Template to validate
   * @param {Object} result - Validation result to update
   */
  performBusinessValidations(template, result) {
    // Validate score range consistency
    this.validateScoreRanges(template, result);
    
    // Validate interpretation rules coverage
    this.validateInterpretationCoverage(template, result);
    
    // Validate subscale consistency
    this.validateSubscaleConsistency(template, result);
    
    // Validate response groups usage
    this.validateResponseGroupsUsage(template, result);
  }

  /**
   * Validate score ranges are logical
   */
  validateScoreRanges(template, result) {
    if (!template.scoring?.scoreRange) return;

    const { min, max } = template.scoring.scoreRange;
    
    if (min >= max) {
      result.errors.push({
        field: 'scoring.scoreRange',
        message: 'Score range minimum must be less than maximum',
        severity: 'critical',
        code: 'INVALID_RANGE'
      });
    }

    if (min < 0) {
      result.warnings.push({
        field: 'scoring.scoreRange.min',
        message: 'Negative minimum scores are unusual for clinical scales',
        severity: 'warning',
        code: 'UNUSUAL_RANGE'
      });
    }

    // Validate subscale ranges
    if (template.scoring.subscaleRanges) {
      Object.entries(template.scoring.subscaleRanges).forEach(([subscale, range]) => {
        if (range.min >= range.max) {
          result.errors.push({
            field: `scoring.subscaleRanges.${subscale}`,
            message: `Subscale ${subscale} range minimum must be less than maximum`,
            severity: 'error',
            code: 'INVALID_SUBSCALE_RANGE'
          });
        }
      });
    }
  }

  /**
   * Validate interpretation rules cover the full score range
   */
  validateInterpretationCoverage(template, result) {
    if (!template.interpretation?.rules || !template.scoring?.scoreRange) return;

    const { min, max } = template.scoring.scoreRange;
    const rules = template.interpretation.rules;

    // Check for gaps in coverage
    const sortedRules = rules.sort((a, b) => a.minScore - b.minScore);
    
    // Check if first rule starts at minimum score
    if (sortedRules[0]?.minScore > min) {
      result.warnings.push({
        field: 'interpretation.rules',
        message: `Gap in interpretation coverage: scores ${min} to ${sortedRules[0].minScore - 1} not covered`,
        severity: 'warning',
        code: 'INTERPRETATION_GAP'
      });
    }

    // Check if last rule ends at maximum score
    const lastRule = sortedRules[sortedRules.length - 1];
    if (lastRule?.maxScore < max) {
      result.warnings.push({
        field: 'interpretation.rules',
        message: `Gap in interpretation coverage: scores ${lastRule.maxScore + 1} to ${max} not covered`,
        severity: 'warning',
        code: 'INTERPRETATION_GAP'
      });
    }

    // Check for overlaps
    for (let i = 0; i < sortedRules.length - 1; i++) {
      const current = sortedRules[i];
      const next = sortedRules[i + 1];
      
      if (current.maxScore >= next.minScore) {
        result.errors.push({
          field: 'interpretation.rules',
          message: `Interpretation rules overlap: rule ${current.id} (${current.maxScore}) overlaps with ${next.id} (${next.minScore})`,
          severity: 'error',
          code: 'INTERPRETATION_OVERLAP'
        });
      }
    }
  }

  /**
   * Validate subscale consistency
   */
  validateSubscaleConsistency(template, result) {
    const hasSubscales = template.structure?.hasSubscales;
    const subscaleCount = template.structure?.subscaleCount || 0;
    const subscaleRanges = template.scoring?.subscaleRanges;

    if (hasSubscales && subscaleCount === 0) {
      result.errors.push({
        field: 'structure.subscaleCount',
        message: 'hasSubscales is true but subscaleCount is 0',
        severity: 'error',
        code: 'SUBSCALE_INCONSISTENCY'
      });
    }

    if (!hasSubscales && subscaleCount > 0) {
      result.warnings.push({
        field: 'structure.hasSubscales',
        message: 'hasSubscales is false but subscaleCount is greater than 0',
        severity: 'warning',
        code: 'SUBSCALE_INCONSISTENCY'
      });
    }

    if (hasSubscales && subscaleRanges) {
      const rangeCount = Object.keys(subscaleRanges).length;
      if (rangeCount !== subscaleCount) {
        result.warnings.push({
          field: 'scoring.subscaleRanges',
          message: `subscaleCount (${subscaleCount}) doesn't match number of subscale ranges (${rangeCount})`,
          severity: 'warning',
          code: 'SUBSCALE_COUNT_MISMATCH'
        });
      }
    }
  }

  /**
   * Validate response groups are used and complete
   */
  validateResponseGroupsUsage(template, result) {
    if (!template.responseGroups) return;

    Object.entries(template.responseGroups).forEach(([groupName, options]) => {
      if (!Array.isArray(options) || options.length === 0) {
        result.errors.push({
          field: `responseGroups.${groupName}`,
          message: `Response group ${groupName} is empty or invalid`,
          severity: 'error',
          code: 'EMPTY_RESPONSE_GROUP'
        });
        return;
      }

      // Check for duplicate values within group
      const values = options.map(opt => opt.value);
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        result.errors.push({
          field: `responseGroups.${groupName}`,
          message: `Response group ${groupName} contains duplicate values`,
          severity: 'error',
          code: 'DUPLICATE_RESPONSE_VALUES'
        });
      }

      // Check for duplicate scores
      const scores = options.map(opt => opt.score);
      const uniqueScores = new Set(scores);
      if (scores.length !== uniqueScores.size) {
        result.warnings.push({
          field: `responseGroups.${groupName}`,
          message: `Response group ${groupName} contains duplicate scores (may be intentional)`,
          severity: 'warning',
          code: 'DUPLICATE_RESPONSE_SCORES'
        });
      }
    });
  }

  /**
   * Check if a field is critical for template functionality
   */
  isCriticalField(field) {
    const criticalFields = [
      'metadata.id',
      'metadata.name',
      'metadata.abbreviation',
      'structure.totalItems',
      'scoring.scoreRange',
      'interpretation.rules',
      'responseGroups'
    ];
    
    return criticalFields.some(critical => field.startsWith(critical));
  }

  /**
   * Validate multiple templates
   * @param {Array} templates - Array of templates to validate
   * @returns {Object} Combined validation results
   */
  validateTemplates(templates) {
    const results = {
      totalTemplates: templates.length,
      validTemplates: 0,
      invalidTemplates: 0,
      templates: {},
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        criticalErrors: 0
      }
    };

    templates.forEach(template => {
      const templateId = template.metadata?.id || 'unknown';
      const validation = this.validateTemplate(template);
      
      results.templates[templateId] = validation;
      
      if (validation.isValid) {
        results.validTemplates++;
      } else {
        results.invalidTemplates++;
      }
      
      results.summary.totalErrors += validation.summary.totalErrors;
      results.summary.totalWarnings += validation.summary.totalWarnings;
      results.summary.criticalErrors += validation.summary.criticalErrors;
    });

    return results;
  }

  /**
   * Get validation summary for a template
   * @param {Object} template - Template to summarize
   * @returns {Object} Validation summary
   */
  getValidationSummary(template) {
    const validation = this.validateTemplate(template);
    
    return {
      templateId: template.metadata?.id || 'unknown',
      templateName: template.metadata?.name || 'Unknown',
      isValid: validation.isValid,
      errorCount: validation.summary.totalErrors,
      warningCount: validation.summary.totalWarnings,
      criticalErrorCount: validation.summary.criticalErrors,
      validationScore: this.calculateValidationScore(validation),
      recommendations: this.generateRecommendations(validation)
    };
  }

  /**
   * Calculate a validation score (0-100)
   */
  calculateValidationScore(validation) {
    const { totalErrors, totalWarnings, criticalErrors } = validation.summary;
    
    let score = 100;
    score -= criticalErrors * 25; // Critical errors are severe
    score -= totalErrors * 10;    // Regular errors
    score -= totalWarnings * 2;   // Warnings are minor
    
    return Math.max(0, score);
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(validation) {
    const recommendations = [];
    
    if (validation.summary.criticalErrors > 0) {
      recommendations.push('🔴 Fix critical errors before deployment');
    }
    
    if (validation.summary.totalErrors > 0) {
      recommendations.push('🟡 Resolve validation errors for better reliability');
    }
    
    if (validation.summary.totalWarnings > 5) {
      recommendations.push('⚠️ Consider addressing warnings for optimal quality');
    }
    
    if (validation.isValid && validation.summary.totalWarnings === 0) {
      recommendations.push('✅ Template meets all validation criteria');
    }
    
    return recommendations;
  }
}

module.exports = TemplateValidator;