/**
 * Patient Tags API Client
 * Handles all operations related to patient tags and categorization
 */
import { createApiUrl } from './api-url-builders';

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
  constructor() {
    // No necesitamos baseUrl porque las URLs se construyen dinámicamente
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = createApiUrl(endpoint);
    
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
    return this.makeRequest<{ data: { categories: TagCategories; defaultCategories: string[]; customCategories: string[] } }>('/expedix/patient-tags/categories');
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
    return this.makeRequest<{ data: PatientTag }>('/expedix/patient-tags/create-custom', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  }
}

// Export singleton instance
export const patientTagsApi = new PatientTagsApiClient();

// Named exports for convenience
export { PatientTagsApiClient };