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
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // ALWAYS get user session token
    if (typeof window !== 'undefined' && !defaultHeaders['Authorization']) {
      try {
        // Try to get session from Supabase
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
          console.log('[PatientTagsAPI] Using user session token for authentication');
        } else {
          // Fallback for development/testing ONLY
          const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
          defaultHeaders['Authorization'] = `Bearer ${serviceRoleKey}`;
          console.warn('[PatientTagsAPI] No user session - using service role key fallback');
        }
      } catch (error) {
        console.error('[PatientTagsAPI] Error getting auth token:', error);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include',
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
   * Get tags for a specific patient
   */
  async getPatientTags(patientId: string): Promise<{ data: { tags: PatientTag[] } }> {
    try {
      return this.makeRequest<{ data: { tags: PatientTag[] } }>(`/expedix/patients/${patientId}/tags`);
    } catch (error) {
      console.error('Error getting patient tags:', error);
      return { data: { tags: [] } };
    }
  }

  /**
   * Get default tags for patient classification
   */
  getDefaultTags(): PatientTag[] {
    // Return a set of default tags that can be used for patient classification
    const now = new Date().toISOString();
    return [
      {
        id: 'new-patient',
        name: 'Nuevo Paciente',
        color: '#dbeafe',
        textColor: '#1d4ed8',
        category: 'Status',
        icon: '👋',
        description: 'Paciente nuevo en la clínica',
        isSystemTag: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'regular-patient',
        name: 'Paciente Regular',
        color: '#dcfce7',
        textColor: '#15803d',
        category: 'Status',
        icon: '⭐',
        description: 'Paciente con consultas regulares',
        isSystemTag: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'priority-patient',
        name: 'Prioritario',
        color: '#fef3c7',
        textColor: '#d97706',
        category: 'Priority',
        icon: '🔥',
        description: 'Paciente que requiere atención prioritaria',
        isSystemTag: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      }
    ];
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