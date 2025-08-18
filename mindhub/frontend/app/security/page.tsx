import React from 'react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Seguridad y Privacidad
          </h1>
          
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Compromiso con la Seguridad
            </h2>
            <p className="text-gray-600 mb-6">
              En MindHub, la seguridad de los datos de salud es nuestra máxima prioridad. 
              Implementamos las mejores prácticas de seguridad para proteger la información médica sensible.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Medidas de Seguridad Implementadas
            </h3>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Cifrado de extremo a extremo de todos los datos</li>
              <li>Autenticación multi-factor</li>
              <li>Auditoría completa de accesos</li>
              <li>Respaldos automáticos encriptados</li>
              <li>Cumplimiento con normativas HIPAA</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Protección de Datos
            </h3>
            <p className="text-gray-600 mb-6">
              Todos los datos médicos están protegidos mediante cifrado AES-256 y se almacenan 
              en servidores seguros con certificación ISO 27001. El acceso está limitado únicamente 
              a profesionales autorizados.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Monitoreo Continuo
            </h3>
            <p className="text-gray-600">
              Nuestro sistema de monitoreo 24/7 detecta y responde automáticamente a cualquier 
              actividad sospechosa, garantizando la integridad y confidencialidad de los datos médicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}