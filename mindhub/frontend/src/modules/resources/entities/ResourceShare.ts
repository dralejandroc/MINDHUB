/**
 * ResourceShare Entity for Resources Module
 * Core business logic for sharing resources with patients and professionals - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type ShareStatus = 'pending' | 'sent' | 'delivered' | 'viewed' | 'failed' | 'expired';
export type ShareMethod = 'email' | 'portal' | 'link' | 'download' | 'print';
export type RecipientType = 'patient' | 'professional' | 'external';

export interface ShareRecipient {
  id: string;
  type: RecipientType;
  name: string;
  email: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    portal: boolean;
  };
}

export interface ShareSettings {
  allowDownload: boolean;
  allowForward: boolean;
  requiresPassword: boolean;
  password?: string;
  expirationDays: number;
  trackViews: boolean;
  requiresConfirmation: boolean;
  watermarkText?: string;
  maxViews?: number;
}

export interface ShareDelivery {
  method: ShareMethod;
  attemptedAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  trackingId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ShareActivity {
  timestamp: Date;
  action: 'shared' | 'viewed' | 'downloaded' | 'forwarded' | 'expired' | 'failed';
  details?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  duration?: number; // viewing duration in seconds
}

export class ResourceShare {
  constructor(
    public readonly id: string,
    public readonly resourceId: string,
    public readonly resourceTitle: string,
    public readonly sharedBy: string,
    public readonly sharedByName: string,
    public readonly recipient: ShareRecipient,
    public readonly status: ShareStatus,
    public readonly method: ShareMethod,
    public readonly settings: ShareSettings,
    public readonly message: string = '',
    public readonly subject: string = '',
    public readonly delivery: ShareDelivery,
    public readonly activityLog: ShareActivity[] = [],
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly sharedAt: Date = new Date(),
    public readonly expirationDate?: Date,
    public readonly viewCount: number = 0,
    public readonly lastViewedAt?: Date,
    public readonly confirmationToken?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate resource share data
   */
  private validate(): void {
    if (!this.resourceId.trim()) {
      throw new Error('Resource ID is required for sharing');
    }

    if (!this.sharedBy.trim()) {
      throw new Error('Shared by user is required');
    }

    if (!this.recipient.email.trim()) {
      throw new Error('Recipient email is required');
    }

    if (!this.isValidEmail(this.recipient.email)) {
      throw new Error('Valid recipient email is required');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Resource share must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Resource share cannot belong to both clinic and workspace');
    }

    // Business rule: Password validation if required
    if (this.settings.requiresPassword && !this.settings.password) {
      throw new Error('Password is required when password protection is enabled');
    }

    // Business rule: Expiration validation
    if (this.settings.expirationDays < 1 || this.settings.expirationDays > 365) {
      throw new Error('Expiration days must be between 1 and 365');
    }

    // Business rule: Max views validation
    if (this.settings.maxViews && this.settings.maxViews < 1) {
      throw new Error('Maximum views must be at least 1');
    }
  }

  /**
   * Business logic: Check if share is expired
   */
  isExpired(): boolean {
    if (!this.expirationDate) {
      return false;
    }
    return new Date() > this.expirationDate;
  }

  /**
   * Business logic: Check if share can be accessed
   */
  canBeAccessed(password?: string): boolean {
    if (!this.isActive) {
      return false;
    }

    if (this.isExpired()) {
      return false;
    }

    if (this.status === 'failed' || this.status === 'expired') {
      return false;
    }

    if (this.settings.maxViews && this.viewCount >= this.settings.maxViews) {
      return false;
    }

    if (this.settings.requiresPassword && password !== this.settings.password) {
      return false;
    }

    return true;
  }

  /**
   * Business logic: Record view activity
   */
  recordView(
    ipAddress?: string,
    userAgent?: string,
    location?: string,
    duration?: number
  ): ResourceShare {
    if (!this.canBeAccessed()) {
      throw new Error('Share cannot be accessed at this time');
    }

    const activity: ShareActivity = {
      timestamp: new Date(),
      action: 'viewed',
      ipAddress,
      location,
      deviceInfo: userAgent,
      duration
    };

    const updatedActivityLog = [...this.activityLog, activity];
    const newStatus: ShareStatus = this.status === 'sent' || this.status === 'delivered' ? 'viewed' : this.status;

    return new ResourceShare(
      this.id,
      this.resourceId,
      this.resourceTitle,
      this.sharedBy,
      this.sharedByName,
      this.recipient,
      newStatus,
      this.method,
      this.settings,
      this.message,
      this.subject,
      this.delivery,
      updatedActivityLog,
      this.clinicId,
      this.workspaceId,
      this.sharedAt,
      this.expirationDate,
      this.viewCount + 1,
      new Date(),
      this.confirmationToken,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Record download activity
   */
  recordDownload(ipAddress?: string, userAgent?: string): ResourceShare {
    if (!this.settings.allowDownload) {
      throw new Error('Download is not allowed for this share');
    }

    if (!this.canBeAccessed()) {
      throw new Error('Share cannot be accessed for download');
    }

    const activity: ShareActivity = {
      timestamp: new Date(),
      action: 'downloaded',
      ipAddress,
      deviceInfo: userAgent
    };

    const updatedActivityLog = [...this.activityLog, activity];

    return new ResourceShare(
      this.id,
      this.resourceId,
      this.resourceTitle,
      this.sharedBy,
      this.sharedByName,
      this.recipient,
      this.status,
      this.method,
      this.settings,
      this.message,
      this.subject,
      this.delivery,
      updatedActivityLog,
      this.clinicId,
      this.workspaceId,
      this.sharedAt,
      this.expirationDate,
      this.viewCount,
      this.lastViewedAt,
      this.confirmationToken,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Mark as delivered
   */
  markAsDelivered(deliveredAt: Date = new Date(), trackingId?: string): ResourceShare {
    if (this.status !== 'sent') {
      throw new Error('Only sent shares can be marked as delivered');
    }

    const updatedDelivery: ShareDelivery = {
      ...this.delivery,
      deliveredAt,
      trackingId
    };

    const activity: ShareActivity = {
      timestamp: deliveredAt,
      action: 'shared',
      details: `Delivered via ${this.method}`
    };

    const updatedActivityLog = [...this.activityLog, activity];

    return new ResourceShare(
      this.id,
      this.resourceId,
      this.resourceTitle,
      this.sharedBy,
      this.sharedByName,
      this.recipient,
      'delivered',
      this.method,
      this.settings,
      this.message,
      this.subject,
      updatedDelivery,
      updatedActivityLog,
      this.clinicId,
      this.workspaceId,
      this.sharedAt,
      this.expirationDate,
      this.viewCount,
      this.lastViewedAt,
      this.confirmationToken,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Mark as failed
   */
  markAsFailed(reason: string): ResourceShare {
    const updatedDelivery: ShareDelivery = {
      ...this.delivery,
      failureReason: reason
    };

    const activity: ShareActivity = {
      timestamp: new Date(),
      action: 'failed',
      details: reason
    };

    const updatedActivityLog = [...this.activityLog, activity];

    return new ResourceShare(
      this.id,
      this.resourceId,
      this.resourceTitle,
      this.sharedBy,
      this.sharedByName,
      this.recipient,
      'failed',
      this.method,
      this.settings,
      this.message,
      this.subject,
      updatedDelivery,
      updatedActivityLog,
      this.clinicId,
      this.workspaceId,
      this.sharedAt,
      this.expirationDate,
      this.viewCount,
      this.lastViewedAt,
      this.confirmationToken,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Expire share
   */
  expire(reason: string = 'Expired due to time limit'): ResourceShare {
    const activity: ShareActivity = {
      timestamp: new Date(),
      action: 'expired',
      details: reason
    };

    const updatedActivityLog = [...this.activityLog, activity];

    return new ResourceShare(
      this.id,
      this.resourceId,
      this.resourceTitle,
      this.sharedBy,
      this.sharedByName,
      this.recipient,
      'expired',
      this.method,
      this.settings,
      this.message,
      this.subject,
      this.delivery,
      updatedActivityLog,
      this.clinicId,
      this.workspaceId,
      this.sharedAt,
      this.expirationDate,
      this.viewCount,
      this.lastViewedAt,
      this.confirmationToken,
      false, // deactivate expired shares
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Generate sharing statistics
   */
  getStatistics(): {
    totalViews: number;
    totalDownloads: number;
    averageViewDuration: number;
    lastActivity: Date | null;
    deviceTypes: string[];
    locations: string[];
    status: ShareStatus;
    daysActive: number;
  } {
    const downloads = this.activityLog.filter(a => a.action === 'downloaded').length;
    const viewDurations = this.activityLog
      .filter(a => a.action === 'viewed' && a.duration)
      .map(a => a.duration!);
    
    const averageViewDuration = viewDurations.length > 0
      ? viewDurations.reduce((sum, duration) => sum + duration, 0) / viewDurations.length
      : 0;

    const lastActivity = this.activityLog.length > 0 
      ? this.activityLog[this.activityLog.length - 1].timestamp
      : null;

    const deviceTypes = Array.from(new Set(this.activityLog
      .filter(a => a.deviceInfo)
      .map(a => this.extractDeviceType(a.deviceInfo!))
    ));

    const locations = Array.from(new Set(this.activityLog
      .filter(a => a.location)
      .map(a => a.location!)
    ));

    const daysActive = Math.floor(
      (new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalViews: this.viewCount,
      totalDownloads: downloads,
      averageViewDuration,
      lastActivity,
      deviceTypes,
      locations,
      status: this.status,
      daysActive
    };
  }

  /**
   * Business logic: Check if reminder should be sent
   */
  shouldSendReminder(): boolean {
    if (this.status !== 'sent' && this.status !== 'delivered') {
      return false;
    }

    if (this.isExpired()) {
      return false;
    }

    // Send reminder if no activity for 7 days
    const daysSinceLastActivity = this.activityLog.length > 0
      ? Math.floor((new Date().getTime() - this.activityLog[this.activityLog.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((new Date().getTime() - this.sharedAt.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceLastActivity >= 7;
  }

  /**
   * Utility: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Utility: Extract device type from user agent
   */
  private extractDeviceType(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Desktop')) return 'Desktop';
    return 'Unknown';
  }

  /**
   * Business logic: Get display information
   */
  getDisplayInfo(): {
    resourceTitle: string;
    recipientName: string;
    recipientEmail: string;
    status: string;
    sharedAt: string;
    expiresAt: string | null;
    viewCount: number;
    canDownload: boolean;
    hasExpired: boolean;
  } {
    return {
      resourceTitle: this.resourceTitle,
      recipientName: this.recipient.name,
      recipientEmail: this.recipient.email,
      status: this.status,
      sharedAt: this.sharedAt.toISOString(),
      expiresAt: this.expirationDate?.toISOString() || null,
      viewCount: this.viewCount,
      canDownload: this.settings.allowDownload,
      hasExpired: this.isExpired()
    };
  }
}