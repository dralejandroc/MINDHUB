/**
 * API Contract Validation for MindHub Healthcare Platform
 * 
 * Validates API endpoints against their contracts to ensure consistency,
 * proper request/response formats, and compliance with healthcare standards
 */

const Joi = require('joi');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

class APIContractValidation {
  constructor(app, config = {}) {
    this.app = app;
    this.config = {
      baseURL: config.baseURL || '/api/v1',
      strictValidation: config.strictValidation !== false,
      ...config
    };
    
    this.contracts = this.initializeContracts();
    this.validators = this.initializeValidators();
  }

  /**
   * Initialize API contracts with schemas
   */
  initializeContracts() {
    return {
      // Authentication contracts
      auth: {
        login: {
          request: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
          }),
          response: {
            200: Joi.object({
              token: Joi.string().required(),
              refreshToken: Joi.string().required(),
              expiresIn: Joi.number().required(),
              user: Joi.object({
                id: Joi.string().uuid().required(),
                email: Joi.string().email().required(),
                role: Joi.string().valid('admin', 'psychiatrist', 'psychologist', 'nurse', 'patient').required(),
                permissions: Joi.array().items(Joi.string()).required()
              }).required()
            }),
            401: Joi.object({
              error: Joi.string().required(),
              code: Joi.string().valid('INVALID_CREDENTIALS').required()
            })
          }
        },
        refresh: {
          request: Joi.object({
            refreshToken: Joi.string().required()
          }),
          response: {
            200: Joi.object({
              token: Joi.string().required(),
              expiresIn: Joi.number().required()
            }),
            401: Joi.object({
              error: Joi.string().required(),
              code: Joi.string().valid('INVALID_REFRESH_TOKEN', 'EXPIRED_REFRESH_TOKEN').required()
            })
          }
        },
        logout: {
          request: Joi.object({}),
          response: {
            200: Joi.object({
              message: Joi.string().required()
            })
          }
        }
      },

      // Patient management contracts
      patients: {
        create: {
          request: Joi.object({
            firstName: Joi.string().min(1).max(100).required(),
            lastName: Joi.string().min(1).max(100).required(),
            dateOfBirth: Joi.date().iso().max('now').required(),
            gender: Joi.string().valid('male', 'female', 'other').required(),
            contactInfo: Joi.object({
              email: Joi.string().email().required(),
              phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).required(),
              address: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required(),
                zipCode: Joi.string().required(),
                country: Joi.string().required()
              }).required()
            }).required(),
            emergencyContact: Joi.object({
              name: Joi.string().required(),
              relationship: Joi.string().required(),
              phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).required()
            }).optional(),
            medicalHistory: Joi.object({
              allergies: Joi.array().items(Joi.string()).optional(),
              medications: Joi.array().items(Joi.string()).optional(),
              conditions: Joi.array().items(Joi.string()).optional()
            }).optional()
          }),
          response: {
            201: Joi.object({
              data: Joi.object({
                id: Joi.string().uuid().required(),
                medicalRecordNumber: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                dateOfBirth: Joi.date().iso().required(),
                gender: Joi.string().required(),
                contactInfo: Joi.object().required(),
                createdAt: Joi.date().iso().required(),
                updatedAt: Joi.date().iso().required()
              }).required()
            }),
            422: Joi.object({
              error: Joi.string().required(),
              code: Joi.string().valid('VALIDATION_ERROR').required(),
              details: Joi.array().items(Joi.object({
                field: Joi.string().required(),
                message: Joi.string().required()
              })).required()
            })
          }
        },
        get: {
          request: Joi.object({}), // No body for GET
          response: {
            200: Joi.object({
              data: Joi.object({
                id: Joi.string().uuid().required(),
                medicalRecordNumber: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                dateOfBirth: Joi.date().iso().required(),
                gender: Joi.string().required(),
                contactInfo: Joi.object().required(),
                emergencyContact: Joi.object().optional(),
                medicalHistory: Joi.object().optional(),
                createdAt: Joi.date().iso().required(),
                updatedAt: Joi.date().iso().required()
              }).required()
            }),
            404: Joi.object({
              error: Joi.string().required(),
              code: Joi.string().valid('PATIENT_NOT_FOUND').required()
            })
          }
        },
        list: {
          request: Joi.object({}),
          queryParams: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().optional(),
            sortBy: Joi.string().valid('firstName', 'lastName', 'createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional()
          }),
          response: {
            200: Joi.object({
              data: Joi.array().items(Joi.object({
                id: Joi.string().uuid().required(),
                medicalRecordNumber: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                dateOfBirth: Joi.date().iso().required(),
                gender: Joi.string().required()
              })).required(),
              pagination: Joi.object({
                page: Joi.number().required(),
                limit: Joi.number().required(),
                total: Joi.number().required(),
                totalPages: Joi.number().required()
              }).required()
            })
          }
        }
      },

      // Clinical assessment contracts
      assessments: {
        create: {
          request: Joi.object({
            patientId: Joi.string().uuid().required(),
            scaleId: Joi.string().required(),
            administrationType: Joi.string().valid('self_administered', 'hetero_administered').required(),
            responses: Joi.array().items(Joi.object({
              itemId: Joi.string().required(),
              value: Joi.string().required()
            })).min(1).required(),
            notes: Joi.string().optional(),
            metadata: Joi.object().optional()
          }),
          response: {
            201: Joi.object({
              data: Joi.object({
                id: Joi.string().uuid().required(),
                patientId: Joi.string().uuid().required(),
                scaleId: Joi.string().required(),
                administrationType: Joi.string().required(),
                status: Joi.string().valid('in_progress', 'completed').required(),
                scores: Joi.object({
                  totalScore: Joi.number().required(),
                  subscales: Joi.object().optional(),
                  percentile: Joi.number().optional(),
                  severity: Joi.string().optional()
                }).required(),
                interpretation: Joi.string().optional(),
                createdAt: Joi.date().iso().required(),
                completedAt: Joi.date().iso().optional()
              }).required()
            }),
            422: Joi.object({
              error: Joi.string().required(),
              code: Joi.string().valid('VALIDATION_ERROR', 'INVALID_SCALE_ID', 'INVALID_RESPONSES').required(),
              details: Joi.array().optional()
            })
          }
        }
      },

      // Gateway contracts
      gateway: {
        serviceDiscovery: {
          request: Joi.object({}),
          response: {
            200: Joi.object({
              services: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                version: Joi.string().required(),
                status: Joi.string().valid('healthy', 'unhealthy', 'degraded').required(),
                endpoints: Joi.array().items(Joi.string()).required(),
                lastHealthCheck: Joi.date().iso().required()
              })).required()
            })
          }
        },
        health: {
          request: Joi.object({}),
          response: {
            200: Joi.object({
              status: Joi.string().valid('healthy', 'unhealthy', 'degraded').required(),
              timestamp: Joi.date().iso().required(),
              version: Joi.string().required(),
              checks: Joi.object({
                database: Joi.object({
                  status: Joi.string().valid('up', 'down').required(),
                  latency: Joi.number().optional()
                }).required(),
                cache: Joi.object({
                  status: Joi.string().valid('up', 'down').required(),
                  latency: Joi.number().optional()
                }).optional(),
                services: Joi.object().pattern(
                  Joi.string(),
                  Joi.object({
                    status: Joi.string().valid('up', 'down').required(),
                    latency: Joi.number().optional()
                  })
                ).required()
              }).required()
            })
          }
        }
      },

      // Hub link contracts
      hubLinks: {
        generateToken: {
          request: Joi.object({
            patientId: Joi.string().uuid().required(),
            expiresIn: Joi.number().optional().default(3600),
            scope: Joi.array().items(Joi.string()).optional()
          }),
          response: {
            200: Joi.object({
              token: Joi.string().required(),
              expiresIn: Joi.number().required(),
              tokenType: Joi.string().valid('Bearer').required(),
              scope: Joi.array().items(Joi.string()).required()
            })
          }
        },
        patientTimeline: {
          request: Joi.object({}),
          response: {
            200: Joi.object({
              patient: Joi.object({
                id: Joi.string().uuid().required(),
                name: Joi.string().required()
              }).required(),
              timeline: Joi.array().items(Joi.object({
                id: Joi.string().required(),
                type: Joi.string().valid('assessment', 'consultation', 'prescription', 'form_submission').required(),
                timestamp: Joi.date().iso().required(),
                service: Joi.string().required(),
                summary: Joi.string().required(),
                details: Joi.object().optional()
              })).required()
            })
          }
        }
      }
    };
  }

  /**
   * Initialize validators for different data types
   */
  initializeValidators() {
    return {
      // UUID validator
      uuid: (value) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
      },

      // JWT token validator
      jwt: (value) => {
        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        return jwtRegex.test(value);
      },

      // ISO date validator
      isoDate: (value) => {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date) && value === date.toISOString();
      },

      // Email validator
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },

      // Phone validator (international format)
      phone: (value) => {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
      }
    };
  }

  /**
   * Validate request against contract
   */
  validateRequest(contractPath, data) {
    const contract = this.getContractByPath(contractPath);
    if (!contract || !contract.request) {
      return { valid: true }; // No contract defined
    }

    const { error, value } = contract.request.validate(data, {
      abortEarly: false,
      stripUnknown: !this.config.strictValidation
    });

    if (error) {
      return {
        valid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      };
    }

    return { valid: true, value };
  }

  /**
   * Validate response against contract
   */
  validateResponse(contractPath, statusCode, data) {
    const contract = this.getContractByPath(contractPath);
    if (!contract || !contract.response || !contract.response[statusCode]) {
      return { valid: true }; // No contract defined for this status
    }

    const { error, value } = contract.response[statusCode].validate(data, {
      abortEarly: false,
      stripUnknown: !this.config.strictValidation
    });

    if (error) {
      return {
        valid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      };
    }

    return { valid: true, value };
  }

  /**
   * Get contract by path
   */
  getContractByPath(path) {
    const parts = path.split('.');
    let contract = this.contracts;
    
    for (const part of parts) {
      contract = contract[part];
      if (!contract) return null;
    }
    
    return contract;
  }

  /**
   * Test all contracts
   */
  async testAllContracts(testSuite) {
    const results = {
      timestamp: new Date().toISOString(),
      totalContracts: 0,
      passedContracts: 0,
      failedContracts: 0,
      contracts: {}
    };

    // Test authentication contracts
    results.contracts.authentication = await this.testAuthenticationContracts(testSuite);
    
    // Test patient management contracts
    results.contracts.patients = await this.testPatientContracts(testSuite);
    
    // Test assessment contracts
    results.contracts.assessments = await this.testAssessmentContracts(testSuite);
    
    // Test gateway contracts
    results.contracts.gateway = await this.testGatewayContracts(testSuite);
    
    // Test hub link contracts
    results.contracts.hubLinks = await this.testHubLinkContracts(testSuite);

    // Calculate totals
    for (const category of Object.values(results.contracts)) {
      for (const test of category.tests || []) {
        results.totalContracts++;
        if (test.passed) {
          results.passedContracts++;
        } else {
          results.failedContracts++;
        }
      }
    }

    results.passRate = results.totalContracts > 0 
      ? Math.round((results.passedContracts / results.totalContracts) * 100)
      : 0;

    return results;
  }

  /**
   * Test authentication contracts
   */
  async testAuthenticationContracts(testSuite) {
    const results = { tests: [] };

    // Test login contract
    const loginTest = {
      name: 'Login Contract',
      endpoint: '/api/auth/login',
      tests: []
    };

    // Valid login
    const validLoginResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/auth/login',
      {
        email: 'test@example.com',
        password: 'TestPassword123!'
      },
      'auth.login'
    );
    loginTest.tests.push(validLoginResult);

    // Invalid login (missing password)
    const invalidLoginResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/auth/login',
      {
        email: 'test@example.com'
      },
      'auth.login',
      422
    );
    loginTest.tests.push(invalidLoginResult);

    loginTest.passed = loginTest.tests.every(t => t.passed);
    results.tests.push(loginTest);

    // Test refresh token contract
    const refreshTest = {
      name: 'Refresh Token Contract',
      endpoint: '/api/auth/refresh',
      tests: []
    };

    const refreshResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/auth/refresh',
      {
        refreshToken: 'mock-refresh-token'
      },
      'auth.refresh'
    );
    refreshTest.tests.push(refreshResult);
    refreshTest.passed = refreshTest.tests.every(t => t.passed);
    results.tests.push(refreshTest);

    return results;
  }

  /**
   * Test patient contracts
   */
  async testPatientContracts(testSuite) {
    const results = { tests: [] };

    // Test patient creation contract
    const createTest = {
      name: 'Create Patient Contract',
      endpoint: '/api/expedix/patients',
      tests: []
    };

    const validPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      gender: 'male',
      contactInfo: {
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        }
      }
    };

    const createResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/expedix/patients',
      validPatient,
      'patients.create',
      201
    );
    createTest.tests.push(createResult);

    // Test invalid patient (missing required fields)
    const invalidPatient = {
      firstName: 'John',
      // Missing required fields
    };

    const invalidResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/expedix/patients',
      invalidPatient,
      'patients.create',
      422
    );
    createTest.tests.push(invalidResult);

    createTest.passed = createTest.tests.every(t => t.passed);
    results.tests.push(createTest);

    // Test patient list contract
    const listTest = {
      name: 'List Patients Contract',
      endpoint: '/api/expedix/patients',
      tests: []
    };

    const listResult = await this.testEndpointContract(
      testSuite,
      'GET',
      '/expedix/patients?page=1&limit=10',
      null,
      'patients.list',
      200
    );
    listTest.tests.push(listResult);
    listTest.passed = listTest.tests.every(t => t.passed);
    results.tests.push(listTest);

    return results;
  }

  /**
   * Test assessment contracts
   */
  async testAssessmentContracts(testSuite) {
    const results = { tests: [] };

    const createTest = {
      name: 'Create Assessment Contract',
      endpoint: '/api/clinimetrix/assessments',
      tests: []
    };

    const validAssessment = {
      patientId: uuidv4(),
      scaleId: 'PHQ-9',
      administrationType: 'self_administered',
      responses: [
        { itemId: 'PHQ9_1', value: '2' },
        { itemId: 'PHQ9_2', value: '1' },
        { itemId: 'PHQ9_3', value: '3' }
      ],
      notes: 'Patient was cooperative'
    };

    const createResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/clinimetrix/assessments',
      validAssessment,
      'assessments.create',
      201
    );
    createTest.tests.push(createResult);
    createTest.passed = createTest.tests.every(t => t.passed);
    results.tests.push(createTest);

    return results;
  }

  /**
   * Test gateway contracts
   */
  async testGatewayContracts(testSuite) {
    const results = { tests: [] };

    // Test service discovery contract
    const discoveryTest = {
      name: 'Service Discovery Contract',
      endpoint: '/api/gateway/services',
      tests: []
    };

    const discoveryResult = await this.testEndpointContract(
      testSuite,
      'GET',
      '/gateway/services',
      null,
      'gateway.serviceDiscovery',
      200
    );
    discoveryTest.tests.push(discoveryResult);
    discoveryTest.passed = discoveryTest.tests.every(t => t.passed);
    results.tests.push(discoveryTest);

    // Test health check contract
    const healthTest = {
      name: 'Health Check Contract',
      endpoint: '/api/gateway/health',
      tests: []
    };

    const healthResult = await this.testEndpointContract(
      testSuite,
      'GET',
      '/gateway/health',
      null,
      'gateway.health',
      200
    );
    healthTest.tests.push(healthResult);
    healthTest.passed = healthTest.tests.every(t => t.passed);
    results.tests.push(healthTest);

    return results;
  }

  /**
   * Test hub link contracts
   */
  async testHubLinkContracts(testSuite) {
    const results = { tests: [] };

    // Test token generation contract
    const tokenTest = {
      name: 'Generate Token Contract',
      endpoint: '/api/hub-links/generate-token/clinimetrix-to-expedix',
      tests: []
    };

    const tokenResult = await this.testEndpointContract(
      testSuite,
      'POST',
      '/hub-links/generate-token/clinimetrix-to-expedix',
      {
        patientId: uuidv4(),
        expiresIn: 3600
      },
      'hubLinks.generateToken',
      200
    );
    tokenTest.tests.push(tokenResult);
    tokenTest.passed = tokenTest.tests.every(t => t.passed);
    results.tests.push(tokenTest);

    return results;
  }

  /**
   * Test individual endpoint contract
   */
  async testEndpointContract(testSuite, method, endpoint, requestData, contractPath, expectedStatus = 200) {
    try {
      // Make the request
      let response;
      if (method === 'GET') {
        response = await testSuite.authenticatedRequest(method.toLowerCase(), endpoint, testSuite.testUsers.psychiatrist);
      } else {
        response = await testSuite.authenticatedRequest(method.toLowerCase(), endpoint, testSuite.testUsers.psychiatrist)
          .send(requestData);
      }

      // Validate request if applicable
      let requestValidation = { valid: true };
      if (requestData) {
        requestValidation = this.validateRequest(contractPath, requestData);
      }

      // Validate response
      const responseValidation = this.validateResponse(contractPath, response.status, response.body);

      const passed = requestValidation.valid && 
                    responseValidation.valid && 
                    response.status === expectedStatus;

      return {
        endpoint: `${method} ${endpoint}`,
        contractPath,
        passed,
        status: response.status,
        expectedStatus,
        requestValidation,
        responseValidation,
        details: {
          requestValid: requestValidation.valid,
          responseValid: responseValidation.valid,
          statusMatch: response.status === expectedStatus,
          errors: [
            ...(requestValidation.errors || []),
            ...(responseValidation.errors || [])
          ]
        }
      };

    } catch (error) {
      return {
        endpoint: `${method} ${endpoint}`,
        contractPath,
        passed: false,
        error: error.message,
        details: {
          requestValid: false,
          responseValid: false,
          statusMatch: false,
          errors: [{ message: error.message }]
        }
      };
    }
  }

  /**
   * Generate contract validation report
   */
  generateContractReport(results) {
    const report = {
      title: 'API Contract Validation Report',
      timestamp: results.timestamp,
      summary: {
        total: results.totalContracts,
        passed: results.passedContracts,
        failed: results.failedContracts,
        passRate: results.passRate,
        status: results.failedContracts === 0 ? 'PASSED' : 'FAILED'
      },
      contracts: results.contracts,
      violations: this.extractViolations(results),
      recommendations: this.generateContractRecommendations(results)
    };

    return report;
  }

  /**
   * Extract contract violations
   */
  extractViolations(results) {
    const violations = [];

    for (const [category, categoryResults] of Object.entries(results.contracts)) {
      for (const test of categoryResults.tests || []) {
        if (!test.passed && test.details && test.details.errors) {
          for (const error of test.details.errors) {
            violations.push({
              category,
              endpoint: test.endpoint,
              contract: test.contractPath,
              field: error.field,
              message: error.message,
              type: error.type
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Generate contract recommendations
   */
  generateContractRecommendations(results) {
    const recommendations = [];
    const violations = this.extractViolations(results);

    // Group violations by type
    const violationTypes = {};
    for (const violation of violations) {
      const type = violation.type || 'unknown';
      if (!violationTypes[type]) {
        violationTypes[type] = [];
      }
      violationTypes[type].push(violation);
    }

    // Generate recommendations based on violation types
    if (violationTypes['any.required']) {
      recommendations.push('Ensure all required fields are included in API requests');
    }

    if (violationTypes['string.email']) {
      recommendations.push('Validate email formats before sending to the API');
    }

    if (violationTypes['date.max']) {
      recommendations.push('Ensure date fields do not contain future dates where not allowed');
    }

    if (violationTypes['string.valid']) {
      recommendations.push('Use only allowed values for enum fields (e.g., gender, status)');
    }

    if (results.failedContracts > 0) {
      recommendations.push(`Fix ${results.failedContracts} contract violations to ensure API consistency`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All API contracts are valid - maintain current standards');
    }

    return recommendations;
  }

  /**
   * Export contract documentation
   */
  exportContractDocumentation() {
    const documentation = {
      title: 'MindHub API Contract Documentation',
      version: '1.0.0',
      generated: new Date().toISOString(),
      endpoints: []
    };

    // Convert contracts to documentation format
    const flattenContracts = (contracts, prefix = '') => {
      for (const [key, value] of Object.entries(contracts)) {
        if (value.request || value.response) {
          documentation.endpoints.push({
            path: prefix + key,
            contract: {
              request: value.request ? value.request.describe() : null,
              response: value.response ? Object.entries(value.response).reduce((acc, [status, schema]) => {
                acc[status] = schema.describe();
                return acc;
              }, {}) : null
            }
          });
        } else if (typeof value === 'object') {
          flattenContracts(value, prefix + key + '.');
        }
      }
    };

    flattenContracts(this.contracts);
    return documentation;
  }
}

module.exports = APIContractValidation;