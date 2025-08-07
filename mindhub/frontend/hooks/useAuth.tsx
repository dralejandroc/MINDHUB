"use client";

/**
 * Authentication Hook for MindHub
 * Migrated from XAMPP app.js authentication functions
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

// Types
export interface User {
  username: string;
  role: 'admin' | 'doctor' | 'psy';
  name: string;
  loginTime: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth Context
const AuthContext = createContext<{
  authState: AuthState;
  login: (username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
} | null>(null);

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mindHubUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mindHubUser');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const getDisplayName = (username: string, role: string): string => {
    const names = {
      'admin': 'Administrador',
      'doctor': 'Dr. García',
      'psy': 'Psic. López'
    };
    return names[username as keyof typeof names] || username;
  };

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      // Call backend authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const user: User = {
          username: data.data.user.email,
          role: data.data.user.role || 'doctor',
          name: data.data.user.name || getDisplayName(username, role),
          loginTime: new Date().toISOString()
        };

        // Store both user info and token
        localStorage.setItem('mindHubUser', JSON.stringify(user));
        localStorage.setItem('mindHubToken', data.data.token);
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return true;
      }
      
      console.error('Login failed:', data.message);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to demo authentication for development
      const validCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'doctor', password: 'doctor123' },
        { username: 'psy', password: 'psy123' }
      ];

      const isValid = validCredentials.some(
        cred => cred.username === username && cred.password === password
      );

      if (isValid) {
        const user: User = {
          username,
          role: role as User['role'],
          name: getDisplayName(username, role),
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('mindHubUser', JSON.stringify(user));
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return true;
      }

      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('mindHubUser');
    localStorage.removeItem('mindHubToken');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;