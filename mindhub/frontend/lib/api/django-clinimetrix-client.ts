/**
 * Django ClinimetrixPro API Client
 * Bridge client for connecting React frontend to Django backend
 */

interface PatientData {
  id: string;
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

class DjangoClinimetrixClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost for development
    this.baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
  }

  /**
   * Get current Supabase token for authentication
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get token from Supabase client
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
   * Create assessment in Django and get assessment URL
   */
  async createAndStartAssessment(
    patientData: PatientData, 
    scaleAbbreviation: string, 
    returnUrl?: string
  ): Promise<CreateAssessmentResponse> {
    try {
      const token = await this.getAuthToken();
      
      // Default return URL to current patient page
      const defaultReturnUrl = returnUrl || `${window.location.origin}/hubs/expedix/patients/${patientData.id}`;
      
      const requestBody = {
        patient_data: {
          firstName: patientData.first_name,
          lastName: patientData.paternal_last_name || patientData.last_name,
          email: patientData.email || '',
          phone: patientData.phone || '',
          dateOfBirth: patientData.date_of_birth,
          gender: patientData.gender || '',
          // Map additional fields for Django
          first_name: patientData.first_name,
          last_name: patientData.paternal_last_name || patientData.last_name,
          date_of_birth: patientData.date_of_birth
        },
        scale_abbreviation: scaleAbbreviation,
        return_url: defaultReturnUrl
      };

      console.log('🚀 Creating assessment in Django:', requestBody);

      const response = await fetch(`${this.baseUrl}/assessments/api/create-from-react/`, {
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

      console.log('✅ Assessment created successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error creating assessment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Redirect to Django focused_take page
   */
  redirectToAssessment(assessmentUrl: string): void {
    console.log('🔄 Redirecting to Django assessment:', assessmentUrl);
    window.location.href = assessmentUrl;
  }

  /**
   * Create assessment and immediately redirect to Django
   */
  async startAssessment(
    patientData: PatientData, 
    scaleAbbreviation: string, 
    returnUrl?: string
  ): Promise<void> {
    try {
      const result = await this.createAndStartAssessment(patientData, scaleAbbreviation, returnUrl);
      
      if (result.success && result.assessment_url) {
        // Immediately redirect to Django focused_take
        this.redirectToAssessment(result.assessment_url);
      } else {
        throw new Error(result.error || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('❌ Error starting assessment:', error);
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`No se pudo iniciar la evaluación: ${errorMessage}\n\nPor favor, inténtelo de nuevo.`);
      
      throw error;
    }
  }

  /**
   * Check if Django backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health/`, {
        method: 'GET',
        timeout: 5000
      } as any);
      
      return response.ok;
    } catch (error) {
      console.warn('Django backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const djangoClinimetrixClient = new DjangoClinimetrixClient();
export default djangoClinimetrixClient;