/**
 * Report Entity
 * Domain entity for medical reports and analytics
 */

export type ReportType = 
  | 'patient_summary'
  | 'clinical_analytics'
  | 'appointment_statistics'
  | 'revenue_analysis'
  | 'resource_usage'
  | 'user_activity'
  | 'medication_compliance'
  | 'treatment_outcomes'
  | 'demographic_analysis'
  | 'custom_query';

export type ReportStatus = 'draft' | 'scheduled' | 'generating' | 'completed' | 'failed' | 'cancelled';

export type ReportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'html';

export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReportAccess = 'private' | 'shared' | 'public';

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
}

export interface ReportData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  summary?: { [key: string]: any };
  metadata?: { [key: string]: any };
}

export interface ReportVisualization {
  type: 'table' | 'chart' | 'graph' | 'metric' | 'dashboard';
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    xAxis?: string;
    yAxis?: string | string[];
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    colors?: string[];
    title?: string;
    subtitle?: string;
  };
  data: any;
}

export interface ReportSchedule {
  frequency: ReportFrequency;
  time: string; // HH:MM format
  timezone: string;
  startDate: Date;
  endDate?: Date;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
}

export interface ReportDelivery {
  method: 'email' | 'portal' | 'api' | 'storage';
  recipients: string[];
  subject?: string;
  message?: string;
  attachments: boolean;
  secureLinks: boolean;
  expirationDays?: number;
}

export interface ReportMetadata {
  title: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  category: string;
  lastModified: Date;
  dataSource: string;
  refreshRate?: number; // minutes
  dependencies?: string[];
}

export interface ReportAnalytics {
  executions: number;
  averageExecutionTime: number; // seconds
  lastExecutionTime: number;
  successRate: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  performanceScore: number; // 0-100
  usage: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface ReportAudit {
  executedAt: Date;
  executedBy: string;
  executionTime: number; // seconds
  recordCount: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  parameters: { [key: string]: any };
  dataHash?: string;
  fileSize?: number;
}

export class Report {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly type: ReportType,
    public readonly status: ReportStatus,
    public readonly access: ReportAccess,
    public readonly query: string, // SQL or query definition
    public readonly parameters: ReportParameter[],
    public readonly formats: ReportFormat[],
    public readonly visualizations: ReportVisualization[],
    public readonly metadata: ReportMetadata,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdBy: string = '',
    public readonly isTemplate: boolean = false,
    public readonly schedule?: ReportSchedule,
    public readonly delivery?: ReportDelivery,
    public readonly analytics: ReportAnalytics = {
      executions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      successRate: 100,
      totalViews: 0,
      totalDownloads: 0,
      totalShares: 0,
      performanceScore: 100,
      usage: { daily: 0, weekly: 0, monthly: 0 }
    },
    public readonly auditLog: ReportAudit[] = [],
    public readonly isActive: boolean = true,
    public readonly isFavorite: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly lastExecutedAt?: Date,
    public readonly data?: ReportData,
    public readonly generatedFile?: string,
    public readonly expiresAt?: Date
  ) {
    this.validateReport();
  }

  private validateReport(): void {
    if (!this.id.trim()) {
      throw new Error('Report ID is required');
    }

    if (!this.name.trim()) {
      throw new Error('Report name is required');
    }

    if (!this.query.trim()) {
      throw new Error('Report query is required');
    }

    if (!this.createdBy.trim()) {
      throw new Error('Created by user ID is required');
    }

    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Either clinic ID or workspace ID is required');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Cannot specify both clinic ID and workspace ID');
    }

    // Validate parameters
    this.parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        throw new Error(`Parameter ${index + 1} name is required`);
      }
      if (!param.label.trim()) {
        throw new Error(`Parameter ${index + 1} label is required`);
      }
    });
  }

  // Business Logic Methods

  canBeExecuted(): boolean {
    return this.isActive && 
           this.status !== 'generating' && 
           this.status !== 'cancelled' &&
           (!this.expiresAt || this.expiresAt > new Date());
  }

  canBeModified(): boolean {
    return this.status !== 'generating' && this.status !== 'cancelled';
  }

  canBeScheduled(): boolean {
    return this.isActive && this.status === 'completed';
  }

  canBeShared(): boolean {
    return this.isActive && 
           this.status === 'completed' && 
           this.access !== 'private' &&
           this.data !== undefined;
  }

  isExpired(): boolean {
    return this.expiresAt ? this.expiresAt <= new Date() : false;
  }

  hasRequiredParameters(): boolean {
    return this.parameters.filter(p => p.required).every(p => 
      p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== ''
    );
  }

  isPerformanceAcceptable(): boolean {
    return this.analytics.performanceScore >= 70;
  }

  needsOptimization(): boolean {
    return this.analytics.averageExecutionTime > 300 || // 5 minutes
           this.analytics.successRate < 90 ||
           this.analytics.performanceScore < 60;
  }

  // State Transformation Methods

  updateStatus(newStatus: ReportStatus, updatedBy: string, message?: string): Report {
    const now = new Date();
    
    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      newStatus,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      this.analytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      now,
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  execute(executedBy: string, parameters: { [key: string]: any }): Report {
    const now = new Date();
    
    if (!this.canBeExecuted()) {
      throw new Error('Report cannot be executed in current state');
    }

    // Create audit entry
    const auditEntry: ReportAudit = {
      executedAt: now,
      executedBy,
      executionTime: 0, // Will be updated when execution completes
      recordCount: 0,
      status: 'success',
      parameters,
      dataHash: undefined,
      fileSize: undefined
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      'generating',
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      this.analytics,
      [...this.auditLog, auditEntry],
      this.isActive,
      this.isFavorite,
      this.createdAt,
      now,
      now,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  completeExecution(
    data: ReportData, 
    executionTime: number, 
    generatedFile?: string,
    expirationDays?: number
  ): Report {
    const now = new Date();
    const expiresAt = expirationDays ? new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000) : undefined;
    
    // Update the latest audit entry
    const updatedAuditLog = [...this.auditLog];
    if (updatedAuditLog.length > 0) {
      const lastEntry = updatedAuditLog[updatedAuditLog.length - 1];
      updatedAuditLog[updatedAuditLog.length - 1] = {
        ...lastEntry,
        executionTime,
        recordCount: data.totalRows,
        status: 'success',
        dataHash: this.generateDataHash(data),
        fileSize: generatedFile ? this.estimateFileSize(data) : undefined
      };
    }

    // Update analytics
    const newAnalytics: ReportAnalytics = {
      executions: this.analytics.executions + 1,
      averageExecutionTime: (this.analytics.averageExecutionTime * this.analytics.executions + executionTime) / (this.analytics.executions + 1),
      lastExecutionTime: executionTime,
      successRate: this.analytics.executions === 0 ? 100 : 
        ((this.analytics.successRate * this.analytics.executions) + 100) / (this.analytics.executions + 1),
      totalViews: this.analytics.totalViews,
      totalDownloads: this.analytics.totalDownloads,
      totalShares: this.analytics.totalShares,
      performanceScore: this.calculatePerformanceScore(executionTime, data.totalRows),
      usage: {
        daily: this.analytics.usage.daily + 1,
        weekly: this.analytics.usage.weekly + 1,
        monthly: this.analytics.usage.monthly + 1
      }
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      'completed',
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      newAnalytics,
      updatedAuditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      now,
      this.lastExecutedAt,
      data,
      generatedFile,
      expiresAt
    );
  }

  failExecution(executionTime: number, errorMessage: string): Report {
    const now = new Date();
    
    // Update the latest audit entry
    const updatedAuditLog = [...this.auditLog];
    if (updatedAuditLog.length > 0) {
      const lastEntry = updatedAuditLog[updatedAuditLog.length - 1];
      updatedAuditLog[updatedAuditLog.length - 1] = {
        ...lastEntry,
        executionTime,
        recordCount: 0,
        status: 'error',
        errorMessage
      };
    }

    // Update analytics
    const newAnalytics: ReportAnalytics = {
      ...this.analytics,
      executions: this.analytics.executions + 1,
      averageExecutionTime: (this.analytics.averageExecutionTime * this.analytics.executions + executionTime) / (this.analytics.executions + 1),
      lastExecutionTime: executionTime,
      successRate: this.analytics.executions === 0 ? 0 : 
        ((this.analytics.successRate * this.analytics.executions) + 0) / (this.analytics.executions + 1),
      performanceScore: Math.max(0, this.analytics.performanceScore - 10) // Decrease performance score
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      'failed',
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      newAnalytics,
      updatedAuditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      now,
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  recordView(): Report {
    const updatedAnalytics: ReportAnalytics = {
      ...this.analytics,
      totalViews: this.analytics.totalViews + 1
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      this.status,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      updatedAnalytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      this.updatedAt,
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  recordDownload(): Report {
    const updatedAnalytics: ReportAnalytics = {
      ...this.analytics,
      totalDownloads: this.analytics.totalDownloads + 1
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      this.status,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      updatedAnalytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      this.updatedAt,
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  recordShare(): Report {
    const updatedAnalytics: ReportAnalytics = {
      ...this.analytics,
      totalShares: this.analytics.totalShares + 1
    };

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      this.status,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      updatedAnalytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      this.updatedAt,
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  schedule(scheduleConfig: ReportSchedule): Report {
    if (!this.canBeScheduled()) {
      throw new Error('Report cannot be scheduled in current state');
    }

    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      'scheduled',
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      scheduleConfig,
      this.delivery,
      this.analytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      new Date(),
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  unschedule(): Report {
    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      this.status === 'scheduled' ? 'completed' : this.status,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      undefined,
      this.delivery,
      this.analytics,
      this.auditLog,
      this.isActive,
      this.isFavorite,
      this.createdAt,
      new Date(),
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  setFavorite(isFavorite: boolean): Report {
    return new Report(
      this.id,
      this.name,
      this.description,
      this.type,
      this.status,
      this.access,
      this.query,
      this.parameters,
      this.formats,
      this.visualizations,
      this.metadata,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.isTemplate,
      this.schedule,
      this.delivery,
      this.analytics,
      this.auditLog,
      this.isActive,
      isFavorite,
      this.createdAt,
      new Date(),
      this.lastExecutedAt,
      this.data,
      this.generatedFile,
      this.expiresAt
    );
  }

  // Helper Methods

  private generateDataHash(data: ReportData): string {
    // Simple hash for data integrity checking
    return `hash_${data.totalRows}_${data.headers.length}_${Date.now()}`;
  }

  private estimateFileSize(data: ReportData): number {
    // Rough estimation in bytes
    const headerSize = data.headers.join(',').length;
    const rowSize = data.rows.reduce((sum, row) => sum + row.join(',').length, 0);
    return headerSize + rowSize;
  }

  private calculatePerformanceScore(executionTime: number, recordCount: number): number {
    // Simple performance scoring algorithm
    const timeScore = Math.max(0, 100 - (executionTime / 10)); // Penalize long execution times
    const dataScore = Math.min(100, recordCount / 100); // Reward processing more records
    return Math.round((timeScore + dataScore) / 2);
  }

  // Static Factory Methods

  static createTemplate(
    id: string,
    name: string,
    description: string,
    type: ReportType,
    query: string,
    parameters: ReportParameter[],
    createdBy: string,
    clinicId?: string,
    workspaceId?: string
  ): Report {
    const metadata: ReportMetadata = {
      title: name,
      description,
      author: createdBy,
      version: '1.0',
      tags: ['template'],
      category: type.replace('_', ' '),
      lastModified: new Date(),
      dataSource: 'database'
    };

    return new Report(
      id,
      name,
      description,
      type,
      'draft',
      'private',
      query,
      parameters,
      ['pdf', 'csv', 'xlsx'],
      [],
      metadata,
      clinicId,
      workspaceId,
      createdBy,
      true // isTemplate
    );
  }

  static fromTemplate(
    template: Report,
    newId: string,
    newName: string,
    createdBy: string,
    parameters?: { [key: string]: any }
  ): Report {
    // Apply default parameter values if provided
    const updatedParameters = template.parameters.map(param => ({
      ...param,
      defaultValue: parameters?.[param.name] ?? param.defaultValue
    }));

    return new Report(
      newId,
      newName,
      template.description,
      template.type,
      'draft',
      template.access,
      template.query,
      updatedParameters,
      template.formats,
      template.visualizations,
      {
        ...template.metadata,
        title: newName,
        lastModified: new Date()
      },
      template.clinicId,
      template.workspaceId,
      createdBy,
      false, // Not a template
      template.schedule,
      template.delivery
    );
  }
}