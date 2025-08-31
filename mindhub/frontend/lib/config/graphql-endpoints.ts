/**
 * GraphQL Configuration for MindHub
 * Pure GraphQL implementation - No REST API dependencies
 */

// GraphQL Configuration
export const GRAPHQL_CONFIG = {
  // Supabase GraphQL endpoint
  ENDPOINT: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
  
  // Headers configuration
  HEADERS: {
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Environment info
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development'
} as const;

// GraphQL Operations by Module
export const GRAPHQL_OPERATIONS = {
  // Expedix - Patient Management
  expedix: {
    queries: ['GET_PATIENTS', 'GET_PATIENT_BY_ID', 'GET_PATIENT_CONSULTATIONS'],
    mutations: ['CREATE_PATIENT', 'UPDATE_PATIENT', 'CREATE_CONSULTATION']
  },
  
  // Agenda - Appointments
  agenda: {
    queries: ['GET_APPOINTMENTS', 'GET_TODAY_APPOINTMENTS', 'GET_APPOINTMENT_BY_ID'],
    mutations: ['CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'CANCEL_APPOINTMENT']
  },
  
  // ClinimetrixPro - Assessments
  clinimetrix: {
    queries: ['GET_PSYCHOMETRIC_SCALES', 'GET_ASSESSMENTS', 'GET_ASSESSMENT_RESPONSES'],
    mutations: ['CREATE_ASSESSMENT', 'START_ASSESSMENT', 'COMPLETE_ASSESSMENT']
  },
  
  // FormX - Dynamic Forms
  formx: {
    queries: ['GET_FORM_TEMPLATES', 'GET_FORM_SUBMISSIONS', 'GET_FORM_STATISTICS'],
    mutations: ['CREATE_FORM_TEMPLATE', 'SUBMIT_FORM', 'UPDATE_FORM_TEMPLATE']
  },
  
  // Finance - Financial Management
  finance: {
    queries: ['GET_FINANCE_SERVICES', 'GET_FINANCE_INCOME', 'GET_FINANCE_STATISTICS'],
    mutations: ['CREATE_FINANCE_SERVICE', 'RECORD_INCOME', 'UPDATE_SERVICE_PRICE']
  },
  
  // Resources - Medical Resources & Storage
  resources: {
    queries: ['GET_MEDICAL_RESOURCES', 'GET_RESOURCE_CATEGORIES', 'GET_STORAGE_USAGE'],
    mutations: ['UPLOAD_RESOURCE', 'UPDATE_RESOURCE', 'DELETE_RESOURCE']
  }
} as const;

// Types for Apollo Cache merge functions
interface CacheCollectionEdge {
  edges: Array<{ node: any; cursor?: string }>;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

// Cache Configuration for Apollo Client
export const CACHE_CONFIG = {
  typePolicies: {
    Query: {
      fields: {
        // Patient pagination
        patientsCollection: {
          keyArgs: ['filter'],
          merge(existing: CacheCollectionEdge = { edges: [] }, incoming: CacheCollectionEdge) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            }
          },
        },
        // Appointments pagination
        appointmentsCollection: {
          keyArgs: ['filter'],
          merge(existing: CacheCollectionEdge = { edges: [] }, incoming: CacheCollectionEdge) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            }
          },
        },
        // Assessments pagination
        assessmentsCollection: {
          keyArgs: ['filter'],
          merge(existing: CacheCollectionEdge = { edges: [] }, incoming: CacheCollectionEdge) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            }
          },
        },
        // Form submissions pagination
        form_submissionsCollection: {
          keyArgs: ['filter'],
          merge(existing: CacheCollectionEdge = { edges: [] }, incoming: CacheCollectionEdge) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            }
          },
        }
      }
    }
  }
} as const;

// GraphQL Error Handling Configuration
export const ERROR_CONFIG = {
  // Apollo Client error policies
  errorPolicy: 'all' as const,
  
  // Network error handling
  networkRetry: {
    maxRetries: 3,
    retryDelayMs: 1000
  },
  
  // GraphQL specific error codes
  errorCodes: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN', 
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RLS_POLICY_VIOLATION: 'RLS_POLICY_VIOLATION'
  }
} as const;

// Export default GraphQL configuration
export default {
  GRAPHQL_CONFIG,
  GRAPHQL_OPERATIONS,
  CACHE_CONFIG,
  ERROR_CONFIG
};