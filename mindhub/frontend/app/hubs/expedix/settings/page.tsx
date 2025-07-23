'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { CogIcon } from '@heroicons/react/24/outline';

export default function ExpedixSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Expedix"
        description="Ajusta la configuración del módulo de gestión de pacientes"
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={[]}
      />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Configuración del Hub
        </h2>
        <p className="text-gray-600">
          Personaliza el comportamiento del módulo Expedix según las necesidades
          de tu clínica y flujo de trabajo.
        </p>
        
        <div className="mt-6 space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Preferencias Generales</h3>
            <p className="text-sm text-gray-600">
              Configura opciones generales del módulo
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Integración</h3>
            <p className="text-sm text-gray-600">
              Ajusta la integración con otros módulos
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Seguridad</h3>
            <p className="text-sm text-gray-600">
              Configura opciones de seguridad y privacidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}