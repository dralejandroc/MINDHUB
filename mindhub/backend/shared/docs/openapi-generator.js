/**
 * OpenAPI Specification Generator for MindHub Healthcare Platform
 * 
 * Automated OpenAPI documentation generation with healthcare-specific
 * schemas, security definitions, and compliance annotations
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class OpenAPIGenerator {
  constructor() {
    this.version = '3.0.3';
    this.apiVersion = process.env.API_VERSION || 'v1';
    
    // Base OpenAPI specification template
    this.baseSpec = {
      openapi: this.version,
      info: {
        title: 'MindHub Healthcare Platform API',
        description: 'Comprehensive healthcare API for digital mental health services with clinical assessments, patient management, and telemedicine integration',
        version: this.apiVersion,
        contact: {
          name: 'MindHub API Support',
          email: 'api-support@mindhub.health',
          url: 'https://docs.mindhub.health'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        },
        termsOfService: 'https://mindhub.health/terms',
        'x-logo': {
          url: 'https://mindhub.health/logo.png',
          altText: 'MindHub Healthcare Platform'
        }
      },
      servers: [
        {
          url: 'https://api.mindhub.health/v1',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.mindhub.health/v1',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server'
        }
      ],
      security: [
        {
          BearerAuth: []
        }
      ],
      tags: [],
      paths: {},
      components: {
        securitySchemes: {},
        schemas: {},
        responses: {},
        parameters: {},
        examples: {},
        requestBodies: {},
        headers: {}
      },
      'x-healthcare-compliance': {
        standards: ['NOM-024-SSA3-2010', 'COFEPRIS'],
        dataClassification: ['PHI', 'Medical', 'Administrative'],
        auditRequirements: 'All patient data access must be logged'
      }
    };

    this.setupSecuritySchemes();
    this.setupCommonSchemas();
    this.setupTags();
  }

  /**
   * Setup security schemes
   */
  setupSecuritySchemes() {
    this.baseSpec.components.securitySchemes = {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication'
      },
      OAuth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth.mindhub.health/oauth/authorize',
            tokenUrl: 'https://auth.mindhub.health/oauth/token',
            scopes: {
              'read:patients': 'Read patient data',
              'write:patients': 'Create and update patient data',
              'read:assessments': 'Read clinical assessments',
              'write:assessments': 'Create and update assessments',
              'read:forms': 'Read forms and submissions',
              'write:forms': 'Create and update forms',
              'read:resources': 'Read educational resources',
              'admin:all': 'Full administrative access'
            }
          }
        }
      }
    };
  }

  /**
   * Setup common schemas
   */
  setupCommonSchemas() {
    this.baseSpec.components.schemas = {
      // Common response schemas
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful'
          },
          message: {
            type: 'string',
            description: 'Human-readable message'
          },
          data: {
            description: 'Response data',
            oneOf: [
              { type: 'object' },
              { type: 'array' },
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' }
            ]
          },
          meta: {
            $ref: '#/components/schemas/ResponseMetadata'
          }
        },
        required: ['success']
      },

      ResponseMetadata: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier'
          },
          version: {
            type: 'string',
            description: 'API version'
          },
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
          }
        }
      },

      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Current page number'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Items per page'
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of items'
          },
          pages: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of pages'
          }
        }
      },

      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code'
              },
              message: {
                type: 'string',
                description: 'Error message'
              },
              details: {
                description: 'Additional error details'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              },
              requestId: {
                type: 'string'
              }
            },
            required: ['code', 'message']
          }
        },
        required: ['error']
      },

      // Patient schemas
      Patient: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique patient identifier'
          },
          medicalRecordNumber: {
            type: 'string',
            description: 'Medical record number',
            'x-healthcare-phi': true
          },
          firstName: {
            type: 'string',
            description: 'Patient first name',
            'x-healthcare-phi': true
          },
          lastName: {
            type: 'string',
            description: 'Patient last name',
            'x-healthcare-phi': true
          },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: 'Date of birth',
            'x-healthcare-phi': true
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other', 'prefer_not_to_say'],
            description: 'Patient gender'
          },
          contactInfo: {
            $ref: '#/components/schemas/ContactInfo'
          },
          emergencyContact: {
            $ref: '#/components/schemas/EmergencyContact'
          },
          demographics: {
            $ref: '#/components/schemas/Demographics'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'medicalRecordNumber', 'firstName', 'lastName', 'dateOfBirth'],
        'x-healthcare-entity': 'Patient',
        'x-compliance-requirements': ['NOM-024-SSA3-2010']
      },

      ContactInfo: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            'x-healthcare-phi': true
          },
          phone: {
            type: 'string',
            'x-healthcare-phi': true
          },
          address: {
            $ref: '#/components/schemas/Address'
          }
        }
      },

      Address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
            'x-healthcare-phi': true
          },
          city: {
            type: 'string'
          },
          state: {
            type: 'string'
          },
          zipCode: {
            type: 'string'
          },
          country: {
            type: 'string',
            default: 'Mexico'
          }
        }
      },

      // Assessment schemas
      ClinicalAssessment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          patientId: {
            type: 'string',
            format: 'uuid',
            'x-healthcare-phi': true
          },
          scaleId: {
            type: 'string',
            format: 'uuid'
          },
          scale: {
            $ref: '#/components/schemas/AssessmentScale'
          },
          administrationType: {
            type: 'string',
            enum: ['self_administered', 'hetero_administered', 'remote_tokenized']
          },
          administrationDate: {
            type: 'string',
            format: 'date-time'
          },
          totalScore: {
            type: 'integer',
            description: 'Total assessment score'
          },
          interpretation: {
            $ref: '#/components/schemas/AssessmentInterpretation'
          },
          responses: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AssessmentResponse'
            }
          },
          notes: {
            type: 'string',
            description: 'Clinical notes'
          },
          status: {
            type: 'string',
            enum: ['draft', 'in_progress', 'completed', 'reviewed']
          }
        },
        'x-healthcare-entity': 'ClinicalAssessment',
        'x-compliance-requirements': ['NOM-024-SSA3-2010']
      },

      // Form schemas
      Form: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          title: {
            type: 'string',
            maxLength: 200
          },
          description: {
            type: 'string',
            maxLength: 1000
          },
          category: {
            type: 'string',
            enum: ['intake', 'pre_consultation', 'post_consultation', 'satisfaction', 'follow_up', 'screening', 'assessment']
          },
          fields: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/FormField'
            }
          },
          settings: {
            $ref: '#/components/schemas/FormSettings'
          },
          isActive: {
            type: 'boolean',
            default: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['title', 'category', 'fields']
      },

      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          name: {
            type: 'string'
          },
          role: {
            type: 'string',
            enum: ['admin', 'psychiatrist', 'psychologist', 'nurse', 'patient']
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          organizationId: {
            type: 'string',
            format: 'uuid'
          },
          isActive: {
            type: 'boolean'
          },
          lastLogin: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'email', 'name', 'role']
      }
    };
  }

  /**
   * Setup API tags
   */
  setupTags() {
    this.baseSpec.tags = [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
        'x-displayName': 'Authentication'
      },
      {
        name: 'Patients',
        description: 'Patient management endpoints (Expedix Hub)',
        'x-displayName': 'Patient Management',
        'x-healthcare-compliance': 'PHI-sensitive endpoints'
      },
      {
        name: 'Assessments',
        description: 'Clinical assessments and psychological scales (Clinimetrix Hub)',
        'x-displayName': 'Clinical Assessments'
      },
      {
        name: 'Forms',
        description: 'Dynamic forms and submissions (Formx Hub)',
        'x-displayName': 'Forms Management'
      },
      {
        name: 'Resources',
        description: 'Educational resources and content library',
        'x-displayName': 'Educational Resources'
      },
      {
        name: 'Analytics',
        description: 'Reports and analytics endpoints',
        'x-displayName': 'Analytics & Reports'
      },
      {
        name: 'Administration',
        description: 'System administration endpoints',
        'x-displayName': 'Administration'
      }
    ];
  }

  /**
   * Generate OpenAPI specification for a service
   */
  async generateServiceSpec(serviceName, routes) {
    const spec = JSON.parse(JSON.stringify(this.baseSpec));
    
    // Update spec for specific service
    spec.info.title = `MindHub ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} API`;
    spec.info.description = this.getServiceDescription(serviceName);

    // Add service-specific paths
    for (const route of routes) {
      await this.addRouteToSpec(spec, route, serviceName);
    }

    return spec;
  }

  /**
   * Get service description
   */
  getServiceDescription(serviceName) {
    const descriptions = {
      expedix: 'Patient management and medical records system with comprehensive healthcare data management',
      clinimetrix: 'Clinical assessments and psychological evaluations with standardized scales and scoring',
      formx: 'Dynamic forms builder and submission management for healthcare workflows',
      resources: 'Educational content and resource library for patient education and professional training',
      integrix: 'Integration hub for cross-service communication and data synchronization'
    };

    return descriptions[serviceName] || 'Healthcare platform service';
  }

  /**
   * Add route to OpenAPI specification
   */
  async addRouteToSpec(spec, route, serviceName) {
    const { path, method, summary, description, tags, security, parameters, requestBody, responses } = route;

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    spec.paths[path][method.toLowerCase()] = {
      summary: summary || `${method} ${path}`,
      description: description || `${method} operation for ${path}`,
      tags: tags || [this.getDefaultTag(serviceName)],
      security: security || [{ BearerAuth: [] }],
      parameters: parameters || [],
      requestBody: requestBody,
      responses: responses || this.getDefaultResponses(),
      'x-code-samples': this.generateCodeSamples(method, path, requestBody),
      'x-healthcare-compliance': this.getComplianceInfo(path, method)
    };
  }

  /**
   * Get default tag for service
   */
  getDefaultTag(serviceName) {
    const tagMap = {
      expedix: 'Patients',
      clinimetrix: 'Assessments',
      formx: 'Forms',
      resources: 'Resources',
      integrix: 'Integration'
    };

    return tagMap[serviceName] || 'General';
  }

  /**
   * Get default responses
   */
  getDefaultResponses() {
    return {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        },
        headers: {
          'X-Request-ID': {
            description: 'Unique request identifier',
            schema: {
              type: 'string'
            }
          },
          'X-API-Version': {
            description: 'API version used',
            schema: {
              type: 'string'
            }
          }
        }
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      '403': {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      '404': {
        description: 'Not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      '429': {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        },
        headers: {
          'Retry-After': {
            description: 'Number of seconds to wait before retrying',
            schema: {
              type: 'integer'
            }
          }
        }
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      }
    };
  }

  /**
   * Generate code samples for different languages
   */
  generateCodeSamples(method, path, requestBody) {
    const samples = [];

    // JavaScript/Node.js example
    samples.push({
      lang: 'javascript',
      source: this.generateJavaScriptSample(method, path, requestBody)
    });

    // Python example
    samples.push({
      lang: 'python',
      source: this.generatePythonSample(method, path, requestBody)
    });

    // cURL example
    samples.push({
      lang: 'shell',
      source: this.generateCurlSample(method, path, requestBody)
    });

    return samples;
  }

  /**
   * Generate JavaScript code sample
   */
  generateJavaScriptSample(method, path, requestBody) {
    const hasBody = requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
    
    let sample = `const response = await fetch('https://api.mindhub.health/v1${path}', {
  method: '${method.toUpperCase()}',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'
  }`;

    if (hasBody) {
      sample += `,
  body: JSON.stringify({
    // Request body data
  })`;
    }

    sample += `
});

const data = await response.json();
console.log(data);`;

    return sample;
  }

  /**
   * Generate Python code sample
   */
  generatePythonSample(method, path, requestBody) {
    const hasBody = requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
    
    let sample = `import requests

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'
}`;

    if (hasBody) {
      sample += `

data = {
    # Request body data
}

response = requests.${method.toLowerCase()}(
    'https://api.mindhub.health/v1${path}',
    headers=headers,
    json=data
)`;
    } else {
      sample += `

response = requests.${method.toLowerCase()}(
    'https://api.mindhub.health/v1${path}',
    headers=headers
)`;
    }

    sample += `

print(response.json())`;

    return sample;
  }

  /**
   * Generate cURL code sample
   */
  generateCurlSample(method, path, requestBody) {
    const hasBody = requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
    
    let sample = `curl -X ${method.toUpperCase()} \\
  https://api.mindhub.health/v1${path} \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Version: v1"`;

    if (hasBody) {
      sample += ` \\
  -d '{
    "key": "value"
  }'`;
    }

    return sample;
  }

  /**
   * Get compliance information for endpoint
   */
  getComplianceInfo(path, method) {
    const info = {
      dataClassification: 'General',
      auditRequired: false,
      phiAccess: false
    };

    // Check if path involves patient data
    if (path.includes('/patients') || path.includes('/assessments')) {
      info.dataClassification = 'PHI';
      info.auditRequired = true;
      info.phiAccess = true;
    }

    // Check if it's a write operation
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      info.auditRequired = true;
    }

    return info;
  }

  /**
   * Generate complete OpenAPI specification
   */
  async generateCompleteSpec() {
    const spec = JSON.parse(JSON.stringify(this.baseSpec));
    
    // Add all service endpoints
    const services = ['expedix', 'clinimetrix', 'formx', 'resources', 'integrix'];
    
    for (const service of services) {
      const routes = await this.getServiceRoutes(service);
      for (const route of routes) {
        await this.addRouteToSpec(spec, route, service);
      }
    }

    return spec;
  }

  /**
   * Get routes for a service (placeholder - would be populated from actual routes)
   */
  async getServiceRoutes(serviceName) {
    // This would typically scan actual route files
    // For now, return sample routes
    const sampleRoutes = {
      expedix: [
        {
          path: '/expedix/patients',
          method: 'GET',
          summary: 'List patients',
          description: 'Retrieve a paginated list of patients',
          tags: ['Patients'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            }
          ],
          responses: {
            '200': {
              description: 'List of patients',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Patient' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          path: '/expedix/patients',
          method: 'POST',
          summary: 'Create patient',
          description: 'Create a new patient record',
          tags: ['Patients'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['male', 'female', 'other'] }
                  },
                  required: ['firstName', 'lastName', 'dateOfBirth']
                }
              }
            }
          }
        }
      ],
      clinimetrix: [
        {
          path: '/clinimetrix/assessments',
          method: 'GET',
          summary: 'List assessments',
          tags: ['Assessments']
        },
        {
          path: '/clinimetrix/assessments',
          method: 'POST',
          summary: 'Create assessment',
          tags: ['Assessments']
        }
      ],
      formx: [
        {
          path: '/formx/forms',
          method: 'GET',
          summary: 'List forms',
          tags: ['Forms']
        },
        {
          path: '/formx/forms',
          method: 'POST',
          summary: 'Create form',
          tags: ['Forms']
        }
      ],
      resources: [
        {
          path: '/resources/content',
          method: 'GET',
          summary: 'List resources',
          tags: ['Resources']
        }
      ],
      integrix: [
        {
          path: '/integrix/health',
          method: 'GET',
          summary: 'Health check',
          tags: ['Administration']
        }
      ]
    };

    return sampleRoutes[serviceName] || [];
  }

  /**
   * Save specification to file
   */
  async saveSpec(spec, filePath, format = 'json') {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    let content;
    if (format === 'yaml') {
      content = yaml.dump(spec, { indent: 2, lineWidth: 120 });
    } else {
      content = JSON.stringify(spec, null, 2);
    }

    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * Generate all specifications
   */
  async generateAllSpecs(outputDir = './docs/api') {
    const results = [];

    // Generate complete specification
    const completeSpec = await this.generateCompleteSpec();
    
    // Save in multiple formats
    results.push(await this.saveSpec(completeSpec, path.join(outputDir, 'openapi.json'), 'json'));
    results.push(await this.saveSpec(completeSpec, path.join(outputDir, 'openapi.yaml'), 'yaml'));

    // Generate service-specific specs
    const services = ['expedix', 'clinimetrix', 'formx', 'resources', 'integrix'];
    
    for (const service of services) {
      const routes = await this.getServiceRoutes(service);
      const serviceSpec = await this.generateServiceSpec(service, routes);
      
      results.push(await this.saveSpec(serviceSpec, path.join(outputDir, `${service}-api.json`), 'json'));
      results.push(await this.saveSpec(serviceSpec, path.join(outputDir, `${service}-api.yaml`), 'yaml'));
    }

    return results;
  }
}

module.exports = OpenAPIGenerator;