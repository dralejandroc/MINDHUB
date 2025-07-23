'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormBuilderMVP } from '@/components/formx/FormBuilderMVP';
import { DocumentTextIcon, PlusIcon, DocumentDuplicateIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export default function FormXPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'templates' | 'responses'>('dashboard');

  const handleNewForm = () => {
    setCurrentView('builder');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'builder') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Constructor de Formularios"
          description="Crea formularios médicos personalizados"
          icon={DocumentTextIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>
          ]}
        />
        
        <FormBuilderMVP />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="FormX - Generador de Formularios"
        description="Crea y gestiona formularios médicos personalizados"
        icon={DocumentTextIcon}
        iconColor="text-emerald-600"
        actions={[
          <Button
            key="new-form"
            onClick={handleNewForm}
            variant="emerald"
            size="sm"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Nuevo Formulario
          </Button>
        ]}
      />
      
      {/* Dashboard View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Crear Formularios</h3>
            <PlusIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Diseña formularios personalizados con campos inteligentes, validaciones y lógica condicional.
          </p>
          <Button 
            onClick={handleNewForm}
            variant="outline" 
            size="sm"
            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            Crear Nuevo
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Templates Médicos</h3>
            <DocumentDuplicateIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Utiliza plantillas preconstruidas para historias clínicas, consentimientos informados y más.
          </p>
          <Button 
            onClick={() => setCurrentView('templates')}
            variant="outline" 
            size="sm"
            className="w-full border-primary-200 text-primary-600 hover:bg-primary-50"
          >
            Ver Templates
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Gestión de Respuestas</h3>
            <ChartBarIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Administra las respuestas de los pacientes, exporta datos y genera reportes automáticos.
          </p>
          <Button 
            onClick={() => setCurrentView('responses')}
            variant="outline" 
            size="sm"
            className="w-full border-secondary-200 text-secondary-600 hover:bg-secondary-50"
          >
            Ver Respuestas
          </Button>
        </div>
      </div>

      {/* Recent Forms */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Formularios Recientes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-emerald-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900 text-xs">Historia Clínica Inicial</div>
                <div className="text-xs text-gray-500">Creado hace 2 días • 15 respuestas</div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" className="text-xs">Editar</Button>
              <Button variant="outline" size="sm" className="text-xs">Ver Respuestas</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-emerald-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900 text-xs">Consentimiento Informado</div>
                <div className="text-xs text-gray-500">Creado hace 1 semana • 8 respuestas</div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" className="text-xs">Editar</Button>
              <Button variant="outline" size="sm" className="text-xs">Ver Respuestas</Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <PlusIcon className="h-8 w-8 text-gray-300 mb-2" />
            <div className="text-center">
              <p className="text-xs">¿Listo para crear tu primer formulario?</p>
              <Button onClick={handleNewForm} size="sm" className="mt-2">
                Comenzar Ahora
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Estadísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">5</div>
            <div className="text-xs text-gray-500">Formularios Activos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-secondary-600">23</div>
            <div className="text-xs text-gray-500">Respuestas Hoy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">156</div>
            <div className="text-xs text-gray-500">Total Respuestas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">8</div>
            <div className="text-xs text-gray-500">Templates Disponibles</div>
          </div>
        </div>
      </div>
    </div>
  );
}