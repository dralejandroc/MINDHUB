/**
 * Dashboard Data Service
 * Uses direct Supabase queries for reliable data access (same as Expedix approach)
 * Fallback endpoints available for API integration testing
 */

import { createClient } from '@/lib/supabase/client';
// Temporarily disabled GraphQL imports due to 500 errors
// import { GET_PATIENTS } from './apollo/queries/expedix/patients';
// import { GET_TODAY_APPOINTMENTS, GET_APPOINTMENTS_BY_PATIENT } from './apollo/queries/agenda/appointments';
// import { client } from './apollo/client';
// import type { GetPatientsQuery, GetPatientsQueryVariables, GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables } from './apollo/types/generated';

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

class DashboardDataService {
  private static instance: DashboardDataService;
  private cachedData: DashboardData | null = null;
  private lastFetch: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes to reduce API calls

  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  async fetchDashboardData(userId?: string): Promise<DashboardData> {
    // Check cache - Reactivated to prevent excessive API calls
    const now = Date.now();
    if (this.cachedData && (now - this.lastFetch) < this.cacheTimeout) {
      console.log('[DashboardService] Returning cached data, age:', (now - this.lastFetch), 'ms');
      return this.cachedData;
    }

    try {
      // Fetch data from existing backend endpoints only
      const [
        patients,
        consultations,
        scaleApplications
      ] = await Promise.all([
        this.fetchPatients(),
        this.fetchConsultations(),
        this.fetchScaleApplications()
      ]);

      // Calculate totals
      const totalPatients = patients.length;
      const totalConsultations = consultations.length;
      const totalScaleApplications = scaleApplications.length;
      const totalFormInstances = 0; // FormX module not available
      const totalResources = 0; // Resources module not available

      console.log('Dashboard raw data counts:', {
        patients: totalPatients,
        consultations: totalConsultations,
        scaleApplications: totalScaleApplications,
        formInstances: totalFormInstances,
        resources: totalResources
      });

      // LOG THE DATA THAT WILL BE SENT TO DASHBOARD COMPONENT
      console.log('[DashboardService] Data being sent to dashboard component:', {
        totalPatients,
        totalConsultations,
        totalScaleApplications,
        totalFormInstances,
        totalResources
      });

      // Calculate weekly stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyConsultations = consultations.filter((c: any) => 
        new Date(c.appointment_date || c.created_at) >= oneWeekAgo
      ).length;

      const weeklyAssessments = scaleApplications.filter((a: any) => 
        new Date(a.created_at || a.updated_at) >= oneWeekAgo
      ).length;

      // Create recent activity from available sources only
      const recentActivity = this.generateRecentActivity(
        patients,
        consultations,
        scaleApplications,
        [], // No form instances
        []  // No resources
      );

      // Calculate monthly growth (comparing last 30 days to previous 30 days)
      const monthlyGrowth = this.calculateMonthlyGrowth(
        patients,
        consultations,
        scaleApplications
      );

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
          assessments: weeklyAssessments,
          alerts: 0 // To be implemented
        },
        monthlyGrowth
      };

      // Cache the result
      this.cachedData = dashboardData;
      this.lastFetch = now;

      console.log('Dashboard data fetched successfully:', dashboardData);
      return dashboardData;

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Return empty data on error
      return {
        totalPatients: 0,
        totalConsultations: 0,
        totalScaleApplications: 0,
        totalFormInstances: 0,
        totalResources: 0,
        recentActivity: [],
        weeklyStats: {
          patients: 0,
          consultations: 0,
          assessments: 0,
          alerts: 0
        },
        monthlyGrowth: {
          patients: 0,
          assessments: 0,
          consultations: 0
        }
      };
    }
  }

  private async fetchPatients(): Promise<any[]> {
    try {
      console.log('[DashboardService] Fetching patients via direct Supabase access (like Expedix)...');
      
      const supabase = createClient();
      
      // Use the same approach as Expedix - direct Supabase query
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DashboardService] Supabase patients error:', error);
        return [];
      }

      console.log('[DashboardService] Supabase patients loaded:', patients?.length || 0);
      return patients || [];
      
    } catch (error) {
      console.error('[DashboardService] Error fetching patients via Supabase:', error);
      return [];
    }
  }

  private async fetchConsultations(): Promise<any[]> {
    try {
      console.log('[DashboardService] Fetching appointments via direct Supabase access...');
      
      const supabase = createClient();
      
      // Use direct Supabase query for appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('[DashboardService] Supabase appointments error:', error);
        return [];
      }

      console.log('[DashboardService] Supabase appointments loaded:', appointments?.length || 0);
      return appointments || [];
      
    } catch (error) {
      console.error('[DashboardService] Error fetching appointments via Supabase:', error);
      return [];
    }
  }

  private async fetchScaleApplications(): Promise<any[]> {
    try {
      console.log('[DashboardService] Fetching assessments via direct Supabase access...');
      
      const supabase = createClient();
      
      // Use direct Supabase query for assessments
      const { data: assessments, error } = await supabase
        .from('clinimetrix_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DashboardService] Supabase assessments error:', error);
        return [];
      }

      console.log('[DashboardService] Supabase assessments loaded:', assessments?.length || 0);
      return assessments || [];
      
    } catch (error) {
      console.error('[DashboardService] Error fetching assessments via Supabase:', error);
      return [];
    }
  }

  // FormX and Resources modules are not available - removed methods


  private generateRecentActivity(
    patients: any[],
    consultations: any[],
    scaleApplications: any[],
    formInstances: any[],
    resources: any[]
  ): Array<{ type: string; description: string; timestamp: string }> {
    const activities: Array<{ type: string; description: string; timestamp: string }> = [];

    // Add recent patients (last 5) - using GraphQL field names
    patients.slice(-5).forEach(patient => {
      activities.push({
        type: 'patient',
        description: `Nuevo paciente registrado: ${patient.first_name} ${patient.last_name}`,
        timestamp: patient.created_at
      });
    });

    // Add recent appointments (last 5) - using GraphQL field names
    consultations.slice(-5).forEach(appointment => {
      activities.push({
        type: 'consultation',
        description: `Cita programada: ${appointment.reason || 'Consulta médica'}`,
        timestamp: appointment.appointment_date || appointment.created_at
      });
    });

    // Add recent scale applications (last 5) 
    scaleApplications.slice(-5).forEach(assessment => {
      activities.push({
        type: 'assessment',
        description: `Evaluación clínica aplicada`,
        timestamp: assessment.created_at || assessment.updated_at
      });
    });

    // Sort by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private calculateMonthlyGrowth(
    patients: any[],
    consultations: any[],
    scaleApplications: any[]
  ): { patients: number; assessments: number; consultations: number } {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(now.getDate() - 60);

    // Count items in last 30 days vs previous 30 days - using GraphQL field names
    const recentPatients = patients.filter(p => 
      new Date(p.created_at) >= oneMonthAgo
    ).length;
    const previousPatients = patients.filter(p => 
      new Date(p.created_at) >= twoMonthsAgo && new Date(p.created_at) < oneMonthAgo
    ).length;

    const recentConsultations = consultations.filter(c => 
      new Date(c.appointment_date || c.created_at) >= oneMonthAgo
    ).length;
    const previousConsultations = consultations.filter(c => 
      new Date(c.appointment_date || c.created_at) >= twoMonthsAgo && 
      new Date(c.appointment_date || c.created_at) < oneMonthAgo
    ).length;

    const recentAssessments = scaleApplications.filter(a => 
      new Date(a.created_at || a.updated_at) >= oneMonthAgo
    ).length;
    const previousAssessments = scaleApplications.filter(a => 
      new Date(a.created_at || a.updated_at) >= twoMonthsAgo && 
      new Date(a.created_at || a.updated_at) < oneMonthAgo
    ).length;

    return {
      patients: previousPatients > 0 ? Math.round(((recentPatients - previousPatients) / previousPatients) * 100) : 0,
      consultations: previousConsultations > 0 ? Math.round(((recentConsultations - previousConsultations) / previousConsultations) * 100) : 0,
      assessments: previousAssessments > 0 ? Math.round(((recentAssessments - previousAssessments) / previousAssessments) * 100) : 0
    };
  }

  // Clear cache when new data is added
  invalidateCache(): void {
    this.cachedData = null;
    this.lastFetch = 0;
    console.log('Dashboard cache invalidated');
  }

  // Force refresh dashboard data
  async forceRefresh(): Promise<DashboardData> {
    this.invalidateCache();
    return this.fetchDashboardData();
  }
}

export const dashboardDataService = DashboardDataService.getInstance();