/**
 * Communication Manager for MindHub Healthcare Platform
 * 
 * Unified communication orchestrator combining HTTP requests, event bus,
 * message queues, and real-time communications with healthcare patterns
 */

const ServiceCommunicator = require('./service-communicator');
const HealthcareEventBus = require('./event-bus');
const HealthcareMessageQueue = require('./message-queue');
const AuditLogger = require('../utils/audit-logger');

class CommunicationManager {
  constructor() {
    this.serviceCommunicator = new ServiceCommunicator();
    this.eventBus = new HealthcareEventBus();
    this.messageQueue = new HealthcareMessageQueue();
    this.auditLogger = new AuditLogger();
    
    // Communication patterns registry
    this.patterns = {
      // Synchronous patterns
      REQUEST_RESPONSE: 'request_response',
      AGGREGATE: 'aggregate',
      BROADCAST: 'broadcast',
      
      // Asynchronous patterns
      FIRE_AND_FORGET: 'fire_and_forget',
      PUBLISH_SUBSCRIBE: 'publish_subscribe',
      COMMAND_QUERY: 'command_query',
      
      // Healthcare-specific patterns
      PATIENT_DATA_SYNC: 'patient_data_sync',
      CLINICAL_WORKFLOW: 'clinical_workflow',
      EMERGENCY_BROADCAST: 'emergency_broadcast',
      COMPLIANCE_AUDIT: 'compliance_audit'
    };

    // Communication strategies
    this.strategies = {
      // Real-time synchronous communication
      SYNCHRONOUS: {
        method: 'http',
        timeout: 5000,
        retries: 3,
        fallback: 'ASYNCHRONOUS'
      },
      
      // Asynchronous reliable communication
      ASYNCHRONOUS: {
        method: 'queue',
        priority: 'normal',
        persistent: true,
        fallback: 'EVENT'
      },
      
      // Event-driven communication
      EVENT: {
        method: 'event',
        distributed: true,
        persistent: false,
        fallback: null
      },
      
      // Critical healthcare communication
      CRITICAL: {
        method: 'multi',
        channels: ['http', 'queue', 'event'],
        priority: 'emergency',
        timeout: 2000
      }
    };

    this.setupCommunicationPatterns();
    this.setupHealthcareWorkflows();
  }

  /**
   * Setup communication patterns
   */
  setupCommunicationPatterns() {
    // Subscribe to critical events that need immediate action
    this.eventBus.subscribeToEvent('emergency.*', async (event) => {
      await this.handleEmergencyEvent(event);
    }, { name: 'emergency_handler' });

    // Subscribe to patient data events for synchronization
    this.eventBus.subscribeToEvent('patient.*', async (event) => {
      await this.handlePatientDataEvent(event);
    }, { name: 'patient_sync_handler' });

    // Subscribe to compliance events
    this.eventBus.subscribeToEvent('audit.*', async (event) => {
      await this.handleComplianceEvent(event);
    }, { name: 'compliance_handler' });
  }

  /**
   * Setup healthcare-specific workflows
   */
  setupHealthcareWorkflows() {
    // Patient admission workflow
    this.registerWorkflow('patient_admission', [
      { service: 'expedix', action: 'create_patient_record' },
      { service: 'clinimetrix', action: 'create_assessment_profile' },
      { service: 'formx', action: 'assign_intake_forms' },
      { service: 'resources', action: 'assign_educational_materials' }
    ]);

    // Clinical assessment workflow
    this.registerWorkflow('clinical_assessment', [
      { service: 'clinimetrix', action: 'process_assessment' },
      { service: 'expedix', action: 'update_clinical_data' },
      { service: 'integrix', action: 'trigger_care_plan_update' }
    ]);

    // Emergency response workflow
    this.registerWorkflow('emergency_response', [
      { service: 'expedix', action: 'flag_emergency_status' },
      { service: 'clinimetrix', action: 'assess_risk_level' },
      { service: 'integrix', action: 'notify_emergency_contacts' },
      { service: 'formx', action: 'create_incident_report' }
    ]);
  }

  /**
   * Execute communication using specified pattern
   */
  async execute(pattern, data, options = {}) {
    const correlationId = options.correlationId || this.generateCorrelationId();
    
    try {
      // Log communication start
      await this.auditLogger.logSystemEvent(
        options.userId || 'system',
        'COMMUNICATION_STARTED',
        {
          pattern,
          correlationId,
          strategy: options.strategy || 'AUTO',
          targetServices: options.services,
          hasPatientData: !!data.patientId
        }
      );

      let result;
      
      switch (pattern) {
        case this.patterns.REQUEST_RESPONSE:
          result = await this.executeRequestResponse(data, options);
          break;
          
        case this.patterns.AGGREGATE:
          result = await this.executeAggregate(data, options);
          break;
          
        case this.patterns.BROADCAST:
          result = await this.executeBroadcast(data, options);
          break;
          
        case this.patterns.FIRE_AND_FORGET:
          result = await this.executeFireAndForget(data, options);
          break;
          
        case this.patterns.PUBLISH_SUBSCRIBE:
          result = await this.executePublishSubscribe(data, options);
          break;
          
        case this.patterns.PATIENT_DATA_SYNC:
          result = await this.executePatientDataSync(data, options);
          break;
          
        case this.patterns.CLINICAL_WORKFLOW:
          result = await this.executeClinicalWorkflow(data, options);
          break;
          
        case this.patterns.EMERGENCY_BROADCAST:
          result = await this.executeEmergencyBroadcast(data, options);
          break;
          
        case this.patterns.COMPLIANCE_AUDIT:
          result = await this.executeComplianceAudit(data, options);
          break;
          
        default:
          throw new Error(`Unknown communication pattern: ${pattern}`);
      }

      // Log successful completion
      await this.auditLogger.logSystemEvent(
        options.userId || 'system',
        'COMMUNICATION_COMPLETED',
        {
          pattern,
          correlationId,
          success: true,
          duration: result.duration || 0
        }
      );

      return {
        success: true,
        pattern,
        correlationId,
        result
      };

    } catch (error) {
      // Log failure
      await this.auditLogger.logSystemEvent(
        options.userId || 'system',
        'COMMUNICATION_FAILED',
        {
          pattern,
          correlationId,
          error: error.message,
          strategy: options.strategy
        }
      );

      // Try fallback strategy if available
      if (options.strategy && this.strategies[options.strategy]?.fallback) {
        const fallbackStrategy = this.strategies[options.strategy].fallback;
        return this.execute(pattern, data, { ...options, strategy: fallbackStrategy });
      }

      throw error;
    }
  }

  /**
   * Request-Response pattern
   */
  async executeRequestResponse(data, options) {
    const { service, endpoint, method = 'POST' } = options;
    
    return this.serviceCommunicator.makeRequest(
      service, 
      method, 
      endpoint, 
      data, 
      {
        user: options.user,
        correlationId: options.correlationId,
        timeout: options.timeout
      }
    );
  }

  /**
   * Aggregate pattern - collect data from multiple services
   */
  async executeAggregate(data, options) {
    const requests = options.requests || [];
    
    return this.serviceCommunicator.aggregate(requests, {
      user: options.user,
      correlationId: options.correlationId
    });
  }

  /**
   * Broadcast pattern - send to multiple services
   */
  async executeBroadcast(data, options) {
    const { services, endpoint } = options;
    
    return this.serviceCommunicator.broadcast(services, endpoint, data, {
      user: options.user,
      correlationId: options.correlationId
    });
  }

  /**
   * Fire and Forget pattern - asynchronous queue
   */
  async executeFireAndForget(data, options) {
    const { queueName, jobType, priority } = options;
    
    return this.messageQueue.addJob(queueName, jobType, data, {
      userId: options.userId,
      priority,
      correlationId: options.correlationId
    });
  }

  /**
   * Publish-Subscribe pattern - event bus
   */
  async executePublishSubscribe(data, options) {
    const { eventType } = options;
    
    return this.eventBus.publishEvent(eventType, data, {
      userId: options.userId,
      correlationId: options.correlationId,
      priority: options.priority,
      complianceFlags: options.complianceFlags
    });
  }

  /**
   * Patient Data Sync pattern - healthcare-specific synchronization
   */
  async executePatientDataSync(data, options) {
    const { patientId } = data;
    const { targetServices = ['expedix', 'clinimetrix', 'formx'] } = options;
    
    // Validate patient data access
    if (!options.user || !patientId) {
      throw new Error('Patient data sync requires authenticated user and patient ID');
    }

    // Log patient data sync for compliance
    await this.auditLogger.logComplianceEvent(
      options.user.id,
      'PATIENT_DATA_SYNC_INITIATED',
      {
        patientId,
        targetServices,
        correlationId: options.correlationId,
        justification: options.justification || 'Clinical care synchronization'
      }
    );

    const results = [];
    
    // Synchronize with each service
    for (const service of targetServices) {
      try {
        const result = await this.serviceCommunicator.requestPatientData(
          service,
          patientId,
          'sync',
          options.user,
          { correlationId: options.correlationId }
        );
        
        results.push({
          service,
          success: result.success,
          data: result.data
        });
        
      } catch (error) {
        results.push({
          service,
          success: false,
          error: error.message
        });
      }
    }

    return {
      patientId,
      syncResults: results,
      overallSuccess: results.every(r => r.success)
    };
  }

  /**
   * Clinical Workflow pattern - orchestrated healthcare processes
   */
  async executeClinicalWorkflow(data, options) {
    const { workflowName } = options;
    const workflow = this.workflows.get(workflowName);
    
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const results = [];
    let context = { ...data };

    // Execute workflow steps
    for (const step of workflow.steps) {
      try {
        const result = await this.serviceCommunicator.post(
          step.service,
          `/api/v1/${step.action}`,
          context,
          {
            user: options.user,
            correlationId: options.correlationId
          }
        );

        results.push({
          step: step.action,
          service: step.service,
          success: result.success,
          data: result.data
        });

        // Update context with result data
        if (result.success && result.data) {
          context = { ...context, ...result.data };
        }

        // Stop on failure if required
        if (!result.success && step.required !== false) {
          break;
        }

      } catch (error) {
        results.push({
          step: step.action,
          service: step.service,
          success: false,
          error: error.message
        });

        if (step.required !== false) {
          break;
        }
      }
    }

    return {
      workflowName,
      steps: results,
      completed: results.every(r => r.success),
      context
    };
  }

  /**
   * Emergency Broadcast pattern - critical healthcare alerts
   */
  async executeEmergencyBroadcast(data, options) {
    const correlationId = options.correlationId;
    
    // Use multiple channels for emergency communication
    const channels = [
      // Immediate HTTP notifications
      this.serviceCommunicator.broadcast(
        ['expedix', 'clinimetrix', 'integrix'],
        '/api/v1/emergency/alert',
        data,
        { user: options.user, correlationId }
      ),
      
      // Emergency queue for processing
      this.messageQueue.queueEmergencyAlert(data, options.userId, { correlationId }),
      
      // Event for real-time notifications
      this.eventBus.publishEmergencyAlert(data, options.userId, { correlationId })
    ];

    const results = await Promise.allSettled(channels);
    
    return {
      emergencyId: correlationId,
      channels: results.map((result, index) => ({
        channel: ['http', 'queue', 'event'][index],
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : result.reason
      }))
    };
  }

  /**
   * Compliance Audit pattern - regulatory compliance tracking
   */
  async executeComplianceAudit(data, options) {
    const { auditType, scope } = options;
    
    // Queue compliance processing
    const queueResult = await this.messageQueue.addJob(
      'compliance',
      'compliance_check',
      {
        auditType,
        scope,
        data,
        timestamp: new Date().toISOString()
      },
      {
        userId: options.userId,
        priority: this.messageQueue.priorities.HIGH,
        correlationId: options.correlationId,
        complianceFlags: ['NOM-024-SSA3-2010', 'AUDIT_TRAIL']
      }
    );

    // Publish audit event
    const eventResult = await this.eventBus.publishEvent(
      this.eventBus.healthcareEventTypes.AUDIT_REQUIRED,
      {
        auditType,
        scope,
        initiatedBy: options.userId
      },
      {
        userId: options.userId,
        correlationId: options.correlationId,
        complianceFlags: ['REGULATORY_COMPLIANCE']
      }
    );

    return {
      auditType,
      scope,
      queueResult,
      eventResult,
      auditId: options.correlationId
    };
  }

  /**
   * Handle emergency events
   */
  async handleEmergencyEvent(event) {
    // Emergency events get highest priority processing
    await this.messageQueue.queueEmergencyAlert(
      event.data,
      event.metadata.userId,
      {
        correlationId: event.correlationId,
        priority: this.messageQueue.priorities.EMERGENCY
      }
    );
  }

  /**
   * Handle patient data events
   */
  async handlePatientDataEvent(event) {
    // Patient data changes trigger synchronization
    if (event.type.includes('updated') || event.type.includes('created')) {
      await this.executePatientDataSync(
        event.data,
        {
          user: { id: event.metadata.userId },
          correlationId: event.correlationId,
          justification: 'Automated sync due to patient data change'
        }
      );
    }
  }

  /**
   * Handle compliance events
   */
  async handleComplianceEvent(event) {
    // Compliance events need special audit processing
    await this.messageQueue.addJob(
      'compliance',
      'audit_log_processing',
      event.data,
      {
        userId: event.metadata.userId,
        priority: this.messageQueue.priorities.HIGH,
        correlationId: event.correlationId
      }
    );
  }

  /**
   * Register workflow
   */
  registerWorkflow(name, steps) {
    if (!this.workflows) {
      this.workflows = new Map();
    }
    
    this.workflows.set(name, {
      name,
      steps,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Get workflow
   */
  getWorkflow(name) {
    return this.workflows?.get(name);
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats() {
    const [
      serviceHealth,
      queueStats,
      eventMetrics,
      circuitBreakers
    ] = await Promise.all([
      this.serviceCommunicator.getAllServicesHealth(),
      this.messageQueue.getAllQueueStats(),
      this.eventBus.getEventMetrics(),
      this.serviceCommunicator.getAllCircuitBreakersStatus()
    ]);

    return {
      timestamp: new Date().toISOString(),
      services: {
        health: serviceHealth,
        circuitBreakers
      },
      queues: queueStats,
      events: eventMetrics,
      workflows: this.workflows ? Array.from(this.workflows.keys()) : []
    };
  }

  /**
   * Health check for communication manager
   */
  async healthCheck() {
    const stats = await this.getCommunicationStats();
    
    const healthy = {
      services: Object.values(stats.services.health).every(h => h.healthy),
      queues: Object.values(stats.queues).every(q => q.counts.failed < 10),
      events: Object.keys(stats.events).length > 0
    };

    return {
      healthy: Object.values(healthy).every(h => h),
      components: healthy,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CommunicationManager;