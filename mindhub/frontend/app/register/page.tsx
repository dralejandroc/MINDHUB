'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    accountType: 'INDIVIDUAL',
    organizationName: '',
    professionalType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (formData.accountType === 'CLINIC' && !formData.organizationName) {
      setError('El nombre de la organización es requerido para clínicas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          accountType: formData.accountType,
          organizationName: formData.organizationName,
          professionalType: formData.professionalType
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store tokens and user data
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(result.data.user));
        
        // Redirect to app
        router.push('/app');
      } else {
        setError(result.message || 'Error al registrarse');
      }
    } catch (error) {
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear organization name if switching to individual
    if (name === 'accountType' && value === 'INDIVIDUAL') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        organizationName: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-teal to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">MindHub</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Únete al Beta
          </h2>
          <p className="text-gray-600">
            Crea tu cuenta y comienza a usar MindHub gratuitamente
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de cuenta
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, accountType: 'INDIVIDUAL'})}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.accountType === 'INDIVIDUAL'
                      ? 'border-primary-teal bg-primary-teal/5 text-primary-teal'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Individual</div>
                  <div className="text-sm text-gray-500">Psicólogo/Psiquiatra</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, accountType: 'CLINIC'})}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.accountType === 'CLINIC'
                      ? 'border-primary-teal bg-primary-teal/5 text-primary-teal'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Clínica</div>
                  <div className="text-sm text-gray-500">Equipo médico</div>
                </button>
              </div>
            </div>

            {/* Organization name for clinics */}
            {formData.accountType === 'CLINIC' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la clínica *
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required={formData.accountType === 'CLINIC'}
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                  placeholder="Centro de Salud Mental"
                />
              </div>
            )}

            {/* Professional Type for individuals */}
            {formData.accountType === 'INDIVIDUAL' && (
              <div>
                <label htmlFor="professionalType" className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  id="professionalType"
                  name="professionalType"
                  value={formData.professionalType}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                >
                  <option value="">Selecciona tu especialidad</option>
                  <option value="psicologo">Psicólogo/a</option>
                  <option value="psiquiatra">Psiquiatra</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="Dr. Juan Pérez"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email profesional *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="Confirma tu contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-teal to-purple-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-teal transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta Beta'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium text-primary-teal hover:text-purple-600 transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>

        {/* Terms and Beta Notice */}
        <div className="text-center space-y-4">
          <p className="text-xs text-gray-500">
            Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" className="text-primary-teal hover:underline">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-primary-teal hover:underline">
              Política de Privacidad
            </Link>
          </p>
          
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-teal/10 text-primary-teal text-sm">
            <span className="w-2 h-2 bg-primary-teal rounded-full mr-2 animate-pulse"></span>
            Beta - Completamente gratuito durante 3 meses
          </div>
        </div>
      </div>
    </div>
  );
}