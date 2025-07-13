/**
 * Swagger Annotations Helper for MindHub Healthcare Platform
 * 
 * Utility for adding Swagger/OpenAPI annotations to route handlers
 * with healthcare-specific documentation patterns
 */

/**
 * Create Swagger annotation for healthcare endpoints
 */
function createSwaggerDoc(config) {
  const {
    summary,
    description,
    tags = [],
    security = [{ BearerAuth: [] }],
    parameters = [],
    requestBody,
    responses,
    healthcareCompliance = {},
    examples = {}
  } = config;

  return {
    '#swagger.tags': tags,
    '#swagger.summary': summary,
    '#swagger.description': description,
    '#swagger.security': security,
    '#swagger.parameters': parameters,
    '#swagger.requestBody': requestBody,
    '#swagger.responses': responses,
    '#swagger.extensions': {
      'x-healthcare-compliance': healthcareCompliance,
      'x-examples': examples
    }
  };
}

/**
 * Standard healthcare compliance annotations
 */
const healthcareCompliance = {
  PHI_ACCESS: {
    dataClassification: 'PHI',
    auditRequired: true,
    complianceStandards: ['NOM-024-SSA3-2010'],
    accessControl: 'patient-specific',
    description: 'This endpoint accesses Protected Health Information (PHI) and requires proper authorization'
  },
  
  CLINICAL_DATA: {
    dataClassification: 'Clinical',
    auditRequired: true,
    complianceStandards: ['NOM-024-SSA3-2010', 'COFEPRIS'],
    accessControl: 'role-based',
    description: 'Clinical data endpoint requiring healthcare professional authorization'
  },
  
  ADMINISTRATIVE: {
    dataClassification: 'Administrative',
    auditRequired: false,
    complianceStandards: [],
    accessControl: 'role-based',
    description: 'Administrative endpoint with standard access controls'
  },
  
  EMERGENCY_ACCESS: {
    dataClassification: 'PHI',
    auditRequired: true,
    complianceStandards: ['NOM-024-SSA3-2010'],
    accessControl: 'emergency-override',
    description: 'Emergency access endpoint with enhanced logging and post-incident review'
  }
};

/**
 * Common parameter definitions
 */
const commonParameters = {
  patientId: {
    name: 'patientId',
    in: 'path',
    required: true,
    description: 'Unique patient identifier',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000'
    },
    'x-healthcare-phi': true
  },
  
  assessmentId: {
    name: 'assessmentId',
    in: 'path',
    required: true,
    description: 'Unique assessment identifier',
    schema: {
      type: 'string',
      format: 'uuid'
    }
  },
  
  formId: {
    name: 'formId',
    in: 'path',
    required: true,
    description: 'Unique form identifier',
    schema: {
      type: 'string',
      format: 'uuid'
    }
  },
  
  page: {
    name: 'page',
    in: 'query',
    required: false,
    description: 'Page number for pagination',
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1,
      example: 1
    }
  },
  
  limit: {
    name: 'limit',
    in: 'query',
    required: false,
    description: 'Number of items per page',
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      example: 20
    }
  },
  
  search: {
    name: 'search',
    in: 'query',
    required: false,
    description: 'Search query string',
    schema: {
      type: 'string',
      minLength: 2,
      example: 'García'
    }
  }
};

/**
 * Common response definitions
 */
const commonResponses = {
  success: {
    200: {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  requestId: { type: 'string' },
                  version: { type: 'string', example: 'v1' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  created: {
    201: {
      description: 'Resource created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Resource created successfully' },
              data: { type: 'object' }
            }
          }
        }
      }
    }
  },
  
  badRequest: {
    400: {
      description: 'Bad request - Invalid input data',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Invalid input data' },
                  details: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  },
  
  unauthorized: {
    401: {
      description: 'Unauthorized - Authentication required',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'UNAUTHORIZED' },
                  message: { type: 'string', example: 'Authentication required' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  forbidden: {
    403: {
      description: 'Forbidden - Insufficient permissions',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'FORBIDDEN' },
                  message: { type: 'string', example: 'Insufficient permissions to access this resource' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  notFound: {
    404: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'NOT_FOUND' },
                  message: { type: 'string', example: 'Resource not found' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  rateLimited: {
    429: {
      description: 'Too many requests - Rate limit exceeded',
      headers: {
        'Retry-After': {
          description: 'Number of seconds to wait before retrying',
          schema: { type: 'integer' }
        },
        'X-RateLimit-Limit': {
          description: 'The rate limit ceiling for this endpoint',
          schema: { type: 'integer' }
        },
        'X-RateLimit-Remaining': {
          description: 'The number of requests left for the time window',
          schema: { type: 'integer' }
        }
      },
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
                  message: { type: 'string', example: 'Rate limit exceeded, please try again later' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  serverError: {
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
                  message: { type: 'string', example: 'An unexpected error occurred' }
                }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Healthcare-specific examples
 */
const healthcareExamples = {
  patient: {
    basic: {
      summary: 'Basic patient information',
      value: {
        firstName: 'Juan',
        lastName: 'Pérez',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        contactInfo: {
          email: 'juan.perez@email.com',
          phone: '+52-55-1234-5678'
        }
      }
    },
    
    complete: {
      summary: 'Complete patient record',
      value: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        medicalRecordNumber: 'MRN-2024-001',
        firstName: 'María',
        lastName: 'García',
        dateOfBirth: '1990-07-22',
        gender: 'female',
        contactInfo: {
          email: 'maria.garcia@email.com',
          phone: '+52-55-9876-5432',
          address: {
            street: 'Av. Insurgentes 123',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '06700',
            country: 'Mexico'
          }
        },
        emergencyContact: {
          name: 'Carlos García',
          relationship: 'spouse',
          phone: '+52-55-1111-2222'
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T15:45:00Z'
      }
    }
  },
  
  assessment: {
    basic: {
      summary: 'Clinical assessment response',
      value: {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        scaleId: '550e8400-e29b-41d4-a716-446655440010',
        administrationType: 'hetero_administered',
        responses: [
          { itemId: 'item-1', value: '2' },
          { itemId: 'item-2', value: '1' },
          { itemId: 'item-3', value: '3' }
        ],
        notes: 'Patient cooperative during assessment'
      }
    },
    
    completed: {
      summary: 'Completed assessment with interpretation',
      value: {
        id: '550e8400-e29b-41d4-a716-446655440020',
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        scaleId: '550e8400-e29b-41d4-a716-446655440010',
        scale: {
          name: 'Beck Depression Inventory',
          abbreviation: 'BDI-II'
        },
        totalScore: 15,
        interpretation: {
          level: 'mild',
          description: 'Mild depression symptoms',
          recommendations: ['Consider counseling', 'Monitor progress']
        },
        administrationDate: '2024-01-15T14:30:00Z',
        status: 'completed'
      }
    }
  },
  
  form: {
    simple: {
      summary: 'Simple form structure',
      value: {
        title: 'Patient Intake Form',
        description: 'Initial patient information collection',
        category: 'intake',
        fields: [
          {
            type: 'text',
            label: 'Full Name',
            required: true,
            order: 1
          },
          {
            type: 'email',
            label: 'Email Address',
            required: true,
            order: 2
          }
        ]
      }
    }
  }
};

/**
 * Predefined annotation sets for common endpoints
 */
const annotationSets = {
  /**
   * Patient list endpoint
   */
  getPatients: createSwaggerDoc({
    summary: 'List patients',
    description: 'Retrieve a paginated list of patients assigned to the authenticated healthcare professional',
    tags: ['Patients'],
    parameters: [
      commonParameters.page,
      commonParameters.limit,
      commonParameters.search
    ],
    responses: {
      ...commonResponses.success,
      ...commonResponses.unauthorized,
      ...commonResponses.forbidden,
      ...commonResponses.rateLimited,
      ...commonResponses.serverError
    },
    healthcareCompliance: healthcareCompliance.PHI_ACCESS,
    examples: {
      response: healthcareExamples.patient.complete
    }
  }),

  /**
   * Create patient endpoint
   */
  createPatient: createSwaggerDoc({
    summary: 'Create new patient',
    description: 'Create a new patient record with required demographic information',
    tags: ['Patients'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['firstName', 'lastName', 'dateOfBirth'],
            properties: {
              firstName: { type: 'string', minLength: 1, maxLength: 100 },
              lastName: { type: 'string', minLength: 1, maxLength: 100 },
              dateOfBirth: { type: 'string', format: 'date' },
              gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
            }
          },
          examples: {
            basic: healthcareExamples.patient.basic
          }
        }
      }
    },
    responses: {
      ...commonResponses.created,
      ...commonResponses.badRequest,
      ...commonResponses.unauthorized,
      ...commonResponses.forbidden,
      ...commonResponses.serverError
    },
    healthcareCompliance: healthcareCompliance.PHI_ACCESS
  }),

  /**
   * Get patient by ID
   */
  getPatientById: createSwaggerDoc({
    summary: 'Get patient by ID',
    description: 'Retrieve detailed information for a specific patient',
    tags: ['Patients'],
    parameters: [commonParameters.patientId],
    responses: {
      ...commonResponses.success,
      ...commonResponses.unauthorized,
      ...commonResponses.forbidden,
      ...commonResponses.notFound,
      ...commonResponses.serverError
    },
    healthcareCompliance: healthcareCompliance.PHI_ACCESS
  }),

  /**
   * Assessment list endpoint
   */
  getAssessments: createSwaggerDoc({
    summary: 'List clinical assessments',
    description: 'Retrieve a paginated list of clinical assessments',
    tags: ['Assessments'],
    parameters: [
      commonParameters.page,
      commonParameters.limit,
      {
        name: 'patientId',
        in: 'query',
        required: false,
        description: 'Filter by patient ID',
        schema: { type: 'string', format: 'uuid' }
      },
      {
        name: 'scaleType',
        in: 'query',
        required: false,
        description: 'Filter by assessment scale type',
        schema: {
          type: 'string',
          enum: ['depression', 'anxiety', 'cognitive', 'personality']
        }
      }
    ],
    responses: {
      ...commonResponses.success,
      ...commonResponses.unauthorized,
      ...commonResponses.forbidden,
      ...commonResponses.serverError
    },
    healthcareCompliance: healthcareCompliance.CLINICAL_DATA
  }),

  /**
   * Create assessment endpoint
   */
  createAssessment: createSwaggerDoc({
    summary: 'Create clinical assessment',
    description: 'Create a new clinical assessment for a patient',
    tags: ['Assessments'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['patientId', 'scaleId', 'responses'],
            properties: {
              patientId: { type: 'string', format: 'uuid' },
              scaleId: { type: 'string', format: 'uuid' },
              administrationType: {
                type: 'string',
                enum: ['self_administered', 'hetero_administered', 'remote_tokenized']
              },
              responses: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['itemId', 'value'],
                  properties: {
                    itemId: { type: 'string', format: 'uuid' },
                    value: { type: 'string' },
                    text: { type: 'string' }
                  }
                }
              },
              notes: { type: 'string', maxLength: 1000 }
            }
          },
          examples: {
            basic: healthcareExamples.assessment.basic
          }
        }
      }
    },
    responses: {
      ...commonResponses.created,
      ...commonResponses.badRequest,
      ...commonResponses.unauthorized,
      ...commonResponses.forbidden,
      ...commonResponses.serverError
    },
    healthcareCompliance: healthcareCompliance.CLINICAL_DATA
  })
};

module.exports = {
  createSwaggerDoc,
  healthcareCompliance,
  commonParameters,
  commonResponses,
  healthcareExamples,
  annotationSets
};