/**
 * Resources Hybrid Service - Django + GraphQL
 * Maintains ALL Django functionality while adding GraphQL support
 * NEVER removes existing functionality - only enhances it
 */

import { client } from './apollo/client'
import { GET_MEDICAL_RESOURCES } from './apollo/queries/resources/resources'
import { storageManagementService } from './storage-management-service'

export interface ResourceCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  count: number
  isPublic: boolean
}

export interface MedicalResource {
  id: string
  title: string
  description: string
  resourceType: string
  category: string
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number
  mimeType: string
  isPublic: boolean
  tags: string[]
  uploadedBy: string
  uploadedAt: string
  downloadCount: number
}

class ResourcesHybridService {
  private static instance: ResourcesHybridService

  static getInstance(): ResourcesHybridService {
    if (!ResourcesHybridService.instance) {
      ResourcesHybridService.instance = new ResourcesHybridService()
    }
    return ResourcesHybridService.instance
  }

  /**
   * ✅ HYBRID: Get categories via Django API (MANTENER FUNCIONALIDAD EXISTENTE)
   * + GraphQL como fallback
   */
  async getResourceCategories(): Promise<ResourceCategory[]> {
    try {
      console.log('📁 [Resources Hybrid] Getting categories - Django PRIMARY, GraphQL fallback')
      
      // 🔄 PRIMARY: Try Django API first (mantener funcionalidad existente)
      try {
        const response = await fetch('/api/resources/categories')
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Resources Hybrid] Categories loaded via Django API')
          return Array.isArray(data) ? data : data.categories || []
        }
      } catch (djangoError) {
        console.warn('⚠️ [Resources Hybrid] Django API failed, trying GraphQL:', djangoError)
      }

      // 🔄 FALLBACK: Try GraphQL if Django fails
      try {
        const result = await client.query({
          query: GET_MEDICAL_RESOURCES,
          variables: { first: 1000 },
          fetchPolicy: 'network-only'
        })

        const resources = result.data?.medical_resourcesCollection?.edges?.map((edge: any) => edge.node) || []
        
        // Generate categories from resources
        const categoryMap = new Map<string, ResourceCategory>()
        resources.forEach((resource: any) => {
          const category = resource.category || 'General'
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              id: category.toLowerCase().replace(/\s+/g, '-'),
              name: category,
              slug: category.toLowerCase().replace(/\s+/g, '-'),
              description: `Recursos de ${category}`,
              icon: 'DocumentTextIcon',
              count: 0,
              isPublic: true
            })
          }
          categoryMap.get(category)!.count++
        })

        const categories = Array.from(categoryMap.values())
        console.log('✅ [Resources Hybrid] Categories generated from GraphQL resources')
        return categories

      } catch (graphqlError) {
        console.error('❌ [Resources Hybrid] Both Django and GraphQL failed:', graphqlError)
        return this.getFallbackCategories()
      }

    } catch (error) {
      console.error('❌ [Resources Hybrid] Critical error in getResourceCategories:', error)
      return this.getFallbackCategories()
    }
  }

  /**
   * ✅ HYBRID: Get resources via GraphQL PRIMARY + Django fallback
   */
  async getResources(
    category?: string, 
    isPublic?: boolean, 
    searchQuery?: string
  ): Promise<MedicalResource[]> {
    try {
      console.log('📚 [Resources Hybrid] Getting resources - GraphQL PRIMARY, Django fallback')

      // 🔄 PRIMARY: Try GraphQL first for better performance
      try {
        const variables: any = { first: 100 }
        
        if (category || isPublic !== undefined) {
          variables.filter = {}
          if (category) {
            variables.filter.category = { eq: category }
          }
          if (isPublic !== undefined) {
            variables.filter.is_public = { eq: isPublic }
          }
        }

        const result = await client.query({
          query: GET_MEDICAL_RESOURCES,
          variables,
          fetchPolicy: 'network-only'
        })

        const resources = result.data?.medical_resourcesCollection?.edges?.map((edge: any) => edge.node) || []
        
        // Transform to expected format
        const transformedResources = resources.map((resource: any) => ({
          id: resource.id,
          title: resource.title,
          description: resource.description || '',
          resourceType: resource.resource_type || 'document',
          category: resource.category || 'General',
          fileUrl: resource.file_url || resource.url || '',
          thumbnailUrl: resource.thumbnail_url,
          fileSize: resource.file_size || 0,
          mimeType: resource.mime_type || 'application/octet-stream',
          isPublic: resource.is_public ?? true,
          tags: resource.tags ? JSON.parse(resource.tags) : [],
          uploadedBy: resource.uploaded_by || resource.created_by,
          uploadedAt: resource.created_at,
          downloadCount: resource.download_count || 0
        }))

        // Apply search filter if needed
        const filteredResources = searchQuery ? 
          transformedResources.filter((r: any) => 
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          ) : transformedResources

        console.log(`✅ [Resources Hybrid] ${filteredResources.length} resources loaded via GraphQL`)
        return filteredResources

      } catch (graphqlError) {
        console.warn('⚠️ [Resources Hybrid] GraphQL failed, trying Django API:', graphqlError)
      }

      // 🔄 FALLBACK: Try Django API if GraphQL fails
      try {
        const params = new URLSearchParams()
        if (category) params.append('category', category)
        if (isPublic !== undefined) params.append('is_public', isPublic.toString())
        if (searchQuery) params.append('search', searchQuery)

        const response = await fetch(`/api/resources?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Resources Hybrid] Resources loaded via Django API fallback')
          return Array.isArray(data) ? data : data.resources || []
        }
      } catch (djangoError) {
        console.error('❌ [Resources Hybrid] Both GraphQL and Django failed:', djangoError)
      }

      return []

    } catch (error) {
      console.error('❌ [Resources Hybrid] Critical error in getResources:', error)
      return []
    }
  }

  /**
   * ✅ DJANGO ONLY: Upload via Django API (MANTENER FUNCIONALIDAD COMPLETA)
   */
  async uploadResource(file: File, metadata: any): Promise<boolean> {
    try {
      console.log('⬆️ [Resources Hybrid] Uploading via Django API (full functionality)')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', metadata.title || file.name)
      formData.append('description', metadata.description || '')
      formData.append('category', metadata.category || 'General')
      formData.append('is_public', metadata.isPublic?.toString() || 'false')
      formData.append('tags', JSON.stringify(metadata.tags || []))

      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        console.log('✅ [Resources Hybrid] Resource uploaded successfully via Django')
        return true
      } else {
        console.error('❌ [Resources Hybrid] Upload failed:', response.status)
        return false
      }

    } catch (error) {
      console.error('❌ [Resources Hybrid] Upload error:', error)
      return false
    }
  }

  /**
   * ✅ STORAGE: Use Supabase Storage for file operations
   */
  async getStorageStats(): Promise<any> {
    try {
      return await storageManagementService.getStorageUsage('current-user', undefined, 'individual')
    } catch (error) {
      console.error('❌ [Resources Hybrid] Storage stats error:', error)
      return { totalSize: 0, fileCount: 0, quota: 0 }
    }
  }

  /**
   * Fallback categories when all else fails
   */
  private getFallbackCategories(): ResourceCategory[] {
    return [
      {
        id: 'psicoeducacion',
        name: 'Psicoeducación',
        slug: 'psicoeducacion',
        description: 'Materiales educativos para pacientes',
        icon: 'BookOpenIcon',
        count: 0,
        isPublic: true
      },
      {
        id: 'evaluaciones',
        name: 'Evaluaciones',
        slug: 'evaluaciones',
        description: 'Formularios y escalas de evaluación',
        icon: 'DocumentTextIcon',
        count: 0,
        isPublic: false
      },
      {
        id: 'plantillas',
        name: 'Plantillas',
        slug: 'plantillas',
        description: 'Plantillas para documentos médicos',
        icon: 'FolderIcon',
        count: 0,
        isPublic: false
      },
      {
        id: 'general',
        name: 'General',
        slug: 'general',
        description: 'Recursos generales',
        icon: 'DocumentTextIcon',
        count: 0,
        isPublic: true
      }
    ]
  }
}

export const resourcesHybridService = ResourcesHybridService.getInstance()

console.log('🔄 Resources Hybrid Service initialized - Django PRIMARY + GraphQL fallback!')

export default resourcesHybridService