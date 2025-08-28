/**
 * Calculate Scores Use Case
 * Application business rules for real-time score calculation
 */

import { Scale } from '../entities/Scale';
import { ScoringResults, ValidityIndicator } from '../entities/Assessment';
import { ScaleRepository } from '../repositories/ScaleRepository';
import { ScoringService, AdvancedScoringResults } from '../adapters/ScoringService';

export interface CalculateScoresRequest {
  scaleId: string;
  responses: Record<string, any>;
  demographics?: {
    age?: number;
    gender?: string;
    education?: string;
    [key: string]: any;
  };
  includeValidityCheck?: boolean;
  includeNormativeScores?: boolean;
  responseTimings?: Record<string, number>; // item number -> seconds
}

export interface CalculateScoresResponse {
  success: boolean;
  results: ScoringResults;
  warnings: string[];
  errors: string[];
  intermediateScores?: {
    rawScores: Record<string, number>;
    subscaleBreakdown: Record<string, any>;
    itemAnalysis: Array<{
      itemNumber: number;
      rawResponse: any;
      score: number;
      isReversed: boolean;
    }>;
  };
}

export class CalculateScoresUseCase {
  constructor(
    private scaleRepository: ScaleRepository,
    private scoringService: ScoringService
  ) {}

  async execute(request: CalculateScoresRequest): Promise<CalculateScoresResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Business rule: Validate request
      this.validateRequest(request);

      // Business rule: Get scale and validate it's available
      const scale = await this.scaleRepository.findById(request.scaleId);
      if (!scale) {
        throw new Error('Scale not found');
      }

      if (!scale.isActive) {
        throw new Error('Scale is not currently available for scoring');
      }

      // Business rule: Validate responses against scale
      const validation = scale.validateResponses(request.responses);
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      }
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
      }

      // Business rule: Continue with scoring even if there are validation warnings
      // but stop if there are critical errors
      const criticalErrors = validation.errors.filter(error => 
        error.includes('required') || error.includes('Invalid')
      );

      if (criticalErrors.length > 0 && !request.includeValidityCheck) {
        throw new Error(`Cannot calculate scores due to critical validation errors: ${criticalErrors.join(', ')}`);
      }

      // Business rule: Calculate basic scores
      const scoreCalculation = scale.calculateScore(request.responses);

      // Business rule: Get interpretation
      const interpretation = scale.getInterpretation(scoreCalculation.totalScore);
      if (!interpretation) {
        warnings.push('Unable to determine clinical interpretation for calculated score');
      }

      // Business rule: Calculate subscale scores and interpretations
      const subscaleScores: Record<string, any> = {};
      scale.subscales.forEach(subscale => {
        const subscaleScore = scoreCalculation.subscaleScores[subscale.id] || 0;
        const subscaleInterpretation = scale.getSubscaleInterpretation(subscale.id, subscaleScore);
        
        subscaleScores[subscale.id] = {
          name: subscale.name,
          score: subscaleScore,
          scoreRange: subscale.scoreRange,
          interpretation: subscaleInterpretation?.description
        };
      });

      // Business rule: Calculate advanced scores if requested and demographics available
      let advancedScoring: AdvancedScoringResults = {};
      if (request.includeNormativeScores && request.demographics) {
        try {
          advancedScoring = await this.scoringService.calculateAdvancedScores(
            scale,
            scoreCalculation.totalScore,
            subscaleScores,
            request.demographics
          );
        } catch (error) {
          warnings.push('Unable to calculate normative scores: ' + (error as Error).message);
        }
      }

      // Business rule: Analyze validity indicators if requested
      let validityIndicators: ValidityIndicator[] = [];
      if (request.includeValidityCheck) {
        validityIndicators = this.analyzeValidityIndicators(
          scale,
          request.responses,
          scoreCalculation,
          request.responseTimings
        );

        // Add validity warnings
        validityIndicators
          .filter(indicator => indicator.severity === 'high' || indicator.severity === 'medium')
          .forEach(indicator => warnings.push(indicator.message));
      }

      // Business rule: Generate clinical recommendations
      const recommendations = this.generateBasicRecommendations(interpretation, scoreCalculation);

      // Business rule: Calculate confidence level
      const confidence = this.calculateConfidenceLevel(scale, scoreCalculation, validityIndicators);

      // Business rule: Calculate completion time analysis if timing data available
      let completionTime;
      if (request.responseTimings && Object.keys(request.responseTimings).length > 0) {
        const totalTimeMs = Object.values(request.responseTimings).reduce((sum, time) => sum + time, 0) * 1000;
        const averageTimePerItem = totalTimeMs / scale.items.length;
        
        completionTime = {
          totalTimeMs,
          averageTimePerItem,
          fastestItem: Math.min(...Object.values(request.responseTimings)),
          slowestItem: Math.max(...Object.values(request.responseTimings))
        };
      }

      // Business rule: Build scoring results
      const scoringResults: ScoringResults = {
        totalScore: scoreCalculation.totalScore,
        scoreRange: scale.scoreRange,
        severityLevel: interpretation?.severity || 'minimal',
        completionPercentage: scoreCalculation.completionPercentage,
        subscaleScores,
        interpretation: {
          rule: interpretation!,
          clinicalInterpretation: interpretation?.description || 'Unable to determine interpretation',
          clinicalSignificance: interpretation?.clinicalSignificance || '',
          recommendations,
          confidence
        },
        validityIndicators,
        percentileScore: advancedScoring.percentile,
        tScore: advancedScoring.tScore,
        zScore: advancedScoring.zScore,
        completionTime,
        analysisTimestamp: new Date()
      };

      // Business rule: Generate intermediate scores for debugging/analysis
      const intermediateScores = {
        rawScores: scoreCalculation.subscaleScores,
        subscaleBreakdown: this.generateSubscaleBreakdown(scale, request.responses),
        itemAnalysis: this.generateItemAnalysis(scale, request.responses)
      };

      // Business rule: Log scoring operation
      await this.logScoringOperation(request, scoringResults);

      return {
        success: true,
        results: scoringResults,
        warnings,
        errors,
        intermediateScores
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Business rule: Return partial results if possible
      if (errors.some(e => e.includes('Scale not found') || e.includes('not available'))) {
        throw error; // These are critical errors that should be thrown
      }

      // For other errors, return what we can calculate
      return {
        success: false,
        results: this.createEmptyResults(),
        warnings,
        errors
      };
    }
  }

  /**
   * Business rule: Validate calculation request
   */
  private validateRequest(request: CalculateScoresRequest): void {
    if (!request.scaleId?.trim()) {
      throw new Error('Scale ID is required');
    }

    if (!request.responses || Object.keys(request.responses).length === 0) {
      throw new Error('Responses are required');
    }

    // Check if responses contain valid data
    const hasValidResponses = Object.values(request.responses).some(response => 
      response !== null && response !== undefined && response !== ''
    );

    if (!hasValidResponses) {
      throw new Error('At least one valid response is required');
    }

    // Validate response timings if provided
    if (request.responseTimings) {
      Object.entries(request.responseTimings).forEach(([itemNumber, timing]) => {
        if (isNaN(Number(itemNumber)) || timing < 0) {
          throw new Error(`Invalid response timing for item ${itemNumber}`);
        }
      });
    }
  }

  /**
   * Business rule: Analyze validity indicators for responses
   */
  private analyzeValidityIndicators(
    scale: Scale,
    responses: Record<string, any>,
    scoreCalculation: any,
    responseTimings?: Record<string, number>
  ): ValidityIndicator[] {
    const indicators: ValidityIndicator[] = [];

    // Check response patterns
    const responseValues = Object.values(responses).filter(v => v !== null && v !== undefined);
    
    if (responseValues.length < 3) {
      return indicators; // Not enough data for analysis
    }

    // Business rule: Check for constant responses
    const uniqueValues = new Set(responseValues);
    if (uniqueValues.size === 1) {
      indicators.push({
        type: 'response_pattern',
        severity: 'high',
        score: 0,
        message: 'All responses are identical - may indicate response bias',
        recommendation: 'Review responses with respondent for accuracy'
      });
    }

    // Business rule: Check for low variability
    const uniqueRatio = uniqueValues.size / responseValues.length;
    if (uniqueRatio < 0.3 && responseValues.length > 10) {
      indicators.push({
        type: 'response_pattern',
        severity: 'medium',
        score: 25,
        message: 'Low response variability detected',
        recommendation: 'Verify respondent understood response options'
      });
    }

    // Business rule: Check timing patterns if available
    if (responseTimings && Object.keys(responseTimings).length > 5) {
      const timings = Object.values(responseTimings);
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const veryFast = timings.filter(t => t < 2).length;
      const veryLong = timings.filter(t => t > 60).length;

      if (veryFast > timings.length * 0.5) {
        indicators.push({
          type: 'timing',
          severity: 'medium',
          score: 40,
          message: 'Many responses completed very quickly',
          recommendation: 'Verify respondent attention and understanding'
        });
      }

      if (veryLong > timings.length * 0.3) {
        indicators.push({
          type: 'timing',
          severity: 'low',
          score: 70,
          message: 'Several responses took unusually long',
          recommendation: 'Consider if respondent experienced difficulty'
        });
      }
    }

    // Business rule: Check completion patterns
    const completedItems = Object.keys(responses).length;
    const totalItems = scale.items.length;
    const completionRate = completedItems / totalItems;

    if (completionRate < 0.8) {
      indicators.push({
        type: 'completion',
        severity: 'high',
        score: completionRate * 100,
        message: `Only ${Math.round(completionRate * 100)}% of items completed`,
        recommendation: 'Consider readministering with complete responses'
      });
    }

    return indicators;
  }

  /**
   * Business rule: Generate basic clinical recommendations
   */
  private generateBasicRecommendations(
    interpretation: any,
    scoreCalculation: any
  ): { immediate: string[]; followUp: string[]; treatment: string[] } {
    const immediate: string[] = [];
    const followUp: string[] = [];
    const treatment: string[] = [];

    if (interpretation) {
      immediate.push(...interpretation.recommendations);

      // Add severity-based recommendations
      switch (interpretation.severity) {
        case 'very_severe':
        case 'severe':
          immediate.push('Consider immediate clinical evaluation');
          treatment.push('Refer for specialized assessment');
          break;
        case 'moderate':
          followUp.push('Schedule follow-up within 2-4 weeks');
          treatment.push('Consider therapeutic intervention');
          break;
        case 'mild':
          followUp.push('Monitor and reassess in 4-8 weeks');
          break;
      }
    }

    // Add completion-based recommendations
    if (scoreCalculation.completionPercentage < 100) {
      immediate.push('Consider complete readministration for full assessment');
    }

    return { immediate, followUp, treatment };
  }

  /**
   * Business rule: Calculate confidence level for scoring
   */
  private calculateConfidenceLevel(
    scale: Scale,
    scoreCalculation: any,
    validityIndicators: ValidityIndicator[]
  ): { level: 'high' | 'medium' | 'low'; factors: string[]; limitations: string[] } {
    const factors: string[] = [];
    const limitations: string[] = [];
    let confidencePoints = 100;

    // Completion factor
    if (scoreCalculation.completionPercentage === 100) {
      factors.push('Complete response set');
    } else {
      confidencePoints -= (100 - scoreCalculation.completionPercentage);
      limitations.push(`${100 - scoreCalculation.completionPercentage}% incomplete`);
    }

    // Scale reliability factor
    if (scale.reliability?.cronbachAlpha) {
      if (scale.reliability.cronbachAlpha >= 0.9) {
        factors.push('Excellent reliability');
        confidencePoints += 5;
      } else if (scale.reliability.cronbachAlpha >= 0.8) {
        factors.push('Good reliability');
      } else {
        limitations.push('Moderate reliability');
        confidencePoints -= 10;
      }
    }

    // Validity indicators factor
    const highSeverityIssues = validityIndicators.filter(i => i.severity === 'high');
    const mediumSeverityIssues = validityIndicators.filter(i => i.severity === 'medium');

    if (highSeverityIssues.length > 0) {
      confidencePoints -= 30;
      limitations.push(`${highSeverityIssues.length} high-severity validity issues`);
    }

    if (mediumSeverityIssues.length > 0) {
      confidencePoints -= mediumSeverityIssues.length * 10;
      limitations.push(`${mediumSeverityIssues.length} medium-severity validity issues`);
    }

    if (validityIndicators.length === 0) {
      factors.push('No validity concerns detected');
    }

    // Determine final confidence level
    let level: 'high' | 'medium' | 'low';
    if (confidencePoints >= 85) {
      level = 'high';
    } else if (confidencePoints >= 65) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, factors, limitations };
  }

  /**
   * Generate subscale breakdown for analysis
   */
  private generateSubscaleBreakdown(scale: Scale, responses: Record<string, any>): Record<string, any> {
    const breakdown: Record<string, any> = {};

    scale.subscales.forEach(subscale => {
      const subscaleResponses: Record<string, any> = {};
      let subscaleTotal = 0;
      let itemCount = 0;

      subscale.items.forEach(itemNumber => {
        const item = scale.items.find(i => i.number === itemNumber);
        const response = responses[itemNumber];

        if (item && response !== undefined && response !== null) {
          try {
            const score = item.getScoreForResponse(response);
            subscaleResponses[itemNumber] = {
              response,
              score,
              maxPossible: item.options.length > 0 ? Math.max(...item.options.map(o => o.score)) : 1
            };
            subscaleTotal += score;
            itemCount++;
          } catch (error) {
            subscaleResponses[itemNumber] = {
              response,
              score: 0,
              error: (error as Error).message
            };
          }
        }
      });

      breakdown[subscale.id] = {
        name: subscale.name,
        responses: subscaleResponses,
        totalScore: subscaleTotal,
        itemCount,
        averageScore: itemCount > 0 ? subscaleTotal / itemCount : 0
      };
    });

    return breakdown;
  }

  /**
   * Generate detailed item analysis
   */
  private generateItemAnalysis(scale: Scale, responses: Record<string, any>): Array<{
    itemNumber: number;
    rawResponse: any;
    score: number;
    isReversed: boolean;
  }> {
    return scale.items.map(item => {
      const response = responses[item.number];
      let score = 0;

      if (response !== undefined && response !== null) {
        try {
          score = item.getScoreForResponse(response);
        } catch (error) {
          // Score remains 0 for invalid responses
        }
      }

      return {
        itemNumber: item.number,
        rawResponse: response,
        score,
        isReversed: item.reversed
      };
    });
  }

  /**
   * Create empty results structure for error cases
   */
  private createEmptyResults(): ScoringResults {
    return {
      totalScore: 0,
      scoreRange: { min: 0, max: 0 },
      severityLevel: 'minimal',
      completionPercentage: 0,
      subscaleScores: {},
      interpretation: {
        rule: {
          id: '',
          label: 'Unable to calculate',
          minScore: 0,
          maxScore: 0,
          severity: 'minimal',
          color: 'gray',
          description: 'Calculation failed',
          clinicalSignificance: '',
          recommendations: []
        },
        clinicalInterpretation: 'Unable to calculate due to errors',
        clinicalSignificance: '',
        recommendations: { immediate: [], followUp: [], treatment: [] },
        confidence: { level: 'low', factors: [], limitations: ['Calculation failed'] }
      },
      validityIndicators: [],
      analysisTimestamp: new Date()
    };
  }

  /**
   * Log scoring operation for analytics
   */
  private async logScoringOperation(
    request: CalculateScoresRequest,
    results: ScoringResults
  ): Promise<void> {
    try {
      const logData = {
        action: 'scores_calculated',
        scaleId: request.scaleId,
        responseCount: Object.keys(request.responses).length,
        totalScore: results.totalScore,
        severityLevel: results.severityLevel,
        completionPercentage: results.completionPercentage,
        hasValidityIssues: results.validityIndicators.length > 0,
        confidenceLevel: results.interpretation.confidence.level,
        timestamp: new Date()
      };

      console.log('Scoring operation logged:', logData);
      // await this.analyticsRepository.log(logData);
    } catch (error) {
      console.warn('Failed to log scoring operation:', error);
    }
  }
}