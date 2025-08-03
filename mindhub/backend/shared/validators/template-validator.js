/**
 * VALIDADOR DE PLANTILLAS CIENTÍFICAS CLINIMETRIXPRO
 * 
 * Utiliza JSON Schema + Ajv para validar plantillas de escalas psicométricas
 * Incluye validaciones adicionales específicas del dominio clínico
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
      strict: false  // Allow additional properties for extensibility
    });
    
    // Add format validators
    addFormats(this.ajv);
    
    // Load the main schema
    this.loadSchema();
    
    // Add custom keywords for domain-specific validation
    this.addCustomKeywords();
  }

  /**
   * Load the JSON Schema from file
   */
  loadSchema() {
    try {
      const schemaPath = path.join(__dirname, '../schemas/template-schema.json');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      throw new Error(`Error loading schema: ${error.message}`);
    }
  }

  /**
   * Add custom validation keywords for clinical domain
   */
  addCustomKeywords() {
    // Custom keyword for validating score ranges
    this.ajv.addKeyword({
      keyword: 'validScoreRange',
      type: 'object',
      schemaType: 'boolean',
      compile: function(schemaVal) {
        return function validate(data) {
          if (!schemaVal) return true;
          
          const { min, max } = data;
          if (typeof min !== 'number' || typeof max !== 'number') {
            validate.errors = [{ message: 'Score range must contain numeric min and max values' }];
            return false;
          }
          
          if (min >= max) {
            validate.errors = [{ message: 'Minimum score must be less than maximum score' }];
            return false;
          }
          
          return true;
        };
      }
    });

    // Custom keyword for validating interpretation rules consistency
    this.ajv.addKeyword({
      keyword: 'validInterpretationRules',
      type: 'array',
      schemaType: 'boolean',
      compile: function(schemaVal) {
        return function validate(rules) {
          if (!schemaVal || !Array.isArray(rules)) return true;
          
          // Sort rules by minScore to check for gaps and overlaps
          const sortedRules = [...rules].sort((a, b) => a.minScore - b.minScore);
          
          for (let i = 0; i < sortedRules.length; i++) {
            const current = sortedRules[i];
            
            // Check if minScore <= maxScore
            if (current.minScore > current.maxScore) {
              validate.errors = [{ 
                message: `Rule ${i + 1}: minScore (${current.minScore}) cannot be greater than maxScore (${current.maxScore})` 
              }];
              return false;
            }
            
            // Check for overlaps with next rule
            if (i < sortedRules.length - 1) {
              const next = sortedRules[i + 1];
              if (current.maxScore >= next.minScore) {
                validate.errors = [{ 
                  message: `Rules ${i + 1} and ${i + 2}: Overlapping score ranges detected` 
                }];
                return false;
              }
            }
          }
          
          return true;
        };
      }
    });

    // Custom keyword for validating item numbers consistency
    this.ajv.addKeyword({
      keyword: 'validItemNumbers',
      type: 'object',
      schemaType: 'boolean',
      compile: function(schemaVal) {
        return function validate(structure) {
          if (!schemaVal) return true;
          
          const { totalItems, sections } = structure;
          const allItemNumbers = new Set();
          
          // Collect all item numbers from all sections
          for (const section of sections) {
            for (const item of section.items) {
              if (allItemNumbers.has(item.number)) {
                validate.errors = [{ 
                  message: `Duplicate item number: ${item.number}` 
                }];
                return false;
              }
              allItemNumbers.add(item.number);
            }
          }
          
          // Check if total matches declared totalItems
          if (allItemNumbers.size !== totalItems) {
            validate.errors = [{ 
              message: `Total items mismatch: declared ${totalItems}, found ${allItemNumbers.size}` 
            }];
            return false;
          }
          
          // Check for sequential numbering (1 to totalItems)
          for (let i = 1; i <= totalItems; i++) {
            if (!allItemNumbers.has(i)) {
              validate.errors = [{ 
                message: `Missing item number: ${i}` 
              }];
              return false;
            }
          }
          
          return true;
        };
      }
    });
  }

  /**
   * Validate a template against the schema
   * @param {Object} template - The template to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  validateTemplate(template) {
    const isValid = this.validate(template);
    
    const result = {
      isValid,
      errors: [],
      warnings: []
    };

    if (!isValid) {
      result.errors = this.validate.errors.map(error => ({
        path: error.instancePath || error.schemaPath,
        message: error.message,
        data: error.data,
        schema: error.schema
      }));
    }

    // Additional domain-specific validations
    const domainValidation = this.performDomainValidation(template);
    result.warnings = domainValidation.warnings;
    
    if (domainValidation.errors.length > 0) {
      result.isValid = false;
      result.errors.push(...domainValidation.errors);
    }

    return result;
  }

  /**
   * Perform additional domain-specific validations
   * @param {Object} template - The template to validate
   * @returns {Object} - Domain validation results
   */
  performDomainValidation(template) {
    const errors = [];
    const warnings = [];

    // Validate scoring consistency
    const scoringValidation = this.validateScoringConsistency(template);
    errors.push(...scoringValidation.errors);
    warnings.push(...scoringValidation.warnings);

    // Validate subscales consistency
    const subscalesValidation = this.validateSubscalesConsistency(template);
    errors.push(...subscalesValidation.errors);
    warnings.push(...subscalesValidation.warnings);

    // Validate response options consistency
    const responseValidation = this.validateResponseOptionsConsistency(template);
    errors.push(...responseValidation.errors);
    warnings.push(...responseValidation.warnings);

    // Validate clinical guidelines
    const clinicalValidation = this.validateClinicalGuidelines(template);
    warnings.push(...clinicalValidation.warnings);

    return { errors, warnings };
  }

  /**
   * Validate scoring consistency
   */
  validateScoringConsistency(template) {
    const errors = [];
    const warnings = [];

    const { scoring, structure } = template;
    
    if (!scoring || !structure) {
      return { errors, warnings };
    }

    // Check if score range matches possible scores from items
    let calculatedMax = 0;
    let calculatedMin = 0;

    for (const section of structure.sections) {
      for (const item of section.items) {
        if (item.responseOptions) {
          const scores = item.responseOptions.map(opt => opt.score || 0);
          calculatedMax += Math.max(...scores);
          calculatedMin += Math.min(...scores);
        }
      }
    }

    if (scoring.scoreRange) {
      if (calculatedMax !== scoring.scoreRange.max) {
        warnings.push({
          type: 'scoring_mismatch',
          message: `Calculated maximum score (${calculatedMax}) differs from declared maximum (${scoring.scoreRange.max})`
        });
      }

      if (calculatedMin !== scoring.scoreRange.min) {
        warnings.push({
          type: 'scoring_mismatch', 
          message: `Calculated minimum score (${calculatedMin}) differs from declared minimum (${scoring.scoreRange.min})`
        });
      }
    }

    // Validate reversed items exist
    if (scoring.reversedItems && scoring.reversedItems.length > 0) {
      const allItemNumbers = new Set();
      structure.sections.forEach(section => {
        section.items.forEach(item => allItemNumbers.add(item.number));
      });

      for (const reversedItem of scoring.reversedItems) {
        if (!allItemNumbers.has(reversedItem)) {
          errors.push({
            type: 'invalid_reversed_item',
            message: `Reversed item ${reversedItem} does not exist in the scale`
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate subscales consistency
   */
  validateSubscalesConsistency(template) {
    const errors = [];
    const warnings = [];

    const { structure } = template;
    
    if (!structure.subscales) {
      return { errors, warnings };
    }

    // Get all item numbers from structure
    const allItemNumbers = new Set();
    structure.sections.forEach(section => {
      section.items.forEach(item => allItemNumbers.add(item.number));
    });

    // Validate each subscale
    for (const subscale of structure.subscales) {
      // Check if all subscale items exist
      for (const itemNumber of subscale.items) {
        if (!allItemNumbers.has(itemNumber)) {
          errors.push({
            type: 'invalid_subscale_item',
            message: `Subscale "${subscale.name}" references non-existent item ${itemNumber}`
          });
        }
      }

      // Check for empty subscales
      if (subscale.items.length === 0) {
        warnings.push({
          type: 'empty_subscale',
          message: `Subscale "${subscale.name}" contains no items`
        });
      }

      // Check for single-item subscales
      if (subscale.items.length === 1) {
        warnings.push({
          type: 'single_item_subscale',
          message: `Subscale "${subscale.name}" contains only one item - consider if this is intentional`
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate response options consistency
   */
  validateResponseOptionsConsistency(template) {
    const errors = [];
    const warnings = [];

    const { structure } = template;

    // Check for items with missing response options
    for (const section of structure.sections) {
      for (const item of section.items) {
        if (!item.responseOptions && !item.responseGroup) {
          warnings.push({
            type: 'missing_response_options',
            message: `Item ${item.number}: No response options defined and no response group specified`
          });
        }

        if (item.responseOptions) {
          // Check for duplicate values
          const values = item.responseOptions.map(opt => opt.value);
          const uniqueValues = new Set(values);
          if (values.length !== uniqueValues.size) {
            errors.push({
              type: 'duplicate_response_values',
              message: `Item ${item.number}: Duplicate response option values detected`
            });
          }

          // Check for missing scores
          const missingScores = item.responseOptions.filter(opt => opt.score === undefined || opt.score === null);
          if (missingScores.length > 0) {
            warnings.push({
              type: 'missing_scores',
              message: `Item ${item.number}: Some response options missing score values`
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate clinical guidelines
   */
  validateClinicalGuidelines(template) {
    const warnings = [];

    const { interpretation } = template;

    if (!interpretation.clinicalGuidelines) {
      warnings.push({
        type: 'missing_clinical_guidelines',
        message: 'No clinical guidelines provided - consider adding professional and patient instructions'
      });
      return { warnings };
    }

    const { clinicalGuidelines } = interpretation;

    if (!clinicalGuidelines.professionalInstructions) {
      warnings.push({
        type: 'missing_professional_instructions',
        message: 'No professional instructions provided'
      });
    }

    if (!clinicalGuidelines.patientInstructions) {
      warnings.push({
        type: 'missing_patient_instructions',
        message: 'No patient instructions provided'
      });
    }

    return { warnings };
  }

  /**
   * Validate multiple templates at once
   * @param {Array} templates - Array of templates to validate
   * @returns {Object} - Batch validation results
   */
  validateBatch(templates) {
    const results = [];
    let totalValid = 0;
    let totalInvalid = 0;

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const result = this.validateTemplate(template);
      
      result.templateIndex = i;
      result.templateId = template.metadata?.id || `template_${i}`;
      
      if (result.isValid) {
        totalValid++;
      } else {
        totalInvalid++;
      }
      
      results.push(result);
    }

    return {
      summary: {
        total: templates.length,
        valid: totalValid,
        invalid: totalInvalid
      },
      results
    };
  }

  /**
   * Get validation report for a template
   * @param {Object} template - The template to analyze
   * @returns {Object} - Detailed validation report
   */
  getValidationReport(template) {
    const validation = this.validateTemplate(template);
    
    const report = {
      templateId: template.metadata?.id || 'unknown',
      templateName: template.metadata?.name || 'Unknown',
      isValid: validation.isValid,
      summary: {
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      },
      details: {
        errors: validation.errors,
        warnings: validation.warnings
      },
      recommendations: this.generateRecommendations(validation)
    };

    return report;
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations(validation) {
    const recommendations = [];

    // High priority recommendations based on errors
    if (validation.errors.length > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Fix all validation errors before using this template in production'
      });
    }

    // Medium priority recommendations based on warnings
    const warningTypes = new Set(validation.warnings.map(w => w.type));
    
    if (warningTypes.has('missing_clinical_guidelines')) {
      recommendations.push({
        priority: 'medium',
        message: 'Add clinical guidelines to improve professional usability'
      });
    }

    if (warningTypes.has('scoring_mismatch')) {
      recommendations.push({
        priority: 'medium',
        message: 'Review scoring calculations for accuracy'
      });
    }

    if (warningTypes.has('single_item_subscale')) {
      recommendations.push({
        priority: 'low',
        message: 'Consider if single-item subscales are scientifically meaningful'
      });
    }

    return recommendations;
  }
}

module.exports = TemplateValidator;