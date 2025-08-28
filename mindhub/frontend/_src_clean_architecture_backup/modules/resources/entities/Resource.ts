/**
 * Resource Entity for Resources Module
 * Core business logic for medical resources management - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type ResourceType = 'pdf' | 'image' | 'video' | 'audio' | 'link' | 'document';
export type ResourceStatus = 'draft' | 'published' | 'archived' | 'private';
export type ResourceAccess = 'public' | 'professional_only' | 'restricted';

export interface ResourceMetadata {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  version: string;
  lastModified: Date;
  fileSize?: number;
  duration?: number; // for video/audio resources
  pages?: number; // for document resources
}

export interface ResourceContent {
  originalUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  streamingUrl?: string; // for video/audio
  embedCode?: string; // for external resources
}

export interface ResourceDistribution {
  totalShares: number;
  uniqueRecipients: number;
  lastSharedAt?: Date;
  mostSharedWith: string[]; // patient demographics or categories
  shareHistory: Array<{
    sharedAt: Date;
    sharedBy: string;
    recipientType: 'patient' | 'professional';
    recipientId: string;
    method: 'email' | 'portal' | 'link';
  }>;
}

export interface ResourceAnalytics {
  views: number;
  downloads: number;
  shares: number;
  ratings: {
    average: number;
    count: number;
    distribution: { [stars: number]: number };
  };
  engagement: {
    averageViewTime: number;
    completionRate: number;
    interactionRate: number;
  };
  feedback: Array<{
    id: string;
    rating: number;
    comment: string;
    createdBy: string;
    createdAt: Date;
    isPublic: boolean;
  }>;
}

export class Resource {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly type: ResourceType,
    public readonly categoryId: string,
    public readonly status: ResourceStatus,
    public readonly access: ResourceAccess,
    public readonly content: ResourceContent,
    public readonly metadata: ResourceMetadata,
    public readonly tags: string[],
    public readonly targetAudience: string[], // patient types, conditions, demographics
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdBy: string = '',
    public readonly isTemplate: boolean = false,
    public readonly requiresWatermark: boolean = false,
    public readonly allowDownload: boolean = true,
    public readonly allowSharing: boolean = true,
    public readonly expirationDate?: Date,
    public readonly distribution: ResourceDistribution = {
      totalShares: 0,
      uniqueRecipients: 0,
      mostSharedWith: [],
      shareHistory: []
    },
    public readonly analytics: ResourceAnalytics = {
      views: 0,
      downloads: 0,
      shares: 0,
      ratings: { average: 0, count: 0, distribution: {} },
      engagement: { averageViewTime: 0, completionRate: 0, interactionRate: 0 },
      feedback: []
    },
    public readonly isActive: boolean = true,
    public readonly isFeatured: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate resource data
   */
  private validate(): void {
    if (!this.title.trim()) {
      throw new Error('Resource title is required');
    }

    if (!this.description.trim()) {
      throw new Error('Resource description is required');
    }

    if (!this.categoryId.trim()) {
      throw new Error('Resource category is required');
    }

    if (!this.content.originalUrl.trim()) {
      throw new Error('Resource content URL is required');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Resource must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Resource cannot belong to both clinic and workspace');
    }

    // Business rule: Expiration date validation
    if (this.expirationDate && this.expirationDate <= new Date()) {
      console.warn('Resource expiration date is in the past');
    }

    // Business rule: Template resources must be published
    if (this.isTemplate && this.status !== 'published') {
      throw new Error('Template resources must be published');
    }

    // Business rule: Private resources cannot be templates
    if (this.isTemplate && this.access === 'restricted') {
      throw new Error('Template resources cannot be restricted');
    }
  }

  /**
   * Business logic: Check if resource can be accessed by user
   */
  canBeAccessedBy(userRole: 'professional' | 'patient', userPermissions: string[] = []): boolean {
    if (!this.isActive) {
      return false;
    }

    if (this.status === 'draft' || this.status === 'archived') {
      return userRole === 'professional' && userPermissions.includes('manage_resources');
    }

    switch (this.access) {
      case 'public':
        return true;
      case 'professional_only':
        return userRole === 'professional';
      case 'restricted':
        return userRole === 'professional' && userPermissions.includes('access_restricted_resources');
      default:
        return false;
    }
  }

  /**
   * Business logic: Check if resource can be shared
   */
  canBeShared(): boolean {
    return this.isActive && 
           this.status === 'published' && 
           this.allowSharing &&
           (!this.expirationDate || this.expirationDate > new Date());
  }

  /**
   * Business logic: Check if resource can be downloaded
   */
  canBeDownloaded(): boolean {
    return this.isActive && 
           this.status === 'published' && 
           this.allowDownload &&
           (!this.expirationDate || this.expirationDate > new Date());
  }

  /**
   * Business logic: Share resource with recipient
   */
  shareWith(
    recipientId: string,
    recipientType: 'patient' | 'professional',
    sharedBy: string,
    method: 'email' | 'portal' | 'link' = 'email'
  ): Resource {
    if (!this.canBeShared()) {
      throw new Error('Resource cannot be shared at this time');
    }

    const shareEntry = {
      sharedAt: new Date(),
      sharedBy,
      recipientType,
      recipientId,
      method
    };

    const updatedShareHistory = [...this.distribution.shareHistory, shareEntry];
    const uniqueRecipients = new Set(updatedShareHistory.map(h => h.recipientId)).size;

    const updatedDistribution: ResourceDistribution = {
      ...this.distribution,
      totalShares: this.distribution.totalShares + 1,
      uniqueRecipients,
      lastSharedAt: new Date(),
      shareHistory: updatedShareHistory
    };

    return new Resource(
      this.id,
      this.title,
      this.description,
      this.type,
      this.categoryId,
      this.status,
      this.access,
      this.content,
      this.metadata,
      this.tags,
      this.targetAudience,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.requiresWatermark,
      this.allowDownload,
      this.allowSharing,
      this.expirationDate,
      updatedDistribution,
      this.analytics,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Record resource view
   */
  recordView(viewDuration?: number): Resource {
    const updatedAnalytics: ResourceAnalytics = {
      ...this.analytics,
      views: this.analytics.views + 1,
      engagement: {
        ...this.analytics.engagement,
        averageViewTime: viewDuration 
          ? (this.analytics.engagement.averageViewTime * this.analytics.views + viewDuration) / (this.analytics.views + 1)
          : this.analytics.engagement.averageViewTime
      }
    };

    return new Resource(
      this.id,
      this.title,
      this.description,
      this.type,
      this.categoryId,
      this.status,
      this.access,
      this.content,
      this.metadata,
      this.tags,
      this.targetAudience,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.requiresWatermark,
      this.allowDownload,
      this.allowSharing,
      this.expirationDate,
      this.distribution,
      updatedAnalytics,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Record resource download
   */
  recordDownload(): Resource {
    if (!this.canBeDownloaded()) {
      throw new Error('Resource cannot be downloaded');
    }

    const updatedAnalytics: ResourceAnalytics = {
      ...this.analytics,
      downloads: this.analytics.downloads + 1
    };

    return new Resource(
      this.id,
      this.title,
      this.description,
      this.type,
      this.categoryId,
      this.status,
      this.access,
      this.content,
      this.metadata,
      this.tags,
      this.targetAudience,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.requiresWatermark,
      this.allowDownload,
      this.allowSharing,
      this.expirationDate,
      this.distribution,
      updatedAnalytics,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Add rating and feedback
   */
  addFeedback(
    rating: number,
    comment: string,
    createdBy: string,
    isPublic: boolean = true
  ): Resource {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const feedbackEntry = {
      id: `feedback_${Date.now()}`,
      rating,
      comment: comment.trim(),
      createdBy,
      createdAt: new Date(),
      isPublic
    };

    const updatedFeedback = [...this.analytics.feedback, feedbackEntry];
    const ratings = updatedFeedback.map(f => f.rating);
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    const distribution: { [stars: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = ratings.filter(r => r === i).length;
    }

    const updatedAnalytics: ResourceAnalytics = {
      ...this.analytics,
      ratings: {
        average: Math.round(average * 10) / 10,
        count: ratings.length,
        distribution
      },
      feedback: updatedFeedback
    };

    return new Resource(
      this.id,
      this.title,
      this.description,
      this.type,
      this.categoryId,
      this.status,
      this.access,
      this.content,
      this.metadata,
      this.tags,
      this.targetAudience,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.requiresWatermark,
      this.allowDownload,
      this.allowSharing,
      this.expirationDate,
      this.distribution,
      updatedAnalytics,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Update status
   */
  updateStatus(newStatus: ResourceStatus, updatedBy: string): Resource {
    if (this.status === newStatus) {
      return this;
    }

    // Business rule: Only professionals can change status
    if (!updatedBy) {
      throw new Error('User required to update resource status');
    }

    // Business rule: Cannot publish expired resources
    if (newStatus === 'published' && this.expirationDate && this.expirationDate <= new Date()) {
      throw new Error('Cannot publish expired resource');
    }

    return new Resource(
      this.id,
      this.title,
      this.description,
      this.type,
      this.categoryId,
      newStatus,
      this.access,
      this.content,
      this.metadata,
      this.tags,
      this.targetAudience,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.requiresWatermark,
      this.allowDownload,
      this.allowSharing,
      this.expirationDate,
      this.distribution,
      this.analytics,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Check if resource is expired
   */
  isExpired(): boolean {
    return this.expirationDate !== undefined && this.expirationDate <= new Date();
  }

  /**
   * Business logic: Get resource popularity score
   */
  getPopularityScore(): number {
    const viewWeight = 1;
    const downloadWeight = 3;
    const shareWeight = 5;
    const ratingWeight = 2;

    const baseScore = (this.analytics.views * viewWeight) +
                     (this.analytics.downloads * downloadWeight) +
                     (this.analytics.shares * shareWeight);

    const ratingBonus = this.analytics.ratings.count > 0 
      ? (this.analytics.ratings.average - 3) * this.analytics.ratings.count * ratingWeight
      : 0;

    return Math.max(0, baseScore + ratingBonus);
  }

  /**
   * Business logic: Get display information
   */
  getDisplayInfo(): {
    title: string;
    type: string;
    category: string;
    status: string;
    views: number;
    downloads: number;
    shares: number;
    rating: number;
    canShare: boolean;
    canDownload: boolean;
  } {
    return {
      title: this.title,
      type: this.type,
      category: this.categoryId,
      status: this.status,
      views: this.analytics.views,
      downloads: this.analytics.downloads,
      shares: this.analytics.shares,
      rating: this.analytics.ratings.average,
      canShare: this.canBeShared(),
      canDownload: this.canBeDownloaded()
    };
  }
}