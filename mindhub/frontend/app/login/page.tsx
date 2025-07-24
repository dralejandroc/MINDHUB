'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState('');

  const users = [
    {
      id: 'admin',
      name: 'Administrador',
      email: 'admin@mindhub.com',
      role: 'administrator',
      description: 'Usuario administrador - Vista limpia para nuevos usuarios'
    },
    {
      id: 'dr-alejandro',
      name: 'Dr. Alejandro Contreras',
      email: 'dr_aleks_c@hotmail.com',
      role: 'doctor',
      description: 'Psiquiatra con 6 pacientes de prueba y consultas'
    }
  ];

  const handleLogin = () => {
    const user = users.find(u => u.id === selectedUser);
    if (user) {
      // Save user to localStorage based on selection
      const userData = {
        id: user.id === 'dr-alejandro' ? 'user-dr-alejandro' : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isRealUser: user.id === 'dr-alejandro'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      router.push('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setSelectedUser('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MindHub</h1>
          <p className="text-gray-600">Selecciona tu usuario para continuar</p>
        </div>

        <div className="space-y-4 mb-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedUser === user.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedUser(user.id)}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="user"
                  value={user.id}
                  checked={selectedUser === user.id}
                  onChange={() => setSelectedUser(user.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">{user.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full"
            variant="primary"
          >
            Iniciar Sesión
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            Limpiar Sesión
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Sistema temporal de desarrollo - Auth0 se implementará mañana
          </p>
        </div>
      </Card>
    </div>
  );
}