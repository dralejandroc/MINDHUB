/**
 * ClinimetrixPro API Client
 * 
 * TypeScript client for interacting with the ClinimetrixPro backend APIs.
 * Provides type-safe methods for template management and assessment operations.
 */

// Note: Authentication is handled by Next.js middleware for API routes

// ClinimetrixPro uses Django backend
const API_BASE_URL = 'https://mindhub-django-backend.vercel.app';
const CLINIMETRIX_PRO_BASE = `${API_BASE_URL}/clinimetrix-pro`;

// TypeScript interfaces for ClinimetrixPro entities

export interface ClinimetrixTemplate {
  id: string;
  templateData: TemplateData;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateData {
  metadata: {
    id: string;
    name: string;
    abbreviation: string;
    version: string;
    authors: string[];
    year: number;
    language: string;
    description: string;
    keywords: string[];
    category: string;
    targetPopulation: string;
    administrationTime: string;
    professionalLevel: string[];
  };
  structure: {
    totalItems: number;
    sections?: TemplateSection[];
    responseFormat: string;
    scoringMethod: string;
    hasSubscales: boolean;
    subscaleCount: number;
  };
  items: TemplateItem[];
  responseOptions: ResponseOption[];
  subscales?: Subscale[];
  scoring: {
    scoreRange: {
      min: number;
      max: number;
    };
    subscaleRanges?: Record<string, { min: number; max: number }>;
    reverseScored?: number[];
    calculation: string;
  };
  interpretation: {
    rules: InterpretationRule[];
    severityLevels: string[];
    subscaleInterpretations?: Record<string, InterpretationRule[]>;
  };
  validity: {
    indicators: string[];
    cutoffScores?: Record<string, number>;
    warnings: string[];
  };
  documentation: {
    psychometricProperties: {
      reliability: Record<string, number>;
      validity: Record<string, number>;
      norms: Record<string, any>;
    };
    references: string[];
    instructions: {
      administrator: string;
      participant: string;
    };
    clinicalNotes: string[];
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  itemRange: {
    start: number;
    end: number;
  };
}

export interface TemplateItem {
  number: number;
  text: string;
  instruction?: string;
  responseType: string;
  options?: ResponseOption[];
  subscale?: string;
  reversed?: boolean;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ResponseOption {
  value: number;
  label: string;
  score: number;
}

export interface Subscale {
  id: string;
  name: string;
  description: string;
  items: number[];
  scoreRange: {
    min: number;
    max: number;
  };
}

export interface InterpretationRule {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  severity: string;
  color: string;
  description: string;
  clinicalSignificance: string;
  recommendations: string[];
}

export interface ClinimetrixRegistry {
  id: string;
  templateId: string;
  name: string;
  abbreviation: string;
  description: string;
  category: string;
  targetPopulation: string;
  administrationTime: string;
  professionalLevel: string[];
  keywords: string[];
  authors: string[];
  year: number;
  language: string;
  version: string;
  isFeatured: boolean;
  isPublic: boolean;
  isActive: boolean;
  difficulty: string;
  popularity: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  // Campos adicionales de la respuesta del backend
  totalItems?: number;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  estimatedDurationMinutes?: number;
}

export interface ClinimetrixAssessment {
  id: string;
  templateId: string;
  patientId: string;
  administratorId: string;
  mode: 'professional' | 'self_administered' | 'remote';
  status: 'in_progress' | 'completed' | 'incomplete';
  responses: Record<string, any>;
  responsesJson?: string;
  scoringResults?: ScoringResults;
  totalScore?: number;
  severityLevel?: string;
  interpretation?: string;
  subscaleScores?: Record<string, any>;
  validityIndicators?: ValidityIndicators;
  currentStep?: number;
  completionTimeSeconds?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  template?: ClinimetrixTemplate;
}

// Legacy type alias for compatibility
export interface ClinimetrixProTemplateStructure extends TemplateData {}

export interface ScoringResults {
  totalScore: number;
  scoreRange: {
    min: number;
    max: number;
  };
  severityLevel: string;
  completionPercentage: number;
  subscaleScores: Record<string, SubscaleScore>;
  interpretation: {
    rule: InterpretationRule;
    clinicalInterpretation: string;
    clinicalSignificance: string;
    professionalRecommendations: {
      immediate: string[];
      followUp: string[];
      treatment: string[];
    };
    interpretationConfidence: {
      level: string;
      factors: string[];
      limitations: string[];
    };
  };
  validityIndicators: ValidityIndicators;
  percentileScore?: number;
  tScore?: number;
  zScore?: number;
  completionTime?: {
    totalTimeMs: number;
    averageTimePerItem: number;
  };
  analysisTimestamp: string;
  templateId: string;
  templateVersion: string;
}

export interface SubscaleScore {
  name: string;
  score: number;
  scoreRange: {
    min: number;
    max: number;
  };
  completionPercentage: number;
  interpretation?: string;
  severity?: string;
}

export interface ValidityIndicators {
  overallValidityScore: number;
  validityLevel: string;
  validityCategory: string;
  responsePatterns: {
    statistics: {
      mean: number;
      standardDeviation: number;
      variance: number;
      coefficientOfVariation: number;
      uniqueValueRatio: number;
    };
    patterns: {
      constantResponse: boolean;
      lowVariability: boolean;
      highVariability: boolean;
      zigzagPattern: boolean;
      straightLinePattern: boolean;
      extremeResponseBias: boolean;
    };
    validityScore: number;
    flags: string[];
  };
  timingAnalysis?: {
    available: boolean;
    statistics?: {
      averageTime: number;
      medianTime: number;
      minimumTime: number;
      maximumTime: number;
      timeRange: number;
      totalItems: number;
    };
    flags?: {
      tooFast: number;
      tooSlow: number;
      inconsistentTiming: boolean;
      suspiciousSpeed: boolean;
    };
    validityScore?: number;
  };
  completionAnalysis: {
    completionRate: number;
    completedItems: number;
    totalItems: number;
    pattern: {
      sequential: boolean;
      hasGaps: boolean;
      gapCount: number;
      largestGap: number;
      prematureTermination: boolean;
    };
    validityScore: number;
    adequateCompletion: boolean;
  };
  warnings: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export interface CreateAssessmentRequest {
  templateId: string;
  patientId: string;
  administratorId: string;
  mode?: 'professional' | 'self_administered' | 'remote';
}

export interface UpdateResponsesRequest {
  responses: Record<string, any>;
  currentStep?: number;
}

export interface CompleteAssessmentRequest {
  responses: Record<string, any>;
  demographics?: {
    age?: number;
    gender?: string;
    education?: string;
    [key: string]: any;
  };
}

export interface CalculateScoresRequest {
  templateId: string;
  responses: Record<string, any>;
  demographics?: {
    age?: number;
    gender?: string;
    education?: string;
    [key: string]: any;
  };
}

// API Client Class
export class ClinimetrixProClient {
  private baseUrl: string;

  constructor(baseUrl: string = CLINIMETRIX_PRO_BASE) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Get Auth token for Railway authentication
    let supabaseToken: string | null = null;
    if (typeof window !== 'undefined' && (window as any).Auth) {
      try {
        // Get token using the mindhub-backend template
        supabaseToken = await (window as any).Auth.session?.getToken({ template: 'mindhub-backend' });
      } catch (error) {
        console.warn('Could not get Auth token:', error);
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
      credentials: 'include', // Include cookies as fallback
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // Template Management Methods

  /**
   * Get all templates from the public catalog
   */
  async getTemplateCatalog(): Promise<ClinimetrixRegistry[]> {
    return this.makeRequest<ClinimetrixRegistry[]>('/templates/catalog');
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<TemplateData> {
    return this.makeRequest<TemplateData>(`/templates/${templateId}`);
  }

  /**
   * Get template metadata by ID
   */
  async getTemplateMetadata(templateId: string): Promise<ClinimetrixRegistry> {
    return this.makeRequest<ClinimetrixRegistry>(`/templates/${templateId}/metadata`);
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string): Promise<ClinimetrixRegistry[]> {
    return this.makeRequest<ClinimetrixRegistry[]>(`/templates/search/${encodeURIComponent(query)}`);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<ClinimetrixRegistry[]> {
    return this.makeRequest<ClinimetrixRegistry[]>(`/templates/category/${encodeURIComponent(category)}`);
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    return this.makeRequest<Array<{ category: string; count: number }>>('/templates/meta/categories');
  }

  // Assessment Management Methods

  /**
   * Create a new assessment
   */
  async createAssessment(request: CreateAssessmentRequest): Promise<ClinimetrixAssessment> {
    return this.makeRequest<ClinimetrixAssessment>('/assessments/new', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(assessmentId: string): Promise<ClinimetrixAssessment> {
    return this.makeRequest<ClinimetrixAssessment>(`/assessments/${assessmentId}`);
  }

  /**
   * Update assessment responses
   */
  async updateResponses(assessmentId: string, request: UpdateResponsesRequest): Promise<ClinimetrixAssessment> {
    return this.makeRequest<ClinimetrixAssessment>(`/assessments/${assessmentId}/responses`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update assessment responses (alternative method name for compatibility)
   */
  async updateAssessmentResponses(assessmentId: string, responses: Record<string, any>): Promise<ClinimetrixAssessment> {
    return this.updateResponses(assessmentId, { responses });
  }

  /**
   * Complete assessment with automatic scoring
   */
  async completeAssessment(assessmentId: string, request: CompleteAssessmentRequest): Promise<{
    success: boolean;
    assessment: ClinimetrixAssessment;
    results: ScoringResults;
  }> {
    return this.makeRequest<{
      success: boolean;
      assessment: ClinimetrixAssessment;
      results: ScoringResults;
    }>(`/assessments/${assessmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Calculate scores for current responses (real-time scoring)
   */
  async calculateScores(request: CalculateScoresRequest): Promise<{
    success: boolean;
    results: ScoringResults;
  }> {
    return this.makeRequest<{
      success: boolean;
      results: ScoringResults;
    }>('/assessments/calculate-scores', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get recent assessments
   */
  async getRecentAssessments(limit?: number): Promise<ClinimetrixAssessment[]> {
    const endpoint = limit ? `/assessments/recent/${limit}` : '/assessments/recent';
    return this.makeRequest<ClinimetrixAssessment[]>(endpoint);
  }

  /**
   * Get assessments by patient ID
   */
  async getPatientAssessments(patientId: string): Promise<ClinimetrixAssessment[]> {
    return this.makeRequest<ClinimetrixAssessment[]>(`/assessments/patient/${patientId}`);
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(assessmentId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  }

}

// Default client instance
export const clinimetrixProClient = new ClinimetrixProClient();

// Add legacy-compatible templates object for backward compatibility
(clinimetrixProClient as any).templates = {
  getCatalog: () => clinimetrixProClient.getTemplateCatalog(),
  getById: (id: string) => clinimetrixProClient.getTemplate(id),
  getMetadata: (id: string) => clinimetrixProClient.getTemplateMetadata(id),
  search: (query: string) => clinimetrixProClient.searchTemplates(query),
  getByCategory: (category: string) => clinimetrixProClient.getTemplatesByCategory(category),
  getCategories: () => clinimetrixProClient.getCategories()
};

// Export utility functions

/**
 * Get severity color based on severity level
 */
export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    'minimal': '#10B981', // green
    'mild': '#F59E0B',    // yellow
    'moderate': '#F97316', // orange
    'severe': '#EF4444',   // red
    'very_severe': '#DC2626', // dark red
  };
  
  return colorMap[severity.toLowerCase()] || '#6B7280'; // gray as default
}

/**
 * Format score for display
 */
export function formatScore(score: number, range: { min: number; max: number }): string {
  return `${score}/${range.max}`;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(responses: Record<string, any>, totalItems: number): number {
  const completedItems = Object.keys(responses).length;
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Validate response data
 */
export function validateResponses(responses: Record<string, any>, template: TemplateData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required items
  const requiredItems = template.items.filter(item => item.required);
  for (const item of requiredItems) {
    if (!responses[item.number]) {
      errors.push(`Item ${item.number} is required but not answered`);
    }
  }
  
  // Check response values are valid
  for (const [itemNumber, response] of Object.entries(responses)) {
    const item = template.items.find(i => i.number === parseInt(itemNumber));
    if (!item) {
      errors.push(`Invalid item number: ${itemNumber}`);
      continue;
    }
    
    if (item.validation) {
      const value = response.value;
      if (item.validation.min !== undefined && value < item.validation.min) {
        errors.push(`Item ${itemNumber}: value below minimum (${item.validation.min})`);
      }
      if (item.validation.max !== undefined && value > item.validation.max) {
        errors.push(`Item ${itemNumber}: value above maximum (${item.validation.max})`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}