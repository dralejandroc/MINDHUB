/**
 * ResourceCategory Entity for Resources Module
 * Core business logic for resource categorization - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type CategoryStatus = 'active' | 'inactive' | 'archived';
export type CategoryAccess = 'public' | 'professional_only' | 'restricted';

export interface CategoryMetadata {
  description: string;
  keywords: string[];
  targetAudience: string[];
  specialization: string[];
  ageGroups: string[];
  conditions: string[];
}

export interface CategoryStatistics {
  totalResources: number;
  publishedResources: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  averageRating: number;
  lastActivity: Date;
  resourceTypes: {
    [type: string]: number;
  };
}

export interface CategorySettings {
  defaultAccess: CategoryAccess;
  requiresApproval: boolean;
  allowPatientAccess: boolean;
  maxResourcesPerUser: number;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
}

export class ResourceCategory {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string,
    public readonly parentId?: string,
    public readonly level: number = 0,
    public readonly status: CategoryStatus = 'active',
    public readonly access: CategoryAccess = 'public',
    public readonly metadata: CategoryMetadata = {
      description: '',
      keywords: [],
      targetAudience: [],
      specialization: [],
      ageGroups: [],
      conditions: []
    },
    public readonly settings: CategorySettings = {
      defaultAccess: 'public',
      requiresApproval: false,
      allowPatientAccess: true,
      maxResourcesPerUser: 100,
      allowedFileTypes: ['pdf', 'jpg', 'png', 'mp4', 'mp3'],
      maxFileSize: 50
    },
    public readonly icon: string = 'folder',
    public readonly color: string = '#6B7280',
    public readonly sortOrder: number = 0,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly statistics: CategoryStatistics = {
      totalResources: 0,
      publishedResources: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalShares: 0,
      averageRating: 0,
      lastActivity: new Date(),
      resourceTypes: {}
    },
    public readonly isSystemCategory: boolean = false,
    public readonly isTemplate: boolean = false,
    public readonly isFeatured: boolean = false,
    public readonly createdBy: string = '',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate category data
   */
  private validate(): void {
    if (!this.name.trim()) {
      throw new Error('Category name is required');
    }

    if (!this.slug.trim()) {
      throw new Error('Category slug is required');
    }

    // Business rule: Slug must be valid URL segment
    if (!/^[a-z0-9\-_]+$/.test(this.slug)) {
      throw new Error('Category slug must contain only lowercase letters, numbers, hyphens, and underscores');
    }

    // Business rule: Must belong to either clinic or workspace (unless system category)
    if (!this.isSystemCategory && !this.clinicId && !this.workspaceId) {
      throw new Error('Category must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Category cannot belong to both clinic and workspace');
    }

    // Business rule: Level validation
    if (this.level < 0 || this.level > 5) {
      throw new Error('Category level must be between 0 and 5');
    }

    // Business rule: Parent category validation
    if (this.level === 0 && this.parentId) {
      throw new Error('Root categories cannot have a parent');
    }

    if (this.level > 0 && !this.parentId) {
      throw new Error('Sub-categories must have a parent');
    }

    // Business rule: System categories cannot be deleted
    if (this.isSystemCategory && this.status === 'archived') {
      throw new Error('System categories cannot be archived');
    }
  }

  /**
   * Business logic: Check if category can be accessed by user
   */
  canBeAccessedBy(userRole: 'professional' | 'patient', userPermissions: string[] = []): boolean {
    if (this.status !== 'active') {
      return userRole === 'professional' && userPermissions.includes('manage_categories');
    }

    switch (this.access) {
      case 'public':
        return true;
      case 'professional_only':
        return userRole === 'professional';
      case 'restricted':
        return userRole === 'professional' && userPermissions.includes('access_restricted_categories');
      default:
        return false;
    }
  }

  /**
   * Business logic: Check if user can upload resources to this category
   */
  canUploadResources(userRole: 'professional' | 'patient', userPermissions: string[] = []): boolean {
    if (!this.canBeAccessedBy(userRole, userPermissions)) {
      return false;
    }

    if (this.status !== 'active') {
      return false;
    }

    // Business rule: Only professionals can upload to restricted categories
    if (this.access === 'restricted') {
      return userRole === 'professional' && userPermissions.includes('upload_restricted_resources');
    }

    // Business rule: Check patient access settings
    if (userRole === 'patient' && !this.settings.allowPatientAccess) {
      return false;
    }

    return true;
  }

  /**
   * Business logic: Check if file type is allowed
   */
  isFileTypeAllowed(fileType: string): boolean {
    return this.settings.allowedFileTypes.includes(fileType.toLowerCase());
  }

  /**
   * Business logic: Check if file size is within limits
   */
  isFileSizeAllowed(sizeInMB: number): boolean {
    return sizeInMB <= this.settings.maxFileSize;
  }

  /**
   * Business logic: Update statistics when resource is added
   */
  addResourceToStatistics(
    resourceType: string,
    isPublished: boolean = true
  ): ResourceCategory {
    const updatedResourceTypes = {
      ...this.statistics.resourceTypes,
      [resourceType]: (this.statistics.resourceTypes[resourceType] || 0) + 1
    };

    const updatedStatistics: CategoryStatistics = {
      ...this.statistics,
      totalResources: this.statistics.totalResources + 1,
      publishedResources: isPublished 
        ? this.statistics.publishedResources + 1 
        : this.statistics.publishedResources,
      lastActivity: new Date(),
      resourceTypes: updatedResourceTypes
    };

    return new ResourceCategory(
      this.id,
      this.name,
      this.slug,
      this.description,
      this.parentId,
      this.level,
      this.status,
      this.access,
      this.metadata,
      this.settings,
      this.icon,
      this.color,
      this.sortOrder,
      this.clinicId,
      this.workspaceId,
      updatedStatistics,
      this.isSystemCategory,
      this.isTemplate,
      this.isFeatured,
      this.createdBy,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Update statistics when resource is viewed/downloaded/shared
   */
  updateResourceActivity(
    views: number = 0,
    downloads: number = 0,
    shares: number = 0,
    rating?: number
  ): ResourceCategory {
    let newAverageRating = this.statistics.averageRating;

    if (rating !== undefined) {
      // Simple average update - in real implementation would track count
      newAverageRating = (this.statistics.averageRating + rating) / 2;
    }

    const updatedStatistics: CategoryStatistics = {
      ...this.statistics,
      totalViews: this.statistics.totalViews + views,
      totalDownloads: this.statistics.totalDownloads + downloads,
      totalShares: this.statistics.totalShares + shares,
      averageRating: newAverageRating,
      lastActivity: new Date()
    };

    return new ResourceCategory(
      this.id,
      this.name,
      this.slug,
      this.description,
      this.parentId,
      this.level,
      this.status,
      this.access,
      this.metadata,
      this.settings,
      this.icon,
      this.color,
      this.sortOrder,
      this.clinicId,
      this.workspaceId,
      updatedStatistics,
      this.isSystemCategory,
      this.isTemplate,
      this.isFeatured,
      this.createdBy,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Create subcategory
   */
  createSubcategory(
    id: string,
    name: string,
    slug: string,
    description: string,
    createdBy: string
  ): ResourceCategory {
    if (this.level >= 5) {
      throw new Error('Cannot create subcategory: Maximum nesting level reached');
    }

    if (this.status !== 'active') {
      throw new Error('Cannot create subcategory in inactive category');
    }

    return new ResourceCategory(
      id,
      name,
      slug,
      description,
      this.id,
      this.level + 1,
      'active',
      this.access, // Inherit parent access level
      {
        ...this.metadata,
        description
      },
      this.settings, // Inherit parent settings
      'folder',
      this.color,
      0,
      this.clinicId,
      this.workspaceId,
      {
        totalResources: 0,
        publishedResources: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalShares: 0,
        averageRating: 0,
        lastActivity: new Date(),
        resourceTypes: {}
      },
      false,
      false,
      false,
      createdBy,
      new Date(),
      new Date()
    );
  }

  /**
   * Business logic: Update category settings
   */
  updateSettings(newSettings: Partial<CategorySettings>): ResourceCategory {
    if (this.isSystemCategory) {
      throw new Error('Cannot update settings for system categories');
    }

    const updatedSettings: CategorySettings = {
      ...this.settings,
      ...newSettings
    };

    // Business rule: Validate settings
    if (updatedSettings.maxFileSize < 1 || updatedSettings.maxFileSize > 500) {
      throw new Error('Max file size must be between 1MB and 500MB');
    }

    if (updatedSettings.maxResourcesPerUser < 1) {
      throw new Error('Max resources per user must be at least 1');
    }

    return new ResourceCategory(
      this.id,
      this.name,
      this.slug,
      this.description,
      this.parentId,
      this.level,
      this.status,
      this.access,
      this.metadata,
      updatedSettings,
      this.icon,
      this.color,
      this.sortOrder,
      this.clinicId,
      this.workspaceId,
      this.statistics,
      this.isSystemCategory,
      this.isTemplate,
      this.isFeatured,
      this.createdBy,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Get category hierarchy path
   */
  getHierarchyPath(categories: ResourceCategory[]): string[] {
    const path: string[] = [this.name];
    let current: ResourceCategory = this;

    while (current.parentId) {
      const parent = categories.find(c => c.id === current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Business logic: Get category usage score
   */
  getUsageScore(): number {
    const resourceWeight = 1;
    const viewWeight = 0.1;
    const downloadWeight = 0.3;
    const shareWeight = 0.5;
    const ratingWeight = 2;

    const baseScore = (this.statistics.totalResources * resourceWeight) +
                     (this.statistics.totalViews * viewWeight) +
                     (this.statistics.totalDownloads * downloadWeight) +
                     (this.statistics.totalShares * shareWeight);

    const ratingBonus = this.statistics.averageRating > 0 
      ? this.statistics.averageRating * ratingWeight
      : 0;

    return Math.max(0, baseScore + ratingBonus);
  }

  /**
   * Business logic: Get display information
   */
  getDisplayInfo(): {
    name: string;
    level: number;
    status: string;
    resourceCount: number;
    lastActivity: string;
    canUpload: boolean;
    icon: string;
    color: string;
  } {
    return {
      name: this.name,
      level: this.level,
      status: this.status,
      resourceCount: this.statistics.totalResources,
      lastActivity: this.statistics.lastActivity.toISOString(),
      canUpload: this.status === 'active',
      icon: this.icon,
      color: this.color
    };
  }
}