'use client';

interface PlansSectionProps {
  onBetaClick: () => void;
}

export function PlansSection({ onBetaClick }: PlansSectionProps) {
  return (
    <section id="plans" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Planes y Precios
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Coming Soon Notice */}
            <div className="bg-gradient-to-br from-primary-teal/5 to-primary-blue/5 rounded-2xl p-8 border border-primary-teal/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <svg className="w-10 h-10 text-primary-teal mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-2xl font-bold text-primary-teal mb-1">
                    Próximamente
                  </div>
                  <div className="text-gray-600">
                    Planes comerciales en desarrollo
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Estamos diseñando planes específicos para psicólogos, psiquiatras y clínicas. 
                Cada plan tendrá las herramientas exactas que necesitas.
              </p>
              <div className="text-sm text-gray-500">
                Lanzamiento: Q2 2025
              </div>
            </div>

            {/* Beta Notice */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-teal to-primary-blue rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">β</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    Beta Gratuito
                  </div>
                  <div className="text-gray-600">
                    3 meses de acceso completo
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Acceso completo a toda la plataforma MindHub. Tu feedback nos ayudará a 
                crear los mejores planes para profesionales de salud mental.
              </p>
              <button
                onClick={onBetaClick}
                className="w-full bg-gradient-to-r from-primary-teal to-primary-blue text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                🚀 Registrarse Ahora
              </button>
            </div>
          </div>
        </div>

        {/* Contact Notice */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ¿Tienes preguntas sobre nuestros futuros planes?
          </p>
          <a 
            href="mailto:planes@mindhub.cloud"
            className="text-primary-teal hover:text-primary-blue font-medium transition-colors"
          >
            Escríbenos y te mantendremos al tanto
          </a>
        </div>
      </div>
    </section>
  );
}