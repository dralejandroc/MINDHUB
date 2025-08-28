/**
 * Django Form Submission Repository Adapter
 * Implements FormSubmissionRepository interface using Django REST API
 */

import { FormSubmission, SubmissionStatus, SubmissionAttachment, SubmissionSignature, SubmissionMetadata } from '../entities/FormSubmission';
import { FormSubmissionRepository, FormSubmissionFilters } from '../repositories/FormSubmissionRepository';

interface DjangoSubmissionResponse {
  id: string;
  form_id: string;
  submitted_by: string;
  submitter_type: 'patient' | 'professional' | 'admin';
  data: Record<string, any>;
  status: SubmissionStatus;
  attachments: DjangoAttachmentResponse[];
  signatures: DjangoSignatureResponse[];
  metadata: SubmissionMetadata;
  patient_id?: string;
  assigned_by?: string;
  assigned_at?: string;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  clinic_id?: string;
  workspace_id?: string;
  is_anonymous: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface DjangoAttachmentResponse {
  id: string;
  field_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  url?: string;
}

interface DjangoSignatureResponse {
  field_id: string;
  signature_data: string;
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export class DjangoFormSubmissionRepository implements FormSubmissionRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api/formx/django') {
    this.baseUrl = baseUrl;
  }

  async findById(id: string): Promise<FormSubmission | null> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submission: ${response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error fetching submission by ID:', error);
      throw error;
    }
  }

  async findAll(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/submissions/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  }

  async findByFormAndSubmitter(formId: string, submittedBy: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('form_id', formId);
      params.append('submitted_by', submittedBy);
      
      const response = await fetch(`${this.baseUrl}/submissions/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by form and submitter:', error);
      throw error;
    }
  }

  async findByPatient(patientId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('patient_id', patientId);
      
      const response = await fetch(`${this.baseUrl}/submissions/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions by patient: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by patient:', error);
      throw error;
    }
  }

  async findByProfessional(professionalId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('submitted_by', professionalId);
      params.append('submitter_type', 'professional');
      
      const response = await fetch(`${this.baseUrl}/submissions/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions by professional: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by professional:', error);
      throw error;
    }
  }

  async findByForm(formId: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('form_id', formId);
      
      const response = await fetch(`${this.baseUrl}/submissions/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions by form: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by form:', error);
      throw error;
    }
  }

  async search(query: string, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('search', query);
      
      const response = await fetch(`${this.baseUrl}/submissions/search/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search submissions: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error searching submissions:', error);
      throw error;
    }
  }

  async create(submission: FormSubmission): Promise<FormSubmission> {
    try {
      const payload = this.mapToPayload(submission);
      
      const response = await fetch(`${this.baseUrl}/submissions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create submission: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async update(submission: FormSubmission): Promise<FormSubmission> {
    try {
      const payload = this.mapToPayload(submission);
      
      const response = await fetch(`${this.baseUrl}/submissions/${submission.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update submission: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete submission: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  }

  async archive(id: string): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/archive/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to archive submission: ${response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error archiving submission:', error);
      throw error;
    }
  }

  async restore(id: string): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/restore/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to restore submission: ${response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error restoring submission:', error);
      throw error;
    }
  }

  async submit(id: string, finalData?: Record<string, any>): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ final_data: finalData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to submit form: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  async review(id: string, reviewedBy: string, reviewNotes?: string): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/review/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewed_by: reviewedBy,
          review_notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to review submission: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  }

  async addAttachment(submissionId: string, attachment: any): Promise<FormSubmission> {
    try {
      const formData = new FormData();
      formData.append('field_id', attachment.fieldId);
      formData.append('file', attachment.file);

      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/attachments/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add attachment: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  async removeAttachment(submissionId: string, attachmentId: string): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/attachments/${attachmentId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove attachment: ${response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error removing attachment:', error);
      throw error;
    }
  }

  async addSignature(submissionId: string, signature: any): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/signatures/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_id: signature.fieldId,
          signature_data: signature.signatureData,
          ip_address: signature.ipAddress,
          user_agent: signature.userAgent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add signature: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error adding signature:', error);
      throw error;
    }
  }

  async updateData(id: string, data: Record<string, any>): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/data/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update submission data: ${errorData.detail || response.statusText}`);
      }

      const responseData: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(responseData);
    } catch (error) {
      console.error('Error updating submission data:', error);
      throw error;
    }
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<FormSubmission> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/metadata/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update submission metadata: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoSubmissionResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error updating submission metadata:', error);
      throw error;
    }
  }

  async getStats(filters?: FormSubmissionFilters): Promise<any> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/submissions/stats/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submission stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      throw error;
    }
  }

  async getRecentSubmissions(limit?: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      const response = await fetch(`${this.baseUrl}/submissions/recent/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent submissions: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      throw error;
    }
  }

  async getPendingReview(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    return this.findAll({ ...filters, status: 'submitted' });
  }

  async getExpiredSubmissions(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/submissions/expired/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch expired submissions: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching expired submissions:', error);
      throw error;
    }
  }

  async getIncompleteSubmissions(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    return this.findAll({ ...filters, status: 'draft' });
  }

  async findByCompletionRange(minPercentage: number, maxPercentage: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('min_completion', minPercentage.toString());
      params.append('max_completion', maxPercentage.toString());
      
      const response = await fetch(`${this.baseUrl}/submissions/by-completion/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions by completion: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by completion range:', error);
      throw error;
    }
  }

  async findWithAttachments(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    return this.findAll({ ...filters, hasAttachments: true });
  }

  async findWithSignatures(filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    return this.findAll({ ...filters, hasSignatures: true });
  }

  async findByTimeSpentRange(minSeconds: number, maxSeconds: number, filters?: FormSubmissionFilters): Promise<FormSubmission[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('min_time_spent', minSeconds.toString());
      params.append('max_time_spent', maxSeconds.toString());
      
      const response = await fetch(`${this.baseUrl}/submissions/by-time-spent/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions by time spent: ${response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error fetching submissions by time spent range:', error);
      throw error;
    }
  }

  async getRequiringAttention(filters?: FormSubmissionFilters): Promise<any> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/submissions/requiring-attention/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions requiring attention: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        expiredDrafts: data.expired_drafts.map((s: DjangoSubmissionResponse) => this.mapToEntity(s)),
        pendingReview: data.pending_review.map((s: DjangoSubmissionResponse) => this.mapToEntity(s)),
        longPendingDrafts: data.long_pending_drafts.map((s: DjangoSubmissionResponse) => this.mapToEntity(s))
      };
    } catch (error) {
      console.error('Error fetching submissions requiring attention:', error);
      throw error;
    }
  }

  async bulkUpdate(submissionIds: string[], updates: Partial<FormSubmission>): Promise<FormSubmission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/bulk-update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_ids: submissionIds,
          updates: this.mapPartialToPayload(updates),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to bulk update submissions: ${errorData.detail || response.statusText}`);
      }

      const data: { results: DjangoSubmissionResponse[] } = await response.json();
      return data.results.map(submission => this.mapToEntity(submission));
    } catch (error) {
      console.error('Error bulk updating submissions:', error);
      throw error;
    }
  }

  async bulkArchive(submissionIds: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/bulk-archive/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submission_ids: submissionIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to bulk archive submissions: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error bulk archiving submissions:', error);
      throw error;
    }
  }

  async exportSubmissions(filters?: FormSubmissionFilters, format = 'json'): Promise<any> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('format', format);
      
      const response = await fetch(`${this.baseUrl}/submissions/export/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to export submissions: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error exporting submissions:', error);
      throw error;
    }
  }

  async getCompletionAnalytics(filters?: FormSubmissionFilters): Promise<any> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/submissions/completion-analytics/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completion analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching completion analytics:', error);
      throw error;
    }
  }

  async cleanupExpiredDrafts(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/cleanup-expired/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to cleanup expired drafts: ${response.statusText}`);
      }

      const data: { cleaned_count: number } = await response.json();
      return data.cleaned_count;
    } catch (error) {
      console.error('Error cleaning up expired drafts:', error);
      throw error;
    }
  }

  /**
   * Map Django response to FormSubmission entity
   */
  private mapToEntity(data: DjangoSubmissionResponse): FormSubmission {
    const attachments: SubmissionAttachment[] = data.attachments.map(att => ({
      id: att.id,
      fieldId: att.field_id,
      fileName: att.file_name,
      fileSize: att.file_size,
      mimeType: att.mime_type,
      uploadedAt: new Date(att.uploaded_at),
      url: att.url
    }));

    const signatures: SubmissionSignature[] = data.signatures.map(sig => ({
      fieldId: sig.field_id,
      signatureData: sig.signature_data,
      signedAt: new Date(sig.signed_at),
      ipAddress: sig.ip_address,
      userAgent: sig.user_agent
    }));

    return new FormSubmission(
      data.id,
      data.form_id,
      data.submitted_by,
      data.submitter_type,
      data.data,
      data.status,
      attachments,
      signatures,
      data.metadata,
      data.patient_id,
      data.assigned_by,
      data.assigned_at ? new Date(data.assigned_at) : undefined,
      data.submitted_at ? new Date(data.submitted_at) : undefined,
      data.reviewed_by,
      data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      data.review_notes,
      data.clinic_id,
      data.workspace_id,
      data.is_anonymous,
      data.expires_at ? new Date(data.expires_at) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  /**
   * Map FormSubmission entity to Django payload
   */
  private mapToPayload(submission: FormSubmission): any {
    return {
      form_id: submission.formId,
      submitted_by: submission.submittedBy,
      submitter_type: submission.submitterType,
      data: submission.data,
      status: submission.status,
      metadata: submission.metadata,
      patient_id: submission.patientId,
      assigned_by: submission.assignedBy,
      review_notes: submission.reviewNotes,
      clinic_id: submission.clinicId,
      workspace_id: submission.workspaceId,
      is_anonymous: submission.isAnonymous,
      expires_at: submission.expiresAt?.toISOString()
    };
  }

  /**
   * Map partial FormSubmission to Django payload
   */
  private mapPartialToPayload(updates: Partial<FormSubmission>): any {
    const payload: any = {};
    
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;
    if (updates.reviewNotes !== undefined) payload.review_notes = updates.reviewNotes;
    if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt?.toISOString();

    return payload;
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters?: FormSubmissionFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    if (!filters) return params;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else {
          params.append(key, String(value));
        }
      }
    });

    return params;
  }
}