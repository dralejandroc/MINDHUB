/**
 * Centralized API Endpoint Configuration
 * All API endpoints and base URLs are defined here to ensure consistency
 */

// Base URLs
export const API_CONFIG = {
  // NEW: Django backend on Vercel
  FRONTEND_API_BASE: '/api', // Use local Next.js API routes
  
  // Backend direct URLs (for server-side calls) - Disabled due to schema issues, using Supabase fallback
  BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mindhub-django-backend-disabled.vercel.app',
  
  // Environment info
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development'
} as const;

// Frontend API Endpoints (relative paths that will be prefixed with base URL)
export const FRONTEND_ENDPOINTS = {
  // Expedix - Patient Management
  expedix: {
    patients: '/expedix/patients/',
    consultations: '/expedix/consultations/',
    patientTimeline: '/expedix/patient-timeline/'
  },
  
  // Clinimetrix - Clinical Assessments
  clinimetrix: {
    templates: '/clinimetrix-pro/templates',
    assessments: '/clinimetrix-pro/assessments',
    patientAssessments: '/clinimetrix/patient-assessments'
  },
  
  // Finance Module
  finance: {
    income: '/finance/income',
    cashRegister: '/finance/cash-register',
    stats: '/finance/stats'
  },
  
  // FrontDesk Module
  frontdesk: {
    tasks: {
      pending: '/frontdesk/tasks/pending/'
    },
    stats: {
      today: '/frontdesk/stats/today/'
    },
    appointments: {
      today: '/frontdesk/appointments/today/'
    }
  },
  
  // Resources Module
  resources: {
    base: '/resources',
    documents: '/resources/documents',
    library: '/resources/library'
  },
  
  // System Endpoints
  system: {
    health: '/health',
    feedback: '/feedback'
  }
} as const;

// Backend API Endpoints (paths for direct backend calls, will be prefixed with backend base URL)
export const BACKEND_ENDPOINTS = {
  // Expedix
  expedix: {
    patients: '/api/expedix/patients',
    consultations: '/api/expedix/consultations',
    patientTimeline: '/api/expedix/patient-timeline'
  },
  
  // Clinimetrix Pro
  clinimetrixPro: {
    templates: '/api/clinimetrix-pro/templates',
    assessments: '/api/clinimetrix-pro/assessments'
  },
  
  // Universal Clinimetrix (Legacy)
  clinimetrix: {
    patientAssessments: '/api/clinimetrix/patient-assessments'
  },
  
  // Finance
  finance: {
    income: '/api/finance/income',
    cashRegister: '/api/finance/cash-register'
  },
  
  // FrontDesk
  frontdesk: {
    tasks: '/api/frontdesk/tasks',
    stats: '/api/frontdesk/stats',
    appointments: '/api/frontdesk/appointments'
  },
  
  // Resources
  resources: {
    base: '/api/resources'
  }
} as const;

// Helper functions
export const buildBackendUrl = (endpoint: string): string => {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

export const buildFrontendUrl = (endpoint: string): string => {
  return endpoint; // Frontend endpoints are relative
};

// Validation helpers
export const validateEndpoint = (endpoint: string): boolean => {
  return endpoint.startsWith('/') || endpoint.startsWith('http');
};

// Export default configuration
export default {
  API_CONFIG,
  FRONTEND_ENDPOINTS,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  buildFrontendUrl,
  validateEndpoint
};