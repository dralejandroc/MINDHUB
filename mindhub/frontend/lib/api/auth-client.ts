/**
 * Authentication API Client
 * Connects to real backend - NO HARDCODED DATA
 */

import { apiRequest } from './api-config';

const AUTH_BASE_URL = 'http://localhost:8080/api/auth';

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