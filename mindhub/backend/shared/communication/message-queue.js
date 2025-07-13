/**
 * Message Queue System for MindHub Healthcare Platform
 * 
 * Reliable message processing with healthcare-specific queues,
 * priority handling, dead letter queues, and compliance tracking
 */

const Bull = require('bull');
const Redis = require('redis');
const AuditLogger = require('../utils/audit-logger');

class HealthcareMessageQueue {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Redis configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 1 // Use separate database for queues
    };

    // Healthcare-specific queues
    this.queues = {
      // Critical healthcare operations
      critical: new Bull('critical-healthcare', this.redisConfig),
      
      // Patient data processing
      patientData: new Bull('patient-data-processing', this.redisConfig),
      
      // Clinical assessments
      assessments: new Bull('clinical-assessments', this.redisConfig),
      
      // Form processing
      forms: new Bull('form-processing', this.redisConfig),
      
      // Notifications
      notifications: new Bull('healthcare-notifications', this.redisConfig),
      
      // Reports and analytics
      reports: new Bull('reports-analytics', this.redisConfig),
      
      // Background tasks
      background: new Bull('background-tasks', this.redisConfig),
      
      // Compliance and audit
      compliance: new Bull('compliance-processing', this.redisConfig),
      
      // Integration tasks
      integration: new Bull('service-integration', this.redisConfig),
      
      // Dead letter queue for failed messages
      deadLetter: new Bull('dead-letter-queue', this.redisConfig)
    };

    // Job priorities
    this.priorities = {
      EMERGENCY: 1,
      CRITICAL: 2,
      HIGH: 3,
      NORMAL: 4,
      LOW: 5
    };

    // Queue configurations
    this.queueConfigs = {
      critical: {
        concurrency: 5,
        maxAttempts: 5,
        backoffType: 'exponential',
        backoffDelay: 2000,
        removeOnComplete: 100,
        removeOnFail: 50
      },
      patientData: {
        concurrency: 10,
        maxAttempts: 3,
        backoffType: 'fixed',
        backoffDelay: 5000,
        removeOnComplete: 200,
        removeOnFail: 100
      },
      assessments: {
        concurrency: 8,
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 3000,
        removeOnComplete: 150,
        removeOnFail: 75
      },
      forms: {
        concurrency: 15,
        maxAttempts: 2,
        backoffType: 'fixed',
        backoffDelay: 2000,
        removeOnComplete: 300,
        removeOnFail: 100
      },
      notifications: {
        concurrency: 20,
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 1000,
        removeOnComplete: 500,
        removeOnFail: 200
      },
      reports: {
        concurrency: 3,
        maxAttempts: 2,
        backoffType: 'fixed',
        backoffDelay: 10000,
        removeOnComplete: 50,
        removeOnFail: 25
      },
      background: {
        concurrency: 5,
        maxAttempts: 2,
        backoffType: 'fixed',
        backoffDelay: 30000,
        removeOnComplete: 100,
        removeOnFail: 50
      },
      compliance: {
        concurrency: 3,
        maxAttempts: 5,
        backoffType: 'exponential',
        backoffDelay: 5000,
        removeOnComplete: 1000,
        removeOnFail: 500
      },
      integration: {
        concurrency: 8,
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 3000,
        removeOnComplete: 200,
        removeOnFail: 100
      }
    };

    this.setupQueues();
    this.setupJobProcessors();
    this.setupEventHandlers();
  }

  /**
   * Setup queue configurations
   */
  setupQueues() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      const config = this.queueConfigs[queueName] || this.queueConfigs.background;
      
      // Configure queue settings
      queue.defaultJobOptions = {
        attempts: config.maxAttempts,
        backoff: {
          type: config.backoffType,
          delay: config.backoffDelay
        },
        removeOnComplete: config.removeOnComplete,
        removeOnFail: config.removeOnFail
      };
    });
  }

  /**
   * Setup job processors for each queue
   */
  setupJobProcessors() {
    // Critical healthcare operations processor
    this.queues.critical.process('*', this.queueConfigs.critical.concurrency, async (job) => {
      return this.processCriticalJob(job);
    });

    // Patient data processor
    this.queues.patientData.process('*', this.queueConfigs.patientData.concurrency, async (job) => {
      return this.processPatientDataJob(job);
    });

    // Assessment processor
    this.queues.assessments.process('*', this.queueConfigs.assessments.concurrency, async (job) => {
      return this.processAssessmentJob(job);
    });

    // Form processor
    this.queues.forms.process('*', this.queueConfigs.forms.concurrency, async (job) => {
      return this.processFormJob(job);
    });

    // Notification processor
    this.queues.notifications.process('*', this.queueConfigs.notifications.concurrency, async (job) => {
      return this.processNotificationJob(job);
    });

    // Reports processor
    this.queues.reports.process('*', this.queueConfigs.reports.concurrency, async (job) => {
      return this.processReportJob(job);
    });

    // Background tasks processor
    this.queues.background.process('*', this.queueConfigs.background.concurrency, async (job) => {
      return this.processBackgroundJob(job);
    });

    // Compliance processor
    this.queues.compliance.process('*', this.queueConfigs.compliance.concurrency, async (job) => {
      return this.processComplianceJob(job);
    });

    // Integration processor
    this.queues.integration.process('*', this.queueConfigs.integration.concurrency, async (job) => {
      return this.processIntegrationJob(job);
    });
  }

  /**
   * Setup event handlers for monitoring
   */
  setupEventHandlers() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      // Job completed
      queue.on('completed', async (job, result) => {
        await this.handleJobCompleted(queueName, job, result);
      });

      // Job failed
      queue.on('failed', async (job, error) => {
        await this.handleJobFailed(queueName, job, error);
      });

      // Job stalled
      queue.on('stalled', async (job) => {
        await this.handleJobStalled(queueName, job);
      });
    });
  }

  /**
   * Add job to queue
   */
  async addJob(queueName, jobType, data, options = {}) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Sanitize sensitive data
    const sanitizedData = this.sanitizeJobData(data);

    // Add healthcare-specific metadata
    const jobData = {
      ...sanitizedData,
      metadata: {
        queueName,
        jobType,
        timestamp: new Date().toISOString(),
        correlationId: options.correlationId || this.generateCorrelationId(),
        userId: options.userId,
        organizationId: options.organizationId,
        patientId: data.patientId,
        complianceFlags: options.complianceFlags || [],
        priority: options.priority || this.priorities.NORMAL
      }
    };

    // Queue-specific options
    const jobOptions = {
      priority: options.priority || this.priorities.NORMAL,
      delay: options.delay || 0,
      attempts: options.attempts || this.queueConfigs[queueName]?.maxAttempts || 3,
      ...options
    };

    try {
      const job = await queue.add(jobType, jobData, jobOptions);

      // Log job creation for compliance
      await this.auditLogger.logSystemEvent(
        options.userId || 'system',
        'JOB_QUEUED',
        {
          jobId: job.id,
          queueName,
          jobType,
          correlationId: jobData.metadata.correlationId,
          priority: jobOptions.priority,
          patientId: data.patientId
        }
      );

      return {
        success: true,
        jobId: job.id,
        queueName,
        correlationId: jobData.metadata.correlationId
      };

    } catch (error) {
      await this.auditLogger.logSystemEvent(
        options.userId || 'system',
        'JOB_QUEUE_FAILED',
        {
          queueName,
          jobType,
          error: error.message,
          correlationId: jobData.metadata.correlationId
        }
      );

      throw error;
    }
  }

  /**
   * Process critical healthcare jobs
   */
  async processCriticalJob(job) {
    const { data } = job;
    
    await this.auditLogger.logSystemEvent(
      data.metadata.userId || 'system',
      'CRITICAL_JOB_PROCESSING',
      {
        jobId: job.id,
        jobType: data.metadata.jobType,
        correlationId: data.metadata.correlationId,
        patientId: data.metadata.patientId
      }
    );

    switch (data.metadata.jobType) {
      case 'emergency_alert':
        return this.processEmergencyAlert(data);
      case 'critical_medication_alert':
        return this.processCriticalMedicationAlert(data);
      case 'system_failure_notification':
        return this.processSystemFailureNotification(data);
      default:
        throw new Error(`Unknown critical job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process patient data jobs
   */
  async processPatientDataJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'patient_sync':
        return this.processPatientSync(data);
      case 'medical_record_update':
        return this.processMedicalRecordUpdate(data);
      case 'patient_demographics_update':
        return this.processPatientDemographicsUpdate(data);
      case 'patient_consent_update':
        return this.processPatientConsentUpdate(data);
      default:
        throw new Error(`Unknown patient data job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process assessment jobs
   */
  async processAssessmentJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'assessment_scoring':
        return this.processAssessmentScoring(data);
      case 'assessment_interpretation':
        return this.processAssessmentInterpretation(data);
      case 'assessment_notification':
        return this.processAssessmentNotification(data);
      default:
        throw new Error(`Unknown assessment job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process form jobs
   */
  async processFormJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'form_validation':
        return this.processFormValidation(data);
      case 'form_processing':
        return this.processFormProcessing(data);
      case 'consent_form_processing':
        return this.processConsentFormProcessing(data);
      default:
        throw new Error(`Unknown form job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process notification jobs
   */
  async processNotificationJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'appointment_reminder':
        return this.processAppointmentReminder(data);
      case 'medication_reminder':
        return this.processMedicationReminder(data);
      case 'test_result_notification':
        return this.processTestResultNotification(data);
      case 'system_notification':
        return this.processSystemNotification(data);
      default:
        throw new Error(`Unknown notification job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process report jobs
   */
  async processReportJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'clinical_report_generation':
        return this.processClinicalReportGeneration(data);
      case 'compliance_report':
        return this.processComplianceReport(data);
      case 'analytics_report':
        return this.processAnalyticsReport(data);
      default:
        throw new Error(`Unknown report job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process background jobs
   */
  async processBackgroundJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'data_cleanup':
        return this.processDataCleanup(data);
      case 'backup_creation':
        return this.processBackupCreation(data);
      case 'system_maintenance':
        return this.processSystemMaintenance(data);
      default:
        throw new Error(`Unknown background job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process compliance jobs
   */
  async processComplianceJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'audit_log_processing':
        return this.processAuditLogProcessing(data);
      case 'compliance_check':
        return this.processComplianceCheck(data);
      case 'data_retention_enforcement':
        return this.processDataRetentionEnforcement(data);
      default:
        throw new Error(`Unknown compliance job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Process integration jobs
   */
  async processIntegrationJob(job) {
    const { data } = job;

    switch (data.metadata.jobType) {
      case 'service_sync':
        return this.processServiceSync(data);
      case 'data_migration':
        return this.processDataMigration(data);
      case 'external_api_call':
        return this.processExternalApiCall(data);
      default:
        throw new Error(`Unknown integration job type: ${data.metadata.jobType}`);
    }
  }

  /**
   * Handle job completion
   */
  async handleJobCompleted(queueName, job, result) {
    await this.auditLogger.logSystemEvent(
      job.data.metadata.userId || 'system',
      'JOB_COMPLETED',
      {
        jobId: job.id,
        queueName,
        jobType: job.data.metadata.jobType,
        correlationId: job.data.metadata.correlationId,
        duration: Date.now() - job.timestamp,
        result: typeof result === 'object' ? JSON.stringify(result) : result
      }
    );
  }

  /**
   * Handle job failure
   */
  async handleJobFailed(queueName, job, error) {
    await this.auditLogger.logSystemEvent(
      job.data.metadata.userId || 'system',
      'JOB_FAILED',
      {
        jobId: job.id,
        queueName,
        jobType: job.data.metadata.jobType,
        correlationId: job.data.metadata.correlationId,
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts
      }
    );

    // Move to dead letter queue if max attempts reached
    if (job.attemptsMade >= job.opts.attempts) {
      await this.moveToDeadLetterQueue(job, error);
    }
  }

  /**
   * Handle stalled jobs
   */
  async handleJobStalled(queueName, job) {
    await this.auditLogger.logSystemEvent(
      job.data.metadata.userId || 'system',
      'JOB_STALLED',
      {
        jobId: job.id,
        queueName,
        jobType: job.data.metadata.jobType,
        correlationId: job.data.metadata.correlationId
      }
    );
  }

  /**
   * Move failed job to dead letter queue
   */
  async moveToDeadLetterQueue(job, error) {
    const deadLetterData = {
      originalQueue: job.queue.name,
      originalJobId: job.id,
      originalData: job.data,
      failureReason: error.message,
      failureTimestamp: new Date().toISOString(),
      attemptsMade: job.attemptsMade
    };

    await this.queues.deadLetter.add('failed_job', deadLetterData, {
      removeOnComplete: 1000,
      removeOnFail: false
    });
  }

  /**
   * Sanitize job data to remove sensitive information
   */
  sanitizeJobData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveFields = [
      'password', 'ssn', 'curp', 'creditCard', 'token', 'secret'
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
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      },
      jobs: {
        waiting: waiting.map(job => ({ id: job.id, type: job.name, timestamp: job.timestamp })),
        active: active.map(job => ({ id: job.id, type: job.name, timestamp: job.timestamp })),
        failed: failed.map(job => ({ id: job.id, type: job.name, error: job.failedReason }))
      }
    };
  }

  /**
   * Get all queues statistics
   */
  async getAllQueueStats() {
    const stats = {};
    
    for (const queueName of Object.keys(this.queues)) {
      if (queueName !== 'deadLetter') {
        stats[queueName] = await this.getQueueStats(queueName);
      }
    }

    return stats;
  }

  /**
   * Healthcare-specific job creators
   */

  // Emergency alert job
  async queueEmergencyAlert(alertData, userId, options = {}) {
    return this.addJob('critical', 'emergency_alert', alertData, {
      ...options,
      userId,
      priority: this.priorities.EMERGENCY,
      complianceFlags: ['EMERGENCY_RESPONSE']
    });
  }

  // Patient sync job
  async queuePatientSync(patientData, userId, options = {}) {
    return this.addJob('patientData', 'patient_sync', patientData, {
      ...options,
      userId,
      priority: this.priorities.HIGH,
      complianceFlags: ['NOM-024-SSA3-2010']
    });
  }

  // Assessment scoring job
  async queueAssessmentScoring(assessmentData, userId, options = {}) {
    return this.addJob('assessments', 'assessment_scoring', assessmentData, {
      ...options,
      userId,
      priority: this.priorities.HIGH
    });
  }

  // Form processing job
  async queueFormProcessing(formData, userId, options = {}) {
    return this.addJob('forms', 'form_processing', formData, {
      ...options,
      userId,
      priority: this.priorities.NORMAL
    });
  }

  // Notification job
  async queueNotification(notificationData, userId, options = {}) {
    return this.addJob('notifications', 'system_notification', notificationData, {
      ...options,
      userId,
      priority: this.priorities.NORMAL
    });
  }

  /**
   * Placeholder job processors - would be implemented based on specific requirements
   */
  async processEmergencyAlert(data) { return { status: 'processed', message: 'Emergency alert sent' }; }
  async processCriticalMedicationAlert(data) { return { status: 'processed', message: 'Medication alert sent' }; }
  async processSystemFailureNotification(data) { return { status: 'processed', message: 'System failure notification sent' }; }
  async processPatientSync(data) { return { status: 'processed', message: 'Patient data synchronized' }; }
  async processMedicalRecordUpdate(data) { return { status: 'processed', message: 'Medical record updated' }; }
  async processPatientDemographicsUpdate(data) { return { status: 'processed', message: 'Demographics updated' }; }
  async processPatientConsentUpdate(data) { return { status: 'processed', message: 'Consent updated' }; }
  async processAssessmentScoring(data) { return { status: 'processed', message: 'Assessment scored' }; }
  async processAssessmentInterpretation(data) { return { status: 'processed', message: 'Assessment interpreted' }; }
  async processAssessmentNotification(data) { return { status: 'processed', message: 'Assessment notification sent' }; }
  async processFormValidation(data) { return { status: 'processed', message: 'Form validated' }; }
  async processFormProcessing(data) { return { status: 'processed', message: 'Form processed' }; }
  async processConsentFormProcessing(data) { return { status: 'processed', message: 'Consent form processed' }; }
  async processAppointmentReminder(data) { return { status: 'processed', message: 'Appointment reminder sent' }; }
  async processMedicationReminder(data) { return { status: 'processed', message: 'Medication reminder sent' }; }
  async processTestResultNotification(data) { return { status: 'processed', message: 'Test result notification sent' }; }
  async processSystemNotification(data) { return { status: 'processed', message: 'System notification sent' }; }
  async processClinicalReportGeneration(data) { return { status: 'processed', message: 'Clinical report generated' }; }
  async processComplianceReport(data) { return { status: 'processed', message: 'Compliance report generated' }; }
  async processAnalyticsReport(data) { return { status: 'processed', message: 'Analytics report generated' }; }
  async processDataCleanup(data) { return { status: 'processed', message: 'Data cleanup completed' }; }
  async processBackupCreation(data) { return { status: 'processed', message: 'Backup created' }; }
  async processSystemMaintenance(data) { return { status: 'processed', message: 'System maintenance completed' }; }
  async processAuditLogProcessing(data) { return { status: 'processed', message: 'Audit logs processed' }; }
  async processComplianceCheck(data) { return { status: 'processed', message: 'Compliance check completed' }; }
  async processDataRetentionEnforcement(data) { return { status: 'processed', message: 'Data retention enforced' }; }
  async processServiceSync(data) { return { status: 'processed', message: 'Service synchronized' }; }
  async processDataMigration(data) { return { status: 'processed', message: 'Data migration completed' }; }
  async processExternalApiCall(data) { return { status: 'processed', message: 'External API call completed' }; }
}

module.exports = HealthcareMessageQueue;