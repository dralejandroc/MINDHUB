/**
 * Scoring Service Adapter
 * External service for advanced scoring calculations
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Scale } from '../entities/Scale';

export interface AdvancedScoringResults {
  percentile?: number;
  tScore?: number;
  zScore?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;
  };
  normativeGroup?: string;
  demographicAdjustments?: Record<string, number>;
}

export class ScoringService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/clinimetrix-pro/django') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async calculateAdvancedScores(
    scale: Scale,
    totalScore: number,
    subscaleScores: Record<string, any>,
    demographics?: Record<string, any>
  ): Promise<AdvancedScoringResults> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scoring/advanced/`, {
        method: 'POST',
        body: JSON.stringify({
          scale_id: scale.id,
          total_score: totalScore,
          subscale_scores: subscaleScores,
          demographics: demographics || {}
        }),
      });

      const data = await response.json();
      return {
        percentile: data.percentile,
        tScore: data.t_score,
        zScore: data.z_score,
        confidenceInterval: data.confidence_interval,
        normativeGroup: data.normative_group,
        demographicAdjustments: data.demographic_adjustments
      };
    } catch (error) {
      console.warn('Advanced scoring failed, using fallback calculations:', error);
      return this.calculateFallbackScores(scale, totalScore, subscaleScores, demographics);
    }
  }

  async calculatePercentileScore(
    scale: Scale,
    totalScore: number,
    demographics?: Record<string, any>
  ): Promise<number | undefined> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scoring/percentile/`, {
        method: 'POST',
        body: JSON.stringify({
          scale_id: scale.id,
          total_score: totalScore,
          demographics: demographics || {}
        }),
      });

      const data = await response.json();
      return data.percentile;
    } catch (error) {
      console.warn('Percentile calculation failed:', error);
      return this.calculateFallbackPercentile(scale, totalScore);
    }
  }

  async getNormativeData(
    scaleId: string,
    demographics?: Record<string, any>
  ): Promise<{
    mean: number;
    standardDeviation: number;
    sampleSize: number;
    demographicGroup: string;
  } | null> {
    try {
      const params = new URLSearchParams({
        scale_id: scaleId
      });

      if (demographics) {
        Object.entries(demographics).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(`demo_${key}`, value.toString());
          }
        });
      }

      const response = await this.fetchWithAuth(`${this.baseUrl}/scoring/norms/?${params}`);
      const data = await response.json();
      
      return {
        mean: data.mean,
        standardDeviation: data.standard_deviation,
        sampleSize: data.sample_size,
        demographicGroup: data.demographic_group
      };
    } catch (error) {
      console.warn('Normative data retrieval failed:', error);
      return null;
    }
  }

  async validateScoreRange(
    scale: Scale,
    responses: Record<string, any>
  ): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scoring/validate/`, {
        method: 'POST',
        body: JSON.stringify({
          scale_id: scale.id,
          responses: responses
        }),
      });

      const data = await response.json();
      return {
        isValid: data.is_valid,
        warnings: data.warnings || [],
        errors: data.errors || []
      };
    } catch (error) {
      console.warn('Score validation failed, using fallback:', error);
      return this.fallbackValidation(scale, responses);
    }
  }

  // Fallback methods when external scoring service is unavailable
  private calculateFallbackScores(
    scale: Scale,
    totalScore: number,
    subscaleScores: Record<string, any>,
    demographics?: Record<string, any>
  ): AdvancedScoringResults {
    const results: AdvancedScoringResults = {};

    // Basic percentile calculation using scale range
    results.percentile = this.calculateFallbackPercentile(scale, totalScore);

    // Basic z-score calculation (assumes normal distribution)
    if (scale.norms && scale.norms.mean && scale.norms.standardDeviation) {
      results.zScore = (totalScore - scale.norms.mean) / scale.norms.standardDeviation;
      results.tScore = (results.zScore * 10) + 50;
    } else {
      // Fallback using scale midpoint as mean
      const midpoint = (scale.scoreRange.min + scale.scoreRange.max) / 2;
      const range = scale.scoreRange.max - scale.scoreRange.min;
      const estimatedSD = range / 6; // Rough estimate: 6 SDs cover the range
      
      results.zScore = (totalScore - midpoint) / estimatedSD;
      results.tScore = (results.zScore * 10) + 50;
    }

    return results;
  }

  private calculateFallbackPercentile(scale: Scale, totalScore: number): number {
    // Simple linear interpolation within scale range
    const { min, max } = scale.scoreRange;
    const percentage = (totalScore - min) / (max - min);
    return Math.max(0, Math.min(100, percentage * 100));
  }

  private fallbackValidation(
    scale: Scale,
    responses: Record<string, any>
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let isValid = true;

    // Check if all required items have responses
    scale.items.forEach(item => {
      if (item.required && (responses[item.number] === undefined || responses[item.number] === null)) {
        errors.push(`Item ${item.number} is required but has no response`);
        isValid = false;
      }
    });

    // Check response values are within valid range
    Object.entries(responses).forEach(([itemNumber, value]) => {
      const item = scale.items.find(i => i.number.toString() === itemNumber);
      if (item && item.options) {
        const validValues = item.options.map(opt => opt.value);
        if (!validValues.includes(value)) {
          errors.push(`Invalid value ${value} for item ${itemNumber}`);
          isValid = false;
        }
      }
    });

    // Check completion percentage
    const responseCount = Object.keys(responses).length;
    const totalItems = scale.items.length;
    const completionRate = responseCount / totalItems;

    if (completionRate < 0.8) {
      warnings.push(`Only ${Math.round(completionRate * 100)}% of items completed`);
    }

    return { isValid, warnings, errors };
  }
}