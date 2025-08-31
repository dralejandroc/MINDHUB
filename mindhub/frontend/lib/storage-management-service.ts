/**
 * Storage Management Service for MindHub Resources
 * Handles Supabase Storage integration with quota management
 */

import { createClient } from '@/lib/supabase/client'

// Storage quotas configuration
export const STORAGE_QUOTAS = {
  individual: {
    total: 500 * 1024 * 1024,      // 500 MB
    fileMaxSize: 10 * 1024 * 1024, // 10 MB per file
    maxFiles: 100
  },
  clinic: {
    total: 5 * 1024 * 1024 * 1024,   // 5 GB
    fileMaxSize: 50 * 1024 * 1024,   // 50 MB per file  
    maxFiles: 1000
  },
  premium: {
    total: 20 * 1024 * 1024 * 1024,  // 20 GB
    fileMaxSize: 100 * 1024 * 1024,  // 100 MB per file
    maxFiles: 5000
  }
} as const

// Bucket configuration
export const STORAGE_BUCKETS = {
  PUBLIC: 'public-resources',
  INDIVIDUAL: 'individual-resources', 
  CLINIC: 'clinic-resources'
} as const

// File categories for organization
export const RESOURCE_CATEGORIES = {
  DOCUMENTS: 'documents',
  IMAGES: 'images', 
  VIDEOS: 'videos',
  TEMPLATES: 'templates',
  BRANDING: 'branding',
  PROTOCOLS: 'protocols',
  PSYCHOEDUCATIONAL: 'psychoeducational',
  UPLOADS: 'uploads'
} as const

export type UserType = 'individual' | 'clinic' | 'premium'
export type BucketType = keyof typeof STORAGE_BUCKETS
export type CategoryType = keyof typeof RESOURCE_CATEGORIES

interface UploadOptions {
  userId: string
  clinicId?: string
  workspaceId?: string
  userType: UserType
  category: CategoryType
  bucketType: BucketType
  file: File
  customPath?: string
}

interface StorageUsage {
  totalSize: number
  fileCount: number
  quota: typeof STORAGE_QUOTAS.individual
  usage: {
    percentage: number
    remaining: number
  }
}

class StorageManagementService {
  private static instance: StorageManagementService
  private supabase = createClient()

  static getInstance(): StorageManagementService {
    if (!StorageManagementService.instance) {
      StorageManagementService.instance = new StorageManagementService()
    }
    return StorageManagementService.instance
  }

  /**
   * Generate file path based on bucket type and user context
   */
  private generateFilePath(options: UploadOptions): string {
    const { userId, clinicId, category, bucketType, file } = options
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const fileName = `${timestamp}.${fileExt}`

    switch (bucketType) {
      case 'PUBLIC':
        return `${RESOURCE_CATEGORIES[category]}/${fileName}`
        
      case 'INDIVIDUAL':
        return `${userId}/${RESOURCE_CATEGORIES[category]}/${fileName}`
        
      case 'CLINIC':
        return `${clinicId}/${RESOURCE_CATEGORIES[category]}/${fileName}`
        
      default:
        throw new Error(`Invalid bucket type: ${bucketType}`)
    }
  }

  /**
   * Check if user can upload file based on quotas
   */
  async canUploadFile(options: UploadOptions): Promise<{
    canUpload: boolean
    reason?: string
    usage?: StorageUsage
  }> {
    const { file, userType, userId, clinicId } = options
    const quota = STORAGE_QUOTAS[userType]

    // Check file size
    if (file.size > quota.fileMaxSize) {
      return {
        canUpload: false,
        reason: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed (${this.formatFileSize(quota.fileMaxSize)})`
      }
    }

    // Get current usage
    const usage = await this.getStorageUsage(userId, clinicId, userType)
    
    // Check total quota
    if (usage.totalSize + file.size > quota.total) {
      return {
        canUpload: false,
        reason: `Upload would exceed storage quota (${this.formatFileSize(quota.total)})`,
        usage
      }
    }

    // Check file count
    if (usage.fileCount >= quota.maxFiles) {
      return {
        canUpload: false,
        reason: `Maximum number of files (${quota.maxFiles}) reached`,
        usage
      }
    }

    return { canUpload: true, usage }
  }

  /**
   * Upload file to appropriate bucket
   */
  async uploadFile(options: UploadOptions): Promise<{
    success: boolean
    filePath?: string
    publicUrl?: string
    error?: string
  }> {
    try {
      // Check if upload is allowed
      const canUpload = await this.canUploadFile(options)
      if (!canUpload.canUpload) {
        return {
          success: false,
          error: canUpload.reason
        }
      }

      const filePath = options.customPath || this.generateFilePath(options)
      const bucket = STORAGE_BUCKETS[options.bucketType]

      console.log(`🚀 [Storage] Uploading to bucket: ${bucket}, path: ${filePath}`)

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, options.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ [Storage] Upload error:', error)
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        }
      }

      // Get public URL for public resources
      let publicUrl: string | undefined
      if (options.bucketType === 'PUBLIC') {
        const { data: urlData } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)
        publicUrl = urlData.publicUrl
      }

      console.log('✅ [Storage] File uploaded successfully:', data.path)

      return {
        success: true,
        filePath: data.path,
        publicUrl
      }

    } catch (error) {
      console.error('❌ [Storage] Unexpected upload error:', error)
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get storage usage for user/clinic
   */
  async getStorageUsage(userId: string, clinicId?: string, userType: UserType = 'individual'): Promise<StorageUsage> {
    try {
      let totalSize = 0
      let fileCount = 0
      const quota = STORAGE_QUOTAS[userType]

      // Individual resources
      if (userType === 'individual') {
        const { data: individualFiles } = await this.supabase.storage
          .from(STORAGE_BUCKETS.INDIVIDUAL)
          .list(`${userId}`, { limit: 1000 })

        if (individualFiles) {
          totalSize += individualFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
          fileCount += individualFiles.length
        }
      }

      // Clinic resources (if applicable)
      if (userType === 'clinic' && clinicId) {
        const { data: clinicFiles } = await this.supabase.storage
          .from(STORAGE_BUCKETS.CLINIC)
          .list(`${clinicId}`, { limit: 1000 })

        if (clinicFiles) {
          totalSize += clinicFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
          fileCount += clinicFiles.length
        }
      }

      const usagePercentage = Math.round((totalSize / quota.total) * 100)
      const remaining = quota.total - totalSize

      return {
        totalSize,
        fileCount,
        quota,
        usage: {
          percentage: usagePercentage,
          remaining: Math.max(0, remaining)
        }
      }

    } catch (error) {
      console.error('❌ [Storage] Error getting usage:', error)
      return {
        totalSize: 0,
        fileCount: 0,
        quota: STORAGE_QUOTAS[userType],
        usage: { percentage: 0, remaining: STORAGE_QUOTAS[userType].total }
      }
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucketType: BucketType, filePath: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const bucket = STORAGE_BUCKETS[bucketType]
      
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        }
      }

      console.log('✅ [Storage] File deleted successfully:', filePath)
      return { success: true }

    } catch (error) {
      console.error('❌ [Storage] Delete error:', error)
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get signed URL for private resources
   */
  async getSignedUrl(bucketType: BucketType, filePath: string, expiresIn: number = 3600): Promise<{
    success: boolean
    signedUrl?: string
    error?: string
  }> {
    try {
      const bucket = STORAGE_BUCKETS[bucketType]
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        return {
          success: false,
          error: `Failed to get signed URL: ${error.message}`
        }
      }

      return {
        success: true,
        signedUrl: data.signedUrl
      }

    } catch (error) {
      console.error('❌ [Storage] Signed URL error:', error)
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Format file size for human readable display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
  }

  /**
   * Get quota information for user type
   */
  getQuotaInfo(userType: UserType) {
    const quota = STORAGE_QUOTAS[userType]
    return {
      ...quota,
      totalFormatted: this.formatFileSize(quota.total),
      fileMaxSizeFormatted: this.formatFileSize(quota.fileMaxSize)
    }
  }
}

export const storageManagementService = StorageManagementService.getInstance()

// Log service initialization
console.log('🚀 Storage Management Service initialized with quotas:', STORAGE_QUOTAS)