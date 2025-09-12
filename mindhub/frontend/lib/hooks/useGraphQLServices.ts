/**
 * React Hooks for GraphQL Services
 * Complete Clean Architecture implementation for MindHub
 * ALL MODULES: Expedix, Agenda, Finance, Resources, FormX, ClinimetrixPro
 */

import { useState, useEffect, useCallback } from 'react'
import { dashboardGraphQLService, type DashboardData } from '../dashboard-graphql-service'
import { financeGraphQLService, type FinanceStats } from '../finance-graphql-service'
import { storageManagementService, type StorageUsage, type UserType } from '../storage-management-service'
import { client } from '../apollo/client'

// Import all GraphQL queries
import { GET_PATIENTS, GET_PATIENT_BY_ID, SEARCH_PATIENTS } from '../apollo/queries/expedix/patients'
import { GET_APPOINTMENTS, GET_TODAY_APPOINTMENTS, GET_APPOINTMENTS_BY_DATE_RANGE } from '../apollo/queries/agenda/appointments'
import { GET_FORM_TEMPLATES, GET_FORM_SUBMISSIONS, GET_FORM_SUBMISSIONS_BY_PATIENT } from '../apollo/queries/formx/forms'
import { GET_ASSESSMENTS, GET_ASSESSMENTS_BY_PATIENT, GET_IN_PROGRESS_ASSESSMENTS } from '../apollo/queries/clinimetrix/assessments'
import { GET_PSYCHOMETRIC_SCALES, GET_ACTIVE_SCALES_BY_CATEGORY, GET_SCALE_WITH_ITEMS } from '../apollo/queries/clinimetrix/scales'
import { GET_MEDICAL_RESOURCES, GET_PUBLIC_RESOURCES, GET_INDIVIDUAL_RESOURCES } from '../apollo/queries/resources/resources'

// Import mutations
import { CREATE_PATIENT, UPDATE_PATIENT } from '../apollo/mutations/expedix/patients'
import { CREATE_ASSESSMENT, START_ASSESSMENT, COMPLETE_ASSESSMENT } from '../apollo/mutations/clinimetrix/assessments'
import { CREATE_FORM_SUBMISSION, MARK_SUBMISSION_AS_PROCESSED } from '../apollo/mutations/formx/forms'

// Dashboard Hook
export function useDashboardData(autoRefresh = true, refreshInterval = 5 * 60 * 1000) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await dashboardGraphQLService.fetchDashboardData()
      setData(dashboardData)
    } catch (err) {
      console.error('❌ [Hook] Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const forceRefresh = useCallback(async () => {
    dashboardGraphQLService.invalidateCache()
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    forceRefresh
  }
}

// Finance Hook
export function useFinanceStats(clinicId?: string, workspaceId?: string) {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const financeStats = await financeGraphQLService.getFinanceStats(clinicId, workspaceId)
      setStats(financeStats)
    } catch (err) {
      console.error('❌ [Hook] Finance stats fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [clinicId, workspaceId])

  const forceRefresh = useCallback(async () => {
    return await financeGraphQLService.forceRefresh(clinicId, workspaceId)
  }, [clinicId, workspaceId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
    forceRefresh
  }
}

// Storage Hook
export function useStorageUsage(
  userId: string, 
  clinicId?: string, 
  userType: UserType = 'individual'
) {
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const storageUsage = await storageManagementService.getStorageUsage(userId, clinicId, userType)
      setUsage(storageUsage)
    } catch (err) {
      console.error('❌ [Hook] Storage usage fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [userId, clinicId, userType])

  const getQuotaInfo = useCallback(() => {
    return storageManagementService.getQuotaInfo(userType)
  }, [userType])

  useEffect(() => {
    if (userId) {
      fetchUsage()
    }
  }, [fetchUsage, userId])

  return {
    usage,
    loading,
    error,
    refresh: fetchUsage,
    quotaInfo: getQuotaInfo()
  }
}

// File Upload Hook
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (
    file: File,
    options: {
      userId: string
      clinicId?: string
      workspaceId?: string
      userType: UserType
      category: string
      bucketType: 'PUBLIC' | 'INDIVIDUAL' | 'CLINIC'
    }
  ) => {
    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)

      // Check if upload is allowed
      const canUpload = await storageManagementService.canUploadFile({
        ...options,
        file,
        category: options.category as any
      })

      if (!canUpload.canUpload) {
        throw new Error(canUpload.reason)
      }

      setUploadProgress(25)

      // Upload file
      const result = await storageManagementService.uploadFile({
        ...options,
        file,
        category: options.category as any
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setUploadProgress(100)

      return {
        success: true,
        filePath: result.filePath,
        publicUrl: result.publicUrl
      }

    } catch (err) {
      console.error('❌ [Hook] File upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  return {
    uploadFile,
    uploading,
    uploadProgress,
    error
  }
}

// Combined Dashboard Hook with Finance Integration
export function useEnhancedDashboard(
  userId?: string,
  clinicId?: string,
  workspaceId?: string,
  userType: UserType = 'individual'
) {
  const dashboard = useDashboardData(true, 5 * 60 * 1000) // 5 minutes
  const finance = useFinanceStats(clinicId, workspaceId)
  const storage = useStorageUsage(userId || '', clinicId, userType)

  const isLoading = dashboard.loading || finance.loading || storage.loading
  const hasError = dashboard.error || finance.error || storage.error

  const refreshAll = useCallback(async () => {
    await Promise.all([
      dashboard.forceRefresh(),
      finance.forceRefresh(),
      storage.refresh()
    ])
  }, [dashboard.forceRefresh, finance.forceRefresh, storage.refresh])

  return {
    dashboard: dashboard.data,
    finance: finance.stats,
    storage: storage.usage,
    storageQuota: storage.quotaInfo,
    loading: isLoading,
    error: hasError,
    refreshAll,
    refreshDashboard: dashboard.forceRefresh,
    refreshFinance: finance.forceRefresh,
    refreshStorage: storage.refresh
  }
}

// EXPEDIX MODULE HOOKS
export function usePatients(searchText?: string, userId?: string, isClinic?: boolean) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = searchText ? SEARCH_PATIENTS : GET_PATIENTS
      const variables = searchText 
        ? { searchText: `%${searchText}%`, first: 50 }
        : { 
            filter: {
              or: [
                isClinic ? { clinic_id: { eq: true } } : {},
                userId ? { user_id: { eq: userId } } : {}
              ]
            },
            first: 100
          }

      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })

      const patientsData = result.data?.patientsCollection?.edges?.map((edge: any) => edge.node) || []
      setPatients(patientsData)
    } catch (err) {
      console.error('❌ [Hook] Patients fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [searchText, clinicId, workspaceId])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const createPatient = useCallback(async (patientData: any) => {
    try {
      const result = await client.mutate({
        mutation: CREATE_PATIENT,
        variables: { input: patientData }
      })
      
      await fetchPatients() // Refresh list
      return result.data?.insertIntopatientsCollection?.records?.[0]
    } catch (err) {
      console.error('❌ [Hook] Create patient error:', err)
      throw err
    }
  }, [fetchPatients])

  return {
    patients,
    loading,
    error,
    refresh: fetchPatients,
    createPatient
  }
}

// CLINIMETRIX MODULE HOOKS
export function useAssessments(patientId?: string, evaluatorId?: string) {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = patientId ? GET_ASSESSMENTS_BY_PATIENT : GET_ASSESSMENTS
      const variables = patientId 
        ? { patientId, first: 50 }
        : { 
            filter: evaluatorId ? { evaluator: { eq: evaluatorId } } : {},
            first: 100
          }

      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })

      const assessmentsData = result.data?.assessmentsCollection?.edges?.map((edge: any) => edge.node) || []
      setAssessments(assessmentsData)
    } catch (err) {
      console.error('❌ [Hook] Assessments fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [patientId, evaluatorId])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  const createAssessment = useCallback(async (assessmentData: any) => {
    try {
      const result = await client.mutate({
        mutation: CREATE_ASSESSMENT,
        variables: { input: assessmentData }
      })
      
      await fetchAssessments()
      return result.data?.insertIntoassessmentsCollection?.records?.[0]
    } catch (err) {
      console.error('❌ [Hook] Create assessment error:', err)
      throw err
    }
  }, [fetchAssessments])

  const startAssessment = useCallback(async (assessmentId: string) => {
    try {
      const result = await client.mutate({
        mutation: START_ASSESSMENT,
        variables: { id: assessmentId }
      })
      
      await fetchAssessments()
      return result.data?.updateassessmentsCollection?.records?.[0]
    } catch (err) {
      console.error('❌ [Hook] Start assessment error:', err)
      throw err
    }
  }, [fetchAssessments])

  return {
    assessments,
    loading,
    error,
    refresh: fetchAssessments,
    createAssessment,
    startAssessment
  }
}

// FORMX MODULE HOOKS
export function useFormSubmissions(patientId?: string, templateId?: string) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = patientId ? GET_FORM_SUBMISSIONS_BY_PATIENT : GET_FORM_SUBMISSIONS
      const variables = patientId 
        ? { patientId, first: 50 }
        : { 
            filter: templateId ? { template_id: { eq: templateId } } : {},
            first: 100
          }

      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })

      const submissionsData = result.data?.form_submissionsCollection?.edges?.map((edge: any) => edge.node) || []
      setSubmissions(submissionsData)
    } catch (err) {
      console.error('❌ [Hook] Form submissions fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [patientId, templateId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const createSubmission = useCallback(async (submissionData: any) => {
    try {
      const result = await client.mutate({
        mutation: CREATE_FORM_SUBMISSION,
        variables: { input: submissionData }
      })
      
      await fetchSubmissions()
      return result.data?.insertIntoform_submissionsCollection?.records?.[0]
    } catch (err) {
      console.error('❌ [Hook] Create form submission error:', err)
      throw err
    }
  }, [fetchSubmissions])

  const markAsProcessed = useCallback(async (submissionId: string, notes?: string) => {
    try {
      const result = await client.mutate({
        mutation: MARK_SUBMISSION_AS_PROCESSED,
        variables: { id: submissionId, notes }
      })
      
      await fetchSubmissions()
      return result.data?.updateform_submissionsCollection?.records?.[0]
    } catch (err) {
      console.error('❌ [Hook] Mark submission processed error:', err)
      throw err
    }
  }, [fetchSubmissions])

  return {
    submissions,
    loading,
    error,
    refresh: fetchSubmissions,
    createSubmission,
    markAsProcessed
  }
}

// SCALES MODULE HOOKS
export function useScales(category?: string, language = 'es') {
  const [scales, setScales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScales = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = category ? GET_ACTIVE_SCALES_BY_CATEGORY : GET_PSYCHOMETRIC_SCALES
      const variables = category 
        ? { category, language }
        : { 
            filter: { 
              and: [
                { is_active: { eq: true } },
                { language: { eq: language } }
              ]
            },
            first: 100
          }

      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })

      const scalesData = result.data?.psychometric_scalesCollection?.edges?.map((edge: any) => edge.node) || []
      setScales(scalesData)
    } catch (err) {
      console.error('❌ [Hook] Scales fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [category, language])

  useEffect(() => {
    fetchScales()
  }, [fetchScales])

  const getScaleWithItems = useCallback(async (scaleId: string) => {
    try {
      const result = await client.query({
        query: GET_SCALE_WITH_ITEMS,
        variables: { id: scaleId },
        fetchPolicy: 'network-only'
      })

      return result.data?.psychometric_scalesCollection?.edges?.[0]?.node
    } catch (err) {
      console.error('❌ [Hook] Get scale with items error:', err)
      throw err
    }
  }, [])

  return {
    scales,
    loading,
    error,
    refresh: fetchScales,
    getScaleWithItems
  }
}

// RESOURCES MODULE HOOKS
export function useResources(
  type: 'public' | 'individual' | 'clinic' = 'public',
  userId?: string,
  clinicId?: string,
  category?: string
) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query, variables

      switch (type) {
        case 'public':
          query = GET_PUBLIC_RESOURCES
          variables = { category, searchText: category ? `%${category}%` : undefined }
          break
        case 'individual':
          query = GET_INDIVIDUAL_RESOURCES
          variables = { userId, category }
          break
        case 'clinic':
          query = GET_MEDICAL_RESOURCES
          variables = { 
            filter: {
              and: [
                { clinic_id: { eq: clinicId } },
                { category: { eq: category } },
                { is_active: { eq: true } }
              ]
            },
            first: 100
          }
          break
        default:
          query = GET_MEDICAL_RESOURCES
          variables = { first: 100 }
      }

      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })

      const resourcesData = result.data?.medical_resourcesCollection?.edges?.map((edge: any) => edge.node) || []
      setResources(resourcesData)
    } catch (err) {
      console.error('❌ [Hook] Resources fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [type, userId, clinicId, category])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  return {
    resources,
    loading,
    error,
    refresh: fetchResources
  }
}

// MASTER HOOK - All modules integrated
export function useMindHubComplete(
  userId?: string,
  clinicId?: string,
  workspaceId?: string,
  userType: UserType = 'individual'
) {
  const dashboard = useDashboardData(true, 5 * 60 * 1000)
  const finance = useFinanceStats(clinicId, workspaceId)
  const storage = useStorageUsage(userId || '', clinicId, userType)
  const patients = usePatients(undefined, clinicId, workspaceId)
  const assessments = useAssessments(undefined, userId)
  const formSubmissions = useFormSubmissions()
  const scales = useScales()
  const resources = useResources('public')

  const isLoading = dashboard.loading || finance.loading || storage.loading || 
                   patients.loading || assessments.loading || formSubmissions.loading || 
                   scales.loading || resources.loading

  const hasError = dashboard.error || finance.error || storage.error || 
                  patients.error || assessments.error || formSubmissions.error || 
                  scales.error || resources.error

  const refreshAll = useCallback(async () => {
    await Promise.all([
      dashboard.forceRefresh(),
      finance.forceRefresh(),
      storage.refresh(),
      patients.refresh(),
      assessments.refresh(),
      formSubmissions.refresh(),
      scales.refresh(),
      resources.refresh()
    ])
  }, [dashboard.forceRefresh, finance.forceRefresh, storage.refresh, 
      patients.refresh, assessments.refresh, formSubmissions.refresh,
      scales.refresh, resources.refresh])

  return {
    // Dashboard data
    dashboard: dashboard.data,
    finance: finance.stats,
    storage: storage.usage,
    storageQuota: storage.quotaInfo,
    
    // Module data
    patients: patients.patients,
    assessments: assessments.assessments,
    formSubmissions: formSubmissions.submissions,
    scales: scales.scales,
    resources: resources.resources,
    
    // State
    loading: isLoading,
    error: hasError,
    
    // Actions
    refreshAll,
    
    // Module actions
    createPatient: patients.createPatient,
    createAssessment: assessments.createAssessment,
    startAssessment: assessments.startAssessment,
    createFormSubmission: formSubmissions.createSubmission,
    getScaleWithItems: scales.getScaleWithItems
  }
}

// Log hooks initialization
console.log('🪝 Complete GraphQL Service Hooks initialized - ALL MODULES READY! ✅')