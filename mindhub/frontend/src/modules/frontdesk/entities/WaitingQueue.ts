/**
 * Waiting Queue Entity for FrontDesk Module
 * Core business logic for managing waiting room queue - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type QueueStatus = 'active' | 'paused' | 'closed';
export type SortMethod = 'arrival_time' | 'priority' | 'appointment_time' | 'urgency';

export interface QueueItem {
  id: string;
  patientId: string;
  appointmentId?: string;
  patientName: string;
  arrivalTime: Date;
  estimatedWaitTime: number; // in minutes
  actualWaitTime: number; // in minutes
  priority: number; // 1-10, 10 being highest
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  specialNeeds: string[];
  professionalId: string;
  professionalName: string;
  appointmentType: string;
  notes?: string;
  position: number;
  isWalkIn: boolean;
  requiresTranslation: boolean;
  hasInsuranceIssues: boolean;
}

export interface QueueMetrics {
  totalWaiting: number;
  averageWaitTime: number;
  longestWaitTime: number;
  urgentCount: number;
  walkInCount: number;
  appointmentCount: number;
  specialNeedsCount: number;
  estimatedProcessingTime: number;
}

export interface QueueConfiguration {
  maxWaitTime: number; // minutes
  urgentPatientPriority: number;
  walkInAllowed: boolean;
  maxQueueSize: number;
  estimatedServiceTime: number; // minutes per patient
  prioritizeAppointments: boolean;
}

export class WaitingQueue {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly location: string,
    public readonly status: QueueStatus,
    public readonly items: QueueItem[],
    public readonly configuration: QueueConfiguration,
    public readonly sortMethod: SortMethod,
    public readonly professionalIds: string[],
    public readonly maxCapacity: number,
    public readonly isActive: boolean = true,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate queue data
   */
  private validate(): void {
    if (!this.name.trim()) {
      throw new Error('Queue name is required');
    }

    if (!this.location.trim()) {
      throw new Error('Queue location is required');
    }

    if (this.maxCapacity <= 0) {
      throw new Error('Max capacity must be positive');
    }

    if (this.professionalIds.length === 0) {
      throw new Error('Queue must have at least one assigned professional');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Queue must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Queue cannot belong to both clinic and workspace');
    }

    // Business rule: Validate configuration
    this.validateConfiguration();

    // Business rule: Validate queue items
    this.validateQueueItems();
  }

  /**
   * Business rule: Validate queue configuration
   */
  private validateConfiguration(): void {
    if (this.configuration.maxWaitTime <= 0) {
      throw new Error('Max wait time must be positive');
    }

    if (this.configuration.maxQueueSize <= 0) {
      throw new Error('Max queue size must be positive');
    }

    if (this.configuration.estimatedServiceTime <= 0) {
      throw new Error('Estimated service time must be positive');
    }

    if (this.configuration.urgentPatientPriority < 1 || this.configuration.urgentPatientPriority > 10) {
      throw new Error('Urgent patient priority must be between 1 and 10');
    }
  }

  /**
   * Business rule: Validate queue items consistency
   */
  private validateQueueItems(): void {
    const positions = this.items.map(item => item.position);
    const uniquePositions = new Set(positions);

    if (positions.length !== uniquePositions.size) {
      throw new Error('Queue items cannot have duplicate positions');
    }

    // Check for gaps in positions
    const sortedPositions = positions.sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        throw new Error('Queue positions must be consecutive starting from 1');
      }
    }
  }

  /**
   * Business logic: Check if queue can accept new patients
   */
  canAcceptNewPatients(): boolean {
    return this.isActive && 
           this.status === 'active' && 
           this.items.length < this.maxCapacity;
  }

  /**
   * Business logic: Check if walk-ins are allowed
   */
  canAcceptWalkIns(): boolean {
    return this.canAcceptNewPatients() && this.configuration.walkInAllowed;
  }

  /**
   * Business logic: Add patient to queue
   */
  addPatient(
    patientId: string,
    patientName: string,
    professionalId: string,
    professionalName: string,
    appointmentId?: string,
    urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    specialNeeds: string[] = [],
    isWalkIn: boolean = false,
    requiresTranslation: boolean = false,
    hasInsuranceIssues: boolean = false,
    notes?: string
  ): WaitingQueue {
    if (!this.canAcceptNewPatients()) {
      throw new Error('Queue cannot accept new patients');
    }

    if (isWalkIn && !this.canAcceptWalkIns()) {
      throw new Error('Queue is not accepting walk-ins');
    }

    if (!this.professionalIds.includes(professionalId)) {
      throw new Error('Professional is not assigned to this queue');
    }

    // Check if patient is already in queue
    if (this.items.some(item => item.patientId === patientId)) {
      throw new Error('Patient is already in the queue');
    }

    const newPosition = this.calculateNewPosition(urgency, isWalkIn);
    const estimatedWaitTime = this.calculateEstimatedWaitTime(newPosition);
    
    const newItem: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      appointmentId,
      patientName,
      arrivalTime: new Date(),
      estimatedWaitTime,
      actualWaitTime: 0,
      priority: this.calculatePriority(urgency, specialNeeds, isWalkIn, hasInsuranceIssues),
      urgency,
      specialNeeds,
      professionalId,
      professionalName,
      appointmentType: isWalkIn ? 'walk-in' : 'scheduled',
      notes,
      position: newPosition,
      isWalkIn,
      requiresTranslation,
      hasInsuranceIssues
    };

    // Reposition existing items if necessary
    const updatedItems = this.insertItemAtPosition(newItem);

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      this.status,
      updatedItems,
      this.configuration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Remove patient from queue
   */
  removePatient(patientId: string, reason?: string): WaitingQueue {
    const itemIndex = this.items.findIndex(item => item.patientId === patientId);
    
    if (itemIndex === -1) {
      throw new Error('Patient not found in queue');
    }

    // Remove item and reposition remaining items
    const updatedItems = this.items
      .filter(item => item.patientId !== patientId)
      .map((item, index) => ({
        ...item,
        position: index + 1,
        estimatedWaitTime: this.calculateEstimatedWaitTime(index + 1)
      }));

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      this.status,
      updatedItems,
      this.configuration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Move patient to different position
   */
  movePatient(patientId: string, newPosition: number): WaitingQueue {
    if (newPosition < 1 || newPosition > this.items.length) {
      throw new Error('Invalid position');
    }

    const itemIndex = this.items.findIndex(item => item.patientId === patientId);
    
    if (itemIndex === -1) {
      throw new Error('Patient not found in queue');
    }

    const item = this.items[itemIndex];
    const otherItems = this.items.filter(item => item.patientId !== patientId);

    // Insert item at new position
    const updatedItems = [...otherItems];
    updatedItems.splice(newPosition - 1, 0, { ...item, position: newPosition });

    // Reposition all items
    const repositionedItems = updatedItems.map((item, index) => ({
      ...item,
      position: index + 1,
      estimatedWaitTime: this.calculateEstimatedWaitTime(index + 1)
    }));

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      this.status,
      repositionedItems,
      this.configuration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Get next patient in queue
   */
  getNextPatient(): QueueItem | null {
    const sortedItems = this.getSortedQueue();
    return sortedItems.length > 0 ? sortedItems[0] : null;
  }

  /**
   * Business logic: Get patients waiting for specific professional
   */
  getPatientsForProfessional(professionalId: string): QueueItem[] {
    return this.items
      .filter(item => item.professionalId === professionalId)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Business logic: Get urgent patients
   */
  getUrgentPatients(): QueueItem[] {
    return this.items.filter(item => item.urgency === 'urgent');
  }

  /**
   * Business logic: Get patients with excessive wait time
   */
  getPatientsWithExcessiveWaitTime(): QueueItem[] {
    const now = new Date();
    return this.items.filter(item => {
      const waitTime = Math.floor((now.getTime() - item.arrivalTime.getTime()) / (1000 * 60));
      return waitTime > this.configuration.maxWaitTime;
    });
  }

  /**
   * Business logic: Calculate queue metrics
   */
  getMetrics(): QueueMetrics {
    const now = new Date();
    const waitTimes = this.items.map(item => 
      Math.floor((now.getTime() - item.arrivalTime.getTime()) / (1000 * 60))
    );

    return {
      totalWaiting: this.items.length,
      averageWaitTime: waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0,
      longestWaitTime: waitTimes.length > 0 ? Math.max(...waitTimes) : 0,
      urgentCount: this.items.filter(item => item.urgency === 'urgent').length,
      walkInCount: this.items.filter(item => item.isWalkIn).length,
      appointmentCount: this.items.filter(item => !item.isWalkIn).length,
      specialNeedsCount: this.items.filter(item => item.specialNeeds.length > 0).length,
      estimatedProcessingTime: this.items.length * this.configuration.estimatedServiceTime
    };
  }

  /**
   * Business logic: Update queue configuration
   */
  updateConfiguration(newConfiguration: Partial<QueueConfiguration>): WaitingQueue {
    const updatedConfiguration = { ...this.configuration, ...newConfiguration };

    // Recalculate wait times with new configuration
    const updatedItems = this.items.map(item => ({
      ...item,
      estimatedWaitTime: this.calculateEstimatedWaitTime(item.position, updatedConfiguration.estimatedServiceTime)
    }));

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      this.status,
      updatedItems,
      updatedConfiguration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Resort queue based on sort method
   */
  resortQueue(newSortMethod?: SortMethod): WaitingQueue {
    const sortMethod = newSortMethod || this.sortMethod;
    const sortedItems = this.getSortedQueue(sortMethod)
      .map((item, index) => ({
        ...item,
        position: index + 1,
        estimatedWaitTime: this.calculateEstimatedWaitTime(index + 1)
      }));

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      this.status,
      sortedItems,
      this.configuration,
      sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Pause queue
   */
  pause(pausedBy: string): WaitingQueue {
    if (this.status !== 'active') {
      throw new Error('Only active queues can be paused');
    }

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      'paused',
      this.items,
      this.configuration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Resume queue
   */
  resume(resumedBy: string): WaitingQueue {
    if (this.status !== 'paused') {
      throw new Error('Only paused queues can be resumed');
    }

    return new WaitingQueue(
      this.id,
      this.name,
      this.location,
      'active',
      this.items,
      this.configuration,
      this.sortMethod,
      this.professionalIds,
      this.maxCapacity,
      this.isActive,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  // Private helper methods

  /**
   * Calculate priority score for patient
   */
  private calculatePriority(
    urgency: 'low' | 'medium' | 'high' | 'urgent',
    specialNeeds: string[],
    isWalkIn: boolean,
    hasInsuranceIssues: boolean
  ): number {
    let priority = 1;

    // Urgency factor
    switch (urgency) {
      case 'urgent': priority += 5; break;
      case 'high': priority += 3; break;
      case 'medium': priority += 1; break;
      case 'low': priority += 0; break;
    }

    // Special needs factor
    priority += specialNeeds.length * 0.5;

    // Walk-in penalty (if appointments are prioritized)
    if (isWalkIn && this.configuration.prioritizeAppointments) {
      priority -= 1;
    }

    // Insurance issues factor
    if (hasInsuranceIssues) {
      priority += 1;
    }

    return Math.max(1, Math.min(10, priority));
  }

  /**
   * Calculate new position for patient based on priority
   */
  private calculateNewPosition(urgency: 'low' | 'medium' | 'high' | 'urgent', isWalkIn: boolean): number {
    if (urgency === 'urgent') {
      return 1; // Urgent patients go to front
    }

    if (this.configuration.prioritizeAppointments && !isWalkIn) {
      // Find position before first walk-in
      const firstWalkInIndex = this.items.findIndex(item => item.isWalkIn);
      return firstWalkInIndex === -1 ? this.items.length + 1 : firstWalkInIndex + 1;
    }

    return this.items.length + 1; // Add to end
  }

  /**
   * Calculate estimated wait time for position
   */
  private calculateEstimatedWaitTime(position: number, serviceTime?: number): number {
    const estimatedServiceTime = serviceTime || this.configuration.estimatedServiceTime;
    return (position - 1) * estimatedServiceTime;
  }

  /**
   * Insert item at specific position and adjust others
   */
  private insertItemAtPosition(newItem: QueueItem): QueueItem[] {
    const items = [...this.items];
    
    // Adjust positions of existing items
    for (let i = 0; i < items.length; i++) {
      if (items[i].position >= newItem.position) {
        items[i] = {
          ...items[i],
          position: items[i].position + 1,
          estimatedWaitTime: this.calculateEstimatedWaitTime(items[i].position + 1)
        };
      }
    }

    return [...items, newItem].sort((a, b) => a.position - b.position);
  }

  /**
   * Business logic: Get operating hours for transaction velocity calculation
   */
  getOperatingHours(): number {
    // Default to 8 hours per day - this could be configurable
    // or calculated based on clinic schedule
    return 8;
  }

  /**
   * Get sorted queue based on sort method
   */
  private getSortedQueue(sortMethod?: SortMethod): QueueItem[] {
    const method = sortMethod || this.sortMethod;
    const items = [...this.items];

    switch (method) {
      case 'priority':
        return items.sort((a, b) => b.priority - a.priority);
      
      case 'urgency':
        const urgencyOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return items.sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency]);
      
      case 'appointment_time':
        return items.sort((a, b) => {
          if (a.isWalkIn && !b.isWalkIn) return 1;
          if (!a.isWalkIn && b.isWalkIn) return -1;
          return a.arrivalTime.getTime() - b.arrivalTime.getTime();
        });
      
      case 'arrival_time':
      default:
        return items.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());
    }
  }
}