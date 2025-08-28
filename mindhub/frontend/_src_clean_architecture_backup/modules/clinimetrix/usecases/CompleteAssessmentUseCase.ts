/**
 * Complete Assessment Use Case
 * Application business rules for assessment completion and scoring
 */

import { Assessment, ScoringResults, ValidityIndicator } from '../entities/Assessment';
import { Scale } from '../entities/Scale';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { ScaleRepository } from '../repositories/ScaleRepository';
import { ScoringService } from '../adapters/ScoringService';

export interface CompleteAssessmentRequest {
  assessmentId: string;
  finalResponses?: Record<string, any>;
  demographics?: {
    age?: number;
    gender?: string;
    education?: string;
    [key: string]: any;
  };
  adminNotes?: string;
  forceComplete?: boolean; // Allow completion even if not fully complete
}

export interface CompleteAssessmentResult {
  assessment: Assessment;
  scoringResults: ScoringResults;
  validityWarnings: string[];
  clinicalRecommendations: string[];
}

export class CompleteAssessmentUseCase {
  constructor(
    private assessmentRepository: AssessmentRepository,
    private scaleRepository: ScaleRepository,
    private scoringService: ScoringService
  ) {}

  async execute(request: CompleteAssessmentRequest): Promise<CompleteAssessmentResult> {
    // Business rule: Get existing assessment
    const assessment = await this.assessmentRepository.findById(request.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Business rule: Get scale for validation and scoring
    const scale = await this.scaleRepository.findById(assessment.scaleId);
    if (!scale) {
      throw new Error('Scale not found');
    }

    // Business rule: Check if assessment can be completed
    if (!assessment.canBeCompleted(scale) && !request.forceComplete) {
      const completionPercentage = assessment.getCompletionPercentage(scale);
      throw new Error(
        `Assessment is only ${completionPercentage}% complete. Minimum 80% completion required. ` +
        `Use forceComplete option to override this requirement.`
      );
    }

    // Business rule: Update assessment with final responses if provided
    let updatedAssessment = assessment;
    if (request.finalResponses) {
      updatedAssessment = this.addFinalResponses(assessment, request.finalResponses);
    }

    // Business rule: Validate responses against scale
    const validation = scale.validateResponses(this.extractResponseValues(updatedAssessment.responses));
    if (!validation.isValid && !request.forceComplete) {
      throw new Error(`Assessment has validation errors: ${validation.errors.join(', ')}`);
    }

    // Business rule: Calculate scoring and interpretation
    const scoringResults = await this.calculateScoringResults(
      updatedAssessment, 
      scale, 
      request.demographics
    );

    // Business rule: Analyze validity indicators
    const validityIndicators = this.analyzeValidityIndicators(updatedAssessment, scale, scoringResults);

    // Business rule: Complete the assessment
    const completedAssessment = updatedAssessment.complete(scale, {
      ...scoringResults,
      validityIndicators
    });

    // Business rule: Update metadata with completion info
    const finalAssessment = this.updateCompletionMetadata(completedAssessment, request);

    // Persist changes
    const savedAssessment = await this.assessmentRepository.update(finalAssessment);

    // Business rule: Generate clinical recommendations
    const clinicalRecommendations = this.generateClinicalRecommendations(
      savedAssessment, 
      scale, 
      scoringResults
    );

    // Business rule: Extract validity warnings
    const validityWarnings = this.extractValidityWarnings(validityIndicators, validation.warnings);

    // Business rule: Log assessment completion
    await this.logAssessmentCompletion(savedAssessment, scale, scoringResults);

    // Business rule: Trigger post-completion notifications if needed
    await this.triggerCompletionNotifications(savedAssessment, scale, scoringResults);

    return {
      assessment: savedAssessment,
      scoringResults: scoringResults,
      validityWarnings,
      clinicalRecommendations
    };
  }

  /**
   * Business rule: Add final responses to assessment
   */
  private addFinalResponses(assessment: Assessment, finalResponses: Record<string, any>): Assessment {
    let updatedAssessment = assessment;

    Object.entries(finalResponses).forEach(([itemNumber, value]) => {
      const itemNum = parseInt(itemNumber);
      if (!isNaN(itemNum)) {
        updatedAssessment = updatedAssessment.addResponse(itemNum, value);
      }
    });

    return updatedAssessment;
  }

  /**
   * Business rule: Calculate comprehensive scoring results
   */
  private async calculateScoringResults(
    assessment: Assessment,
    scale: Scale,
    demographics?: Record<string, any>
  ): Promise<ScoringResults> {
    const responses = this.extractResponseValues(assessment.responses);
    
    // Calculate basic scores using scale entity
    const scoreCalculation = scale.calculateScore(responses);
    
    // Get interpretation using scale entity
    const interpretation = scale.getInterpretation(scoreCalculation.totalScore);
    
    if (!interpretation) {
      throw new Error('Unable to determine interpretation for calculated score');
    }

    // Calculate subscale scores and interpretations
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

    // Use scoring service for advanced calculations (percentiles, norms, etc.)
    const advancedScoring = await this.scoringService.calculateAdvancedScores(
      scale,
      scoreCalculation.totalScore,
      subscaleScores,
      demographics
    );

    // Calculate completion time
    const completionTime = assessment.getDurationMinutes();
    const totalTimeMs = completionTime ? completionTime * 60 * 1000 : 0;
    const averageTimePerItem = totalTimeMs > 0 ? totalTimeMs / scale.items.length : 0;

    // Generate clinical recommendations
    const recommendations = this.generateRecommendationsFromInterpretation(interpretation, scoreCalculation);

    // Determine confidence level
    const confidence = this.calculateConfidenceLevel(assessment, scale, scoreCalculation);

    return {
      totalScore: scoreCalculation.totalScore,
      scoreRange: scale.scoreRange,
      severityLevel: interpretation.severity,
      completionPercentage: scoreCalculation.completionPercentage,
      subscaleScores,
      interpretation: {
        rule: interpretation,
        clinicalInterpretation: interpretation.description,
        clinicalSignificance: interpretation.clinicalSignificance,
        recommendations,
        confidence
      },
      validityIndicators: [], // Will be populated by analyzeValidityIndicators
      percentileScore: advancedScoring.percentile,
      tScore: advancedScoring.tScore,
      zScore: advancedScoring.zScore,
      completionTime: totalTimeMs > 0 ? {
        totalTimeMs,
        averageTimePerItem,
        fastestItem: this.getFastestResponseTime(assessment.responses),
        slowestItem: this.getSlowestResponseTime(assessment.responses)
      } : undefined,
      analysisTimestamp: new Date()
    };
  }

  /**
   * Business rule: Analyze validity indicators comprehensively
   */
  private analyzeValidityIndicators(
    assessment: Assessment,
    scale: Scale,
    scoringResults: ScoringResults
  ): ValidityIndicator[] {
    const indicators: ValidityIndicator[] = [];

    // Get response pattern analysis from assessment entity
    const patternIndicators = assessment.analyzeResponsePatterns();
    indicators.push(...patternIndicators);

    // Check completion patterns
    const missingRequired = assessment.getMissingRequiredItems(scale);
    if (missingRequired.length > 0) {
      indicators.push({
        type: 'completion',
        severity: missingRequired.length > scale.items.length * 0.2 ? 'high' : 'medium',
        score: Math.max(0, 100 - (missingRequired.length / scale.items.length) * 100),
        message: `${missingRequired.length} required items not completed`,
        recommendation: 'Consider discussing missing responses with patient'
      });
    }

    // Check for response consistency with scale norms
    if (scale.norms && scoringResults.percentileScore !== undefined) {
      if (scoringResults.percentileScore < 5 || scoringResults.percentileScore > 95) {
        indicators.push({
          type: 'consistency',
          severity: 'medium',
          score: 60,
          message: 'Score is in extreme percentile range',
          recommendation: 'Verify responses and consider clinical context'
        });
      }
    }

    // Check timing patterns if available
    const responseTimes = Object.values(assessment.responses)
      .map(r => r.duration)
      .filter(d => d !== undefined) as number[];

    if (responseTimes.length > 5) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const veryFastCount = responseTimes.filter(t => t < 2).length;
      const verySlowCount = responseTimes.filter(t => t > 60).length;

      if (veryFastCount > responseTimes.length * 0.3) {
        indicators.push({
          type: 'timing',
          severity: 'medium',
          score: 40,
          message: 'Many responses completed very quickly',
          recommendation: 'Verify patient understanding and attention to questions'
        });
      }

      if (verySlowCount > responseTimes.length * 0.2) {
        indicators.push({
          type: 'timing',
          severity: 'low',
          score: 70,
          message: 'Some responses took unusually long',
          recommendation: 'Consider if patient experienced difficulty or distraction'
        });
      }
    }

    return indicators;
  }

  /**
   * Business rule: Generate clinical recommendations based on interpretation
   */
  private generateRecommendationsFromInterpretation(
    interpretation: any,
    scoreCalculation: any
  ): { immediate: string[]; followUp: string[]; treatment: string[] } {
    const immediate: string[] = [...interpretation.recommendations];
    const followUp: string[] = [];
    const treatment: string[] = [];

    // Add general recommendations based on severity
    switch (interpretation.severity) {
      case 'very_severe':
      case 'severe':
        immediate.push('Immediate clinical attention recommended');
        immediate.push('Consider safety assessment');
        treatment.push('Referral to specialist may be warranted');
        treatment.push('Consider intensive treatment options');
        break;

      case 'moderate':
        followUp.push('Schedule follow-up assessment within 2-4 weeks');
        treatment.push('Consider therapeutic intervention');
        break;

      case 'mild':
        followUp.push('Monitor symptoms and reassess in 4-8 weeks');
        treatment.push('Consider preventive interventions');
        break;

      case 'minimal':
        followUp.push('Routine follow-up as clinically indicated');
        break;
    }

    // Add recommendations based on completion percentage
    if (scoreCalculation.completionPercentage < 100) {
      immediate.push('Consider readministering with complete responses for accurate assessment');
    }

    return { immediate, followUp, treatment };
  }

  /**
   * Business rule: Calculate confidence level for interpretation
   */
  private calculateConfidenceLevel(
    assessment: Assessment,
    scale: Scale,
    scoreCalculation: any
  ): { level: 'high' | 'medium' | 'low'; factors: string[]; limitations: string[] } {
    const factors: string[] = [];
    const limitations: string[] = [];
    let confidencePoints = 100;

    // Completion factor
    if (scoreCalculation.completionPercentage === 100) {
      factors.push('Complete response set');
    } else {
      const missingPercent = 100 - scoreCalculation.completionPercentage;
      confidencePoints -= missingPercent;
      limitations.push(`${missingPercent}% of items not completed`);
    }

    // Scale reliability factor
    if (scale.reliability?.cronbachAlpha !== undefined) {
      if (scale.reliability.cronbachAlpha >= 0.9) {
        factors.push('Excellent scale reliability');
      } else if (scale.reliability.cronbachAlpha >= 0.8) {
        factors.push('Good scale reliability');
      } else {
        confidencePoints -= 10;
        limitations.push('Moderate scale reliability');
      }
    }

    // Administration mode factor
    if (assessment.mode === 'professional') {
      factors.push('Professional administration');
    } else if (assessment.mode === 'supervised') {
      factors.push('Supervised administration');
    } else {
      confidencePoints -= 5;
      limitations.push('Self-administered assessment');
    }

    // Timing factor
    const duration = assessment.getDurationMinutes();
    const expectedTime = scale.getEstimatedTimeMinutes();
    if (duration && (duration < expectedTime.min * 0.5 || duration > expectedTime.max * 3)) {
      confidencePoints -= 10;
      limitations.push('Unusual completion time');
    }

    // Determine confidence level
    let level: 'high' | 'medium' | 'low';
    if (confidencePoints >= 85) {
      level = 'high';
    } else if (confidencePoints >= 70) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, factors, limitations };
  }

  /**
   * Generate clinical recommendations based on assessment results
   */
  private generateClinicalRecommendations(
    assessment: Assessment,
    scale: Scale,
    scoringResults: ScoringResults
  ): string[] {
    const recommendations: string[] = [];

    // Add interpretation-based recommendations
    recommendations.push(...scoringResults.interpretation.recommendations.immediate);
    recommendations.push(...scoringResults.interpretation.recommendations.followUp);

    // Add validity-based recommendations
    if (assessment.validityScore !== undefined && assessment.validityScore < 70) {
      recommendations.push('Consider readministering assessment due to validity concerns');
    }

    // Add scale-specific recommendations
    if (scale.clinicalNotes.length > 0) {
      recommendations.push(...scale.clinicalNotes);
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  /**
   * Extract validity warnings from indicators
   */
  private extractValidityWarnings(indicators: ValidityIndicator[], scaleWarnings: string[]): string[] {
    const warnings: string[] = [...scaleWarnings];
    
    indicators
      .filter(indicator => indicator.severity === 'high' || indicator.severity === 'medium')
      .forEach(indicator => warnings.push(indicator.message));

    return warnings;
  }

  /**
   * Update assessment metadata with completion information
   */
  private updateCompletionMetadata(assessment: Assessment, request: CompleteAssessmentRequest): Assessment {
    const updatedMetadata = {
      ...assessment.metadata,
      completedAt: new Date().toISOString(),
      adminNotes: request.adminNotes,
      demographics: request.demographics,
      forceCompleted: request.forceComplete || false
    };

    return new Assessment(
      assessment.id,
      assessment.scaleId,
      assessment.patientId,
      assessment.administratorId,
      assessment.mode,
      assessment.responses,
      assessment.status,
      assessment.currentStep,
      assessment.scoringResults,
      assessment.validityScore,
      assessment.startedAt,
      assessment.completedAt,
      assessment.lastActivityAt,
      updatedMetadata,
      assessment.clinicId,
      assessment.workspaceId,
      assessment.sessionId,
      assessment.deviceInfo,
      assessment.createdAt,
      new Date()
    );
  }

  /**
   * Log assessment completion for audit trail
   */
  private async logAssessmentCompletion(
    assessment: Assessment,
    scale: Scale,
    scoringResults: ScoringResults
  ): Promise<void> {
    try {
      const auditLog = {
        action: 'assessment_completed',
        assessmentId: assessment.id,
        scaleId: scale.id,
        scaleName: scale.name,
        patientId: assessment.patientId,
        administratorId: assessment.administratorId,
        totalScore: scoringResults.totalScore,
        severityLevel: scoringResults.severityLevel,
        completionPercentage: scoringResults.completionPercentage,
        validityScore: assessment.validityScore,
        duration: assessment.getDurationMinutes(),
        timestamp: new Date(),
        clinicId: assessment.clinicId,
        workspaceId: assessment.workspaceId
      };

      console.log('Assessment completed:', auditLog);
      // await this.auditRepository.log(auditLog);
    } catch (error) {
      console.warn('Failed to log assessment completion:', error);
    }
  }

  /**
   * Trigger post-completion notifications
   */
  private async triggerCompletionNotifications(
    assessment: Assessment,
    scale: Scale,
    scoringResults: ScoringResults
  ): Promise<void> {
    try {
      // TODO: Implement notification service integration
      // High-severity results might trigger immediate notifications
      if (scoringResults.severityLevel === 'severe' || scoringResults.severityLevel === 'very_severe') {
        console.log(`High-severity result detected for assessment ${assessment.id} - consider immediate notification`);
      }
    } catch (error) {
      console.warn('Failed to trigger completion notifications:', error);
    }
  }

  // Helper methods
  private extractResponseValues(responses: Record<string, any>): Record<string, any> {
    const values: Record<string, any> = {};
    Object.entries(responses).forEach(([itemNumber, response]) => {
      values[itemNumber] = response.value;
    });
    return values;
  }

  private getFastestResponseTime(responses: Record<string, any>): number | undefined {
    const times = Object.values(responses)
      .map((r: any) => r.duration)
      .filter(d => d !== undefined) as number[];
    
    return times.length > 0 ? Math.min(...times) : undefined;
  }

  private getSlowestResponseTime(responses: Record<string, any>): number | undefined {
    const times = Object.values(responses)
      .map((r: any) => r.duration)
      .filter(d => d !== undefined) as number[];
    
    return times.length > 0 ? Math.max(...times) : undefined;
  }
}