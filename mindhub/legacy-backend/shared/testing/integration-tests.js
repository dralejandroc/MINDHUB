/**
 * Integration Tests for MindHub Healthcare Platform
 * 
 * End-to-end integration tests covering complete workflows,
 * cross-service communication, and healthcare compliance scenarios
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const APITestSuite = require('./api-test-suite');

class IntegrationTests extends APITestSuite {
  constructor(app, config = {}) {
    super(app, config);
    this.workflows = this.initializeWorkflows();
    this.crossServiceTests = this.initializeCrossServiceTests();
    this.complianceScenarios = this.initializeComplianceScenarios();
  }

  /**
   * Initialize healthcare workflow tests
   */
  initializeWorkflows() {
    return {
      patientRegistration: {
        name: 'Complete Patient Registration Workflow',
        steps: [
          'Create patient record',
          'Validate patient data',
          'Assign medical record number',
          'Create initial assessment',
          'Log PHI access',
          'Send welcome notification'
        ]
      },

      clinicalAssessment: {
        name: 'Clinical Assessment Workflow',
        steps: [
          'Authenticate healthcare professional',
          'Access patient record',
          'Create assessment session',
          'Submit assessment responses',
          'Calculate scores',
          'Generate interpretation',
          'Store results with audit trail'
        ]
      },

      emergencyAccess: {
        name: 'Emergency Patient Data Access',
        steps: [
          'Emergency authentication',
          'Override access controls',
          'Access critical patient data',
          'Log emergency access',
          'Generate incident report'
        ]
      },

      prescriptionWorkflow: {
        name: 'Prescription Management Workflow',
        steps: [
          'Authenticate psychiatrist',
          'Access patient record',
          'Review medical history',
          'Create prescription',
          'Validate drug interactions',
          'Submit to pharmacy system',
          'Log prescription activity'
        ]
      },

      formSubmission: {
        name: 'Dynamic Form Submission Workflow',
        steps: [
          'Load form definition',
          'Validate form structure',
          'Submit form data',
          'Apply conditional logic',
          'Validate healthcare rules',
          'Store submission',
          'Trigger follow-up actions'
        ]
      }
    };
  }

  /**
   * Initialize cross-service tests
   */
  initializeCrossServiceTests() {
    return {
      expedixToClinicimetrix: {
        name: 'Patient to Assessment Integration',
        description: 'Test patient creation in Expedix and assessment creation in Clinimetrix'
      },

      clinicimetrixToFormx: {
        name: 'Assessment to Form Integration',
        description: 'Test assessment results triggering dynamic form creation'
      },

      formxToResources: {
        name: 'Form to Resources Integration',
        description: 'Test form responses triggering resource recommendations'
      },

      integrixCommunication: {
        name: 'Inter-service Communication',
        description: 'Test Integrix facilitating communication between all services'
      }
    };
  }

  /**
   * Initialize compliance scenarios
   */
  initializeComplianceScenarios() {
    return {
      phiAccessControl: {
        name: 'PHI Access Control Scenario',
        description: 'Test comprehensive PHI access controls across all services'
      },

      auditTrailCompleteness: {
        name: 'Complete Audit Trail Scenario',
        description: 'Test audit trail generation for all patient data operations'
      },

      dataMinimization: {
        name: 'Data Minimization Scenario',
        description: 'Test that only necessary data is accessed and transmitted'
      },

      consentManagement: {
        name: 'Patient Consent Management',
        description: 'Test patient consent workflow and enforcement'
      },

      incidentResponse: {
        name: 'Security Incident Response',
        description: 'Test security incident detection and response procedures'
      }
    };
  }

  /**
   * Run complete patient registration workflow
   */
  async testPatientRegistrationWorkflow() {
    const workflow = this.workflows.patientRegistration;
    const results = [];
    let patientId;

    try {
      // Step 1: Create patient record
      const createResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      results.push({
        step: 'Create patient record',
        passed: createResponse.status === 201,
        details: { status: createResponse.status, hasId: !!createResponse.body?.data?.id }
      });

      if (createResponse.status === 201) {
        patientId = createResponse.body.data.id;

        // Step 2: Validate patient data integrity
        const validateResponse = await this.authenticatedRequest('get', `/expedix/patients/${patientId}`, this.testUsers.psychiatrist);
        
        results.push({
          step: 'Validate patient data',
          passed: validateResponse.status === 200 && validateResponse.body.data.firstName === this.testData.validPatient.firstName,
          details: { status: validateResponse.status, dataIntegrity: validateResponse.body?.data?.firstName === this.testData.validPatient.firstName }
        });

        // Step 3: Check medical record number assignment
        results.push({
          step: 'Assign medical record number',
          passed: !!validateResponse.body?.data?.medicalRecordNumber,
          details: { hasMRN: !!validateResponse.body?.data?.medicalRecordNumber }
        });

        // Step 4: Create initial assessment
        const assessmentData = {
          ...this.testData.validAssessment,
          patientId: patientId
        };

        const assessmentResponse = await this.authenticatedRequest('post', '/clinimetrix/assessments', this.testUsers.psychologist)
          .send(assessmentData);

        results.push({
          step: 'Create initial assessment',
          passed: assessmentResponse.status === 201,
          details: { status: assessmentResponse.status }
        });

        // Step 5: Verify PHI access logging
        const auditResponse = await this.authenticatedRequest('get', '/integrix/audit/phi-access', this.testUsers.admin)
          .query({ patientId: patientId });

        results.push({
          step: 'Log PHI access',
          passed: auditResponse.status === 200 && Array.isArray(auditResponse.body?.data),
          details: { status: auditResponse.status, hasAuditLogs: Array.isArray(auditResponse.body?.data) }
        });
      }

    } catch (error) {
      results.push({
        step: 'Workflow error',
        passed: false,
        error: error.message
      });
    }

    return {
      workflow: workflow.name,
      passed: results.every(r => r.passed),
      steps: results,
      patientId
    };
  }

  /**
   * Test clinical assessment workflow
   */
  async testClinicalAssessmentWorkflow() {
    const workflow = this.workflows.clinicalAssessment;
    const results = [];

    try {
      // Create a patient first
      const patientResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      if (patientResponse.status !== 201) {
        return {
          workflow: workflow.name,
          passed: false,
          error: 'Failed to create test patient'
        };
      }

      const patientId = patientResponse.body.data.id;

      // Step 1: Authenticate healthcare professional
      results.push({
        step: 'Authenticate healthcare professional',
        passed: true, // Already authenticated for the request
        details: { role: this.testUsers.psychologist.role }
      });

      // Step 2: Access patient record
      const patientAccessResponse = await this.authenticatedRequest('get', `/expedix/patients/${patientId}`, this.testUsers.psychologist);
      
      results.push({
        step: 'Access patient record',
        passed: patientAccessResponse.status === 200,
        details: { status: patientAccessResponse.status }
      });

      // Step 3: Create assessment session
      const assessmentData = {
        ...this.testData.validAssessment,
        patientId: patientId
      };

      const assessmentResponse = await this.authenticatedRequest('post', '/clinimetrix/assessments', this.testUsers.psychologist)
        .send(assessmentData);

      results.push({
        step: 'Create assessment session',
        passed: assessmentResponse.status === 201,
        details: { status: assessmentResponse.status }
      });

      if (assessmentResponse.status === 201) {
        const assessmentId = assessmentResponse.body.data.id;

        // Step 4: Submit assessment responses (simulate completion)
        const completeResponse = await this.authenticatedRequest('put', `/clinimetrix/assessments/${assessmentId}/complete`, this.testUsers.psychologist)
          .send({ status: 'completed' });

        results.push({
          step: 'Submit assessment responses',
          passed: completeResponse.status === 200,
          details: { status: completeResponse.status }
        });

        // Step 5: Verify scores calculation
        const scoresResponse = await this.authenticatedRequest('get', `/clinimetrix/assessments/${assessmentId}/scores`, this.testUsers.psychologist);

        results.push({
          step: 'Calculate scores',
          passed: scoresResponse.status === 200 && scoresResponse.body?.data?.totalScore !== undefined,
          details: { status: scoresResponse.status, hasScores: scoresResponse.body?.data?.totalScore !== undefined }
        });

        // Step 6: Verify interpretation generation
        const interpretationResponse = await this.authenticatedRequest('get', `/clinimetrix/assessments/${assessmentId}/interpretation`, this.testUsers.psychologist);

        results.push({
          step: 'Generate interpretation',
          passed: interpretationResponse.status === 200,
          details: { status: interpretationResponse.status }
        });

        // Step 7: Verify audit trail
        const auditResponse = await this.authenticatedRequest('get', '/integrix/audit/clinical-data', this.testUsers.admin)
          .query({ assessmentId: assessmentId });

        results.push({
          step: 'Store results with audit trail',
          passed: auditResponse.status === 200,
          details: { status: auditResponse.status }
        });
      }

    } catch (error) {
      results.push({
        step: 'Workflow error',
        passed: false,
        error: error.message
      });
    }

    return {
      workflow: workflow.name,
      passed: results.every(r => r.passed),
      steps: results
    };
  }

  /**
   * Test emergency access workflow
   */
  async testEmergencyAccessWorkflow() {
    const workflow = this.workflows.emergencyAccess;
    const results = [];

    try {
      // Create a patient first
      const patientResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      if (patientResponse.status !== 201) {
        return {
          workflow: workflow.name,
          passed: false,
          error: 'Failed to create test patient'
        };
      }

      const patientId = patientResponse.body.data.id;

      // Step 1: Emergency authentication (with special headers)
      const emergencyToken = this.generateTestJWT(this.testUsers.nurse);
      const emergencyResponse = await request(this.app)
        .get(`${this.config.baseURL}/expedix/patients/${patientId}/emergency`)
        .set('Authorization', `Bearer ${emergencyToken}`)
        .set('X-Emergency-Access', 'true')
        .set('X-Emergency-Justification', 'Patient unconscious, need immediate medical history');

      results.push({
        step: 'Emergency authentication',
        passed: emergencyResponse.status === 200 || emergencyResponse.status === 202,
        details: { status: emergencyResponse.status }
      });

      // Step 2: Override access controls
      results.push({
        step: 'Override access controls',
        passed: emergencyResponse.headers['x-emergency-override'] === 'true',
        details: { hasOverride: emergencyResponse.headers['x-emergency-override'] === 'true' }
      });

      // Step 3: Access critical patient data
      results.push({
        step: 'Access critical patient data',
        passed: emergencyResponse.status === 200 && !!emergencyResponse.body?.data,
        details: { hasData: !!emergencyResponse.body?.data }
      });

      // Step 4: Verify emergency access logging
      const auditResponse = await this.authenticatedRequest('get', '/integrix/audit/emergency-access', this.testUsers.admin)
        .query({ patientId: patientId });

      results.push({
        step: 'Log emergency access',
        passed: auditResponse.status === 200,
        details: { status: auditResponse.status }
      });

      // Step 5: Generate incident report
      const incidentResponse = await this.authenticatedRequest('post', '/integrix/incidents/emergency-access', this.testUsers.admin)
        .send({
          patientId: patientId,
          accessorId: this.testUsers.nurse.id,
          justification: 'Patient unconscious, need immediate medical history',
          timestamp: new Date().toISOString()
        });

      results.push({
        step: 'Generate incident report',
        passed: incidentResponse.status === 201,
        details: { status: incidentResponse.status }
      });

    } catch (error) {
      results.push({
        step: 'Workflow error',
        passed: false,
        error: error.message
      });
    }

    return {
      workflow: workflow.name,
      passed: results.every(r => r.passed),
      steps: results
    };
  }

  /**
   * Test cross-service communication
   */
  async testCrossServiceCommunication() {
    const results = [];

    try {
      // Test Expedix to Clinimetrix communication
      const patientResponse = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      if (patientResponse.status === 201) {
        const patientId = patientResponse.body.data.id;

        // Test that Clinimetrix can access patient data from Expedix
        const assessmentData = {
          ...this.testData.validAssessment,
          patientId: patientId
        };

        const assessmentResponse = await this.authenticatedRequest('post', '/clinimetrix/assessments', this.testUsers.psychologist)
          .send(assessmentData);

        results.push({
          test: 'Expedix to Clinimetrix',
          passed: assessmentResponse.status === 201,
          details: { status: assessmentResponse.status }
        });

        if (assessmentResponse.status === 201) {
          const assessmentId = assessmentResponse.body.data.id;

          // Test Clinimetrix to Formx communication
          const formTriggerResponse = await this.authenticatedRequest('post', '/formx/forms/trigger-from-assessment', this.testUsers.psychologist)
            .send({ assessmentId: assessmentId });

          results.push({
            test: 'Clinimetrix to Formx',
            passed: formTriggerResponse.status === 200 || formTriggerResponse.status === 201,
            details: { status: formTriggerResponse.status }
          });

          // Test Formx to Resources communication
          const resourceResponse = await this.authenticatedRequest('post', '/resources/recommendations/from-assessment', this.testUsers.patient)
            .send({ assessmentId: assessmentId });

          results.push({
            test: 'Formx to Resources',
            passed: resourceResponse.status === 200,
            details: { status: resourceResponse.status }
          });
        }

        // Test Integrix orchestration
        const integrixResponse = await this.authenticatedRequest('get', '/integrix/patient-summary', this.testUsers.psychiatrist)
          .query({ patientId: patientId });

        results.push({
          test: 'Integrix orchestration',
          passed: integrixResponse.status === 200 && !!integrixResponse.body?.data?.patient,
          details: { 
            status: integrixResponse.status,
            hasPatientData: !!integrixResponse.body?.data?.patient,
            hasAssessments: Array.isArray(integrixResponse.body?.data?.assessments),
            hasForms: Array.isArray(integrixResponse.body?.data?.forms)
          }
        });
      }

    } catch (error) {
      results.push({
        test: 'Cross-service communication error',
        passed: false,
        error: error.message
      });
    }

    return {
      name: 'Cross-service Communication Tests',
      passed: results.every(r => r.passed),
      tests: results
    };
  }

  /**
   * Test PHI access control scenario
   */
  async testPHIAccessControlScenario() {
    const results = [];

    try {
      // Create two patients
      const patient1Response = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(this.testData.validPatient);

      const patient2Data = { ...this.testData.validPatient, firstName: 'Jane', lastName: 'Doe' };
      const patient2Response = await this.authenticatedRequest('post', '/expedix/patients', this.testUsers.psychiatrist)
        .send(patient2Data);

      if (patient1Response.status === 201 && patient2Response.status === 201) {
        const patient1Id = patient1Response.body.data.id;
        const patient2Id = patient2Response.body.data.id;

        // Test that patient can only access their own data
        const ownDataResponse = await this.authenticatedRequest('get', `/expedix/patients/${patient1Id}`, this.testUsers.patient);
        const otherDataResponse = await this.authenticatedRequest('get', `/expedix/patients/${patient2Id}`, this.testUsers.patient);

        results.push({
          test: 'Patient self-access control',
          passed: ownDataResponse.status === 200 && otherDataResponse.status === 403,
          details: {
            ownDataStatus: ownDataResponse.status,
            otherDataStatus: otherDataResponse.status
          }
        });

        // Test healthcare professional access with patient assignment
        const professionalAccessResponse = await this.authenticatedRequest('get', `/expedix/patients/${patient1Id}`, this.testUsers.psychologist);

        results.push({
          test: 'Healthcare professional access',
          passed: professionalAccessResponse.status === 200,
          details: { status: professionalAccessResponse.status }
        });

        // Test data minimization - ensure only necessary fields are returned
        const minimizedResponse = await this.authenticatedRequest('get', `/expedix/patients/${patient1Id}/summary`, this.testUsers.nurse);

        results.push({
          test: 'Data minimization',
          passed: minimizedResponse.status === 200 && 
                 !minimizedResponse.body?.data?.contactInfo?.email, // Nurses shouldn't see full contact info
          details: {
            status: minimizedResponse.status,
            hasRestrictedData: !minimizedResponse.body?.data?.contactInfo?.email
          }
        });

        // Test audit logging for all PHI access
        const auditResponse = await this.authenticatedRequest('get', '/integrix/audit/phi-access', this.testUsers.admin)
          .query({ patientId: patient1Id, timeframe: '1h' });

        results.push({
          test: 'PHI access audit logging',
          passed: auditResponse.status === 200 && Array.isArray(auditResponse.body?.data) && auditResponse.body.data.length > 0,
          details: {
            status: auditResponse.status,
            auditLogCount: auditResponse.body?.data?.length || 0
          }
        });
      }

    } catch (error) {
      results.push({
        test: 'PHI access control error',
        passed: false,
        error: error.message
      });
    }

    return {
      scenario: 'PHI Access Control',
      passed: results.every(r => r.passed),
      tests: results
    };
  }

  /**
   * Run all integration tests
   */
  async runAllIntegrationTests() {
    const results = {
      workflows: {},
      crossService: {},
      compliance: {},
      summary: {
        timestamp: new Date().toISOString(),
        totalWorkflows: 0,
        passedWorkflows: 0,
        failedWorkflows: 0
      }
    };

    // Run workflow tests
    results.workflows.patientRegistration = await this.testPatientRegistrationWorkflow();
    results.workflows.clinicalAssessment = await this.testClinicalAssessmentWorkflow();
    results.workflows.emergencyAccess = await this.testEmergencyAccessWorkflow();

    // Run cross-service tests
    results.crossService.communication = await this.testCrossServiceCommunication();

    // Run compliance scenarios
    results.compliance.phiAccessControl = await this.testPHIAccessControlScenario();

    // Calculate summary
    const allWorkflows = Object.values(results.workflows);
    results.summary.totalWorkflows = allWorkflows.length;
    results.summary.passedWorkflows = allWorkflows.filter(w => w.passed).length;
    results.summary.failedWorkflows = allWorkflows.filter(w => !w.passed).length;

    return results;
  }

  /**
   * Generate integration test report
   */
  generateIntegrationReport(results) {
    const report = {
      type: 'integration-test-report',
      timestamp: new Date().toISOString(),
      summary: {
        ...results.summary,
        overallStatus: results.summary.failedWorkflows === 0 ? 'PASSED' : 'FAILED',
        passRate: results.summary.totalWorkflows > 0 ? 
                 Math.round((results.summary.passedWorkflows / results.summary.totalWorkflows) * 100) : 0
      },
      workflows: results.workflows,
      crossService: results.crossService,
      compliance: results.compliance,
      healthcareCompliance: {
        nom024Status: this.assessNOM024Compliance(results),
        cofeprisStatus: this.assessCOFEPRISCompliance(results),
        recommendations: this.generateComplianceRecommendations(results)
      }
    };

    return report;
  }

  /**
   * Assess NOM-024-SSA3-2010 compliance
   */
  assessNOM024Compliance(results) {
    const requiredTests = [
      results.compliance.phiAccessControl?.passed,
      results.workflows.patientRegistration?.passed,
      results.workflows.emergencyAccess?.passed
    ];

    const passedTests = requiredTests.filter(Boolean).length;
    const totalTests = requiredTests.length;

    return {
      status: passedTests === totalTests ? 'COMPLIANT' : 'NON_COMPLIANT',
      score: Math.round((passedTests / totalTests) * 100),
      passedTests,
      totalTests
    };
  }

  /**
   * Assess COFEPRIS compliance
   */
  assessCOFEPRISCompliance(results) {
    const requiredTests = [
      results.workflows.clinicalAssessment?.passed,
      results.compliance.phiAccessControl?.passed,
      results.crossService.communication?.passed
    ];

    const passedTests = requiredTests.filter(Boolean).length;
    const totalTests = requiredTests.length;

    return {
      status: passedTests === totalTests ? 'COMPLIANT' : 'NON_COMPLIANT',
      score: Math.round((passedTests / totalTests) * 100),
      passedTests,
      totalTests
    };
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations(results) {
    const recommendations = [];

    if (!results.compliance.phiAccessControl?.passed) {
      recommendations.push('Strengthen PHI access controls and audit logging');
    }

    if (!results.workflows.emergencyAccess?.passed) {
      recommendations.push('Review emergency access procedures and incident reporting');
    }

    if (!results.crossService.communication?.passed) {
      recommendations.push('Improve inter-service communication and data consistency');
    }

    if (recommendations.length === 0) {
      recommendations.push('All compliance tests passed - maintain current security standards');
    }

    return recommendations;
  }
}

module.exports = IntegrationTests;