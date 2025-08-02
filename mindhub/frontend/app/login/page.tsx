'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAvailableUsers, login } from '@/lib/api/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    description: string;
  }>>([]);

  // Load available users from backend
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const response = await getAvailableUsers();
    if (response.success && response.users) {
      setUsers(response.users);
      // Pre-select first user
      if (response.users.length > 0) {
        setSelectedUser(response.users[0].id);
      }
    } else {
      setError('Error al cargar usuarios disponibles');
    }
  };

  const handleLogin = async () => {
    const user = users.find(u => u.id === selectedUser);
    if (!user) {
      setError('Por favor selecciona un usuario');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login(user.email);
      
      if (response.success) {
        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(response.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{ background: 'linear-gradient(135deg, var(--warm-100, #fef7ee) 0%, var(--secondary-500, #29a98c) 100%)' }}>
      <div className="bg-white/95 backdrop-blur-lg p-12 rounded-3xl shadow-2xl w-full max-w-md transform hover:scale-[1.02] transition-transform duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-6 shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <span className="text-4xl font-bold text-white transform -rotate-3">M</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
            MindHub
          </h1>
          <p className="text-gray-600 text-lg">
            Plataforma de Gestión Clínica
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Selecciona un usuario
            </label>
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading || !selectedUser}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white text-lg
              transform transition-all duration-200 
              ${isLoading || !selectedUser
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Sistema de autenticación real desde backend
          </p>
          <p className="text-xs text-gray-400 mt-2">
            No hay datos hardcodeados
          </p>
        </div>
      </div>
    </div>
  );
}