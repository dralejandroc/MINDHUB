'use client';

import { useState } from 'react';
import { betaRegister, type BetaRegistrationData } from '@/lib/api/auth-client';

interface BetaRegistrationModalProps {
  onClose: () => void;
}

export function BetaRegistrationModal({ onClose }: BetaRegistrationModalProps) {
  const [formData, setFormData] = useState<BetaRegistrationData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    professionalType: '',
    city: '',
    country: '',
    howDidYouHear: '',
    yearsOfPractice: '',
    specialization: '',
    expectations: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('[BETA MODAL] Submitting registration for:', formData.email);
      const result = await betaRegister(formData);
      
      console.log('[BETA MODAL] Registration result:', result);
      
      if (result.success) {
        setIsSuccess(true);
        setError('');
        setDebugInfo(null);
        console.log('[BETA MODAL] Registration successful');
      } else {
        setError(result.message || 'Error al registrarse');
        setDebugInfo(result.debug);
        console.error('[BETA MODAL] Registration failed:', result);
      }
    } catch (error) {
      console.error('[BETA MODAL] Unexpected error:', error);
      setError('Error inesperado. Por favor intenta de nuevo.');
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¡Registro Exitoso!
            </h3>
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>¡Gracias por ser parte de este proyecto!</strong><br/>
                Juntos mejoraremos tu práctica clínica a un nivel de mayor automatización, 
                con menos tareas repetitivas y mayor libertad de tiempo, en apoyo de tu salud mental.
              </p>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Tu cuenta está lista. Puedes comenzar a explorar MindHub ahora mismo.
              <br/><br/>
              <small className="text-gray-500">
                Nota: La verificación por email se activará próximamente.
              </small>
            </p>
            <button
              onClick={() => {
                onClose();
                // Redirect to dashboard if token exists
                const token = localStorage.getItem('authToken');
                if (token) {
                  window.location.href = '/dashboard';
                }
              }}
              className="w-full bg-gradient-to-r from-primary-teal to-primary-blue text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Comenzar a usar MindHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Únete al Beta
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email profesional *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              placeholder="Dr. Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              placeholder="Repetir contraseña"
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="professionalType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de práctica *
              </label>
              <select
                id="professionalType"
                name="professionalType"
                required
                value={formData.professionalType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              >
                <option value="">Selecciona una opción</option>
                <option value="psicologo">Psicólogo/a</option>
                <option value="psiquiatra">Psiquiatra</option>
                <option value="clinica">Clínica / Consultorio</option>
                <option value="estudiante">Estudiante</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                Especialización
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="Ej: Terapia Cognitivo-Conductual"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
                placeholder="Ciudad de México"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                País *
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              >
                <option value="">Selecciona tu país</option>
                <option value="mexico">México</option>
                <option value="colombia">Colombia</option>
                <option value="argentina">Argentina</option>
                <option value="chile">Chile</option>
                <option value="peru">Perú</option>
                <option value="venezuela">Venezuela</option>
                <option value="ecuador">Ecuador</option>
                <option value="uruguay">Uruguay</option>
                <option value="paraguay">Paraguay</option>
                <option value="bolivia">Bolivia</option>
                <option value="costa_rica">Costa Rica</option>
                <option value="panama">Panamá</option>
                <option value="guatemala">Guatemala</option>
                <option value="honduras">Honduras</option>
                <option value="el_salvador">El Salvador</option>
                <option value="nicaragua">Nicaragua</option>
                <option value="republica_dominicana">República Dominicana</option>
                <option value="espana">España</option>
                <option value="estados_unidos">Estados Unidos</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yearsOfPractice" className="block text-sm font-medium text-gray-700 mb-2">
                Años ejerciendo en práctica privada *
              </label>
              <select
                id="yearsOfPractice"
                name="yearsOfPractice"
                required
                value={formData.yearsOfPractice}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              >
                <option value="">Selecciona</option>
                <option value="menos_1">Menos de 1 año</option>
                <option value="1_3">1-3 años</option>
                <option value="4_7">4-7 años</option>
                <option value="8_15">8-15 años</option>
                <option value="mas_15">Más de 15 años</option>
                <option value="no_practica">No ejerzo práctica privada</option>
              </select>
            </div>

            <div>
              <label htmlFor="howDidYouHear" className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cómo te enteraste de MindHub? *
              </label>
              <select
                id="howDidYouHear"
                name="howDidYouHear"
                required
                value={formData.howDidYouHear}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all"
              >
                <option value="">Selecciona una opción</option>
                <option value="google">Búsqueda en Google</option>
                <option value="redes_sociales">Redes sociales</option>
                <option value="recomendacion">Recomendación de colega</option>
                <option value="evento">Evento o conferencia</option>
                <option value="universidad">Universidad/Institución educativa</option>
                <option value="articulo">Artículo o blog</option>
                <option value="email">Email marketing</option>
                <option value="asociacion">Asociación profesional</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="expectations" className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué esperas de MindHub? (Opcional)
            </label>
            <textarea
              id="expectations"
              name="expectations"
              rows={3}
              value={formData.expectations}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent transition-all resize-none"
              placeholder="Cuéntanos qué funcionalidades te gustaría ver, qué problemas esperas resolver..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              {debugInfo && process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p className="text-gray-600 font-medium">Debug Info:</p>
                  <pre className="text-gray-500 overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-teal to-primary-blue text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Registrarse para Beta'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Al registrarte, aceptas recibir actualizaciones sobre MindHub.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            El beta es completamente gratuito.
          </p>
        </div>
      </div>
    </div>
  );
}