/**
 * Scale Repository Interface
 * Data access contract for scales - Repository Pattern
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Scale } from '../entities/Scale';
import { ScaleRegistry } from '../entities/ScaleRegistry';

export interface ScaleFilters {
  category?: string;
  difficulty?: string;
  administrationMode?: string;
  targetPopulation?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  professionalLevel?: string[];
  language?: string;
  tags?: string[];
}

export interface ScaleRepository {
  /**
   * Find scale by ID
   */
  findById(id: string): Promise<Scale | undefined>;

  /**
   * Find all scales with optional filters
   */
  findAll(filters?: ScaleFilters): Promise<Scale[]>;

  /**
   * Search scales by query string
   */
  search(query: string, filters?: ScaleFilters): Promise<Scale[]>;

  /**
   * Get scale with full template data for assessments
   */
  getScaleTemplate(id: string): Promise<Scale | undefined>;

  /**
   * Get scales by category
   */
  findByCategory(category: string): Promise<Scale[]>;

  /**
   * Get featured scales
   */
  getFeaturedScales(limit?: number): Promise<Scale[]>;

  /**
   * Get popular scales
   */
  getPopularScales(limit?: number): Promise<Scale[]>;

  /**
   * Check if scale exists and is active
   */
  existsAndActive(id: string): Promise<boolean>;

  /**
   * Get scales appropriate for user level
   */
  getScalesForUserLevel(
    userLevel: string,
    userExperience?: 'beginner' | 'intermediate' | 'expert'
  ): Promise<Scale[]>;
}