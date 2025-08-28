/**
 * ReportTemplate Entity
 * Domain entity for report templates and predefined reports
 */

import { ReportType, ReportFormat, ReportParameter, ReportVisualization, ReportAccess } from './Report';

export type TemplateCategory = 
  | 'clinical'
  | 'financial'
  | 'operational'
  | 'regulatory'
  | 'quality'
  | 'research'
  | 'administrative'
  | 'custom';

export type TemplateComplexity = 'basic' | 'intermediate' | 'advanced' | 'expert';

export type TemplateStatus = 'draft' | 'published' | 'deprecated' | 'archived';

export interface TemplateRequirements {
  minimumDataPoints: number;
  requiredTables: string[];
  optionalTables: string[];
  permissions: string[];
  estimatedExecutionTime: number; // seconds
  maxRecords: number;
}

export interface TemplateMaintenance {
  lastReviewed: Date;
  reviewedBy: string;
  nextReviewDue: Date;
  version: string;
  changelog: TemplateChangeLog[];
  deprecationDate?: Date;
  replacementTemplateId?: string;
}

export interface TemplateChangeLog {
  version: string;
  date: Date;
  author: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  breaking: boolean;
}

export interface TemplateUsage {
  totalInstances: number;
  activeInstances: number;
  averageExecutionsPerMonth: number;
  popularityScore: number; // 0-100
  userRating: {
    average: number;
    count: number;
    distribution: { [stars: number]: number };
  };
  lastUsed: Date;
  topUsers: string[];
}

export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  performanceIssues: string[];
  securityConcerns: string[];
}

export interface TemplateDocumentation {
  overview: string;
  purpose: string;
  dataDescription: string;
  columnDescriptions: { [column: string]: string };
  usageInstructions: string;
  examples: TemplateExample[];
  faq: { question: string; answer: string }[];
  troubleshooting: { issue: string; solution: string }[];
}

export interface TemplateExample {
  name: string;
  description: string;
  parameters: { [key: string]: any };
  expectedOutput: string;
  useCase: string;
}

export interface TemplateTags {
  clinical: string[];
  department: string[];
  userRole: string[];
  dataSource: string[];
  frequency: string[];
  custom: string[];
}

export class ReportTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: TemplateCategory,
    public readonly type: ReportType,
    public readonly status: TemplateStatus,
    public readonly complexity: TemplateComplexity,
    public readonly access: ReportAccess,
    public readonly query: string,
    public readonly parameters: ReportParameter[],
    public readonly defaultFormats: ReportFormat[],
    public readonly visualizations: ReportVisualization[],
    public readonly requirements: TemplateRequirements,
    public readonly documentation: TemplateDocumentation,
    public readonly tags: TemplateTags,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdBy: string = '',
    public readonly isBuiltIn: boolean = false,
    public readonly isRecommended: boolean = false,
    public readonly isPremium: boolean = false,
    public readonly maintenance: TemplateMaintenance = {
      lastReviewed: new Date(),
      reviewedBy: '',
      nextReviewDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      version: '1.0.0',
      changelog: []
    },
    public readonly usage: TemplateUsage = {
      totalInstances: 0,
      activeInstances: 0,
      averageExecutionsPerMonth: 0,
      popularityScore: 0,
      userRating: { average: 0, count: 0, distribution: {} },
      lastUsed: new Date(),
      topUsers: []
    },
    public readonly validation: TemplateValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      performanceIssues: [],
      securityConcerns: []
    },
    public readonly isActive: boolean = true,
    public readonly isFeatured: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly publishedAt?: Date,
    public readonly downloadCount: number = 0,
    public readonly rating: number = 0
  ) {
    this.validateTemplate();
  }

  private validateTemplate(): void {
    if (!this.id.trim()) {
      throw new Error('Template ID is required');
    }

    if (!this.name.trim()) {
      throw new Error('Template name is required');
    }

    if (!this.query.trim()) {
      throw new Error('Template query is required');
    }

    if (!this.createdBy.trim() && !this.isBuiltIn) {
      throw new Error('Created by user ID is required for non-built-in templates');
    }

    if (!this.clinicId && !this.workspaceId && !this.isBuiltIn) {
      throw new Error('Either clinic ID or workspace ID is required for non-built-in templates');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Cannot specify both clinic ID and workspace ID');
    }
  }

  // Business Logic Methods

  canBeUsed(): boolean {
    return this.isActive && 
           this.status === 'published' && 
           this.validation.isValid &&
           !this.isDeprecated();
  }

  canBeModified(): boolean {
    return !this.isBuiltIn && 
           this.status !== 'archived' &&
           !this.isDeprecated();
  }

  canBePublished(): boolean {
    return this.status === 'draft' && 
           this.validation.isValid &&
           this.validation.errors.length === 0;
  }

  canBeDeprecated(): boolean {
    return this.status === 'published' && 
           this.usage.activeInstances === 0;
  }

  isDeprecated(): boolean {
    return this.maintenance.deprecationDate ? 
           this.maintenance.deprecationDate <= new Date() : false;
  }

  needsReview(): boolean {
    return this.maintenance.nextReviewDue <= new Date();
  }

  isPopular(): boolean {
    return this.usage.popularityScore >= 80;
  }

  isHighlyRated(): boolean {
    return this.usage.userRating.average >= 4.0 && 
           this.usage.userRating.count >= 10;
  }

  hasPerformanceIssues(): boolean {
    return this.validation.performanceIssues.length > 0 ||
           this.requirements.estimatedExecutionTime > 300; // 5 minutes
  }

  hasSecurityConcerns(): boolean {
    return this.validation.securityConcerns.length > 0;
  }

  isCompatibleWithClinic(clinicId: string): boolean {
    return !this.clinicId || this.clinicId === clinicId || this.isBuiltIn;
  }

  isCompatibleWithWorkspace(workspaceId: string): boolean {
    return !this.workspaceId || this.workspaceId === workspaceId || this.isBuiltIn;
  }

  // State Transformation Methods

  updateStatus(newStatus: TemplateStatus, updatedBy: string): ReportTemplate {
    const now = new Date();
    
    const publishedAt = newStatus === 'published' && this.status !== 'published' 
      ? now 
      : this.publishedAt;

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      newStatus,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      this.usage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      now,
      publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  recordUsage(userId: string): ReportTemplate {
    const now = new Date();
    
    // Update top users list
    const topUsers = [...this.usage.topUsers];
    if (!topUsers.includes(userId)) {
      topUsers.push(userId);
      if (topUsers.length > 10) {
        topUsers.splice(10); // Keep only top 10
      }
    }

    const updatedUsage: TemplateUsage = {
      ...this.usage,
      totalInstances: this.usage.totalInstances + 1,
      activeInstances: this.usage.activeInstances + 1,
      lastUsed: now,
      topUsers,
      popularityScore: this.calculatePopularityScore(this.usage.totalInstances + 1, this.usage.userRating.average)
    };

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      updatedUsage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  recordDownload(): ReportTemplate {
    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      this.usage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount + 1,
      this.rating
    );
  }

  addRating(rating: number, userId: string): ReportTemplate {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const currentTotal = this.usage.userRating.average * this.usage.userRating.count;
    const newCount = this.usage.userRating.count + 1;
    const newAverage = (currentTotal + rating) / newCount;

    const updatedDistribution = { ...this.usage.userRating.distribution };
    updatedDistribution[rating] = (updatedDistribution[rating] || 0) + 1;

    const updatedUserRating = {
      average: newAverage,
      count: newCount,
      distribution: updatedDistribution
    };

    const updatedUsage: TemplateUsage = {
      ...this.usage,
      userRating: updatedUserRating,
      popularityScore: this.calculatePopularityScore(this.usage.totalInstances, newAverage)
    };

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      updatedUsage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      newAverage
    );
  }

  validate(queryValidator?: (query: string) => TemplateValidation): ReportTemplate {
    let validation: TemplateValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      performanceIssues: [],
      securityConcerns: []
    };

    // Basic validation
    if (!this.name.trim()) {
      validation.errors.push('Template name is required');
    }

    if (!this.query.trim()) {
      validation.errors.push('Template query is required');
    }

    if (this.parameters.length === 0) {
      validation.warnings.push('Template has no parameters - consider adding filters');
    }

    if (this.defaultFormats.length === 0) {
      validation.errors.push('At least one output format must be specified');
    }

    // Query validation if validator provided
    if (queryValidator && this.query.trim()) {
      const queryValidation = queryValidator(this.query);
      validation = {
        isValid: validation.isValid && queryValidation.isValid,
        errors: [...validation.errors, ...queryValidation.errors],
        warnings: [...validation.warnings, ...queryValidation.warnings],
        suggestions: [...validation.suggestions, ...queryValidation.suggestions],
        performanceIssues: [...validation.performanceIssues, ...queryValidation.performanceIssues],
        securityConcerns: [...validation.securityConcerns, ...queryValidation.securityConcerns]
      };
    }

    // Performance checks
    if (this.requirements.estimatedExecutionTime > 600) { // 10 minutes
      validation.performanceIssues.push('Estimated execution time is very long');
    }

    if (this.requirements.maxRecords > 1000000) { // 1M records
      validation.performanceIssues.push('Template may return excessive number of records');
    }

    // Security checks
    if (this.query.toLowerCase().includes('drop ') || 
        this.query.toLowerCase().includes('delete ') ||
        this.query.toLowerCase().includes('update ')) {
      validation.securityConcerns.push('Query contains potentially dangerous operations');
    }

    validation.isValid = validation.errors.length === 0;

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      this.usage,
      validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  deprecate(deprecationDate: Date, replacementTemplateId?: string, reason?: string): ReportTemplate {
    if (!this.canBeDeprecated()) {
      throw new Error('Template cannot be deprecated - it still has active instances');
    }

    const updatedMaintenance: TemplateMaintenance = {
      ...this.maintenance,
      deprecationDate,
      replacementTemplateId
    };

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      'deprecated',
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      updatedMaintenance,
      this.usage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  updateVersion(newVersion: string, changes: string[], author: string, type: 'major' | 'minor' | 'patch' | 'hotfix' = 'minor'): ReportTemplate {
    const changeLogEntry: TemplateChangeLog = {
      version: newVersion,
      date: new Date(),
      author,
      changes,
      type,
      breaking: type === 'major'
    };

    const updatedMaintenance: TemplateMaintenance = {
      ...this.maintenance,
      version: newVersion,
      changelog: [...this.maintenance.changelog, changeLogEntry],
      lastReviewed: new Date()
    };

    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      updatedMaintenance,
      this.usage,
      this.validation,
      this.isActive,
      this.isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  setFeatured(isFeatured: boolean): ReportTemplate {
    return new ReportTemplate(
      this.id,
      this.name,
      this.description,
      this.category,
      this.type,
      this.status,
      this.complexity,
      this.access,
      this.query,
      this.parameters,
      this.defaultFormats,
      this.visualizations,
      this.requirements,
      this.documentation,
      this.tags,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isBuiltIn,
      this.isRecommended,
      this.isPremium,
      this.maintenance,
      this.usage,
      this.validation,
      this.isActive,
      isFeatured,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.downloadCount,
      this.rating
    );
  }

  // Helper Methods

  private calculatePopularityScore(totalInstances: number, userRating: number): number {
    // Algorithm combines usage frequency and user satisfaction
    const usageScore = Math.min(100, totalInstances * 2); // 2 points per instance, max 100
    const ratingScore = userRating * 20; // Convert 5-star to 100-point scale
    return Math.round((usageScore + ratingScore) / 2);
  }

  // Static Factory Methods

  static createBuiltIn(
    id: string,
    name: string,
    description: string,
    category: TemplateCategory,
    type: ReportType,
    query: string,
    parameters: ReportParameter[],
    documentation: TemplateDocumentation,
    requirements: TemplateRequirements
  ): ReportTemplate {
    const tags: TemplateTags = {
      clinical: [],
      department: [],
      userRole: [],
      dataSource: ['database'],
      frequency: ['on-demand'],
      custom: ['built-in']
    };

    return new ReportTemplate(
      id,
      name,
      description,
      category,
      type,
      'published',
      'basic',
      'public',
      query,
      parameters,
      ['pdf', 'csv', 'xlsx'],
      [],
      requirements,
      documentation,
      tags,
      undefined, // No clinic restriction
      undefined, // No workspace restriction
      'system',
      true, // isBuiltIn
      true, // isRecommended
      false // isPremium
    );
  }

  static createCustom(
    id: string,
    name: string,
    description: string,
    category: TemplateCategory,
    type: ReportType,
    query: string,
    parameters: ReportParameter[],
    createdBy: string,
    clinicId?: string,
    workspaceId?: string
  ): ReportTemplate {
    const documentation: TemplateDocumentation = {
      overview: description,
      purpose: 'Custom report template',
      dataDescription: 'Custom data analysis',
      columnDescriptions: {},
      usageInstructions: 'Configure parameters and execute report',
      examples: [],
      faq: [],
      troubleshooting: []
    };

    const requirements: TemplateRequirements = {
      minimumDataPoints: 1,
      requiredTables: [],
      optionalTables: [],
      permissions: ['read'],
      estimatedExecutionTime: 30,
      maxRecords: 10000
    };

    const tags: TemplateTags = {
      clinical: [],
      department: [],
      userRole: [],
      dataSource: ['database'],
      frequency: ['on-demand'],
      custom: ['custom']
    };

    return new ReportTemplate(
      id,
      name,
      description,
      category,
      type,
      'draft',
      'basic',
      'private',
      query,
      parameters,
      ['pdf', 'csv'],
      [],
      requirements,
      documentation,
      tags,
      clinicId,
      workspaceId,
      createdBy,
      false, // Not built-in
      false, // Not recommended
      false // Not premium
    );
  }
}