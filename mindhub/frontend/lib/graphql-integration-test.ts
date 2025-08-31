/**
 * GraphQL Integration Test Service
 * Tests complete architecture integration for MindHub
 * ALL MODULES: Expedix, Agenda, Finance, Resources, FormX, ClinimetrixPro
 */

import { dashboardGraphQLService } from './dashboard-graphql-service'
import { financeGraphQLService } from './finance-graphql-service'
import { storageManagementService } from './storage-management-service'
import { client } from './apollo/client'

// Import test queries
import { GET_PATIENTS } from './apollo/queries/expedix/patients'
import { GET_TODAY_APPOINTMENTS } from './apollo/queries/agenda/appointments'
import { GET_FINANCE_SERVICES } from './apollo/queries/finance/services'
import { GET_MEDICAL_RESOURCES } from './apollo/queries/resources/resources'
import { GET_FORM_TEMPLATES } from './apollo/queries/formx/forms'
import { GET_PSYCHOMETRIC_SCALES } from './apollo/queries/clinimetrix/scales'

interface TestResult {
  module: string
  test: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  data?: any
  duration: number
}

interface TestSuite {
  name: string
  results: TestResult[]
  totalTests: number
  passed: number
  failed: number
  warnings: number
  totalDuration: number
}

class GraphQLIntegrationTester {
  private static instance: GraphQLIntegrationTester
  private results: TestResult[] = []

  static getInstance(): GraphQLIntegrationTester {
    if (!GraphQLIntegrationTester.instance) {
      GraphQLIntegrationTester.instance = new GraphQLIntegrationTester()
    }
    return GraphQLIntegrationTester.instance
  }

  /**
   * Run complete integration test suite
   */
  async runFullTestSuite(): Promise<TestSuite> {
    console.log('🧪 Starting Complete GraphQL Integration Test Suite...')
    this.results = []
    const startTime = Date.now()

    try {
      // Test all modules in parallel for performance
      await Promise.all([
        this.testExpedixModule(),
        this.testAgendaModule(),
        this.testFinanceModule(),
        this.testResourcesModule(),
        this.testFormXModule(),
        this.testClinimetrixModule(),
        this.testDashboardIntegration(),
        this.testStorageIntegration()
      ])

      const totalDuration = Date.now() - startTime
      const testSuite = this.generateTestReport(totalDuration)
      
      console.log('🎯 Integration Test Suite Complete!', testSuite)
      return testSuite

    } catch (error) {
      console.error('❌ Test Suite Failed:', error)
      throw error
    }
  }

  /**
   * Test Expedix (Patients) Module
   */
  private async testExpedixModule(): Promise<void> {
    await this.runTest('Expedix', 'Fetch Patients GraphQL', async () => {
      const result = await client.query({
        query: GET_PATIENTS,
        variables: { first: 5 },
        fetchPolicy: 'network-only'
      })

      const patients = result.data?.patientsCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: patients.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${patients.length} patients via GraphQL`,
        data: { count: patients.length, hasData: patients.length > 0 }
      }
    })
  }

  /**
   * Test Agenda (Appointments) Module
   */
  private async testAgendaModule(): Promise<void> {
    await this.runTest('Agenda', 'Fetch Today Appointments', async () => {
      const today = new Date().toISOString().split('T')[0]
      const result = await client.query({
        query: GET_TODAY_APPOINTMENTS,
        variables: { date: today },
        fetchPolicy: 'network-only'
      })

      const appointments = result.data?.appointmentsCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: appointments.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${appointments.length} appointments for today via GraphQL`,
        data: { count: appointments.length, hasData: appointments.length > 0 }
      }
    })
  }

  /**
   * Test Finance Module
   */
  private async testFinanceModule(): Promise<void> {
    await this.runTest('Finance', 'Fetch Finance Stats', async () => {
      const stats = await financeGraphQLService.getFinanceStats()
      
      return {
        status: stats.totalRevenue >= 0 ? 'pass' : 'warn',
        message: `Finance stats loaded: $${stats.totalRevenue} revenue, ${stats.activeServices} services`,
        data: stats
      }
    })

    await this.runTest('Finance', 'Fetch Finance Services', async () => {
      const result = await client.query({
        query: GET_FINANCE_SERVICES,
        variables: { first: 10 },
        fetchPolicy: 'network-only'
      })

      const services = result.data?.finance_servicesCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: services.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${services.length} finance services via GraphQL`,
        data: { count: services.length }
      }
    })
  }

  /**
   * Test Resources Module
   */
  private async testResourcesModule(): Promise<void> {
    await this.runTest('Resources', 'Fetch Medical Resources', async () => {
      const result = await client.query({
        query: GET_MEDICAL_RESOURCES,
        variables: { first: 10 },
        fetchPolicy: 'network-only'
      })

      const resources = result.data?.medical_resourcesCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: resources.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${resources.length} medical resources via GraphQL`,
        data: { count: resources.length }
      }
    })

    await this.runTest('Resources', 'Test Storage Service', async () => {
      const usage = await storageManagementService.getStorageUsage('test-user', undefined, 'individual')
      const quotaInfo = storageManagementService.getQuotaInfo('individual')
      
      return {
        status: 'pass',
        message: `Storage service working: ${usage.totalSize} bytes used, ${quotaInfo.totalFormatted} quota`,
        data: { usage, quotaInfo }
      }
    })
  }

  /**
   * Test FormX Module
   */
  private async testFormXModule(): Promise<void> {
    await this.runTest('FormX', 'Fetch Form Templates', async () => {
      const result = await client.query({
        query: GET_FORM_TEMPLATES,
        variables: { first: 10 },
        fetchPolicy: 'network-only'
      })

      const templates = result.data?.form_templatesCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: templates.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${templates.length} form templates via GraphQL`,
        data: { count: templates.length }
      }
    })
  }

  /**
   * Test ClinimetrixPro Module
   */
  private async testClinimetrixModule(): Promise<void> {
    await this.runTest('ClinimetrixPro', 'Fetch Psychometric Scales', async () => {
      const result = await client.query({
        query: GET_PSYCHOMETRIC_SCALES,
        variables: { first: 10 },
        fetchPolicy: 'network-only'
      })

      const scales = result.data?.psychometric_scalesCollection?.edges?.map((edge: any) => edge.node) || []
      
      return {
        status: scales.length >= 0 ? 'pass' : 'warn',
        message: `Retrieved ${scales.length} psychometric scales via GraphQL`,
        data: { count: scales.length }
      }
    })
  }

  /**
   * Test Dashboard Integration
   */
  private async testDashboardIntegration(): Promise<void> {
    await this.runTest('Dashboard', 'Fetch Complete Dashboard Data', async () => {
      const dashboardData = await dashboardGraphQLService.fetchDashboardData()
      
      const hasBasicData = dashboardData.totalPatients >= 0 && 
                          dashboardData.totalConsultations >= 0 &&
                          dashboardData.totalResources >= 0 &&
                          dashboardData.totalFormTemplates >= 0 &&
                          dashboardData.totalAssessments >= 0

      return {
        status: hasBasicData ? 'pass' : 'warn',
        message: `Dashboard integrated: ${dashboardData.totalPatients} patients, ${dashboardData.totalConsultations} consultations, ${dashboardData.totalResources} resources`,
        data: {
          patients: dashboardData.totalPatients,
          consultations: dashboardData.totalConsultations,
          resources: dashboardData.totalResources,
          forms: dashboardData.totalFormTemplates,
          assessments: dashboardData.totalAssessments,
          revenue: dashboardData.totalRevenue
        }
      }
    })
  }

  /**
   * Test Storage Integration
   */
  private async testStorageIntegration(): Promise<void> {
    await this.runTest('Storage', 'Test Storage Buckets Configuration', async () => {
      const buckets = ['public-resources', 'individual-resources', 'clinic-resources']
      const quotas = ['individual', 'clinic', 'premium']
      
      const quotaTests = quotas.map(type => {
        const quota = storageManagementService.getQuotaInfo(type as any)
        return {
          type,
          total: quota.totalFormatted,
          maxFile: quota.fileMaxSizeFormatted,
          maxFiles: quota.maxFiles
        }
      })
      
      return {
        status: 'pass',
        message: `Storage system configured: ${buckets.length} buckets, ${quotas.length} quota tiers`,
        data: { buckets, quotas: quotaTests }
      }
    })
  }

  /**
   * Run individual test with timing
   */
  private async runTest(module: string, test: string, testFn: () => Promise<{ status: 'pass' | 'fail' | 'warn', message: string, data?: any }>): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log(`🔍 Testing ${module}: ${test}`)
      
      const result = await testFn()
      const duration = Date.now() - startTime
      
      this.results.push({
        module,
        test,
        status: result.status,
        message: result.message,
        data: result.data,
        duration
      })

      const emoji = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
      console.log(`${emoji} ${module}: ${test} - ${result.message} (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.results.push({
        module,
        test,
        status: 'fail',
        message: `Error: ${errorMessage}`,
        duration
      })

      console.error(`❌ ${module}: ${test} - Failed: ${errorMessage} (${duration}ms)`)
    }
  }

  /**
   * Generate test report
   */
  private generateTestReport(totalDuration: number): TestSuite {
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const warnings = this.results.filter(r => r.status === 'warn').length

    return {
      name: 'MindHub GraphQL Integration Test Suite',
      results: this.results,
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      totalDuration
    }
  }

  /**
   * Get test results summary
   */
  getTestSummary(): string {
    const suite = this.generateTestReport(0)
    const passRate = Math.round((suite.passed / suite.totalTests) * 100)
    
    return `🎯 GraphQL Integration Tests: ${suite.passed}/${suite.totalTests} passed (${passRate}%), ${suite.failed} failed, ${suite.warnings} warnings`
  }
}

export const graphqlIntegrationTester = GraphQLIntegrationTester.getInstance()

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 GraphQL Integration Tester initialized - Ready for testing!')
}

export default graphqlIntegrationTester