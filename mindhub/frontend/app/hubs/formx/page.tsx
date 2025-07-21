'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';

export default function FormxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="FormX"
        description="Sistema Constructor de Formularios y Cuestionarios"
        icon={SparklesIcon}
        iconColor="text-formx-600"
        actions={
          <Button variant="primary">
            Crear Formulario
          </Button>
        }
      />

      {/* Formx Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-formx-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Formularios Creados</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-formx-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Respuestas Recibidas</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-formx-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Plantillas Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <SparklesIcon className="h-6 w-6 mb-2" />
            <span>Nuevo Formulario</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <SparklesIcon className="h-6 w-6 mb-2" />
            <span>Plantillas</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <SparklesIcon className="h-6 w-6 mb-2" />
            <span>Importar PDF</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <SparklesIcon className="h-6 w-6 mb-2" />
            <span>Ver Respuestas</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}