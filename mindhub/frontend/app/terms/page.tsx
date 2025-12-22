import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function TermsPage() {
  return (
    <div className="min-h-screen gradient-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-6">
            <HeartIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-dark-green mb-2">
            Términos de Servicio
          </h1>
          <p className="text-gray-600">
            Glian - Plataforma de Gestión Sanitaria
          </p>
        </div>

        <div className="bg-white shadow-xl border border-primary-100 rounded-2xl p-8 lg:p-12">
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                Vigentes
              </span>
              <span className="ml-3">Última actualización: Enero 2025</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-dark-green mb-6">
              Términos de Servicio de Glian
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none">

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar Glian, usted acepta estar sujeto a estos Términos de Servicio 
                y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos 
                términos, se le prohíbe usar o acceder a este sitio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Descripción del Servicio
              </h2>
              <p className="text-gray-700 mb-4">
                Glian es una plataforma de gestión sanitaria diseñada específicamente para 
                profesionales de la salud mental. Proporcionamos herramientas para la gestión 
                de pacientes, evaluaciones clínicas, y administración de consultorios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Beta - Acceso Gratuito
              </h2>
              <p className="text-gray-700 mb-4">
                Durante el período beta, Glian se proporciona de forma gratuita. Nos reservamos 
                el derecho de cambiar esta política al finalizar el período beta, con previo aviso 
                a los usuarios registrados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Uso Aceptable
              </h2>
              <p className="text-gray-700 mb-4">
                Usted se compromete a utilizar Glian únicamente para fines profesionales legítimos 
                en el área de la salud mental. Está prohibido usar la plataforma para actividades 
                ilegales o no autorizadas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Privacidad y Confidencialidad
              </h2>
              <p className="text-gray-700 mb-4">
                La protección de datos de pacientes es nuestra máxima prioridad. Nos comprometemos 
                a cumplir con todas las regulaciones aplicables de protección de datos y privacidad 
                médica.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Contacto
              </h2>
              <p className="text-gray-700">
                Para preguntas sobre estos términos, contáctenos en:{" "}
                <a href="mailto:legal@mindhub.cloud" className="text-primary-teal hover:underline">
                  legal@mindhub.cloud
                </a>
              </p>
            </section>
          </div>
          
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 ease-in-out hover-lift"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver al Inicio
          </a>
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Tienes preguntas sobre estos términos?{' '}
            <a href="/contact" className="text-primary-600 hover:text-primary-700 font-medium underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}