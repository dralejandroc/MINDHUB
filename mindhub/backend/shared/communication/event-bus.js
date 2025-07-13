/**
 * Event Bus for Inter-Service Communication - MindHub Healthcare Platform
 * 
 * Event-driven architecture with healthcare-specific event patterns,
 * message persistence, delivery guarantees, and compliance logging
 */

const EventEmitter = require('events');
const Redis = require('redis');
const crypto = require('crypto');
const AuditLogger = require('../utils/audit-logger');

class HealthcareEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase for high-volume healthcare events
    
    this.auditLogger = new AuditLogger();
    
    // Redis client for distributed events
    this.redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100
    });

    this.redisSubscriber = this.redisClient.duplicate();
    this.redisPublisher = this.redisClient.duplicate();

    // Event persistence and tracking
    this.eventStore = new Map();
    this.eventSubscriptions = new Map();
    this.eventMetrics = new Map();

    // Healthcare-specific event types
    this.healthcareEventTypes = {
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

    // Event priority levels
    this.priorityLevels = {
      CRITICAL: 0,   // Emergency situations
      HIGH: 1,       // Important clinical events
      MEDIUM: 2,     // Standard healthcare operations
      LOW: 3         // Administrative events
    };

    this.setupRedisSubscriptions();
    this.setupEventMetrics();
  }

  /**
   * Setup Redis pub/sub for distributed events
   */
  async setupRedisSubscriptions() {
    try {
      await this.redisSubscriber.connect();
      await this.redisPublisher.connect();

      // Subscribe to all healthcare events
      await this.redisSubscriber.pSubscribe('healthcare:*', (message, channel) => {
        this.handleDistributedEvent(channel, message);
      });

      console.log('Event bus Redis subscriptions established');
    } catch (error) {
      console.error('Failed to setup Redis subscriptions:', error);
    }
  }

  /**
   * Setup event metrics tracking
   */
  setupEventMetrics() {
    setInterval(() => {
      this.collectEventMetrics();
    }, 60000); // Collect metrics every minute
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Create healthcare event
   */
  createEvent(type, data, options = {}) {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();

    const event = {
      id: eventId,
      type,
      timestamp,
      source: options.source || 'unknown',
      priority: options.priority || this.priorityLevels.MEDIUM,
      correlationId: options.correlationId || crypto.randomUUID(),
      version: options.version || '1.0',
      data: this.sanitizeEventData(data),
      metadata: {
        userId: options.userId,
        organizationId: options.organizationId,
        patientId: data.patientId,
        sessionId: options.sessionId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        complianceFlags: options.complianceFlags || [],
        retryCount: 0,
        maxRetries: options.maxRetries || 3
      },
      compliance: {
        requiresAudit: this.requiresAuditLogging(type),
        dataClassification: this.classifyEventData(type, data),
        retentionPeriod: this.getRetentionPeriod(type),
        encryptionRequired: this.requiresEncryption(type)
      }
    };

    return event;
  }

  /**
   * Publish healthcare event
   */
  async publishEvent(type, data, options = {}) {
    const event = this.createEvent(type, data, options);

    try {
      // Store event for tracking
      this.eventStore.set(event.id, event);

      // Log event for compliance if required
      if (event.compliance.requiresAudit) {
        await this.auditLogger.logSystemEvent(
          event.metadata.userId || 'system',
          'HEALTHCARE_EVENT_PUBLISHED',
          {
            eventId: event.id,
            eventType: event.type,
            correlationId: event.correlationId,
            priority: event.priority,
            dataClassification: event.compliance.dataClassification,
            patientId: event.metadata.patientId
          }
        );
      }

      // Emit locally
      this.emit(type, event);
      this.emit('*', event); // Global event listener

      // Publish to Redis for distributed processing
      if (options.distributed !== false) {
        await this.publishDistributedEvent(event);
      }

      // Update metrics
      this.updateEventMetrics(type, 'published');

      return {
        success: true,
        eventId: event.id,
        timestamp: event.timestamp
      };

    } catch (error) {
      console.error('Failed to publish event:', error);
      
      // Log failure
      await this.auditLogger.logSystemEvent(
        event.metadata.userId || 'system',
        'EVENT_PUBLISH_FAILED',
        {
          eventId: event.id,
          eventType: event.type,
          error: error.message,
          correlationId: event.correlationId
        }
      );

      return {
        success: false,
        error: error.message,
        eventId: event.id
      };
    }
  }

  /**
   * Subscribe to healthcare events
   */
  subscribeToEvent(eventType, handler, options = {}) {
    const subscriptionId = crypto.randomUUID();
    
    const wrappedHandler = async (event) => {
      try {
        // Log subscription execution
        if (event.compliance.requiresAudit) {
          await this.auditLogger.logSystemEvent(
            'system',
            'EVENT_HANDLER_EXECUTED',
            {
              subscriptionId,
              eventId: event.id,
              eventType: event.type,
              handlerName: options.name || 'anonymous',
              correlationId: event.correlationId
            }
          );
        }

        // Execute handler
        await handler(event);

        // Update metrics
        this.updateEventMetrics(eventType, 'processed');

      } catch (error) {
        console.error(`Event handler failed for ${eventType}:`, error);
        
        // Log handler failure
        await this.auditLogger.logSystemEvent(
          'system',
          'EVENT_HANDLER_FAILED',
          {
            subscriptionId,
            eventId: event.id,
            eventType: event.type,
            error: error.message,
            correlationId: event.correlationId
          }
        );

        // Retry if configured
        if (event.metadata.retryCount < event.metadata.maxRetries) {
          await this.retryEventHandler(event, handler, subscriptionId);
        }
      }
    };

    // Register subscription
    this.on(eventType, wrappedHandler);
    
    // Track subscription
    this.eventSubscriptions.set(subscriptionId, {
      eventType,
      handler: wrappedHandler,
      subscribedAt: new Date().toISOString(),
      options
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribeFromEvent(subscriptionId) {
    const subscription = this.eventSubscriptions.get(subscriptionId);
    if (subscription) {
      this.removeListener(subscription.eventType, subscription.handler);
      this.eventSubscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  /**
   * Publish distributed event via Redis
   */
  async publishDistributedEvent(event) {
    const channel = `healthcare:${event.type}`;
    const message = JSON.stringify(event);
    
    await this.redisPublisher.publish(channel, message);
  }

  /**
   * Handle distributed event from Redis
   */
  async handleDistributedEvent(channel, message) {
    try {
      const event = JSON.parse(message);
      const eventType = channel.replace('healthcare:', '');
      
      // Emit event locally (avoid infinite loop by not re-publishing)
      this.emit(eventType, event);
      this.emit('*', event);

      // Update metrics
      this.updateEventMetrics(eventType, 'received');

    } catch (error) {
      console.error('Failed to handle distributed event:', error);
    }
  }

  /**
   * Retry failed event handler
   */
  async retryEventHandler(event, handler, subscriptionId) {
    event.metadata.retryCount++;
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, event.metadata.retryCount - 1), 30000);
    
    setTimeout(async () => {
      try {
        await handler(event);
        
        await this.auditLogger.logSystemEvent(
          'system',
          'EVENT_HANDLER_RETRY_SUCCESS',
          {
            subscriptionId,
            eventId: event.id,
            eventType: event.type,
            retryCount: event.metadata.retryCount
          }
        );

      } catch (error) {
        await this.auditLogger.logSystemEvent(
          'system',
          'EVENT_HANDLER_RETRY_FAILED',
          {
            subscriptionId,
            eventId: event.id,
            eventType: event.type,
            retryCount: event.metadata.retryCount,
            error: error.message
          }
        );

        // Continue retrying if not exhausted
        if (event.metadata.retryCount < event.metadata.maxRetries) {
          await this.retryEventHandler(event, handler, subscriptionId);
        }
      }
    }, delay);
  }

  /**
   * Sanitize event data to remove sensitive information
   */
  sanitizeEventData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = [
      'password', 'ssn', 'curp', 'creditCard', 'bankAccount',
      'socialSecurityNumber', 'personalIdentificationNumber'
    ];

    function sanitizeObject(obj) {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Check if event type requires audit logging
   */
  requiresAuditLogging(eventType) {
    const auditRequiredEvents = [
      this.healthcareEventTypes.PATIENT_CREATED,
      this.healthcareEventTypes.PATIENT_UPDATED,
      this.healthcareEventTypes.ASSESSMENT_COMPLETED,
      this.healthcareEventTypes.PRESCRIPTION_CREATED,
      this.healthcareEventTypes.CONSENT_GIVEN,
      this.healthcareEventTypes.CONSENT_REVOKED,
      this.healthcareEventTypes.EMERGENCY_ALERT,
      this.healthcareEventTypes.PRIVACY_VIOLATION
    ];

    return auditRequiredEvents.includes(eventType);
  }

  /**
   * Classify event data for compliance
   */
  classifyEventData(eventType, data) {
    if (data.patientId || data.medicalRecordNumber) {
      return 'PHI'; // Protected Health Information
    }

    if (eventType.includes('prescription') || eventType.includes('diagnosis')) {
      return 'MEDICAL';
    }

    if (eventType.includes('consent') || eventType.includes('privacy')) {
      return 'CONSENT';
    }

    return 'GENERAL';
  }

  /**
   * Get retention period for event type
   */
  getRetentionPeriod(eventType) {
    const retentionPolicies = {
      'patient.*': '7 years',
      'assessment.*': '10 years',
      'prescription.*': '5 years',
      'consent.*': '10 years',
      'emergency.*': '10 years',
      'audit.*': '7 years',
      'default': '3 years'
    };

    for (const [pattern, period] of Object.entries(retentionPolicies)) {
      if (pattern === 'default') continue;
      
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(eventType)) {
        return period;
      }
    }

    return retentionPolicies.default;
  }

  /**
   * Check if event requires encryption
   */
  requiresEncryption(eventType) {
    const encryptionRequiredEvents = [
      this.healthcareEventTypes.PATIENT_CREATED,
      this.healthcareEventTypes.PATIENT_UPDATED,
      this.healthcareEventTypes.ASSESSMENT_COMPLETED,
      this.healthcareEventTypes.PRESCRIPTION_CREATED
    ];

    return encryptionRequiredEvents.includes(eventType);
  }

  /**
   * Update event metrics
   */
  updateEventMetrics(eventType, action) {
    const key = `${eventType}:${action}`;
    const current = this.eventMetrics.get(key) || 0;
    this.eventMetrics.set(key, current + 1);
  }

  /**
   * Collect and log event metrics
   */
  async collectEventMetrics() {
    const metrics = {};
    this.eventMetrics.forEach((count, key) => {
      const [eventType, action] = key.split(':');
      if (!metrics[eventType]) {
        metrics[eventType] = {};
      }
      metrics[eventType][action] = count;
    });

    await this.auditLogger.logSystemEvent(
      'system',
      'EVENT_METRICS_COLLECTED',
      {
        timestamp: new Date().toISOString(),
        metrics,
        totalSubscriptions: this.eventSubscriptions.size,
        totalStoredEvents: this.eventStore.size
      }
    );
  }

  /**
   * Get event metrics
   */
  getEventMetrics() {
    const metrics = {};
    this.eventMetrics.forEach((count, key) => {
      const [eventType, action] = key.split(':');
      if (!metrics[eventType]) {
        metrics[eventType] = {};
      }
      metrics[eventType][action] = count;
    });
    return metrics;
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions() {
    const subscriptions = [];
    this.eventSubscriptions.forEach((subscription, id) => {
      subscriptions.push({
        id,
        eventType: subscription.eventType,
        subscribedAt: subscription.subscribedAt,
        options: subscription.options
      });
    });
    return subscriptions;
  }

  /**
   * Healthcare-specific event publishers
   */

  // Patient events
  async publishPatientCreated(patientData, userId, options = {}) {
    return this.publishEvent(this.healthcareEventTypes.PATIENT_CREATED, patientData, {
      ...options,
      userId,
      priority: this.priorityLevels.HIGH,
      complianceFlags: ['NOM-024-SSA3-2010']
    });
  }

  async publishPatientUpdated(patientId, changes, userId, options = {}) {
    return this.publishEvent(this.healthcareEventTypes.PATIENT_UPDATED, {
      patientId,
      changes
    }, {
      ...options,
      userId,
      priority: this.priorityLevels.MEDIUM,
      complianceFlags: ['NOM-024-SSA3-2010']
    });
  }

  // Clinical events
  async publishAssessmentCompleted(assessmentData, userId, options = {}) {
    return this.publishEvent(this.healthcareEventTypes.ASSESSMENT_COMPLETED, assessmentData, {
      ...options,
      userId,
      priority: this.priorityLevels.HIGH,
      complianceFlags: ['NOM-024-SSA3-2010', 'CLINICAL_VALIDATION']
    });
  }

  // Emergency events
  async publishEmergencyAlert(alertData, userId, options = {}) {
    return this.publishEvent(this.healthcareEventTypes.EMERGENCY_ALERT, alertData, {
      ...options,
      userId,
      priority: this.priorityLevels.CRITICAL,
      complianceFlags: ['EMERGENCY_RESPONSE']
    });
  }

  // Form events
  async publishFormSubmitted(formData, userId, options = {}) {
    return this.publishEvent(this.healthcareEventTypes.FORM_SUBMITTED, formData, {
      ...options,
      userId,
      priority: this.priorityLevels.MEDIUM
    });
  }

  /**
   * Cleanup old events
   */
  async cleanup() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const [eventId, event] of this.eventStore.entries()) {
      if (new Date(event.timestamp) < cutoffDate) {
        this.eventStore.delete(eventId);
      }
    }

    console.log('Event bus cleanup completed');
  }
}

module.exports = HealthcareEventBus;