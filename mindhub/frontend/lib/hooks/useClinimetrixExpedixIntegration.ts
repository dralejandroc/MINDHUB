// Custom hook for ClinimetrixPro-Expedix integration
'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface AssessmentResult {
  id: string;
  scaleId: string;
  scaleName: string;
  patientId: string;
  score?: number;
  interpretation?: string;
  completedAt: string;
  rawAnswers?: Record<string, any>;
}

interface ConsultationLink {
  assessmentId: string;
  consultationId: string;
  patientId: string;
  scaleId: string;
  scaleName: string;
  linkedAt: string;
  linkedBy: string;
}

interface IntegrationState {
  isLinking: boolean;
  error: string | null;
  successfulLinks: ConsultationLink[];
}

export function useClinimetrixExpedixIntegration() {
  const [state, setState] = useState<IntegrationState>({
    isLinking: false,
    error: null,
    successfulLinks: []
  });

  // Link an assessment to a consultation
  const linkAssessmentToConsultation = useCallback(async (
    assessmentResult: AssessmentResult,
    consultationId: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLinking: true, error: null }));

    try {
      console.log('Linking assessment to consultation:', {
        assessmentId: assessmentResult.id,
        consultationId,
        patientId: assessmentResult.patientId,
        scaleId: assessmentResult.scaleId
      });

      const response = await fetch('/api/clinimetrix/link-to-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessmentResult.id,
          consultationId,
          patientId: assessmentResult.patientId,
          scaleId: assessmentResult.scaleId,
          scaleName: assessmentResult.scaleName,
          completedAt: assessmentResult.completedAt,
          score: assessmentResult.score,
          interpretation: assessmentResult.interpretation,
          rawAnswers: assessmentResult.rawAnswers
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link assessment to consultation');
      }

      const result = await response.json();
      
      if (result.success) {
        const newLink: ConsultationLink = {
          assessmentId: assessmentResult.id,
          consultationId,
          patientId: assessmentResult.patientId,
          scaleId: assessmentResult.scaleId,
          scaleName: assessmentResult.scaleName,
          linkedAt: result.integration.linked_at,
          linkedBy: result.integration.linked_by
        };

        setState(prev => ({
          ...prev,
          isLinking: false,
          successfulLinks: [...prev.successfulLinks, newLink]
        }));

        toast.success(`Evaluación ${assessmentResult.scaleName} vinculada exitosamente a la consulta`);
        return true;
      } else {
        throw new Error(result.message || 'Failed to link assessment');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ 
        ...prev, 
        isLinking: false, 
        error: errorMessage 
      }));
      
      toast.error(`Error al vincular evaluación: ${errorMessage}`);
      console.error('Error linking assessment to consultation:', error);
      return false;
    }
  }, []);

  // Get assessment links for a consultation
  const getConsultationAssessments = useCallback(async (
    consultationId: string
  ): Promise<ConsultationLink[]> => {
    try {
      const response = await fetch(
        `/api/clinimetrix/link-to-consultation?consultationId=${consultationId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get consultation assessments');
      }

      const result = await response.json();
      return result.success ? result.data || [] : [];

    } catch (error) {
      console.error('Error getting consultation assessments:', error);
      toast.error('Error al obtener evaluaciones de la consulta');
      return [];
    }
  }, []);

  // Get assessment links for a patient
  const getPatientAssessments = useCallback(async (
    patientId: string
  ): Promise<ConsultationLink[]> => {
    try {
      const response = await fetch(
        `/api/clinimetrix/link-to-consultation?patientId=${patientId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get patient assessments');
      }

      const result = await response.json();
      return result.success ? result.data || [] : [];

    } catch (error) {
      console.error('Error getting patient assessments:', error);
      toast.error('Error al obtener evaluaciones del paciente');
      return [];
    }
  }, []);

  // Link multiple assessments to a consultation (batch operation)
  const linkMultipleAssessments = useCallback(async (
    assessmentResults: AssessmentResult[],
    consultationId: string
  ): Promise<{ successful: number; failed: number }> => {
    let successful = 0;
    let failed = 0;

    setState(prev => ({ ...prev, isLinking: true, error: null }));

    try {
      // Process assessments sequentially to avoid overwhelming the server
      for (const assessment of assessmentResults) {
        const result = await linkAssessmentToConsultation(assessment, consultationId);
        if (result) {
          successful++;
        } else {
          failed++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (successful > 0) {
        toast.success(`${successful} evaluaciones vinculadas exitosamente`);
      }
      
      if (failed > 0) {
        toast.error(`${failed} evaluaciones fallaron al vincularse`);
      }

    } catch (error) {
      console.error('Error in batch linking:', error);
      toast.error('Error al vincular múltiples evaluaciones');
    } finally {
      setState(prev => ({ ...prev, isLinking: false }));
    }

    return { successful, failed };
  }, [linkAssessmentToConsultation]);

  // Auto-link recent assessments for a patient to current consultation
  const autoLinkRecentAssessments = useCallback(async (
    patientId: string,
    consultationId: string,
    hoursWindow: number = 24
  ): Promise<number> => {
    try {
      console.log(`Auto-linking recent assessments for patient ${patientId} within ${hoursWindow} hours`);
      
      // This would typically involve getting recent assessments from ClinimetrixPro
      // and automatically linking those completed within the specified time window
      // For now, we'll implement this as a placeholder
      
      const cutoffTime = new Date(Date.now() - (hoursWindow * 60 * 60 * 1000));
      
      // TODO: Implement getting recent assessments from backend
      // const recentAssessments = await getRecentAssessments(patientId, cutoffTime);
      // const result = await linkMultipleAssessments(recentAssessments, consultationId);
      // return result.successful;

      console.log('Auto-link feature will be implemented with backend support');
      return 0;

    } catch (error) {
      console.error('Error in auto-linking assessments:', error);
      toast.error('Error al vincular evaluaciones automáticamente');
      return 0;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLinking: false,
      error: null,
      successfulLinks: []
    });
  }, []);

  return {
    // State
    isLinking: state.isLinking,
    error: state.error,
    successfulLinks: state.successfulLinks,

    // Actions
    linkAssessmentToConsultation,
    getConsultationAssessments,
    getPatientAssessments,
    linkMultipleAssessments,
    autoLinkRecentAssessments,
    clearError,
    reset
  };
}