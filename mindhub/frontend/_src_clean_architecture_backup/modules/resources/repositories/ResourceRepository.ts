/**
 * Resource Repository Interface
 * Data access abstraction for Resource entities in Resources module
 */

import { Resource, ResourceType, ResourceStatus, ResourceAccess } from '../entities/Resource';

export interface ResourceSearchFilters {
  clinicId?: string;
  workspaceId?: string;
  categoryId?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  access?: ResourceAccess;
  tags?: string[];
  targetAudience?: string[];
  includeExpired?: boolean;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ResourceAnalyticsData {
  resourceId: string;
  date: Date;
  views: number;
  downloads: number;
  shares: number;
  uniqueUsers: number;
  averageViewTime: number;
  bounceRate: number;
  conversionRate: number;
  topReferrers: string[];
  topDevices: string[];
  geographicData: { [country: string]: number };
}

export interface ResourceRepository {
  /**
   * Find resource by ID
   */
  findById(id: string): Promise<Resource | undefined>;

  /**
   * Find all resources with optional filters
   */
  findAll(filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Search resources by query string
   */
  search(query: string, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources by category
   */
  findByCategory(categoryId: string, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources by type
   */
  findByType(type: ResourceType, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources by status
   */
  findByStatus(status: ResourceStatus, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources by tags
   */
  findByTags(tags: string[], filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find featured resources
   */
  findFeatured(filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find popular resources (by views/downloads/shares)
   */
  findPopular(limit: number, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find recent resources
   */
  findRecent(limit: number, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources by target audience
   */
  findByTargetAudience(audience: string[], filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources created by user
   */
  findByCreator(creatorId: string, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find templates
   */
  findTemplates(filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Find resources similar to given resource
   */
  findSimilar(resourceId: string, limit: number): Promise<Resource[]>;

  /**
   * Find resources expiring soon
   */
  findExpiringSoon(days: number, filters?: ResourceSearchFilters): Promise<Resource[]>;

  /**
   * Create new resource
   */
  create(resource: Resource): Promise<Resource>;

  /**
   * Update existing resource
   */
  update(resource: Resource): Promise<Resource>;

  /**
   * Delete resource (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Restore deleted resource
   */
  restore(id: string): Promise<Resource>;

  /**
   * Permanently delete resource
   */
  permanentDelete(id: string): Promise<void>;

  /**
   * Bulk update resource status
   */
  bulkUpdateStatus(
    resourceIds: string[],
    status: ResourceStatus,
    updatedBy: string
  ): Promise<Resource[]>;

  /**
   * Bulk update resource category
   */
  bulkUpdateCategory(
    resourceIds: string[],
    categoryId: string,
    updatedBy: string
  ): Promise<Resource[]>;

  /**
   * Bulk delete resources
   */
  bulkDelete(resourceIds: string[], deletedBy: string): Promise<void>;

  /**
   * Get resource statistics
   */
  getStatistics(filters?: ResourceSearchFilters): Promise<{
    totalResources: number;
    publishedResources: number;
    draftResources: number;
    archivedResources: number;
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
    averageRating: number;
    typeDistribution: { [type: string]: number };
    categoryDistribution: { [categoryId: string]: number };
    statusDistribution: { [status: string]: number };
    monthlyGrowth: number;
    storageUsed: number; // in MB
  }>;

  /**
   * Get resource analytics data
   */
  getAnalytics(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ResourceAnalyticsData[]>;

  /**
   * Get trending resources
   */
  getTrending(
    period: 'day' | 'week' | 'month',
    limit: number,
    filters?: ResourceSearchFilters
  ): Promise<Resource[]>;

  /**
   * Get resource performance metrics
   */
  getPerformanceMetrics(
    resourceIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    resourceId: string;
    title: string;
    views: number;
    downloads: number;
    shares: number;
    rating: number;
    engagement: number;
    conversionRate: number;
    popularityScore: number;
  }[]>;

  /**
   * Get content recommendations for user
   */
  getRecommendations(
    userId: string,
    userType: 'professional' | 'patient',
    limit: number
  ): Promise<Resource[]>;

  /**
   * Search resources with advanced filters
   */
  advancedSearch(criteria: {
    query?: string;
    filters?: ResourceSearchFilters;
    sortBy?: 'relevance' | 'date' | 'views' | 'downloads' | 'rating' | 'title';
    sortOrder?: 'asc' | 'desc';
    facets?: ('type' | 'category' | 'tags' | 'audience' | 'rating')[];
    limit?: number;
    offset?: number;
  }): Promise<{
    resources: Resource[];
    total: number;
    facets: {
      [facetName: string]: { value: string; count: number }[];
    };
  }>;

  /**
   * Validate resource upload
   */
  validateUpload(
    file: File,
    categoryId: string,
    userId: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedProcessingTime: number;
  }>;

  /**
   * Process uploaded resource
   */
  processUpload(
    file: File,
    metadata: {
      title: string;
      description: string;
      categoryId: string;
      tags: string[];
      targetAudience: string[];
      access: ResourceAccess;
    },
    uploadedBy: string
  ): Promise<{
    resourceId: string;
    processingStatus: 'processing' | 'completed' | 'failed';
    previewUrls: string[];
  }>;

  /**
   * Get upload progress
   */
  getUploadProgress(uploadId: string): Promise<{
    progress: number; // 0-100
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    estimatedTimeRemaining: number; // seconds
    currentStep: string;
  }>;

  /**
   * Export resources data
   */
  exportData(
    filters: ResourceSearchFilters,
    format: 'csv' | 'json' | 'xlsx',
    includeAnalytics: boolean
  ): Promise<{
    downloadUrl: string;
    filename: string;
    size: number;
    recordCount: number;
  }>;

  /**
   * Import resources from file
   */
  importResources(
    file: File,
    mapping: { [csvColumn: string]: string },
    importedBy: string
  ): Promise<{
    importId: string;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
  }>;

  /**
   * Get resource usage analytics
   */
  getUsageAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: ResourceSearchFilters
  ): Promise<{
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
    uniqueUsers: number;
    topResources: Array<{
      resourceId: string;
      title: string;
      views: number;
      downloads: number;
      shares: number;
    }>;
    dailyStats: Array<{
      date: Date;
      views: number;
      downloads: number;
      shares: number;
    }>;
    userEngagement: {
      averageSessionDuration: number;
      bounceRate: number;
      returnUserRate: number;
    };
  }>;

  /**
   * Get storage usage information
   */
  getStorageUsage(filters?: ResourceSearchFilters): Promise<{
    totalSize: number; // in MB
    usedSize: number; // in MB
    availableSize: number; // in MB
    fileDistribution: { [type: string]: { count: number; size: number } };
    largestFiles: Array<{
      resourceId: string;
      title: string;
      size: number;
      type: string;
    }>;
  }>;

  /**
   * Optimize resource storage
   */
  optimizeStorage(options: {
    compressImages: boolean;
    generateThumbnails: boolean;
    removeUnusedVersions: boolean;
  }): Promise<{
    optimizationId: string;
    estimatedSavings: number; // in MB
    affectedResources: string[];
  }>;
}