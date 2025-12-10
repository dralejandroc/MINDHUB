'use client';

/**
 * Client for ClinimetrixPro Assessment integration with Expedix
 */
import { createApiUrl } from './api-url-builders';

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
    [key: string]: any;
  };
  responses: Array<{
    questionId: string;
    responseValue: any;
    responseType: string;
  }>;
  metadata?: {
    completionTime?: number;
    startedAt?: string;
    completedAt?: string;
    [key: string]: any;
  };
}

export interface PatientAssessment {
  id: string;
  patientId: string;
  scaleName: string;
  scaleId: string;
  totalScore: number;
  severityLevel?: string;
  interpretation?: string;
  completedAt: string;
  assessmentData: any;
}

/**
 * Saves a completed ClinimetrixPro assessment to a patient's record in Expedix
 */
export async function saveAssessmentToPatient(
  patientId: string,
  assessmentData: AssessmentSaveData
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(createApiUrl(`/expedix/patients/${patientId}/assessments`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving assessment to patient:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Retrieves all assessments for a specific patient
 */
export async function getPatientAssessments(patientId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(createApiUrl(`/expedix/patients/${patientId}/assessments`));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result.data || [] };
  } catch (error) {
    console.error('Error getting patient assessments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export default {
  saveAssessmentToPatient,
  getPatientAssessments,
};