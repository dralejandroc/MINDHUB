/**
 * Django Waiting Queue Adapter
 * Implementation of WaitingQueueRepository using Django REST API
 */

import { 
  WaitingQueue, 
  QueueStatus, 
  QueueItem, 
  SortMethod, 
  QueueConfiguration,
  QueueMetrics
} from '../entities/WaitingQueue';
import { 
  WaitingQueueRepository, 
  QueueSearchFilters, 
  QueueHistoricalData 
} from '../repositories/WaitingQueueRepository';

interface DjangoQueueResponse {
  id: string;
  name: string;
  location: string;
  status: string;
  items: {
    id: string;
    patient_id: string;
    appointment_id?: string;
    patient_name: string;
    arrival_time: string;
    estimated_wait_time: number;
    actual_wait_time: number;
    priority: number;
    urgency: string;
    special_needs: string[];
    professional_id: string;
    professional_name: string;
    appointment_type: string;
    notes?: string;
    position: number;
    is_walk_in: boolean;
    requires_translation: boolean;
    has_insurance_issues: boolean;
  }[];
  configuration: {
    max_wait_time: number;
    urgent_patient_priority: number;
    walk_in_allowed: boolean;
    max_queue_size: number;
    estimated_service_time: number;
    prioritize_appointments: boolean;
  };
  sort_method: string;
  professional_ids: string[];
  max_capacity: number;
  is_active: boolean;
  clinic_id?: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export class DjangoWaitingQueueAdapter implements WaitingQueueRepository {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = '/api/frontdesk/django') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Django API request failed:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  private mapDjangoResponseToQueue(response: DjangoQueueResponse): WaitingQueue {
    return new WaitingQueue(
      response.id,
      response.name,
      response.location,
      response.status as QueueStatus,
      response.items.map(item => ({
        id: item.id,
        patientId: item.patient_id,
        appointmentId: item.appointment_id,
        patientName: item.patient_name,
        arrivalTime: new Date(item.arrival_time),
        estimatedWaitTime: item.estimated_wait_time,
        actualWaitTime: item.actual_wait_time,
        priority: item.priority,
        urgency: item.urgency as any,
        specialNeeds: item.special_needs,
        professionalId: item.professional_id,
        professionalName: item.professional_name,
        appointmentType: item.appointment_type,
        notes: item.notes,
        position: item.position,
        isWalkIn: item.is_walk_in,
        requiresTranslation: item.requires_translation,
        hasInsuranceIssues: item.has_insurance_issues,
      })),
      {
        maxWaitTime: response.configuration.max_wait_time,
        urgentPatientPriority: response.configuration.urgent_patient_priority,
        walkInAllowed: response.configuration.walk_in_allowed,
        maxQueueSize: response.configuration.max_queue_size,
        estimatedServiceTime: response.configuration.estimated_service_time,
        prioritizeAppointments: response.configuration.prioritize_appointments,
      },
      response.sort_method as SortMethod,
      response.professional_ids,
      response.max_capacity,
      response.is_active,
      response.clinic_id,
      response.workspace_id,
      new Date(response.created_at),
      new Date(response.updated_at)
    );
  }

  private mapQueueToDjangoRequest(queue: WaitingQueue): any {
    return {
      id: queue.id,
      name: queue.name,
      location: queue.location,
      status: queue.status,
      items: queue.items.map(item => ({
        id: item.id,
        patient_id: item.patientId,
        appointment_id: item.appointmentId,
        patient_name: item.patientName,
        arrival_time: item.arrivalTime.toISOString(),
        estimated_wait_time: item.estimatedWaitTime,
        actual_wait_time: item.actualWaitTime,
        priority: item.priority,
        urgency: item.urgency,
        special_needs: item.specialNeeds,
        professional_id: item.professionalId,
        professional_name: item.professionalName,
        appointment_type: item.appointmentType,
        notes: item.notes,
        position: item.position,
        is_walk_in: item.isWalkIn,
        requires_translation: item.requiresTranslation,
        has_insurance_issues: item.hasInsuranceIssues,
      })),
      configuration: {
        max_wait_time: queue.configuration.maxWaitTime,
        urgent_patient_priority: queue.configuration.urgentPatientPriority,
        walk_in_allowed: queue.configuration.walkInAllowed,
        max_queue_size: queue.configuration.maxQueueSize,
        estimated_service_time: queue.configuration.estimatedServiceTime,
        prioritize_appointments: queue.configuration.prioritizeAppointments,
      },
      sort_method: queue.sortMethod,
      professional_ids: queue.professionalIds,
      max_capacity: queue.maxCapacity,
      is_active: queue.isActive,
      clinic_id: queue.clinicId,
      workspace_id: queue.workspaceId,
    };
  }

  private buildQueryParams(filters?: QueueSearchFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (filters.professionalId) params.append('professional_id', filters.professionalId);
    if (filters.isActive !== undefined) {
      params.append('is_active', filters.isActive.toString());
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  async findById(id: string): Promise<WaitingQueue | undefined> {
    try {
      const response = await this.makeRequest(`/queues/${id}/`);
      return this.mapDjangoResponseToQueue(response);
    } catch (error) {
      if (error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findActive(filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams({ ...filters, isActive: true });
    const response = await this.makeRequest(`/queues/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findByStatus(status: QueueStatus, filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams({ ...filters, status });
    const response = await this.makeRequest(`/queues/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findByLocation(location: string, filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams({ ...filters, location });
    const response = await this.makeRequest(`/queues/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findByProfessional(professionalId: string, filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams({ ...filters, professionalId });
    const response = await this.makeRequest(`/queues/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findWithCapacity(filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/with-capacity/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findAcceptingWalkIns(filters?: QueueSearchFilters): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/accepting-walkins/${queryParams}`);
    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async findByPatientCountRange(
    minCount: number,
    maxCount: number,
    filters?: QueueSearchFilters
  ): Promise<WaitingQueue[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('min_count', minCount.toString());
    params.append('max_count', maxCount.toString());

    const response = await this.makeRequest(`/queues/?${params.toString()}`);
    return response.results
      .filter((item: DjangoQueueResponse) => 
        item.items.length >= minCount && item.items.length <= maxCount
      )
      .map((item: DjangoQueueResponse) => this.mapDjangoResponseToQueue(item));
  }

  async create(queue: WaitingQueue): Promise<WaitingQueue> {
    const queueData = this.mapQueueToDjangoRequest(queue);
    const response = await this.makeRequest('/queues/', {
      method: 'POST',
      body: JSON.stringify(queueData),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async update(queue: WaitingQueue): Promise<WaitingQueue> {
    const queueData = this.mapQueueToDjangoRequest(queue);
    const response = await this.makeRequest(`/queues/${queue.id}/`, {
      method: 'PUT',
      body: JSON.stringify(queueData),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/queues/${id}/`, {
      method: 'DELETE',
    });
  }

  async activate(id: string, activatedBy: string): Promise<WaitingQueue> {
    const response = await this.makeRequest(`/queues/${id}/activate/`, {
      method: 'POST',
      body: JSON.stringify({ activated_by: activatedBy }),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async deactivate(id: string, deactivatedBy: string, reason?: string): Promise<WaitingQueue> {
    const response = await this.makeRequest(`/queues/${id}/deactivate/`, {
      method: 'POST',
      body: JSON.stringify({ 
        deactivated_by: deactivatedBy,
        reason 
      }),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async pause(id: string, pausedBy: string, reason?: string): Promise<WaitingQueue> {
    const response = await this.makeRequest(`/queues/${id}/pause/`, {
      method: 'POST',
      body: JSON.stringify({ 
        paused_by: pausedBy,
        reason 
      }),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async resume(id: string, resumedBy: string): Promise<WaitingQueue> {
    const response = await this.makeRequest(`/queues/${id}/resume/`, {
      method: 'POST',
      body: JSON.stringify({ resumed_by: resumedBy }),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async clear(id: string, clearedBy: string, reason?: string): Promise<WaitingQueue> {
    const response = await this.makeRequest(`/queues/${id}/clear/`, {
      method: 'POST',
      body: JSON.stringify({ 
        cleared_by: clearedBy,
        reason 
      }),
    });
    return this.mapDjangoResponseToQueue(response);
  }

  async getStatistics(filters?: QueueSearchFilters): Promise<{
    totalQueues: number;
    activeQueues: number;
    pausedQueues: number;
    closedQueues: number;
    totalWaitingPatients: number;
    averageWaitTime: number;
    longestWaitTime: number;
    totalUrgentPatients: number;
    totalWalkInPatients: number;
    queueUtilization: number;
    statusDistribution: { [status: string]: number };
    locationDistribution: { [location: string]: number };
  }> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/statistics/${queryParams}`);
    return {
      totalQueues: response.total_queues,
      activeQueues: response.active_queues,
      pausedQueues: response.paused_queues,
      closedQueues: response.closed_queues,
      totalWaitingPatients: response.total_waiting_patients,
      averageWaitTime: response.average_wait_time,
      longestWaitTime: response.longest_wait_time,
      totalUrgentPatients: response.total_urgent_patients,
      totalWalkInPatients: response.total_walk_in_patients,
      queueUtilization: response.queue_utilization,
      statusDistribution: response.status_distribution,
      locationDistribution: response.location_distribution,
    };
  }

  async getHistoricalData(
    queueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QueueHistoricalData[]> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.makeRequest(
      `/queues/${queueId}/historical-data/?${params.toString()}`
    );

    return response.results.map((item: any) => ({
      queueId: item.queue_id,
      date: new Date(item.date),
      totalPatients: item.total_patients,
      averageWaitTime: item.average_wait_time,
      averageServiceTime: item.average_service_time,
      patientThroughput: item.patient_throughput,
      peakCapacity: item.peak_capacity,
      urgentPatients: item.urgent_patients,
      walkInPatients: item.walk_in_patients,
      noShowCount: item.no_show_count,
      patientSatisfactionScore: item.patient_satisfaction_score,
    }));
  }

  async getPerformanceMetrics(
    queueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    averageWaitTime: number;
    averageServiceTime: number;
    patientThroughput: number;
    peakHours: { hour: number; count: number }[];
    waitTimeByUrgency: { [urgency: string]: number };
    noShowRate: number;
    patientSatisfactionScore: number;
    efficiency: number;
    capacityUtilization: number;
    trends: {
      date: Date;
      waitTime: number;
      throughput: number;
      satisfaction: number;
    }[];
  }> {
    const params = new URLSearchParams();
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.makeRequest(
      `/queues/${queueId}/performance-metrics/?${params.toString()}`
    );

    return {
      averageWaitTime: response.average_wait_time,
      averageServiceTime: response.average_service_time,
      patientThroughput: response.patient_throughput,
      peakHours: response.peak_hours,
      waitTimeByUrgency: response.wait_time_by_urgency,
      noShowRate: response.no_show_rate,
      patientSatisfactionScore: response.patient_satisfaction_score,
      efficiency: response.efficiency,
      capacityUtilization: response.capacity_utilization,
      trends: response.trends.map((trend: any) => ({
        date: new Date(trend.date),
        waitTime: trend.wait_time,
        throughput: trend.throughput,
        satisfaction: trend.satisfaction,
      })),
    };
  }

  async findNeedingAttention(filters?: QueueSearchFilters): Promise<{
    queue: WaitingQueue;
    issues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/needing-attention/${queryParams}`);

    return response.results.map((item: any) => ({
      queue: this.mapDjangoResponseToQueue(item.queue),
      issues: item.issues,
      severity: item.severity,
    }));
  }

  async getRealTimeDashboard(filters?: QueueSearchFilters): Promise<{
    totalPatients: number;
    averageWaitTime: number;
    queuesOverCapacity: number;
    urgentPatientsWaiting: number;
    longestWaitingPatient: {
      queueId: string;
      patientName: string;
      waitTime: number;
    } | null;
    queueSummary: {
      queueId: string;
      queueName: string;
      location: string;
      waitingCount: number;
      averageWaitTime: number;
      status: QueueStatus;
      capacity: number;
      urgentCount: number;
    }[];
  }> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/realtime-dashboard/${queryParams}`);

    return {
      totalPatients: response.total_patients,
      averageWaitTime: response.average_wait_time,
      queuesOverCapacity: response.queues_over_capacity,
      urgentPatientsWaiting: response.urgent_patients_waiting,
      longestWaitingPatient: response.longest_waiting_patient ? {
        queueId: response.longest_waiting_patient.queue_id,
        patientName: response.longest_waiting_patient.patient_name,
        waitTime: response.longest_waiting_patient.wait_time,
      } : null,
      queueSummary: response.queue_summary.map((summary: any) => ({
        queueId: summary.queue_id,
        queueName: summary.queue_name,
        location: summary.location,
        waitingCount: summary.waiting_count,
        averageWaitTime: summary.average_wait_time,
        status: summary.status,
        capacity: summary.capacity,
        urgentCount: summary.urgent_count,
      })),
    };
  }

  async bulkUpdateConfigurations(
    queueIds: string[],
    configuration: Partial<QueueConfiguration>,
    updatedBy: string
  ): Promise<WaitingQueue[]> {
    const response = await this.makeRequest('/queues/bulk-update-configurations/', {
      method: 'POST',
      body: JSON.stringify({
        queue_ids: queueIds,
        configuration: {
          max_wait_time: configuration.maxWaitTime,
          urgent_patient_priority: configuration.urgentPatientPriority,
          walk_in_allowed: configuration.walkInAllowed,
          max_queue_size: configuration.maxQueueSize,
          estimated_service_time: configuration.estimatedServiceTime,
          prioritize_appointments: configuration.prioritizeAppointments,
        },
        updated_by: updatedBy,
      }),
    });

    return response.results.map((item: DjangoQueueResponse) => 
      this.mapDjangoResponseToQueue(item)
    );
  }

  async redistributePatients(
    sourceQueueId: string,
    targetQueueId: string,
    patientIds: string[],
    redistributedBy: string,
    reason?: string
  ): Promise<{
    sourceQueue: WaitingQueue;
    targetQueue: WaitingQueue;
    redistributedPatients: string[];
  }> {
    const response = await this.makeRequest('/queues/redistribute-patients/', {
      method: 'POST',
      body: JSON.stringify({
        source_queue_id: sourceQueueId,
        target_queue_id: targetQueueId,
        patient_ids: patientIds,
        redistributed_by: redistributedBy,
        reason,
      }),
    });

    return {
      sourceQueue: this.mapDjangoResponseToQueue(response.source_queue),
      targetQueue: this.mapDjangoResponseToQueue(response.target_queue),
      redistributedPatients: response.redistributed_patients,
    };
  }

  async getCapacityAnalysis(filters?: QueueSearchFilters): Promise<{
    queueId: string;
    queueName: string;
    currentCapacity: number;
    maxCapacity: number;
    utilizationPercentage: number;
    recommendedCapacity: number;
    peakUsage: {
      time: string;
      count: number;
    };
    capacityTrend: {
      date: Date;
      utilization: number;
    }[];
  }[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/capacity-analysis/${queryParams}`);

    return response.results.map((item: any) => ({
      queueId: item.queue_id,
      queueName: item.queue_name,
      currentCapacity: item.current_capacity,
      maxCapacity: item.max_capacity,
      utilizationPercentage: item.utilization_percentage,
      recommendedCapacity: item.recommended_capacity,
      peakUsage: {
        time: item.peak_usage.time,
        count: item.peak_usage.count,
      },
      capacityTrend: item.capacity_trend.map((trend: any) => ({
        date: new Date(trend.date),
        utilization: trend.utilization,
      })),
    }));
  }

  async findOptimalQueue(
    patientId: string,
    professionalId: string,
    urgency: 'low' | 'medium' | 'high' | 'urgent',
    specialNeeds: string[],
    filters?: QueueSearchFilters
  ): Promise<{
    queue: WaitingQueue;
    estimatedWaitTime: number;
    position: number;
    reason: string;
  } | null> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('patient_id', patientId);
    params.append('professional_id', professionalId);
    params.append('urgency', urgency);
    params.append('special_needs', JSON.stringify(specialNeeds));

    try {
      const response = await this.makeRequest(`/queues/find-optimal/?${params.toString()}`);
      
      if (!response.queue) {
        return null;
      }

      return {
        queue: this.mapDjangoResponseToQueue(response.queue),
        estimatedWaitTime: response.estimated_wait_time,
        position: response.position,
        reason: response.reason,
      };
    } catch (error) {
      return null;
    }
  }

  async getQueueComparison(
    queueIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    queueId: string;
    queueName: string;
    totalPatients: number;
    averageWaitTime: number;
    patientThroughput: number;
    efficiency: number;
    patientSatisfaction: number;
    ranking: number;
  }[]> {
    const params = new URLSearchParams();
    params.append('queue_ids', JSON.stringify(queueIds));
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.makeRequest(`/queues/comparison/?${params.toString()}`);

    return response.results.map((item: any) => ({
      queueId: item.queue_id,
      queueName: item.queue_name,
      totalPatients: item.total_patients,
      averageWaitTime: item.average_wait_time,
      patientThroughput: item.patient_throughput,
      efficiency: item.efficiency,
      patientSatisfaction: item.patient_satisfaction,
      ranking: item.ranking,
    }));
  }

  async archiveOldData(
    beforeDate: Date,
    archivingOptions: {
      keepSummaryData: boolean;
      archiveLocation?: string;
    }
  ): Promise<{
    archivedRecords: number;
    archiveSize: string;
    archiveLocation: string;
  }> {
    const response = await this.makeRequest('/queues/archive-old-data/', {
      method: 'POST',
      body: JSON.stringify({
        before_date: beforeDate.toISOString().split('T')[0],
        keep_summary_data: archivingOptions.keepSummaryData,
        archive_location: archivingOptions.archiveLocation,
      }),
    });

    return {
      archivedRecords: response.archived_records,
      archiveSize: response.archive_size,
      archiveLocation: response.archive_location,
    };
  }

  async getEfficiencyRecommendations(
    queueId: string,
    analysisWindow: number
  ): Promise<{
    currentEfficiency: number;
    recommendations: {
      type: 'configuration' | 'staffing' | 'process';
      priority: 'low' | 'medium' | 'high';
      description: string;
      expectedImprovement: string;
      implementationEffort: 'easy' | 'medium' | 'hard';
    }[];
    projectedImprovements: {
      waitTimeReduction: number;
      throughputIncrease: number;
      satisfactionImprovement: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('analysis_window', analysisWindow.toString());

    const response = await this.makeRequest(
      `/queues/${queueId}/efficiency-recommendations/?${params.toString()}`
    );

    return {
      currentEfficiency: response.current_efficiency,
      recommendations: response.recommendations,
      projectedImprovements: {
        waitTimeReduction: response.projected_improvements.wait_time_reduction,
        throughputIncrease: response.projected_improvements.throughput_increase,
        satisfactionImprovement: response.projected_improvements.satisfaction_improvement,
      },
    };
  }

  async exportQueueData(
    filters: QueueSearchFilters & {
      startDate: Date;
      endDate: Date;
      format: 'csv' | 'json' | 'excel';
      includePatientDetails: boolean;
      includeHistoricalData: boolean;
    }
  ): Promise<{
    filename: string;
    downloadUrl: string;
    size: number;
    recordCount: number;
  }> {
    const response = await this.makeRequest('/queues/export/', {
      method: 'POST',
      body: JSON.stringify({
        clinic_id: filters.clinicId,
        workspace_id: filters.workspaceId,
        status: filters.status,
        location: filters.location,
        professional_id: filters.professionalId,
        start_date: filters.startDate.toISOString().split('T')[0],
        end_date: filters.endDate.toISOString().split('T')[0],
        format: filters.format,
        include_patient_details: filters.includePatientDetails,
        include_historical_data: filters.includeHistoricalData,
      }),
    });

    return {
      filename: response.filename,
      downloadUrl: response.download_url,
      size: response.size,
      recordCount: response.record_count,
    };
  }

  async getQueueAlerts(filters?: QueueSearchFilters): Promise<{
    queueId: string;
    queueName: string;
    alertType: 'wait_time' | 'capacity' | 'efficiency' | 'patient_needs';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    actionRequired: boolean;
  }[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/queues/alerts/${queryParams}`);

    return response.results.map((alert: any) => ({
      queueId: alert.queue_id,
      queueName: alert.queue_name,
      alertType: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date(alert.timestamp),
      acknowledged: alert.acknowledged,
      actionRequired: alert.action_required,
    }));
  }

  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): Promise<void> {
    await this.makeRequest(`/queues/alerts/${alertId}/acknowledge/`, {
      method: 'POST',
      body: JSON.stringify({
        acknowledged_by: acknowledgedBy,
        notes,
      }),
    });
  }
}