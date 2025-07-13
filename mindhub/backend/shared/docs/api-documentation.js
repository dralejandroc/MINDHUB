/**
 * API Documentation Generator for MindHub Healthcare Platform
 * 
 * Comprehensive documentation generation with interactive examples,
 * healthcare compliance notes, and developer guides
 */

const fs = require('fs').promises;
const path = require('path');
const OpenAPIGenerator = require('./openapi-generator');

class APIDocumentationGenerator {
  constructor() {
    this.openApiGenerator = new OpenAPIGenerator();
    
    // Documentation templates
    this.templates = {
      index: this.getIndexTemplate(),
      gettingStarted: this.getGettingStartedTemplate(),
      authentication: this.getAuthenticationTemplate(),
      healthcareCompliance: this.getHealthcareComplianceTemplate(),
      errorHandling: this.getErrorHandlingTemplate(),
      rateLimit: this.getRateLimitTemplate(),
      versioning: this.getVersioningTemplate(),
      webhooks: this.getWebhooksTemplate(),
      sdks: this.getSDKsTemplate(),
      changelog: this.getChangelogTemplate()
    };

    // Healthcare-specific documentation
    this.healthcareGuides = {
      patientDataAccess: this.getPatientDataAccessGuide(),
      clinicalAssessments: this.getClinicalAssessmentsGuide(),
      complianceRequirements: this.getComplianceRequirementsGuide(),
      auditLogging: this.getAuditLoggingGuide(),
      emergencyProtocols: this.getEmergencyProtocolsGuide()
    };
  }

  /**
   * Generate complete documentation
   */
  async generateDocumentation(outputDir = './docs') {
    const results = [];

    // Create directory structure
    await this.createDirectoryStructure(outputDir);

    // Generate OpenAPI specifications
    const apiDir = path.join(outputDir, 'api');
    const specFiles = await this.openApiGenerator.generateAllSpecs(apiDir);
    results.push(...specFiles);

    // Generate markdown documentation
    const markdownDir = path.join(outputDir, 'guides');
    const markdownFiles = await this.generateMarkdownDocs(markdownDir);
    results.push(...markdownFiles);

    // Generate interactive documentation
    const interactiveDir = path.join(outputDir, 'interactive');
    const interactiveFiles = await this.generateInteractiveDocs(interactiveDir, apiDir);
    results.push(...interactiveFiles);

    // Generate healthcare-specific guides
    const healthcareDir = path.join(outputDir, 'healthcare');
    const healthcareFiles = await this.generateHealthcareDocs(healthcareDir);
    results.push(...healthcareFiles);

    // Generate developer tools
    const toolsDir = path.join(outputDir, 'tools');
    const toolFiles = await this.generateDeveloperTools(toolsDir);
    results.push(...toolFiles);

    return results;
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure(baseDir) {
    const dirs = [
      'api',
      'guides',
      'interactive',
      'healthcare',
      'tools',
      'examples',
      'assets/images',
      'assets/css',
      'assets/js'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(baseDir, dir), { recursive: true });
    }
  }

  /**
   * Generate markdown documentation
   */
  async generateMarkdownDocs(outputDir) {
    const files = [];

    for (const [name, template] of Object.entries(this.templates)) {
      const filePath = path.join(outputDir, `${name}.md`);
      await fs.writeFile(filePath, template, 'utf8');
      files.push(filePath);
    }

    return files;
  }

  /**
   * Generate interactive documentation
   */
  async generateInteractiveDocs(outputDir, apiDir) {
    const files = [];

    // Generate Swagger UI HTML
    const swaggerHtml = this.generateSwaggerUI();
    const swaggerPath = path.join(outputDir, 'swagger.html');
    await fs.writeFile(swaggerPath, swaggerHtml, 'utf8');
    files.push(swaggerPath);

    // Generate Redoc HTML
    const redocHtml = this.generateRedocUI();
    const redocPath = path.join(outputDir, 'redoc.html');
    await fs.writeFile(redocPath, redocHtml, 'utf8');
    files.push(redocPath);

    // Generate Postman collection
    const postmanCollection = await this.generatePostmanCollection();
    const postmanPath = path.join(outputDir, 'mindhub-api.postman_collection.json');
    await fs.writeFile(postmanPath, JSON.stringify(postmanCollection, null, 2), 'utf8');
    files.push(postmanPath);

    return files;
  }

  /**
   * Generate healthcare-specific documentation
   */
  async generateHealthcareDocs(outputDir) {
    const files = [];

    for (const [name, content] of Object.entries(this.healthcareGuides)) {
      const filePath = path.join(outputDir, `${name}.md`);
      await fs.writeFile(filePath, content, 'utf8');
      files.push(filePath);
    }

    return files;
  }

  /**
   * Generate developer tools
   */
  async generateDeveloperTools(outputDir) {
    const files = [];

    // Generate SDK examples
    const sdkExamples = this.generateSDKExamples();
    for (const [lang, code] of Object.entries(sdkExamples)) {
      const filePath = path.join(outputDir, `example.${lang}`);
      await fs.writeFile(filePath, code, 'utf8');
      files.push(filePath);
    }

    // Generate validation schemas
    const schemas = this.generateValidationSchemas();
    const schemasPath = path.join(outputDir, 'validation-schemas.json');
    await fs.writeFile(schemasPath, JSON.stringify(schemas, null, 2), 'utf8');
    files.push(schemasPath);

    // Generate test data
    const testData = this.generateTestData();
    const testDataPath = path.join(outputDir, 'test-data.json');
    await fs.writeFile(testDataPath, JSON.stringify(testData, null, 2), 'utf8');
    files.push(testDataPath);

    return files;
  }

  /**
   * Get index template
   */
  getIndexTemplate() {
    return `# MindHub Healthcare Platform API Documentation

Welcome to the comprehensive API documentation for the MindHub Healthcare Platform - a cutting-edge digital mental health solution designed specifically for the Mexican healthcare market.

## Overview

The MindHub API provides secure, compliant access to patient management, clinical assessments, dynamic forms, and educational resources through a modern RESTful interface.

### Key Features

- **🏥 Healthcare Compliance**: Full compliance with NOM-024-SSA3-2010 and COFEPRIS regulations
- **🔒 Advanced Security**: Multi-factor authentication, encryption, and audit logging
- **📊 Clinical Assessments**: Standardized psychological scales and scoring algorithms
- **📋 Dynamic Forms**: Flexible form builder with conditional logic
- **📚 Educational Resources**: Comprehensive library of patient education materials
- **🔄 Real-time Integration**: Event-driven architecture with real-time notifications

## Quick Start

1. [Authentication](./guides/authentication.md) - Get your API credentials
2. [Making Your First Request](./guides/gettingStarted.md) - Basic API usage
3. [Healthcare Compliance](./healthcare/complianceRequirements.md) - Understanding compliance requirements

## API Hubs

### Expedix - Patient Management
Comprehensive patient data management with medical records, demographics, and care coordination.

- **Base URL**: \`/api/v1/expedix\`
- **Key Features**: Patient records, medical history, care plans
- **Compliance**: PHI-protected endpoints with audit logging

### Clinimetrix - Clinical Assessments
Standardized psychological assessments and clinical evaluation tools.

- **Base URL**: \`/api/v1/clinimetrix\`
- **Key Features**: Assessment scales, scoring algorithms, interpretations
- **Specialization**: Depression, anxiety, bipolar, trauma assessments

### Formx - Dynamic Forms
Flexible form builder and submission management system.

- **Base URL**: \`/api/v1/formx\`
- **Key Features**: Form creation, conditional logic, submissions
- **Use Cases**: Intake forms, consent forms, satisfaction surveys

### Resources - Educational Content
Educational materials and resources for patients and professionals.

- **Base URL**: \`/api/v1/resources\`
- **Key Features**: Content library, personalized recommendations
- **Content Types**: Handouts, videos, interactive tools

## Interactive Documentation

- [Swagger UI](./interactive/swagger.html) - Interactive API explorer
- [ReDoc](./interactive/redoc.html) - Beautiful API documentation
- [Postman Collection](./interactive/mindhub-api.postman_collection.json) - Ready-to-use API collection

## Healthcare-Specific Guides

- [Patient Data Access](./healthcare/patientDataAccess.md)
- [Clinical Assessment Workflows](./healthcare/clinicalAssessments.md)
- [Compliance Requirements](./healthcare/complianceRequirements.md)
- [Audit Logging](./healthcare/auditLogging.md)
- [Emergency Protocols](./healthcare/emergencyProtocols.md)

## Developer Resources

- [SDKs and Libraries](./guides/sdks.md)
- [Error Handling](./guides/errorHandling.md)
- [Rate Limiting](./guides/rateLimit.md)
- [API Versioning](./guides/versioning.md)
- [Webhooks](./guides/webhooks.md)

## Support

- **Email**: api-support@mindhub.health
- **Documentation**: https://docs.mindhub.health
- **Status Page**: https://status.mindhub.health
- **GitHub**: https://github.com/mindhub/healthcare-platform

## License

This API documentation is licensed under MIT License. See [LICENSE](./LICENSE) for details.

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
  }

  /**
   * Get getting started template
   */
  getGettingStartedTemplate() {
    return `# Getting Started with MindHub API

This guide will help you make your first API request to the MindHub Healthcare Platform.

## Prerequisites

- Valid API credentials (JWT token or API key)
- Basic understanding of RESTful APIs
- Familiarity with healthcare data privacy requirements

## Base URLs

- **Production**: \`https://api.mindhub.health/v1\`
- **Staging**: \`https://staging-api.mindhub.health/v1\`
- **Development**: \`http://localhost:3000/api/v1\`

## Authentication

All API requests require authentication. Include your JWT token in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://api.mindhub.health/v1/expedix/patients
\`\`\`

## Your First Request

Let's start by checking the API health status:

\`\`\`bash
curl -X GET https://api.mindhub.health/v1/health \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
\`\`\`

## Common Request Headers

Always include these headers in your requests:

\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
X-API-Version: v1
X-Request-ID: unique-request-id (optional but recommended)
\`\`\`

## Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}
\`\`\`

## Error Handling

When errors occur, the API returns a structured error response:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["firstName is required"],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
\`\`\`

## Pagination

List endpoints support pagination using query parameters:

\`\`\`bash
curl "https://api.mindhub.health/v1/expedix/patients?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

## Healthcare Compliance

When working with patient data, remember:

- All patient data access is logged for audit purposes
- PHI (Protected Health Information) requires appropriate authorization
- Emergency access protocols are available for critical situations

## Next Steps

1. [Authentication Guide](./authentication.md) - Learn about JWT tokens and API keys
2. [Patient Management](../healthcare/patientDataAccess.md) - Working with patient data
3. [Clinical Assessments](../healthcare/clinicalAssessments.md) - Conducting assessments
4. [Error Handling](./errorHandling.md) - Handling API errors gracefully

## Code Examples

### JavaScript/Node.js

\`\`\`javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.mindhub.health/v1',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Get patients
const patients = await api.get('/expedix/patients');
console.log(patients.data);
\`\`\`

### Python

\`\`\`python
import requests

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.mindhub.health/v1/expedix/patients',
    headers=headers
)

print(response.json())
\`\`\`

### PHP

\`\`\`php
<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://api.mindhub.health/v1/expedix/patients');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_JWT_TOKEN',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);

print_r($data);
?>
\`\`\`

## Rate Limits

The API enforces rate limits to ensure fair usage:

- **Authenticated users**: 1000 requests per hour
- **Patient data endpoints**: 500 requests per hour
- **Assessment endpoints**: 300 requests per hour

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
\`\`\`

## Testing

Use our Postman collection for easy testing:
[Download Postman Collection](../interactive/mindhub-api.postman_collection.json)

## Support

If you need help:
- Email: api-support@mindhub.health
- Documentation: https://docs.mindhub.health
- Status: https://status.mindhub.health
`;
  }

  /**
   * Get authentication template
   */
  getAuthenticationTemplate() {
    return `# Authentication

The MindHub API uses JWT (JSON Web Tokens) for authentication, with support for multi-factor authentication and role-based access control.

## Authentication Methods

### 1. JWT Bearer Token (Recommended)

Include your JWT token in the Authorization header:

\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### 2. API Key (Service-to-Service)

For service-to-service communication:

\`\`\`
X-API-Key: your-api-key-here
\`\`\`

### 3. OAuth 2.0 (Enterprise)

For enterprise integrations with third-party systems.

## Getting a JWT Token

### Login Endpoint

\`\`\`bash
curl -X POST https://api.mindhub.health/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "psychiatrist",
      "permissions": ["read:patients", "write:assessments"]
    }
  }
}
\`\`\`

### Multi-Factor Authentication

If MFA is enabled, you'll receive a challenge:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "MFA_REQUIRED",
    "message": "Multi-factor authentication required",
    "challengeId": "mfa-challenge-id"
  }
}
\`\`\`

Complete MFA:
\`\`\`bash
curl -X POST https://api.mindhub.health/v1/auth/mfa/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "challengeId": "mfa-challenge-id",
    "code": "123456"
  }'
\`\`\`

## Token Refresh

Refresh your token before it expires:

\`\`\`bash
curl -X POST https://api.mindhub.health/v1/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{
    "refreshToken": "your-refresh-token"
  }'
\`\`\`

## Role-Based Access Control

The API enforces role-based permissions:

### Roles

- **admin**: Full system access
- **psychiatrist**: Full clinical access
- **psychologist**: Clinical assessments and reports
- **nurse**: Patient care and monitoring
- **patient**: Personal data access only

### Permissions

- \`read:patients\` - View patient data
- \`write:patients\` - Create/update patient records
- \`read:assessments\` - View clinical assessments
- \`write:assessments\` - Create/update assessments
- \`read:forms\` - View forms and submissions
- \`write:forms\` - Create/update forms
- \`admin:all\` - Administrative operations

## Session Management

### Session Timeout

- **Administrators**: 4 hours
- **Healthcare Professionals**: 8 hours
- **Patients**: 2 hours

### Logout

\`\`\`bash
curl -X POST https://api.mindhub.health/v1/auth/logout \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

## Security Best Practices

1. **Store tokens securely** - Never store in local storage or cookies without encryption
2. **Use HTTPS only** - All API calls must use HTTPS
3. **Rotate tokens regularly** - Implement token refresh logic
4. **Monitor for suspicious activity** - Unusual access patterns are logged
5. **Emergency access** - Special protocols for critical healthcare situations

## Emergency Access

In critical healthcare situations, emergency access can be granted:

\`\`\`
X-Emergency-Access: true
X-Emergency-Code: emergency-code-here
X-Emergency-Justification: "Patient critical condition"
\`\`\`

**Note**: Emergency access is heavily audited and should only be used in genuine emergencies.

## Error Codes

- \`401 UNAUTHORIZED\` - Invalid or missing token
- \`403 FORBIDDEN\` - Insufficient permissions
- \`429 TOO_MANY_REQUESTS\` - Rate limit exceeded
- \`MFA_REQUIRED\` - Multi-factor authentication needed

## Testing Authentication

Use this endpoint to test your authentication:

\`\`\`bash
curl -X GET https://api.mindhub.health/v1/auth/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "psychiatrist",
      "permissions": ["read:patients", "write:assessments"],
      "lastLogin": "2024-01-15T10:30:00Z"
    }
  }
}
\`\`\`
`;
  }

  /**
   * Get healthcare compliance template
   */
  getHealthcareComplianceTemplate() {
    return `# Healthcare Compliance Guide

The MindHub API is designed to meet strict healthcare compliance requirements, including Mexican regulations NOM-024-SSA3-2010 and COFEPRIS standards.

## Compliance Standards

### NOM-024-SSA3-2010
Mexican official standard for health information systems and electronic health records.

**Key Requirements:**
- Patient data encryption at rest and in transit
- Comprehensive audit logging of all data access
- Role-based access control for healthcare professionals
- Data retention policies for medical records
- Patient consent management

### COFEPRIS Compliance
Mexican Federal Commission for the Protection Against Sanitary Risk regulations.

**Key Requirements:**
- Medical device software validation
- Adverse event reporting capabilities
- Quality management system compliance
- Risk management documentation

## Data Classification

### Protected Health Information (PHI)
Endpoints marked with \`x-healthcare-phi: true\` contain PHI:

- Patient identifiers (names, MRN, DOB)
- Medical records and clinical data
- Assessment results and interpretations
- Contact information and addresses

### Medical Data
Clinical information requiring special handling:

- Diagnoses and treatment plans
- Medication records and prescriptions
- Clinical assessments and scores
- Progress notes and observations

### Administrative Data
Non-clinical healthcare data:

- Appointment schedules
- Billing information
- System configurations
- User management data

## Audit Logging

All API interactions involving patient data are automatically logged:

### Logged Information
- User ID and role
- Patient ID (when applicable)
- Endpoint accessed
- Timestamp and IP address
- Action performed (read, write, delete)
- Justification (for sensitive operations)

### Audit Log Format
\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "user-123",
  "userRole": "psychiatrist",
  "patientId": "patient-456",
  "action": "READ",
  "endpoint": "/api/v1/expedix/patients/patient-456",
  "ipAddress": "192.168.1.1",
  "userAgent": "MindHub-Client/1.0",
  "justification": "Clinical assessment review",
  "complianceFlags": ["NOM-024-SSA3-2010"]
}
\`\`\`

## Access Controls

### Minimum Necessary Standard
Access is limited to the minimum data necessary for the intended purpose.

### Role-Based Permissions
- **Psychiatrists**: Full access to assigned patients
- **Psychologists**: Assessment and therapy data
- **Nurses**: Care coordination and monitoring data
- **Patients**: Own data only
- **Administrators**: System configuration (no patient data)

### Patient Assignment
Healthcare professionals can only access patients assigned to their care:

\`\`\`bash
# This will only return patients assigned to the authenticated user
curl -H "Authorization: Bearer JWT_TOKEN" \\
     https://api.mindhub.health/v1/expedix/patients
\`\`\`

## Consent Management

### Patient Consent Tracking
All patient interactions must have appropriate consent:

\`\`\`json
{
  "patientId": "patient-123",
  "consentType": "data_sharing",
  "consentStatus": "granted",
  "consentDate": "2024-01-15T10:30:00Z",
  "consentDocument": "consent-doc-id",
  "grantor": "patient",
  "witnesses": ["witness-1", "witness-2"]
}
\`\`\`

### Consent Verification
Before accessing sensitive data, verify consent:

\`\`\`bash
curl -H "Authorization: Bearer JWT_TOKEN" \\
     https://api.mindhub.health/v1/expedix/patients/patient-123/consent
\`\`\`

## Data Retention

### Retention Periods
- **Clinical Records**: 10 years minimum
- **Assessment Data**: 7 years minimum
- **Audit Logs**: 7 years minimum
- **Consent Records**: 10 years minimum

### Data Deletion
Patient data can only be deleted under specific circumstances:

1. Patient request (right to be forgotten)
2. Legal requirement
3. End of retention period
4. Data correction (with audit trail)

## Encryption Requirements

### Data in Transit
- All API communications use TLS 1.3
- Certificate pinning recommended
- Perfect Forward Secrecy (PFS) enabled

### Data at Rest
- AES-256 encryption for all patient data
- Key management through secure key store
- Regular key rotation

## Emergency Access

### Break-Glass Access
In medical emergencies, temporary elevated access may be granted:

\`\`\`
X-Emergency-Access: true
X-Emergency-Code: EMERGENCY_CODE
X-Emergency-Justification: "Patient in critical condition requiring immediate access to medical history"
\`\`\`

**Important**: Emergency access is heavily audited and requires post-incident review.

## Compliance Headers

Include compliance information in requests:

\`\`\`
X-Healthcare-Context: clinical_care
X-Patient-Consent-Verified: true
X-Data-Classification: PHI
X-Audit-Justification: "Routine clinical assessment"
\`\`\`

## Violation Reporting

### Automatic Detection
The system automatically detects potential violations:

- Unusual access patterns
- Access without proper consent
- Data access outside normal hours
- Multiple failed authentication attempts

### Violation Response
When violations are detected:

1. Immediate alert to security team
2. User account temporary suspension
3. Comprehensive audit log review
4. Incident report generation

## Best Practices

### For Developers
1. **Minimize data exposure** - Only request necessary fields
2. **Implement proper error handling** - Don't expose sensitive data in errors
3. **Use secure storage** - Encrypt local caches and temporary files
4. **Regular security testing** - Implement automated security scans

### For Healthcare Professionals
1. **Verify patient identity** - Confirm patient before accessing records
2. **Document access justification** - Provide clear reasons for data access
3. **Secure device usage** - Use only approved, secure devices
4. **Immediate logout** - Always logout when finished

## Compliance Endpoints

### Audit Log Access
\`\`\`bash
curl -H "Authorization: Bearer JWT_TOKEN" \\
     https://api.mindhub.health/v1/compliance/audit-logs?patientId=patient-123
\`\`\`

### Consent Status Check
\`\`\`bash
curl -H "Authorization: Bearer JWT_TOKEN" \\
     https://api.mindhub.health/v1/compliance/consent/patient-123
\`\`\`

### Data Access Report
\`\`\`bash
curl -H "Authorization: Bearer JWT_TOKEN" \\
     https://api.mindhub.health/v1/compliance/access-report?startDate=2024-01-01&endDate=2024-01-31
\`\`\`

## Contact

For compliance questions or to report potential violations:

- **Compliance Officer**: compliance@mindhub.health
- **Security Team**: security@mindhub.health
- **Emergency Hotline**: +52-55-1234-5678
`;
  }

  /**
   * Additional template methods would continue here...
   * For brevity, I'll include placeholders for the remaining templates
   */

  getErrorHandlingTemplate() {
    return `# Error Handling\n\nComprehensive guide to API error handling...`;
  }

  getRateLimitTemplate() {
    return `# Rate Limiting\n\nUnderstanding API rate limits and best practices...`;
  }

  getVersioningTemplate() {
    return `# API Versioning\n\nGuide to API versioning strategy and migration...`;
  }

  getWebhooksTemplate() {
    return `# Webhooks\n\nReal-time notifications and webhook configuration...`;
  }

  getSDKsTemplate() {
    return `# SDKs and Libraries\n\nOfficial and community SDKs for various languages...`;
  }

  getChangelogTemplate() {
    return `# API Changelog\n\nVersion history and breaking changes...`;
  }

  /**
   * Healthcare-specific guide methods
   */
  getPatientDataAccessGuide() {
    return `# Patient Data Access Guide\n\nSecure patterns for accessing patient data...`;
  }

  getClinicalAssessmentsGuide() {
    return `# Clinical Assessments Guide\n\nWorking with psychological assessments and scales...`;
  }

  getComplianceRequirementsGuide() {
    return `# Compliance Requirements\n\nDetailed compliance requirements and implementation...`;
  }

  getAuditLoggingGuide() {
    return `# Audit Logging Guide\n\nUnderstanding audit trails and logging requirements...`;
  }

  getEmergencyProtocolsGuide() {
    return `# Emergency Protocols\n\nEmergency access procedures and protocols...`;
  }

  /**
   * Generate Swagger UI HTML
   */
  generateSwaggerUI() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MindHub API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { background-color: #2c5aa0; }
    .swagger-ui .topbar .download-url-wrapper .select-label { color: white; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '../api/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        docExpansion: "list",
        operationsSorter: "alpha",
        tagsSorter: "alpha",
        filter: true,
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          request.headers['X-API-Version'] = 'v1';
          return request;
        }
      });
    };
  </script>
</body>
</html>`;
  }

  /**
   * Generate Redoc UI HTML
   */
  generateRedocUI() {
    return `<!DOCTYPE html>
<html>
<head>
  <title>MindHub API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
    redoc { display: block; }
  </style>
</head>
<body>
  <redoc spec-url="../api/openapi.yaml" theme="{ colors: { primary: { main: '#2c5aa0' } } }"></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.0/bundles/redoc.standalone.js"></script>
</body>
</html>`;
  }

  /**
   * Generate Postman collection
   */
  async generatePostmanCollection() {
    return {
      info: {
        name: "MindHub Healthcare API",
        description: "Comprehensive healthcare API for digital mental health services",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      auth: {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: "{{jwt_token}}",
            type: "string"
          }
        ]
      },
      variable: [
        {
          key: "baseUrl",
          value: "https://api.mindhub.health/v1",
          type: "string"
        },
        {
          key: "jwt_token",
          value: "your-jwt-token-here",
          type: "string"
        }
      ],
      item: [
        {
          name: "Authentication",
          item: [
            {
              name: "Login",
              request: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    email: "user@example.com",
                    password: "password"
                  })
                },
                url: {
                  raw: "{{baseUrl}}/auth/login",
                  host: ["{{baseUrl}}"],
                  path: ["auth", "login"]
                }
              }
            }
          ]
        },
        {
          name: "Patients",
          item: [
            {
              name: "List Patients",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/expedix/patients?page=1&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["expedix", "patients"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate SDK examples
   */
  generateSDKExamples() {
    return {
      js: `// JavaScript/Node.js SDK Example
const MindHubAPI = require('mindhub-sdk');

const client = new MindHubAPI({
  baseURL: 'https://api.mindhub.health/v1',
  token: 'your-jwt-token'
});

// Get patients
const patients = await client.patients.list({ page: 1, limit: 20 });
console.log(patients);`,

      py: `# Python SDK Example
from mindhub_sdk import MindHubClient

client = MindHubClient(
    base_url='https://api.mindhub.health/v1',
    token='your-jwt-token'
)

# Get patients
patients = client.patients.list(page=1, limit=20)
print(patients)`,

      php: `<?php
// PHP SDK Example
require_once 'vendor/autoload.php';

use MindHub\\SDK\\Client;

$client = new Client([
    'base_url' => 'https://api.mindhub.health/v1',
    'token' => 'your-jwt-token'
]);

// Get patients
$patients = $client->patients()->list(['page' => 1, 'limit' => 20]);
print_r($patients);
?>`
    };
  }

  /**
   * Generate validation schemas
   */
  generateValidationSchemas() {
    return {
      patient: {
        type: "object",
        required: ["firstName", "lastName", "dateOfBirth"],
        properties: {
          firstName: { type: "string", minLength: 1, maxLength: 100 },
          lastName: { type: "string", minLength: 1, maxLength: 100 },
          dateOfBirth: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female", "other"] }
        }
      },
      assessment: {
        type: "object",
        required: ["patientId", "scaleId", "responses"],
        properties: {
          patientId: { type: "string", format: "uuid" },
          scaleId: { type: "string", format: "uuid" },
          responses: {
            type: "array",
            items: {
              type: "object",
              required: ["itemId", "value"],
              properties: {
                itemId: { type: "string", format: "uuid" },
                value: { type: "string" }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      patients: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          firstName: "Juan",
          lastName: "Pérez",
          dateOfBirth: "1985-03-15",
          gender: "male"
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          firstName: "María",
          lastName: "García",
          dateOfBirth: "1990-07-22",
          gender: "female"
        }
      ],
      assessments: [
        {
          id: "550e8400-e29b-41d4-a716-446655440010",
          patientId: "550e8400-e29b-41d4-a716-446655440001",
          scaleId: "550e8400-e29b-41d4-a716-446655440020",
          totalScore: 15,
          interpretation: "Mild depression"
        }
      ]
    };
  }
}

module.exports = APIDocumentationGenerator;