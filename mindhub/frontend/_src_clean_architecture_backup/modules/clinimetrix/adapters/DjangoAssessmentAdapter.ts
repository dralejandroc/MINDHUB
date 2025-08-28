/**
 * Django Assessment Repository Adapter
 * Implements AssessmentRepository interface for Django backend
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Assessment, AssessmentStatus } from '../entities/Assessment';
import { AssessmentRepository, AssessmentFilters } from '../repositories/AssessmentRepository';

export class DjangoAssessmentAdapter implements AssessmentRepository {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/clinimetrix-pro/django') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async findById(id: string): Promise<Assessment | undefined> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/${id}/`);
      const data = await response.json();
      return this.mapToAssessmentEntity(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findAll(filters?: AssessmentFilters): Promise<Assessment[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/?${params}`);
    const data = await response.json();
    
    return data.results.map((assessment: any) => this.mapToAssessmentEntity(assessment));
  }

  async create(assessment: Assessment): Promise<Assessment> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/`, {
      method: 'POST',
      body: JSON.stringify(this.mapFromAssessmentEntity(assessment)),
    });

    const data = await response.json();
    return this.mapToAssessmentEntity(data);
  }

  async update(assessment: Assessment): Promise<Assessment> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/${assessment.id}/`, {
      method: 'PUT',
      body: JSON.stringify(this.mapFromAssessmentEntity(assessment)),
    });

    const data = await response.json();
    return this.mapToAssessmentEntity(data);
  }

  async delete(id: string): Promise<void> {
    await this.fetchWithAuth(`${this.baseUrl}/assessments/${id}/`, {
      method: 'DELETE',
    });
  }

  async findByPatientAndScale(
    patientId: string,
    scaleId: string,
    filters?: Pick<AssessmentFilters, 'status'>
  ): Promise<Assessment[]> {
    const params = new URLSearchParams({
      patient_id: patientId,
      scale_id: scaleId
    });

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(status => params.append('status', status));
      } else {
        params.append('status', filters.status);
      }
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/?${params}`);
    const data = await response.json();
    
    return data.results.map((assessment: any) => this.mapToAssessmentEntity(assessment));
  }

  async findByPatient(patientId: string, filters?: Omit<AssessmentFilters, 'patientId'>): Promise<Assessment[]> {
    return this.findAll({ ...filters, patientId });
  }

  async findByScale(scaleId: string, filters?: Omit<AssessmentFilters, 'scaleId'>): Promise<Assessment[]> {
    return this.findAll({ ...filters, scaleId });
  }

  async findByAdministrator(
    administratorId: string,
    filters?: Omit<AssessmentFilters, 'administratorId'>
  ): Promise<Assessment[]> {
    return this.findAll({ ...filters, administratorId });
  }

  async getPatientStats(patientId: string): Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageCompletionRate: number;
    scalesUsed: string[];
  }> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/patient-stats/${patientId}/`);
    return response.json();
  }

  async getScaleStats(scaleId: string): Promise<{
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    averageCompletionTime: number;
  }> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/scale-stats/${scaleId}/`);
    return response.json();
  }

  async findExpired(olderThanDays: number = 30): Promise<Assessment[]> {
    const params = new URLSearchParams({
      expired_days: olderThanDays.toString()
    });

    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/expired/?${params}`);
    const data = await response.json();
    
    return data.results.map((assessment: any) => this.mapToAssessmentEntity(assessment));
  }

  async getRecent(limit: number = 10, filters?: AssessmentFilters): Promise<Assessment[]> {
    const params = new URLSearchParams({
      ordering: '-created_at',
      limit: limit.toString()
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/?${params}`);
    const data = await response.json();
    
    return data.results.map((assessment: any) => this.mapToAssessmentEntity(assessment));
  }

  async checkForConflicts(
    patientId: string,
    scaleId: string,
    startTime?: Date,
    excludeId?: string
  ): Promise<Assessment[]> {
    const params = new URLSearchParams({
      patient_id: patientId,
      scale_id: scaleId,
      check_conflicts: 'true'
    });

    if (startTime) {
      params.append('start_time', startTime.toISOString());
    }

    if (excludeId) {
      params.append('exclude_id', excludeId);
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/assessments/conflicts/?${params}`);
    const data = await response.json();
    
    return data.results.map((assessment: any) => this.mapToAssessmentEntity(assessment));
  }

  private mapToAssessmentEntity(data: any): Assessment {
    return new Assessment(
      data.id,
      data.scale_id,
      data.patient_id,
      data.administrator_id,
      data.mode,
      data.responses || {},
      data.status,
      data.current_step || 1,
      data.scoring_results,
      data.validity_score,
      data.started_at ? new Date(data.started_at) : new Date(),
      data.completed_at ? new Date(data.completed_at) : undefined,
      data.last_activity_at ? new Date(data.last_activity_at) : new Date(),
      data.metadata || {},
      data.clinic_id,
      data.workspace_id,
      data.session_id,
      data.device_info,
      data.created_at ? new Date(data.created_at) : new Date(),
      data.updated_at ? new Date(data.updated_at) : new Date()
    );
  }

  private mapFromAssessmentEntity(assessment: Assessment): any {
    return {
      id: assessment.id,
      scale_id: assessment.scaleId,
      patient_id: assessment.patientId,
      administrator_id: assessment.administratorId,
      mode: assessment.mode,
      responses: assessment.responses,
      status: assessment.status,
      current_step: assessment.currentStep,
      scoring_results: assessment.scoringResults,
      validity_score: assessment.validityScore,
      started_at: assessment.startedAt?.toISOString(),
      completed_at: assessment.completedAt?.toISOString(),
      last_activity_at: assessment.lastActivityAt?.toISOString(),
      metadata: assessment.metadata,
      clinic_id: assessment.clinicId,
      workspace_id: assessment.workspaceId,
      session_id: assessment.sessionId,
      device_info: assessment.deviceInfo,
      created_at: assessment.createdAt?.toISOString(),
      updated_at: assessment.updatedAt?.toISOString()
    };
  }
}