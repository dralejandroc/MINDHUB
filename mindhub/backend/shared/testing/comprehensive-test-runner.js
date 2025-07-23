#!/usr/bin/env node

/**
 * Comprehensive Test Runner for MindHub Healthcare Platform
 * 
 * Master test runner that executes all test suites including integration tests,
 * contract validation, performance testing, and security compliance
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Import all test suites
const APITestSuite = require('./api-test-suite');
const IntegrationTests = require('./integration-tests');
const IntegrixIntegrationTests = require('./integrix-integration-tests');
const APIContractValidation = require('./api-contract-validation');
const PerformanceLoadTests = require('./performance-load-tests');
const SecurityComplianceTests = require('./security-compliance-tests');
const TestRunner = require('./test-runner');

class ComprehensiveTestRunner {
  constructor(app, config = {}) {
    this.app = app;
    this.config = {
      outputDir: config.outputDir || './test-reports',
      verbose: config.verbose || false,
      parallel: config.parallel || false,
      
      // Test suite configurations
      suites: {
        api: config.suites?.api !== false,
        integration: config.suites?.integration !== false,
        integrix: config.suites?.integrix !== false,
        contracts: config.suites?.contracts !== false,
        performance: config.suites?.performance !== false,
        security: config.suites?.security !== false
      },
      
      // Performance test configurations
      performance: {
        loadTest: config.performance?.loadTest || { users: 25, duration: 30000 },
        stressTest: config.performance?.stressTest || { maxUsers: 100, stepSize: 20 },
        enableFullSuite: config.performance?.enableFullSuite || false
      },
      
      // Security test configurations
      security: {
        includeVulnerabilityScans: config.security?.includeVulnerabilityScans !== false,
        complianceStandards: config.security?.complianceStandards || ['hipaa', 'nom024', 'gdpr']
      },
      
      // Report configurations
      reports: {
        formats: config.reports?.formats || ['json', 'html', 'pdf'],
        detailed: config.reports?.detailed !== false,
        includeCharts: config.reports?.includeCharts !== false
      },
      
      ...config
    };
    
    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        warnings: 0
      },
      suites: {},
      compliance: {
        healthcare: {
          hipaa: 'UNKNOWN',
          nom024: 'UNKNOWN',
          cofepris: 'UNKNOWN'
        },
        security: {
          owasp: 'UNKNOWN',
          vulnerabilities: 'UNKNOWN'
        },
        performance: {
          responseTime: 'UNKNOWN',
          throughput: 'UNKNOWN',
          reliability: 'UNKNOWN'
        }
      },
      recommendations: [],
      criticalIssues: []
    };
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests() {
    this.results.startTime = new Date();
    
    console.log('🚀 Starting MindHub Comprehensive Test Suite');
    console.log('=' .repeat(60));
    console.log(`📊 Test Configuration:`);
    console.log(`   - API Tests: ${this.config.suites.api ? '✅' : '❌'}`);
    console.log(`   - Integration Tests: ${this.config.suites.integration ? '✅' : '❌'}`);
    console.log(`   - Integrix Tests: ${this.config.suites.integrix ? '✅' : '❌'}`);
    console.log(`   - Contract Validation: ${this.config.suites.contracts ? '✅' : '❌'}`);
    console.log(`   - Performance Tests: ${this.config.suites.performance ? '✅' : '❌'}`);
    console.log(`   - Security Tests: ${this.config.suites.security ? '✅' : '❌'}`);
    console.log('=' .repeat(60));

    try {
      // Create output directory
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Run test suites based on configuration
      if (this.config.suites.api) {
        await this.runAPITestSuite();
      }

      if (this.config.suites.integration) {
        await this.runIntegrationTestSuite();
      }

      if (this.config.suites.integrix) {
        await this.runIntegrixTestSuite();
      }

      if (this.config.suites.contracts) {
        await this.runContractValidationSuite();
      }

      if (this.config.suites.performance) {
        await this.runPerformanceTestSuite();
      }

      if (this.config.suites.security) {
        await this.runSecurityTestSuite();
      }

      // Calculate final results
      this.results.endTime = new Date();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      this.calculateFinalSummary();
      this.assessCompliance();
      this.generateRecommendations();
      
      // Generate comprehensive reports
      await this.generateComprehensiveReports();
      
      console.log('✅ Comprehensive test suite completed successfully!');
      console.log(`📈 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed (${Math.round((this.results.summary.passed / this.results.summary.total) * 100)}%)`);
      console.log(`⏱️  Duration: ${Math.round(this.results.duration / 1000)}s`);
      
      return this.results;

    } catch (error) {
      console.error('❌ Comprehensive test suite failed:', error);
      this.results.error = error.message;
      this.results.endTime = new Date();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      throw error;
    }
  }

  /**
   * Run API test suite
   */
  async runAPITestSuite() {
    console.log('🧪 Running API Test Suite...');
    
    try {
      const apiTestSuite = new APITestSuite(this.app, this.config);
      const results = await apiTestSuite.runAllTests();
      
      this.results.suites.api = {
        name: 'API Test Suite',
        status: results.summary?.failedTests === 0 ? 'PASSED' : 'FAILED',
        duration: performance.now() - performance.now(),
        results,
        summary: {
          total: results.summary?.totalTests || 0,
          passed: results.summary?.passedTests || 0,
          failed: results.summary?.failedTests || 0
        }
      };
      
      console.log(`   ✅ API Tests: ${this.results.suites.api.summary.passed}/${this.results.suites.api.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ API Test Suite failed:', error.message);
      this.results.suites.api = {
        name: 'API Test Suite',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Run integration test suite
   */
  async runIntegrationTestSuite() {
    console.log('🔗 Running Integration Test Suite...');
    
    try {
      const integrationTests = new IntegrationTests(this.app, this.config);
      const results = await integrationTests.runAllIntegrationTests();
      
      this.results.suites.integration = {
        name: 'Integration Test Suite',
        status: results.summary?.failedWorkflows === 0 ? 'PASSED' : 'FAILED',
        results,
        summary: {
          total: results.summary?.totalWorkflows || 0,
          passed: results.summary?.passedWorkflows || 0,
          failed: results.summary?.failedWorkflows || 0
        }
      };
      
      console.log(`   ✅ Integration Tests: ${this.results.suites.integration.summary.passed}/${this.results.suites.integration.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ Integration Test Suite failed:', error.message);
      this.results.suites.integration = {
        name: 'Integration Test Suite',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Run Integrix test suite
   */
  async runIntegrixTestSuite() {
    console.log('⚡ Running Integrix Integration Test Suite...');
    
    try {
      const integrixTests = new IntegrixIntegrationTests(this.app, this.config);
      const results = await integrixTests.runAllIntegrixTests();
      
      this.results.suites.integrix = {
        name: 'Integrix Integration Test Suite',
        status: results.summary?.failed === 0 ? 'PASSED' : 'FAILED',
        results,
        summary: {
          total: results.summary?.total || 0,
          passed: results.summary?.passed || 0,
          failed: results.summary?.failed || 0
        }
      };
      
      console.log(`   ✅ Integrix Tests: ${this.results.suites.integrix.summary.passed}/${this.results.suites.integrix.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ Integrix Test Suite failed:', error.message);
      this.results.suites.integrix = {
        name: 'Integrix Integration Test Suite',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Run contract validation suite
   */
  async runContractValidationSuite() {
    console.log('📋 Running API Contract Validation Suite...');
    
    try {
      const contractValidation = new APIContractValidation(this.app, this.config);
      const apiTestSuite = new APITestSuite(this.app, this.config); // Needed for test execution
      const results = await contractValidation.testAllContracts(apiTestSuite);
      
      this.results.suites.contracts = {
        name: 'API Contract Validation',
        status: results.failedContracts === 0 ? 'PASSED' : 'FAILED',
        results,
        summary: {
          total: results.totalContracts || 0,
          passed: results.passedContracts || 0,
          failed: results.failedContracts || 0
        }
      };
      
      console.log(`   ✅ Contract Tests: ${this.results.suites.contracts.summary.passed}/${this.results.suites.contracts.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ Contract Validation Suite failed:', error.message);
      this.results.suites.contracts = {
        name: 'API Contract Validation',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Run performance test suite
   */
  async runPerformanceTestSuite() {
    console.log('⚡ Running Performance Test Suite...');
    
    try {
      const performanceTests = new PerformanceLoadTests(this.app, {
        ...this.config,
        ...this.config.performance
      });
      
      let results;
      if (this.config.performance.enableFullSuite) {
        results = await performanceTests.runPerformanceTestSuite();
      } else {
        // Run abbreviated performance tests for faster execution
        results = {
          timestamp: new Date().toISOString(),
          tests: {
            baseline: await performanceTests.runBaselineTest(),
            loadTest: await performanceTests.runLoadTest()
          }
        };
        results.summary = performanceTests.calculateSummary(results.tests);
      }
      
      this.results.suites.performance = {
        name: 'Performance Test Suite',
        status: results.summary?.status || 'UNKNOWN',
        results,
        summary: {
          total: Object.keys(results.tests || {}).length,
          passed: Object.values(results.tests || {}).filter(t => t.passed).length,
          failed: Object.values(results.tests || {}).filter(t => !t.passed).length
        }
      };
      
      console.log(`   ✅ Performance Tests: ${this.results.suites.performance.summary.passed}/${this.results.suites.performance.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ Performance Test Suite failed:', error.message);
      this.results.suites.performance = {
        name: 'Performance Test Suite',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Run security test suite
   */
  async runSecurityTestSuite() {
    console.log('🔒 Running Security & Compliance Test Suite...');
    
    try {
      const securityTests = new SecurityComplianceTests(this.app, {
        ...this.config,
        compliance: {
          hipaa: this.config.security.complianceStandards.includes('hipaa'),
          nom024: this.config.security.complianceStandards.includes('nom024'),
          cofepris: this.config.security.complianceStandards.includes('cofepris')
        }
      });
      
      const results = await securityTests.runSecurityComplianceTestSuite();
      
      this.results.suites.security = {
        name: 'Security & Compliance Test Suite',
        status: results.summary?.status === 'SECURE' ? 'PASSED' : 'FAILED',
        results,
        summary: {
          total: results.summary?.total || 0,
          passed: results.summary?.passed || 0,
          failed: results.summary?.failed || 0
        }
      };
      
      console.log(`   ✅ Security Tests: ${this.results.suites.security.summary.passed}/${this.results.suites.security.summary.total} passed`);
      
    } catch (error) {
      console.error('   ❌ Security Test Suite failed:', error.message);
      this.results.suites.security = {
        name: 'Security & Compliance Test Suite',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Calculate final summary
   */
  calculateFinalSummary() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warningCount = 0;

    for (const suite of Object.values(this.results.suites)) {
      if (suite.summary) {
        totalTests += suite.summary.total || 0;
        passedTests += suite.summary.passed || 0;
        failedTests += suite.summary.failed || 0;
      }
      
      if (suite.status === 'ERROR') {
        failedTests += 1;
        totalTests += 1;
      }
    }

    this.results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: 0,
      warnings: warningCount,
      passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      status: failedTests === 0 ? 'PASSED' : 'FAILED'
    };
  }

  /**
   * Assess compliance across all standards
   */
  assessCompliance() {
    // Healthcare compliance assessment
    const securityResults = this.results.suites.security?.results;
    if (securityResults?.compliance) {
      this.results.compliance.healthcare.hipaa = securityResults.compliance.hipaa?.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
      this.results.compliance.healthcare.nom024 = securityResults.compliance.nom024?.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
      this.results.compliance.healthcare.cofepris = securityResults.compliance.cofepris?.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
    }

    // Security compliance assessment
    if (securityResults?.vulnerabilities) {
      this.results.compliance.security.owasp = securityResults.vulnerabilities.owasp?.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
      this.results.compliance.security.vulnerabilities = securityResults.vulnerabilities.healthcare?.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
    }

    // Performance compliance assessment
    const performanceResults = this.results.suites.performance?.results;
    if (performanceResults) {
      const baselineTest = performanceResults.tests?.baseline || performanceResults.tests?.loadTest;
      if (baselineTest) {
        this.results.compliance.performance.responseTime = baselineTest.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
        this.results.compliance.performance.throughput = baselineTest.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
        this.results.compliance.performance.reliability = baselineTest.passed ? 'COMPLIANT' : 'NON_COMPLIANT';
      }
    }
  }

  /**
   * Generate recommendations based on all test results
   */
  generateRecommendations() {
    const recommendations = [];
    const criticalIssues = [];

    // API test recommendations
    if (this.results.suites.api && this.results.suites.api.status !== 'PASSED') {
      recommendations.push('Fix failing API tests to ensure endpoint reliability');
      if (this.results.suites.api.summary.failed > 5) {
        criticalIssues.push('Multiple API endpoints failing - service reliability at risk');
      }
    }

    // Integration test recommendations
    if (this.results.suites.integration && this.results.suites.integration.status !== 'PASSED') {
      recommendations.push('Address integration test failures to ensure workflow reliability');
      criticalIssues.push('Integration workflow failures detected');
    }

    // Contract validation recommendations
    if (this.results.suites.contracts && this.results.suites.contracts.status !== 'PASSED') {
      recommendations.push('Fix API contract violations to ensure client compatibility');
    }

    // Performance recommendations
    if (this.results.suites.performance && this.results.suites.performance.status !== 'PASSED') {
      recommendations.push('Optimize system performance to meet healthcare response time requirements');
      if (this.results.compliance.performance.responseTime === 'NON_COMPLIANT') {
        criticalIssues.push('Response times exceed healthcare compliance standards');
      }
    }

    // Security recommendations
    if (this.results.suites.security && this.results.suites.security.status !== 'PASSED') {
      recommendations.push('Address security vulnerabilities immediately');
      criticalIssues.push('Security vulnerabilities detected in healthcare system');
    }

    // Healthcare compliance recommendations
    if (this.results.compliance.healthcare.hipaa === 'NON_COMPLIANT') {
      criticalIssues.push('HIPAA compliance violations - immediate remediation required');
    }
    if (this.results.compliance.healthcare.nom024 === 'NON_COMPLIANT') {
      criticalIssues.push('NOM-024-SSA3-2010 compliance violations detected');
    }

    // Overall system recommendations
    if (this.results.summary.passRate < 80) {
      criticalIssues.push(`System reliability below 80% (${this.results.summary.passRate}%) - not suitable for production`);
    } else if (this.results.summary.passRate < 95) {
      recommendations.push('System reliability should be improved for healthcare production use');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed - system ready for healthcare production deployment');
    }

    this.results.recommendations = recommendations;
    this.results.criticalIssues = criticalIssues;
  }

  /**
   * Generate comprehensive reports
   */
  async generateComprehensiveReports() {
    console.log('📄 Generating comprehensive test reports...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate JSON report
    if (this.config.reports.formats.includes('json')) {
      await this.generateJSONReport(timestamp);
    }
    
    // Generate HTML report
    if (this.config.reports.formats.includes('html')) {
      await this.generateHTMLReport(timestamp);
    }
    
    // Generate executive summary
    await this.generateExecutiveSummary(timestamp);
    
    // Generate compliance report
    await this.generateComplianceReport(timestamp);
    
    console.log(`📁 Reports generated in: ${this.config.outputDir}`);
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(timestamp) {
    const filename = `comprehensive-test-report-${timestamp}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const report = {
      title: 'MindHub Healthcare Platform - Comprehensive Test Report',
      timestamp: this.results.startTime.toISOString(),
      duration: this.results.duration,
      summary: this.results.summary,
      compliance: this.results.compliance,
      suites: this.results.suites,
      recommendations: this.results.recommendations,
      criticalIssues: this.results.criticalIssues,
      metadata: {
        version: '1.0.0',
        platform: 'MindHub Healthcare',
        testRunner: 'ComprehensiveTestRunner',
        environment: process.env.NODE_ENV || 'test'
      }
    };
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`   📄 JSON report: ${filename}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(timestamp) {
    const filename = `comprehensive-test-report-${timestamp}.html`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const html = this.generateHTMLContent();
    await fs.writeFile(filepath, html);
    console.log(`   🌐 HTML report: ${filename}`);
  }

  /**
   * Generate HTML content
   */
  generateHTMLContent() {
    const statusColor = this.results.summary.status === 'PASSED' ? '#28a745' : '#dc3545';
    const passRate = this.results.summary.passRate;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindHub - Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .status-banner { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .suite-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .suite-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .suite-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .suite-title { margin: 0; color: #495057; }
        .suite-status { float: right; padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8em; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .status-error { background: #fd7e14; }
        .suite-body { padding: 20px; }
        .compliance-section { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .compliance-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .compliance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding: 20px; }
        .compliance-item { padding: 15px; border-radius: 6px; text-align: center; }
        .compliant { background: #d4edda; color: #155724; }
        .non-compliant { background: #f8d7da; color: #721c24; }
        .unknown { background: #e2e3e5; color: #383d41; }
        .recommendations { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .recommendations-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .recommendations-body { padding: 20px; }
        .critical-issues { background: #f8d7da; border: 1px solid #f5c6cb; }
        .recommendation-item { padding: 10px 0; border-bottom: 1px solid #dee2e6; }
        .recommendation-item:last-child { border-bottom: none; }
        .critical { color: #721c24; font-weight: bold; }
        .footer { text-align: center; color: #6c757d; margin-top: 40px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 MindHub Healthcare Platform</h1>
            <div class="subtitle">Comprehensive Test Report - ${this.results.startTime.toLocaleString()}</div>
        </div>

        <div class="status-banner">
            ${this.results.summary.status === 'PASSED' ? '✅' : '❌'} Overall Status: ${this.results.summary.status} (${passRate}%)
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${this.results.summary.total}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745;">${this.results.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545;">${this.results.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(this.results.duration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="suite-grid">
            ${Object.values(this.results.suites).map(suite => `
                <div class="suite-card">
                    <div class="suite-header">
                        <h3 class="suite-title">${suite.name}</h3>
                        <span class="suite-status status-${suite.status.toLowerCase()}">${suite.status}</span>
                    </div>
                    <div class="suite-body">
                        ${suite.summary ? `
                            <p><strong>Tests:</strong> ${suite.summary.passed}/${suite.summary.total} passed</p>
                            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: #28a745; height: 100%; width: ${suite.summary.total > 0 ? (suite.summary.passed / suite.summary.total) * 100 : 0}%;"></div>
                            </div>
                        ` : `
                            <p>${suite.error || 'No detailed results available'}</p>
                        `}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="compliance-section">
            <div class="compliance-header">
                <h2>🏥 Healthcare Compliance Status</h2>
            </div>
            <div class="compliance-grid">
                ${Object.entries(this.results.compliance.healthcare).map(([standard, status]) => `
                    <div class="compliance-item ${status.toLowerCase().replace('_', '-')}">
                        <strong>${standard.toUpperCase()}</strong><br>
                        ${status.replace('_', ' ')}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="compliance-section">
            <div class="compliance-header">
                <h2>🔒 Security Compliance Status</h2>
            </div>
            <div class="compliance-grid">
                ${Object.entries(this.results.compliance.security).map(([category, status]) => `
                    <div class="compliance-item ${status.toLowerCase().replace('_', '-')}">
                        <strong>${category.toUpperCase()}</strong><br>
                        ${status.replace('_', ' ')}
                    </div>
                `).join('')}
            </div>
        </div>

        ${this.results.criticalIssues.length > 0 ? `
            <div class="recommendations critical-issues">
                <div class="recommendations-header">
                    <h2>🚨 Critical Issues</h2>
                </div>
                <div class="recommendations-body">
                    ${this.results.criticalIssues.map(issue => `
                        <div class="recommendation-item critical">⚠️ ${issue}</div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="recommendations">
            <div class="recommendations-header">
                <h2>💡 Recommendations</h2>
            </div>
            <div class="recommendations-body">
                ${this.results.recommendations.map(rec => `
                    <div class="recommendation-item">${rec}</div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>Generated by MindHub Comprehensive Test Runner v1.0.0</p>
            <p>Report generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(timestamp) {
    const filename = `executive-summary-${timestamp}.md`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const summary = `# MindHub Healthcare Platform - Executive Test Summary

## Overview
- **Test Date**: ${this.results.startTime.toLocaleString()}
- **Duration**: ${Math.round(this.results.duration / 1000)} seconds
- **Overall Status**: ${this.results.summary.status}
- **Pass Rate**: ${this.results.summary.passRate}%

## Test Results Summary
- **Total Tests**: ${this.results.summary.total}
- **Passed**: ${this.results.summary.passed}
- **Failed**: ${this.results.summary.failed}
- **Skipped**: ${this.results.summary.skipped}

## Compliance Status

### Healthcare Compliance
- **HIPAA**: ${this.results.compliance.healthcare.hipaa}
- **NOM-024-SSA3-2010**: ${this.results.compliance.healthcare.nom024}
- **COFEPRIS**: ${this.results.compliance.healthcare.cofepris}

### Security Compliance
- **OWASP**: ${this.results.compliance.security.owasp}
- **Vulnerabilities**: ${this.results.compliance.security.vulnerabilities}

### Performance Compliance
- **Response Time**: ${this.results.compliance.performance.responseTime}
- **Throughput**: ${this.results.compliance.performance.throughput}
- **Reliability**: ${this.results.compliance.performance.reliability}

## Critical Issues
${this.results.criticalIssues.length > 0 ? 
  this.results.criticalIssues.map(issue => `- ⚠️ ${issue}`).join('\n') : 
  '- No critical issues detected'}

## Recommendations
${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Production Readiness Assessment
${this.generateProductionReadinessAssessment()}

---
*Report generated by MindHub Comprehensive Test Runner v1.0.0*
`;

    await fs.writeFile(filepath, summary);
    console.log(`   📋 Executive summary: ${filename}`);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(timestamp) {
    const filename = `compliance-report-${timestamp}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const complianceReport = {
      title: 'MindHub Healthcare Compliance Report',
      timestamp: this.results.startTime.toISOString(),
      standards: {
        healthcare: this.results.compliance.healthcare,
        security: this.results.compliance.security,
        performance: this.results.compliance.performance
      },
      criticalIssues: this.results.criticalIssues,
      recommendations: this.results.recommendations,
      certificationStatus: this.assessCertificationReadiness()
    };
    
    await fs.writeFile(filepath, JSON.stringify(complianceReport, null, 2));
    console.log(`   📜 Compliance report: ${filename}`);
  }

  /**
   * Generate production readiness assessment
   */
  generateProductionReadinessAssessment() {
    const passRate = this.results.summary.passRate;
    const criticalIssuesCount = this.results.criticalIssues.length;
    
    if (criticalIssuesCount > 0) {
      return `❌ **NOT READY FOR PRODUCTION**
- ${criticalIssuesCount} critical issues must be resolved before deployment
- Healthcare compliance violations detected
- Immediate remediation required`;
    }
    
    if (passRate >= 95 && this.results.compliance.healthcare.hipaa === 'COMPLIANT') {
      return `✅ **READY FOR PRODUCTION**
- All critical tests passing
- Healthcare compliance requirements met
- System meets production quality standards`;
    }
    
    if (passRate >= 90) {
      return `⚠️ **CONDITIONAL PRODUCTION READINESS**
- Most tests passing but some improvements needed
- Monitor system closely in production
- Address remaining issues in next iteration`;
    }
    
    return `❌ **NOT READY FOR PRODUCTION**
- Pass rate below 90% (${passRate}%)
- Multiple system reliability issues
- Requires significant improvements before deployment`;
  }

  /**
   * Assess certification readiness
   */
  assessCertificationReadiness() {
    const allHealthcareCompliant = Object.values(this.results.compliance.healthcare)
      .every(status => status === 'COMPLIANT');
    
    const allSecurityCompliant = Object.values(this.results.compliance.security)
      .every(status => status === 'COMPLIANT');
    
    const allPerformanceCompliant = Object.values(this.results.compliance.performance)
      .every(status => status === 'COMPLIANT');
    
    return {
      overallStatus: allHealthcareCompliant && allSecurityCompliant && allPerformanceCompliant ? 'READY' : 'NOT_READY',
      healthcare: allHealthcareCompliant ? 'READY' : 'NOT_READY',
      security: allSecurityCompliant ? 'READY' : 'NOT_READY',
      performance: allPerformanceCompliant ? 'READY' : 'NOT_READY',
      estimatedCertificationDate: allHealthcareCompliant && allSecurityCompliant && allPerformanceCompliant ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : // 1 week from now
        'Pending issue resolution'
    };
  }
}

// CLI interface
if (require.main === module) {
  console.log('MindHub Comprehensive Test Runner');
  console.log('Note: This tool requires an Express app instance to run tests.');
  console.log('Use this class programmatically with your app instance.');
  console.log('');
  console.log('Usage:');
  console.log('  const runner = new ComprehensiveTestRunner(app, config);');
  console.log('  await runner.runComprehensiveTests();');
}

module.exports = ComprehensiveTestRunner;