/**
 * SERVICIO - Integración ClinimetrixPro ↔ Expedix
 * Conecta automáticamente evaluaciones completadas con expedientes de pacientes
 * 
 * FUNCIONALIDADES:
 * - Auto-guardado de resultados de evaluaciones en expediente del paciente
 * - Sincronización automática al completar evaluaciones
 * - Almacenamiento estructurado con metadatos completos
 * - Timeline entry automático en el expediente
 * - Cálculo de trends y comparaciones históricas
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


'use client';

import { clinimetrixProClient, type ClinimetrixAssessment, type ScoringResults } from '@/lib/api/clinimetrix-pro-client';
import { saveAssessmentToPatient, type AssessmentSaveData } from '@/lib/api/expedix-assessments-client';
import { expedixApi } from '@/lib/api/expedix-client';

export interface ClinimetrixExpedixIntegrationOptions {
  enableAutoSave?: boolean;
  enableTimelineEntry?: boolean;
  enableTrendAnalysis?: boolean;
  saveRawResponses?: boolean;
}

export interface AssessmentIntegrationResult {
  success: boolean;
  assessmentId?: string;
  savedToExpedix: boolean;
  timelineEntryCreated: boolean;
  trendAnalysisCalculated: boolean;
  errors?: string[];
  warnings?: string[];
}

export class ClinimetrixExpedixIntegration {
  private defaultOptions: ClinimetrixExpedixIntegrationOptions = {
    enableAutoSave: true,
    enableTimelineEntry: true,
    enableTrendAnalysis: true,
    saveRawResponses: true
  };

  constructor(private options: ClinimetrixExpedixIntegrationOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * MÉTODO PRINCIPAL: Procesar evaluación completada
   * Se llama automáticamente cuando se completa una evaluación en ClinimetrixPro
   */
  async processCompletedAssessment(
    assessmentId: string,
    patientId: string,
    options: Partial<ClinimetrixExpedixIntegrationOptions> = {}
  ): Promise<AssessmentIntegrationResult> {
    const processOptions = { ...this.options, ...options };
    const result: AssessmentIntegrationResult = {
      success: false,
      savedToExpedix: false,
      timelineEntryCreated: false,
      trendAnalysisCalculated: false,
      errors: [],
      warnings: []
    };

    try {
      console.log(`🔗 Processing ClinimetrixPro assessment ${assessmentId} for patient ${patientId}`);

      // 1. Obtener la evaluación completada desde ClinimetrixPro
      const assessment = await clinimetrixProClient.getAssessment(assessmentId);
      
      if (assessment.status !== 'completed') {
        throw new Error(`Assessment ${assessmentId} is not completed (status: ${assessment.status})`);
      }

      // 2. Verificar que el paciente existe en Expedix
      const patientResponse = await expedixApi.getPatient(patientId);
      if (!patientResponse || !patientResponse.data) {
        throw new Error(`Patient ${patientId} not found in Expedix`);
      }

      const patient = patientResponse.data;

      // 3. Procesar y guardar en Expedix si está habilitado
      if (processOptions.enableAutoSave) {
        const saveResult = await this.saveToExpedix(assessment, patient);
        result.savedToExpedix = saveResult.success;
        
        if (!saveResult.success) {
          result.errors?.push(`Failed to save to Expedix: ${saveResult.error}`);
        } else {
          console.log(`✅ Assessment ${assessmentId} saved to Expedix for patient ${patientId}`);
        }
      }

      // 4. Crear entrada en timeline si está habilitado
      if (processOptions.enableTimelineEntry && result.savedToExpedix) {
        const timelineResult = await this.createTimelineEntry(assessment, patient);
        result.timelineEntryCreated = timelineResult.success;
        
        if (!timelineResult.success) {
          result.warnings?.push(`Failed to create timeline entry: ${timelineResult.error}`);
        }
      }

      // 5. Calcular análisis de tendencias si está habilitado
      if (processOptions.enableTrendAnalysis && result.savedToExpedix) {
        const trendResult = await this.calculateTrendAnalysis(assessment, patient);
        result.trendAnalysisCalculated = trendResult.success;
        
        if (!trendResult.success) {
          result.warnings?.push(`Failed to calculate trend analysis: ${trendResult.error}`);
        }
      }

      result.success = result.savedToExpedix;
      result.assessmentId = assessmentId;

      console.log(`🎉 Integration completed for assessment ${assessmentId}:`, {
        savedToExpedix: result.savedToExpedix,
        timelineEntry: result.timelineEntryCreated,
        trendAnalysis: result.trendAnalysisCalculated
      });

      return result;

    } catch (error) {
      console.error(`❌ Failed to process assessment ${assessmentId}:`, error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Guardar evaluación en Expedix con estructura completa
   */
  private async saveToExpedix(
    assessment: ClinimetrixAssessment,
    patient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Preparar datos estructurados para Expedix
      const assessmentData: AssessmentSaveData = {
        assessmentId: assessment.id,
        templateId: assessment.templateId,
        scaleName: assessment.template?.templateData?.metadata?.name || 'Evaluación Desconocida',
        scaleAbbreviation: assessment.template?.templateData?.metadata?.abbreviation || '',
        results: {
          totalScore: assessment.totalScore || 0,
          severityLevel: assessment.severityLevel || 'unknown',
          interpretation: {
            primaryInterpretation: typeof assessment.interpretation === 'string' ? assessment.interpretation : ''
          },
          scoringResults: assessment.scoringResults,
          subscaleScores: assessment.subscaleScores,
          validityIndicators: assessment.validityIndicators,
          percentileScore: assessment.scoringResults?.percentileScore,
          tScore: assessment.scoringResults?.tScore,
          zScore: assessment.scoringResults?.zScore
        },
        responses: this.transformResponses(assessment.responses),
        metadata: {
          completionTime: assessment.completionTimeSeconds,
          startedAt: assessment.createdAt,
          completedAt: assessment.completedAt || new Date().toISOString(),
          mode: assessment.mode,
          templateVersion: assessment.template?.version || '1.0',
          templateCategory: assessment.template?.templateData?.metadata?.category || 'general',
          administratorId: assessment.administratorId,
          validityScore: assessment.validityIndicators?.overallValidityScore,
          validityLevel: assessment.validityIndicators?.validityLevel,
          clinicalSignificance: assessment.scoringResults?.interpretation?.clinicalSignificance,
          recommendations: assessment.scoringResults?.interpretation?.professionalRecommendations
        }
      };

      // Guardar en Expedix
      const saveResult = await saveAssessmentToPatient(patient.id, assessmentData);
      return saveResult;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown save error'
      };
    }
  }

  /**
   * Crear entrada automática en el timeline del paciente
   */
  private async createTimelineEntry(
    assessment: ClinimetrixAssessment,
    patient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const timelineEntry = {
        type: 'assessment',
        title: `Evaluación: ${assessment.template?.templateData?.metadata?.name || 'Evaluación Clínica'}`,
        description: `Evaluación psicométrica completada. Puntaje: ${assessment.totalScore}, Severidad: ${assessment.severityLevel}`,
        date: assessment.completedAt || new Date().toISOString(),
        metadata: {
          assessmentId: assessment.id,
          templateId: assessment.templateId,
          scaleName: assessment.template?.templateData?.metadata?.name,
          scaleAbbreviation: assessment.template?.templateData?.metadata?.abbreviation,
          totalScore: assessment.totalScore,
          severityLevel: assessment.severityLevel,
          interpretation: assessment.interpretation?.substring(0, 200) + (assessment.interpretation && assessment.interpretation.length > 200 ? '...' : ''),
          category: assessment.template?.templateData?.metadata?.category,
          completionTime: assessment.completionTimeSeconds,
          mode: assessment.mode
        }
      };

      // Crear entrada en timeline usando la API de Expedix
      const timelineResponse = await fetch(`/api/expedix/django/patients/${patient.id}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timelineEntry)
      });

      if (!timelineResponse.ok) {
        throw new Error(`Timeline API error: ${timelineResponse.status}`);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown timeline error'
      };
    }
  }

  /**
   * Calcular análisis de tendencias comparando con evaluaciones previas
   */
  private async calculateTrendAnalysis(
    assessment: ClinimetrixAssessment,
    patient: any
  ): Promise<{ success: boolean; error?: string; trends?: any }> {
    try {
      // Obtener evaluaciones previas del mismo template
      const patientAssessments = await clinimetrixProClient.getPatientAssessments(patient.id);
      
      // Filtrar evaluaciones del mismo template
      const sameScaleAssessments = patientAssessments
        .filter(a => a.templateId === assessment.templateId && a.status === 'completed')
        .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());

      if (sameScaleAssessments.length < 2) {
        // No hay suficientes evaluaciones para calcular tendencias
        return { success: true };
      }

      // Calcular tendencias
      const current = assessment;
      const previous = sameScaleAssessments.find(a => a.id !== assessment.id);

      if (!previous) {
        return { success: true };
      }

      const trends = {
        scoreChange: (current.totalScore || 0) - (previous.totalScore || 0),
        severityChange: this.compareSeverity(current.severityLevel || '', previous.severityLevel || ''),
        timesSinceLastAssessment: this.calculateDaysBetween(previous.completedAt || '', current.completedAt || ''),
        trend: this.calculateTrend(sameScaleAssessments.slice(0, 5)), // Últimas 5 evaluaciones
        interpretation: this.generateTrendInterpretation(current, previous)
      };

      // Guardar análisis de tendencias en metadatos
      const trendResponse = await fetch(`/api/expedix/django/patients/${patient.id}/assessment-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          templateId: assessment.templateId,
          trends
        })
      });

      return { 
        success: trendResponse.ok,
        trends 
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown trend analysis error'
      };
    }
  }

  /**
   * Transformar respuestas de ClinimetrixPro a formato Expedix
   */
  private transformResponses(responses: Record<string, any>): Array<{
    questionId: string;
    responseValue: any;
    responseType: string;
  }> {
    return Object.entries(responses).map(([questionId, response]) => ({
      questionId,
      responseValue: typeof response === 'object' ? response.value : response,
      responseType: typeof response === 'object' && response.type ? response.type : 'numeric'
    }));
  }

  /**
   * Comparar niveles de severidad
   */
  private compareSeverity(current: string, previous: string): 'improved' | 'worsened' | 'same' | 'unknown' {
    const severityOrder: { [key: string]: number } = {
      'minimal': 0,
      'normal': 0,
      'mild': 1,
      'leve': 1,
      'moderate': 2,
      'moderado': 2,
      'severe': 3,
      'severo': 3,
      'very_severe': 4
    };

    const currentLevel = severityOrder[current.toLowerCase()] ?? -1;
    const previousLevel = severityOrder[previous.toLowerCase()] ?? -1;

    if (currentLevel === -1 || previousLevel === -1) return 'unknown';
    if (currentLevel < previousLevel) return 'improved';
    if (currentLevel > previousLevel) return 'worsened';
    return 'same';
  }

  /**
   * Calcular días entre evaluaciones
   */
  private calculateDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  }

  /**
   * Calcular tendencia general
   */
  private calculateTrend(assessments: ClinimetrixAssessment[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (assessments.length < 3) return 'insufficient_data';

    const scores = assessments.slice(0, 5).reverse().map(a => a.totalScore || 0);
    const changes = scores.slice(1).map((score, i) => score - scores[i]);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;

    if (avgChange < -2) return 'improving'; // Puntajes menores = mejoría
    if (avgChange > 2) return 'declining';  // Puntajes mayores = empeoramiento
    return 'stable';
  }

  /**
   * Generar interpretación de tendencia
   */
  private generateTrendInterpretation(current: ClinimetrixAssessment, previous: ClinimetrixAssessment): string {
    const scoreChange = (current.totalScore || 0) - (previous.totalScore || 0);
    const severityComparison = this.compareSeverity(current.severityLevel || '', previous.severityLevel || '');

    if (severityComparison === 'improved') {
      return `Mejoría clínica significativa. El puntaje cambió de ${previous.totalScore} a ${current.totalScore} (${scoreChange > 0 ? '+' : ''}${scoreChange} puntos).`;
    } else if (severityComparison === 'worsened') {
      return `Deterioro clínico. El puntaje cambió de ${previous.totalScore} a ${current.totalScore} (${scoreChange > 0 ? '+' : ''}${scoreChange} puntos). Se recomienda evaluación clínica.`;
    } else if (Math.abs(scoreChange) >= 5) {
      return `Cambio significativo en el puntaje (${scoreChange > 0 ? '+' : ''}${scoreChange} puntos) sin cambio de categoría de severidad.`;
    } else {
      return `Resultados estables. Cambio mínimo en el puntaje (${scoreChange > 0 ? '+' : ''}${scoreChange} puntos).`;
    }
  }

  /**
   * MÉTODO DE UTILIDAD: Verificar si una evaluación debe procesarse automáticamente
   */
  shouldAutoProcess(assessment: ClinimetrixAssessment): boolean {
    return (
      assessment.status === 'completed' &&
      assessment.patientId !== undefined &&
      assessment.patientId !== null &&
      assessment.patientId !== '' &&
      assessment.totalScore !== undefined &&
      assessment.totalScore !== null
    );
  }

  /**
   * MÉTODO DE UTILIDAD: Obtener resumen de integraciones para un paciente
   */
  async getIntegrationSummary(patientId: string): Promise<{
    totalAssessments: number;
    linkedToExpedix: number;
    recentIntegrations: any[];
    availableScales: string[];
  }> {
    try {
      // Obtener evaluaciones de ClinimetrixPro
      const assessments = await clinimetrixProClient.getPatientAssessments(patientId);
      
      // Obtener evaluaciones guardadas en Expedix
      const expedixAssessments = await import('@/lib/api/expedix-assessments-client');
      const expedixData = await expedixAssessments.default.getPatientAssessments(patientId);

      return {
        totalAssessments: assessments.length,
        linkedToExpedix: expedixData.success ? (expedixData.data?.length || 0) : 0,
        recentIntegrations: assessments.slice(0, 5).map(a => ({
          id: a.id,
          templateId: a.templateId,
          scaleName: a.template?.templateData?.metadata?.name,
          completedAt: a.completedAt,
          totalScore: a.totalScore,
          severityLevel: a.severityLevel
        })),
        availableScales: [...new Set(assessments.map(a => a.template?.templateData?.metadata?.name || 'Unknown'))]
      };
    } catch (error) {
      console.error('Error getting integration summary:', error);
      return {
        totalAssessments: 0,
        linkedToExpedix: 0,
        recentIntegrations: [],
        availableScales: []
      };
    }
  }
}

// Instancia singleton para uso global
export const clinimetrixExpedixIntegration = new ClinimetrixExpedixIntegration();

// Hook para React components
export function useClinimetrixExpedixIntegration(options?: ClinimetrixExpedixIntegrationOptions) {
  return new ClinimetrixExpedixIntegration(options);
}

export default clinimetrixExpedixIntegration;