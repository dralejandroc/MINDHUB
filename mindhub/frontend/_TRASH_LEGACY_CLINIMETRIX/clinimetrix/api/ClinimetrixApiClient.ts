/**
 * Clinimetrix API Client
 * Interface for communicating with the Clinimetrix backend
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ClinicalScale,
  AssessmentSession,
  ScaleAdministration,
  ItemResponse,
  AssessmentToken,
  AssessmentReport,
  ApiResponse,
  PaginatedResponse,
  ScaleUsageStats,
  ScaleFilters,
  SessionFilters,
  AssessmentFormData,
  ItemResponseFormData,
  InterpretationResult,
  ScoringResult,
  ScaleCategory,
  AdministrationMode,
  SessionType,
  SessionStatus,
  ReportType,
  ReportFormat
} from '../../../types/clinimetrix';

// =============================================================================
// API CLIENT CONFIGURATION
// =============================================================================

interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ClinimetrixApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1/clinimetrix`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle authentication errors
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from localStorage or context
    return localStorage.getItem('auth_token');
  }

  private handleAuthError(): void {
    // Redirect to login or refresh token
    window.location.href = '/sign-in';
  }

  // =============================================================================
  // CLINICAL SCALES API
  // =============================================================================

  /**
   * Get all clinical scales with filtering and pagination
   */
  async getScales(
    filters: ScaleFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ClinicalScale>> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.category) params.append('category', filters.category);
    if (filters.administrationType) params.append('administrationType', filters.administrationType);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await this.client.get<PaginatedResponse<ClinicalScale>>(
      `/scales?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get specific scale with full configuration
   */
  async getScale(id: string): Promise<ApiResponse<ClinicalScale>> {
    const response = await this.client.get<ApiResponse<ClinicalScale>>(`/scales/${id}`);
    return response.data;
  }

  /**
   * Get scales by category
   */
  async getScalesByCategory(category: ScaleCategory): Promise<ApiResponse<ClinicalScale[]>> {
    const response = await this.client.get<ApiResponse<ClinicalScale[]>>(`/scales/category/${category}`);
    return response.data;
  }

  /**
   * Get interpretation for a specific score
   */
  async getScoreInterpretation(scaleId: string, score: number): Promise<ApiResponse<InterpretationResult>> {
    const response = await this.client.get<ApiResponse<InterpretationResult>>(
      `/scales/${scaleId}/interpretation/${score}`
    );
    return response.data;
  }

  /**
   * Get scale usage statistics
   */
  async getScaleUsageStats(
    startDate?: string,
    endDate?: string,
    category?: ScaleCategory
  ): Promise<ApiResponse<ScaleUsageStats>> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (category) params.append('category', category);

    const response = await this.client.get<ApiResponse<ScaleUsageStats>>(
      `/scales/stats/usage?${params.toString()}`
    );
    
    return response.data;
  }

  // =============================================================================
  // ASSESSMENT SESSIONS API
  // =============================================================================

  /**
   * Create new assessment session
   */
  async createAssessmentSession(data: AssessmentFormData): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.post<ApiResponse<AssessmentSession>>('/assessments', data);
    return response.data;
  }

  /**
   * Get assessment sessions with filtering
   */
  async getAssessmentSessions(
    filters: SessionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<AssessmentSession>> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.sessionType) params.append('sessionType', filters.sessionType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.administeredBy) params.append('administeredBy', filters.administeredBy);

    const response = await this.client.get<PaginatedResponse<AssessmentSession>>(
      `/assessments?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get specific assessment session
   */
  async getAssessmentSession(id: string): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.get<ApiResponse<AssessmentSession>>(`/assessments/${id}`);
    return response.data;
  }

  /**
   * Update assessment session
   */
  async updateAssessmentSession(
    id: string,
    data: Partial<AssessmentSession>
  ): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.patch<ApiResponse<AssessmentSession>>(`/assessments/${id}`, data);
    return response.data;
  }

  /**
   * Complete assessment session
   */
  async completeAssessmentSession(
    id: string,
    notes?: string
  ): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.post<ApiResponse<AssessmentSession>>(
      `/assessments/${id}/complete`,
      { notes }
    );
    return response.data;
  }

  /**
   * Cancel assessment session
   */
  async cancelAssessmentSession(
    id: string,
    reason?: string
  ): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.post<ApiResponse<AssessmentSession>>(
      `/assessments/${id}/cancel`,
      { reason }
    );
    return response.data;
  }

  // =============================================================================
  // SCALE ADMINISTRATION API
  // =============================================================================

  /**
   * Start scale administration
   */
  async startScaleAdministration(
    sessionId: string,
    scaleId: string
  ): Promise<ApiResponse<ScaleAdministration>> {
    const response = await this.client.post<ApiResponse<ScaleAdministration>>(
      `/administrations/start`,
      { sessionId, scaleId }
    );
    return response.data;
  }

  /**
   * Get scale administration
   */
  async getScaleAdministration(id: string): Promise<ApiResponse<ScaleAdministration>> {
    const response = await this.client.get<ApiResponse<ScaleAdministration>>(`/administrations/${id}`);
    return response.data;
  }

  /**
   * Update scale administration
   */
  async updateScaleAdministration(
    id: string,
    data: Partial<ScaleAdministration>
  ): Promise<ApiResponse<ScaleAdministration>> {
    const response = await this.client.patch<ApiResponse<ScaleAdministration>>(`/administrations/${id}`, data);
    return response.data;
  }

  /**
   * Submit item response
   */
  async submitItemResponse(
    administrationId: string,
    response: ItemResponseFormData
  ): Promise<ApiResponse<ItemResponse>> {
    const response_data = await this.client.post<ApiResponse<ItemResponse>>(
      `/administrations/${administrationId}/responses`,
      response
    );
    return response_data.data;
  }

  /**
   * Get item responses for administration
   */
  async getItemResponses(administrationId: string): Promise<ApiResponse<ItemResponse[]>> {
    const response = await this.client.get<ApiResponse<ItemResponse[]>>(
      `/administrations/${administrationId}/responses`
    );
    return response.data;
  }

  /**
   * Complete scale administration
   */
  async completeScaleAdministration(
    id: string,
    notes?: string
  ): Promise<ApiResponse<ScaleAdministration>> {
    const response = await this.client.post<ApiResponse<ScaleAdministration>>(
      `/administrations/${id}/complete`,
      { notes }
    );
    return response.data;
  }

  /**
   * Calculate administration score
   */
  async calculateScore(administrationId: string): Promise<ApiResponse<ScoringResult>> {
    const response = await this.client.post<ApiResponse<ScoringResult>>(
      `/administrations/${administrationId}/score`
    );
    return response.data;
  }

  // =============================================================================
  // ASSESSMENT TOKENS API
  // =============================================================================

  /**
   * Create assessment token for remote administration
   */
  async createAssessmentToken(
    sessionId: string,
    options: {
      expiresIn?: number;
      maxUses?: number;
      requiresAuthentication?: boolean;
      patientVerificationRequired?: boolean;
    } = {}
  ): Promise<ApiResponse<AssessmentToken>> {
    const response = await this.client.post<ApiResponse<AssessmentToken>>('/tokens', {
      sessionId,
      ...options
    });
    return response.data;
  }

  /**
   * Get assessment token
   */
  async getAssessmentToken(id: string): Promise<ApiResponse<AssessmentToken>> {
    const response = await this.client.get<ApiResponse<AssessmentToken>>(`/tokens/${id}`);
    return response.data;
  }

  /**
   * Validate assessment token
   */
  async validateAssessmentToken(token: string): Promise<ApiResponse<AssessmentSession>> {
    const response = await this.client.post<ApiResponse<AssessmentSession>>('/tokens/validate', {
      token
    });
    return response.data;
  }

  /**
   * Revoke assessment token
   */
  async revokeAssessmentToken(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.post<ApiResponse<void>>(`/tokens/${id}/revoke`);
    return response.data;
  }

  // =============================================================================
  // REPORTS API
  // =============================================================================

  /**
   * Generate assessment report
   */
  async generateReport(
    sessionId: string,
    reportType: ReportType,
    format: ReportFormat = ReportFormat.PDF
  ): Promise<ApiResponse<AssessmentReport>> {
    const response = await this.client.post<ApiResponse<AssessmentReport>>('/reports', {
      sessionId,
      reportType,
      format
    });
    return response.data;
  }

  /**
   * Get assessment report
   */
  async getReport(id: string): Promise<ApiResponse<AssessmentReport>> {
    const response = await this.client.get<ApiResponse<AssessmentReport>>(`/reports/${id}`);
    return response.data;
  }

  /**
   * Download report file
   */
  async downloadReport(id: string): Promise<Blob> {
    const response = await this.client.get(`/reports/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get reports for session
   */
  async getReportsForSession(sessionId: string): Promise<ApiResponse<AssessmentReport[]>> {
    const response = await this.client.get<ApiResponse<AssessmentReport[]>>(`/reports/session/${sessionId}`);
    return response.data;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.client.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
    return response.data;
  }

  /**
   * Upload file (for assessments that require file uploads)
   */
  async uploadFile(file: File, type: string = 'assessment'): Promise<ApiResponse<{ url: string; fileId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.client.post<ApiResponse<{ url: string; fileId: string }>>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  /**
   * Get user's assessment history
   */
  async getUserAssessmentHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<AssessmentSession>> {
    const response = await this.client.get<PaginatedResponse<AssessmentSession>>(
      `/users/${userId}/assessments?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Search assessments
   */
  async searchAssessments(
    query: string,
    filters: SessionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<AssessmentSession>> {
    const params = new URLSearchParams();
    
    params.append('q', query);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.sessionType) params.append('sessionType', filters.sessionType);

    const response = await this.client.get<PaginatedResponse<AssessmentSession>>(
      `/search?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Export assessment data
   */
  async exportAssessmentData(
    sessionId: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<Blob> {
    const response = await this.client.get(`/assessments/${sessionId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(
    startDate?: string,
    endDate?: string,
    patientId?: string
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (patientId) params.append('patientId', patientId);

    const response = await this.client.get<ApiResponse<any>>(
      `/analytics?${params.toString()}`
    );
    
    return response.data;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Create default instance
let defaultClient: ClinimetrixApiClient | null = null;

export function createClinimetrixApiClient(config: ApiClientConfig): ClinimetrixApiClient {
  const client = new ClinimetrixApiClient(config);
  
  // Set as default if none exists
  if (!defaultClient) {
    defaultClient = client;
  }
  
  return client;
}

export function getClinimetrixApiClient(): ClinimetrixApiClient {
  if (!defaultClient) {
    throw new Error('Clinimetrix API client not initialized. Call createClinimetrixApiClient() first.');
  }
  return defaultClient;
}

// =============================================================================
// REACT HOOKS INTEGRATION
// =============================================================================

export interface ApiClientContextType {
  client: ClinimetrixApiClient;
  isConnected: boolean;
  lastError: Error | null;
}

// This will be used by React hooks - import React in the component that uses this

// Re-export for convenience
export { type ClinicalScale, type AssessmentSession, type ScaleAdministration };