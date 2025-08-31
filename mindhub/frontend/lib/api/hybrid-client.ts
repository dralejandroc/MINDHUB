/**
 * ⚠️ DEPRECATED - MindHub Hybrid API Client
 * 
 * 🚫 DO NOT USE - This file is deprecated in favor of GraphQL-only architecture
 * 
 * ✅ USE INSTEAD: GraphQL queries with Apollo Client (/lib/apollo/)
 * ✅ USE HOOKS: /lib/hooks/useGraphQLServices.ts
 * 
 * This file remains for legacy reference only.
 * All new development should use GraphQL exclusively.
 */

import { createClient } from '@supabase/supabase-js'

interface HybridClientConfig {
  supabaseUrl: string
  supabaseKey: string
  djangoApiUrl: string
  useAuth: boolean
}

interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  data?: any
  params?: Record<string, string>
  headers?: Record<string, string>
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class HybridApiClient {
  private supabase
  private djangoApiUrl: string
  private useAuth: boolean

  constructor(config: HybridClientConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.djangoApiUrl = config.djangoApiUrl
    this.useAuth = config.useAuth
  }

  /**
   * Determine whether to use Django or Supabase for a given operation
   */
  private shouldUseDjango(module: string, operation: string, data?: any): boolean {
    // Use Django for complex operations that require business logic
    const djangoOperations = {
      agenda: ['schedule-conflict-check', 'bulk-reschedule', 'provider-availability'],
      expedix: ['complex-search', 'medical-history-analysis', 'prescription-generation'],
      resources: ['bulk-operations', 'template-processing', 'watermark-application'],
      clinimetrix: ['*'] // ClinimetrixPro always uses Django
    }

    const moduleOperations = djangoOperations[module as keyof typeof djangoOperations]
    if (!moduleOperations) return false
    
    return moduleOperations.includes('*') || moduleOperations.includes(operation)
  }

  /**
   * Get authorization header for authenticated requests
   */
  private async getAuthHeader(): Promise<string | null> {
    if (!this.useAuth) return null
    
    const { data: { session } } = await this.supabase.auth.getSession()
    if (session?.access_token) {
      return `Bearer ${session.access_token}`
    }
    return null
  }

  /**
   * Make a request via Django proxy
   */
  private async requestViaDjango(
    module: string, 
    request: ApiRequest
  ): Promise<ApiResponse> {
    try {
      const authHeader = await this.getAuthHeader()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...request.headers
      }

      if (authHeader) {
        headers['Authorization'] = authHeader
      }

      // Build URL with query parameters
      let url = `/api/${module}/django${request.endpoint}`
      if (request.params) {
        const searchParams = new URLSearchParams(request.params)
        url += `?${searchParams.toString()}`
      }

      const response = await fetch(url, {
        method: request.method,
        headers,
        ...(request.data && { body: JSON.stringify(request.data) })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('[HYBRID CLIENT] Django request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Make a request directly to Supabase
   */
  private async requestViaSupabase(
    table: string,
    request: ApiRequest
  ): Promise<ApiResponse> {
    try {
      let query: any;

      switch (request.method) {
        case 'GET':
          query = this.supabase.from(table).select('*')
          
          // Apply filters from params
          if (request.params) {
            Object.entries(request.params).forEach(([key, value]) => {
              if (key === 'search') {
                // Implement search logic
                query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`)
              } else if (key === 'limit') {
                query = query.limit(parseInt(value))
              } else if (key === 'offset') {
                query = query.range(parseInt(value), parseInt(value) + parseInt(request.params?.limit || '10') - 1)
              } else {
                query = query.eq(key, value)
              }
            })
          }
          break

        case 'POST':
          query = this.supabase.from(table).insert(request.data).select()
          break

        case 'PUT':
          const updateId = request.params?.id
          if (!updateId) throw new Error('ID required for PUT operation')
          query = this.supabase.from(table).update(request.data).eq('id', updateId).select()
          break

        case 'DELETE':
          const deleteId = request.params?.id
          if (!deleteId) throw new Error('ID required for DELETE operation')
          query = this.supabase.from(table).delete().eq('id', deleteId)
          break

        default:
          throw new Error(`Unsupported method: ${request.method}`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('[HYBRID CLIENT] Supabase request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Public API methods for each module
   */

  // Expedix API
  async expedix(operation: string, request: ApiRequest): Promise<ApiResponse> {
    if (this.shouldUseDjango('expedix', operation, request.data)) {
      return this.requestViaDjango('expedix', request)
    } else {
      return this.requestViaSupabase('patients', request)
    }
  }

  // Agenda API
  async agenda(operation: string, request: ApiRequest): Promise<ApiResponse> {
    if (this.shouldUseDjango('agenda', operation, request.data)) {
      return this.requestViaDjango('agenda', request)
    } else {
      return this.requestViaSupabase('appointments', request)
    }
  }

  // Resources API
  async resources(operation: string, request: ApiRequest): Promise<ApiResponse> {
    if (this.shouldUseDjango('resources', operation, request.data)) {
      return this.requestViaDjango('resources', request)
    } else {
      return this.requestViaSupabase('resources', request)
    }
  }

  // ClinimetrixPro API (always uses Django)
  async clinimetrix(operation: string, request: ApiRequest): Promise<ApiResponse> {
    return this.requestViaDjango('clinimetrix-pro', request)
  }

  /**
   * Convenience methods for common operations
   */

  // Get all patients (uses Supabase for speed)
  async getPatients(params?: Record<string, string>) {
    return this.expedix('list', {
      method: 'GET',
      endpoint: '',
      params
    })
  }

  // Get appointments for a provider (uses Supabase for speed)
  async getAppointments(params?: Record<string, string>) {
    return this.agenda('list', {
      method: 'GET',
      endpoint: '',
      params
    })
  }

  // Create appointment with conflict checking (uses Django)
  async createAppointmentWithValidation(appointmentData: any) {
    return this.agenda('schedule-conflict-check', {
      method: 'POST',
      endpoint: '/appointments/',
      data: appointmentData
    })
  }

  // Get resources with complex filtering (uses Django)
  async getResourcesAdvanced(filters: any) {
    return this.resources('complex-search', {
      method: 'POST',
      endpoint: '/search/',
      data: filters
    })
  }

  // Get ClinimetrixPro scales (always Django)
  async getScales(params?: Record<string, string>) {
    return this.clinimetrix('catalog', {
      method: 'GET',
      endpoint: '/scales/',
      params
    })
  }
}

// Factory function to create hybrid client
export function createHybridClient(config?: Partial<HybridClientConfig>): HybridApiClient {
  const defaultConfig: HybridClientConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    djangoApiUrl: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000',
    useAuth: true
  }

  return new HybridApiClient({ ...defaultConfig, ...config })
}

// Export types for external use
export type { HybridClientConfig, ApiRequest, ApiResponse }
export { HybridApiClient }