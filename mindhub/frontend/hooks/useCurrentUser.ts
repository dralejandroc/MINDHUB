/**
 * Hook to get current user from authentication
 * Compatible with remote assessments system
 */

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  specialty?: string;
  avatarUrl?: string;
}

// Mock user for development - En producción usar auth real
const mockUser: User = {
  id: 'cmdpjwxgx0000n1qgo7f5csyt', // Usuario del sistema
  email: 'system@mindhub.com',
  name: 'Dr. Sistema MindHub',
  role: 'admin',
  specialty: 'Psicología Clínica'
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // En desarrollo, usar usuario mock
      // En producción, implementar autenticación real
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      setUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, refetch: loadUser };
}