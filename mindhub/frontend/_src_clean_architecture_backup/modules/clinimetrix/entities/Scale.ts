/**
 * Scale Entity
 * Core business logic for psychometric scales - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type ScaleFieldType = 
  | 'likert' 
  | 'yes_no' 
  | 'multiple_choice' 
  | 'rating' 
  | 'slider' 
  | 'boolean'
  | 'numeric'
  | 'text';

export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'severe' | 'very_severe';

export interface ScaleResponseOption {
  value: number;
  label: string;
  score: number;
}

export interface ScaleValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

export class ScaleItem {
  constructor(
    public readonly number: number,
    public readonly text: string,
    public readonly responseType: ScaleFieldType,
    public readonly options: ScaleResponseOption[] = [],
    public readonly instruction?: string,
    public readonly subscale?: string,
    public readonly reversed: boolean = false,
    public readonly required: boolean = true,
    public readonly validation?: ScaleValidationRule,
    public readonly isActive: boolean = true
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate scale item configuration
   */
  private validate(): void {
    // Business rule: Item number must be positive
    if (this.number <= 0) {
      throw new Error('Scale item number must be positive');
    }

    // Business rule: Item text is mandatory
    if (!this.text.trim()) {
      throw new Error('Scale item text is required');
    }

    // Business rule: Multiple choice and likert items must have options
    if (['multiple_choice', 'likert', 'rating'].includes(this.responseType)) {
      if (this.options.length === 0) {
        throw new Error('Multiple choice and likert items must have response options');
      }

      // Business rule: Options must have valid scores
      this.options.forEach((option, index) => {
        if (typeof option.score !== 'number' || option.score < 0) {
          throw new Error(`Option ${index + 1} must have a valid non-negative score`);
        }
        if (!option.label.trim()) {
          throw new Error(`Option ${index + 1} must have a label`);
        }
      });
    }

    // Business rule: Numeric validation must be consistent
    if (this.validation?.min !== undefined && this.validation?.max !== undefined) {
      if (this.validation.min >= this.validation.max) {
        throw new Error('Validation minimum must be less than maximum');
      }
    }
  }

  /**
   * Business logic: Get the score for a given response
   */
  getScoreForResponse(response: any): number {
    switch (this.responseType) {
      case 'likert':
      case 'rating':
      case 'multiple_choice':
        const option = this.options.find(opt => opt.value === response);
        if (!option) {
          throw new Error(`Invalid response value: ${response}`);
        }
        return this.reversed ? this.getReverseScore(option.score) : option.score;

      case 'yes_no':
      case 'boolean':
        const booleanValue = Boolean(response);
        const score = booleanValue ? 1 : 0;
        return this.reversed ? (1 - score) : score;

      case 'numeric':
      case 'slider':
        const numericValue = Number(response);
        if (isNaN(numericValue)) {
          throw new Error(`Invalid numeric response: ${response}`);
        }
        return this.reversed ? this.getReverseScore(numericValue) : numericValue;

      default:
        return 0;
    }
  }

  /**
   * Business logic: Calculate reverse score
   */
  private getReverseScore(originalScore: number): number {
    if (this.options.length > 0) {
      const maxScore = Math.max(...this.options.map(opt => opt.score));
      const minScore = Math.min(...this.options.map(opt => opt.score));
      return maxScore + minScore - originalScore;
    }
    
    // For numeric/slider items, assume scale from validation or 0-10
    const max = this.validation?.max || 10;
    const min = this.validation?.min || 0;
    return max + min - originalScore;
  }

  /**
   * Business logic: Validate response
   */
  validateResponse(response: any): string[] {
    const errors: string[] = [];

    // Check if required
    if (this.required && (response === null || response === undefined || response === '')) {
      errors.push(`Item ${this.number} is required`);
      return errors;
    }

    // Skip validation if not required and empty
    if (!this.required && (response === null || response === undefined || response === '')) {
      return errors;
    }

    // Type-specific validation
    switch (this.responseType) {
      case 'likert':
      case 'rating':
      case 'multiple_choice':
        if (!this.options.find(opt => opt.value === response)) {
          errors.push(`Item ${this.number}: Invalid option selected`);
        }
        break;

      case 'numeric':
      case 'slider':
        const numValue = Number(response);
        if (isNaN(numValue)) {
          errors.push(`Item ${this.number}: Must be a valid number`);
        } else {
          if (this.validation?.min !== undefined && numValue < this.validation.min) {
            errors.push(`Item ${this.number}: Value must be at least ${this.validation.min}`);
          }
          if (this.validation?.max !== undefined && numValue > this.validation.max) {
            errors.push(`Item ${this.number}: Value must be at most ${this.validation.max}`);
          }
        }
        break;

      case 'text':
        if (this.validation?.pattern) {
          const regex = new RegExp(this.validation.pattern);
          if (!regex.test(String(response))) {
            errors.push(`Item ${this.number}: Invalid format`);
          }
        }
        break;
    }

    return errors;
  }
}

export interface ScoreRange {
  min: number;
  max: number;
}

export interface Subscale {
  id: string;
  name: string;
  description: string;
  items: number[];
  scoreRange: ScoreRange;
  interpretationRules?: InterpretationRule[];
}

export interface InterpretationRule {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  severity: SeverityLevel;
  color: string;
  description: string;
  clinicalSignificance: string;
  recommendations: string[];
}

export type ScaleCategory = 
  | 'Depresión'
  | 'Ansiedad' 
  | 'Esquizofrenia y Trastornos Psicóticos'
  | 'Trastornos del Sueño'
  | 'Autismo/TEA'
  | 'Trastornos Alimentarios'
  | 'Cognición'
  | 'TOC'
  | 'Psicosis'
  | 'Tics'
  | 'Personalidad'
  | 'Trauma'
  | 'Suicidalidad'
  | 'General';

export type AdministrationMode = 'professional' | 'self_administered' | 'hybrid';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export class Scale {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly abbreviation: string,
    public readonly description: string,
    public readonly items: ScaleItem[],
    public readonly category: ScaleCategory,
    public readonly targetPopulation: string,
    public readonly administrationTime: string, // e.g., "5-10 min"
    public readonly professionalLevel: string[],
    public readonly administrationMode: AdministrationMode,
    public readonly difficulty: DifficultyLevel,
    public readonly scoreRange: ScoreRange,
    public readonly subscales: Subscale[] = [],
    public readonly interpretationRules: InterpretationRule[] = [],
    public readonly reverseScored: number[] = [],
    public readonly authors: string[] = [],
    public readonly year: number,
    public readonly language: string = 'es',
    public readonly version: string = '1.0',
    public readonly keywords: string[] = [],
    public readonly isActive: boolean = true,
    public readonly isFeatured: boolean = false,
    public readonly isPublic: boolean = true,
    public readonly popularity: number = 0,
    public readonly reliability?: Record<string, number>,
    public readonly validity?: Record<string, number>,
    public readonly norms?: Record<string, any>,
    public readonly references: string[] = [],
    public readonly clinicalNotes: string[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate scale configuration
   */
  private validate(): void {
    // Business rule: Scale must have unique ID
    if (!this.id.trim()) {
      throw new Error('Scale ID is required');
    }

    // Business rule: Scale must have name
    if (!this.name.trim()) {
      throw new Error('Scale name is required');
    }

    // Business rule: Scale must have abbreviation
    if (!this.abbreviation.trim()) {
      throw new Error('Scale abbreviation is required');
    }

    // Business rule: Scale must have items
    if (this.items.length === 0) {
      throw new Error('Scale must have at least one item');
    }

    // Business rule: Item numbers must be unique and sequential
    const itemNumbers = this.items.map(item => item.number).sort((a, b) => a - b);
    const expectedNumbers = Array.from({ length: itemNumbers.length }, (_, i) => i + 1);
    
    if (!this.arraysEqual(itemNumbers, expectedNumbers)) {
      throw new Error('Scale items must have sequential numbers starting from 1');
    }

    // Business rule: Score range must be valid
    if (this.scoreRange.min >= this.scoreRange.max) {
      throw new Error('Score range minimum must be less than maximum');
    }

    // Business rule: Year must be reasonable
    if (this.year < 1900 || this.year > new Date().getFullYear() + 5) {
      throw new Error('Publication year must be between 1900 and current year + 5');
    }

    // Business rule: Validate subscales
    this.subscales.forEach(subscale => {
      // Check that subscale items exist in scale
      subscale.items.forEach(itemNumber => {
        if (!this.items.find(item => item.number === itemNumber)) {
          throw new Error(`Subscale "${subscale.name}" references non-existent item ${itemNumber}`);
        }
      });

      // Check subscale score range is within scale range
      if (subscale.scoreRange.min < this.scoreRange.min || subscale.scoreRange.max > this.scoreRange.max) {
        throw new Error(`Subscale "${subscale.name}" score range must be within scale range`);
      }
    });

    // Business rule: Validate interpretation rules
    this.interpretationRules.forEach((rule, index) => {
      if (rule.minScore > rule.maxScore) {
        throw new Error(`Interpretation rule ${index + 1}: minimum score cannot be greater than maximum`);
      }
      if (rule.minScore < this.scoreRange.min || rule.maxScore > this.scoreRange.max) {
        throw new Error(`Interpretation rule ${index + 1}: scores must be within scale range`);
      }
    });

    // Business rule: Reverse scored items must exist
    this.reverseScored.forEach(itemNumber => {
      if (!this.items.find(item => item.number === itemNumber)) {
        throw new Error(`Reverse scored item ${itemNumber} does not exist in scale`);
      }
    });
  }

  /**
   * Business logic: Calculate total score from responses
   */
  calculateScore(responses: Record<string, any>): {
    totalScore: number;
    subscaleScores: Record<string, number>;
    completionPercentage: number;
    validResponses: number;
  } {
    let totalScore = 0;
    let validResponses = 0;
    const subscaleScores: Record<string, number> = {};

    // Calculate total score
    this.items.forEach(item => {
      const response = responses[item.number];
      if (response !== null && response !== undefined && response !== '') {
        try {
          const itemScore = item.getScoreForResponse(response);
          totalScore += itemScore;
          validResponses++;
        } catch (error) {
          // Invalid response, skip
          console.warn(`Invalid response for item ${item.number}: ${error}`);
        }
      }
    });

    // Calculate subscale scores
    this.subscales.forEach(subscale => {
      let subscaleTotal = 0;
      let subscaleValid = 0;

      subscale.items.forEach(itemNumber => {
        const item = this.items.find(i => i.number === itemNumber);
        const response = responses[itemNumber];
        
        if (item && response !== null && response !== undefined && response !== '') {
          try {
            subscaleTotal += item.getScoreForResponse(response);
            subscaleValid++;
          } catch (error) {
            // Invalid response, skip
          }
        }
      });

      subscaleScores[subscale.id] = subscaleTotal;
    });

    const completionPercentage = Math.round((validResponses / this.items.length) * 100);

    return {
      totalScore,
      subscaleScores,
      completionPercentage,
      validResponses
    };
  }

  /**
   * Business logic: Validate all responses
   */
  validateResponses(responses: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.items.forEach(item => {
      const response = responses[item.number];
      const itemErrors = item.validateResponse(response);
      errors.push(...itemErrors);
    });

    // Check completion percentage
    const { completionPercentage } = this.calculateScore(responses);
    if (completionPercentage < 100) {
      warnings.push(`Scale is ${completionPercentage}% complete. Some items may be missing.`);
    }

    // Check for response patterns that might indicate validity issues
    const responseValues = Object.values(responses).filter(v => v !== null && v !== undefined);
    if (responseValues.length > 0) {
      const uniqueValues = new Set(responseValues);
      if (uniqueValues.size === 1 && responseValues.length > 3) {
        warnings.push('All responses are identical. This may indicate response bias.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Business logic: Get interpretation for a score
   */
  getInterpretation(totalScore: number): InterpretationRule | null {
    return this.interpretationRules.find(rule => 
      totalScore >= rule.minScore && totalScore <= rule.maxScore
    ) || null;
  }

  /**
   * Business logic: Get subscale interpretation
   */
  getSubscaleInterpretation(subscaleId: string, score: number): InterpretationRule | null {
    const subscale = this.subscales.find(sub => sub.id === subscaleId);
    if (!subscale || !subscale.interpretationRules) {
      return null;
    }

    return subscale.interpretationRules.find(rule =>
      score >= rule.minScore && score <= rule.maxScore
    ) || null;
  }

  /**
   * Business logic: Check if scale is appropriate for demographic
   */
  isAppropriateForDemographic(demographic: {
    age?: number;
    population?: string;
    setting?: string;
  }): {
    appropriate: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let appropriate = true;

    // Check age appropriateness based on target population
    if (demographic.age !== undefined) {
      const targetLower = this.targetPopulation.toLowerCase();
      
      if (targetLower.includes('adulto') && demographic.age < 18) {
        appropriate = false;
        reasons.push('Esta escala está diseñada para adultos (18+ años)');
      } else if (targetLower.includes('adolescent') && (demographic.age < 12 || demographic.age > 18)) {
        appropriate = false;
        reasons.push('Esta escala está diseñada para adolescentes (12-18 años)');
      } else if (targetLower.includes('niño') && demographic.age > 12) {
        appropriate = false;
        reasons.push('Esta escala está diseñada para niños (hasta 12 años)');
      } else if (targetLower.includes('geriátric') && demographic.age < 65) {
        appropriate = false;
        reasons.push('Esta escala está diseñada para población geriátrica (65+ años)');
      }
    }

    // Check population match
    if (demographic.population && this.targetPopulation) {
      const populationMatch = this.targetPopulation.toLowerCase()
        .includes(demographic.population.toLowerCase());
      
      if (!populationMatch) {
        reasons.push(`Esta escala está diseñada para: ${this.targetPopulation}`);
      }
    }

    if (appropriate && reasons.length === 0) {
      reasons.push('Esta escala es apropiada para el perfil demográfico');
    }

    return { appropriate, reasons };
  }

  /**
   * Business logic: Get estimated administration time in minutes
   */
  getEstimatedTimeMinutes(): { min: number; max: number } {
    // Parse administration time string (e.g., "5-10 min", "15 min")
    const timeMatch = this.administrationTime.match(/(\d+)(?:-(\d+))?\s*min/);
    
    if (timeMatch) {
      const min = parseInt(timeMatch[1]);
      const max = timeMatch[2] ? parseInt(timeMatch[2]) : min;
      return { min, max };
    }

    // Fallback: estimate based on number of items
    const estimatedMin = Math.ceil(this.items.length / 4); // 4 items per minute
    const estimatedMax = Math.ceil(this.items.length / 2); // 2 items per minute
    
    return { min: estimatedMin, max: estimatedMax };
  }

  /**
   * Business logic: Check if scale requires professional administration
   */
  requiresProfessionalAdministration(): boolean {
    return this.administrationMode === 'professional' || 
           this.difficulty === 'advanced' ||
           this.professionalLevel.includes('PhD') ||
           this.professionalLevel.includes('Specialist');
  }

  /**
   * Business logic: Get scale complexity score (0-100)
   */
  getComplexityScore(): number {
    let complexity = 0;
    
    // Base complexity from number of items
    complexity += Math.min(this.items.length * 2, 40);
    
    // Add complexity for subscales
    complexity += this.subscales.length * 5;
    
    // Add complexity for reverse scored items
    complexity += this.reverseScored.length * 2;
    
    // Add complexity for different response types
    const responseTypes = new Set(this.items.map(item => item.responseType));
    complexity += responseTypes.size * 3;
    
    // Difficulty level modifier
    switch (this.difficulty) {
      case 'beginner':
        break; // no modifier
      case 'intermediate':
        complexity += 10;
        break;
      case 'advanced':
        complexity += 20;
        break;
    }
    
    return Math.min(complexity, 100);
  }

  // Helper methods
  private arraysEqual(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
}