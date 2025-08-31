/**
 * FormX Hybrid Service - Django + GraphQL
 * Maintains ALL Django functionality while adding GraphQL support
 * NEVER removes existing functionality - only enhances it
 * 
 * 🚨 CRITICAL: FormX has complex business logic that MUST remain in Django:
 * - Token validation and expiration
 * - Form state management (draft/completed/expired)
 * - Mobile/desktop rendering logic
 * - Form submission workflows
 * - Patient-specific form customization
 */

import { client } from './apollo/client'
import { GET_DYNAMIC_FORMS } from './apollo/queries/formx/formx'

export interface FormData {
  id: string;
  title: string;
  description: string;
  sections: any[];
  token?: string;
  patientId?: string;
  expiresAt?: string;
  message?: string;
  status?: string;
}

export interface FormResponse {
  data: FormData;
  status?: 'active' | 'completed' | 'expired' | 'not_found';
}

class FormXHybridService {
  private static instance: FormXHybridService

  static getInstance(): FormXHybridService {
    if (!FormXHybridService.instance) {
      FormXHybridService.instance = new FormXHybridService()
    }
    return FormXHybridService.instance
  }

  /**
   * ✅ DJANGO ONLY: Get form by token (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: token validation, expiration, state management
   */
  async getFormByToken(token: string): Promise<FormResponse | null> {
    try {
      console.log('📝 [FormX Hybrid] Getting form by token - Django ONLY (complex business logic)')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/token/${token}`)
      
      if (response.status === 404) {
        console.log('⚠️ [FormX Hybrid] Form not found or invalid token')
        return { data: {} as FormData, status: 'not_found' }
      }
      
      if (response.status === 410) {
        console.log('⚠️ [FormX Hybrid] Form expired')
        return { data: {} as FormData, status: 'expired' }
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [FormX Hybrid] Form loaded via Django API with full business logic')
        
        const status = data.data.status === 'completed' ? 'completed' : 'active'
        return { data: data.data, status }
      } else {
        throw new Error('Django API failed')
      }
    } catch (error) {
      console.error('❌ [FormX Hybrid] Critical error in getFormByToken:', error)
      return null
    }
  }

  /**
   * ✅ DJANGO ONLY: Submit form (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: validation, patient association, workflow
   */
  async submitForm(token: string, responses: Record<string, any>): Promise<boolean> {
    try {
      console.log('📤 [FormX Hybrid] Submitting form - Django ONLY (complex business logic)')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/token/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses,
          submittedAt: new Date().toISOString(),
          completionTime: Date.now()
        })
      })

      if (response.ok) {
        console.log('✅ [FormX Hybrid] Form submitted successfully via Django API')
        return true
      } else {
        console.error('❌ [FormX Hybrid] Form submission failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ [FormX Hybrid] Critical error in submitForm:', error)
      return false
    }
  }

  /**
   * ✅ DJANGO ONLY: Save draft (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: auto-save, session management
   */
  async saveDraft(token: string, responses: Record<string, any>): Promise<boolean> {
    try {
      console.log('💾 [FormX Hybrid] Saving draft - Django ONLY (complex business logic)')
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/token/${token}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses,
          savedAt: new Date().toISOString()
        })
      })
      
      console.log('✅ [FormX Hybrid] Draft saved successfully via Django API')
      return true
    } catch (error) {
      console.error('❌ [FormX Hybrid] Critical error in saveDraft:', error)
      return false
    }
  }

  /**
   * ✅ HYBRID: Get dynamic forms for admin (Django PRIMARY + GraphQL fallback)
   * Less complex logic - can use GraphQL as enhancement
   */
  async getDynamicForms(): Promise<any[]> {
    try {
      console.log('📋 [FormX Hybrid] Getting dynamic forms - Django PRIMARY, GraphQL fallback')
      
      // 🔄 PRIMARY: Try Django API first (mantener funcionalidad existente)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [FormX Hybrid] Dynamic forms loaded via Django API')
          return Array.isArray(data) ? data : data.forms || []
        }
      } catch (djangoError) {
        console.warn('⚠️ [FormX Hybrid] Django API failed, trying GraphQL:', djangoError)
      }

      // 🔄 FALLBACK: Try GraphQL if Django fails
      try {
        const result = await client.query({
          query: GET_DYNAMIC_FORMS,
          variables: { first: 100 },
          fetchPolicy: 'network-only'
        })

        const forms = result.data?.dynamic_formsCollection?.edges?.map((edge: any) => edge.node) || []
        console.log('✅ [FormX Hybrid] Dynamic forms loaded via GraphQL fallback')
        return forms
      } catch (graphqlError) {
        console.error('❌ [FormX Hybrid] Both Django and GraphQL failed:', graphqlError)
        return []
      }

    } catch (error) {
      console.error('❌ [FormX Hybrid] Critical error in getDynamicForms:', error)
      return []
    }
  }

  /**
   * ✅ DJANGO ONLY: Create dynamic form (MANTENER TODA LA LÓGICA COMPLEJA)
   * Complex business logic: form builder, validation rules, permissions
   */
  async createDynamicForm(formData: any): Promise<boolean> {
    try {
      console.log('🆕 [FormX Hybrid] Creating dynamic form - Django ONLY (complex business logic)')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        console.log('✅ [FormX Hybrid] Dynamic form created successfully via Django API')
        return true
      } else {
        console.error('❌ [FormX Hybrid] Form creation failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ [FormX Hybrid] Critical error in createDynamicForm:', error)
      return false
    }
  }
}

export const formXHybridService = FormXHybridService.getInstance()

console.log('🔄 FormX Hybrid Service initialized - Django PRIMARY for complex logic + GraphQL fallback!')

export default formXHybridService