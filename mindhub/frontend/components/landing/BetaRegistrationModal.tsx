'use client';

import { useRouter } from 'next/navigation';

interface BetaRegistrationModalProps {
  onClose: () => void;
}

export function BetaRegistrationModal({ onClose }: BetaRegistrationModalProps) {
  const router = useRouter();

  const handleSignUp = () => {
    onClose();
    router.push('/sign-up');
  };

  const handleSignIn = () => {
    onClose();
    router.push('/sign-in');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">¡Únete a MindHub!</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="text-center">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">🎉 ¡Bienvenido a la Beta de MindHub!</h3>
              <p className="text-sm opacity-90">
                Estás a punto de unirte a la plataforma que transformará tu práctica clínica
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Periodo Beta:</strong> Acceso completo sin restricciones por unos meses mientras perfeccionamos MindHub para que cumpla con todos los estándares de calidad que te mereces.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Crea tu cuenta y comienza a disfrutar de las escalas clinimétricas digitales, gestión de pacientes y mucho más.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Crear cuenta nueva
            </button>

            <button
              onClick={handleSignIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
            >
              Ya tengo cuenta - Iniciar sesión
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            ¿Tienes comentarios o sugerencias?{' '}
            <span className="text-blue-600">feedback@mindhub.cloud</span>
          </p>
        </div>
      </div>
    </div>
  );
}