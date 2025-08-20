/**
 * Inter-Service Communication Manager for MindHub Healthcare Platform
 * 
 * Centralized service communication with healthcare-specific patterns,
 * circuit breakers, retry mechanisms, and compliance logging
 */

const axios = require('axios');
const crypto = require('crypto');
const AuditLogger = require('../utils/audit-logger');

class ServiceCommunicator {
  constructor() {
    this.auditLogger = new AuditLogger();
    
    // Service registry
    this.services = {
      expedix: {
        baseUrl: process.env.EXPEDIX_SERVICE_URL || 'http://localhost:3001',
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          failureThreshold: 5,
          resetTimeout: 30000,
          monitoringPeriod: 60000
        }
      },
      clinimetrix: {
        baseUrl: process.env.CLINIMETRIX_SERVICE_URL || 'http://localhost:3002',
        healthEndpoint: '/health',
        timeout: 8000,
        retries: 3,
        circuitBreaker: {
          failureThreshold: 5,
          resetTimeout: 30000,
          monitoringPeriod: 60000
        }
      },
      formx: {
        baseUrl: process.env.FORMX_SERVICE_URL || 'http://localhost:3003',
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 2,
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeout: 20000,
          monitoringPeriod: 60000
        }
      },
      resources: {
        baseUrl: process.env.RESOURCES_SERVICE_URL || 'http://localhost:3004',
        healthEndpoint: '/health',
        timeout: 3000,
        retries: 2,
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeout: 20000,
          monitoringPeriod: 60000
        }
      },
      integrix: {
        baseUrl: process.env.INTEGRIX_SERVICE_URL || 'http://localhost:3005',
        healthEndpoint: '/health',
        timeout: 10000,
        retries: 5,
        circuitBreaker: {
          failureThreshold: 10,
          resetTimeout: 60000,
          monitoringPeriod: 120000
        }
      }
    };

    // Circuit breaker states
    this.circuitBreakers = new Map();
    
    // Request correlation tracking
    this.correlationMap = new Map();
    
    // Service health status
    this.serviceHealth = new Map();

    // Initialize circuit breakers
    this.initializeCircuitBreakers();
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Initialize circuit breakers for all services
   */
  initializeCircuitBreakers() {
    Object.keys(this.services).forEach(serviceName => {
      this.circuitBreakers.set(serviceName, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failures: 0,
        lastFailure: null,
        nextAttempt: null,
        successCount: 0
      });
    });
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      await this.checkAllServicesHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate correlation ID for request tracing
   */
  generateCorrelationId() {
    return `mindhub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Create authenticated request headers
   */
  createHeaders(correlationId, user = null, additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Service-Caller': 'integrix',
      'X-Request-Timestamp': new Date().toISOString(),
      ...additionalHeaders
    };

    // Add user context if available
    if (user) {
      headers['X-User-ID'] = user.id;
      headers['X-User-Role'] = user.role;
      headers['X-Organization-ID'] = user.organizationId;
    }

    // Add service authentication token
    const serviceToken = this.generateServiceToken();
    headers['Authorization'] = `Bearer ${serviceToken}`;

    return headers;
  }

  /**
   * Generate inter-service authentication token
   */
  generateServiceToken() {
    const payload = {
      iss: 'integrix',
      aud: 'mindhub-services',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    };

    // In production, use proper JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    const config = this.services[serviceName].circuitBreaker;
    const now = Date.now();

    switch (breaker.state) {
      case 'OPEN':
        if (now >= breaker.nextAttempt) {
          breaker.state = 'HALF_OPEN';
          breaker.successCount = 0;
          return { canProceed: true, state: 'HALF_OPEN' };
        }
        return { canProceed: false, state: 'OPEN' };

      case 'HALF_OPEN':
        return { canProceed: true, state: 'HALF_OPEN' };

      case 'CLOSED':
      default:
        return { canProceed: true, state: 'CLOSED' };
    }
  }

  /**
   * Record circuit breaker success
   */
  recordSuccess(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (breaker.state === 'HALF_OPEN') {
      breaker.successCount++;
      if (breaker.successCount >= 3) {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        breaker.lastFailure = null;
      }
    } else if (breaker.state === 'CLOSED') {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  /**
   * Record circuit breaker failure
   */
  recordFailure(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    const config = this.services[serviceName].circuitBreaker;
    const now = Date.now();

    breaker.failures++;
    breaker.lastFailure = now;

    if (breaker.failures >= config.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = now + config.resetTimeout;
      
      this.auditLogger.logSystemEvent(
        'system',
        'CIRCUIT_BREAKER_OPENED',
        {
          serviceName,
          failures: breaker.failures,
          threshold: config.failureThreshold,
          resetTime: new Date(breaker.nextAttempt).toISOString()
        }
      );
    }
  }

  /**
   * Make HTTP request with retry and circuit breaker
   */
  async makeRequest(serviceName, method, endpoint, data = null, options = {}) {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const service = this.services[serviceName];
    
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Check circuit breaker
    const circuitState = this.checkCircuitBreaker(serviceName);
    if (!circuitState.canProceed) {
      throw new Error(`Service ${serviceName} is currently unavailable (circuit breaker OPEN)`);
    }

    const headers = this.createHeaders(correlationId, options.user, options.headers);
    const requestConfig = {
      method,
      url: `${service.baseUrl}${endpoint}`,
      headers,
      timeout: options.timeout || service.timeout,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined
    };

    let lastError;
    const maxRetries = options.retries !== undefined ? options.retries : service.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Log request
        await this.auditLogger.logSystemEvent(
          options.user?.id || 'system',
          'INTER_SERVICE_REQUEST',
          {
            serviceName,
            method,
            endpoint,
            correlationId,
            attempt: attempt + 1,
            circuitState: circuitState.state,
            hasData: !!data
          }
        );

        const response = await axios(requestConfig);
        const duration = Date.now() - startTime;

        // Record success
        this.recordSuccess(serviceName);

        // Log successful response
        await this.auditLogger.logSystemEvent(
          options.user?.id || 'system',
          'INTER_SERVICE_RESPONSE_SUCCESS',
          {
            serviceName,
            endpoint,
            correlationId,
            statusCode: response.status,
            duration,
            responseSize: JSON.stringify(response.data).length
          }
        );

        return {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers,
          correlationId,
          duration
        };

      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Log error
        await this.auditLogger.logSystemEvent(
          options.user?.id || 'system',
          'INTER_SERVICE_REQUEST_FAILED',
          {
            serviceName,
            endpoint,
            correlationId,
            attempt: attempt + 1,
            error: error.message,
            statusCode: error.response?.status,
            duration
          }
        );

        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Record failure for circuit breaker
    this.recordFailure(serviceName);

    return {
      success: false,
      error: lastError.message,
      status: lastError.response?.status,
      correlationId,
      attempts: maxRetries + 1
    };
  }

  /**
   * GET request wrapper
   */
  async get(serviceName, endpoint, params = {}, options = {}) {
    return this.makeRequest(serviceName, 'GET', endpoint, params, options);
  }

  /**
   * POST request wrapper
   */
  async post(serviceName, endpoint, data = {}, options = {}) {
    return this.makeRequest(serviceName, 'POST', endpoint, data, options);
  }

  /**
   * PUT request wrapper
   */
  async put(serviceName, endpoint, data = {}, options = {}) {
    return this.makeRequest(serviceName, 'PUT', endpoint, data, options);
  }

  /**
   * DELETE request wrapper
   */
  async delete(serviceName, endpoint, options = {}) {
    return this.makeRequest(serviceName, 'DELETE', endpoint, null, options);
  }

  /**
   * Broadcast message to multiple services
   */
  async broadcast(services, endpoint, data, options = {}) {
    const correlationId = this.generateCorrelationId();
    const promises = services.map(serviceName => 
      this.post(serviceName, endpoint, data, { 
        ...options, 
        correlationId: `${correlationId}_${serviceName}` 
      })
    );

    const results = await Promise.allSettled(promises);
    
    return {
      correlationId,
      results: results.map((result, index) => ({
        service: services[index],
        success: result.status === 'fulfilled' && result.value.success,
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : result.value?.error
      }))
    };
  }

  /**
   * Aggregate data from multiple services
   */
  async aggregate(requests, options = {}) {
    const correlationId = this.generateCorrelationId();
    const promises = requests.map(req => 
      this.makeRequest(req.service, req.method, req.endpoint, req.data, {
        ...options,
        correlationId: `${correlationId}_${req.service}`
      })
    );

    const results = await Promise.allSettled(promises);
    const aggregatedData = {};
    const errors = [];

    results.forEach((result, index) => {
      const request = requests[index];
      if (result.status === 'fulfilled' && result.value.success) {
        aggregatedData[request.service] = result.value.data;
      } else {
        errors.push({
          service: request.service,
          error: result.status === 'rejected' ? result.reason : result.value?.error
        });
      }
    });

    return {
      correlationId,
      success: errors.length === 0,
      data: aggregatedData,
      errors,
      partialSuccess: Object.keys(aggregatedData).length > 0
    };
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      return { healthy: false, error: 'Service not found' };
    }

    try {
      const response = await axios.get(`${service.baseUrl}${service.healthEndpoint}`, {
        timeout: 3000
      });

      const health = {
        healthy: response.status === 200,
        status: response.status,
        data: response.data,
        responseTime: response.headers['x-response-time'],
        lastChecked: new Date().toISOString()
      };

      this.serviceHealth.set(serviceName, health);
      return health;

    } catch (error) {
      const health = {
        healthy: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      };

      this.serviceHealth.set(serviceName, health);
      return health;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServicesHealth() {
    const healthChecks = Object.keys(this.services).map(async serviceName => {
      const health = await this.checkServiceHealth(serviceName);
      return { service: serviceName, ...health };
    });

    const results = await Promise.allSettled(healthChecks);
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        service: 'unknown',
        healthy: false,
        error: result.reason
      }
    );
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName) {
    return this.serviceHealth.get(serviceName) || { healthy: false, error: 'No health data' };
  }

  /**
   * Get all services health status
   */
  getAllServicesHealth() {
    const health = {};
    this.serviceHealth.forEach((status, service) => {
      health[service] = status;
    });
    return health;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(serviceName) {
    return this.circuitBreakers.get(serviceName);
  }

  /**
   * Get all circuit breakers status
   */
  getAllCircuitBreakersStatus() {
    const status = {};
    this.circuitBreakers.forEach((breaker, service) => {
      status[service] = breaker;
    });
    return status;
  }

  /**
   * Healthcare-specific patient data request
   */
  async requestPatientData(serviceName, patientId, dataType, user, options = {}) {
    const correlationId = this.generateCorrelationId();
    
    // Log healthcare data request for compliance
    await this.auditLogger.logComplianceEvent(
      user.id,
      'INTER_SERVICE_PATIENT_DATA_REQUEST',
      {
        serviceName,
        patientId,
        dataType,
        correlationId,
        userRole: user.role,
        justification: options.justification || 'Clinical care',
        accessLevel: 'READ'
      }
    );

    const endpoint = `/api/patients/${patientId}/${dataType}`;
    const result = await this.get(serviceName, endpoint, {}, { 
      user, 
      correlationId,
      headers: {
        'X-Data-Type': dataType,
        'X-Patient-ID': patientId,
        'X-Healthcare-Context': 'clinical_care'
      }
    });

    // Log result for compliance
    await this.auditLogger.logComplianceEvent(
      user.id,
      'INTER_SERVICE_PATIENT_DATA_RESPONSE',
      {
        serviceName,
        patientId,
        dataType,
        correlationId,
        success: result.success,
        accessGranted: result.success
      }
    );

    return result;
  }

  /**
   * Synchronized multi-service operation
   */
  async synchronizedOperation(operations, options = {}) {
    const correlationId = this.generateCorrelationId();
    const results = [];
    
    // Execute operations in sequence
    for (const operation of operations) {
      const result = await this.makeRequest(
        operation.service,
        operation.method,
        operation.endpoint,
        operation.data,
        { 
          ...options, 
          correlationId: `${correlationId}_${operation.service}` 
        }
      );

      results.push({
        operation: operation.name || `${operation.service}_${operation.method}`,
        service: operation.service,
        success: result.success,
        data: result.data,
        error: result.error
      });

      // Stop on failure if required
      if (!result.success && options.stopOnFailure) {
        break;
      }
    }

    return {
      correlationId,
      results,
      overallSuccess: results.every(r => r.success)
    };
  }
}

module.exports = ServiceCommunicator;