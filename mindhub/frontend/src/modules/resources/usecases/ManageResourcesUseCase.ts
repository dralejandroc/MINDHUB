/**
 * Manage Resources Use Case
 * Business logic for resource management operations
 */

import { Resource, ResourceType, ResourceStatus, ResourceAccess } from '../entities/Resource';
import { ResourceCategory } from '../entities/ResourceCategory';
import { ResourceRepository } from '../repositories/ResourceRepository';
import { ResourceCategoryRepository } from '../repositories/ResourceCategoryRepository';

export interface CreateResourceRequest {
  title: string;
  description: string;
  type: ResourceType;
  categoryId: string;
  content: {
    originalUrl: string;
    thumbnailUrl?: string;
    previewUrl?: string;
  };
  tags: string[];
  targetAudience: string[];
  access: ResourceAccess;
  allowDownload: boolean;
  allowSharing: boolean;
  requiresWatermark: boolean;
  expirationDate?: Date;
  clinicId?: string;
  workspaceId?: string;
  createdBy: string;
}

export interface UpdateResourceRequest {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  targetAudience?: string[];
  access?: ResourceAccess;
  allowDownload?: boolean;
  allowSharing?: boolean;
  requiresWatermark?: boolean;
  expirationDate?: Date;
  updatedBy: string;
}

export interface SearchResourcesRequest {
  query?: string;
  categoryId?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  tags?: string[];
  targetAudience?: string[];
  createdBy?: string;
  clinicId?: string;
  workspaceId?: string;
  includeExpired?: boolean;
  sortBy?: 'date' | 'title' | 'views' | 'downloads' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ResourceOperationResult {
  success: boolean;
  resource?: Resource;
  error?: string;
  warnings?: string[];
}

export interface ResourceListResult {
  resources: Resource[];
  total: number;
  hasMore: boolean;
}

export class ManageResourcesUseCase {
  constructor(
    private resourceRepository: ResourceRepository,
    private categoryRepository: ResourceCategoryRepository
  ) {}

  /**
   * Create a new resource
   */
  async createResource(request: CreateResourceRequest): Promise<ResourceOperationResult> {
    try {
      // Validate input
      this.validateCreateResourceRequest(request);

      // Check if category exists and is accessible
      const category = await this.categoryRepository.findById(request.categoryId);
      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      if (category.status !== 'active') {
        return {
          success: false,
          error: 'Cannot create resource in inactive category'
        };
      }

      // Business rule: Check tenant consistency
      if (request.clinicId && category.clinicId && request.clinicId !== category.clinicId) {
        return {
          success: false,
          error: 'Resource and category must belong to the same clinic'
        };
      }

      if (request.workspaceId && category.workspaceId && request.workspaceId !== category.workspaceId) {
        return {
          success: false,
          error: 'Resource and category must belong to the same workspace'
        };
      }

      // Generate resource ID
      const resourceId = this.generateResourceId();

      // Create resource entity
      const resource = new Resource(
        resourceId,
        request.title,
        request.description,
        request.type,
        request.categoryId,
        'draft', // New resources start as draft
        request.access,
        request.content,
        {
          title: request.title,
          description: request.description,
          keywords: request.tags,
          author: request.createdBy,
          version: '1.0',
          lastModified: new Date()
        },
        request.tags,
        request.targetAudience,
        request.clinicId,
        request.workspaceId,
        request.createdBy,
        false, // Not a template by default
        request.requiresWatermark,
        request.allowDownload,
        request.allowSharing,
        request.expirationDate
      );

      // Save resource
      const savedResource = await this.resourceRepository.create(resource);

      // Update category statistics
      await this.categoryRepository.update(
        category.addResourceToStatistics(request.type, false)
      );

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create resource'
      };
    }
  }

  /**
   * Update an existing resource
   */
  async updateResource(request: UpdateResourceRequest): Promise<ResourceOperationResult> {
    try {
      // Find existing resource
      const existingResource = await this.resourceRepository.findById(request.id);
      if (!existingResource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      // Validate category change if provided
      let newCategory: ResourceCategory | undefined;
      if (request.categoryId && request.categoryId !== existingResource.categoryId) {
        newCategory = await this.categoryRepository.findById(request.categoryId);
        if (!newCategory) {
          return {
            success: false,
            error: 'New category not found'
          };
        }

        if (newCategory.status !== 'active') {
          return {
            success: false,
            error: 'Cannot move resource to inactive category'
          };
        }

        // Business rule: Check tenant consistency
        if (existingResource.clinicId && newCategory.clinicId && 
            existingResource.clinicId !== newCategory.clinicId) {
          return {
            success: false,
            error: 'Cannot move resource to category in different clinic'
          };
        }

        if (existingResource.workspaceId && newCategory.workspaceId && 
            existingResource.workspaceId !== newCategory.workspaceId) {
          return {
            success: false,
            error: 'Cannot move resource to category in different workspace'
          };
        }
      }

      // Create updated resource
      const updatedResource = new Resource(
        existingResource.id,
        request.title ?? existingResource.title,
        request.description ?? existingResource.description,
        existingResource.type,
        request.categoryId ?? existingResource.categoryId,
        existingResource.status,
        request.access ?? existingResource.access,
        existingResource.content,
        {
          ...existingResource.metadata,
          title: request.title ?? existingResource.title,
          description: request.description ?? existingResource.description,
          keywords: request.tags ?? existingResource.tags,
          lastModified: new Date()
        },
        request.tags ?? existingResource.tags,
        request.targetAudience ?? existingResource.targetAudience,
        existingResource.clinicId,
        existingResource.workspaceId,
        existingResource.createdBy,
        existingResource.isTemplate,
        request.requiresWatermark ?? existingResource.requiresWatermark,
        request.allowDownload ?? existingResource.allowDownload,
        request.allowSharing ?? existingResource.allowSharing,
        request.expirationDate ?? existingResource.expirationDate,
        existingResource.distribution,
        existingResource.analytics,
        existingResource.isActive,
        existingResource.isFeatured,
        existingResource.createdAt,
        new Date()
      );

      // Save updated resource
      const savedResource = await this.resourceRepository.update(updatedResource);

      // Update category statistics if category changed
      if (newCategory && request.categoryId !== existingResource.categoryId) {
        const oldCategory = await this.categoryRepository.findById(existingResource.categoryId);
        if (oldCategory) {
          // This would normally decrement the old category's stats
          // For simplicity, we're not implementing full statistics management
        }
        
        await this.categoryRepository.update(
          newCategory.addResourceToStatistics(existingResource.type, existingResource.status === 'published')
        );
      }

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update resource'
      };
    }
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: string, deletedBy: string): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      // Business rule: Cannot delete resources with active shares
      // This would normally check for active shares
      // For simplicity, we're allowing all deletions

      await this.resourceRepository.delete(resourceId);

      return {
        success: true,
        resource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete resource'
      };
    }
  }

  /**
   * Publish a resource (change status from draft to published)
   */
  async publishResource(resourceId: string, publishedBy: string): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      if (resource.status === 'published') {
        return {
          success: false,
          error: 'Resource is already published'
        };
      }

      if (resource.isExpired()) {
        return {
          success: false,
          error: 'Cannot publish expired resource'
        };
      }

      const publishedResource = resource.updateStatus('published', publishedBy);
      const savedResource = await this.resourceRepository.update(publishedResource);

      // Update category statistics
      const category = await this.categoryRepository.findById(resource.categoryId);
      if (category) {
        await this.categoryRepository.update(
          category.addResourceToStatistics(resource.type, true)
        );
      }

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish resource'
      };
    }
  }

  /**
   * Archive a resource
   */
  async archiveResource(resourceId: string, archivedBy: string): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      const archivedResource = resource.updateStatus('archived', archivedBy);
      const savedResource = await this.resourceRepository.update(archivedResource);

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive resource'
      };
    }
  }

  /**
   * Search resources
   */
  async searchResources(request: SearchResourcesRequest): Promise<ResourceListResult> {
    try {
      const filters = {
        clinicId: request.clinicId,
        workspaceId: request.workspaceId,
        categoryId: request.categoryId,
        type: request.type,
        status: request.status,
        tags: request.tags,
        targetAudience: request.targetAudience,
        includeExpired: request.includeExpired,
        createdBy: request.createdBy
      };

      let resources: Resource[];

      if (request.query) {
        resources = await this.resourceRepository.search(request.query, filters);
      } else {
        resources = await this.resourceRepository.findAll(filters);
      }

      // Apply sorting
      if (request.sortBy) {
        resources = this.sortResources(resources, request.sortBy, request.sortOrder);
      }

      // Apply pagination
      const offset = request.offset || 0;
      const limit = request.limit || 50;
      const paginatedResources = resources.slice(offset, offset + limit);

      return {
        resources: paginatedResources,
        total: resources.length,
        hasMore: offset + paginatedResources.length < resources.length
      };

    } catch (error) {
      return {
        resources: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get resource by ID
   */
  async getResource(resourceId: string): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      return {
        success: true,
        resource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get resource'
      };
    }
  }

  /**
   * Record resource view
   */
  async recordView(resourceId: string, viewDuration?: number): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      const updatedResource = resource.recordView(viewDuration);
      const savedResource = await this.resourceRepository.update(updatedResource);

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record view'
      };
    }
  }

  /**
   * Record resource download
   */
  async recordDownload(resourceId: string): Promise<ResourceOperationResult> {
    try {
      const resource = await this.resourceRepository.findById(resourceId);
      
      if (!resource) {
        return {
          success: false,
          error: 'Resource not found'
        };
      }

      const updatedResource = resource.recordDownload();
      const savedResource = await this.resourceRepository.update(updatedResource);

      return {
        success: true,
        resource: savedResource
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record download'
      };
    }
  }

  /**
   * Private helper methods
   */
  private validateCreateResourceRequest(request: CreateResourceRequest): void {
    if (!request.title.trim()) {
      throw new Error('Resource title is required');
    }

    if (!request.description.trim()) {
      throw new Error('Resource description is required');
    }

    if (!request.categoryId.trim()) {
      throw new Error('Category ID is required');
    }

    if (!request.content.originalUrl.trim()) {
      throw new Error('Resource content URL is required');
    }

    if (!request.createdBy.trim()) {
      throw new Error('Created by user ID is required');
    }

    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Either clinic ID or workspace ID is required');
    }

    if (request.clinicId && request.workspaceId) {
      throw new Error('Cannot specify both clinic ID and workspace ID');
    }
  }

  private sortResources(resources: Resource[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Resource[] {
    return resources.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'views':
          comparison = a.analytics.views - b.analytics.views;
          break;
        case 'downloads':
          comparison = a.analytics.downloads - b.analytics.downloads;
          break;
        case 'rating':
          comparison = a.analytics.ratings.average - b.analytics.ratings.average;
          break;
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private generateResourceId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}