/**
 * NUEVO Dashboard GraphQL Service - VERSIÓN DEFINITIVA
 * 100% GraphQL, 0% REST APIs rotos
 * Creado para eliminar definitivamente los errores 401
 */

import { GET_PATIENTS } from './apollo/queries/expedix/patients';
import { GET_TODAY_APPOINTMENTS } from './apollo/queries/agenda/appointments';
import { GET_MEDICAL_RESOURCES } from './apollo/queries/resources/resources';
import { GET_FORM_TEMPLATES, GET_FORM_SUBMISSIONS } from './apollo/queries/formx/forms';
import { GET_ASSESSMENTS, GET_ASSESSMENT_STATISTICS } from './apollo/queries/clinimetrix/assessments';
import { GET_PSYCHOMETRIC_SCALES } from './apollo/queries/clinimetrix/scales';
import { client } from './apollo/client';
import { financeGraphQLService } from './finance-graphql-service';
import type { 
  GetPatientsQuery, 
  GetPatientsQueryVariables, 
  GetTodayAppointmentsQuery, 
  GetTodayAppointmentsQueryVariables, 
  GetMedicalResourcesQuery,
  GetFormTemplatesQuery,
  GetFormSubmissionsQuery,
  GetAssessmentsQuery,
  GetPsychometricScalesQuery 
} from './apollo/types/generated';

export interface DashboardData {
  totalPatients: number;
  totalConsultations: number;
  totalScaleApplications: number;
  totalFormInstances: number;
  totalResources: number;
  // Finance data (GraphQL integration)
  totalRevenue: number;
  todayIncome: number;
  pendingPayments: number;
  activeServices: number;
  // FormX data (GraphQL integration)
  totalFormTemplates: number;
  totalFormSubmissions: number;
  pendingFormSubmissions: number;
  // ClinimetrixPro data (GraphQL integration)
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  totalScales: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  weeklyStats: {
    patients: number;
    consultations: number;
    assessments: number;
    alerts: number;
    revenue: number;
    formSubmissions: number;
    resourcesUploaded: number;
  };
  monthlyGrowth: {
    patients: number;
    assessments: number;
    consultations: number;
    revenue: number;
    formSubmissions: number;
    resources: number;
  };
}

class DashboardGraphQLService {
  private static instance: DashboardGraphQLService;
  private cachedData: DashboardData | null = null;
  private lastFetch: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DashboardGraphQLService {
    if (!DashboardGraphQLService.instance) {
      DashboardGraphQLService.instance = new DashboardGraphQLService();
    }
    return DashboardGraphQLService.instance;
  }

  async fetchDashboardData(): Promise<DashboardData> {
    const now = Date.now();
    if (this.cachedData && (now - this.lastFetch) < this.cacheTimeout) {
      console.log('✅ [GraphQL Dashboard] Returning cached data, age:', (now - this.lastFetch), 'ms');
      return this.cachedData;
    }

    try {
      console.log('🚀 [GraphQL Dashboard] Fetching data via GraphQL - NO MORE REST APIs!');
      
      const [patients, appointments, resources, financeStats, formData, assessmentData, scalesData] = await Promise.all([
        this.fetchPatientsGraphQL(),
        this.fetchAppointmentsGraphQL(),
        this.fetchResourcesGraphQL(),
        this.fetchFinanceStatsGraphQL(),
        this.fetchFormXDataGraphQL(),
        this.fetchAssessmentsDataGraphQL(),
        this.fetchScalesDataGraphQL()
      ]);

      const totalPatients = patients.length;
      const totalConsultations = appointments.length;
      const totalScaleApplications = assessmentData.totalAssessments;
      const totalFormInstances = formData.totalSubmissions; 
      const totalResources = resources.length;

      console.log('📊 [GraphQL Dashboard] Data loaded successfully:', {
        patients: totalPatients,
        consultations: totalConsultations,
        resources: totalResources,
        revenue: financeStats.totalRevenue,
        assessments: totalScaleApplications,
        forms: totalFormInstances,
        scales: scalesData.totalScales,
        source: 'GraphQL ✅'
      });

      // Calculate weekly stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyConsultations = appointments.filter((c: any) => 
        new Date(c.appointment_date || c.created_at) >= oneWeekAgo
      ).length;

      const recentActivity = this.generateRecentActivity(patients, appointments, resources, financeStats, formData, assessmentData);
      const monthlyGrowth = this.calculateMonthlyGrowth(patients, appointments, formData, assessmentData);

      const dashboardData: DashboardData = {
        totalPatients,
        totalConsultations,
        totalScaleApplications,
        totalFormInstances,
        totalResources,
        // Finance integration
        totalRevenue: financeStats.totalRevenue,
        todayIncome: financeStats.todayIncome,
        pendingPayments: financeStats.pendingPayments,
        activeServices: financeStats.activeServices,
        // FormX integration
        totalFormTemplates: formData.totalTemplates,
        totalFormSubmissions: formData.totalSubmissions,
        pendingFormSubmissions: formData.pendingSubmissions,
        // ClinimetrixPro integration
        totalAssessments: assessmentData.totalAssessments,
        completedAssessments: assessmentData.completedAssessments,
        inProgressAssessments: assessmentData.inProgressAssessments,
        totalScales: scalesData.totalScales,
        recentActivity,
        weeklyStats: {
          patients: totalPatients,
          consultations: weeklyConsultations,
          assessments: assessmentData.weeklyAssessments,
          alerts: 0,
          revenue: financeStats.weeklyRevenue,
          formSubmissions: formData.weeklySubmissions,
          resourcesUploaded: resources.filter((r: any) => new Date(r.created_at) >= oneWeekAgo).length
        },
        monthlyGrowth
      };

      this.cachedData = dashboardData;
      this.lastFetch = now;

      console.log('🎉 [GraphQL Dashboard] Data fetched successfully via GraphQL!');
      return dashboardData;

    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error:', error);
      
      // Return empty data on error but with clear indication it's from GraphQL service
      return {
        totalPatients: 0,
        totalConsultations: 0,
        totalScaleApplications: 0,
        totalFormInstances: 0,
        totalResources: 0,
        totalRevenue: 0,
        todayIncome: 0,
        pendingPayments: 0,
        activeServices: 0,
        recentActivity: [{
          type: 'error',
          description: '⚠️ GraphQL Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
          timestamp: new Date().toISOString()
        }],
        weeklyStats: { patients: 0, consultations: 0, assessments: 0, alerts: 0, revenue: 0 },
        monthlyGrowth: { patients: 0, assessments: 0, consultations: 0, revenue: 0 }
      };
    }
  }

  private async fetchPatientsGraphQL(): Promise<any[]> {
    try {
      console.log('👥 [GraphQL Dashboard] Fetching patients via GraphQL...');
      
      // Remove filter temporarily to see ALL patients
      const result = await client.query<GetPatientsQuery, GetPatientsQueryVariables>({
        query: GET_PATIENTS,
        variables: {
          first: 100
          // REMOVED filter to see ALL patients: filter: { is_active: { eq: true } }
        },
        fetchPolicy: 'network-only', // Always get fresh data for dashboard
        errorPolicy: 'all'
      });

      console.log('📦 [GraphQL Dashboard] Raw result:', result);
      const patients = result.data?.patientsCollection?.edges?.map(edge => edge.node) || [];
      console.log('✅ [GraphQL Dashboard] Patients loaded via GraphQL:', patients.length);
      console.log('🔍 [GraphQL Dashboard] First patient (if any):', patients[0]);
      
      return patients;
    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching patients via GraphQL:', error);
      throw new Error(`GraphQL Patients Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchAppointmentsGraphQL(): Promise<any[]> {
    try {
      console.log('📅 [GraphQL Dashboard] Fetching appointments via GraphQL...');
      
      const today = new Date().toISOString().split('T')[0];
      const result = await client.query<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>({
        query: GET_TODAY_APPOINTMENTS,
        variables: { date: today },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });

      const appointments = result.data?.appointmentsCollection?.edges?.map(edge => edge.node) || [];
      console.log('✅ [GraphQL Dashboard] Appointments loaded via GraphQL:', appointments.length);
      
      return appointments;
    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching appointments via GraphQL:', error);
      // Return empty array instead of throwing to allow patients data to still work
      console.warn('⚠️ [GraphQL Dashboard] Appointments failed, continuing with empty array');
      return [];
    }
  }

  private async fetchResourcesGraphQL(): Promise<any[]> {
    try {
      console.log('📁 [GraphQL Dashboard] Fetching resources via GraphQL...');
      
      const result = await client.query<GetMedicalResourcesQuery>({
        query: GET_MEDICAL_RESOURCES,
        variables: {
          first: 50,
          filter: { is_active: { eq: true } }
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });

      const resources = result.data?.medical_resourcesCollection?.edges?.map(edge => edge.node) || [];
      console.log('✅ [GraphQL Dashboard] Resources loaded via GraphQL:', resources.length);
      
      return resources;
    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching resources via GraphQL:', error);
      console.warn('⚠️ [GraphQL Dashboard] Resources failed, continuing with empty array');
      return [];
    }
  }

  private async fetchFinanceStatsGraphQL(): Promise<any> {
    try {
      console.log('💰 [GraphQL Dashboard] Fetching finance stats via GraphQL...');
      
      // Get current context for clinic/workspace
      const financeStats = await financeGraphQLService.getFinanceStats();
      console.log('✅ [GraphQL Dashboard] Finance stats loaded via GraphQL:', financeStats);
      
      return financeStats;
    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching finance stats via GraphQL:', error);
      console.warn('⚠️ [GraphQL Dashboard] Finance stats failed, using default values');
      return {
        totalRevenue: 0,
        todayIncome: 0,
        pendingPayments: 0,
        activeServices: 0,
        weeklyRevenue: 0
      };
    }
  }

  private async fetchFormXDataGraphQL(): Promise<any> {
    try {
      console.log('📝 [GraphQL Dashboard] Fetching FormX data via GraphQL...');
      
      const [templates, submissions] = await Promise.all([
        client.query({
          query: GET_FORM_TEMPLATES,
          variables: { filter: { is_active: { eq: true } }, first: 1000 },
          fetchPolicy: 'network-only'
        }),
        client.query({
          query: GET_FORM_SUBMISSIONS,
          variables: { first: 1000 },
          fetchPolicy: 'network-only'
        })
      ]);

      const templatesData = templates.data?.form_templatesCollection?.edges?.map(edge => edge.node) || [];
      const submissionsData = submissions.data?.form_submissionsCollection?.edges?.map(edge => edge.node) || [];
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const formData = {
        totalTemplates: templatesData.length,
        totalSubmissions: submissionsData.length,
        pendingSubmissions: submissionsData.filter((s: any) => s.status === 'submitted' && !s.is_processed).length,
        weeklySubmissions: submissionsData.filter((s: any) => new Date(s.submitted_at) >= oneWeekAgo).length,
        recentSubmissions: submissionsData.slice(-5)
      };

      console.log('✅ [GraphQL Dashboard] FormX data loaded:', formData);
      return formData;

    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching FormX data:', error);
      return {
        totalTemplates: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        weeklySubmissions: 0,
        recentSubmissions: []
      };
    }
  }

  private async fetchAssessmentsDataGraphQL(): Promise<any> {
    try {
      console.log('🧠 [GraphQL Dashboard] Fetching ClinimetrixPro data via GraphQL...');
      
      const assessments = await client.query({
        query: GET_ASSESSMENTS,
        variables: { first: 1000 },
        fetchPolicy: 'network-only'
      });

      const assessmentsData = assessments.data?.assessmentsCollection?.edges?.map(edge => edge.node) || [];
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const assessmentData = {
        totalAssessments: assessmentsData.length,
        completedAssessments: assessmentsData.filter((a: any) => a.status === 'completed').length,
        inProgressAssessments: assessmentsData.filter((a: any) => a.status === 'in_progress').length,
        weeklyAssessments: assessmentsData.filter((a: any) => new Date(a.created_at) >= oneWeekAgo).length,
        recentAssessments: assessmentsData.slice(-5)
      };

      console.log('✅ [GraphQL Dashboard] ClinimetrixPro data loaded:', assessmentData);
      return assessmentData;

    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching assessments data:', error);
      return {
        totalAssessments: 0,
        completedAssessments: 0,
        inProgressAssessments: 0,
        weeklyAssessments: 0,
        recentAssessments: []
      };
    }
  }

  private async fetchScalesDataGraphQL(): Promise<any> {
    try {
      console.log('⚖️ [GraphQL Dashboard] Fetching scales data via GraphQL...');
      
      const scales = await client.query({
        query: GET_PSYCHOMETRIC_SCALES,
        variables: { 
          filter: { is_active: { eq: true } },
          first: 1000
        },
        fetchPolicy: 'network-only'
      });

      const scalesData = scales.data?.psychometric_scalesCollection?.edges?.map(edge => edge.node) || [];

      const scaleData = {
        totalScales: scalesData.length,
        featuredScales: scalesData.filter((s: any) => s.is_featured).length,
        scalesByCategory: scalesData.reduce((acc: any, scale: any) => {
          acc[scale.category] = (acc[scale.category] || 0) + 1;
          return acc;
        }, {})
      };

      console.log('✅ [GraphQL Dashboard] Scales data loaded:', scaleData);
      return scaleData;

    } catch (error) {
      console.error('❌ [GraphQL Dashboard] Error fetching scales data:', error);
      return {
        totalScales: 0,
        featuredScales: 0,
        scalesByCategory: {}
      };
    }
  }

  private generateRecentActivity(patients: any[], appointments: any[], resources?: any[], financeStats?: any, formData?: any, assessmentData?: any): Array<{ type: string; description: string; timestamp: string }> {
    const activities: Array<{ type: string; description: string; timestamp: string }> = [];

    // Add recent patients (last 5)
    patients.slice(-5).forEach(patient => {
      activities.push({
        type: 'patient',
        description: `Nuevo paciente: ${patient.first_name} ${patient.last_name} (GraphQL ✅)`,
        timestamp: patient.created_at
      });
    });

    // Add recent appointments (last 5)
    appointments.slice(-5).forEach(appointment => {
      activities.push({
        type: 'consultation',
        description: `Cita: ${appointment.reason || 'Consulta médica'} (GraphQL ✅)`,
        timestamp: appointment.appointment_date || appointment.created_at
      });
    });

    // Add recent resources (last 3)
    if (resources?.length) {
      resources.slice(-3).forEach(resource => {
        activities.push({
          type: 'resource',
          description: `Nuevo recurso: ${resource.title} (GraphQL ✅)`,
          timestamp: resource.created_at
        });
      });
    }

    // Add finance activity
    if (financeStats?.todayIncome > 0) {
      activities.push({
        type: 'finance',
        description: `Ingresos del día: $${financeStats.todayIncome.toFixed(2)} (GraphQL ✅)`,
        timestamp: new Date().toISOString()
      });
    }

    // Add recent form submissions (last 3)
    if (formData?.recentSubmissions?.length) {
      formData.recentSubmissions.slice(-3).forEach((submission: any) => {
        activities.push({
          type: 'form',
          description: `Formulario enviado: ${submission.form_templates?.name || 'Formulario'} (GraphQL ✅)`,
          timestamp: submission.submitted_at
        });
      });
    }

    // Add recent assessments (last 3)
    if (assessmentData?.recentAssessments?.length) {
      assessmentData.recentAssessments.slice(-3).forEach((assessment: any) => {
        activities.push({
          type: 'assessment',
          description: `Evaluación: ${assessment.psychometric_scales?.abbreviation || 'Escala'} completada (GraphQL ✅)`,
          timestamp: assessment.completed_at || assessment.created_at
        });
      });
    }

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  }

  private calculateMonthlyGrowth(patients: any[], appointments: any[]): { patients: number; assessments: number; consultations: number } {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(now.getDate() - 60);

    const recentPatients = patients.filter(p => new Date(p.created_at) >= oneMonthAgo).length;
    const previousPatients = patients.filter(p => 
      new Date(p.created_at) >= twoMonthsAgo && new Date(p.created_at) < oneMonthAgo
    ).length;

    const recentConsultations = appointments.filter(c => 
      new Date(c.appointment_date || c.created_at) >= oneMonthAgo
    ).length;
    const previousConsultations = appointments.filter(c => 
      new Date(c.appointment_date || c.created_at) >= twoMonthsAgo && 
      new Date(c.appointment_date || c.created_at) < oneMonthAgo
    ).length;

    return {
      patients: previousPatients > 0 ? Math.round(((recentPatients - previousPatients) / previousPatients) * 100) : 0,
      consultations: previousConsultations > 0 ? Math.round(((recentConsultations - previousConsultations) / previousConsultations) * 100) : 0,
      assessments: 0 // TODO: Implement when ready
    };
  }

  invalidateCache(): void {
    this.cachedData = null;
    this.lastFetch = 0;
    console.log('🔄 [GraphQL Dashboard] Cache invalidated');
  }

  async forceRefresh(): Promise<DashboardData> {
    this.invalidateCache();
    return this.fetchDashboardData();
  }
}

export const dashboardGraphQLService = DashboardGraphQLService.getInstance();

// Log para confirmar que este servicio se está usando
console.log('🚀 GraphQL Dashboard Service initialized - NO MORE REST API ERRORS! 🎉');