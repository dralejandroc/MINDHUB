/**
 * Form Submission Presenter
 * Transforms FormSubmission entities into UI-friendly view models
 */

import { FormSubmission, SubmissionStatus } from '../entities/FormSubmission';

export interface FormSubmissionViewModel {
  id: string;
  formId: string;
  formName?: string;
  submittedBy: string;
  submitterType: {
    value: 'patient' | 'professional' | 'admin';
    label: string;
    icon: string;
  };
  status: {
    value: SubmissionStatus;
    label: string;
    color: string;
    canEdit: boolean;
    canSubmit: boolean;
    canReview: boolean;
  };
  progress: {
    percentage: number;
    completedFields: number;
    totalFields: number;
    isComplete: boolean;
  };
  patientId?: string;
  patientName?: string;
  assignedBy?: string;
  assignedByName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  isAnonymous: boolean;
  hasAttachments: boolean;
  hasSignatures: boolean;
  attachmentCount: number;
  signatureCount: number;
  isExpired: boolean;
  timeSpent?: {
    seconds: number;
    formatted: string;
  };
  dates: {
    created: string;
    updated: string;
    assigned?: string;
    submitted?: string;
    reviewed?: string;
    expires?: string;
  };
  metadata: {
    deviceType?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  tenant: {
    type: 'clinic' | 'workspace';
    id: string;
  } | null;
}

export interface SubmissionListViewModel {
  submissions: FormSubmissionViewModel[];
  totalCount: number;
  statusSummary: {
    draft: number;
    submitted: number;
    reviewed: number;
    processed: number;
    archived: number;
  };
  submitterTypeSummary: {
    patient: number;
    professional: number;
    admin: number;
  };
  recentActivity: Array<{
    submissionId: string;
    formName: string;
    action: string;
    timestamp: string;
    submitterName?: string;
  }>;
  expiredCount: number;
  pendingReviewCount: number;
}

export interface SubmissionStatsViewModel {
  totalSubmissions: number;
  completedSubmissions: number;
  averageCompletionTime: number;
  completionRate: number;
  submissionsByStatus: Array<{
    status: SubmissionStatus;
    count: number;
    percentage: number;
  }>;
  submissionsByMonth: Array<{
    month: string;
    count: number;
    completionRate: number;
  }>;
  submissionsByDevice: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  topForms: Array<{
    formId: string;
    formName: string;
    submissionCount: number;
    completionRate: number;
  }>;
  averageTimeByForm: Array<{
    formId: string;
    formName: string;
    averageTime: number;
    formattedTime: string;
  }>;
}

export interface SubmissionAnalyticsViewModel {
  dropOffAnalysis: Array<{
    fieldName: string;
    dropOffRate: number;
    completionCount: number;
    startCount: number;
  }>;
  completionFunnel: Array<{
    step: string;
    count: number;
    percentage: number;
    dropOff: number;
  }>;
  timeAnalysis: {
    averageTotal: number;
    averagePerField: number;
    quickestSubmission: number;
    slowestSubmission: number;
    timeDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
  deviceAnalysis: {
    byType: Record<string, number>;
    completionRateByDevice: Record<string, number>;
    averageTimeByDevice: Record<string, number>;
  };
  errorAnalysis: Array<{
    fieldName: string;
    errorType: string;
    errorCount: number;
    errorRate: number;
  }>;
}

export class FormSubmissionPresenter {
  /**
   * Transform single FormSubmission entity to view model
   */
  static toViewModel(submission: FormSubmission, formName?: string): FormSubmissionViewModel {
    const summary = submission.getSummary();
    const timeSpent = submission.getSubmissionDuration();

    return {
      id: submission.id,
      formId: submission.formId,
      formName,
      submittedBy: submission.submittedBy,
      submitterType: {
        value: submission.submitterType,
        label: this.getSubmitterTypeLabel(submission.submitterType),
        icon: this.getSubmitterTypeIcon(submission.submitterType)
      },
      status: {
        value: submission.status,
        label: this.getStatusLabel(submission.status),
        color: this.getStatusColor(submission.status),
        canEdit: submission.canBeEdited(),
        canSubmit: submission.canBeSubmitted(),
        canReview: submission.canBeReviewed()
      },
      progress: {
        percentage: submission.getCompletionPercentage(),
        completedFields: summary.completedFields,
        totalFields: summary.totalFields,
        isComplete: summary.completedFields === summary.totalFields
      },
      patientId: submission.patientId,
      assignedBy: submission.assignedBy,
      reviewedBy: submission.reviewedBy,
      reviewNotes: submission.reviewNotes,
      isAnonymous: submission.isAnonymous,
      hasAttachments: submission.hasAttachments(),
      hasSignatures: submission.hasSignatures(),
      attachmentCount: submission.attachments.length,
      signatureCount: submission.signatures.length,
      isExpired: submission.isExpired(),
      timeSpent: timeSpent ? {
        seconds: timeSpent,
        formatted: this.formatDuration(timeSpent)
      } : undefined,
      dates: {
        created: this.formatDate(submission.createdAt),
        updated: this.formatDate(submission.updatedAt),
        assigned: submission.assignedAt ? this.formatDate(submission.assignedAt) : undefined,
        submitted: submission.submittedAt ? this.formatDate(submission.submittedAt) : undefined,
        reviewed: submission.reviewedAt ? this.formatDate(submission.reviewedAt) : undefined,
        expires: submission.expiresAt ? this.formatDate(submission.expiresAt) : undefined
      },
      metadata: {
        deviceType: submission.metadata.deviceType,
        sessionId: submission.metadata.sessionId,
        ipAddress: submission.metadata.ipAddress,
        userAgent: submission.metadata.userAgent
      },
      tenant: submission.clinicId 
        ? { type: 'clinic', id: submission.clinicId }
        : submission.workspaceId 
          ? { type: 'workspace', id: submission.workspaceId }
          : null
    };
  }

  /**
   * Transform list of FormSubmissions to list view model
   */
  static toListViewModel(submissions: FormSubmission[], formNames?: Map<string, string>): SubmissionListViewModel {
    const submissionViewModels = submissions.map(submission => 
      this.toViewModel(submission, formNames?.get(submission.formId))
    );

    const statusSummary = {
      draft: submissions.filter(s => s.status === 'draft').length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      reviewed: submissions.filter(s => s.status === 'reviewed').length,
      processed: submissions.filter(s => s.status === 'processed').length,
      archived: submissions.filter(s => s.status === 'archived').length
    };

    const submitterTypeSummary = {
      patient: submissions.filter(s => s.submitterType === 'patient').length,
      professional: submissions.filter(s => s.submitterType === 'professional').length,
      admin: submissions.filter(s => s.submitterType === 'admin').length
    };

    const recentActivity = submissions
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 10)
      .map(submission => ({
        submissionId: submission.id,
        formName: formNames?.get(submission.formId) || 'Formulario',
        action: this.getLastAction(submission),
        timestamp: this.formatRelativeTime(submission.updatedAt)
      }));

    const expiredCount = submissions.filter(s => s.isExpired()).length;
    const pendingReviewCount = submissions.filter(s => s.status === 'submitted').length;

    return {
      submissions: submissionViewModels,
      totalCount: submissions.length,
      statusSummary,
      submitterTypeSummary,
      recentActivity,
      expiredCount,
      pendingReviewCount
    };
  }

  /**
   * Calculate submission statistics
   */
  static calculateStats(submissions: FormSubmission[], formNames?: Map<string, string>): SubmissionStatsViewModel {
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => 
      s.status === 'submitted' || s.status === 'reviewed' || s.status === 'processed'
    ).length;
    
    // Calculate average completion time
    const submissionsWithTime = submissions.filter(s => s.getSubmissionDuration() !== null);
    const totalTime = submissionsWithTime.reduce((sum, s) => sum + (s.getSubmissionDuration() || 0), 0);
    const averageCompletionTime = submissionsWithTime.length > 0 ? 
      Math.round(totalTime / submissionsWithTime.length) : 0;

    const completionRate = totalSubmissions > 0 ? 
      Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

    // Group by status
    const statusGroups: Record<SubmissionStatus, FormSubmission[]> = {
      'draft': [],
      'submitted': [],
      'reviewed': [],
      'processed': [],
      'archived': []
    };
    submissions.forEach(s => statusGroups[s.status].push(s));

    const submissionsByStatus = Object.entries(statusGroups).map(([status, subs]) => ({
      status: status as SubmissionStatus,
      count: subs.length,
      percentage: totalSubmissions > 0 ? Math.round((subs.length / totalSubmissions) * 100) : 0
    }));

    // Group by month
    const monthlyGroups = new Map<string, FormSubmission[]>();
    submissions.forEach(submission => {
      const month = submission.createdAt?.toISOString().slice(0, 7) || '';
      if (!monthlyGroups.has(month)) {
        monthlyGroups.set(month, []);
      }
      monthlyGroups.get(month)!.push(submission);
    });

    const submissionsByMonth = Array.from(monthlyGroups.entries())
      .map(([month, subs]) => {
        const completed = subs.filter(s => 
          s.status === 'submitted' || s.status === 'reviewed' || s.status === 'processed'
        ).length;
        return {
          month,
          count: subs.length,
          completionRate: subs.length > 0 ? Math.round((completed / subs.length) * 100) : 0
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by device
    const deviceGroups = new Map<string, number>();
    submissions.forEach(submission => {
      const device = submission.metadata.deviceType || 'unknown';
      deviceGroups.set(device, (deviceGroups.get(device) || 0) + 1);
    });

    const submissionsByDevice = Array.from(deviceGroups.entries())
      .map(([device, count]) => ({
        device,
        count,
        percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Group by form
    const formGroups = new Map<string, FormSubmission[]>();
    submissions.forEach(submission => {
      if (!formGroups.has(submission.formId)) {
        formGroups.set(submission.formId, []);
      }
      formGroups.get(submission.formId)!.push(submission);
    });

    const topForms = Array.from(formGroups.entries())
      .map(([formId, subs]) => {
        const completed = subs.filter(s => 
          s.status === 'submitted' || s.status === 'reviewed' || s.status === 'processed'
        ).length;
        return {
          formId,
          formName: formNames?.get(formId) || 'Formulario',
          submissionCount: subs.length,
          completionRate: subs.length > 0 ? Math.round((completed / subs.length) * 100) : 0
        };
      })
      .sort((a, b) => b.submissionCount - a.submissionCount)
      .slice(0, 5);

    const averageTimeByForm = Array.from(formGroups.entries())
      .map(([formId, subs]) => {
        const subsWithTime = subs.filter(s => s.getSubmissionDuration() !== null);
        const totalTime = subsWithTime.reduce((sum, s) => sum + (s.getSubmissionDuration() || 0), 0);
        const avgTime = subsWithTime.length > 0 ? Math.round(totalTime / subsWithTime.length) : 0;
        
        return {
          formId,
          formName: formNames?.get(formId) || 'Formulario',
          averageTime: avgTime,
          formattedTime: this.formatDuration(avgTime)
        };
      })
      .filter(f => f.averageTime > 0)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    return {
      totalSubmissions,
      completedSubmissions,
      averageCompletionTime,
      completionRate,
      submissionsByStatus,
      submissionsByMonth,
      submissionsByDevice,
      topForms,
      averageTimeByForm
    };
  }

  /**
   * Filter submissions by search query
   */
  static filterBySearch(submissions: FormSubmission[], query: string): FormSubmission[] {
    if (!query.trim()) return submissions;

    const lowerQuery = query.toLowerCase();
    return submissions.filter(submission =>
      submission.id.toLowerCase().includes(lowerQuery) ||
      submission.submittedBy.toLowerCase().includes(lowerQuery) ||
      (submission.patientId && submission.patientId.toLowerCase().includes(lowerQuery)) ||
      (submission.reviewNotes && submission.reviewNotes.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Sort submissions by specified criteria
   */
  static sortSubmissions(
    submissions: FormSubmission[], 
    sortBy: 'date' | 'status' | 'progress' | 'time'
  ): FormSubmission[] {
    return [...submissions].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
        case 'status':
          const statusOrder = { 'submitted': 0, 'draft': 1, 'reviewed': 2, 'processed': 3, 'archived': 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'progress':
          return b.getCompletionPercentage() - a.getCompletionPercentage();
        case 'time':
          const timeA = a.getSubmissionDuration() || 0;
          const timeB = b.getSubmissionDuration() || 0;
          return timeB - timeA;
        default:
          return 0;
      }
    });
  }

  /**
   * Group submissions by status
   */
  static groupByStatus(submissions: FormSubmission[]): Map<SubmissionStatus, FormSubmission[]> {
    const groups = new Map<SubmissionStatus, FormSubmission[]>();
    
    submissions.forEach(submission => {
      if (!groups.has(submission.status)) {
        groups.set(submission.status, []);
      }
      groups.get(submission.status)!.push(submission);
    });

    return groups;
  }

  /**
   * Get submissions that need attention
   */
  static getSubmissionsNeedingAttention(submissions: FormSubmission[]): Array<{
    submission: FormSubmissionViewModel;
    issues: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    const submissionsWithIssues: Array<{
      submission: FormSubmissionViewModel;
      issues: string[];
      priority: 'high' | 'medium' | 'low';
    }> = [];

    submissions.forEach(submission => {
      const issues: string[] = [];
      let priority: 'high' | 'medium' | 'low' = 'low';
      const viewModel = this.toViewModel(submission);

      // Check for critical issues
      if (submission.isExpired() && submission.status === 'draft') {
        issues.push('Formulario expirado');
        priority = 'high';
      }

      if (submission.status === 'submitted') {
        issues.push('Pendiente de revisión');
        if (priority !== 'high') priority = 'medium';
      }

      // Check for draft submissions older than 7 days
      if (submission.status === 'draft' && submission.createdAt) {
        const daysSinceCreated = Math.floor(
          (Date.now() - submission.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated > 7) {
          issues.push(`Borrador inactivo (${daysSinceCreated} días)`);
          if (priority !== 'high') priority = 'medium';
        }
      }

      // Check completion percentage for drafts
      if (submission.status === 'draft') {
        const completionRate = submission.getCompletionPercentage();
        if (completionRate > 80) {
          issues.push('Casi completo - listo para enviar');
        }
      }

      if (issues.length > 0) {
        submissionsWithIssues.push({ submission: viewModel, issues, priority });
      }
    });

    // Sort by priority and date
    return submissionsWithIssues.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by date
      return b.submission.dates.updated.localeCompare(a.submission.dates.updated);
    });
  }

  // Helper methods
  private static getSubmitterTypeLabel(type: string): string {
    const labels = {
      patient: 'Paciente',
      professional: 'Profesional',
      admin: 'Administrador'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private static getSubmitterTypeIcon(type: string): string {
    const icons = {
      patient: '🏥',
      professional: '👨‍⚕️',
      admin: '👤'
    };
    return icons[type as keyof typeof icons] || '👤';
  }

  private static getStatusLabel(status: SubmissionStatus): string {
    const labels = {
      draft: 'Borrador',
      submitted: 'Enviado',
      reviewed: 'Revisado',
      processed: 'Procesado',
      archived: 'Archivado'
    };
    return labels[status] || status;
  }

  private static getStatusColor(status: SubmissionStatus): string {
    const colors = {
      draft: 'yellow',
      submitted: 'blue',
      reviewed: 'green',
      processed: 'purple',
      archived: 'gray'
    };
    return colors[status] || 'gray';
  }

  private static getLastAction(submission: FormSubmission): string {
    if (submission.reviewedAt) return 'revisado';
    if (submission.submittedAt) return 'enviado';
    if (submission.updatedAt !== submission.createdAt) return 'editado';
    return 'creado';
  }

  private static formatDate(date?: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private static formatRelativeTime(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return this.formatDate(date);
  }

  private static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}