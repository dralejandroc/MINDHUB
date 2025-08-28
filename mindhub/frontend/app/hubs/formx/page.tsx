'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { 
  FormXDashboard, 
  FormXBuilder, 
  FormXTemplates, 
  FormXPatientAssignment 
} from '@/components/formx';
import { FormXTemplate } from '@/lib/api/formx-unified-client';

type FormXView = 'dashboard' | 'form-builder' | 'templates' | 'assign-form' | 'responses' | 'assignments';

interface NavigationData {
  editingTemplate?: FormXTemplate;
  template?: FormXTemplate;
}

export default function FormXPage() {
  const [currentView, setCurrentView] = useState<FormXView>('dashboard');
  const [navigationData, setNavigationData] = useState<NavigationData>({});

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view as FormXView);
    setNavigationData(data || {});
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setNavigationData({});
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'form-builder':
        return navigationData.editingTemplate ? 'Editar Formulario' : 'Constructor de Formularios';
      case 'templates':
        return 'Templates de Formularios';
      case 'assign-form':
        return 'Asignar Formulario a Pacientes';
      case 'responses':
        return 'Respuestas de Pacientes';
      case 'assignments':
        return 'Gestión de Asignaciones';
      default:
        return 'FormX';
    }
  };

  const getPageDescription = () => {
    switch (currentView) {
      case 'form-builder':
        return navigationData.editingTemplate 
          ? 'Modifica los campos y configuración del formulario'
          : 'Crea formularios médicos personalizados con el constructor visual';
      case 'templates':
        return 'Explora y gestiona todos tus templates de formularios médicos';
      case 'assign-form':
        return 'Envía formularios específicos a pacientes por email';
      case 'responses':
        return 'Analiza las respuestas enviadas por los pacientes';
      case 'assignments':
        return 'Gestiona las asignaciones de formularios y tokens de acceso';
      default:
        return 'Sistema para crear y gestionar formularios, encuestas y consentimientos médicos personalizados';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'form-builder':
        return (
          <FormXBuilder
            editingTemplate={navigationData.editingTemplate}
            onSave={handleBackToDashboard}
            onCancel={handleBackToDashboard}
          />
        );
      
      case 'templates':
        return (
          <FormXTemplates
            onCreateNew={() => handleNavigate('form-builder')}
            onEditTemplate={(template) => handleNavigate('form-builder', { editingTemplate: template })}
            onAssignTemplate={(template) => handleNavigate('assign-form', { template })}
          />
        );
      
      case 'assign-form':
        return (
          <FormXPatientAssignment
            template={navigationData.template}
            onComplete={handleBackToDashboard}
            onCancel={handleBackToDashboard}
          />
        );
      
      case 'responses':
        return (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Análisis de Respuestas</h3>
            <p className="text-gray-600 mb-6">
              Esta sección permitirá analizar y exportar las respuestas de los pacientes.
            </p>
            <p className="text-sm text-gray-500">
              Funcionalidad en desarrollo - Fase 3
            </p>
          </div>
        );
      
      case 'assignments':
        return (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Asignaciones</h3>
            <p className="text-gray-600 mb-6">
              Aquí podrás gestionar todas las asignaciones de formularios y revisar el estado de los tokens.
            </p>
            <p className="text-sm text-gray-500">
              Funcionalidad en desarrollo - Fase 3
            </p>
          </div>
        );
      
      default:
        return (
          <FormXDashboard
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={getPageTitle()}
        description={getPageDescription()}
        icon={DocumentTextIcon}
        iconColor="text-emerald-600"
        actions={currentView !== 'dashboard' ? [
          <Button
            key="back"
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver al Dashboard
          </Button>
        ] : []}
      />

      {/* Django Integration Status */}
      {currentView === 'dashboard' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-emerald-800">
                <strong>FormX Fase 2:</strong> Sistema integrado con Django backend. 
                Funcionalidades disponibles: Dashboard, Constructor, Templates y Asignación de Pacientes.
              </p>
            </div>
          </div>
        </div>
      )}

      {renderCurrentView()}
    </div>
  );
}