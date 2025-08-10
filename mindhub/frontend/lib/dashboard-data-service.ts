/**
 * Dashboard Data Service
 * Fetches real statistics from backend APIs for dashboard display
 * Updated to use direct backend API clients instead of broken proxy routes
 */

import { simpleApiClient } from './api/simple-api-client';

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
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes (reduced for testing)

  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  async fetchDashboardData(userId?: string, authToken?: string): Promise<DashboardData> {
    // Check cache (temporarily disabled for testing)
    const now = Date.now();
    // if (this.cachedData && (now - this.lastFetch) < this.cacheTimeout) {
    //   return this.cachedData;
    // }

    try {
      // Fetch data from existing backend endpoints only
      const [
        patients,
        consultations,
        scaleApplications
      ] = await Promise.all([
        this.fetchPatients(authToken),
        this.fetchConsultations(authToken),
        this.fetchScaleApplications(authToken)
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

      // Calculate weekly stats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyConsultations = consultations.filter((c: any) => 
        new Date(c.consultationDate || c.createdAt) >= oneWeekAgo
      ).length;

      const weeklyAssessments = scaleApplications.filter((a: any) => 
        new Date(a.administrationDate || a.createdAt) >= oneWeekAgo
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

  private async fetchPatients(authToken?: string): Promise<any[]> {
    try {
      const response = await simpleApiClient.getExpedixPatients(undefined, authToken);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  private async fetchConsultations(authToken?: string): Promise<any[]> {
    try {
      // Try to get consultations directly first
      const response = await simpleApiClient.getExpedixConsultations(authToken);
      if (response?.data) {
        return response.data;
      }
      
      // Fallback: extract consultations from patient data
      const patientsResponse = await simpleApiClient.getExpedixPatients(undefined, authToken);
      const allConsultations: any[] = [];
      patientsResponse.data?.forEach((patient: any) => {
        if (patient.consultations && patient.consultations.length > 0) {
          allConsultations.push(...patient.consultations);
        }
      });
      
      return allConsultations;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      return [];
    }
  }

  private async fetchScaleApplications(authToken?: string): Promise<any[]> {
    try {
      // Get all scale administrations from all patients to calculate dashboard stats
      // We'll aggregate data from all patients for dashboard metrics
      const patients = await this.fetchPatients(authToken);
      let allAssessments: any[] = [];
      
      // Get assessments for each patient (limited to avoid too many requests)
      const patientSample = patients.slice(0, 10); // Sample first 10 patients
      
      for (const patient of patientSample) {
        try {
          // For now, extract assessments from patient data if available
          if (patient.assessments && patient.assessments.length > 0) {
            allAssessments = allAssessments.concat(patient.assessments);
          }
          // TODO: Implement proper assessments endpoint when clinimetrix integration is complete
        } catch (err) {
          console.log(`Failed to extract assessments for patient ${patient.id}:`, err instanceof Error ? err.message : 'Unknown error');
          continue;
        }
      }
      
      console.log('Dashboard assessments loaded:', allAssessments.length);
      return allAssessments;
      
    } catch (error) {
      console.error('Error fetching scale applications:', error);
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

    // Add recent patients (last 5)
    patients.slice(-5).forEach(patient => {
      activities.push({
        type: 'patient',
        description: `Nuevo paciente registrado: ${patient.firstName} ${patient.lastName}`,
        timestamp: patient.createdAt
      });
    });

    // Add recent consultations (last 5)
    consultations.slice(-5).forEach(consultation => {
      activities.push({
        type: 'consultation',
        description: `Consulta completada: ${consultation.reason || 'Consulta médica'}`,
        timestamp: consultation.consultationDate || consultation.createdAt
      });
    });

    // Add recent scale applications (last 5)
    scaleApplications.slice(-5).forEach(assessment => {
      activities.push({
        type: 'assessment',
        description: `Escala aplicada: ${assessment.scale?.name || 'Evaluación clínica'}`,
        timestamp: assessment.administrationDate || assessment.createdAt
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

    // Count items in last 30 days vs previous 30 days
    const recentPatients = patients.filter(p => 
      new Date(p.createdAt) >= oneMonthAgo
    ).length;
    const previousPatients = patients.filter(p => 
      new Date(p.createdAt) >= twoMonthsAgo && new Date(p.createdAt) < oneMonthAgo
    ).length;

    const recentConsultations = consultations.filter(c => 
      new Date(c.consultationDate || c.createdAt) >= oneMonthAgo
    ).length;
    const previousConsultations = consultations.filter(c => 
      new Date(c.consultationDate || c.createdAt) >= twoMonthsAgo && 
      new Date(c.consultationDate || c.createdAt) < oneMonthAgo
    ).length;

    const recentAssessments = scaleApplications.filter(a => 
      new Date(a.administrationDate || a.createdAt) >= oneMonthAgo
    ).length;
    const previousAssessments = scaleApplications.filter(a => 
      new Date(a.administrationDate || a.createdAt) >= twoMonthsAgo && 
      new Date(a.administrationDate || a.createdAt) < oneMonthAgo
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