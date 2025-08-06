/**
 * Auth0 Configuration with Dynamic Subdomain Support
 * Handles different subdomain configurations for MindHub hubs
 */

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
  scope: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
}

export interface SubdomainConfig {
  subdomain: string;
  hubName: string;
  apiUrl: string;
  description: string;
  permissions: string[];
}

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Domain configuration
const domain = process.env.NEXT_PUBLIC_DOMAIN || 'mindhub.cloud';
const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Subdomain configuration mapping
export const SUBDOMAIN_CONFIG: Record<string, SubdomainConfig> = {
  'app': {
    subdomain: 'app',
    hubName: 'MindHub Dashboard',
    apiUrl: isDevelopment ? 'http://localhost:8080' : `https://${domain}/api`,
    description: 'Main dashboard and hub management',
    permissions: ['read:profile', 'write:profile']
  },
  'clinimetrix': {
    subdomain: 'clinimetrix', 
    hubName: 'Clinimetrix',
    apiUrl: isDevelopment ? 'http://localhost:8081' : `https://${domain}/api`,
    description: 'Clinical Assessment System',
    permissions: ['read:assessments', 'write:assessments', 'read:patients']
  },
  'expedix': {
    subdomain: 'expedix',
    hubName: 'Expedix', 
    apiUrl: isDevelopment ? 'http://localhost:8082' : `https://${domain}/api`,
    description: 'Patient Management System',
    permissions: ['read:patients', 'write:patients', 'read:prescriptions', 'write:prescriptions']
  },
  'formx': {
    subdomain: 'formx',
    hubName: 'Formx',
    apiUrl: isDevelopment ? 'http://localhost:8083' : `https://${domain}/api`,
    description: 'Form Builder System', 
    permissions: ['read:forms', 'write:forms']
  },
  'resources': {
    subdomain: 'resources',
    hubName: 'Resources',
    apiUrl: isDevelopment ? 'http://localhost:8084' : `https://${domain}/api`,
    description: 'Psychoeducational Library',
    permissions: ['read:resources', 'write:resources']
  }
};

/**
 * Detects current subdomain from hostname
 */
export function getCurrentSubdomain(): string {
  if (isDevelopment) {
    // In development, use port to determine subdomain
    const port = typeof window !== 'undefined' ? window.location.port : '3000';
    const portMap: Record<string, string> = {
      '3000': 'app',
      '3001': 'clinimetrix',
      '3002': 'expedix', 
      '3003': 'formx',
      '3004': 'resources'
    };
    return portMap[port] || 'app';
  }

  // In production, extract subdomain from hostname
  if (currentHost.includes(domain)) {
    const parts = currentHost.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
  }
  
  return 'app'; // Default to main app
}

/**
 * Gets configuration for current subdomain
 */
export function getCurrentSubdomainConfig(): SubdomainConfig {
  const subdomain = getCurrentSubdomain();
  return SUBDOMAIN_CONFIG[subdomain] || SUBDOMAIN_CONFIG['app'];
}

/**
 * Generates Auth0 configuration based on current subdomain
 */
export function getAuth0Config(): Auth0Config {
  const subdomainConfig = getCurrentSubdomainConfig();
  const subdomain = getCurrentSubdomain();
  
  // Base URL for current subdomain
  const baseUrl = isDevelopment 
    ? `http://localhost:${getPortForSubdomain(subdomain)}`
    : `https://${subdomain}.${domain}`;

  // Enhanced scope based on subdomain permissions
  const baseScope = 'openid profile email';
  const subdomainPermissions = subdomainConfig.permissions.join(' ');
  const fullScope = `${baseScope} ${subdomainPermissions}`;

  return {
    domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'your-tenant.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
    audience: process.env.AUTH0_AUDIENCE || `https://api.${domain}`,
    scope: fullScope,
    redirectUri: `${baseUrl}/api/auth/callback`,
    postLogoutRedirectUri: baseUrl
  };
}

/**
 * Gets port number for subdomain in development
 */
function getPortForSubdomain(subdomain: string): string {
  const portMap: Record<string, string> = {
    'app': '3000',
    'clinimetrix': '3001', 
    'expedix': '3002',
    'formx': '3003',
    'resources': '3004'
  };
  return portMap[subdomain] || '3000';
}

/**
 * Gets all allowed origins for CORS configuration
 */
export function getAllowedOrigins(): string[] {
  if (isDevelopment) {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002', 
      'http://localhost:3003',
      'http://localhost:3004'
    ];
  }

  return Object.keys(SUBDOMAIN_CONFIG).map(subdomain => 
    `https://${subdomain}.${domain}`
  );
}

/**
 * Generates callback URLs for Auth0 application configuration
 */
export function getAuth0CallbackUrls(): string[] {
  return getAllowedOrigins().map(origin => `${origin}/api/auth/callback`);
}

/**
 * Generates logout URLs for Auth0 application configuration  
 */
export function getAuth0LogoutUrls(): string[] {
  return getAllowedOrigins();
}

/**
 * Checks if current user has permission for current subdomain
 */
export function hasSubdomainPermission(userPermissions: string[]): boolean {
  const subdomainConfig = getCurrentSubdomainConfig();
  return subdomainConfig.permissions.some(permission => 
    userPermissions.includes(permission) || userPermissions.includes('admin:all')
  );
}

/**
 * Gets navigation URL for switching between hubs
 */
export function getHubUrl(targetSubdomain: string): string {
  if (isDevelopment) {
    const port = getPortForSubdomain(targetSubdomain);
    return `http://localhost:${port}`;
  }
  
  return `https://${targetSubdomain}.${domain}`;
}

/**
 * Validates subdomain configuration
 */
export function validateSubdomainSetup(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  if (!process.env.AUTH0_ISSUER_BASE_URL) {
    errors.push('AUTH0_ISSUER_BASE_URL is not configured');
  }
  
  if (!process.env.AUTH0_CLIENT_ID) {
    errors.push('AUTH0_CLIENT_ID is not configured');
  }

  if (!process.env.AUTH0_AUDIENCE) {
    warnings.push('AUTH0_AUDIENCE is not configured, using default');
  }

  // Check domain configuration
  if (isProduction && domain === 'mindhub.cloud') {
    warnings.push('Using default domain mindhub.cloud in production');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}