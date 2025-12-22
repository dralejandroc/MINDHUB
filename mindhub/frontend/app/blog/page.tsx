import React from 'react';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Blog de Glian
          </h1>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Próximamente
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Estamos trabajando en nuestro blog donde compartiremos insights sobre 
              salud mental, tecnología médica y mejores prácticas en atención sanitaria.
            </p>
            <div className="mt-8">
              <a 
                href="/app" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Volver al Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}