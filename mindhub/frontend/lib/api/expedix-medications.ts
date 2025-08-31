/**
 * Expedix Medications API Client
 * Replaces hardcoded MEDICATIONS_DATABASE with real API calls
 */

/**
 * ⚠️ DEPRECATED - REST API Client
 * 
 * 🚫 DO NOT USE - This file is deprecated in favor of GraphQL-only architecture
 * 
 * ✅ USE INSTEAD: GraphQL queries with Apollo Client (/lib/apollo/)
 * ✅ USE HOOKS: /lib/hooks/useGraphQLServices.ts
 * 
 * This file remains for legacy reference only.
 * All new development should use GraphQL exclusively.
 */

// DEPRECATED FILE - SEE HEADER ABOVE


import { supabase } from '@/lib/supabase/client';

export interface MedicationPresentation {
  form: string;
  concentration: string;
  substance: string;
}

export interface Medication {
  id: number;
  name: string;
  generic_name: string;
  presentations: MedicationPresentation[];
  category: string;
  common_prescriptions: string[];
}

export interface DiagnosisCode {
  code: string;
  description: string;
  category: string;
}

export interface SearchResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  error?: string;
}

class ExpedixMedicationsApi {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8002/api/expedix'
    : '/api/expedix/django';

  private async makeRequest<T>(endpoint: string): Promise<SearchResponse<T>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        data: result.medications || result.diagnoses || result.prescriptions,
        total: result.total,
        error: result.error
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search medications by name or generic name
   */
  async searchMedications(query: string): Promise<SearchResponse<Medication>> {
    if (query.length < 2) {
      return { success: true, data: [], total: 0 };
    }
    
    return this.makeRequest<Medication>(`/medications/search/?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get common prescriptions for medications
   */
  async searchPrescriptions(query: string, medicationName?: string): Promise<SearchResponse<string>> {
    if (query.length < 2 && !medicationName) {
      return { success: true, data: [], total: 0 };
    }
    
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (medicationName) params.append('medication', medicationName);
    
    return this.makeRequest<string>(`/medications/prescriptions/?${params.toString()}`);
  }

  /**
   * Search diagnosis codes (CIE-10)
   */
  async searchDiagnoses(query: string): Promise<SearchResponse<DiagnosisCode>> {
    if (query.length < 2) {
      return { success: true, data: [], total: 0 };
    }
    
    return this.makeRequest<DiagnosisCode>(`/diagnoses/search/?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get diagnosis categories
   */
  async getDiagnosisCategories(): Promise<SearchResponse<string>> {
    return this.makeRequest<string>(`/diagnoses/categories/`);
  }

  /**
   * Convert old medication format to new format
   */
  convertLegacyMedication(legacyMed: any): Medication {
    return {
      id: legacyMed.id,
      name: legacyMed.name,
      generic_name: legacyMed.name,
      presentations: legacyMed.presentations || [
        {
          form: legacyMed.presentation?.split(' ')[0] || 'Tableta',
          concentration: legacyMed.presentation?.split(' ')[1] || '50mg',
          substance: legacyMed.substance || legacyMed.name
        }
      ],
      category: 'Medicamento',
      common_prescriptions: legacyMed.prescriptions || [legacyMed.prescription || '']
    };
  }

  /**
   * Convert old diagnosis format to new format
   */
  convertLegacyDiagnosis(legacyDiag: any): DiagnosisCode {
    return {
      code: legacyDiag.code,
      description: legacyDiag.description,
      category: 'General'
    };
  }
}

// Export singleton instance
export const expedixMedicationsApi = new ExpedixMedicationsApi();

// All types are already exported as interfaces above