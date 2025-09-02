/**
 * ClinimetrixPro ScalesV3 API Client
 * New JSON-based template system client
 */

// API Configuration
const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NODE_ENV === 'production' 
    ? 'https://mindhub.cloud' 
    : 'http://localhost:3000';
    
const CLINIMETRIX_V3_BASE = `${API_BASE_URL}/api/clinimetrix/django`;

// Types for ScalesV3 system
export interface ScaleV3Metadata {
  id: string;
  templateId: string;
  name: string;
  abbreviation: string;
  version: string;
  category: string;
  subcategory?: string;
  description: string;
  authors: string[];
  year: string;
  language: string;
  administrationMode: 'self' | 'interviewer' | 'both';
  estimatedDurationMinutes: number;
  targetPopulation: {
    ageGroups: string[];
    demographics: string;
    clinicalConditions: string[];
  };
  isActive: boolean;
  isFeatured: boolean;
  lastUpdated: string;
}

export interface ScaleV3Template {
  metadata: {
    id: string;
    name: string;
    abbreviation: string;
    version: string;
    category: string;
    description: string;
    authors: string[];
    year: string;
    language: string;
    administrationMode: string;
    estimatedDurationMinutes: number;
    targetPopulation: any;
    helpText?: {
      general: string;
      instructions: {
        professional: string;
        patient: string;
      };
    };
    documentation: any;
    psychometricProperties: any;
    normativeData: any;
    clinicalValidation: any;
    academicInformation: any;
    technicalSpecifications: any;
    usageStatistics: any;
    limitations: any;
  };
  structure: {
    totalItems: number;
    sections: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
      items: Array<{
        number: number;
        id: string;
        text: string;
        responseType: string;
        required: boolean;
        reversed: boolean;
        responseGroup: string;
        metadata?: {
          alertTrigger?: boolean;
          helpText?: string;
        };
      }>;
    }>;
  };
  responseGroups: Record<string, Array<{
    value: number;
    label: string;
    score: number;
  }>>;
  scoring: {
    method: string;
    scoreRange: {
      min: number;
      max: number;
    };
    subscales?: any[];
    specialScoring?: {
      notes: string;
    };
  };
  interpretation: {
    rules: Array<{
      id: string;
      minScore: number;
      maxScore: number;
      label: string;
      severity: string;
      color: string;
      clinicalInterpretation: string;
      professionalRecommendations?: {
        immediate: string;
        treatment: string;
        riskAssessment: string;
      };
    }>;
    clinicalInterpretation?: {
      detailedRules: Array<{
        id: string;
        minScore: number;
        maxScore: number;
        label: string;
        severity: string;
        clinicalInterpretation: string;
        clinicalSignificance: string;
        differentialConsiderations: string;
        professionalRecommendations: {
          immediate: string;
          treatment: string;
          monitoring: string;
          familySupport: string;
          riskAssessment: string;
        };
        prognosticImplications: string;
      }>;
      clinicalGuidelines?: {
        contraindications: string[];
        specialConsiderations: string[];
        warningFlags: Array<{
          condition: string;
          message: string;
          clinicalAction: string;
        }>;
      };
    };
    cutoffPoints?: any;
  };
  qualityAssurance?: any;
}

export interface ScaleV3Assessment {
  id: string;
  templateId: string;
  patientId: string;
  administratorId: string;
  mode: 'professional' | 'self_administered' | 'remote';
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  responses: Record<string, any>;
  scores?: any;
  interpretation?: any;
  subscaleScores?: any;
  validityIndicators?: any;
  metadata: any;
  totalScore?: number;
  severityLevel?: string;
  currentStep?: number;
  completionTimeSeconds?: number;
  completionPercentage?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentRequest {
  templateId: string;
  patientId: string;
  administratorId: string;
  mode?: 'professional' | 'self_administered' | 'remote';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp: string;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// API Client Class
export class ClinimetrixV3Client {
  private baseUrl: string;

  constructor(baseUrl: string = CLINIMETRIX_V3_BASE) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Get Supabase token for authentication
    let supabaseToken: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        supabaseToken = session?.access_token || null;
      } catch (error) {
        console.warn('Could not get Supabase token:', error);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Add Authorization header if we have a token
    if (supabaseToken) {
      headers['Authorization'] = `Bearer ${supabaseToken}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
      ...options,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  // Template Management Methods

  /**
   * Get all available scales from catalog
   */
  async getScaleCatalog(options: {
    category?: string;
    search?: string;
    featured_only?: boolean;
    page?: number;
    per_page?: number;
  } = {}): Promise<ApiResponse<ScaleV3Metadata[]>> {
    const params = new URLSearchParams();
    
    if (options.category) params.append('category', options.category);
    if (options.search) params.append('search', options.search);
    if (options.featured_only) params.append('featured_only', 'true');
    if (options.page) params.append('page', options.page.toString());
    if (options.per_page) params.append('per_page', options.per_page.toString());
    
    const queryString = params.toString();
    const endpoint = `/templates/catalog/${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ApiResponse<ScaleV3Metadata[]>>(endpoint);
  }

  /**
   * Get complete template by ID
   */
  async getTemplate(templateId: string): Promise<ApiResponse<ScaleV3Template>> {
    return this.makeRequest<ApiResponse<ScaleV3Template>>(`/templates/${templateId}/`);
  }

  /**
   * Get template metadata only (lighter)
   */
  async getTemplateMetadata(templateId: string): Promise<ApiResponse<ScaleV3Metadata>> {
    return this.makeRequest<ApiResponse<ScaleV3Metadata>>(`/templates/${templateId}/metadata/`);
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<ApiResponse<Array<{ category: string; count: number }>>> {
    return this.makeRequest<ApiResponse<Array<{ category: string; count: number }>>>('/templates/categories/');
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string): Promise<ApiResponse<ScaleV3Metadata[]>> {
    return this.makeRequest<ApiResponse<ScaleV3Metadata[]>>(`/templates/search/${encodeURIComponent(query)}/`);
  }

  // Assessment Management Methods

  /**
   * Create new assessment
   */
  async createAssessment(request: CreateAssessmentRequest): Promise<ApiResponse<ScaleV3Assessment>> {
    return this.makeRequest<ApiResponse<ScaleV3Assessment>>('/assessments/new/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(assessmentId: string): Promise<ApiResponse<ScaleV3Assessment>> {
    return this.makeRequest<ApiResponse<ScaleV3Assessment>>(`/assessments/${assessmentId}/`);
  }

  /**
   * Update assessment responses
   */
  async updateAssessmentResponses(
    assessmentId: string, 
    responses: Record<string, any>,
    currentStep?: number
  ): Promise<ApiResponse<Partial<ScaleV3Assessment>>> {
    return this.makeRequest<ApiResponse<Partial<ScaleV3Assessment>>>(
      `/assessments/${assessmentId}/responses/`,
      {
        method: 'PUT',
        body: JSON.stringify({
          responses,
          currentStep
        }),
      }
    );
  }

  /**
   * Update assessment (general)
   */
  async updateAssessment(
    assessmentId: string,
    data: Partial<{
      responses: Record<string, any>;
      currentStep: number;
      status: string;
    }>
  ): Promise<ApiResponse<Partial<ScaleV3Assessment>>> {
    return this.makeRequest<ApiResponse<Partial<ScaleV3Assessment>>>(
      `/assessments/${assessmentId}/`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Complete assessment with automatic scoring
   */
  async completeAssessment(
    assessmentId: string,
    data: {
      responses?: Record<string, any>;
      demographics?: Record<string, any>;
    }
  ): Promise<ApiResponse<{
    assessment: ScaleV3Assessment;
    results: any;
  }>> {
    return this.makeRequest<ApiResponse<{
      assessment: ScaleV3Assessment;
      results: any;
    }>>(`/assessments/${assessmentId}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Calculate scores for responses without saving
   */
  async calculateScores(data: {
    templateId: string;
    responses: Record<string, any>;
    demographics?: Record<string, any>;
  }): Promise<ApiResponse<{ results: any }>> {
    return this.makeRequest<ApiResponse<{ results: any }>>('/assessments/calculate-scores/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Default client instance
export const clinimetrixV3Client = new ClinimetrixV3Client();

// Utility functions

/**
 * Get severity color based on severity level
 */
export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    'minimal': '#22c55e',
    'mild': '#eab308',
    'moderate': '#f97316',
    'severe': '#ef4444',
    'very_severe': '#dc2626',
  };
  
  return colorMap[severity.toLowerCase()] || '#6b7280';
}

/**
 * Format score for display
 */
export function formatScoreDisplay(score: number, range: { min: number; max: number }): string {
  return `${score}/${range.max}`;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(responses: Record<string, any>, totalItems: number): number {
  const completedItems = Object.values(responses).filter(v => v !== null && v !== undefined).length;
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Check if assessment is valid for completion
 */
export function isAssessmentComplete(template: ScaleV3Template, responses: Record<string, any>): {
  isComplete: boolean;
  missingRequired: string[];
} {
  const missingRequired: string[] = [];
  
  // Check all required items
  for (const section of template.structure.sections) {
    for (const item of section.items) {
      if (item.required && (!responses[item.id] && responses[item.id] !== 0)) {
        missingRequired.push(`Item ${item.number}: ${item.text.substring(0, 50)}...`);
      }
    }
  }
  
  return {
    isComplete: missingRequired.length === 0,
    missingRequired
  };
}

/**
 * Get help text for an item
 */
export function getItemHelpText(item: any, template: ScaleV3Template): string {
  // Check if item has specific help text
  if (item.metadata?.helpText) {
    return item.metadata.helpText;
  }
  
  // Check template-level help text
  if (template.metadata.helpText?.instructions?.professional) {
    return template.metadata.helpText.instructions.professional;
  }
  
  // Default help based on response type
  const defaultHelp: Record<string, string> = {
    'likert': 'Selecciona la opción que mejor describe tu experiencia o situación.',
    'binary': 'Selecciona Sí o No según corresponda a tu situación.',
    'multiple_choice': 'Selecciona una de las opciones disponibles.',
    'numeric': 'Ingresa un número que represente tu respuesta.',
    'text': 'Escribe tu respuesta de forma libre y detallada.'
  };
  
  return defaultHelp[item.responseType] || 
         'Lee cuidadosamente y responde según tu situación actual.';
}

/**
 * Validate individual response
 */
export function validateResponse(
  item: any, 
  value: any, 
  responseGroups: Record<string, any[]>
): { isValid: boolean; error?: string } {
  // Check if required item has response
  if (item.required && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: 'Esta pregunta es requerida' };
  }
  
  // Check response against valid options
  if (item.responseGroup && responseGroups[item.responseGroup]) {
    const validValues = responseGroups[item.responseGroup].map(opt => opt.value);
    if (!validValues.includes(value)) {
      return { isValid: false, error: 'Respuesta no válida para esta pregunta' };
    }
  }
  
  return { isValid: true };
}