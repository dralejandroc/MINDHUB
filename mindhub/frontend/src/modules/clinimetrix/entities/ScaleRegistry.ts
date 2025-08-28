/**
 * Scale Registry Entity
 * Core business logic for scale catalog management - Pure domain model
 * No external dependencies, framework-agnostic
 */

import { ScaleCategory, DifficultyLevel, AdministrationMode } from './Scale';

export interface ScaleMetadata {
  totalItems: number;
  scoreRangeMin: number;
  scoreRangeMax: number;
  estimatedDurationMinutes: number;
  hasSubscales: boolean;
  subscaleCount: number;
  responseFormat: string;
  scoringMethod: string;
}

export interface PsychometricProperties {
  reliability: Record<string, number>; // e.g., { "cronbachAlpha": 0.95, "testRetest": 0.89 }
  validity: Record<string, number>; // e.g., { "construct": 0.87, "criterion": 0.82 }
  norms: Record<string, any>; // Normative data
}

export class ScaleRegistry {
  constructor(
    public readonly id: string,
    public readonly templateId: string,
    public readonly name: string,
    public readonly abbreviation: string,
    public readonly description: string,
    public readonly category: ScaleCategory,
    public readonly targetPopulation: string,
    public readonly administrationTime: string,
    public readonly professionalLevel: string[],
    public readonly administrationMode: AdministrationMode,
    public readonly difficulty: DifficultyLevel,
    public readonly keywords: string[] = [],
    public readonly authors: string[] = [],
    public readonly year: number,
    public readonly language: string = 'es',
    public readonly version: string = '1.0',
    public readonly isFeatured: boolean = false,
    public readonly isPublic: boolean = true,
    public readonly isActive: boolean = true,
    public readonly popularity: number = 0,
    public readonly usageCount: number = 0,
    public readonly rating: number = 0,
    public readonly ratingCount: number = 0,
    public readonly metadata: ScaleMetadata,
    public readonly psychometricProperties?: PsychometricProperties,
    public readonly tags: string[] = [],
    public readonly lastUpdated?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate registry entry
   */
  private validate(): void {
    // Business rule: Must have unique IDs
    if (!this.id.trim()) {
      throw new Error('Registry ID is required');
    }

    if (!this.templateId.trim()) {
      throw new Error('Template ID is required');
    }

    // Business rule: Must have name and abbreviation
    if (!this.name.trim()) {
      throw new Error('Scale name is required');
    }

    if (!this.abbreviation.trim()) {
      throw new Error('Scale abbreviation is required');
    }

    // Business rule: Year must be reasonable
    if (this.year < 1900 || this.year > new Date().getFullYear() + 5) {
      throw new Error('Publication year must be between 1900 and current year + 5');
    }

    // Business rule: Popularity and ratings must be non-negative
    if (this.popularity < 0) {
      throw new Error('Popularity score cannot be negative');
    }

    if (this.rating < 0 || this.rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    if (this.ratingCount < 0) {
      throw new Error('Rating count cannot be negative');
    }

    if (this.usageCount < 0) {
      throw new Error('Usage count cannot be negative');
    }

    // Business rule: Validate metadata
    if (this.metadata.totalItems <= 0) {
      throw new Error('Total items must be positive');
    }

    if (this.metadata.scoreRangeMin >= this.metadata.scoreRangeMax) {
      throw new Error('Score range minimum must be less than maximum');
    }

    if (this.metadata.estimatedDurationMinutes <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    if (this.metadata.subscaleCount < 0) {
      throw new Error('Subscale count cannot be negative');
    }

    if (this.metadata.hasSubscales && this.metadata.subscaleCount === 0) {
      throw new Error('Scale with subscales must have positive subscale count');
    }

    // Business rule: Validate psychometric properties if provided
    if (this.psychometricProperties) {
      Object.values(this.psychometricProperties.reliability).forEach(value => {
        if (value < 0 || value > 1) {
          throw new Error('Reliability coefficients must be between 0 and 1');
        }
      });

      Object.values(this.psychometricProperties.validity).forEach(value => {
        if (value < 0 || value > 1) {
          throw new Error('Validity coefficients must be between 0 and 1');
        }
      });
    }
  }

  /**
   * Business logic: Check if scale is searchable by query
   */
  matchesSearchQuery(query: string): boolean {
    if (!query.trim()) return true;

    const searchTerm = query.toLowerCase();
    
    // Search in basic fields
    if (this.name.toLowerCase().includes(searchTerm)) return true;
    if (this.abbreviation.toLowerCase().includes(searchTerm)) return true;
    if (this.description.toLowerCase().includes(searchTerm)) return true;
    if (this.category.toLowerCase().includes(searchTerm)) return true;
    if (this.targetPopulation.toLowerCase().includes(searchTerm)) return true;

    // Search in keywords and tags
    if (this.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))) return true;
    if (this.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;

    // Search in authors
    if (this.authors.some(author => author.toLowerCase().includes(searchTerm))) return true;

    return false;
  }

  /**
   * Business logic: Check if scale matches filters
   */
  matchesFilters(filters: {
    category?: ScaleCategory;
    difficulty?: DifficultyLevel;
    administrationMode?: AdministrationMode;
    targetPopulation?: string;
    minItems?: number;
    maxItems?: number;
    maxDuration?: number;
    hasSubscales?: boolean;
    isFeatured?: boolean;
    isPublic?: boolean;
    minRating?: number;
    professionalLevel?: string[];
    language?: string;
    tags?: string[];
  }): boolean {
    // Category filter
    if (filters.category && this.category !== filters.category) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty && this.difficulty !== filters.difficulty) {
      return false;
    }

    // Administration mode filter
    if (filters.administrationMode && this.administrationMode !== filters.administrationMode) {
      return false;
    }

    // Target population filter (partial match)
    if (filters.targetPopulation && !this.targetPopulation.toLowerCase().includes(filters.targetPopulation.toLowerCase())) {
      return false;
    }

    // Items count filters
    if (filters.minItems && this.metadata.totalItems < filters.minItems) {
      return false;
    }

    if (filters.maxItems && this.metadata.totalItems > filters.maxItems) {
      return false;
    }

    // Duration filter
    if (filters.maxDuration && this.metadata.estimatedDurationMinutes > filters.maxDuration) {
      return false;
    }

    // Subscales filter
    if (filters.hasSubscales !== undefined && this.metadata.hasSubscales !== filters.hasSubscales) {
      return false;
    }

    // Featured filter
    if (filters.isFeatured !== undefined && this.isFeatured !== filters.isFeatured) {
      return false;
    }

    // Public filter
    if (filters.isPublic !== undefined && this.isPublic !== filters.isPublic) {
      return false;
    }

    // Rating filter
    if (filters.minRating && this.rating < filters.minRating) {
      return false;
    }

    // Professional level filter
    if (filters.professionalLevel && filters.professionalLevel.length > 0) {
      const hasMatchingLevel = this.professionalLevel.some(level => 
        filters.professionalLevel!.includes(level)
      );
      if (!hasMatchingLevel) {
        return false;
      }
    }

    // Language filter
    if (filters.language && this.language !== filters.language) {
      return false;
    }

    // Tags filter (any matching tag)
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = this.tags.some(tag => 
        filters.tags!.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }

  /**
   * Business logic: Calculate relevance score for search ranking
   */
  calculateRelevanceScore(query?: string): number {
    let score = 0;

    // Base score from popularity and usage
    score += Math.min(this.popularity * 2, 20);
    score += Math.min(this.usageCount / 10, 15);
    score += Math.min(this.rating * 5, 25);

    // Featured scales get bonus
    if (this.isFeatured) {
      score += 15;
    }

    // Active scales get bonus
    if (this.isActive) {
      score += 10;
    } else {
      score -= 20; // Penalty for inactive scales
    }

    // Recent updates get small bonus
    if (this.lastUpdated) {
      const daysSinceUpdate = (Date.now() - this.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        score += 5;
      }
    }

    // Query-specific scoring
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      
      // Exact matches get highest bonus
      if (this.name.toLowerCase() === searchTerm || this.abbreviation.toLowerCase() === searchTerm) {
        score += 50;
      }
      // Partial matches in name/abbreviation get medium bonus
      else if (this.name.toLowerCase().includes(searchTerm) || this.abbreviation.toLowerCase().includes(searchTerm)) {
        score += 25;
      }
      // Matches in description get small bonus
      else if (this.description.toLowerCase().includes(searchTerm)) {
        score += 10;
      }
      // Matches in keywords/tags get small bonus
      else if (this.keywords.some(k => k.toLowerCase().includes(searchTerm)) || 
               this.tags.some(t => t.toLowerCase().includes(searchTerm))) {
        score += 5;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Business logic: Get scale complexity level
   */
  getComplexityLevel(): 'simple' | 'moderate' | 'complex' | 'advanced' {
    let complexityPoints = 0;

    // Points for number of items
    if (this.metadata.totalItems > 50) complexityPoints += 3;
    else if (this.metadata.totalItems > 30) complexityPoints += 2;
    else if (this.metadata.totalItems > 15) complexityPoints += 1;

    // Points for subscales
    if (this.metadata.hasSubscales) {
      complexityPoints += Math.min(this.metadata.subscaleCount, 3);
    }

    // Points for administration difficulty
    switch (this.difficulty) {
      case 'advanced':
        complexityPoints += 3;
        break;
      case 'intermediate':
        complexityPoints += 2;
        break;
      case 'beginner':
        complexityPoints += 0;
        break;
    }

    // Points for professional level requirements
    if (this.professionalLevel.includes('PhD') || this.professionalLevel.includes('Specialist')) {
      complexityPoints += 2;
    } else if (this.professionalLevel.includes('Masters') || this.professionalLevel.includes('Licensed')) {
      complexityPoints += 1;
    }

    // Points for administration mode
    if (this.administrationMode === 'professional') {
      complexityPoints += 1;
    }

    // Determine complexity level
    if (complexityPoints >= 8) return 'advanced';
    if (complexityPoints >= 5) return 'complex';
    if (complexityPoints >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * Business logic: Check if scale is appropriate for user level
   */
  isAppropriateForUserLevel(userLevel: string, userExperience?: 'beginner' | 'intermediate' | 'expert'): {
    appropriate: boolean;
    reasons: string[];
    requirements?: string[];
  } {
    const reasons: string[] = [];
    const requirements: string[] = [];
    let appropriate = true;

    // Check professional level requirements
    if (this.professionalLevel.length > 0) {
      const hasRequiredLevel = this.professionalLevel.some(level => 
        level.toLowerCase() === userLevel.toLowerCase()
      );

      if (!hasRequiredLevel) {
        appropriate = false;
        reasons.push(`Requires professional level: ${this.professionalLevel.join(', ')}`);
        requirements.push(`Professional qualification: ${this.professionalLevel.join(' or ')}`);
      }
    }

    // Check experience level vs difficulty
    if (userExperience) {
      const complexityLevel = this.getComplexityLevel();
      
      if (userExperience === 'beginner' && (complexityLevel === 'complex' || complexityLevel === 'advanced')) {
        reasons.push('This is an advanced scale that may require more experience');
        requirements.push('Consider gaining experience with simpler scales first');
      } else if (userExperience === 'intermediate' && complexityLevel === 'advanced') {
        reasons.push('This is a highly specialized scale requiring advanced expertise');
        requirements.push('Additional training or supervision may be recommended');
      }
    }

    // Check administration mode
    if (this.administrationMode === 'professional' && userLevel.toLowerCase().includes('student')) {
      reasons.push('Requires professional administration - supervision may be needed');
      requirements.push('Professional supervision required for administration');
    }

    if (appropriate && reasons.length === 0) {
      reasons.push('This scale is appropriate for your professional level');
    }

    return { appropriate, reasons, requirements: requirements.length > 0 ? requirements : undefined };
  }

  /**
   * Business logic: Get recommended preparation time
   */
  getRecommendedPreparationTime(): number {
    let prepTime = 5; // Base 5 minutes

    // Add time based on complexity
    const complexity = this.getComplexityLevel();
    switch (complexity) {
      case 'advanced':
        prepTime += 15;
        break;
      case 'complex':
        prepTime += 10;
        break;
      case 'moderate':
        prepTime += 5;
        break;
      case 'simple':
        prepTime += 2;
        break;
    }

    // Add time for subscales
    if (this.metadata.hasSubscales) {
      prepTime += this.metadata.subscaleCount * 2;
    }

    // Add time for professional administration
    if (this.administrationMode === 'professional') {
      prepTime += 5;
    }

    return prepTime;
  }

  /**
   * Business logic: Get total estimated time including preparation
   */
  getTotalEstimatedTime(): number {
    return this.metadata.estimatedDurationMinutes + this.getRecommendedPreparationTime();
  }

  /**
   * Business logic: Update usage statistics
   */
  incrementUsage(): ScaleRegistry {
    return new ScaleRegistry(
      this.id,
      this.templateId,
      this.name,
      this.abbreviation,
      this.description,
      this.category,
      this.targetPopulation,
      this.administrationTime,
      this.professionalLevel,
      this.administrationMode,
      this.difficulty,
      this.keywords,
      this.authors,
      this.year,
      this.language,
      this.version,
      this.isFeatured,
      this.isPublic,
      this.isActive,
      this.popularity + 1, // Increment popularity
      this.usageCount + 1, // Increment usage
      this.rating,
      this.ratingCount,
      this.metadata,
      this.psychometricProperties,
      this.tags,
      this.lastUpdated,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Business logic: Add rating
   */
  addRating(newRating: number): ScaleRegistry {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    const totalRatingPoints = (this.rating * this.ratingCount) + newRating;
    const newRatingCount = this.ratingCount + 1;
    const newAverageRating = totalRatingPoints / newRatingCount;

    return new ScaleRegistry(
      this.id,
      this.templateId,
      this.name,
      this.abbreviation,
      this.description,
      this.category,
      this.targetPopulation,
      this.administrationTime,
      this.professionalLevel,
      this.administrationMode,
      this.difficulty,
      this.keywords,
      this.authors,
      this.year,
      this.language,
      this.version,
      this.isFeatured,
      this.isPublic,
      this.isActive,
      this.popularity,
      this.usageCount,
      parseFloat(newAverageRating.toFixed(2)),
      newRatingCount,
      this.metadata,
      this.psychometricProperties,
      this.tags,
      this.lastUpdated,
      this.createdAt,
      new Date()
    );
  }
}