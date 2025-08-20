/**
 * Routing Rules Configuration for Integrix API Gateway
 * 
 * Defines routing patterns, middleware chains, and request handling
 * for each MindHub service hub
 */

const routingRules = {
  /**
   * Expedix Hub - Patient Management System
   */
  expedix: {
    name: 'expedix',
    displayName: 'Expedix Patient Management',
    domain: 'patient-management',
    baseUrl: '/api/expedix',
    description: 'Comprehensive patient management and medical records system',
    
    endpoints: [
      // Patient Management
      {
        pattern: '/api/expedix/patients',
        methods: ['GET', 'POST'],
        description: 'List and create patients',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/expedix/patients/{id}',
        methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
        description: 'Manage individual patient',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      
      // Medical History
      {
        pattern: '/api/expedix/patients/{patientId}/medical-history',
        methods: ['GET', 'POST'],
        description: 'Patient medical history',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/expedix/patients/{patientId}/medical-history/{recordId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Specific medical record',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Consultations
      {
        pattern: '/api/expedix/patients/{patientId}/consultations',
        methods: ['GET', 'POST'],
        description: 'Patient consultations',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Emergency Contacts
      {
        pattern: '/api/expedix/patients/{patientId}/emergency-contacts',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Emergency contact management',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      },
      
      // Search
      {
        pattern: '/api/expedix/search',
        methods: ['GET'],
        description: 'Search patients',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      }
    ],
    
    middleware: {
      pre: ['authentication', 'authorization', 'rate-limiting', 'data-validation'],
      post: ['response-formatting', 'audit-logging']
    },
    
    features: [
      'patient-demographics',
      'medical-history',
      'consultations',
      'emergency-contacts',
      'insurance-information',
      'appointment-scheduling'
    ]
  },
  
  /**
   * Clinimetrix Hub - Clinical Assessment System
   */
  clinimetrix: {
    name: 'clinimetrix',
    displayName: 'Clinimetrix Assessment Platform',
    domain: 'clinical-assessments',
    baseUrl: '/api/clinimetrix',
    description: 'Clinical assessments, psychometric scales, and scoring system',
    
    endpoints: [
      // Scales Management
      {
        pattern: '/api/clinimetrix/scales',
        methods: ['GET'],
        description: 'List available scales',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/clinimetrix/scales/{scaleId}',
        methods: ['GET'],
        description: 'Get scale details',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      
      // Assessment Sessions
      {
        pattern: '/api/clinimetrix/assessments',
        methods: ['GET', 'POST'],
        description: 'Assessment sessions',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/clinimetrix/assessments/{assessmentId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage assessment',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Assessment Administration
      {
        pattern: '/api/clinimetrix/assessments/{assessmentId}/start',
        methods: ['POST'],
        description: 'Start assessment',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 50 }
      },
      {
        pattern: '/api/clinimetrix/assessments/{assessmentId}/responses',
        methods: ['POST', 'PUT'],
        description: 'Submit responses',
        authentication: true,
        authorization: ['patient', 'psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/clinimetrix/assessments/{assessmentId}/complete',
        methods: ['POST'],
        description: 'Complete assessment',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 50 }
      },
      
      // Results and Analytics
      {
        pattern: '/api/clinimetrix/assessments/{assessmentId}/results',
        methods: ['GET'],
        description: 'Get assessment results',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/clinimetrix/patients/{patientId}/assessment-history',
        methods: ['GET'],
        description: 'Patient assessment history',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Clinical Workflows
      {
        pattern: '/api/clinimetrix/workflows',
        methods: ['GET', 'POST'],
        description: 'Clinical workflows',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      }
    ],
    
    middleware: {
      pre: ['authentication', 'authorization', 'rate-limiting', 'healthcare-compliance'],
      post: ['score-calculation', 'response-formatting', 'audit-logging']
    },
    
    features: [
      'psychometric-scales',
      'assessment-administration',
      'automatic-scoring',
      'clinical-interpretation',
      'progress-tracking',
      'report-generation'
    ]
  },
  
  /**
   * FormX Hub - Dynamic Form Builder
   */
  formx: {
    name: 'formx',
    displayName: 'FormX Dynamic Forms',
    domain: 'form-management',
    baseUrl: '/api/formx',
    description: 'Dynamic form builder, templates, and submission management',
    
    endpoints: [
      // Form Templates
      {
        pattern: '/api/formx/templates',
        methods: ['GET', 'POST'],
        description: 'Form templates',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/formx/templates/{templateId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage template',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Forms
      {
        pattern: '/api/formx/forms',
        methods: ['GET', 'POST'],
        description: 'Form instances',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/formx/forms/{formId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage form',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Submissions
      {
        pattern: '/api/formx/forms/{formId}/submissions',
        methods: ['GET', 'POST'],
        description: 'Form submissions',
        authentication: true,
        authorization: ['patient', 'nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/formx/forms/{formId}/submissions/{submissionId}',
        methods: ['GET', 'PUT'],
        description: 'Manage submission',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Form Analytics
      {
        pattern: '/api/formx/analytics',
        methods: ['GET'],
        description: 'Form analytics',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      },
      
      // Form Versioning
      {
        pattern: '/api/formx/templates/{templateId}/versions',
        methods: ['GET', 'POST'],
        description: 'Form versions',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      }
    ],
    
    middleware: {
      pre: ['authentication', 'authorization', 'rate-limiting', 'form-validation'],
      post: ['response-formatting', 'audit-logging']
    },
    
    features: [
      'dynamic-form-builder',
      'conditional-logic',
      'multi-page-forms',
      'file-uploads',
      'digital-signatures',
      'form-analytics'
    ]
  },
  
  /**
   * Resources Hub - Educational Content Management
   */
  resources: {
    name: 'resources',
    displayName: 'Resources Library',
    domain: 'content-management',
    baseUrl: '/api/resources',
    description: 'Educational content, treatment plans, and resource management',
    
    endpoints: [
      // Content Library
      {
        pattern: '/api/resources/content',
        methods: ['GET', 'POST'],
        description: 'Content library',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/resources/content/{contentId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage content',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Categories
      {
        pattern: '/api/resources/categories',
        methods: ['GET', 'POST'],
        description: 'Content categories',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Treatment Plans
      {
        pattern: '/api/resources/treatment-plans',
        methods: ['GET', 'POST'],
        description: 'Treatment plans',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/resources/treatment-plans/{planId}',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage treatment plan',
        authentication: true,
        authorization: ['psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // Patient Resources
      {
        pattern: '/api/resources/patients/{patientId}/assigned',
        methods: ['GET', 'POST', 'DELETE'],
        description: 'Patient assigned resources',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      },
      
      // File Management
      {
        pattern: '/api/resources/content/{contentId}/download',
        methods: ['GET'],
        description: 'Download content',
        authentication: true,
        authorization: ['patient', 'nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 50 }
      }
    ],
    
    middleware: {
      pre: ['authentication', 'authorization', 'rate-limiting'],
      post: ['response-formatting', 'audit-logging']
    },
    
    features: [
      'content-library',
      'treatment-plans',
      'educational-materials',
      'multimedia-support',
      'content-distribution',
      'usage-tracking'
    ]
  },
  
  /**
   * Universal Scales - Cross-hub scale system
   */
  'universal-scales': {
    name: 'universal-scales',
    displayName: 'Universal Scales System',
    domain: 'clinical-assessments',
    baseUrl: '/api',
    description: 'Unified scale system for all clinical assessments',
    
    endpoints: [
      {
        pattern: '/api/scales',
        methods: ['GET'],
        description: 'List all scales',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/scales/{scaleId}',
        methods: ['GET'],
        description: 'Get scale details',
        authentication: true,
        authorization: ['nurse', 'psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 200 }
      },
      {
        pattern: '/api/sessions',
        methods: ['POST'],
        description: 'Create assessment session',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/sessions/{sessionId}/administrations',
        methods: ['POST'],
        description: 'Start administration',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 100 }
      },
      {
        pattern: '/api/administrations/{administrationId}/responses',
        methods: ['POST'],
        description: 'Save responses',
        authentication: true,
        authorization: ['patient', 'psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 300 }
      },
      {
        pattern: '/api/administrations/{administrationId}/complete',
        methods: ['POST'],
        description: 'Complete administration',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist'],
        rateLimit: { window: '15m', max: 50 }
      },
      {
        pattern: '/api/patients/{patientId}/timeline',
        methods: ['GET'],
        description: 'Patient assessment timeline',
        authentication: true,
        authorization: ['psychologist', 'psychiatrist', 'admin'],
        rateLimit: { window: '15m', max: 100 }
      }
    ],
    
    middleware: {
      pre: ['authentication', 'authorization', 'rate-limiting'],
      post: ['response-formatting', 'audit-logging']
    },
    
    features: [
      'unified-scale-system',
      'session-management',
      'response-tracking',
      'automatic-scoring',
      'timeline-view'
    ]
  }
};

/**
 * Integrix Cross-Hub Operations
 */
const integrixRoutes = {
  name: 'integrix',
  displayName: 'Integrix Integration Hub',
  domain: 'integration',
  baseUrl: '/api/integrix',
  description: 'Cross-hub operations and data aggregation',
  
  endpoints: [
    // Patient Overview
    {
      pattern: '/api/integrix/patients/{patientId}/overview',
      methods: ['GET'],
      description: 'Complete patient overview across all hubs',
      authentication: true,
      authorization: ['psychologist', 'psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 50 },
      aggregates: ['expedix', 'clinimetrix', 'formx', 'resources']
    },
    
    // Patient Timeline
    {
      pattern: '/api/integrix/patients/{patientId}/timeline',
      methods: ['GET'],
      description: 'Patient activity timeline',
      authentication: true,
      authorization: ['psychologist', 'psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 100 },
      aggregates: ['expedix', 'clinimetrix', 'formx']
    },
    
    // Workflow Management
    {
      pattern: '/api/integrix/workflows',
      methods: ['GET', 'POST'],
      description: 'Cross-hub workflows',
      authentication: true,
      authorization: ['psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 50 }
    },
    {
      pattern: '/api/integrix/workflows/{workflowId}/trigger',
      methods: ['POST'],
      description: 'Trigger workflow',
      authentication: true,
      authorization: ['psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 20 }
    },
    
    // Analytics Dashboard
    {
      pattern: '/api/integrix/analytics/dashboard',
      methods: ['GET'],
      description: 'Integrated analytics dashboard',
      authentication: true,
      authorization: ['psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 50 },
      aggregates: ['expedix', 'clinimetrix', 'formx', 'resources']
    },
    
    // Data Synchronization
    {
      pattern: '/api/integrix/sync/patient-data',
      methods: ['POST'],
      description: 'Sync patient data across hubs',
      authentication: true,
      authorization: ['admin', 'system'],
      rateLimit: { window: '15m', max: 10 }
    },
    
    // Reports
    {
      pattern: '/api/integrix/reports/generate',
      methods: ['POST'],
      description: 'Generate integrated reports',
      authentication: true,
      authorization: ['psychiatrist', 'admin'],
      rateLimit: { window: '15m', max: 20 }
    }
  ],
  
  middleware: {
    pre: ['authentication', 'authorization', 'rate-limiting', 'request-correlation'],
    post: ['data-aggregation', 'response-formatting', 'audit-logging']
  },
  
  features: [
    'cross-hub-queries',
    'data-aggregation',
    'workflow-orchestration',
    'integrated-analytics',
    'report-generation'
  ]
};

// Export routing configuration
module.exports = {
  hubRoutes: routingRules,
  integrixRoutes,
  
  /**
   * Get routing rules for a specific hub
   * @param {string} hubName - Hub name
   * @returns {object} Routing rules
   */
  getHubRouting(hubName) {
    return routingRules[hubName] || null;
  },
  
  /**
   * Get all hub routing configurations
   * @returns {object} All routing rules
   */
  getAllRouting() {
    return {
      ...routingRules,
      integrix: integrixRoutes
    };
  },
  
  /**
   * Get endpoint configuration
   * @param {string} endpoint - Endpoint path
   * @returns {object} Endpoint configuration
   */
  getEndpointConfig(endpoint) {
    // Search through all hubs for matching endpoint
    for (const hub of Object.values(routingRules)) {
      for (const ep of hub.endpoints) {
        if (this.matchEndpoint(endpoint, ep.pattern)) {
          return {
            hub: hub.name,
            ...ep
          };
        }
      }
    }
    
    // Check integrix routes
    for (const ep of integrixRoutes.endpoints) {
      if (this.matchEndpoint(endpoint, ep.pattern)) {
        return {
          hub: 'integrix',
          ...ep
        };
      }
    }
    
    return null;
  },
  
  /**
   * Match endpoint against pattern
   * @param {string} endpoint - Request endpoint
   * @param {string} pattern - Endpoint pattern
   * @returns {boolean} Match result
   */
  matchEndpoint(endpoint, pattern) {
    const regexPattern = pattern.replace(/{[^}]+}/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }
};