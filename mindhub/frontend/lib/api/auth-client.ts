/**
 * Authentication API Client
 * Connects to real backend - NO HARDCODED DATA
 */

import { apiRequest } from './api-config';

const AUTH_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app'}/auth`;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  specialty?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface UsersListResponse {
  success: boolean;
  users?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    description: string;
  }>;
  error?: string;
}

/**
 * Login with email and password
 */
export async function login(email: string, password?: string): Promise<LoginResponse> {
  try {
    const response = await apiRequest(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success && response.token) {
      // Store token for future requests
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al iniciar sesión'
    };
  }
}

/**
 * Get available users for login (development)
 */
export async function getAvailableUsers(): Promise<UsersListResponse> {
  try {
    const response = await apiRequest(`${AUTH_BASE_URL}/users`);
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener usuarios'
    };
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await apiRequest(`${AUTH_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.success) {
      return response.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Logout - clear local storage
 */
export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  window.location.href = '/login';
}

/**
 * Beta registration interface
 */
export interface BetaRegistrationData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  professionalType: string;
  city: string;
  country: string;
  howDidYouHear: string;
  yearsOfPractice: string;
  specialization?: string;
  expectations?: string;
}

export interface BetaRegistrationResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: User;
  };
  debug?: any;
}

/**
 * Register for beta access
 */
export async function betaRegister(data: BetaRegistrationData): Promise<BetaRegistrationResponse> {
  try {
    console.log('[AUTH CLIENT] Attempting beta registration for:', data.email);
    
    const response = await fetch('/api/auth/beta-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('[AUTH CLIENT] API response status:', response.status);
    
    const result = await response.json();
    console.log('[AUTH CLIENT] API response data:', result);
    
    // Store auth data if registration is successful
    if (result.success && result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('currentUser', JSON.stringify(result.data.user));
      console.log('[AUTH CLIENT] Auth data stored successfully');
    }
    
    return result;
  } catch (error) {
    console.error('[AUTH CLIENT] Beta registration error:', error);
    return {
      success: false,
      message: 'Error de conexión. Por favor intenta de nuevo.',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'CLIENT_ERROR'
      }
    };
  }
}