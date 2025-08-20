/**
 * Content Controller for Resources Hub
 * 
 * Handles business logic for content management, treatment plans, and recommendations
 */

const { executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');
const { v4: uuidv4 } = require('uuid');

const auditLogger = new AuditLogger();

class ContentController {
  /**
   * Create treatment plan
   */
  async createTreatmentPlan(planData, userId) {
    try {
      const {
        name,
        description,
        patientId,
        condition,
        objectives,
        duration,
        phases,
        resources,
        notes
      } = planData;

      const planId = uuidv4();

      const treatmentPlan = await executeQuery(
        (prisma) => prisma.treatmentPlan.create({
          data: {
            id: planId,
            name,
            description,
            patientId,
            condition,
            objectives,
            duration,
            phases,
            resources,
            notes,
            createdBy: userId,
            status: 'active',
            startDate: new Date(),
            createdAt: new Date()
          }
        }),
        'createTreatmentPlan'
      );

      // Log treatment plan creation
      await auditLogger.logDataModification(
        userId,
        'TREATMENT_PLAN_CREATE',
        {
          planId,
          patientId,
          name,
          condition,
          resourceCount: resources?.length || 0
        }
      );

      return treatmentPlan;
    } catch (error) {
      logger.error('Failed to create treatment plan', { error: error.message });
      throw new Error('Failed to create treatment plan');
    }
  }

  /**
   * Get treatment plans for patient
   */
  async getPatientTreatmentPlans(patientId, userId) {
    try {
      const treatmentPlans = await executeQuery(
        (prisma) => prisma.treatmentPlan.findMany({
          where: {
            patientId,
            status: { in: ['active', 'completed'] }
          },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            progressEntries: {
              select: {
                id: true,
                date: true,
                progress: true,
                notes: true
              },
              orderBy: { date: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        `getPatientTreatmentPlans(${patientId})`
      );

      // Log treatment plan access
      await auditLogger.logDataAccess(
        userId,
        'treatment_plans',
        patientId,
        'view',
        {
          patientId,
          planCount: treatmentPlans.length
        }
      );

      return treatmentPlans;
    } catch (error) {
      logger.error('Failed to get patient treatment plans', { error: error.message });
      throw new Error('Failed to get patient treatment plans');
    }
  }

  /**
   * Update treatment plan progress
   */
  async updateTreatmentPlanProgress(planId, progressData, userId) {
    try {
      const {
        progress,
        notes,
        completedPhases,
        nextSteps,
        resourcesUsed
      } = progressData;

      const progressEntry = await executeQuery(
        (prisma) => prisma.treatmentPlanProgress.create({
          data: {
            id: uuidv4(),
            planId,
            date: new Date(),
            progress,
            notes,
            completedPhases,
            nextSteps,
            resourcesUsed,
            recordedBy: userId,
            createdAt: new Date()
          }
        }),
        'updateTreatmentPlanProgress'
      );

      // Update treatment plan status if completed
      if (progress >= 100) {
        await executeQuery(
          (prisma) => prisma.treatmentPlan.update({
            where: { id: planId },
            data: {
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date()
            }
          }),
          'completeTreatmentPlan'
        );
      }

      // Log progress update
      await auditLogger.logDataModification(
        userId,
        'TREATMENT_PLAN_PROGRESS',
        {
          planId,
          progress,
          progressEntryId: progressEntry.id
        }
      );

      return progressEntry;
    } catch (error) {
      logger.error('Failed to update treatment plan progress', { error: error.message });
      throw new Error('Failed to update treatment plan progress');
    }
  }

  /**
   * Generate personalized resource recommendations
   */
  async generateResourceRecommendations(patientId, userId, preferences = {}) {
    try {
      const {
        conditions = [],
        preferredTypes = [],
        language = 'es',
        difficulty = 'intermediate',
        limit = 10
      } = preferences;

      // Get patient's current conditions and treatment history
      const patientProfile = await this.getPatientProfile(patientId);
      
      // Get patient's resource usage history
      const resourceHistory = await this.getPatientResourceHistory(patientId);
      
      // Build recommendation query
      const whereClause = {
        isActive: true,
        language: language
      };

      // Add conditions-based filtering
      if (conditions.length > 0) {
        whereClause.OR = conditions.map(condition => ({
          category: condition
        }));
      }

      // Add type filtering
      if (preferredTypes.length > 0) {
        whereClause.type = { in: preferredTypes };
      }

      // Add difficulty filtering
      if (difficulty) {
        whereClause.difficulty = difficulty;
      }

      // Get recommended resources
      const recommendations = await executeQuery(
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
          orderBy: [
            { downloads: { _count: 'desc' } },
            { createdAt: 'desc' }
          ],
          take: limit
        }),
        'generateResourceRecommendations'
      );

      // Filter out already used resources
      const usedResourceIds = new Set(resourceHistory.map(r => r.id));
      const filteredRecommendations = recommendations.filter(r => !usedResourceIds.has(r.id));

      // Calculate recommendation scores
      const scoredRecommendations = await this.calculateRecommendationScores(
        filteredRecommendations,
        patientProfile,
        resourceHistory
      );

      // Log recommendation generation
      await auditLogger.logDataAccess(
        userId,
        'resource_recommendations',
        patientId,
        'generate',
        {
          patientId,
          recommendationCount: scoredRecommendations.length,
          conditions,
          preferredTypes
        }
      );

      return {
        recommendations: scoredRecommendations,
        patientProfile,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to generate resource recommendations', { error: error.message });
      throw new Error('Failed to generate resource recommendations');
    }
  }

  /**
   * Get patient profile for recommendations
   */
  async getPatientProfile(patientId) {
    try {
      const profile = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            medicalHistory: {
              select: {
                condition: true,
                severity: true,
                treatment: true
              }
            },
            assessments: {
              select: {
                scale: { select: { category: true } },
                totalScore: true,
                completedAt: true
              },
              orderBy: { completedAt: 'desc' },
              take: 5
            }
          }
        }),
        'getPatientProfile'
      );

      if (!profile) {
        throw new Error('Patient not found');
      }

      return {
        id: profile.id,
        age: profile.age,
        gender: profile.gender,
        language: profile.preferredLanguage || 'es',
        conditions: profile.medicalHistory?.map(h => h.condition) || [],
        recentAssessments: profile.assessments || []
      };
    } catch (error) {
      logger.error('Failed to get patient profile', { error: error.message });
      throw error;
    }
  }

  /**
   * Get patient's resource usage history
   */
  async getPatientResourceHistory(patientId) {
    try {
      const history = await executeQuery(
        (prisma) => prisma.resourceDistribution.findMany({
          where: { patientId },
          include: {
            resource: {
              select: {
                id: true,
                title: true,
                category: true,
                type: true,
                tags: true
              }
            }
          },
          orderBy: { distributedAt: 'desc' },
          take: 50
        }),
        'getPatientResourceHistory'
      );

      return history.map(h => ({
        id: h.resource.id,
        title: h.resource.title,
        category: h.resource.category,
        type: h.resource.type,
        tags: h.resource.tags,
        distributedAt: h.distributedAt,
        status: h.status
      }));
    } catch (error) {
      logger.error('Failed to get patient resource history', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate recommendation scores
   */
  async calculateRecommendationScores(resources, patientProfile, resourceHistory) {
    try {
      const scoredResources = resources.map(resource => {
        let score = 0;

        // Base popularity score (0-30 points)
        const downloadCount = resource._count.downloads || 0;
        score += Math.min(downloadCount / 10, 30);

        // Condition relevance (0-40 points)
        const conditionMatch = patientProfile.conditions.some(condition => 
          resource.category === condition || 
          resource.tags?.includes(condition)
        );
        if (conditionMatch) score += 40;

        // Age appropriateness (0-20 points)
        if (resource.ageRange) {
          const [minAge, maxAge] = resource.ageRange.split('-').map(Number);
          if (patientProfile.age >= minAge && patientProfile.age <= maxAge) {
            score += 20;
          }
        }

        // Language match (0-10 points)
        if (resource.language === patientProfile.language) {
          score += 10;
        }

        // Recency bonus (0-10 points)
        const daysSinceCreation = (Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 30) {
          score += 10;
        }

        return {
          ...resource,
          recommendationScore: Math.round(score),
          reasonsForRecommendation: this.getRecommendationReasons(resource, patientProfile, conditionMatch)
        };
      });

      // Sort by recommendation score
      return scoredResources.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } catch (error) {
      logger.error('Failed to calculate recommendation scores', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recommendation reasons
   */
  getRecommendationReasons(resource, patientProfile, conditionMatch) {
    const reasons = [];

    if (conditionMatch) {
      reasons.push('Relevant to your current condition');
    }

    if (resource.language === patientProfile.language) {
      reasons.push('Available in your preferred language');
    }

    if (resource._count.downloads > 50) {
      reasons.push('Popular resource with many downloads');
    }

    if (resource.difficulty === 'beginner') {
      reasons.push('Easy to understand and follow');
    }

    const daysSinceCreation = (Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) {
      reasons.push('Recently added content');
    }

    return reasons;
  }

  /**
   * Create content collection
   */
  async createContentCollection(collectionData, userId) {
    try {
      const {
        name,
        description,
        category,
        resourceIds,
        tags,
        isPublic = false
      } = collectionData;

      const collectionId = uuidv4();

      const collection = await executeQuery(
        (prisma) => prisma.contentCollection.create({
          data: {
            id: collectionId,
            name,
            description,
            category,
            tags,
            isPublic,
            createdBy: userId,
            createdAt: new Date(),
            resources: {
              connect: resourceIds.map(id => ({ id }))
            }
          }
        }),
        'createContentCollection'
      );

      // Log collection creation
      await auditLogger.logDataModification(
        userId,
        'CONTENT_COLLECTION_CREATE',
        {
          collectionId,
          name,
          category,
          resourceCount: resourceIds.length
        }
      );

      return collection;
    } catch (error) {
      logger.error('Failed to create content collection', { error: error.message });
      throw new Error('Failed to create content collection');
    }
  }

  /**
   * Get content collections
   */
  async getContentCollections(filters = {}, userId = null) {
    try {
      const { category, isPublic, createdBy } = filters;

      const whereClause = {};
      if (category) whereClause.category = category;
      if (isPublic !== undefined) whereClause.isPublic = isPublic;
      if (createdBy) whereClause.createdBy = createdBy;

      const collections = await executeQuery(
        (prisma) => prisma.contentCollection.findMany({
          where: whereClause,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            resources: {
              select: {
                id: true,
                title: true,
                category: true,
                type: true
              }
            },
            _count: {
              select: { resources: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        'getContentCollections'
      );

      return collections;
    } catch (error) {
      logger.error('Failed to get content collections', { error: error.message });
      throw new Error('Failed to get content collections');
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(timeframe = '30d') {
    try {
      const dateRanges = {
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      };

      const fromDate = dateRanges[timeframe] || dateRanges['30d'];

      const [
        totalResources,
        totalDownloads,
        totalDistributions,
        popularResources,
        categoryStats,
        treatmentPlanStats
      ] = await executeTransaction([
        (prisma) => prisma.resource.count({
          where: { isActive: true }
        }),
        (prisma) => prisma.resourceDownload.count({
          where: { downloadedAt: { gte: fromDate } }
        }),
        (prisma) => prisma.resourceDistribution.count({
          where: { distributedAt: { gte: fromDate } }
        }),
        (prisma) => prisma.resource.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: { downloads: true }
            }
          },
          orderBy: {
            downloads: { _count: 'desc' }
          },
          take: 10
        }),
        (prisma) => prisma.resource.groupBy({
          by: ['category'],
          where: { isActive: true },
          _count: { category: true }
        }),
        (prisma) => prisma.treatmentPlan.count({
          where: { createdAt: { gte: fromDate } }
        })
      ], 'getContentAnalytics');

      return {
        overview: {
          totalResources,
          totalDownloads,
          totalDistributions,
          totalTreatmentPlans: treatmentPlanStats
        },
        popularResources: popularResources.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          downloadCount: r._count.downloads
        })),
        categoryDistribution: categoryStats,
        timeframe: timeframe
      };
    } catch (error) {
      logger.error('Failed to get content analytics', { error: error.message });
      throw new Error('Failed to get content analytics');
    }
  }
}

module.exports = ContentController;