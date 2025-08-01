/**
 * API Client para Clinimetrix - Sistema de Escalas Psicométricas
 * Conecta con el backend real en puerto 8080
 */

import { apiRequest } from './api-config';
import { mockClinimetrixApi } from './clinimetrix-mock';

// NO USAR DATOS MOCK - Conectar con backend real
const USE_MOCK_DATA = false;

// Types
export interface Scale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  version?: string;
  category: string;
  subcategory?: string;
  totalItems: number; // Updated to match API response
  estimatedDurationMinutes: number; // Updated to match API response
  administrationMode: 'self_administered' | 'clinician_administered' | 'both'; // Updated to match API response
  targetPopulation: string; // Updated to match API response
  scoringMethod?: string; // Updated to match API response
  isActive: boolean; // Updated to match API response
  scoreRange?: { min: number; max: number }; // Updated to match API response
  tags?: string[]; // JSON array of tags
  is_favorite?: boolean; // Para el usuario actual
  created_at?: string;
  updated_at?: string;
  
  // Additional fields from new API
  responseOptionsCount?: number;
  hasInterpretationRules?: boolean;
  hasSubscales?: boolean;
  system?: string;
}

export interface ScaleDocumentation {
  id: string;
  scale_id: string;
  bibliography: string;
  sources_consulted: string; // JSON
  implementation_notes: string;
  psychometric_properties: string; // JSON
  clinical_considerations: string;
  special_items_notes: string; // JSON
  version_notes: string;
  target_population_details: string;
  clinical_interpretation: string;
}

export interface ScaleItem {
  id: string;
  scale_id: string;
  number: number;
  text: string;
  question_type: string;
  reverse_scored: boolean;
  alert_trigger: boolean;
  alert_condition: string;
  help_text: string;
  required: boolean;
  metadata: string; // JSON
}

export interface ResponseOption {
  id: string;
  scale_id: string;
  value: string;
  label: string;
  score: number;
  order_index: number;
  option_type: string;
  metadata: string; // JSON
}

export interface InterpretationRule {
  id: string;
  scale_id: string;
  min_score: number;
  max_score: number;
  severity_level: string;
  label: string;
  color: string;
  description: string;
  recommendations: string;
}

export interface Assessment {
  id: string;
  patient_id: string;
  scale_id: string;
  status: 'created' | 'in_progress' | 'completed' | 'cancelled';
  administration_mode: string;
  assessment_type: string;
  started_at?: string;
  completed_at?: string;
  total_score?: number;
  interpretation?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  total_score: number;
  subscale_scores: { [key: string]: number };
  interpretation: InterpretationRule;
  raw_responses: { [key: string]: any };
  calculated_at: string;
}

export interface ScaleStats {
  total_scales: number;
  total_assessments: number;
  total_reports: number;
  most_used_scales: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  assessments_by_category: { [category: string]: number };
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface FilterOptions {
  category?: string;
  administration_mode?: string;
  target_population?: string;
  search?: string;
  tags?: string[];
  favorites_only?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Cliente API para Clinimetrix
 */
class ClinimetrixApiClient {
  private baseUrl = 'http://localhost:8080/api';

  // =================== ESCALAS ===================

  /**
   * Obtener todas las escalas con filtros opcionales
   */
  async getScales(filters: FilterOptions = {}): Promise<Scale[]> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.getScales(filters);
    }

    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.administration_mode) params.append('administrationMode', filters.administration_mode);
    if (filters.target_population) params.append('targetPopulation', filters.target_population);
    if (filters.search) params.append('search', filters.search);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.favorites_only) params.append('favoritesOnly', 'true');
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const url = `${this.baseUrl}/scales${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest(url);
    return response.data || response; // Handle new API response format
  }

  /**
   * Obtener detalles de una escala específica
   */
  async getScale(scaleId: string): Promise<Scale> {
    const response = await apiRequest(`${this.baseUrl}/scales/${scaleId}`);
    return response.data || response; // Handle new API response format
  }

  /**
   * Obtener documentación científica de una escala
   */
  async getScaleDocumentation(scaleId: string): Promise<ScaleDocumentation> {
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/documentation`);
  }

  /**
   * Obtener ítems de una escala
   */
  async getScaleItems(scaleId: string): Promise<ScaleItem[]> {
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/items`);
  }

  /**
   * Obtener opciones de respuesta de una escala
   */
  async getScaleResponseOptions(scaleId: string): Promise<ResponseOption[]> {
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/response-options`);
  }

  /**
   * Obtener reglas de interpretación de una escala
   */
  async getScaleInterpretationRules(scaleId: string): Promise<InterpretationRule[]> {
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/interpretation-rules`);
  }

  /**
   * Obtener categorías disponibles
   */
  async getScaleCategories(): Promise<string[]> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.getScaleCategories();
    }
    return await apiRequest(`${this.baseUrl}/scales/categories`);
  }

  /**
   * Obtener todos los tags disponibles
   */
  async getScaleTags(): Promise<string[]> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.getScaleTags();
    }
    return await apiRequest(`${this.baseUrl}/scales/tags`);
  }

  /**
   * Obtener escalas favoritas del usuario
   */
  async getFavoriteScales(userId: string = 'current'): Promise<Scale[]> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.getFavoriteScales();
    }
    return await apiRequest(`${this.baseUrl}/scales/favorites?userId=${userId}`);
  }

  /**
   * Agregar escala a favoritos
   */
  async addScaleToFavorites(scaleId: string, userId: string = 'current'): Promise<void> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.addScaleToFavorites(scaleId);
    }
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * Remover escala de favoritos
   */
  async removeScaleFromFavorites(scaleId: string, userId: string = 'current'): Promise<void> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.removeScaleFromFavorites(scaleId);
    }
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/favorite`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * Interpretar puntuación de una escala
   */
  async interpretScore(scaleId: string, score: number): Promise<InterpretationRule> {
    return await apiRequest(`${this.baseUrl}/scales/${scaleId}/interpretation/${score}`);
  }

  // =================== EVALUACIONES ===================

  /**
   * Crear nueva evaluación
   */
  async createAssessment(data: {
    patient_id: string;
    scale_id: string;
    administration_mode: string;
    assessment_type?: string;
  }): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obtener evaluaciones con filtros
   */
  async getAssessments(filters: {
    patient_id?: string;
    scale_id?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<Assessment[]> {
    const params = new URLSearchParams();
    
    if (filters.patient_id) params.append('patientId', filters.patient_id);
    if (filters.scale_id) params.append('scaleId', filters.scale_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const url = `${this.baseUrl}/assessments${params.toString() ? '?' + params.toString() : ''}`;
    return await apiRequest(url);
  }

  /**
   * Obtener evaluación específica
   */
  async getAssessment(assessmentId: string): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}`);
  }

  /**
   * Iniciar evaluación
   */
  async startAssessment(assessmentId: string): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}/start`, {
      method: 'POST'
    });
  }

  /**
   * Enviar respuestas de evaluación
   */
  async submitAssessmentResponses(assessmentId: string, responses: { [itemId: string]: any }): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ responses })
    });
  }

  /**
   * Completar evaluación
   */
  async completeAssessment(assessmentId: string): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}/complete`, {
      method: 'POST'
    });
  }

  /**
   * Obtener resultados de evaluación
   */
  async getAssessmentResults(assessmentId: string): Promise<AssessmentResult> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}/results`);
  }

  /**
   * Cancelar evaluación
   */
  async cancelAssessment(assessmentId: string): Promise<Assessment> {
    return await apiRequest(`${this.baseUrl}/assessments/${assessmentId}/cancel`, {
      method: 'PUT'
    });
  }

  /**
   * Obtener evaluaciones de un paciente
   */
  async getPatientAssessments(patientId: string): Promise<Assessment[]> {
    return await apiRequest(`${this.baseUrl}/assessments/patients/${patientId}`);
  }

  // =================== ESTADÍSTICAS ===================

  /**
   * Obtener estadísticas generales de escalas
   */
  async getScaleStats(): Promise<ScaleStats> {
    if (USE_MOCK_DATA) {
      return await mockClinimetrixApi.getScaleStats();
    }
    return await apiRequest(`${this.baseUrl}/scales/stats`);
  }

  /**
   * Obtener escalas más utilizadas
   */
  async getMostUsedScales(limit: number = 10): Promise<Array<{ name: string; count: number; percentage: number }>> {
    const stats = await this.getScaleStats();
    return stats.most_used_scales?.slice(0, limit) || [];
  }

  /**
   * Obtener información de ayuda para una escala
   */
  async getScaleHelpInfo(scaleId: string): Promise<{
    purpose: string;
    scoring: {
      ranges: Array<{
        range: string;
        severity: string;
        color: string;
        description?: string;
      }>;
    };
    administration: {
      duration: string;
      instructions: string;
    };
    interpretation: {
      notes: string[];
      warnings: string[];
    };
  }> {
    // Obtener documentación y reglas de interpretación
    const [documentation, interpretationRules] = await Promise.all([
      this.getScaleDocumentation(scaleId),
      this.getScaleInterpretationRules(scaleId)
    ]);

    // Parsear propiedades psicométricas
    let psychometricProps = {};
    try {
      psychometricProps = JSON.parse(documentation.psychometric_properties || '{}');
    } catch (e) {
      console.warn('Error parsing psychometric properties:', e);
    }

    // Construir información de ayuda
    return {
      purpose: documentation.clinical_considerations || 'Evaluación psicométrica especializada',
      scoring: {
        ranges: interpretationRules.map(rule => ({
          range: `${rule.min_score}-${rule.max_score}`,
          severity: rule.label,
          color: rule.color,
          description: rule.description
        }))
      },
      administration: {
        duration: `${documentation.target_population_details || 'Variable'}`,
        instructions: documentation.implementation_notes || 'Seguir instrucciones estándar'
      },
      interpretation: {
        notes: [documentation.clinical_interpretation || 'Consultar documentación clínica'],
        warnings: documentation.special_items_notes ? 
          [JSON.parse(documentation.special_items_notes).reverseItemsNote || 'Verificar ítems especiales'] : 
          []
      }
    };
  }
}

// API client singleton
export const clinimetrixApi = new ClinimetrixApiClient();
export default clinimetrixApi;