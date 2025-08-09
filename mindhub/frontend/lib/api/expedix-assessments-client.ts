'use client';

/**
 * Client for ClinimetrixPro Assessment integration with Expedix
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface AssessmentSaveData {
  assessmentId: string;
  templateId: string;
  scaleName: string;
  scaleAbbreviation?: string;
  results: {
    totalScore?: number;
    severityLevel?: string;
    interpretation?: {
      primaryInterpretation?: string;
      [key: string]: any;
    };
    metadata?: any;
    [key: string]: any;
  };
  consultationId?: string;
}

export interface PatientAssessment {
  id: string;
  templateId: string;
  scaleName: string;
  scaleAbbreviation?: string;
  category?: string;
  description?: string;
  completedAt: string;
  totalScore?: number;
  severityLevel?: string;
  interpretation?: string;
  metadata?: any;
}

class ExpedixAssessmentsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api/v1/expedix/patients`;
  }

  /**
   * Save ClinimetrixPro assessment results to patient record
   */
  async saveAssessmentToPatient(
    patientId: string, 
    assessmentData: AssessmentSaveData
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      assessmentId: string;
      patientId: string;
      scaleName: string;
      totalScore?: number;
      severityLevel?: string;
      consultationLinked: boolean;
      savedAt: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${patientId}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error saving assessment to patient:', error);
      throw error;
    }
  }

  /**
   * Get all ClinimetrixPro assessments for a patient
   */
  async getPatientAssessments(
    patientId: string,
    options?: {
      limit?: number;
      templateId?: string;
    }
  ): Promise<{
    success: boolean;
    data: PatientAssessment[];
    count: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      
      if (options?.templateId) {
        params.append('templateId', options.templateId);
      }

      const url = `${this.baseUrl}/${patientId}/assessments${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error getting patient assessments:', error);
      throw error;
    }
  }

  /**
   * Get recent assessments for a patient (shortcut method)
   */
  async getRecentAssessments(patientId: string, limit = 10): Promise<PatientAssessment[]> {
    try {
      const response = await this.getPatientAssessments(patientId, { limit });
      return response.data;
    } catch (error) {
      console.error('Error getting recent assessments:', error);
      return [];
    }
  }
}

// Export singleton instance
export const expedixAssessmentsClient = new ExpedixAssessmentsClient();
export default expedixAssessmentsClient;