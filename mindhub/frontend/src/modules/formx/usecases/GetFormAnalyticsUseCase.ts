/**
 * Get Form Analytics Use Case
 * Application business rules for form analytics and reporting
 */

import { FormRepository } from '../repositories/FormRepository';
import { FormSubmissionRepository } from '../repositories/FormSubmissionRepository';

export interface FormAnalyticsRequest {
  formId?: string;
  clinicId?: string;
  workspaceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeArchived?: boolean;
}

export interface FormAnalytics {
  totalForms: number;
  publishedForms: number;
  totalSubmissions: number;
  completedSubmissions: number;
  draftSubmissions: number;
  averageCompletionTime: number;
  averageCompletionRate: number;
  submissionsByForm: Array<{
    formId: string;
    formName: string;
    totalSubmissions: number;
    completedSubmissions: number;
    averageCompletionTime: number;
    completionRate: number;
  }>;
  submissionsByMonth: Array<{
    month: string;
    totalSubmissions: number;
    completedSubmissions: number;
  }>;
  topPerformingForms: Array<{
    formId: string;
    formName: string;
    completionRate: number;
    totalSubmissions: number;
  }>;
  abandonmentAnalysis: Array<{
    formId: string;
    formName: string;
    abandonmentRate: number;
    commonExitPoints: Array<{
      fieldName: string;
      exitCount: number;
    }>;
  }>;
}

export class GetFormAnalyticsUseCase {
  constructor(
    private formRepository: FormRepository,
    private submissionRepository: FormSubmissionRepository
  ) {}

  async execute(request: FormAnalyticsRequest): Promise<FormAnalytics> {
    // Business rule: Validate request parameters
    this.validateRequest(request);

    // Get forms within scope
    const forms = await this.getFormsInScope(request);
    
    // Get submissions within scope  
    const submissions = await this.getSubmissionsInScope(request);

    // Calculate analytics
    const analytics: FormAnalytics = {
      totalForms: forms.length,
      publishedForms: forms.filter(f => f.status === 'published').length,
      totalSubmissions: submissions.length,
      completedSubmissions: submissions.filter(s => s.status === 'submitted' || s.status === 'reviewed').length,
      draftSubmissions: submissions.filter(s => s.status === 'draft').length,
      averageCompletionTime: this.calculateAverageCompletionTime(submissions),
      averageCompletionRate: this.calculateAverageCompletionRate(forms, submissions),
      submissionsByForm: this.calculateSubmissionsByForm(forms, submissions),
      submissionsByMonth: this.calculateSubmissionsByMonth(submissions),
      topPerformingForms: this.calculateTopPerformingForms(forms, submissions),
      abandonmentAnalysis: await this.calculateAbandonmentAnalysis(forms, submissions)
    };

    return analytics;
  }

  /**
   * Business rule: Validate analytics request parameters
   */
  private validateRequest(request: FormAnalyticsRequest): void {
    // Business rule: Must specify either clinic or workspace (unless system admin)
    if (!request.clinicId && !request.workspaceId && !request.formId) {
      throw new Error('Must specify clinic, workspace, or specific form for analytics');
    }

    // Business rule: Date range validation
    if (request.dateFrom && request.dateTo && request.dateFrom > request.dateTo) {
      throw new Error('Date from cannot be after date to');
    }

    // Business rule: Date range cannot be more than 2 years
    if (request.dateFrom && request.dateTo) {
      const diffTime = Math.abs(request.dateTo.getTime() - request.dateFrom.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 730) { // 2 years
        throw new Error('Date range cannot exceed 2 years');
      }
    }
  }

  /**
   * Get forms within the analysis scope
   */
  private async getFormsInScope(request: FormAnalyticsRequest) {
    if (request.formId) {
      const form = await this.formRepository.findById(request.formId);
      return form ? [form] : [];
    }

    return await this.formRepository.findAll({
      clinicId: request.clinicId,
      workspaceId: request.workspaceId,
      includeArchived: request.includeArchived || false,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo
    });
  }

  /**
   * Get submissions within the analysis scope
   */
  private async getSubmissionsInScope(request: FormAnalyticsRequest) {
    return await this.submissionRepository.findAll({
      formId: request.formId,
      clinicId: request.clinicId,
      workspaceId: request.workspaceId,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo
    });
  }

  /**
   * Calculate average completion time in seconds
   */
  private calculateAverageCompletionTime(submissions: any[]): number {
    const completedSubmissions = submissions.filter(s => 
      (s.status === 'submitted' || s.status === 'reviewed') && 
      s.submittedAt && 
      s.createdAt
    );

    if (completedSubmissions.length === 0) return 0;

    const totalTime = completedSubmissions.reduce((sum, submission) => {
      const duration = submission.getSubmissionDuration();
      return sum + (duration || 0);
    }, 0);

    return Math.round(totalTime / completedSubmissions.length);
  }

  /**
   * Calculate average completion rate across all forms
   */
  private calculateAverageCompletionRate(forms: any[], submissions: any[]): number {
    if (forms.length === 0) return 0;

    const formRates = forms.map(form => {
      const formSubmissions = submissions.filter(s => s.formId === form.id);
      const completedSubmissions = formSubmissions.filter(s => 
        s.status === 'submitted' || s.status === 'reviewed'
      );

      return formSubmissions.length > 0 ? (completedSubmissions.length / formSubmissions.length) * 100 : 0;
    });

    const totalRate = formRates.reduce((sum, rate) => sum + rate, 0);
    return Math.round(totalRate / forms.length);
  }

  /**
   * Calculate submissions grouped by form
   */
  private calculateSubmissionsByForm(forms: any[], submissions: any[]) {
    return forms.map(form => {
      const formSubmissions = submissions.filter(s => s.formId === form.id);
      const completedSubmissions = formSubmissions.filter(s => 
        s.status === 'submitted' || s.status === 'reviewed'
      );

      const completionRate = formSubmissions.length > 0 
        ? Math.round((completedSubmissions.length / formSubmissions.length) * 100)
        : 0;

      const averageTime = this.calculateAverageCompletionTime(formSubmissions);

      return {
        formId: form.id,
        formName: form.name,
        totalSubmissions: formSubmissions.length,
        completedSubmissions: completedSubmissions.length,
        averageCompletionTime: averageTime,
        completionRate
      };
    }).sort((a, b) => b.totalSubmissions - a.totalSubmissions);
  }

  /**
   * Calculate submissions grouped by month
   */
  private calculateSubmissionsByMonth(submissions: any[]) {
    const monthlyData = new Map<string, { total: number; completed: number }>();

    submissions.forEach(submission => {
      const month = submission.createdAt.toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { total: 0, completed: 0 });
      }

      const data = monthlyData.get(month)!;
      data.total++;
      
      if (submission.status === 'submitted' || submission.status === 'reviewed') {
        data.completed++;
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        totalSubmissions: data.total,
        completedSubmissions: data.completed
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate top performing forms by completion rate
   */
  private calculateTopPerformingForms(forms: any[], submissions: any[]) {
    const formPerformance = forms.map(form => {
      const formSubmissions = submissions.filter(s => s.formId === form.id);
      const completedSubmissions = formSubmissions.filter(s => 
        s.status === 'submitted' || s.status === 'reviewed'
      );

      const completionRate = formSubmissions.length > 0 
        ? Math.round((completedSubmissions.length / formSubmissions.length) * 100)
        : 0;

      return {
        formId: form.id,
        formName: form.name,
        completionRate,
        totalSubmissions: formSubmissions.length
      };
    });

    // Business rule: Only include forms with at least 5 submissions
    return formPerformance
      .filter(fp => fp.totalSubmissions >= 5)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate abandonment analysis
   */
  private async calculateAbandonmentAnalysis(forms: any[], submissions: any[]) {
    const abandonmentData = [];

    for (const form of forms) {
      const formSubmissions = submissions.filter(s => s.formId === form.id);
      const draftSubmissions = formSubmissions.filter(s => s.status === 'draft');
      const totalSubmissions = formSubmissions.length;

      if (totalSubmissions === 0) continue;

      const abandonmentRate = Math.round((draftSubmissions.length / totalSubmissions) * 100);

      // Analyze common exit points (fields where users stopped)
      const exitPoints = new Map<string, number>();
      
      draftSubmissions.forEach(submission => {
        const lastField = this.getLastCompletedField(form, submission);
        if (lastField) {
          exitPoints.set(lastField, (exitPoints.get(lastField) || 0) + 1);
        }
      });

      const commonExitPoints = Array.from(exitPoints.entries())
        .map(([fieldName, exitCount]) => ({ fieldName, exitCount }))
        .sort((a, b) => b.exitCount - a.exitCount)
        .slice(0, 5); // Top 5 exit points

      abandonmentData.push({
        formId: form.id,
        formName: form.name,
        abandonmentRate,
        commonExitPoints
      });
    }

    return abandonmentData
      .filter(ad => ad.abandonmentRate > 0)
      .sort((a, b) => b.abandonmentRate - a.abandonmentRate);
  }

  /**
   * Get the last completed field in a draft submission
   */
  private getLastCompletedField(form: any, submission: any): string | null {
    const visibleFields = form.getVisibleFields(submission.data);
    const orderedFields = visibleFields.sort((a: any, b: any) => a.order - b.order);

    // Find the last field with a value
    for (let i = orderedFields.length - 1; i >= 0; i--) {
      const field = orderedFields[i];
      const value = submission.data[field.name];
      
      if (value !== null && value !== undefined && value !== '') {
        return field.name;
      }
    }

    return null;
  }
}