/**
 * Centralized API Endpoint Configuration
 * All API endpoints and base URLs are defined here to ensure consistency
 */

// Base URLs
export const API_CONFIG = {
  // Frontend API routes (proxies to backend)
  FRONTEND_API_BASE: '/api',
  
  // Backend direct URLs (for server-side calls)
  BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mindhub-production.up.railway.app',
  
  // Environment info
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development'
} as const;

// Frontend API Endpoints (these call the Next.js API routes which proxy to backend)
export const FRONTEND_ENDPOINTS = {
  // Expedix - Patient Management
  expedix: {
    patients: '/api/expedix/patients',
    consultations: '/api/expedix/consultations',
    patientTimeline: '/api/expedix/patient-timeline'
  },
  
  // Clinimetrix - Clinical Assessments
  clinimetrix: {
    templates: '/api/clinimetrix-pro/templates',
    assessments: '/api/clinimetrix-pro/assessments',
    patientAssessments: '/api/clinimetrix/patient-assessments'
  },
  
  // Finance Module
  finance: {
    income: '/api/finance/income',
    cashRegister: '/api/finance/cash-register',
    stats: '/api/finance/stats'
  },
  
  // FrontDesk Module
  frontdesk: {
    tasks: {
      pending: '/api/frontdesk/tasks/pending'
    },
    stats: {
      today: '/api/frontdesk/stats/today'
    },
    appointments: {
      today: '/api/frontdesk/appointments/today'
    }
  },
  
  // Resources Module
  resources: {
    base: '/api/resources',
    documents: '/api/resources/documents',
    library: '/api/resources/library'
  },
  
  // System Endpoints
  system: {
    health: '/api/health',
    feedback: '/api/feedback'
  }
} as const;

// Backend API Endpoints (direct calls to Railway backend)
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
  return endpoint.startsWith('/api/') || endpoint.startsWith('http');
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