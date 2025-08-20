/**
 * Communication Module Index for MindHub Healthcare Platform
 * 
 * Central export point for all inter-service communication components
 */

const ServiceCommunicator = require('./service-communicator');
const HealthcareEventBus = require('./event-bus');
const HealthcareMessageQueue = require('./message-queue');
const CommunicationManager = require('./communication-manager');

// Initialize singleton instances
let serviceCommunicator = null;
let eventBus = null;
let messageQueue = null;
let communicationManager = null;

/**
 * Get or create ServiceCommunicator singleton
 */
function getServiceCommunicator() {
  if (!serviceCommunicator) {
    serviceCommunicator = new ServiceCommunicator();
  }
  return serviceCommunicator;
}

/**
 * Get or create HealthcareEventBus singleton
 */
function getEventBus() {
  if (!eventBus) {
    eventBus = new HealthcareEventBus();
  }
  return eventBus;
}

/**
 * Get or create HealthcareMessageQueue singleton
 */
function getMessageQueue() {
  if (!messageQueue) {
    messageQueue = new HealthcareMessageQueue();
  }
  return messageQueue;
}

/**
 * Get or create CommunicationManager singleton
 */
function getCommunicationManager() {
  if (!communicationManager) {
    communicationManager = new CommunicationManager();
  }
  return communicationManager;
}

/**
 * Initialize all communication components
 */
async function initialize() {
  try {
    // Initialize components in order
    const services = getServiceCommunicator();
    const events = getEventBus();
    const queues = getMessageQueue();
    const manager = getCommunicationManager();

    // Perform health checks
    const healthChecks = await Promise.all([
      services.checkAllServicesHealth(),
      manager.healthCheck()
    ]);

    console.log('Communication components initialized successfully');
    return {
      success: true,
      components: {
        serviceCommunicator: true,
        eventBus: true,
        messageQueue: true,
        communicationManager: true
      },
      healthChecks
    };

  } catch (error) {
    console.error('Failed to initialize communication components:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Shutdown all communication components gracefully
 */
async function shutdown() {
  try {
    const promises = [];

    if (eventBus) {
      promises.push(eventBus.cleanup());
    }

    if (messageQueue) {
      // Close all queue connections
      Object.values(messageQueue.queues).forEach(queue => {
        promises.push(queue.close());
      });
    }

    await Promise.all(promises);
    
    // Reset singletons
    serviceCommunicator = null;
    eventBus = null;
    messageQueue = null;
    communicationManager = null;

    console.log('Communication components shut down successfully');
    return { success: true };

  } catch (error) {
    console.error('Error during communication shutdown:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Health check for all communication components
 */
async function healthCheck() {
  try {
    const manager = getCommunicationManager();
    return await manager.healthCheck();
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get communication statistics
 */
async function getStats() {
  try {
    const manager = getCommunicationManager();
    return await manager.getCommunicationStats();
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Communication patterns constants
 */
const PATTERNS = {
  REQUEST_RESPONSE: 'request_response',
  AGGREGATE: 'aggregate',
  BROADCAST: 'broadcast',
  FIRE_AND_FORGET: 'fire_and_forget',
  PUBLISH_SUBSCRIBE: 'publish_subscribe',
  COMMAND_QUERY: 'command_query',
  PATIENT_DATA_SYNC: 'patient_data_sync',
  CLINICAL_WORKFLOW: 'clinical_workflow',
  EMERGENCY_BROADCAST: 'emergency_broadcast',
  COMPLIANCE_AUDIT: 'compliance_audit'
};

/**
 * Healthcare event types constants
 */
const HEALTHCARE_EVENTS = {
  // Patient events
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_DISCHARGED: 'patient.discharged',
  PATIENT_ADMITTED: 'patient.admitted',
  
  // Clinical events
  ASSESSMENT_COMPLETED: 'assessment.completed',
  DIAGNOSIS_UPDATED: 'diagnosis.updated',
  PRESCRIPTION_CREATED: 'prescription.created',
  PRESCRIPTION_DISPENSED: 'prescription.dispensed',
  
  // Form events
  FORM_SUBMITTED: 'form.submitted',
  CONSENT_GIVEN: 'consent.given',
  CONSENT_REVOKED: 'consent.revoked',
  
  // Critical alerts
  EMERGENCY_ALERT: 'emergency.alert',
  CRITICAL_VALUE: 'critical.value',
  MEDICATION_ALERT: 'medication.alert',
  
  // System events
  SERVICE_STARTED: 'service.started',
  SERVICE_STOPPED: 'service.stopped',
  BACKUP_COMPLETED: 'backup.completed',
  
  // Compliance events
  AUDIT_REQUIRED: 'audit.required',
  DATA_ACCESS_LOGGED: 'data.access.logged',
  PRIVACY_VIOLATION: 'privacy.violation'
};

/**
 * Queue priorities constants
 */
const PRIORITIES = {
  EMERGENCY: 1,
  CRITICAL: 2,
  HIGH: 3,
  NORMAL: 4,
  LOW: 5
};

module.exports = {
  // Singleton getters
  getServiceCommunicator,
  getEventBus,
  getMessageQueue,
  getCommunicationManager,

  // Lifecycle management
  initialize,
  shutdown,
  healthCheck,
  getStats,

  // Class constructors (for non-singleton usage)
  ServiceCommunicator,
  HealthcareEventBus,
  HealthcareMessageQueue,
  CommunicationManager,

  // Constants
  PATTERNS,
  HEALTHCARE_EVENTS,
  PRIORITIES,

  // Convenience methods
  async execute(pattern, data, options = {}) {
    const manager = getCommunicationManager();
    return manager.execute(pattern, data, options);
  },

  async publishEvent(eventType, data, options = {}) {
    const events = getEventBus();
    return events.publishEvent(eventType, data, options);
  },

  async subscribeToEvent(eventType, handler, options = {}) {
    const events = getEventBus();
    return events.subscribeToEvent(eventType, handler, options);
  },

  async queueJob(queueName, jobType, data, options = {}) {
    const queues = getMessageQueue();
    return queues.addJob(queueName, jobType, data, options);
  },

  async makeRequest(service, method, endpoint, data, options = {}) {
    const services = getServiceCommunicator();
    return services.makeRequest(service, method, endpoint, data, options);
  },

  // Healthcare-specific convenience methods
  async syncPatientData(patientId, targetServices, user, options = {}) {
    return this.execute(PATTERNS.PATIENT_DATA_SYNC, { patientId }, {
      targetServices,
      user,
      ...options
    });
  },

  async executeClinicalWorkflow(workflowName, data, user, options = {}) {
    return this.execute(PATTERNS.CLINICAL_WORKFLOW, data, {
      workflowName,
      user,
      ...options
    });
  },

  async broadcastEmergency(alertData, user, options = {}) {
    return this.execute(PATTERNS.EMERGENCY_BROADCAST, alertData, {
      user,
      userId: user.id,
      ...options
    });
  },

  async auditCompliance(auditType, scope, user, options = {}) {
    return this.execute(PATTERNS.COMPLIANCE_AUDIT, {}, {
      auditType,
      scope,
      userId: user.id,
      ...options
    });
  }
};