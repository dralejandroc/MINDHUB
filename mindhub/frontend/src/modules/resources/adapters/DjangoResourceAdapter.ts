/**
 * Django Resource Adapter
 * Implementation of ResourceRepository using Django REST API
 */

import { 
  Resource, 
  ResourceType, 
  ResourceStatus, 
  ResourceAccess,
  ResourceMetadata,
  ResourceContent,
  ResourceDistribution,
  ResourceAnalytics
} from '../entities/Resource';
import { ResourceRepository, ResourceSearchFilters, ResourceAnalyticsData } from '../repositories/ResourceRepository';

interface DjangoResourceResponse {
  id: string;
  title: string;
  description: string;
  type: string;
  category_id: string;
  status: string;
  access: string;
  content: {
    original_url: string;
    thumbnail_url?: string;
    preview_url?: string;
    download_url?: string;
    streaming_url?: string;
    embed_code?: string;
  };
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
    version: string;
    last_modified: string;
    file_size?: number;
    duration?: number;
    pages?: number;
  };
  tags: string[];
  target_audience: string[];
  clinic_id?: string;
  workspace_id?: string;
  created_by: string;
  is_template: boolean;
  requires_watermark: boolean;
  allow_download: boolean;
  allow_sharing: boolean;
  expiration_date?: string;
  distribution: {
    total_shares: number;
    unique_recipients: number;
    last_shared_at?: string;
    most_shared_with: string[];
    share_history: Array<{
      shared_at: string;
      shared_by: string;
      recipient_type: string;
      recipient_id: string;
      method: string;
    }>;
  };
  analytics: {
    views: number;
    downloads: number;
    shares: number;
    ratings: {
      average: number;
      count: number;
      distribution: { [stars: number]: number };
    };
    engagement: {
      average_view_time: number;
      completion_rate: number;
      interaction_rate: number;
    };
    feedback: Array<{
      id: string;
      rating: number;
      comment: string;
      created_by: string;
      created_at: string;
      is_public: boolean;
    }>;
  };
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export class DjangoResourceAdapter implements ResourceRepository {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = '/api/resources/django') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private buildQueryParams(filters?: ResourceSearchFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
    if (filters.categoryId) params.append('category_id', filters.categoryId);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.access) params.append('access', filters.access);
    if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters.targetAudience) filters.targetAudience.forEach(audience => params.append('target_audience', audience));
    if (filters.includeExpired) params.append('include_expired', filters.includeExpired.toString());
    if (filters.createdBy) params.append('created_by', filters.createdBy);
    if (filters.dateRange) {
      params.append('date_start', filters.dateRange.start.toISOString());
      params.append('date_end', filters.dateRange.end.toISOString());
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  private mapDjangoResponseToResource(data: DjangoResourceResponse): Resource {
    const content: ResourceContent = {
      originalUrl: data.content.original_url,
      thumbnailUrl: data.content.thumbnail_url,
      previewUrl: data.content.preview_url,
      downloadUrl: data.content.download_url,
      streamingUrl: data.content.streaming_url,
      embedCode: data.content.embed_code
    };

    const metadata: ResourceMetadata = {
      title: data.metadata.title,
      description: data.metadata.description,
      keywords: data.metadata.keywords,
      author: data.metadata.author,
      version: data.metadata.version,
      lastModified: new Date(data.metadata.last_modified),
      fileSize: data.metadata.file_size,
      duration: data.metadata.duration,
      pages: data.metadata.pages
    };

    const distribution: ResourceDistribution = {
      totalShares: data.distribution.total_shares,
      uniqueRecipients: data.distribution.unique_recipients,
      lastSharedAt: data.distribution.last_shared_at ? new Date(data.distribution.last_shared_at) : undefined,
      mostSharedWith: data.distribution.most_shared_with,
      shareHistory: data.distribution.share_history.map(h => ({
        sharedAt: new Date(h.shared_at),
        sharedBy: h.shared_by,
        recipientType: h.recipient_type as 'patient' | 'professional',
        recipientId: h.recipient_id,
        method: h.method as 'email' | 'portal' | 'link'
      }))
    };

    const analytics: ResourceAnalytics = {
      views: data.analytics.views,
      downloads: data.analytics.downloads,
      shares: data.analytics.shares,
      ratings: data.analytics.ratings,
      engagement: {
        averageViewTime: data.analytics.engagement.average_view_time,
        completionRate: data.analytics.engagement.completion_rate,
        interactionRate: data.analytics.engagement.interaction_rate
      },
      feedback: data.analytics.feedback.map(f => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdBy: f.created_by,
        createdAt: new Date(f.created_at),
        isPublic: f.is_public
      }))
    };

    return new Resource(
      data.id,
      data.title,
      data.description,
      data.type as ResourceType,
      data.category_id,
      data.status as ResourceStatus,
      data.access as ResourceAccess,
      content,
      metadata,
      data.tags,
      data.target_audience,
      data.clinic_id,
      data.workspace_id,
      data.created_by,
      data.is_template,
      data.requires_watermark,
      data.allow_download,
      data.allow_sharing,
      data.expiration_date ? new Date(data.expiration_date) : undefined,
      distribution,
      analytics,
      data.is_active,
      data.is_featured,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  async findById(id: string): Promise<Resource | undefined> {
    try {
      const response = await this.makeRequest(`/resources/${id}/`);
      return this.mapDjangoResponseToResource(response);
    } catch (error) {
      if (error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findAll(filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await this.makeRequest(`/resources/${queryParams}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding all resources:', error);
      return [];
    }
  }

  async search(query: string, filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const params = new URLSearchParams(this.buildQueryParams(filters));
      params.append('search', query);
      const response = await this.makeRequest(`/resources/search/?${params.toString()}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  }

  async findByCategory(categoryId: string, filters?: ResourceSearchFilters): Promise<Resource[]> {
    const categoryFilters = { ...filters, categoryId };
    return this.findAll(categoryFilters);
  }

  async findByType(type: ResourceType, filters?: ResourceSearchFilters): Promise<Resource[]> {
    const typeFilters = { ...filters, type };
    return this.findAll(typeFilters);
  }

  async findByStatus(status: ResourceStatus, filters?: ResourceSearchFilters): Promise<Resource[]> {
    const statusFilters = { ...filters, status };
    return this.findAll(statusFilters);
  }

  async findByTags(tags: string[], filters?: ResourceSearchFilters): Promise<Resource[]> {
    const tagFilters = { ...filters, tags };
    return this.findAll(tagFilters);
  }

  async findFeatured(filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await this.makeRequest(`/resources/featured/${queryParams}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding featured resources:', error);
      return [];
    }
  }

  async findPopular(limit: number, filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const params = new URLSearchParams(this.buildQueryParams(filters));
      params.append('limit', limit.toString());
      const response = await this.makeRequest(`/resources/popular/?${params.toString()}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding popular resources:', error);
      return [];
    }
  }

  async findRecent(limit: number, filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const params = new URLSearchParams(this.buildQueryParams(filters));
      params.append('limit', limit.toString());
      const response = await this.makeRequest(`/resources/recent/?${params.toString()}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding recent resources:', error);
      return [];
    }
  }

  async findByTargetAudience(audience: string[], filters?: ResourceSearchFilters): Promise<Resource[]> {
    const audienceFilters = { ...filters, targetAudience: audience };
    return this.findAll(audienceFilters);
  }

  async findByCreator(creatorId: string, filters?: ResourceSearchFilters): Promise<Resource[]> {
    const creatorFilters = { ...filters, createdBy: creatorId };
    return this.findAll(creatorFilters);
  }

  async findTemplates(filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await this.makeRequest(`/resources/templates/${queryParams}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding template resources:', error);
      return [];
    }
  }

  async findSimilar(resourceId: string, limit: number): Promise<Resource[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      const response = await this.makeRequest(`/resources/${resourceId}/similar/?${params.toString()}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding similar resources:', error);
      return [];
    }
  }

  async findExpiringSoon(days: number, filters?: ResourceSearchFilters): Promise<Resource[]> {
    try {
      const params = new URLSearchParams(this.buildQueryParams(filters));
      params.append('expiring_days', days.toString());
      const response = await this.makeRequest(`/resources/expiring/?${params.toString()}`);
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error finding expiring resources:', error);
      return [];
    }
  }

  async create(resource: Resource): Promise<Resource> {
    try {
      const requestData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        category_id: resource.categoryId,
        status: resource.status,
        access: resource.access,
        content: resource.content,
        metadata: resource.metadata,
        tags: resource.tags,
        target_audience: resource.targetAudience,
        clinic_id: resource.clinicId,
        workspace_id: resource.workspaceId,
        created_by: resource.createdBy,
        is_template: resource.isTemplate,
        requires_watermark: resource.requiresWatermark,
        allow_download: resource.allowDownload,
        allow_sharing: resource.allowSharing,
        expiration_date: resource.expirationDate?.toISOString()
      };

      const response = await this.makeRequest('/resources/', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      return this.mapDjangoResponseToResource(response);
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  async update(resource: Resource): Promise<Resource> {
    try {
      const requestData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        category_id: resource.categoryId,
        status: resource.status,
        access: resource.access,
        content: resource.content,
        metadata: resource.metadata,
        tags: resource.tags,
        target_audience: resource.targetAudience,
        is_template: resource.isTemplate,
        requires_watermark: resource.requiresWatermark,
        allow_download: resource.allowDownload,
        allow_sharing: resource.allowSharing,
        expiration_date: resource.expirationDate?.toISOString(),
        distribution: resource.distribution,
        analytics: resource.analytics,
        is_active: resource.isActive,
        is_featured: resource.isFeatured
      };

      const response = await this.makeRequest(`/resources/${resource.id}/`, {
        method: 'PUT',
        body: JSON.stringify(requestData)
      });

      return this.mapDjangoResponseToResource(response);
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.makeRequest(`/resources/${id}/`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  async restore(id: string): Promise<Resource> {
    try {
      const response = await this.makeRequest(`/resources/${id}/restore/`, {
        method: 'POST'
      });
      return this.mapDjangoResponseToResource(response);
    } catch (error) {
      console.error('Error restoring resource:', error);
      throw error;
    }
  }

  async permanentDelete(id: string): Promise<void> {
    try {
      await this.makeRequest(`/resources/${id}/permanent/`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error permanently deleting resource:', error);
      throw error;
    }
  }

  // Implement remaining methods with similar pattern...
  // For brevity, showing the core CRUD operations

  async bulkUpdateStatus(resourceIds: string[], status: ResourceStatus, updatedBy: string): Promise<Resource[]> {
    try {
      const response = await this.makeRequest('/resources/bulk-update-status/', {
        method: 'POST',
        body: JSON.stringify({
          resource_ids: resourceIds,
          status,
          updated_by: updatedBy
        })
      });
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error bulk updating resource status:', error);
      throw error;
    }
  }

  async bulkUpdateCategory(resourceIds: string[], categoryId: string, updatedBy: string): Promise<Resource[]> {
    try {
      const response = await this.makeRequest('/resources/bulk-update-category/', {
        method: 'POST',
        body: JSON.stringify({
          resource_ids: resourceIds,
          category_id: categoryId,
          updated_by: updatedBy
        })
      });
      return response.results.map((item: DjangoResourceResponse) => 
        this.mapDjangoResponseToResource(item)
      );
    } catch (error) {
      console.error('Error bulk updating resource category:', error);
      throw error;
    }
  }

  async bulkDelete(resourceIds: string[], deletedBy: string): Promise<void> {
    try {
      await this.makeRequest('/resources/bulk-delete/', {
        method: 'POST',
        body: JSON.stringify({
          resource_ids: resourceIds,
          deleted_by: deletedBy
        })
      });
    } catch (error) {
      console.error('Error bulk deleting resources:', error);
      throw error;
    }
  }

  // Placeholder implementations for remaining methods
  async getStatistics(filters?: ResourceSearchFilters): Promise<any> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await this.makeRequest(`/resources/statistics/${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  async getAnalytics(resourceId: string, startDate: Date, endDate: Date): Promise<ResourceAnalyticsData[]> {
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate.toISOString());
      params.append('end_date', endDate.toISOString());
      const response = await this.makeRequest(`/resources/${resourceId}/analytics/?${params.toString()}`);
      return response.results || [];
    } catch (error) {
      console.error('Error getting analytics:', error);
      return [];
    }
  }

  // Add placeholder implementations for remaining methods...
  async getTrending(): Promise<Resource[]> { return []; }
  async getPerformanceMetrics(): Promise<any[]> { return []; }
  async getRecommendations(): Promise<Resource[]> { return []; }
  async advancedSearch(): Promise<any> { return { resources: [], total: 0, facets: {} }; }
  async validateUpload(): Promise<any> { return { isValid: true, errors: [], warnings: [], estimatedProcessingTime: 0 }; }
  async processUpload(): Promise<any> { return { resourceId: '', processingStatus: 'processing', previewUrls: [] }; }
  async getUploadProgress(): Promise<any> { return { progress: 0, status: 'uploading', estimatedTimeRemaining: 0, currentStep: '' }; }
  async exportData(): Promise<any> { return { downloadUrl: '', filename: '', size: 0, recordCount: 0 }; }
  async importResources(): Promise<any> { return { importId: '', totalRecords: 0, successCount: 0, errorCount: 0, errors: [] }; }
  async getUsageAnalytics(): Promise<any> { return { totalViews: 0, totalDownloads: 0, totalShares: 0, uniqueUsers: 0, topResources: [], dailyStats: [], userEngagement: {} }; }
  async getStorageUsage(): Promise<any> { return { totalSize: 0, usedSize: 0, availableSize: 0, fileDistribution: {}, largestFiles: [] }; }
  async optimizeStorage(): Promise<any> { return { optimizationId: '', estimatedSavings: 0, affectedResources: [] }; }
}