import React from 'react';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Documentación de Glian
          </h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                Guía de Inicio Rápido
              </h3>
              <p className="text-blue-600 mb-4">
                Aprende a configurar y usar Glian en pocos minutos.
              </p>
              <ul className="text-sm text-blue-500 space-y-2">
                <li>• Configuración inicial</li>
                <li>• Creación de perfiles</li>
                <li>• Primeros pasos con pacientes</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                Módulo Expedix
              </h3>
              <p className="text-green-600 mb-4">
                Gestión completa de expedientes médicos electrónicos.
              </p>
              <ul className="text-sm text-green-500 space-y-2">
                <li>• Registro de pacientes</li>
                <li>• Consultas médicas</li>
                <li>• Historial clínico</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">
                ClinimetrixPro
              </h3>
              <p className="text-purple-600 mb-4">
                Evaluaciones psicométricas avanzadas basadas en evidencia.
              </p>
              <ul className="text-sm text-purple-500 space-y-2">
                <li>• Escalas validadas</li>
                <li>• Interpretación automática</li>
                <li>• Reportes detallados</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                Agenda Digital
              </h3>
              <p className="text-yellow-600 mb-4">
                Sistema inteligente de programación y gestión de citas.
              </p>
              <ul className="text-sm text-yellow-500 space-y-2">
                <li>• Calendario integrado</li>
                <li>• Recordatorios automáticos</li>
                <li>• Lista de espera</li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-red-800 mb-4">
                FormX
              </h3>
              <p className="text-red-600 mb-4">
                Generador inteligente de formularios médicos personalizados.
              </p>
              <ul className="text-sm text-red-500 space-y-2">
                <li>• Templates prediseñados</li>
                <li>• Validación automática</li>
                <li>• Integración con expedientes</li>
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-4">
                API y Integraciones
              </h3>
              <p className="text-indigo-600 mb-4">
                Conecta Glian con tus sistemas existentes.
              </p>
              <ul className="text-sm text-indigo-500 space-y-2">
                <li>• API RESTful</li>
                <li>• Webhooks</li>
                <li>• Autenticación segura</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-gray-100 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Recursos Adicionales
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Tutoriales en Video</h4>
                <p className="text-gray-600 text-sm">
                  Serie completa de tutoriales paso a paso para dominar cada módulo de Glian.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">FAQ</h4>
                <p className="text-gray-600 text-sm">
                  Respuestas a las preguntas más frecuentes sobre el uso de la plataforma.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Soporte Técnico</h4>
                <p className="text-gray-600 text-sm">
                  Asistencia técnica especializada disponible 24/7 para usuarios premium.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Changelog</h4>
                <p className="text-gray-600 text-sm">
                  Historial detallado de actualizaciones y nuevas funcionalidades.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="/app" 
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}