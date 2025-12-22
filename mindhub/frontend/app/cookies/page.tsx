import React from 'react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Cookies
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Esta política explica cómo Glian utiliza cookies y tecnologías similares 
              para proporcionar, mejorar y proteger nuestros servicios.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ¿Qué son las cookies?
            </h2>
            <p className="text-gray-600 mb-6">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
              cuando visitas nuestro sitio web. Nos ayudan a recordar tus preferencias y 
              mejorar tu experiencia de usuario.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Tipos de cookies que utilizamos
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Cookies esenciales
                </h3>
                <p className="text-gray-600">
                  Necesarias para el funcionamiento básico del sitio web, incluyendo 
                  autenticación, seguridad y navegación.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Cookies de rendimiento
                </h3>
                <p className="text-gray-600">
                  Nos ayudan a entender cómo interactúas con nuestro sitio web 
                  para mejorar su rendimiento y funcionalidad.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Cookies de funcionalidad
                </h3>
                <p className="text-gray-600">
                  Permiten recordar tus preferencias y configuraciones para 
                  personalizar tu experiencia.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Cookies de análisis
                </h3>
                <p className="text-gray-600">
                  Nos ayudan a analizar el uso del sitio web de forma anónima 
                  para mejorar nuestros servicios.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Cookies específicas en MindHub
            </h2>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propósito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      auth-token
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Mantener sesión de usuario autenticada
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      24 horas
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      preferences
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Guardar preferencias de usuario
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      1 año
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      analytics
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Análisis de uso del sitio web
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      2 años
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Control de cookies
            </h2>
            <p className="text-gray-600 mb-4">
              Puedes controlar y gestionar las cookies de las siguientes maneras:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Configuración del navegador: Puedes modificar la configuración de tu navegador para rechazar cookies</li>
              <li>Herramientas del sitio: Usamos banners de consentimiento para que puedas elegir qué cookies aceptar</li>
              <li>Borrar cookies: Puedes eliminar las cookies existentes desde la configuración de tu navegador</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Cookies de terceros
            </h2>
            <p className="text-gray-600 mb-6">
              Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
              <li><strong>Supabase:</strong> Para autenticación y gestión de datos</li>
              <li><strong>Vercel:</strong> Para alojamiento y análisis de rendimiento</li>
              <li><strong>Google Fonts:</strong> Para fuentes web (sin cookies de seguimiento)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Contacto
            </h2>
            <p className="text-gray-600">
              Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos en:
            </p>
            <p className="text-blue-600 hover:text-blue-800">
              <a href="mailto:privacy@mindhub.cloud">privacy@mindhub.cloud</a>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Última actualización: 18 de enero de 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}