/**
 * ResourceShare Repository Interface
 * Data access abstraction for ResourceShare entities in Resources module
 */

import { ResourceShare, ShareStatus, ShareMethod, RecipientType } from '../entities/ResourceShare';

export interface ShareSearchFilters {
  clinicId?: string;
  workspaceId?: string;
  resourceId?: string;
  sharedBy?: string;
  recipientType?: RecipientType;
  status?: ShareStatus;
  method?: ShareMethod;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeExpired?: boolean;
}

export interface ShareAnalyticsData {
  shareId: string;
  resourceId: string;
  resourceTitle: string;
  recipientEmail: string;
  sharedDate: Date;
  firstViewDate?: Date;
  lastViewDate?: Date;
  totalViews: number;
  totalDownloads: number;
  viewDuration: number;
  engagementScore: number;
  deviceTypes: string[];
  locations: string[];
}

export interface ShareCampaign {
  id: string;
  name: string;
  description: string;
  resourceIds: string[];
  recipientGroups: string[];
  scheduledAt?: Date;
  createdBy: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  successCount: number;
  failureCount: number;
}

export interface ResourceShareRepository {
  /**
   * Find share by ID
   */
  findById(id: string): Promise<ResourceShare | undefined>;

  /**
   * Find share by confirmation token
   */
  findByToken(token: string): Promise<ResourceShare | undefined>;

  /**
   * Find all shares with optional filters
   */
  findAll(filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares by resource
   */
  findByResource(resourceId: string, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares by user
   */
  findBySharedBy(userId: string, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares by recipient
   */
  findByRecipient(recipientEmail: string, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares by status
   */
  findByStatus(status: ShareStatus, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares by method
   */
  findByMethod(method: ShareMethod, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find recent shares
   */
  findRecent(limit: number, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find active shares (not expired or failed)
   */
  findActive(filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find expired shares
   */
  findExpired(filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares expiring soon
   */
  findExpiringSoon(days: number, filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find shares needing reminders
   */
  findNeedingReminders(filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Find failed shares
   */
  findFailed(filters?: ShareSearchFilters): Promise<ResourceShare[]>;

  /**
   * Create new share
   */
  create(share: ResourceShare): Promise<ResourceShare>;

  /**
   * Update existing share
   */
  update(share: ResourceShare): Promise<ResourceShare>;

  /**
   * Delete share
   */
  delete(id: string): Promise<void>;

  /**
   * Bulk create shares
   */
  bulkCreate(shares: ResourceShare[]): Promise<ResourceShare[]>;

  /**
   * Bulk update share status
   */
  bulkUpdateStatus(
    shareIds: string[],
    status: ShareStatus,
    updatedBy: string
  ): Promise<ResourceShare[]>;

  /**
   * Bulk expire shares
   */
  bulkExpire(shareIds: string[], expiredBy: string, reason?: string): Promise<void>;

  /**
   * Send share notifications
   */
  sendNotifications(shareIds: string[]): Promise<{
    sent: string[];
    failed: Array<{
      shareId: string;
      error: string;
    }>;
  }>;

  /**
   * Resend failed shares
   */
  resendFailed(shareIds: string[]): Promise<{
    resent: string[];
    stillFailed: Array<{
      shareId: string;
      error: string;
    }>;
  }>;

  /**
   * Track share view
   */
  trackView(
    shareId: string,
    viewData: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      duration?: number;
    }
  ): Promise<ResourceShare>;

  /**
   * Track share download
   */
  trackDownload(
    shareId: string,
    downloadData: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
    }
  ): Promise<ResourceShare>;

  /**
   * Get share statistics
   */
  getStatistics(filters?: ShareSearchFilters): Promise<{
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    failedShares: number;
    totalViews: number;
    totalDownloads: number;
    totalRecipients: number;
    averageViewsPerShare: number;
    averageDownloadsPerShare: number;
    conversionRate: number;
    methodDistribution: { [method: string]: number };
    statusDistribution: { [status: string]: number };
    recipientTypeDistribution: { [type: string]: number };
  }>;

  /**
   * Get share analytics
   */
  getAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: ShareSearchFilters
  ): Promise<ShareAnalyticsData[]>;

  /**
   * Get share performance metrics
   */
  getPerformanceMetrics(
    shareIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    shareId: string;
    resourceTitle: string;
    recipientEmail: string;
    views: number;
    downloads: number;
    lastActivity: Date | null;
    engagementScore: number;
    status: ShareStatus;
  }>>;

  /**
   * Get trending shared resources
   */
  getTrendingSharedResources(
    period: 'day' | 'week' | 'month',
    limit: number,
    filters?: ShareSearchFilters
  ): Promise<Array<{
    resourceId: string;
    resourceTitle: string;
    shareCount: number;
    viewCount: number;
    downloadCount: number;
    uniqueRecipients: number;
  }>>;

  /**
   * Get share engagement report
   */
  getEngagementReport(
    startDate: Date,
    endDate: Date,
    filters?: ShareSearchFilters
  ): Promise<{
    totalShares: number;
    viewedShares: number;
    downloadedShares: number;
    averageTimeToFirstView: number; // hours
    averageViewDuration: number; // seconds
    bounceRate: number;
    returnViewRate: number;
    topPerformingResources: Array<{
      resourceId: string;
      title: string;
      engagementScore: number;
    }>;
    deviceBreakdown: { [device: string]: number };
    locationBreakdown: { [country: string]: number };
  }>;

  /**
   * Get recipient activity summary
   */
  getRecipientActivity(
    recipientEmail: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSharesReceived: number;
    resourcesViewed: number;
    resourcesDownloaded: number;
    averageEngagementTime: number;
    favoriteCategories: string[];
    shareHistory: Array<{
      shareId: string;
      resourceTitle: string;
      sharedDate: Date;
      firstViewDate?: Date;
      totalViews: number;
      totalDownloads: number;
    }>;
  }>;

  /**
   * Create share campaign
   */
  createCampaign(campaign: ShareCampaign): Promise<ShareCampaign>;

  /**
   * Execute share campaign
   */
  executeCampaign(campaignId: string): Promise<{
    campaignId: string;
    status: 'started' | 'completed' | 'failed';
    sharesCreated: number;
    errors: string[];
  }>;

  /**
   * Get campaign status
   */
  getCampaignStatus(campaignId: string): Promise<{
    campaign: ShareCampaign;
    progress: {
      totalRecipients: number;
      sent: number;
      failed: number;
      pending: number;
      percentComplete: number;
    };
    recentActivity: Array<{
      timestamp: Date;
      action: string;
      details: string;
    }>;
  }>;

  /**
   * Schedule share campaign
   */
  scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<ShareCampaign>;

  /**
   * Cancel share campaign
   */
  cancelCampaign(campaignId: string, cancelledBy: string): Promise<void>;

  /**
   * Generate share link
   */
  generateShareLink(
    resourceId: string,
    settings: {
      expirationDays: number;
      requiresPassword: boolean;
      password?: string;
      allowDownload: boolean;
      trackViews: boolean;
    },
    generatedBy: string
  ): Promise<{
    shareId: string;
    shareUrl: string;
    expirationDate: Date;
  }>;

  /**
   * Validate share access
   */
  validateShareAccess(
    shareId: string,
    password?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    share?: ResourceShare;
  }>;

  /**
   * Get share delivery status
   */
  getDeliveryStatus(shareIds: string[]): Promise<Array<{
    shareId: string;
    status: ShareStatus;
    deliveredAt?: Date;
    lastAttemptAt: Date;
    attemptCount: number;
    nextRetryAt?: Date;
    failureReason?: string;
  }>>;

  /**
   * Retry failed deliveries
   */
  retryFailedDeliveries(shareIds: string[]): Promise<{
    retried: string[];
    failed: Array<{
      shareId: string;
      error: string;
    }>;
  }>;

  /**
   * Export share data
   */
  exportShareData(
    filters: ShareSearchFilters,
    format: 'csv' | 'json' | 'xlsx',
    includeAnalytics: boolean
  ): Promise<{
    downloadUrl: string;
    filename: string;
    size: number;
    recordCount: number;
  }>;

  /**
   * Clean up expired shares
   */
  cleanupExpiredShares(
    olderThanDays: number,
    dryRun?: boolean
  ): Promise<{
    sharesFound: number;
    sharesDeleted: number;
    spaceReclaimed: number; // in MB
    errors: string[];
  }>;

  /**
   * Get share security report
   */
  getSecurityReport(): Promise<{
    totalActiveShares: number;
    passwordProtectedShares: number;
    publicShares: number;
    sharesWithoutExpiration: number;
    suspiciousActivity: Array<{
      shareId: string;
      resourceTitle: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      detectedAt: Date;
    }>;
    recommendations: string[];
  }>;
}