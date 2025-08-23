import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen gradient-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-dark-green mb-2">
            Política de Privacidad
          </h1>
          <p className="text-gray-600">
            MindHub - Protección de Datos y Privacidad
          </p>
        </div>

        <div className="bg-white shadow-xl border border-primary-100 rounded-2xl p-8 lg:p-12">
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                GDPR Compliant
              </span>
              <span className="ml-3">Última actualización: Enero 2025</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-dark-green mb-6">
              Política de Privacidad de MindHub
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none">

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Información que Recopilamos
              </h2>
              <p className="text-gray-700 mb-4">
                Recopilamos información que usted nos proporciona directamente, como:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Información de registro (nombre, email, especialización)</li>
                <li>Información profesional (años de práctica, especialidad)</li>
                <li>Datos de uso de la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Cómo Usamos su Información
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Comunicarnos con usted sobre actualizaciones</li>
                <li>Garantizar la seguridad de la plataforma</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Protección de Datos de Pacientes
              </h2>
              <p className="text-gray-700 mb-4">
                Los datos de pacientes ingresados en MindHub son propiedad exclusiva del 
                profesional de salud. Implementamos medidas de seguridad técnicas y 
                organizacionales para proteger estos datos, incluyendo:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Controles de acceso estrictos</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Cumplimiento con estándares de privacidad médica</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Compartir Información
              </h2>
              <p className="text-gray-700 mb-4">
                No vendemos, alquilamos ni compartimos su información personal con terceros, 
                excepto en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Con su consentimiento explícito</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Para proteger nuestros derechos y seguridad</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Sus Derechos
              </h2>
              <p className="text-gray-700 mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Acceder a su información personal</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Portabilidad de datos</li>
                <li>Retirar su consentimiento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies esenciales para el funcionamiento de la plataforma. 
                No utilizamos cookies de seguimiento o publicidad sin su consentimiento.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Contacto
              </h2>
              <p className="text-gray-700">
                Para preguntas sobre privacidad o ejercer sus derechos, contáctenos en:{" "}
                <a href="mailto:privacy@mindhub.cloud" className="text-primary-teal hover:underline">
                  privacy@mindhub.cloud
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
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Para ejercer sus derechos de privacidad:{' '}
            <a href="mailto:privacy@mindhub.cloud" className="text-primary-600 hover:text-primary-700 font-medium underline">
              privacy@mindhub.cloud
            </a>
          </p>
          <p className="text-xs text-gray-500">
            <a href="/terms" className="hover:text-primary-600 underline">Términos de Servicio</a>
            {' • '}
            <a href="/contact" className="hover:text-primary-600 underline">Contacto</a>
          </p>
        </div>
      </div>
    </div>
  );
}