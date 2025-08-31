/**
 * NUEVO Dashboard GraphQL Service - VERSIÓN DEFINITIVA
 * 100% GraphQL, 0% REST APIs rotos
 * Creado para eliminar definitivamente los errores 401
 */

import { GET_PATIENTS } from './apollo/queries/expedix/patients';
import { GET_TODAY_APPOINTMENTS } from './apollo/queries/agenda/appointments';
import { client } from './apollo/client';
import type { GetPatientsQuery, GetPatientsQueryVariables, GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables } from './apollo/types/generated';

export interface DashboardData {
  totalPatients: number;
  totalConsultations: number;
  totalScaleApplications: number;
  totalFormInstances: number;
  totalResources: number;
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
  };
  monthlyGrowth: {
    patients: number;
    assessments: number;
    consultations: number;
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
      
      const [patients, appointments] = await Promise.all([
        this.fetchPatientsGraphQL(),
        this.fetchAppointmentsGraphQL()
      ]);

      const totalPatients = patients.length;
      const totalConsultations = appointments.length;
      const totalScaleApplications = 0; // TODO: Implement when ClinimetrixPro GraphQL is ready
      const totalFormInstances = 0; 
      const totalResources = 0;

      console.log('📊 [GraphQL Dashboard] Data loaded successfully:', {
        patients: totalPatients,
        consultations: totalConsultations,
        source: 'GraphQL ✅'
      });

      // Calculate weekly stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyConsultations = appointments.filter((c: any) => 
        new Date(c.appointment_date || c.created_at) >= oneWeekAgo
      ).length;

      const recentActivity = this.generateRecentActivity(patients, appointments);
      const monthlyGrowth = this.calculateMonthlyGrowth(patients, appointments);

      const dashboardData: DashboardData = {
        totalPatients,
        totalConsultations,
        totalScaleApplications,
        totalFormInstances,
        totalResources,
        recentActivity,
        weeklyStats: {
          patients: totalPatients,
          consultations: weeklyConsultations,
          assessments: 0,
          alerts: 0
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
        recentActivity: [{
          type: 'error',
          description: '⚠️ GraphQL Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
          timestamp: new Date().toISOString()
        }],
        weeklyStats: { patients: 0, consultations: 0, assessments: 0, alerts: 0 },
        monthlyGrowth: { patients: 0, assessments: 0, consultations: 0 }
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

  private generateRecentActivity(patients: any[], appointments: any[]): Array<{ type: string; description: string; timestamp: string }> {
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

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
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