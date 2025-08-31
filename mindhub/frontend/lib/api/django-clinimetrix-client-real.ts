/**
 * Django ClinimetrixPro API Client - REAL Supabase Schema
 * CORRECTED to use actual database structure and proper endpoints
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


interface PatientData {
  id: string;  // REAL patient ID from patients table
  first_name: string;
  last_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  age?: number;
}

interface CreateAssessmentResponse {
  success: boolean;
  assessment_id?: string;
  assessment_url?: string;
  patient_id?: string;
  scale_name?: string;
  return_url?: string;
  message?: string;
  error?: string;
}

interface PatientAssessmentsResponse {
  success: boolean;
  patient_id?: string;
  patient_name?: string;
  assessments?: Array<{
    id: string;
    template_id: string;
    status: string;
    mode: string;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    duration_seconds: number | null;
  }>;
  total?: number;
  error?: string;
}

interface ScalesCatalogResponse {
  success: boolean;
  scales?: Array<{
    id: string;
    scale_code: string;
    name: string;
    description: string;
    category: string;
    version: string;
    language: string;
    items_count: number;
    is_active: boolean;
  }>;
  total?: number;
  error?: string;
}

class DjangoClinimetrixClientReal {
  private baseUrl: string;

  constructor() {
    // Use correct Django backend URL
    this.baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8002';
  }

  /**
   * Get current Supabase token for authentication
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Create assessment using REAL Supabase schema
   * FIXED: Uses actual patients table and psychometric_scales.scale_code
   */
  async createAndStartAssessment(
    patientData: PatientData, 
    scaleAbbreviation: string, 
    returnUrl?: string
  ): Promise<CreateAssessmentResponse> {
    try {
      const token = await this.getAuthToken();
      
      if (!patientData.id) {
        throw new Error('Patient ID is required (must be from real patients table)');
      }
      
      // Default return URL to current patient page
      const defaultReturnUrl = returnUrl || `${window.location.origin}/hubs/expedix/patients/${patientData.id}`;
      
      const requestBody = {
        // CRITICAL: Pass patient as it exists in real patients table
        patient_data: {
          id: patientData.id,  // REAL patient ID from expedix
          first_name: patientData.first_name,
          last_name: patientData.paternal_last_name || patientData.last_name,
          email: patientData.email || '',
          phone: patientData.phone || '',
          date_of_birth: patientData.date_of_birth,
          gender: patientData.gender || ''
        },
        scale_abbreviation: scaleAbbreviation,  // Will map to scale_code
        return_url: defaultReturnUrl
      };

      console.log('🚀 Creating assessment in Django (REAL schema):', requestBody);

      // Use CORRECTED endpoint
      const response = await fetch(`${this.baseUrl}/assessments/api/create-from-react-real/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Assessment created successfully (REAL schema):', result);
      return result;

    } catch (error) {
      console.error('❌ Error creating assessment (REAL schema):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get patient assessments from REAL clinimetrix_assessments table
   */
  async getPatientAssessments(patientId: string): Promise<PatientAssessmentsResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/assessments/api/patient/${patientId}/assessments-real/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Patient assessments retrieved (REAL schema):', result);
      return result;

    } catch (error) {
      console.error('❌ Error getting patient assessments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get scales catalog from REAL psychometric_scales table
   */
  async getScalesCatalog(): Promise<ScalesCatalogResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/assessments/api/scales-catalog-real/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Scales catalog retrieved (REAL schema):', result);
      return result;

    } catch (error) {
      console.error('❌ Error getting scales catalog:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save assessment responses to REAL clinimetrix_responses table
   */
  async saveResponses(assessmentId: string, responses: Record<string, any>): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/assessments/api/${assessmentId}/responses-real/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ responses })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error saving responses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete assessment using REAL schema
   */
  async completeAssessment(assessmentId: string, responses: Record<string, any>): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/assessments/api/${assessmentId}/complete-real/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ responses })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error completing assessment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get assessment status from REAL clinimetrix_assessments table
   */
  async getAssessmentStatus(assessmentId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/assessments/api/${assessmentId}/status-real/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error getting assessment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for Django backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/assessments/api/scales-catalog-real/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Django backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const djangoClinimetrixClientReal = new DjangoClinimetrixClientReal();
export default djangoClinimetrixClientReal;