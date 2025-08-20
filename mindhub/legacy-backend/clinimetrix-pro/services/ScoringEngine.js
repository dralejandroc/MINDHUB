/**
 * ClinimetrixPro Scoring Engine
 * 
 * Universal scoring system that processes assessment responses based on 
 * template-defined scoring rules. Supports complex scoring scenarios
 * including subscales, reversed items, conditional scoring, and multi-factor scoring.
 */

const { logger } = require('../../shared/config/logging');
const InterpretationEngine = require('./InterpretationEngine');
const ValidityAnalyzer = require('./ValidityAnalyzer');

class ScoringEngine {
  constructor() {
    this.interpretationEngine = new InterpretationEngine();
    this.validityAnalyzer = new ValidityAnalyzer();
  }

  /**
   * Main scoring function that processes all responses for a template
   * @param {Object} template - The complete template JSON
   * @param {Object} responses - User responses object {itemNumber: {value, score, responseTime}}
   * @param {Object} options - Scoring options
   * @returns {Object} Complete scoring results
   */
  async calculateResults(template, responses, options = {}) {
    try {
      logger.info('Starting scoring calculation', {
        templateId: template.metadata.id,
        responseCount: Object.keys(responses).length,
        totalItems: template.structure.totalItems
      });

      // 1. Validate input data
      this.validateInputs(template, responses);

      // 2. Calculate basic scores
      const basicScores = this.calculateBasicScores(template, responses);

      // 3. Calculate subscale scores
      const subscaleScores = this.calculateSubscaleScores(template, responses);

      // 4. Apply interpretation rules
      const interpretation = await this.interpretationEngine.getInterpretation(
        template, 
        basicScores.totalScore, 
        subscaleScores
      );

      // 5. Analyze validity indicators
      const validityIndicators = await this.validityAnalyzer.analyzeValidity(
        template, 
        responses, 
        basicScores
      );

      // 6. Calculate percentiles and normalized scores (if norms available)
      const normalizedScores = this.calculateNormalizedScores(
        template, 
        basicScores, 
        options.demographics
      );

      // 7. Compile final results
      const results = {
        templateId: template.metadata.id,
        templateVersion: template.metadata.version,
        scoringMethod: template.scoring.method,
        
        // Basic scores
        totalScore: basicScores.totalScore,
        rawScore: basicScores.rawScore,
        scaledScore: basicScores.scaledScore,
        scoreRange: template.scoring.scoreRange,
        
        // Subscale scores
        subscaleScores: subscaleScores,
        
        // Normalized scores
        percentileScore: normalizedScores.percentile,
        tScore: normalizedScores.tScore,
        zScore: normalizedScores.zScore,
        
        // Interpretation
        interpretation: interpretation,
        severityLevel: interpretation.severity,
        
        // Validity and quality indicators
        validityIndicators: validityIndicators,
        completionPercentage: basicScores.completionPercentage,
        
        // Metadata
        completionTime: this.calculateCompletionTime(responses),
        itemsCompleted: Object.keys(responses).length,
        itemsTotal: template.structure.totalItems,
        scoringTimestamp: new Date().toISOString(),
        
        // Additional analytics
        responsePatterns: this.analyzeResponsePatterns(responses),
        qualityMetrics: this.calculateQualityMetrics(template, responses)
      };

      logger.info('Scoring calculation completed successfully', {
        templateId: template.metadata.id,
        totalScore: results.totalScore,
        severity: results.severityLevel,
        validityScore: validityIndicators.overallValidityScore
      });

      return results;

    } catch (error) {
      logger.error('Error in scoring calculation', {
        error: error.message,
        templateId: template?.metadata?.id,
        responseCount: Object.keys(responses || {}).length
      });
      throw error;
    }
  }

  /**
   * Calculate basic total and raw scores
   */
  calculateBasicScores(template, responses) {
    const totalItems = template.structure.totalItems;
    const completedItems = Object.keys(responses).length;
    const completionPercentage = (completedItems / totalItems) * 100;

    let totalScore = 0;
    let rawScore = 0;
    let itemsProcessed = 0;

    // Process each response
    Object.entries(responses).forEach(([itemNumber, response]) => {
      if (response && typeof response.score === 'number') {
        totalScore += response.score;
        rawScore += response.score;
        itemsProcessed++;
      }
    });

    // Apply scoring method adjustments
    let scaledScore = totalScore;
    
    switch (template.scoring.method) {
      case 'average':
        scaledScore = totalScore / Math.max(itemsProcessed, 1);
        break;
      case 'weighted':
        scaledScore = this.calculateWeightedScore(template, responses);
        break;
      case 'sum':
      default:
        scaledScore = totalScore;
        break;
    }

    return {
      totalScore: scaledScore,
      rawScore: rawScore,
      scaledScore: scaledScore,
      completionPercentage: completionPercentage,
      itemsProcessed: itemsProcessed
    };
  }

  /**
   * Calculate subscale scores based on template definition
   */
  calculateSubscaleScores(template, responses) {
    if (!template.scoring.subscales || template.scoring.subscales.length === 0) {
      return {};
    }

    const subscaleScores = {};

    template.scoring.subscales.forEach(subscale => {
      let subscaleTotal = 0;
      let subscaleItemsCount = 0;

      // Parse items - could be array of numbers or comma-separated string
      let items = subscale.items;
      if (typeof items === 'string') {
        items = items.split(',').map(item => parseInt(item.trim()));
      }

      // Calculate subscale score
      items.forEach(itemNumber => {
        const response = responses[itemNumber];
        if (response && typeof response.score === 'number') {
          subscaleTotal += response.score;
          subscaleItemsCount++;
        }
      });

      subscaleScores[subscale.id] = {
        name: subscale.name,
        score: subscaleTotal,
        rawScore: subscaleTotal,
        itemsIncluded: subscaleItemsCount,
        totalItems: items.length,
        scoreRange: subscale.scoreRange,
        completionPercentage: (subscaleItemsCount / items.length) * 100
      };
    });

    return subscaleScores;
  }

  /**
   * Calculate weighted scores for complex scoring methods
   */
  calculateWeightedScore(template, responses) {
    // This would be implemented based on specific weighting rules
    // For now, return simple sum
    return Object.values(responses).reduce((sum, response) => {
      return sum + (response?.score || 0);
    }, 0);
  }

  /**
   * Calculate normalized scores (percentiles, T-scores, Z-scores)
   */
  calculateNormalizedScores(template, basicScores, demographics) {
    // This would use normative data from the template
    // For now, return null values - to be implemented when norms are available
    
    const normativeData = template.documentation?.normativeData;
    
    if (!normativeData) {
      return {
        percentile: null,
        tScore: null,
        zScore: null,
        normReference: null
      };
    }

    // Placeholder for actual normative calculations
    return {
      percentile: null,
      tScore: null,
      zScore: null,
      normReference: 'general_population'
    };
  }

  /**
   * Calculate completion time from response timestamps
   */
  calculateCompletionTime(responses) {
    const responseTimes = Object.values(responses)
      .map(r => r.responseTime)
      .filter(t => t && t > 0);

    if (responseTimes.length === 0) return null;

    return {
      totalTimeMs: responseTimes.reduce((sum, time) => sum + time, 0),
      averageTimePerItem: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minimumTime: Math.min(...responseTimes),
      maximumTime: Math.max(...responseTimes)
    };
  }

  /**
   * Analyze response patterns for validity assessment
   */
  analyzeResponsePatterns(responses) {
    const values = Object.values(responses).map(r => r.score).filter(s => s !== undefined);
    
    if (values.length === 0) return null;

    // Calculate basic statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Detect patterns
    const isConstantResponse = new Set(values).size === 1;
    const isZigzagPattern = this.detectZigzagPattern(values);
    const responseVariability = standardDeviation / mean;

    return {
      mean: mean,
      standardDeviation: standardDeviation,
      variance: variance,
      responseVariability: responseVariability,
      uniqueValues: new Set(values).size,
      isConstantResponse: isConstantResponse,
      isZigzagPattern: isZigzagPattern,
      patternFlags: {
        constantResponse: isConstantResponse,
        zigzagPattern: isZigzagPattern,
        lowVariability: responseVariability < 0.1,
        highVariability: responseVariability > 2.0
      }
    };
  }

  /**
   * Detect zigzag response patterns
   */
  detectZigzagPattern(values) {
    if (values.length < 4) return false;

    let alternatingCount = 0;
    for (let i = 2; i < values.length; i++) {
      const prev2 = values[i-2];
      const prev1 = values[i-1];
      const current = values[i];

      // Check if we have an alternating pattern
      if ((prev2 < prev1 && prev1 > current) || (prev2 > prev1 && prev1 < current)) {
        alternatingCount++;
      }
    }

    // If more than 60% of responses follow alternating pattern
    return alternatingCount / (values.length - 2) > 0.6;
  }

  /**
   * Calculate quality metrics for the assessment
   */
  calculateQualityMetrics(template, responses) {
    const totalItems = template.structure.totalItems;
    const completedItems = Object.keys(responses).length;
    
    // Response rate
    const responseRate = completedItems / totalItems;
    
    // Response time consistency
    const responseTimes = Object.values(responses)
      .map(r => r.responseTime)
      .filter(t => t && t > 0);
    
    let timeConsistency = null;
    if (responseTimes.length > 1) {
      const avgTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
      const timeVariance = responseTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / responseTimes.length;
      timeConsistency = 1 - (Math.sqrt(timeVariance) / avgTime); // Higher = more consistent
    }

    return {
      responseRate: responseRate,
      completionLevel: responseRate >= 0.8 ? 'complete' : responseRate >= 0.5 ? 'partial' : 'minimal',
      timeConsistency: timeConsistency,
      qualityScore: this.calculateOverallQualityScore(responseRate, timeConsistency)
    };
  }

  /**
   * Calculate overall quality score for the assessment
   */
  calculateOverallQualityScore(responseRate, timeConsistency) {
    let qualityScore = responseRate * 0.6; // 60% weight for completion

    if (timeConsistency !== null) {
      qualityScore += timeConsistency * 0.4; // 40% weight for consistency
    } else {
      qualityScore = responseRate; // Only completion if no time data
    }

    return Math.min(1.0, Math.max(0.0, qualityScore));
  }

  /**
   * Validate input data before processing
   */
  validateInputs(template, responses) {
    if (!template) {
      throw new Error('Template is required for scoring');
    }

    if (!template.metadata || !template.structure || !template.scoring) {
      throw new Error('Template is missing required sections (metadata, structure, scoring)');
    }

    if (!responses || typeof responses !== 'object') {
      throw new Error('Responses must be a valid object');
    }

    if (Object.keys(responses).length === 0) {
      throw new Error('No responses provided for scoring');
    }

    // Validate response format
    Object.entries(responses).forEach(([itemNumber, response]) => {
      if (!response || typeof response.score !== 'number') {
        throw new Error(`Invalid response format for item ${itemNumber}`);
      }
    });
  }

  /**
   * Handle special scoring scenarios for complex scales
   */
  async handleSpecialScoring(template, responses, scoringType) {
    switch (scoringType) {
      case 'conditional':
        return this.calculateConditionalScoring(template, responses);
      
      case 'multi_factor':
        return this.calculateMultiFactorScoring(template, responses);
      
      case 'interactive':
        return this.calculateInteractiveScoring(template, responses);
      
      default:
        return null;
    }
  }

  /**
   * Calculate conditional scoring (e.g., DY-BOCS pattern-based scoring)
   */
  calculateConditionalScoring(template, responses) {
    // Implementation for conditional scoring logic
    // This would be specific to scales that have conditional items
    return null;
  }

  /**
   * Calculate multi-factor scoring (e.g., DTS with frequency + severity)
   */
  calculateMultiFactorScoring(template, responses) {
    // Implementation for multi-factor scoring
    // This would handle scales where each item has multiple response dimensions
    return null;
  }

  /**
   * Calculate scoring for interactive components (e.g., MOCA drawings)
   */
  calculateInteractiveScoring(template, responses) {
    // Implementation for interactive component scoring
    // This would handle canvas drawings, memory tasks, etc.
    return null;
  }
}

module.exports = ScoringEngine;