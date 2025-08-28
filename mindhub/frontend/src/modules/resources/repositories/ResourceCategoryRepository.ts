/**
 * ResourceCategory Repository Interface
 * Data access abstraction for ResourceCategory entities in Resources module
 */

import { ResourceCategory, CategoryStatus, CategoryAccess } from '../entities/ResourceCategory';

export interface CategorySearchFilters {
  clinicId?: string;
  workspaceId?: string;
  status?: CategoryStatus;
  access?: CategoryAccess;
  parentId?: string;
  level?: number;
  includeSystemCategories?: boolean;
}

export interface CategoryTreeNode {
  category: ResourceCategory;
  children: CategoryTreeNode[];
  resourceCount: number;
  totalResourceCount: number; // including subcategories
}

export interface CategoryUsageStats {
  categoryId: string;
  categoryName: string;
  resourceCount: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  averageRating: number;
  lastActivity: Date;
  growth: {
    resources: number; // percentage change
    views: number;
    downloads: number;
  };
}

export interface ResourceCategoryRepository {
  /**
   * Find category by ID
   */
  findById(id: string): Promise<ResourceCategory | undefined>;

  /**
   * Find category by slug
   */
  findBySlug(slug: string, filters?: CategorySearchFilters): Promise<ResourceCategory | undefined>;

  /**
   * Find all categories with optional filters
   */
  findAll(filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find root categories (level 0)
   */
  findRootCategories(filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find subcategories of a parent category
   */
  findSubcategories(parentId: string, filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find categories by level
   */
  findByLevel(level: number, filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find categories by status
   */
  findByStatus(status: CategoryStatus, filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find system categories
   */
  findSystemCategories(filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find template categories
   */
  findTemplateCategories(filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Find featured categories
   */
  findFeatured(filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Search categories by name or description
   */
  search(query: string, filters?: CategorySearchFilters): Promise<ResourceCategory[]>;

  /**
   * Get category tree structure
   */
  getCategoryTree(filters?: CategorySearchFilters): Promise<CategoryTreeNode[]>;

  /**
   * Get category hierarchy path
   */
  getCategoryPath(categoryId: string): Promise<ResourceCategory[]>;

  /**
   * Get category breadcrumb
   */
  getBreadcrumb(categoryId: string): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    level: number;
  }>>;

  /**
   * Create new category
   */
  create(category: ResourceCategory): Promise<ResourceCategory>;

  /**
   * Update existing category
   */
  update(category: ResourceCategory): Promise<ResourceCategory>;

  /**
   * Delete category (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Restore deleted category
   */
  restore(id: string): Promise<ResourceCategory>;

  /**
   * Permanently delete category
   */
  permanentDelete(id: string): Promise<void>;

  /**
   * Move category to new parent
   */
  moveToParent(categoryId: string, newParentId: string | null, movedBy: string): Promise<ResourceCategory>;

  /**
   * Reorder categories within same parent
   */
  reorderCategories(parentId: string | null, categoryIds: string[]): Promise<ResourceCategory[]>;

  /**
   * Bulk update category status
   */
  bulkUpdateStatus(
    categoryIds: string[],
    status: CategoryStatus,
    updatedBy: string
  ): Promise<ResourceCategory[]>;

  /**
   * Bulk update category access
   */
  bulkUpdateAccess(
    categoryIds: string[],
    access: CategoryAccess,
    updatedBy: string
  ): Promise<ResourceCategory[]>;

  /**
   * Merge categories
   */
  mergeCategories(
    sourceCategoryIds: string[],
    targetCategoryId: string,
    mergedBy: string
  ): Promise<{
    targetCategory: ResourceCategory;
    movedResourcesCount: number;
    mergedCategoriesCount: number;
  }>;

  /**
   * Duplicate category structure
   */
  duplicateCategory(
    categoryId: string,
    newName: string,
    newSlug: string,
    duplicatedBy: string,
    includeSubcategories?: boolean
  ): Promise<ResourceCategory>;

  /**
   * Get category statistics
   */
  getStatistics(filters?: CategorySearchFilters): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    archivedCategories: number;
    systemCategories: number;
    templateCategories: number;
    featuredCategories: number;
    averageResourcesPerCategory: number;
    maxCategoryDepth: number;
    categoriesWithoutResources: number;
    levelDistribution: { [level: number]: number };
  }>;

  /**
   * Get category usage analytics
   */
  getUsageAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: CategorySearchFilters
  ): Promise<CategoryUsageStats[]>;

  /**
   * Get trending categories
   */
  getTrendingCategories(
    period: 'day' | 'week' | 'month',
    limit: number,
    filters?: CategorySearchFilters
  ): Promise<ResourceCategory[]>;

  /**
   * Get categories with most resources
   */
  getMostPopulatedCategories(
    limit: number,
    filters?: CategorySearchFilters
  ): Promise<ResourceCategory[]>;

  /**
   * Get categories with recent activity
   */
  getRecentlyActiveCategories(
    limit: number,
    filters?: CategorySearchFilters
  ): Promise<ResourceCategory[]>;

  /**
   * Validate category hierarchy
   */
  validateHierarchy(categoryId: string, newParentId: string | null): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Check slug availability
   */
  isSlugAvailable(slug: string, excludeCategoryId?: string): Promise<boolean>;

  /**
   * Generate unique slug
   */
  generateUniqueSlug(baseName: string, excludeCategoryId?: string): Promise<string>;

  /**
   * Rebuild category tree
   */
  rebuildCategoryTree(): Promise<{
    rebuilt: number;
    errors: string[];
  }>;

  /**
   * Export category structure
   */
  exportCategoryStructure(
    format: 'json' | 'csv' | 'xml',
    includeStatistics: boolean
  ): Promise<{
    downloadUrl: string;
    filename: string;
    size: number;
  }>;

  /**
   * Import category structure
   */
  importCategoryStructure(
    file: File,
    format: 'json' | 'csv' | 'xml',
    importedBy: string,
    options: {
      overwriteExisting: boolean;
      preserveIds: boolean;
      createMissing: boolean;
    }
  ): Promise<{
    importId: string;
    totalCategories: number;
    successCount: number;
    errorCount: number;
    warnings: string[];
    errors: Array<{
      category: string;
      field: string;
      message: string;
    }>;
  }>;

  /**
   * Get category permissions for user
   */
  getCategoryPermissions(
    categoryId: string,
    userId: string,
    userRole: 'professional' | 'patient'
  ): Promise<{
    canView: boolean;
    canUpload: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
    restrictions: string[];
  }>;

  /**
   * Get recommended categories for resource
   */
  getRecommendedCategories(
    resourceTitle: string,
    resourceDescription: string,
    resourceTags: string[],
    limit: number
  ): Promise<Array<{
    category: ResourceCategory;
    score: number;
    reason: string;
  }>>;

  /**
   * Optimize category structure
   */
  optimizeCategoryStructure(): Promise<{
    optimizationId: string;
    recommendations: Array<{
      type: 'merge' | 'split' | 'move' | 'delete';
      categoryId: string;
      categoryName: string;
      reason: string;
      impact: 'low' | 'medium' | 'high';
      suggestedAction: string;
    }>;
  }>;

  /**
   * Get category health report
   */
  getCategoryHealthReport(): Promise<{
    totalCategories: number;
    healthyCategories: number;
    categoriesNeedingAttention: Array<{
      categoryId: string;
      categoryName: string;
      issues: string[];
      severity: 'low' | 'medium' | 'high';
      recommendations: string[];
    }>;
    orphanedCategories: ResourceCategory[];
    emptyCategories: ResourceCategory[];
    duplicateCategories: Array<{
      categories: ResourceCategory[];
      similarity: number;
    }>;
  }>;
}