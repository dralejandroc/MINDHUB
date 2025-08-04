export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Términos de Servicio
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              Última actualización: Enero 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar MindHub, usted acepta estar sujeto a estos Términos de Servicio 
                y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos 
                términos, se le prohíbe usar o acceder a este sitio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Descripción del Servicio
              </h2>
              <p className="text-gray-700 mb-4">
                MindHub es una plataforma de gestión sanitaria diseñada específicamente para 
                profesionales de la salud mental. Proporcionamos herramientas para la gestión 
                de pacientes, evaluaciones clínicas, y administración de consultorios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Beta - Acceso Gratuito
              </h2>
              <p className="text-gray-700 mb-4">
                Durante el período beta, MindHub se proporciona de forma gratuita. Nos reservamos 
                el derecho de cambiar esta política al finalizar el período beta, con previo aviso 
                a los usuarios registrados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Uso Aceptable
              </h2>
              <p className="text-gray-700 mb-4">
                Usted se compromete a utilizar MindHub únicamente para fines profesionales legítimos 
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
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <a 
              href="/"
              className="text-primary-teal hover:text-purple-600 font-medium"
            >
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}