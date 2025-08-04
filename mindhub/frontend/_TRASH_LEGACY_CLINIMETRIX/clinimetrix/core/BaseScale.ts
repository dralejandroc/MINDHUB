/**
 * Base Scale Architecture
 * Universal interface for all clinical scales
 */

import {
  ClinicalScale,
  ScaleItem,
  ResponseType,
  ScoringResult,
  ItemResponse,
  InterpretationResult,
  ScoringMethod,
  ScaleCategory,
  SeverityLevel,
  ClinicalSignificance,
  AdministrationMode,
  TargetPopulation
} from '../../../types/clinimetrix';

// =============================================================================
// ABSTRACT BASE SCALE CLASS
// =============================================================================

export abstract class BaseScale {
  protected config: ClinicalScale;
  protected items: ScaleItem[];
  
  constructor(config: ClinicalScale, items: ScaleItem[]) {
    this.config = config;
    this.items = items;
    this.validateScale();
  }

  // =============================================================================
  // ABSTRACT METHODS - Must be implemented by concrete scales
  // =============================================================================

  /**
   * Calculate raw score based on responses
   */
  abstract calculateRawScore(responses: ItemResponse[]): number;

  /**
   * Calculate scaled/standardized scores
   */
  abstract calculateScaledScore(rawScore: number): {
    scaledScore?: number;
    percentileRank?: number;
    tScore?: number;
    zScore?: number;
  };

  /**
   * Determine clinical interpretation
   */
  abstract getInterpretation(rawScore: number): InterpretationResult;

  /**
   * Validate responses against scale rules
   */
  abstract validateResponses(responses: ItemResponse[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  // =============================================================================
  // CONCRETE METHODS - Common functionality
  // =============================================================================

  /**
   * Get scale configuration
   */
  getConfig(): ClinicalScale {
    return { ...this.config };
  }

  /**
   * Get scale items
   */
  getItems(): ScaleItem[] {
    return [...this.items];
  }

  /**
   * Get specific item by ID
   */
  getItem(itemId: string): ScaleItem | undefined {
    return this.items.find(item => item.id === itemId);
  }

  /**
   * Get items by subscale
   */
  getItemsBySubscale(subscale: string): ScaleItem[] {
    return this.items.filter(item => item.subscale === subscale);
  }

  /**
   * Get unique subscales
   */
  getSubscales(): string[] {
    const subscales = new Set(
      this.items
        .filter(item => item.subscale)
        .map(item => item.subscale!)
    );
    return Array.from(subscales);
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(responses: ItemResponse[]): number {
    const totalRequiredItems = this.items.filter(item => item.required).length;
    const completedItems = responses.filter(
      response => !response.wasSkipped && response.responseValue !== ''
    ).length;
    
    return totalRequiredItems > 0 ? (completedItems / totalRequiredItems) * 100 : 0;
  }

  /**
   * Check if scale is complete
   */
  isComplete(responses: ItemResponse[]): boolean {
    const requiredItems = this.items.filter(item => item.required);
    const completedRequiredItems = responses.filter(response => {
      const item = this.getItem(response.itemId);
      return item?.required && !response.wasSkipped && response.responseValue !== '';
    });
    
    return completedRequiredItems.length === requiredItems.length;
  }

  /**
   * Get missing required items
   */
  getMissingRequiredItems(responses: ItemResponse[]): ScaleItem[] {
    const respondedItemIds = new Set(responses.map(r => r.itemId));
    return this.items.filter(item => 
      item.required && !respondedItemIds.has(item.id)
    );
  }

  /**
   * Calculate subscale scores
   */
  calculateSubscaleScores(responses: ItemResponse[]): Record<string, number> {
    const subscaleScores: Record<string, number> = {};
    const subscales = this.getSubscales();
    
    for (const subscale of subscales) {
      const subscaleItems = this.getItemsBySubscale(subscale);
      const subscaleResponses = responses.filter(response =>
        subscaleItems.some(item => item.id === response.itemId)
      );
      
      subscaleScores[subscale] = this.calculateSubscaleScore(
        subscaleItems,
        subscaleResponses
      );
    }
    
    return subscaleScores;
  }

  /**
   * Calculate individual subscale score
   */
  protected calculateSubscaleScore(
    subscaleItems: ScaleItem[],
    responses: ItemResponse[]
  ): number {
    let score = 0;
    
    for (const item of subscaleItems) {
      const response = responses.find(r => r.itemId === item.id);
      if (response && !response.wasSkipped && response.responseNumeric !== undefined) {
        const itemScore = response.responseNumeric * item.scoringWeight;
        score += item.reverseScored ? this.reverseScore(itemScore, item) : itemScore;
      }
    }
    
    return score;
  }

  /**
   * Reverse score an item
   */
  protected reverseScore(score: number, item: ScaleItem): number {
    if (item.responseType === ResponseType.LIKERT && item.responseOptions) {
      const maxScore = Math.max(...item.responseOptions.map(opt => Number(opt.score || opt.value)));
      const minScore = Math.min(...item.responseOptions.map(opt => Number(opt.score || opt.value)));
      return (maxScore + minScore) - score;
    }
    
    if (item.maxValue !== undefined && item.minValue !== undefined) {
      return (item.maxValue + item.minValue) - score;
    }
    
    // Default reverse scoring for common cases
    return score;
  }

  /**
   * Get response time statistics
   */
  getResponseTimeStats(responses: ItemResponse[]): {
    totalTime: number;
    averageTime: number;
    medianTime: number;
    fastestTime: number;
    slowestTime: number;
  } {
    const times = responses
      .filter(r => r.responseTimeSeconds !== undefined)
      .map(r => r.responseTimeSeconds!)
      .sort((a, b) => a - b);
    
    if (times.length === 0) {
      return {
        totalTime: 0,
        averageTime: 0,
        medianTime: 0,
        fastestTime: 0,
        slowestTime: 0
      };
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const medianTime = times[Math.floor(times.length / 2)];
    
    return {
      totalTime,
      averageTime,
      medianTime,
      fastestTime: times[0],
      slowestTime: times[times.length - 1]
    };
  }

  /**
   * Process complete assessment
   */
  processAssessment(responses: ItemResponse[]): ScoringResult {
    // Validate responses
    const validation = this.validateResponses(responses);
    if (!validation.isValid) {
      throw new Error(`Invalid responses: ${validation.errors.join(', ')}`);
    }

    // Calculate scores
    const rawScore = this.calculateRawScore(responses);
    const scaledScores = this.calculateScaledScore(rawScore);
    const interpretation = this.getInterpretation(rawScore);
    const subscaleScores = this.calculateSubscaleScores(responses);

    // Build result
    const result: ScoringResult = {
      scaleId: this.config.id,
      rawScore,
      ...scaledScores,
      clinicalRange: this.getClinicalRange(interpretation.severity),
      subscaleScores,
      interpretation: interpretation.interpretation,
      clinicalSignificance: interpretation.clinicalSignificance,
      recommendations: interpretation.recommendations,
      warnings: validation.warnings
    };

    return result;
  }

  /**
   * Map severity to clinical range
   */
  protected getClinicalRange(severity: SeverityLevel): any {
    switch (severity) {
      case SeverityLevel.MINIMAL:
        return 'normal';
      case SeverityLevel.MILD:
        return 'mild';
      case SeverityLevel.MODERATE:
        return 'moderate';
      case SeverityLevel.SEVERE:
        return 'severe';
      case SeverityLevel.EXTREME:
        return 'clinical';
      default:
        return 'unknown';
    }
  }

  /**
   * Validate scale configuration
   */
  private validateScale(): void {
    if (!this.config.id) {
      throw new Error('Scale must have an ID');
    }
    
    if (!this.config.name) {
      throw new Error('Scale must have a name');
    }
    
    if (!this.config.abbreviation) {
      throw new Error('Scale must have an abbreviation');
    }
    
    if (this.items.length === 0) {
      throw new Error('Scale must have at least one item');
    }
    
    // Validate item numbering
    const itemNumbers = this.items.map(item => item.itemNumber);
    const uniqueNumbers = new Set(itemNumbers);
    if (uniqueNumbers.size !== itemNumbers.length) {
      throw new Error('Scale items must have unique item numbers');
    }
  }
}

// =============================================================================
// COMMON SCALE IMPLEMENTATIONS
// =============================================================================

/**
 * Simple Sum Scale - Most common scoring method
 */
export class SimpleSumScale extends BaseScale {
  calculateRawScore(responses: ItemResponse[]): number {
    let score = 0;
    
    for (const response of responses) {
      if (response.wasSkipped || response.responseNumeric === undefined) {
        continue;
      }
      
      const item = this.getItem(response.itemId);
      if (!item) continue;
      
      const itemScore = response.responseNumeric * item.scoringWeight;
      score += item.reverseScored ? this.reverseScore(itemScore, item) : itemScore;
    }
    
    return score;
  }

  calculateScaledScore(rawScore: number): {
    scaledScore?: number;
    percentileRank?: number;
    tScore?: number;
    zScore?: number;
  } {
    // Default implementation - can be overridden for specific scales
    return {
      scaledScore: rawScore,
      percentileRank: undefined,
      tScore: undefined,
      zScore: undefined
    };
  }

  getInterpretation(rawScore: number): InterpretationResult {
    // Default interpretation - should be overridden for specific scales
    return {
      score: rawScore,
      interpretation: `Raw score: ${rawScore}`,
      severity: SeverityLevel.MINIMAL,
      clinicalSignificance: ClinicalSignificance.NOT_SIGNIFICANT,
      scale: {
        name: this.config.name,
        abbreviation: this.config.abbreviation
      }
    };
  }

  validateResponses(responses: ItemResponse[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required items
    const missingRequired = this.getMissingRequiredItems(responses);
    if (missingRequired.length > 0) {
      errors.push(`Missing required items: ${missingRequired.map(i => i.itemNumber).join(', ')}`);
    }
    
    // Validate response values
    for (const response of responses) {
      const item = this.getItem(response.itemId);
      if (!item) {
        errors.push(`Invalid item ID: ${response.itemId}`);
        continue;
      }
      
      if (!response.wasSkipped) {
        const validation = this.validateResponseValue(response, item);
        if (!validation.isValid) {
          errors.push(`Item ${item.itemNumber}: ${validation.error}`);
        }
      }
    }
    
    // Check completion rate
    const completionRate = this.calculateCompletionPercentage(responses);
    if (completionRate < 80) {
      warnings.push(`Low completion rate: ${completionRate.toFixed(1)}%`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateResponseValue(response: ItemResponse, item: ScaleItem): {
    isValid: boolean;
    error?: string;
  } {
    const value = response.responseValue;
    
    switch (item.responseType) {
      case ResponseType.LIKERT:
      case ResponseType.MULTIPLE_CHOICE:
        if (item.responseOptions) {
          const validValues = item.responseOptions.map(opt => String(opt.value));
          if (!validValues.includes(value)) {
            return {
              isValid: false,
              error: `Invalid response value: ${value}`
            };
          }
        }
        break;
        
      case ResponseType.NUMERIC:
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return {
            isValid: false,
            error: 'Response must be a number'
          };
        }
        
        if (item.minValue !== undefined && numValue < item.minValue) {
          return {
            isValid: false,
            error: `Value must be at least ${item.minValue}`
          };
        }
        
        if (item.maxValue !== undefined && numValue > item.maxValue) {
          return {
            isValid: false,
            error: `Value must be at most ${item.maxValue}`
          };
        }
        break;
        
      case ResponseType.TEXT:
        if (item.validationPattern) {
          const regex = new RegExp(item.validationPattern);
          if (!regex.test(value)) {
            return {
              isValid: false,
              error: 'Response does not match required format'
            };
          }
        }
        break;
    }
    
    return { isValid: true };
  }
}

// =============================================================================
// SCALE FACTORY
// =============================================================================

// Scale constructor interface
interface ScaleConstructor {
  new (config: ClinicalScale, items: ScaleItem[]): BaseScale;
}

export class ScaleFactory {
  private static scaleImplementations: Map<string, ScaleConstructor> = new Map();

  /**
   * Register a scale implementation
   */
  static registerScale(scaleId: string, implementation: ScaleConstructor): void {
    this.scaleImplementations.set(scaleId, implementation);
  }

  /**
   * Create a scale instance
   */
  static createScale(config: ClinicalScale, items: ScaleItem[]): BaseScale {
    const Implementation = this.scaleImplementations.get(config.id);
    
    if (Implementation) {
      return new Implementation(config, items);
    }
    
    // Fall back to appropriate default implementation based on scoring method
    switch (config.scoringMethod) {
      case ScoringMethod.SUM:
      case ScoringMethod.WEIGHTED:
        return new SimpleSumScale(config, items);
      default:
        return new SimpleSumScale(config, items);
    }
  }

  /**
   * Get all registered scale implementations
   */
  static getRegisteredScales(): string[] {
    return Array.from(this.scaleImplementations.keys());
  }
}

// =============================================================================
// PLUGIN ARCHITECTURE
// =============================================================================

export interface ScalePlugin {
  id: string;
  name: string;
  version: string;
  supportedScales: string[];
  initialize(factory: typeof ScaleFactory): void;
}

export class ScalePluginManager {
  private plugins: Map<string, ScalePlugin> = new Map();

  /**
   * Register a plugin
   */
  registerPlugin(plugin: ScalePlugin): void {
    this.plugins.set(plugin.id, plugin);
    plugin.initialize(ScaleFactory);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): ScalePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(id: string): ScalePlugin | undefined {
    return this.plugins.get(id);
  }
}

// Export singleton instance
export const pluginManager = new ScalePluginManager();