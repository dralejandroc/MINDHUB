/**
 * Share Resource Use Case
 * Business logic for sharing resources with patients and professionals
 */

import { Resource } from '../entities/Resource';
import { ResourceShare, ShareMethod, RecipientType, ShareRecipient, ShareSettings } from '../entities/ResourceShare';
import { ResourceRepository } from '../repositories/ResourceRepository';
import { ResourceShareRepository } from '../repositories/ResourceShareRepository';

export interface ShareResourceRequest {
  resourceId: string;
  recipient: {
    id?: string;
    type: RecipientType;
    name: string;
    email: string;
    phoneNumber?: string;
    preferredLanguage?: string;
  };
  method: ShareMethod;
  message?: string;
  subject?: string;
  settings: {
    allowDownload: boolean;
    allowForward: boolean;
    requiresPassword: boolean;
    password?: string;
    expirationDays: number;
    trackViews: boolean;
    requiresConfirmation: boolean;
    watermarkText?: string;
    maxViews?: number;
  };
  sharedBy: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface BulkShareResourceRequest {
  resourceIds: string[];
  recipients: Array<{
    id?: string;
    type: RecipientType;
    name: string;
    email: string;
    phoneNumber?: string;
    preferredLanguage?: string;
  }>;
  method: ShareMethod;
  message?: string;
  subject?: string;
  settings: {
    allowDownload: boolean;
    allowForward: boolean;
    requiresPassword: boolean;
    password?: string;
    expirationDays: number;
    trackViews: boolean;
    requiresConfirmation: boolean;
    watermarkText?: string;
    maxViews?: number;
  };
  sharedBy: string;
  clinicId?: string;
  workspaceId?: string;
}

export interface ShareOperationResult {
  success: boolean;
  share?: ResourceShare;
  shareUrl?: string;
  error?: string;
  warnings?: string[];
}

export interface BulkShareOperationResult {
  success: boolean;
  successfulShares: ResourceShare[];
  failedShares: Array<{
    resourceId?: string;
    recipientEmail: string;
    error: string;
  }>;
  totalShares: number;
  successCount: number;
  failureCount: number;
}

export interface ShareAccessResult {
  success: boolean;
  share?: ResourceShare;
  resource?: Resource;
  error?: string;
  requiresPassword?: boolean;
}

export class ShareResourceUseCase {
  constructor(
    private resourceRepository: ResourceRepository,
    private shareRepository: ResourceShareRepository
  ) {}

  /**
   * Share a single resource with a recipient
   */
  async shareResource(request: ShareResourceRequest): Promise<ShareOperationResult> {
    try {
      // Validate input
      this.validateShareResourceRequest(request);

      // Find and validate resource
      const resource = await this.resourceRepository.findById(request.resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      if (!resource.canBeShared()) {
        return {
          success: false,
          error: 'Resource cannot be shared at this time'
        };
      }

      // Business rule: Check tenant consistency
      if (request.clinicId && resource.clinicId && request.clinicId !== resource.clinicId) {
        return {
          success: false,
          error: 'Cannot share resource from different clinic'
        };
      }

      if (request.workspaceId && resource.workspaceId && request.workspaceId !== resource.workspaceId) {
        return {
          success: false,
          error: 'Cannot share resource from different workspace'
        };
      }

      // Create recipient object
      const recipient: ShareRecipient = {
        id: request.recipient.id || this.generateRecipientId(),
        type: request.recipient.type,
        name: request.recipient.name,
        email: request.recipient.email,
        phoneNumber: request.recipient.phoneNumber,
        preferredLanguage: request.recipient.preferredLanguage || 'es',
        notificationPreferences: {
          email: true,
          sms: !!request.recipient.phoneNumber,
          portal: request.recipient.type === 'patient'
        }
      };

      // Create share settings
      const shareSettings: ShareSettings = {
        allowDownload: request.settings.allowDownload && resource.allowDownload,
        allowForward: request.settings.allowForward,
        requiresPassword: request.settings.requiresPassword,
        password: request.settings.password,
        expirationDays: request.settings.expirationDays,
        trackViews: request.settings.trackViews,
        requiresConfirmation: request.settings.requiresConfirmation,
        watermarkText: request.settings.watermarkText || (resource.requiresWatermark ? `${resource.clinicId || resource.workspaceId} - Confidential` : undefined),
        maxViews: request.settings.maxViews
      };

      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + request.settings.expirationDays);

      // Create share ID and confirmation token
      const shareId = this.generateShareId();
      const confirmationToken = request.settings.requiresConfirmation ? this.generateConfirmationToken() : undefined;

      // Create resource share
      const resourceShare = new ResourceShare(
        shareId,
        resource.id,
        resource.title,
        request.sharedBy,
        request.sharedBy, // Would normally get actual user name
        recipient,
        'pending',
        request.method,
        shareSettings,
        request.message || '',
        request.subject || `Recurso compartido: ${resource.title}`,
        {
          method: request.method,
          attemptedAt: new Date()
        },
        [],
        request.clinicId,
        request.workspaceId,
        new Date(),
        expirationDate,
        0,
        undefined,
        confirmationToken
      );

      // Save the share
      const savedShare = await this.shareRepository.create(resourceShare);

      // Update resource with share information
      const updatedResource = resource.shareWith(
        recipient.id,
        recipient.type === 'external' ? 'professional' : recipient.type,
        request.sharedBy,
        request.method === 'print' || request.method === 'download' ? 'email' : request.method
      );
      await this.resourceRepository.update(updatedResource);

      // Generate share URL
      const shareUrl = this.generateShareUrl(savedShare.id, confirmationToken);

      // Send notification (in real implementation)
      // await this.sendShareNotification(savedShare, shareUrl);

      return {
        success: true,
        share: savedShare,
        shareUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share resource'
      };
    }
  }

  /**
   * Share multiple resources with multiple recipients
   */
  async bulkShareResources(request: BulkShareResourceRequest): Promise<BulkShareOperationResult> {
    const results: BulkShareOperationResult = {
      success: true,
      successfulShares: [],
      failedShares: [],
      totalShares: 0,
      successCount: 0,
      failureCount: 0
    };

    try {
      // Calculate total shares
      results.totalShares = request.resourceIds.length * request.recipients.length;

      // Share each resource with each recipient
      for (const resourceId of request.resourceIds) {
        for (const recipient of request.recipients) {
          try {
            const shareRequest: ShareResourceRequest = {
              resourceId,
              recipient,
              method: request.method,
              message: request.message,
              subject: request.subject,
              settings: request.settings,
              sharedBy: request.sharedBy,
              clinicId: request.clinicId,
              workspaceId: request.workspaceId
            };

            const shareResult = await this.shareResource(shareRequest);
            
            if (shareResult.success && shareResult.share) {
              results.successfulShares.push(shareResult.share);
              results.successCount++;
            } else {
              results.failedShares.push({
                resourceId,
                recipientEmail: recipient.email,
                error: shareResult.error || 'Unknown error'
              });
              results.failureCount++;
            }
          } catch (error) {
            results.failedShares.push({
              resourceId,
              recipientEmail: recipient.email,
              error: error instanceof Error ? error.message : 'Failed to share'
            });
            results.failureCount++;
          }
        }
      }

      // Mark as failed if more than 50% of shares failed
      if (results.failureCount > results.successCount) {
        results.success = false;
      }

      return results;

    } catch (error) {
      return {
        success: false,
        successfulShares: [],
        failedShares: [{
          recipientEmail: 'all',
          error: error instanceof Error ? error.message : 'Bulk share operation failed'
        }],
        totalShares: 0,
        successCount: 0,
        failureCount: request.resourceIds.length * request.recipients.length
      };
    }
  }

  /**
   * Access a shared resource
   */
  async accessSharedResource(
    shareId: string,
    password?: string,
    userAgent?: string,
    ipAddress?: string,
    location?: string
  ): Promise<ShareAccessResult> {
    try {
      // Find the share
      const share = await this.shareRepository.findById(shareId);
      if (!share) {
        return {
          success: false,
          error: 'Share not found'
        };
      }

      // Check if share can be accessed
      if (!share.canBeAccessed(password)) {
        if (share.isExpired()) {
          return {
            success: false,
            error: 'This share has expired'
          };
        }

        if (share.settings.requiresPassword && !password) {
          return {
            success: false,
            requiresPassword: true,
            error: 'Password required to access this resource'
          };
        }

        if (share.settings.requiresPassword && password !== share.settings.password) {
          return {
            success: false,
            requiresPassword: true,
            error: 'Invalid password'
          };
        }

        if (share.settings.maxViews && share.viewCount >= share.settings.maxViews) {
          return {
            success: false,
            error: 'This share has reached its maximum view limit'
          };
        }

        return {
          success: false,
          error: 'Access denied'
        };
      }

      // Get the resource
      const resource = await this.resourceRepository.findById(share.resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      // Record the view
      const updatedShare = share.recordView(ipAddress, userAgent, location);
      await this.shareRepository.update(updatedShare);

      // Record resource view
      const updatedResource = resource.recordView();
      await this.resourceRepository.update(updatedResource);

      return {
        success: true,
        share: updatedShare,
        resource: updatedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access shared resource'
      };
    }
  }

  /**
   * Download a shared resource
   */
  async downloadSharedResource(
    shareId: string,
    userAgent?: string,
    ipAddress?: string,
    location?: string
  ): Promise<ShareAccessResult> {
    try {
      // Find the share
      const share = await this.shareRepository.findById(shareId);
      if (!share) {
        return {
          success: false,
          error: 'Share not found'
        };
      }

      if (!share.settings.allowDownload) {
        return {
          success: false,
          error: 'Download is not allowed for this resource'
        };
      }

      if (!share.canBeAccessed()) {
        return {
          success: false,
          error: 'Cannot access this share for download'
        };
      }

      // Get the resource
      const resource = await this.resourceRepository.findById(share.resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      if (!resource.canBeDownloaded()) {
        return {
          success: false,
          error: 'Resource cannot be downloaded'
        };
      }

      // Record the download
      const updatedShare = share.recordDownload(ipAddress, userAgent);
      await this.shareRepository.update(updatedShare);

      // Record resource download
      const updatedResource = resource.recordDownload();
      await this.resourceRepository.update(updatedResource);

      return {
        success: true,
        share: updatedShare,
        resource: updatedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download shared resource'
      };
    }
  }

  /**
   * Get share details by token
   */
  async getShareByToken(token: string): Promise<ShareOperationResult> {
    try {
      const share = await this.shareRepository.findByToken(token);
      
      if (!share) {
        return {
          success: false,
          error: 'Share not found'
        };
      }

      return {
        success: true,
        share
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get share'
      };
    }
  }

  /**
   * Expire a share
   */
  async expireShare(shareId: string, expiredBy: string, reason?: string): Promise<ShareOperationResult> {
    try {
      const share = await this.shareRepository.findById(shareId);
      if (!share) {
        return {
          success: false,
          error: 'Share not found'
        };
      }

      const expiredShare = share.expire(reason);
      const savedShare = await this.shareRepository.update(expiredShare);

      return {
        success: true,
        share: savedShare
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to expire share'
      };
    }
  }

  /**
   * Get shares for a resource
   */
  async getResourceShares(resourceId: string): Promise<ResourceShare[]> {
    try {
      return await this.shareRepository.findByResource(resourceId);
    } catch (error) {
      console.error('Failed to get resource shares:', error);
      return [];
    }
  }

  /**
   * Get shares by user
   */
  async getUserShares(userId: string): Promise<ResourceShare[]> {
    try {
      return await this.shareRepository.findBySharedBy(userId);
    } catch (error) {
      console.error('Failed to get user shares:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private validateShareResourceRequest(request: ShareResourceRequest): void {
    if (!request.resourceId.trim()) {
      throw new Error('Resource ID is required');
    }

    if (!request.recipient.name.trim()) {
      throw new Error('Recipient name is required');
    }

    if (!request.recipient.email.trim()) {
      throw new Error('Recipient email is required');
    }

    if (!this.isValidEmail(request.recipient.email)) {
      throw new Error('Valid recipient email is required');
    }

    if (!request.sharedBy.trim()) {
      throw new Error('Shared by user ID is required');
    }

    if (request.settings.expirationDays < 1 || request.settings.expirationDays > 365) {
      throw new Error('Expiration days must be between 1 and 365');
    }

    if (request.settings.requiresPassword && !request.settings.password) {
      throw new Error('Password is required when password protection is enabled');
    }

    if (request.settings.maxViews && request.settings.maxViews < 1) {
      throw new Error('Maximum views must be at least 1');
    }

    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Either clinic ID or workspace ID is required');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Cannot specify both clinic ID and workspace ID');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecipientId(): string {
    return `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConfirmationToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  private generateShareUrl(shareId: string, confirmationToken?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SHARE_BASE_URL || 'https://mindhub.cloud/share';
    return confirmationToken 
      ? `${baseUrl}/${shareId}?token=${confirmationToken}`
      : `${baseUrl}/${shareId}`;
  }
}