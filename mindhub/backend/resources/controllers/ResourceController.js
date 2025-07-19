/**
 * Resource Controller for Resources Hub
 * 
 * Handles business logic for psychoeducational resources management
 */

const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');
const { v4: uuidv4 } = require('uuid');

const auditLogger = new AuditLogger();

class ResourceController {
  /**
   * Get all resources with filtering and pagination
   */
  async getAllResources(filters = {}, pagination = {}) {
    try {
      const {
        category,
        type,
        language = 'es',
        isActive = true,
        search,
        tags
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause = {
        isActive: isActive,
        language: language
      };

      if (category) whereClause.category = category;
      if (type) whereClause.type = type;
      if (tags && tags.length > 0) whereClause.tags = { hasSome: tags };

      // Add search functionality
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { keywords: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get resources with pagination
      const [resources, totalCount] = await executeTransaction([
        (prisma) => prisma.resource.findMany({
          where: whereClause,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            currentVersion: {
              select: {
                id: true,
                versionNumber: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true
              }
            },
            _count: {
              select: {
                distributions: true,
                downloads: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        (prisma) => prisma.resource.count({ where: whereClause })
      ], 'getAllResources');

      return {
        resources,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get resources', { error: error.message });
      throw new Error('Failed to retrieve resources');
    }
  }

  /**
   * Get resource by ID
   */
  async getResourceById(id, userId = null) {
    try {
      const resource = await executeQuery(
        (prisma) => prisma.resource.findUnique({
          where: { id },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            currentVersion: {
              select: {
                id: true,
                versionNumber: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true,
                changelog: true
              }
            },
            versions: {
              select: {
                id: true,
                versionNumber: true,
                createdAt: true,
                changelog: true
              },
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                distributions: true,
                downloads: true
              }
            }
          }
        }),
        `getResourceById(${id})`
      );

      if (!resource) {
        throw new Error('Resource not found');
      }

      // Log resource access
      if (userId) {
        await auditLogger.logDataAccess(
          userId,
          'resource',
          id,
          'view',
          {
            resourceId: id,
            title: resource.title,
            category: resource.category,
            type: resource.type
          }
        );
      }

      return resource;
    } catch (error) {
      logger.error('Failed to get resource by ID', { error: error.message, resourceId: id });
      throw error;
    }
  }

  /**
   * Create new resource
   */
  async createResource(resourceData, userId) {
    try {
      const {
        title,
        description,
        category,
        type,
        language = 'es',
        tags = [],
        keywords,
        targetAudience,
        ageRange,
        difficulty,
        estimatedDuration,
        fileUrl,
        fileSize,
        mimeType,
        metadata = {}
      } = resourceData;

      const resourceId = uuidv4();
      const versionId = uuidv4();

      const resource = await executeTransaction([
        async (prisma) => {
          // Create resource
          const newResource = await prisma.resource.create({
            data: {
              id: resourceId,
              title,
              description,
              category,
              type,
              language,
              tags,
              keywords,
              targetAudience,
              ageRange,
              difficulty,
              estimatedDuration,
              metadata,
              createdBy: userId,
              isActive: true,
              createdAt: new Date()
            }
          });

          // Create initial version
          const version = await prisma.resourceVersion.create({
            data: {
              id: versionId,
              resourceId,
              versionNumber: '1.0.0',
              fileUrl,
              fileSize,
              mimeType,
              changelog: 'Initial version',
              createdBy: userId,
              isActive: true,
              createdAt: new Date()
            }
          });

          // Update resource with current version
          await prisma.resource.update({
            where: { id: resourceId },
            data: { currentVersionId: versionId }
          });

          return newResource;
        }
      ], 'createResource');

      // Log resource creation
      await auditLogger.logDataModification(
        userId,
        'RESOURCE_CREATE',
        {
          resourceId,
          title,
          category,
          type,
          language
        }
      );

      return await this.getResourceById(resourceId, userId);
    } catch (error) {
      logger.error('Failed to create resource', { error: error.message });
      throw new Error('Failed to create resource');
    }
  }

  /**
   * Update resource
   */
  async updateResource(id, updateData, userId) {
    try {
      const {
        title,
        description,
        category,
        type,
        tags,
        keywords,
        targetAudience,
        ageRange,
        difficulty,
        estimatedDuration,
        metadata
      } = updateData;

      const resource = await executeQuery(
        (prisma) => prisma.resource.update({
          where: { id },
          data: {
            title,
            description,
            category,
            type,
            tags,
            keywords,
            targetAudience,
            ageRange,
            difficulty,
            estimatedDuration,
            metadata,
            updatedAt: new Date()
          }
        }),
        `updateResource(${id})`
      );

      // Log resource update
      await auditLogger.logDataModification(
        userId,
        'RESOURCE_UPDATE',
        {
          resourceId: id,
          changes: Object.keys(updateData),
          title: resource.title
        }
      );

      return await this.getResourceById(id, userId);
    } catch (error) {
      logger.error('Failed to update resource', { error: error.message, resourceId: id });
      throw new Error('Failed to update resource');
    }
  }

  /**
   * Delete resource (soft delete)
   */
  async deleteResource(id, userId) {
    try {
      await executeQuery(
        (prisma) => prisma.resource.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: userId
          }
        }),
        `deleteResource(${id})`
      );

      // Log resource deletion
      await auditLogger.logDataModification(
        userId,
        'RESOURCE_DELETE',
        {
          resourceId: id
        }
      );

      return { success: true, message: 'Resource deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete resource', { error: error.message, resourceId: id });
      throw new Error('Failed to delete resource');
    }
  }

  /**
   * Search resources
   */
  async searchResources(searchParams, userId = null) {
    try {
      const {
        query,
        category,
        type,
        tags,
        language = 'es',
        targetAudience,
        difficulty,
        page = 1,
        limit = 20
      } = searchParams;

      const skip = (page - 1) * limit;

      // Build advanced search query
      const whereClause = {
        isActive: true,
        language: language
      };

      if (query) {
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { keywords: { contains: query, mode: 'insensitive' } }
        ];
      }

      if (category) whereClause.category = category;
      if (type) whereClause.type = type;
      if (tags && tags.length > 0) whereClause.tags = { hasSome: tags };
      if (targetAudience) whereClause.targetAudience = targetAudience;
      if (difficulty) whereClause.difficulty = difficulty;

      const [resources, totalCount] = await executeTransaction([
        (prisma) => prisma.resource.findMany({
          where: whereClause,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            currentVersion: {
              select: {
                id: true,
                versionNumber: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true
              }
            },
            _count: {
              select: {
                distributions: true,
                downloads: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        (prisma) => prisma.resource.count({ where: whereClause })
      ], 'searchResources');

      // Log search activity
      if (userId) {
        await auditLogger.logDataAccess(
          userId,
          'resource_search',
          'search',
          'search',
          {
            query,
            category,
            type,
            resultCount: resources.length
          }
        );
      }

      return {
        resources,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to search resources', { error: error.message });
      throw new Error('Failed to search resources');
    }
  }

  /**
   * Get resources by category
   */
  async getResourcesByCategory(category, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const [resources, totalCount] = await executeTransaction([
        (prisma) => prisma.resource.findMany({
          where: {
            category: category,
            isActive: true
          },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            currentVersion: {
              select: {
                id: true,
                versionNumber: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true
              }
            },
            _count: {
              select: {
                distributions: true,
                downloads: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        (prisma) => prisma.resource.count({
          where: {
            category: category,
            isActive: true
          }
        })
      ], 'getResourcesByCategory');

      return {
        resources,
        category,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get resources by category', { error: error.message, category });
      throw new Error('Failed to get resources by category');
    }
  }

  /**
   * Get resource analytics
   */
  async getResourceAnalytics(resourceId = null, timeframe = '30d') {
    try {
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      };

      const fromDate = dateRanges[timeframe] || dateRanges['30d'];

      if (resourceId) {
        // Get analytics for specific resource
        const analytics = await this.getResourceSpecificAnalytics(resourceId, fromDate);
        return analytics;
      } else {
        // Get overview analytics
        const overview = await this.getResourceOverviewAnalytics(fromDate);
        return overview;
      }
    } catch (error) {
      logger.error('Failed to get resource analytics', { error: error.message });
      throw new Error('Failed to get resource analytics');
    }
  }

  /**
   * Get analytics for specific resource
   */
  async getResourceSpecificAnalytics(resourceId, fromDate) {
    try {
      const analytics = await executeQuery(
        (prisma) => prisma.resourceDownload.groupBy({
          by: ['downloadedAt'],
          where: {
            resourceId: resourceId,
            downloadedAt: {
              gte: fromDate
            }
          },
          _count: {
            id: true
          }
        }),
        'getResourceSpecificAnalytics'
      );

      const totalDownloads = analytics.reduce((sum, day) => sum + day._count.id, 0);

      return {
        resourceId,
        totalDownloads,
        dailyDownloads: analytics,
        timeframe: fromDate.toISOString()
      };
    } catch (error) {
      logger.error('Failed to get resource specific analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get overview analytics
   */
  async getResourceOverviewAnalytics(fromDate) {
    try {
      const [totalResources, totalDownloads, categoryStats] = await executeTransaction([
        (prisma) => prisma.resource.count({
          where: { isActive: true }
        }),
        (prisma) => prisma.resourceDownload.count({
          where: {
            downloadedAt: {
              gte: fromDate
            }
          }
        }),
        (prisma) => prisma.resource.groupBy({
          by: ['category'],
          where: { isActive: true },
          _count: {
            category: true
          }
        })
      ], 'getResourceOverviewAnalytics');

      return {
        totalResources,
        totalDownloads,
        categoryDistribution: categoryStats,
        timeframe: fromDate.toISOString()
      };
    } catch (error) {
      logger.error('Failed to get resource overview analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Record resource download
   */
  async recordDownload(resourceId, userId, metadata = {}) {
    try {
      const download = await executeQuery(
        (prisma) => prisma.resourceDownload.create({
          data: {
            id: uuidv4(),
            resourceId,
            userId,
            downloadedAt: new Date(),
            metadata,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
          }
        }),
        'recordDownload'
      );

      // Log download activity
      await auditLogger.logDataAccess(
        userId,
        'resource_download',
        resourceId,
        'download',
        {
          resourceId,
          downloadId: download.id,
          metadata
        }
      );

      return download;
    } catch (error) {
      logger.error('Failed to record download', { error: error.message });
      throw new Error('Failed to record download');
    }
  }
}

module.exports = ResourceController;