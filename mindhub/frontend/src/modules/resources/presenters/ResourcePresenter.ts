/**
 * Resource Presenter
 * Transforms domain entities into view models for UI consumption
 */

import { Resource, ResourceType, ResourceStatus, ResourceAccess } from '../entities/Resource';
import { ResourceCategory } from '../entities/ResourceCategory';
import { ResourceShare } from '../entities/ResourceShare';

// View Models for UI Components
export interface ResourceListItemViewModel {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  typeLabel: string;
  typeIcon: string;
  categoryId: string;
  categoryName?: string;
  status: ResourceStatus;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  access: ResourceAccess;
  accessLabel: string;
  accessIcon: string;
  thumbnailUrl?: string;
  tags: string[];
  targetAudience: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  downloads: number;
  shares: number;
  rating: number;
  ratingCount: number;
  isExpired: boolean;
  canShare: boolean;
  canDownload: boolean;
  canEdit: boolean;
  popularityScore: number;
  fileSize?: string;
  duration?: string;
}

export interface ResourceDetailsViewModel {
  // Basic Information
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  typeLabel: string;
  typeIcon: string;
  categoryId: string;
  categoryName?: string;
  status: ResourceStatus;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  statusBadge: { label: string; color: string; icon: string };
  access: ResourceAccess;
  accessLabel: string;
  accessIcon: string;
  
  // Content
  content: {
    originalUrl: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
    streamingUrl?: string;
    embedCode?: string;
  };
  
  // Metadata
  metadata: {
    author: string;
    version: string;
    lastModified: string;
    fileSize?: string;
    duration?: string;
    pages?: number;
    keywords: string[];
  };
  
  // Tags and Audience
  tags: string[];
  targetAudience: string[];
  targetAudienceLabels: string[];
  
  // Settings
  allowDownload: boolean;
  allowSharing: boolean;
  requiresWatermark: boolean;
  isTemplate: boolean;
  isFeatured: boolean;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  expirationDate?: string;
  isExpired: boolean;
  expiresIn?: string;
  
  // Analytics
  analytics: {
    views: number;
    downloads: number;
    shares: number;
    uniqueShares: number;
    rating: number;
    ratingCount: number;
    ratingDistribution: { [stars: number]: number };
    engagement: {
      averageViewTime: string;
      completionRate: number;
      interactionRate: number;
    };
    popularityScore: number;
  };
  
  // Permissions
  canView: boolean;
  canDownload: boolean;
  canShare: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  
  // Display helpers
  shareableLink?: string;
  breadcrumbs: Array<{ id: string; name: string; url: string }>;
}

export interface ResourceCardViewModel {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  typeLabel: string;
  typeIcon: string;
  typeColor: string;
  thumbnailUrl?: string;
  status: ResourceStatus;
  statusBadge: { label: string; color: string };
  views: number;
  downloads: number;
  rating: number;
  createdAt: string;
  canShare: boolean;
  canDownload: boolean;
  isExpired: boolean;
  tags: string[];
}

export interface ResourceStatsViewModel {
  totalResources: number;
  publishedResources: number;
  draftResources: number;
  archivedResources: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  averageRating: number;
  growthRate: number;
  typeDistribution: Array<{ type: string; count: number; percentage: number }>;
  categoryDistribution: Array<{ categoryId: string; categoryName: string; count: number }>;
  topPerformers: ResourceCardViewModel[];
}

export interface ResourceShareViewModel {
  id: string;
  resourceId: string;
  resourceTitle: string;
  recipientName: string;
  recipientEmail: string;
  recipientType: 'patient' | 'professional';
  status: string;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  method: string;
  methodLabel: string;
  methodIcon: string;
  sharedAt: string;
  sharedBy: string;
  expirationDate?: string;
  isExpired: boolean;
  expiresIn?: string;
  viewCount: number;
  lastViewedAt?: string;
  canDownload: boolean;
  shareUrl: string;
}

export class ResourcePresenter {
  /**
   * Present resource for list display
   */
  presentForList(resource: Resource, category?: ResourceCategory): ResourceListItemViewModel {
    return {
      id: resource.id,
      title: resource.title,
      description: this.truncateDescription(resource.description),
      type: resource.type,
      typeLabel: this.getTypeLabel(resource.type),
      typeIcon: this.getTypeIcon(resource.type),
      categoryId: resource.categoryId,
      categoryName: category?.name,
      status: resource.status,
      statusLabel: this.getStatusLabel(resource.status),
      statusColor: this.getStatusColor(resource.status),
      access: resource.access,
      accessLabel: this.getAccessLabel(resource.access),
      accessIcon: this.getAccessIcon(resource.access),
      thumbnailUrl: resource.content.thumbnailUrl,
      tags: resource.tags,
      targetAudience: resource.targetAudience,
      createdBy: resource.createdBy,
      createdAt: this.formatDate(resource.createdAt),
      updatedAt: this.formatDate(resource.updatedAt),
      views: resource.analytics.views,
      downloads: resource.analytics.downloads,
      shares: resource.analytics.shares,
      rating: resource.analytics.ratings.average,
      ratingCount: resource.analytics.ratings.count,
      isExpired: resource.isExpired(),
      canShare: resource.canBeShared(),
      canDownload: resource.canBeDownloaded(),
      canEdit: resource.status !== 'published', // Simplified permission check
      popularityScore: resource.getPopularityScore(),
      fileSize: this.formatFileSize(resource.metadata.fileSize),
      duration: this.formatDuration(resource.metadata.duration)
    };
  }

  /**
   * Present list of resources
   */
  presentList(resources: Resource[], categories?: ResourceCategory[]): ResourceListItemViewModel[] {
    return resources.map(resource => {
      const category = categories?.find(c => c.id === resource.categoryId);
      return this.presentForList(resource, category);
    });
  }

  /**
   * Present resource for detailed view
   */
  presentForDetails(resource: Resource, category?: ResourceCategory): ResourceDetailsViewModel {
    return {
      // Basic Information
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      typeLabel: this.getTypeLabel(resource.type),
      typeIcon: this.getTypeIcon(resource.type),
      categoryId: resource.categoryId,
      categoryName: category?.name,
      status: resource.status,
      statusLabel: this.getStatusLabel(resource.status),
      statusColor: this.getStatusColor(resource.status),
      statusBadge: this.getStatusBadge(resource.status),
      access: resource.access,
      accessLabel: this.getAccessLabel(resource.access),
      accessIcon: this.getAccessIcon(resource.access),
      
      // Content
      content: resource.content,
      
      // Metadata
      metadata: {
        author: resource.metadata.author,
        version: resource.metadata.version,
        lastModified: this.formatDateTime(resource.metadata.lastModified),
        fileSize: this.formatFileSize(resource.metadata.fileSize),
        duration: this.formatDuration(resource.metadata.duration),
        pages: resource.metadata.pages,
        keywords: resource.metadata.keywords
      },
      
      // Tags and Audience
      tags: resource.tags,
      targetAudience: resource.targetAudience,
      targetAudienceLabels: resource.targetAudience.map(audience => this.getAudienceLabel(audience)),
      
      // Settings
      allowDownload: resource.allowDownload,
      allowSharing: resource.allowSharing,
      requiresWatermark: resource.requiresWatermark,
      isTemplate: resource.isTemplate,
      isFeatured: resource.isFeatured,
      
      // Dates
      createdAt: this.formatDateTime(resource.createdAt),
      updatedAt: this.formatDateTime(resource.updatedAt),
      expirationDate: resource.expirationDate ? this.formatDateTime(resource.expirationDate) : undefined,
      isExpired: resource.isExpired(),
      expiresIn: resource.expirationDate ? this.getExpiresIn(resource.expirationDate) : undefined,
      
      // Analytics
      analytics: {
        views: resource.analytics.views,
        downloads: resource.analytics.downloads,
        shares: resource.analytics.shares,
        uniqueShares: resource.distribution.uniqueRecipients,
        rating: resource.analytics.ratings.average,
        ratingCount: resource.analytics.ratings.count,
        ratingDistribution: resource.analytics.ratings.distribution,
        engagement: {
          averageViewTime: this.formatDuration(resource.analytics.engagement.averageViewTime),
          completionRate: resource.analytics.engagement.completionRate,
          interactionRate: resource.analytics.engagement.interactionRate
        },
        popularityScore: resource.getPopularityScore()
      },
      
      // Permissions (simplified)
      canView: true,
      canDownload: resource.canBeDownloaded(),
      canShare: resource.canBeShared(),
      canEdit: resource.status !== 'published',
      canDelete: resource.status === 'draft',
      canPublish: resource.status === 'draft',
      
      // Display helpers
      shareableLink: `/resources/${resource.id}`,
      breadcrumbs: this.generateBreadcrumbs(resource, category)
    };
  }

  /**
   * Present resource for card display
   */
  presentForCard(resource: Resource): ResourceCardViewModel {
    return {
      id: resource.id,
      title: resource.title,
      description: this.truncateDescription(resource.description, 100),
      type: resource.type,
      typeLabel: this.getTypeLabel(resource.type),
      typeIcon: this.getTypeIcon(resource.type),
      typeColor: this.getTypeColor(resource.type),
      thumbnailUrl: resource.content.thumbnailUrl,
      status: resource.status,
      statusBadge: this.getStatusBadge(resource.status),
      views: resource.analytics.views,
      downloads: resource.analytics.downloads,
      rating: resource.analytics.ratings.average,
      createdAt: this.formatDate(resource.createdAt),
      canShare: resource.canBeShared(),
      canDownload: resource.canBeDownloaded(),
      isExpired: resource.isExpired(),
      tags: resource.tags.slice(0, 3) // Show only first 3 tags
    };
  }

  /**
   * Present resource statistics
   */
  presentStats(
    resources: Resource[],
    categories?: ResourceCategory[]
  ): ResourceStatsViewModel {
    const totalResources = resources.length;
    const publishedResources = resources.filter(r => r.status === 'published').length;
    const draftResources = resources.filter(r => r.status === 'draft').length;
    const archivedResources = resources.filter(r => r.status === 'archived').length;

    const totalViews = resources.reduce((sum, r) => sum + r.analytics.views, 0);
    const totalDownloads = resources.reduce((sum, r) => sum + r.analytics.downloads, 0);
    const totalShares = resources.reduce((sum, r) => sum + r.analytics.shares, 0);

    const ratingsSum = resources.reduce((sum, r) => sum + (r.analytics.ratings.average * r.analytics.ratings.count), 0);
    const ratingsCount = resources.reduce((sum, r) => sum + r.analytics.ratings.count, 0);
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Type distribution
    const typeDistribution = this.calculateTypeDistribution(resources);

    // Category distribution
    const categoryDistribution = this.calculateCategoryDistribution(resources, categories);

    // Top performers (by popularity score)
    const topPerformers = resources
      .sort((a, b) => b.getPopularityScore() - a.getPopularityScore())
      .slice(0, 5)
      .map(resource => this.presentForCard(resource));

    return {
      totalResources,
      publishedResources,
      draftResources,
      archivedResources,
      totalViews,
      totalDownloads,
      totalShares,
      averageRating: Math.round(averageRating * 10) / 10,
      growthRate: 0, // Would calculate from historical data
      typeDistribution,
      categoryDistribution,
      topPerformers
    };
  }

  /**
   * Present resource share
   */
  presentShare(share: ResourceShare): ResourceShareViewModel {
    return {
      id: share.id,
      resourceId: share.resourceId,
      resourceTitle: share.resourceTitle,
      recipientName: share.recipient.name,
      recipientEmail: share.recipient.email,
      recipientType: share.recipient.type === 'external' ? 'professional' : share.recipient.type,
      status: share.status,
      statusLabel: this.getShareStatusLabel(share.status),
      statusColor: this.getShareStatusColor(share.status),
      method: share.method,
      methodLabel: this.getShareMethodLabel(share.method),
      methodIcon: this.getShareMethodIcon(share.method),
      sharedAt: this.formatDateTime(share.sharedAt),
      sharedBy: share.sharedByName,
      expirationDate: share.expirationDate ? this.formatDateTime(share.expirationDate) : undefined,
      isExpired: share.isExpired(),
      expiresIn: share.expirationDate ? this.getExpiresIn(share.expirationDate) : undefined,
      viewCount: share.viewCount,
      lastViewedAt: share.lastViewedAt ? this.formatDateTime(share.lastViewedAt) : undefined,
      canDownload: share.settings.allowDownload,
      shareUrl: `/share/${share.id}`
    };
  }

  /**
   * Present list of resource shares
   */
  presentShareList(shares: ResourceShare[]): ResourceShareViewModel[] {
    return shares.map(share => this.presentShare(share));
  }

  /**
   * Private helper methods for formatting and labeling
   */
  private truncateDescription(description: string, maxLength: number = 150): string {
    return description.length > maxLength 
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private formatFileSize(bytes?: number): string | undefined {
    if (!bytes) return undefined;
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private formatDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private getExpiresIn(expirationDate: Date): string {
    const now = new Date();
    const diff = expirationDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expirado';
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    
    const months = Math.ceil(days / 30);
    if (months === 1) return '1 mes';
    return `${months} meses`;
  }

  private getTypeLabel(type: ResourceType): string {
    const labels: Record<ResourceType, string> = {
      pdf: 'Documento PDF',
      image: 'Imagen',
      video: 'Video',
      audio: 'Audio',
      link: 'Enlace',
      document: 'Documento'
    };
    return labels[type] || type;
  }

  private getTypeIcon(type: ResourceType): string {
    const icons: Record<ResourceType, string> = {
      pdf: 'document-text',
      image: 'photo',
      video: 'video-camera',
      audio: 'musical-note',
      link: 'link',
      document: 'document'
    };
    return icons[type] || 'document';
  }

  private getTypeColor(type: ResourceType): string {
    const colors: Record<ResourceType, string> = {
      pdf: 'red',
      image: 'green',
      video: 'blue',
      audio: 'purple',
      link: 'indigo',
      document: 'gray'
    };
    return colors[type] || 'gray';
  }

  private getStatusLabel(status: ResourceStatus): string {
    const labels: Record<ResourceStatus, string> = {
      draft: 'Borrador',
      published: 'Publicado',
      archived: 'Archivado',
      private: 'Privado'
    };
    return labels[status] || status;
  }

  private getStatusColor(status: ResourceStatus): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
    const colors: Record<ResourceStatus, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
      draft: 'yellow',
      published: 'green',
      archived: 'gray',
      private: 'blue'
    };
    return colors[status] || 'gray';
  }

  private getStatusBadge(status: ResourceStatus): { label: string; color: string; icon: string } {
    const badges: Record<ResourceStatus, { label: string; color: string; icon: string }> = {
      draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800', icon: 'pencil' },
      published: { label: 'Publicado', color: 'bg-green-100 text-green-800', icon: 'check-circle' },
      archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-800', icon: 'archive' },
      private: { label: 'Privado', color: 'bg-blue-100 text-blue-800', icon: 'lock-closed' }
    };
    return badges[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: 'question-mark' };
  }

  private getAccessLabel(access: ResourceAccess): string {
    const labels: Record<ResourceAccess, string> = {
      public: 'Público',
      professional_only: 'Solo Profesionales',
      restricted: 'Restringido'
    };
    return labels[access] || access;
  }

  private getAccessIcon(access: ResourceAccess): string {
    const icons: Record<ResourceAccess, string> = {
      public: 'globe-alt',
      professional_only: 'user-group',
      restricted: 'lock-closed'
    };
    return icons[access] || 'question-mark';
  }

  private getAudienceLabel(audience: string): string {
    // This would normally come from a configuration or translation service
    const labels: Record<string, string> = {
      'general': 'General',
      'adults': 'Adultos',
      'children': 'Niños',
      'elderly': 'Adultos Mayores',
      'professionals': 'Profesionales'
    };
    return labels[audience] || audience;
  }

  private getShareStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      sent: 'Enviado',
      delivered: 'Entregado',
      viewed: 'Visto',
      failed: 'Falló',
      expired: 'Expirado'
    };
    return labels[status] || status;
  }

  private getShareStatusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
    const colors: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
      pending: 'yellow',
      sent: 'blue',
      delivered: 'green',
      viewed: 'green',
      failed: 'red',
      expired: 'gray'
    };
    return colors[status] || 'gray';
  }

  private getShareMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      email: 'Correo',
      portal: 'Portal',
      link: 'Enlace',
      download: 'Descarga',
      print: 'Impresión'
    };
    return labels[method] || method;
  }

  private getShareMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      email: 'mail',
      portal: 'computer-desktop',
      link: 'link',
      download: 'arrow-down-tray',
      print: 'printer'
    };
    return icons[method] || 'question-mark';
  }

  private calculateTypeDistribution(resources: Resource[]): Array<{ type: string; count: number; percentage: number }> {
    const distribution = resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = resources.length;
    return Object.entries(distribution).map(([type, count]) => ({
      type: this.getTypeLabel(type as ResourceType),
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private calculateCategoryDistribution(
    resources: Resource[], 
    categories?: ResourceCategory[]
  ): Array<{ categoryId: string; categoryName: string; count: number }> {
    const distribution = resources.reduce((acc, resource) => {
      acc[resource.categoryId] = (acc[resource.categoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([categoryId, count]) => {
      const category = categories?.find(c => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || 'Sin categoría',
        count
      };
    });
  }

  private generateBreadcrumbs(
    resource: Resource, 
    category?: ResourceCategory
  ): Array<{ id: string; name: string; url: string }> {
    const breadcrumbs = [
      { id: 'resources', name: 'Recursos', url: '/resources' }
    ];

    if (category) {
      breadcrumbs.push({
        id: category.id,
        name: category.name,
        url: `/resources/category/${category.id}`
      });
    }

    breadcrumbs.push({
      id: resource.id,
      name: resource.title,
      url: `/resources/${resource.id}`
    });

    return breadcrumbs;
  }
}