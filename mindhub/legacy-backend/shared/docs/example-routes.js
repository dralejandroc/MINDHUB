/**
 * Example Route Documentation with Swagger Annotations
 * 
 * This file demonstrates how to properly document API routes using
 * the swagger-annotations helper for healthcare-compliant documentation
 */

const express = require('express');
const { 
  createSwaggerDoc, 
  annotationSets, 
  healthcareCompliance, 
  commonParameters, 
  commonResponses 
} = require('./swagger-annotations');

const router = express.Router();

/**
 * GET /expedix/patients
 * List patients with healthcare compliance documentation
 */
router.get('/patients', async (req, res) => {
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'List patients'
    #swagger.description = 'Retrieve a paginated list of patients assigned to the authenticated healthcare professional'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.parameters['page'] = {
      in: 'query',
      description: 'Page number for pagination',
      required: false,
      type: 'integer',
      minimum: 1,
      default: 1
    }
    #swagger.parameters['limit'] = {
      in: 'query',
      description: 'Number of items per page',
      required: false,
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20
    }
    #swagger.parameters['search'] = {
      in: 'query',
      description: 'Search query for patient names',
      required: false,
      type: 'string',
      minLength: 2
    }
    #swagger.responses[200] = {
      description: 'Successful response with patient list',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Patient' }
              },
              meta: {
                type: 'object',
                properties: {
                  pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  timestamp: { type: 'string', format: 'date-time' },
                  requestId: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
    #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    #swagger.responses[429] = { $ref: '#/components/responses/RateLimited' }
    #swagger.responses[500] = { $ref: '#/components/responses/ServerError' }
    #swagger.extensions = {
      'x-healthcare-compliance': {
        dataClassification: 'PHI',
        auditRequired: true,
        complianceStandards: ['NOM-024-SSA3-2010'],
        accessControl: 'patient-specific',
        description: 'This endpoint accesses Protected Health Information (PHI) and requires proper authorization'
      },
      'x-code-samples': [
        {
          lang: 'javascript',
          source: `
const response = await fetch('/api/expedix/patients?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of patients
          `
        },
        {
          lang: 'python',
          source: `
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    '/api/expedix/patients',
    headers=headers,
    params={'page': 1, 'limit': 20}
)

patients = response.json()['data']
print(patients)
          `
        }
      ]
    }
  */
  
  try {
    // Implementation would go here
    const patients = []; // Fetch from database
    
    res.json({
      success: true,
      data: patients,
      meta: {
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 20,
          total: 0,
          pages: 0
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }
});

/**
 * POST /expedix/patients
 * Create new patient with comprehensive validation
 */
router.post('/patients', async (req, res) => {
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Create new patient'
    #swagger.description = 'Create a new patient record with required demographic information and healthcare compliance validation'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['firstName', 'lastName', 'dateOfBirth'],
            properties: {
              firstName: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                description: 'Patient first name',
                example: 'Juan'
              },
              lastName: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                description: 'Patient last name',
                example: 'Pérez'
              },
              dateOfBirth: {
                type: 'string',
                format: 'date',
                description: 'Date of birth in YYYY-MM-DD format',
                example: '1985-03-15'
              },
              gender: {
                type: 'string',
                enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                description: 'Patient gender',
                example: 'male'
              },
              contactInfo: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'juan.perez@email.com'
                  },
                  phone: {
                    type: 'string',
                    pattern: '^\\+52-\\d{2}-\\d{4}-\\d{4}$',
                    example: '+52-55-1234-5678'
                  }
                }
              }
            }
          },
          examples: {
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
                firstName: 'María',
                lastName: 'García',
                dateOfBirth: '1990-07-22',
                gender: 'female',
                contactInfo: {
                  email: 'maria.garcia@email.com',
                  phone: '+52-55-9876-5432'
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: 'Patient created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Patient created successfully' },
              data: { $ref: '#/components/schemas/Patient' },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  requestId: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[400] = { $ref: '#/components/responses/BadRequest' }
    #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
    #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    #swagger.responses[422] = {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Input validation failed' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string', example: 'firstName' },
                        message: { type: 'string', example: 'First name is required' },
                        code: { type: 'string', example: 'REQUIRED' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[500] = { $ref: '#/components/responses/ServerError' }
    #swagger.extensions = {
      'x-healthcare-compliance': {
        dataClassification: 'PHI',
        auditRequired: true,
        complianceStandards: ['NOM-024-SSA3-2010'],
        accessControl: 'healthcare-professional',
        description: 'Patient creation endpoint requires healthcare professional authorization and creates PHI records'
      },
      'x-rate-limits': {
        authenticated: '100 requests per 15 minutes',
        unauthenticated: 'Not allowed'
      }
    }
  */
  
  try {
    // Implementation would go here
    const newPatient = {}; // Create patient in database
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: newPatient,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    } else {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }
});

/**
 * GET /clinimetrix/assessments/{assessmentId}
 * Get clinical assessment by ID with comprehensive healthcare documentation
 */
router.get('/assessments/:assessmentId', async (req, res) => {
  /*
    #swagger.tags = ['Assessments']
    #swagger.summary = 'Get clinical assessment by ID'
    #swagger.description = 'Retrieve detailed information for a specific clinical assessment including scores, interpretation, and compliance data'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.parameters['assessmentId'] = {
      in: 'path',
      required: true,
      description: 'Unique assessment identifier',
      schema: {
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440020'
      }
    }
    #swagger.responses[200] = {
      description: 'Assessment details retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { $ref: '#/components/schemas/ClinicalAssessment' },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  requestId: { type: 'string' },
                  accessLog: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                      accessTime: { type: 'string', format: 'date-time' },
                      purpose: { type: 'string', example: 'clinical_review' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[401] = { $ref: '#/components/responses/Unauthorized' }
    #swagger.responses[403] = { $ref: '#/components/responses/Forbidden' }
    #swagger.responses[404] = { $ref: '#/components/responses/NotFound' }
    #swagger.responses[500] = { $ref: '#/components/responses/ServerError' }
    #swagger.extensions = {
      'x-healthcare-compliance': {
        dataClassification: 'Clinical',
        auditRequired: true,
        complianceStandards: ['NOM-024-SSA3-2010', 'COFEPRIS'],
        accessControl: 'clinical-staff',
        description: 'Clinical assessment data requires appropriate healthcare professional authorization'
      }
    }
  */
  
  try {
    const { assessmentId } = req.params;
    // Implementation would fetch assessment from database
    const assessment = {}; // Fetch from database
    
    if (!assessment) {
      return res.status(404).json({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'The requested assessment could not be found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
    
    res.json({
      success: true,
      data: assessment,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        accessLog: {
          userId: req.user.id,
          accessTime: new Date().toISOString(),
          purpose: 'clinical_review'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }
});

module.exports = router;