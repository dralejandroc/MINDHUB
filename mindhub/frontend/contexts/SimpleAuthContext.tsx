'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  professionalType?: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem('mindhub_token');
      const userData = localStorage.getItem('mindhub_user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Clear invalid data
      localStorage.removeItem('mindhub_token');
      localStorage.removeItem('mindhub_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Store token and user data
        localStorage.setItem('mindhub_token', result.data.token);
        localStorage.setItem('mindhub_user', JSON.stringify(result.data.user));
        
        setUser(result.data.user);
        
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Error de autenticación' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('mindhub_token');
    localStorage.removeItem('mindhub_user');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('mindhub_token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          localStorage.setItem('mindhub_user', JSON.stringify(result.data));
          setUser(result.data);
        }
      } else {
        // Token might be invalid
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider');
  }
  return context;
}