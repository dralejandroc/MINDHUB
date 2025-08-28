/**
 * Assessment Entity
 * Core business logic for psychometric assessments - Pure domain model
 * No external dependencies, framework-agnostic
 */

import { Scale, SeverityLevel, InterpretationRule } from './Scale';

export type AssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'incomplete' | 'cancelled';
export type AssessmentMode = 'professional' | 'self_administered' | 'remote' | 'supervised';

export interface AssessmentResponse {
  itemNumber: number;
  value: any;
  timestamp?: Date;
  duration?: number; // seconds spent on this item
}

export interface ValidityIndicator {
  type: 'response_pattern' | 'timing' | 'completion' | 'consistency';
  severity: 'low' | 'medium' | 'high';
  score: number; // 0-100
  message: string;
  recommendation: string;
}

export interface ScoringResults {
  totalScore: number;
  scoreRange: {
    min: number;
    max: number;
  };
  severityLevel: SeverityLevel;
  completionPercentage: number;
  subscaleScores: Record<string, {
    name: string;
    score: number;
    scoreRange: { min: number; max: number };
    interpretation?: string;
  }>;
  interpretation: {
    rule: InterpretationRule;
    clinicalInterpretation: string;
    clinicalSignificance: string;
    recommendations: {
      immediate: string[];
      followUp: string[];
      treatment: string[];
    };
    confidence: {
      level: 'high' | 'medium' | 'low';
      factors: string[];
      limitations: string[];
    };
  };
  validityIndicators: ValidityIndicator[];
  percentileScore?: number;
  tScore?: number;
  zScore?: number;
  completionTime?: {
    totalTimeMs: number;
    averageTimePerItem: number;
    fastestItem?: number;
    slowestItem?: number;
  };
  analysisTimestamp: Date;
}

export class Assessment {
  constructor(
    public readonly id: string,
    public readonly scaleId: string,
    public readonly patientId: string,
    public readonly administratorId: string,
    public readonly mode: AssessmentMode,
    public readonly responses: Record<string, AssessmentResponse> = {},
    public readonly status: AssessmentStatus = 'draft',
    public readonly currentStep: number = 1,
    public readonly scoringResults?: ScoringResults,
    public readonly validityScore?: number,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly lastActivityAt?: Date,
    public readonly metadata: Record<string, any> = {},
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly sessionId?: string,
    public readonly deviceInfo?: {
      userAgent?: string;
      platform?: string;
      deviceType?: 'desktop' | 'mobile' | 'tablet';
    },
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate assessment integrity
   */
  private validate(): void {
    // Business rule: Must have valid IDs
    if (!this.id.trim()) {
      throw new Error('Assessment ID is required');
    }

    if (!this.scaleId.trim()) {
      throw new Error('Scale ID is required');
    }

    if (!this.patientId.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!this.administratorId.trim()) {
      throw new Error('Administrator ID is required');
    }

    // Business rule: Cannot belong to both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Assessment cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Assessment must belong to either clinic or workspace');
    }

    // Business rule: Current step must be positive
    if (this.currentStep < 1) {
      throw new Error('Current step must be at least 1');
    }

    // Business rule: Completed assessments must have completion date
    if (this.status === 'completed' && !this.completedAt) {
      throw new Error('Completed assessments must have completion date');
    }

    // Business rule: Completed assessments should have scoring results
    if (this.status === 'completed' && !this.scoringResults) {
      console.warn('Completed assessment should have scoring results');
    }

    // Business rule: Validate response structure
    Object.entries(this.responses).forEach(([key, response]) => {
      const itemNumber = parseInt(key);
      if (isNaN(itemNumber) || itemNumber !== response.itemNumber) {
        throw new Error(`Invalid response key-value mismatch: ${key} vs ${response.itemNumber}`);
      }
    });
  }

  /**
   * Business logic: Check if assessment can be continued
   */
  canBeContinued(): boolean {
    return this.status === 'draft' || this.status === 'in_progress';
  }

  /**
   * Business logic: Check if assessment can be completed
   */
  canBeCompleted(scale: Scale): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }

    // Check minimum completion threshold
    const completionPercentage = this.getCompletionPercentage(scale);
    return completionPercentage >= 80; // Must be at least 80% complete
  }

  /**
   * Business logic: Check if assessment can be cancelled
   */
  canBeCancelled(): boolean {
    return this.status === 'draft' || this.status === 'in_progress';
  }

  /**
   * Business logic: Add or update response
   */
  addResponse(itemNumber: number, value: any, duration?: number): Assessment {
    if (!this.canBeContinued()) {
      throw new Error('Cannot modify completed or cancelled assessment');
    }

    const response: AssessmentResponse = {
      itemNumber,
      value,
      timestamp: new Date(),
      duration
    };

    const updatedResponses = {
      ...this.responses,
      [itemNumber]: response
    };

    return new Assessment(
      this.id,
      this.scaleId,
      this.patientId,
      this.administratorId,
      this.mode,
      updatedResponses,
      this.responses[itemNumber] ? this.status : 'in_progress', // Mark as in_progress if new response
      this.currentStep,
      this.scoringResults,
      this.validityScore,
      this.startedAt || new Date(),
      this.completedAt,
      new Date(), // lastActivityAt
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.sessionId,
      this.deviceInfo,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Business logic: Update current step
   */
  updateStep(step: number): Assessment {
    if (!this.canBeContinued()) {
      throw new Error('Cannot modify completed or cancelled assessment');
    }

    if (step < 1) {
      throw new Error('Step must be at least 1');
    }

    return new Assessment(
      this.id,
      this.scaleId,
      this.patientId,
      this.administratorId,
      this.mode,
      this.responses,
      this.status,
      step,
      this.scoringResults,
      this.validityScore,
      this.startedAt,
      this.completedAt,
      new Date(), // lastActivityAt
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.sessionId,
      this.deviceInfo,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Business logic: Complete assessment with scoring
   */
  complete(scale: Scale, scoringResults: ScoringResults): Assessment {
    if (!this.canBeCompleted(scale)) {
      throw new Error('Assessment cannot be completed in current state');
    }

    // Business rule: Calculate validity score
    const validityScore = this.calculateValidityScore(scoringResults.validityIndicators);

    return new Assessment(
      this.id,
      this.scaleId,
      this.patientId,
      this.administratorId,
      this.mode,
      this.responses,
      'completed',
      this.currentStep,
      scoringResults,
      validityScore,
      this.startedAt,
      new Date(), // completedAt
      new Date(), // lastActivityAt
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.sessionId,
      this.deviceInfo,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Business logic: Cancel assessment
   */
  cancel(): Assessment {
    if (!this.canBeCancelled()) {
      throw new Error('Assessment cannot be cancelled in current state');
    }

    return new Assessment(
      this.id,
      this.scaleId,
      this.patientId,
      this.administratorId,
      this.mode,
      this.responses,
      'cancelled',
      this.currentStep,
      this.scoringResults,
      this.validityScore,
      this.startedAt,
      this.completedAt,
      new Date(), // lastActivityAt
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.sessionId,
      this.deviceInfo,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Business logic: Calculate completion percentage
   */
  getCompletionPercentage(scale: Scale): number {
    const totalItems = scale.items.length;
    const completedItems = Object.keys(this.responses).length;
    return Math.round((completedItems / totalItems) * 100);
  }

  /**
   * Business logic: Get assessment duration in minutes
   */
  getDurationMinutes(): number | null {
    if (!this.startedAt) return null;
    
    const endTime = this.completedAt || this.lastActivityAt || new Date();
    const durationMs = endTime.getTime() - this.startedAt.getTime();
    return Math.round(durationMs / (1000 * 60));
  }

  /**
   * Business logic: Check if assessment is expired
   */
  isExpired(maxIdleMinutes: number = 60): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }

    if (!this.lastActivityAt && !this.startedAt) {
      return false;
    }

    const lastActivity = this.lastActivityAt || this.startedAt!;
    const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60);
    
    return minutesSinceActivity > maxIdleMinutes;
  }

  /**
   * Business logic: Get next item number to complete
   */
  getNextItemNumber(scale: Scale): number | null {
    const completedItems = new Set(Object.keys(this.responses).map(Number));
    
    // Find first missing item
    for (const item of scale.items) {
      if (!completedItems.has(item.number)) {
        return item.number;
      }
    }
    
    return null; // All items completed
  }

  /**
   * Business logic: Get missing required items
   */
  getMissingRequiredItems(scale: Scale): number[] {
    const completedItems = new Set(Object.keys(this.responses).map(Number));
    
    return scale.items
      .filter(item => item.required && !completedItems.has(item.number))
      .map(item => item.number);
  }

  /**
   * Business logic: Check response patterns for validity
   */
  analyzeResponsePatterns(): ValidityIndicator[] {
    const indicators: ValidityIndicator[] = [];
    const responseValues = Object.values(this.responses).map(r => r.value);
    
    if (responseValues.length < 3) {
      return indicators; // Not enough data for pattern analysis
    }

    // Check for constant responses (same answer for everything)
    const uniqueValues = new Set(responseValues);
    if (uniqueValues.size === 1) {
      indicators.push({
        type: 'response_pattern',
        severity: 'high',
        score: 0,
        message: 'All responses are identical',
        recommendation: 'Review with patient - may indicate response bias or misunderstanding'
      });
    }

    // Check for excessive uniformity (very few unique values)
    const uniqueRatio = uniqueValues.size / responseValues.length;
    if (uniqueRatio < 0.3 && responseValues.length > 10) {
      indicators.push({
        type: 'response_pattern',
        severity: 'medium',
        score: 25,
        message: 'Low response variability',
        recommendation: 'Consider discussing response options with patient'
      });
    }

    // Check for timing patterns (if duration data available)
    const timings = Object.values(this.responses)
      .map(r => r.duration)
      .filter(d => d !== undefined) as number[];
    
    if (timings.length > 5) {
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const tooFast = timings.filter(t => t < 2).length; // Less than 2 seconds
      
      if (tooFast > timings.length * 0.5) {
        indicators.push({
          type: 'timing',
          severity: 'medium',
          score: 40,
          message: 'Many responses completed very quickly',
          recommendation: 'Verify patient understood instructions and questions'
        });
      }
    }

    return indicators;
  }

  /**
   * Business logic: Calculate overall validity score
   */
  private calculateValidityScore(indicators: ValidityIndicator[]): number {
    if (indicators.length === 0) {
      return 100; // Perfect validity if no issues found
    }

    // Weight indicators by severity
    let totalWeight = 0;
    let weightedScore = 0;

    indicators.forEach(indicator => {
      const weight = indicator.severity === 'high' ? 3 : indicator.severity === 'medium' ? 2 : 1;
      totalWeight += weight;
      weightedScore += indicator.score * weight;
    });

    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Business logic: Get assessment priority based on various factors
   */
  getAssessmentPriority(): { level: 'high' | 'medium' | 'low'; reasons: string[] } {
    const reasons: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'low';

    // High priority if incomplete and old
    if (this.canBeContinued() && this.startedAt) {
      const daysSinceStart = (Date.now() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceStart > 7) {
        priority = 'high';
        reasons.push('Assessment started over a week ago');
      } else if (daysSinceStart > 2) {
        priority = 'medium';
        reasons.push('Assessment started several days ago');
      }
    }

    // High priority if nearly complete
    if (this.status === 'in_progress') {
      const responseCount = Object.keys(this.responses).length;
      if (responseCount > 0) {
        reasons.push(`${responseCount} items already completed`);
        if (responseCount > 10) {
          priority = priority === 'low' ? 'medium' : priority;
        }
      }
    }

    // Low validity score increases priority
    if (this.validityScore !== undefined && this.validityScore < 50) {
      priority = 'high';
      reasons.push('Low validity score - may need review');
    }

    if (reasons.length === 0) {
      reasons.push('Assessment is progressing normally');
    }

    return { level: priority, reasons };
  }

  /**
   * Business logic: Check if assessment needs attention
   */
  needsAttention(): { needs: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.isExpired()) {
      issues.push('Assessment has been idle too long');
    }

    if (this.status === 'in_progress' && this.startedAt) {
      const daysSinceStart = (Date.now() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceStart > 14) {
        issues.push('Assessment has been in progress for over 2 weeks');
      }
    }

    if (this.validityScore !== undefined && this.validityScore < 30) {
      issues.push('Very low validity score');
    }

    const patternIndicators = this.analyzeResponsePatterns();
    const highSeverityIssues = patternIndicators.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      issues.push('High-severity validity issues detected');
    }

    return {
      needs: issues.length > 0,
      issues
    };
  }

  /**
   * Business logic: Generate assessment summary
   */
  getSummary(): {
    id: string;
    status: AssessmentStatus;
    completionPercentage: number;
    durationMinutes: number | null;
    responseCount: number;
    validityScore: number | null;
    hasIssues: boolean;
    priority: 'high' | 'medium' | 'low';
  } {
    const responseCount = Object.keys(this.responses).length;
    const { needs: hasIssues } = this.needsAttention();
    const { level: priority } = this.getAssessmentPriority();

    return {
      id: this.id,
      status: this.status,
      completionPercentage: responseCount > 0 ? Math.round((responseCount / (this.scoringResults?.completionPercentage || 1)) * 100) : 0,
      durationMinutes: this.getDurationMinutes(),
      responseCount,
      validityScore: this.validityScore || null,
      hasIssues,
      priority
    };
  }
}