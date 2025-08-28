/**
 * Scale Registry Repository Interface
 * Data access contract for scale catalog - Repository Pattern
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { ScaleRegistry } from '../entities/ScaleRegistry';

export interface ScaleRegistryFilters {
  includeInactive?: boolean;
  category?: string;
  difficulty?: string;
  administrationMode?: string;
  targetPopulation?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  minRating?: number;
  professionalLevel?: string[];
  language?: string;
  tags?: string[];
}

export interface ScaleRegistryRepository {
  /**
   * Find all scales in registry with optional filters
   */
  findAll(filters?: ScaleRegistryFilters): Promise<ScaleRegistry[]>;

  /**
   * Find registry entry by scale ID
   */
  findById(id: string): Promise<ScaleRegistry | undefined>;

  /**
   * Find registry entry by template ID
   */
  findByTemplateId(templateId: string): Promise<ScaleRegistry | undefined>;

  /**
   * Search registry by query string
   */
  search(query: string, filters?: ScaleRegistryFilters): Promise<ScaleRegistry[]>;

  /**
   * Get scales by category with counts
   */
  getCategoryStats(): Promise<Array<{ category: string; count: number }>>;

  /**
   * Get popular tags with usage counts
   */
  getPopularTags(limit?: number): Promise<Array<{ tag: string; count: number }>>;

  /**
   * Update usage statistics for a scale
   */
  incrementUsage(id: string): Promise<void>;

  /**
   * Add rating to a scale
   */
  addRating(id: string, rating: number): Promise<void>;

  /**
   * Get user's recently used scales
   */
  getRecentlyUsed(userId: string, limit?: number): Promise<ScaleRegistry[]>;

  /**
   * Get user's favorite scales
   */
  getFavorites(userId: string): Promise<ScaleRegistry[]>;

  /**
   * Add scale to user's favorites
   */
  addToFavorites(userId: string, scaleId: string): Promise<void>;

  /**
   * Remove scale from user's favorites
   */
  removeFromFavorites(userId: string, scaleId: string): Promise<void>;
}