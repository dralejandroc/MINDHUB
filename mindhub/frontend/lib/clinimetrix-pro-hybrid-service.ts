/**
 * ClinimetrixPro Hybrid Service - Django + GraphQL
 * Maintains ALL Django functionality while adding GraphQL support
 * NEVER removes existing functionality - only enhances it
 * 
 * 🚨 CRITICAL: ClinimetrixPro has complex business logic that MUST remain in Django:
 * - 29+ psychometric assessment scales
 * - Complex scoring algorithms and interpretations
 * - Clinical evaluation workflows
 * - Patient-specific scale customization
 * - Assessment state management (draft/completed/scored)
 * - Psychometric data validation and normalization
 */

import { client } from './apollo/client'
import { GET_CLINIMETRIX_ASSESSMENTS } from './apollo/queries/clinimetrix/clinimetrix'

export interface ScaleDocumentation {
  id: string;
  metadata: {
    name: string;
    abbreviation: string;
    version: string;
    lastUpdated?: string;
    category?: string;
    description?: string;
  };
  documentation?: {
    purpose?: string;
    clinicalUtility?: string;
    theoreticalFramework?: string;
    psychometricProperties?: {
      normativeData?: any;
      demographics?: any;
      populationNorms?: any;
      reliability?: {
        cronbachAlpha?: string | number;
        testRetest?: string | number;
        interRater?: string | number;
      };
      validity?: any;
      sensitivity?: string | number;
      specificity?: string | number;
      positivePredicativeValue?: string | number;
    };
    version?: string;
    lastUpdated?: string;
  };
}

export interface AssessmentResult {
  id: string;
  scaleId: string;
  patientId: string;
  responses: Record<string, any>;
  rawScore?: number;
  interpretedScore?: string;
  clinicalInterpretation?: string;
  completedAt: string;
  administeredBy: string;
}

class ClinimetrixProHybridService {
  private static instance: ClinimetrixProHybridService

  static getInstance(): ClinimetrixProHybridService {
    if (!ClinimetrixProHybridService.instance) {
      ClinimetrixProHybridService.instance = new ClinimetrixProHybridService()
    }
    return ClinimetrixProHybridService.instance
  }

  /**
   * ✅ DJANGO ONLY: Get scale template by ID (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: psychometric properties, scoring algorithms, clinical interpretations
   */
  async getScaleTemplate(scaleId: string, session?: any): Promise<ScaleDocumentation | null> {
    try {
      console.log('🧠 [ClinimetrixPro Hybrid] Getting scale template - Django ONLY (complex psychometric logic)')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/clinimetrix-pro/templates/${scaleId}`, {
        headers
      })
      
      if (!response.ok) {
        console.error('❌ [ClinimetrixPro Hybrid] Failed to load scale template:', response.status)
        return null
      }
      
      const result = await response.json()
      console.log('✅ [ClinimetrixPro Hybrid] Scale template loaded via Django API with full psychometric logic')
      return result.data || result

    } catch (error) {
      console.error('❌ [ClinimetrixPro Hybrid] Critical error in getScaleTemplate:', error)
      return null
    }
  }

  /**
   * ✅ DJANGO ONLY: Apply/start assessment (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: assessment initialization, state management, patient association
   */
  async startAssessment(scaleId: string, patientId: string, session?: any): Promise<boolean> {
    try {
      console.log('🎯 [ClinimetrixPro Hybrid] Starting assessment - Django ONLY (complex workflow logic)')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/clinimetrix-pro/assessments/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scaleId,
          patientId,
          startedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        console.log('✅ [ClinimetrixPro Hybrid] Assessment started successfully via Django API')
        return true
      } else {
        console.error('❌ [ClinimetrixPro Hybrid] Assessment start failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ [ClinimetrixPro Hybrid] Critical error in startAssessment:', error)
      return false
    }
  }

  /**
   * ✅ DJANGO ONLY: Submit assessment responses (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: scoring calculations, clinical interpretations, result validation
   */
  async submitAssessment(
    assessmentId: string, 
    responses: Record<string, any>, 
    session?: any
  ): Promise<AssessmentResult | null> {
    try {
      console.log('📊 [ClinimetrixPro Hybrid] Submitting assessment - Django ONLY (complex scoring logic)')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/clinimetrix-pro/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          responses,
          completedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [ClinimetrixPro Hybrid] Assessment submitted and scored via Django API')
        return result.data || result
      } else {
        console.error('❌ [ClinimetrixPro Hybrid] Assessment submission failed:', response.status)
        return null
      }
    } catch (error) {
      console.error('❌ [ClinimetrixPro Hybrid] Critical error in submitAssessment:', error)
      return null
    }
  }

  /**
   * ✅ HYBRID: Get assessment history (Django PRIMARY + GraphQL fallback)
   * Less complex logic - can use GraphQL as enhancement
   */
  async getAssessmentHistory(patientId?: string): Promise<AssessmentResult[]> {
    try {
      console.log('📋 [ClinimetrixPro Hybrid] Getting assessment history - Django PRIMARY, GraphQL fallback')
      
      // 🔄 PRIMARY: Try Django API first (mantener funcionalidad existente)
      try {
        const url = patientId 
          ? `/api/clinimetrix-pro/assessments?patientId=${patientId}`
          : '/api/clinimetrix-pro/assessments'
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [ClinimetrixPro Hybrid] Assessment history loaded via Django API')
          return Array.isArray(data) ? data : data.assessments || []
        }
      } catch (djangoError) {
        console.warn('⚠️ [ClinimetrixPro Hybrid] Django API failed, trying GraphQL:', djangoError)
      }

      // 🔄 FALLBACK: Try GraphQL if Django fails
      try {
        const variables: any = { first: 100 }
        if (patientId) {
          variables.filter = { patient_id: { eq: patientId } }
        }

        const result = await client.query({
          query: GET_CLINIMETRIX_ASSESSMENTS,
          variables,
          fetchPolicy: 'network-only'
        })

        const assessments = result.data?.clinimetrix_assessmentsCollection?.edges?.map((edge: any) => edge.node) || []
        console.log('✅ [ClinimetrixPro Hybrid] Assessment history loaded via GraphQL fallback')
        return this.transformGraphQLAssessments(assessments)
      } catch (graphqlError) {
        console.error('❌ [ClinimetrixPro Hybrid] Both Django and GraphQL failed:', graphqlError)
        return []
      }

    } catch (error) {
      console.error('❌ [ClinimetrixPro Hybrid] Critical error in getAssessmentHistory:', error)
      return []
    }
  }

  /**
   * ✅ DJANGO ONLY: Get available scales (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: scale metadata, psychometric properties, clinical categories
   */
  async getAvailableScales(): Promise<any[]> {
    try {
      console.log('📚 [ClinimetrixPro Hybrid] Getting available scales - Django ONLY (complex metadata logic)')
      
      const response = await fetch('/api/clinimetrix-pro/scales')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [ClinimetrixPro Hybrid] Available scales loaded via Django API')
        return Array.isArray(data) ? data : data.scales || []
      } else {
        console.error('❌ [ClinimetrixPro Hybrid] Failed to load scales:', response.status)
        return this.getFallbackScales()
      }
    } catch (error) {
      console.error('❌ [ClinimetrixPro Hybrid] Critical error in getAvailableScales:', error)
      return this.getFallbackScales()
    }
  }

  /**
   * Transform GraphQL assessments to expected format
   */
  private transformGraphQLAssessments(assessments: any[]): AssessmentResult[] {
    return assessments.map(assessment => ({
      id: assessment.id,
      scaleId: assessment.scale_id,
      patientId: assessment.patient_id,
      responses: assessment.responses ? JSON.parse(assessment.responses) : {},
      rawScore: assessment.raw_score,
      interpretedScore: assessment.interpreted_score,
      clinicalInterpretation: assessment.clinical_interpretation,
      completedAt: assessment.completed_at,
      administeredBy: assessment.administered_by
    }))
  }

  /**
   * Fallback scales when Django is unavailable
   */
  private getFallbackScales() {
    return [
      {
        id: 'phq-9',
        name: 'Patient Health Questionnaire-9',
        abbreviation: 'PHQ-9',
        category: 'Depression',
        description: 'Screening tool for depression'
      },
      {
        id: 'gad-7',
        name: 'Generalized Anxiety Disorder-7',
        abbreviation: 'GAD-7',
        category: 'Anxiety',
        description: 'Screening tool for anxiety disorders'
      }
    ]
  }
}

export const clinimetrixProHybridService = ClinimetrixProHybridService.getInstance()

console.log('🔄 ClinimetrixPro Hybrid Service initialized - Django PRIMARY for complex psychometric logic + GraphQL fallback!')

export default clinimetrixProHybridService