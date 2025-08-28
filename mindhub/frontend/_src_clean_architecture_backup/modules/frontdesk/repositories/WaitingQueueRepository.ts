/**
 * Waiting Queue Repository Interface
 * Data access abstraction for WaitingQueue entities in FrontDesk module
 */

import { WaitingQueue, QueueStatus, QueueItem, SortMethod, QueueConfiguration } from '../entities/WaitingQueue';

export interface QueueSearchFilters {
  clinicId?: string;
  workspaceId?: string;
  status?: QueueStatus;
  location?: string;
  professionalId?: string;
  isActive?: boolean;
}

export interface QueueHistoricalData {
  queueId: string;
  date: Date;
  totalPatients: number;
  averageWaitTime: number;
  averageServiceTime: number;
  patientThroughput: number;
  peakCapacity: number;
  urgentPatients: number;
  walkInPatients: number;
  noShowCount: number;
  patientSatisfactionScore: number;
}

export interface WaitingQueueRepository {
  /**
   * Find queue by ID
   */
  findById(id: string): Promise<WaitingQueue | undefined>;

  /**
   * Find active queues
   */
  findActive(filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues by status
   */
  findByStatus(status: QueueStatus, filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues by location
   */
  findByLocation(location: string, filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues by professional
   */
  findByProfessional(professionalId: string, filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues with capacity available
   */
  findWithCapacity(filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues accepting walk-ins
   */
  findAcceptingWalkIns(filters?: QueueSearchFilters): Promise<WaitingQueue[]>;

  /**
   * Find queues by patient count range
   */
  findByPatientCountRange(
    minCount: number,
    maxCount: number,
    filters?: QueueSearchFilters
  ): Promise<WaitingQueue[]>;

  /**
   * Create new queue
   */
  create(queue: WaitingQueue): Promise<WaitingQueue>;

  /**
   * Update existing queue
   */
  update(queue: WaitingQueue): Promise<WaitingQueue>;

  /**
   * Delete queue (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Activate queue
   */
  activate(id: string, activatedBy: string): Promise<WaitingQueue>;

  /**
   * Deactivate queue
   */
  deactivate(id: string, deactivatedBy: string, reason?: string): Promise<WaitingQueue>;

  /**
   * Pause queue
   */
  pause(id: string, pausedBy: string, reason?: string): Promise<WaitingQueue>;

  /**
   * Resume queue
   */
  resume(id: string, resumedBy: string): Promise<WaitingQueue>;

  /**
   * Clear queue (remove all patients)
   */
  clear(id: string, clearedBy: string, reason?: string): Promise<WaitingQueue>;

  /**
   * Get queue statistics
   */
  getStatistics(filters?: QueueSearchFilters): Promise<{
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
  }>;

  /**
   * Get historical data for analytics
   */
  getHistoricalData(
    queueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QueueHistoricalData[]>;

  /**
   * Get queue performance metrics
   */
  getPerformanceMetrics(
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
  }>;

  /**
   * Find queues needing attention (high wait times, over capacity, etc.)
   */
  findNeedingAttention(filters?: QueueSearchFilters): Promise<{
    queue: WaitingQueue;
    issues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[]>;

  /**
   * Get real-time queue dashboard
   */
  getRealTimeDashboard(filters?: QueueSearchFilters): Promise<{
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
  }>;

  /**
   * Bulk update queue configurations
   */
  bulkUpdateConfigurations(
    queueIds: string[],
    configuration: Partial<QueueConfiguration>,
    updatedBy: string
  ): Promise<WaitingQueue[]>;

  /**
   * Redistribute patients between queues
   */
  redistributePatients(
    sourceQueueId: string,
    targetQueueId: string,
    patientIds: string[],
    redistributedBy: string,
    reason?: string
  ): Promise<{
    sourceQueue: WaitingQueue;
    targetQueue: WaitingQueue;
    redistributedPatients: string[];
  }>;

  /**
   * Get queue capacity analysis
   */
  getCapacityAnalysis(filters?: QueueSearchFilters): Promise<{
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
  }[]>;

  /**
   * Find optimal queue for patient placement
   */
  findOptimalQueue(
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
  } | null>;

  /**
   * Get queue comparison analysis
   */
  getQueueComparison(
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
  }[]>;

  /**
   * Archive old queue data
   */
  archiveOldData(
    beforeDate: Date,
    archivingOptions: {
      keepSummaryData: boolean;
      archiveLocation?: string;
    }
  ): Promise<{
    archivedRecords: number;
    archiveSize: string;
    archiveLocation: string;
  }>;

  /**
   * Get queue efficiency recommendations
   */
  getEfficiencyRecommendations(
    queueId: string,
    analysisWindow: number // days
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
  }>;

  /**
   * Export queue data for reporting
   */
  exportQueueData(
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
  }>;

  /**
   * Get queue alerts and notifications
   */
  getQueueAlerts(filters?: QueueSearchFilters): Promise<{
    queueId: string;
    queueName: string;
    alertType: 'wait_time' | 'capacity' | 'efficiency' | 'patient_needs';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    actionRequired: boolean;
  }[]>;

  /**
   * Acknowledge queue alert
   */
  acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): Promise<void>;
}