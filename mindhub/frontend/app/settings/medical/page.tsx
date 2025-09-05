/**
 * ⚕️ MEDICAL SETTINGS PAGE
 * 
 * Página de configuración de credenciales médicas
 * Accesible desde configuración del usuario
 */

import { Metadata } from 'next';
import { MedicalCredentialsForm } from '@/components/medical/MedicalCredentialsForm';

export const metadata: Metadata = {
  title: 'Configuración Médica | MindHub',
  description: 'Configure sus credenciales médicas y datos profesionales'
};

export default function MedicalSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-sm">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </a>
                <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
                </svg>
              </li>
              <li className="flex items-center">
                <a href="/settings" className="text-gray-500 hover:text-gray-700">
                  Configuración
                </a>
                <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
                </svg>
              </li>
              <li>
                <span className="text-gray-700">Configuración Médica</span>
              </li>
            </ol>
          </nav>
        </div>

        <MedicalCredentialsForm />
      </div>
    </div>
  );
}