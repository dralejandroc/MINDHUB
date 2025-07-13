# MindHub Healthcare Platform - Testing Framework

## 🧪 Overview

Comprehensive testing framework for the MindHub Healthcare Platform, including API testing, integration testing, compliance validation, and performance benchmarking. All tests are designed with healthcare compliance requirements in mind.

## 🏗️ Test Architecture

### Test Suites

1. **API Test Suite** (`api-test-suite.js`)
   - Unit and integration tests for all API endpoints
   - Security testing (XSS, SQL injection, authentication)
   - Input validation and sanitization testing
   - Rate limiting and DDoS protection testing
   - Healthcare compliance validation

2. **Integration Tests** (`integration-tests.js`)
   - End-to-end workflow testing
   - Cross-service communication testing
   - Healthcare-specific scenarios
   - Emergency access procedures
   - PHI access control validation

3. **Test Runner** (`test-runner.js`)
   - Orchestrates all test execution
   - Generates comprehensive reports
   - CI/CD integration support
   - Multiple output formats (JSON, HTML, JUnit, CSV)

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Set up test environment variables
cp .env.example .env
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:api
npm run test:integration
npm run test:compliance
npm run test:performance

# Run tests for CI/CD
npm run test:ci
```

### Manual Test Execution

```bash
# Run with custom options
node shared/testing/test-runner.js --verbose --filter api,compliance --format json,html

# Run only security tests
node shared/testing/test-runner.js --filter api --verbose --stop-on-failure

# Run performance benchmarks
node shared/testing/test-runner.js --filter performance --format json
```

## 🔧 Test Configuration

### Environment Variables

```bash
# Test Configuration
TEST_TIMEOUT=300000                    # Test timeout in milliseconds
TEST_VERBOSE=true                      # Enable verbose logging
TEST_STOP_ON_FAILURE=false            # Stop on first failure
TEST_PARALLEL=false                    # Run tests in parallel

# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
JWT_SECRET=your-test-jwt-secret

# Database Configuration (for integration tests)
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
REDIS_URL=redis://localhost:6379

# Healthcare Compliance
ENABLE_COMPLIANCE_TESTS=true
NOM024_VALIDATION=true
COFEPRIS_VALIDATION=true
```

### Test Data Configuration

The testing framework uses predefined test data that complies with healthcare standards:

```javascript
// Test users with different roles
const testUsers = {
  admin: { role: 'admin', permissions: [...] },
  psychiatrist: { role: 'psychiatrist', permissions: [...] },
  psychologist: { role: 'psychologist', permissions: [...] },
  nurse: { role: 'nurse', permissions: [...] },
  patient: { role: 'patient', permissions: [...] }
};

// Test data for various entities
const testData = {
  validPatient: { /* Valid patient data */ },
  invalidPatient: { /* Invalid data for validation testing */ },
  validAssessment: { /* Valid assessment data */ },
  validForm: { /* Valid form data */ },
  maliciousPayloads: [ /* XSS, SQL injection, etc. */ ]
};
```

## 🧪 Test Categories

### 1. API Tests

#### Authentication & Authorization
- JWT token validation
- Role-based access control
- Session management
- Emergency access procedures

#### Security Tests
- XSS prevention
- SQL injection prevention
- Input validation and sanitization
- Rate limiting
- DDoS protection

#### Data Validation
- Patient data validation
- Clinical assessment validation
- Form submission validation
- Healthcare-specific field validation

#### Compliance Tests
- PHI access logging
- Audit trail completeness
- Data encryption verification
- Access control validation

### 2. Integration Tests

#### Healthcare Workflows
- **Patient Registration Workflow**
  - Create patient record
  - Validate patient data
  - Assign medical record number
  - Create initial assessment
  - Log PHI access
  - Send notifications

- **Clinical Assessment Workflow**
  - Authenticate healthcare professional
  - Access patient record
  - Create assessment session
  - Submit responses
  - Calculate scores
  - Generate interpretation
  - Store with audit trail

- **Emergency Access Workflow**
  - Emergency authentication
  - Override access controls
  - Access critical data
  - Log emergency access
  - Generate incident report

#### Cross-Service Communication
- Expedix ↔ Clinimetrix integration
- Clinimetrix ↔ Formx integration
- Formx ↔ Resources integration
- Integrix orchestration

### 3. Compliance Tests

#### NOM-024-SSA3-2010 Compliance
- ✅ PHI Access Controls
- ✅ Audit Trail Completeness
- ✅ Data Encryption
- ✅ Emergency Access Procedures

#### COFEPRIS Compliance
- ✅ Medical Software Certification
- ✅ Clinical Data Integrity
- ✅ Healthcare Professional Authentication

#### Data Protection
- ✅ Data Minimization
- ✅ Consent Management
- ✅ Data Retention Policies

### 4. Performance Tests

#### Load Testing
- API response times
- Concurrent user handling
- Database performance
- Memory usage monitoring

#### Stress Testing
- Connection pool limits
- Resource exhaustion scenarios
- Recovery testing

## 📊 Test Reports

### Report Formats

1. **JSON Report** (`test-report-TIMESTAMP.json`)
   - Complete test results
   - Machine-readable format
   - CI/CD integration

2. **HTML Report** (`test-report-TIMESTAMP.html`)
   - Interactive web report
   - Visual charts and metrics
   - Detailed compliance status

3. **JUnit XML** (`junit-report-TIMESTAMP.xml`)
   - CI/CD integration
   - Standard test result format

4. **CSV Report** (`test-report-TIMESTAMP.csv`)
   - Spreadsheet analysis
   - Test metrics export

### Report Contents

```json
{
  "summary": {
    "timestamp": "2024-01-15T10:30:00Z",
    "totalTests": 150,
    "passedTests": 142,
    "failedTests": 8,
    "complianceScore": 95,
    "securityScore": 98,
    "performanceScore": 90
  },
  "compliance": {
    "nom024Status": "COMPLIANT",
    "cofeprisStatus": "COMPLIANT",
    "overallStatus": "COMPLIANT"
  },
  "details": {
    "api": { /* API test results */ },
    "integration": { /* Integration test results */ },
    "security": { /* Security test results */ },
    "performance": { /* Performance metrics */ }
  },
  "recommendations": [
    "Address failed security tests",
    "Improve API response times",
    "Review compliance gaps"
  ]
}
```

## 🔍 Healthcare-Specific Testing

### PHI (Protected Health Information) Testing

```javascript
// Test PHI access controls
await testPHIAccessControl({
  patient: testPatient,
  accessor: testUser,
  expectedAccess: 'ALLOWED' | 'DENIED',
  auditRequired: true
});

// Test data minimization
await testDataMinimization({
  endpoint: '/expedix/patients/summary',
  userRole: 'nurse',
  expectedFields: ['firstName', 'lastName', 'basicContactInfo'],
  restrictedFields: ['email', 'fullAddress', 'emergencyContact']
});
```

### Clinical Workflow Testing

```javascript
// Test complete clinical assessment workflow
const workflow = await testClinicalWorkflow({
  patient: testPatient,
  assessor: testPsychologist,
  assessment: 'Beck Depression Inventory',
  expectedOutcome: {
    scoreCalculated: true,
    interpretationGenerated: true,
    auditLogged: true
  }
});
```

### Emergency Access Testing

```javascript
// Test emergency override procedures
const emergencyAccess = await testEmergencyAccess({
  patient: testPatient,
  emergencyUser: testNurse,
  justification: 'Patient unconscious, need medical history',
  expectedBehavior: {
    accessGranted: true,
    auditLogged: true,
    incidentReportGenerated: true,
    managerNotified: true
  }
});
```

## 🛠️ Custom Test Development

### Creating New Test Suites

```javascript
const { APITestSuite } = require('./shared/testing');

class CustomTestSuite extends APITestSuite {
  async testCustomWorkflow() {
    // Implement custom test logic
    const result = await this.authenticatedRequest('post', '/custom/endpoint', this.testUsers.admin)
      .send(customData);
    
    return {
      passed: result.status === 200,
      details: result.body
    };
  }
}
```

### Adding Compliance Checks

```javascript
async validateCustomCompliance() {
  const checks = [
    {
      name: 'Custom Healthcare Standard',
      test: async () => {
        // Implement compliance check
        return { passed: true, details: 'Compliance verified' };
      }
    }
  ];
  
  // Execute checks and return results
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Healthcare Platform Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:ci
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-reports
        path: test-reports/
        
    - name: Check compliance
      run: |
        if grep -q "NON_COMPLIANT" test-reports/*.json; then
          echo "❌ Healthcare compliance tests failed"
          exit 1
        else
          echo "✅ Healthcare compliance tests passed"
        fi
```

### Docker Integration

```dockerfile
# Test container
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Run tests
CMD ["npm", "run", "test:ci"]
```

## 🚨 Troubleshooting

### Common Issues

1. **Test Timeouts**
   ```bash
   # Increase timeout for slow tests
   TEST_TIMEOUT=600000 npm run test:all
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   npm run db:test-connection
   ```

3. **Authentication Failures**
   ```bash
   # Verify JWT secret configuration
   echo $JWT_SECRET
   ```

4. **Compliance Test Failures**
   ```bash
   # Run compliance tests in isolation
   npm run test:compliance -- --verbose
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=test:* npm run test:all

# Run single test with debug output
NODE_ENV=test DEBUG=* node shared/testing/test-runner.js --filter api --verbose
```

## 📝 Best Practices

### Test Data Management
- Use realistic but anonymized healthcare data
- Implement data cleanup after tests
- Maintain HIPAA-compliant test datasets

### Security Testing
- Regularly update malicious payload databases
- Test against OWASP Top 10 vulnerabilities
- Validate all input sanitization

### Compliance Testing
- Stay updated with healthcare regulations
- Document compliance test rationale
- Regular compliance audit reviews

### Performance Testing
- Set realistic performance benchmarks
- Monitor resource usage trends
- Test under various load conditions

---

## 📄 License

This testing framework is part of the MindHub Healthcare Platform and is subject to the same licensing terms.

## 🤝 Contributing

When contributing new tests:

1. Follow healthcare data privacy guidelines
2. Include compliance documentation
3. Add performance benchmarks
4. Update test documentation

---

*Generated on: January 15, 2024*  
*Testing Framework Version: 1.0.0*  
*Healthcare Compliance: NOM-024-SSA3-2010, COFEPRIS*