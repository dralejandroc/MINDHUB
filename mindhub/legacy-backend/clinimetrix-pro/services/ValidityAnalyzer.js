/**
 * ClinimetrixPro Validity Analyzer
 * 
 * Analyzes response patterns and assessment validity to detect
 * potential issues with response quality and reliability.
 */

const { logger } = require('../../shared/config/logging');

class ValidityAnalyzer {
  constructor() {
    this.validityThresholds = {
      constantResponse: 1.0,        // All responses the same
      lowVariability: 0.15,         // Very low response variability
      highVariability: 3.0,         // Extremely high variability
      zigzagPattern: 0.7,           // Alternating response pattern
      speedThreshold: 500,          // Minimum ms per response
      maxSpeedThreshold: 30000,     // Maximum reasonable ms per response
      minimumCompletion: 0.5        // Minimum completion rate for validity
    };
  }

  /**
   * Analyze overall validity of an assessment
   * @param {Object} template - Assessment template
   * @param {Object} responses - User responses
   * @param {Object} basicScores - Basic scoring results
   * @returns {Object} Validity analysis results
   */
  async analyzeValidity(template, responses, basicScores) {
    try {
      logger.info('Starting validity analysis', {
        templateId: template.metadata.id,
        responseCount: Object.keys(responses).length
      });

      // Perform individual validity checks
      const analyses = {
        responsePatterns: this.analyzeResponsePatterns(responses),
        timingAnalysis: this.analyzeResponseTiming(responses),
        completionAnalysis: this.analyzeCompletion(template, responses),
        consistencyAnalysis: this.analyzeConsistency(template, responses),
        outlierAnalysis: this.analyzeOutliers(responses),
        qualityIndicators: this.calculateQualityIndicators(responses)
      };

      // Calculate overall validity score
      const overallValidity = this.calculateOverallValidityScore(analyses);

      // Generate validity warnings and recommendations
      const warnings = this.generateValidityWarnings(analyses);
      const recommendations = this.generateValidityRecommendations(analyses);

      const validityResults = {
        overallValidityScore: overallValidity.score,
        validityLevel: overallValidity.level,
        validityCategory: overallValidity.category,
        
        // Detailed analyses
        responsePatterns: analyses.responsePatterns,
        timingAnalysis: analyses.timingAnalysis,
        completionAnalysis: analyses.completionAnalysis,
        consistencyAnalysis: analyses.consistencyAnalysis,
        outlierAnalysis: analyses.outlierAnalysis,
        qualityIndicators: analyses.qualityIndicators,
        
        // Summary and recommendations
        warnings: warnings,
        recommendations: recommendations,
        
        // Metadata
        analysisTimestamp: new Date().toISOString(),
        templateId: template.metadata.id,
        responseCount: Object.keys(responses).length
      };

      logger.info('Validity analysis completed', {
        templateId: template.metadata.id,
        validityScore: overallValidity.score,
        validityLevel: overallValidity.level,
        warningCount: warnings.length
      });

      return validityResults;

    } catch (error) {
      logger.error('Error in validity analysis', {
        error: error.message,
        templateId: template?.metadata?.id
      });
      
      return this.createErrorValidityResult(error);
    }
  }

  /**
   * Analyze response patterns for suspicious behaviors
   */
  analyzeResponsePatterns(responses) {
    const values = Object.values(responses).map(r => r.score).filter(s => s !== undefined);
    
    if (values.length === 0) {
      return { error: 'No valid responses to analyze' };
    }

    // Basic statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficient = standardDeviation / mean;

    // Pattern detection
    const uniqueValues = new Set(values).size;
    const totalValues = values.length;
    
    const patterns = {
      constantResponse: uniqueValues === 1,
      lowVariability: coefficient < this.validityThresholds.lowVariability,
      highVariability: coefficient > this.validityThresholds.highVariability,
      zigzagPattern: this.detectZigzagPattern(values),
      straightLinePattern: this.detectStraightLinePattern(values),
      extremeResponseBias: this.detectExtremeResponseBias(values)
    };

    // Calculate pattern severity
    const patternSeverity = this.calculatePatternSeverity(patterns, coefficient);

    return {
      statistics: {
        mean: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        coefficientOfVariation: Math.round(coefficient * 100) / 100,
        uniqueValueRatio: uniqueValues / totalValues
      },
      patterns: patterns,
      patternSeverity: patternSeverity,
      validityScore: this.calculatePatternValidityScore(patterns, coefficient),
      flags: this.generatePatternFlags(patterns)
    };
  }

  /**
   * Analyze response timing patterns
   */
  analyzeResponseTiming(responses) {
    const responseTimes = Object.values(responses)
      .map(r => r.responseTime)
      .filter(t => t && t > 0);

    if (responseTimes.length === 0) {
      return { 
        available: false, 
        message: 'No timing data available' 
      };
    }

    const avgTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const medianTime = this.calculateMedian(responseTimes);

    // Timing flags
    const timingFlags = {
      tooFast: responseTimes.filter(t => t < this.validityThresholds.speedThreshold).length,
      tooSlow: responseTimes.filter(t => t > this.validityThresholds.maxSpeedThreshold).length,
      inconsistentTiming: this.detectInconsistentTiming(responseTimes),
      suspiciousSpeed: minTime < 200 || avgTime < 1000 // Very fast responses
    };

    return {
      available: true,
      statistics: {
        averageTime: Math.round(avgTime),
        medianTime: Math.round(medianTime),
        minimumTime: minTime,
        maximumTime: maxTime,
        timeRange: maxTime - minTime,
        totalItems: responseTimes.length
      },
      flags: timingFlags,
      validityScore: this.calculateTimingValidityScore(timingFlags, avgTime),
      recommendations: this.generateTimingRecommendations(timingFlags)
    };
  }

  /**
   * Analyze completion patterns
   */
  analyzeCompletion(template, responses) {
    const totalItems = template.structure.totalItems;
    const completedItems = Object.keys(responses).length;
    const completionRate = completedItems / totalItems;

    // Analyze completion pattern
    const itemNumbers = Object.keys(responses).map(n => parseInt(n)).sort((a, b) => a - b);
    const gaps = this.findCompletionGaps(itemNumbers, totalItems);
    
    const completionPattern = {
      sequential: this.isSequentialCompletion(itemNumbers),
      hasGaps: gaps.length > 0,
      gapCount: gaps.length,
      largestGap: gaps.length > 0 ? Math.max(...gaps.map(g => g.size)) : 0,
      prematureTermination: this.detectPrematureTermination(itemNumbers, totalItems)
    };

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      completedItems: completedItems,
      totalItems: totalItems,
      pattern: completionPattern,
      gaps: gaps,
      validityScore: this.calculateCompletionValidityScore(completionRate, completionPattern),
      adequateCompletion: completionRate >= this.validityThresholds.minimumCompletion
    };
  }

  /**
   * Analyze response consistency (for scales with consistency items)
   */
  analyzeConsistency(template, responses) {
    // Look for consistency items or reversed items
    const consistencyItems = this.findConsistencyItems(template);
    
    if (consistencyItems.length === 0) {
      return {
        available: false,
        message: 'No consistency items available in this template'
      };
    }

    const consistencyScores = this.calculateConsistencyScores(consistencyItems, responses);
    
    return {
      available: true,
      consistencyItems: consistencyItems.length,
      consistencyScore: consistencyScores.overallScore,
      itemConsistency: consistencyScores.itemScores,
      validityScore: consistencyScores.overallScore,
      flags: consistencyScores.flags
    };
  }

  /**
   * Analyze statistical outliers in responses
   */
  analyzeOutliers(responses) {
    const values = Object.values(responses).map(r => r.score).filter(s => s !== undefined);
    
    if (values.length < 4) {
      return { 
        available: false, 
        message: 'Insufficient data for outlier analysis' 
      };
    }

    const outliers = this.detectOutliers(values);
    const outlierRate = outliers.length / values.length;

    return {
      available: true,
      outlierCount: outliers.length,
      outlierRate: Math.round(outlierRate * 100) / 100,
      outliers: outliers,
      validityScore: outlierRate < 0.1 ? 1.0 : outlierRate < 0.2 ? 0.7 : 0.4,
      excessive: outlierRate > 0.15
    };
  }

  /**
   * Calculate overall quality indicators
   */
  calculateQualityIndicators(responses) {
    const responseCount = Object.keys(responses).length;
    const hasTimingData = Object.values(responses).some(r => r.responseTime);
    
    return {
      responseCount: responseCount,
      hasTimingData: hasTimingData,
      responseIntegrity: this.checkResponseIntegrity(responses),
      dataQuality: this.assessDataQuality(responses)
    };
  }

  /**
   * Detect zigzag response pattern
   */
  detectZigzagPattern(values) {
    if (values.length < 4) return false;

    let alternatingCount = 0;
    for (let i = 2; i < values.length; i++) {
      const trend1 = values[i-1] - values[i-2];
      const trend2 = values[i] - values[i-1];
      
      // Check for alternating trends
      if ((trend1 > 0 && trend2 < 0) || (trend1 < 0 && trend2 > 0)) {
        alternatingCount++;
      }
    }

    const alternatingRate = alternatingCount / (values.length - 2);
    return alternatingRate >= this.validityThresholds.zigzagPattern;
  }

  /**
   * Detect straight line response pattern
   */
  detectStraightLinePattern(values) {
    if (values.length < 5) return false;

    // Check for consecutive identical values
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < values.length; i++) {
      if (values[i] === values[i-1]) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    // If more than 70% of responses are the same value
    return maxConsecutive / values.length > 0.7;
  }

  /**
   * Detect extreme response bias (only using extreme ends)
   */
  detectExtremeResponseBias(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const extremeValues = values.filter(v => v === min || v === max);
    
    return extremeValues.length / values.length > 0.8;
  }

  /**
   * Calculate overall validity score from all analyses
   */
  calculateOverallValidityScore(analyses) {
    const scores = [];
    const weights = [];

    // Response patterns (high weight)
    if (analyses.responsePatterns.validityScore !== undefined) {
      scores.push(analyses.responsePatterns.validityScore);
      weights.push(0.3);
    }

    // Timing analysis (medium weight)
    if (analyses.timingAnalysis.available && analyses.timingAnalysis.validityScore !== undefined) {
      scores.push(analyses.timingAnalysis.validityScore);
      weights.push(0.2);
    }

    // Completion analysis (high weight)
    if (analyses.completionAnalysis.validityScore !== undefined) {
      scores.push(analyses.completionAnalysis.validityScore);
      weights.push(0.25);
    }

    // Consistency analysis (medium weight)
    if (analyses.consistencyAnalysis.available && analyses.consistencyAnalysis.validityScore !== undefined) {
      scores.push(analyses.consistencyAnalysis.validityScore);
      weights.push(0.15);
    }

    // Outlier analysis (low weight)
    if (analyses.outlierAnalysis.available && analyses.outlierAnalysis.validityScore !== undefined) {
      scores.push(analyses.outlierAnalysis.validityScore);
      weights.push(0.1);
    }

    // Calculate weighted average
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce((sum, score, i) => sum + (score * weights[i]), 0);
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

    // Determine validity level and category
    let level, category;
    if (overallScore >= 0.8) {
      level = 'high';
      category = 'reliable';
    } else if (overallScore >= 0.6) {
      level = 'moderate';
      category = 'acceptable';
    } else if (overallScore >= 0.4) {
      level = 'low';
      category = 'questionable';
    } else {
      level = 'very_low';
      category = 'unreliable';
    }

    return {
      score: Math.round(overallScore * 100) / 100,
      level: level,
      category: category,
      componentScores: scores,
      weights: weights
    };
  }

  /**
   * Generate validity warnings based on analyses
   */
  generateValidityWarnings(analyses) {
    const warnings = [];

    // Response pattern warnings
    if (analyses.responsePatterns.patterns?.constantResponse) {
      warnings.push({
        type: 'pattern',
        severity: 'high',
        message: 'Todas las respuestas son idénticas - posible respuesta aleatoria',
        recommendation: 'Reaplicar la escala con mayor supervisión'
      });
    }

    if (analyses.responsePatterns.patterns?.zigzagPattern) {
      warnings.push({
        type: 'pattern',
        severity: 'medium',
        message: 'Patrón de respuesta alternante detectado',
        recommendation: 'Verificar comprensión de las instrucciones'
      });
    }

    // Timing warnings
    if (analyses.timingAnalysis.available && analyses.timingAnalysis.flags?.suspiciousSpeed) {
      warnings.push({
        type: 'timing',
        severity: 'medium',
        message: 'Respuestas excesivamente rápidas detectadas',
        recommendation: 'Considerar reaplicación con énfasis en reflexión'
      });
    }

    // Completion warnings
    if (analyses.completionAnalysis.completionRate < 0.8) {
      warnings.push({
        type: 'completion',
        severity: analyses.completionAnalysis.completionRate < 0.5 ? 'high' : 'medium',
        message: `Completitud baja: ${Math.round(analyses.completionAnalysis.completionRate * 100)}%`,
        recommendation: 'Considerar los resultados como preliminares'
      });
    }

    return warnings;
  }

  /**
   * Generate validity recommendations
   */
  generateValidityRecommendations(analyses) {
    const recommendations = [];

    if (analyses.responsePatterns.validityScore < 0.6) {
      recommendations.push('Revisar patrones de respuesta con el evaluado');
      recommendations.push('Considerar reaplicación de la escala');
    }

    if (analyses.completionAnalysis.completionRate < 0.8) {
      recommendations.push('Completar ítems faltantes si es posible');
      recommendations.push('Interpretar resultados con cautela');
    }

    if (analyses.timingAnalysis.available && analyses.timingAnalysis.flags?.suspiciousSpeed) {
      recommendations.push('Enfatizar la importancia de respuestas reflexivas');
      recommendations.push('Proporcionar mayor tiempo para completar la evaluación');
    }

    return recommendations;
  }

  // Helper methods

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculatePatternValidityScore(patterns, coefficient) {
    let score = 1.0;

    if (patterns.constantResponse) score *= 0.1;
    if (patterns.zigzagPattern) score *= 0.4;
    if (patterns.straightLinePattern) score *= 0.3;
    if (patterns.extremeResponseBias) score *= 0.6;
    if (patterns.lowVariability) score *= 0.7;
    if (patterns.highVariability) score *= 0.5;

    return Math.max(0, Math.min(1, score));
  }

  calculateTimingValidityScore(flags, avgTime) {
    let score = 1.0;

    if (flags.suspiciousSpeed) score *= 0.3;
    if (flags.inconsistentTiming) score *= 0.7;
    if (avgTime < 1000) score *= 0.4;
    if (avgTime > 20000) score *= 0.8;

    return Math.max(0, Math.min(1, score));
  }

  calculateCompletionValidityScore(rate, pattern) {
    let score = rate; // Base score is completion rate

    if (pattern.prematureTermination) score *= 0.6;
    if (pattern.largestGap > 5) score *= 0.8;
    if (!pattern.sequential && pattern.hasGaps) score *= 0.9;

    return Math.max(0, Math.min(1, score));
  }

  detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(v => v < lowerBound || v > upperBound);
  }

  calculatePercentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sortedArray[lower];
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  createErrorValidityResult(error) {
    return {
      error: true,
      message: error.message,
      overallValidityScore: 0,
      validityLevel: 'unknown',
      validityCategory: 'error',
      warnings: [{
        type: 'system',
        severity: 'high',
        message: 'Error en análisis de validez',
        recommendation: 'Contactar soporte técnico'
      }]
    };
  }

  // Additional helper methods would be implemented here...
  detectInconsistentTiming(times) { return false; } // Placeholder
  findCompletionGaps(items, total) { return []; } // Placeholder
  isSequentialCompletion(items) { return true; } // Placeholder
  detectPrematureTermination(items, total) { return false; } // Placeholder
  findConsistencyItems(template) { return []; } // Placeholder
  calculateConsistencyScores(items, responses) { return { overallScore: 1.0, itemScores: [], flags: [] }; } // Placeholder
  checkResponseIntegrity(responses) { return 'good'; } // Placeholder
  assessDataQuality(responses) { return 'high'; } // Placeholder
  calculatePatternSeverity(patterns, coefficient) { return 'low'; } // Placeholder
  generatePatternFlags(patterns) { return []; } // Placeholder
  generateTimingRecommendations(flags) { return []; } // Placeholder
}

module.exports = ValidityAnalyzer;