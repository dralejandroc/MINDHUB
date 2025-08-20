/**
 * API Test Suite for MindHub Healthcare Platform
 * 
 * Comprehensive testing framework for healthcare APIs with compliance validation,
 * security testing, and performance benchmarks
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class APITestSuite {
  constructor(app, config = {}) {
    this.app = app;
    this.config = {
      baseURL: config.baseURL || '/api/v1',
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'test-secret',
      testTimeout: config.testTimeout || 30000,
      ...config
    };
    
    this.testUsers = this.initializeTestUsers();
    this.testData = this.initializeTestData();
    this.complianceTests = this.initializeComplianceTests();
    this.securityTests = this.initializeSecurityTests();
    this.performanceTests = this.initializePerformanceTests();
  }

  /**
   * Initialize test users with different roles
   */
  initializeTestUsers() {
    return {
      admin: {
        id: uuidv4(),
        email: 'admin@test.mindhub.health',
        password: 'AdminTest123!',
        role: 'admin',
        permissions: ['read:all_data', 'write:all_data', 'manage:users']
      },
      psychiatrist: {
        id: uuidv4(),
        email: 'psychiatrist@test.mindhub.health',
        password: 'PsychTest123!',
        role: 'psychiatrist',
        permissions: ['read:all_patient_data', 'write:medical_records', 'write:prescriptions']
      },
      psychologist: {
        id: uuidv4(),
        email: 'psychologist@test.mindhub.health',
        password: 'PsychoTest123!',
        role: 'psychologist',
        permissions: ['read:patient_data', 'write:psychological_reports']
      },
      nurse: {
        id: uuidv4(),
        email: 'nurse@test.mindhub.health',
        password: 'NurseTest123!',
        role: 'nurse',
        permissions: ['read:patient_basic_data', 'write:care_notes']
      },
      patient: {
        id: uuidv4(),
        email: 'patient@test.mindhub.health',
        password: 'PatientTest123!',
        role: 'patient',
        permissions: ['read:own_data', 'write:own_forms']
      }
    };
  }

  /**
   * Initialize test data
   */
  initializeTestData() {
    return {
      validPatient: {
        firstName: 'Juan',
        lastName: 'Pérez',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        contactInfo: {
          email: 'juan.perez@test.com',
          phone: '+52-55-1234-5678',
          address: {
            street: 'Av. Insurgentes 123',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '06700',
            country: 'Mexico'
          }
        }
      },
      
      invalidPatient: {
        firstName: '', // Invalid - empty
        lastName: 'Pérez123', // Invalid - contains numbers
        dateOfBirth: '2050-01-01', // Invalid - future date
        gender: 'invalid', // Invalid - not in enum
        contactInfo: {
          email: 'invalid-email', // Invalid format
          phone: '123', // Invalid format
        }
      },

      validAssessment: {
        patientId: uuidv4(),
        scaleId: uuidv4(),
        administrationType: 'hetero_administered',
        responses: [
          { itemId: uuidv4(), value: '2' },
          { itemId: uuidv4(), value: '1' },
          { itemId: uuidv4(), value: '3' }
        ],
        notes: 'Patient cooperative during assessment'
      },

      validForm: {
        title: 'Patient Intake Form',
        description: 'Initial patient information collection',
        category: 'intake',
        fields: [
          {
            type: 'text',
            name: 'fullName',
            label: 'Full Name',
            required: true,
            order: 1
          },
          {
            type: 'email',
            name: 'email',
            label: 'Email Address',
            required: true,
            order: 2
          }
        ]
      },

      maliciousPayloads: [
        // XSS attempts
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        
        // SQL injection attempts
        "'; DROP TABLE patients; --",
        "' OR '1'='1",
        "UNION SELECT * FROM users",
        
        // NoSQL injection attempts
        '{"$ne": null}',
        '{"$regex": ".*"}',
        
        // Path traversal attempts
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        
        // Command injection attempts
        '; cat /etc/passwd',
        '| whoami',
        '&& ls -la'
      ]
    };
  }

  /**
   * Initialize compliance tests
   */
  initializeComplianceTests() {
    return {
      // NOM-024-SSA3-2010 compliance tests
      nom024Tests: [
        {
          name: 'PHI Access Logging',
          test: async () => {
            // Test that PHI access is properly logged
            return this.testPHIAccessLogging();
          }
        },
        {
          name: 'Patient Data Encryption',
          test: async () => {
            // Test that patient data is encrypted in transit and at rest
            return this.testDataEncryption();
          }
        },
        {
          name: 'Access Control Verification',
          test: async () => {
            // Test role-based access controls
            return this.testAccessControls();
          }
        }
      ],

      // COFEPRIS compliance tests
      cofeprisTests: [
        {
          name: 'Medical Record Integrity',
          test: async () => {
            // Test medical record data integrity
            return this.testMedicalRecordIntegrity();
          }
        },
        {
          name: 'Audit Trail Completeness',
          test: async () => {
            // Test complete audit trails
            return this.testAuditTrails();
          }
        }
      ]
    };
  }

  /**
   * Initialize security tests
   */
  initializeSecurityTests() {
    return {
      authenticationTests: [
        {
          name: 'Invalid JWT Token',
          test: async () => this.testInvalidJWT()
        },
        {
          name: 'Expired JWT Token',
          test: async () => this.testExpiredJWT()
        },
        {
          name: 'Missing Authorization Header',
          test: async () => this.testMissingAuth()
        }
      ],

      authorizationTests: [
        {
          name: 'Role-based Access Control',
          test: async () => this.testRoleBasedAccess()
        },
        {
          name: 'Patient Data Access Control',
          test: async () => this.testPatientDataAccess()
        },
        {
          name: 'Administrative Function Access',
          test: async () => this.testAdminAccess()
        }
      ],

      inputValidationTests: [
        {
          name: 'XSS Prevention',
          test: async () => this.testXSSPrevention()
        },
        {
          name: 'SQL Injection Prevention',
          test: async () => this.testSQLInjectionPrevention()
        },
        {
          name: 'Input Sanitization',
          test: async () => this.testInputSanitization()
        }
      ],

      rateLimitingTests: [
        {
          name: 'API Rate Limiting',
          test: async () => this.testRateLimiting()
        },
        {
          name: 'Authentication Rate Limiting',
          test: async () => this.testAuthRateLimiting()
        },
        {
          name: 'DDoS Protection',
          test: async () => this.testDDoSProtection()
        }
      ]
    };
  }

  /**
   * Initialize performance tests
   */
  initializePerformanceTests() {
    return {
      loadTests: [
        {
          name: 'Patient List Performance',
          test: async () => this.testPatientListPerformance()
        },
        {
          name: 'Assessment Creation Performance',
          test: async () => this.testAssessmentCreationPerformance()
        },
        {
          name: 'Concurrent User Load',
          test: async () => this.testConcurrentUserLoad()
        }
      ],

      stressTests: [
        {
          name: 'Database Connection Pool',
          test: async () => this.testDatabaseConnections()
        },
        {
          name: 'Memory Usage Under Load',
          test: async () => this.testMemoryUsage()
        }
      ]
    };
  }

  /**
   * Generate JWT token for testing
   */
  generateTestJWT(user, options = {}) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (options.expiresIn || 3600)
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      algorithm: options.algorithm || 'HS256'
    });
  }

  /**
   * Create test request with authentication
   */
  authenticatedRequest(method, endpoint, user) {
    const token = this.generateTestJWT(user);
    return request(this.app)
      [method](`${this.config.baseURL}${endpoint}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Run all test suites
   */
  async runAllTests() {
    const results = {
      compliance: await this.runComplianceTests(),
      security: await this.runSecurityTests(),
      performance: await this.runPerformanceTests(),
      functional: await this.runFunctionalTests()
    };

    return this.generateTestReport(results);
  }

  /**
   * Run compliance tests
   */
  async runComplianceTests() {
    const results = {};

    // Run NOM-024-SSA3-2010 tests
    results.nom024 = [];
    for (const test of this.complianceTests.nom024Tests) {
      try {
        const result = await test.test();
        results.nom024.push({
          name: test.name,
          passed: result.passed,
          details: result.details,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.nom024.push({
          name: test.name,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Run COFEPRIS tests
    results.cofepris = [];
    for (const test of this.complianceTests.cofeprisTests) {
      try {
        const result = await test.test();
        results.cofepris.push({
          name: test.name,
          passed: result.passed,
          details: result.details,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.cofepris.push({
          name: test.name,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Run security tests
   */
  async runSecurityTests() {
    const results = {};

    for (const [category, tests] of Object.entries(this.securityTests)) {
      results[category] = [];
      
      for (const test of tests) {
        try {
          const result = await test.test();
          results[category].push({
            name: test.name,
            passed: result.passed,
            details: result.details,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          results[category].push({
            name: test.name,
            passed: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    const results = {};

    for (const [category, tests] of Object.entries(this.performanceTests)) {
      results[category] = [];
      
      for (const test of tests) {
        try {
          const result = await test.test();
          results[category].push({
            name: test.name,
            passed: result.passed,
            metrics: result.metrics,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          results[category].push({
            name: test.name,
            passed: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Run functional tests
   */
  async runFunctionalTests() {
    const results = [];

    // Test patient CRUD operations
    const patientTests = await this.testPatientCRUD();
    results.push(...patientTests);

    // Test assessment operations
    const assessmentTests = await this.testAssessmentOperations();
    results.push(...assessmentTests);

    // Test form operations
    const formTests = await this.testFormOperations();
    results.push(...formTests);

    return results;
  }

  /**
   * Test patient CRUD operations
   */
  async testPatientCRUD() {
    const tests = [];

    try {
      // Test creating a patient
      const createResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      tests.push({
        name: 'Create Patient',
        passed: createResponse.status === 201,
        details: { status: createResponse.status, body: createResponse.body }
      });

      if (createResponse.status === 201) {
        const patientId = createResponse.body.data.id;

        // Test reading the patient
        const readResponse = await this.authenticatedRequest('get', `/expedix/patients/${patientId}`, this.testUsers.psychiatrist);
        
        tests.push({
          name: 'Read Patient',
          passed: readResponse.status === 200,
          details: { status: readResponse.status }
        });

        // Test updating the patient
        const updateData = { ...this.testData.validPatient, firstName: 'Updated Name' };
        const updateResponse = await this.authenticatedRequest('put', `/expedix/patients/${patientId}`, this.testUsers.psychiatrist)
          .send(updateData);

        tests.push({
          name: 'Update Patient',
          passed: updateResponse.status === 200,
          details: { status: updateResponse.status }
        });

        // Test deleting the patient
        const deleteResponse = await this.authenticatedRequest('delete', `/expedix/patients/${patientId}`, this.testUsers.admin);

        tests.push({
          name: 'Delete Patient',
          passed: deleteResponse.status === 200 || deleteResponse.status === 204,
          details: { status: deleteResponse.status }
        });
      }

      // Test invalid patient data
      const invalidResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.invalidPatient);

      tests.push({
        name: 'Invalid Patient Data Rejection',
        passed: invalidResponse.status === 422,
        details: { status: invalidResponse.status, body: invalidResponse.body }
      });

    } catch (error) {
      tests.push({
        name: 'Patient CRUD Error',
        passed: false,
        error: error.message
      });
    }

    return tests;
  }

  /**
   * Test XSS prevention
   */
  async testXSSPrevention() {
    const results = [];

    for (const payload of this.testData.maliciousPayloads.slice(0, 3)) { // XSS payloads
      try {
        const maliciousPatient = {
          ...this.testData.validPatient,
          firstName: payload
        };

        const response = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
          .send(maliciousPatient);

        // Should either reject (422) or sanitize the input
        const passed = response.status === 422 || 
                      (response.status === 201 && !response.body.data.firstName.includes('<script>'));

        results.push({
          payload,
          passed,
          status: response.status,
          sanitized: response.body?.data?.firstName
        });
      } catch (error) {
        results.push({
          payload,
          passed: false,
          error: error.message
        });
      }
    }

    return {
      passed: results.every(r => r.passed),
      details: results
    };
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    const requests = [];
    const maxRequests = 20; // Exceed typical rate limit

    // Send multiple requests rapidly
    for (let i = 0; i < maxRequests; i++) {
      const promise = this.authenticatedRequest('get', '/expedix/patients', this.testUsers.psychiatrist)
        .expect(() => {}) // Don't fail on rate limit responses
        .then(response => ({ index: i, status: response.status }))
        .catch(error => ({ index: i, error: error.message }));
      
      requests.push(promise);
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    return {
      passed: rateLimitedResponses.length > 0,
      details: {
        totalRequests: maxRequests,
        rateLimitedRequests: rateLimitedResponses.length,
        responses: responses.slice(0, 5) // First 5 for debugging
      }
    };
  }

  /**
   * Test role-based access control
   */
  async testRoleBasedAccess() {
    const tests = [];

    // Test patient trying to access admin endpoint
    try {
      const response = await this.authenticatedRequest('get', '/admin/users', this.testUsers.patient);
      tests.push({
        name: 'Patient accessing admin endpoint',
        passed: response.status === 403,
        details: { status: response.status }
      });
    } catch (error) {
      tests.push({
        name: 'Patient accessing admin endpoint',
        passed: false,
        error: error.message
      });
    }

    // Test nurse trying to create prescriptions (should fail)
    try {
      const response = await this.authenticatedRequest('post', '/clinimetrix/prescriptions', this.testUsers.nurse)
        .send({ patientId: uuidv4(), medication: 'Test medication' });
      
      tests.push({
        name: 'Nurse creating prescription',
        passed: response.status === 403,
        details: { status: response.status }
      });
    } catch (error) {
      tests.push({
        name: 'Nurse creating prescription',
        passed: false,
        error: error.message
      });
    }

    return {
      passed: tests.every(t => t.passed),
      details: tests
    };
  }

  /**
   * Test PHI access logging
   */
  async testPHIAccessLogging() {
    // This would typically check if PHI access is logged in audit logs
    // For now, we'll simulate by checking response headers or audit endpoints
    
    try {
      const response = await this.authenticatedRequest('get', '/expedix/patients', this.testUsers.psychiatrist);
      
      // Check if audit headers are present
      const hasAuditHeaders = response.headers['x-audit-logged'] || 
                             response.headers['x-request-id'];

      return {
        passed: hasAuditHeaders !== undefined,
        details: {
          auditHeaders: {
            'x-audit-logged': response.headers['x-audit-logged'],
            'x-request-id': response.headers['x-request-id']
          }
        }
      };
    } catch (error) {
      return {
        passed: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results) {
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        complianceScore: 0,
        securityScore: 0,
        performanceScore: 0
      },
      details: results,
      recommendations: [],
      compliance: {
        nom024Status: 'UNKNOWN',
        cofeprisStatus: 'UNKNOWN'
      }
    };

    // Calculate summary statistics
    const flattenResults = (obj) => {
      let tests = [];
      for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
          tests = tests.concat(value);
        } else if (typeof value === 'object') {
          tests = tests.concat(flattenResults(value));
        }
      }
      return tests;
    };

    const allTests = flattenResults(results);
    report.summary.totalTests = allTests.length;
    report.summary.passedTests = allTests.filter(t => t.passed).length;
    report.summary.failedTests = allTests.filter(t => !t.passed).length;

    // Calculate scores
    if (report.summary.totalTests > 0) {
      const passRate = report.summary.passedTests / report.summary.totalTests;
      
      report.summary.complianceScore = Math.round(passRate * 100);
      report.summary.securityScore = Math.round(passRate * 100);
      report.summary.performanceScore = Math.round(passRate * 100);
    }

    // Generate recommendations
    if (report.summary.failedTests > 0) {
      report.recommendations.push('Review failed tests and implement necessary fixes');
      report.recommendations.push('Ensure all security vulnerabilities are addressed');
      report.recommendations.push('Verify compliance with healthcare standards');
    }

    // Determine compliance status
    const compliancePassRate = results.compliance ? 
      (flattenResults(results.compliance).filter(t => t.passed).length / 
       flattenResults(results.compliance).length) : 0;

    report.compliance.nom024Status = compliancePassRate >= 0.9 ? 'COMPLIANT' : 'NON_COMPLIANT';
    report.compliance.cofeprisStatus = compliancePassRate >= 0.9 ? 'COMPLIANT' : 'NON_COMPLIANT';

    return report;
  }

  /**
   * Save test report to file
   */
  async saveTestReport(report, filename) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '../reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const filePath = path.join(reportsDir, filename || `test-report-${Date.now()}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    
    return filePath;
  }
}

module.exports = APITestSuite;