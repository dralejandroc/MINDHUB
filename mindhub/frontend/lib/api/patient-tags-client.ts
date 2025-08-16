/**
 * Patient Tags API Client
 * Handles all operations related to patient tags and categorization
 */
import { API_CONFIG } from '@/lib/config/api-endpoints';

const API_BASE_URL = API_CONFIG.BACKEND_URL;

export interface PatientTag {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  category: string;
  icon?: string;
  description?: string;
  isSystemTag?: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagCategory {
  name: string;
  tags: PatientTag[];
}

export interface TagCategories {
  [key: string]: TagCategory;
}

class PatientTagsApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/expedix`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Patient Tags API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Get all available tag categories and tags
   */
  async getTagCategories(): Promise<{ data: { categories: TagCategories; defaultCategories: string[]; customCategories: string[] } }> {
    return this.makeRequest<{ data: { categories: TagCategories; defaultCategories: string[]; customCategories: string[] } }>('/patient-tags/categories');
  }

  /**
   * Get all patient tags
   */
  async getAllTags(): Promise<{ data: PatientTag[] }> {
    // For now, we'll extract all tags from categories
    try {
      const categoriesResponse = await this.getTagCategories();
      const allTags: PatientTag[] = [];
      
      Object.values(categoriesResponse.data.categories).forEach(category => {
        category.tags.forEach(tag => {
          allTags.push(tag);
        });
      });

      return { data: allTags };
    } catch (error) {
      console.error('Error getting all tags:', error);
      return { data: [] };
    }
  }

  /**
   * Create a new custom patient tag
   */
  async createCustomTag(tagData: {
    name: string;
    category: string;
    color: string;
    textColor: string;
    icon?: string;
    description?: string;
  }): Promise<{ data: PatientTag }> {
    return this.makeRequest<{ data: PatientTag }>('/patient-tags/create-custom', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  }

  /**
   * Get tags assigned to a specific patient
   */
  async getPatientTags(patientId: string): Promise<{ data: { patient: any; tags: PatientTag[]; tagsByCategory: { [key: string]: PatientTag[] }; totalTags: number } }> {
    return this.makeRequest<{ data: { patient: any; tags: PatientTag[]; tagsByCategory: { [key: string]: PatientTag[] }; totalTags: number } }>(`/patient-tags/patient/${patientId}`);
  }

  /**
   * Update tags for a patient
   */
  async updatePatientTags(patientId: string, tags: Array<{ tagId?: string; predefinedTag?: any }>, reason?: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/patient-tags/patient/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify({ tags, reason }),
    });
  }

  /**
   * Remove a tag from a patient
   */
  async removePatientTag(patientId: string, tagId: string, reason?: string): Promise<{ data: any }> {
    return this.makeRequest<{ data: any }>(`/patient-tags/patient/${patientId}/tag/${tagId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Search patients by tags
   */
  async searchPatientsByTags(params: {
    tags?: string[];
    operator?: 'AND' | 'OR';
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: { patients: any[]; pagination: any; searchCriteria: any } }> {
    const queryParams = new URLSearchParams();
    
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    if (params.operator) queryParams.append('operator', params.operator);
    if (params.category) queryParams.append('category', params.category);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.makeRequest<{ data: { patients: any[]; pagination: any; searchCriteria: any } }>(`/patient-tags/search?${queryParams}`);
  }

  /**
   * Get default tags for system initialization
   */
  getDefaultTags(): PatientTag[] {
    return [
      // Status tags
      {
        id: 'status-active',
        name: 'Activo',
        color: '#4CAF50',
        textColor: '#FFFFFF',
        category: 'status',
        icon: '✅',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'status-inactive',
        name: 'Inactivo',
        color: '#9E9E9E',
        textColor: '#FFFFFF',
        category: 'status',
        icon: '⏸️',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'status-treatment',
        name: 'En Tratamiento',
        color: '#2196F3',
        textColor: '#FFFFFF',
        category: 'status',
        icon: '💊',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Priority tags
      {
        id: 'priority-urgent',
        name: 'Urgente',
        color: '#FF4444',
        textColor: '#FFFFFF',
        category: 'priority',
        icon: '⚠️',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'priority-high',
        name: 'Alta',
        color: '#FF8800',
        textColor: '#FFFFFF',
        category: 'priority',
        icon: '🔴',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'priority-normal',
        name: 'Normal',
        color: '#4CAF50',
        textColor: '#FFFFFF',
        category: 'priority',
        icon: '🟢',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Age group tags
      {
        id: 'age-child',
        name: 'Infantil',
        color: '#FFB74D',
        textColor: '#000000',
        category: 'age_group',
        icon: '👶',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'age-adolescent',
        name: 'Adolescente',
        color: '#81C784',
        textColor: '#000000',
        category: 'age_group',
        icon: '🧒',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'age-adult',
        name: 'Adulto',
        color: '#64B5F6',
        textColor: '#000000',
        category: 'age_group',
        icon: '👤',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'age-senior',
        name: 'Adulto Mayor',
        color: '#A1887F',
        textColor: '#FFFFFF',
        category: 'age_group',
        icon: '👴',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Risk level tags
      {
        id: 'risk-low',
        name: 'Bajo Riesgo',
        color: '#C8E6C9',
        textColor: '#2E7D32',
        category: 'risk',
        icon: '🟢',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'risk-moderate',
        name: 'Riesgo Moderado',
        color: '#FFF3E0',
        textColor: '#E65100',
        category: 'risk',
        icon: '🟡',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'risk-high',
        name: 'Alto Riesgo',
        color: '#FFCDD2',
        textColor: '#C62828',
        category: 'risk',
        icon: '🔴',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'risk-critical',
        name: 'Riesgo Crítico',
        color: '#D32F2F',
        textColor: '#FFFFFF',
        category: 'risk',
        icon: '🚨',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Condition tags
      {
        id: 'condition-depression',
        name: 'Depresión',
        color: '#9C27B0',
        textColor: '#FFFFFF',
        category: 'condition',
        icon: '🧠',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'condition-anxiety',
        name: 'Ansiedad',
        color: '#FF9800',
        textColor: '#FFFFFF',
        category: 'condition',
        icon: '😰',
        isSystemTag: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const patientTagsApi = new PatientTagsApiClient();

// Named exports for convenience
export { PatientTagsApiClient };