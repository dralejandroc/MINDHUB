'use client';

interface BetaExplanationSectionProps {
  onBetaClick: () => void;
}

export function BetaExplanationSection({ onBetaClick }: BetaExplanationSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            ¿Por qué un Beta abierto?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-teal to-primary-blue mx-auto rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Content */}
            <div className="p-8 lg:p-12">
              <div className="space-y-6">
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed text-justify">
                  <p>
                    <strong className="text-gray-900">MindHub nace de la experiencia real</strong> de profesionales 
                    que enfrentan los mismos retos que tú: tiempo fragmentado entre tareas administrativas, 
                    sistemas desconectados y la necesidad de más tiempo para lo importante.
                  </p>
                  
                  <p>
                    Creemos que la mejor tecnología se construye <strong className="text-primary-teal">junto con quienes la van a usar</strong>. 
                    Por eso ofrecemos acceso completo y gratuito durante 3 meses para que pruebes cada funcionalidad, 
                    nos compartas tu experiencia y nos ayudes a construir la plataforma que realmente necesitas.
                  </p>
                  
                  <p>
                    Tu feedback no solo mejora MindHub, <strong className="text-gray-900">define su futuro</strong>. 
                    Cada sugerencia, cada caso de uso, cada necesidad específica que compartas con nosotros 
                    se convierte en una mejora real para toda la comunidad de profesionales de salud mental.
                  </p>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={onBetaClick}
                    className="bg-gradient-to-r from-primary-teal to-primary-blue text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
                  >
                    🤝 Formar parte del Beta
                  </button>
                </div>
              </div>
            </div>
            
            {/* Visual Element */}
            <div className="bg-gradient-to-br from-primary-teal/5 to-primary-blue/5 p-8 lg:p-12 flex items-center">
              <div className="w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">
                  Beneficios del Beta
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-teal to-primary-blue rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">3 meses de acceso completo gratuito</span>
                  </div>
                  
                  <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-blue to-primary-teal rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Feedback directo con desarrollo</span>
                  </div>
                  
                  <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-teal to-primary-blue rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Influye en funcionalidades finales</span>
                  </div>
                  
                  <div className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-blue to-primary-teal rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Condiciones especiales al lanzamiento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}