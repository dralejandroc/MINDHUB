import React from 'react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Únete a Nuestro Equipo
          </h1>
          
          <div className="mb-8">
            <p className="text-lg text-gray-600">
              En Glian estamos buscando profesionales apasionados por revolucionar 
              la atención sanitaria a través de la tecnología.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Desarrollador Full Stack
              </h3>
              <p className="text-gray-600 mb-4">
                Únete a nuestro equipo de desarrollo para crear soluciones innovadoras 
                en salud mental y telemedicina.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• React, Next.js, TypeScript</li>
                <li>• Node.js, PostgreSQL</li>
                <li>• Experiencia en salud digital preferible</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Especialista en UX/UI
              </h3>
              <p className="text-gray-600 mb-4">
                Ayuda a diseñar interfaces intuitivas que mejoren la experiencia 
                de profesionales de la salud y pacientes.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Diseño centrado en el usuario</li>
                <li>• Figma, Adobe Creative Suite</li>
                <li>• Conocimiento en accesibilidad web</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Psicólogo/Psiquiatra
              </h3>
              <p className="text-gray-600 mb-4">
                Contribuye al desarrollo de herramientas clínicas basadas en evidencia 
                científica para evaluación psicológica.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Experiencia clínica mínima 3 años</li>
                <li>• Conocimiento en psicometría</li>
                <li>• Interés en tecnología médica</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Especialista en Datos
              </h3>
              <p className="text-gray-600 mb-4">
                Analiza datos de salud para generar insights que mejoren 
                los resultados clínicos y la experiencia del usuario.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Python, R, SQL</li>
                <li>• Machine Learning, estadística</li>
                <li>• Experiencia en datos de salud</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              ¿Interesado en formar parte del futuro de la salud digital?
            </p>
            <a 
              href="mailto:careers@mindhub.cloud" 
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Envía tu CV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}