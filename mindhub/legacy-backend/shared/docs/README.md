# MindHub Healthcare Platform - API Documentation

## 🏥 Overview

The MindHub Healthcare Platform provides a comprehensive suite of APIs for digital mental health services, including patient management, clinical assessments, dynamic forms, educational resources, and service integration. All APIs are designed with healthcare compliance standards including NOM-024-SSA3-2010 and COFEPRIS requirements.

## 🚀 Quick Start

### Base URL
```
Production:  https://api.mindhub.health/v1
Staging:     https://staging-api.mindhub.health/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All API endpoints require Bearer JWT authentication:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     https://api.mindhub.health/v1/expedix/patients
```

### API Versioning
The API uses URL-based versioning. Current version is `v1`. Version headers are supported:
```bash
curl -H "X-API-Version: v1" \
     -H "Authorization: Bearer TOKEN" \
     https://api.mindhub.health/v1/endpoints
```

## 📚 Documentation Formats

### Interactive Documentation
- **Swagger UI**: [/docs/interactive/swagger.html](./interactive/swagger.html)
- **ReDoc**: [/docs/interactive/redoc.html](./interactive/redoc.html)

### Machine-Readable Formats
- **OpenAPI JSON**: [/docs/api/openapi.json](./api/openapi.json)
- **OpenAPI YAML**: [/docs/api/openapi.yaml](./api/openapi.yaml)
- **Postman Collection**: [/docs/tools/postman-collection.json](./tools/postman-collection.json)

### Guides & Tutorials
- **Getting Started**: [/docs/guides/getting-started.md](./guides/getting-started.md)
- **Authentication Guide**: [/docs/guides/authentication.md](./guides/authentication.md)
- **Healthcare Compliance**: [/docs/healthcare/compliance-guide.md](./healthcare/compliance-guide.md)
- **Error Handling**: [/docs/guides/error-handling.md](./guides/error-handling.md)

## 🏗️ Platform Architecture

### Hub Services

#### 🧑‍⚕️ Expedix Hub - Patient Management
- **Base Path**: `/expedix`
- **Purpose**: Comprehensive patient management and medical records
- **Key Features**: Patient CRUD, medical history, demographics, healthcare provider workflows
- **Compliance**: PHI-sensitive with full audit logging

#### 📊 Clinimetrix Hub - Clinical Assessments
- **Base Path**: `/clinimetrix` 
- **Purpose**: Clinical assessments and psychological evaluations
- **Key Features**: Standardized scales, automated scoring, clinical interpretation
- **Compliance**: Clinical data classification with professional access controls

#### 📝 Formx Hub - Dynamic Forms
- **Base Path**: `/formx`
- **Purpose**: Dynamic forms builder and submission management
- **Key Features**: Form creation, conditional logic, healthcare-specific validations
- **Compliance**: Configurable data classification based on form content

#### 📚 Resources Hub - Educational Content
- **Base Path**: `/resources`
- **Purpose**: Educational content and resource library
- **Key Features**: Patient education materials, professional training, multimedia content
- **Compliance**: General access with role-based content filtering

#### 🔗 Integrix Hub - Integration Layer
- **Base Path**: `/integrix`
- **Purpose**: Internal API integration and service communication
- **Key Features**: Service-to-service auth, data sync, health monitoring
- **Compliance**: Administrative with enhanced security logging

## 🔐 Security & Compliance

### Healthcare Standards
- **NOM-024-SSA3-2010**: Mexican healthcare information systems standard
- **COFEPRIS**: Federal Commission certification requirements
- **PHI Protection**: Protected Health Information security measures

### Security Features
- **JWT Authentication**: Role-based access control
- **Rate Limiting**: Role-specific limits with emergency access
- **Audit Logging**: Comprehensive access trails for PHI data
- **Data Encryption**: End-to-end encryption for sensitive data
- **API Versioning**: Backward-compatible version management

### Access Control Levels
```
admin            - Full system access
psychiatrist     - Clinical data and patient management  
psychologist     - Assessment administration and review
nurse            - Patient care and basic assessments
patient          - Self-service and personal data access
```

## 📋 Common Patterns

### Standard Response Format
```json
{
  "success": true,
  "data": { /* Response data */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1",
    "pagination": { /* For paginated responses */ }
  }
}
```

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [/* Additional error details */],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Pagination
```json
{
  "data": [/* Results */],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## 🛠️ Development Tools

### Generate Documentation
```bash
# Generate all documentation
npm run docs:generate

# Watch for changes and regenerate
npm run docs:watch

# Serve documentation locally
npm run docs:serve

# Build optimized documentation
npm run docs:build
```

### Code Examples

#### JavaScript/Node.js
```javascript
const response = await fetch('https://api.mindhub.health/v1/expedix/patients', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'
  }
});

const data = await response.json();
console.log(data.data); // Array of patients
```

#### Python
```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'
}

response = requests.get(
    'https://api.mindhub.health/v1/expedix/patients',
    headers=headers
)

patients = response.json()['data']
print(patients)
```

#### cURL
```bash
curl -X GET \
  https://api.mindhub.health/v1/expedix/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-API-Version: v1"
```

## 📊 Rate Limits

### Role-Based Limits (per 15 minutes)
- **Admin**: 1000 requests
- **Psychiatrist**: 500 requests  
- **Psychologist**: 300 requests
- **Nurse**: 200 requests
- **Patient**: 100 requests

### Emergency Access
Emergency endpoints bypass rate limits with enhanced audit logging and post-incident review requirements.

## 🔄 API Versioning

### Current Versions
- **v1**: Current stable version (recommended)
- **v2**: Beta version with experimental features

### Version Support
- **Current version**: Full support and active development
- **Previous version**: Security updates and critical bug fixes for 12 months
- **Deprecated versions**: 6-month sunset period with migration support

## 📞 Support & Resources

### Documentation
- **API Explorer**: Interactive documentation with live examples
- **SDK Documentation**: Client libraries for popular languages
- **Integration Guides**: Step-by-step implementation guides
- **Compliance Documentation**: Healthcare-specific requirements

### Developer Support
- **API Status**: Real-time service status and incident reports
- **Developer Forum**: Community support and best practices
- **Technical Support**: Direct support for integration issues
- **Webhook Testing**: Tools for webhook development and testing

### Healthcare-Specific Resources
- **Compliance Checklist**: Ensure your integration meets healthcare standards
- **PHI Handling Guide**: Best practices for Protected Health Information
- **Audit Requirements**: Understanding logging and compliance requirements
- **Emergency Protocols**: Handling urgent patient data access scenarios

---

## 📄 License

This API documentation is provided under the MIT License. See [LICENSE](../LICENSE) for details.

## 🤝 Contributing

We welcome contributions to improve our documentation. Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

*Generated on: January 15, 2024*  
*Documentation Version: 1.0.0*  
*API Version: v1*