/**
 * Get Scale Catalog Use Case
 * Application business rules for scale catalog management and search
 */

import { ScaleRegistry } from '../entities/ScaleRegistry';
import { ScaleCategory, DifficultyLevel, AdministrationMode } from '../entities/Scale';
import { ScaleRegistryRepository } from '../repositories/ScaleRegistryRepository';

export interface GetScaleCatalogRequest {
  query?: string;
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
  sortBy?: 'relevance' | 'name' | 'popularity' | 'rating' | 'recent';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
  userLevel?: string; // For filtering appropriate scales
  userExperience?: 'beginner' | 'intermediate' | 'expert';
}

export interface GetScaleCatalogResponse {
  scales: ScaleRegistry[];
  totalCount: number;
  facets: {
    categories: Array<{ category: ScaleCategory; count: number }>;
    difficulties: Array<{ difficulty: DifficultyLevel; count: number }>;
    administrationModes: Array<{ mode: AdministrationMode; count: number }>;
    targetPopulations: Array<{ population: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
  recommendations?: ScaleRegistry[];
  warnings?: string[];
}

export class GetScaleCatalogUseCase {
  constructor(
    private scaleRegistryRepository: ScaleRegistryRepository
  ) {}

  async execute(request: GetScaleCatalogRequest = {}): Promise<GetScaleCatalogResponse> {
    // Business rule: Set defaults
    const limit = Math.min(request.limit || 50, 100); // Max 100 scales per request
    const offset = Math.max(request.offset || 0, 0);
    const sortBy = request.sortBy || 'relevance';
    const sortOrder = request.sortOrder || 'desc';

    // Business rule: Get all scales matching filters
    let allScales = await this.scaleRegistryRepository.findAll({
      includeInactive: request.includeInactive || false
    });

    // Business rule: Filter scales based on user access level
    allScales = this.filterByUserAccess(allScales, request.userLevel, request.userExperience);

    // Business rule: Apply search filters
    let filteredScales = this.applyFilters(allScales, request);

    // Business rule: Calculate relevance scores if needed
    let relevanceScores: Map<string, number> = new Map();
    if (sortBy === 'relevance') {
      filteredScales.forEach(scale => {
        relevanceScores.set(scale.id, scale.calculateRelevanceScore(request.query));
      });
    }

    // Business rule: Sort scales
    const sortedScales = this.sortScales(filteredScales, sortBy, sortOrder, relevanceScores);

    // Business rule: Apply pagination
    const paginatedScales = sortedScales.slice(offset, offset + limit);

    // Business rule: Generate facets for filtering UI
    const facets = this.generateFacets(filteredScales);

    // Business rule: Generate recommendations if user context available
    const recommendations = request.userLevel 
      ? await this.generateRecommendations(request.userLevel, allScales, request.userExperience)
      : undefined;

    // Business rule: Generate warnings for user
    const warnings = this.generateWarnings(request, filteredScales.length);

    // Business rule: Log catalog access for analytics
    await this.logCatalogAccess(request, filteredScales.length);

    return {
      scales: paginatedScales,
      totalCount: filteredScales.length,
      facets,
      recommendations,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Business rule: Filter scales based on user access level and experience
   */
  private filterByUserAccess(
    scales: ScaleRegistry[], 
    userLevel?: string, 
    userExperience?: 'beginner' | 'intermediate' | 'expert'
  ): ScaleRegistry[] {
    if (!userLevel) return scales;

    return scales.filter(scale => {
      // Check if scale is appropriate for user level
      const appropriateness = scale.isAppropriateForUserLevel(userLevel, userExperience);
      
      // For beginners, filter out inappropriate scales entirely
      if (userExperience === 'beginner' && !appropriateness.appropriate) {
        return false;
      }

      // For others, include with warnings
      return true;
    });
  }

  /**
   * Business rule: Apply comprehensive filters
   */
  private applyFilters(scales: ScaleRegistry[], request: GetScaleCatalogRequest): ScaleRegistry[] {
    let filtered = scales;

    // Search query filter
    if (request.query?.trim()) {
      filtered = filtered.filter(scale => scale.matchesSearchQuery(request.query!));
    }

    // Apply structured filters using ScaleRegistry entity logic
    filtered = filtered.filter(scale => scale.matchesFilters({
      category: request.category,
      difficulty: request.difficulty,
      administrationMode: request.administrationMode,
      targetPopulation: request.targetPopulation,
      minItems: request.minItems,
      maxItems: request.maxItems,
      maxDuration: request.maxDuration,
      hasSubscales: request.hasSubscales,
      isFeatured: request.isFeatured,
      isPublic: request.isPublic,
      minRating: request.minRating,
      professionalLevel: request.professionalLevel,
      language: request.language,
      tags: request.tags
    }));

    return filtered;
  }

  /**
   * Business rule: Sort scales by specified criteria
   */
  private sortScales(
    scales: ScaleRegistry[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc',
    relevanceScores?: Map<string, number>
  ): ScaleRegistry[] {
    const sorted = [...scales].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          if (relevanceScores) {
            const scoreA = relevanceScores.get(a.id) || 0;
            const scoreB = relevanceScores.get(b.id) || 0;
            comparison = scoreB - scoreA;
          }
          break;

        case 'name':
          comparison = a.name.localeCompare(b.name, 'es');
          break;

        case 'popularity':
          comparison = b.popularity - a.popularity;
          break;

        case 'rating':
          comparison = b.rating - a.rating;
          break;

        case 'recent':
          const dateA = a.lastUpdated || a.createdAt || new Date(0);
          const dateB = b.lastUpdated || b.createdAt || new Date(0);
          comparison = dateB.getTime() - dateA.getTime();
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Business rule: Generate facets for filtering interface
   */
  private generateFacets(scales: ScaleRegistry[]): {
    categories: Array<{ category: ScaleCategory; count: number }>;
    difficulties: Array<{ difficulty: DifficultyLevel; count: number }>;
    administrationModes: Array<{ mode: AdministrationMode; count: number }>;
    targetPopulations: Array<{ population: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  } {
    const categoryMap = new Map<ScaleCategory, number>();
    const difficultyMap = new Map<DifficultyLevel, number>();
    const modeMap = new Map<AdministrationMode, number>();
    const populationMap = new Map<string, number>();
    const languageMap = new Map<string, number>();
    const tagMap = new Map<string, number>();

    scales.forEach(scale => {
      // Count categories
      categoryMap.set(scale.category, (categoryMap.get(scale.category) || 0) + 1);
      
      // Count difficulties
      difficultyMap.set(scale.difficulty, (difficultyMap.get(scale.difficulty) || 0) + 1);
      
      // Count administration modes
      modeMap.set(scale.administrationMode, (modeMap.get(scale.administrationMode) || 0) + 1);
      
      // Count target populations
      populationMap.set(scale.targetPopulation, (populationMap.get(scale.targetPopulation) || 0) + 1);
      
      // Count languages
      languageMap.set(scale.language, (languageMap.get(scale.language) || 0) + 1);
      
      // Count tags
      scale.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    return {
      categories: Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      
      difficulties: Array.from(difficultyMap.entries())
        .map(([difficulty, count]) => ({ difficulty, count }))
        .sort((a, b) => b.count - a.count),
      
      administrationModes: Array.from(modeMap.entries())
        .map(([mode, count]) => ({ mode, count }))
        .sort((a, b) => b.count - a.count),
      
      targetPopulations: Array.from(populationMap.entries())
        .map(([population, count]) => ({ population, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 populations
      
      languages: Array.from(languageMap.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count),
      
      tags: Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Top 20 tags
    };
  }

  /**
   * Business rule: Generate personalized recommendations
   */
  private async generateRecommendations(
    userLevel: string,
    allScales: ScaleRegistry[],
    userExperience?: 'beginner' | 'intermediate' | 'expert'
  ): Promise<ScaleRegistry[]> {
    // Get user's recent usage patterns
    // TODO: Implement user activity tracking
    // const recentUsage = await this.userActivityRepository.getRecentScaleUsage(userLevel);
    
    let recommendedScales: ScaleRegistry[] = [];

    // Business rule: Recommend featured scales appropriate for user level
    const featuredScales = allScales
      .filter(scale => scale.isFeatured && scale.isAppropriateForUserLevel(userLevel, userExperience).appropriate)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3);

    recommendedScales.push(...featuredScales);

    // Business rule: Recommend popular scales in user's likely areas of interest
    if (userExperience === 'beginner') {
      const beginnerFriendly = allScales
        .filter(scale => 
          scale.difficulty === 'beginner' && 
          scale.getComplexityLevel() === 'simple' &&
          scale.rating >= 4.0
        )
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 2);

      recommendedScales.push(...beginnerFriendly);
    }

    // Business rule: Recommend highly rated scales
    const highlyRated = allScales
      .filter(scale => 
        scale.rating >= 4.5 && 
        scale.ratingCount >= 10 &&
        !recommendedScales.includes(scale)
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);

    recommendedScales.push(...highlyRated);

    // Remove duplicates and limit
    const uniqueRecommendations = Array.from(new Set(recommendedScales)).slice(0, 5);

    return uniqueRecommendations;
  }

  /**
   * Business rule: Generate warnings and notices for user
   */
  private generateWarnings(request: GetScaleCatalogRequest, resultCount: number): string[] {
    const warnings: string[] = [];

    // No results warning
    if (resultCount === 0) {
      if (request.query) {
        warnings.push(`No scales found matching "${request.query}". Try broadening your search terms.`);
      } else {
        warnings.push('No scales match your current filters. Try adjusting your criteria.');
      }
    }

    // Limited results warning
    if (request.professionalLevel && request.professionalLevel.length > 0 && resultCount < 5) {
      warnings.push('Limited scales available for your professional level. Consider expanding your qualifications or seeking additional training.');
    }

    // Experience level warning
    if (request.userExperience === 'beginner' && resultCount > 20) {
      warnings.push('Many scales are available. As a beginner, consider starting with featured scales or those marked as simple complexity.');
    }

    // Complex search warning
    const filterCount = Object.values(request).filter(v => v !== undefined && v !== null && v !== '').length;
    if (filterCount > 5 && resultCount < 10) {
      warnings.push('Your search has many filters applied. Try removing some criteria to see more results.');
    }

    return warnings;
  }

  /**
   * Business rule: Log catalog access for analytics and usage tracking
   */
  private async logCatalogAccess(request: GetScaleCatalogRequest, resultCount: number): Promise<void> {
    try {
      const accessLog = {
        action: 'catalog_accessed',
        query: request.query,
        filters: {
          category: request.category,
          difficulty: request.difficulty,
          administrationMode: request.administrationMode
        },
        resultCount,
        userLevel: request.userLevel,
        userExperience: request.userExperience,
        timestamp: new Date()
      };

      console.log('Catalog access logged:', accessLog);
      // await this.analyticsRepository.log(accessLog);
    } catch (error) {
      console.warn('Failed to log catalog access:', error);
    }
  }
}